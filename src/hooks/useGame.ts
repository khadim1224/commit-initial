import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { GameState, Player, Question, Room, TournamentStage } from '../types/game';

export const useGame = () => {
  const { socket } = useSocket();
  const [gameState, setGameState] = useState<GameState>({
    role: 'player',
    roomCode: '',
    userName: '',
    room: null,
    currentQuestion: null,
    showQuestion: false,
    gameStatus: 'menu',
    activeRoomExists: false,
    timers: {
      buzzer: 0,
      answer: 0,
    },
  });

  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const audioUnlockedRef = useRef(false);

  // Débloquer l'audio après une première interaction utilisateur (clic/touch)
  useEffect(() => {
    const unlock = () => {
      if (audioUnlockedRef.current) return;
      try {
        const a = new Audio('/sounds/buzzer.mp3');
        a.volume = 0.001; // quasi inaudible
        a.play()
          .then(() => {
            a.pause();
            a.currentTime = 0;
            audioUnlockedRef.current = true;
            window.removeEventListener('click', unlock);
            window.removeEventListener('touchstart', unlock);
          })
          .catch(() => {
            // Ignore: l'utilisateur n'a peut-être pas autorisé l'audio encore
          });
      } catch {}
    };
    window.addEventListener('click', unlock);
    window.addEventListener('touchstart', unlock);
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, []);
  // Gestion des événements socket
  useEffect(() => {
    if (!socket) return;

    // Etat global: une salle active existe-telle ?
    socket.on('active-room-status', (data: { exists: boolean; roomCode?: string }) => {
      setGameState(prev => ({
        ...prev,
        activeRoomExists: data.exists,
      }));
    });

    // Création de salle réussie
    socket.on('room-created', (data: { roomCode: string; room: Room }) => {
      setGameState(prev => ({
        ...prev,
        role: 'host',
        userName: prev.userName,
        roomCode: data.roomCode,
        room: data.room,
        gameStatus: 'lobby'
      }));
      setLoading(false);
    });

    // Rejoindre une salle réussi
    socket.on('room-joined', (data: { roomCode: string; room: Room }) => {
      setGameState(prev => ({
        ...prev,
        role: 'player',
        roomCode: data.roomCode,
        room: data.room,
        gameStatus: 'lobby'
      }));
      setLoading(false);
    });

    // Regarder une salle (spectateur)
    socket.on('room-watched', (data: { roomCode: string; room: Room; question?: Question | null }) => {
      const status = data.room.gameState === 'waiting' ? 'lobby' : (data.room.gameState === 'finished' ? 'finished' : 'playing');
      setGameState(prev => ({
        ...prev,
        role: 'monitor',
        roomCode: data.roomCode,
        room: data.room,
        gameStatus: status,
        currentQuestion: data.question ?? null,
        showQuestion: !!data.question
      }));
      setLoading(false);
    });

    // Nouveau: mise à jour de la manche
    socket.on('stage-updated', (data: { stage: TournamentStage; totalQuestions: number; room: Room }) => {
      setGameState(prev => ({
        ...prev,
        room: data.room,
        gameStatus: 'lobby',
        currentQuestion: null,
        showQuestion: false,
      }));
    });

    // Nouveau joueur rejoint
    socket.on('player-joined', (data: { players: Player[]; scores: Record<string, number> }) => {
      setGameState(prev => ({
        ...prev,
        room: prev.room ? { ...prev.room, players: data.players, scores: data.scores } : null
      }));
    });

    // Joueur quitte
    socket.on('player-left', (data: { players: Player[]; scores: Record<string, number> }) => {
      setGameState(prev => ({
        ...prev,
        room: prev.room ? { ...prev.room, players: data.players, scores: data.scores } : null
      }));
    });

    // Partie commencée
    socket.on('game-started', (data: { gameState: string; currentQuestion: number; totalQuestions: number }) => {
      setGameState(prev => ({
        ...prev,
        gameStatus: 'playing',
        room: prev.room ? { ...prev.room, gameState: data.gameState as any, currentQuestion: data.currentQuestion } : null
      }));
    });

    // Buzzer activé
    socket.on('buzzer-activated', (data: { gameState: string; currentQuestion: number | null; players: Player[]; isTieBreak?: boolean; tieBreak?: any }) => {
      setGameState(prev => ({
        ...prev,
        room: prev.room ? { 
          ...prev.room, 
          gameState: data.gameState as any, 
          players: data.players, 
          currentQuestion: (data.currentQuestion ?? prev.room.currentQuestion) as any,
          tieBreak: data.isTieBreak ? (data.tieBreak || prev.room.tieBreak) : prev.room.tieBreak,
        } : null,
        // Conserver l'affichage de la question pendant que le buzzer est actif
        showQuestion: true
      }));

      try {
        const hadIncorrect = data.players?.some(p => p.status === 'incorrect');
        if (hadIncorrect) {
          const incorrectSound = new Audio('/sounds/incorrect.mp3');
          incorrectSound.play().catch(() => {});
        }
      } catch {}
    });

    // Résultat de la réponse
    socket.on('answer-result', (data: any) => {
      setGameState(prev => ({
        ...prev,
        room: prev.room ? { 
          ...prev.room, 
          gameState: data.gameState,
          players: data.players,
          scores: data.scores,
          currentQuestionValue: typeof data.questionValue === 'number' ? data.questionValue : prev.room.currentQuestionValue,
          tieBreak: data.isTieBreak ? (data.tieBreak || prev.room.tieBreak) : prev.room.tieBreak,
        } : null,
        currentQuestion: data.question ?? prev.currentQuestion,
        showQuestion: false
      }));

      try {
        if (data.isCorrect === true) {
          const correctSound = new Audio('/sounds/correct.mp3');
          correctSound.play().catch(() => {});
        } else if (data.isCorrect === false || data.isTimeout) {
          const incorrectSound = new Audio('/sounds/incorrect.mp3');
          incorrectSound.play().catch(() => {});
        }
      } catch {}
    });

    // Buzzer pressé
    socket.on('buzzer-pressed', (data: { playerId: string; playerName: string; gameState: string; players: Player[]; isTieBreak?: boolean; tieBreak?: any }) => {
      setGameState(prev => ({
        ...prev,
        room: prev.room ? { 
          ...prev.room, 
          gameState: data.gameState as any, 
          players: data.players,
          tieBreak: data.isTieBreak ? (data.tieBreak || prev.room.tieBreak) : prev.room.tieBreak,
        } : null
      }));

      try {
        if (gameState.role !== 'player') {
          const buzzerSound = new Audio('/sounds/buzzer.mp3');
          buzzerSound.play().catch(() => {});
        }
      } catch {}
    });

    // Afficher la question (pour le joueur sélectionné)
    socket.on('show-question', (data: { question: Question; questionNumber?: number | null; totalQuestions?: number | null; questionValue?: number; isTieBreak?: boolean; tieBreak?: any }) => {
      setGameState(prev => ({
        ...prev,
        currentQuestion: data.question,
        showQuestion: true,
        room: prev.room ? { 
          ...prev.room, 
          currentQuestionValue: typeof data.questionValue === 'number' ? data.questionValue : prev.room.currentQuestionValue,
          tieBreak: data.isTieBreak ? (data.tieBreak || prev.room.tieBreak) : prev.room.tieBreak,
        } : null,
      }));
    });

    // Question affichée (doublon supprimé; géré plus haut avec questionValue)
    // socket.on('question-displayed', (data: { question: Question; questionNumber: number; totalQuestions: number; gameState: string }) => {
    //   setGameState(prev => ({
    //     ...prev,
    //     currentQuestion: data.question,
    //     showQuestion: true,
    //     room: prev.room ? { ...prev.room, gameState: data.gameState as any } : null
    //   }));
    // });

    // Question masquée (doublon supprimé; géré plus haut)
    // socket.on('question-hidden', (data: { gameState: string }) => {
    //   setGameState(prev => ({
    //     ...prev,
    //     showQuestion: false,
    //     room: prev.room ? { ...prev.room, gameState: data.gameState as any } : null
    //   }));
    // });

    // Tie-break prêt
    socket.on('tiebreak-ready', (data: { stage: TournamentStage; candidates: string[]; slotsToFill: number }) => {
      setGameState(prev => ({
        ...prev,
        room: prev.room ? {
          ...prev.room,
          tieBreak: {
            isActive: false,
            candidates: data.candidates,
            slotsToFill: data.slotsToFill,
            askedCount: 0,
            maxQuestions: 3,
            question: null,
          }
        } : null,
        gameStatus: 'playing'
      }));
    });

    // Tie-break toujours à égalité
    socket.on('tiebreak-still-tied', (data: { stage: TournamentStage; candidates: string[]; slotsToFill: number; askedCount: number; maxQuestions: number }) => {
      setGameState(prev => ({
        ...prev,
        room: prev.room ? {
          ...prev.room,
          tieBreak: {
            isActive: true,
            candidates: data.candidates,
            slotsToFill: data.slotsToFill,
            askedCount: data.askedCount,
            maxQuestions: data.maxQuestions,
            question: prev.room.tieBreak?.question ?? null,
          }
        } : null,
      }));
    });

    // Question suivante
    socket.on('next-question', (data: { currentQuestion: number; gameState: string; players: Player[]; totalQuestions: number }) => {
      setGameState(prev => ({
        ...prev,
        room: prev.room ? { 
          ...prev.room, 
          gameState: data.gameState as any,
          currentQuestion: data.currentQuestion,
          players: data.players 
        } : null,
        currentQuestion: null,
        showQuestion: false
      }));
    });

    // Partie terminée
    socket.on('game-finished', (data: { finalRanking: Player[]; scores: Record<string, number>; stage?: TournamentStage }) => {
      setGameState(prev => ({
        ...prev,
        gameStatus: 'finished',
        room: prev.room ? { ...prev.room, gameState: 'finished' as any, scores: data.scores, /* stage reste dans room */ } : null
      }));
    });

    // Nouveau: fin de manche avec qualifications/éliminations
    socket.on('stage-finished', (data: { finalRanking: Player[]; scores: Record<string, number>; stage: TournamentStage; qualifiersCount: number; qualified: string[]; eliminated: string[] }) => {
      setGameState(prev => ({
        ...prev,
        gameStatus: 'finished',
        room: prev.room ? { ...prev.room, gameState: 'finished' as any, scores: data.scores, players: prev.room.players.map(p => ({
          ...p,
          status: data.qualified.includes(p.id) ? (data.stage === 'finale' ? 'winner' : 'qualified') : 'eliminated'
        })) } : null,
      }));
    });

    // Hôte déconnecté
    socket.on('host-disconnected', () => {
      setError('L\'hôte s\'est déconnecté. La partie est terminée.');
      setTimeout(() => {
        resetGame();
      }, 3000);
    });

    // Erreurs
    socket.on('error', (data: { message: string }) => {
      setError(data.message);
      setLoading(false);
    });

    // Question affichée
    socket.on('question-displayed', (data: { question: Question; questionNumber: number; totalQuestions: number; gameState: string; questionValue?: number }) => {
      setGameState(prev => ({
        ...prev,
        currentQuestion: data.question,
        showQuestion: true,
        room: prev.room ? { 
          ...prev.room, 
          gameState: data.gameState as any,
          currentQuestionValue: typeof data.questionValue === 'number' ? data.questionValue : prev.room.currentQuestionValue
        } : null
      }));
    });

    // Question masquée
    socket.on('question-hidden', (data: { gameState: string }) => {
      setGameState(prev => ({
        ...prev,
        showQuestion: false,
        room: prev.room ? { ...prev.room, gameState: data.gameState as any } : null
      }));
    });

    socket.on('timer-update', (data: { type: 'buzzer' | 'answer'; countdown: number }) => {
      setGameState(prev => ({
        ...prev,
        timers: {
          ...prev.timers,
          [data.type]: data.countdown,
        },
      }));
    });

    return () => {
      socket.off('active-room-status');
      socket.off('room-created');
      socket.off('room-joined');
      socket.off('room-watched');
      socket.off('stage-updated');
      socket.off('player-joined');
      socket.off('player-left');
      socket.off('game-started');
      socket.off('buzzer-activated');
      socket.off('buzzer-pressed');
      socket.off('show-question');
      socket.off('answer-result');
      socket.off('next-question');
      socket.off('game-finished');
      socket.off('host-disconnected');
      socket.off('error');
      socket.off('question-displayed');
      socket.off('question-hidden');
      socket.off('tiebreak-ready');
      socket.off('tiebreak-still-tied');
      socket.off('timer-update');
    };
  }, [socket]);

  // Actions
  const createRoom = (hostName: string) => {
    if (!socket) return;
    setLoading(true);
    setError('');
    setGameState(prev => ({ ...prev, role: 'host', userName: hostName }));
    socket.emit('create-room', hostName);
  };

  const joinRoom = (roomCode: string, playerName: string) => {
    if (!socket) return;
    setLoading(true);
    setError('');
    setGameState(prev => ({ ...prev, role: 'player', userName: playerName }));
    socket.emit('join-room', { roomCode: roomCode.toUpperCase(), playerName });
  };

  const watchRoom = (roomCode: string) => {
    if (!socket) return;
    setLoading(true);
    setError('');
    setGameState(prev => ({ ...prev, role: 'monitor', userName: '' }));
    socket.emit('watch-room', { roomCode: roomCode.toUpperCase() });
  };

  const startGame = () => {
    if (!socket || !gameState.roomCode) return;
    socket.emit('start-game', gameState.roomCode);
  };

  const activateQuestion = () => {
    if (!socket || !gameState.roomCode) return;
    socket.emit('activate-question', gameState.roomCode);
  };

  const pressBuzzer = () => {
    if (!socket || !gameState.roomCode) return;
    socket.emit('press-buzzer', gameState.roomCode);
  };

  const submitAnswer = (answer: number) => {
    if (!socket || !gameState.roomCode) return;
    socket.emit('submit-answer', { roomCode: gameState.roomCode, answer });
  };

  const nextQuestion = () => {
    if (!socket || !gameState.roomCode) return;
    socket.emit('next-question', gameState.roomCode);
  };

  const showQuestionToAll = () => {
    if (!socket || !gameState.roomCode) return;
    socket.emit('show-question-to-all', gameState.roomCode);
  };

  const hideQuestionFromAll = () => {
    if (!socket || !gameState.roomCode) return;
    socket.emit('hide-question-from-all', gameState.roomCode);
  };

  // Afficher la question et activer le buzzer en une action
  const showQuestionAndActivateBuzzer = () => {
    if (!socket || !gameState.roomCode) return;
    socket.emit('show-question-to-all', gameState.roomCode);
    socket.emit('activate-question', gameState.roomCode);
  };

  // Définir la manche de tournoi
  const setTournamentStage = (stage: TournamentStage) => {
    if (!socket || !gameState.roomCode) return;
    socket.emit('set-stage', { roomCode: gameState.roomCode, stage });
  };

  // Démarrer un tie-break (optionnel: préciser un max de questions)
  const startTieBreak = (maxQuestions?: number) => {
    if (!socket || !gameState.roomCode) return;
    socket.emit('host-start-tiebreak', { roomCode: gameState.roomCode, maxQuestions });
  };

  const resetGame = () => {
    setGameState({
      role: 'player',
      roomCode: '',
      userName: '',
      room: null,
      currentQuestion: null,
      showQuestion: false,
      gameStatus: 'menu',
      activeRoomExists: gameState.activeRoomExists ?? false,
      timers: {
        buzzer: 0,
        answer: 0,
      },
    });
    setError('');
    setLoading(false);
  };

  const clearError = () => setError('');

  return {
    gameState,
    error,
    loading,
    createRoom,
    joinRoom,
    watchRoom,
    startGame,
    activateQuestion,
    pressBuzzer,
    submitAnswer,
    nextQuestion,
    resetGame,
    clearError,
    showQuestionToAll,
    hideQuestionFromAll,
    showQuestionAndActivateBuzzer,
    setTournamentStage,
    startTieBreak,
  };
};
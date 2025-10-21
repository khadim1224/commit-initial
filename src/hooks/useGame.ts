import { useState, useEffect } from 'react';
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

  // Gestion des événements socket
  useEffect(() => {
    if (!socket) return;

    // Etat global: une salle active existe-t-elle ?
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
    socket.on('buzzer-activated', (data: { gameState: string; currentQuestion: number; players: Player[] }) => {
      setGameState(prev => ({
        ...prev,
        room: prev.room ? { ...prev.room, gameState: data.gameState as any, players: data.players, currentQuestion: data.currentQuestion } : null,
        // Conserver l'affichage de la question pendant que le buzzer est actif
        showQuestion: true
      }));
    });

    // Buzzer pressé
    socket.on('buzzer-pressed', (data: { playerId: string; playerName: string; gameState: string; players: Player[] }) => {
      setGameState(prev => ({
        ...prev,
        room: prev.room ? { ...prev.room, gameState: data.gameState as any, players: data.players } : null
      }));
    });

    // Afficher la question (pour le joueur sélectionné)
    socket.on('show-question', (data: { question: Question; questionNumber: number; totalQuestions: number }) => {
      setGameState(prev => ({
        ...prev,
        currentQuestion: data.question,
        showQuestion: true
      }));
    });

    // Résultat de la réponse
    socket.on('answer-result', (data: any) => {
      setGameState(prev => ({
        ...prev,
        room: prev.room ? { 
          ...prev.room, 
          gameState: data.gameState,
          players: data.players,
          scores: data.scores 
        } : null,
        currentQuestion: data.question ?? prev.currentQuestion,
        showQuestion: false
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
    socket.on('question-displayed', (data: { question: Question; questionNumber: number; totalQuestions: number; gameState: string }) => {
      setGameState(prev => ({
        ...prev,
        currentQuestion: data.question,
        showQuestion: true,
        room: prev.room ? { ...prev.room, gameState: data.gameState as any } : null
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
  };
};
import { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { GameState, Player, Question, Room } from '../types/game';

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

    // Création de salle réussie
    socket.on('room-created', (data: { roomCode: string; room: Room }) => {
      setGameState(prev => ({
        ...prev,
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
        roomCode: data.roomCode,
        room: data.room,
        gameStatus: 'lobby'
      }));
      setLoading(false);
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
        showQuestion: false
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
    socket.on('game-finished', (data: { finalRanking: Player[]; scores: Record<string, number> }) => {
      setGameState(prev => ({
        ...prev,
        gameStatus: 'finished',
        room: prev.room ? { ...prev.room, gameState: 'finished' as any, scores: data.scores } : null
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
      socket.off('room-created');
      socket.off('room-joined');
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

  const resetGame = () => {
    setGameState({
      role: 'player',
      roomCode: '',
      userName: '',
      room: null,
      currentQuestion: null,
      showQuestion: false,
      gameStatus: 'menu',
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
    startGame,
    activateQuestion,
    pressBuzzer,
    submitAnswer,
    nextQuestion,
    resetGame,
    clearError,
    showQuestionToAll,
    hideQuestionFromAll
  };
};
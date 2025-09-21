import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const server = createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Questions sur l'histoire du Sénégal
const questions = [
  {
    id: 1,
    question: "En quelle année le Sénégal a-t-il obtenu son indépendance ?",
    options: ["1958", "1960", "1962", "1965"],
    correct: 1
  },
  {
    id: 2,
    question: "Qui était le premier président du Sénégal indépendant ?",
    options: ["Mamadou Dia", "Léopold Sédar Senghor", "Abdou Diouf", "Abdoulaye Wade"],
    correct: 1
  },
  {
    id: 3,
    question: "Quelle est l'ancienne capitale du Sénégal colonial français ?",
    options: ["Dakar", "Saint-Louis", "Thiès", "Kaolack"],
    correct: 1
  },
  {
    id: 4,
    question: "Le royaume du Cayor était dirigé par des :",
    options: ["Rois", "Damel", "Buur", "Lamane"],
    correct: 1
  },
  {
    id: 5,
    question: "Qui était Lat Dior ?",
    options: ["Un explorateur", "Un damel du Cayor", "Un marabout", "Un colonisateur"],
    correct: 1
  },
  {
    id: 6,
    question: "L'île de Gorée était principalement connue pour :",
    options: ["Le commerce d'or", "La traite négrière", "La pêche", "L'agriculture"],
    correct: 1
  },
  {
    id: 7,
    question: "Quel fleuve traverse le Sénégal ?",
    options: ["Niger", "Gambie", "Sénégal", "Casamance"],
    correct: 2
  },
  {
    id: 8,
    question: "La bataille de Guilé a opposé Lat Dior aux :",
    options: ["Portugais", "Anglais", "Français", "Hollandais"],
    correct: 2
  },
  {
    id: 9,
    question: "Quel était le nom du parti de Léopold Sédar Senghor ?",
    options: ["UPS", "BDS", "PAI", "RND"],
    correct: 0
  },
  {
    id: 10,
    question: "La ville de Kaolack était célèbre pour le commerce de :",
    options: ["L'or", "L'arachide", "Le mil", "Le coton"],
    correct: 1
  },
  {
    id: 11,
    question: "Qui a succédé à Léopold Sédar Senghor à la présidence ?",
    options: ["Mamadou Dia", "Abdou Diouf", "Abdoulaye Wade", "Macky Sall"],
    correct: 1
  },
  {
    id: 12,
    question: "L'ethnie majoritaire au Sénégal est :",
    options: ["Peul", "Wolof", "Serer", "Diola"],
    correct: 1
  },
  {
    id: 13,
    question: "Le marabout Ahmadou Bamba a fondé la confrérie des :",
    options: ["Tidjanes", "Mourides", "Layènes", "Qadiriyya"],
    correct: 1
  },
  {
    id: 14,
    question: "La ville sainte de Touba a été fondée par :",
    options: ["El Hadji Omar Tall", "Ahmadou Bamba", "Malik Sy", "Abdoulaye Yakhine"],
    correct: 1
  },
  {
    id: 15,
    question: "Le Sénégal faisait partie de quelle fédération en Afrique de l'Ouest ?",
    options: ["AOF", "AEF", "Union du Mali", "CEDEAO"],
    correct: 0
  },
  {
    id: 16,
    question: "La résistance d'El Hadji Omar Tall s'est déroulée au :",
    options: ["XVIIe siècle", "XVIIIe siècle", "XIXe siècle", "XXe siècle"],
    correct: 2
  },
  {
    id: 17,
    question: "Quel port était le point de départ du chemin de fer Dakar-Niger ?",
    options: ["Saint-Louis", "Dakar", "Rufisque", "Kaolack"],
    correct: 1
  },
  {
    id: 18,
    question: "La région de la Casamance est habitée principalement par les :",
    options: ["Wolof", "Serer", "Diola", "Peul"],
    correct: 2
  },
  {
    id: 19,
    question: "En quelle année Dakar est-elle devenue capitale du Sénégal ?",
    options: ["1902", "1958", "1960", "1904"],
    correct: 1
  },
  {
    id: 20,
    question: "Le mouvement de la Négritude a été cofondé par :",
    options: ["Cheikh Anta Diop", "Léopold Sédar Senghor", "Alioune Diop", "Abdoulaye Sadji"],
    correct: 1
  }
];

// État global des salles
const rooms = new Map();

// Génération d'un code de salle unique
function generateRoomCode() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

// Gestion des connexions Socket.IO
io.on('connection', (socket) => {
  console.log('Utilisateur connecté:', socket.id);

  // Créer une nouvelle salle
  socket.on('create-room', (hostName) => {
    const roomCode = generateRoomCode();
    const room = {
      code: roomCode,
      host: {
        id: socket.id,
        name: hostName
      },
      players: [],
      currentQuestion: 0,
      gameState: 'waiting', // waiting, question_displayed, question_active, buzzer_active, answering, results
      buzzer: {
        active: false,
        playerId: null,
        timestamp: null
      },
      scores: {},
      questions: [...questions].sort(() => Math.random() - 0.5), // Mélanger les questions
      timers: {
        buzzer: null,
        answer: null
      }
    };

    rooms.set(roomCode, room);
    socket.join(roomCode);
    
    socket.emit('room-created', { roomCode, room });
    console.log(`Salle créée: ${roomCode} par ${hostName}`);
  });

  // Rejoindre une salle
  socket.on('join-room', (data) => {
    const { roomCode, playerName } = data;
    const room = rooms.get(roomCode);

    if (!room) {
      socket.emit('error', { message: 'Salle introuvable' });
      return;
    }

    if (room.gameState !== 'waiting') {
      socket.emit('error', { message: 'La partie a déjà commencé' });
      return;
    }

    const player = {
      id: socket.id,
      name: playerName,
      score: 0,
      status: 'waiting'
    };

    room.players.push(player);
    room.scores[socket.id] = 0;
    socket.join(roomCode);

    // Notifier tous les participants
    io.to(roomCode).emit('player-joined', { 
      players: room.players,
      scores: room.scores
    });

    socket.emit('room-joined', { roomCode, room });
    console.log(`${playerName} a rejoint la salle ${roomCode}`);
  });

  // Commencer la partie
  socket.on('start-game', (roomCode) => {
    const room = rooms.get(roomCode);
    if (!room || room.host.id !== socket.id) return;

    room.gameState = 'question_active';
    room.currentQuestion = 0;
    
    io.to(roomCode).emit('game-started', { 
      gameState: room.gameState,
      currentQuestion: room.currentQuestion,
      totalQuestions: room.questions.length
    });

    console.log(`Partie commencée dans la salle ${roomCode}`);
  });

  // Afficher la question à tous les joueurs
  socket.on('show-question-to-all', (roomCode) => {
    const room = rooms.get(roomCode);
    if (!room || room.host.id !== socket.id) return;

    room.gameState = 'question_displayed';
    const currentQ = room.questions[room.currentQuestion];

    io.to(roomCode).emit('question-displayed', {
      question: currentQ,
      questionNumber: room.currentQuestion + 1,
      totalQuestions: room.questions.length,
      gameState: room.gameState,
    });

    console.log(`Question ${room.currentQuestion + 1} affichée dans la salle ${roomCode}`);
  });

  // Masquer la question de tous les joueurs
  socket.on('hide-question-from-all', (roomCode) => {
    const room = rooms.get(roomCode);
    if (!room || room.host.id !== socket.id) return;

    room.gameState = 'question_active';
    io.to(roomCode).emit('question-hidden', {
      gameState: room.gameState,
    });

    console.log(`Question ${room.currentQuestion + 1} masquée dans la salle ${roomCode}`);
  });

  // Activer une question
  socket.on('activate-question', (roomCode) => {
    const room = rooms.get(roomCode);
    if (!room || room.host.id !== socket.id) return;

    room.gameState = 'buzzer_active';
    room.buzzer = {
      active: true,
      playerId: null,
      timestamp: null
    };

    // Réinitialiser le statut des joueurs
    room.players.forEach(player => {
      player.status = 'waiting';
    });

    io.to(roomCode).emit('buzzer-activated', {
      gameState: room.gameState,
      currentQuestion: room.currentQuestion,
      players: room.players
    });

    console.log(`Question ${room.currentQuestion + 1} activée dans la salle ${roomCode}`);

    // Démarrer le compte à rebours du buzzer
    let buzzerCountdown = 3;
    io.to(roomCode).emit('timer-update', { type: 'buzzer', countdown: buzzerCountdown });

    room.timers.buzzer = setInterval(() => {
      buzzerCountdown--;
      io.to(roomCode).emit('timer-update', { type: 'buzzer', countdown: buzzerCountdown });

      if (buzzerCountdown === 0) {
        clearInterval(room.timers.buzzer);
        if (room.gameState === 'buzzer_active') {
          room.gameState = 'results';
          io.to(roomCode).emit('answer-result', {
            isTimeout: true,
            question: room.questions[room.currentQuestion],
            scores: room.scores,
            players: room.players,
            gameState: room.gameState
          });
        }
      }
    }, 1000);
  });

  // Presser le buzzer
  socket.on('press-buzzer', (roomCode) => {
    const room = rooms.get(roomCode);
    if (!room || room.gameState !== 'buzzer_active') return;

    // Arrêter le compte à rebours du buzzer
    clearInterval(room.timers.buzzer);

    // Vérifier si le buzzer est encore disponible
    if (!room.buzzer.active || room.buzzer.playerId) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    // Premier joueur à presser le buzzer
    room.buzzer.playerId = socket.id;
    room.buzzer.timestamp = Date.now();
    room.gameState = 'answering';
    player.status = 'selected';

    // Mettre à jour les autres joueurs
    room.players.forEach(p => {
      if (p.id !== socket.id) {
        p.status = 'blocked';
      }
    });

    const currentQ = room.questions[room.currentQuestion];

    // Envoyer la question au joueur sélectionné
    socket.emit('show-question', {
      question: currentQ,
      questionNumber: room.currentQuestion + 1,
      totalQuestions: room.questions.length
    });

    // Notifier tous les autres participants
    io.to(roomCode).emit('buzzer-pressed', {
      playerId: socket.id,
      playerName: player.name,
      gameState: room.gameState,
      players: room.players
    });

    console.log(`${player.name} a pressé le buzzer dans la salle ${roomCode}`);

    // Démarrer le compte à rebours pour la réponse
    let answerCountdown = 7;
    io.to(roomCode).emit('timer-update', { type: 'answer', countdown: answerCountdown });

    room.timers.answer = setInterval(() => {
      answerCountdown--;
      io.to(roomCode).emit('timer-update', { type: 'answer', countdown: answerCountdown });

      if (answerCountdown === 0) {
        clearInterval(room.timers.answer);
        if (room.gameState === 'answering') {
          // Temps écoulé, considérer comme une mauvaise réponse
          room.scores[socket.id] = Math.max(0, room.scores[socket.id] - 5);
          player.score = Math.max(0, player.score - 5);
          player.status = 'incorrect';
          room.gameState = 'results';

          io.to(roomCode).emit('answer-result', {
            playerId: socket.id,
            playerName: player.name,
            isTimeout: true,
            isCorrect: false,
            question: room.questions[room.currentQuestion],
            scores: room.scores,
            players: room.players,
            gameState: room.gameState
          });
        }
      }
    }, 1000);
  });

  // Soumettre une réponse
  socket.on('submit-answer', (data) => {
    const { roomCode, answer } = data;
    const room = rooms.get(roomCode);
    
    if (!room || room.gameState !== 'answering' || room.buzzer.playerId !== socket.id) return;

    // Arrêter le compte à rebours de la réponse
    clearInterval(room.timers.answer);

    const currentQ = room.questions[room.currentQuestion];
    const isCorrect = answer === currentQ.correct;
    const player = room.players.find(p => p.id === socket.id);

    if (isCorrect) {
      room.scores[socket.id] += 10;
      player.score += 10;
      player.status = 'correct';
    } else {
      room.scores[socket.id] = Math.max(0, room.scores[socket.id] - 5);
      player.score = Math.max(0, player.score - 5);
      player.status = 'incorrect';
    }

    room.gameState = 'results';

    // Envoyer le résultat à tous
    io.to(roomCode).emit('answer-result', {
      playerId: socket.id,
      playerName: player.name,
      answer: answer,
      correct: currentQ.correct,
      correctAnswer: currentQ.options[currentQ.correct],
      isCorrect: isCorrect,
      question: currentQ,
      scores: room.scores,
      players: room.players,
      gameState: room.gameState
    });

    console.log(`${player.name} a répondu ${isCorrect ? 'correctement' : 'incorrectement'} dans la salle ${roomCode}`);
  });

  // Question suivante
  socket.on('next-question', (roomCode) => {
    const room = rooms.get(roomCode);
    if (!room || room.host.id !== socket.id) return;

    room.currentQuestion++;
    
    if (room.currentQuestion >= room.questions.length) {
      // Fin de partie
      room.gameState = 'finished';
      
      // Calculer le classement final
      const finalRanking = room.players
        .map(player => ({
          ...player,
          score: room.scores[player.id]
        }))
        .sort((a, b) => b.score - a.score);

      io.to(roomCode).emit('game-finished', {
        finalRanking,
        scores: room.scores
      });
    } else {
      room.gameState = 'question_active';
      room.buzzer = {
        active: false,
        playerId: null,
        timestamp: null
      };

      // Réinitialiser les statuts des joueurs
      room.players.forEach(player => {
        player.status = 'waiting';
      });

      io.to(roomCode).emit('next-question', {
        currentQuestion: room.currentQuestion,
        gameState: room.gameState,
        players: room.players,
        totalQuestions: room.questions.length
      });
    }
  });

  // Déconnexion
  socket.on('disconnect', () => {
    console.log('Utilisateur déconnecté:', socket.id);
    
    // Nettoyer les salles
    for (const [roomCode, room] of rooms.entries()) {
      if (room.host.id === socket.id) {
        // L'hôte s'est déconnecté, supprimer la salle
        io.to(roomCode).emit('host-disconnected');
        rooms.delete(roomCode);
        console.log(`Salle ${roomCode} supprimée (hôte déconnecté)`);
      } else {
        // Un joueur s'est déconnecté
        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== -1) {
          const playerName = room.players[playerIndex].name;
          room.players.splice(playerIndex, 1);
          delete room.scores[socket.id];
          
          io.to(roomCode).emit('player-left', {
            players: room.players,
            scores: room.scores,
            playerName
          });
          
          console.log(`${playerName} a quitté la salle ${roomCode}`);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
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
  { id: 1, question: "En quelle année le Sénégal a-t-il obtenu son indépendance ?", options: ["1958", "1960", "1962", "1965"], correct: 1 },
  { id: 2, question: "Qui était le premier président du Sénégal indépendant ?", options: ["Mamadou Dia", "Léopold Sédar Senghor", "Abdou Diouf", "Abdoulaye Wade"], correct: 1 },
  { id: 3, question: "Quelle est l'ancienne capitale du Sénégal colonial français ?", options: ["Dakar", "Saint-Louis", "Thiès", "Kaolack"], correct: 1 },
  { id: 4, question: "Le royaume du Cayor était dirigé par des :", options: ["Rois", "Damel", "Buur", "Lamane"], correct: 1 },
  { id: 5, question: "Qui était Lat Dior ?", options: ["Un explorateur", "Un damel du Cayor", "Un marabout", "Un colonisateur"], correct: 1 },
  { id: 6, question: "L'île de Gorée était principalement connue pour :", options: ["Le commerce d'or", "La traite négrière", "La pêche", "L'agriculture"], correct: 1 },
  { id: 7, question: "Quel fleuve traverse le Sénégal ?", options: ["Niger", "Gambie", "Sénégal", "Casamance"], correct: 2 },
  { id: 8, question: "La bataille de Guilé a opposé Lat Dior aux :", options: ["Portugais", "Anglais", "Français", "Hollandais"], correct: 2 },
  { id: 9, question: "Quel était le nom du parti de Léopold Sédar Senghor ?", options: ["UPS", "BDS", "PAI", "RND"], correct: 0 },
  { id: 10, question: "La ville de Kaolack était célèbre pour le commerce de :", options: ["L'or", "L'arachide", "Le mil", "Le coton"], correct: 1 },
  { id: 11, question: "Qui a succédé à Léopold Sédar Senghor à la présidence ?", options: ["Mamadou Dia", "Abdou Diouf", "Abdoulaye Wade", "Macky Sall"], correct: 1 },
  { id: 12, question: "L'ethnie majoritaire au Sénégal est :", options: ["Peul", "Wolof", "Serer", "Diola"], correct: 1 },
  { id: 13, question: "Le marabout Ahmadou Bamba a fondé la confrérie des :", options: ["Tidjanes", "Mourides", "Layènes", "Qadiriyya"], correct: 1 },
  { id: 14, question: "La ville sainte de Touba a été fondée par :", options: ["El Hadji Omar Tall", "Ahmadou Bamba", "Malik Sy", "Abdoulaye Yakhine"], correct: 1 },
  { id: 15, question: "Le Sénégal faisait partie de quelle fédération en Afrique de l'Ouest ?", options: ["AOF", "AEF", "Union du Mali", "CEDEAO"], correct: 0 },
  { id: 16, question: "La résistance d'El Hadji Omar Tall s'est déroulée au :", options: ["XVIIe siècle", "XVIIIe siècle", "XIXe siècle", "XXe siècle"], correct: 2 },
  { id: 17, question: "Quel port était le point de départ du chemin de fer Dakar-Niger ?", options: ["Saint-Louis", "Dakar", "Rufisque", "Kaolack"], correct: 1 },
  { id: 18, question: "La région de la Casamance est habitée principalement par les :", options: ["Wolof", "Serer", "Diola", "Peul"], correct: 2 },
  { id: 19, question: "En quelle année Dakar est-elle devenue capitale du Sénégal ?", options: ["1902", "1958", "1960", "1904"], correct: 1 },
  { id: 20, question: "Le mouvement de la Négritude a été cofondé par :", options: ["Cheikh Anta Diop", "Léopold Sédar Senghor", "Alioune Diop", "Abdoulaye Sadji"], correct: 1 }
];

// Construire des sets de questions par manche (disjoints)
function buildStageSets() {
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return {
    premiere: shuffled.slice(0, 5),
    huitiemes: shuffled.slice(5, 10),
    demi: shuffled.slice(10, 15),
    finale: shuffled.slice(15, 20)
  };
}

// État global des salles
const rooms = new Map();

// Génération d'un code de salle unique
function generateRoomCode() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

// Gestion des connexions Socket.IO
io.on('connection', (socket) => {
  console.log('Utilisateur connecté:', socket.id);

  // Informer immédiatement le client de l'état des salles actives
  socket.emit('active-room-status', { exists: rooms.size > 0 });

  // Créer une nouvelle salle
  socket.on('create-room', (hostName) => {
    // Empêcher la création d'une nouvelle salle si une existe déjà
    if (rooms.size > 0) {
      socket.emit('error', { message: 'Une salle existe déjà. Rejoignez-la ou regardez le jeu.' });
      socket.emit('active-room-status', { exists: true });
      return;
    }

    const roomCode = generateRoomCode();
    const stageSets = buildStageSets();
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
      questions: [], // pas de questions tant que la manche n'est pas sélectionnée
      stageSets, // conserver les sets pour basculer de manche
      stage: null, // l'hôte doit sélectionner la manche explicitement
      timers: {
        buzzer: null,
        answer: null
      },
      // Valeur de la question en cours (5 ou 10)
      currentQuestionValue: 10,
      // Historique des IDs de questions posées pour éviter les doublons
      askedQuestionIds: new Set(),
    };

    rooms.set(roomCode, room);
    socket.join(roomCode);
    
    socket.emit('room-created', { roomCode, room });
    // Notifier tous les clients qu'une salle est désormais active
    io.emit('active-room-status', { exists: true, roomCode });
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

  // Ajout: configuration du nombre de qualifiés par manche
const STAGE_QUALIFIERS = {
  premiere: 10,
  huitiemes: 4,
  demi: 2,
  finale: 1,
};

  // Calcul dynamique des qualifiés selon la manche et le nombre de joueurs
  function getQualifiersCount(stage, playerCount) {
    if (stage === 'finale') return 1;
    if (stage === 'premiere') return Math.max(1, Math.floor(playerCount / 2));
    if (stage === 'huitiemes') return Math.max(1, Math.floor((2 * playerCount) / 5));
    if (stage === 'demi') return Math.max(1, Math.floor(playerCount / 2));
    return Math.max(1, Math.floor(playerCount / 2));
  }

  // Définir la manche (par l'hôte)
  socket.on('set-stage', (data) => {
    const { roomCode, stage } = data; // stage: 'premiere' | 'huitiemes' | 'demi' | 'finale'
    const room = rooms.get(roomCode);
    if (!room || room.host.id !== socket.id) return;

    // Verrouillage: impossible de changer de manche pendant le jeu
    if (room.gameState !== 'waiting' && room.gameState !== 'finished') {
      socket.emit('error', { message: 'Impossible de changer de manche pendant la partie.' });
      return;
    }

    if (!room.stageSets || !room.stageSets[stage]) {
      // reconstruire si nécessaire
      room.stageSets = buildStageSets();
    }

    // Reset des compteurs/timers
    if (room.timers.buzzer) clearInterval(room.timers.buzzer);
    if (room.timers.answer) clearInterval(room.timers.answer);

    room.stage = stage;
    room.questions = room.stageSets[stage];
    room.currentQuestion = 0;
    room.gameState = 'waiting';
    room.buzzer = { active: false, playerId: null, timestamp: null };
    room.currentQuestionValue = 10;
    room.askedQuestionIds = new Set();

    // Réinitialiser les statuts/scores des joueurs non éliminés
    room.players.forEach(p => {
      if (p.status !== 'eliminated') {
        p.status = 'waiting';
        p.score = 0;
        room.scores[p.id] = 0;
      }
    });

    io.to(roomCode).emit('stage-updated', {
      stage: room.stage,
      totalQuestions: room.questions.length,
      room
    });

    console.log(`Manche définie sur ${stage} dans la salle ${roomCode}`);
  });

  // Commencer la partie
  socket.on('start-game', (roomCode) => {
    const room = rooms.get(roomCode);
    if (!room || room.host.id !== socket.id) return;

    // Exiger la sélection de la manche avant démarrage
    if (!room.stage || !room.questions || room.questions.length === 0) {
      socket.emit('error', { message: 'Sélectionnez une manche avant de commencer le jeu.' });
      return;
    }

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

    if (!room.stage) {
      socket.emit('error', { message: 'Aucune manche sélectionnée.' });
      return;
    }

    room.gameState = 'question_displayed';
    const currentQ = room.questions[room.currentQuestion];

    // Tirage 50/50 de la valeur de la question (5 ou 10)
    room.currentQuestionValue = Math.random() < 0.5 ? 5 : 10;
    room.askedQuestionIds.add(currentQ.id);

    io.to(roomCode).emit('question-displayed', {
      question: currentQ,
      questionNumber: room.currentQuestion + 1,
      totalQuestions: room.questions.length,
      gameState: room.gameState,
      questionValue: room.currentQuestionValue,
    });

    console.log(`Question ${room.currentQuestion + 1} affichée (valeur +${room.currentQuestionValue}) dans la salle ${roomCode}`);
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

  // Regarder une salle (spectateur/moniteur)
  socket.on('watch-room', (data) => {
    const { roomCode } = data;
    const room = rooms.get(roomCode);

    if (!room) {
      socket.emit('error', { message: 'Salle introuvable' });
      return;
    }

    // Un spectateur peut rejoindre à tout moment, sans être ajouté aux joueurs
    socket.join(roomCode);

    const currentQ = (room.gameState === 'question_displayed') ? room.questions[room.currentQuestion] : null;

    socket.emit('room-watched', { 
      roomCode, 
      room, 
      question: currentQ
    });

    console.log(`Spectateur ${socket.id} regarde la salle ${roomCode}`);
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
    let buzzerCountdown = 20;
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

    // Tie-break: restreindre le buzzer aux candidats uniquement
    if (room.tieBreak?.isActive) {
      if (!room.tieBreak.candidates.includes(socket.id)) {
        return;
      }
    }

    // Bloquer les joueurs éliminés
    if (player.status === 'eliminated') return;
    // Empêcher un joueur ayant déjà répondu incorrectement sur cette question de rebuzzer
    if (player.status === 'incorrect') return;

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

    const currentQ = room.tieBreak?.isActive ? room.tieBreak.question : room.questions[room.currentQuestion];

    // Envoyer la question au joueur sélectionné
    socket.emit('show-question', {
      question: currentQ,
      questionNumber: room.tieBreak?.isActive ? null : room.currentQuestion + 1,
      totalQuestions: room.tieBreak?.isActive ? null : room.questions.length,
      questionValue: room.currentQuestionValue,
      isTieBreak: !!room.tieBreak?.isActive,
      tieBreak: room.tieBreak || null,
    });

    // Notifier tous les autres participants
    io.to(roomCode).emit('buzzer-pressed', {
      playerId: socket.id,
      playerName: player.name,
      gameState: room.gameState,
      players: room.players,
      isTieBreak: !!room.tieBreak?.isActive,
      tieBreak: room.tieBreak || null,
    });

    console.log(`${player.name} a pressé le buzzer dans la salle ${roomCode}`);

    // Démarrer le compte à rebours pour la réponse
    let answerCountdown = 40;
    io.to(roomCode).emit('timer-update', { type: 'answer', countdown: answerCountdown });

    room.timers.answer = setInterval(() => {
      answerCountdown--;
      io.to(roomCode).emit('timer-update', { type: 'answer', countdown: answerCountdown });

      if (answerCountdown === 0) {
        clearInterval(room.timers.answer);
        if (room.gameState === 'answering') {
          // Temps écoulé, considérer comme une mauvaise réponse et réactiver le buzzer
          player.status = 'incorrect';

          // Réactiver le buzzer pour les autres joueurs
          room.gameState = 'buzzer_active';
          room.buzzer = { active: true, playerId: null, timestamp: null };
          room.players.forEach(p => {
            if (p.id !== player.id) {
              const shouldWait = room.tieBreak?.isActive ? room.tieBreak.candidates.includes(p.id) : true;
              p.status = p.status === 'eliminated' ? 'eliminated' : (shouldWait ? 'waiting' : 'blocked');
            }
          });

          io.to(roomCode).emit('buzzer-activated', {
            gameState: room.gameState,
            currentQuestion: room.tieBreak?.isActive ? null : room.currentQuestion,
            players: room.players,
            isTieBreak: !!room.tieBreak?.isActive,
            tieBreak: room.tieBreak || null,
          });

          // Redémarrer le compte à rebours du buzzer
          let buzzerCountdown = 20;
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
                  question: currentQ,
                  scores: room.scores,
                  players: room.players,
                  gameState: room.gameState,
                  isTieBreak: !!room.tieBreak?.isActive,
                  tieBreak: room.tieBreak || null,
                });
              }
            }
          }, 1000);
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

    const currentQ = room.tieBreak?.isActive ? room.tieBreak.question : room.questions[room.currentQuestion];
    const isCorrect = answer === currentQ.correct;
    const player = room.players.find(p => p.id === socket.id);

    if (isCorrect) {
      const gained = room.currentQuestionValue ?? 10;
      room.scores[socket.id] += gained;
      player.score += gained;
      player.status = 'correct';

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
        questionValue: room.currentQuestionValue,
        scores: room.scores,
        players: room.players,
        gameState: room.gameState,
        isTieBreak: !!room.tieBreak?.isActive,
        tieBreak: room.tieBreak || null,
      });

      console.log(`${player.name} a répondu correctement (+${gained}) dans la salle ${roomCode}`);

      // Avancer automatiquement après un court délai
      setTimeout(() => {
        const r = rooms.get(roomCode);
        if (!r) return;
        if (r.gameState !== 'results') return;

        // Gestion spécifique tie-break: ne pas avancer l'index de question
        if (r.tieBreak?.isActive) {
          // Recalculer le classement et vérifier résolution du tie-break
          const finalRanking = r.players
            .map(pl => ({ ...pl, score: r.scores[pl.id] }))
            .sort((a, b) => b.score - a.score);

          const qualifiersCount = getQualifiersCount(r.stage, r.players.length);
          const K = qualifiersCount;
          const cutoffScore = finalRanking[K - 1]?.score ?? null;
          const countAbove = cutoffScore === null ? 0 : finalRanking.filter(p => p.score > cutoffScore).length;
          const candidates = cutoffScore === null ? [] : finalRanking.filter(p => p.score === cutoffScore).map(p => p.id);
          const slotsToFill = Math.max(0, K - countAbove);

          if (cutoffScore !== null && candidates.length > slotsToFill && slotsToFill > 0) {
            // Toujours ex aequo → informer l’hôte, prêt pour une nouvelle question supplémentaire
            r.gameState = 'question_active';
            r.buzzer = { active: false, playerId: null, timestamp: null };
            r.players.forEach(p => {
              const shouldWait = r.tieBreak.candidates.includes(p.id);
              p.status = p.status === 'eliminated' ? 'eliminated' : (shouldWait ? 'waiting' : 'blocked');
            });

            io.to(roomCode).emit('tiebreak-still-tied', {
              stage: r.stage,
              candidates: r.tieBreak.candidates,
              slotsToFill: r.tieBreak.slotsToFill,
              askedCount: r.tieBreak.askedCount,
              maxQuestions: r.tieBreak.maxQuestions,
            });
          } else {
            // Tie-break résolu → clôturer la manche
            const qualified = finalRanking.slice(0, qualifiersCount).map(p => p.id);
            const eliminated = finalRanking.slice(qualifiersCount).map(p => p.id);

            r.players.forEach(p => {
              if (qualified.includes(p.id)) {
                p.status = r.stage === 'finale' ? 'winner' : 'qualified';
              } else {
                p.status = 'eliminated';
              }
            });

            r.tieBreak = null;
            r.gameState = 'finished';

            io.to(roomCode).emit('stage-finished', {
              finalRanking,
              scores: r.scores,
              stage: r.stage,
              qualifiersCount,
              qualified,
              eliminated,
            });

            if (r.stage === 'finale') {
              io.to(roomCode).emit('game-finished', {
                finalRanking,
                scores: r.scores,
                stage: r.stage
              });
            }
          }
        } else {
          // Flux normal: avancer à la prochaine question
          r.currentQuestion++;
          if (r.currentQuestion >= r.questions.length) {
            // Fin de manche (flux normal)
            r.gameState = 'finished';

            const finalRanking = r.players
              .map(pl => ({ ...pl, score: r.scores[pl.id] }))
              .sort((a, b) => b.score - a.score);

            const qualifiersCount = getQualifiersCount(r.stage, r.players.length);
            const K = qualifiersCount;
            const cutoffScore = finalRanking[K - 1]?.score ?? null;
            const countAbove = cutoffScore === null ? 0 : finalRanking.filter(p => p.score > cutoffScore).length;
            const candidates = cutoffScore === null ? [] : finalRanking.filter(p => p.score === cutoffScore).map(p => p.id);
            const slotsToFill = Math.max(0, K - countAbove);

            if (cutoffScore !== null && candidates.length > slotsToFill && slotsToFill > 0) {
              r.tieBreak = {
                isActive: false,
                candidates,
                slotsToFill,
                askedCount: 0,
                maxQuestions: 3,
              };

              io.to(roomCode).emit('tiebreak-ready', {
                stage: r.stage,
                candidates,
                slotsToFill,
              });
            } else {
              const qualified = finalRanking.slice(0, qualifiersCount).map(p => p.id);
              const eliminated = finalRanking.slice(qualifiersCount).map(p => p.id);

              r.players.forEach(p => {
                if (qualified.includes(p.id)) {
                  p.status = r.stage === 'finale' ? 'winner' : 'qualified';
                } else {
                  p.status = 'eliminated';
                }
              });

              io.to(roomCode).emit('stage-finished', {
                finalRanking,
                scores: r.scores,
                stage: r.stage,
                qualifiersCount,
                qualified,
                eliminated,
              });

              if (r.stage === 'finale') {
                io.to(roomCode).emit('game-finished', {
                  finalRanking,
                  scores: r.scores,
                  stage: r.stage
                });
              }
            }

            // Ne pas émettre 'next-question' après une fin de manche.
            // La suite (choix de la nouvelle manche) est contrôlée par l'hôte.


          } else {
            // Passer à la prochaine question dans la manche
            r.gameState = 'question_active';
            r.buzzer = { active: false, playerId: null, timestamp: null };
            r.players.forEach(p => {
              p.status = p.status === 'eliminated' ? 'eliminated' : 'waiting';
            });

            io.to(roomCode).emit('next-question', {
              currentQuestion: r.currentQuestion,
              gameState: r.gameState,
              players: r.players,
              totalQuestions: r.questions.length
            });
          }
        }
      }, 2000);
    } else {
      // Mauvaise réponse: marquer le joueur et réactiver le buzzer pour les autres
      player.status = 'incorrect';

      // Réactiver le buzzer sur la même question
      room.gameState = 'buzzer_active';
      room.buzzer = { active: true, playerId: null, timestamp: null };

      room.players.forEach(p => {
        if (p.id !== player.id) {
          const shouldWait = room.tieBreak?.isActive ? room.tieBreak.candidates.includes(p.id) : true;
          p.status = p.status === 'eliminated' ? 'eliminated' : (shouldWait ? 'waiting' : 'blocked');
        }
      });

      io.to(roomCode).emit('buzzer-activated', {
        gameState: room.gameState,
        currentQuestion: room.tieBreak?.isActive ? null : room.currentQuestion,
        players: room.players,
        isTieBreak: !!room.tieBreak?.isActive,
        tieBreak: room.tieBreak || null,
      });

      console.log(`${player.name} a répondu incorrectement. Réactivation du buzzer dans la salle ${roomCode}`);

      // Relancer le compte à rebours du buzzer
      let buzzerCountdown = 20;
      io.to(roomCode).emit('timer-update', { type: 'buzzer', countdown: buzzerCountdown });

      room.timers.buzzer = setInterval(() => {
        buzzerCountdown--;
        io.to(roomCode).emit('timer-update', { type: 'buzzer', countdown: buzzerCountdown });

        if (buzzerCountdown === 0) {
          clearInterval(room.timers.buzzer);
          if (room.gameState === 'buzzer_active') {
            room.gameState = 'results';
            const q = room.tieBreak?.isActive ? room.tieBreak.question : room.questions[room.currentQuestion];
            io.to(roomCode).emit('answer-result', {
              isTimeout: true,
              question: q,
              scores: room.scores,
              players: room.players,
              gameState: room.gameState,
              isTieBreak: !!room.tieBreak?.isActive,
              tieBreak: room.tieBreak || null,
            });
          }
        }
      }, 1000);
    }
  });

  // Lancer un tie-break côté hôte
  socket.on('host-start-tiebreak', (data) => {
    const { roomCode, maxQuestions } = data || {};
    const room = rooms.get(roomCode);
    if (!room || room.host.id !== socket.id) return;

    if (!room.tieBreak || !room.tieBreak.candidates || room.tieBreak.slotsToFill <= 0) {
      socket.emit('error', { message: 'Aucun tie-break nécessaire.' });
      return;
    }

    // Activer le tie-break
    room.tieBreak.isActive = true;
    if (typeof maxQuestions === 'number' && maxQuestions % 2 === 1) {
      room.tieBreak.maxQuestions = maxQuestions;
    }

    // Choisir une question unique (non posée auparavant)
    const allPools = Object.values(room.stageSets || {}).flat();
    const available = allPools.filter(q => !room.askedQuestionIds.has(q.id));
    if (available.length === 0) {
      socket.emit('error', { message: 'Plus de questions disponibles pour le tie-break.' });
      return;
    }
    const selected = available[Math.floor(Math.random() * available.length)];
    room.tieBreak.question = selected;
    room.currentQuestionValue = Math.random() < 0.5 ? 5 : 10;
    room.askedQuestionIds.add(selected.id);
    room.tieBreak.askedCount = (room.tieBreak.askedCount || 0) + 1;

    // Afficher la question tie-break et activer le buzzer pour les candidats
    room.gameState = 'question_displayed';

    io.to(roomCode).emit('question-displayed', {
      question: selected,
      questionNumber: null,
      totalQuestions: null,
      gameState: room.gameState,
      questionValue: room.currentQuestionValue,
      isTieBreak: true,
      tieBreak: room.tieBreak,
    });

    // Activer le buzzer pour les candidats
    room.gameState = 'buzzer_active';
    room.buzzer = { active: true, playerId: null, timestamp: null };
    room.players.forEach(p => {
      const shouldWait = room.tieBreak.candidates.includes(p.id);
      p.status = p.status === 'eliminated' ? 'eliminated' : (shouldWait ? 'waiting' : 'blocked');
    });

    io.to(roomCode).emit('buzzer-activated', {
      gameState: room.gameState,
      currentQuestion: null,
      players: room.players,
      isTieBreak: true,
      tieBreak: room.tieBreak,
    });

    console.log(`Tie-break lancé: ${room.tieBreak.candidates.length} candidats, ${room.tieBreak.slotsToFill} place(s) à pourvoir.`);

    // Démarrer le compte à rebours du buzzer
    let buzzerCountdown = 20;
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
            question: room.tieBreak.question,
            scores: room.scores,
            players: room.players,
            gameState: room.gameState,
            isTieBreak: true,
            tieBreak: room.tieBreak,
          });
        }
      }
    }, 1000);
  });

  // Question suivante (contrôle hôte)
  socket.on('next-question', (roomCode) => {
    const room = rooms.get(roomCode);
    if (!room || room.host.id !== socket.id) return;

    room.currentQuestion++;
    
    if (room.currentQuestion >= room.questions.length) {
      // Fin de manche
      room.gameState = 'finished';
      
      // Calculer le classement
      const finalRanking = room.players
        .map(player => ({
          ...player,
          score: room.scores[player.id]
        }))
        .sort((a, b) => b.score - a.score);

      const qualifiersCount = getQualifiersCount(room.stage, room.players.length);
      const qualified = finalRanking.slice(0, qualifiersCount).map(p => p.id);
      const eliminated = finalRanking.slice(qualifiersCount).map(p => p.id);

      // Mettre à jour les statuts
      room.players.forEach(p => {
        if (qualified.includes(p.id)) {
          p.status = room.stage === 'finale' ? 'winner' : 'qualified';
        } else {
          p.status = 'eliminated';
        }
      });

      // Émettre un événement de fin de manche avec qualifiés/éliminés
      io.to(roomCode).emit('stage-finished', {
        finalRanking,
        scores: room.scores,
        stage: room.stage,
        qualifiersCount,
        qualified,
        eliminated,
      });

      // En finale, émettre aussi l'événement de fin de jeu
      if (room.stage === 'finale') {
        io.to(roomCode).emit('game-finished', {
          finalRanking,
          scores: room.scores,
          stage: room.stage
        });
      }
    } else {
      room.gameState = 'question_active';
      room.buzzer = {
        active: false,
        playerId: null,
        timestamp: null
      };

      // Réinitialiser les statuts des joueurs (non éliminés)
      room.players.forEach(player => {
        player.status = player.status === 'eliminated' ? 'eliminated' : 'waiting';
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
      } else {
        // Retirer le joueur
        const index = room.players.findIndex(p => p.id === socket.id);
        if (index !== -1) {
          const [removed] = room.players.splice(index, 1);
          delete room.scores[socket.id];
          io.to(roomCode).emit('player-left', { players: room.players, scores: room.scores });
          console.log(`Joueur ${removed?.name || socket.id} quitté la salle ${roomCode}`);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
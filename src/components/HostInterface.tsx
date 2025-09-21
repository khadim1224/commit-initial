import React, { useEffect, useRef } from 'react';
import { Crown, Users, Play, SkipForward, Trophy, AlertCircle } from 'lucide-react';
import { GameState } from '../types/game';

interface HostInterfaceProps {
  gameState: GameState;
  onStartGame: () => void;
  onActivateQuestion: () => void;
  onNextQuestion: () => void;
  onResetGame: () => void;
  onShowQuestionToAll: () => void;
  onHideQuestionFromAll: () => void;
}

export const HostInterface: React.FC<HostInterfaceProps> = ({
  gameState,
  onStartGame,
  onActivateQuestion,
  onNextQuestion,
  onResetGame,
  onShowQuestionToAll,
  onHideQuestionFromAll,
}) => {
  const { room, gameStatus, timers } = gameState;
  const correctAudioRef = useRef<HTMLAudioElement>(null);
  const incorrectAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (room && room.gameState === 'results') {
      const answeredPlayer = room.players.find(p => p.status === 'correct' || p.status === 'incorrect');
      if (answeredPlayer) {
        if (answeredPlayer.status === 'correct') {
          correctAudioRef.current?.play();
        } else {
          incorrectAudioRef.current?.play();
        }
      }
    }
  }, [room]);

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Erreur: Salle introuvable</p>
        </div>
      </div>
    );
  }

  // Lobby - En attente de joueurs
  if (gameStatus === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 p-4">
        <div className="max-w-4xl mx-auto">
          {/* En-tête */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Crown className="w-8 h-8 text-yellow-500" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Salle d'Attente</h1>
                  <p className="text-gray-600">Animé par {room.host.name}</p>
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-mono font-bold text-blue-600 bg-blue-50 px-6 py-2 rounded-xl">
                  {room.code}
                </div>
                <p className="text-sm text-gray-500 mt-1">Code de la salle</p>
              </div>
            </div>
          </div>

          {/* Joueurs connectés */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <Users className="w-6 h-6 text-green-500" />
              <h2 className="text-xl font-semibold text-gray-800">
                Joueurs Connectés ({room.players.length})
              </h2>
            </div>
            
            {room.players.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>En attente de joueurs...</p>
                <p className="text-sm">Partagez le code <strong>{room.code}</strong> avec vos participants</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {room.players.map((player, index) => (
                  <div key={player.id} className="bg-gray-50 rounded-xl p-4 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{player.name}</p>
                      <p className="text-sm text-gray-500">Joueur #{index + 1}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contrôles */}
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onStartGame}
                disabled={room.players.length === 0}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-colors flex items-center justify-center space-x-2"
              >
                <Play className="w-5 h-5" />
                <span>Commencer la Partie</span>
              </button>
              
              <button
                onClick={onResetGame}
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-4 px-6 rounded-xl transition-colors"
              >
                Retour à l'Accueil
              </button>
            </div>
            
            {room.players.length === 0 && (
              <p className="text-center text-sm text-gray-500 mt-3">
                Au moins 1 joueur doit être connecté pour commencer
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Interface de jeu
  if (gameStatus === 'playing') {
    const currentQuestionNumber = room.currentQuestion + 1;
    const totalQuestions = 20;
    const progress = (currentQuestionNumber / totalQuestions) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 p-4">
        <audio ref={correctAudioRef} src="/sounds/correct.mp3" preload="auto" />
        <audio ref={incorrectAudioRef} src="/sounds/incorrect.mp3" preload="auto" />
        <div className="max-w-6xl mx-auto">
          {/* En-tête avec progression */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Crown className="w-8 h-8 text-yellow-500" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Génie en Herbe - Salle {room.code}</h1>
                  <p className="text-gray-600">Question {currentQuestionNumber} sur {totalQuestions}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-800 mb-1">
                  État: {room.gameState === 'waiting' ? 'En attente' :
                         room.gameState === 'question_displayed' ? 'Question affichée' :
                         room.gameState === 'buzzer_active' ? `Buzzer Actif (${timers.buzzer}s)` :
                         room.gameState === 'answering' ? `En cours de réponse (${timers.answer}s)` :
                         room.gameState === 'results' ? 'Résultats' : room.gameState}
                </div>
              </div>
            </div>
            
            {/* Barre de progression */}
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contrôles de jeu */}
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Play className="w-6 h-6 mr-2 text-indigo-500" />
                Contrôles de Jeu
              </h2>

              {(room.gameState === 'question_displayed' || room.gameState === 'results') && room.currentQuestion !== undefined && (
                <div className="bg-gray-100 p-4 rounded-lg mb-4">
                  <p className="text-lg font-semibold">Question :</p>
                  <p>{room.questions[room.currentQuestion].question}</p>
                  {room.gameState === 'results' && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-lg font-semibold">Réponse :</p>
                      <p>{room.questions[room.currentQuestion].options[room.questions[room.currentQuestion].correct]}</p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="space-y-4">
                {(room.gameState === 'waiting' || room.gameState === 'question_active') && (
                  <button
                    onClick={onShowQuestionToAll}
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-4 px-6 rounded-xl transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>Afficher la question</span>
                  </button>
                )}

                {room.gameState === 'question_displayed' && (
                  <>
                    <button
                      onClick={onActivateQuestion}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-xl transition-colors flex items-center justify-center space-x-2"
                    >
                      <Play className="w-5 h-5" />
                      <span>Activer le Buzzer</span>
                    </button>
                    <button
                      onClick={onHideQuestionFromAll}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-6 rounded-xl transition-colors flex items-center justify-center space-x-2"
                    >
                      <span>Masquer la question</span>
                    </button>
                  </>
                )}

                {room.gameState === 'results' && (
                  <button
                    onClick={onNextQuestion}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-6 rounded-xl transition-colors flex items-center justify-center space-x-2"
                  >
                    <SkipForward className="w-5 h-5" />
                    <span>Question Suivante</span>
                  </button>
                )}

                {room.gameState === 'buzzer_active' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                    <div className="animate-pulse">
                      <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                      <p className="font-semibold text-yellow-700">Buzzer Actif!</p>
                      <p className="text-sm text-yellow-600">En attente qu'un joueur appuie sur le buzzer</p>
                    </div>
                  </div>
                )}

                {room.gameState === 'answering' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                    <AlertCircle className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <p className="font-semibold text-blue-700">Réponse en cours</p>
                    <p className="text-sm text-blue-600">Un joueur répond à la question</p>
                  </div>
                )}
              </div>
            </div>

            {/* Classement en temps réel */}
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Trophy className="w-6 h-6 mr-2 text-yellow-500" />
                Classement
              </h2>
              
              <div className="space-y-3">
                {room.players
                  .sort((a, b) => (room.scores[b.id] || 0) - (room.scores[a.id] || 0))
                  .map((player, index) => {
                    const score = room.scores[player.id] || 0;
                    const statusColors = {
                      waiting: 'bg-gray-100 text-gray-600',
                      selected: 'bg-blue-100 text-blue-600 ring-2 ring-blue-300',
                      blocked: 'bg-red-100 text-red-600',
                      correct: 'bg-green-100 text-green-600',
                      incorrect: 'bg-red-100 text-red-600'
                    };
                    
                    return (
                      <div 
                        key={player.id}
                        className={`p-4 rounded-xl flex items-center justify-between transition-all ${statusColors[player.status]}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-lg font-bold">
                            #{index + 1}
                          </div>
                          <div>
                            <p className="font-semibold">{player.name}</p>
                            <p className="text-sm opacity-75">
                              {player.status === 'selected' && 'En train de répondre'}
                              {player.status === 'blocked' && 'Bloqué'}
                              {player.status === 'correct' && 'Réponse correcte'}
                              {player.status === 'incorrect' && 'Réponse incorrecte'}
                              {player.status === 'waiting' && 'En attente'}
                            </p>
                          </div>
                        </div>
                        <div className="text-xl font-bold">
                          {score} pts
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Écran de fin
  if (gameStatus === 'finished') {
    const sortedPlayers = room.players
      .map(player => ({ ...player, score: room.scores[player.id] || 0 }))
      .sort((a, b) => b.score - a.score);

    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Partie Terminée!</h1>
            <p className="text-xl text-gray-600 mb-8">Félicitations aux participants!</p>

            {/* Podium */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">🏆 Classement Final</h2>
              <div className="space-y-4">
                {sortedPlayers.map((player, index) => (
                  <div 
                    key={player.id}
                    className={`p-6 rounded-xl flex items-center justify-between ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-2 border-yellow-300' :
                      index === 1 ? 'bg-gradient-to-r from-gray-100 to-gray-200 border-2 border-gray-300' :
                      index === 2 ? 'bg-gradient-to-r from-orange-100 to-orange-200 border-2 border-orange-300' :
                      'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </div>
                      <div className="text-left">
                        <p className="text-xl font-bold text-gray-800">{player.name}</p>
                        {index === 0 && <p className="text-sm text-yellow-600 font-medium">Champion!</p>}
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                      {player.score} pts
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={onResetGame}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-4 px-8 rounded-xl transition-colors text-lg"
            >
              Nouvelle Partie
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
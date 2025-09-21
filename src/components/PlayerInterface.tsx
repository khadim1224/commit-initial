import React, { useRef } from 'react';
import { Users, Zap, Clock, Trophy, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { GameState } from '../types/game';

interface PlayerInterfaceProps {
  gameState: GameState;
  onPressBuzzer: () => void;
  onSubmitAnswer: (answer: number) => void;
  onResetGame: () => void;
}

export const PlayerInterface: React.FC<PlayerInterfaceProps> = ({
  gameState,
  onPressBuzzer,
  onSubmitAnswer,
  onResetGame
}) => {
  const { room, currentQuestion, showQuestion, userName, gameStatus, timers } = gameState;
  const buzzerAudioRef = useRef<HTMLAudioElement>(null);

  const handleBuzzerPress = () => {
    if (buzzerAudioRef.current) {
      buzzerAudioRef.current.play();
    }
    onPressBuzzer();
  };

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

  const currentPlayer = room.players.find(p => p.name === userName);
  const myScore = currentPlayer ? room.scores[currentPlayer.id] || 0 : 0;

  // Lobby - En attente de joueurs
  if (gameStatus === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 via-yellow-400 to-red-500 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <Users className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Salle {room.code}</h1>
            <p className="text-gray-600 mb-6">Bienvenue {userName}!</p>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <p className="text-green-700 font-medium">✅ Connecté avec succès</p>
              <p className="text-green-600 text-sm mt-1">En attente du début de la partie...</p>
            </div>

            <div className="text-left">
              <h3 className="font-semibold text-gray-800 mb-3">Joueurs connectés ({room.players.length}):</h3>
              <div className="space-y-2">
                {room.players.map((player, index) => (
                  <div key={player.id} className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <span className={`${player.name === userName ? 'font-bold text-blue-600' : 'text-gray-700'}`}>
                      {player.name} {player.name === userName && '(Vous)'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600">
                L'animateur va bientôt commencer la partie. 
                Préparez-vous à tester vos connaissances sur l'histoire du Sénégal!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Interface de jeu
  if (gameStatus === 'playing') {
    const currentQuestionNumber = room.currentQuestion + 1;
    const totalQuestions = 20;
    const myPosition = room.players
      .sort((a, b) => (room.scores[b.id] || 0) - (room.scores[a.id] || 0))
      .findIndex(p => p.name === userName) + 1;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 p-4">
        <div className="max-w-lg mx-auto">
          {/* En-tête joueur */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                {userName.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-2xl font-bold text-gray-800">{userName}</h2>
              <div className="flex justify-center items-center space-x-4 mt-2">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{myScore}</p>
                  <p className="text-sm text-gray-600">Points</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">#{myPosition}</p>
                  <p className="text-sm text-gray-600">Position</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-gray-600">Question {currentQuestionNumber} / {totalQuestions}</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentQuestionNumber / totalQuestions) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Zone de jeu principale */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
            {/* Affichage de la question pour le joueur sélectionné */}
            {showQuestion && currentQuestion && (
              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <span className="font-medium text-blue-700">Votre tour de répondre! ({timers.answer}s)</span>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {currentQuestion.question}
                </h3>
                
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => onSubmitAnswer(index)}
                      className="w-full text-left p-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all"
                    >
                      <span className="font-semibold text-blue-600 mr-3">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {room.gameState === 'question_displayed' && currentQuestion && (
                <div className="mb-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                        <div className="flex items-center space-x-2 mb-2">
                        <Clock className="w-5 h-5 text-blue-500" />
                        <span className="font-medium text-blue-700">Lisez la question et attendez le buzzer!</span>
                        </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        {currentQuestion.question}
                    </h3>
                </div>
            )}

            {/* Bouton Buzzer */}
            {!showQuestion && (
              <div className="text-center">
                {room.gameState === 'buzzer_active' && currentPlayer?.status === 'waiting' && (
                  <div>
                    <audio ref={buzzerAudioRef} src="/sounds/buzzer.mp3" preload="auto"></audio>
                    <button
                      onClick={handleBuzzerPress}
                      className="w-48 h-48 mx-auto bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 transform hover:scale-105 active:scale-95"
                    >
                      <div className="text-center">
                        <Zap className="w-12 h-12 mx-auto mb-2" />
                        <div className="text-2xl font-bold">BUZZER</div>
                        <div className="text-sm">Appuyez!</div>
                      </div>
                    </button>
                    <p className="mt-4 text-gray-600">
                      Temps restant: {timers.buzzer}s
                    </p>
                  </div>
                )}

                {room.gameState === 'question_active' && currentQuestion && (
                  <div className="py-12">
                    <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">En attente de l'activation du buzzer...</p>
                  </div>
                )}

                {currentPlayer?.status === 'selected' && !showQuestion && (
                  <div className="py-12">
                    <div className="animate-pulse">
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <p className="text-green-600 text-lg font-semibold">Vous êtes sélectionné!</p>
                      <p className="text-gray-600">La question va s'afficher...</p>
                    </div>
                  </div>
                )}

                {currentPlayer?.status === 'blocked' && (
                  <div className="py-12">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 text-lg font-semibold">Trop tard!</p>
                    <p className="text-gray-600">Un autre joueur a été plus rapide</p>
                  </div>
                )}

                {room.gameState === 'answering' && currentPlayer?.status === 'waiting' && (
                  <div className="py-12">
                    <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                    <p className="text-yellow-600 text-lg font-semibold">Un joueur répond...</p>
                    <p className="text-gray-600">Attendez le résultat</p>
                  </div>
                )}

                {room.gameState === 'results' && (
                  <div className="py-12">
                    {currentPlayer?.status === 'correct' && (
                      <>
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <p className="text-green-600 text-lg font-semibold">Bonne réponse! +10 points</p>
                      </>
                    )}
                    {currentPlayer?.status === 'incorrect' && (
                      <>
                        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <p className="text-red-600 text-lg font-semibold">Mauvaise réponse... -5 points</p>
                      </>
                    )}
                    {currentPlayer?.status === 'waiting' && (
                      <>
                        <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg">En attente de la question suivante...</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mini classement */}
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
              Top 3
            </h3>
            <div className="space-y-2">
              {room.players
                .sort((a, b) => (room.scores[b.id] || 0) - (room.scores[a.id] || 0))
                .slice(0, 3)
                .map((player, index) => (
                  <div 
                    key={player.id}
                    className={`p-3 rounded-lg flex items-center justify-between ${
                      player.name === userName ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </span>
                      <span className={`font-medium ${player.name === userName ? 'text-blue-600' : 'text-gray-700'}`}>
                        {player.name}
                      </span>
                    </div>
                    <span className="font-bold">
                      {room.scores[player.id] || 0} pts
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Écran de fin
  if (gameStatus === 'finished') {
    const finalRanking = room.players
      .map(player => ({ ...player, score: room.scores[player.id] || 0 }))
      .sort((a, b) => b.score - a.score);
    
    const myFinalPosition = finalRanking.findIndex(p => p.name === userName) + 1;
    const myFinalScore = finalRanking.find(p => p.name === userName)?.score || 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Partie Terminée!</h1>
            
            {/* Résultat personnel */}
            <div className={`p-6 rounded-xl mb-6 ${
              myFinalPosition === 1 ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-2 border-yellow-400' :
              myFinalPosition <= 3 ? 'bg-gradient-to-r from-green-100 to-green-200 border-2 border-green-400' :
              'bg-gray-100 border-2 border-gray-300'
            }`}>
              <div className="text-4xl mb-2">
                {myFinalPosition === 1 ? '🥇' : myFinalPosition === 2 ? '🥈' : myFinalPosition === 3 ? '🥉' : '🏁'}
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                {myFinalPosition === 1 ? 'Félicitations!' : 
                 myFinalPosition <= 3 ? 'Bien joué!' : 'Bonne participation!'}
              </h2>
              <p className="text-lg text-gray-600 mt-2">
                Position: #{myFinalPosition} - Score: {myFinalScore} points
              </p>
            </div>

            {/* Classement complet */}
            <div className="text-left mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">Classement Final</h3>
              <div className="space-y-2">
                {finalRanking.map((player, index) => (
                  <div 
                    key={player.id}
                    className={`p-3 rounded-lg flex items-center justify-between ${
                      player.name === userName ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </span>
                      <span className={`font-medium ${player.name === userName ? 'text-blue-600' : 'text-gray-700'}`}>
                        {player.name} {player.name === userName && '(Vous)'}
                      </span>
                    </div>
                    <span className="font-bold">
                      {player.score} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={onResetGame}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Retour à l'Accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
import React from 'react';
import { Crown, Users, AlertCircle, Eye, CheckCircle2, XCircle, Trophy } from 'lucide-react';
import { GameState, Player } from '../types/game';

interface MonitorInterfaceProps {
  gameState: GameState;
}

export const MonitorInterface: React.FC<MonitorInterfaceProps> = ({ gameState }) => {
  const { room, gameStatus, currentQuestion, showQuestion } = gameState;

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

  const sortedPlayers: Player[] = [...room.players].sort((a, b) => {
    const sa = room.scores[a.id] || 0;
    const sb = room.scores[b.id] || 0;
    return sb - sa;
  });

  const stateLabel = (() => {
    switch (room.gameState) {
      case 'waiting': return "En attente";
      case 'question_displayed': return "Question affichée";
      case 'question_active': return "Question active";
      case 'buzzer_active': return "Buzzer actif";
      case 'answering': return "Réponse en cours";
      case 'results': return "Résultats";
      case 'finished': return "Partie terminée";
      default: return room.gameState;
    }
  })();

  // Écran de fin pour le moniteur
  if (gameStatus === 'finished') {
    const finalRanking = room.players
      .map(p => ({ ...p, score: room.scores[p.id] || 0 }))
      .sort((a, b) => b.score - a.score);

    const qualified = finalRanking.filter(p => p.status === 'qualified' || p.status === 'winner');
    const eliminated = finalRanking.filter(p => p.status === 'eliminated');

    const isFinale = room.stage === 'finale';

    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-6">
              <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-800 mb-1">Manche Terminée</h1>
              <p className="text-gray-600">Manche en cours: <span className="font-semibold capitalize">{room.stage}</span></p>
            </div>

            {isFinale ? (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">🏆 Classement Final</h2>
                <div className="space-y-4">
                  {finalRanking.slice(0, 5).map((player, index) => (
                    <div key={player.id} className={`p-6 rounded-xl flex items-center justify-between ${index === 0 ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-2 border-yellow-300' : index === 1 ? 'bg-gradient-to-r from-gray-100 to-gray-200 border-2 border-gray-300' : index === 2 ? 'bg-gradient-to-r from-orange-100 to-orange-200 border-2 border-orange-300' : 'bg-gray-50'}`}>
                      <div className="flex items-center space-x-4">
                        <div className="text-3xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}</div>
                        <div className="text-left">
                          <p className="text-xl font-bold text-gray-800">{player.name}</p>
                          {index === 0 && <p className="text-sm text-yellow-600 font-medium">Champion!</p>}
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-800">{player.score} pts</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-6 border">
                  <h3 className="text-xl font-semibold text-green-700 mb-4">Joueurs Qualifiés</h3>
                  {qualified.length === 0 ? (
                    <p className="text-gray-500">Aucun joueur qualifié</p>
                  ) : (
                    <div className="space-y-2">
                      {qualified.map((p, idx) => (
                        <div key={p.id} className="p-3 rounded-lg bg-green-50 border border-green-200 flex items-center justify-between">
                          <span className="font-medium text-green-800">#{idx + 1} {p.name}</span>
                          <span className="font-bold text-green-700">{p.score} pts</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-xl p-6 border">
                  <h3 className="text-xl font-semibold text-red-700 mb-4">Joueurs Éliminés</h3>
                  {eliminated.length === 0 ? (
                    <p className="text-gray-500">Aucun joueur éliminé</p>
                  ) : (
                    <div className="space-y-2">
                      {eliminated.map((p, idx) => (
                        <div key={p.id} className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center justify-between">
                          <span className="font-medium text-red-800">#{idx + 1} {p.name}</span>
                          <span className="font-bold text-red-700">{p.score} pts</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <p className="text-sm text-gray-500 text-center mt-6">La manche suivante est contrôlée par l'hôte</p>
          </div>
        </div>
      </div>
    );
  }

  const isResults = room.gameState === 'results';
  // Choisir quelle question afficher: en résultats ou quand affichée par l'hôte
  const questionToShow = currentQuestion 
    || (room.gameState === 'question_displayed' ? room.questions[room.currentQuestion] : null)
    || (isResults ? room.questions[room.currentQuestion] : null);

  const selectedPlayer = room.players.find(p => p.status === 'selected') || null;

  // Libellés complets des manches pour le moniteur
  const formatStageLabel = (stage?: string) => {
    switch (stage) {
      case 'premiere':
        return 'Premiere manche';
      case 'huitiemes':
        return 'Huitiemes de finale';
      case 'demi':
        return 'Demi finale';
      case 'finale':
        return 'Finale';
      default:
        return stage || '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-700 p-4">
      <div className="max-w-6xl mx-auto">
        {/* En-tête */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Eye className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Moniteur de Salle</h1>
                <p className="text-gray-600">Statut: {stateLabel}</p>
                {room.stage && <p className="text-sm text-gray-500">Manche: <span className="font-semibold">{formatStageLabel(room.stage)}</span></p>}
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-mono font-bold text-purple-600 bg-purple-50 px-6 py-2 rounded-xl">{room.code}</div>
              <p className="text-sm text-gray-500 mt-1">Code de la salle</p>
            </div>
          </div>
        </div>

        {room.stage && (
          <div className="flex justify-center mb-6">
            <div className="max-w-3xl w-full text-center px-10 py-6 rounded-3xl border-4 border-orange-500 bg-orange-100 shadow-xl">
              <div className="text-4xl md:text-6xl font-black text-orange-700 uppercase tracking-wide">
                {formatStageLabel(room.stage)}
              </div>
              <div className="text-sm md:text-base text-orange-600 mt-2">Manche en cours</div>
            </div>
          </div>
        )}

        {selectedPlayer && (
          <div className="flex justify-center mb-6">
            <div className="px-6 py-3 rounded-2xl bg-yellow-50 border-2 border-yellow-400 shadow-lg">
              <span className="text-2xl md:text-3xl font-extrabold text-yellow-700 blink-strong">{selectedPlayer.name}</span>
              <span className="ml-3 text-yellow-600 font-semibold">répond à la question</span>
            </div>
          </div>
        )}
        {/* Contenu */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Question en cours */}
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Crown className="w-6 h-6 text-yellow-500" />
              <h2 className="text-xl font-semibold text-gray-800">Question</h2>
            </div>

            {selectedPlayer && (room.gameState === 'answering' || room.gameState === 'buzzer_active') && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-blue-500" />
                  <span className="font-semibold text-blue-700">Joueur ayant buzzé en premier:</span>
                  <span className="font-bold text-blue-900">{selectedPlayer.name}</span>
                </div>
              </div>
            )}

            {questionToShow ? (
              <div>
                <p className="text-gray-800 font-medium mb-4">{questionToShow.question}</p>
                {typeof room.currentQuestionValue === 'number' && (
                  <div className="mt-3">
                    <span className="inline-block px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 font-semibold">
                      Valeur: +{room.currentQuestionValue} pts
                    </span>
                  </div>
                )}
                <div className="space-y-2">
                  {questionToShow.options.map((opt, idx) => {
                    const isCorrect = questionToShow && typeof questionToShow.correct === 'number' && idx === questionToShow.correct;
                    const base = 'px-4 py-3 rounded-xl border flex items-center space-x-2';
                    const cls = isResults
                      ? (isCorrect
                          ? `${base} bg-green-50 border-green-300 text-green-700`
                          : `${base} bg-red-50 border-red-300 text-red-700`)
                      : `${base} bg-gray-50 border-gray-200 text-gray-800`;
                    return (
                      <div key={idx} className={cls}>
                        {isResults && (
                          isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />
                        )}
                        <span>{opt}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-sm text-gray-500 mt-4">Question {room.currentQuestion + 1} sur {room.questions.length}</p>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Aucune question affichée pour le moment</p>
                {room.gameState === 'buzzer_active' && (
                  <p className="text-sm text-gray-400 mt-2">En attente d'un joueur pour répondre...</p>
                )}
              </div>
            )}
          </div>

          {/* Bandeau tie-break (moniteur) */}
          {room.tieBreak && room.tieBreak.slotsToFill > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6">
              <p className="text-purple-800 font-semibold">Égalité détectée</p>
              <p className="text-purple-700">Candidats: {room.tieBreak.candidates.map((id: string) => room.players.find(p => p.id === id)?.name || id).join(', ')}</p>
              <p className="text-purple-700">Ils vont jouer des questions supplémentaires pour être départagés.</p>
            </div>
          )}

          {/* Classement */}
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Users className="w-6 h-6 text-green-500" />
              <h2 className="text-xl font-semibold text-gray-800">Classement</h2>
            </div>

            {sortedPlayers.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>En attente de joueurs...</p>
                <p className="text-sm">Partagez le code <strong>{room.code}</strong> avec vos participants</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedPlayers.map((player, index) => {
                  const score = room.scores[player.id] || 0;
                  const statusLabel =
                    player.status === 'selected' ? 'En train de répondre' :
                    player.status === 'blocked' ? 'Bloqué' :
                    player.status === 'correct' ? 'Réponse correcte' :
                    player.status === 'incorrect' ? 'Réponse incorrecte' :
                    'En attente';
                  const statusCls =
                    player.status === 'selected' ? 'text-blue-600' :
                    player.status === 'blocked' ? 'text-blue-600' :
                    player.status === 'correct' ? 'text-green-600' :
                    player.status === 'incorrect' ? 'text-red-600' :
                    'text-gray-600';
                  // Nouvelle palette de couleurs de carte, alignée sur l'hôte
                  const statusColors: Record<string, string> = {
                    waiting: 'bg-gray-50 text-gray-700',
                    selected: 'bg-blue-100 text-blue-700 ring-2 ring-blue-300',
                    blocked: 'bg-blue-100 text-blue-700',
                    correct: 'bg-green-100 text-green-700',
                    incorrect: 'bg-red-100 text-red-700',
                    qualified: 'bg-green-50 text-green-700 ring-2 ring-green-300',
                    eliminated: 'bg-gray-200 text-gray-500',
                    winner: 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-300',
                  };
                  const colorCls = statusColors[player.status] || 'bg-gray-50 text-gray-700';
                  return (
                    <div key={player.id} className={`rounded-xl p-4 flex items-center justify-between transition-all ${colorCls}`}>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">#{index + 1} {player.name}</p>
                          <p className={`text-sm ${statusCls}`}>{statusLabel}</p>
                        </div>
                      </div>
                      <div className="text-xl font-bold">{score} pts</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
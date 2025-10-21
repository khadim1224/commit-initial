import React, { useState } from 'react';
import { Users, Plus, ArrowRight, Crown, Eye } from 'lucide-react';

interface HomePageProps {
  onCreateRoom: (hostName: string) => void;
  onJoinRoom: (roomCode: string, playerName: string) => void;
  onWatchRoom: (roomCode: string) => void;
  loading: boolean;
  canCreateRoom?: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({ onCreateRoom, onJoinRoom, onWatchRoom, loading, canCreateRoom = true }) => {
  const [mode, setMode] = useState<'select' | 'create' | 'join' | 'watch'>('select');
  const [hostName, setHostName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (hostName.trim()) {
      onCreateRoom(hostName.trim());
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim() && playerName.trim()) {
      onJoinRoom(roomCode.trim(), playerName.trim());
    }
  };

  const handleWatchRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim()) {
      onWatchRoom(roomCode.trim());
    }
  };

  if (mode === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 via-yellow-400 to-red-500 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4 shadow-lg">
              <Crown className="w-10 h-10 text-yellow-600" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Génie en Herbe</h1>
            <p className="text-white/90 text-lg">Quiz sur l'Histoire du Sénégal</p>
          </div>

          <div className="space-y-4">
            {canCreateRoom && (
              <button
                onClick={() => setMode('create')}
                className="w-full bg-white hover:bg-gray-50 text-gray-800 font-semibold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-3"
              >
                <Plus className="w-6 h-6" />
                <span>Créer une Salle</span>
              </button>
            )}

            {!canCreateRoom && (
              <div className="w-full bg-white/20 text-white font-medium py-3 px-4 rounded-xl backdrop-blur-sm border border-white/20 text-center">
                Une salle est déjà active. Rejoignez-la ou regardez la partie.
              </div>
            )}

            <button
              onClick={() => setMode('join')}
              className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-4 px-6 rounded-xl backdrop-blur-sm border border-white/20 transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-3"
            >
              <Users className="w-6 h-6" />
              <span>Rejoindre une Salle</span>
            </button>

            <button
              onClick={() => setMode('watch')}
              className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-4 px-6 rounded-xl backdrop-blur-sm border border-white/20 transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-3"
            >
              <Eye className="w-6 h-6" />
              <span>Regarder le jeu</span>
            </button>
          </div>

          <div className="mt-8 text-center text-white/70 text-sm">
            <p>Testez vos connaissances sur l'histoire sénégalaise</p>
            <p>avec vos amis en temps réel!</p>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 via-yellow-400 to-red-500 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-6">
              <Crown className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800">Créer une Salle</h2>
              <p className="text-gray-600">Devenez l'animateur de la partie</p>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Votre nom d'animateur
                </label>
                <input
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all"
                  placeholder="Entrez votre nom"
                  required
                  disabled={loading}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setMode('select')}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-xl transition-colors"
                  disabled={loading}
                >
                  Retour
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                  disabled={loading || !hostName.trim()}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Créer</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'watch') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 via-yellow-400 to-red-500 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-6">
              <Eye className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800">Regarder une Salle</h2>
              <p className="text-gray-600">Suivez la partie en temps réel</p>
            </div>

            <form onSubmit={handleWatchRoom} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code de la salle
                </label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-center text-2xl font-mono"
                  placeholder="ABC123"
                  maxLength={6}
                  required
                  disabled={loading}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setMode('select')}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-xl transition-colors"
                  disabled={loading}
                >
                  Retour
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                  disabled={loading || !roomCode.trim()}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Regarder</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 via-yellow-400 to-red-500 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <Users className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800">Rejoindre une Salle</h2>
            <p className="text-gray-600">Participez à une partie en cours</p>
          </div>

          <form onSubmit={handleJoinRoom} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code de la salle
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-center text-2xl font-mono"
                placeholder="ABC123"
                maxLength={6}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Votre nom de joueur
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                placeholder="Entrez votre nom"
                required
                disabled={loading}
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setMode('select')}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-xl transition-colors"
                disabled={loading}
              >
                Retour
              </button>
              <button
                type="submit"
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                disabled={loading || !roomCode.trim() || !playerName.trim()}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Rejoindre</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
import React from 'react';
import { SocketProvider } from './contexts/SocketContext';
import { useGame } from './hooks/useGame';
import { HomePage } from './components/HomePage';
import { HostInterface } from './components/HostInterface';
import { PlayerInterface } from './components/PlayerInterface';
import { ErrorMessage } from './components/ErrorMessage';
import { LandingPage } from './components/LandingPage';

const GameApp: React.FC = () => {
  const {
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
  } = useGame();

  const [showLanding, setShowLanding] = React.useState(true);

  if (showLanding) {
    return <LandingPage onStart={() => setShowLanding(false)} />;
  }

  return (
    <>
      <ErrorMessage message={error} onClose={clearError} />
      
      {gameState.gameStatus === 'menu' && (
        <HomePage
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          loading={loading}
        />
      )}

      {gameState.role === 'host' && (gameState.gameStatus === 'lobby' || gameState.gameStatus === 'playing' || gameState.gameStatus === 'finished') && (
        <HostInterface
          gameState={gameState}
          onStartGame={startGame}
          onActivateQuestion={activateQuestion}
          onNextQuestion={nextQuestion}
          onResetGame={resetGame}
          onShowQuestionToAll={showQuestionToAll}
          onHideQuestionFromAll={hideQuestionFromAll}
        />
      )}

      {gameState.role === 'player' && (gameState.gameStatus === 'lobby' || gameState.gameStatus === 'playing' || gameState.gameStatus === 'finished') && (
        <PlayerInterface
          gameState={gameState}
          onPressBuzzer={pressBuzzer}
          onSubmitAnswer={submitAnswer}
          onResetGame={resetGame}
        />
      )}
    </>
  );
};

function App() {
  return (
    <SocketProvider>
      <GameApp />
    </SocketProvider>
  );
}

export default App;
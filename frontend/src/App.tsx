import { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
import { generateEquations, type Equation } from './gameLogic';
import Bubble from './components/Bubble';
import Timer from './components/Timer';
import HomeScreen from './components/HomeScreen';
import GameSummary from './components/GameSummary';
import LoadingScreen from './components/LoadingScreen';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { io, Socket } from 'socket.io-client';
import type { Player } from './types';

// Initialize socket outside component to prevent multiple connections
const socket: Socket = io('http://localhost:3000', {
  autoConnect: false // Connect only when needed or on mount if preferred
});

function App() {
  // Connection State
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const [gameState, setGameState] = useState<'home' | 'playing' | 'summary'>('home');
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [equations, setEquations] = useState<Equation[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [wrongAttempts, setWrongAttempts] = useState(0); // Missed/Time-outs
  const [wrongSelections, setWrongSelections] = useState(0); // Incorrect answers
  const [feedbackStatus, setFeedbackStatus] = useState<'neutral' | 'correct' | 'wrong'>('neutral');
  const [isTourActive, setIsTourActive] = useState(false);

  // Socket State
  const [livePlayers, setLivePlayers] = useState<Player[]>([]);
  const [allTimeLeaderboard, setAllTimeLeaderboard] = useState<Player[]>([]);
  const [onlineCount, setOnlineCount] = useState(0); // All connected sockets
  const [playerName, setPlayerName] = useState('');
  const [userId, setUserId] = useState('');

  const driverObj = useRef<any>(null);

  // Socket Connection and Event Listeners
  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      console.log('Connected to server');
      setConnectionState('connected');
      setConnectionError(null);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      // Only show error if not intentionally disconnected
      if (gameState !== 'home') {
        setConnectionError('Lost connection to server. Trying to reconnect...');
      }
    });

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err.message);
      setConnectionState('error');
      setConnectionError('Cannot connect to server. Please check your internet connection.');
    });

    socket.on('players_update', (players: Player[]) => {
      setLivePlayers(players);
    });

    socket.on('leaderboard_data', (players: Player[]) => {
      setAllTimeLeaderboard(players);
    });

    socket.on('online_count', (count: number) => {
      setOnlineCount(count);
    });

    // Handle Join Responses
    socket.on('join_success', ({ userId, name }) => {
      setPlayerName(name);
      setUserId(userId);
      setGameState('playing');
      setScore(0);
      setLevel(1);
      setWrongAttempts(0);
      setWrongSelections(0);
      startLevel(1);

      // Check for first time user
      const hasSeenTour = localStorage.getItem('hasSeenTour');
      if (!hasSeenTour) {
        setIsTourActive(true);
      }
    });

    socket.on('join_error', (msg: string) => {
      setConnectionError(msg);
      // Clear error after 5 seconds
      setTimeout(() => setConnectionError(null), 5000);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('players_update');
      socket.off('leaderboard_data');
      socket.off('online_count');
      socket.off('join_success');
      socket.off('join_error');
      socket.disconnect();
    };
  }, []);

  const handleRequestLeaderboard = () => {
    socket.emit('request_leaderboard');
  };

  // Sync Score with Server
  useEffect(() => {
    if (gameState === 'playing' || gameState === 'summary') {
      socket.emit('update_score', { score });
    }
  }, [score, gameState]);


  // Start new level
  const startLevel = useCallback((currentLevel: number) => {
    setEquations(generateEquations(currentLevel));
    setSelectedIds([]);
    setTimeLeft(15);
    setFeedbackStatus('neutral');
  }, []);

  const startGame = (name: string, userId: string, previousUserId: string | null) => {
    // Join game on server - Wait for 'join_success' to start
    socket.emit('join_game', { name, userId, previousUserId });
  };

  useEffect(() => {
    if (isTourActive && gameState === 'playing') {
      const timer = setTimeout(() => {
        startTour();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isTourActive, gameState]);

  const startTour = () => {
    driverObj.current = driver({
      showProgress: true,
      steps: [
        { element: '.status-bar', popover: { title: 'Game Info', description: 'Level, Score, and Misses.' } },
        { element: '.timer-container', popover: { title: 'Timer', description: 'Solve before time runs out!' } },
        { element: '.bubbles-container', popover: { title: 'Bubbles', description: 'Select 3 bubbles in INCREASING numeric order.' } },
        { element: '.stop-button', popover: { title: 'Stop', description: 'Click here to end the game anytime.' } },
      ],
      onDestroyStarted: () => {
        if (!driverObj.current.hasNextStep() || confirm("Skip the tour?")) {
          driverObj.current.destroy();
          endTour();
        }
      },
    });
    driverObj.current.drive();
  };

  const endTour = () => {
    setIsTourActive(false);
    localStorage.setItem('hasSeenTour', 'true');
  };

  const handleTimeUp = () => {
    setWrongAttempts(prev => prev + 1);
    setFeedbackStatus('wrong');
    setScore(prev => Math.max(0, prev - 5)); // Penalty for time up
    setTimeout(() => {
      startLevel(level);
    }, 1000);
  };

  const handleStopGame = () => {
    setGameState('summary');
  };

  const handlePlayAgain = () => {
    // When playing again, we are the proper owner of the ID
    startGame(playerName, userId, userId);
  };

  const handleGoHome = () => {
    setGameState('home');
  };

  // Timer logic
  useEffect(() => {
    if (gameState !== 'playing' || isTourActive) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [gameState, isTourActive, level, equations]);

  // Handle bubble click
  const handleBubbleClick = (id: string) => {
    if (gameState !== 'playing' || feedbackStatus !== 'neutral' || isTourActive) return;

    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
      return;
    }

    const newSelected = [...selectedIds, id];
    setSelectedIds(newSelected);

    if (newSelected.length === 3) {
      validateSelection(newSelected);
    }
  };

  const validateSelection = (selected: string[]) => {
    const selectedValues = selected.map(id => equations.find(e => e.id === id)?.value || 0);
    const isCorrect = selectedValues[0] <= selectedValues[1] && selectedValues[1] <= selectedValues[2];

    if (isCorrect) {
      setFeedbackStatus('correct');
      setScore(prev => prev + (level * 10) + Math.floor(timeLeft));
      setTimeout(() => {
        setLevel(prev => prev + 1);
        startLevel(level + 1);
      }, 1000);
    } else {
      setFeedbackStatus('wrong');
      setWrongSelections(prev => prev + 1); // Track wrong clicks
      setScore(prev => Math.max(0, prev - 10)); // PENALTY for wrong answer
      setTimeout(() => {
        setFeedbackStatus('neutral');
        setSelectedIds([]);
      }, 500);
    }
  };

  // Render Logic

  const handleRetryConnection = () => {
    setConnectionState('connecting');
    setConnectionError(null);
    socket.connect();
  };

  // Show loading screen while connecting
  if (connectionState === 'connecting') {
    return (
      <LoadingScreen
        message="Connecting to server..."
        subMessage="This may take up to 30 seconds on free tier"
        showMyths={true}
      />
    );
  }

  // Show error screen if connection failed
  if (connectionState === 'error') {
    return (
      <LoadingScreen
        message="Connection Failed"
        subMessage={connectionError || "Could not connect to the server."}
        showMyths={false}
        isError={true}
        onRetry={handleRetryConnection}
      />
    );
  }

  if (gameState === 'home') {
    return (
      <>
        {connectionError && (
          <div className="error-toast">
            {connectionError}
          </div>
        )}
        <HomeScreen
          onStartGame={startGame}
          livePlayers={livePlayers}
          allTimeLeaderboard={allTimeLeaderboard}
          onlineCount={onlineCount}
          onRequestLeaderboard={handleRequestLeaderboard}
        />
      </>
    );
  }

  // NOTE: When gameState is 'summary', we still render the game background but show the summary overlay
  // This looks nice as the game freezes behind the modal.

  return (
    <div className="game-container fade-in">
      <div className="status-bar glass-effect">
        <div className="score-board">
          <div className="stat-item"><span>Level</span> {level}</div>
          <div className="stat-item"><span>Score</span> {score}</div>
          <div className="stat-item missed"><span>Missed</span> {wrongAttempts}</div>
        </div>
        <div className="controls">
          <div className="timer-container-wrapper">
            <Timer timeLeft={timeLeft} totalTime={15} size={50} strokeWidth={4} />
          </div>
          <button className="stop-button" onClick={handleStopGame}>STOP</button>
        </div>
      </div>

      <div className={`game-box glass-effect ${feedbackStatus === 'wrong' ? 'shake' : ''}`}>
        <div className="bubbles-container">
          {equations.map((eq) => (
            <Bubble
              key={eq.id}
              equation={eq}
              onClick={handleBubbleClick}
              isSelected={selectedIds.includes(eq.id)}
              order={selectedIds.indexOf(eq.id) + 1}
              status={
                selectedIds.length === 3 && selectedIds.includes(eq.id)
                  ? feedbackStatus
                  : 'neutral'
              }
            />
          ))}
        </div>
      </div>

      {gameState === 'summary' && (
        <GameSummary
          score={score}
          level={level}
          wrongAttempts={wrongAttempts}
          wrongSelections={wrongSelections}
          livePlayers={livePlayers}
          onPlayAgain={handlePlayAgain}
          onHome={handleGoHome}
        />
      )}

      <footer className="game-footer">
        Playing as <strong>{playerName}</strong>
        <button
          onClick={() => {
            localStorage.removeItem('hasSeenTour');
            setIsTourActive(true);
          }}
          className="reset-tour-btn"
        >
          Help
        </button>
      </footer>
    </div>
  );
}

export default App;

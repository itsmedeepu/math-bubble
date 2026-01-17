import React from 'react';
import type { Player } from '../types';
import './GameSummary.css';

interface GameSummaryProps {
    score: number;
    level: number;
    wrongAttempts: number; // Missed (time up)
    wrongSelections: number; // Wrong clicks
    livePlayers: Player[];
    onPlayAgain: () => void;
    onHome: () => void;
}

const GameSummary: React.FC<GameSummaryProps> = ({
    score,
    level,
    wrongAttempts,
    wrongSelections,
    livePlayers,
    onPlayAgain,
    onHome
}) => {
    // Sort players by score
    const sortedPlayers = [...livePlayers].sort((a, b) => b.score - a.score);

    return (
        <div className="summary-overlay fade-in">
            <div className="summary-card glass-effect">
                <header className="summary-header">
                    <h2>Game Stopped</h2>
                    <p className="final-score">Final Score: <span>{score}</span></p>
                </header>

                <div className="stats-grid">
                    <div className="stat-box">
                        <span className="label">Level</span>
                        <span className="value">{level}</span>
                    </div>
                    <div className="stat-box missed">
                        <span className="label">Missed</span>
                        <span className="value">{wrongAttempts}</span>
                    </div>
                    <div className="stat-box wrong">
                        <span className="label">Wrong</span>
                        <span className="value">{wrongSelections}</span>
                    </div>
                </div>

                <div className="summary-leaderboard">
                    <h3>🏆 Live Leaderboard</h3>
                    <div className="leaderboard-list custom-scroll">
                        {sortedPlayers.map((p, index) => (
                            <div key={p.id} className="player-row small">
                                <span className="rank">#{index + 1}</span>
                                <span className="p-name">{p.name}</span>
                                <span className="p-score">{p.score}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="summary-actions">
                    <button onClick={onHome} className="secondary-btn">Home</button>
                    <button onClick={onPlayAgain} className="primary-btn">Play Again</button>
                </div>
            </div>
        </div>
    );
};

export default GameSummary;

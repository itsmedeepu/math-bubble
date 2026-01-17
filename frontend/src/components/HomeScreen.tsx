import React, { useState, useEffect } from 'react';
import type { Player } from '../types';
import './HomeScreen.css';

interface HomeScreenProps {
    onStartGame: (name: string, userId: string, previousUserId: string | null) => void;
    livePlayers: Player[];
    allTimeLeaderboard: Player[];
    onlineCount: number;
    onRequestLeaderboard: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onStartGame, livePlayers, allTimeLeaderboard, onlineCount, onRequestLeaderboard }) => {
    const [name, setName] = useState('');
    const [userId, setUserId] = useState('');
    const [previousUserId, setPreviousUserId] = useState<string | null>(null);
    const [nameError, setNameError] = useState('');
    const [idError, setIdError] = useState('');
    const [showAllStats, setShowAllStats] = useState(false);

    useEffect(() => {
        // Auto-fill name if previously saved
        const savedName = localStorage.getItem('bubbleGameName');
        const savedUserId = localStorage.getItem('bubbleGameUserId');
        if (savedName) setName(savedName);
        if (savedUserId) {
            setUserId(savedUserId);
            setPreviousUserId(savedUserId); // Remember who we were
        }
    }, []);

    const validateUserId = (id: string) => {
        const regex = /^[a-zA-Z0-9]+$/;
        if (!regex.test(id)) return "Only alphanumeric characters allowed";
        if (id.length < 5) return "Must be at least 5 characters long";
        return "";
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setNameError('');
        setIdError('');

        let hasError = false;

        if (!name.trim()) {
            setNameError('Please enter your name');
            hasError = true;
        }

        const idValidationMsg = validateUserId(userId);
        if (idValidationMsg) {
            setIdError(idValidationMsg);
            hasError = true;
        }

        if (hasError) return;

        localStorage.setItem('bubbleGameName', name.trim());
        localStorage.setItem('bubbleGameUserId', userId.trim());

        onStartGame(name.trim(), userId.trim(), previousUserId);
    };

    const openLeaderboard = () => {
        onRequestLeaderboard();
        setShowAllStats(true);
    };

    return (
        <div className="home-container fade-in">
            <div className="content-wrapper">
                <header className="home-header">
                    <h1>Math Bubbles</h1>
                    <p className="subtitle">Pop bubbles in order, race the clock!</p>
                </header>

                <main className="home-main">
                    <div className="card glass-effect actions-card">
                        <h2>Welcome, Player!</h2>
                        <form onSubmit={handleSubmit} className="start-form">
                            <div className="input-group">
                                <div className="input-container">
                                    <input
                                        type="text"
                                        placeholder="Display Name"
                                        value={name}
                                        onChange={(e) => {
                                            setName(e.target.value);
                                            setNameError('');
                                        }}
                                        maxLength={15}
                                    />
                                    {nameError && <span className="error-msg">{nameError}</span>}
                                </div>

                                <div className="input-container">
                                    <div className="input-with-prefix">
                                        <span className="prefix">@</span>
                                        <input
                                            type="text"
                                            className="userid-input"
                                            placeholder="username"
                                            value={userId}
                                            onChange={(e) => {
                                                setUserId(e.target.value);
                                                setIdError('');
                                            }}
                                            maxLength={20}
                                        />
                                    </div>
                                    {idError ? <span className="error-msg">{idError}</span> :
                                        <span className="error-msg" style={{ color: 'rgba(255,255,255,0.3)' }}>5+ alphanumeric chars</span>}
                                </div>
                            </div>
                            <button type="submit" className="pro-btn play-btn">
                                PLAY NOW
                            </button>
                        </form>
                    </div>

                    <div className="card glass-effect leaderboard-card">
                        <div className="card-header">
                            <h2>Live Players</h2>
                            <div className="live-indicator">
                                <span className="blink-dot"></span> {onlineCount} Online
                            </div>
                        </div>
                        <div className="players-list custom-scroll">
                            {livePlayers.length === 0 ? (
                                <div className="empty-state">No players online. Be first!</div>
                            ) : (
                                livePlayers.map((p) => (
                                    <div key={p.socketId || p.userId} className="player-row">
                                        <div className="player-info">
                                            <div className="avatar">{p.name.charAt(0).toUpperCase()}</div>
                                            <span className="player-name">{p.name}</span>
                                        </div>
                                        <span className="player-score">{p.score} pts</span>
                                    </div>
                                ))
                            )}
                        </div>
                        <button onClick={openLeaderboard} className="view-all-btn">
                            View Global Leaderboard
                        </button>
                    </div>
                </main>

                <section className="instructions glass-effect">
                    <h3>How to Play</h3>
                    <div className="rules-grid">
                        <div className="rule-item">🔢 Select 3 bubbles</div>
                        <div className="rule-item">📈 Smallest to largest</div>
                        <div className="rule-item">⏱️ 15 sec per round</div>
                        <div className="rule-item">❌ Wrong = -10 pts</div>
                    </div>
                </section>

                <footer>
                    Made with ❤️ for Math Lovers | Designed by <strong>Deepak S</strong>
                </footer>
            </div>

            {/* All Stats Modal */}
            {showAllStats && (
                <div className="modal-overlay" onClick={() => setShowAllStats(false)}>
                    <div className="modal-content glass-effect" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Global Leaderboard</h2>
                            <button className="close-btn" onClick={() => setShowAllStats(false)}>×</button>
                        </div>
                        <div className="leaderboard-full-list custom-scroll">
                            {allTimeLeaderboard.length === 0 ? (
                                <div className="loading-state">
                                    <div className="mini-spinner"></div>
                                    <p>Loading leaderboard...</p>
                                </div>
                            ) : (
                                allTimeLeaderboard.map((p, index) => (
                                    <div key={p.id || p.userId || index} className="player-row">
                                        <div className="player-info">
                                            <div className="rank-badge">#{index + 1}</div>
                                            <span className="player-name">{p.name}</span>
                                        </div>
                                        <span className="player-score">{p.score} pts</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomeScreen;

import React, { useState, useEffect } from 'react';
import './LoadingScreen.css';

const mathMyths = [
    "Did you know? Zero was invented in India around the 5th century!",
    "Myth busted: You don't need to be a 'math person' - practice makes perfect!",
    "Fun fact: A googol is 1 followed by 100 zeros!",
    "Did you know? The word 'algebra' comes from Arabic 'al-jabr'!",
    "Myth busted: There's no such thing as being 'too old' to learn math!",
    "Fun fact: Pi has been calculated to over 100 trillion digits!",
    "Did you know? The equals sign (=) was invented in 1557!",
    "Myth busted: Math anxiety is real, but beatable!",
    "Fun fact: Every odd number has an 'e' in it!",
    "Did you know? 111,111,111 × 111,111,111 = 12345678987654321!",
    "Fun fact: The number 4 is considered unlucky in many Asian cultures!",
    "Did you know? A 'jiffy' is an actual unit of time: 1/100th of a second!",
    "Tip: Taking breaks while studying math improves retention!",
    "Fun fact: There are 80,658,175,170,943,878,571,660,636,856,403,766,975,289,505,440,883,277,824,000,000,000,000 ways to shuffle a deck of cards!"
];

interface LoadingScreenProps {
    message?: string;
    subMessage?: string;
    showMyths?: boolean;
    isError?: boolean;
    onRetry?: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
    message = "Connecting to server...",
    subMessage,
    showMyths = true,
    isError = false,
    onRetry
}) => {
    const [mythIndex, setMythIndex] = useState(() => Math.floor(Math.random() * mathMyths.length));

    useEffect(() => {
        if (!showMyths || isError) return;
        const interval = setInterval(() => {
            setMythIndex(prev => (prev + 1) % mathMyths.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [showMyths, isError]);

    return (
        <div className="loading-screen">
            <div className="loading-content glass-effect">
                <h1 className="loading-title">Math Bubbles</h1>

                {!isError && <div className="spinner"></div>}
                {isError && <div className="error-icon">⚠️</div>}

                <h2 className={isError ? 'error-message' : ''}>{message}</h2>

                {subMessage && (
                    <p className="sub-message">{subMessage}</p>
                )}

                {isError && onRetry && (
                    <button className="retry-btn" onClick={onRetry}>
                        Try Again
                    </button>
                )}

                {showMyths && !isError && (
                    <div className="myth-container">
                        <p className="myth-text">{mathMyths[mythIndex]}</p>
                    </div>
                )}

                <p className="loading-footer">Waking up server... This may take a moment on free tier.</p>
            </div>
        </div>
    );
};

export default LoadingScreen;

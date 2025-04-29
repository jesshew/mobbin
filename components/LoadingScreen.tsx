import React, { useState, useEffect } from 'react';

interface LoadingScreenProps {
  messages: string[];
  onLoadingComplete: () => void;
  forceComplete?: boolean; // Optional prop to signal early completion
}

const TYPING_SPEED_MS = 25; // Faster typing
const MESSAGE_DELAY_MS = 800; // Faster delay between messages

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ messages, onLoadingComplete, forceComplete = false }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [charIndex, setCharIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    // Cursor blinking effect
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    return () => clearInterval(cursorInterval);
  }, []);

  useEffect(() => {
    // Check for forced completion first - this is now the ONLY way to complete
    if (forceComplete) {
        onLoadingComplete();
        return;
    }

    // If all messages are typed, just stop the typing process
    // Do NOT call onLoadingComplete here anymore
    if (currentMessageIndex >= messages.length) {
      // Stop cursor blinking maybe? Or just let it run.
      // We don't set a timer to call onLoadingComplete.
      return;
    }

    const currentMessage = messages[currentMessageIndex];

    if (charIndex < currentMessage.length) {
      // Typing effect for the current message
      const typingTimer = setTimeout(() => {
        setDisplayedText(prev => prev + currentMessage[charIndex]);
        setCharIndex(prev => prev + 1);
      }, TYPING_SPEED_MS);
      return () => clearTimeout(typingTimer);
    } else {
      // Message finished typing, wait then move to next message
      const messageDelayTimer = setTimeout(() => {
        setCurrentMessageIndex(prev => prev + 1);
        setCharIndex(0);
        setDisplayedText(''); // Reset for the next message
      }, MESSAGE_DELAY_MS);
      return () => clearTimeout(messageDelayTimer);
    }
    // Add forceComplete to dependency array to react immediately
  }, [currentMessageIndex, charIndex, messages, onLoadingComplete, forceComplete]);

  return (
    <div className="flex flex-col items-center justify-center h-64 font-mono text-lg text-muted-foreground">
      <div className="flex items-center">
         <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary mr-3"></div>
         <span>{displayedText}</span>
         {showCursor && <span className="animate-pulse">_</span>}
      </div>
       {/* Optionally display the full current message dimmed below
       currentMessageIndex < messages.length && (
         <p className="mt-2 text-sm text-muted-foreground/50">{messages[currentMessageIndex]}</p>
       )*/}
    </div>
  );
};
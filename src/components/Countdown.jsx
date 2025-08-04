import { useEffect, useState } from 'react';
import { Clock3 } from 'lucide-react';

const COUNTDOWN_VALUES = [3, 5, 10];

const Countdown = ({ onReady }) => {
  const [modeIndex, setModeIndex] = useState(-1); // -1 = off
  const [timeLeft, setTimeLeft] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const currentSeconds = COUNTDOWN_VALUES[modeIndex] || null;

  useEffect(() => {
    if (!isRunning || timeLeft === null) return;

    if (timeLeft === 0) {
      setIsRunning(false);
      setTimeLeft(null);
      onReady?.();
      return;
    }

    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [isRunning, timeLeft, onReady]);

  const cycleMode = () => {
    if (isRunning) return; // prevent changing while running
    const next = (modeIndex + 1) % (COUNTDOWN_VALUES.length + 1);
    setModeIndex(next === COUNTDOWN_VALUES.length ? -1 : next);
  };

  const startCountdown = (callback) => {
    if (modeIndex === -1 || isRunning) {
      callback?.();
      return;
    }
    setTimeLeft(currentSeconds);
    setIsRunning(true);
    onReady.current = callback;
  };

  return (
    <button
      onClick={cycleMode}
      disabled={isRunning}
      className={`w-12 h-12 rounded-full flex items-center justify-center border font-body relative transition
        border-black dark:border-white
        ${isRunning ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'}`}
      title="Cycle Timer Mode"
    >
      {modeIndex === -1 ? (
        <Clock3 className="w-5 h-5" />
      ) : (
        <span className="text-sm">{COUNTDOWN_VALUES[modeIndex]}s</span>
      )}
    </button>
  );
};

export default Countdown;

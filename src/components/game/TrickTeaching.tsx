import React, { useState, useEffect, useRef, useCallback } from 'react';
import { animated, useSpring } from '@react-spring/web';
import { 
  Play, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Target, 
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  RotateCw,
  MousePointer,
  Activity,
  BookOpen,
  RefreshCw
} from 'react-feather';
import { useSlideIn, useFadeIn } from '../../hooks/useAnimation';
import { useSound } from '../../hooks/useAudio';
import Button from '../ui/Button';
import { Animal } from '../../game/Animal';
import { TeachingPhase, TrickGesture, getTrickById } from '../../data/tricks';
import { trickSystem, TrickLearningProgress, TrickAttempt } from '../../game/TrickSystem';

interface TrickTeachingProps {
  animal: Animal;
  trickId: string;
  onComplete: (success: boolean) => void;
  onClose: () => void;
  isVisible: boolean;
}


interface VisualCue {
  type: 'tap' | 'swipe' | 'hold' | 'circle';
  direction?: string | undefined;
  duration?: number | undefined;
  active: boolean;
  success?: boolean;
}

export const TrickTeaching: React.FC<TrickTeachingProps> = ({
  animal,
  trickId,
  onComplete,
  onClose,
  isVisible
}) => {
  const [currentPhase, setCurrentPhase] = useState<TeachingPhase | null>(null);
  const [progress, setProgress] = useState<TrickLearningProgress | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [visualCue, setVisualCue] = useState<VisualCue | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [attempts, setAttempts] = useState<TrickAttempt[]>([]);
  const [showInstructions, setShowInstructions] = useState(true);
  const [countdownActive, setCountdownActive] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [gestureArea, setGestureArea] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const gestureAreaRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const holdTimerRef = useRef<number | null>(null);

  const trick = getTrickById(trickId);

  // Animations
  const interfaceAnimation = useSlideIn(isVisible, 'up');
  const gestureAreaAnimation = useSpring({
    transform: isActive ? 'scale(1.02)' : 'scale(1)',
    boxShadow: isActive ? '0 0 20px rgba(59, 130, 246, 0.5)' : '0 0 0px rgba(59, 130, 246, 0)'
  });
  const progressAnimation = useSpring({
    width: `${(progress?.phaseProgress || 0) * 100}%`,
    config: { tension: 200, friction: 25 }
  });
  const feedbackAnimation = useFadeIn(!!feedback);
  const instructionsAnimation = useSlideIn(showInstructions, 'down');

  // Audio
  const { playSuccess, playError, playButtonClick } = useSound();

  // Initialize learning session
  useEffect(() => {
    if (isVisible && trick) {
      const result = trickSystem.startLearningTrick(animal, trickId);
      if (result.success) {
        updateProgress();
      }
    }
  }, [isVisible, animal, trickId, trick]);

  // Update progress and current phase
  const updateProgress = useCallback(() => {
    const learningProgress = trickSystem.getLearningProgress(animal.id, trickId);
    setProgress(learningProgress);
    
    if (learningProgress && trick) {
      const phase = trick.teachingPhases.find(p => p.id === learningProgress.currentPhase);
      setCurrentPhase(phase || null);
    }
  }, [animal.id, trickId, trick]);

  // Setup gesture area
  useEffect(() => {
    if (gestureAreaRef.current) {
      const rect = gestureAreaRef.current.getBoundingClientRect();
      setGestureArea({
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      });
    }
  }, [isVisible]);

  // Start teaching session
  const startTeaching = () => {
    if (!currentPhase) return;
    
    setShowInstructions(false);
    setCountdownActive(true);
    setCountdown(3);
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setCountdownActive(false);
          setIsActive(true);
          showGestureCue();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Show visual cue for expected gesture
  const showGestureCue = () => {
    if (!currentPhase?.gestures[0]) return;
    
    const gesture = currentPhase.gestures[0];
    const cue: VisualCue = {
      type: gesture.type as any,
      direction: gesture.direction || undefined,
      duration: gesture.duration || undefined,
      active: true
    };
    
    setVisualCue(cue);
    playButtonClick();
  };

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isActive || !currentPhase) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;
    
    touchStartRef.current = {
      x: touch.clientX - gestureArea.x,
      y: touch.clientY - gestureArea.y,
      time: Date.now()
    };

    // Handle hold gestures
    if (currentPhase.gestures[0]?.type === 'hold') {
      holdTimerRef.current = setTimeout(() => {
        handleGestureComplete('hold', undefined, Date.now() - touchStartRef.current!.time);
      }, currentPhase.gestures[0].duration || 1000);
    }
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isActive || !touchStartRef.current || !currentPhase) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;
    
    const currentX = touch.clientX - gestureArea.x;
    const currentY = touch.clientY - gestureArea.y;
    
    const deltaX = currentX - touchStartRef.current.x;
    const deltaY = currentY - touchStartRef.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Check for swipe gestures
    if (distance > 50) {
      let direction: string;
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }
      
      if (currentPhase.gestures[0]?.type === 'swipe') {
        handleGestureComplete('swipe', direction, Date.now() - touchStartRef.current.time);
      }
    }
    
    // Check for circle gestures
    if (currentPhase.gestures[0]?.type === 'circle' && distance > 30) {
      // Simplified circle detection
      const angle = Math.atan2(deltaY, deltaX);
      const direction = angle > 0 ? 'clockwise' : 'counter_clockwise';
      handleGestureComplete('circle', direction, Date.now() - touchStartRef.current.time);
    }
  };

  // Handle touch end
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isActive || !touchStartRef.current || !currentPhase) return;
    
    e.preventDefault();
    
    // Clear hold timer
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    
    // Handle tap gestures
    if (currentPhase.gestures[0]?.type === 'tap') {
      const duration = Date.now() - touchStartRef.current.time;
      if (duration < 300) { // Quick tap
        handleGestureComplete('tap', undefined, duration);
      }
    }
    
    // Handle double tap
    if (currentPhase.gestures[0]?.type === 'double_tap') {
      // Simplified double tap detection
      handleGestureComplete('double_tap', undefined, Date.now() - touchStartRef.current.time);
    }
    
    touchStartRef.current = null;
  };

  // Handle gesture completion
  const handleGestureComplete = (type: string, direction?: string, duration?: number) => {
    if (!currentPhase || !isActive) return;
    
    setIsActive(false);
    setVisualCue(null);
    
    // Calculate accuracy based on expected gesture
    const expectedGesture = currentPhase.gestures[0];
    if (!expectedGesture) return;
    
    let accuracy = 0.8; // Base accuracy
    
    if (type === expectedGesture.type) {
      accuracy += 0.2;
    }
    
    if (direction && expectedGesture.direction === direction) {
      accuracy += 0.2;
    }
    
    if (duration && expectedGesture.duration) {
      const durationAccuracy = 1 - Math.abs(expectedGesture.duration - duration) / expectedGesture.duration;
      accuracy *= Math.max(0.5, durationAccuracy);
    }
    
    const timing = Math.random() * 0.3 + 0.7; // Simplified timing
    
    // Submit gesture attempt
    const gestureAttempt: any = {
      type,
      accuracy: Math.min(1, accuracy),
      timing
    };
    
    // Only add direction and duration if they are not undefined
    if (direction !== undefined) {
      gestureAttempt.direction = direction;
    }
    if (duration !== undefined) {
      gestureAttempt.duration = duration;
    }
    
    const result = trickSystem.attemptTrickGesture(animal.id, trickId, gestureAttempt);
    
    // Update UI based on result
    setFeedback(result.feedback);
    
    if (result.success) {
      playSuccess();
      setVisualCue({ ...visualCue!, success: true });
    } else {
      playError();
      setVisualCue({ ...visualCue!, success: false });
    }
    
    // Update progress
    updateProgress();
    
    // Add to attempts history
    const attempt: TrickAttempt = {
      trickId,
      animalId: animal.id,
      phaseId: currentPhase.id,
      timestamp: Date.now(),
      gestureAccuracy: accuracy,
      timingAccuracy: timing,
      success: result.success,
      feedback: result.feedback,
      energyUsed: trick?.energyCost || 0,
      bondPointsGained: result.success ? 2 : 1
    };
    
    setAttempts(prev => [...prev.slice(-4), attempt]);
    
    // Check if trick is learned
    if (result.trickLearned) {
      setTimeout(() => {
        onComplete(true);
      }, 2000);
      return;
    }
    
    // Check if phase advanced
    if (result.phaseAdvanced) {
      setTimeout(() => {
        updateProgress();
        setShowInstructions(true);
        setFeedback('Phase completed! Moving to next phase...');
      }, 1500);
      return;
    }
    
    // Continue with same phase
    setTimeout(() => {
      setIsActive(true);
      showGestureCue();
      setFeedback('');
    }, 1500);
  };

  // Render gesture instruction
  const renderGestureInstruction = (gesture: TrickGesture) => {
    const icons = {
      tap: <MousePointer size={24} />,
      swipe: gesture.direction === 'up' ? <ArrowUp size={24} /> :
             gesture.direction === 'down' ? <ArrowDown size={24} /> :
             gesture.direction === 'left' ? <ArrowLeft size={24} /> :
             gesture.direction === 'right' ? <ArrowRight size={24} /> : <MousePointer size={24} />,
      hold: <Clock size={24} />,
      double_tap: <Target size={24} />,
      circle: <RotateCw size={24} />
    };
    
    return (
      <div className="flex items-center space-x-3">
        <div className="text-blue-500">
          {icons[gesture.type as keyof typeof icons]}
        </div>
        <div>
          <div className="font-medium">{gesture.type.replace('_', ' ')}</div>
          <div className="text-sm text-gray-600">{gesture.description}</div>
        </div>
      </div>
    );
  };

  // Render visual cue
  const renderVisualCue = () => {
    if (!visualCue) return null;
    
    const cueAnimation = useSpring({
      opacity: visualCue.active ? 1 : 0,
      transform: visualCue.active ? 'scale(1)' : 'scale(0.8)',
      color: visualCue.success === true ? '#10B981' : 
             visualCue.success === false ? '#EF4444' : '#3B82F6'
    });
    
    return (
      <animated.div
        style={cueAnimation}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div className="text-6xl opacity-50">
          {visualCue.type === 'tap' && '👆'}
          {visualCue.type === 'swipe' && '👉'}
          {visualCue.type === 'hold' && '✋'}
          {visualCue.type === 'circle' && '🔄'}
        </div>
      </animated.div>
    );
  };

  if (!isVisible || !trick || !currentPhase) return null;

  return (
    <animated.div 
      style={interfaceAnimation}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white hover:bg-opacity-20"
              >
                <ArrowLeft size={20} />
              </Button>
              <div>
                <h2 className="text-xl font-bold">Learning {trick.name}</h2>
                <p className="text-sm opacity-90">
                  Phase: {currentPhase.name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-2xl">{trick.icon}</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Phase Progress</span>
            <span className="text-sm text-gray-500">
              {Math.round((progress?.phaseProgress || 0) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <animated.div 
              style={progressAnimation}
              className="h-2 bg-purple-500 rounded-full transition-all duration-300"
            />
          </div>
          <div className="mt-2 text-xs text-gray-600">
            Attempts: {progress?.attemptsInPhase || 0} | 
            Success: {progress?.successfulAttempts || 0}
          </div>
        </div>

        {/* Instructions */}
        {showInstructions && (
          <animated.div style={instructionsAnimation} className="p-4 bg-blue-50 border-b">
            <h3 className="font-semibold text-blue-900 mb-2">{currentPhase.name}</h3>
            <p className="text-sm text-blue-800 mb-3">{currentPhase.description}</p>
            {currentPhase.gestures[0] && renderGestureInstruction(currentPhase.gestures[0])}
            <Button
              onClick={startTeaching}
              className="mt-3 w-full bg-blue-500 hover:bg-blue-600"
            >
              <Play size={16} className="mr-2" />
              Start Practice
            </Button>
          </animated.div>
        )}

        {/* Countdown */}
        {countdownActive && (
          <div className="p-8 flex items-center justify-center">
            <div className="text-6xl font-bold text-blue-500 animate-pulse">
              {countdown}
            </div>
          </div>
        )}

        {/* Gesture Area */}
        {isActive && (
          <div className="p-4">
            <animated.div
              ref={gestureAreaRef}
              style={gestureAreaAnimation}
              className="relative bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl h-64 border-2 border-dashed border-blue-300 flex items-center justify-center"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="text-center">
                <div className="text-lg font-medium text-blue-700 mb-2">
                  Perform the gesture here
                </div>
                <div className="text-sm text-blue-600">
                  {currentPhase.gestures[0]?.description}
                </div>
              </div>
              {renderVisualCue()}
            </animated.div>
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <animated.div style={feedbackAnimation} className="p-4 bg-yellow-50 border-b">
            <div className="flex items-center space-x-2">
              <Activity size={16} className="text-yellow-600" />
              <span className="text-sm text-yellow-800">{feedback}</span>
            </div>
          </animated.div>
        )}

        {/* Recent Attempts */}
        {attempts.length > 0 && (
          <div className="p-4 border-t bg-gray-50">
            <h4 className="font-medium text-gray-900 mb-2">Recent Attempts</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {attempts.slice(-3).map((attempt, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    {attempt.success ? (
                      <CheckCircle size={14} className="text-green-600" />
                    ) : (
                      <XCircle size={14} className="text-red-600" />
                    )}
                    <span className="text-gray-700">
                      {Math.round(attempt.gestureAccuracy * 100)}% accuracy
                    </span>
                  </div>
                  <div className="text-gray-500">
                    +{attempt.bondPointsGained} bond
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="p-4 border-t flex justify-between">
          <Button
            onClick={() => setShowInstructions(true)}
            variant="outline"
            size="sm"
          >
            <BookOpen size={16} className="mr-2" />
            Instructions
          </Button>
          <Button
            onClick={() => {
              setIsActive(false);
              setShowInstructions(true);
              setFeedback('');
            }}
            variant="outline"
            size="sm"
          >
            <RefreshCw size={16} className="mr-2" />
            Restart
          </Button>
        </div>
      </div>
    </animated.div>
  );
};

export default TrickTeaching; 
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MOBILE_TOUCH_TARGET_SIZE } from '../../constants';

interface TouchControlsProps {
  onMove?: (direction: 'up' | 'down' | 'left' | 'right' | null) => void;
  onAction?: (action: 'A' | 'B') => void;
  onActionStart?: (action: 'A' | 'B') => void;
  onActionEnd?: (action: 'A' | 'B') => void;
  disabled?: boolean;
  showLabels?: boolean;
  className?: string;
}

const TouchControls: React.FC<TouchControlsProps> = ({
  onMove,
  onAction,
  onActionStart,
  onActionEnd,
  disabled = false,
  showLabels = true,
  className = ''
}) => {
  const [activeDirection, setActiveDirection] = useState<string | null>(null);
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const dPadRef = useRef<HTMLDivElement>(null);
  const touchIdRef = useRef<number | null>(null);

  // Handle vibration feedback
  const vibrate = useCallback((pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  // Calculate direction from touch position
  const getDirectionFromPosition = useCallback((element: HTMLElement, clientX: number, clientY: number) => {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    // Dead zone to prevent accidental movements
    const deadZone = 15;
    if (absX < deadZone && absY < deadZone) {
      return null;
    }
    
    // Determine primary direction
    if (absX > absY) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }, []);

  // D-Pad touch handlers - responsive without throttling
  const handleDPadTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || !dPadRef.current) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    if (!touch) return;
    
    touchIdRef.current = touch.identifier;
    const direction = getDirectionFromPosition(dPadRef.current, touch.clientX, touch.clientY);
    
    if (direction) {
      setActiveDirection(direction);
      onMove?.(direction as any);
      vibrate(50);
    }
  }, [disabled, getDirectionFromPosition, onMove, vibrate]);

  const handleDPadTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || !dPadRef.current || touchIdRef.current === null) return;
    
    e.preventDefault();
    const touch = Array.from(e.touches).find(t => t.identifier === touchIdRef.current);
    if (!touch) return;
    
    const direction = getDirectionFromPosition(dPadRef.current, touch.clientX, touch.clientY);
    
    if (direction !== activeDirection) {
      setActiveDirection(direction);
      onMove?.(direction as any);
      if (direction) vibrate(30);
    }
  }, [disabled, getDirectionFromPosition, onMove, vibrate, activeDirection]);

  const handleDPadTouchEnd = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    
    // Check if our tracked touch ended
    const activeTouchExists = Array.from(e.touches).some(t => t.identifier === touchIdRef.current);
    
    if (!activeTouchExists) {
      setActiveDirection(null);
      onMove?.(null);
      touchIdRef.current = null;
    }
  }, [disabled, onMove]);

  // Action button handlers
  const handleActionTouchStart = useCallback((action: 'A' | 'B') => (e: React.TouchEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    setActiveButton(action);
    onActionStart?.(action);
    vibrate(40);
  }, [disabled, onActionStart, vibrate]);

  const handleActionTouchEnd = useCallback((action: 'A' | 'B') => (e: React.TouchEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    setActiveButton(null);
    onActionEnd?.(action);
    onAction?.(action);
  }, [disabled, onActionEnd, onAction]);

  // Prevent context menu on long press
  useEffect(() => {
    const preventContextMenu = (e: Event) => e.preventDefault();
    
    const elements = document.querySelectorAll('[data-touch-control]');
    elements.forEach(el => {
      el.addEventListener('contextmenu', preventContextMenu);
    });
    
    return () => {
      elements.forEach(el => {
        el.removeEventListener('contextmenu', preventContextMenu);
      });
    };
  }, []);

  const dPadSize = 96;
  const buttonSize = 56;

  return (
    <div className={`absolute bottom-4 left-0 right-0 px-4 pointer-events-none ${className}`}>
      <div className="flex justify-between items-end pointer-events-auto">
        {/* Virtual D-Pad */}
        <div className="relative">
          <div
            ref={dPadRef}
            data-touch-control
            className={`relative bg-black bg-opacity-40 rounded-full flex items-center justify-center transition-all duration-150 ${
              disabled ? 'opacity-50' : 'hover:bg-opacity-50'
            }`}
            style={{ 
              width: dPadSize, 
              height: dPadSize,
              minWidth: MOBILE_TOUCH_TARGET_SIZE,
              minHeight: MOBILE_TOUCH_TARGET_SIZE 
            }}
            onTouchStart={handleDPadTouchStart}
            onTouchMove={handleDPadTouchMove}
            onTouchEnd={handleDPadTouchEnd}
          >
            {/* D-Pad directions */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Up */}
              <div 
                className={`absolute top-2 w-6 h-6 rounded-sm transition-all duration-100 ${
                  activeDirection === 'up' 
                    ? 'bg-white bg-opacity-80 scale-110' 
                    : 'bg-white bg-opacity-30'
                }`}
              />
              
              {/* Down */}
              <div 
                className={`absolute bottom-2 w-6 h-6 rounded-sm transition-all duration-100 ${
                  activeDirection === 'down' 
                    ? 'bg-white bg-opacity-80 scale-110' 
                    : 'bg-white bg-opacity-30'
                }`}
              />
              
              {/* Left */}
              <div 
                className={`absolute left-2 w-6 h-6 rounded-sm transition-all duration-100 ${
                  activeDirection === 'left' 
                    ? 'bg-white bg-opacity-80 scale-110' 
                    : 'bg-white bg-opacity-30'
                }`}
              />
              
              {/* Right */}
              <div 
                className={`absolute right-2 w-6 h-6 rounded-sm transition-all duration-100 ${
                  activeDirection === 'right' 
                    ? 'bg-white bg-opacity-80 scale-110' 
                    : 'bg-white bg-opacity-30'
                }`}
              />
              
              {/* Center indicator */}
              <div className="w-3 h-3 bg-white bg-opacity-40 rounded-full" />
            </div>
            
            {showLabels && (
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                <span className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                  Move
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          {/* A Button */}
          <div className="relative">
            <button
              data-touch-control
              className={`rounded-full font-bold text-white text-lg transition-all duration-150 ${
                activeButton === 'A'
                  ? 'bg-green-500 bg-opacity-90 scale-110 shadow-lg'
                  : 'bg-green-600 bg-opacity-80 hover:bg-opacity-90'
              } ${disabled ? 'opacity-50' : ''}`}
              style={{ 
                width: buttonSize, 
                height: buttonSize,
                minWidth: MOBILE_TOUCH_TARGET_SIZE,
                minHeight: MOBILE_TOUCH_TARGET_SIZE 
              }}
              onTouchStart={handleActionTouchStart('A')}
              onTouchEnd={handleActionTouchEnd('A')}
              disabled={disabled}
            >
              A
            </button>
            
            {showLabels && (
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                <span className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                  Action
                </span>
              </div>
            )}
          </div>

          {/* B Button */}
          <div className="relative">
            <button
              data-touch-control
              className={`rounded-full font-bold text-white text-lg transition-all duration-150 ${
                activeButton === 'B'
                  ? 'bg-blue-500 bg-opacity-90 scale-110 shadow-lg'
                  : 'bg-blue-600 bg-opacity-80 hover:bg-opacity-90'
              } ${disabled ? 'opacity-50' : ''}`}
              style={{ 
                width: buttonSize, 
                height: buttonSize,
                minWidth: MOBILE_TOUCH_TARGET_SIZE,
                minHeight: MOBILE_TOUCH_TARGET_SIZE 
              }}
              onTouchStart={handleActionTouchStart('B')}
              onTouchEnd={handleActionTouchEnd('B')}
              disabled={disabled}
            >
              B
            </button>
            
            {showLabels && (
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                <span className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                  Menu
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Debug info (development only) */}
      {import.meta.env?.DEV && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-2 rounded text-xs">
          D-Pad: {activeDirection || 'none'} | Button: {activeButton || 'none'}
        </div>
      )}
    </div>
  );
};

export default TouchControls;
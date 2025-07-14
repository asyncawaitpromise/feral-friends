import React, { useEffect } from 'react';
import { animated } from '@react-spring/web';
import { DialogueOption, DialogueState } from '../../game/DialogueSystem';
import { useSlideIn, useFadeIn, useStagger } from '../../hooks/useAnimation';
import { getAudioManager } from '../../services/AudioManager';

interface DialogueBoxProps {
  dialogueState: DialogueState;
  onSelectOption: (optionId: string) => void;
  onClose: () => void;
}

export const DialogueBox: React.FC<DialogueBoxProps> = ({
  dialogueState,
  onSelectOption,
  onClose
}) => {
  if (!dialogueState.isActive || !dialogueState.currentAnimal) {
    return null;
  }

  // Animation hooks
  const slideUpStyle = useSlideIn(dialogueState.isActive, 'up');
  const fadeInStyle = useFadeIn(dialogueState.isActive);
  const staggeredOptions = useStagger(dialogueState.currentOptions, 100);

  // Play dialogue appear sound when dialogue becomes active
  useEffect(() => {
    if (dialogueState.isActive) {
      getAudioManager().playSound('dialogue_appear');
    }
  }, [dialogueState.isActive]);

  const handleOptionClick = (optionId: string) => {
    getAudioManager().playButtonClick();
    onSelectOption(optionId);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <animated.div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center p-4 z-50"
      style={fadeInStyle}
      onClick={handleBackdropClick}
    >
      <animated.div 
        className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-96 overflow-hidden border-4 border-amber-200"
        style={slideUpStyle}
      >
        <div className="bg-gradient-to-r from-amber-100 to-yellow-100 p-4 border-b-2 border-amber-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-amber-800 flex items-center gap-2">
              <span className="text-2xl">
                {dialogueState.currentAnimal.type === 'rabbit' && '🐰'}
                {dialogueState.currentAnimal.type === 'fox' && '🦊'}
                {dialogueState.currentAnimal.type === 'deer' && '🦌'}
                {dialogueState.currentAnimal.type === 'bear' && '🐻'}
                {dialogueState.currentAnimal.type === 'wolf' && '🐺'}
                {dialogueState.currentAnimal.type === 'bird' && '🐦'}
                {dialogueState.currentAnimal.type === 'owl' && '🦉'}
                {dialogueState.currentAnimal.type === 'squirrel' && '🐿️'}
                {!['rabbit', 'fox', 'deer', 'bear', 'wolf', 'bird', 'owl', 'squirrel'].includes(dialogueState.currentAnimal.type) && '🐾'}
              </span>
              Talking with {dialogueState.currentAnimal.species}
            </h3>
            <button
              onClick={onClose}
              className="text-amber-600 hover:text-amber-800 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-amber-200 transition-colors"
              aria-label="Close dialogue"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-4 max-h-64 overflow-y-auto">
          <div className="space-y-3">
            {dialogueState.history.length > 0 && (
              <div className="space-y-2 mb-4">
                {dialogueState.history.map((message, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded-lg text-sm ${
                      message.startsWith('You:')
                        ? 'bg-blue-100 text-blue-800 ml-8'
                        : 'bg-gray-100 text-gray-700 mr-8'
                    }`}
                  >
                    {message}
                  </div>
                ))}
              </div>
            )}

            {dialogueState.currentTree && dialogueState.history.length === 1 && (
              <div className="bg-green-50 border-l-4 border-green-200 p-3 mb-4">
                <p className="text-green-700 font-medium">
                  {dialogueState.currentTree.greeting}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="font-semibold text-gray-700 text-sm">Choose your response:</h4>
              {staggeredOptions((style, option: DialogueOption) => (
                <animated.button
                  key={option.id}
                  style={style}
                  onClick={() => handleOptionClick(option.id)}
                  className="w-full text-left p-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-all duration-200 hover:scale-102 hover:shadow-md group"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">→</span>
                    <div className="flex-1">
                      <p className="text-gray-800 group-hover:text-gray-900">
                        {option.text}
                      </p>
                      {option.effect && (
                        <div className="flex gap-2 mt-1">
                          {option.effect.trust && (
                            <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded">
                              Trust {option.effect.trust > 0 ? '+' : ''}{option.effect.trust}
                            </span>
                          )}
                          {option.effect.energy && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              Energy {option.effect.energy > 0 ? '+' : ''}{option.effect.energy}
                            </span>
                          )}
                          {option.effect.item && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                              Item: {option.effect.item}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </animated.button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-4">
              <span>Trust: {dialogueState.currentAnimal.stats.trustLevel}/100</span>
              <span>Energy: {dialogueState.currentAnimal.stats.energy}/100</span>
            </div>
            <span className="text-gray-500">
              Press ESC or click outside to close
            </span>
          </div>
        </div>
      </animated.div>
    </animated.div>
  );
};

export default DialogueBox;
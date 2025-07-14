// Item Usage UI Component
// Mobile-optimized interface for using items with animals, including drag-and-drop and interaction feedback

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Package, Zap, Heart, Star, Clock, AlertTriangle, CheckCircle, X, RotateCcw } from 'react-feather';
import { useSpring, animated, config } from '@react-spring/web';
import { Button, Card, Modal } from '../ui';
import { Animal } from '../../game/Animal';
import { InventoryItem } from '../../game/InventorySystem';
import { itemSystem, ItemUseResult, ItemUseContext } from '../../game/ItemSystem';
import { useSound } from '../../hooks/useAudio';

export interface ItemUsageProps {
  visible: boolean;
  targetAnimal?: Animal;
  selectedItem?: InventoryItem;
  playerLocation?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  weather?: 'sunny' | 'rainy' | 'cloudy' | 'stormy';
  companions?: string[];
  onItemUsed?: (result: ItemUseResult) => void;
  onClose: () => void;
  className?: string;
}

interface DragState {
  isDragging: boolean;
  dragOffset: { x: number; y: number };
  dragStartPosition: { x: number; y: number };
}

const ItemUsage: React.FC<ItemUsageProps> = ({
  visible,
  targetAnimal,
  selectedItem,
  playerLocation,
  timeOfDay = 'afternoon',
  weather = 'sunny',
  companions = [],
  onItemUsed,
  onClose,
  className = ''
}) => {
  const [isUsing, setIsUsing] = useState(false);
  const [lastResult, setLastResult] = useState<ItemUseResult | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    dragStartPosition: { x: 0, y: 0 }
  });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  
  const itemRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const { playSound } = useSound();

  // Animation for modal appearance
  const modalAnimation = useSpring({
    opacity: visible ? 1 : 0,
    transform: visible ? 'scale(1) translateY(0%)' : 'scale(0.9) translateY(10%)',
    config: config.gentle
  });

  // Animation for drag feedback
  const dragAnimation = useSpring({
    transform: dragState.isDragging 
      ? `translate(${dragState.dragOffset.x}px, ${dragState.dragOffset.y}px) scale(1.1)` 
      : 'translate(0px, 0px) scale(1)',
    opacity: dragState.isDragging ? 0.8 : 1,
    config: config.wobbly
  });

  // Animation for result feedback
  const resultAnimation = useSpring({
    opacity: lastResult ? 1 : 0,
    transform: lastResult ? 'translateY(0%)' : 'translateY(20%)',
    config: config.gentle
  });

  // Animation for cooldown indicator
  const cooldownAnimation = useSpring({
    width: `${Math.max(0, (cooldownTime / 100) * 100)}%`,
    config: config.default
  });

  // Update cooldown timer
  useEffect(() => {
    if (!selectedItem) return;

    const updateCooldown = () => {
      const cooldowns = itemSystem.getItemCooldowns();
      const remaining = cooldowns[selectedItem.id] || 0;
      setCooldownTime(remaining);
    };

    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, [selectedItem]);

  // Handle item use
  const handleUseItem = useCallback(async () => {
    if (!selectedItem || isUsing || cooldownTime > 0) return;

    setIsUsing(true);
    playSound('ui_interaction');

    try {
      const context: ItemUseContext = {
        targetAnimal,
        location: playerLocation,
        timeOfDay,
        weather,
        companions
      };

      const result = itemSystem.useItem(selectedItem.id, context);
      
      setLastResult(result);
      onItemUsed?.(result);

      // Play appropriate sound
      if (result.success) {
        if (result.criticalSuccess) {
          playSound('success_major');
        } else if (result.effects.length > 0) {
          playSound('success');
        } else {
          playSound('success_minor');
        }
      } else {
        playSound('error');
      }

      // Clear result after delay
      setTimeout(() => {
        setLastResult(null);
      }, 5000);

    } catch (error) {
      console.error('Error using item:', error);
      playSound('error');
    } finally {
      setIsUsing(false);
    }
  }, [selectedItem, targetAnimal, playerLocation, timeOfDay, weather, companions, isUsing, cooldownTime, onItemUsed, playSound]);

  // Handle drag start
  const handleDragStart = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (!selectedItem || cooldownTime > 0) return;

    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

    setDragState({
      isDragging: true,
      dragOffset: { x: 0, y: 0 },
      dragStartPosition: { x: clientX, y: clientY }
    });

    playSound('ui_drag_start');
  }, [selectedItem, cooldownTime, playSound]);

  // Handle drag move
  const handleDragMove = useCallback((event: MouseEvent | TouchEvent) => {
    if (!dragState.isDragging) return;

    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

    const newOffset = {
      x: clientX - dragState.dragStartPosition.x,
      y: clientY - dragState.dragStartPosition.y
    };

    setDragState(prev => ({
      ...prev,
      dragOffset: newOffset
    }));
  }, [dragState.isDragging, dragState.dragStartPosition]);

  // Handle drag end
  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent) => {
    if (!dragState.isDragging || !targetRef.current) return;

    const clientX = 'touches' in event ? event.changedTouches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.changedTouches[0].clientY : event.clientY;

    // Check if dropped on target
    const targetRect = targetRef.current.getBoundingClientRect();
    const isOverTarget = 
      clientX >= targetRect.left &&
      clientX <= targetRect.right &&
      clientY >= targetRect.top &&
      clientY <= targetRect.bottom;

    setDragState({
      isDragging: false,
      dragOffset: { x: 0, y: 0 },
      dragStartPosition: { x: 0, y: 0 }
    });

    if (isOverTarget) {
      playSound('ui_drop_success');
      if (selectedItem?.consumable) {
        setShowConfirmation(true);
      } else {
        handleUseItem();
      }
    } else {
      playSound('ui_drop_cancel');
    }
  }, [dragState.isDragging, handleUseItem, selectedItem, playSound]);

  // Set up drag event listeners
  useEffect(() => {
    if (!dragState.isDragging) return;

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchmove', handleDragMove);
    document.addEventListener('touchend', handleDragEnd);

    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('touchmove', handleDragMove);
      document.removeEventListener('touchend', handleDragEnd);
    };
  }, [dragState.isDragging, handleDragMove, handleDragEnd]);

  // Confirmation dialog for consumable items
  const handleConfirmUse = useCallback(() => {
    setShowConfirmation(false);
    handleUseItem();
  }, [handleUseItem]);

  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case 'tool': return <Zap className="w-4 h-4" />;
      case 'toy': return <Heart className="w-4 h-4" />;
      case 'special': return <Star className="w-4 h-4" />;
      case 'food': return <Package className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getEffectTypeColor = (type: string) => {
    switch (type) {
      case 'heal': return 'text-green-600';
      case 'energy': return 'text-yellow-600';
      case 'trust': return 'text-blue-600';
      case 'happiness': return 'text-pink-600';
      case 'special': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-400';
      case 'uncommon': return 'border-green-400';
      case 'rare': return 'border-blue-400';
      case 'epic': return 'border-purple-400';
      case 'legendary': return 'border-yellow-400';
      default: return 'border-gray-400';
    }
  };

  if (!visible) return null;

  return (
    <>
      <animated.div 
        style={modalAnimation}
        className={`fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 ${className}`}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <Card className="w-full max-w-md bg-white rounded-xl shadow-xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Use Item</h3>
                <p className="text-sm text-gray-600">
                  {targetAnimal ? `With ${targetAnimal.species}` : 'Select target'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            {selectedItem ? (
              <>
                {/* Item Display */}
                <animated.div
                  ref={itemRef}
                  style={dragAnimation}
                  className={`p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 ${getRarityColor(selectedItem.rarity)} cursor-grab active:cursor-grabbing`}
                  onMouseDown={handleDragStart}
                  onTouchStart={handleDragStart}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{selectedItem.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        {getItemTypeIcon(selectedItem.type)}
                        <h4 className="font-semibold text-gray-800">{selectedItem.name}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRarityColor(selectedItem.rarity)} bg-opacity-20`}>
                          {selectedItem.rarity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{selectedItem.description}</p>
                      {selectedItem.quantity && (
                        <p className="text-xs text-gray-500 mt-1">Quantity: {selectedItem.quantity}</p>
                      )}
                    </div>
                  </div>

                  {/* Cooldown Indicator */}
                  {cooldownTime > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Cooldown</span>
                        <span>{cooldownTime}s</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <animated.div 
                          style={cooldownAnimation}
                          className="bg-orange-500 h-2 rounded-full transition-all duration-1000"
                        />
                      </div>
                    </div>
                  )}
                </animated.div>

                {/* Item Effects */}
                {selectedItem.effects && selectedItem.effects.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-700">Effects:</h5>
                    <div className="grid grid-cols-1 gap-2">
                      {selectedItem.effects.map((effect, index) => (
                        <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                          <div className={`w-2 h-2 rounded-full ${getEffectTypeColor(effect.type)}`} />
                          <span className="text-sm text-gray-700">{effect.description}</span>
                          {effect.value && (
                            <span className="text-xs text-gray-500">+{effect.value}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Target Area */}
                {targetAnimal && (
                  <div
                    ref={targetRef}
                    className={`p-4 border-2 border-dashed ${dragState.isDragging ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50'} rounded-xl transition-all duration-200`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{targetAnimal.visual?.emoji || '🐾'}</div>
                      <div>
                        <h5 className="font-medium text-gray-800">
                          Target: {targetAnimal.species}
                        </h5>
                        <p className="text-sm text-gray-600">
                          {dragState.isDragging ? 'Drop item here to use' : 'Drag item here or tap button below'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <Button
                    onClick={selectedItem.consumable ? () => setShowConfirmation(true) : handleUseItem}
                    disabled={isUsing || cooldownTime > 0 || !targetAnimal}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUsing ? (
                      <div className="flex items-center justify-center space-x-2">
                        <RotateCcw className="w-4 h-4 animate-spin" />
                        <span>Using...</span>
                      </div>
                    ) : cooldownTime > 0 ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>{cooldownTime}s</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <Zap className="w-4 h-4" />
                        <span>Use Item</span>
                      </div>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="px-6 py-3 rounded-xl border-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                </div>

                {/* Usage Instructions */}
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700">
                    💡 <strong>Tip:</strong> Drag the item onto the target animal or use the button below. 
                    Some items work better with specific animals or in certain conditions.
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No item selected</p>
                <p className="text-sm text-gray-500 mt-1">Select an item from your inventory to use it</p>
              </div>
            )}

            {/* Result Feedback */}
            {lastResult && (
              <animated.div style={resultAnimation}>
                <div className={`p-4 rounded-xl border-l-4 ${
                  lastResult.success 
                    ? 'bg-green-50 border-green-400' 
                    : 'bg-red-50 border-red-400'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    {lastResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    )}
                    <span className={`font-medium ${
                      lastResult.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {lastResult.success ? 'Success!' : 'Failed'}
                    </span>
                    {lastResult.criticalSuccess && (
                      <Star className="w-4 h-4 text-yellow-600" />
                    )}
                  </div>
                  <p className={`text-sm ${
                    lastResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {lastResult.message}
                  </p>
                  
                  {lastResult.effects.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {lastResult.effects.map((effect, index) => (
                        <div key={index} className="text-xs text-gray-600">
                          • {effect.description}
                        </div>
                      ))}
                    </div>
                  )}

                  {lastResult.experienceGained > 0 && (
                    <div className="mt-2 text-xs text-blue-600">
                      +{lastResult.experienceGained} experience gained
                    </div>
                  )}
                </div>
              </animated.div>
            )}
          </div>
        </Card>
      </animated.div>

      {/* Confirmation Modal for Consumable Items */}
      <Modal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        title="Confirm Item Use"
        className="max-w-sm"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                This will consume the item
              </p>
              <p className="text-xs text-yellow-700">
                {selectedItem?.name} will be removed from your inventory
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={handleConfirmUse}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              Use Item
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowConfirmation(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ItemUsage;
import React, { useState, useRef, useEffect } from 'react';
import { animated } from '@react-spring/web';
import { 
  Package, 
  Grid, 
  List, 
  Search, 
  X, 
  MoreVertical,
  Trash2,
  Scissors,
  Info,
  Star
} from 'react-feather';
import { useSlideIn, useFadeIn, useStagger } from '../../hooks/useAnimation';
import { useSound } from '../../hooks/useAudio';
import { 
  InventoryItem, 
  InventorySlot, 
  getInventorySystem, 
  UseItemResult 
} from '../../game/InventorySystem';
import Button from '../ui/Button';

interface InventoryProps {
  isOpen: boolean;
  onClose: () => void;
  onUseItem?: (itemId: string, targetId?: string) => UseItemResult;
  selectedAnimalId?: string;
  readOnly?: boolean;
}

type ViewMode = 'grid' | 'list';
type SortMode = 'name' | 'type' | 'rarity' | 'quantity';

const RARITY_COLORS = {
  common: 'border-gray-300 bg-gray-50',
  uncommon: 'border-green-300 bg-green-50',
  rare: 'border-blue-300 bg-blue-50',
  epic: 'border-purple-300 bg-purple-50',
  legendary: 'border-yellow-300 bg-yellow-50'
};

const RARITY_TEXT_COLORS = {
  common: 'text-gray-600',
  uncommon: 'text-green-600',
  rare: 'text-blue-600',
  epic: 'text-purple-600',
  legendary: 'text-yellow-600'
};

export const Inventory: React.FC<InventoryProps> = ({
  isOpen,
  onClose,
  onUseItem,
  selectedAnimalId,
  readOnly = false
}) => {
  const [slots, setSlots] = useState<InventorySlot[]>([]);
  const [filteredSlots, setFilteredSlots] = useState<InventorySlot[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortMode, setSortMode] = useState<SortMode>('type');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [draggedSlot, setDraggedSlot] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [showContextMenu, setShowContextMenu] = useState<{ x: number; y: number; slotIndex: number } | null>(null);
  
  const inventorySystem = getInventorySystem();
  const { playButtonClick, playSuccess, playError } = useSound();
  const containerRef = useRef<HTMLDivElement>(null);

  // Animation hooks
  const slideInStyle = useSlideIn(isOpen, 'right');
  const fadeInStyle = useFadeIn(isOpen);
  const staggeredSlots = useStagger(filteredSlots.slice(0, 20), 50); // Limit stagger for performance

  // Load inventory data
  useEffect(() => {
    if (isOpen) {
      loadInventory();
    }
  }, [isOpen]);

  // Filter and sort slots when dependencies change
  useEffect(() => {
    filterAndSortSlots();
  }, [slots, searchQuery, selectedCategory, sortMode]);

  // Handle escape key
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, onClose]);

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showContextMenu && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowContextMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showContextMenu]);

  const loadInventory = () => {
    const currentSlots = inventorySystem.getSlots();
    setSlots(currentSlots);
  };

  const filterAndSortSlots = () => {
    let filtered = [...slots];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(slot => 
        slot.item && slot.item.type === selectedCategory
      );
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(slot =>
        slot.item && (
          slot.item.name.toLowerCase().includes(query) ||
          slot.item.description.toLowerCase().includes(query) ||
          slot.item.type.toLowerCase().includes(query)
        )
      );
    }

    // Sort slots
    filtered.sort((a, b) => {
      if (!a.item && !b.item) return 0;
      if (!a.item) return 1;
      if (!b.item) return -1;

      switch (sortMode) {
        case 'name':
          return a.item.name.localeCompare(b.item.name);
        case 'type':
          return a.item.type.localeCompare(b.item.type);
        case 'rarity':
          const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
          return rarityOrder.indexOf(a.item.rarity) - rarityOrder.indexOf(b.item.rarity);
        case 'quantity':
          return b.item.quantity - a.item.quantity;
        default:
          return 0;
      }
    });

    setFilteredSlots(filtered);
  };

  const handleUseItem = async (slot: InventorySlot) => {
    if (!slot.item || !onUseItem) return;

    try {
      const result = onUseItem(slot.item.id, selectedAnimalId);
      
      if (result.success) {
        playSuccess();
        loadInventory(); // Refresh inventory
      } else {
        playError();
      }
    } catch (error) {
      console.error('Failed to use item:', error);
      playError();
    }
  };

  const handleDragStart = (slotIndex: number) => {
    if (readOnly) return;
    setDraggedSlot(slotIndex);
    playButtonClick();
  };

  const handleDragOver = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    setDropTarget(slotIndex);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (draggedSlot !== null && draggedSlot !== targetIndex && !readOnly) {
      const success = inventorySystem.moveItem(draggedSlot, targetIndex);
      if (success) {
        playSuccess();
        loadInventory();
      } else {
        playError();
      }
    }
    
    setDraggedSlot(null);
    setDropTarget(null);
  };

  const handleSlotRightClick = (e: React.MouseEvent, slotIndex: number) => {
    e.preventDefault();
    if (readOnly || !slots[slotIndex]?.item) return;

    setShowContextMenu({
      x: e.clientX,
      y: e.clientY,
      slotIndex
    });
  };

  const handleContextMenuAction = (action: string, slotIndex: number) => {
    const slot = slots[slotIndex];
    if (!slot?.item) return;

    switch (action) {
      case 'use':
        handleUseItem(slot);
        break;
      case 'split':
        if (slot.item.quantity > 1) {
          const splitQuantity = Math.floor(slot.item.quantity / 2);
          inventorySystem.splitStack(slotIndex, splitQuantity);
          loadInventory();
          playSuccess();
        }
        break;
      case 'drop':
        const confirmDrop = window.confirm(`Drop ${slot.item.name}?`);
        if (confirmDrop) {
          inventorySystem.removeItem(slot.item.id, slot.item.quantity);
          loadInventory();
          playSuccess();
        }
        break;
    }
    
    setShowContextMenu(null);
  };

  const getCategories = () => {
    const categories = ['all', ...inventorySystem.getCategories()];
    return categories.map(cat => ({
      value: cat,
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      count: cat === 'all' 
        ? slots.filter(s => s.item).length
        : slots.filter(s => s.item && s.item.type === cat).length
    }));
  };

  const renderSlot = (slot: InventorySlot, index: number) => {
    const isSelected = selectedSlot === index;
    const isDragging = draggedSlot === index;
    const isDropTarget = dropTarget === index;
    
    return (
      <div
        key={`${slot.index}-${slot.item?.id || 'empty'}`}
        className={`
          relative aspect-square border-2 rounded-lg p-2 cursor-pointer transition-all duration-200
          ${slot.item ? RARITY_COLORS[slot.item.rarity] : 'border-gray-200 bg-gray-100'}
          ${isSelected ? 'ring-2 ring-blue-500' : ''}
          ${isDragging ? 'opacity-50 scale-95' : ''}
          ${isDropTarget ? 'ring-2 ring-green-500 bg-green-100' : ''}
          ${slot.isLocked ? 'opacity-50' : 'hover:scale-105'}
        `}
        draggable={!readOnly && !!slot.item}
        onDragStart={() => handleDragStart(index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDrop={(e) => handleDrop(e, index)}
        onClick={() => !readOnly && setSelectedSlot(isSelected ? null : index)}
        onContextMenu={(e) => handleSlotRightClick(e, index)}
      >
        {slot.item ? (
          <>
            {/* Item Icon */}
            <div className="text-2xl mb-1 text-center">
              {slot.item.icon}
            </div>
            
            {/* Item Quantity */}
            {slot.item.quantity > 1 && (
              <div className="absolute top-1 right-1 bg-gray-800 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {slot.item.quantity > 99 ? '99+' : slot.item.quantity}
              </div>
            )}
            
            {/* Rarity Indicator */}
            <div className={`absolute bottom-1 left-1 w-2 h-2 rounded-full ${slot.item.rarity === 'legendary' ? 'animate-pulse' : ''}`}
                 style={{
                   backgroundColor: {
                     common: '#6b7280',
                     uncommon: '#10b981',
                     rare: '#3b82f6',
                     epic: '#8b5cf6',
                     legendary: '#f59e0b'
                   }[slot.item.rarity]
                 }}
            />
            
            {/* Item Name (in grid view) */}
            {viewMode === 'grid' && (
              <div className="text-xs text-center font-medium truncate">
                {slot.item.name}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            {slot.isLocked ? '🔒' : ''}
          </div>
        )}
      </div>
    );
  };

  const renderListItem = (slot: InventorySlot, index: number) => {
    if (!slot.item) return null;
    
    return (
      <div
        key={`${slot.index}-${slot.item.id}`}
        className={`
          flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all
          ${RARITY_COLORS[slot.item.rarity]}
          hover:scale-102 hover:shadow-md
        `}
        onClick={() => !readOnly && handleUseItem(slot)}
      >
        <div className="text-2xl">{slot.item.icon}</div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium truncate">{slot.item.name}</h4>
            <span className={`text-xs px-2 py-1 rounded ${RARITY_TEXT_COLORS[slot.item.rarity]} bg-white`}>
              {slot.item.rarity}
            </span>
          </div>
          <p className="text-sm text-gray-600 truncate">{slot.item.description}</p>
        </div>
        
        <div className="text-right">
          <div className="font-bold text-sm">×{slot.item.quantity}</div>
          <div className="text-xs text-gray-500">{slot.item.type}</div>
        </div>
        
        {!readOnly && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleSlotRightClick(e as any, index);
            }}
          >
            <MoreVertical size={16} />
          </Button>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <animated.div 
      ref={containerRef}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      style={fadeInStyle}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <animated.div 
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border-4 border-amber-200"
        style={slideInStyle}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-100 to-orange-100 p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="text-amber-600" size={24} />
              <h2 className="text-xl font-bold text-amber-800">Inventory</h2>
              <span className="text-sm text-amber-600">
                ({filteredSlots.filter(s => s.item).length}/{slots.length})
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-amber-200 text-amber-800' : 'bg-white text-gray-600'}`}
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-amber-200 text-amber-800' : 'bg-white text-gray-600'}`}
                >
                  <List size={16} />
                </button>
              </div>
              
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              {getCategories().map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label} ({cat.count})
                </option>
              ))}
            </select>
            
            {/* Sort Mode */}
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="type">Sort by Type</option>
              <option value="name">Sort by Name</option>
              <option value="rarity">Sort by Rarity</option>
              <option value="quantity">Sort by Quantity</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {filteredSlots.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                {searchQuery || selectedCategory !== 'all' ? 'No items found' : 'Inventory is empty'}
              </h3>
              <p className="text-gray-500">
                {searchQuery || selectedCategory !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Start exploring to find items!'
                }
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
              {staggeredSlots((style, slot: InventorySlot, index) => (
                <animated.div key={`${slot.index}-grid`} style={style}>
                  {renderSlot(slot, index)}
                </animated.div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {staggeredSlots((style, slot: InventorySlot, index) => (
                <animated.div key={`${slot.index}-list`} style={style}>
                  {renderListItem(slot, index)}
                </animated.div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Item Details */}
        {selectedSlot !== null && slots[selectedSlot]?.item && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex items-start gap-4">
              <div className="text-3xl">{slots[selectedSlot].item!.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-lg">{slots[selectedSlot].item!.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded ${RARITY_TEXT_COLORS[slots[selectedSlot].item!.rarity]} bg-white border`}>
                    {slots[selectedSlot].item!.rarity}
                  </span>
                  <span className="text-sm text-gray-600">×{slots[selectedSlot].item!.quantity}</span>
                </div>
                <p className="text-gray-700 mb-2">{slots[selectedSlot].item!.description}</p>
                
                {slots[selectedSlot].item!.effects && (
                  <div className="flex flex-wrap gap-1">
                    {slots[selectedSlot].item!.effects.map((effect, index) => (
                      <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {effect.description}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {!readOnly && slots[selectedSlot].item!.usable && (
                <Button
                  variant="primary"
                  onClick={() => handleUseItem(slots[selectedSlot])}
                >
                  Use Item
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Context Menu */}
        {showContextMenu && (
          <div
            className="fixed bg-white border border-gray-300 rounded-lg shadow-lg py-1 z-60"
            style={{
              left: showContextMenu.x,
              top: showContextMenu.y
            }}
          >
            <button
              onClick={() => handleContextMenuAction('use', showContextMenu.slotIndex)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
            >
              Use Item
            </button>
            <button
              onClick={() => handleContextMenuAction('split', showContextMenu.slotIndex)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
            >
              <Scissors size={12} className="inline mr-2" />
              Split Stack
            </button>
            <button
              onClick={() => handleContextMenuAction('drop', showContextMenu.slotIndex)}
              className="w-full text-left px-4 py-2 hover:bg-red-100 text-red-600 text-sm"
            >
              <Trash2 size={12} className="inline mr-2" />
              Drop Item
            </button>
          </div>
        )}
      </animated.div>
    </animated.div>
  );
};

export default Inventory;
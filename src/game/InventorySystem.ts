export interface InventoryItem {
  id: string;
  type: 'food' | 'tool' | 'toy' | 'misc' | 'special' | 'craft' | 'collectible';
  name: string;
  description: string;
  icon: string; // emoji or icon identifier
  quantity: number;
  maxStack: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  value: number; // for trading/selling
  usable: boolean;
  consumable: boolean;
  effects?: ItemEffect[];
  requirements?: ItemRequirement[];
  metadata?: Record<string, any>;
}

export interface ItemEffect {
  type: 'heal' | 'energy' | 'trust' | 'happiness' | 'speed' | 'attraction' | 'special';
  value: number;
  duration?: number; // in seconds, for temporary effects
  target: 'player' | 'animal' | 'both';
  description: string;
}

export interface ItemRequirement {
  type: 'level' | 'animal_type' | 'location' | 'quest' | 'achievement';
  value: any;
  description: string;
}

export interface InventorySlot {
  index: number;
  item: InventoryItem | null;
  isLocked: boolean;
  category?: string | undefined;
}

export interface InventoryConfig {
  maxSlots: number;
  categoriesEnabled: boolean;
  autoSort: boolean;
  autoStack: boolean;
  quickUseSlots: number;
}

export interface UseItemResult {
  success: boolean;
  message: string;
  effects?: {
    type: string;
    oldValue: number;
    newValue: number;
    target: string;
  }[];
  itemConsumed: boolean;
  quantityUsed: number;
}

export class InventorySystem {
  private slots: InventorySlot[] = [];
  private config: InventoryConfig;
  private quickUseSlots: number[] = [];
  private categories: string[] = ['food', 'tool', 'toy', 'misc', 'special'];

  constructor(config: Partial<InventoryConfig> = {}) {
    this.config = {
      maxSlots: 20,
      categoriesEnabled: true,
      autoSort: false,
      autoStack: true,
      quickUseSlots: 4,
      ...config
    };

    this.initializeSlots();
  }

  private initializeSlots(): void {
    this.slots = Array.from({ length: this.config.maxSlots }, (_, index) => ({
      index,
      item: null,
      isLocked: false,
      category: undefined
    }));

    // Initialize quick use slots
    this.quickUseSlots = Array.from({ length: this.config.quickUseSlots }, (_, i) => i);
  }

  // Core inventory operations
  addItem(item: InventoryItem, quantity: number = 1): { success: boolean; message: string; overflow?: number } {
    if (quantity <= 0) {
      return { success: false, message: 'Invalid quantity' };
    }

    let remainingQuantity = quantity;

    // Try to stack with existing items first
    if (this.config.autoStack && item.maxStack > 1) {
      for (const slot of this.slots) {
        if (slot.item && slot.item.id === item.id && !slot.isLocked) {
          const canAdd = Math.min(remainingQuantity, item.maxStack - slot.item.quantity);
          if (canAdd > 0) {
            slot.item.quantity += canAdd;
            remainingQuantity -= canAdd;
            
            if (remainingQuantity === 0) {
              return { 
                success: true, 
                message: `Added ${quantity} ${item.name}${quantity > 1 ? 's' : ''} to inventory` 
              };
            }
          }
        }
      }
    }

    // Add to empty slots
    while (remainingQuantity > 0) {
      const emptySlot = this.slots.find(slot => !slot.item && !slot.isLocked);
      if (!emptySlot) {
        return {
          success: remainingQuantity < quantity,
          message: remainingQuantity < quantity 
            ? `Added ${quantity - remainingQuantity} ${item.name}${quantity - remainingQuantity > 1 ? 's' : ''}, inventory full` 
            : 'Inventory is full',
          overflow: remainingQuantity
        };
      }

      const addQuantity = Math.min(remainingQuantity, item.maxStack);
      emptySlot.item = {
        ...item,
        quantity: addQuantity
      };
      
      if (this.config.categoriesEnabled) {
        emptySlot.category = item.type;
      }

      remainingQuantity -= addQuantity;
    }

    if (this.config.autoSort) {
      this.sortInventory();
    }

    return { 
      success: true, 
      message: `Added ${quantity} ${item.name}${quantity > 1 ? 's' : ''} to inventory` 
    };
  }

  removeItem(itemId: string, quantity: number = 1): { success: boolean; message: string; removedQuantity: number } {
    if (quantity <= 0) {
      return { success: false, message: 'Invalid quantity', removedQuantity: 0 };
    }

    let remainingToRemove = quantity;
    let totalRemoved = 0;

    // Remove from slots with this item
    for (const slot of this.slots) {
      if (slot.item && slot.item.id === itemId && remainingToRemove > 0) {
        const removeFromSlot = Math.min(remainingToRemove, slot.item.quantity);
        slot.item.quantity -= removeFromSlot;
        remainingToRemove -= removeFromSlot;
        totalRemoved += removeFromSlot;

        if (slot.item.quantity <= 0) {
          slot.item = null;
          slot.category = undefined;
        }
      }
    }

    return {
      success: totalRemoved > 0,
      message: totalRemoved > 0 
        ? `Removed ${totalRemoved} ${this.getItemName(itemId)}${totalRemoved > 1 ? 's' : ''}`
        : 'Item not found',
      removedQuantity: totalRemoved
    };
  }

  useItem(itemId: string, targetId?: string, context?: any): UseItemResult {
    const slot = this.slots.find(s => s.item && s.item.id === itemId);
    if (!slot || !slot.item) {
      return {
        success: false,
        message: 'Item not found',
        itemConsumed: false,
        quantityUsed: 0
      };
    }

    const item = slot.item;
    
    if (!item.usable) {
      return {
        success: false,
        message: `${item.name} cannot be used`,
        itemConsumed: false,
        quantityUsed: 0
      };
    }

    // Check requirements
    if (item.requirements) {
      for (const req of item.requirements) {
        if (!this.checkRequirement(req, context)) {
          return {
            success: false,
            message: req.description,
            itemConsumed: false,
            quantityUsed: 0
          };
        }
      }
    }

    // Apply effects
    const effects: UseItemResult['effects'] = [];
    let success = true;

    if (item.effects) {
      for (const effect of item.effects) {
        const result = this.applyItemEffect(effect, targetId, context);
        if (result) {
          effects.push(result);
        } else {
          success = false;
        }
      }
    }

    // Handle consumption
    let itemConsumed = false;
    let quantityUsed = 0;

    if (success && item.consumable) {
      slot.item.quantity -= 1;
      quantityUsed = 1;

      if (slot.item.quantity <= 0) {
        slot.item = null;
        slot.category = undefined;
        itemConsumed = true;
      }
    }

    return {
      success,
      message: success 
        ? `Used ${item.name}${effects.length > 0 ? ': ' + effects.map(e => e.type).join(', ') : ''}`
        : `Failed to use ${item.name}`,
      effects,
      itemConsumed,
      quantityUsed
    };
  }

  // Item management
  moveItem(fromIndex: number, toIndex: number): boolean {
    if (fromIndex < 0 || fromIndex >= this.slots.length || 
        toIndex < 0 || toIndex >= this.slots.length ||
        fromIndex === toIndex) {
      return false;
    }

    const fromSlot = this.slots[fromIndex];
    const toSlot = this.slots[toIndex];

    if (toSlot.isLocked) {
      return false;
    }

    // Simple swap
    if (!toSlot.item || !fromSlot.item) {
      [fromSlot.item, toSlot.item] = [toSlot.item, fromSlot.item];
      [fromSlot.category, toSlot.category] = [toSlot.category, fromSlot.category];
      return true;
    }

    // Try to stack if same item
    if (this.config.autoStack && 
        fromSlot.item.id === toSlot.item.id && 
        toSlot.item.quantity < toSlot.item.maxStack) {
      
      const canMove = Math.min(
        fromSlot.item.quantity, 
        toSlot.item.maxStack - toSlot.item.quantity
      );
      
      toSlot.item.quantity += canMove;
      fromSlot.item.quantity -= canMove;
      
      if (fromSlot.item.quantity <= 0) {
        fromSlot.item = null;
        fromSlot.category = undefined;
      }
      
      return true;
    }

    // Swap items
    [fromSlot.item, toSlot.item] = [toSlot.item, fromSlot.item];
    [fromSlot.category, toSlot.category] = [toSlot.category, fromSlot.category];
    return true;
  }

  splitStack(slotIndex: number, splitQuantity: number): boolean {
    const slot = this.slots[slotIndex];
    if (!slot.item || slot.item.quantity <= splitQuantity || splitQuantity <= 0) {
      return false;
    }

    const emptySlot = this.slots.find(s => !s.item && !s.isLocked);
    if (!emptySlot) {
      return false;
    }

    emptySlot.item = {
      ...slot.item,
      quantity: splitQuantity
    };
    emptySlot.category = slot.category;
    
    slot.item.quantity -= splitQuantity;
    return true;
  }

  // Quick use slots
  setQuickUseSlot(quickSlotIndex: number, inventorySlotIndex: number): boolean {
    if (quickSlotIndex < 0 || quickSlotIndex >= this.config.quickUseSlots ||
        inventorySlotIndex < 0 || inventorySlotIndex >= this.slots.length) {
      return false;
    }

    this.quickUseSlots[quickSlotIndex] = inventorySlotIndex;
    return true;
  }

  useQuickSlot(quickSlotIndex: number, targetId?: string, context?: any): UseItemResult {
    if (quickSlotIndex < 0 || quickSlotIndex >= this.config.quickUseSlots) {
      return {
        success: false,
        message: 'Invalid quick slot',
        itemConsumed: false,
        quantityUsed: 0
      };
    }

    const slotIndex = this.quickUseSlots[quickSlotIndex];
    const slot = this.slots[slotIndex];
    
    if (!slot?.item) {
      return {
        success: false,
        message: 'Quick slot is empty',
        itemConsumed: false,
        quantityUsed: 0
      };
    }

    return this.useItem(slot.item.id, targetId, context);
  }

  // Utility methods
  sortInventory(): void {
    // Sort by category, then rarity, then name
    const itemSlots = this.slots.filter(slot => slot.item && !slot.isLocked);
    const emptySlots = this.slots.filter(slot => !slot.item && !slot.isLocked);
    const lockedSlots = this.slots.filter(slot => slot.isLocked);

    itemSlots.sort((a, b) => {
      if (!a.item || !b.item) return 0;
      
      // Sort by category
      const categoryOrder = this.categories.indexOf(a.item.type) - this.categories.indexOf(b.item.type);
      if (categoryOrder !== 0) return categoryOrder;
      
      // Sort by rarity
      const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
      const rarityComparison = rarityOrder.indexOf(a.item.rarity) - rarityOrder.indexOf(b.item.rarity);
      if (rarityComparison !== 0) return rarityComparison;
      
      // Sort by name
      return a.item.name.localeCompare(b.item.name);
    });

    // Reassign slots
    let currentIndex = 0;
    
    // Place locked slots first
    for (const slot of lockedSlots) {
      this.slots[currentIndex] = slot;
      this.slots[currentIndex].index = currentIndex;
      currentIndex++;
    }
    
    // Place item slots
    for (const slot of itemSlots) {
      this.slots[currentIndex] = slot;
      this.slots[currentIndex].index = currentIndex;
      currentIndex++;
    }
    
    // Place empty slots
    for (const slot of emptySlots) {
      this.slots[currentIndex] = slot;
      this.slots[currentIndex].index = currentIndex;
      currentIndex++;
    }
  }

  findItems(predicate: (item: InventoryItem) => boolean): InventorySlot[] {
    return this.slots.filter(slot => slot.item && predicate(slot.item));
  }

  getItemCount(itemId: string): number {
    return this.slots
      .filter(slot => slot.item && slot.item.id === itemId)
      .reduce((total, slot) => total + (slot.item?.quantity || 0), 0);
  }

  hasItem(itemId: string, minQuantity: number = 1): boolean {
    return this.getItemCount(itemId) >= minQuantity;
  }

  getItemsByCategory(category: string): InventorySlot[] {
    return this.slots.filter(slot => slot.item && slot.item.type === category);
  }

  getEmptySlotCount(): number {
    return this.slots.filter(slot => !slot.item && !slot.isLocked).length;
  }

  getTotalItemCount(): number {
    return this.slots
      .filter(slot => slot.item)
      .reduce((total, slot) => total + (slot.item?.quantity || 0), 0);
  }

  // Private helper methods
  private applyItemEffect(effect: ItemEffect, targetId?: string, context?: any): UseItemResult['effects'][0] | null {
    // This would integrate with the game's stat/entity system
    // For now, return a mock result
    return {
      type: effect.type,
      oldValue: 50, // Would get from actual target
      newValue: 50 + effect.value,
      target: targetId || 'player'
    };
  }

  private checkRequirement(requirement: ItemRequirement, context?: any): boolean {
    // This would check against actual game state
    // For now, return true for all requirements
    return true;
  }

  private getItemName(itemId: string): string {
    const slot = this.slots.find(s => s.item && s.item.id === itemId);
    return slot?.item?.name || 'Unknown Item';
  }

  // Serialization
  serialize(): any {
    return {
      slots: this.slots.map(slot => ({
        index: slot.index,
        item: slot.item,
        isLocked: slot.isLocked,
        category: slot.category
      })),
      quickUseSlots: this.quickUseSlots,
      config: this.config
    };
  }

  deserialize(data: any): void {
    if (data.slots) {
      this.slots = data.slots;
    }
    if (data.quickUseSlots) {
      this.quickUseSlots = data.quickUseSlots;
    }
    if (data.config) {
      this.config = { ...this.config, ...data.config };
    }
  }

  // Getters
  getSlots(): InventorySlot[] {
    return [...this.slots];
  }

  getQuickUseSlots(): number[] {
    return [...this.quickUseSlots];
  }

  getConfig(): InventoryConfig {
    return { ...this.config };
  }

  getCategories(): string[] {
    return [...this.categories];
  }
}

// Global inventory system
let inventoryInstance: InventorySystem | null = null;

export function getInventorySystem(): InventorySystem {
  if (!inventoryInstance) {
    inventoryInstance = new InventorySystem();
  }
  return inventoryInstance;
}

// Item database with common items
export const ITEM_DATABASE: Record<string, Omit<InventoryItem, 'quantity'>> = {
  'apple': {
    id: 'apple',
    type: 'food',
    name: 'Apple',
    description: 'A crisp, sweet apple that most animals enjoy',
    icon: '🍎',
    maxStack: 10,
    rarity: 'common',
    value: 5,
    usable: true,
    consumable: true,
    effects: [
      {
        type: 'trust',
        value: 5,
        target: 'animal',
        description: 'Increases animal trust slightly'
      }
    ]
  },
  
  'carrot': {
    id: 'carrot',
    type: 'food',
    name: 'Carrot',
    description: 'A crunchy orange carrot, perfect for rabbits',
    icon: '🥕',
    maxStack: 10,
    rarity: 'common',
    value: 3,
    usable: true,
    consumable: true,
    effects: [
      {
        type: 'trust',
        value: 8,
        target: 'animal',
        description: 'Greatly increases rabbit trust'
      }
    ],
    requirements: [
      {
        type: 'animal_type',
        value: 'rabbit',
        description: 'Can only be used with rabbits'
      }
    ]
  },
  
  'ball': {
    id: 'ball',
    type: 'toy',
    name: 'Rubber Ball',
    description: 'A bouncy ball that animals love to chase',
    icon: '⚽',
    maxStack: 5,
    rarity: 'common',
    value: 15,
    usable: true,
    consumable: false,
    effects: [
      {
        type: 'happiness',
        value: 10,
        target: 'animal',
        description: 'Increases animal happiness'
      }
    ]
  },
  
  'healing_potion': {
    id: 'healing_potion',
    type: 'special',
    name: 'Healing Potion',
    description: 'A magical potion that restores energy',
    icon: '🧪',
    maxStack: 3,
    rarity: 'uncommon',
    value: 50,
    usable: true,
    consumable: true,
    effects: [
      {
        type: 'energy',
        value: 25,
        target: 'player',
        description: 'Restores 25 energy'
      }
    ]
  },
  
  'net': {
    id: 'net',
    type: 'tool',
    name: 'Catching Net',
    description: 'A net for safely catching small animals',
    icon: '🕸️',
    maxStack: 1,
    rarity: 'uncommon',
    value: 100,
    usable: true,
    consumable: false,
    effects: [
      {
        type: 'attraction',
        value: 15,
        target: 'animal',
        description: 'Increases chance of successful animal approach'
      }
    ]
  }
};

// Convenience functions
export function createItem(itemId: string, quantity: number = 1): InventoryItem | null {
  const template = ITEM_DATABASE[itemId];
  if (!template) return null;
  
  return {
    ...template,
    quantity: Math.min(quantity, template.maxStack)
  };
}
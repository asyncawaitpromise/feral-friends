// Input Manager System
// Handles touch, keyboard, and mouse inputs with input buffering and responsive controls

export type InputAction = 'up' | 'down' | 'left' | 'right' | 'action_a' | 'action_b' | 'pause' | 'tap';

export interface InputEvent {
  action: InputAction;
  pressed: boolean;
  timestamp: number;
  position?: { x: number; y: number };
  originalEvent?: Event;
}

export interface InputState {
  [key: string]: {
    pressed: boolean;
    justPressed: boolean;
    justReleased: boolean;
    pressTime: number;
    releaseTime: number;
  };
}

export interface TouchState {
  isActive: boolean;
  startPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
  startTime: number;
  identifier: number;
}

export interface InputConfig {
  enableKeyboard?: boolean;
  enableTouch?: boolean;
  enableMouse?: boolean;
  inputBufferSize?: number;
  inputBufferTimeout?: number;
  touchSensitivity?: number;
  doubleTapDelay?: number;
  longPressDelay?: number;
}

export class InputManager {
  private element: HTMLElement;
  private config: Required<InputConfig>;
  
  // Input state tracking
  private inputState: InputState = {};
  private inputBuffer: InputEvent[] = [];
  private callbacks: Map<InputAction, ((event: InputEvent) => void)[]> = new Map();
  
  // Touch state
  private touches: Map<number, TouchState> = new Map();
  private lastTapTime: number = 0;
  private lastTapPosition: { x: number; y: number } = { x: 0, y: 0 };
  
  // Keyboard mappings
  private keyboardMappings: Map<string, InputAction> = new Map([
    ['ArrowUp', 'up'],
    ['KeyW', 'up'],
    ['ArrowDown', 'down'],
    ['KeyS', 'down'],
    ['ArrowLeft', 'left'],
    ['KeyA', 'left'],
    ['ArrowRight', 'right'],
    ['KeyD', 'right'],
    ['Space', 'action_a'],
    ['Enter', 'action_a'],
    ['KeyX', 'action_a'],
    ['KeyZ', 'action_b'],
    ['Escape', 'pause'],
    ['KeyP', 'pause'],
  ]);
  
  // Performance optimization
  private frameDropDetection: number[] = [];
  private lastFrameTime: number = 0;
  
  constructor(element: HTMLElement, config: InputConfig = {}) {
    this.element = element;
    this.config = {
      enableKeyboard: config.enableKeyboard ?? true,
      enableTouch: config.enableTouch ?? true,
      enableMouse: config.enableMouse ?? true,
      inputBufferSize: config.inputBufferSize ?? 10,
      inputBufferTimeout: config.inputBufferTimeout ?? 200,
      touchSensitivity: config.touchSensitivity ?? 20,
      doubleTapDelay: config.doubleTapDelay ?? 300,
      longPressDelay: config.longPressDelay ?? 500,
    };
    
    this.setupEventListeners();
    this.initializeInputState();
  }
  
  /**
   * Register callback for specific input action
   */
  public on(action: InputAction, callback: (event: InputEvent) => void): void {
    if (!this.callbacks.has(action)) {
      this.callbacks.set(action, []);
    }
    this.callbacks.get(action)!.push(callback);
  }
  
  /**
   * Remove callback for specific input action
   */
  public off(action: InputAction, callback: (event: InputEvent) => void): void {
    const callbacks = this.callbacks.get(action);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
  
  /**
   * Check if input is currently pressed
   */
  public isPressed(action: InputAction): boolean {
    return this.inputState[action]?.pressed ?? false;
  }
  
  /**
   * Check if input was just pressed this frame
   */
  public isJustPressed(action: InputAction): boolean {
    return this.inputState[action]?.justPressed ?? false;
  }
  
  /**
   * Check if input was just released this frame
   */
  public isJustReleased(action: InputAction): boolean {
    return this.inputState[action]?.justReleased ?? false;
  }
  
  /**
   * Get how long input has been pressed (in milliseconds)
   */
  public getPressTime(action: InputAction): number {
    const state = this.inputState[action];
    if (!state || !state.pressed) return 0;
    return Date.now() - state.pressTime;
  }
  
  /**
   * Update input manager (call once per frame)
   */
  public update(): void {
    // Clear just pressed/released flags
    Object.values(this.inputState).forEach(state => {
      state.justPressed = false;
      state.justReleased = false;
    });
    
    // Clean up old input buffer entries
    const now = Date.now();
    this.inputBuffer = this.inputBuffer.filter(
      event => now - event.timestamp < this.config.inputBufferTimeout
    );
    
    // Limit buffer size
    if (this.inputBuffer.length > this.config.inputBufferSize) {
      this.inputBuffer = this.inputBuffer.slice(-this.config.inputBufferSize);
    }
    
    // Track frame drops for performance optimization
    this.trackFramePerformance();
  }
  
  /**
   * Get recent input events from buffer
   */
  public getInputBuffer(): InputEvent[] {
    return [...this.inputBuffer];
  }
  
  /**
   * Clear input buffer
   */
  public clearInputBuffer(): void {
    this.inputBuffer = [];
  }
  
  /**
   * Set keyboard mapping for custom controls
   */
  public setKeyboardMapping(key: string, action: InputAction): void {
    this.keyboardMappings.set(key, action);
  }
  
  /**
   * Remove keyboard mapping
   */
  public removeKeyboardMapping(key: string): void {
    this.keyboardMappings.delete(key);
  }
  
  /**
   * Destroy input manager and clean up event listeners
   */
  public destroy(): void {
    this.removeEventListeners();
    this.callbacks.clear();
    this.touches.clear();
    this.inputBuffer = [];
    this.frameDropDetection = [];
  }
  
  /**
   * Setup all event listeners
   */
  private setupEventListeners(): void {
    if (this.config.enableKeyboard) {
      document.addEventListener('keydown', this.handleKeyDown.bind(this));
      document.addEventListener('keyup', this.handleKeyUp.bind(this));
    }
    
    if (this.config.enableTouch) {
      this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
      this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
      this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
      this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });
    }
    
    if (this.config.enableMouse) {
      this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
      this.element.addEventListener('mouseup', this.handleMouseUp.bind(this));
      this.element.addEventListener('mousemove', this.handleMouseMove.bind(this));
      this.element.addEventListener('click', this.handleClick.bind(this));
    }
    
    // Prevent context menu on long press
    this.element.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  
  /**
   * Remove all event listeners
   */
  private removeEventListeners(): void {
    if (this.config.enableKeyboard) {
      document.removeEventListener('keydown', this.handleKeyDown.bind(this));
      document.removeEventListener('keyup', this.handleKeyUp.bind(this));
    }
    
    if (this.config.enableTouch) {
      this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
      this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this));
      this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
      this.element.removeEventListener('touchcancel', this.handleTouchCancel.bind(this));
    }
    
    if (this.config.enableMouse) {
      this.element.removeEventListener('mousedown', this.handleMouseDown.bind(this));
      this.element.removeEventListener('mouseup', this.handleMouseUp.bind(this));
      this.element.removeEventListener('mousemove', this.handleMouseMove.bind(this));
      this.element.removeEventListener('click', this.handleClick.bind(this));
    }
  }
  
  /**
   * Initialize input state for all actions
   */
  private initializeInputState(): void {
    const actions: InputAction[] = ['up', 'down', 'left', 'right', 'action_a', 'action_b', 'pause', 'tap'];
    actions.forEach(action => {
      this.inputState[action] = {
        pressed: false,
        justPressed: false,
        justReleased: false,
        pressTime: 0,
        releaseTime: 0,
      };
    });
  }
  
  /**
   * Trigger input event
   */
  private triggerInput(action: InputAction, pressed: boolean, position?: { x: number; y: number }, originalEvent?: Event): void {
    const now = Date.now();
    const state = this.inputState[action];
    
    if (pressed && !state.pressed) {
      // Just pressed
      state.pressed = true;
      state.justPressed = true;
      state.pressTime = now;
    } else if (!pressed && state.pressed) {
      // Just released
      state.pressed = false;
      state.justReleased = true;
      state.releaseTime = now;
    }
    
    // Create input event
    const inputEvent: InputEvent = {
      action,
      pressed,
      timestamp: now,
      position,
      originalEvent,
    };
    
    // Add to buffer
    this.inputBuffer.push(inputEvent);
    
    // Trigger callbacks
    const callbacks = this.callbacks.get(action);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(inputEvent);
        } catch (error) {
          console.error('Error in input callback:', error);
        }
      });
    }
  }
  
  /**
   * Handle keyboard down events
   */
  private handleKeyDown(event: KeyboardEvent): void {
    const action = this.keyboardMappings.get(event.code);
    if (action) {
      event.preventDefault();
      this.triggerInput(action, true, undefined, event);
    }
  }
  
  /**
   * Handle keyboard up events
   */
  private handleKeyUp(event: KeyboardEvent): void {
    const action = this.keyboardMappings.get(event.code);
    if (action) {
      event.preventDefault();
      this.triggerInput(action, false, undefined, event);
    }
  }
  
  /**
   * Handle touch start events
   */
  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
    
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const rect = this.element.getBoundingClientRect();
      const position = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
      
      const touchState: TouchState = {
        isActive: true,
        startPosition: position,
        currentPosition: position,
        startTime: Date.now(),
        identifier: touch.identifier,
      };
      
      this.touches.set(touch.identifier, touchState);
      
      // Check for double tap
      this.checkDoubleTap(position);
    }
  }
  
  /**
   * Handle touch move events
   */
  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();
    
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const touchState = this.touches.get(touch.identifier);
      
      if (touchState) {
        const rect = this.element.getBoundingClientRect();
        touchState.currentPosition = {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
        };
      }
    }
  }
  
  /**
   * Handle touch end events
   */
  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const touchState = this.touches.get(touch.identifier);
      
      if (touchState) {
        const rect = this.element.getBoundingClientRect();
        const endPosition = {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
        };
        
        const duration = Date.now() - touchState.startTime;
        const distance = Math.sqrt(
          Math.pow(endPosition.x - touchState.startPosition.x, 2) +
          Math.pow(endPosition.y - touchState.startPosition.y, 2)
        );
        
        // Detect tap vs swipe
        if (distance < this.config.touchSensitivity && duration < this.config.longPressDelay) {
          this.triggerInput('tap', false, endPosition, event);
        }
        
        this.touches.delete(touch.identifier);
      }
    }
  }
  
  /**
   * Handle touch cancel events
   */
  private handleTouchCancel(event: TouchEvent): void {
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      this.touches.delete(touch.identifier);
    }
  }
  
  /**
   * Handle mouse down events
   */
  private handleMouseDown(event: MouseEvent): void {
    const rect = this.element.getBoundingClientRect();
    const position = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    
    if (event.button === 0) { // Left click
      this.triggerInput('action_a', true, position, event);
    } else if (event.button === 2) { // Right click
      this.triggerInput('action_b', true, position, event);
    }
  }
  
  /**
   * Handle mouse up events
   */
  private handleMouseUp(event: MouseEvent): void {
    const rect = this.element.getBoundingClientRect();
    const position = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    
    if (event.button === 0) { // Left click
      this.triggerInput('action_a', false, position, event);
    } else if (event.button === 2) { // Right click
      this.triggerInput('action_b', false, position, event);
    }
  }
  
  /**
   * Handle mouse move events
   */
  private handleMouseMove(event: MouseEvent): void {
    // Mouse move handling can be added here if needed
  }
  
  /**
   * Handle click events
   */
  private handleClick(event: MouseEvent): void {
    const rect = this.element.getBoundingClientRect();
    const position = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    
    this.triggerInput('tap', false, position, event);
  }
  
  /**
   * Check for double tap
   */
  private checkDoubleTap(position: { x: number; y: number }): void {
    const now = Date.now();
    const timeDiff = now - this.lastTapTime;
    const distance = Math.sqrt(
      Math.pow(position.x - this.lastTapPosition.x, 2) +
      Math.pow(position.y - this.lastTapPosition.y, 2)
    );
    
    if (timeDiff < this.config.doubleTapDelay && distance < this.config.touchSensitivity) {
      // Double tap detected
      console.log('Double tap detected');
    }
    
    this.lastTapTime = now;
    this.lastTapPosition = position;
  }
  
  /**
   * Track frame performance for input optimization
   */
  private trackFramePerformance(): void {
    const now = performance.now();
    if (this.lastFrameTime > 0) {
      const frameTime = now - this.lastFrameTime;
      this.frameDropDetection.push(frameTime);
      
      // Keep only recent frame times
      if (this.frameDropDetection.length > 60) {
        this.frameDropDetection.shift();
      }
      
      // Detect frame drops and adjust input sensitivity
      const avgFrameTime = this.frameDropDetection.reduce((a, b) => a + b, 0) / this.frameDropDetection.length;
      if (avgFrameTime > 20) { // More than 20ms average (less than 50fps)
        // Consider reducing input processing for performance
        console.debug('InputManager: Frame drops detected, average frame time:', avgFrameTime);
      }
    }
    this.lastFrameTime = now;
  }
}

// Utility function to create input manager with common configuration
export function createInputManager(element: HTMLElement, config: InputConfig = {}): InputManager {
  return new InputManager(element, config);
}

// Export InputManager as default
export default InputManager;
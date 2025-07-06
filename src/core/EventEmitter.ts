export type EventCallback<T = any> = (data: T) => void;

export class EventEmitter {
  protected eventListeners: Map<string, EventCallback[]> = new Map();

  /**
   * Add an event listener
   */
  public on<T = any>(event: string, callback: EventCallback<T>): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove an event listener
   */
  public off(event: string, callback?: EventCallback): void {
    if (!this.eventListeners.has(event)) {
      return;
    }

    if (!callback) {
      // Remove all listeners for this event
      this.eventListeners.delete(event);
      return;
    }

    const callbacks = this.eventListeners.get(event)!;
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }

    // Clean up empty event arrays
    if (callbacks.length === 0) {
      this.eventListeners.delete(event);
    }
  }

  /**
   * Add a one-time event listener
   */
  public once<T = any>(event: string, callback: EventCallback<T>): void {
    const onceCallback = (data: T) => {
      callback(data);
      this.off(event, onceCallback);
    };
    this.on(event, onceCallback);
  }

  /**
   * Emit an event
   */
  public emit<T = any>(event: string, data?: T): void {
    const callbacks = this.eventListeners.get(event);
    if (!callbacks) {
      return;
    }

    // Create a copy to avoid issues if listeners modify the array
    const callbacksCopy = [...callbacks];
    
    for (const callback of callbacksCopy) {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for '${event}':`, error);
      }
    }
  }

  /**
   * Get all event names
   */
  public eventNames(): string[] {
    return Array.from(this.eventListeners.keys());
  }

  /**
   * Get listener count for an event
   */
  public listenerCount(event: string): number {
    const callbacks = this.eventListeners.get(event);
    return callbacks ? callbacks.length : 0;
  }

  /**
   * Remove all event listeners
   */
  public removeAllListeners(event?: string): void {
    if (event) {
      this.eventListeners.delete(event);
    } else {
      this.eventListeners.clear();
    }
  }

  /**
   * Get all listeners for an event
   */
  public listeners(event: string): EventCallback[] {
    const callbacks = this.eventListeners.get(event);
    return callbacks ? [...callbacks] : [];
  }
}

/**
 * RetroCSS Events
 * Simple event emitter for component communication
 */

const RetroEvents = {
  _events: {},
  
  /**
   * Register an event handler
   * @param {string} event - Event name to listen for
   * @param {function} handler - Handler function to call
   */
  on(event, handler) {
    if (!this._events[event]) this._events[event] = [];
    this._events[event].push(handler);
  },
  
  /**
   * Remove an event handler
   * @param {string} event - Event name
   * @param {function} handler - Handler function to remove
   */
  off(event, handler) {
    if (this._events[event]) {
      this._events[event] = this._events[event].filter(h => h !== handler);
    }
  },
  
  /**
   * Emit an event with optional data
   * @param {string} event - Event name to emit
   * @param {object} detail - Data to pass to handlers
   */
  emit(event, detail = {}) {
    if (this._events[event]) {
      this._events[event].forEach(handler => handler(detail));
    }
    
    // Also dispatch as a DOM custom event for broader interoperability
    document.dispatchEvent(new CustomEvent(`retro:${event}`, { 
      detail,
      bubbles: true
    }));
  }
};

export default RetroEvents; 
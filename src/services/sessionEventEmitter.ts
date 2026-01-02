/**
 * EventEmitter para manejar eventos de sesión
 *
 * Este servicio centraliza los eventos relacionados con la sesión del usuario,
 * especialmente cuando el token expira (error 401) para notificar a todos los
 * componentes que necesiten reaccionar.
 */

type EventListener = (...args: any[]) => void;

class SessionEventEmitter {
  private events: { [key: string]: EventListener[] } = {};

  /**
   * Suscribirse a un evento
   */
  on(event: string, listener: EventListener): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  /**
   * Desuscribirse de un evento
   */
  off(event: string, listenerToRemove: EventListener): void {
    if (!this.events[event]) return;

    this.events[event] = this.events[event].filter(
      listener => listener !== listenerToRemove
    );
  }

  /**
   * Emitir un evento
   */
  emit(event: string, ...args: any[]): void {
    if (!this.events[event]) return;

    this.events[event].forEach(listener => {
      try {
        listener(...args);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  /**
   * Suscribirse a un evento una sola vez
   */
  once(event: string, listener: EventListener): void {
    const onceWrapper = (...args: any[]) => {
      listener(...args);
      this.off(event, onceWrapper);
    };
    this.on(event, onceWrapper);
  }

  /**
   * Limpiar todos los listeners de un evento
   */
  removeAllListeners(event?: string): void {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
}

// Singleton instance
const sessionEventEmitter = new SessionEventEmitter();

// Eventos disponibles
export const SESSION_EVENTS = {
  SESSION_EXPIRED: 'session:expired',
  SESSION_REFRESHED: 'session:refreshed',
  AUTH_ERROR: 'auth:error',
  LOGOUT: 'logout',
  LOGIN_SUCCESS: 'login:success',
  TOKEN_INVALID: 'token:invalid',
  RATE_LIMITED: 'rate:limited',
} as const;

export default sessionEventEmitter;

/**
 * Tipos de eventos para TypeScript
 */
export type SessionEvent = typeof SESSION_EVENTS[keyof typeof SESSION_EVENTS];
/**
 * Minimal event bus for help tours.
 * Screens register handlers; AyudaScreen triggers them (or queues for screens not yet mounted).
 */
const handlers = {};
let pending = null;

export const helpEvents = {
  register(screen, fn) {
    handlers[screen] = fn;
    if (pending === screen) {
      pending = null;
      setTimeout(fn, 150);
    }
  },
  unregister(screen) {
    delete handlers[screen];
  },
  trigger(screen) {
    if (handlers[screen]) {
      handlers[screen]();
    } else {
      pending = screen;
    }
  },
};

import { registerRootComponent } from 'expo';

import App from './App';

if (process.env.NODE_ENV === 'production') {
  const noop = () => {};
  ['log', 'warn', 'error', 'info', 'debug', 'table', 'trace', 'group', 'groupEnd'].forEach(
    (method) => { console[method] = noop; }
  );
}

registerRootComponent(App);

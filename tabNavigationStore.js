let _navigate = null;

export function setTabNavigate(fn) {
  _navigate = fn;
}

export function tabNavigate(tab, screen) {
  if (!_navigate) return;
  if (screen) {
    _navigate(tab, { screen });
  } else {
    _navigate(tab);
  }
}

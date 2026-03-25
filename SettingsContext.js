import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const API_BASE = 'http://localhost:8080';

const SETTINGS_DEFAULT = { roles: [], acabados: [], tintas_especiales: [], estados_pedido: [] };

export const SettingsContext = createContext({
  settings: SETTINGS_DEFAULT,
  estadoRules: {},
  modoCreacion: 'manual',
  recargarSettings: () => {},
  setModoCreacion: () => {},
});

export function useSettings() {
  return useContext(SettingsContext);
}

export function SettingsProvider({ children, authUser }) {
  const [settings, setSettings] = useState(SETTINGS_DEFAULT);
  const [estadoRules, setEstadoRules] = useState({});
  const [modoCreacion, setModoCreacionState] = useState('manual');

  const cargarSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings`);
      if (!res.ok) return;
      const data = await res.json();
      if (data?.settings) {
        setSettings({
          roles: data.settings.roles || [],
          acabados: data.settings.acabados || [],
          tintas_especiales: data.settings.tintas_especiales || [],
          estados_pedido: data.settings.estados_pedido || [],
        });
      }
    } catch (_) {}
  }, []);

  const cargarEstadoRules = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings/estados-pedido-rules`);
      if (!res.ok) return;
      const data = await res.json();
      if (data?.rules) setEstadoRules((prev) => ({ ...prev, ...data.rules }));
    } catch (_) {}
  }, []);

  const cargarModoCreacion = useCallback(async () => {
    try {
      const token = global.__MIAPP_ACCESS_TOKEN;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE}/api/settings/modo-creacion`, { headers });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.modo_creacion) setModoCreacionState(String(data.modo_creacion));
    } catch (_) {}
  }, []);

  const recargarSettings = useCallback(async () => {
    await Promise.all([cargarSettings(), cargarEstadoRules(), cargarModoCreacion()]);
  }, [cargarSettings, cargarEstadoRules, cargarModoCreacion]);

  // Carga cuando el usuario se autentica; resetea al cerrar sesión
  useEffect(() => {
    if (authUser) recargarSettings();
    else {
      setSettings(SETTINGS_DEFAULT);
      setEstadoRules({});
      setModoCreacionState('manual');
    }
  }, [authUser, recargarSettings]);

  const setModoCreacion = useCallback(async (modo) => {
    setModoCreacionState(modo); // optimista
    try {
      const token = global.__MIAPP_ACCESS_TOKEN;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      await fetch(`${API_BASE}/api/settings/modo-creacion`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ modo }),
      });
    } catch (_) {}
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, setSettings, estadoRules, modoCreacion, recargarSettings, setModoCreacion }}>
      {children}
    </SettingsContext.Provider>
  );
}

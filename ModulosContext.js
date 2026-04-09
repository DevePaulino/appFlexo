import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const API_MODULOS_URL = 'http://localhost:8080/api/settings/modulos';

const MODULOS_DEFAULT = {
  consumo_material: false,
  produccion: false,
  produccion_trigger_estado: '',
  presupuestos: true,
  condiciones_impresion: false,
};

export const ModulosContext = createContext({ modulos: MODULOS_DEFAULT, setModulo: () => {} });

export function useModulos() {
  return useContext(ModulosContext);
}

export function ModulosProvider({ children, authUser }) {
  const [modulos, setModulos] = useState(MODULOS_DEFAULT);

  const cargarModulos = useCallback(async () => {
    try {
      const token = global.__MIAPP_ACCESS_TOKEN;
      if (!token) return;
      const res = await fetch(API_MODULOS_URL, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.modulos) setModulos((prev) => ({ ...prev, ...data.modulos, consumo_material: false }));
    } catch (_) {}
  }, []);

  // Se recarga cada vez que el usuario inicia sesión (authUser cambia de null a objeto)
  useEffect(() => {
    if (authUser) cargarModulos();
    else setModulos(MODULOS_DEFAULT);
  }, [authUser, cargarModulos]);

  const setModulo = useCallback(async (key, value) => {
    // Actualización optimista inmediata
    setModulos((prev) => ({ ...prev, [key]: value }));
    try {
      const token = global.__MIAPP_ACCESS_TOKEN;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(API_MODULOS_URL, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ [key]: value }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.modulos) setModulos((prev) => ({ ...prev, ...data.modulos, consumo_material: false }));
      } else {
        // Revertir si el servidor rechaza el cambio
        setModulos((prev) => ({ ...prev, [key]: !value }));
      }
    } catch (_) {
      setModulos((prev) => ({ ...prev, [key]: !value }));
    }
  }, []);

  return (
    <ModulosContext.Provider value={{ modulos, setModulo, recargarModulos: cargarModulos }}>
      {children}
    </ModulosContext.Provider>
  );
}

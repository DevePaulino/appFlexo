import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const API_BASE = 'http://localhost:8080';

export const MaquinasContext = createContext({ maquinas: [], recargarMaquinas: () => {} });

export function useMaquinas() {
  return useContext(MaquinasContext);
}

export function MaquinasProvider({ children, authUser }) {
  const [maquinas, setMaquinas] = useState([]);

  const recargarMaquinas = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/maquinas`);
      if (!res.ok) return;
      const data = await res.json();
      setMaquinas(data.maquinas || []);
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (authUser) recargarMaquinas();
    else setMaquinas([]);
  }, [authUser, recargarMaquinas]);

  return (
    <MaquinasContext.Provider value={{ maquinas, recargarMaquinas }}>
      {children}
    </MaquinasContext.Provider>
  );
}

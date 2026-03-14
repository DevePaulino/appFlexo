import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const API_BASE = 'http://localhost:8080';

export const ClientesContext = createContext({ clientes: [], recargarClientes: () => {} });

export function useClientes() {
  return useContext(ClientesContext);
}

export function ClientesProvider({ children, authUser }) {
  const [clientes, setClientes] = useState([]);

  const recargarClientes = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/clientes`);
      if (!res.ok) return;
      const data = await res.json();
      setClientes(data.clientes || []);
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (authUser) recargarClientes();
    else setClientes([]);
  }, [authUser, recargarClientes]);

  return (
    <ClientesContext.Provider value={{ clientes, recargarClientes }}>
      {children}
    </ClientesContext.Provider>
  );
}

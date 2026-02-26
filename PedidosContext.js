import React, { createContext, useState, useCallback } from 'react';

export const PedidosContext = createContext();

export function PedidosProvider({ children }) {
  const [actualizacionPedidos, setActualizacionPedidos] = useState(0);
  
  // Esta función se llama cuando se crea un nuevo pedido
  const notificarNuevoPedido = useCallback(() => {
    setActualizacionPedidos(prev => prev + 1);
  }, []);
  
  return (
    <PedidosContext.Provider value={{ actualizacionPedidos, notificarNuevoPedido }}>
      {children}
    </PedidosContext.Provider>
  );
}

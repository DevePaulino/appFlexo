import { useState, useEffect } from 'react';

/**
 * Hook para verificar permisos de rol de forma dinámica
 * @param {string} permission - Nombre del permiso a verificar (ej: 'manage_estados_pedido', 'edit_clientes')
 * @returns {boolean} - true si el rol actual tiene el permiso, false en caso contrario
 */
export const usePermission = (permission) => {
  const [isAllowed, setIsAllowed] = useState(true);

  const checkPermission = () => {
    const rolActual = typeof window !== 'undefined' && window.localStorage
      ? window.localStorage.getItem('PFP_SELECTED_ROLE')
      : null;
    
    // Si no hay rol seleccionado, permitir por defecto
    if (!rolActual) {
      setIsAllowed(true);
      return;
    }
    
    // Preguntar al backend si el rol tiene permiso
    fetch('http://localhost:8080/api/auth/verify-role-permission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: rolActual,
        permission: permission
      })
    })
      .then((res) => res.json())
      .then((data) => {
        setIsAllowed(data && data.allowed === true);
      })
      .catch(() => setIsAllowed(false));
  };

  // Verificar permiso al montar el componente
  useEffect(() => {
    checkPermission();
  }, [permission]);

  // Revalidar permisos cuando cambio el rol activo (sin recargar la página)
  useEffect(() => {
    const handler = () => checkPermission();
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('pfp-role-changed', handler);
    }
    return () => {
      if (typeof window !== 'undefined' && window.removeEventListener) {
        window.removeEventListener('pfp-role-changed', handler);
      }
    };
  }, [permission]);

  return isAllowed;
};

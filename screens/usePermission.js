import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para verificar permisos de rol de forma dinámica
 * @param {string} permission - Nombre del permiso a verificar (ej: 'manage_estados_pedido', 'edit_clientes')
 * @returns {boolean} - true si el rol actual tiene el permiso, false en caso contrario
 */
export const usePermission = (permission) => {
  const [isAllowed, setIsAllowed] = useState(true);

  const checkPermission = useCallback(() => {
    const rolActual = typeof window !== 'undefined' && window.localStorage
      ? window.localStorage.getItem('PFP_SELECTED_ROLE')
      : null;

    console.log('[usePermission] checkPermission:', { rolActual, permission, current: isAllowed });

    // Si no hay rol seleccionado, permitir por defecto
    if (!rolActual) {
      console.log('[usePermission] No rol selected, allowing by default');
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
        console.log('[usePermission] Backend response:', { rolActual, permission, allowed: data?.allowed });
        setIsAllowed(data && data.allowed === true);
      })
      .catch((err) => {
        console.log('[usePermission] Fetch error:', err);
        setIsAllowed(false);
      });
  }, [permission]);

  // Verificar permiso al montar el componente
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

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
  }, [checkPermission]);

  return isAllowed;
};

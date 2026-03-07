import { useCallback, useState } from 'react';

/**
 * useToast — hook para mostrar notificaciones inline
 *
 * Uso:
 *   const { toast, showToast, hideToast } = useToast();
 *
 *   // mostrar:
 *   showToast('Guardado correctamente', 'success');
 *   showToast('Error de conexión', 'error');
 *   showToast('Atención: revisa los datos', 'warning');
 *   showToast('Procesando...', 'info');
 *
 *   // en JSX (dentro del View raíz, al final):
 *   <Toast message={toast.message} type={toast.type} onHide={hideToast} />
 */
export default function useToast() {
  const [toast, setToast] = useState({ message: '', type: 'info' });

  const showToast = useCallback((message, type = 'info') => {
    // Resetear primero para que la animación re-arrange si ya hay un toast visible
    setToast({ message: '', type });
    setTimeout(() => setToast({ message, type }), 10);
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, message: '' }));
  }, []);

  return { toast, showToast, hideToast };
}

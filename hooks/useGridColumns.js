import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Gestiona visibilidad y orden de columnas de un grid, persistido por usuario.
 * Soporta columnDefs dinámicos: nuevas claves (ej. campos personalizados) se
 * añaden automáticamente al final sin borrar el orden guardado.
 * @param {string}      screenKey   - identificador único del grid (ej: 'clientes')
 * @param {Array}       columnDefs  - [{ key, label, flex, locked? }]
 * @param {string|null} userId      - id del usuario para persistencia individual
 */
export function useGridColumns(screenKey, columnDefs, userId = null) {
  const storageKey = `gridcols:${userId ?? 'shared'}:${screenKey}`;

  const [colState, setColState] = useState({ order: columnDefs.map(c => c.key), hidden: [] });
  const [loaded,   setLoaded]   = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(storageKey)
      .then(val => {
        if (val) {
          try {
            const saved   = JSON.parse(val);
            const allKeys = columnDefs.map(c => c.key);
            const order   = (saved.order || []).filter(k => allKeys.includes(k));
            allKeys.forEach(k => { if (!order.includes(k)) order.push(k); });
            setColState({
              order,
              hidden: (saved.hidden || []).filter(k => allKeys.includes(k)),
            });
          } catch { /* mantener defaults */ }
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  // Solo re-cargar de storage si cambia el storageKey (cambio de usuario/pantalla)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const toggleColumn = useCallback((key) => {
    setColState(prev => {
      const next = {
        ...prev,
        hidden: prev.hidden.includes(key)
          ? prev.hidden.filter(k => k !== key)
          : [...prev.hidden, key],
      };
      AsyncStorage.setItem(storageKey, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, [storageKey]);

  const reorderColumns = useCallback((newOrder) => {
    setColState(prev => {
      const next = { ...prev, order: newOrder };
      AsyncStorage.setItem(storageKey, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, [storageKey]);

  const resetColumns = useCallback(() => {
    const next = { order: columnDefs.map(c => c.key), hidden: [] };
    setColState(next);
    AsyncStorage.setItem(storageKey, JSON.stringify(next)).catch(() => {});
  // columnDefs se estabiliza con useMemo en el componente llamador
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, columnDefs]);

  // Columnas en orden del usuario. Las claves nuevas (campos dinámicos aún no
  // guardados en storage) se añaden al final de forma automática.
  const orderedCols = useMemo(() => {
    const allKeys  = columnDefs.map(c => c.key);
    const savedSet = new Set(colState.order);
    const extraKeys = allKeys.filter(k => !savedSet.has(k));
    const effectiveOrder = [...colState.order, ...extraKeys].filter(k => allKeys.includes(k));
    return effectiveOrder.map(key => columnDefs.find(c => c.key === key)).filter(Boolean);
  }, [colState.order, columnDefs]);

  // Solo las visibles, con flex redistribuido para que sumen 1
  const visibleColsWithFlex = useMemo(() => {
    const visible   = orderedCols.filter(c => !colState.hidden.includes(c.key));
    const totalFlex = visible.reduce((s, c) => s + (c.flex ?? 1), 0) || 1;
    return visible.map(c => ({ ...c, adjustedFlex: (c.flex ?? 1) / totalFlex }));
  }, [orderedCols, colState.hidden]);

  return {
    visibleCols:  visibleColsWithFlex,
    orderedCols,
    hiddenKeys:   colState.hidden,
    toggleColumn,
    reorderColumns,
    resetColumns,
    loaded,
  };
}

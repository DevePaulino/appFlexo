import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Gestiona visibilidad y orden de columnas de un grid, persistido por usuario.
 * Soporta columnDefs dinámicos: nuevas claves (ej. campos personalizados) se
 * añaden automáticamente al final sin borrar el orden guardado.
 * Columns con defaultHidden:true se ocultan por defecto hasta que el usuario las active.
 * @param {string}      screenKey   - identificador único del grid (ej: 'clientes')
 * @param {Array}       columnDefs  - [{ key, label, flex, locked?, defaultHidden? }]
 * @param {string|null} userId      - id del usuario para persistencia individual
 */
export function useGridColumns(screenKey, columnDefs, userId = null) {
  const storageKey = `gridcols:${userId ?? 'shared'}:${screenKey}`;

  const [colState, setColState] = useState(() => ({
    order:  columnDefs.map(c => c.key),
    hidden: columnDefs.filter(c => c.defaultHidden).map(c => c.key),
  }));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(storageKey)
      .then(val => {
        if (val) {
          try {
            const saved   = JSON.parse(val);
            const allKeys = columnDefs.map(c => c.key);
            const savedOrderSet = new Set(saved.order || []);
            const order   = (saved.order || []).filter(k => allKeys.includes(k));
            // Nuevas keys no guardadas → añadir al final, ocultas si tienen defaultHidden
            const newKeys = allKeys.filter(k => !savedOrderSet.has(k));
            newKeys.forEach(k => order.push(k));
            const newHidden = newKeys.filter(k => columnDefs.find(c => c.key === k)?.defaultHidden);
            setColState({
              order,
              hidden: [...(saved.hidden || []).filter(k => allKeys.includes(k)), ...newHidden],
            });
          } catch { /* mantener defaults */ }
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  // Solo re-cargar de storage si cambia el storageKey (cambio de usuario/pantalla)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Columnas en orden del usuario. Las claves nuevas (campos dinámicos aún no
  // guardados en storage) se añaden al final de forma automática.
  const orderedCols = useMemo(() => {
    const allKeys  = columnDefs.map(c => c.key);
    const savedSet = new Set(colState.order);
    const extraKeys = allKeys.filter(k => !savedSet.has(k));
    const effectiveOrder = [...colState.order, ...extraKeys].filter(k => allKeys.includes(k));
    return effectiveOrder.map(key => columnDefs.find(c => c.key === key)).filter(Boolean);
  }, [colState.order, columnDefs]);

  // Keys efectivamente ocultas: las de colState.hidden + las nuevas con defaultHidden
  // (antes de que el usuario las toque por primera vez)
  const effectiveHiddenKeys = useMemo(() => {
    const savedSet = new Set(colState.order);
    const extraDefaultHidden = columnDefs
      .filter(c => !savedSet.has(c.key) && c.defaultHidden)
      .map(c => c.key);
    return [...new Set([...colState.hidden, ...extraDefaultHidden])];
  }, [colState, columnDefs]);

  // Solo las visibles, con flex redistribuido para que sumen 1
  const visibleColsWithFlex = useMemo(() => {
    const hiddenSet = new Set(effectiveHiddenKeys);
    const visible   = orderedCols.filter(c => !hiddenSet.has(c.key));
    const totalFlex = visible.reduce((s, c) => s + (c.flex ?? 1), 0) || 1;
    return visible.map(c => ({ ...c, adjustedFlex: (c.flex ?? 1) / totalFlex }));
  }, [orderedCols, effectiveHiddenKeys]);

  const toggleColumn = useCallback((key) => {
    setColState(prev => {
      const isExtraKey = !prev.order.includes(key);
      const newOrder   = isExtraKey ? [...prev.order, key] : prev.order;
      const def        = columnDefs.find(c => c.key === key);
      const isEffectivelyHidden = prev.hidden.includes(key) || (isExtraKey && def?.defaultHidden);
      const newHidden  = isEffectivelyHidden
        ? prev.hidden.filter(k => k !== key)
        : [...prev.hidden, key];
      const next = { order: newOrder, hidden: newHidden };
      AsyncStorage.setItem(storageKey, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, [storageKey, columnDefs]);

  const reorderColumns = useCallback((newOrder) => {
    setColState(prev => {
      const next = { ...prev, order: newOrder };
      AsyncStorage.setItem(storageKey, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, [storageKey]);

  const resetColumns = useCallback(() => {
    const next = { order: columnDefs.map(c => c.key), hidden: columnDefs.filter(c => c.defaultHidden).map(c => c.key) };
    setColState(next);
    AsyncStorage.setItem(storageKey, JSON.stringify(next)).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, columnDefs]);

  return {
    visibleCols:  visibleColsWithFlex,
    orderedCols,
    hiddenKeys:   effectiveHiddenKeys,
    toggleColumn,
    reorderColumns,
    resetColumns,
    loaded,
  };
}

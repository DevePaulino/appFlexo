import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Gestiona visibilidad y orden de columnas de un grid, persistido por usuario.
 * @param {string}      screenKey   - identificador único del grid (ej: 'clientes')
 * @param {Array}       columnDefs  - [{ key, label, flex, locked? }]
 * @param {string|null} userId      - id del usuario para persistencia individual
 */
export function useGridColumns(screenKey, columnDefs, userId = null) {
  const storageKey = `gridcols:${userId ?? 'shared'}:${screenKey}`;

  const defaultState = {
    order:  columnDefs.map(c => c.key),
    hidden: [],
  };

  const [colState, setColState] = useState(defaultState);
  const [loaded,   setLoaded]   = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(storageKey)
      .then(val => {
        if (val) {
          try {
            const saved   = JSON.parse(val);
            const allKeys = columnDefs.map(c => c.key);
            const order   = (saved.order  || []).filter(k => allKeys.includes(k));
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
  }, [storageKey]);

  const _persist = (next) => {
    setColState(next);
    AsyncStorage.setItem(storageKey, JSON.stringify(next)).catch(() => {});
  };

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
    _persist(defaultState);
  }, [storageKey]);

  // Columnas en orden del usuario
  const orderedCols = colState.order
    .map(key => columnDefs.find(c => c.key === key))
    .filter(Boolean);

  // Solo las visibles, con flex redistribuido para que sumen 1
  const visibleCols  = orderedCols.filter(c => !colState.hidden.includes(c.key));
  const totalFlex    = visibleCols.reduce((s, c) => s + (c.flex ?? 1), 0) || 1;
  const visibleColsWithFlex = visibleCols.map(c => ({
    ...c,
    adjustedFlex: (c.flex ?? 1) / totalFlex,
  }));

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

import { useState, useEffect } from 'react';
import { CAMPOS_BASE_PEDIDO, CAMPOS_BASE_PRESUPUESTO, CAMPOS_BASE_TROQUEL } from '../utils/camposBase';

// ── Cache en memoria por empresa+formType ────────────────────────────────────
const _customCache = {};

// Campos base por tipo de formulario (excluyendo los ya cubiertos por cols hardcodeadas)
const BASE_COLS_BY_FORM = {
  pedido:      CAMPOS_BASE_PEDIDO.filter(c => !c.excludeInGrid),
  presupuesto: CAMPOS_BASE_PRESUPUESTO.filter(c => !c.excludeInGrid),
  troquel:     CAMPOS_BASE_TROQUEL.filter(c => !c.excludeInGrid),
};

function buildAuthHeaders() {
  const token = (typeof global !== 'undefined' && global.__MIAPP_ACCESS_TOKEN) || null;
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

/**
 * Devuelve columnas dinámicas para un grid:
 *   • campos BASE del formulario (fecha, material, maquina, etc.) que no están
 *     ya cubiertos por columnas hardcodeadas
 *   • campos PERSONALIZADOS añadidos con el constructor de formularios
 *
 * Cada entrada tiene: { key, label, flex, fieldKey? (base) | custom (true) }
 *
 * @param {'pedido'|'presupuesto'|'troquel'} formType
 * @param {object|null} currentUser
 */
export function useCamposFormulario(formType, currentUser) {
  const empresaId = currentUser?.empresa_id ?? null;
  const cacheKey  = `${empresaId ?? 'none'}:${formType}`;

  // Columnas base (síncronas, sin fetch)
  const baseCols = BASE_COLS_BY_FORM[formType] || [];

  const [customCols, setCustomCols] = useState(() => _customCache[cacheKey] || []);
  const [loading,    setLoading]    = useState(!_customCache[cacheKey]);

  useEffect(() => {
    if (!formType) { setLoading(false); return; }

    if (_customCache[cacheKey]) {
      setCustomCols(_customCache[cacheKey]);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`http://localhost:8080/api/campos-formulario?form=${formType}`, {
      headers: buildAuthHeaders(),
    })
      .then(r => r.ok ? r.json() : { campos: [] })
      .then(data => {
        const defs = (data.campos || [])
          .filter(c => c.activo !== false)
          .map(c => ({
            key:    c.campo_id,
            label:  c.etiqueta,
            flex:   0.14,
            custom: true,
          }));
        _customCache[cacheKey] = defs;
        setCustomCols(defs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [cacheKey, formType]);

  // Combinar: base primero, luego custom
  const colDefs = [
    ...baseCols.map(c => ({ key: c.campo_id, label: c.etiqueta, flex: c.flex, fieldKey: c.fieldKey })),
    ...customCols,
  ];

  return { colDefs, loading };
}

/**
 * Invalida la caché de campos personalizados para forzar re-fetch en el próximo acceso.
 * Llamar desde FormBuilderScreen tras guardar/eliminar un campo.
 * Si no se pasa empresaId, invalida todas las entradas del formType.
 */
export function invalidateCamposCache(formType, empresaId) {
  if (empresaId) {
    delete _customCache[`${empresaId}:${formType}`];
  } else {
    // Invalida todas las entradas que coincidan con el formType
    Object.keys(_customCache).forEach(k => {
      if (k.endsWith(`:${formType}`)) delete _customCache[k];
    });
  }
}

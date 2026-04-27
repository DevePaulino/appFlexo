import { useState, useEffect } from 'react';

// Cache en memoria por empresa+formType para evitar requests repetidas
const _cache = {};

/**
 * Obtiene los campos personalizados del constructor de formularios para un tipo de entidad.
 * Retorna un array de defs de columna compatibles con useGridColumns.
 *
 * @param {'pedido'|'presupuesto'|'troquel'} formType
 * @param {object|null} currentUser  - { empresa_id, id, role }
 */
export function useCamposFormulario(formType, currentUser) {
  const cacheKey = `${currentUser?.empresa_id ?? 'none'}:${formType}`;
  const [colDefs, setColDefs] = useState(() => _cache[cacheKey] || []);
  const [loading, setLoading] = useState(!_cache[cacheKey]);

  useEffect(() => {
    if (!formType || !currentUser?.empresa_id) {
      setLoading(false);
      return;
    }

    if (_cache[cacheKey]) {
      setColDefs(_cache[cacheKey]);
      setLoading(false);
      return;
    }

    const headers = {
      'Content-Type': 'application/json',
      'X-Empresa-Id': currentUser.empresa_id,
      'X-User-Id': currentUser.id || 'admin',
      'X-Role': currentUser.role || 'administrador',
    };

    fetch(`http://localhost:8080/api/campos-formulario?form=${formType}`, { headers })
      .then(r => r.json())
      .then(data => {
        const defs = (data.campos || [])
          .filter(c => c.activo !== false)
          .map(c => ({
            key:    c.campo_id,
            label:  c.etiqueta,
            flex:   0.14,
            custom: true,
          }));
        _cache[cacheKey] = defs;
        setColDefs(defs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [cacheKey, formType, currentUser?.empresa_id]);

  return { colDefs, loading };
}

/** Limpia la caché (útil tras guardar cambios en el constructor) */
export function invalidateCamposCache(formType, empresaId) {
  const key = `${empresaId ?? 'none'}:${formType}`;
  delete _cache[key];
}

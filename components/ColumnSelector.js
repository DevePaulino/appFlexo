import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

/**
 * Botón ⊞ que abre un dropdown para mostrar/ocultar y reordenar columnas.
 * Drag & drop en web (HTML5). Se cierra al hacer clic fuera.
 */
export default function ColumnSelector({ orderedCols, hiddenKeys, onToggle, onReorder, onReset }) {
  const [open, setOpen]   = useState(false);
  const wrapRef           = useRef(null);
  const dragIdx           = useRef(null);
  const [dragOver, setDragOver] = useState(null);

  // Cerrar al clicar fuera (solo web)
  useEffect(() => {
    if (!open || Platform.OS !== 'web') return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const onDragStart = (i) => { dragIdx.current = i; };
  const onDragOver  = (e, i) => {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === i) return;
    setDragOver(i);
    const next = [...orderedCols];
    const [moved] = next.splice(dragIdx.current, 1);
    next.splice(i, 0, moved);
    dragIdx.current = i;
    onReorder(next.map(c => c.key));
  };
  const onDragEnd   = () => { dragIdx.current = null; setDragOver(null); };

  const isWeb = Platform.OS === 'web';

  return (
    <View ref={wrapRef} style={styles.wrapper}>
      {/* Botón disparador */}
      <TouchableOpacity
        style={[styles.btn, open && styles.btnActive]}
        onPress={() => setOpen(o => !o)}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Text style={[styles.btnIcon, open && styles.btnIconActive]}>⊞</Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdown}>
          {/* Cabecera del dropdown */}
          <View style={styles.dropHeader}>
            <Text style={styles.dropTitle}>Columnas</Text>
            <TouchableOpacity onPress={() => { onReset(); }}>
              <Text style={styles.resetBtn}>Restablecer</Text>
            </TouchableOpacity>
          </View>

          {/* Lista de columnas */}
          {orderedCols.map((col, i) => {
            const visible  = !hiddenKeys.includes(col.key);
            const locked   = !!col.locked;
            const isTarget = dragOver === i;

            const checkBox = (
              <TouchableOpacity
                style={[
                  styles.checkbox,
                  visible && !locked && styles.checkboxOn,
                  locked              && styles.checkboxLocked,
                ]}
                onPress={() => !locked && onToggle(col.key)}
                disabled={locked}
              >
                {visible && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            );

            const label = (
              <Text style={[styles.colLabel, locked && styles.colLabelDim]} numberOfLines={1}>
                {col.label}
              </Text>
            );

            if (isWeb) {
              return (
                <div
                  key={col.key}
                  draggable={!locked}
                  onDragStart={() => !locked && onDragStart(i)}
                  onDragOver={(e) => onDragOver(e, i)}
                  onDragEnd={onDragEnd}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '7px 12px',
                    gap: 8,
                    cursor: locked ? 'default' : 'grab',
                    userSelect: 'none',
                    borderBottom: '1px solid #F1F5F9',
                    backgroundColor: isTarget ? '#EEF2FF' : 'white',
                    transition: 'background-color 0.1s',
                  }}
                >
                  <span style={{ color: locked ? 'transparent' : '#CBD5E1', fontSize: 16, lineHeight: 1 }}>⠿</span>
                  {checkBox}
                  {label}
                </div>
              );
            }

            return (
              <View key={col.key} style={styles.item}>
                <Text style={styles.dragHandle}>⠿</Text>
                {checkBox}
                {label}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position:  'relative',
    zIndex:    200,
    alignSelf: 'center',
  },
  btn: {
    width:           30,
    height:          30,
    borderRadius:    6,
    alignItems:      'center',
    justifyContent:  'center',
  },
  btnActive:     { backgroundColor: '#EEF2FF' },
  btnIcon:       { fontSize: 18, color: '#94A3B8' },
  btnIconActive: { color: '#4F46E5' },

  dropdown: {
    position:    'absolute',
    right:        0,
    top:          34,
    backgroundColor: '#fff',
    borderRadius:  10,
    borderWidth:   1,
    borderColor:  '#E2E8F0',
    shadowColor:  '#000',
    shadowOpacity: 0.10,
    shadowRadius:  12,
    shadowOffset:  { width: 0, height: 4 },
    minWidth:      220,
    zIndex:        999,
    overflow:      'hidden',
  },

  dropHeader: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    padding:         12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropTitle:  { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  resetBtn:   { fontSize: 12, color: '#4F46E5', fontWeight: '600' },

  item: {
    flexDirection:  'row',
    alignItems:     'center',
    padding:         8,
    gap:             8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dragHandle: { fontSize: 16, color: '#CBD5E1' },

  checkbox: {
    width:           18,
    height:          18,
    borderRadius:    4,
    borderWidth:     1.5,
    borderColor:    '#CBD5E1',
    alignItems:     'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxOn:     { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  checkboxLocked: { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' },
  checkmark:      { fontSize: 11, color: '#fff', fontWeight: '700' },

  colLabel:    { fontSize: 13, color: '#334155', flex: 1 },
  colLabelDim: { color: '#94A3B8' },
});

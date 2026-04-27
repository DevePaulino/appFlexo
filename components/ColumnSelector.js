import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

let _createPortal = null;
let _portalEl = null;

function getPortal() {
  if (typeof document === 'undefined') return null;
  if (!_portalEl) {
    _portalEl = document.createElement('div');
    _portalEl.id = 'col-selector-portal';
    _portalEl.style.cssText = 'position:fixed;top:0;left:0;z-index:9999;pointer-events:none;';
    document.body.appendChild(_portalEl);
  }
  return _portalEl;
}

function getCreatePortal() {
  if (!_createPortal) {
    try { _createPortal = require('react-dom').createPortal; } catch { /* noop */ }
  }
  return _createPortal;
}

/**
 * Botón ⊞ que abre un dropdown para mostrar/ocultar y reordenar columnas.
 * En web usa portal + position:fixed para saltar el overflow del ScrollView padre.
 */
export default function ColumnSelector({ orderedCols, hiddenKeys, onToggle, onReorder, onReset }) {
  const [open, setOpen]   = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, right: 0 });
  const btnRef             = useRef(null);
  const dragIdx            = useRef(null);
  const [dragOver, setDragOver] = useState(null);

  const isWeb = Platform.OS === 'web';

  const openDropdown = () => {
    if (isWeb && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setOpen(o => !o);
  };

  // Cerrar al clicar fuera (solo web)
  useEffect(() => {
    if (!open || !isWeb) return;
    const handler = (e) => {
      const portal = document.getElementById('col-selector-portal');
      if (btnRef.current?.contains(e.target)) return;
      if (portal?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, isWeb]);

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

  // ── Contenido del dropdown ──────────────────────────────────────────────────
  const renderRows = () => orderedCols.map((col, i) => {
    const visible  = !hiddenKeys.includes(col.key);
    const locked   = !!col.locked;
    const isTarget = dragOver === i;

    if (isWeb) {
      return (
        <div
          key={col.key}
          draggable={!locked}
          onDragStart={() => !locked && onDragStart(i)}
          onDragOver={(e) => onDragOver(e, i)}
          onDragEnd={onDragEnd}
          style={{
            display: 'flex', alignItems: 'center',
            padding: '7px 12px', gap: 8,
            cursor: locked ? 'default' : 'grab',
            userSelect: 'none',
            borderBottom: '1px solid #F1F5F9',
            backgroundColor: isTarget ? '#EEF2FF' : 'white',
            transition: 'background-color 0.1s',
          }}
        >
          <span style={{ color: locked ? 'transparent' : '#CBD5E1', fontSize: 16, lineHeight: 1 }}>⠿</span>
          {/* checkbox */}
          <div
            onClick={() => !locked && onToggle(col.key)}
            style={{
              width: 18, height: 18, borderRadius: 4,
              border: `1.5px solid ${locked ? '#E2E8F0' : (visible && !locked ? '#4F46E5' : '#CBD5E1')}`,
              backgroundColor: locked ? '#F1F5F9' : (visible && !locked ? '#4F46E5' : '#fff'),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: locked ? 'default' : 'pointer', flexShrink: 0,
            }}
          >
            {visible && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, lineHeight: 1 }}>✓</span>}
          </div>
          <span style={{ fontSize: 13, color: locked ? '#94A3B8' : '#334155', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {col.label}
          </span>
        </div>
      );
    }

    // Native
    return (
      <View key={col.key} style={styles.item}>
        <Text style={styles.dragHandle}>⠿</Text>
        <TouchableOpacity
          style={[styles.checkbox, visible && !locked && styles.checkboxOn, locked && styles.checkboxLocked]}
          onPress={() => !locked && onToggle(col.key)}
          disabled={locked}
        >
          {visible && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
        <Text style={[styles.colLabel, locked && styles.colLabelDim]} numberOfLines={1}>{col.label}</Text>
      </View>
    );
  });

  const webDropdownHTML = isWeb && open ? (
    <div
      style={{
        position: 'fixed', top: dropPos.top, right: dropPos.right,
        backgroundColor: '#fff', borderRadius: 10,
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
        minWidth: 220, zIndex: 9999, overflow: 'hidden',
        pointerEvents: 'auto',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 12px 10px', borderBottom: '1px solid #F1F5F9' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>Columnas</span>
        <span
          onClick={() => { onReset(); }}
          style={{ fontSize: 12, color: '#4F46E5', fontWeight: 600, cursor: 'pointer' }}
        >Restablecer</span>
      </div>
      {renderRows()}
    </div>
  ) : null;

  const nativeDropdown = !isWeb && open ? (
    <View style={styles.dropdown}>
      <View style={styles.dropHeader}>
        <Text style={styles.dropTitle}>Columnas</Text>
        <TouchableOpacity onPress={() => { onReset(); }}>
          <Text style={styles.resetBtn}>Restablecer</Text>
        </TouchableOpacity>
      </View>
      {renderRows()}
    </View>
  ) : null;

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        ref={btnRef}
        style={[styles.btn, open && styles.btnActive]}
        onPress={openDropdown}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Text style={[styles.btnIcon, open && styles.btnIconActive]}>⊞</Text>
      </TouchableOpacity>

      {nativeDropdown}

      {isWeb && open && (() => {
        const portal = getPortal();
        const createPortal = getCreatePortal();
        if (!portal || !createPortal) return null;
        return createPortal(webDropdownHTML, portal);
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'center',
  },
  btn: {
    width: 30, height: 30, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  btnActive:     { backgroundColor: '#EEF2FF' },
  btnIcon:       { fontSize: 18, color: '#94A3B8' },
  btnIconActive: { color: '#4F46E5' },

  dropdown: {
    position: 'absolute', right: 0, top: 34,
    backgroundColor: '#fff', borderRadius: 10,
    borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOpacity: 0.10,
    shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    minWidth: 220, zIndex: 999, overflow: 'hidden',
  },
  dropHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 12,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  dropTitle:  { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  resetBtn:   { fontSize: 12, color: '#4F46E5', fontWeight: '600' },

  item: {
    flexDirection: 'row', alignItems: 'center',
    padding: 8, gap: 8,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  dragHandle: { fontSize: 16, color: '#CBD5E1' },

  checkbox: {
    width: 18, height: 18, borderRadius: 4,
    borderWidth: 1.5, borderColor: '#CBD5E1',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxOn:     { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  checkboxLocked: { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' },
  checkmark:      { fontSize: 11, color: '#fff', fontWeight: '700' },

  colLabel:    { fontSize: 13, color: '#334155', flex: 1 },
  colLabelDim: { color: '#94A3B8' },
});

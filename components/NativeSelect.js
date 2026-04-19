import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, FlatList,
  StyleSheet, Platform, ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

/**
 * Cross-platform dropdown.
 * - Web: renders native <select>
 * - iOS/Android: renders Picker inside a modal
 *
 * Props:
 *   value         - current selected value
 *   onValueChange - (value) => void
 *   items         - [{ label, value }]
 *   placeholder   - label shown when value is '' or null (optional)
 *   style         - style for the outer container
 *   disabled      - boolean
 */
export default function NativeSelect({
  value,
  onValueChange,
  items = [],
  placeholder,
  style,
  disabled = false,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  if (Platform.OS === 'web') {
    const allItems = placeholder
      ? [{ label: placeholder, value: '' }, ...items]
      : items;
    return (
      <select
        value={value ?? ''}
        onChange={(e) => onValueChange(e.target.value)}
        disabled={disabled}
        style={{
          flex: 1,
          height: 36,
          borderRadius: 6,
          border: '1px solid #CBD5E1',
          backgroundColor: '#F8FAFC',
          fontSize: 13,
          color: '#0F172A',
          paddingLeft: 8,
          paddingRight: 8,
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          width: '100%',
          ...style,
        }}
      >
        {allItems.map((item) => (
          <option key={item.value} value={item.value}>{item.label}</option>
        ))}
      </select>
    );
  }

  const selectedLabel = items.find((i) => i.value === value)?.label
    ?? (placeholder || 'Seleccionar...');
  const displayLabel = value ? (items.find((i) => i.value === value)?.label ?? selectedLabel) : (placeholder || 'Seleccionar...');

  return (
    <>
      <TouchableOpacity
        style={[s.trigger, disabled && s.triggerDisabled, style]}
        onPress={() => { if (!disabled) { setTempValue(value); setModalOpen(true); } }}
        activeOpacity={0.7}
      >
        <Text style={[s.triggerText, !value && s.placeholder]} numberOfLines={1}>
          {displayLabel}
        </Text>
        <Text style={s.arrow}>▾</Text>
      </TouchableOpacity>

      <Modal visible={modalOpen} transparent animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => setModalOpen(false)} />
        <View style={s.sheet}>
          <View style={s.sheetHeader}>
            <TouchableOpacity onPress={() => setModalOpen(false)}>
              <Text style={s.cancelBtn}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { onValueChange(tempValue); setModalOpen(false); }}>
              <Text style={s.confirmBtn}>Confirmar</Text>
            </TouchableOpacity>
          </View>
          <Picker
            selectedValue={tempValue ?? ''}
            onValueChange={(v) => setTempValue(v)}
          >
            {placeholder && <Picker.Item label={placeholder} value="" />}
            {items.map((item) => (
              <Picker.Item key={item.value} label={item.label} value={item.value} />
            ))}
          </Picker>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 36,
  },
  triggerDisabled: { opacity: 0.5 },
  triggerText: { flex: 1, fontSize: 13, color: '#0F172A' },
  placeholder: { color: '#94A3B8' },
  arrow: { fontSize: 12, color: '#94A3B8', marginLeft: 4 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  cancelBtn: { fontSize: 14, color: '#64748B' },
  confirmBtn: { fontSize: 14, color: '#4F46E5', fontWeight: '700' },
});

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';

/**
 * Inline delete confirmation — compact single-row modern design.
 *
 * Props:
 *   onCancel   — called when user cancels
 *   onConfirm  — called when user confirms deletion
 *   message    — optional override for the question text (pre-translated)
 *   size       — 'sm' (default, for table rows) | 'md' (for modals/bottom bars)
 */
export default function DeleteConfirmRow({ onCancel, onConfirm, message, size = 'sm' }) {
  const { t } = useTranslation();
  const sm = size === 'sm';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: sm ? 5 : 8,
        backgroundColor: 'rgba(239, 68, 68, 0.07)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.22)',
        borderRadius: sm ? 8 : 10,
        paddingVertical: sm ? 4 : 6,
        paddingHorizontal: sm ? 8 : 12,
      }}
    >
      {/* Warning icon */}
      <Text style={{ fontSize: sm ? 11 : 13, lineHeight: sm ? 16 : 20 }}>⚠️</Text>

      {/* Question */}
      <Text
        style={{
          fontSize: sm ? 11 : 12,
          color: '#991B1B',
          fontWeight: '600',
          flex: 1,
        }}
        numberOfLines={1}
      >
        {message || t('common.deleteQuestion')}
      </Text>

      {/* Cancel */}
      <TouchableOpacity
        onPress={onCancel}
        hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
        style={{
          paddingVertical: sm ? 2 : 4,
          paddingHorizontal: sm ? 7 : 10,
          borderRadius: 6,
          backgroundColor: '#F8FAFC',
          borderWidth: 1,
          borderColor: '#E2E8F0',
        }}
      >
        <Text style={{ fontSize: sm ? 11 : 12, color: '#64748B', fontWeight: '500' }}>
          {t('common.cancel')}
        </Text>
      </TouchableOpacity>

      {/* Confirm */}
      <TouchableOpacity
        onPress={onConfirm}
        hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
        style={{
          paddingVertical: sm ? 2 : 4,
          paddingHorizontal: sm ? 7 : 10,
          borderRadius: 6,
          backgroundColor: '#EF4444',
        }}
      >
        <Text style={{ fontSize: sm ? 11 : 12, color: '#FFFFFF', fontWeight: '700' }}>
          {t('common.delete')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

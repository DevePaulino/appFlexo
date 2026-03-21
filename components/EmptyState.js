import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/**
 * EmptyState — estado vacío reutilizable
 *
 * Props:
 *   title     string    — título principal
 *   message   string    — descripción secundaria
 *   action    string    — (opcional) etiqueta del botón CTA
 *   onAction  function  — (opcional) callback del botón CTA
 *   variant   string    — 'default' | 'inline'  (default: 'default')
 */
export default function EmptyState({ title, message, action, onAction, variant = 'default' }) {
  if (variant === 'inline') {
    return (
      <View style={styles.inlineContainer}>
        <View style={styles.inlineText}>
          {title   && <Text style={styles.inlineTitle}>{title}</Text>}
          {message && <Text style={styles.inlineMessage}>{message}</Text>}
        </View>
        {action && onAction && (
          <TouchableOpacity style={styles.inlineBtn} onPress={onAction} activeOpacity={0.8}>
            <Text style={styles.inlineBtnText}>{action}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {title   && <Text style={styles.title}>{title}</Text>}
      {message && <Text style={styles.message}>{message}</Text>}
      {action && onAction && (
        <TouchableOpacity style={styles.btn} onPress={onAction} activeOpacity={0.85}>
          <Text style={styles.btnText}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Default variant ────────────────────────────────────────────────────
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 56,
  },
  decorRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: '#F8FAFC',
  },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 26,
    lineHeight: 32,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 280,
  },
  btn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
  },

  // ── Inline variant ─────────────────────────────────────────────────────
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  inlineIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  inlineIcon: {
    fontSize: 15,
    lineHeight: 20,
  },
  inlineText: {
    flex: 1,
  },
  inlineTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  inlineMessage: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  inlineBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  inlineBtnText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '600',
  },
});

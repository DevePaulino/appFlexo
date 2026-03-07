import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/**
 * EmptyState — estado vacío reutilizable
 *
 * Props:
 *   icon     string   — emoji o símbolo (ej. '📋', '🔍', '⚙️')
 *   title    string   — título principal
 *   message  string   — descripción secundaria
 *   action   string   — (opcional) etiqueta del botón CTA
 *   onAction function — (opcional) callback del botón CTA
 */
export default function EmptyState({ icon = '—', title, message, action, onAction }) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      {title   && <Text style={styles.title}>{title}</Text>}
      {message && <Text style={styles.message}>{message}</Text>}
      {action && onAction && (
        <TouchableOpacity style={styles.btn} onPress={onAction}>
          <Text style={styles.btnText}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  icon: {
    fontSize: 40,
    marginBottom: 16,
    opacity: 0.5,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  btn: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: 'transparent',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnText: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '600',
  },
});

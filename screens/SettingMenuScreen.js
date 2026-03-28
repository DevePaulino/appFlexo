import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5FD',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7ED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 38,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1B4B',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  content: {
    padding: 12,
    paddingTop: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardText: {
    fontSize: 13,
    color: '#475569',
  },
});

export default function SettingMenuScreen() {
  const navigation = useNavigation();

  const items = [
    {
      title: 'Usuarios y roles',
      description: 'Gestión de usuarios, roles, rol activo y permisos.',
      route: 'SettingsUsuariosRoles',
    },
    {
      title: 'Impresión',
      description: 'Materiales, acabados y tintas especiales.',
      route: 'SettingsImpresion',
    },
    {
      title: 'Máquinas',
      description: 'Catálogo de máquinas de impresión.',
      route: 'SettingsMaquinas',
    },
    {
      title: 'Troqueles',
      description: 'Catálogo de troqueles disponibles.',
      route: 'SettingsTroqueles',
    },
    {
      title: 'Materiales',
      description: 'Sustratos, gramajes y costes de material.',
      route: 'SettingsMateriales',
    },
    {
      title: 'Funcionalidades web',
      description: 'Funciones experimentales y modos de desarrollo.',
      route: 'SettingsFuncionalidades',
    },
    {
      title: 'Módulos',
      description: 'Activa o desactiva funcionalidades opcionales de la aplicación.',
      route: 'SettingsModulos',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={{ width: 38 }} />
          <Text style={styles.title}>Ajustes</Text>
          <View style={{ width: 38 }} />
        </View>
      </View>
      <View style={styles.content}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={styles.card}
            onPress={() => navigation.navigate(item.route)}
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardText}>{item.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

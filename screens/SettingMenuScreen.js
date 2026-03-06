import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  header: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#F8FAFC',
    textAlign: 'center',
    width: '100%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
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
      title: 'Funcionalidades web',
      description: 'Funciones experimentales y modos de desarrollo.',
      route: 'SettingsFuncionalidades',
    },

    {
      title: 'Impresión',
      description: 'Materiales, acabados y tintas especiales.',
      route: 'SettingsImpresion',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Setting</Text>
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

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E9EEF5',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 22,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 7,
    marginBottom: 28,
    minWidth: 280,
    maxWidth: 380,
    borderWidth: 1.5,
    borderColor: '#D0D5DD',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#232323',
    marginBottom: 22,
    letterSpacing: 0.7,
  },
  btn: {
    backgroundColor: '#344054',
    paddingHorizontal: 38,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 6,
    minWidth: 200
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.2,
  }
});

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Bienvenido a PrintForge Pro</Text>

        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.navigate('Nueva Cotización')}
        >
          <Text style={styles.btnText}>Nueva Cotización</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.navigate('Configuraciones')}
        >
          <Text style={styles.btnText}>Configuraciones</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

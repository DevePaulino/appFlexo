import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

export default function KanbanBoard({ maquinas, trabajosPorMaquina, onDropTrabajo }) {
  return (
    <ScrollView horizontal style={styles.kanbanContainer}>
      {maquinas.map((maquina) => (
        <View key={maquina.id} style={styles.kanbanColumn}>
          <Text style={styles.kanbanColumnTitle}>{maquina.nombre}</Text>
          <View style={styles.kanbanList}>
            {(trabajosPorMaquina[maquina.id] || []).map((trabajo, idx) => (
              <View key={trabajo.id} style={styles.kanbanCard}>
                <Text style={styles.kanbanCardTitle}>{trabajo.nombre}</Text>
                <Text style={styles.kanbanCardCliente}>{trabajo.cliente}</Text>
                {/* Aquí irá el drag handle y lógica de drop */}
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  kanbanContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#F1F3F5',
    paddingVertical: 16,
  },
  kanbanColumn: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginHorizontal: 12,
    minWidth: 320,
    maxWidth: 340,
    flex: 1,
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  kanbanColumnTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 10,
    textAlign: 'center',
  },
  kanbanList: {
    minHeight: 100,
  },
  kanbanCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#1976D2',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  kanbanCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#232323',
  },
  kanbanCardCliente: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});

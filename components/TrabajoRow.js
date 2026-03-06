import React, { useCallback } from 'react';
import { View, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useSortable } from '@dnd-kit/sortable';

function TrabajoRow({
  trabajo,
  index,
  maquinas,
  maquinaActual,
  canReorder,
  cambiandoMaquina,
  handleCambiarMaquina,
  getStatusColor,
  getStatusLabel,
  getEntregaSemaforo,
  formatearFecha,
  styles,
}) {
  const canonicalId = String(trabajo.trabajo_id || trabajo.id || '');
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({ id: canonicalId });

  const rnRef = useCallback(
    (node) => {
      if (!node) return;
      setNodeRef(node.getNativeNode?.() ?? node);
    },
    [setNodeRef]
  );

  const [statusStyle, statusTextStyle] = getStatusColor(trabajo.estado);
  const entregaSemaforo = getEntregaSemaforo(trabajo.fecha_entrega);
  const maquinaFilaId = trabajo._maquina_id ?? maquinas[maquinaActual]?.id;

  const rowStyle = [
    styles.tableRow,
    index % 2 === 1 && styles.rowAlternate,
    isDragging && styles.draggedRow,
    !canReorder && { cursor: 'default' },
    transform ? { transform: [{ translateX: transform.x }, { translateY: transform.y }] } : null,
  ];

  return (
    <View ref={rnRef} style={rowStyle} {...attributes}>
      <View style={[styles.tableCell, styles.colPos]} {...(canReorder ? listeners : {})}>
        <Text style={[styles.dragHandle, !canReorder && styles.dragHandleDisabled]}>
          {canReorder ? '⠿' : '—'}
        </Text>
      </View>
      <View style={[styles.tableCell, styles.colId]}>
        <Text style={styles.cellText} numberOfLines={1}>{canonicalId}</Text>
      </View>
      <View style={[styles.tableCell, styles.colNombre]}>
        <Text style={styles.cellText} numberOfLines={1}>{trabajo.nombre}</Text>
      </View>
      <View style={[styles.tableCell, styles.colCliente]}>
        <Text style={styles.cellText} numberOfLines={1}>
          {typeof trabajo.cliente === 'string' ? trabajo.cliente : (trabajo.cliente?.nombre || '-')}
        </Text>
      </View>
      <View style={[styles.tableCell, styles.colEstado]}>
        <View style={[styles.statusBadge, statusStyle]}>
          <Text style={[styles.statusText, statusTextStyle]} numberOfLines={1}>
            {getStatusLabel(trabajo.estado)}
          </Text>
        </View>
      </View>
      <View style={[styles.tableCell, styles.colFechaPedido]}>
        <Text style={styles.cellText} numberOfLines={1}>{formatearFecha(trabajo.fecha_pedido)}</Text>
      </View>
      <View style={[styles.tableCell, styles.colFechaEntrega]}>
        <Text style={styles.cellText} numberOfLines={1}>{formatearFecha(trabajo.fecha_entrega)}</Text>
      </View>
      <View style={[styles.tableCell, styles.colDias]}>
        <View style={entregaSemaforo.container}>
          <Text style={entregaSemaforo.text} numberOfLines={1}>{entregaSemaforo.label}</Text>
        </View>
      </View>
      <View style={[styles.tableCell, styles.colMaquina]}>
        <View style={[styles.maquinaPickerWrap, cambiandoMaquina === canonicalId && styles.maquinaPickerWrapDisabled]}>
          <Picker
            selectedValue={maquinaFilaId}
            onValueChange={(nuevaMaquina) => {
              if (String(nuevaMaquina) !== String(maquinaFilaId)) {
                handleCambiarMaquina(canonicalId, nuevaMaquina);
              }
            }}
            enabled={cambiandoMaquina !== canonicalId}
            style={styles.maquinaPicker}
          >
            {maquinas.map((maq) => (
              <Picker.Item key={String(maq.id)} label={maq.nombre} value={maq.id} />
            ))}
          </Picker>
        </View>
      </View>
    </View>
  );
}

export default React.memo(TrabajoRow, (a, b) => {
  try {
    const aid = a.trabajo.trabajo_id || a.trabajo.id;
    const bid = b.trabajo.trabajo_id || b.trabajo.id;
    return (
      aid === bid &&
      a.cambiandoMaquina === b.cambiandoMaquina &&
      a.maquinaActual === b.maquinaActual &&
      a.canReorder === b.canReorder
    );
  } catch (e) {
    return false;
  }
});

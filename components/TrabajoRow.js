import React from 'react';
import { View, Text } from 'react-native';
import { Picker } from '@react-native-picker/picker';

function TrabajoRow(props) {
  const {
    trabajo,
    index,
    maquinas,
    maquinaActual,
    canReorder,
    draggingId,
    targetIndex,
    cambiandoMaquina,
    handleMouseDown,
    handleCambiarMaquina,
    getStatusColor,
    getStatusLabel,
    getEntregaSemaforo,
    formatearFecha,
    rowRefsRef,
    styles,
    ITEM_HEIGHT,
  } = props;

  const idxGlobal = index;
  const [statusStyle, statusTextStyle] = getStatusColor(trabajo.estado);
  const entregaSemaforo = getEntregaSemaforo(trabajo.fecha_entrega);
  const isDragging = draggingId === trabajo.id;
  const showDropIndicator = canReorder && targetIndex === idxGlobal && !isDragging;
  const maquinaFilaId = trabajo._maquina_id ?? maquinas[maquinaActual]?.id;

  const canonicalId = String(trabajo.trabajo_id || trabajo.id || '');
  const displayId = canonicalId; // mostrar la id canónica completa en la UI
  return (
    <View key={canonicalId}>
      {showDropIndicator && <View style={styles.dropIndicator} />}
      <View
        ref={(el) => { if (el) rowRefsRef.current[canonicalId] = el; }}
        style={[
          styles.tableRow,
          idxGlobal % 2 === 1 && styles.rowAlternate,
          canReorder && isDragging && styles.draggedRow,
          !canReorder && { cursor: 'default' },
          { height: ITEM_HEIGHT }
        ]}
      >
        <View style={[styles.tableCell, styles.colPos]}>
          <Text
            style={styles.dragHandle}
            onMouseDown={canReorder ? (e) => handleMouseDown(e, canonicalId, idxGlobal) : undefined}
          >
            {canReorder ? '≡' : '-'}
          </Text>
        </View>
        <View style={[styles.tableCell, styles.colId]}>
          <Text style={styles.cellText}>{displayId}</Text>
        </View>
        <View style={[styles.tableCell, styles.colNombre]}>
          <Text style={styles.cellText} numberOfLines={1}>{trabajo.nombre}</Text>
        </View>
        <View style={[styles.tableCell, styles.colCliente]}>
          <Text style={styles.cellText} numberOfLines={1}>{typeof trabajo.cliente === 'string' ? trabajo.cliente : (trabajo.cliente && (trabajo.cliente.nombre || '-'))}</Text>
        </View>
        <View style={[styles.tableCell, styles.colEstado]}>
          <View style={[styles.statusBadge, statusStyle]}>
            <Text style={[styles.statusText, statusTextStyle]} numberOfLines={1}>{getStatusLabel(trabajo.estado)}</Text>
          </View>
        </View>
        <View style={[styles.tableCell, styles.colFechaPedido]}>
          <Text style={styles.cellText} numberOfLines={1}>{formatearFecha(trabajo.fecha_pedido)}</Text>
        </View>
        <View style={[styles.tableCell, styles.colFechaEntrega]}>
          <Text style={styles.cellText} numberOfLines={1}>{formatearFecha(trabajo.fecha_entrega)}</Text>
        </View>
        <View style={[styles.tableCell, styles.colDias]}>
          <View style={entregaSemaforo.container}><Text style={entregaSemaforo.text} numberOfLines={1}>{entregaSemaforo.label}</Text></View>
        </View>
        <View style={[styles.tableCell, styles.colMaquina]}>
          <Picker
            selectedValue={maquinaFilaId}
            onValueChange={(nuevaMaquina) => { if (String(nuevaMaquina) !== String(maquinaFilaId)) handleCambiarMaquina(canonicalId, nuevaMaquina); }}
            enabled={cambiandoMaquina !== canonicalId}
            style={{ height: 36 }}
          >
            {maquinas.map((maq) => (<Picker.Item key={String(maq.id)} label={maq.nombre} value={maq.id} />))}
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
      a.draggingId === b.draggingId &&
      a.targetIndex === b.targetIndex &&
      a.maquinaActual === b.maquinaActual &&
      a.canReorder === b.canReorder
    );
  } catch (e) {
    return false;
  }
});

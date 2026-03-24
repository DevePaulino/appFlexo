import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useSortable } from '@dnd-kit/sortable';
import { useTranslation } from 'react-i18next';

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
  onMarcarImpreso,
  isFinalizado,
  styles,
}) {
  const canonicalId = String(trabajo.trabajo_id || trabajo.id || '');
  const { t } = useTranslation();
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
        {isFinalizado ? (
          <Text style={[styles.cellText, { color: '#94A3B8', fontSize: 11 }]} numberOfLines={1}>
            {maquinas.find((m) => String(m.id) === String(maquinaFilaId))?.nombre || '—'}
          </Text>
        ) : (
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
        )}
      </View>
      <View style={[styles.tableCell, styles.colImpreso]}>
        {isFinalizado ? (
          <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: '#F1F5F9', alignItems: 'center' }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748B' }}>{t('screens.trabajos.finalizado')}</Text>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => onMarcarImpreso && onMarcarImpreso(trabajo)}
            style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: '#1E293B', alignItems: 'center' }}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>{t('screens.produccion.consumo.btnImpreso')}</Text>
          </TouchableOpacity>
        )}
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
      a.trabajo.estado === b.trabajo.estado &&
      a.trabajo.impresion_registrada === b.trabajo.impresion_registrada &&
      a.trabajo.en_produccion === b.trabajo.en_produccion &&
      a.isFinalizado === b.isFinalizado &&
      a.cambiandoMaquina === b.cambiandoMaquina &&
      a.maquinaActual === b.maquinaActual &&
      a.canReorder === b.canReorder
    );
  } catch (e) {
    return false;
  }
});

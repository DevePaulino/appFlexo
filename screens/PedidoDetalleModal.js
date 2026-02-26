import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  modal: {
    width: '98%',
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#D0D5DD',
    padding: 16,
    maxHeight: '94%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1D2939',
  },
  closeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#F2F2F2',
  },
  closeBtnText: {
    fontSize: 18,
    color: '#444',
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D0D5DD',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#3AB274',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  topGrid: {
    flexDirection: 'row',
  },
  leftCol: {
    flex: 1,
    marginRight: 8,
  },
  rightCol: {
    flex: 1,
    marginLeft: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  label: {
    flex: 0.38,
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
  },
  value: {
    flex: 0.62,
    fontSize: 13,
    fontWeight: '500',
    color: '#232323',
  },
  fullWidthRow: {
    marginBottom: 8,
  },
  fullWidthLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    marginBottom: 4,
  },
  fullWidthValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#232323',
  },
  toolsSection: {
    marginTop: 4,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
  },
  toolCard: {
    width: '24%',
    borderWidth: 1.5,
    borderColor: '#D0D5DD',
    borderRadius: 12,
    padding: 10,
    backgroundColor: '#FFF',
    marginBottom: 8,
  },
  toolTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#232323',
    marginBottom: 8,
  },
  toolPreview: {
    height: 90,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D2D2D2',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    marginBottom: 8,
  },
  toolPreviewText: {
    color: '#8B8B8B',
    fontSize: 12,
    fontWeight: '600',
  },
  toolButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  toolBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  toolBtnPrimary: {
    backgroundColor: '#344054',
    marginRight: 6,
  },
  toolBtnSecondary: {
    backgroundColor: '#98A2B3',
    marginLeft: 6,
  },
  toolBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#344054',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  editBtnText: { color: '#FFF', fontWeight: '800' },
  dangerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  estadoPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    fontSize: 11,
    fontWeight: '700',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#FF6B6B',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default function PedidoDetalleModal({ visible, onClose, pedidoId, onDeleted, onEdit }) {
  const [pedido, setPedido] = useState(null);
  const [activeRole, setActiveRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chargingAction, setChargingAction] = useState(null);

  useEffect(() => {
    if (visible && pedidoId) {
      cargarPedido();
      cargarRolActivo();
    }
  }, [visible, pedidoId]);

  const normalizarRolActivo = (value) =>
    String(value || '')
      .normalize('NFD')
      .replace(/[^\w\s-]/g, '')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();

  const cargarRolActivo = async () => {
    try {
      const resp = await fetch('http://localhost:8080/api/settings/active-role');
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) return setActiveRole('');
      setActiveRole(normalizarRolActivo(data.active_role || ''));
    } catch {
      setActiveRole('');
    }
  };

  const cargarPedido = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8080/api/pedidos/${pedidoId}`);
      if (response.ok) {
        const data = await response.json();
        setPedido(data);
      } else {
        setError('No se pudo cargar el pedido');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  const renderRow = (label, value, color) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, color ? { color } : null]}>{value ?? '-'}</Text>
    </View>
  );

  const formatearFecha = (valor) => {
    if (!valor) return '-';
    const texto = String(valor).includes('T') ? String(valor).split('T')[0] : String(valor);
    const [anio, mes, dia] = texto.split('-');
    if (!anio || !mes || !dia) return texto;
    return `${dia}-${mes}-${anio}`;
  };

  const mapToolToAccion = (title) => {
    const normalized = String(title || '').trim().toLowerCase();
    if (normalized === 'report') return 'report';
    if (normalized === 'trapping') return 'trapping';
    if (normalized === 'repetidora') return 'repetidora';
    if (normalized === 'troquel') return 'troquel';
    return null;
  };

  const handleDescargarTool = async (title) => {
    const accion = mapToolToAccion(title);
    if (!accion || !pedido?.id) {
      Alert.alert('Error', 'No se pudo preparar la descarga');
      return;
    }

    const usuarioNombre = String(pedido?.datos_presupuesto?.vendedor || '').trim();
    if (!usuarioNombre) {
      Alert.alert('Falta vendedor', 'Asigna un vendedor al pedido para poder cargar créditos en la descarga.');
      return;
    }

    setChargingAction(accion);
    try {
      const response = await fetch('http://localhost:8080/api/billing/consumir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion,
          usuario_nombre: usuarioNombre,
          referencia: `PED-${pedido.id}-${accion}`,
          metadata: {
            pedido_id: pedido.id,
            numero_pedido: pedido.numero_pedido || null,
            tool: accion,
          },
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        Alert.alert('No se pudo descargar', data.error || 'Error al consumir créditos');
        return;
      }

      const charged = Number(data.charged_credits || 0);
      const saldo = Number(data.creditos || 0);
      if (charged > 0) {
        Alert.alert('Descarga preparada', `Se han descontado ${charged} créditos. Saldo restante: ${saldo}.`);
      } else {
        Alert.alert('Descarga preparada', `Acción incluida por suscripción activa. Saldo actual: ${saldo}.`);
      }
    } catch (err) {
      Alert.alert('Error', `No se pudo procesar la descarga: ${err.message}`);
    } finally {
      setChargingAction(null);
    }
  };

  const renderToolCard = (title) => {
    const accion = mapToolToAccion(title);
    const loadingDownload = chargingAction && chargingAction === accion;
    return (
    <View style={styles.toolCard}>
      <Text style={styles.toolTitle}>{title}</Text>
      <View style={styles.toolPreview}>
        <Text style={styles.toolPreviewText}>Previo aquí</Text>
      </View>
      <View style={styles.toolButtons}>
        <TouchableOpacity style={[styles.toolBtn, styles.toolBtnPrimary]}>
          <Text style={styles.toolBtnText}>Ver</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toolBtn, styles.toolBtnSecondary, loadingDownload && { opacity: 0.6 }]}
          onPress={() => handleDescargarTool(title)}
          disabled={!!loadingDownload}
        >
          <Text style={styles.toolBtnText}>{loadingDownload ? 'Procesando...' : (title === 'Troquel' ? 'Descargar Troquel' : 'Descargar PDF')}</Text>
        </TouchableOpacity>
      </View>
    </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.container}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Detalle del Pedido</Text>
            <View style={styles.actionRow}>
              {(activeRole === 'administrador' || activeRole === 'admin' || activeRole === 'root') && (
                <>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={async () => {
                      if (!pedido) return;
                      try {
                        console.log('PedidoDetalleModal: editar pulsado, pedido (partial):', pedido);
                      } catch (e) {}

                      // Try to fetch the full pedido from backend to ensure modal gets complete data
                      let fullPedido = pedido;
                      const pid = pedido && (pedido.id || pedido.pedido_id || pedido._id) ? (pedido.id || pedido.pedido_id || pedido._id) : null;
                      if (pid) {
                        try {
                          const resp = await fetch(`http://localhost:8080/api/pedidos/${pid}`);
                          if (resp.ok) fullPedido = await resp.json();
                          console.log('PedidoDetalleModal: pedido completo obtenido para edición:', fullPedido);
                        } catch (e) {
                          console.warn('PedidoDetalleModal: no se pudo obtener pedido completo', e);
                        }
                      }

                      try {
                        console.log('PedidoDetalleModal: onEdit typeof ->', typeof onEdit);
                      } catch (e) {}
                      if (typeof onEdit === 'function') {
                        try { console.log('PedidoDetalleModal: invocando onEdit ahora'); } catch(e) {}
                        onEdit(fullPedido);
                        if (typeof onClose === 'function') onClose();
                        return;
                      }
                      Alert.alert('Editar', 'Funcionalidad de edición no configurada.');
                    }}
                  >
                    <Text style={styles.editBtnText}>Editar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.dangerBtn}
                    onPress={async () => {
                      console.log('PedidoDetalleModal: borrar (header) pulsado', pedido?.id);
                      if (!pedido?.id) return;
                      const confirmDelete = (typeof window !== 'undefined' && window.confirm)
                        ? window.confirm('¿Seguro que deseas eliminar este pedido?')
                        : await new Promise((resolve) => {
                            Alert.alert('Eliminar pedido', '¿Seguro que deseas eliminar este pedido?', [
                              { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
                              { text: 'Eliminar', style: 'destructive', onPress: () => resolve(true) },
                            ]);
                          });

                      if (!confirmDelete) return;

                      try {
                        console.log('PedidoDetalleModal: enviando DELETE a backend', `http://localhost:8080/api/pedidos/${pedido.id}`);
                        const res = await fetch(`http://localhost:8080/api/pedidos/${pedido.id}`, { method: 'DELETE' });
                        const data = await res.json().catch(() => ({}));
                        if (!res.ok) {
                          Alert.alert('Error', data.error || 'No se pudo eliminar el pedido');
                          return;
                        }
                        Alert.alert('Pedido eliminado', 'El pedido ha sido eliminado con éxito');
                        if (typeof onDeleted === 'function') {
                          onDeleted();
                        }
                      } catch (err) {
                        Alert.alert('Error', 'Error de conexión: ' + err.message);
                      }
                    }}
                  >
                    <Text style={[styles.closeBtnText, { color: '#FFF' }]}>Eliminar</Text>
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#3AB274" />
            </View>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : pedido ? (
            <ScrollView>
              <View style={styles.topGrid}>
                <View style={styles.leftCol}>
                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Pedido</Text>
                    {renderRow('Número:', pedido.numero_pedido || '-')}
                    {renderRow('Fecha:', formatearFecha(pedido.fecha_pedido))}
                    {renderRow('Referencia:', pedido.referencia || '-')}
                  </View>

                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Trabajo</Text>
                    {renderRow('Nombre:', pedido.nombre || '-')}
                    {renderRow('Cliente:', (typeof pedido.cliente === 'string') ? pedido.cliente : (pedido.cliente && (pedido.cliente.nombre || '-')))}
                    <View style={styles.row}>
                      <Text style={styles.label}>Estado:</Text>
                      <Text
                        style={[
                          styles.estadoPill,
                          {
                            color: pedido.estado === 'finalizado' ? '#027A48' : '#0958D9',
                            backgroundColor: pedido.estado === 'finalizado' ? '#D1FADF' : '#DCE8FF',
                          },
                        ]}
                      >
                        {pedido.estado || '-'}
                      </Text>
                    </View>
                    {renderRow('Entrega:', formatearFecha(pedido.fecha_entrega))}
                    {renderRow(
                      'Retraso (días):',
                      String(pedido.dias_retraso ?? 0),
                      (pedido.dias_retraso || 0) > 0 ? '#FF6B6B' : '#3AB274'
                    )}
                  </View>
                </View>

                <View style={styles.rightCol}>
                  {pedido.datos_presupuesto && Object.keys(pedido.datos_presupuesto || {}).length > 0 && (
                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Datos del Presupuesto</Text>
                    {renderRow(
                      'Nº Presupuesto:',
                      pedido.datos_presupuesto?.numero_presupuesto || pedido.numero_presupuesto || '-'
                    )}
                    {renderRow('Cliente:', (typeof pedido.datos_presupuesto?.cliente === 'string') ? pedido.datos_presupuesto?.cliente : (pedido.datos_presupuesto?.cliente && (pedido.datos_presupuesto.cliente.nombre || '-')))}
                    {renderRow('Vendedor:', pedido.datos_presupuesto?.vendedor || '-')}
                    {renderRow('Referencia:', pedido.datos_presupuesto?.referencia || '-')}
                    {renderRow(
                      'Fecha presupuesto:',
                      formatearFecha(pedido.datos_presupuesto?.fecha || pedido.datos_presupuesto?.fecha_presupuesto || pedido.fecha_presupuesto || '-')
                    )}
                    {renderRow(
                      'Formato:',
                      pedido.datos_presupuesto?.formatoAncho
                        ? `${pedido.datos_presupuesto.formatoAncho} x ${pedido.datos_presupuesto.formatoLargo || '-'} mm`
                        : '-'
                    )}
                    {renderRow('Máquina:', pedido.datos_presupuesto?.maquina || '-')}
                    {renderRow('Material:', pedido.datos_presupuesto?.material || '-')}
                    {renderRow(
                      'Acabado:',
                      Array.isArray(pedido.datos_presupuesto?.acabado)
                        ? (pedido.datos_presupuesto.acabado.length
                          ? pedido.datos_presupuesto.acabado.join(', ')
                          : '-')
                        : (pedido.datos_presupuesto?.acabado || '-')
                    )}
                    {renderRow(
                      'Tirada:',
                      pedido.datos_presupuesto?.tirada ? `${pedido.datos_presupuesto.tirada} unidades` : '-'
                    )}
                    {renderRow(
                      'Tintas:',
                      Array.isArray(pedido.datos_presupuesto?.selectedTintas)
                        ? pedido.datos_presupuesto.selectedTintas.join(', ')
                        : pedido.datos_presupuesto?.selectedTintas || '-'
                    )}
                    {renderRow(
                      'Tinta especial:',
                      Array.isArray(pedido.datos_presupuesto?.detalleTintaEspecial)
                        ? (pedido.datos_presupuesto.detalleTintaEspecial.length
                          ? pedido.datos_presupuesto.detalleTintaEspecial.join(', ')
                          : '-')
                        : (pedido.datos_presupuesto?.detalleTintaEspecial || '-')
                    )}
                    {renderRow('Troquel estado:', pedido.datos_presupuesto?.troquelEstadoSel || '-')}
                    {renderRow('Troquel forma:', pedido.datos_presupuesto?.troquelFormaSel || '-')}
                    {renderRow('Troquel coste:', pedido.datos_presupuesto?.troquelCoste || '-')}
                    <View style={styles.fullWidthRow}>
                      <Text style={styles.fullWidthLabel}>Observaciones:</Text>
                      <Text style={styles.fullWidthValue}>{pedido.datos_presupuesto?.observaciones || '-'}</Text>
                    </View>
                  </View>
                  )}
                </View>
              </View>

              <View style={[styles.sectionCard, styles.toolsSection]}>
                <Text style={styles.sectionTitle}>Previos y Descargas PDF</Text>
                <View style={styles.toolsGrid}>
                  {renderToolCard('Report')}
                  {renderToolCard('Trapping')}
                  {renderToolCard('Repetidora')}
                  {renderToolCard('Troquel')}
                </View>
                {/* Botones de editar/eliminar en la parte inferior eliminados para evitar duplicados; se usa el header. */}
              </View>
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

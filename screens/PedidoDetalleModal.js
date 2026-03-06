import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { usePermission } from './usePermission';

const API_BASE = 'http://localhost:8080';

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
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 16,
    maxHeight: '94%',
  },
  header: {
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    position: 'relative',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    top: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  closeBtnText: {
    fontSize: 15,
    color: '#F8FAFC',
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    letterSpacing: 1,
    textTransform: 'uppercase',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: -12,
    marginTop: -12,
    marginBottom: 12,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
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
    color: '#475569',
  },
  value: {
    flex: 0.62,
    fontSize: 13,
    fontWeight: '500',
    color: '#0F172A',
  },
  fullWidthRow: {
    marginBottom: 8,
  },
  fullWidthLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  fullWidthValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0F172A',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActions: {
    position: 'absolute',
    right: 64,
    top: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  actionIconText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  editBtnText: { color: '#FFFFFF', fontWeight: '800' },
  dangerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#DC2626',
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
    color: '#DC2626',
    textAlign: 'center',
    marginTop: 20,
  },

  // ── Gestión de archivos ─────────────────────────────────────────────────
  fileUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#475569',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  fileUploadBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  fileIcon: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    flexShrink: 0,
  },
  fileIconText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
  },
  fileName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  fileMeta: {
    fontSize: 11,
    color: '#94A3B8',
    marginRight: 6,
  },
  fileActionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 4,
  },
  fileDownloadBtn: { backgroundColor: '#475569' },
  fileDeleteBtn: { backgroundColor: '#DC2626' },
  fileActionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyFilesText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    paddingVertical: 8,
  },

  // ── Versiones unitario ──────────────────────────────────────────────────
  versionTabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  versionTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  versionTabActive: {
    backgroundColor: '#1E293B',
    borderColor: '#1E293B',
  },
  versionTabDeleteBtn: {
    padding: 2,
    borderRadius: 3,
  },
  versionTabDeleteBtnText: {
    fontSize: 9,
    color: '#94A3B8',
    lineHeight: 13,
  },
  versionTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  versionTabTextActive: {
    color: '#F8FAFC',
  },
  versionDate: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },

  // ── PDF preview ─────────────────────────────────────────────────────────
  previewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  pdfPreviewWrapper: {
    width: '25%',
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    overflow: 'hidden',
    flexShrink: 0,
    backgroundColor: '#F8FAFC',
  },
  metaColumn: {
    flex: 1,
    minWidth: 0,
  },
  metaTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  tintaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tintaDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    flexShrink: 0,
  },
  tintaNombre: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  tintaTipo: {
    fontSize: 10,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  tintaValores: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  pdfOpenHint: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'left',
    marginBottom: 12,
    fontStyle: 'italic',
  },

  // ── Botones Esko ────────────────────────────────────────────────────────
  eskoActionsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  eskoBtn: {
    flex: 1,
    minWidth: 80,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#475569',
    alignItems: 'center',
  },
  eskoBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default function PedidoDetalleModal({ visible, onClose, pedidoId, onDeleted, onEdit, currentUser = null }) {
  const canDelete = usePermission('eliminar_archivos');
  const [pedido, setPedido] = useState(null);
  const [activeRole, setActiveRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chargingAction, setChargingAction] = useState(null);

  // Archivos
  const [archivos, setArchivos] = useState({ artes: [], unitario: [] });
  const [archivosLoading, setArchivosLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [uploadingArtes, setUploadingArtes] = useState(false);
  const [uploadingUnitario, setUploadingUnitario] = useState(false);
  const [pdfMeta, setPdfMeta] = useState(null);
  const [pdfMetaLoading, setPdfMetaLoading] = useState(false);
  const fileInputArtesRef    = useRef(null);
  const fileInputUnitarioRef = useRef(null);

  // Carga metadatos XMP cuando cambia la versión seleccionada
  useEffect(() => {
    if (selectedVersion === null) { setPdfMeta(null); return; }
    const versionDoc = archivos.unitario.find((u) => u.version === selectedVersion);
    if (!versionDoc) return;
    setPdfMetaLoading(true);
    setPdfMeta(null);
    fetch(`${API_BASE}/api/archivos/${versionDoc.id}/metadatos`, {
      headers: { 'X-Empresa-Id': '1' },
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setPdfMeta(data || null))
      .catch(() => setPdfMeta(null))
      .finally(() => setPdfMetaLoading(false));
  }, [selectedVersion, archivos.unitario]);

  useEffect(() => {
    if (!visible) {
      setArchivos({ artes: [], unitario: [] });
      setSelectedVersion(null);
      return;
    }
    if (pedidoId) {
      cargarPedido();
      cargarRolActivo();
      cargarArchivos();
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
      const respAll = await fetch(`${API_BASE}/api/settings`);
      if (!respAll.ok) { setActiveRole(''); return; }
      const all = await respAll.json().catch(() => ({}));
      setActiveRole(normalizarRolActivo((all.settings && (all.settings.active_role || all.settings.activeRole || all.settings.active)) || ''));
    } catch {
      setActiveRole('');
    }
  };

  const cargarPedido = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/pedidos/${pedidoId}`);
      if (response.ok) {
        setPedido(await response.json());
      } else {
        setError('No se pudo cargar el pedido');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const cargarArchivos = async () => {
    if (!pedidoId) return;
    setArchivosLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/pedidos/${pedidoId}/archivos`);
      if (!resp.ok) return;
      const data = await resp.json().catch(() => ({}));
      const lista = data.archivos || [];
      const artes    = lista.filter((a) => a.tipo === 'arte');
      const unitario = lista
        .filter((a) => a.tipo === 'unitario')
        .sort((a, b) => (a.version || 0) - (b.version || 0));
      setArchivos({ artes, unitario });
      if (unitario.length > 0) {
        const latestVersion = unitario[unitario.length - 1].version;
        setSelectedVersion((prev) => {
          const stillExists = unitario.some((u) => u.version === prev);
          return stillExists ? prev : latestVersion;
        });
      } else {
        setSelectedVersion(null);
      }
    } catch (_) {
      // silent — sección muestra estado vacío
    } finally {
      setArchivosLoading(false);
    }
  };

  const handleUploadArtes = async (files) => {
    if (!files || files.length === 0) return;
    setUploadingArtes(true);
    try {
      const formData = new FormData();
      formData.append('tipo', 'arte');
      Array.from(files).forEach((file) => formData.append('files', file));
      const resp = await fetch(`${API_BASE}/api/pedidos/${pedidoId}/archivos`, {
        method: 'POST',
        body: formData,
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) { Alert.alert('Error al subir', data.error || 'No se pudieron subir los archivos'); return; }
      await cargarArchivos();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setUploadingArtes(false);
      if (fileInputArtesRef.current) fileInputArtesRef.current.value = '';
    }
  };

  const handleUploadUnitario = async (file) => {
    if (!file) return;
    setUploadingUnitario(true);
    try {
      const formData = new FormData();
      formData.append('tipo', 'unitario');
      formData.append('files', file);
      const resp = await fetch(`${API_BASE}/api/pedidos/${pedidoId}/archivos`, {
        method: 'POST',
        body: formData,
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) { Alert.alert('Error al subir', data.error || 'No se pudo subir el PDF unitario'); return; }
      await cargarArchivos();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setUploadingUnitario(false);
      if (fileInputUnitarioRef.current) fileInputUnitarioRef.current.value = '';
    }
  };

  const handleEliminarArchivo = async (archivoId) => {
    const confirmDel = (typeof window !== 'undefined' && window.confirm)
      ? window.confirm('¿Eliminar este archivo?')
      : await new Promise((resolve) =>
          Alert.alert('Eliminar archivo', '¿Seguro que deseas eliminar este archivo?', [
            { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Eliminar', style: 'destructive', onPress: () => resolve(true) },
          ])
        );
    if (!confirmDel) return;
    try {
      const resp = await fetch(`${API_BASE}/api/archivos/${archivoId}`, { method: 'DELETE' });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) { Alert.alert('Error', data.error || 'No se pudo eliminar'); return; }
      await cargarArchivos();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const formatearTamanio = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
      const response = await fetch(`${API_BASE}/api/billing/consumir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion,
          usuario_nombre: usuarioNombre,
          referencia: `PED-${pedido.id}-${accion}`,
          metadata: { pedido_id: pedido.id, numero_pedido: pedido.numero_pedido || null, tool: accion },
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) { Alert.alert('No se pudo descargar', data.error || 'Error al consumir créditos'); return; }
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

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.container}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Detalle del Pedido</Text>
            {canDelete && (
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={[styles.actionIcon, { backgroundColor: 'rgba(255,255,255,0.06)' }]}
                  onPress={async () => {
                    if (!pedido) return;
                    let fullPedido = pedido;
                    const pid = pedido && (pedido.id || pedido.pedido_id || pedido._id) ? (pedido.id || pedido.pedido_id || pedido._id) : null;
                    if (pid) {
                      try {
                        const resp = await fetch(`${API_BASE}/api/pedidos/${pid}`);
                        if (resp.ok) fullPedido = await resp.json();
                      } catch (e) {}
                    }
                    if (typeof onEdit === 'function') {
                      onEdit(fullPedido);
                      if (typeof onClose === 'function') onClose();
                      return;
                    }
                    Alert.alert('Editar', 'Funcionalidad de edición no configurada.');
                  }}
                >
                  <Text style={styles.actionIconText}>✎</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionIcon, { backgroundColor: 'rgba(255,107,107,0.9)' }]}
                  onPress={async () => {
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
                      const res = await fetch(`${API_BASE}/api/pedidos/${pedido.id}`, { method: 'DELETE' });
                      const data = await res.json().catch(() => ({}));
                      if (!res.ok) { Alert.alert('Error', data.error || 'No se pudo eliminar el pedido'); return; }
                      Alert.alert('Pedido eliminado', 'El pedido ha sido eliminado con éxito');
                      if (typeof onDeleted === 'function') onDeleted();
                    } catch (err) { Alert.alert('Error', 'Error de conexión: ' + err.message); }
                  }}
                >
                  <Text style={styles.actionIconText}>🗑</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#3AB274" />
            </View>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : pedido ? (
            <ScrollView>
              {/* ── Info cards (pedido + cliente + presupuesto) ──────────── */}
              <View style={styles.topGrid}>
                {(() => {
                  const dp = pedido.datos_presupuesto || null;
                  const hasPresupuesto = dp && Object.keys(dp).some((k) => {
                    const v = dp[k];
                    if (v === null || v === undefined) return false;
                    if (Array.isArray(v)) return v.length > 0;
                    if (typeof v === 'string') return v.trim() !== '';
                    return true;
                  });

                  if (hasPresupuesto) {
                    return (
                      <>
                        <View style={styles.leftCol}>
                          <View style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>Pedido</Text>
                            {renderRow('Número:', pedido.numero_pedido || '-')}
                            {renderRow('Fecha pedido:', formatearFecha(pedido.fecha_pedido))}
                            {renderRow('Referencia:', pedido.referencia || '-')}
                            {renderRow('Nombre trabajo:', pedido.nombre || '-')}
                            {renderRow('Estado:', pedido.estado || '-')}
                            {renderRow('Fecha entrega:', formatearFecha(pedido.fecha_entrega))}
                            {renderRow('Retraso (días):', String(pedido.dias_retraso ?? 0), (pedido.dias_retraso || 0) > 0 ? '#FF6B6B' : '#3AB274')}
                          </View>
                          <View style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>Cliente / Contacto</Text>
                            {renderRow('Cliente:', (typeof pedido.cliente === 'string') ? pedido.cliente : (pedido.cliente && (pedido.cliente.nombre || '-')))}
                            {renderRow('Razón social:', pedido.datos_presupuesto?.razon_social || pedido.razon_social || '-')}
                            {renderRow('CIF:', pedido.datos_presupuesto?.cif || pedido.cif || '-')}
                            {renderRow('Contacto:', pedido.datos_presupuesto?.personas_contacto || pedido.personas_contacto || '-')}
                            {renderRow('Email:', pedido.datos_presupuesto?.email || pedido.email || '-')}
                            {renderRow('Vendedor:', pedido.datos_presupuesto?.vendedor || '-')}
                          </View>
                        </View>

                        <View style={styles.rightCol}>
                          <View style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>Presupuesto / Producto</Text>
                            {renderRow('Nº Presupuesto:', pedido.datos_presupuesto?.numero_presupuesto || pedido.numero_presupuesto || '-')}
                            {renderRow('Referencia presupuesto:', pedido.datos_presupuesto?.referencia || '-')}
                            {renderRow('Formato:', pedido.datos_presupuesto?.formatoAncho ? `${pedido.datos_presupuesto.formatoAncho} x ${pedido.datos_presupuesto.formatoLargo || '-'} mm` : '-')}
                            {renderRow('Máquina:', pedido.datos_presupuesto?.maquina || pedido.maquina || '-')}
                            {renderRow('Material:', pedido.datos_presupuesto?.material || '-')}
                            {renderRow('Acabado:', Array.isArray(pedido.datos_presupuesto?.acabado) ? (pedido.datos_presupuesto.acabado.length ? pedido.datos_presupuesto.acabado.join(', ') : '-') : (pedido.datos_presupuesto?.acabado || '-'))}
                            {renderRow('Tirada:', pedido.datos_presupuesto?.tirada ? `${pedido.datos_presupuesto.tirada} unidades` : '-')}
                            {renderRow('Tintas:', Array.isArray(pedido.datos_presupuesto?.selectedTintas) ? pedido.datos_presupuesto.selectedTintas.join(', ') : pedido.datos_presupuesto?.selectedTintas || '-')}
                            {renderRow('Tinta especial:', Array.isArray(pedido.datos_presupuesto?.detalleTintaEspecial) ? (pedido.datos_presupuesto.detalleTintaEspecial.length ? pedido.datos_presupuesto.detalleTintaEspecial.join(', ') : '-') : (pedido.datos_presupuesto?.detalleTintaEspecial || '-'))}
                            {renderRow('Troquel estado:', pedido.datos_presupuesto?.troquelEstadoSel || '-')}
                            {renderRow('Troquel forma:', pedido.datos_presupuesto?.troquelFormaSel || '-')}
                            {renderRow('Troquel coste:', pedido.datos_presupuesto?.troquelCoste || '-')}
                            <View style={styles.fullWidthRow}>
                              <Text style={styles.fullWidthLabel}>Observaciones:</Text>
                              <Text style={styles.fullWidthValue}>{pedido.datos_presupuesto?.observaciones || '-'}</Text>
                            </View>
                          </View>
                        </View>
                      </>
                    );
                  }

                  return (
                    <>
                      <View style={styles.leftCol}>
                        <View style={styles.sectionCard}>
                          <Text style={styles.sectionTitle}>Pedido</Text>
                          {renderRow('Número:', pedido.numero_pedido || '-')}
                          {renderRow('Fecha pedido:', formatearFecha(pedido.fecha_pedido))}
                          {renderRow('Referencia:', pedido.referencia || '-')}
                          {renderRow('Nombre trabajo:', pedido.nombre || '-')}
                          {renderRow('Estado:', pedido.estado || '-')}
                          {renderRow('Fecha entrega:', formatearFecha(pedido.fecha_entrega))}
                          {renderRow('Retraso (días):', String(pedido.dias_retraso ?? 0), (pedido.dias_retraso || 0) > 0 ? '#FF6B6B' : '#3AB274')}
                        </View>
                      </View>
                      <View style={styles.rightCol}>
                        <View style={styles.sectionCard}>
                          <Text style={styles.sectionTitle}>Cliente / Contacto</Text>
                          {renderRow('Cliente:', (typeof pedido.cliente === 'string') ? pedido.cliente : (pedido.cliente && (pedido.cliente.nombre || '-')))}
                          {renderRow('Razón social:', pedido.razon_social || '-')}
                          {renderRow('CIF:', pedido.cif || '-')}
                          {renderRow('Contacto:', pedido.personas_contacto || '-')}
                          {renderRow('Email:', pedido.email || '-')}
                          {renderRow('Vendedor:', (pedido.datos_presupuesto && pedido.datos_presupuesto.vendedor) || '-')}
                        </View>
                      </View>
                    </>
                  );
                })()}
              </View>

              {/* ── Artes Finales del Cliente ─────────────────────────────── */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Artes Finales del Cliente</Text>

                {Platform.OS === 'web' && (
                  <input
                    type="file"
                    ref={fileInputArtesRef}
                    style={{ display: 'none' }}
                    multiple
                    accept=".pdf,.ai,.eps,.jpg,.jpeg,.png"
                    onChange={(e) => handleUploadArtes(e.target.files)}
                  />
                )}

                <TouchableOpacity
                  style={[styles.fileUploadBtn, uploadingArtes && { opacity: 0.6 }]}
                  onPress={() => fileInputArtesRef.current && fileInputArtesRef.current.click()}
                  disabled={uploadingArtes}
                >
                  {uploadingArtes && <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 6 }} />}
                  <Text style={styles.fileUploadBtnText}>
                    {uploadingArtes ? 'Subiendo...' : '+ Subir archivos'}
                  </Text>
                </TouchableOpacity>

                {archivosLoading && archivos.artes.length === 0 ? (
                  <ActivityIndicator size="small" color="#475569" />
                ) : archivos.artes.length === 0 ? (
                  <Text style={styles.emptyFilesText}>Sin archivos de cliente</Text>
                ) : (
                  archivos.artes.map((archivo) => {
                    const ext = (archivo.nombre_original || '').split('.').pop().toUpperCase().slice(0, 4);
                    return (
                      <View key={archivo.id} style={styles.fileRow}>
                        <View style={styles.fileIcon}>
                          <Text style={styles.fileIconText}>{ext}</Text>
                        </View>
                        <Text style={styles.fileName} numberOfLines={1}>{archivo.nombre_original}</Text>
                        <Text style={styles.fileMeta}>{formatearTamanio(archivo.tamanio)}</Text>
                        <TouchableOpacity
                          style={[styles.fileActionBtn, styles.fileDownloadBtn]}
                          onPress={() => { if (typeof window !== 'undefined') window.open(`${API_BASE}/api/archivos/${archivo.id}`, '_blank'); }}
                        >
                          <Text style={styles.fileActionBtnText}>↓</Text>
                        </TouchableOpacity>
                        {canDelete && (
                          <TouchableOpacity
                            style={[styles.fileActionBtn, styles.fileDeleteBtn]}
                            onPress={() => handleEliminarArchivo(archivo.id)}
                          >
                            <Text style={styles.fileActionBtnText}>✕</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })
                )}
              </View>

              {/* ── Unitario ──────────────────────────────────────────────── */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Unitario</Text>

                {Platform.OS === 'web' && (
                  <input
                    type="file"
                    ref={fileInputUnitarioRef}
                    style={{ display: 'none' }}
                    accept=".pdf"
                    onChange={(e) => e.target.files[0] && handleUploadUnitario(e.target.files[0])}
                  />
                )}

                <TouchableOpacity
                  style={[styles.fileUploadBtn, uploadingUnitario && { opacity: 0.6 }]}
                  onPress={() => fileInputUnitarioRef.current && fileInputUnitarioRef.current.click()}
                  disabled={uploadingUnitario}
                >
                  {uploadingUnitario && <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 6 }} />}
                  <Text style={styles.fileUploadBtnText}>
                    {uploadingUnitario ? 'Subiendo...' : '+ Subir nueva versión'}
                  </Text>
                </TouchableOpacity>

                {archivosLoading && archivos.unitario.length === 0 ? (
                  <ActivityIndicator size="small" color="#475569" />
                ) : archivos.unitario.length === 0 ? (
                  <Text style={styles.emptyFilesText}>Sin PDF unitario — sube la primera versión</Text>
                ) : (
                  <>
                    {/* Tabs de versión */}
                    <View style={styles.versionTabsRow}>
                      {archivos.unitario.map((u) => {
                        const isActive = u.version === selectedVersion;
                        const fecha = u.fecha_subida ? u.fecha_subida.split('T')[0].split('-').reverse().join('/') : '';
                        return (
                          <View key={u.id} style={[styles.versionTab, isActive && styles.versionTabActive]}>
                            <TouchableOpacity
                              onPress={() => setSelectedVersion(u.version)}
                              style={{ flex: 1 }}
                            >
                              <Text style={[styles.versionTabText, isActive && styles.versionTabTextActive]}>
                                v{u.version}
                              </Text>
                              {fecha ? <Text style={[styles.versionDate, isActive && { color: '#CBD5E1' }]}>{fecha}</Text> : null}
                            </TouchableOpacity>
                            {canDelete && (
                              <TouchableOpacity
                                onPress={() => handleEliminarArchivo(u.id)}
                                style={styles.versionTabDeleteBtn}
                                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                              >
                                <Text style={[styles.versionTabDeleteBtnText, isActive && { color: '#FCA5A5' }]}>✕</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        );
                      })}
                    </View>

                    {/* Fila: thumbnail + metadatos tintas */}
                    {(() => {
                      const selected = archivos.unitario.find((u) => u.version === selectedVersion);
                      if (!selected) return null;
                      const inlineUrl = `${API_BASE}/api/archivos/${selected.id}/inline`;

                      // color representativo del punto de tinta
                      const dotColor = (t) => {
                        if (t.modelo === 'CMYK') {
                          const n = t.nombre.toLowerCase();
                          if (n === 'cyan')    return '#00AEEF';
                          if (n === 'magenta') return '#EC008C';
                          if (n === 'yellow')  return '#FFD700';
                          if (n === 'black')   return '#1A1A1A';
                          // genérico CMYK basado en valores
                          const c = (t.c||0)/100, m = (t.m||0)/100, y = (t.y||0)/100, k = (t.k||0)/100;
                          const r = Math.round(255*(1-c)*(1-k));
                          const g = Math.round(255*(1-m)*(1-k));
                          const b = Math.round(255*(1-y)*(1-k));
                          return `rgb(${r},${g},${b})`;
                        }
                        if (t.modelo === 'RGB') return `rgb(${t.r||0},${t.g||0},${t.b||0})`;
                        return '#8B5CF6'; // spot sin valores → violeta
                      };

                      const fmtValores = (t) => {
                        if (t.modelo === 'CMYK') return `C${t.c} M${t.m} Y${t.y} K${t.k}`;
                        if (t.modelo === 'LAB')  return `L${t.l} a${t.a_lab} b${t.b_lab}`;
                        if (t.modelo === 'RGB')  return `R${t.r} G${t.g} B${t.b}`;
                        return null;
                      };

                      return (
                        <View style={styles.previewRow}>
                          {/* Thumbnail PDF */}
                          <View style={styles.pdfPreviewWrapper}>
                            {Platform.OS === 'web' ? (
                              <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
                                <iframe
                                  key={selected.id}
                                  src={`${inlineUrl}#toolbar=0&navpanes=0&zoom=page-fit`}
                                  style={{ border: 'none', display: 'block', pointerEvents: 'none', width: '100%', height: '100%' }}
                                  title={`Unitario v${selected.version}`}
                                />
                                <div
                                  onClick={() => window.open(inlineUrl, '_blank')}
                                  style={{ position: 'absolute', inset: 0, cursor: 'pointer' }}
                                  title="Abrir PDF en nueva pestaña"
                                />
                              </div>
                            ) : (
                              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 8 }}>
                                <Text style={{ color: '#94A3B8', fontSize: 11, textAlign: 'center' }}>{selected.nombre_original}</Text>
                              </View>
                            )}
                          </View>

                          {/* Columna metadatos / tintas */}
                          <View style={styles.metaColumn}>
                            <Text style={styles.metaTitle}>Tintas</Text>
                            {pdfMetaLoading ? (
                              <ActivityIndicator size="small" color="#94A3B8" />
                            ) : !pdfMeta || !pdfMeta.tintas || pdfMeta.tintas.length === 0 ? (
                              <Text style={{ fontSize: 11, color: '#CBD5E1', fontStyle: 'italic' }}>Sin datos de tintas</Text>
                            ) : (
                              pdfMeta.tintas.map((t, i) => (
                                <View key={i} style={styles.tintaItem}>
                                  <View style={[styles.tintaDot, { backgroundColor: dotColor(t) }]} />
                                  <View style={{ flex: 1, minWidth: 0 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                      <Text style={styles.tintaNombre} numberOfLines={1}>{t.nombre}</Text>
                                      <Text style={styles.tintaTipo}>{t.tipo === 'process' ? 'proceso' : 'especial'}</Text>
                                    </View>
                                    {fmtValores(t) && <Text style={styles.tintaValores}>{fmtValores(t)}</Text>}
                                  </View>
                                </View>
                              ))
                            )}
                          </View>
                        </View>
                      );
                    })()}

                    {/* Botones Esko (debajo del preview) */}
                    <View style={styles.eskoActionsRow}>
                      {['Report', 'Repetidora', 'Trapping', 'Troquel'].map((title) => {
                        const accion = mapToolToAccion(title);
                        const isLoading = chargingAction === accion;
                        return (
                          <TouchableOpacity
                            key={title}
                            style={[styles.eskoBtn, isLoading && { opacity: 0.6 }]}
                            onPress={() => handleDescargarTool(title)}
                            disabled={!!isLoading}
                          >
                            <Text style={styles.eskoBtnText}>
                              {isLoading ? '...' : title}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </>
                )}
              </View>

            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

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
import NuevoPedidoModal from './NuevoPedidoModal';

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
    height: '94%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 16,
    flexDirection: 'column',
  },
  header: {
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    paddingHorizontal: 16,
    position: 'relative',
    marginBottom: 12,
    borderRadius: 12,
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
    padding: 4,
  },
  closeBtnText: {
    fontSize: 20,
    color: '#F8FAFC',
    fontWeight: '900',
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
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
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
  fileSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: -12,
    marginTop: -12,
    marginBottom: 10,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  fileUploadIconBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileUploadIconBtnText: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 20,
    fontWeight: '600',
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
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
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
    position: 'absolute',
    top: -6,
    right: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  versionTabDeleteBtnText: {
    fontSize: 8,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 10,
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
  versionTabsCol: {
    flexDirection: 'column',
    gap: 4,
    minWidth: 62,
    flexShrink: 0,
    paddingTop: 6,
    paddingRight: 6,
  },

  // ── PDF Lightbox ─────────────────────────────────────────────────────────
  lightboxOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  lightboxContent: {
    width: '92%',
    height: '92%',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  lightboxCloseBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    padding: 4,
  },
  lightboxCloseBtnText: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '900',
  },

  // ── PDF preview ─────────────────────────────────────────────────────────
  previewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  pdfPreviewWrapper: {
    width: '16%',
    aspectRatio: 3 / 4,
    borderRadius: 6,
    overflow: 'hidden',
    flexShrink: 0,
    backgroundColor: '#FFFFFF',
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
  sepChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  sepChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexBasis: '47%',
    flexGrow: 1,
  },
  sepChipWarn: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  sepSwatch: {
    width: 28,
    height: 28,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    flexShrink: 0,
  },
  sepNombre: {
    fontSize: 11,
    fontWeight: '500',
    color: '#1E293B',
    flex: 1,
  },
  sepWarnIcon: {
    fontSize: 10,
    color: '#D97706',
    flexShrink: 0,
  },
  mismatchBanner: {
    marginTop: 8,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  mismatchText: {
    fontSize: 10,
    color: '#92400E',
    lineHeight: 15,
  },
  matchBanner: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  matchText: {
    fontSize: 10,
    color: '#166534',
    fontWeight: '600',
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
  eskoToolCol: {
    flex: 1,
    minWidth: 80,
  },
  eskoBtn: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#0369A1',
    alignItems: 'center',
  },
  eskoBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  eskoOutputBox: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 6,
    minHeight: 36,
    paddingVertical: 6,
    paddingHorizontal: 6,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eskoOutputEmptyText: {
    fontSize: 10,
    color: '#CBD5E1',
    fontStyle: 'italic',
  },
  // ── Tabs navegación ──────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 10,
    paddingHorizontal: 8,
    paddingTop: 6,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tabBtnActive: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: '#E2E8F0',
    borderLeftColor: '#E2E8F0',
    borderRightColor: '#E2E8F0',
    borderBottomColor: '#FFFFFF',
    marginBottom: -1,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  filesSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  fileCountBadge: {
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 2,
  },
  fileCountBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  filesSeparator: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 14,
  },
  // ── Barra de acciones inferior ────────────────────────────────────
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 4,
  },
  bottomMainBtns: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  bottomEditBtn: {
    backgroundColor: '#475569',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    minWidth: 130,
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  bottomEditBtnText: {
    color: '#F8FAFC',
    fontWeight: '600',
    fontSize: 13,
  },
  bottomCancelBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    minWidth: 130,
  },
  bottomCancelBtnText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 13,
  },
  bottomDeleteBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomDeleteBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  // ── Display de tintas 2 columnas ──────────────────────────────────
  inkSection: {
    marginBottom: 10,
  },
  inkSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  inkColsRow: {
    flexDirection: 'row',
    gap: 0,
  },
  inkCol: {
    flex: 1,
  },
  inkColBorder: {
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
    paddingLeft: 12,
  },
  inkColTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  inkChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 8,
  },
  inkSwatch: {
    width: 36,
    height: 36,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    flexShrink: 0,
  },
  inkChipLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1E293B',
    flex: 1,
  },
});

export default function PedidoDetalleModal({ visible, onClose, pedidoId, onDeleted, onEdit, currentUser = null, refreshKey = 0 }) {
  const canDelete = usePermission('eliminar_archivos');
  const canEdit   = usePermission('edit_pedidos');
  const [editVisible, setEditVisible]           = useState(false);
  const [editInitialValues, setEditInitialValues] = useState(null);
  const [pedido, setPedido] = useState(null);
  const [activeRole, setActiveRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chargingAction, setChargingAction] = useState(null);
  const [activeTab, setActiveTab] = useState('datos');

  // Archivos
  const [archivos, setArchivos] = useState({ artes: [], unitario: [] });
  const [archivosLoading, setArchivosLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [uploadingArtes, setUploadingArtes] = useState(false);
  const [uploadingUnitario, setUploadingUnitario] = useState(false);
  const [artesExpanded, setArtesExpanded] = useState(false);
  const [pdfMeta, setPdfMeta] = useState(null);
  const [pdfMetaLoading, setPdfMetaLoading] = useState(false);
  const [pdfLightboxUrl, setPdfLightboxUrl] = useState(null);
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
      setActiveTab('datos');
      setPdfLightboxUrl(null);
      return;
    }
    if (pedidoId) {
      cargarPedido();
      cargarRolActivo();
      cargarArchivos();
    }
  }, [visible, pedidoId, refreshKey]);

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
      setArtesExpanded(true);
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
    <>
      <Modal visible={visible} transparent animationType="fade">
      <View style={styles.container}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Detalle del Pedido</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* ── Pestañas ── */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={activeTab === 'datos' ? styles.tabBtnActive : styles.tabBtn}
              onPress={() => setActiveTab('datos')}
            >
              <Text style={activeTab === 'datos' ? styles.tabTextActive : styles.tabText}>Pedido</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={activeTab === 'archivos' ? styles.tabBtnActive : styles.tabBtn}
              onPress={() => setActiveTab('archivos')}
            >
              <Text style={activeTab === 'archivos' ? styles.tabTextActive : styles.tabText}>Archivos</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1, overflow: 'hidden' }}>
            {loading ? (
              <View style={styles.loading}>
                <ActivityIndicator size="large" color="#3AB274" />
              </View>
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : pedido ? (
              <ScrollView style={{ flex: 1 }}>

              {/* ═══════════════════ TAB: PEDIDO ═══════════════════ */}
              {activeTab === 'datos' && (
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
                              {renderRow('Razón social:', dp?.razon_social || pedido.razon_social || '-')}
                              {renderRow('CIF:', dp?.cif || pedido.cif || '-')}
                              {renderRow('Contacto:', dp?.personas_contacto || pedido.personas_contacto || '-')}
                              {renderRow('Email:', dp?.email || pedido.email || '-')}
                              {renderRow('Vendedor:', dp?.vendedor || '-')}
                            </View>
                          </View>

                          <View style={styles.rightCol}>
                            <View style={styles.sectionCard}>
                              <Text style={styles.sectionTitle}>Presupuesto / Producto</Text>
                              {renderRow('Nº Presupuesto:', dp?.numero_presupuesto || pedido.numero_presupuesto || '-')}
                              {renderRow('Referencia presupuesto:', dp?.referencia || '-')}
                              {renderRow('Formato:', dp?.formatoAncho ? `${dp.formatoAncho} x ${dp.formatoLargo || '-'} mm` : '-')}
                              {renderRow('Máquina:', dp?.maquina || pedido.maquina || '-')}
                              {renderRow('Material:', dp?.material || '-')}
                              {renderRow('Acabado:', Array.isArray(dp?.acabado) ? (dp.acabado.length ? dp.acabado.join(', ') : '-') : (dp?.acabado || '-'))}
                              {renderRow('Tirada:', dp?.tirada ? `${dp.tirada} unidades` : '-')}
                              {/* ── Tintas como texto ── */}
                              {(() => {
                                const CMYK_LABELS = { C: 'Cyan', M: 'Magenta', Y: 'Yellow', K: 'Negro' };
                                const items = [];
                                (dp?.selectedTintas || []).filter((t) => ['C','M','Y','K'].includes(t)).forEach((t) => items.push(CMYK_LABELS[t]));
                                const spotMap = new Map();
                                (dp?.selectedTintas || []).filter((t) => !['C','M','Y','K'].includes(t)).forEach((t) => spotMap.set(t, t));
                                (dp?.pantones || []).forEach((p) => {
                                  const lbl = p.label || p.key || '';
                                  if (!lbl || spotMap.has(lbl) || ['C','M','Y','K'].includes(lbl)) return;
                                  spotMap.set(lbl, lbl);
                                });
                                spotMap.forEach((lbl) => items.push(lbl));
                                (Array.isArray(dp?.detalleTintaEspecial) ? dp.detalleTintaEspecial : [])
                                  .forEach((te) => { if (te && !items.includes(te)) items.push(te); });
                                if (items.length === 0) return null;
                                return renderRow('Tintas:', items.join(' · '));
                              })()}
                              {renderRow('Troquel estado:', dp?.troquelEstadoSel || '-')}
                              {renderRow('Troquel forma:', dp?.troquelFormaSel || '-')}
                              {renderRow('Troquel coste:', dp?.troquelCoste || '-')}
                              <View style={styles.fullWidthRow}>
                                <Text style={styles.fullWidthLabel}>Observaciones:</Text>
                                <Text style={styles.fullWidthValue}>{dp?.observaciones || '-'}</Text>
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
              )}

              {/* ═══════════════════ TAB: ARCHIVOS ═══════════════════ */}
              {activeTab === 'archivos' && (
                <>
                <View style={styles.sectionCard}>

                  {/* ── Artes Finales del Cliente ── */}
                  <View style={styles.fileSectionHeader}>
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 6 }}
                      onPress={() => setArtesExpanded(v => !v)}
                    >
                      <Text style={{ fontSize: 9, color: '#94A3B8', lineHeight: 14 }}>{artesExpanded ? '▾' : '▸'}</Text>
                      <Text style={styles.filesSectionLabel}>Artes Finales del Cliente</Text>
                      {archivos.artes.length > 0 && (
                        <View style={styles.fileCountBadge}>
                          <Text style={styles.fileCountBadgeText}>{archivos.artes.length}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    {uploadingArtes
                      ? <ActivityIndicator size="small" color="#94A3B8" />
                      : (
                        <TouchableOpacity
                          style={styles.fileUploadIconBtn}
                          onPress={() => fileInputArtesRef.current && fileInputArtesRef.current.click()}
                        >
                          <Text style={styles.fileUploadIconBtnText}>+</Text>
                        </TouchableOpacity>
                      )
                    }
                  </View>

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

                  {artesExpanded && (archivosLoading && archivos.artes.length === 0 ? (
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
                  ))}

                </View>

                {/* ── Unitario ── */}
                <View style={styles.sectionCard}>
                  <View style={styles.fileSectionHeader}>
                    <Text style={styles.filesSectionLabel}>Unitario</Text>
                    {uploadingUnitario
                      ? <ActivityIndicator size="small" color="#94A3B8" />
                      : (
                        <TouchableOpacity
                          style={styles.fileUploadIconBtn}
                          onPress={() => fileInputUnitarioRef.current && fileInputUnitarioRef.current.click()}
                        >
                          <Text style={styles.fileUploadIconBtnText}>+</Text>
                        </TouchableOpacity>
                      )
                    }
                  </View>

                  {Platform.OS === 'web' && (
                    <input
                      type="file"
                      ref={fileInputUnitarioRef}
                      style={{ display: 'none' }}
                      accept=".pdf"
                      onChange={(e) => e.target.files[0] && handleUploadUnitario(e.target.files[0])}
                    />
                  )}

                  {archivosLoading && archivos.unitario.length === 0 ? (
                    <ActivityIndicator size="small" color="#475569" />
                  ) : archivos.unitario.length === 0 ? (
                    <Text style={styles.emptyFilesText}>Sin PDF unitario — sube la primera versión</Text>
                  ) : (
                    <>
                      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>

                        {/* LEFT: Tabs de versión en vertical */}
                        <View style={styles.versionTabsCol}>
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
                                    style={[styles.versionTabDeleteBtn, isActive && { backgroundColor: '#475569' }]}
                                  >
                                    <Text style={styles.versionTabDeleteBtnText}>✕</Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            );
                          })}
                        </View>

                        {/* RIGHT: Preview + separaciones + botones Esko */}
                        <View style={{ flex: 1, minWidth: 0 }}>

                          {/* Fila: thumbnail + separaciones */}
                          {(() => {
                            const selected = archivos.unitario.find((u) => u.version === selectedVersion);
                            if (!selected) return null;
                            const inlineUrl = `${API_BASE}/api/archivos/${selected.id}/inline`;

                            // ── Detección de mismatch tintas PDF vs pedido ──────────
                            const CMYK_NORM = { c: 'cyan', m: 'magenta', y: 'yellow', k: 'black' };
                            const inkKey = (name) => {
                              const n = String(name).toLowerCase().trim();
                              if (CMYK_NORM[n]) return CMYK_NORM[n];
                              const digits = n.match(/\d+/);
                              return digits ? digits[0] : n;
                            };
                            const dp = pedido?.datos_presupuesto || {};
                            const pedidoKeys = new Set([
                              ...(dp.selectedTintas || []).map(inkKey),
                              ...(dp.pantones || []).map((p) => inkKey(p.label || p.key || '')),
                              ...(Array.isArray(dp.detalleTintaEspecial) ? dp.detalleTintaEspecial : []).map(inkKey),
                            ]);
                            const pdfSeps = pdfMeta?.separaciones || [];
                            const pdfKeys = new Set(pdfSeps.map((s) => inkKey(s.nombre)));
                            const hasPedidoInks = pedidoKeys.size > 0 && pdfSeps.length > 0;
                            const extraEnPdf = hasPedidoInks
                              ? pdfSeps.filter((s) => s.tipo !== 'especial' && !pedidoKeys.has(inkKey(s.nombre)))
                              : [];
                            const extraEnPedido = hasPedidoInks
                              ? [
                                  ...(dp.selectedTintas || []).filter((t) => !pdfKeys.has(inkKey(t))),
                                  ...(dp.pantones || []).filter((p) => !pdfKeys.has(inkKey(p.label || p.key || ''))).map((p) => p.label || p.key),
                                  ...(Array.isArray(dp.detalleTintaEspecial) ? dp.detalleTintaEspecial : []).filter((te) => te && !pdfKeys.has(inkKey(te))),
                                ]
                              : [];
                            const extraEnPdfSet = new Set(extraEnPdf.map((s) => s.nombre));

                            return (
                              <View style={styles.previewRow}>
                                {/* Thumbnail PDF */}
                                <View style={styles.pdfPreviewWrapper}>
                                  {Platform.OS === 'web' ? (
                                    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
                                      <iframe
                                        key={selected.id}
                                        src={`${inlineUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
                                        style={{ border: 'none', outline: 'none', display: 'block', pointerEvents: 'none', width: '100%', height: '100%', colorScheme: 'light', backgroundColor: '#FFFFFF' }}
                                        title={`Unitario v${selected.version}`}
                                      />
                                      <div
                                        onClick={() => setPdfLightboxUrl(inlineUrl)}
                                        style={{ position: 'absolute', inset: 0, cursor: 'pointer' }}
                                        title="Ampliar PDF"
                                      />
                                    </div>
                                  ) : (
                                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 8 }}>
                                      <Text style={{ color: '#94A3B8', fontSize: 11, textAlign: 'center' }}>{selected.nombre_original}</Text>
                                    </View>
                                  )}
                                </View>

                                {/* Columna separaciones */}
                                <View style={styles.metaColumn}>
                                  <Text style={styles.metaTitle}>Separaciones</Text>
                                  {pdfMetaLoading ? (
                                    <ActivityIndicator size="small" color="#94A3B8" />
                                  ) : pdfSeps.length === 0 ? (
                                    <Text style={{ fontSize: 11, color: '#CBD5E1', fontStyle: 'italic' }}>Sin datos</Text>
                                  ) : (
                                    <>
                                      <View style={styles.sepChipsWrap}>
                                        {pdfSeps.map((s, i) => {
                                          const warn = extraEnPdfSet.has(s.nombre);
                                          return (
                                            <View key={i} style={[styles.sepChip, warn && styles.sepChipWarn]}>
                                              <View style={[styles.sepSwatch, { backgroundColor: s.color || '#CBD5E1' }]} />
                                              <Text style={styles.sepNombre} numberOfLines={1}>{s.nombre}</Text>
                                              {warn && <Text style={styles.sepWarnIcon}>⚠</Text>}
                                            </View>
                                          );
                                        })}
                                      </View>
                                      {hasPedidoInks && extraEnPdf.length === 0 && extraEnPedido.length === 0 ? (
                                        <View style={styles.matchBanner}>
                                          <Text style={styles.matchText}>✓ Tintas coinciden con el pedido</Text>
                                        </View>
                                      ) : (extraEnPdf.length > 0 || extraEnPedido.length > 0) ? (
                                        <View style={styles.mismatchBanner}>
                                          {extraEnPdf.length > 0 && (
                                            <Text style={styles.mismatchText}>
                                              En PDF, no en pedido: {extraEnPdf.map((s) => s.nombre).join(', ')}
                                            </Text>
                                          )}
                                          {extraEnPedido.length > 0 && (
                                            <Text style={[styles.mismatchText, { marginTop: extraEnPdf.length > 0 ? 2 : 0 }]}>
                                              En pedido, no en PDF: {extraEnPedido.join(', ')}
                                            </Text>
                                          )}
                                        </View>
                                      ) : null}
                                    </>
                                  )}
                                </View>
                              </View>
                            );
                          })()}

                          {/* Botones Esko */}
                          <View style={styles.eskoActionsRow}>
                            {['Report', 'Repetidora', 'Trapping', 'Troquel'].map((title) => {
                              const accion = mapToolToAccion(title);
                              const isLoading = chargingAction === accion;
                              return (
                                <View key={title} style={styles.eskoToolCol}>
                                  <TouchableOpacity
                                    style={[styles.eskoBtn, isLoading && { opacity: 0.6 }]}
                                    onPress={() => handleDescargarTool(title)}
                                    disabled={!!isLoading}
                                  >
                                    <Text style={styles.eskoBtnText}>
                                      {isLoading ? '...' : title}
                                    </Text>
                                  </TouchableOpacity>
                                  {/* Contenedor archivos procesados Esko */}
                                  <View style={styles.eskoOutputBox}>
                                    <Text style={styles.eskoOutputEmptyText}>—</Text>
                                  </View>
                                </View>
                              );
                            })}
                          </View>

                        </View>
                      </View>
                    </>
                  )}

                </View>
                </>
              )}

              </ScrollView>
            ) : null}
          </View>

          {/* ── Barra de acciones inferior ── */}
          {pedido && (
            <View style={styles.bottomBar}>
              {canDelete && (
                <TouchableOpacity
                  style={styles.bottomDeleteBtn}
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
                  <Text style={styles.bottomDeleteBtnText}>Eliminar</Text>
                </TouchableOpacity>
              )}
              <View style={styles.bottomMainBtns}>
                <TouchableOpacity style={styles.bottomCancelBtn} onPress={onClose}>
                  <Text style={styles.bottomCancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.bottomEditBtn}
                  onPress={async () => {
                    if (!pedido) return;
                    let fullPedido = pedido;
                    const pid = pedido.id || pedido.pedido_id || pedido._id || null;
                    if (pid) {
                      try {
                        const resp = await fetch(`${API_BASE}/api/pedidos/${pid}`);
                        if (resp.ok) fullPedido = await resp.json();
                      } catch (e) {}
                    }
                    setEditInitialValues(fullPedido);
                    setEditVisible(true);
                  }}
                >
                  <Text style={styles.bottomEditBtnText}>Editar pedido</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* ── Lightbox PDF ── */}
      {pdfLightboxUrl && (
        <Modal visible={true} transparent animationType="fade" onRequestClose={() => setPdfLightboxUrl(null)}>
          <View style={styles.lightboxOverlay}>
            <View style={styles.lightboxContent}>
              {Platform.OS === 'web' && (
                <iframe
                  src={pdfLightboxUrl}
                  style={{ width: '100%', height: '100%', border: 'none', colorScheme: 'light', backgroundColor: '#FFFFFF' }}
                  title="Vista previa PDF"
                />
              )}
              <TouchableOpacity style={styles.lightboxCloseBtn} onPress={() => setPdfLightboxUrl(null)}>
                <Text style={styles.lightboxCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </Modal>
    <NuevoPedidoModal
      visible={editVisible}
      onClose={() => { setEditVisible(false); setEditInitialValues(null); }}
      onSave={(p) => { setEditVisible(false); setEditInitialValues(null); cargarPedido(); if (typeof onEdit === 'function') onEdit(p); }}
      initialValues={editInitialValues}
      currentUser={currentUser}
      puedeCrear={canEdit}
    />
    </>
  );
}

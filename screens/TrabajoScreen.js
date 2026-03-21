import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Modal, Pressable } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import NuevoPedidoModal from './NuevoPedidoModal';
import PedidoDetalleModal from './PedidoDetalleModal';
import { PedidosContext } from '../PedidosContext';
import { usePermission } from './usePermission';
import Toast from '../components/Toast';
import useToast from '../components/useToast';
import EmptyState from '../components/EmptyState';
import { useSettings } from '../SettingsContext';
import { useMaquinas } from '../MaquinasContext';
import { useModulos } from '../ModulosContext';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2F8',
  },
  header: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    minHeight: 96,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 38,
    marginBottom: 6,
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
    color: '#F1F5F9',
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    textAlign: 'center',
  },
  headerSearchRow: {
    marginTop: 6,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 11,
    paddingVertical: 5,
    fontSize: 12,
    color: '#0F172A',
    width: '62%',
    alignSelf: 'center',
  },
  chartsContainer: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: 10,
    marginTop: 10,
    marginBottom: 10,
    padding: 12,
  },
  chartsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  chartRow: {
    marginBottom: 10,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chartLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  chartCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E55A2B',
  },
  chartTrack: {
    height: 10,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  chartStackRow: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'visible',
    backgroundColor: '#E2E8F0',
    marginBottom: 12,
    paddingVertical: 1,
  },
  chartFill: {
    height: '100%',
    borderRadius: 6,
  },
  chartLegendWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 6,
  },
  chartLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  chartLegendText: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '600',
  },
  chartLegendItemActive: {
    backgroundColor: '#EEF7F1',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    shadowColor: '#0F172A',
    shadowOpacity: 0.16,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  chartSegmentTouchable: {
    height: '100%',
  },
  chartSegmentActiveShadow: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    transform: [{ scaleY: 1.12 }],
    zIndex: 2,
  },
  chartEmpty: {
    fontSize: 12,
    color: '#475569',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  filterText: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '600',
  },
  filterClearBtn: {
    backgroundColor: '#EEF2F8',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  filterClearText: {
    color: '#374151',
    fontSize: 11,
    fontWeight: '700',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-start',
    marginTop: -4,
  },
  btn: {
    backgroundColor: '#EEF2F8',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnNew: {
    backgroundColor: '#475569',
  },
  btnNewText: {
    color: '#FFFFFF',
  },
  btnText: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 13,
  },
  btnPlusWrap: {
    position: 'relative',
  },
  btnPlus: {
    borderWidth: 1.5,
    borderColor: 'rgba(248,250,252,0.55)',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnPlusDisabled: {
    borderColor: 'rgba(248,250,252,0.2)',
  },
  btnPlusText: {
    color: '#F1F5F9',
    fontWeight: '600',
    fontSize: 13,
  },
  hoverHint: {
    position: 'absolute',
    left: 44,
    top: 8,
    backgroundColor: '#0F172A',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  hoverHintText: {
    color: '#F1F5F9',
    fontSize: 11,
    fontWeight: '700',
  },
  tableContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 6,
    borderRadius: 10,
    minHeight: 44,
    alignItems: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 3,
  },
  rowAlternate: {
    backgroundColor: '#F1F5F9',
  },
  tableCell: {
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F1F5F9',
  },
  cellText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0F172A',
  },
  colNumeroPedido: {
    flex: 0.12,
    alignItems: 'center',
  },
  colNombre: {
    flex: 0.19,
  },
  colCliente: {
    flex: 0.19,
  },
  colReferencia: {
    flex: 0.12,
  },
  colFase: {
    flex: 0.14,
    alignItems: 'center',
  },
  colEstado: {
    flex: 0.14,
    alignItems: 'center',
  },
  colAcciones: {
    flex: 0.12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  navBtn: {
    backgroundColor: '#EEF2F8',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    marginHorizontal: 2,
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  navBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  statusDiseno: {
    backgroundColor: '#E3F2FD',
  },
  statusDisenoText: {
    color: '#1976D2',
  },
  statusPendienteAprobacion: {
    backgroundColor: '#FFF3E0',
  },
  statusPendienteAprobacionText: {
    color: '#F57C00',
  },
  statusPendienteCliche: {
    backgroundColor: '#FCE4EC',
  },
  statusPendienteClicheText: {
    color: '#C2185B',
  },
  statusPendienteImpresion: {
    backgroundColor: '#F3E5F5',
  },
  statusPendienteImpresionText: {
    color: '#7B1FA2',
  },
  statusPendientePostImpresion: {
    backgroundColor: '#E0F2F1',
  },
  statusPendientePostImpresionText: {
    color: '#00796B',
  },
  statusFinalizado: {
    backgroundColor: '#E8F5E9',
  },
  statusFinalizadoText: {
    color: '#388E3C',
  },
  statusParado: {
    backgroundColor: '#FFEBEE',
  },
  statusParadoText: {
    color: '#D32F2F',
  },
  statusCancelado: {
    backgroundColor: '#F1F5F9',
  },
  statusCanceladoText: {
    color: '#475569',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  estadosDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  estadoDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    opacity: 0.3,
  },
  estadoDotActivo: {
    opacity: 1,
    transform: [{ scale: 1.55 }],
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 32,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  paginationBtn: {
    backgroundColor: '#475569',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  paginationBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  paginationBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  paginationInfo: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '92%',
    maxWidth: 520,
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalCloseX: {
    fontSize: 20,
    fontWeight: '900',
    color: '#475569',
    padding: 4,
  },
  maquinaItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#F1F5F9',
  },
  maquinaItemAtenuada: {
    opacity: 0.45,
  },
  maquinaItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  maquinaItemSubText: {
    marginTop: 2,
    fontSize: 12,
    color: '#475569',
  },
  modalActions: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalCloseBtn: {
    backgroundColor: '#EEF2F8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  modalCloseText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default function TrabajoScreen({ currentUser }) {
  const { t } = useTranslation();
  const ITEMS_PER_PAGE = 100;
  const ESTADO_FINALIZADO_COLOR = '#1F9D55';

  const ESTADOS_DEFAULT = [
    { value: 'en-diseno', label: 'En Diseño' },
  ];

  const ESTADOS_COLORS = [
    '#1976D2', '#F57C00', '#C2185B', '#7B1FA2', '#00796B', '#388E3C', '#D32F2F', '#616161', '#0EA5A4', '#4A90E2'
  ];

  // Mapa fijo de estado → color para consistencia
  const ESTADO_COLOR_MAP = {
    'en-diseno': '#1976D2',
    'diseno': '#1976D2', // compat con pedidos antiguos
    'pendiente-de-aprobacion': '#F57C00',
    'pendiente-de-cliche': '#C2185B',
    'pendiente-de-impresion': '#7B1FA2',
    'pendiente-post-impresion': '#00796B',
    'finalizado': '#1F9D55',
    'parado': '#D32F2F',
    'cancelado': '#9E9E9E',
  };

  const slugifyEstado = (texto) => {
    return String(texto || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const [trabajos, setTrabajos] = useState([]);
  const { toast, showToast, hideToast } = useToast();
  const [filtrados, setFiltrados] = useState([]);
  const [paginaPedidos, setPaginaPedidos] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingInitialValues, setEditingInitialValues] = useState(null);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [modalDetalleVisible, setModalDetalleVisible] = useState(false);
  const [detalleRefreshKey, setDetalleRefreshKey] = useState(0);
  const { settings, estadoRules, modoCreacion } = useSettings();
  const { maquinas } = useMaquinas();
  const [modalMaquinasVisible, setModalMaquinasVisible] = useState(false);
  const [trabajoParaProduccion, setTrabajoParaProduccion] = useState(null);
  const [estadosFiltro, setEstadosFiltro] = useState([]);
  const [hoverNuevo, setHoverNuevo] = useState(false);
  const canChangeEstado = usePermission('manage_estados_pedido');
  const puedeEditarFinalizado = usePermission('editar_estado_finalizado');
  const { modulos } = useModulos();
  const [stockModal, setStockModal] = useState({ visible: false, pedido: null, authHdrs: null, stockEntries: [], selectedStockId: '', metros: '', formatoAncho: 0 });
  const hoverNuevoTimerRef = useRef(null);
  const { actualizacionPedidos } = React.useContext(PedidosContext);
  const route = useRoute();

  // Insertar pedido nuevo si viene en params (por ejemplo desde PresupuestoScreen)
  useEffect(() => {
    try {
      const newPedido = route && route.params && route.params.newPedido;
      if (newPedido) {
        setTrabajos((prev) => {
          const exists = prev && prev.some((t) => String(t._id || t.id || t.numero_pedido) === String(newPedido._id || newPedido.id || newPedido.numero_pedido));
          if (exists) return prev;
          return [newPedido, ...(prev || [])];
        });
      }
    } catch (e) {
      // no bloquear la UI por errores de params
    }
  }, [route && route.params && route.params.newPedido]);

  const normalizarEstadoValue = (estadoRaw) => {
    const slug = slugifyEstado(estadoRaw || '');
    if (!slug) return ESTADOS_DEFAULT[0].value;
    // Migración: slugs antiguos → canónicos
    if (slug === 'diseno') return 'en-diseno';      // 'Diseño' → 'En Diseño'
    if (slug === 'pendiente') return 'en-diseno';   // viejo placeholder → primer estado real
    return slug;
  };

  const estadosDisponibles = useMemo(() => {
    const items = settings.estados_pedido || [];
    const parsed = items
      .map((item) => {
        const label = String(item?.valor || '').trim();
        const entry = { label, value: slugifyEstado(label) };
        if (item?.color) entry.color = item.color;
        return entry;
      })
      .filter((item) => item.label && item.value);
    const unique = parsed.filter((item, idx, self) => idx === self.findIndex((x) => x.value === item.value));
    return unique.length > 0 ? unique : ESTADOS_DEFAULT;
  }, [settings.estados_pedido]);

  const getStatusColor = (estado) => {
    const value = normalizarEstadoValue(estado);
    const color = getEstadoDotColor(value);
    // Dynamic approach: derive badge background from the state's color at ~20% opacity
    const backgroundColor = color + '33'; // hex alpha 0x33 ≈ 20% opacity
    return [
      { ...styles.statusBadge, backgroundColor },
      { ...styles.statusText, color }
    ];
  };

  const getStatusLabel = (estado) => {
    const value = normalizarEstadoValue(estado);
    const found = estadosDisponibles.find((item) => item.value === value);
    return found?.label || (estado || 'Pendiente');
  };

  const estadosTimeline = estadosDisponibles.filter(
    (estado) => !(estadoRules.ocultar_timeline || []).includes(estado.value)
  );

  // Generar color aleatorio pero consistente basado en hash del estado
  const generateColorFromHash = (text) => {
    // Normalizar el texto antes de hacer hash para consistencia
    const normalized = slugifyEstado(text);
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Colores vibrantes y distinguibles (10 colores)
    const vibrantes = [
      '#E91E63', // Rosa
      '#2196F3', // Azul claro
      '#00BCD4', // Cyan
      '#4CAF50', // Verde
      '#FFC107', // Ámbar
      '#FF5722', // Naranja profundo
      '#9C27B0', // Púrpura
      '#3F51B5', // Índigo
      '#009688', // Teal
      '#FF6F00', // Naranja
    ];
    
    const index = Math.abs(hash) % vibrantes.length;
    return vibrantes[index];
  };

  const getEstadoDotColor = (estado) => {
    const value = normalizarEstadoValue(estado);
    
    // Si está en el mapa fijo, usar ese color
    if (ESTADO_COLOR_MAP[value]) {
      return ESTADO_COLOR_MAP[value];
    }
    
    // Buscar el estado en los disponibles para obtener su color guardado
    const estadoItem = estadosDisponibles.find(item => item.value === value);
    if (estadoItem?.color) {
      return estadoItem.color;
    }
    
    // Si no, generar color aleatorio basado en el nombre (pero consistente)
    return generateColorFromHash(value);
  };

  const estadosGrafica = estadosDisponibles.filter(
    (estado) => !(estadoRules.ocultar_grafica || []).includes(estado.value)
  );

  const getCargaEstados = () => {
    const conteos = estadosGrafica.map((estado) => {
      const cantidad = trabajos.filter((t) => normalizarEstadoValue(t.estado) === estado.value).length;
      return {
        ...estado,
        cantidad,
        color: getEstadoDotColor(estado.value),
      };
    });
    const max = conteos.reduce((acc, item) => Math.max(acc, item.cantidad), 0);
    return { conteos, max };
  };

  const extraerNumeroTintas = (pedido) => {
    try {
      const raw = pedido?.datos_presupuesto_json;
      if (!raw) return 0;
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      const tintas = parsed?.selectedTintas;
      if (Array.isArray(tintas)) return tintas.length;
      if (typeof tintas === 'number') return tintas;
      return 0;
    } catch {
      return 0;
    }
  };

  const handleCambiarEstado = async (trabajoObj, nuevoEstado) => {
    try {
      const trabajoId = trabajoObj && (trabajoObj.pedido_id || trabajoObj.id || trabajoObj._id || trabajoObj.trabajo_id);

      const looksLikeObjectId = (s) => typeof s === 'string' && /^[0-9a-fA-F]{24}$/.test(s);

      const headers = {
        'Content-Type': 'application/json'
      };

      // Add X-Role header to ensure backend validates correctly
      const selectedRole = typeof window !== 'undefined' && window.localStorage
        ? window.localStorage.getItem('PFP_SELECTED_ROLE')
        : null;
      if (selectedRole) {
        headers['X-Role'] = selectedRole;
      }

      let res;
      if (trabajoObj && (trabajoObj.pedido_id || trabajoObj.id || trabajoObj._id)) {
        const pid = trabajoObj.pedido_id || trabajoObj.id || trabajoObj._id;
        res = await fetch(`http://localhost:8080/api/pedidos/${pid}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ estado: nuevoEstado })
        });
      } else if (looksLikeObjectId(trabajoId)) {
        // fallback: update trabajo state
        res = await fetch(`http://localhost:8080/api/trabajos/${trabajoId}/estado`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ estado: nuevoEstado })
        });
      } else {
        throw new Error('ID de trabajo/pedido inválido');
      }

      if (res && res.ok) {
        cargarPedidos();
      } else if (res && res.status === 403) {
        console.error('Permiso denegado al cambiar estado');
        showToast(t('screens.trabajos.sinPermisoCambiarEstado'), 'error');
      } else {
        const text = res ? await res.text().catch(()=>null) : null;
        console.error('Error cambiando estado:', res ? res.statusText : 'no response', text);
        showToast(t('screens.trabajos.errorCambiarEstado'), 'error');
      }
    } catch (e) {
      console.error('Error cambiando estado:', e);
      showToast('Error al cambiar estado', 'error');
    }
  };

  // Función para cargar pedidos
  const cargarPedidos = () => {
    fetch('http://localhost:8080/api/pedidos', { cache: 'no-store' })
      .then((res) => res.json())
          .then((data) => {
        if (data && data.pedidos) {
          // Normalizar estados a slugificado para consistencia
          const pedidosNormalizados = (Array.isArray(data.pedidos) ? data.pedidos : []).map(p => ({
            ...p,
            estado: normalizarEstadoValue(p.estado || '')
          }));
          setTrabajos(pedidosNormalizados);
        } else {
          setTrabajos([]);
        }
      })
      .catch(() => setTrabajos([]));
  };

  // Cargar pedidos al montar el componente
  useEffect(() => {
    cargarPedidos();
  }, []);

  // Recargar pedidos cuando se crea uno nuevo desde Presupuestos
  useEffect(() => {
    if (actualizacionPedidos > 0) {
      cargarPedidos();
    }
  }, [actualizacionPedidos]);

  useEffect(() => {
    const filtered = trabajos.filter(
      (t) => {
        const query = (busqueda || '').trim().toLowerCase();
        const coincideBusqueda = !query || [
          t.id,
          t.nombre,
          t.cliente,
          t.referencia,
          t.numero_pedido,
          t.estado,
          t.fecha_pedido,
          t.fecha_entrega,
          t.fecha_finalizacion,
          t.dias_retraso,
        ]
          .map((v) => String(v || '').toLowerCase())
          .join(' ')
          .includes(query);
        const coincideEstado = estadosFiltro.length === 0 || estadosFiltro.includes(normalizarEstadoValue(t.estado || ''));
        return coincideBusqueda && coincideEstado;
      }
    );
    setFiltrados(filtered);
  }, [busqueda, trabajos, estadosFiltro]);

  useEffect(() => {
    setPaginaPedidos(1);
  }, [busqueda, trabajos, estadosFiltro]);

  const totalPaginasPedidos = Math.max(1, Math.ceil(filtrados.length / ITEMS_PER_PAGE));
  const pedidosPaginados = filtrados.slice((paginaPedidos - 1) * ITEMS_PER_PAGE, paginaPedidos * ITEMS_PER_PAGE);

  

  useEffect(() => {
    if (paginaPedidos > totalPaginasPedidos) {
      setPaginaPedidos(totalPaginasPedidos);
    }
  }, [paginaPedidos, totalPaginasPedidos]);

  const toggleEstadoFiltro = (estado) => {
    setEstadosFiltro((prev) =>
      prev.includes(estado) ? prev.filter((s) => s !== estado) : [...prev, estado]
    );
  };

  const handleNuevoPedido = async (pedidoNuevo) => {
    cargarPedidos();
    const materialNombre = pedidoNuevo.material || '';
    if (!materialNombre) return;
    const authHdrs = {
      'Content-Type': 'application/json',
      'X-Empresa-Id': currentUser?.empresa_id || '1',
      'X-User-Id': currentUser?.id || 'admin',
      'X-Role': currentUser?.role || 'administrador',
    };
    try {
      const stockRes = await fetch(
        `http://localhost:8080/api/materiales/stock?material_nombre=${encodeURIComponent(materialNombre)}&activo=true`,
        { headers: authHdrs }
      );
      const stockData = await stockRes.json();
      const tirada = parseFloat(pedidoNuevo.tirada || 0);
      const fl = parseFloat(pedidoNuevo.formatoLargo || 0);
      const fa = parseFloat(pedidoNuevo.formatoAncho || 0);
      const metrosEst = tirada > 0 && fl > 0 ? tirada * fl / 1000 : 0;
      const entries = (stockData.stock || []).filter(e =>
        e.es_retal &&
        e.metros_disponibles > 0 &&
        (fa <= 0 || e.ancho_cm >= fa / 10) &&
        (metrosEst <= 0 || e.metros_disponibles >= metrosEst)
      );
      if (entries.length > 0) {
        setStockModal({
          visible: true,
          pedido: { _id: pedidoNuevo.pedido_id, numero_pedido: pedidoNuevo.numero_pedido },
          authHdrs,
          stockEntries: entries,
          selectedStockId: entries[0].id,
          metros: metrosEst > 0 ? metrosEst.toFixed(2) : '',
          formatoAncho: fa,
        });
      }
    } catch (e) {
      console.warn('Error comprobando stock de material:', e);
    }
  };

  const handleConfirmarConsumo = async () => {
    const { pedido, authHdrs, selectedStockId, metros } = stockModal;
    const metrosNum = parseFloat(metros);
    if (!selectedStockId || isNaN(metrosNum) || metrosNum <= 0) {
      showToast(t('screens.trabajos.seleccionarMaterial'), 'warning');
      return;
    }
    try {
      const res = await fetch('http://localhost:8080/api/materiales/consumos', {
        method: 'POST',
        headers: authHdrs,
        body: JSON.stringify({
          stock_id: selectedStockId,
          pedido_id: pedido._id,
          numero_pedido: String(pedido.numero_pedido || ''),
          metros_consumidos: metrosNum,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        showToast(data.error || 'Error al registrar consumo de stock', 'error');
        return;
      }
    } catch (e) {
      console.warn('Error registrando consumo de stock:', e);
    }
    setStockModal({ visible: false, pedido: null, authHdrs: null, stockEntries: [], selectedStockId: '', metros: '' });
  };

  const handleAbrirDetalle = (trabajo) => {
    const pid = trabajo && (trabajo.pedido_id || trabajo.id || trabajo._id || trabajo.trabajo_id);
    if (pid) {
      setPedidoSeleccionado(pid);
      setModalDetalleVisible(true);
    } else {
      // fallback: try to open detail without id (component will attempt fetch)
      setPedidoSeleccionado(null);
      setModalDetalleVisible(true);
    }
  };

  // Devuelve el label del estado resultante de avanzar (+1) o retroceder (-1)
  const resolveStateLabel = (estadoActualSlug, direction) => {
    const idx = estadosDisponibles.findIndex((e) => e.value === estadoActualSlug);
    const currentIdx = idx === -1 ? 0 : idx;
    const newIdx = Math.max(0, Math.min(estadosDisponibles.length - 1, currentIdx + direction));
    return estadosDisponibles[newIdx]?.label || null;
  };

  const handleNavigateEstado = (trabajo, direction) => {
    const estadoActual = normalizarEstadoValue(trabajo?.estado || '');
    const newLabel = resolveStateLabel(estadoActual, direction);
    if (!newLabel) return;
    // Si el módulo de producción está activo y el estado destino es el trigger → abrir selector de máquina
    if (
      direction === 1 &&
      modulos.produccion === true &&
      modulos.produccion_trigger_estado &&
      slugifyEstado(newLabel) === slugifyEstado(modulos.produccion_trigger_estado)
    ) {
      setTrabajoParaProduccion(trabajo);
      setModalMaquinasVisible(true);
      return;
    }
    handleCambiarEstado(trabajo, newLabel);
  };

  const handleEnviarAProduccion = async (maquinaId, maquinaNombre, force = false) => {
    if (!trabajoParaProduccion) return;
    try {
      const trabajoIdToSend = (
        (trabajoParaProduccion && trabajoParaProduccion.trabajo && (trabajoParaProduccion.trabajo.id || trabajoParaProduccion.trabajo._id || trabajoParaProduccion.trabajo.trabajo_id))
        || trabajoParaProduccion.trabajo_id
        || trabajoParaProduccion.id
        || trabajoParaProduccion._id
      );

      const token = global.__MIAPP_ACCESS_TOKEN;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('http://localhost:8080/api/produccion/enviar', {
        method: 'POST',
        headers,
        body: JSON.stringify({ trabajo_id: trabajoIdToSend, maquina_id: maquinaId, force }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.needs_confirm && data.advertencias?.length > 0) {
        const msgs = data.advertencias.map((a) => {
          if (a.tipo === 'colores') return `• Tintas: el trabajo necesita ${a.requerido} colores, la máquina tiene ${a.maximo}`;
          if (a.tipo === 'ancho') return `• Ancho de material: necesita ${a.requerido} mm, máquina admite ${a.maximo} mm`;
          return `• ${a.tipo}`;
        }).join('\n');
        const confirmar = window.confirm(`Incompatibilidad detectada:\n\n${msgs}\n\n¿Desea asignar igualmente?`);
        if (confirmar) handleEnviarAProduccion(maquinaId, maquinaNombre, true);
        return;
      }
      if (res.ok) {
        setModalMaquinasVisible(false);
        setTrabajoParaProduccion(null);
        cargarPedidos();
      } else {
        showToast(data.error || 'No se pudo enviar a producción', 'error');
      }
    } catch (e) {
      showToast(`Error: ${e.message}`, 'error');
    }
  };

  const handleHoverNuevoIn = () => {
    if (hoverNuevoTimerRef.current) clearTimeout(hoverNuevoTimerRef.current);
    hoverNuevoTimerRef.current = setTimeout(() => setHoverNuevo(true), 2000);
  };

  const handleHoverNuevoOut = () => {
    if (hoverNuevoTimerRef.current) clearTimeout(hoverNuevoTimerRef.current);
    hoverNuevoTimerRef.current = null;
    setHoverNuevo(false);
  };

  useEffect(() => {
    return () => {
      if (hoverNuevoTimerRef.current) clearTimeout(hoverNuevoTimerRef.current);
    };
  }, []);

  // Verificar permiso dinámicamente desde el backend
  const puedeCrear = usePermission('edit_pedidos');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={{ width: 38 }} />
          <Text style={styles.headerTitle}>{t('nav.pedidos')}</Text>
          {modoCreacion !== 'automatico' ? (
            <Pressable
              style={[styles.btnPlus, !puedeCrear && { opacity: 0.45 }]}
              onPress={() => puedeCrear && setModalVisible(true)}
              disabled={!puedeCrear}
            >
              <Text style={styles.btnPlusText}>{t('screens.trabajos.newBtn')}</Text>
            </Pressable>
          ) : (
            <View style={{ width: 38 }} />
          )}
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder={t('common.searchAny')}
          value={busqueda}
          onChangeText={setBusqueda}
          placeholderTextColor="#94A3B8"
        />
      </View>

      <View style={styles.chartsContainer}>
        <Text style={styles.chartsTitle}>{t('screens.trabajos.distribucion')}</Text>
        {(() => {
          const { conteos } = getCargaEstados();
          const total = conteos.reduce((sum, item) => sum + item.cantidad, 0);
          const activos = conteos.filter((item) => item.cantidad > 0);

          if (trabajos.length === 0) {
            return <EmptyState variant="inline" title={t('screens.trabajos.sinPedidosActivos')} message={t('screens.trabajos.sinPedidosMsg')} />;
          }
          if (total === 0) {
            return null;
          }

          return (
            <>
              <View style={styles.chartStackRow}>
                {activos.map((item) => {
                  const widthPct = (item.cantidad / total) * 100;
                  const activoSeleccionado = estadosFiltro.includes(item.value);
                  const hayFiltroActivo = estadosFiltro.length > 0;
                  return (
                    <TouchableOpacity
                      key={item.value}
                      title={`${item.label}: ${item.cantidad}`}
                      onPress={() => toggleEstadoFiltro(item.value)}
                      style={[
                        styles.chartSegmentTouchable,
                        { width: `${widthPct}%` },
                        hayFiltroActivo && !activoSeleccionado ? { opacity: 0.35 } : null,
                        activoSeleccionado && styles.chartSegmentActiveShadow,
                      ]}
                    >
                      <View style={[styles.chartFill, { width: '100%', backgroundColor: item.color }]} />
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.chartLegendWrap}>
                {activos.map((item) => (
                  <TouchableOpacity
                    key={`legend-${item.value}`}
                    style={[styles.chartLegendItem, estadosFiltro.includes(item.value) && styles.chartLegendItemActive]}
                    onPress={() => toggleEstadoFiltro(item.value)}
                  >
                    <View style={[styles.chartLegendDot, { backgroundColor: item.color }]} />
                    <Text style={styles.chartLegendText}>{`${item.label}: ${item.cantidad}`}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {estadosFiltro.length > 0 && (
                <View style={styles.filterRow}>
                  <Text style={styles.filterText}>
                    {t('screens.trabajos.filtroActivo', { estados: estadosFiltro.map((estado) => getStatusLabel(estado)).join(', ') })}
                  </Text>
                  <TouchableOpacity style={styles.filterClearBtn} onPress={() => setEstadosFiltro([])}>
                    <Text style={styles.filterClearText}>{t('screens.trabajos.quitarFiltro')}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          );
        })()}
      </View>

      {filtrados.length === 0 ? (
        <View style={styles.tableContainer}>
          <EmptyState
            title={busqueda ? t('common.noResults') : t('screens.trabajos.noPedidos')}
            message={busqueda ? t('common.noResultsMsg') : t('screens.trabajos.noPedidosMsg')}
            action={!busqueda && puedeCrear ? t('screens.trabajos.newBtn') : undefined}
            onAction={!busqueda && puedeCrear ? () => setModalVisible(true) : undefined}
          />
        </View>
      ) : (
        <ScrollView style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <View style={[styles.tableCell, styles.colNumeroPedido]}>
              <Text style={styles.headerText}>{t('screens.trabajos.colNumeroPedido')}</Text>
            </View>
            <View style={[styles.tableCell, styles.colNombre]}>
              <Text style={styles.headerText}>{t('screens.trabajos.colNombre')}</Text>
            </View>
            <View style={[styles.tableCell, styles.colCliente]}>
              <Text style={styles.headerText}>{t('screens.trabajos.colCliente')}</Text>
            </View>
            <View style={[styles.tableCell, styles.colReferencia]}>
              <Text style={styles.headerText}>{t('screens.trabajos.colReferencia')}</Text>
            </View>
            <View style={[styles.tableCell, styles.colFase]}>
              <Text style={styles.headerText}>{t('screens.trabajos.colFase')}</Text>
            </View>
            <View style={[styles.tableCell, styles.colEstado]}>
              <Text style={styles.headerText}>{t('screens.trabajos.colEstado')}</Text>
            </View>
            <View style={[styles.tableCell, styles.colAcciones]}>
              <Text style={styles.headerText}>{t('screens.trabajos.colAcciones')}</Text>
            </View>
          </View>
          {pedidosPaginados.map((trabajo, idx) => {
            const estadoTrabajoActual = normalizarEstadoValue(trabajo.estado || '');
            const esFinalizado = (estadoRules?.estados_finalizados?.length ? estadoRules.estados_finalizados : ['finalizado']).includes(estadoTrabajoActual);
            const currentIdx = estadosDisponibles.findIndex((e) => e.value === estadoTrabajoActual);
            const resolvedIdx = currentIdx === -1 ? 0 : currentIdx;
            const isAtFirst = resolvedIdx === 0;
            const isAtLast = resolvedIdx === estadosDisponibles.length - 1;
            const showNavBtns = canChangeEstado || (puedeEditarFinalizado && esFinalizado);

            return (
              <View key={trabajo.id || trabajo.trabajo_id || `pedido-${idx}-${trabajo.numero_pedido || ''}`} style={[styles.tableRow, (idx + (paginaPedidos - 1) * ITEMS_PER_PAGE) % 2 === 1 && styles.rowAlternate]}>
                <View style={[styles.tableCell, styles.colNumeroPedido]}>
                  {trabajo.numero_pedido ? (
                    <TouchableOpacity onPress={() => handleAbrirDetalle(trabajo)}>
                      <Text style={[styles.cellText, { color: '#4B5563', fontWeight: '700' }]} numberOfLines={1}>
                        {trabajo.numero_pedido}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={[styles.cellText, { color: '#999' }]}>-</Text>
                  )}
                </View>
                <View style={[styles.tableCell, styles.colNombre]}>
                  <Text style={styles.cellText} numberOfLines={1}>{trabajo.nombre}</Text>
                </View>
                <View style={[styles.tableCell, styles.colCliente]}>
                  <Text style={styles.cellText} numberOfLines={1}>{typeof trabajo.cliente === 'string' ? trabajo.cliente : (trabajo.cliente && (trabajo.cliente.nombre || '-'))}</Text>
                </View>
                <View style={[styles.tableCell, styles.colReferencia]}>
                  <Text style={styles.cellText} numberOfLines={1}>{trabajo.referencia}</Text>
                </View>
                <View style={[styles.tableCell, styles.colFase]}>
                  <View style={styles.estadosDotsRow}>
                    {estadosTimeline.map((estadoItem) => {
                      const estadoTrabajo = normalizarEstadoValue(trabajo.estado || '');
                      const estadoBloqueado = (estadoRules.ocultar_timeline || []).includes(estadoTrabajo);
                      const activo = !estadoBloqueado && estadoItem.value === estadoTrabajo;
                      return (
                        <View
                          key={`${trabajo.id}-${estadoItem.value}`}
                          title={estadoItem.label}
                          style={[
                            styles.estadoDot,
                            { backgroundColor: estadoBloqueado ? '#BDBDBD' : getEstadoDotColor(estadoItem.value) },
                            activo && styles.estadoDotActivo,
                          ]}
                        />
                      );
                    })}
                  </View>
                </View>
                <View style={[styles.tableCell, styles.colEstado]}>
                  {(() => {
                    const [badgeStyle, badgeTextStyle] = getStatusColor(trabajo.estado);
                    return (
                      <View style={badgeStyle}>
                        <Text style={badgeTextStyle} numberOfLines={1}>{getStatusLabel(trabajo.estado)}</Text>
                      </View>
                    );
                  })()}
                </View>
                <View style={[styles.tableCell, styles.colAcciones]}>
                  {showNavBtns && (
                    <>
                      <TouchableOpacity
                        style={[styles.navBtn, isAtFirst && styles.navBtnDisabled]}
                        disabled={isAtFirst}
                        onPress={() => handleNavigateEstado(trabajo, -1)}
                      >
                        <Text style={styles.navBtnText}>‹</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.navBtn, isAtLast && styles.navBtnDisabled]}
                        disabled={isAtLast}
                        onPress={() => handleNavigateEstado(trabajo, 1)}
                      >
                        <Text style={styles.navBtnText}>›</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            );
          })}
          {totalPaginasPedidos > 1 && (
            <View style={styles.paginationRow}>
              <TouchableOpacity
                style={[styles.paginationBtn, paginaPedidos === 1 && styles.paginationBtnDisabled]}
                onPress={() => setPaginaPedidos((prev) => Math.max(1, prev - 1))}
                disabled={paginaPedidos === 1}
              >
                <Text style={styles.paginationBtnText}>{t('common.prev')}</Text>
              </TouchableOpacity>
              <Text style={styles.paginationInfo}>{t('common.pageOf', { current: paginaPedidos, total: totalPaginasPedidos })}</Text>
              <TouchableOpacity
                style={[styles.paginationBtn, paginaPedidos === totalPaginasPedidos && styles.paginationBtnDisabled]}
                onPress={() => setPaginaPedidos((prev) => Math.min(totalPaginasPedidos, prev + 1))}
                disabled={paginaPedidos === totalPaginasPedidos}
              >
                <Text style={styles.paginationBtnText}>{t('common.next')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {/* Modal deducción de stock al crear pedido manual */}
      <Modal visible={stockModal.visible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 10, width: '90%', maxWidth: 520, maxHeight: '80%', overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>{t('screens.trabajos.deducirStock')}</Text>
              <TouchableOpacity onPress={() => setStockModal({ visible: false, pedido: null, authHdrs: null, stockEntries: [], selectedStockId: '', metros: '' })}>
                <Text style={{ fontSize: 14, color: '#6B7280', fontWeight: '600' }}>{t('screens.trabajos.omitir')}</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ padding: 16 }}>
              {stockModal.stockEntries.length > 0 && (
                <Text style={{ marginBottom: 12, color: '#555', fontSize: 13 }}>
                  {'Retales de '}
                  <Text style={{ fontWeight: '600' }}>{stockModal.stockEntries[0]?.material_nombre || ''}</Text>
                  {stockModal.formatoAncho > 0 ? `  ·  Ancho mínimo: ${(stockModal.formatoAncho / 10).toFixed(1)} cm` : ''}
                  {stockModal.metros ? `  ·  Metros necesarios: ${stockModal.metros} m` : ''}
                </Text>
              )}
              <Text style={{ fontWeight: '600', marginBottom: 8, color: '#344054' }}>{t('screens.trabajos.seleccionaMaterial')}</Text>
              {stockModal.stockEntries.map((entry) => (
                <TouchableOpacity
                  key={entry.id}
                  onPress={() => setStockModal((prev) => ({ ...prev, selectedStockId: entry.id }))}
                  style={{
                    flexDirection: 'row', alignItems: 'center', padding: 10, marginBottom: 6,
                    borderRadius: 6, borderWidth: 1,
                    borderColor: stockModal.selectedStockId === entry.id ? '#1565C0' : '#D1D5DB',
                    backgroundColor: stockModal.selectedStockId === entry.id ? '#EFF6FF' : '#fff',
                  }}
                >
                  <View style={{
                    width: 14, height: 14, borderRadius: 7, borderWidth: 2,
                    borderColor: stockModal.selectedStockId === entry.id ? '#1565C0' : '#9CA3AF',
                    backgroundColor: stockModal.selectedStockId === entry.id ? '#1565C0' : 'transparent',
                    marginRight: 10,
                  }} />
                  <Text style={{ flex: 1, fontSize: 13, color: '#374151' }}>
                    {entry.fabricante} · {entry.ancho_cm} cm{entry.gramaje ? ` · ${entry.gramaje} g/m²` : ''} · Disponibles: {entry.metros_disponibles} m
                    {entry.numero_lote ? ` · Lote: ${entry.numero_lote}` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
              <Text style={{ fontWeight: '600', marginTop: 12, marginBottom: 6, color: '#344054' }}>{t('screens.trabajos.metrosConsumir')}</Text>
              <TextInput
                value={stockModal.metros}
                onChangeText={(t) => setStockModal((prev) => ({ ...prev, metros: t }))}
                keyboardType="numeric"
                placeholder="Ej: 400"
                style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 6, padding: 8, fontSize: 14, marginBottom: 20, backgroundColor: '#fff' }}
              />
              <TouchableOpacity
                onPress={handleConfirmarConsumo}
                style={{ backgroundColor: '#1565C0', borderRadius: 6, paddingVertical: 10, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>{t('screens.trabajos.registrarContinuar')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <PedidoDetalleModal
        visible={modalDetalleVisible}
        onClose={() => { setModalDetalleVisible(false); }}
        pedidoId={pedidoSeleccionado}
        onDeleted={() => { setModalDetalleVisible(false); cargarPedidos(); }}
        currentUser={currentUser}
        refreshKey={detalleRefreshKey}
        onEdit={() => { cargarPedidos(); }}
      />

      <NuevoPedidoModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setEditingInitialValues(null); }}
        onSave={(p) => { setModalVisible(false); setEditingInitialValues(null); setDetalleRefreshKey(k => k + 1); handleNuevoPedido(p); }}
        initialValues={editingInitialValues}
        currentUser={currentUser}
        puedeCrear={puedeCrear}
      />

      <Modal
        visible={modalMaquinasVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalMaquinasVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>{t('screens.trabajos.enviarProduccion')}</Text>
              <TouchableOpacity onPress={() => { setModalMaquinasVisible(false); setTrabajoParaProduccion(null); }}>
                <Text style={styles.modalCloseX}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 260 }}>
              {maquinas.map((maq) => (
                (() => {
                  const tintasTrabajo = Number(trabajoParaProduccion?.numero_tintas || 0);
                  const coloresMaquina = Number(maq.numero_colores || 0);
                  const capacidadInsuficiente = tintasTrabajo > 0 && coloresMaquina > 0 && coloresMaquina < tintasTrabajo;
                  return (
                    <TouchableOpacity
                      key={maq.id}
                      style={[styles.maquinaItem, capacidadInsuficiente && styles.maquinaItemAtenuada]}
                      onPress={() => {
                        if (!capacidadInsuficiente) {
                          handleEnviarAProduccion(maq.id, maq.nombre);
                        }
                      }}
                      disabled={capacidadInsuficiente}
                    >
                      <Text style={styles.maquinaItemText}>{maq.nombre}</Text>
                      <Text style={styles.maquinaItemSubText}>
                        {`Colores máquina: ${coloresMaquina || '-'}${tintasTrabajo > 0 ? ` • Tintas trabajo: ${tintasTrabajo}` : ''}`}
                      </Text>
                    </TouchableOpacity>
                  );
                })()
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      <Toast message={toast.message} type={toast.type} onHide={hideToast} />
    </View>
  );
}

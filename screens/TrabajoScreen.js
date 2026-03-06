import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Modal, Pressable } from 'react-native';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import NuevoPedidoModal from './NuevoPedidoModal';
import PedidoDetalleModal from './PedidoDetalleModal';
import { PedidosContext } from '../PedidosContext';
import { usePermission } from './usePermission';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  header: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    minHeight: 96,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: 38,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    textAlign: 'left',
    marginLeft: 10,
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
    color: '#3AB274',
  },
  chartTrack: {
    height: 10,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  chartStackRow: {
    flexDirection: 'row',
    height: 16,
    borderRadius: 7,
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
    backgroundColor: '#F1F5F9',
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
    backgroundColor: '#F1F5F9',
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
    backgroundColor: '#475569',
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPlusDisabled: {
    backgroundColor: '#94A3B8',
  },
  btnPlusText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 28,
    lineHeight: 28,
    marginTop: -2,
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
    color: '#F8FAFC',
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
    backgroundColor: '#F8FAFC',
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
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 6,
  },
  rowAlternate: {
    backgroundColor: '#F8FAFC',
  },
  tableCell: {
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
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
    flex: 0.3,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  actionBtnReport: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
  },
  actionBtnTraping: {
    backgroundColor: '#F5A623',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
  },
  actionBtnRepet: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
  },
  actionBtnTroquel: {
    backgroundColor: '#0EA5A4',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
  },
  actionBtnProduccion: {
    backgroundColor: '#8E44AD',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
  },
  actionBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  actionBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFF',
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
    backgroundColor: '#F8FAFC',
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
    fontWeight: '700',
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
    marginBottom: 12,
  },
  maquinaItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
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
    backgroundColor: '#F1F5F9',
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
  const [filtrados, setFiltrados] = useState([]);
  const [paginaPedidos, setPaginaPedidos] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingInitialValues, setEditingInitialValues] = useState(null);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [modalDetalleVisible, setModalDetalleVisible] = useState(false);
  const [detalleRefreshKey, setDetalleRefreshKey] = useState(0);
  const [maquinas, setMaquinas] = useState([]);
  const [modalMaquinasVisible, setModalMaquinasVisible] = useState(false);
  const [trabajoParaProduccion, setTrabajoParaProduccion] = useState(null);
  const [estadosFiltro, setEstadosFiltro] = useState([]);
  const [estadosDisponibles, setEstadosDisponibles] = useState(ESTADOS_DEFAULT);
  const [estadoRules, setEstadoRules] = useState({
    bloqueados_produccion: ['cancelado', 'parado', 'finalizado'],
    en_cola_produccion: ['pendiente-de-impresion', 'pendiente-post-impresion'],
    preimpresion: ['en-diseno'],
    estados_finalizados: ['finalizado'],
    ocultar_timeline: ['parado', 'cancelado'],
    ocultar_grafica: ['parado', 'cancelado', 'finalizado'],
  });
  const [modoCreacion, setModoCreacion] = useState('manual');
  const [hoverNuevo, setHoverNuevo] = useState(false);
  const [canChangeEstado, setCanChangeEstado] = useState(true);
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

  const cargarEstadosDisponibles = () => {
    fetch('http://localhost:8080/api/settings?categoria=estados_pedido')
      .then((res) => res.json())
      .then((data) => {
        const items = Array.isArray(data?.items) ? data.items : [];
        const parsed = items
          .map((item) => {
            const label = String(item?.valor || '').trim();
            const entry = { label, value: slugifyEstado(label) };
            if (item?.color) entry.color = item.color;
            return entry;
          })
          .filter((item) => item.label && item.value);

        const unique = parsed.filter((item, index, self) => index === self.findIndex((x) => x.value === item.value));
        setEstadosDisponibles(unique.length > 0 ? unique : ESTADOS_DEFAULT);
      })
      .catch(() => setEstadosDisponibles(ESTADOS_DEFAULT));
  };

  const cargarEstadoRules = () => {
    fetch('http://localhost:8080/api/settings/estados-pedido-rules')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.rules) {
          // Normalize every rule value to slug to guard against labels from older data
          const normalized = {};
          Object.entries(data.rules).forEach(([key, arr]) => {
            normalized[key] = Array.isArray(arr)
              ? [...new Set(arr.map((v) => slugifyEstado(String(v || ''))))]
              : [];
          });
          setEstadoRules((prev) => ({ ...prev, ...normalized }));
        }
      })
      .catch(() => {});
  };

  const cargarModoCreacion = () => {
    fetch('http://localhost:8080/api/settings/modo-creacion')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.modo) {
          setModoCreacion(data.modo);
        }
      })
      .catch(() => setModoCreacion('manual'));
  };

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
        alert('No tienes permiso para cambiar estados');
      } else {
        const text = res ? await res.text().catch(()=>null) : null;
        console.error('Error cambiando estado:', res ? res.statusText : 'no response', text);
        alert('Error al cambiar estado');
      }
    } catch (e) {
      console.error('Error cambiando estado:', e);
      alert('Error al cambiar estado');
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

  // Verificar si el rol actual puede cambiar estados
  const checkCanChangeEstado = () => {
    const rolActual = typeof window !== 'undefined' && window.localStorage
      ? window.localStorage.getItem('PFP_SELECTED_ROLE')
      : null;
    
    // Si no hay rol seleccionado, permitir por defecto
    if (!rolActual) {
      setCanChangeEstado(true);
      return;
    }
    
    // Preguntar al backend si el rol tiene permiso
    fetch('http://localhost:8080/api/auth/verify-role-permission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: rolActual,
        permission: 'manage_estados_pedido'
      })
    })
      .then((res) => res.json())
      .then((data) => {
        setCanChangeEstado(data && data.allowed === true);
      })
      .catch(() => setCanChangeEstado(false));
  };

  // Cargar pedidos al montar el componente
  useEffect(() => {
    cargarPedidos();
    cargarModoCreacion();
    cargarEstadosDisponibles();
    cargarEstadoRules();
    checkCanChangeEstado();
    fetch('http://localhost:8080/api/maquinas')
      .then((res) => res.json())
      .then((data) => setMaquinas(data.maquinas || []))
      .catch(() => setMaquinas([]));
  }, []);

  // Revalidar permisos al cambiar el rol activo sin refrescar la página
  useEffect(() => {
    const handler = () => checkCanChangeEstado();
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('pfp-role-changed', handler);
    }
    return () => {
      if (typeof window !== 'undefined' && window.removeEventListener) {
        window.removeEventListener('pfp-role-changed', handler);
      }
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      cargarModoCreacion();
      cargarEstadosDisponibles();
      cargarEstadoRules();
      checkCanChangeEstado();
    }, [])
  );

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
      alert('Selecciona un material e indica los metros a consumir.');
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
        alert(data.error || 'Error al registrar consumo de stock');
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

  const puedeEnviarAProduccion = (trabajo) => {
    const estado = normalizarEstadoValue(trabajo?.estado || '');
    const bloqueados = estadoRules.bloqueados_produccion || [];
    const enCola = estadoRules.en_cola_produccion || [];
    return !estaEnColaVisual(trabajo) && ![
      ...bloqueados,
      ...enCola,
    ].includes(estado);
  };

  const estaEnColaVisual = (trabajo) => {
    const estado = normalizarEstadoValue(trabajo?.estado || '');
    return !!trabajo?.en_produccion || (estadoRules.en_cola_produccion || []).includes(estado);
  };

  const handleAbrirSelectorProduccion = (trabajo) => {
    if (!puedeEnviarAProduccion(trabajo)) {
      alert('Este pedido no se puede enviar a producción');
      return;
    }
    setTrabajoParaProduccion(trabajo);
    setModalMaquinasVisible(true);
  };

  const handleEnviarAProduccion = async (maquinaId, maquinaNombre) => {
    if (!trabajoParaProduccion) return;
    try {
      // Determinar el id real del trabajo: preferir el trabajo anidado en el pedido
      const trabajoIdToSend = (
        (trabajoParaProduccion && trabajoParaProduccion.trabajo && (trabajoParaProduccion.trabajo.id || trabajoParaProduccion.trabajo._id || trabajoParaProduccion.trabajo.trabajo_id))
        || trabajoParaProduccion.trabajo_id
        || trabajoParaProduccion.id
        || trabajoParaProduccion._id
      );

      const res = await fetch('http://localhost:8080/api/produccion/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trabajo_id: trabajoIdToSend,
          maquina_id: maquinaId,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setModalMaquinasVisible(false);
        setTrabajoParaProduccion(null);
        cargarPedidos();
      } else {
        alert(data.error || 'No se pudo enviar a producción');
      }
    } catch (e) {
      alert(`Error: ${e.message}`);
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
          {modoCreacion !== 'automatico' && (
            <View style={styles.btnPlusWrap}>
              <Pressable
                style={[styles.btnPlus, !puedeCrear && { opacity: 0.45 }]}
                onPress={() => puedeCrear && setModalVisible(true)}
                disabled={!puedeCrear}
                onHoverIn={handleHoverNuevoIn}
                onHoverOut={handleHoverNuevoOut}
              >
                <Text style={styles.btnPlusText}>+</Text>
              </Pressable>
              {hoverNuevo && (
                <View style={styles.hoverHint}>
                  <Text style={styles.hoverHintText}>{!puedeCrear ? 'Permiso denegado' : 'Nuevo pedido'}</Text>
                </View>
              )}
            </View>
          )}
          <Text style={styles.headerTitle}>Pedidos</Text>
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por cualquier campo..."
          value={busqueda}
          onChangeText={setBusqueda}
          placeholderTextColor="#94A3B8"
        />
      </View>

      <View style={styles.chartsContainer}>
        <Text style={styles.chartsTitle}>Distribución por estado (activos)</Text>
        {(() => {
          const { conteos } = getCargaEstados();
          const total = conteos.reduce((sum, item) => sum + item.cantidad, 0);
          const activos = conteos.filter((item) => item.cantidad > 0);

          if (total === 0) {
            return <Text style={styles.chartEmpty}>No hay pedidos activos para mostrar.</Text>;
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
                    Filtro activo: {estadosFiltro.map((estado) => getStatusLabel(estado)).join(', ')}
                  </Text>
                  <TouchableOpacity style={styles.filterClearBtn} onPress={() => setEstadosFiltro([])}>
                    <Text style={styles.filterClearText}>Quitar filtro</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          );
        })()}
      </View>

      {filtrados.length === 0 ? (
        <View style={styles.tableContainer}>
          <Text style={styles.emptyText}>
            {busqueda ? 'No se encontraron resultados' : 'No hay pedidos'}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <View style={[styles.tableCell, styles.colNumeroPedido]}>
              <Text style={styles.headerText}>Nº Pedido</Text>
            </View>
            <View style={[styles.tableCell, styles.colNombre]}>
              <Text style={styles.headerText}>Nombre</Text>
            </View>
            <View style={[styles.tableCell, styles.colCliente]}>
              <Text style={styles.headerText}>Cliente</Text>
            </View>
            <View style={[styles.tableCell, styles.colReferencia]}>
              <Text style={styles.headerText}>Referencia</Text>
            </View>
            <View style={[styles.tableCell, styles.colFase]}>
              <Text style={styles.headerText}>Fase</Text>
            </View>
            <View style={[styles.tableCell, styles.colEstado]}>
              <Text style={styles.headerText}>Estado</Text>
            </View>
            <View style={[styles.tableCell, styles.colAcciones]}>
              <Text style={styles.headerText}>Acciones</Text>
            </View>
          </View>
          {pedidosPaginados.map((trabajo, idx) => {
            const estadoTrabajoActual = normalizarEstadoValue(trabajo.estado || '');
            const esFinalizado = estadoTrabajoActual === 'finalizado';
            const envioBloqueado = !puedeEnviarAProduccion(trabajo);
            let textoBoton;
            if (estadoTrabajoActual === 'parado' || estadoTrabajoActual === 'cancelado') {
              textoBoton = estadoTrabajoActual; // mostrar el nombre del estado tal cual (parado/cancelado)
            } else {
              textoBoton = esFinalizado ? 'Finalizado' : (estaEnColaVisual(trabajo) ? 'En cola' : 'Producc.');
            }

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
                  <select
                    disabled={!canChangeEstado}
                    style={{
                      paddingTop: 4, paddingBottom: 4, paddingLeft: 8, paddingRight: 8,
                      borderRadius: 10,
                      border: '1px solid #E2E8F0',
                      backgroundColor: '#F8FAFC',
                      fontSize: 13,
                      fontWeight: '600',
                      cursor: canChangeEstado ? 'pointer' : 'not-allowed',
                      width: '100%',
                      color: '#0F172A',
                      outlineWidth: 0,
                      opacity: canChangeEstado ? 1 : 0.65,
                      pointerEvents: canChangeEstado ? 'auto' : 'none',
                    }}
                    value={normalizarEstadoValue(trabajo.estado)}
                    onChange={(e) => handleCambiarEstado(trabajo, e.target.value)}
                  >
                    {estadosDisponibles.map((estado) => (
                      <option key={estado.value} value={estado.value}>
                        {estado.label}
                      </option>
                    ))}
                  </select>
                </View>
                <View style={[styles.tableCell, styles.colAcciones]}>
                  <TouchableOpacity 
                    style={styles.actionBtnReport}
                    title="Crear Report"
                  >
                    <Text style={styles.actionBtnText}>Report</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionBtnTraping}
                    title="Hacer Traping"
                  >
                    <Text style={styles.actionBtnText}>Traping</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionBtnRepet}
                    title="Hacer Repetidora"
                  >
                    <Text style={styles.actionBtnText}>Repet.</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtnTroquel}
                    title="Crear Troquel"
                    onPress={() => alert('Crear Troquel: función pendiente')}
                  >
                    <Text style={styles.actionBtnText}>Troquel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.actionBtnProduccion,
                      esFinalizado && { backgroundColor: ESTADO_FINALIZADO_COLOR },
                      envioBloqueado && !esFinalizado && styles.actionBtnDisabled
                    ]}
                    title="Enviar a Producción"
                    onPress={() => !envioBloqueado && handleAbrirSelectorProduccion(trabajo)}
                    disabled={envioBloqueado}
                  >
                    <Text style={styles.actionBtnText}>{textoBoton}</Text>
                  </TouchableOpacity>
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
                <Text style={styles.paginationBtnText}>Anterior</Text>
              </TouchableOpacity>
              <Text style={styles.paginationInfo}>Página {paginaPedidos} de {totalPaginasPedidos}</Text>
              <TouchableOpacity
                style={[styles.paginationBtn, paginaPedidos === totalPaginasPedidos && styles.paginationBtnDisabled]}
                onPress={() => setPaginaPedidos((prev) => Math.min(totalPaginasPedidos, prev + 1))}
                disabled={paginaPedidos === totalPaginasPedidos}
              >
                <Text style={styles.paginationBtnText}>Siguiente</Text>
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
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>Deducir stock de material</Text>
              <TouchableOpacity onPress={() => setStockModal({ visible: false, pedido: null, authHdrs: null, stockEntries: [], selectedStockId: '', metros: '' })}>
                <Text style={{ fontSize: 14, color: '#6B7280', fontWeight: '600' }}>Omitir</Text>
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
              <Text style={{ fontWeight: '600', marginBottom: 8, color: '#344054' }}>Selecciona el material:</Text>
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
              <Text style={{ fontWeight: '600', marginTop: 12, marginBottom: 6, color: '#344054' }}>Metros a consumir:</Text>
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
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Registrar y continuar</Text>
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
            <Text style={styles.modalTitle}>Selecciona máquina de producción</Text>
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
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => {
                  setModalMaquinasVisible(false);
                  setTrabajoParaProduccion(null);
                }}
              >
                <Text style={styles.modalCloseText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

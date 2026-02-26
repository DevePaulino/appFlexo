import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Modal, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import NuevoPedidoModal from './NuevoPedidoModal';
import PedidoDetalleModal from './PedidoDetalleModal';
import { PedidosContext } from '../PedidosContext';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E9EEF5',
  },
  header: {
    backgroundColor: '#344054',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    minHeight: 96,
    borderBottomWidth: 1,
    borderBottomColor: '#243447',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#98A2B3',
    paddingHorizontal: 11,
    paddingVertical: 5,
    fontSize: 12,
    color: '#232323',
    width: '62%',
    alignSelf: 'center',
  },
  chartsContainer: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginHorizontal: 10,
    marginTop: 10,
    marginBottom: 10,
    padding: 12,
  },
  chartsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#232323',
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
    color: '#232323',
  },
  chartCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3AB274',
  },
  chartTrack: {
    height: 10,
    borderRadius: 6,
    backgroundColor: '#ECEFF1',
    overflow: 'hidden',
  },
  chartStackRow: {
    flexDirection: 'row',
    height: 16,
    borderRadius: 7,
    overflow: 'visible',
    backgroundColor: '#ECEFF1',
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
    color: '#232323',
    fontWeight: '600',
  },
  chartLegendItemActive: {
    backgroundColor: '#EEF7F1',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  chartSegmentTouchable: {
    height: '100%',
  },
  chartSegmentActiveShadow: {
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    transform: [{ scaleY: 1.12 }],
    zIndex: 2,
  },
  chartEmpty: {
    fontSize: 12,
    color: '#777',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  filterText: {
    fontSize: 12,
    color: '#232323',
    fontWeight: '600',
  },
  filterClearBtn: {
    backgroundColor: '#A8A8AA',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  filterClearText: {
    color: '#FFF',
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
    backgroundColor: '#A8A8AA',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnNew: {
    backgroundColor: '#4B5563',
  },
  btnNewText: {
    color: '#F3F4F6',
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  btnPlusWrap: {
    position: 'relative',
  },
  btnPlus: {
    backgroundColor: '#4B5563',
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPlusDisabled: {
    backgroundColor: '#BDBDBD',
  },
  btnPlusText: {
    color: '#F3F4F6',
    fontWeight: '900',
    fontSize: 28,
    lineHeight: 28,
    marginTop: -2,
  },
  hoverHint: {
    position: 'absolute',
    left: 44,
    top: 8,
    backgroundColor: '#111827',
    borderRadius: 8,
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
    backgroundColor: '#344054',
    borderWidth: 1.5,
    borderColor: '#243447',
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
    borderBottomColor: '#E4E7EC',
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
    color: '#F8FAFC',
  },
  cellText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#232323',
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
    backgroundColor: '#BDBDBD',
  },
  actionBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFF',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
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
    backgroundColor: '#F5F5F5',
  },
  statusCanceladoText: {
    color: '#616161',
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 7,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#232323',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
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
    backgroundColor: '#4B5563',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  paginationBtnDisabled: {
    backgroundColor: '#A8A8AA',
  },
  paginationBtnText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  paginationInfo: {
    color: '#344054',
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
    borderRadius: 10,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#232323',
    marginBottom: 12,
  },
  maquinaItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#FAFAFA',
  },
  maquinaItemAtenuada: {
    opacity: 0.45,
  },
  maquinaItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#232323',
  },
  maquinaItemSubText: {
    marginTop: 2,
    fontSize: 12,
    color: '#666',
  },
  modalActions: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalCloseBtn: {
    backgroundColor: '#A8A8AA',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalCloseText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default function TrabajoScreen() {
  const ITEMS_PER_PAGE = 100;
  const ESTADO_FINALIZADO_COLOR = '#1F9D55';

  const ESTADOS_DEFAULT = [
    { value: 'diseno', label: 'Diseño' },
    { value: 'pendiente-de-aprobacion', label: 'Pendiente de Aprobación' },
    { value: 'pendiente-de-cliche', label: 'Pendiente de Cliché' },
    { value: 'pendiente-de-impresion', label: 'Pendiente de Impresión' },
    { value: 'pendiente-post-impresion', label: 'Pendiente Post-Impresión' },
    { value: 'finalizado', label: 'Finalizado' },
    { value: 'parado', label: 'Parado' },
    { value: 'cancelado', label: 'Cancelado' },
  ];

  const ESTADOS_COLORS = [
    '#1976D2', '#F57C00', '#C2185B', '#7B1FA2', '#00796B', '#388E3C', '#D32F2F', '#616161', '#0EA5A4', '#4A90E2'
  ];

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
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [modalDetalleVisible, setModalDetalleVisible] = useState(false);
  const [maquinas, setMaquinas] = useState([]);
  const [modalMaquinasVisible, setModalMaquinasVisible] = useState(false);
  const [trabajoParaProduccion, setTrabajoParaProduccion] = useState(null);
  const [estadosFiltro, setEstadosFiltro] = useState([]);
  const [estadosDisponibles, setEstadosDisponibles] = useState(ESTADOS_DEFAULT);
  const [estadoRules, setEstadoRules] = useState({
    bloqueados_produccion: ['cancelado', 'parado', 'finalizado'],
    en_cola_produccion: ['pendiente-de-impresion', 'pendiente-post-impresion'],
    preimpresion: ['diseno', 'pendiente-de-aprobacion', 'pendiente-de-cliche'],
    estados_finalizados: ['finalizado'],
    ocultar_timeline: ['parado', 'cancelado'],
    ocultar_grafica: ['parado', 'cancelado', 'finalizado'],
  });
  const [modoCreacion, setModoCreacion] = useState('manual');
  const [hoverNuevo, setHoverNuevo] = useState(false);
  const hoverNuevoTimerRef = useRef(null);
  const { actualizacionPedidos } = React.useContext(PedidosContext);

  const normalizarEstadoValue = (estadoRaw) => {
    const raw = String(estadoRaw || '').trim().toLowerCase();
    if (!raw) return ESTADOS_DEFAULT[0].value;
    const values = estadosDisponibles.map((item) => item.value);
    if (values.includes(raw)) return raw;
    const slug = slugifyEstado(estadoRaw);
    if (values.includes(slug)) return slug;
    return raw;
  };

  const cargarEstadosDisponibles = () => {
    fetch('http://localhost:8080/api/settings?categoria=estados_pedido')
      .then((res) => res.json())
      .then((data) => {
        const items = Array.isArray(data?.items) ? data.items : [];
        const parsed = items
          .map((item) => {
            const label = String(item?.valor || '').trim();
            return { label, value: slugifyEstado(label) };
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
          setEstadoRules((prev) => ({ ...prev, ...data.rules }));
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

  const getStatusColor = (estado) => getEstadoDotColor(estado);

  const getStatusLabel = (estado) => {
    const value = normalizarEstadoValue(estado);
    const found = estadosDisponibles.find((item) => item.value === value);
    return found?.label || (estado || 'Pendiente');
  };

  const estadosTimeline = estadosDisponibles.filter(
    (estado) => !(estadoRules.ocultar_timeline || []).includes(estado.value)
  );

  const getEstadoDotColor = (estado) => {
    const value = normalizarEstadoValue(estado);
    if (value === 'finalizado') return ESTADO_FINALIZADO_COLOR;
    const index = estadosDisponibles.findIndex((item) => item.value === value);
    if (index < 0) return '#9E9E9E';
    return ESTADOS_COLORS[index % ESTADOS_COLORS.length];
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
      const trabajoId = trabajoObj && (trabajoObj.id || trabajoObj.trabajo_id || trabajoObj.pedido_id || trabajoObj.pedido_id);

      const looksLikeObjectId = (s) => typeof s === 'string' && /^[0-9a-fA-F]{24}$/.test(s);

      let res;
      if (trabajoObj && trabajoObj.pedido_id) {
        res = await fetch(`http://localhost:8080/api/pedidos/${trabajoObj.pedido_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: nuevoEstado })
        });
      } else if (looksLikeObjectId(trabajoId)) {
        // fallback: update trabajo state
        res = await fetch(`http://localhost:8080/api/trabajos/${trabajoId}/estado`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: nuevoEstado })
        });
      } else {
        throw new Error('ID de trabajo/pedido inválido');
      }

      if (res && res.ok) {
        cargarPedidos();
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
    fetch('http://localhost:8080/api/pedidos')
      .then((res) => res.json())
          .then((data) => {
        if (data && data.pedidos) {
          const pedidosMapeados = data.pedidos.map((pedido) => ({
            id: pedido.trabajo_id,
            pedido_id: pedido.id,
            numero_pedido: pedido.numero_pedido,
            nombre: pedido.nombre,
            cliente: (typeof pedido.cliente === 'string') ? pedido.cliente : (pedido.cliente && (pedido.cliente.nombre || '')),
            referencia: pedido.referencia_trabajo || pedido.referencia || '-',
            estado: pedido.estado,
            en_produccion: !!pedido.en_produccion,
            numero_tintas: extraerNumeroTintas(pedido),
          }));
          setTrabajos(pedidosMapeados);
        } else {
          setTrabajos([]);
        }
      })
      .catch(() => setTrabajos([]));
  };

  // Cargar pedidos al montar el componente
  useEffect(() => {
    cargarPedidos();
    cargarModoCreacion();
    cargarEstadosDisponibles();
    cargarEstadoRules();
    fetch('http://localhost:8080/api/maquinas')
      .then((res) => res.json())
      .then((data) => setMaquinas(data.maquinas || []))
      .catch(() => setMaquinas([]));
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      cargarModoCreacion();
      cargarEstadosDisponibles();
      cargarEstadoRules();
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

  const handleNuevoPedido = (pedidoNuevo) => {
    // Agregar el nuevo pedido a la lista
    cargarPedidos();
  };

  const handleAbrirDetalle = (trabajo) => {
    if (trabajo.pedido_id) {
      setPedidoSeleccionado(trabajo.pedido_id);
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
      const res = await fetch('http://localhost:8080/api/produccion/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trabajo_id: trabajoParaProduccion.id,
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          {modoCreacion !== 'automatico' && (
            <View style={styles.btnPlusWrap}>
              <Pressable
                style={styles.btnPlus}
                onPress={() => setModalVisible(true)}
                onHoverIn={handleHoverNuevoIn}
                onHoverOut={handleHoverNuevoOut}
              >
                <Text style={styles.btnPlusText}>+</Text>
              </Pressable>
              {hoverNuevo && (
                <View style={styles.hoverHint}>
                  <Text style={styles.hoverHintText}>Nuevo pedido</Text>
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
          placeholderTextColor="#999"
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
            const textoBoton = esFinalizado ? 'Finalizado' : (estaEnColaVisual(trabajo) ? 'En cola' : 'Producc.');

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
                  <Text style={styles.cellText} numberOfLines={1}>{trabajo.cliente}</Text>
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
                    style={{
                      padding: '6px 8px',
                      borderRadius: '4px',
                      border: '1px solid #DDD',
                      backgroundColor: '#FFF',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      width: '100%',
                      color: getStatusColor(trabajo.estado) || '#232323',
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

      <NuevoPedidoModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleNuevoPedido}
      />
      
      <PedidoDetalleModal
        visible={modalDetalleVisible}
        onClose={() => setModalDetalleVisible(false)}
        pedidoId={pedidoSeleccionado}
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

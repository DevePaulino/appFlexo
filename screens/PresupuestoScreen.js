import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Modal, Pressable, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGridColumns } from '../hooks/useGridColumns';
import ColumnSelector from '../components/ColumnSelector';
import HelpModal from '../components/HelpModal';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import NuevoPresupuestoModal from './NuevoPresupuestoModal';
import { PedidosContext } from '../PedidosContext';
import { usePermission } from './usePermission';
import Toast from '../components/Toast';
import useToast from '../components/useToast';
import EmptyState from '../components/EmptyState';
import { useSettings } from '../SettingsContext';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5FD',
  },
  header: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#C7D2FE',
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    minHeight: 54,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1B4B',
    letterSpacing: -0.3,
  },
  searchInput: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4E7ED',
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 13,
    color: '#0F172A',
  },
  helpBtn: { padding: 4 },
  helpBtnText: { fontSize: 14, color: '#94A3B8' },
  btnPlus: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnPlusDisabled: { backgroundColor: '#A5B4FC' },
  btnPlusText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  chartsContainer: {
    backgroundColor: '#FAFBFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7ED',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
  },
  kpiScrollContent: {
    gap: 10,
    paddingRight: 4,
  },
  kpiPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#E4E7ED',
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 130,
    shadowColor: '#1E1B4B',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  kpiPillLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.3,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  kpiPillCount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -1,
    lineHeight: 28,
  },
  chartTrack: {
    height: 4,
    backgroundColor: '#E4E7ED',
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
    marginTop: 14,
  },
  chartFillAprobado: {
    backgroundColor: '#16A34A',
    height: '100%',
  },
  chartFillPendiente: {
    backgroundColor: '#F59E0B',
    height: '100%',
  },
  chartSegmentTouchable: {
    height: '100%',
  },
  filterRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  filterText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  filterClearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D9DBFF',
    backgroundColor: '#EEF2FF',
  },
  filterClearText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  tableContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#ECEFFE',
    borderWidth: 1,
    borderColor: '#D9DBFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderRadius: 10,
    minHeight: 40,
    alignItems: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 4,
    borderLeftWidth: 3,
    cursor: 'pointer',
    shadowColor: '#1E1B4B',
    shadowOpacity: 0.03,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  tableCell: {
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
    letterSpacing: 0.5,
  },
  cellText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0F172A',
  },
  colNumero: {
    flex: 0.17,
  },
  colCliente: {
    flex: 0.24,
  },
  colReferencia: {
    flex: 0.28,
  },
  colFecha: {
    flex: 0.13,
  },
  colEstado: {
    flex: 0.18,
  },
  numeroPresupuestoPill: {
    backgroundColor: '#EEF2FF',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  numeroPresupuestoPillText: {
    color: '#4F46E5',
    fontWeight: '800',
    fontSize: 12,
  },
  fechaAprobacionText: {
    fontSize: 10,
    color: '#16A34A',
    marginTop: 2,
    opacity: 0.75,
  },
  actionBtn: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
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
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  paginationBtnDisabled: {
    backgroundColor: '#C7D2FE',
  },
  paginationBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  paginationInfo: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '700',
  },
  estadoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 6,
  },
  estadoText: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: 'hidden',
  },
  estadoPendiente: {
    color: '#D97706',
    backgroundColor: '#FEF3C7',
  },
  estadoAceptado: {
    color: '#16A34A',
    backgroundColor: '#DCFCE7',
  },
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  detailCard: {
    width: '100%',
    maxWidth: 760,
    maxHeight: '85%',
    backgroundColor: '#FFF',
    borderRadius: 18,
    overflow: 'hidden',
  },
  detailHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  detailClose: {
    color: '#475569',
    fontWeight: '900',
    fontSize: 20,
    padding: 4,
  },
  detailBody: {
    padding: 16,
  },
  detailSection: {
    marginBottom: 14,
  },
  detailSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailRow: {
    width: '48.5%',
    paddingVertical: 10,
    marginBottom: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  detailRowFull: {
    width: '100%',
  },
  detailRowWide: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    borderWidth: 0,
    borderRadius: 0,
    paddingHorizontal: 0,
    marginBottom: 0,
    backgroundColor: 'transparent',
  },
  detailKey: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
  },
});

const PRESUPUESTOS_COL_DEFS = (t) => [
  { key: 'numero',     label: t('screens.presupuesto.colNumero'),     flex: 0.17 },
  { key: 'cliente',    label: t('screens.presupuesto.colCliente'),    flex: 0.24 },
  { key: 'referencia', label: t('screens.presupuesto.colReferencia'), flex: 0.28 },
  { key: 'fecha',      label: t('screens.presupuesto.colFecha'),      flex: 0.13 },
  { key: 'estado',     label: t('screens.presupuesto.colEstado'),     flex: 0.18 },
];

export default function PresupuestoScreen({ currentUser }) {
  const { t } = useTranslation();
  const { visibleCols, orderedCols, hiddenKeys, toggleColumn, reorderColumns, resetColumns } =
    useGridColumns('presupuestos', PRESUPUESTOS_COL_DEFS(t), currentUser?.id);
  const ITEMS_PER_PAGE = 100;
  const navigation = useNavigation();
  const [presupuestos, setPresupuestos] = useState([]);
  const { toast, showToast, hideToast } = useToast();
  const [filtrados, setFiltrados] = useState([]);
  const [paginaPresupuestos, setPaginaPresupuestos] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [helpVisible, setHelpVisible] = useState(false);
  const helpHeaderRef = useRef(null);
  const helpSearchRef = useRef(null);
  const helpFilterRef = useRef(null);
  const helpTableRef  = useRef(null);
  const [estadosFiltro, setEstadosFiltro] = useState([]);
  const [hoverNuevo, setHoverNuevo] = useState(false);
  const hoverNuevoTimerRef = useRef(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingInitialValues, setEditingInitialValues] = useState(null);
  const [detalleVisible, setDetalleVisible] = useState(false);
  const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const { modoCreacion } = useSettings();
  const [stockModal, setStockModal] = useState({ visible: false, pedido: null, authHeaders: null, stockEntries: [], selectedStockId: '', metros: '', formatoAncho: 0 });
  const { notificarNuevoPedido } = React.useContext(PedidosContext);

  // Cargar presupuestos desde backend
  const cargarPresupuestos = () => {
    setCargando(true);
    
    // Headers de autenticación
    const authHeaders = {
      'Content-Type': 'application/json',
      'X-Empresa-Id': currentUser?.empresa_id || '1',
      'X-User-Id': currentUser?.id || 'admin',
      'X-Role': currentUser?.role || 'administrador'
    };
    
    fetch('http://localhost:8080/api/presupuestos', {
      headers: authHeaders
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.presupuestos) {
          setPresupuestos(data.presupuestos);
        } else {
          setPresupuestos([]);
        }
      })
      .catch((err) => {
        console.error('Error cargando presupuestos:', err);
        setPresupuestos([]);
      })
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargarPresupuestos();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      cargarPresupuestos();
    }, [])
  );

  const coincideBusquedaPresupuesto = (presupuesto) => {
    const texto = (busqueda || '').toLowerCase();
    if (!texto) return true;

    let datosJson = {};
    try {
      if (presupuesto?.datos_json && typeof presupuesto.datos_json === 'string') {
        datosJson = JSON.parse(presupuesto.datos_json || '{}');
      } else if (presupuesto?.datos_json && typeof presupuesto.datos_json === 'object') {
        datosJson = presupuesto.datos_json;
      }
    } catch {
      datosJson = {};
    }

    const valores = [
      presupuesto.id,
      presupuesto.numero_presupuesto,
      presupuesto.cliente,
      presupuesto.referencia,
      presupuesto.fecha_presupuesto,
      presupuesto.fecha_aprobacion,
      presupuesto.aprobado ? 'aprobado' : 'pendiente',
      ...Object.values(datosJson || {}),
    ]
      .map((v) => String(v || '').toLowerCase())
      .join(' ');

    return valores.includes(texto);
  };

  useEffect(() => {
    const filtered = presupuestos.filter((p) => {
      const coincideBusqueda = coincideBusquedaPresupuesto(p);
      const estadoPresupuesto = p.aprobado ? 'aprobado' : 'pendiente';
      const coincideEstado = estadosFiltro.length === 0 || estadosFiltro.includes(estadoPresupuesto);
      return coincideBusqueda && coincideEstado;
    });
    setFiltrados(filtered);
  }, [busqueda, presupuestos, estadosFiltro]);

  useEffect(() => {
    setPaginaPresupuestos(1);
  }, [busqueda, presupuestos, estadosFiltro]);

  const totalPaginasPresupuestos = Math.max(1, Math.ceil(filtrados.length / ITEMS_PER_PAGE));
  const presupuestosPaginados = filtrados.slice((paginaPresupuestos - 1) * ITEMS_PER_PAGE, paginaPresupuestos * ITEMS_PER_PAGE);

  useEffect(() => {
    if (paginaPresupuestos > totalPaginasPresupuestos) {
      setPaginaPresupuestos(totalPaginasPresupuestos);
    }
  }, [paginaPresupuestos, totalPaginasPresupuestos]);

  const toggleEstadoFiltro = (estado) => {
    setEstadosFiltro((prev) =>
      prev.includes(estado) ? prev.filter((item) => item !== estado) : [...prev, estado]
    );
  };

  const handleNuevoPresupuesto = (presupuesto) => {
    // Crear un trabajo y luego guardar el presupuesto con todos los datos
    const trabajo = {
      nombre: presupuesto.nombre || `Trabajo ${presupuesto.numero}`,
      cliente: presupuesto.cliente,
      referencia: presupuesto.referencia,
      fecha_entrega: presupuesto.fecha || new Date().toISOString().split('T')[0]
    };
    
    // Headers de autenticación
    const authHeaders = {
      'Content-Type': 'application/json',
      'X-Empresa-Id': currentUser?.empresa_id || '1',
      'X-User-Id': currentUser?.id || 'admin',
      'X-Role': currentUser?.role || 'administrador'
    };
    
    // Primero crear el trabajo
    fetch('http://localhost:8080/api/trabajos', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(trabajo)
    })
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        if (data.trabajo_id) {
          // Ahora guardar el presupuesto con todos los datos
          const presupuestoCompleto = {
            trabajo_id: data.trabajo_id,
            numero_presupuesto: presupuesto.numero,
            referencia: presupuesto.referencia,
            aprobado: 0,
            cliente: presupuesto.cliente,
            razonSocial: presupuesto.razonSocial,
            cif: presupuesto.cif,
            personasContacto: presupuesto.personasContacto,
            email: presupuesto.email,
            nombre: presupuesto.nombre,
            fecha: presupuesto.fecha,
            vendedor: presupuesto.vendedor,
            formatoAncho: presupuesto.formatoAncho,
            formatoLargo: presupuesto.formatoLargo,
            maquina: presupuesto.maquina,
            material: presupuesto.material,
            acabado: presupuesto.acabado,
            tirada: presupuesto.tirada,
            selectedTintas: presupuesto.selectedTintas,
            detalleTintaEspecial: presupuesto.detalleTintaEspecial,
            coberturaResult: presupuesto.coberturaResult,
            troquelEstadoSel: presupuesto.troquelEstadoSel,
            troquelFormaSel: presupuesto.troquelFormaSel,
            troquelCoste: presupuesto.troquelCoste,
            observaciones: presupuesto.observaciones
          };
          
          fetch('http://localhost:8080/api/presupuestos', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify(presupuestoCompleto)
          })
            .then((res) => {
              return res.json();
            })
            .then((respData) => {
              if (respData.error) {
                console.error('Error guardando presupuesto:', respData.error);
                showToast(respData.error || 'Error al guardar presupuesto', 'error');
              } else {
                showToast(t('screens.presupuesto.guardado'), 'success');
                cargarPresupuestos();
              }
            })
            .catch((err) => {
              console.error('Error en fetch de presupuesto:', err);
              showToast(`Error en la solicitud: ${err.message}`, 'error');
            });
        } else {
          console.error('Error creando trabajo:', data);
          showToast(data.error || 'Error al crear trabajo', 'error');
        }
      })
      .catch((err) => {
        console.error('Error en fetch de trabajo:', err);
        showToast(`Error al crear trabajo: ${err.message}`, 'error');
      });
  };

  const handleAceptarPresupuesto = async (presupuesto) => {
    // Enviar todos los datos del presupuesto al crear el pedido
    const datosPresupuesto = {
      numero_presupuesto: presupuesto.numero_presupuesto,
      referencia: presupuesto.referencia,
      cliente: presupuesto.cliente,
      nombre: presupuesto.nombre,
      fecha_presupuesto: presupuesto.fecha_presupuesto,
      fecha_entrega: presupuesto.fecha_entrega,
      ...presupuesto // Incluir todos los datos adicionales
    };

    const targetId = presupuesto.trabajo_id || presupuesto.id || presupuesto._id;
    if (!targetId) {
      console.error('No se encuentra trabajo_id en presupuesto:', presupuesto);
      showToast('No es posible aceptar este presupuesto: falta identificador de trabajo.', 'warning');
      return;
    }

    // Headers de autenticación
    const authHeaders = {
      'Content-Type': 'application/json',
      'X-Empresa-Id': currentUser?.empresa_id || '1',
      'X-User-Id': currentUser?.id || 'admin',
      'X-Role': currentUser?.role || 'administrador'
    };

    try {
      const res = await fetch(`http://localhost:8080/api/presupuestos/aceptar/${targetId}`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(datosPresupuesto)
      });
      const data = await res.json();

      // Actualizar presupuesto localmente
      const updated = presupuestos.map((p) =>
        p.id === presupuesto.id ? { ...p, aprobado: true, fecha_aprobacion: data?.pedido ? data.pedido.fecha_pedido : new Date().toISOString() } : p
      );
      setPresupuestos(updated);

      // Modo automático: queda registrado como aceptado, el pedido llega por endpoint externo
      if (data && data.modo === 'automatico') {
        showToast('Presupuesto aceptado. El pedido se generará automáticamente.', 'success');
        return;
      }

      if (data && data.pedido) {
        // Comprobar si hay stock disponible para el material del presupuesto
        const materialNombre = presupuesto.material || presupuesto.datos_presupuesto?.material || '';
        if (materialNombre) {
          try {
            const stockRes = await fetch(
              `http://localhost:8080/api/materiales/stock?material_nombre=${encodeURIComponent(materialNombre)}&activo=true`,
              { headers: authHeaders }
            );
            const stockData = await stockRes.json();
            const tirada = parseFloat(presupuesto.tirada || 0);
            const fl = parseFloat(presupuesto.formatoLargo || 0);
            const fa = parseFloat(presupuesto.formatoAncho || 0);
            const metrosEst = tirada > 0 && fl > 0 ? tirada * fl / 1000 : 0;
            const entries = (stockData.stock || []).filter((e) =>
              e.es_retal &&
              e.metros_disponibles > 0 &&
              (fa <= 0 || e.ancho_cm >= fa / 10) &&
              (metrosEst <= 0 || e.metros_disponibles >= metrosEst)
            );
            if (entries.length > 0) {
              setStockModal({
                visible: true,
                pedido: data.pedido,
                authHeaders,
                stockEntries: entries,
                selectedStockId: entries[0].id,
                metros: metrosEst > 0 ? metrosEst.toFixed(2) : '',
                formatoAncho: fa,
              });
              return; // esperar acción del usuario en el modal
            }
          } catch (e) {
          }
        }

        // Sin stock disponible o sin material → navegar directamente
        try {
          notificarNuevoPedido();
          navigation.navigate('Pedidos', { newPedido: data.pedido });
        } catch (e) {
          notificarNuevoPedido();
          navigation.navigate('Pedidos');
        }
        return;
      }

      // Fallback: notificar y navegar para que la pantalla recargue
      notificarNuevoPedido();
      navigation.navigate('Pedidos');
    } catch (err) {
      console.error('Error aceptando presupuesto:', err);
    }
  };

  const handleConfirmarConsumo = async () => {
    const { pedido, authHeaders: hdrs, selectedStockId, metros } = stockModal;
    const metrosNum = parseFloat(metros);
    if (!selectedStockId || isNaN(metrosNum) || metrosNum <= 0) {
      showToast('Selecciona un material e indica los metros a consumir.', 'warning');
      return;
    }
    try {
      const res = await fetch('http://localhost:8080/api/materiales/consumos', {
        method: 'POST',
        headers: hdrs,
        body: JSON.stringify({
          stock_id: selectedStockId,
          pedido_id: pedido._id || pedido.id,
          numero_pedido: String(pedido.numero_pedido || ''),
          metros_consumidos: metrosNum
        })
      });
      const data = await res.json();
      if (!data.success) {
        showToast(data.error || 'Error al registrar consumo de stock', 'error');
        return;
      }
    } catch (e) {
    }
    const pedidoRef = stockModal.pedido;
    setStockModal({ visible: false, pedido: null, authHeaders: null, stockEntries: [], selectedStockId: '', metros: '' });
    notificarNuevoPedido();
    try {
      navigation.navigate('Pedidos', { newPedido: pedidoRef });
    } catch (e) {
      navigation.navigate('Pedidos');
    }
  };

  const handleAbrirDetalle = (presupuesto) => {
    // Open the presupuesto form for editing. If aprobado, open in read-only mode.
    setPresupuestoSeleccionado(presupuesto);
    setEditingInitialValues && setEditingInitialValues(presupuesto);
    setModalVisible(true);
    // ensure detail view is closed
    setDetalleVisible(false);
  };

  const formatearFecha = (valor) => {
    if (!valor) return '-';
    const texto = String(valor).includes('T') ? String(valor).split('T')[0] : String(valor);
    const [anio, mes, dia] = texto.split('-');
    if (!anio || !mes || !dia) return texto;
    return `${dia}-${mes}-${anio}`;
  };

  const formatearFechaHora = (valor) => {
    if (!valor) return '-';
    const str = String(valor);
    const [fechaParte, horaParte] = str.includes('T') ? str.split('T') : [str, null];
    const [anio, mes, dia] = fechaParte.split('-');
    if (!anio || !mes || !dia) return str;
    const horaStr = horaParte ? horaParte.substring(0, 5) : null;
    return horaStr ? `${dia}-${mes}-${anio} ${horaStr}` : `${dia}-${mes}-${anio}`;
  };

  const getDetalleLabel = (clave) => {
    const labels = {
      numero_presupuesto: 'Número de presupuesto',
      fecha_presupuesto: 'Fecha presupuesto',
      aprobado: 'Estado',
      cliente: 'Cliente',
      nombre: 'Nombre trabajo',
      referencia: 'Referencia',
      razonSocial: 'Razón social',
      cif: 'CIF',
      personasContacto: 'Personas de contacto',
      email: 'Email',
      fecha_entrega: 'Fecha entrega',
      vendedor: 'Comercial',
      maquina: 'Máquina',
      material: 'Material',
      acabado: 'Acabado',
      tirada: 'Tirada',
      formatoAncho: 'Formato ancho',
      formatoLargo: 'Formato largo',
      selectedTintas: 'Tintas',
      detalleTintaEspecial: 'Detalle tinta especial',
      coberturaResult: 'Cobertura',
      troquelEstadoSel: 'Troquel estado',
      troquelFormaSel: 'Troquel forma',
      troquelCoste: 'Troquel coste',
      observaciones: 'Observaciones',
      trabajo_id: 'ID trabajo',
      id: 'ID presupuesto',
      fecha_aprobacion: 'Fecha aprobación',
    };
    return labels[clave] || clave.replace(/_/g, ' ');
  };

  const getDetalleOrdenado = (presupuesto) => {
    if (!presupuesto) return [];
    const ordenPrincipal = [
      'numero_presupuesto', 'aprobado', 'fecha_presupuesto', 'fecha_entrega',
      'cliente', 'nombre', 'referencia', 'vendedor', 'maquina', 'material',
      'acabado', 'tirada', 'formatoAncho', 'formatoLargo', 'selectedTintas',
      'detalleTintaEspecial', 'coberturaResult', 'troquelEstadoSel',
      'troquelFormaSel', 'troquelCoste', 'observaciones'
    ];

    const setOrden = new Set(ordenPrincipal);
    const existentes = Object.entries(presupuesto).filter(([clave]) => clave !== 'datos_json');
    const primeras = ordenPrincipal
      .filter((clave) => Object.prototype.hasOwnProperty.call(presupuesto, clave))
      .map((clave) => [clave, presupuesto[clave]]);
    const restantes = existentes.filter(([clave]) => !setOrden.has(clave));
    return [...primeras, ...restantes];
  };

  const getSeccionesDetalle = (presupuesto) => {
    if (!presupuesto) return [];

    const clavesUsadas = new Set();

    const construirSeccion = (titulo, claves) => {
      const campos = claves
        .filter((clave) => Object.prototype.hasOwnProperty.call(presupuesto, clave))
        .map((clave) => {
          clavesUsadas.add(clave);
          return [clave, presupuesto[clave]];
        });
      return { titulo, campos };
    };

    const secciones = [
      construirSeccion('Comercial', [
        'numero_presupuesto', 'aprobado', 'fecha_presupuesto', 'fecha_entrega',
        'cliente', 'razonSocial', 'cif', 'personasContacto', 'email',
        'nombre', 'referencia', 'vendedor'
      ]),
      construirSeccion('Producción', [
        'maquina', 'material', 'acabado', 'tirada',
        'formatoAncho', 'formatoLargo', 'selectedTintas',
        'detalleTintaEspecial', 'coberturaResult'
      ]),
      construirSeccion('Troquel', [
        'troquelEstadoSel', 'troquelFormaSel', 'troquelCoste'
      ]),
      construirSeccion('Observaciones', ['observaciones'])
    ];

    const restantes = Object.entries(presupuesto).filter(
      ([clave]) => clave !== 'datos_json' && clave !== 'referencia_trabajo' && !clavesUsadas.has(clave)
    );

    if (restantes.length > 0) {
      secciones.push({ titulo: 'Otros datos', campos: restantes });
    }

    return secciones.filter((seccion) => seccion.campos.length > 0);
  };

  const formatearValorDetalle = (valor, clave = '') => {
    if (valor === null || valor === undefined || valor === '') return '-';
    if (clave === 'aprobado') return valor ? t('screens.presupuesto.estadoAprobado') : t('screens.presupuesto.estadoPendiente');
    if (clave === 'fecha_aprobacion') return formatearFechaHora(valor);
    if (clave === 'fecha_presupuesto') return formatearFecha(valor);
    if (typeof valor === 'boolean') return valor ? t('common.yes') : t('common.no');
    if (Array.isArray(valor)) return valor.length ? valor.join(', ') : '-';
    if (typeof valor === 'object') return JSON.stringify(valor);
    return String(valor);
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

  const puedeCrear = usePermission('edit_presupuestos');

  const presupuestosBaseGrafica = presupuestos.filter((p) => coincideBusquedaPresupuesto(p));
  const totalPresupuestos = presupuestosBaseGrafica.length;
  const aprobadosCount = presupuestosBaseGrafica.filter((p) => !!p.aprobado).length;
  const pendientesCount = totalPresupuestos - aprobadosCount;
  const aprobadosWidth = totalPresupuestos > 0 ? (aprobadosCount / totalPresupuestos) * 100 : 0;
  const pendientesWidth = totalPresupuestos > 0 ? (pendientesCount / totalPresupuestos) * 100 : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header} ref={helpHeaderRef}>
        <Text style={styles.headerTitle}>{t('nav.presupuestos')}</Text>
        <Pressable onPress={() => setHelpVisible(true)} style={styles.helpBtn}>
          <Text style={styles.helpBtnText}>?</Text>
        </Pressable>
        <TextInput
          ref={helpSearchRef}
          style={styles.searchInput}
          placeholder={t('common.searchAny')}
          value={busqueda}
          onChangeText={setBusqueda}
          placeholderTextColor="#94A3B8"
        />
        <Pressable
          style={[styles.btnPlus, !puedeCrear && styles.btnPlusDisabled]}
          onPress={() => puedeCrear && setModalVisible(true)}
          disabled={!puedeCrear}
        >
          <Text style={styles.btnPlusText}>{t('screens.presupuesto.newBtn')}</Text>
        </Pressable>
      </View>

      <View style={styles.chartsContainer} ref={helpFilterRef}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kpiScrollContent}>
          <TouchableOpacity
            style={[
              styles.kpiPill,
              { borderLeftColor: '#16A34A' },
              estadosFiltro.includes('aprobado') && { backgroundColor: '#16A34A18', borderColor: '#16A34A33' },
            ]}
            onPress={() => toggleEstadoFiltro('aprobado')}
          >
            <Text style={styles.kpiPillLabel}>{t('screens.presupuesto.estadoAprobadoFilter')}</Text>
            <Text style={[styles.kpiPillCount, estadosFiltro.includes('aprobado') && { color: '#16A34A' }]}>{aprobadosCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.kpiPill,
              { borderLeftColor: '#F59E0B' },
              estadosFiltro.includes('pendiente') && { backgroundColor: '#F59E0B18', borderColor: '#F59E0B33' },
            ]}
            onPress={() => toggleEstadoFiltro('pendiente')}
          >
            <Text style={styles.kpiPillLabel}>{t('screens.presupuesto.estadoPendienteFilter')}</Text>
            <Text style={[styles.kpiPillCount, estadosFiltro.includes('pendiente') && { color: '#F59E0B' }]}>{pendientesCount}</Text>
          </TouchableOpacity>
        </ScrollView>
        <View style={styles.chartTrack}>
          <TouchableOpacity
            style={[
              styles.chartSegmentTouchable,
              { width: `${aprobadosWidth}%` },
              estadosFiltro.length > 0 && !estadosFiltro.includes('aprobado') ? { opacity: 0.3 } : null,
            ]}
            onPress={() => toggleEstadoFiltro('aprobado')}
          >
            <View style={[styles.chartFillAprobado, { width: '100%' }]} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.chartSegmentTouchable,
              { width: `${pendientesWidth}%` },
              estadosFiltro.length > 0 && !estadosFiltro.includes('pendiente') ? { opacity: 0.3 } : null,
            ]}
            onPress={() => toggleEstadoFiltro('pendiente')}
          >
            <View style={[styles.chartFillPendiente, { width: '100%' }]} />
          </TouchableOpacity>
        </View>
        {estadosFiltro.length > 0 && (
          <View style={styles.filterRow}>
            <Text style={styles.filterText}>
              {t('screens.presupuesto.filtroActivo', { estados: estadosFiltro.map((estado) => estado === 'aprobado' ? t('screens.presupuesto.estadoAprobadoFilter') : t('screens.presupuesto.estadoPendienteFilter')).join(', ') })}
            </Text>
            <TouchableOpacity style={styles.filterClearBtn} onPress={() => setEstadosFiltro([])}>
              <Text style={styles.filterClearText}>{t('screens.presupuesto.quitarFiltro')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {filtrados.length === 0 ? (
        <View style={styles.tableContainer} ref={helpTableRef}>
          <EmptyState
            title={busqueda ? t('common.noResults') : t('screens.presupuesto.noPresupuestos')}
            message={busqueda ? t('common.noResultsMsg') : t('screens.presupuesto.noItems')}
            action={!busqueda && puedeCrear ? t('screens.presupuesto.newBtn') : undefined}
            onAction={!busqueda && puedeCrear ? () => setModalVisible(true) : undefined}
          />
        </View>
      ) : (
        <ScrollView style={styles.tableContainer} ref={helpTableRef}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <View style={Platform.select({ web: { width: '100%' }, default: { minWidth: 560 } })}>
          <View style={styles.tableHeader}>
            {visibleCols.map(col => (
              <View key={col.key} style={[styles.tableCell, { flex: col.adjustedFlex }]}>
                <Text style={styles.headerText}>{col.label}</Text>
              </View>
            ))}
            <ColumnSelector
              orderedCols={orderedCols}
              hiddenKeys={hiddenKeys}
              onToggle={toggleColumn}
              onReorder={reorderColumns}
              onReset={resetColumns}
            />
          </View>
          {presupuestosPaginados.map((presupuesto) => {
            const borderColor = presupuesto.aprobado ? '#16A34A' : '#F59E0B';
            return (
              <Pressable
                key={presupuesto.id}
                onPress={() => handleAbrirDetalle(presupuesto)}
                style={({ hovered }) => [
                  styles.tableRow,
                  { borderLeftColor: borderColor },
                  hovered && { backgroundColor: '#F5F7FF' },
                ]}
              >
                {visibleCols.map(col => {
                  switch (col.key) {
                    case 'numero':
                      return (
                        <View key={col.key} style={[styles.tableCell, { flex: col.adjustedFlex }]}>
                          {presupuesto.numero_presupuesto ? (
                            <View style={styles.numeroPresupuestoPill}>
                              <Text style={styles.numeroPresupuestoPillText} numberOfLines={1}>{presupuesto.numero_presupuesto}</Text>
                            </View>
                          ) : <Text style={[styles.cellText, { color: '#999' }]}>-</Text>}
                        </View>
                      );
                    case 'cliente':
                      return (
                        <View key={col.key} style={[styles.tableCell, { flex: col.adjustedFlex }]}>
                          <Text style={styles.cellText} numberOfLines={1}>{typeof presupuesto.cliente === 'string' ? presupuesto.cliente : (presupuesto.cliente && (presupuesto.cliente.nombre || '-'))}</Text>
                        </View>
                      );
                    case 'referencia':
                      return (
                        <View key={col.key} style={[styles.tableCell, { flex: col.adjustedFlex }]}>
                          <Text style={styles.cellText} numberOfLines={1}>{presupuesto.referencia || presupuesto.nombre || '-'}</Text>
                        </View>
                      );
                    case 'fecha':
                      return (
                        <View key={col.key} style={[styles.tableCell, { flex: col.adjustedFlex }]}>
                          <Text style={styles.cellText} numberOfLines={1}>{formatearFecha(presupuesto.fecha_presupuesto)}</Text>
                        </View>
                      );
                    case 'estado':
                      return (
                        <View key={col.key} style={[styles.tableCell, { flex: col.adjustedFlex }]}>
                          <View style={styles.estadoContainer}>
                            <Text
                              style={[
                                styles.estadoText,
                                presupuesto.aprobado ? styles.estadoAceptado : styles.estadoPendiente,
                              ]}
                              numberOfLines={1}
                            >
                              {presupuesto.aprobado ? t('screens.presupuesto.estadoAprobado') : t('screens.presupuesto.estadoPendiente')}
                            </Text>
                            {presupuesto.aprobado && presupuesto.fecha_aprobacion ? (
                              <Text style={styles.fechaAprobacionText} numberOfLines={1}>
                                {formatearFechaHora(presupuesto.fecha_aprobacion)}
                              </Text>
                            ) : null}
                            {!presupuesto.aprobado ? (
                              <TouchableOpacity style={styles.actionBtn} onPress={(e) => { e.stopPropagation?.(); handleAceptarPresupuesto(presupuesto); }}>
                                <Text style={styles.actionBtnText}>{t('screens.presupuesto.aceptar')}</Text>
                              </TouchableOpacity>
                            ) : null}
                          </View>
                        </View>
                      );
                    default:
                      return null;
                  }
                })}
                <View style={{ width: 30 }} />
              </Pressable>
            );
          })}
          {totalPaginasPresupuestos > 1 && (
            <View style={styles.paginationRow}>
              <TouchableOpacity
                style={[styles.paginationBtn, paginaPresupuestos === 1 && styles.paginationBtnDisabled]}
                onPress={() => setPaginaPresupuestos((prev) => Math.max(1, prev - 1))}
                disabled={paginaPresupuestos === 1}
              >
                <Text style={styles.paginationBtnText}>{t('common.prev')}</Text>
              </TouchableOpacity>
              <Text style={styles.paginationInfo}>{t('common.pageOf', { current: paginaPresupuestos, total: totalPaginasPresupuestos })}</Text>
              <TouchableOpacity
                style={[styles.paginationBtn, paginaPresupuestos === totalPaginasPresupuestos && styles.paginationBtnDisabled]}
                onPress={() => setPaginaPresupuestos((prev) => Math.min(totalPaginasPresupuestos, prev + 1))}
                disabled={paginaPresupuestos === totalPaginasPresupuestos}
              >
                <Text style={styles.paginationBtnText}>{t('common.next')}</Text>
              </TouchableOpacity>
            </View>
          )}
          </View>
          </ScrollView>
        </ScrollView>
      )}

      <Modal
        visible={detalleVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDetalleVisible(false)}
      >
        <View style={styles.detailOverlay}>
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>
                {t('nav.presupuestos')} {presupuestoSeleccionado?.numero_presupuesto || ''}
              </Text>
              <TouchableOpacity onPress={() => setDetalleVisible(false)}>
                <Text style={styles.detailClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.detailBody}>
              {getSeccionesDetalle(presupuestoSeleccionado).map((seccion) => (
                <View key={seccion.titulo} style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>{seccion.titulo}</Text>
                  <View style={styles.detailGrid}>
                    {seccion.campos.map(([clave, valor]) => {
                      const esLargo =
                        clave === 'observaciones' ||
                        (typeof valor === 'string' && valor.length > 80);

                      return (
                        <View key={clave} style={[styles.detailRow, esLargo && styles.detailRowFull]}>
                          <Text style={styles.detailKey}>{getDetalleLabel(clave)}</Text>
                          <Text style={styles.detailValue}>{formatearValorDetalle(valor, clave)}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal deducción de stock de material */}
      <Modal visible={stockModal.visible} transparent animationType="fade">
        <View style={styles.detailOverlay}>
          <View style={[styles.detailCard, { maxWidth: 520, maxHeight: '80%' }]}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>{t('screens.presupuesto.deducirStock')}</Text>
              <TouchableOpacity onPress={() => {
                const pedidoRef = stockModal.pedido;
                setStockModal({ visible: false, pedido: null, authHeaders: null, stockEntries: [], selectedStockId: '', metros: '' });
                notificarNuevoPedido();
                try { navigation.navigate('Pedidos', { newPedido: pedidoRef }); }
                catch (e) { navigation.navigate('Pedidos'); }
              }}>
                <Text style={styles.detailClose}>{t('screens.presupuesto.omitir')}</Text>
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
              <Text style={{ fontWeight: '600', marginBottom: 8, color: '#344054' }}>{t('screens.presupuesto.seleccionaMaterial')}</Text>
              {stockModal.stockEntries.map((entry) => (
                <TouchableOpacity
                  key={entry.id}
                  onPress={() => setStockModal((prev) => ({ ...prev, selectedStockId: entry.id }))}
                  style={{
                    flexDirection: 'row', alignItems: 'center', padding: 10, marginBottom: 6,
                    borderRadius: 6, borderWidth: 1,
                    borderColor: stockModal.selectedStockId === entry.id ? '#1565C0' : '#D1D5DB',
                    backgroundColor: stockModal.selectedStockId === entry.id ? '#EFF6FF' : '#fff'
                  }}
                >
                  <View style={{
                    width: 14, height: 14, borderRadius: 7, borderWidth: 2,
                    borderColor: stockModal.selectedStockId === entry.id ? '#1565C0' : '#9CA3AF',
                    backgroundColor: stockModal.selectedStockId === entry.id ? '#1565C0' : 'transparent',
                    marginRight: 10
                  }} />
                  <Text style={{ flex: 1, fontSize: 13, color: '#374151' }}>
                    {entry.fabricante} · {entry.ancho_cm} cm{entry.gramaje ? ` · ${entry.gramaje} g/m²` : ''} · Disponibles: {entry.metros_disponibles} m
                    {entry.numero_lote ? ` · Lote: ${entry.numero_lote}` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
              <Text style={{ fontWeight: '600', marginTop: 12, marginBottom: 6, color: '#344054' }}>{t('screens.presupuesto.metrosConsumir')}</Text>
              <TextInput
                value={stockModal.metros}
                onChangeText={(t) => setStockModal((prev) => ({ ...prev, metros: t }))}
                keyboardType="numeric"
                placeholder="Ej: 400"
                style={{
                  borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 6,
                  padding: 8, fontSize: 14, marginBottom: 20, backgroundColor: '#fff'
                }}
              />
              <TouchableOpacity
                onPress={handleConfirmarConsumo}
                style={{
                  backgroundColor: '#1565C0', borderRadius: 6,
                  paddingVertical: 10, alignItems: 'center'
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>{t('screens.presupuesto.registrarContinuar')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <NuevoPresupuestoModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setEditingInitialValues(null); }}
        onSave={(p) => {
          // Headers de autenticación
          const authHeaders = {
            'Content-Type': 'application/json',
            'X-Empresa-Id': currentUser?.empresa_id || '1',
            'X-User-Id': currentUser?.id || 'admin',
            'X-Role': currentUser?.role || 'administrador'
          };

          // Si estamos editando un presupuesto existente, actualizarlo vía API
          if (editingInitialValues && (editingInitialValues.id || editingInitialValues._id)) {
            const presId = editingInitialValues.id || editingInitialValues._id;
            fetch(`http://localhost:8080/api/presupuestos/${presId}`, {
              method: 'PUT',
              headers: authHeaders,
              body: JSON.stringify({
                numero_presupuesto: p.numero || editingInitialValues.numero_presupuesto,
                referencia: p.referencia || editingInitialValues.referencia,
                fecha_presupuesto: p.fecha || editingInitialValues.fecha_presupuesto,
                aprobado: editingInitialValues.aprobado || false,
                datos_json: p
              })
            })
              .then((res) => res.json())
              .then(() => {
                setModalVisible(false);
                setEditingInitialValues(null);
                cargarPresupuestos();
              })
              .catch((err) => console.error('Error actualizando presupuesto:', err));
          } else {
            // Crear nuevo presupuesto
            setModalVisible(false);
            setEditingInitialValues(null);
            handleNuevoPresupuesto(p);
          }
        }}
        initialValues={editingInitialValues}
        readOnly={!!(editingInitialValues && editingInitialValues.aprobado)}
        modalTitle={editingInitialValues ? t('screens.presupuesto.editTitle') : t('forms.newPresupuesto')}
        submitLabel={editingInitialValues ? t('common.saveChanges') : t('forms.savePresupuesto')}
        fechaLabel={t('forms.fechaCreacion')}
        showFechaEntrega={true}
        fechaEntregaLabel={t('forms.fechaEntrega')}
        showMaquinaField={false}
        currentUser={currentUser}
        puedeCrear={puedeCrear}
      />
      <Toast message={toast.message} type={toast.type} onHide={hideToast} />
      <HelpModal
        visible={helpVisible}
        onClose={() => { AsyncStorage.setItem('help_seen_presupuestos', '1'); setHelpVisible(false); }}
        title={t('help.presupuestos.title')}
        steps={[
          { icon: t('help.presupuestos.s1i'), title: t('help.presupuestos.s1t'), desc: t('help.presupuestos.s1d'), spotlight: { ref: helpHeaderRef } },
          { icon: t('help.presupuestos.s2i'), title: t('help.presupuestos.s2t'), desc: t('help.presupuestos.s2d'), spotlight: { ref: helpSearchRef } },
          { icon: t('help.presupuestos.s3i'), title: t('help.presupuestos.s3t'), desc: t('help.presupuestos.s3d'), spotlight: { ref: helpFilterRef } },
          { icon: t('help.presupuestos.s4i'), title: t('help.presupuestos.s4t'), desc: t('help.presupuestos.s4d'), spotlight: { ref: helpTableRef } },
        ]}
      />
    </View>
  );
}


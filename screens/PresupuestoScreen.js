import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Modal, Pressable } from 'react-native';
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
  content: {
    padding: 0,
  },
  chartsContainer: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: 10,
    marginTop: 10,
    padding: 12,
    marginBottom: 10,
  },
  chartsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  chartTrack: {
    height: 12,
    backgroundColor: '#ECEFF1',
    borderRadius: 8,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  chartFillAprobado: {
    backgroundColor: '#16A34A',
    height: '100%',
  },
  chartFillPendiente: {
    backgroundColor: '#F59E0B',
    height: '100%',
  },
  chartLegendRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 18,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  chartLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  chartLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  chartLegendText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  chartLegendItemActive: {
    backgroundColor: '#F2F4F7',
  },
  chartSegmentTouchable: {
    height: '100%',
  },
  chartSegmentActiveShadow: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
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
    color: '#3B3B3B',
    flex: 1,
  },
  filterClearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFF',
  },
  filterClearText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  tableContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 8,
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
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 70,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
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
    color: '#B42318',
    backgroundColor: '#FEE4E2',
  },
  estadoAceptado: {
    color: '#027A48',
    backgroundColor: '#D1FADF',
  },
  numeroPresupuestoLink: {
    color: '#475569',
    fontWeight: '700',
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

export default function PresupuestoScreen({ currentUser }) {
  const { t } = useTranslation();
  const ITEMS_PER_PAGE = 100;
  const navigation = useNavigation();
  const [presupuestos, setPresupuestos] = useState([]);
  const { toast, showToast, hideToast } = useToast();
  const [filtrados, setFiltrados] = useState([]);
  const [paginaPresupuestos, setPaginaPresupuestos] = useState(1);
  const [busqueda, setBusqueda] = useState('');
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
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={{ width: 38 }} />
          <Text style={styles.headerTitle}>{t('nav.presupuestos')}</Text>
          <Pressable
            style={[styles.btnPlus, !puedeCrear && { opacity: 0.45 }]}
            onPress={() => puedeCrear && setModalVisible(true)}
            disabled={!puedeCrear}
          >
            <Text style={styles.btnPlusText}>{t('screens.presupuesto.newBtn')}</Text>
          </Pressable>
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder={t('common.searchAny')}
          value={busqueda}
          onChangeText={setBusqueda}
          placeholderTextColor="#94A3B8"
        />
      </View>

      <View style={styles.content}>
        <View style={styles.chartsContainer}>
          <Text style={styles.chartsTitle}>{t('screens.presupuesto.estadoTitle')}</Text>
          <View style={styles.chartTrack}>
            <TouchableOpacity
              style={[
                styles.chartSegmentTouchable,
                { width: `${aprobadosWidth}%` },
                estadosFiltro.length > 0 && !estadosFiltro.includes('aprobado') ? { opacity: 0.35 } : null,
                estadosFiltro.includes('aprobado') ? styles.chartSegmentActiveShadow : null,
              ]}
              onPress={() => toggleEstadoFiltro('aprobado')}
            >
              <View style={[styles.chartFillAprobado, { width: '100%' }]} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.chartSegmentTouchable,
                { width: `${pendientesWidth}%` },
                estadosFiltro.length > 0 && !estadosFiltro.includes('pendiente') ? { opacity: 0.35 } : null,
                estadosFiltro.includes('pendiente') ? styles.chartSegmentActiveShadow : null,
              ]}
              onPress={() => toggleEstadoFiltro('pendiente')}
            >
              <View style={[styles.chartFillPendiente, { width: '100%' }]} />
            </TouchableOpacity>
          </View>
          <View style={styles.chartLegendRow}>
            <TouchableOpacity
              style={[styles.chartLegendItem, estadosFiltro.includes('aprobado') && styles.chartLegendItemActive]}
              onPress={() => toggleEstadoFiltro('aprobado')}
            >
              <View style={[styles.chartLegendDot, { backgroundColor: '#16A34A' }]} />
              <Text style={styles.chartLegendText}>{t('screens.presupuesto.aprobados', { count: aprobadosCount })}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chartLegendItem, estadosFiltro.includes('pendiente') && styles.chartLegendItemActive]}
              onPress={() => toggleEstadoFiltro('pendiente')}
            >
              <View style={[styles.chartLegendDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.chartLegendText}>{t('screens.presupuesto.pendientes', { count: pendientesCount })}</Text>
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
      </View>

      {filtrados.length === 0 ? (
        <View style={styles.tableContainer}>
          <EmptyState
            title={busqueda ? t('common.noResults') : t('screens.presupuesto.noPresupuestos')}
            message={busqueda ? t('common.noResultsMsg') : t('screens.presupuesto.noItems')}
            action={!busqueda && puedeCrear ? t('screens.presupuesto.newBtn') : undefined}
            onAction={!busqueda && puedeCrear ? () => setModalVisible(true) : undefined}
          />
        </View>
      ) : (
        <ScrollView style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <View style={[styles.tableCell, styles.colNumero]}>
              <Text style={styles.headerText}>{t('screens.presupuesto.colNumero')}</Text>
            </View>
            <View style={[styles.tableCell, styles.colCliente]}>
              <Text style={styles.headerText}>{t('screens.presupuesto.colCliente')}</Text>
            </View>
            <View style={[styles.tableCell, styles.colReferencia]}>
              <Text style={styles.headerText}>{t('screens.presupuesto.colReferencia')}</Text>
            </View>
            <View style={[styles.tableCell, styles.colFecha]}>
              <Text style={styles.headerText}>{t('screens.presupuesto.colFecha')}</Text>
            </View>
            <View style={[styles.tableCell, styles.colEstado]}>
              <Text style={styles.headerText}>{t('screens.presupuesto.colEstado')}</Text>
            </View>
          </View>
          {presupuestosPaginados.map((presupuesto, idx) => (
            <View key={presupuesto.id} style={[styles.tableRow, (idx + (paginaPresupuestos - 1) * ITEMS_PER_PAGE) % 2 === 1 && styles.rowAlternate]}>
              <View style={[styles.tableCell, styles.colNumero]}>
                <TouchableOpacity onPress={() => handleAbrirDetalle(presupuesto)}>
                  <Text style={[styles.cellText, styles.numeroPresupuestoLink]} numberOfLines={1}>{presupuesto.numero_presupuesto}</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.tableCell, styles.colCliente]}>
                <Text style={styles.cellText} numberOfLines={1}>{typeof presupuesto.cliente === 'string' ? presupuesto.cliente : (presupuesto.cliente && (presupuesto.cliente.nombre || '-'))}</Text>
              </View>
              <View style={[styles.tableCell, styles.colReferencia]}>
                <Text style={styles.cellText} numberOfLines={1}>{presupuesto.referencia || presupuesto.nombre || '-'}</Text>
              </View>
              <View style={[styles.tableCell, styles.colFecha]}>
                <Text style={styles.cellText} numberOfLines={1}>{formatearFecha(presupuesto.fecha_presupuesto)}</Text>
              </View>
              <View style={[styles.tableCell, styles.colEstado]}>
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
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleAceptarPresupuesto(presupuesto)}>
                      <Text style={styles.actionBtnText}>{t('screens.presupuesto.aceptar')}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            </View>
          ))}
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
    </View>
  );
}


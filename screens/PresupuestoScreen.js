import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Modal, Pressable } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import NuevoPresupuestoModal from './NuevoPresupuestoModal';
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
  content: {
    padding: 0,
  },
  chartsContainer: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginHorizontal: 10,
    marginTop: 10,
    padding: 12,
    marginBottom: 10,
  },
  chartsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#232323',
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
    backgroundColor: '#3AB274',
    height: '100%',
  },
  chartFillPendiente: {
    backgroundColor: '#FF6B6B',
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
    color: '#232323',
  },
  chartLegendItemActive: {
    backgroundColor: '#F2F4F7',
  },
  chartSegmentTouchable: {
    height: '100%',
  },
  chartSegmentActiveShadow: {
    shadowColor: '#000',
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    backgroundColor: '#FFF',
  },
  filterClearText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#344054',
  },
  tableContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#344054',
    borderWidth: 1.5,
    borderColor: '#243447',
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 8,
    borderRadius: 10,
    minHeight: 44,
    alignItems: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7EC',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
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
  actionBtn: {
    backgroundColor: '#3AB274',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 70,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
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
    color: '#4B5563',
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
    borderRadius: 12,
    overflow: 'hidden',
  },
  detailHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#232323',
  },
  detailClose: {
    color: '#666',
    fontWeight: '700',
    fontSize: 13,
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
    color: '#232323',
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
    borderColor: '#F0F0F0',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  detailRowFull: {
    width: '100%',
  },
  detailRowWide: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F3F3',
    borderWidth: 0,
    borderRadius: 0,
    paddingHorizontal: 0,
    marginBottom: 0,
    backgroundColor: 'transparent',
  },
  detailKey: {
    fontSize: 12,
    fontWeight: '700',
    color: '#777',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 13,
    color: '#232323',
    fontWeight: '500',
  },
});

export default function PresupuestoScreen() {
  const ITEMS_PER_PAGE = 100;
  const navigation = useNavigation();
  const [presupuestos, setPresupuestos] = useState([]);
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
  const [modoCreacion, setModoCreacion] = useState('manual');
  const { notificarNuevoPedido } = React.useContext(PedidosContext);

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

  // Cargar presupuestos desde backend
  const cargarPresupuestos = () => {
    setCargando(true);
    fetch('http://localhost:8080/api/presupuestos')
      .then((res) => res.json())
      .then((data) => {
        console.log('Presupuestos recibidos:', data);
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
    cargarModoCreacion();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      cargarModoCreacion();
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
    
    // Primero crear el trabajo
    fetch('http://localhost:8080/api/trabajos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trabajo)
    })
      .then((res) => res.json())
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(presupuestoCompleto)
          })
            .then(() => cargarPresupuestos())
            .catch((err) => console.error('Error guardando presupuesto:', err));
        }
      })
      .catch((err) => console.error('Error creando trabajo:', err));
  };

  const handleAceptarPresupuesto = (presupuesto) => {
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
    
    fetch(`http://localhost:8080/api/presupuestos/aceptar/${presupuesto.trabajo_id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosPresupuesto)
    })
      .then((res) => res.json())
      .then(() => {
        // Actualizar presupuesto localmente
        const updated = presupuestos.map((p) =>
          p.id === presupuesto.id ? { ...p, aprobado: true } : p
        );
        setPresupuestos(updated);
        // Notificar al contexto que hay un nuevo pedido
        notificarNuevoPedido();
        navigation.navigate('Pedidos');
      })
      .catch((err) => console.error('Error aceptando presupuesto:', err));
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
    if (clave === 'aprobado') return valor ? 'Aceptado' : 'Pendiente';
    if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
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
                  <Text style={styles.hoverHintText}>Nuevo presupuesto</Text>
                </View>
              )}
            </View>
          )}
          <Text style={styles.headerTitle}>Presupuestos</Text>
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por cualquier campo..."
          value={busqueda}
          onChangeText={setBusqueda}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.content}>
        <View style={styles.chartsContainer}>
          <Text style={styles.chartsTitle}>Estado de presupuestos</Text>
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
              <View style={[styles.chartLegendDot, { backgroundColor: '#3AB274' }]} />
              <Text style={styles.chartLegendText}>Aprobados: {aprobadosCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chartLegendItem, estadosFiltro.includes('pendiente') && styles.chartLegendItemActive]}
              onPress={() => toggleEstadoFiltro('pendiente')}
            >
              <View style={[styles.chartLegendDot, { backgroundColor: '#FF6B6B' }]} />
              <Text style={styles.chartLegendText}>Pendientes: {pendientesCount}</Text>
            </TouchableOpacity>
          </View>
          {estadosFiltro.length > 0 && (
            <View style={styles.filterRow}>
              <Text style={styles.filterText}>
                Filtro activo: {estadosFiltro.map((estado) => estado === 'aprobado' ? 'Aprobados' : 'Pendientes').join(', ')}
              </Text>
              <TouchableOpacity style={styles.filterClearBtn} onPress={() => setEstadosFiltro([])}>
                <Text style={styles.filterClearText}>Quitar filtro</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {filtrados.length === 0 ? (
        <View style={styles.tableContainer}>
          <Text style={styles.emptyText}>
            {busqueda ? 'No se encontraron resultados' : 'No hay presupuestos'}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <View style={[styles.tableCell, styles.colNumero]}>
              <Text style={styles.headerText}>Número</Text>
            </View>
            <View style={[styles.tableCell, styles.colCliente]}>
              <Text style={styles.headerText}>Cliente</Text>
            </View>
            <View style={[styles.tableCell, styles.colReferencia]}>
              <Text style={styles.headerText}>Referencia</Text>
            </View>
            <View style={[styles.tableCell, styles.colFecha]}>
              <Text style={styles.headerText}>Fecha</Text>
            </View>
            <View style={[styles.tableCell, styles.colEstado]}>
              <Text style={styles.headerText}>Estado</Text>
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
                    {presupuesto.aprobado ? 'Aceptado' : 'Pendiente'}
                  </Text>
                  {!presupuesto.aprobado ? (
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#3AB274' }]} onPress={() => handleAceptarPresupuesto(presupuesto)}>
                      <Text style={styles.actionBtnText}>Aceptar</Text>
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
                <Text style={styles.paginationBtnText}>Anterior</Text>
              </TouchableOpacity>
              <Text style={styles.paginationInfo}>Página {paginaPresupuestos} de {totalPaginasPresupuestos}</Text>
              <TouchableOpacity
                style={[styles.paginationBtn, paginaPresupuestos === totalPaginasPresupuestos && styles.paginationBtnDisabled]}
                onPress={() => setPaginaPresupuestos((prev) => Math.min(totalPaginasPresupuestos, prev + 1))}
                disabled={paginaPresupuestos === totalPaginasPresupuestos}
              >
                <Text style={styles.paginationBtnText}>Siguiente</Text>
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
                Presupuesto {presupuestoSeleccionado?.numero_presupuesto || ''}
              </Text>
              <TouchableOpacity onPress={() => setDetalleVisible(false)}>
                <Text style={styles.detailClose}>Cerrar</Text>
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

      <NuevoPresupuestoModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setEditingInitialValues(null); }}
        onSave={(p) => {
          // Si estamos editando un presupuesto existente, actualizarlo vía API
          if (editingInitialValues && (editingInitialValues.id || editingInitialValues._id)) {
            const presId = editingInitialValues.id || editingInitialValues._id;
            fetch(`http://localhost:8080/api/presupuestos/${presId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
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
        modalTitle={editingInitialValues ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
        submitLabel={editingInitialValues ? 'Guardar Cambios' : 'Guardar Presupuesto'}
        fechaLabel="Fecha de creación"
        showFechaEntrega={true}
        fechaEntregaLabel="Fecha de entrega"
        showMaquinaField={false}
      />
    </View>
  );
}


import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import ProductionBoard from '../components/ProductionBoard';

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
  content: {
    padding: 0,
  },
  sectionContainer: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#232323',
    marginBottom: 10,
  },
  chartsContainer: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 12,
    marginHorizontal: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  chartsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#232323',
    marginBottom: 10,
  },
  verticalChartWrap: {
    height: 96,
  },
  verticalChartContent: {
    alignItems: 'flex-end',
    gap: 14,
    paddingHorizontal: 8,
    paddingRight: 14,
  },
  verticalBarItem: {
    width: 104,
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  verticalBarItemActive: {
    backgroundColor: '#EEF2F6',
  },
  verticalBarValue: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  verticalBarTrack: {
    width: 32,
    height: 56,
    backgroundColor: '#ECEFF1',
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  verticalBarFill: {
    width: '100%',
    borderRadius: 8,
  },
  verticalBarLabel: {
    marginTop: 4,
    fontSize: 9,
    fontWeight: '700',
    color: '#232323',
    textAlign: 'center',
    width: '100%',
  },
  chartFillGreen: {
    backgroundColor: '#3AB274',
  },
  chartFillYellow: {
    backgroundColor: '#F5A623',
  },
  chartFillRed: {
    backgroundColor: '#D64541',
  },
  chartEmpty: {
    fontSize: 12,
    color: '#777',
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
  tableHeaderCell: {
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  headerText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  colPos: {
    width: '5%',
  },
  colNombre: {
    width: '25%',
  },
  colCliente: {
    width: '15%',
  },
  colEstado: {
    width: '18%',
  },
  colFechaPedido: {
    width: '12%',
  },
  colFechaEntrega: {
    width: '12%',
  },
  colRetraso: {
    width: '8%',
    alignItems: 'center',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: '#3AB274',
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3AB274',
  },
  checkmark: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#3AB274',
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3AB274',
  },
  checkmark: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  maquinaSelect: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  selectButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#F5F5F5',
  },
  selectButtonText: {
    fontSize: 12,
    color: '#232323',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    backgroundColor: '#F8F9FA',
    marginBottom: 2,
    alignItems: 'center',
  },
  rowAlternate: {
    backgroundColor: '#EEF1F4',
  },
  tableCell: {
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cellText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#232323',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  cellControls: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    width: '5%',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 20,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    color: '#232323',
  },
  maquinaOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  maquinaOptionText: {
    fontSize: 14,
    color: '#232323',
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 10,
    backgroundColor: '#EEE',
    borderRadius: 4,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#232323',
  },
  // Estados de color
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
  // Semáforo para retraso
  retrasoContainer: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retrasoVerde: {
    backgroundColor: '#E8F5E9',
  },
  retrasoAmarillo: {
    backgroundColor: '#FFF3E0',
  },
  retrasoRojo: {
    backgroundColor: '#FFEBEE',
  },
  retrasoVerdeText: {
    color: '#2E7D32',
  },
  retrasoAmarilloText: {
    color: '#F57C00',
  },
  retrasoRojoText: {
    color: '#D32F2F',
  },
});

const getRetrasoStyle = (dias) => {
  const styles = StyleSheet.create({
    retrasoContainer: {
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 4,
      justifyContent: 'center',
      alignItems: 'center',
    },
    retrasoVerde: {
      backgroundColor: '#E8F5E9',
    },
    retrasoAmarillo: {
      backgroundColor: '#FFF3E0',
    },
    retrasoRojo: {
      backgroundColor: '#FFEBEE',
    },
  });
  if (dias <= 0) return [styles.retrasoContainer, styles.retrasoVerde];
  else if (dias <= 3) return [styles.retrasoContainer, styles.retrasoAmarillo];
  else return [styles.retrasoContainer, styles.retrasoRojo];
};

const getRetrasoTextStyle = (dias) => {
  const styles = StyleSheet.create({
    retrasoText: {
      fontWeight: '600',
    },
    retrasoVerdeText: {
      color: '#2E7D32',
    },
    retrasoAmarilloText: {
      color: '#F57C00',
    },
    retrasoRojoText: {
      color: '#D32F2F',
    },
  });
  if (dias <= 0) return [styles.retrasoText, styles.retrasoVerdeText];
  else if (dias <= 3) return [styles.retrasoText, styles.retrasoAmarilloText];
  else return [styles.retrasoText, styles.retrasoRojoText];
};

export default function ProduccionScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const [maquinas, setMaquinas] = useState([]);
  const [trabajosPorMaquina, setTrabajosPorMaquina] = useState({});
  const [trabajosPages, setTrabajosPages] = useState({});
  const [trabajosTotals, setTrabajosTotals] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busquedaProduccion, setBusquedaProduccion] = useState('');
  const [maquinasFiltroIds, setMaquinasFiltroIds] = useState([]);
  const maquinaInicial = route?.params?.maquinaId || null;
  const LOCALSTORAGE_KEY = 'pfp_maquinasFiltro';

  const getCargaPorMaquina = () => {
    const cargas = maquinas.map((maq) => {
      const cantidad = (trabajosPorMaquina[maq.id] || []).length;
      return { id: String(maq.id), nombre: maq.nombre, cantidad };
    });
    return { cargas };
  };

  const getMachineTone = (maquinaId) => {
    const palette = ['#3AB274', '#2E86DE', '#8E44AD', '#F39C12', '#E67E22', '#16A085', '#D64541', '#6C5CE7'];
    const index = Math.abs(Number(maquinaId) || 0) % palette.length;
    return palette[index];
  };

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'diseno':
        return [styles.statusDiseno, styles.statusDisenoText];
      case 'pendiente-de-aprobacion':
        return [styles.statusPendienteAprobacion, styles.statusPendienteAprobacionText];
      case 'pendiente-de-cliche':
        return [styles.statusPendienteCliche, styles.statusPendienteClicheText];
      case 'pendiente-de-impresion':
        return [styles.statusPendienteImpresion, styles.statusPendienteImpresionText];
      case 'pendiente-post-impresion':
        return [styles.statusPendientePostImpresion, styles.statusPendientePostImpresionText];
      case 'finalizado':
        return [styles.statusFinalizado, styles.statusFinalizadoText];
      case 'parado':
        return [styles.statusParado, styles.statusParadoText];
      case 'cancelado':
        return [styles.statusCancelado, styles.statusCanceladoText];
      default:
        return [styles.statusDiseno, styles.statusDisenoText];
    }
  };

  const getStatusLabel = (estado) => {
    const labels = {
      'diseno': 'Diseño',
      'pendiente-de-aprobacion': 'Pendiente de Aprobación',
      'pendiente-de-cliche': 'Pendiente de Cliché',
      'pendiente-de-impresion': 'Pendiente de Impresión',
      'pendiente-post-impresion': 'Pendiente Post-Impresión',
      'finalizado': 'Finalizado',
      'parado': 'Parado',
      'cancelado': 'Cancelado',
    };
    return labels[estado] || (estado || 'Pendiente');
  };

  const fetchData = async (options = {}) => {
    const silent = options.silent === true;
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      console.log('Conectando a http://localhost:8080/api/maquinas...');
      const maquinasRes = await fetch('http://localhost:8080/api/maquinas');
      const maquinasData = await maquinasRes.json();
      setMaquinas(maquinasData.maquinas || []);

      // Cargar trabajos para cada máquina (colas de producción: excluir parado, cancelado y finalizado)
      const trabajosObj = {};
      const totalsObj = {};
      for (const maq of maquinasData.maquinas || []) {
        const maquinaNombreEncoded = encodeURIComponent(maq.nombre);
        // Request first page for each machine to avoid loading huge lists at once
        const trabajosRes = await fetch(`http://localhost:8080/api/produccion?maquina=${maq.id}&maquina_nombre=${maquinaNombreEncoded}&page=1&page_size=100`);
        const trabajosData = await trabajosRes.json();

        // Filtrar trabajos: excluir parado, cancelado y finalizado
        const trabajosMaqFiltrados = (trabajosData.trabajos || []).filter(trabajo => {
          if (trabajo.estado === 'parado' || trabajo.estado === 'cancelado' || trabajo.estado === 'finalizado') {
            return false;
          }
          return true;
        });

        trabajosObj[maq.id] = trabajosMaqFiltrados;
        // marca que ya cargamos la página 1 para esta máquina
        setTrabajosPages((p) => ({ ...p, [String(maq.id)]: 1 }));
        // Registrar total devuelto por la API (si está disponible) para paginación
        if (trabajosData && typeof trabajosData.total !== 'undefined') {
          totalsObj[maq.id] = trabajosData.total;
        } else {
          totalsObj[maq.id] = trabajosMaqFiltrados.length;
        }
      }
      setTrabajosPorMaquina(trabajosObj);
      setTrabajosTotals(totalsObj);
    } catch (e) {
      console.error('Error cargando datos:', e);
      setError(e.message);
    }
    if (!silent) {
      setLoading(false);
    }
  };

  // Fetch a specific page for a machine and append unique items
  const fetchPageForMachine = async (maquinaId, page) => {
    try {
      // if page not provided, use next page after last loaded
      const last = trabajosPages[String(maquinaId)] || 1;
      const targetPage = page || (last + 1);
      const trabajosRes = await fetch(`http://localhost:8080/api/produccion?maquina=${maquinaId}&page=${targetPage}&page_size=100`);
      if (!trabajosRes.ok) return false;
      const trabajosData = await trabajosRes.json();
      const paginaTrabajos = (trabajosData.trabajos || []).filter(trabajo => !(trabajo.estado === 'parado' || trabajo.estado === 'cancelado' || trabajo.estado === 'finalizado'));

      setTrabajosPorMaquina((prev) => {
        const existente = Array.isArray(prev[maquinaId]) ? prev[maquinaId].slice() : [];
        const ids = new Set(existente.map(t => String(t.id || t.trabajo_id || '')));
        let added = 0;
        for (const t of paginaTrabajos) {
          const key = String(t.id || t.trabajo_id || '');
          if (!ids.has(key)) {
            existente.push(t);
            ids.add(key);
            added++;
          }
        }
        const nuevo = { ...prev, [maquinaId]: existente };
        // actualizar la página cargada
        setTrabajosPages((p) => ({ ...p, [String(maquinaId)]: targetPage }));
        return nuevo;
      });

      if (trabajosData && typeof trabajosData.total !== 'undefined') {
        setTrabajosTotals((prev) => ({ ...prev, [maquinaId]: trabajosData.total }));
      }
      return true;
    } catch (e) {
      console.error('Error fetchPageForMachine', e);
      return false;
    }
  };

  // Fetch a page for global search (no maquina param) and either replace (page=1) or append (page>1)
  const fetchSearchPage = async (page = 1) => {
    if (!busquedaProduccion || busquedaProduccion.trim() === '') return false;
    try {
      const q = encodeURIComponent(busquedaProduccion.trim());
      const res = await fetch(`http://localhost:8080/api/produccion?search=${q}&page=${page}&page_size=100`);
      if (!res.ok) return false;
      const data = await res.json();
      const paginaTrabajos = (data.trabajos || []).filter(trabajo => !(trabajo.estado === 'parado' || trabajo.estado === 'cancelado' || trabajo.estado === 'finalizado'));

      // Group by maquina and either replace (page=1) or append
      const agrupado = {};
      for (const t of paginaTrabajos) {
        const maqId = String(t.maquina_id || t._maquina_id || t.maquina || 'sin_maquina');
        agrupado[maqId] = agrupado[maqId] || [];
        agrupado[maqId].push(t);
      }

      setTrabajosPorMaquina((prev) => {
        const nuevo = { ...prev };
        for (const [mid, lista] of Object.entries(agrupado)) {
          if (page === 1) {
            nuevo[mid] = lista;
          } else {
            const existente = Array.isArray(nuevo[mid]) ? nuevo[mid].slice() : [];
            const ids = new Set(existente.map(t => String(t.id || t.trabajo_id || '')));
            for (const t of lista) {
              const key = String(t.id || t.trabajo_id || '');
              if (!ids.has(key)) {
                existente.push(t);
                ids.add(key);
              }
            }
            nuevo[mid] = existente;
          }
        }
        return nuevo;
      });

      // update totals if provided
      if (data && typeof data.total !== 'undefined') {
        // when searching globally, store total under special key 'search' so ProductionBoard can still read it per-machine if desired
        setTrabajosTotals((prev) => ({ ...prev, search_total: data.total }));
        // record last loaded search page
        setTrabajosPages((p) => ({ ...p, search: page }));
      }
      return true;
    } catch (e) {
      console.error('Error fetchSearchPage', e);
      return false;
    }
  };

  // handler passed to ProductionBoard to request a page load
  const handleRequestPage = async (maquinaId, page) => {
    if (busquedaProduccion && busquedaProduccion.trim() !== '') {
      return await fetchSearchPage(page);
    }
    return await fetchPageForMachine(maquinaId, page);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // When the search term changes, perform server-side search across all records (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      (async () => {
        if (busquedaProduccion && busquedaProduccion.trim() !== '') {
          await fetchSearchPage(1);
        } else {
          await fetchData({ silent: true });
        }
      })();
    }, 300);
    return () => clearTimeout(timer);
  }, [busquedaProduccion]);

  useFocusEffect(
    React.useCallback(() => {
      fetchData({ silent: true });
    }, [])
  );

  useEffect(() => {
    if (route?.params?.maquinaId) {
      navigation.setParams({ maquinaId: undefined });
    }
  }, [route?.params?.maquinaId]);

  useEffect(() => {
    if (!maquinas || maquinas.length === 0) return;

    if (maquinasFiltroIds.length > 0) {
      const idsValidos = maquinasFiltroIds.filter((id) => maquinas.some((m) => String(m.id) === String(id)));
      const idsNormalizados = idsValidos.length > 1 ? [String(idsValidos[0])] : idsValidos.map(String);
      if (idsNormalizados.length !== maquinasFiltroIds.length || idsNormalizados[0] !== maquinasFiltroIds[0]) {
        setMaquinasFiltroIds(idsNormalizados);
      }
      return;
    }

    if (maquinaInicial && maquinas.some((m) => String(m.id) === String(maquinaInicial))) {
      setMaquinasFiltroIds([String(maquinaInicial)]);
    }
  }, [maquinas, maquinasFiltroIds, maquinaInicial]);

  // Cargar filtro persistente desde localStorage al montar
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCALSTORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMaquinasFiltroIds(parsed.map(String));
        }
      }
    } catch (e) {
      console.warn('No se pudo leer filtro persistente:', e);
    }
  }, []);

  // Persistir filtro en localStorage cuando cambie
  useEffect(() => {
    try {
      if (maquinasFiltroIds && maquinasFiltroIds.length > 0) {
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(maquinasFiltroIds.map(String)));
      } else {
        localStorage.removeItem(LOCALSTORAGE_KEY);
      }
    } catch (e) {
      console.warn('No se pudo guardar filtro persistente:', e);
    }
  }, [maquinasFiltroIds]);

  const toggleMaquinaFiltro = (maquinaId) => {
    const maquinaIdStr = String(maquinaId);
    setMaquinasFiltroIds((prev) => (prev.includes(maquinaIdStr) ? [] : [maquinaIdStr]));
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text>Cargando producción...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: 'red', fontSize: 16, marginBottom: 10 }}>Error:</Text>
        <Text style={{ fontSize: 14, textAlign: 'center' }}>{error}</Text>
        <Text style={{ fontSize: 12, marginTop: 20, color: '#666' }}>Verifica que el backend esté corriendo en http://localhost:8080</Text>
      </View>
    );
  }

  if (!maquinas || maquinas.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 16, marginBottom: 10 }}>No hay máquinas configuradas</Text>
        <Text style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>Debes agregar máquinas en el backend primero</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>Producción</Text>
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar en producción por cualquier campo..."
          value={busquedaProduccion}
          onChangeText={setBusquedaProduccion}
          placeholderTextColor="#999"
        />
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.chartsContainer}>
          <Text style={styles.chartsTitle}>
            Carga de trabajo por máquina ({Object.values(trabajosPorMaquina || {}).reduce((sum, trabajos) => sum + (Array.isArray(trabajos) ? trabajos.length : 0), 0)} trabajos asignados)
          </Text>
          {(() => {
            const { cargas } = getCargaPorMaquina();
            if (cargas.length === 0) {
              return <Text style={styles.chartEmpty}>No hay máquinas para mostrar.</Text>;
            }
            const maxCarga = Math.max(...cargas.map((c) => c.cantidad), 1);
            return (
              <View style={styles.verticalChartWrap}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.verticalChartContent}>
                  {cargas.map((carga) => {
                    const heightPct = Math.max(6, (carga.cantidad / maxCarga) * 100);
                    const tone = getMachineTone(carga.id);
                    const activa = maquinasFiltroIds.includes(String(carga.id));
                    const hayFiltroActivo = maquinasFiltroIds.length > 0;
                    return (
                      <TouchableOpacity
                        key={carga.id}
                        style={[
                          styles.verticalBarItem,
                          activa && styles.verticalBarItemActive,
                          activa ? { borderWidth: 2, borderColor: getMachineTone(carga.id) } : null,
                          hayFiltroActivo && !activa ? { opacity: 0.35 } : null,
                        ]}
                        onPress={() => toggleMaquinaFiltro(carga.id)}
                      >
                        <Text style={[styles.verticalBarValue, { color: tone }]}>{carga.cantidad}</Text>
                        <View style={styles.verticalBarTrack}>
                          <View style={[styles.verticalBarFill, { height: `${heightPct}%`, backgroundColor: tone }]} />
                        </View>
                        <Text style={styles.verticalBarLabel} numberOfLines={1}>{carga.nombre}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            );
          })()}
          {maquinasFiltroIds.length > 0 && (
            <View style={styles.filterRow}>
                <Text style={styles.filterText}>
                Filtro activo: {maquinas
                  .filter((m) => maquinasFiltroIds.includes(String(m.id)))
                  .map((m) => m.nombre)
                  .join('')}
              </Text>
              <TouchableOpacity style={styles.filterClearBtn} onPress={() => setMaquinasFiltroIds([])}>
                <Text style={styles.filterClearText}>Quitar filtro</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Production Board - Trabajos en Producción */}
        <ProductionBoard 
          maquinas={maquinas} 
          trabajosPorMaquina={trabajosPorMaquina}
          trabajosTotals={trabajosTotals}
          searchText={busquedaProduccion}
          initialMaquinaId={maquinaInicial}
          maquinaActivaIds={maquinasFiltroIds}
          onRefresh={() => fetchData({ silent: true })}
          onRequestPage={handleRequestPage}
        />
      </ScrollView>
    </View>
  );
}

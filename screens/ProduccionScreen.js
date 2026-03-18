import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRoute } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import ProductionBoard from '../components/ProductionBoard';
import EmptyState from '../components/EmptyState';
import { useMaquinas } from '../MaquinasContext';
import { useSettings } from '../SettingsContext';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F3EE',
  },
  header: {
    backgroundColor: '#111014',
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
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CFC0AE',
    paddingHorizontal: 11,
    paddingVertical: 5,
    fontSize: 12,
    color: '#0F172A',
    width: '62%',
    alignSelf: 'center',
  },
  content: {
    padding: 0,
  },
  sectionContainer: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E6DAD0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  chartsContainer: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E6DAD0',
    padding: 12,
    marginHorizontal: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  chartsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
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
    backgroundColor: '#F8F3EE',
  },
  verticalBarValue: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  verticalBarTrack: {
    width: 32,
    height: 56,
    backgroundColor: '#E6DAD0',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  verticalBarFill: {
    width: '100%',
    borderRadius: 6,
  },
  verticalBarLabel: {
    marginTop: 4,
    fontSize: 9,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    width: '100%',
  },
  chartFillGreen: {
    backgroundColor: '#E55A2B',
  },
  chartFillYellow: {
    backgroundColor: '#F5A623',
  },
  chartFillRed: {
    backgroundColor: '#D64541',
  },
  chartEmpty: {
    fontSize: 12,
    color: '#475569',
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
    color: '#0F172A',
    flex: 1,
  },
  filterClearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E6DAD0',
    backgroundColor: '#FFF',
  },
  filterClearText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E6DAD0',
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
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
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
    borderColor: '#E55A2B',
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#E55A2B',
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
    borderColor: '#E55A2B',
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#E55A2B',
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
    borderColor: '#E6DAD0',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#F1F5F9',
  },
  selectButtonText: {
    fontSize: 12,
    color: '#0F172A',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E6DAD0',
    backgroundColor: '#F1F5F9',
    marginBottom: 1,
    alignItems: 'center',
  },
  rowAlternate: {
    backgroundColor: '#F8F3EE',
  },
  tableCell: {
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cellText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0F172A',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
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
    borderRadius: 18,
    padding: 20,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    color: '#0F172A',
  },
  maquinaOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E6DAD0',
  },
  maquinaOptionText: {
    fontSize: 14,
    color: '#0F172A',
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 10,
    backgroundColor: '#F8F3EE',
    borderRadius: 6,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
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
    backgroundColor: '#F1F5F9',
  },
  statusCanceladoText: {
    color: '#94A3B8',
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
  // Sección trabajos impresos
  impresosSection: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E6DAD0',
    marginHorizontal: 10,
    marginTop: 6,
    marginBottom: 16,
    overflow: 'hidden',
  },
  impresosSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F1F5F9',
  },
  impresosTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  impresosSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  impresosBadge: {
    backgroundColor: '#16A34A',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  impresosBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },
  impresosChevron: {
    fontSize: 12,
    color: '#64748B',
  },
  impresosBody: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  impresosBusqueda: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E6DAD0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: '#0F172A',
    marginBottom: 10,
  },
  impresosEmpty: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 10,
  },
  impresosTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8F3EE',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 6,
    marginBottom: 2,
  },
  impresosColHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  impresosTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F3EE',
  },
  impresosTableRowAlt: {
    backgroundColor: '#F1F5F9',
  },
  impresosCell: {
    fontSize: 12,
    color: '#0F172A',
  },
  impresosColNombre: {
    flex: 3,
    paddingRight: 6,
  },
  impresosColRef: {
    flex: 2,
    paddingRight: 6,
    color: '#475569',
  },
  impresosColCliente: {
    flex: 2,
    paddingRight: 6,
  },
  impresosColEstado: {
    flex: 2,
    paddingRight: 6,
  },
  impresosColFecha: {
    flex: 2,
    color: '#64748B',
  },
  impresosEstadoBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  impresosEstadoText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#388E3C',
  },
  impresosHint: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
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
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const { maquinas } = useMaquinas();
  const maquinasRef = useRef(maquinas);
  useEffect(() => { maquinasRef.current = maquinas; }, [maquinas]);
  const { estadoRules } = useSettings();
  const estadoRulesRef = useRef(estadoRules);
  useEffect(() => { estadoRulesRef.current = estadoRules; }, [estadoRules]);
  const [trabajosPorMaquina, setTrabajosPorMaquina] = useState({});
  const [trabajosPages, setTrabajosPages] = useState({});
  const [trabajosTotals, setTrabajosTotals] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busquedaProduccion, setBusquedaProduccion] = useState('');
  const [maquinasFiltroIds, setMaquinasFiltroIds] = useState([]);
  const [trabajosImpresos, setTrabajosImpresos] = useState([]);
  const [impresosExpanded, setImpresosExpanded] = useState(false);
  const [busquedaImpresos, setBusquedaImpresos] = useState('');
  const maquinaInicial = route?.params?.maquinaId || null;
  const LOCALSTORAGE_KEY = 'pfp_maquinasFiltro';

  const getCargaPorMaquina = () => {
    const cargas = maquinas.map((maq) => {
      const cantidad = (trabajosPorMaquina[maq.id] || []).length;
      return { id: String(maq.id), nombre: maq.nombre, cantidad };
    });
    return { cargas };
  };

  const getWorkloadColor = (cantidad, maxCarga) => {
    if (cantidad === 0) return '#94A3B8'; // sin carga → gris
    const ratio = maxCarga > 0 ? cantidad / maxCarga : 0;
    // Interpolación 3 paradas: verde → amarillo → rojo
    let r, g, b;
    if (ratio <= 0.5) {
      const t = ratio / 0.5;
      r = Math.round(22  + (245 - 22)  * t); // #16A34A → #F59E0B
      g = Math.round(163 + (158 - 163) * t);
      b = Math.round(74  + (11  - 74)  * t);
    } else {
      const t = (ratio - 0.5) / 0.5;
      r = Math.round(245 + (220 - 245) * t); // #F59E0B → #DC2626
      g = Math.round(158 + (38  - 158) * t);
      b = Math.round(11  + (38  - 11)  * t);
    }
    return `rgb(${r}, ${g}, ${b})`;
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

  const generateColorFromHash = (text) => {
    // Normalizar el texto antes de hacer hash para consistencia
    const normalized = slugifyEstado(text);
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const vibrantes = [
      '#E91E63', '#2196F3', '#00BCD4', '#4CAF50', '#FFC107',
      '#FF5722', '#9C27B0', '#3F51B5', '#009688', '#FF6F00',
    ];
    const index = Math.abs(hash) % vibrantes.length;
    return vibrantes[index];
  };

  const getStatusColor = (estado) => {
    const slug = slugifyEstado(estado);
    const color = generateColorFromHash(slug);
    switch (slug) {
      case 'en-diseno':
      case 'diseno': // compat con pedidos antiguos
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
        // Para estados nuevos
        const backgroundColor = color + '20';
        const textColor = color;
        return [
          { ...styles.statusBadge, backgroundColor },
          { ...styles.statusText, color: textColor }
        ];
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
      // Cargar trabajos para cada máquina (colas de producción: excluir parado, cancelado y finalizado)
      const trabajosObj = {};
      const totalsObj = {};
      for (const maq of maquinasRef.current) {
        const maquinaNombreEncoded = encodeURIComponent(maq.nombre);
        // Request first page for each machine to avoid loading huge lists at once
        const trabajosRes = await fetch(`http://localhost:8080/api/produccion?maquina=${maq.id}&maquina_nombre=${maquinaNombreEncoded}&page=1&page_size=100`);
        const trabajosData = await trabajosRes.json();

        // Filtrar trabajos: excluir trabajos que NO están en producción
        const rules = estadoRulesRef.current || {};
        const finalizadosSlugs = new Set(rules.estados_finalizados?.length ? rules.estados_finalizados : ['finalizado']);
        const pausadosSlugs = new Set(rules.estados_pausados?.length ? rules.estados_pausados : ['parado', 'cancelado']);
        const slugify = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        const trabajosMaqFiltrados = (trabajosData.trabajos || []).filter(trabajo => {
          const slug = slugify(trabajo.estado);

          // Excluir finalizados y pausados según configuración
          if (finalizadosSlugs.has(slug) || pausadosSlugs.has(slug)) return false;

          // Excluir estados de diseño/aprobación/cliché (etapas previas a producción)
          if (slug.includes('disen') || slug.includes('aprobac') || slug.includes('cliche')) {
            return false;
          }

          // Incluir todos los demás (pendiente-de-impresion, en-proceso, etc.)
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

      // Cargar histórico completo de trabajos impresos
      try {
        const token = global.__MIAPP_ACCESS_TOKEN;
        const impresosRes = await fetch(
          'http://localhost:8080/api/produccion/impresos?all=1',
          token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
        );
        if (impresosRes.ok) {
          const impresosData = await impresosRes.json();
          setTrabajosImpresos(impresosData.impresos || []);
        }
      } catch (_e) {
        // impresos section is non-critical
      }

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
      const paginaTrabajos = (trabajosData.trabajos || []).filter(trabajo => {
        const rules = estadoRulesRef.current || {};
        const fin = new Set(rules.estados_finalizados?.length ? rules.estados_finalizados : ['finalizado']);
        const pau = new Set(rules.estados_pausados?.length ? rules.estados_pausados : ['parado', 'cancelado']);
        const sl = String(trabajo.estado || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        return !fin.has(sl) && !pau.has(sl);
      });

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
      const paginaTrabajos = (data.trabajos || []).filter(trabajo => {
        const rules = estadoRulesRef.current || {};
        const fin = new Set(rules.estados_finalizados?.length ? rules.estados_finalizados : ['finalizado']);
        const pau = new Set(rules.estados_pausados?.length ? rules.estados_pausados : ['parado', 'cancelado']);
        const sl = String(trabajo.estado || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        return !fin.has(sl) && !pau.has(sl);
      });

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
    if (maquinas.length > 0) fetchData();
  }, [maquinas]);

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
      <View style={{ flex: 1, backgroundColor: '#F8F3EE' }}>
        <EmptyState
          icon="⚙️"
          title={t('screens.maquinas.noMaquinas')}
          message={t('screens.produccion.sinMaquinas')}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={{ width: 38 }} />
          <Text style={styles.headerTitle}>{t('nav.produccion')}</Text>
          <View style={{ width: 38 }} />
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder={t('screens.produccion.buscarPlaceholder')}
          value={busquedaProduccion}
          onChangeText={setBusquedaProduccion}
          placeholderTextColor="#94A3B8"
        />
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.chartsContainer}>
          <Text style={styles.chartsTitle}>
            {t('screens.produccion.cargaPorMaquina', { count: Object.values(trabajosPorMaquina || {}).reduce((sum, trabajos) => sum + (Array.isArray(trabajos) ? trabajos.length : 0), 0) })}
          </Text>
          {(() => {
            const { cargas } = getCargaPorMaquina();
            if (cargas.length === 0) {
              return <Text style={styles.chartEmpty}>{t('screens.produccion.sinMaquinas')}</Text>;
            }
            const maxCarga = Math.max(...cargas.map((c) => c.cantidad), 1);
            return (
              <View style={styles.verticalChartWrap}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.verticalChartContent}>
                  {cargas.map((carga) => {
                    const heightPct = Math.max(6, (carga.cantidad / maxCarga) * 100);
                    const tone = getWorkloadColor(carga.cantidad, maxCarga);
                    const activa = maquinasFiltroIds.includes(String(carga.id));
                    const hayFiltroActivo = maquinasFiltroIds.length > 0;
                    return (
                      <TouchableOpacity
                        key={carga.id}
                        style={[
                          styles.verticalBarItem,
                          activa && styles.verticalBarItemActive,
                          activa ? { borderWidth: 2, borderColor: tone } : null,
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
                {t('screens.produccion.filtroActivo', { estados: maquinas
                  .filter((m) => maquinasFiltroIds.includes(String(m.id)))
                  .map((m) => m.nombre)
                  .join('') })}
              </Text>
              <TouchableOpacity style={styles.filterClearBtn} onPress={() => setMaquinasFiltroIds([])}>
                <Text style={styles.filterClearText}>{t('screens.produccion.quitarFiltro')}</Text>
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

        {/* Trabajos Impresos */}
        <View style={styles.impresosSection}>
          <TouchableOpacity
            style={styles.impresosSectionHeader}
            onPress={() => setImpresosExpanded((v) => !v)}
            activeOpacity={0.7}
          >
            <View style={styles.impresosTitleRow}>
              <Text style={styles.impresosSectionTitle}>
                {t('screens.produccion.impresosTitle')}
              </Text>
              {trabajosImpresos.length > 0 && (
                <View style={styles.impresosBadge}>
                  <Text style={styles.impresosBadgeText}>{trabajosImpresos.length}</Text>
                </View>
              )}
            </View>
            <Text style={styles.impresosChevron}>{impresosExpanded ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {impresosExpanded && (
            <View style={styles.impresosBody}>
              <TextInput
                style={styles.impresosBusqueda}
                placeholder={t('common.searchAny')}
                placeholderTextColor="#94A3B8"
                value={busquedaImpresos}
                onChangeText={setBusquedaImpresos}
              />
              {/* Cabecera de columnas */}
              <View style={styles.impresosTableHeader}>
                <Text style={[styles.impresosColHeader, styles.impresosColNombre]}>{t('screens.produccion.colPedido')}</Text>
                <Text style={[styles.impresosColHeader, styles.impresosColRef]}>{t('forms.referencia')}</Text>
                <Text style={[styles.impresosColHeader, styles.impresosColCliente]}>{t('screens.produccion.colCliente')}</Text>
                <Text style={[styles.impresosColHeader, styles.impresosColEstado]}>{t('screens.produccion.colEstado')}</Text>
                <Text style={[styles.impresosColHeader, styles.impresosColFecha]}>{t('screens.produccion.colFechaImpresion')}</Text>
              </View>
              {(() => {
                const q = busquedaImpresos.trim().toLowerCase();
                const filtrados = q
                  ? trabajosImpresos.filter((tj) => {
                      const cliente = typeof tj.cliente === 'string' ? tj.cliente : (tj.cliente?.nombre || '');
                      return (
                        (tj.nombre || '').toLowerCase().includes(q) ||
                        (tj.referencia || '').toLowerCase().includes(q) ||
                        cliente.toLowerCase().includes(q) ||
                        (tj.numero_pedido || '').toLowerCase().includes(q)
                      );
                    })
                  : trabajosImpresos;
                if (filtrados.length === 0) {
                  return <Text style={styles.impresosEmpty}>{t('screens.produccion.impresosEmpty')}</Text>;
                }
                return filtrados.map((trabajo, idx) => {
                  const fechaImp = trabajo.fecha_impresion
                    ? new Date(trabajo.fecha_impresion).toLocaleString()
                    : '—';
                  const clienteNombre = typeof trabajo.cliente === 'string' ? trabajo.cliente : (trabajo.cliente?.nombre || '');
                  return (
                    <View key={String(trabajo._id || trabajo.id)} style={[styles.impresosTableRow, idx % 2 === 1 && styles.impresosTableRowAlt]}>
                      <Text style={[styles.impresosCell, styles.impresosColNombre]} numberOfLines={1}>
                        {trabajo.nombre || trabajo.numero_pedido || '—'}
                      </Text>
                      <Text style={[styles.impresosCell, styles.impresosColRef, { fontStyle: 'italic' }]} numberOfLines={1}>
                        {trabajo.referencia || '—'}
                      </Text>
                      <Text style={[styles.impresosCell, styles.impresosColCliente]} numberOfLines={1}>
                        {clienteNombre || '—'}
                      </Text>
                      <View style={[styles.impresosColEstado, { flexDirection: 'row', alignItems: 'center' }]}>
                        {trabajo.estado ? (
                          <View style={styles.impresosEstadoBadge}>
                            <Text style={styles.impresosEstadoText} numberOfLines={1}>{trabajo.estado}</Text>
                          </View>
                        ) : <Text style={styles.impresosCell}>—</Text>}
                      </View>
                      <Text style={[styles.impresosCell, styles.impresosColFecha]} numberOfLines={1}>
                        {fechaImp}
                      </Text>
                    </View>
                  );
                });
              })()}
              <Text style={styles.impresosHint}>{t('screens.produccion.impresosHint')}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Modal, Alert, Platform, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useGridColumns } from '../hooks/useGridColumns';
import ColumnSelector from '../components/ColumnSelector';
import NuevoTroquelModal from './NuevoTroquelModal';
import TroquelImportModal from './TroquelImportModal';
import { usePermission } from './usePermission';
import EmptyState from '../components/EmptyState';
import DeleteConfirmRow from '../components/DeleteConfirmRow';
import * as XLSX from 'xlsx';

function calcularSiguienteNumeroTroquel(lista) {
  let maxNumero = 0;
  let prefijo = 'TR-';
  let ancho = 3;

  (lista || []).forEach((troquel) => {
    const raw = String(troquel?.numero || troquel?.referencia || '').trim();
    const match = raw.match(/^([^\d]*?)(\d+)$/);
    if (!match) return;

    const prefijoActual = match[1] || prefijo;
    const numeroTexto = match[2];
    const numero = parseInt(numeroTexto, 10);

    if (Number.isNaN(numero)) return;
    if (numero > maxNumero) {
      maxNumero = numero;
      prefijo = prefijoActual;
      ancho = Math.max(3, numeroTexto.length);
    }
  });

  const siguiente = maxNumero + 1;
  return `${prefijo}${String(siguiente).padStart(ancho, '0')}`;
}

function normalizarClave(clave) {
  return String(clave || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

function parseCsvLine(linea) {
  const campos = [];
  let actual = '';
  let enComillas = false;

  for (let i = 0; i < linea.length; i += 1) {
    const ch = linea[i];

    if (ch === '"') {
      if (enComillas && linea[i + 1] === '"') {
        actual += '"';
        i += 1;
      } else {
        enComillas = !enComillas;
      }
      continue;
    }

    if (ch === ',' && !enComillas) {
      campos.push(actual);
      actual = '';
      continue;
    }

    actual += ch;
  }

  campos.push(actual);
  return campos.map((v) => String(v || '').trim());
}

function normalizarNumeroTroquel(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizarRolActivo(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function normalizarTipoTroquel(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (['regular', 'irregular', 'corbata'].includes(raw)) return raw;
  return 'regular';
}

function formaPorTipo(tipo) {
  if (tipo === 'irregular') return 'Irregular';
  if (tipo === 'corbata') return 'Corbata';
  return 'Rectangular';
}

function construirTroquelDesdeFila(row, fallbackNumero) {
  const tipo = normalizarTipoTroquel(row.tipo || row.tipo_troquel);
  const numero = String(row.numero || row.numero_troquel || row.referencia || fallbackNumero || '').trim();
  const forma = String(row.forma || row.tipo_forma || '').trim() || formaPorTipo(tipo);
  const estado = String(row.estado || '').trim() || 'Disponible';

  return {
    id: Date.now() + Math.floor(Math.random() * 1000000),
    numero,
    referencia: numero,
    tipo,
    forma,
    estado,
    anchoMotivo: String(row.ancho_motivo || row.ancho || '').trim(),
    altoMotivo: String(row.alto_motivo || row.alto || '').trim(),
    motivosAncho: String(row.motivos_ancho || row.motivos || '').trim(),
    separacionAncho: String(row.separacion_ancho || row.separacion || '').trim(),
    valorZ: String(row.valor_z || row.valorz || '').trim(),
    distanciaSesgado: String(row.distancia_sesgado || row.sesgado || '').trim(),
  };
}

const API_TROQUELES = 'http://localhost:8080/api/troqueles';

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
  btn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnNew: {
    borderColor: '#CBD5E1',
  },
  btnNewText: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  btnImport: {
    borderColor: '#E4E7ED',
  },
  btnImportTop: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minHeight: 32,
    justifyContent: 'center',
  },
  btnImportTopText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '600',
  },
  btnText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 13,
  },
  btnPlusWrap: {
    position: 'relative',
  },
  btnPlus: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnPlusDisabled: {
    backgroundColor: '#A5B4FC',
  },
  btnPlusText: {
    color: '#FFFFFF',
    fontWeight: '700',
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
  tableContent: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECEFFE',
    borderWidth: 1,
    borderColor: '#D9DBFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderRadius: 10,
    minHeight: 40,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 4,
    cursor: 'pointer',
    shadowColor: '#1E1B4B',
    shadowOpacity: 0.03,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  rowAlternate: {
    backgroundColor: '#FAFBFF',
  },
  tableCell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  cellText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0F172A',
    textAlign: 'center',
  },
  colNumero:    { flex: 0.13 },
  colTipo:      { flex: 0.12 },
  colAncho:     { flex: 0.10 },
  colAlto:      { flex: 0.10 },
  colMotivos:   { flex: 0.09 },
  colSeparacion:{ flex: 0.11 },
  colValorZ:    { flex: 0.09 },
  colSesgado:   { flex: 0.11 },
  colEstado:    { flex: 0.11 },
  colAcciones:  { flex: 0.10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  actionBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  deleteBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    textAlign: 'center',
    alignSelf: 'flex-start',
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardText: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 6,
  },
  cardDetails: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
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
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  btnCancel: {
    backgroundColor: '#EEF2F8',
  },
  detailHeadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
});

const TROQUELES_COL_DEFS = (t) => [
  { key: 'numero',     label: t('screens.troqueles.colNumero'),     flex: 0.13 },
  { key: 'tipo',       label: t('screens.troqueles.colTipo'),       flex: 0.12 },
  { key: 'ancho',      label: t('screens.troqueles.colAncho'),      flex: 0.10 },
  { key: 'alto',       label: t('screens.troqueles.colAlto'),       flex: 0.10 },
  { key: 'motivos',    label: t('screens.troqueles.colMotivos'),    flex: 0.09 },
  { key: 'separacion', label: t('screens.troqueles.colSeparacion'), flex: 0.11 },
  { key: 'valorZ',     label: t('screens.troqueles.colValorZ'),     flex: 0.09 },
  { key: 'sesgado',    label: t('screens.troqueles.colSesgado'),    flex: 0.11 },
  { key: 'estado',     label: t('screens.troqueles.colEstado'),     flex: 0.11 },
  { key: 'acciones',   label: t('common.actions'),                  flex: 0.10, locked: true },
];

export default function TroquelessScreen({ currentUser, navigation }) {
  const ITEMS_PER_PAGE = 100;
  const { t } = useTranslation();
  const { visibleCols, orderedCols, hiddenKeys, toggleColumn, reorderColumns, resetColumns } =
    useGridColumns('troqueles', TROQUELES_COL_DEFS(t), currentUser?.id);
  const [troqueles, setTroqueles] = useState([]);
  const [filtrados, setFiltrados] = useState(troqueles);
  const [paginaTroqueles, setPaginaTroqueles] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalDetalleVisible, setModalDetalleVisible] = useState(false);
  const [troquelSeleccionado, setTroquelSeleccionado] = useState(null);
  const [modoEdicionTroquel, setModoEdicionTroquel] = useState(false);
  const [troquelEditando, setTroquelEditando] = useState(null);
  const [activeRole, setActiveRole] = useState('root');
  const [confirmingDeleteTroquel, setConfirmingDeleteTroquel] = useState(null);
  const [hoverNuevo, setHoverNuevo] = useState(false);
  const hoverNuevoTimerRef = useRef(null);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importFileHeaders, setImportFileHeaders] = useState([]);
  const [importFileRows, setImportFileRows] = useState([]);

  const siguienteNumeroTroquel = calcularSiguienteNumeroTroquel(troqueles);
  const numerosExistentesTroquel = troqueles
    .map((item) => String(item?.numero || item?.referencia || '').trim())
    .filter(Boolean);
  const numerosExistentesEdicionTroquel = troqueles
    .filter((item) => !modoEdicionTroquel || item.id !== troquelEditando?.id)
    .map((item) => String(item?.numero || item?.referencia || '').trim())
    .filter(Boolean);

  const roleKey = normalizarRolActivo(activeRole);
  const puedeEditarTroqueles = roleKey === 'admin'
    || roleKey === 'administrador'
    || roleKey === 'root'
    || roleKey.includes('produc');
  const puedeImportarTroqueles = roleKey === 'admin'
    || roleKey === 'administrador'
    || roleKey === 'root';

  useEffect(() => {
    const query = String(busqueda || '').trim().toLowerCase();
    const filtered = troqueles.filter((t) => {
      if (!query) return true;
      const valoresBusqueda = [
        t.numero,
        t.referencia,
        t.forma,
        t.tipo,
        t.estado,
        t.anchoMotivo,
        t.altoMotivo,
        t.motivosAncho,
        t.separacionAncho,
        t.valorZ,
        t.distanciaSesgado,
      ]
        .map((value) => String(value || '').toLowerCase())
        .join(' ');

      return valoresBusqueda.includes(query);
    });
    setFiltrados(filtered);
  }, [busqueda, troqueles]);

  useEffect(() => {
    setPaginaTroqueles(1);
  }, [busqueda, troqueles]);

  const totalPaginasTroqueles = Math.max(1, Math.ceil(filtrados.length / ITEMS_PER_PAGE));
  const troquelesPaginados = filtrados.slice((paginaTroqueles - 1) * ITEMS_PER_PAGE, paginaTroqueles * ITEMS_PER_PAGE);

  useEffect(() => {
    if (paginaTroqueles > totalPaginasTroqueles) {
      setPaginaTroqueles(totalPaginasTroqueles);
    }
  }, [paginaTroqueles, totalPaginasTroqueles]);

  const cargarRolActivo = async () => {
    try {
      const respAll = await fetch('http://localhost:8080/api/settings');
      if (!respAll.ok) {
        setActiveRole('root');
        return 'root';
      }
      const all = await respAll.json().catch(() => ({}));
      const roleNormalizado = normalizarRolActivo((all.settings && (all.settings.active_role || all.settings.activeRole || all.settings.active)) || 'root');
      setActiveRole(roleNormalizado);
      return roleNormalizado;
    } catch (e) {
      setActiveRole('root');
      return 'root';
    }
  };

  const cargarTroqueles = async () => {
    try {
      const resp = await fetch(API_TROQUELES);
      if (!resp.ok) return;
      const data = await resp.json();
      const lista = (data.troqueles || data || []).map((t) => ({ ...t, id: t._id || t.id }));
      setTroqueles(lista);
    } catch (e) {
      // silently fail
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      cargarRolActivo();
      cargarTroqueles();
    }, [])
  );

  useEffect(() => {
    cargarRolActivo();
    cargarTroqueles();
  }, []);

  const mostrarPermisoDenegado = () => {
    Alert.alert(t('forms.permisoDenegado'), t('screens.troqueles.permisoDenegado'));
  };

  const abrirNuevoTroquel = () => {
    setModoEdicionTroquel(false);
    setTroquelEditando(null);
    setModalVisible(true);
  };

  const abrirEdicionTroquel = async (troquel) => {
    const roleActual = normalizarRolActivo(await cargarRolActivo());
    const puedeEditar = roleActual === 'admin'
      || roleActual === 'administrador'
      || roleActual === 'root'
      || roleActual.includes('produc');

    if (!puedeEditar) {
      mostrarPermisoDenegado();
      return;
    }

    setModoEdicionTroquel(true);
    setTroquelEditando(troquel);
    setModalVisible(true);
    if (troquelSeleccionado?.id === troquel.id) {
      setModalDetalleVisible(false);
    }
  };

  const cerrarModalTroquel = () => {
    setModalVisible(false);
    setModoEdicionTroquel(false);
    setTroquelEditando(null);
  };

  const handleGuardarTroquel = async (troquel) => {
    if (modoEdicionTroquel) {
      if (!puedeEditarTroqueles) {
        mostrarPermisoDenegado();
        return;
      }

      const troquelId = troquelEditando?._id || troquelEditando?.id;
      const numeroEditado = String(troquel?.numero || troquel?.referencia || '').trim().toLowerCase();
      const existeDuplicadoEdicion = troqueles.some((item) => {
        const itemId = item._id || item.id;
        if (itemId === troquelId) return false;
        const numero = String(item?.numero || item?.referencia || '').trim().toLowerCase();
        return numero && numero === numeroEditado;
      });

      if (existeDuplicadoEdicion) {
        if (Platform.OS === 'web') {
          if (typeof window !== 'undefined') {
            window.alert(t('screens.troqueles.dupNumber'));
          }
        } else {
          Alert.alert(t('common.error'), t('screens.troqueles.dupNumber'));
        }
        return;
      }

      try {
        const resp = await fetch(`${API_TROQUELES}/${troquelId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(troquel),
        });
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          const msg = err.error || err.message || 'Error al guardar';
          if (Platform.OS === 'web') { window.alert(msg); } else { Alert.alert('Error', msg); }
          return;
        }
      } catch (e) {
        if (Platform.OS === 'web') { window.alert('Error de red al guardar'); } else { Alert.alert('Error', 'Error de red'); }
        return;
      }

      await cargarTroqueles();
      return;
    }

    const numeroNuevo = String(troquel?.numero || troquel?.referencia || '').trim().toLowerCase();
    const existe = troqueles.some((item) => {
      const numero = String(item?.numero || item?.referencia || '').trim().toLowerCase();
      return numero && numero === numeroNuevo;
    });

    if (existe) {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.alert(t('screens.troqueles.dupNumber'));
        }
      } else {
        Alert.alert(t('common.error'), t('screens.troqueles.dupNumber'));
      }
      return;
    }

    try {
      const resp = await fetch(API_TROQUELES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(troquel),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        const msg = err.error || err.message || 'Error al crear';
        if (Platform.OS === 'web') { window.alert(msg); } else { Alert.alert('Error', msg); }
        return;
      }
    } catch (e) {
      if (Platform.OS === 'web') { window.alert('Error de red al crear'); } else { Alert.alert('Error', 'Error de red'); }
      return;
    }

    await cargarTroqueles();
  };

  const handleImportarCsv = () => {
    if (!puedeImportarTroqueles) {
      Alert.alert(t('forms.permisoDenegado'), t('screens.troqueles.importPermiso'));
      return;
    }

    if (Platform.OS !== 'web') {
      Alert.alert(t('common.import'), t('screens.troqueles.importWebOnly'));
      return;
    }

    if (typeof document === 'undefined') {
      Alert.alert(t('common.import'), t('screens.troqueles.importNoFile'));
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xls,.xlsx,.ods,text/csv';
    input.onchange = async (event) => {
      try {
        const file = event?.target?.files?.[0];
        if (!file) return;

        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        if (!jsonRows || jsonRows.length < 2) {
          Alert.alert(t('common.import'), t('screens.troqueles.importNoData'));
          return;
        }

        const headers = (jsonRows[0] || []).map((h) => String(h ?? '').trim()).filter(Boolean);
        if (!headers.length) {
          Alert.alert(t('common.import'), t('screens.troqueles.importNoData'));
          return;
        }

        const rows = jsonRows.slice(1).map((rowArr) => {
          const obj = {};
          headers.forEach((h, i) => { obj[h] = String(rowArr[i] ?? '').trim(); });
          return obj;
        }).filter((r) => Object.values(r).some((v) => v));

        setImportFileHeaders(headers);
        setImportFileRows(rows);
        setImportModalVisible(true);
      } catch (e) {
        Alert.alert(t('common.import'), `No se pudo leer el archivo: ${e.message}`);
      }
    };
    input.click();
  };

  const handleImportConfirm = async (troqueles) => {
    const token = global.__MIAPP_ACCESS_TOKEN;
    let importadosOk = 0;
    const erroresApi = [];

    for (const troquel of troqueles) {
      try {
        const resp = await fetch(API_TROQUELES, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(troquel),
        });
        if (resp.ok) {
          importadosOk += 1;
        } else {
          erroresApi.push(troquel.numero);
        }
      } catch (e) {
        erroresApi.push(troquel.numero);
      }
    }

    await cargarTroqueles();
    setImportModalVisible(false);

    const resumenApi = erroresApi.length > 0 ? `\nErrores al guardar: ${erroresApi.length}` : '';
    Alert.alert(
      t('screens.troqueles.importFinish'),
      `${t('screens.troqueles.importedCount', { count: importadosOk })}${resumenApi}`
    );
  };

  const abrirDetalle = (troquel) => {
    setTroquelSeleccionado(troquel);
    setModalDetalleVisible(true);
  };

  const cerrarDetalle = () => {
    setModalDetalleVisible(false);
    setTroquelSeleccionado(null);
  };

  const ejecutarEliminarTroquel = async (troquel) => {
    const troquelId = troquel._id || troquel.id;
    try {
      const resp = await fetch(`${API_TROQUELES}/${troquelId}`, { method: 'DELETE' });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        const msg = err.error || 'Error al eliminar';
        if (Platform.OS === 'web') { window.alert(msg); } else { Alert.alert('Error', msg); }
        return;
      }
    } catch (e) {
      if (Platform.OS === 'web') { window.alert('Error de red al eliminar'); } else { Alert.alert('Error', 'Error de red'); }
      return;
    }
    if (troquelSeleccionado?.id === troquel.id) {
      cerrarDetalle();
    }
    await cargarTroqueles();
  };

  const renderDetalles = (troquel) => {
    if (troquel.tipo === 'regular' || troquel.tipo === 'corbata') {
      return (
        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('screens.troqueles.anchoMotivo')}</Text>
            <Text style={styles.detailValue}>{troquel.anchoMotivo} mm</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('screens.troqueles.altoMotivo')}</Text>
            <Text style={styles.detailValue}>{troquel.altoMotivo} mm</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('screens.troqueles.motivosAncho')}</Text>
            <Text style={styles.detailValue}>{troquel.motivosAncho}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('screens.troqueles.separacion')}</Text>
            <Text style={styles.detailValue}>{troquel.separacionAncho} mm</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('screens.troqueles.valorZ')}</Text>
            <Text style={styles.detailValue}>{troquel.valorZ} mm</Text>
          </View>
          {troquel.tipo === 'corbata' && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('screens.troqueles.sesgadoLabel')}</Text>
              <Text style={styles.detailValue}>{troquel.distanciaSesgado} mm</Text>
            </View>
          )}
        </View>
      );
    } else if (troquel.tipo === 'irregular') {
      return (
        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('screens.troqueles.valorZ')}</Text>
            <Text style={styles.detailValue}>{troquel.valorZ} mm</Text>
          </View>
        </View>
      );
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

  const puedeCrear = usePermission('manage_app_settings');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('nav.troqueles')}</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={t('common.searchAny')}
          value={busqueda}
          onChangeText={setBusqueda}
          placeholderTextColor="#94A3B8"
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {puedeImportarTroqueles && (
            <TouchableOpacity
              style={[styles.btn, styles.btnImport, styles.btnImportTop]}
              onPress={handleImportarCsv}
            >
              <Text style={styles.btnImportTopText}>{t('screens.troqueles.importBtn')}</Text>
            </TouchableOpacity>
          )}
          <View style={styles.btnPlusWrap}>
            <Pressable
              style={[styles.btnPlus, !puedeCrear && styles.btnPlusDisabled]}
              onPress={() => puedeCrear && abrirNuevoTroquel()}
              disabled={!puedeCrear}
              onHoverIn={handleHoverNuevoIn}
              onHoverOut={handleHoverNuevoOut}
            >
              <Text style={styles.btnPlusText}>{t('screens.troqueles.newBtn')}</Text>
            </Pressable>
            {hoverNuevo && (
              <View style={styles.hoverHint}>
                <Text style={styles.hoverHintText}>{!puedeCrear ? t('forms.permisoDenegado') : t('nav.troqueles')}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {filtrados.length === 0 ? (
          <View style={styles.tableContainer}>
            <EmptyState
              title={busqueda ? t('common.noResults') : t('screens.troqueles.noTroqueles')}
              message={busqueda ? t('common.noResultsMsg') : t('screens.troqueles.noItems')}
              action={!busqueda && puedeCrear ? t('screens.troqueles.newBtn') : undefined}
              onAction={!busqueda && puedeCrear ? abrirNuevoTroquel : undefined}
            />
          </View>
        ) : (
          <ScrollView style={styles.tableContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
              <View style={[styles.tableContent, Platform.select({ web: { width: '100%' }, default: { minWidth: 820 } })]}>
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
                {troquelesPaginados.map((troquele, idx) => (
                  <TouchableOpacity key={troquele.id} style={[styles.tableRow, (idx + (paginaTroqueles - 1) * ITEMS_PER_PAGE) % 2 === 1 && styles.rowAlternate]} onPress={() => puedeEditarTroqueles ? abrirEdicionTroquel(troquele) : abrirDetalle(troquele)} activeOpacity={0.75}>
                  {visibleCols.map(col => {
                    switch (col.key) {
                      case 'numero':
                        return (
                          <View key={col.key} style={[styles.tableCell, { flex: col.adjustedFlex }]}>
                            <Text style={styles.cellText} numberOfLines={1}>{troquele.numero}</Text>
                          </View>
                        );
                      case 'tipo':
                        return (
                          <View key={col.key} style={[styles.tableCell, { flex: col.adjustedFlex }]}>
                            <Text style={styles.cellText} numberOfLines={1}>{troquele.tipo.charAt(0).toUpperCase() + troquele.tipo.slice(1)}</Text>
                          </View>
                        );
                      case 'ancho':
                        return (
                          <View key={col.key} style={[styles.tableCell, { flex: col.adjustedFlex }]}>
                            <Text style={styles.cellText} numberOfLines={1}>{troquele.anchoMotivo || '-'}</Text>
                          </View>
                        );
                      case 'alto':
                        return (
                          <View key={col.key} style={[styles.tableCell, { flex: col.adjustedFlex }]}>
                            <Text style={styles.cellText} numberOfLines={1}>{troquele.altoMotivo || '-'}</Text>
                          </View>
                        );
                      case 'motivos':
                        return (
                          <View key={col.key} style={[styles.tableCell, { flex: col.adjustedFlex }]}>
                            <Text style={styles.cellText} numberOfLines={1}>{troquele.motivosAncho || '-'}</Text>
                          </View>
                        );
                      case 'separacion':
                        return (
                          <View key={col.key} style={[styles.tableCell, { flex: col.adjustedFlex }]}>
                            <Text style={styles.cellText} numberOfLines={1}>{troquele.separacionAncho || '-'}</Text>
                          </View>
                        );
                      case 'valorZ':
                        return (
                          <View key={col.key} style={[styles.tableCell, { flex: col.adjustedFlex }]}>
                            <Text style={styles.cellText} numberOfLines={1}>{troquele.valorZ || '-'}</Text>
                          </View>
                        );
                      case 'sesgado':
                        return (
                          <View key={col.key} style={[styles.tableCell, { flex: col.adjustedFlex }]}>
                            <Text style={styles.cellText} numberOfLines={1}>{troquele.distanciaSesgado || '-'}</Text>
                          </View>
                        );
                      case 'estado':
                        return (
                          <View key={col.key} style={[styles.tableCell, { flex: col.adjustedFlex }]}>
                            <Text style={[styles.statusBadge, { backgroundColor: troquele.estado === 'Disponible' ? '#16A34A' : '#D97706' }]}>
                              {troquele.estado}
                            </Text>
                          </View>
                        );
                      case 'acciones':
                        return (
                          <View key={col.key} style={[styles.tableCell, { flex: col.adjustedFlex, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }]}>
                            {confirmingDeleteTroquel === (troquele._id || troquele.id) ? (
                              <DeleteConfirmRow
                                onCancel={() => setConfirmingDeleteTroquel(null)}
                                onConfirm={() => { setConfirmingDeleteTroquel(null); ejecutarEliminarTroquel(troquele); }}
                              />
                            ) : (
                              <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={(e) => { e.stopPropagation?.(); setConfirmingDeleteTroquel(troquele._id || troquele.id); }}>
                                <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>{t('common.delete')}</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        );
                      default:
                        return null;
                    }
                  })}
                  <View style={{ width: 30 }} />
                  </TouchableOpacity>
                ))}
                {totalPaginasTroqueles > 1 && (
                  <View style={styles.paginationRow}>
                    <TouchableOpacity
                      style={[styles.paginationBtn, paginaTroqueles === 1 && styles.paginationBtnDisabled]}
                      onPress={() => setPaginaTroqueles((prev) => Math.max(1, prev - 1))}
                      disabled={paginaTroqueles === 1}
                    >
                      <Text style={styles.paginationBtnText}>{t('common.prev')}</Text>
                    </TouchableOpacity>
                    <Text style={styles.paginationInfo}>{t('common.pageOf', { current: paginaTroqueles, total: totalPaginasTroqueles })}</Text>
                    <TouchableOpacity
                      style={[styles.paginationBtn, paginaTroqueles === totalPaginasTroqueles && styles.paginationBtnDisabled]}
                      onPress={() => setPaginaTroqueles((prev) => Math.min(totalPaginasTroqueles, prev + 1))}
                      disabled={paginaTroqueles === totalPaginasTroqueles}
                    >
                      <Text style={styles.paginationBtnText}>{t('common.next')}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>
          </ScrollView>
        )}

      <NuevoTroquelModal
        visible={modalVisible}
        onClose={cerrarModalTroquel}
        onSave={handleGuardarTroquel}
        defaultNumero={modoEdicionTroquel ? '' : siguienteNumeroTroquel}
        existingNumeros={modoEdicionTroquel ? numerosExistentesEdicionTroquel : numerosExistentesTroquel}
        initialTroquel={troquelEditando}
        modoEdicion={modoEdicionTroquel}
        currentUser={currentUser}
        puedeCrear={puedeCrear}
      />

      <Modal visible={modalDetalleVisible} transparent animationType="fade" onRequestClose={cerrarDetalle}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>{t('screens.troqueles.detailTitle')}</Text>
              <TouchableOpacity onPress={cerrarDetalle}>
                <Text style={styles.modalCloseX}>✕</Text>
              </TouchableOpacity>
            </View>
            {troquelSeleccionado && (
              <>
                <View style={styles.detailHeadRow}>
                  <Text style={styles.detailTitle}>{troquelSeleccionado.numero}</Text>
                  <Text style={[styles.statusBadge, { backgroundColor: troquelSeleccionado.estado === 'Disponible' ? '#16A34A' : '#D97706' }]}>
                    {troquelSeleccionado.estado}
                  </Text>
                </View>
                <Text style={styles.cardText}>{t('screens.troqueles.tipoLabel')} {troquelSeleccionado.tipo}</Text>
                {renderDetalles(troquelSeleccionado)}
              </>
            )}

            <View style={styles.modalActions}>
              {troquelSeleccionado && puedeEditarTroqueles && (
                <TouchableOpacity style={[styles.btn, styles.btnNew]} onPress={() => abrirEdicionTroquel(troquelSeleccionado)}>
                  <Text style={[styles.btnText, styles.btnNewText]}>{t('common.edit')}</Text>
                </TouchableOpacity>
              )}
              {troquelSeleccionado && (
                confirmingDeleteTroquel === (troquelSeleccionado._id || troquelSeleccionado.id) ? (
                  <DeleteConfirmRow
                    size="md"
                    onCancel={() => setConfirmingDeleteTroquel(null)}
                    onConfirm={() => { setConfirmingDeleteTroquel(null); ejecutarEliminarTroquel(troquelSeleccionado); }}
                  />
                ) : (
                  <TouchableOpacity style={[styles.btn, styles.deleteBtn]} onPress={() => setConfirmingDeleteTroquel(troquelSeleccionado._id || troquelSeleccionado.id)}>
                    <Text style={[styles.btnText, { color: '#DC2626' }]}>{t('common.delete')}</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>
        </View>
      </Modal>

      <TroquelImportModal
        visible={importModalVisible}
        fileHeaders={importFileHeaders}
        fileRows={importFileRows}
        onClose={() => setImportModalVisible(false)}
        onImport={handleImportConfirm}
      />
    </View>
  );
}

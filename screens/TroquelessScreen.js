import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Modal, Alert, Platform, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import NuevoTroquelModal from './NuevoTroquelModal';
import { usePermission } from './usePermission';
import EmptyState from '../components/EmptyState';
import DeleteConfirmRow from '../components/DeleteConfirmRow';

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
    color: '#1E293B',
    fontWeight: '700',
  },
  btnImport: {
    borderColor: 'rgba(248,250,252,0.55)',
  },
  btnImportTop: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minHeight: 32,
    justifyContent: 'center',
  },
  btnImportTopText: {
    color: '#F1F5F9',
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
  mainBlock: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    marginHorizontal: 12,
    marginVertical: 12,
  },
  tableContent: {
    width: '100%',
    minWidth: 1200,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
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
    color: '#475569',
  },
  cellText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0F172A',
  },
  colNumero: {
    minWidth: 110,
    flexGrow: 1,
    flexShrink: 0,
  },
  colTipo: {
    minWidth: 120,
    flexGrow: 1,
    flexShrink: 0,
  },
  colAncho: {
    minWidth: 110,
    flexGrow: 1,
    flexShrink: 0,
  },
  colAlto: {
    minWidth: 110,
    flexGrow: 1,
    flexShrink: 0,
  },
  colMotivos: {
    minWidth: 100,
    flexGrow: 1,
    flexShrink: 0,
  },
  colSeparacion: {
    minWidth: 110,
    flexGrow: 1,
    flexShrink: 0,
  },
  colValorZ: {
    minWidth: 90,
    flexGrow: 1,
    flexShrink: 0,
  },
  colSesgado: {
    minWidth: 120,
    flexGrow: 1,
    flexShrink: 0,
  },
  colEstado: {
    minWidth: 110,
    flexGrow: 1,
    flexShrink: 0,
  },
  colAcciones: {
    minWidth: 220,
    flexGrow: 1.4,
    flexShrink: 0,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
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
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    backgroundColor: '#E55A2B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    textAlign: 'center',
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

export default function TroquelessScreen({ currentUser, navigation }) {
  const ITEMS_PER_PAGE = 100;
  const { t } = useTranslation();
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

  const importarTroquelesDesdeCsv = async (csvText) => {
    const lineas = String(csvText || '')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lineas.length < 2) {
      Alert.alert(t('common.import'), t('screens.troqueles.importNoData'));
      return;
    }

    const headers = parseCsvLine(lineas[0]).map(normalizarClave);
    const baseNumeros = new Set(troqueles.map((t) => normalizarNumeroTroquel(t.numero || t.referencia)));
    const nuevosNumeros = new Set();
    const importados = [];
    const errores = [];

    for (let i = 1; i < lineas.length; i += 1) {
      const valores = parseCsvLine(lineas[i]);
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = valores[idx] ?? '';
      });

      const troquel = construirTroquelDesdeFila(row, '');
      const numeroNormalizado = normalizarNumeroTroquel(troquel.numero);

      if (!numeroNormalizado) {
        errores.push(`Línea ${i + 1}: falta número/referencia`);
        continue;
      }

      if (baseNumeros.has(numeroNormalizado) || nuevosNumeros.has(numeroNormalizado)) {
        errores.push(`Línea ${i + 1}: número duplicado (${troquel.numero})`);
        continue;
      }

      nuevosNumeros.add(numeroNormalizado);
      importados.push(troquel);
    }

    let importadosOk = 0;
    const erroresApi = [];

    if (importados.length > 0) {
      for (const t of importados) {
        try {
          const resp = await fetch(API_TROQUELES, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(t),
          });
          if (resp.ok) {
            importadosOk += 1;
          } else {
            erroresApi.push(t.numero);
          }
        } catch (e) {
          erroresApi.push(t.numero);
        }
      }
      await cargarTroqueles();
    }

    const resumenErrores = errores.length > 0 ? `\nErrores de formato: ${errores.length}` : '';
    const resumenApi = erroresApi.length > 0 ? `\nErrores al guardar: ${erroresApi.length}` : '';
    const previewErrores = errores.slice(0, 3).join('\n');
    const detalleErrores = previewErrores ? `\n\n${previewErrores}${errores.length > 3 ? '\n...' : ''}` : '';
    Alert.alert(
      t('screens.troqueles.importFinish'),
      `${t('screens.troqueles.importedCount', { count: importadosOk })}${resumenErrores}${resumenApi}${detalleErrores}`
    );
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
    input.accept = '.csv,text/csv';
    input.onchange = async (event) => {
      try {
        const file = event?.target?.files?.[0];
        if (!file) return;
        const text = await file.text();
        await importarTroquelesDesdeCsv(text);
      } catch (e) {
        Alert.alert('Importación CSV', `No se pudo importar el archivo: ${e.message}`);
      }
    };
    input.click();
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
        <View style={styles.headerTopRow}>
          <View style={{ width: 38 }} />
          <Text style={styles.headerTitle}>{t('nav.troqueles')}</Text>
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
                style={[styles.btnPlus, !puedeCrear && { opacity: 0.45 }]}
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
        <TextInput
          style={styles.searchInput}
          placeholder={t('common.searchAny')}
          value={busqueda}
          onChangeText={setBusqueda}
          placeholderTextColor="#94A3B8"
        />
      </View>

      <View style={styles.mainBlock}>
        {filtrados.length === 0 ? (
          <View style={styles.tableContainer}>
            <EmptyState
              icon="✂️"
              title={busqueda ? t('common.noResults') : t('screens.troqueles.noTroqueles')}
              message={busqueda ? t('common.noResultsMsg') : t('screens.troqueles.noItems')}
              action={!busqueda && puedeCrear ? t('screens.troqueles.newBtn') : undefined}
              onAction={!busqueda && puedeCrear ? abrirNuevoTroquel : undefined}
            />
          </View>
        ) : (
          <ScrollView style={styles.tableContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ flexGrow: 1 }}>
              <View style={styles.tableContent}>
                <View style={styles.tableHeader}>
                <View style={[styles.tableCell, styles.colNumero]}>
                  <Text style={styles.headerText}>{t('screens.troqueles.colNumero')}</Text>
                </View>
                <View style={[styles.tableCell, styles.colTipo]}>
                  <Text style={styles.headerText}>{t('screens.troqueles.colTipo')}</Text>
                </View>
                <View style={[styles.tableCell, styles.colAncho]}>
                  <Text style={styles.headerText}>{t('screens.troqueles.colAncho')}</Text>
                </View>
                <View style={[styles.tableCell, styles.colAlto]}>
                  <Text style={styles.headerText}>{t('screens.troqueles.colAlto')}</Text>
                </View>
                <View style={[styles.tableCell, styles.colMotivos]}>
                  <Text style={styles.headerText}>{t('screens.troqueles.colMotivos')}</Text>
                </View>
                <View style={[styles.tableCell, styles.colSeparacion]}>
                  <Text style={styles.headerText}>{t('screens.troqueles.colSeparacion')}</Text>
                </View>
                <View style={[styles.tableCell, styles.colValorZ]}>
                  <Text style={styles.headerText}>{t('screens.troqueles.colValorZ')}</Text>
                </View>
                <View style={[styles.tableCell, styles.colSesgado]}>
                  <Text style={styles.headerText}>{t('screens.troqueles.colSesgado')}</Text>
                </View>
                <View style={[styles.tableCell, styles.colEstado]}>
                  <Text style={styles.headerText}>{t('screens.troqueles.colEstado')}</Text>
                </View>
                <View style={[styles.tableCell, styles.colAcciones]}>
                  <Text style={styles.headerText}>{t('common.actions')}</Text>
                </View>
                </View>
                {troquelesPaginados.map((troquele, idx) => (
                  <View key={troquele.id} style={[styles.tableRow, (idx + (paginaTroqueles - 1) * ITEMS_PER_PAGE) % 2 === 1 && styles.rowAlternate]}>
                  <View style={[styles.tableCell, styles.colNumero]}>
                    <Text style={styles.cellText} numberOfLines={1}>{troquele.numero}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.colTipo]}>
                    <Text style={styles.cellText} numberOfLines={1}>{troquele.tipo.charAt(0).toUpperCase() + troquele.tipo.slice(1)}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.colAncho]}>
                    <Text style={styles.cellText} numberOfLines={1}>{troquele.anchoMotivo || '-'}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.colAlto]}>
                    <Text style={styles.cellText} numberOfLines={1}>{troquele.altoMotivo || '-'}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.colMotivos]}>
                    <Text style={styles.cellText} numberOfLines={1}>{troquele.motivosAncho || '-'}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.colSeparacion]}>
                    <Text style={styles.cellText} numberOfLines={1}>{troquele.separacionAncho || '-'}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.colValorZ]}>
                    <Text style={styles.cellText} numberOfLines={1}>{troquele.valorZ || '-'}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.colSesgado]}>
                    <Text style={styles.cellText} numberOfLines={1}>{troquele.distanciaSesgado || '-'}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.colEstado]}>
                    <Text style={[styles.statusBadge, { backgroundColor: troquele.estado === 'Disponible' ? '#16A34A' : '#FF9800' }]}>
                      {troquele.estado}
                    </Text>
                  </View>
                  <View style={[styles.tableCell, styles.colAcciones]}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => (puedeEditarTroqueles ? abrirEdicionTroquel(troquele) : abrirDetalle(troquele))}
                    >
                      <Text style={styles.actionBtnText}>{t('common.view')}</Text>
                    </TouchableOpacity>
                    {confirmingDeleteTroquel === (troquele._id || troquele.id) ? (
                      <DeleteConfirmRow
                        onCancel={() => setConfirmingDeleteTroquel(null)}
                        onConfirm={() => { setConfirmingDeleteTroquel(null); ejecutarEliminarTroquel(troquele); }}
                      />
                    ) : (
                      <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => setConfirmingDeleteTroquel(troquele._id || troquele.id)}>
                        <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>{t('common.delete')}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  </View>
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
      </View>

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
                  <Text style={[styles.statusBadge, { backgroundColor: troquelSeleccionado.estado === 'Disponible' ? '#16A34A' : '#FF9800' }]}>
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
    </View>
  );
}

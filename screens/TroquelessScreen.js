import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Modal, Alert, Platform, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import NuevoTroquelModal from './NuevoTroquelModal';

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
    justifyContent: 'space-between',
    minHeight: 38,
    marginBottom: 6,
  },
  headerTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  btnImport: {
    backgroundColor: '#4B5563',
  },
  btnImportTop: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    minHeight: 32,
    justifyContent: 'center',
  },
  btnImportTopText: {
    color: '#F3F4F6',
    fontSize: 12,
    fontWeight: '700',
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
  mainBlock: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D0D5DD',
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
    backgroundColor: '#4B5563',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
  },
  deleteBtn: {
    backgroundColor: '#D32F2F',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    backgroundColor: '#3AB274',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    textAlign: 'center',
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#232323',
  },
  cardText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  cardDetails: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
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
    color: '#999',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 12,
    color: '#232323',
    fontWeight: '700',
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#232323',
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  btnCancel: {
    backgroundColor: '#A8A8AA',
  },
  detailHeadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#232323',
  },
});

export default function TroquelessScreen({ currentUser }) {
  const ITEMS_PER_PAGE = 100;
  const [troqueles, setTroqueles] = useState([
    { id: 1, numero: 'TR-001', estado: 'Disponible', forma: 'Rectangular', tipo: 'regular', anchoMotivo: '100', altoMotivo: '150' },
    { id: 2, numero: 'TR-002', estado: 'En uso', forma: 'Irregular', tipo: 'irregular', valorZ: '110' },
  ]);
  const [filtrados, setFiltrados] = useState(troqueles);
  const [paginaTroqueles, setPaginaTroqueles] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalDetalleVisible, setModalDetalleVisible] = useState(false);
  const [troquelSeleccionado, setTroquelSeleccionado] = useState(null);
  const [modoEdicionTroquel, setModoEdicionTroquel] = useState(false);
  const [troquelEditando, setTroquelEditando] = useState(null);
  const [activeRole, setActiveRole] = useState('root');
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

  useFocusEffect(
    React.useCallback(() => {
      cargarRolActivo();
    }, [])
  );

  useEffect(() => {
    cargarRolActivo();
  }, []);

  const mostrarPermisoDenegado = () => {
    Alert.alert('Permiso denegado', 'Solo los roles admin y producción pueden editar troqueles.');
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

  const handleGuardarTroquel = (troquel) => {
    if (modoEdicionTroquel) {
      if (!puedeEditarTroqueles) {
        mostrarPermisoDenegado();
        return;
      }

      const numeroEditado = String(troquel?.numero || troquel?.referencia || '').trim().toLowerCase();
      const existeDuplicadoEdicion = troqueles.some((item) => {
        if (item.id === troquel.id) return false;
        const numero = String(item?.numero || item?.referencia || '').trim().toLowerCase();
        return numero && numero === numeroEditado;
      });

      if (existeDuplicadoEdicion) {
        if (Platform.OS === 'web') {
          if (typeof window !== 'undefined') {
            window.alert('Ya existe un troquel con ese número.');
          }
        } else {
          Alert.alert('Número duplicado', 'Ya existe un troquel con ese número.');
        }
        return;
      }

      setTroqueles((prev) => prev.map((item) => (
        item.id === troquel.id
          ? { ...item, ...troquel, id: item.id, estado: troquel.estado || item.estado }
          : item
      )));
      setTroquelSeleccionado((prev) => (
        prev?.id === troquel.id
          ? { ...prev, ...troquel, id: prev.id, estado: troquel.estado || prev.estado }
          : prev
      ));
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
          window.alert('Ya existe un troquel con ese número.');
        }
      } else {
        Alert.alert('Número duplicado', 'Ya existe un troquel con ese número.');
      }
      return;
    }

    setTroqueles([...troqueles, troquel]);
  };

  const importarTroquelesDesdeCsv = (csvText) => {
    const lineas = String(csvText || '')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lineas.length < 2) {
      Alert.alert('Importación CSV', 'El archivo no contiene datos suficientes.');
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

    if (importados.length > 0) {
      setTroqueles((prev) => [...prev, ...importados]);
    }

    const resumenErrores = errores.length > 0 ? `\nErrores: ${errores.length}` : '';
    const previewErrores = errores.slice(0, 3).join('\n');
    const detalleErrores = previewErrores ? `\n\n${previewErrores}${errores.length > 3 ? '\n...' : ''}` : '';
    Alert.alert(
      'Importación finalizada',
      `Importados: ${importados.length}${resumenErrores}${detalleErrores}`
    );
  };

  const handleImportarCsv = () => {
    if (!puedeImportarTroqueles) {
      Alert.alert('Permiso denegado', 'Solo administrador y root pueden importar troqueles.');
      return;
    }

    if (Platform.OS !== 'web') {
      Alert.alert('Importar CSV', 'La importación por archivo CSV está disponible en la versión web.');
      return;
    }

    if (typeof document === 'undefined') {
      Alert.alert('Importar CSV', 'No se pudo abrir el selector de archivos.');
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
        importarTroquelesDesdeCsv(text);
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

  const confirmarEliminarTroquel = (troquel) => {
    const ejecutar = () => {
      setTroqueles((prev) => prev.filter((item) => item.id !== troquel.id));
      if (troquelSeleccionado?.id === troquel.id) {
        cerrarDetalle();
      }
    };

    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' ? window.confirm(`¿Eliminar troquel ${troquel.numero}?`) : true;
      if (ok) ejecutar();
      return;
    }

    Alert.alert(
      'Eliminar troquel',
      `¿Seguro que quieres eliminar ${troquel.numero}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: ejecutar },
      ]
    );
  };

  const renderDetalles = (troquel) => {
    if (troquel.tipo === 'regular' || troquel.tipo === 'corbata') {
      return (
        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ancho Motivo:</Text>
            <Text style={styles.detailValue}>{troquel.anchoMotivo} mm</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Alto Motivo:</Text>
            <Text style={styles.detailValue}>{troquel.altoMotivo} mm</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Motivos Ancho:</Text>
            <Text style={styles.detailValue}>{troquel.motivosAncho}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Separación:</Text>
            <Text style={styles.detailValue}>{troquel.separacionAncho} mm</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Valor Z:</Text>
            <Text style={styles.detailValue}>{troquel.valorZ} mm</Text>
          </View>
          {troquel.tipo === 'corbata' && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Distancia Sesgado:</Text>
              <Text style={styles.detailValue}>{troquel.distanciaSesgado} mm</Text>
            </View>
          )}
        </View>
      );
    } else if (troquel.tipo === 'irregular') {
      return (
        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Valor Z:</Text>
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

  const puedeCrear = ['root', 'administrador', 'admin'].includes(String(currentUser?.rol || '').toLowerCase());

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTopLeft}>
            <View style={styles.btnPlusWrap}>
              <Pressable
                style={[styles.btnPlus, !puedeCrear && { opacity: 0.45 }]}
                onPress={() => puedeCrear && abrirNuevoTroquel()}
                disabled={!puedeCrear}
                onHoverIn={handleHoverNuevoIn}
                onHoverOut={handleHoverNuevoOut}
              >
                <Text style={styles.btnPlusText}>+</Text>
              </Pressable>
              {hoverNuevo && (
                <View style={styles.hoverHint}>
                  <Text style={styles.hoverHintText}>{!puedeCrear ? 'Permiso denegado' : 'Nuevo troquel'}</Text>
                </View>
              )}
            </View>
            <Text style={styles.headerTitle}>Troqueles</Text>
          </View>
          {puedeImportarTroqueles && (
            <TouchableOpacity
              style={[styles.btn, styles.btnImport, styles.btnImportTop]}
              onPress={handleImportarCsv}
            >
              <Text style={styles.btnImportTopText}>Importar</Text>
            </TouchableOpacity>
          )}
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por cualquier campo..."
          value={busqueda}
          onChangeText={setBusqueda}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.mainBlock}>
        {filtrados.length === 0 ? (
          <View style={styles.tableContainer}>
            <Text style={styles.emptyText}>
              {busqueda ? 'No se encontraron resultados' : 'No hay troqueles'}
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.tableContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ flexGrow: 1 }}>
              <View style={styles.tableContent}>
                <View style={styles.tableHeader}>
                <View style={[styles.tableCell, styles.colNumero]}>
                  <Text style={styles.headerText}>Número</Text>
                </View>
                <View style={[styles.tableCell, styles.colTipo]}>
                  <Text style={styles.headerText}>Tipo</Text>
                </View>
                <View style={[styles.tableCell, styles.colAncho]}>
                  <Text style={styles.headerText}>Ancho</Text>
                </View>
                <View style={[styles.tableCell, styles.colAlto]}>
                  <Text style={styles.headerText}>Alto</Text>
                </View>
                <View style={[styles.tableCell, styles.colMotivos]}>
                  <Text style={styles.headerText}>Motivos</Text>
                </View>
                <View style={[styles.tableCell, styles.colSeparacion]}>
                  <Text style={styles.headerText}>Separación</Text>
                </View>
                <View style={[styles.tableCell, styles.colValorZ]}>
                  <Text style={styles.headerText}>Valor Z</Text>
                </View>
                <View style={[styles.tableCell, styles.colSesgado]}>
                  <Text style={styles.headerText}>Sesgado</Text>
                </View>
                <View style={[styles.tableCell, styles.colEstado]}>
                  <Text style={styles.headerText}>Estado</Text>
                </View>
                <View style={[styles.tableCell, styles.colAcciones]}>
                  <Text style={styles.headerText}>Acciones</Text>
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
                    <Text style={[styles.statusBadge, { backgroundColor: troquele.estado === 'Disponible' ? '#3AB274' : '#FF9800' }]}>
                      {troquele.estado}
                    </Text>
                  </View>
                  <View style={[styles.tableCell, styles.colAcciones]}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => (puedeEditarTroqueles ? abrirEdicionTroquel(troquele) : abrirDetalle(troquele))}
                    >
                      <Text style={styles.actionBtnText}>Ver</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => confirmarEliminarTroquel(troquele)}>
                      <Text style={styles.actionBtnText}>Eliminar</Text>
                    </TouchableOpacity>
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
                      <Text style={styles.paginationBtnText}>Anterior</Text>
                    </TouchableOpacity>
                    <Text style={styles.paginationInfo}>Página {paginaTroqueles} de {totalPaginasTroqueles}</Text>
                    <TouchableOpacity
                      style={[styles.paginationBtn, paginaTroqueles === totalPaginasTroqueles && styles.paginationBtnDisabled]}
                      onPress={() => setPaginaTroqueles((prev) => Math.min(totalPaginasTroqueles, prev + 1))}
                      disabled={paginaTroqueles === totalPaginasTroqueles}
                    >
                      <Text style={styles.paginationBtnText}>Siguiente</Text>
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
      />

      <Modal visible={modalDetalleVisible} transparent animationType="fade" onRequestClose={cerrarDetalle}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Detalle de troquel</Text>
            {troquelSeleccionado && (
              <>
                <View style={styles.detailHeadRow}>
                  <Text style={styles.detailTitle}>{troquelSeleccionado.numero}</Text>
                  <Text style={[styles.statusBadge, { backgroundColor: troquelSeleccionado.estado === 'Disponible' ? '#3AB274' : '#FF9800' }]}>
                    {troquelSeleccionado.estado}
                  </Text>
                </View>
                <Text style={styles.cardText}>Tipo: {troquelSeleccionado.tipo}</Text>
                {renderDetalles(troquelSeleccionado)}
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={cerrarDetalle}>
                <Text style={styles.btnText}>Cerrar</Text>
              </TouchableOpacity>
              {troquelSeleccionado && puedeEditarTroqueles && (
                <TouchableOpacity style={[styles.btn, styles.btnNew]} onPress={() => abrirEdicionTroquel(troquelSeleccionado)}>
                  <Text style={[styles.btnText, styles.btnNewText]}>Editar</Text>
                </TouchableOpacity>
              )}
              {troquelSeleccionado && (
                <TouchableOpacity style={[styles.btn, styles.deleteBtn]} onPress={() => confirmarEliminarTroquel(troquelSeleccionado)}>
                  <Text style={styles.btnText}>Eliminar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

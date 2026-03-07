import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { usePermission } from './usePermission';
import NuevaMaquinaModal from './NuevaMaquinaModal';

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
    minHeight: 38,
    marginBottom: 6,
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
    color: '#F8FAFC',
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
  mainBlock: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    marginHorizontal: 12,
    marginVertical: 12,
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
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 3,
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
  colNombre: {
    flex: 0.24,
  },
  colTipo: {
    flex: 0.2,
  },
  colCapacidad: {
    flex: 0.34,
  },
  colRendimiento: {
    flex: 0.16,
  },
  colCola: {
    flex: 0.08,
    alignItems: 'center',
  },
  colEstado: {
    flex: 0.06,
  },
  colAcciones: {
    flex: 0.14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  actionBtn: {
    backgroundColor: '#475569',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteBtn: {
    backgroundColor: '#DC2626',
  },
  actionBtnDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.6,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
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
  btnCancel: {
    backgroundColor: '#F1F5F9',
  },
  valueBlock: {
    fontSize: 12,
    color: '#0F172A',
    lineHeight: 17,
  },
  colaLink: {
    color: '#111111',
    fontWeight: '800',
  },
  colaLinkDisabled: {
    color: '#111111',
    fontWeight: '800',
  },
});

export default function MachinasScreen({ currentUser }) {
  const ITEMS_PER_PAGE = 100;
  const navigation = useNavigation();

  const [maquinas, setMaquinas] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [paginaMaquinas, setPaginaMaquinas] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [maquinaEditandoId, setMaquinaEditandoId] = useState(null);
  const [initialMaquina, setInitialMaquina] = useState(null);
  const [hoverNuevo, setHoverNuevo] = useState(false);
  const hoverNuevoTimerRef = useRef(null);

  const cargarMaquinas = () => {
    fetch('http://localhost:8080/api/maquinas')
      .then((res) => res.json())
      .then((data) => setMaquinas(data?.maquinas || []))
      .catch(() => setMaquinas([]));
  };

  useEffect(() => {
    cargarMaquinas();
  }, []);

  useEffect(() => {
    const query = (busqueda || '').trim().toLowerCase();
    const filtered = maquinas.filter((m) => {
      if (!query) return true;
      const valoresBusqueda = [
        m.id,
        m.nombre,
        m.anio_fabricacion,
        m.tipo_maquina,
        m.numero_colores,
        m.ancho_max_material_mm,
        m.ancho_max_impresion_mm,
        m.repeticion_min_mm,
        m.repeticion_max_mm,
        m.velocidad_max_maquina_mmin,
        m.velocidad_max_impresion_mmin,
        m.espesor_planchas_mm,
        m.sistemas_secado,
        m.estado,
      ]
        .map((v) => String(v || '').toLowerCase())
        .join(' ');
      return valoresBusqueda.includes(query);
    });
    setFiltrados(filtered);
  }, [busqueda, maquinas]);

  useEffect(() => {
    setPaginaMaquinas(1);
  }, [busqueda, maquinas]);

  const totalPaginasMaquinas = Math.max(1, Math.ceil(filtrados.length / ITEMS_PER_PAGE));
  const maquinasPaginadas = filtrados.slice((paginaMaquinas - 1) * ITEMS_PER_PAGE, paginaMaquinas * ITEMS_PER_PAGE);

  useEffect(() => {
    if (paginaMaquinas > totalPaginasMaquinas) {
      setPaginaMaquinas(totalPaginasMaquinas);
    }
  }, [paginaMaquinas, totalPaginasMaquinas]);

  const abrirNuevaMaquina = () => {
    setModoEdicion(false);
    setMaquinaEditandoId(null);
    setInitialMaquina(null);
    setModalVisible(true);
  };

  const abrirDetalleEdicion = (maquina) => {
    setModoEdicion(true);
    setMaquinaEditandoId(maquina.id);
    setInitialMaquina(maquina);
    setModalVisible(true);
  };

  const handleGuardarMaquina = (data) => {
    const url = modoEdicion && maquinaEditandoId
      ? `http://localhost:8080/api/maquinas/${maquinaEditandoId}`
      : 'http://localhost:8080/api/maquinas';

    fetch(url, {
      method: modoEdicion ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then((res) => res.json().then((d) => ({ ok: res.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) { alert(d?.error || 'No se pudo guardar la máquina'); return; }
        cargarMaquinas();
      })
      .catch(() => alert('No se pudo guardar la máquina'));
  };

  const texto = (v) => (v === null || v === undefined || v === '' ? '-' : String(v));

  const handleEliminarMaquina = async (maquina) => {
    const mensaje = `¿Eliminar la máquina "${maquina.nombre}"?`;
    const confirmar = typeof globalThis.confirm === 'function' ? globalThis.confirm(mensaje) : true;
    if (!confirmar) return;

    try {
      const res = await fetch(`http://localhost:8080/api/maquinas/${maquina.id}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error || 'No se pudo eliminar la máquina');
        return;
      }

      if (modoEdicion && maquinaEditandoId === maquina.id) {
        setModalVisible(false);
        setModoEdicion(false);
        setMaquinaEditandoId(null);
        setForm({ ...emptyForm });
      }

      cargarMaquinas();
    } catch (e) {
      alert('No se pudo eliminar la máquina');
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

  const puedeCrear = usePermission('edit_maquinas');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={{ width: 38 }} />
          <Text style={styles.headerTitle}>Máquinas</Text>
          <View style={styles.btnPlusWrap}>
            <Pressable
              style={[styles.btnPlus, !puedeCrear && { opacity: 0.45 }]}
              onPress={() => puedeCrear && abrirNuevaMaquina()}
              disabled={!puedeCrear}
              onHoverIn={handleHoverNuevoIn}
              onHoverOut={handleHoverNuevoOut}
            >
              <Text style={styles.btnPlusText}>+</Text>
            </Pressable>
            {hoverNuevo && (
              <View style={styles.hoverHint}>
                <Text style={styles.hoverHintText}>{!puedeCrear ? 'Permiso denegado' : 'Nueva máquina'}</Text>
              </View>
            )}
          </View>
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por cualquier campo..."
          value={busqueda}
          onChangeText={setBusqueda}
          placeholderTextColor="#94A3B8"
        />
      </View>

      <View style={styles.mainBlock}>
        {filtrados.length === 0 ? (
          <View style={styles.tableContainer}>
            <Text style={styles.emptyText}>
              {busqueda ? 'No se encontraron resultados' : 'No hay máquinas'}
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.tableContainer}>
            <View style={styles.tableHeader}>
            <View style={[styles.tableCell, styles.colNombre]}>
              <Text style={styles.headerText}>Marca y modelo</Text>
            </View>
            <View style={[styles.tableCell, styles.colTipo]}>
              <Text style={styles.headerText}>Año y tipo</Text>
            </View>
            <View style={[styles.tableCell, styles.colCapacidad]}>
              <Text style={styles.headerText}>Capacidad técnica</Text>
            </View>
            <View style={[styles.tableCell, styles.colRendimiento]}>
              <Text style={styles.headerText}>Velocidad</Text>
            </View>
            <View style={[styles.tableCell, styles.colCola]}>
              <Text style={styles.headerText}>Cola</Text>
            </View>
            <View style={[styles.tableCell, styles.colEstado]}>
              <Text style={styles.headerText}>Estado</Text>
            </View>
            <View style={[styles.tableCell, styles.colAcciones]}>
              <Text style={styles.headerText}>Acciones</Text>
            </View>
          </View>
            {maquinasPaginadas.map((maquina, idx) => (
              <View key={maquina.id} style={[styles.tableRow, (idx + (paginaMaquinas - 1) * ITEMS_PER_PAGE) % 2 === 1 && styles.rowAlternate]}>
              <View style={[styles.tableCell, styles.colNombre]}>
                <Text style={styles.cellText} numberOfLines={2}>{maquina.nombre}</Text>
              </View>
              <View style={[styles.tableCell, styles.colTipo]}>
                <Text style={styles.valueBlock}>
                  {`Año: ${texto(maquina.anio_fabricacion)}\nTipo: ${texto(maquina.tipo_maquina)}`}
                </Text>
              </View>
              <View style={[styles.tableCell, styles.colCapacidad]}>
                <Text style={styles.valueBlock}>
                  {`Colores: ${texto(maquina.numero_colores)}\nMat/Imp: ${texto(maquina.ancho_max_material_mm)}/${texto(maquina.ancho_max_impresion_mm)} mm\nRep: ${texto(maquina.repeticion_min_mm)}-${texto(maquina.repeticion_max_mm)} mm\nPlancha: ${texto(maquina.espesor_planchas_mm)} mm\nSecado: ${texto(maquina.sistemas_secado)}`}
                </Text>
              </View>
              <View style={[styles.tableCell, styles.colRendimiento]}>
                <Text style={styles.valueBlock}>
                  {`Máq: ${texto(maquina.velocidad_max_maquina_mmin)} m/min\nImp: ${texto(maquina.velocidad_max_impresion_mmin)} m/min`}
                </Text>
              </View>
              <View style={[styles.tableCell, styles.colCola]}>
                <TouchableOpacity
                  disabled={!maquina.trabajos_en_cola}
                  onPress={() => maquina.trabajos_en_cola > 0 && navigation.navigate('Producción', { maquinaId: maquina.id })}
                >
                  <Text
                    style={[styles.cellText, maquina.trabajos_en_cola > 0 ? styles.colaLink : styles.colaLinkDisabled]}
                    numberOfLines={1}
                  >
                    {texto(maquina.trabajos_en_cola || 0)}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.tableCell, styles.colEstado]}>
                <Text style={[styles.cellText, { color: (maquina.estado || 'Activa') === 'Activa' ? '#2E7D32' : '#F57C00' }]} numberOfLines={1}>
                  {maquina.estado || 'Activa'}
                </Text>
              </View>
              <View style={[styles.tableCell, styles.colAcciones]}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => abrirDetalleEdicion(maquina)}>
                  <Text style={styles.actionBtnText}>Ver</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.deleteBtn, maquina.trabajos_en_cola > 0 && styles.actionBtnDisabled]} 
                  disabled={maquina.trabajos_en_cola > 0}
                  onPress={() => handleEliminarMaquina(maquina)}
                >
                  <Text style={styles.actionBtnText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
              </View>
            ))}
            {totalPaginasMaquinas > 1 && (
              <View style={styles.paginationRow}>
                <TouchableOpacity
                  style={[styles.paginationBtn, paginaMaquinas === 1 && styles.paginationBtnDisabled]}
                  onPress={() => setPaginaMaquinas((prev) => Math.max(1, prev - 1))}
                  disabled={paginaMaquinas === 1}
                >
                  <Text style={styles.paginationBtnText}>Anterior</Text>
                </TouchableOpacity>
                <Text style={styles.paginationInfo}>Página {paginaMaquinas} de {totalPaginasMaquinas}</Text>
                <TouchableOpacity
                  style={[styles.paginationBtn, paginaMaquinas === totalPaginasMaquinas && styles.paginationBtnDisabled]}
                  onPress={() => setPaginaMaquinas((prev) => Math.min(totalPaginasMaquinas, prev + 1))}
                  disabled={paginaMaquinas === totalPaginasMaquinas}
                >
                  <Text style={styles.paginationBtnText}>Siguiente</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}
      </View>

      <NuevaMaquinaModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setModoEdicion(false); setMaquinaEditandoId(null); setInitialMaquina(null); }}
        modoEdicion={modoEdicion}
        initialMaquina={initialMaquina}
        onSave={handleGuardarMaquina}
        puedeCrear={puedeCrear}
      />
    </View>
  );
}

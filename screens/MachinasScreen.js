import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { usePermission } from './usePermission';
import NuevaMaquinaModal from './NuevaMaquinaModal';
import MaquinaDetalleModal from './MaquinaDetalleModal';
import EmptyState from '../components/EmptyState';
import { useMaquinas } from '../MaquinasContext';

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
    gap: 12,
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
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4E7ED',
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 13,
    color: '#0F172A',
    maxWidth: 320,
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
    paddingRight: 6,
  },
  headerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  // ── Columnas ──────────────────────────────────────────
  colNombre:   { flex: 0.22 },  // Nombre + año
  colColores:  { flex: 0.06, alignItems: 'center' },
  colAnchos:   { flex: 0.14 },  // Mat / Imp mm
  colRep:      { flex: 0.13 },  // Repetición mm
  colPlancha:  { flex: 0.08, alignItems: 'center' },
  colVeloc:    { flex: 0.14 },  // Velocidad
  colCola:     { flex: 0.05, alignItems: 'center' },
  colEstado:   { flex: 0.08 },
  colAcciones: { flex: 0.10, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },

  // ── Texto ─────────────────────────────────────────────
  cellName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 1,
    textAlign: 'center',
  },
  cellMeta: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    textAlign: 'center',
  },
  cellVal: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
    lineHeight: 17,
    textAlign: 'center',
  },
  cellValMuted: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 15,
    textAlign: 'center',
  },

  // ── Estado badge ──────────────────────────────────────
  estadoBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  estadoBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // ── Acciones ──────────────────────────────────────────
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
  actionBtnDisabled: {
    opacity: 0.45,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },

  // ── Cola ──────────────────────────────────────────────
  colaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  colaLink: {
    color: '#334155',
    textDecorationLine: 'underline',
  },

  // ── Vacío / paginación ────────────────────────────────
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
});

export default function MachinasScreen({ currentUser }) {
  const ITEMS_PER_PAGE = 100;
  const navigation = useNavigation();
  const { t } = useTranslation();

  const { maquinas, recargarMaquinas } = useMaquinas();
  const [filtrados, setFiltrados] = useState([]);
  const [paginaMaquinas, setPaginaMaquinas] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [maquinaEditandoId, setMaquinaEditandoId] = useState(null);
  const [initialMaquina, setInitialMaquina] = useState(null);
  const [detalleModalVisible, setDetalleModalVisible] = useState(false);
  const [maquinaDetalle, setMaquinaDetalle] = useState(null);
  const [hoverNuevo, setHoverNuevo] = useState(false);
  const hoverNuevoTimerRef = useRef(null);


  useEffect(() => {
    const query = (busqueda || '').trim().toLowerCase();
    const filtered = maquinas.filter((m) => {
      if (!query) return true;
      return [
        m.id, m.nombre, m.anio_fabricacion, m.tipo_maquina,
        m.numero_colores, m.ancho_max_material_mm, m.ancho_max_impresion_mm,
        m.repeticion_min_mm, m.repeticion_max_mm, m.velocidad_max_maquina_mmin,
        m.velocidad_max_impresion_mmin, m.espesor_planchas_mm, m.sistemas_secado, m.estado,
      ].map((v) => String(v || '').toLowerCase()).join(' ').includes(query);
    });
    setFiltrados(filtered);
  }, [busqueda, maquinas]);

  useEffect(() => { setPaginaMaquinas(1); }, [busqueda, maquinas]);

  const totalPaginasMaquinas = Math.max(1, Math.ceil(filtrados.length / ITEMS_PER_PAGE));
  const maquinasPaginadas = filtrados.slice(
    (paginaMaquinas - 1) * ITEMS_PER_PAGE,
    paginaMaquinas * ITEMS_PER_PAGE,
  );

  useEffect(() => {
    if (paginaMaquinas > totalPaginasMaquinas) setPaginaMaquinas(totalPaginasMaquinas);
  }, [paginaMaquinas, totalPaginasMaquinas]);

  const abrirNuevaMaquina = () => {
    setModoEdicion(false);
    setMaquinaEditandoId(null);
    setInitialMaquina(null);
    setModalVisible(true);
  };

  const abrirDetalleEdicion = (maquina) => {
    setMaquinaDetalle(maquina);
    setDetalleModalVisible(true);
  };

  const handleGuardarMaquina = (data) => {
    fetch('http://localhost:8080/api/maquinas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then((res) => res.json().then((d) => ({ ok: res.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) { alert(d?.error || 'No se pudo guardar'); return; }
        recargarMaquinas();
      })
      .catch(() => alert('No se pudo guardar'));
  };

  const handleGuardarDetalle = (data) => {
    if (!maquinaDetalle?.id) return;
    fetch(`http://localhost:8080/api/maquinas/${maquinaDetalle.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then((res) => res.json().then((d) => ({ ok: res.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) { alert(d?.error || 'No se pudo guardar'); return; }
        recargarMaquinas();
      })
      .catch(() => alert('No se pudo guardar'));
  };

  const fmt = (v) => (v === null || v === undefined || v === '' ? '–' : String(v));

  const handleEliminarMaquina = async (maquina) => {
    const confirmar = typeof globalThis.confirm === 'function'
      ? globalThis.confirm(t('screens.maquinas.deleteConfirm', { nombre: maquina.nombre }))
      : true;
    if (!confirmar) return;
    try {
      const res = await fetch(`http://localhost:8080/api/maquinas/${maquina.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { alert(data?.error || t('common.error')); return; }
      if (detalleModalVisible && maquinaDetalle?.id === maquina.id) {
        setDetalleModalVisible(false);
        setMaquinaDetalle(null);
      }
      recargarMaquinas();
    } catch {
      alert(t('common.error'));
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
  useEffect(() => () => {
    if (hoverNuevoTimerRef.current) clearTimeout(hoverNuevoTimerRef.current);
  }, []);

  const puedeCrear = usePermission('edit_maquinas');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('nav.maquinas')}</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={t('common.searchAny')}
          value={busqueda}
          onChangeText={setBusqueda}
          placeholderTextColor="#94A3B8"
        />
        <View style={styles.btnPlusWrap}>
          <Pressable
            style={[styles.btnPlus, !puedeCrear && styles.btnPlusDisabled]}
            onPress={() => puedeCrear && abrirNuevaMaquina()}
            disabled={!puedeCrear}
            onHoverIn={handleHoverNuevoIn}
            onHoverOut={handleHoverNuevoOut}
          >
            <Text style={styles.btnPlusText}>{t('screens.maquinas.newBtn')}</Text>
          </Pressable>
          {hoverNuevo && (
            <View style={styles.hoverHint}>
              <Text style={styles.hoverHintText}>
                {!puedeCrear ? t('forms.permisoDenegado') : t('screens.maquinas.newMaquina')}
              </Text>
            </View>
          )}
        </View>
      </View>

      {filtrados.length === 0 ? (
          <View style={styles.tableContainer}>
            <EmptyState
              title={busqueda ? t('common.noResults') : t('screens.maquinas.noMaquinas')}
              message={busqueda ? t('common.noResultsMsg') : t('screens.maquinas.noItems')}
              action={!busqueda && puedeCrear ? t('screens.maquinas.newBtn') : undefined}
              onAction={!busqueda && puedeCrear ? abrirNuevaMaquina : undefined}
            />
          </View>
        ) : (
          <ScrollView style={styles.tableContainer}>

            {/* ── Cabecera ── */}
            <View style={styles.tableHeader}>
              <View style={[styles.tableCell, styles.colNombre]}>
                <Text style={styles.headerText}>{t('screens.maquinas.colMaquina')}</Text>
              </View>
              <View style={[styles.tableCell, styles.colColores]}>
                <Text style={styles.headerText}>{t('screens.maquinas.colColores')}</Text>
              </View>
              <View style={[styles.tableCell, styles.colAnchos]}>
                <Text style={styles.headerText}>{t('screens.maquinas.colMatImp')}</Text>
              </View>
              <View style={[styles.tableCell, styles.colRep]}>
                <Text style={styles.headerText}>{t('screens.maquinas.colRepeticion')}</Text>
              </View>
              <View style={[styles.tableCell, styles.colPlancha]}>
                <Text style={styles.headerText}>{t('screens.maquinas.colPlancha')}</Text>
              </View>
              <View style={[styles.tableCell, styles.colVeloc]}>
                <Text style={styles.headerText}>{t('screens.maquinas.colVelocidad')}</Text>
              </View>
              <View style={[styles.tableCell, styles.colCola]}>
                <Text style={styles.headerText}>{t('screens.maquinas.colCola')}</Text>
              </View>
              <View style={[styles.tableCell, styles.colEstado]}>
                <Text style={styles.headerText}>{t('screens.maquinas.colEstado')}</Text>
              </View>
              <View style={[styles.tableCell, styles.colAcciones]} />
            </View>

            {/* ── Filas ── */}
            {maquinasPaginadas.map((maquina, idx) => {
              const estado = maquina.estado || 'Activa';
              const esActiva = estado === 'Activa';
              return (
                <TouchableOpacity
                  key={maquina.id}
                  style={[styles.tableRow, idx % 2 === 1 && styles.rowAlternate]}
                  onPress={() => abrirDetalleEdicion(maquina)}
                  activeOpacity={0.75}
                >
                  {/* Nombre + año */}
                  <View style={[styles.tableCell, styles.colNombre]}>
                    <Text style={styles.cellName} numberOfLines={1}>{maquina.nombre}</Text>
                    {maquina.anio_fabricacion ? (
                      <Text style={styles.cellMeta}>{maquina.anio_fabricacion}</Text>
                    ) : null}
                  </View>

                  {/* Colores */}
                  <View style={[styles.tableCell, styles.colColores]}>
                    <Text style={styles.cellVal}>{fmt(maquina.numero_colores)}</Text>
                  </View>

                  {/* Anchos Mat / Imp */}
                  <View style={[styles.tableCell, styles.colAnchos]}>
                    <Text style={styles.cellVal} numberOfLines={1}>
                      {fmt(maquina.ancho_max_material_mm)} mm
                    </Text>
                    <Text style={styles.cellValMuted} numberOfLines={1}>
                      {fmt(maquina.ancho_max_impresion_mm)} mm imp
                    </Text>
                  </View>

                  {/* Repetición */}
                  <View style={[styles.tableCell, styles.colRep]}>
                    <Text style={styles.cellVal} numberOfLines={1}>
                      {fmt(maquina.repeticion_min_mm)}–{fmt(maquina.repeticion_max_mm)} mm
                    </Text>
                  </View>

                  {/* Plancha */}
                  <View style={[styles.tableCell, styles.colPlancha]}>
                    <Text style={styles.cellVal}>{fmt(maquina.espesor_planchas_mm)} mm</Text>
                  </View>

                  {/* Velocidad máq / imp */}
                  <View style={[styles.tableCell, styles.colVeloc]}>
                    <Text style={styles.cellVal} numberOfLines={1}>
                      {fmt(maquina.velocidad_max_maquina_mmin)} m/min
                    </Text>
                    <Text style={styles.cellValMuted} numberOfLines={1}>
                      {fmt(maquina.velocidad_max_impresion_mmin)} imp
                    </Text>
                  </View>

                  {/* Cola */}
                  <View style={[styles.tableCell, styles.colCola]}>
                    <TouchableOpacity
                      disabled={!maquina.trabajos_en_cola}
                      onPress={() =>
                        maquina.trabajos_en_cola > 0 &&
                        navigation.navigate('Producción', { maquinaId: maquina.id })
                      }
                    >
                      <Text style={[styles.colaText, maquina.trabajos_en_cola > 0 && styles.colaLink]}>
                        {fmt(maquina.trabajos_en_cola || 0)}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Estado */}
                  <View style={[styles.tableCell, styles.colEstado]}>
                    <View style={[styles.estadoBadge, { backgroundColor: esActiva ? '#F0FDF4' : '#FFFBEB' }]}>
                      <Text style={[styles.estadoBadgeText, { color: esActiva ? '#16A34A' : '#D97706' }]}>
                        {estado}
                      </Text>
                    </View>
                  </View>

                  {/* Acciones */}
                  <View style={[styles.tableCell, styles.colAcciones]}>
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        styles.deleteBtn,
                        maquina.trabajos_en_cola > 0 && styles.actionBtnDisabled,
                      ]}
                      disabled={maquina.trabajos_en_cola > 0}
                      onPress={(e) => { e.stopPropagation?.(); handleEliminarMaquina(maquina); }}
                    >
                      <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>{t('common.delete')}</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}

            {totalPaginasMaquinas > 1 && (
              <View style={styles.paginationRow}>
                <TouchableOpacity
                  style={[styles.paginationBtn, paginaMaquinas === 1 && styles.paginationBtnDisabled]}
                  onPress={() => setPaginaMaquinas((p) => Math.max(1, p - 1))}
                  disabled={paginaMaquinas === 1}
                >
                  <Text style={styles.paginationBtnText}>{t('common.prev')}</Text>
                </TouchableOpacity>
                <Text style={styles.paginationInfo}>
                  {t('common.pageOf', { current: paginaMaquinas, total: totalPaginasMaquinas })}
                </Text>
                <TouchableOpacity
                  style={[styles.paginationBtn, paginaMaquinas === totalPaginasMaquinas && styles.paginationBtnDisabled]}
                  onPress={() => setPaginaMaquinas((p) => Math.min(totalPaginasMaquinas, p + 1))}
                  disabled={paginaMaquinas === totalPaginasMaquinas}
                >
                  <Text style={styles.paginationBtnText}>{t('common.next')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}

      <NuevaMaquinaModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setModoEdicion(false);
          setMaquinaEditandoId(null);
          setInitialMaquina(null);
        }}
        modoEdicion={false}
        initialMaquina={null}
        onSave={handleGuardarMaquina}
        puedeCrear={puedeCrear}
      />

      <MaquinaDetalleModal
        visible={detalleModalVisible}
        onClose={() => {
          setDetalleModalVisible(false);
          setMaquinaDetalle(null);
        }}
        maquina={maquinaDetalle}
        onSave={handleGuardarDetalle}
        puedeEditar={puedeCrear}
      />
    </View>
  );
}

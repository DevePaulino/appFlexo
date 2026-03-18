import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { usePermission } from './usePermission';
import NuevaMaquinaModal from './NuevaMaquinaModal';
import EmptyState from '../components/EmptyState';
import { useMaquinas } from '../MaquinasContext';

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
    color: '#F2EAE0',
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
    color: '#F2EAE0',
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
    color: '#F2EAE0',
    fontSize: 11,
    fontWeight: '700',
  },
  mainBlock: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E6DAD0',
    borderRadius: 14,
    marginHorizontal: 12,
    marginVertical: 12,
  },
  tableContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F2EAE0',
    borderWidth: 1.5,
    borderColor: '#E6DAD0',
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 4,
    borderRadius: 10,
    alignItems: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F3EE',
    alignItems: 'center',
    minHeight: 46,
  },
  rowAlternate: {
    backgroundColor: '#F2EAE0',
  },
  tableCell: {
    justifyContent: 'center',
    paddingRight: 6,
  },
  headerText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
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
  },
  cellMeta: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  cellVal: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '500',
    lineHeight: 17,
  },
  cellValMuted: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 15,
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
    backgroundColor: '#F2EAE0',
    borderWidth: 1,
    borderColor: '#E6DAD0',
    paddingHorizontal: 8,
    paddingVertical: 4,
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
      if (modoEdicion && maquinaEditandoId === maquina.id) {
        setModalVisible(false);
        setModoEdicion(false);
        setMaquinaEditandoId(null);
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
        <View style={styles.headerTopRow}>
          <View style={{ width: 38 }} />
          <Text style={styles.headerTitle}>{t('nav.maquinas')}</Text>
          <View style={styles.btnPlusWrap}>
            <Pressable
              style={[styles.btnPlus, !puedeCrear && { opacity: 0.45 }]}
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
              icon="🖨️"
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
                <View
                  key={maquina.id}
                  style={[styles.tableRow, idx % 2 === 1 && styles.rowAlternate]}
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
                      style={styles.actionBtn}
                      onPress={() => abrirDetalleEdicion(maquina)}
                    >
                      <Text style={styles.actionBtnText}>{t('common.view')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        styles.deleteBtn,
                        maquina.trabajos_en_cola > 0 && styles.actionBtnDisabled,
                      ]}
                      disabled={maquina.trabajos_en_cola > 0}
                      onPress={() => handleEliminarMaquina(maquina)}
                    >
                      <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>{t('common.delete')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
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
      </View>

      <NuevaMaquinaModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setModoEdicion(false);
          setMaquinaEditandoId(null);
          setInitialMaquina(null);
        }}
        modoEdicion={modoEdicion}
        initialMaquina={initialMaquina}
        onSave={handleGuardarMaquina}
        puedeCrear={puedeCrear}
      />
    </View>
  );
}

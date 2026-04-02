import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';

const API = 'http://localhost:8080';

// ── Helpers ──────────────────────────────────────────────────────────────────
function authHeaders() {
  const token = global.__MIAPP_ACCESS_TOKEN;
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

// Umbrales según estándares de artes gráficas (ISO 12647)
function deltaColor(v, type = 'lab') {
  if (v === null || v === undefined) return '#94A3B8';
  const abs = Math.abs(v);
  if (type === 'densidad') {
    // Densitometría: ±0.02 excelente, ±0.05 aceptable, >0.05 fuera de rango
    if (abs <= 0.02) return '#16A34A';
    if (abs <= 0.05) return '#D97706';
    return '#DC2626';
  }
  if (type === 'deltaE') {
    // ΔE: <2 imperceptible, <4 aceptable, ≥4 problemático (ISO 12647)
    if (v <= 2) return '#16A34A';
    if (v <= 4) return '#D97706';
    return '#DC2626';
  }
  // L*, a*, b*: ±1 excelente, ±2 aceptable, >2 fuera de rango
  if (abs <= 1.0) return '#16A34A';
  if (abs <= 2.0) return '#D97706';
  return '#DC2626';
}

// ── Vista de mediciones por canal (read-only o editable) ──────────────────────
function CanalField({ label, value, onChangeText, readOnly, keyboardType = 'numeric', fullWidth = false, flex }) {
  return (
    <View style={[s.canalCell, fullWidth && { width: '100%' }, flex && { flex }]}>
      <Text style={s.canalCellKey}>{label}</Text>
      {readOnly ? (
        <Text style={s.canalCellValRO} numberOfLines={1}>{value ?? '—'}</Text>
      ) : (
        <TextInput
          style={s.canalCellInput}
          value={value != null ? String(value) : ''}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholder="—"
          placeholderTextColor="#94A3B8"
        />
      )}
    </View>
  );
}

function CanalesGrid({ canales, canalesInfo, mediciones, onChange, readOnly }) {
  const { t } = useTranslation();
  return (
    <View style={s.canalesGrid}>
      {canales.map((canal) => {
        const color = (canalesInfo?.[canal]?.color) || '#94A3B8';
        const meds = mediciones?.[canal] || {};
        const setMed = (key, val) => onChange && onChange(canal, key, val);
        const showAnilox = readOnly ? !!meds.anilox : true;
        return (
          <View key={canal} style={s.canalCard}>
            {/* Header: dot + nombre */}
            <View style={s.canalHeader}>
              <View style={[s.canalDot, { backgroundColor: color }]} />
              <Text style={s.canalLabel}>{canal}</Text>
            </View>
            {/* Campos apilados: anilox, densidad, luego L/a/b en fila */}
            <View style={s.canalFields}>
              {showAnilox && (
                readOnly ? (
                  <CanalField label="anilox" value={meds.anilox} readOnly fullWidth />
                ) : (
                  <View style={[s.canalCell, { width: '100%' }]}>
                    <Text style={s.canalCellKey}>anilox</Text>
                    <TextInput
                      style={s.canalCellInput}
                      value={meds.anilox != null ? String(meds.anilox) : ''}
                      onChangeText={(v) => setMed('anilox', v)}
                      keyboardType="default"
                      placeholder={t('screens.produccion.condiciones.form.aniloxPlaceholder')}
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                )
              )}
              <CanalField label="densidad" value={meds.densidad} onChangeText={(v) => setMed('densidad', v)} readOnly={readOnly} fullWidth />
              {/* L, a, b en la misma fila */}
              <View style={s.canalLabRow}>
                <CanalField label="L" value={meds.L} onChangeText={(v) => setMed('L', v)} readOnly={readOnly} flex={1} />
                <CanalField label="a" value={meds.a} onChangeText={(v) => setMed('a', v)} readOnly={readOnly} flex={1} />
                <CanalField label="b" value={meds.b} onChangeText={(v) => setMed('b', v)} readOnly={readOnly} flex={1} />
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ── Panel de deltas en columnas por canal ─────────────────────────────────────
function DeltasPanel({ deltas, canalesInfo }) {
  if (!deltas) return null;
  const { t } = useTranslation();
  const { mediciones, ...escalares } = deltas;
  const hasEscalares = Object.keys(escalares).length > 0;
  const hasMeds = mediciones && Object.keys(mediciones).length > 0;
  if (!hasEscalares && !hasMeds) return null;

  const fmtDelta = (v) => v == null ? '—' : (v > 0 ? `+${v}` : String(v));

  return (
    <View style={s.deltaPanel}>
      <Text style={s.deltaPanelTitle}>{t('screens.produccion.condiciones.form.deltasTitle')}</Text>

      {/* Escalares: velocidad, etc. */}
      {hasEscalares && (
        <View style={s.deltaEscalaresRow}>
          {Object.entries(escalares).map(([k, v]) => (
            <View key={k} style={s.deltaEscalarChip}>
              <Text style={s.deltaEscalarKey}>{k.replace('_', ' ')}</Text>
              <Text style={[s.deltaEscalarVal, { color: deltaColor(v, 'lab') }]}>{fmtDelta(v)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Columnas por canal */}
      {hasMeds && (
        <View style={s.deltaCanalGrid}>
          {Object.entries(mediciones).map(([canal, meds]) => {
            const color = canalesInfo?.[canal]?.color || '#94A3B8';
            // ΔE = √(ΔL² + Δa² + Δb²)
            const dL = meds.L, da = meds.a, db = meds.b;
            const deltaE = (dL != null && da != null && db != null)
              ? Math.round(Math.sqrt(dL ** 2 + da ** 2 + db ** 2) * 100) / 100
              : null;
            const deColor = deltaColor(deltaE, 'deltaE');
            return (
              <View key={canal} style={s.deltaCanalCol}>
                {/* Cabecera canal */}
                <View style={s.deltaCanalHead}>
                  <View style={[s.deltaCanalDot, { backgroundColor: color }]} />
                  <Text style={s.deltaCanalName}>{canal}</Text>
                </View>
                {/* ΔE prominente */}
                {deltaE != null && (
                  <View style={[s.deltaEBadge, { borderColor: deColor }]}>
                    <Text style={s.deltaELabel}>ΔE</Text>
                    <Text style={[s.deltaEVal, { color: deColor }]}>{deltaE}</Text>
                  </View>
                )}
                {/* Métricas individuales */}
                {meds.densidad != null && (
                  <View style={s.deltaMetricRow}>
                    <Text style={s.deltaMetricKey}>dens</Text>
                    <Text style={[s.deltaMetricVal, { color: deltaColor(meds.densidad, 'densidad') }]}>{fmtDelta(meds.densidad)}</Text>
                  </View>
                )}
                {['L', 'a', 'b'].map((k) => meds[k] != null ? (
                  <View key={k} style={s.deltaMetricRow}>
                    <Text style={s.deltaMetricKey}>{k}*</Text>
                    <Text style={[s.deltaMetricVal, { color: deltaColor(meds[k], 'lab') }]}>{fmtDelta(meds[k])}</Text>
                  </View>
                ) : null)}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ── Formulario de valores reales (Con desviación) ─────────────────────────────
function FormValoresReales({ refSnap, form, setForm }) {
  const { t } = useTranslation();
  const setField = (key, val) => setForm((p) => ({ ...p, [key]: val }));
  const setMed = (canal, key, val) =>
    setForm((p) => ({
      ...p,
      mediciones: { ...p.mediciones, [canal]: { ...((p.mediciones || {})[canal] || {}), [key]: val } },
    }));

  // Calcular deltas en tiempo real
  const calcularDeltas = () => {
    if (!refSnap) return null;
    const deltas = {};
    if (refSnap.velocidad_mmin != null && form.velocidad_mmin !== '') {
      const diff = parseFloat(form.velocidad_mmin) - parseFloat(refSnap.velocidad_mmin);
      if (!isNaN(diff)) deltas.velocidad_mmin = Math.round(diff * 10000) / 10000;
    }
    const meds_delta = {};
    for (const canal of (form.canales_activos || [])) {
      const mRef = (refSnap.mediciones || {})[canal] || {};
      const mReal = (form.mediciones || {})[canal] || {};
      const cd = {};
      for (const key of ['densidad', 'L', 'a', 'b']) {
        if (mRef[key] != null && mReal[key] !== '' && mReal[key] != null) {
          const diff = parseFloat(mReal[key]) - parseFloat(mRef[key]);
          if (!isNaN(diff)) cd[key] = Math.round(diff * 10000) / 10000;
        }
      }
      // ΔE total (ISO 12647): √(ΔL² + Δa² + Δb²)
      if (cd.L != null && cd.a != null && cd.b != null) {
        cd.deltaE = Math.round(Math.sqrt(cd.L ** 2 + cd.a ** 2 + cd.b ** 2) * 100) / 100;
      }
      if (Object.keys(cd).length) meds_delta[canal] = cd;
    }
    if (Object.keys(meds_delta).length) deltas.mediciones = meds_delta;
    return Object.keys(deltas).length ? deltas : null;
  };

  const deltas = calcularDeltas();
  const canales = form.canales_activos || [];

  return (
    <View>
      <View style={s.fieldRow}>
        <Text style={s.fieldLabel}>{t('screens.produccion.condiciones.form.velocidadLabel')}</Text>
        <TextInput
          style={s.fieldInput}
          value={form.velocidad_mmin != null ? String(form.velocidad_mmin) : ''}
          onChangeText={(v) => setField('velocidad_mmin', v)}
          keyboardType="numeric"
          placeholder={refSnap?.velocidad_mmin != null ? String(refSnap.velocidad_mmin) : '—'}
          placeholderTextColor="#94A3B8"
        />
      </View>
      {canales.length > 0 && (
        <>
          <Text style={s.subTitle}>{t('screens.produccion.condiciones.form.medicionesReales')}</Text>
          <CanalesGrid
            canales={canales}
            canalesInfo={form.canales_info}
            mediciones={form.mediciones}
            onChange={setMed}
            readOnly={false}
          />
        </>
      )}
      <DeltasPanel deltas={deltas} canalesInfo={form.canales_info} />
      <View style={[s.fieldRow, { marginTop: 20 }]}>
        <Text style={s.fieldLabel}>{t('screens.produccion.condiciones.form.notasOperario')}</Text>
        <TextInput
          style={[s.fieldInput, { minHeight: 50, textAlignVertical: 'top' }]}
          value={form.notas_operario || ''}
          onChangeText={(v) => setField('notas_operario', v)}
          multiline
          placeholder={t('screens.produccion.condiciones.form.notasPlaceholder')}
          placeholderTextColor="#94A3B8"
        />
      </View>
    </View>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function RegistroCondicionesModal({ visible, trabajo, maquinas, onClose, onConfirm }) {
  const [paso, setPaso] = useState('elegir'); // 'elegir' | 'clon' | 'desviacion' | 'similar'
  const [latestTest, setLatestTest] = useState(null);
  const [loadingTest, setLoadingTest] = useState(false);
  const [testError, setTestError] = useState(null);
  const [formDesviacion, setFormDesviacion] = useState(null);
  const { t } = useTranslation();

  const maquinaId = trabajo?._maquina_id;
  const material = trabajo?.material || trabajo?.datos_presupuesto?.material || '';

  // Cargar el test más reciente cuando se abre el modal
  useEffect(() => {
    if (!visible || !maquinaId) return;
    setLoadingTest(true);
    setTestError(null);
    setLatestTest(null);
    const params = material ? `?material=${encodeURIComponent(material)}` : '';
    fetch(`${API}/api/maquinas/${maquinaId}/tests/latest${params}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => {
        setLatestTest(data.test || null);
        if (data.test) {
          // Pre-rellenar formulario de desviación con los valores del test
          const t = data.test;
          setFormDesviacion({
            velocidad_mmin: t.velocidad_mmin != null ? String(t.velocidad_mmin) : '',
            notas_operario: '',
            canales_activos: t.canales_activos || [],
            canales_info: t.canales_info || {},
            mediciones: JSON.parse(JSON.stringify(t.mediciones || {})),
          });
        }
      })
      .catch(() => setTestError(t('screens.produccion.condiciones.errorCargarTest')))
      .finally(() => setLoadingTest(false));
  }, [visible, maquinaId, material]);

  const handleClose = () => {
    setPaso('elegir');
    onClose();
  };

  const confirmar = (condiciones) => {
    setPaso('elegir');
    onConfirm(condiciones);
  };

  const maquinaNombre =
    maquinas?.find((m) => String(m.id) === String(maquinaId))?.nombre || trabajo?._maquina_nombre || '';

  // ── Paso: elegir modo ────────────────────────────────────────────────────
  if (paso === 'elegir') {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
        <View style={s.overlay}>
          <View style={s.card}>
            <Text style={s.cardTitle}>{t('screens.produccion.condiciones.modalTitle')}</Text>
            <Text style={s.cardSub}>{trabajo?.nombre || ''}</Text>
            {maquinaNombre ? <Text style={s.maquinaTag}>⚙ {maquinaNombre}</Text> : null}

            <TouchableOpacity style={s.opcionBtn} onPress={() => setPaso('clon')}>
              <Text style={s.opcionIcon}>✓</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.opcionLabel}>{t('screens.produccion.condiciones.elegir.opcionIgualesLabel')}</Text>
                <Text style={s.opcionHint}>{t('screens.produccion.condiciones.elegir.opcionIgualesHint', { maquina: maquinaNombre || t('screens.produccion.condiciones.elegir.laMaquina') })}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={s.opcionBtn} onPress={() => setPaso('desviacion')}>
              <Text style={s.opcionIcon}>Δ</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.opcionLabel}>{t('screens.produccion.condiciones.elegir.opcionDesviacionLabel')}</Text>
                <Text style={s.opcionHint}>{t('screens.produccion.condiciones.elegir.opcionDesviacionHint')}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[s.opcionBtn, s.opcionBtnGhost]} onPress={() => confirmar({ origen: 'no_registrado' })}>
              <Text style={s.opcionIcon}>—</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.opcionLabel, { color: '#64748B' }]}>{t('screens.produccion.condiciones.elegir.opcionNoRegistrarLabel')}</Text>
                <Text style={s.opcionHint}>{t('screens.produccion.condiciones.elegir.opcionNoRegistrarHint')}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={s.cancelLink} onPress={handleClose}>
              <Text style={s.cancelLinkText}>{t('screens.produccion.condiciones.cancelar')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // ── Paso: clonar test ────────────────────────────────────────────────────
  if (paso === 'clon') {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
        <View style={s.overlay}>
          <View style={[s.card, { maxHeight: '90%' }]}>
            <TouchableOpacity style={s.backBtn} onPress={() => setPaso('elegir')}>
              <Text style={s.backBtnText}>{t('screens.produccion.condiciones.volver')}</Text>
            </TouchableOpacity>
            <Text style={s.cardTitle}>{t('screens.produccion.condiciones.clon.titulo')}</Text>
            <ScrollView style={{ flex: 1 }}>
              {loadingTest && <ActivityIndicator color="#4F46E5" style={{ marginVertical: 20 }} />}
              {testError && <Text style={s.errorText}>{testError}</Text>}
              {!loadingTest && !latestTest && !testError && (
                <Text style={s.emptyText}>{t('screens.produccion.condiciones.clon.sinTests')}</Text>
              )}
              {latestTest && (
                <View>
                  <View style={s.snapRow}><Text style={s.snapKey}>{t('screens.produccion.condiciones.clon.fecha')}</Text><Text style={s.snapVal}>{latestTest.fecha || '—'}</Text></View>
                  <View style={s.snapRow}><Text style={s.snapKey}>{t('screens.produccion.condiciones.clon.material')}</Text><Text style={s.snapVal}>{latestTest.material || '—'}</Text></View>
                  <View style={s.snapRow}><Text style={s.snapKey}>{t('screens.produccion.condiciones.clon.velocidad')}</Text><Text style={s.snapVal}>{latestTest.velocidad_mmin != null ? `${latestTest.velocidad_mmin} m/min` : '—'}</Text></View>
                  {latestTest.anilox ? <View style={s.snapRow}><Text style={s.snapKey}>{t('screens.produccion.condiciones.clon.anilox')}</Text><Text style={s.snapVal}>{latestTest.anilox}</Text></View> : null}
                  <View style={s.snapRow}><Text style={s.snapKey}>{t('screens.produccion.condiciones.clon.fabTintas')}</Text><Text style={s.snapVal}>{latestTest.fabricante_tintas || '—'}</Text></View>
                  <View style={s.snapRow}><Text style={s.snapKey}>{t('screens.produccion.condiciones.clon.fabPlancha')}</Text><Text style={s.snapVal}>{latestTest.fabricante_plancha || '—'}</Text></View>
                  {latestTest.referencia_plancha ? <View style={s.snapRow}><Text style={s.snapKey}>{t('screens.produccion.condiciones.clon.refPlancha')}</Text><Text style={s.snapVal}>{latestTest.referencia_plancha}</Text></View> : null}
                  {(latestTest.canales_activos || []).length > 0 && (
                    <CanalesGrid
                      canales={latestTest.canales_activos}
                      canalesInfo={latestTest.canales_info}
                      mediciones={latestTest.mediciones}
                      readOnly
                    />
                  )}
                  {latestTest.notas ? <Text style={s.notasText}>📝 {latestTest.notas}</Text> : null}
                </View>
              )}
            </ScrollView>
            <TouchableOpacity
              style={[s.confirmBtn, (!latestTest || loadingTest) && s.confirmBtnDisabled]}
              disabled={!latestTest || loadingTest}
              onPress={() => confirmar({
                origen: 'clon_test_maquina',
                maquina_id: maquinaId,
                maquina_nombre: maquinaNombre,
                test_referencia_id: latestTest?.id,
                test_referencia_snapshot: latestTest,
                valores_reales: latestTest,
                deltas: {},
              })}
            >
              <Text style={s.confirmBtnText}>{t('screens.produccion.condiciones.clon.confirmar')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // ── Paso: con desviación ─────────────────────────────────────────────────
  if (paso === 'desviacion') {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
        <View style={s.overlay}>
          <View style={[s.card, { maxHeight: '95%' }]}>
            <TouchableOpacity style={s.backBtn} onPress={() => setPaso('elegir')}>
              <Text style={s.backBtnText}>{t('screens.produccion.condiciones.volver')}</Text>
            </TouchableOpacity>
            <Text style={s.cardTitle}>{t('screens.produccion.condiciones.desviacion.titulo')}</Text>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: 16 }}>
              {loadingTest && <ActivityIndicator color="#4F46E5" style={{ marginVertical: 20 }} />}
              {!loadingTest && !latestTest && (
                <Text style={s.emptyText}>{t('screens.produccion.condiciones.desviacion.sinReferencia')}</Text>
              )}
              {formDesviacion && (
                <FormValoresReales
                  refSnap={latestTest}
                  form={formDesviacion}
                  setForm={setFormDesviacion}
                />
              )}
            </ScrollView>
            <TouchableOpacity
              style={s.confirmBtn}
              onPress={() => {
                const vals = {
                  ...formDesviacion,
                  velocidad_mmin: formDesviacion?.velocidad_mmin !== '' ? parseFloat(formDesviacion?.velocidad_mmin) : null,
                };
                confirmar({
                  origen: 'con_desviacion',
                  maquina_id: maquinaId,
                  maquina_nombre: maquinaNombre,
                  test_referencia_id: latestTest?.id || null,
                  test_referencia_snapshot: latestTest || null,
                  valores_reales: vals,
                });
              }}
            >
              <Text style={s.confirmBtnText}>{t('screens.produccion.condiciones.desviacion.confirmar')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return null;
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    width: '100%', maxWidth: 860, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }, elevation: 10,
  },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#1E1B4B', marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#475569', marginBottom: 4 },
  maquinaTag: { fontSize: 12, color: '#4F46E5', fontWeight: '600', marginBottom: 16 },
  opcionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12,
    padding: 14, marginBottom: 10, backgroundColor: '#FAFBFF',
  },
  opcionBtnGhost: { borderStyle: 'dashed', backgroundColor: '#F8FAFC' },
  opcionIcon: { fontSize: 18, fontWeight: '700', color: '#4F46E5', width: 28, textAlign: 'center' },
  opcionLabel: { fontSize: 14, fontWeight: '700', color: '#1E1B4B', marginBottom: 2 },
  opcionHint: { fontSize: 12, color: '#64748B' },
  cancelLink: { alignItems: 'center', marginTop: 8, paddingVertical: 8 },
  cancelLinkText: { fontSize: 13, color: '#94A3B8' },
  backBtn: { marginBottom: 12 },
  backBtnText: { fontSize: 13, color: '#4F46E5', fontWeight: '600' },
  confirmBtn: {
    backgroundColor: '#4F46E5', borderRadius: 10,
    paddingVertical: 13, alignItems: 'center', marginTop: 14,
  },
  confirmBtnDisabled: { backgroundColor: '#C7D2FE' },
  confirmBtnText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  errorText: { color: '#DC2626', fontSize: 13, marginVertical: 8 },
  emptyText: { color: '#94A3B8', fontSize: 13, marginVertical: 12, textAlign: 'center' },
  snapRow: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  snapKey: { fontSize: 12, color: '#64748B', width: 100 },
  snapVal: { fontSize: 12, fontWeight: '600', color: '#1E1B4B', flex: 1 },
  notasText: { fontSize: 12, color: '#475569', marginTop: 10, fontStyle: 'italic' },
  subTitle: { fontSize: 12, fontWeight: '700', color: '#4F46E5', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 22, marginBottom: 12 },
  canalesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  canalCard: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12,
    padding: 14, minWidth: 130, flex: 1,
    backgroundColor: '#FAFBFF',
  },
  canalHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  canalDot: { width: 10, height: 10, borderRadius: 5 },
  canalLabel: { fontSize: 14, fontWeight: '800', color: '#1E1B4B' },
  canalFields: { gap: 8 },
  canalLabRow: { flexDirection: 'row', gap: 6 },
  canalCell: { marginBottom: 0 },
  canalCellKey: { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 },
  canalCellValRO: { fontSize: 13, fontWeight: '700', color: '#1E1B4B' },
  canalCellInput: {
    fontSize: 13, color: '#1E1B4B', fontWeight: '600',
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D9DBFF',
    borderRadius: 7, paddingHorizontal: 8, paddingVertical: 6,
    textAlign: 'center', width: '100%',
  },
  fieldRow: { marginBottom: 20 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  fieldInput: {
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9,
    fontSize: 14, color: '#0F172A',
  },
  deltaPanel: {
    backgroundColor: '#F8FAFF', borderRadius: 12,
    borderWidth: 1, borderColor: '#C7D2FE',
    padding: 16, marginTop: 20,
  },
  deltaPanelTitle: { fontSize: 10, fontWeight: '800', color: '#4F46E5', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 },
  // Escalares (velocidad, etc.)
  deltaEscalaresRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  deltaEscalarChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EEF2FF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  deltaEscalarKey: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  deltaEscalarVal: { fontSize: 13, fontWeight: '800' },
  // Grid de columnas por canal
  deltaCanalGrid: { flexDirection: 'row', gap: 8 },
  deltaCanalCol: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#E4E7ED', padding: 12 },
  deltaCanalHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  deltaCanalDot: { width: 9, height: 9, borderRadius: 5 },
  deltaCanalName: { fontSize: 13, fontWeight: '800', color: '#1E1B4B' },
  // ΔE badge prominente
  deltaEBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 10 },
  deltaELabel: { fontSize: 11, fontWeight: '800', color: '#64748B', letterSpacing: 0.5 },
  deltaEVal: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  // Métricas individuales
  deltaMetricRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  deltaMetricKey: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  deltaMetricVal: { fontSize: 13, fontWeight: '700' },
});

import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { CanalesGrid, DeltasPanel } from './CondicionesView';

const API = 'http://localhost:8080';

// ── Helpers ──────────────────────────────────────────────────────────────────
function authHeaders() {
  const token = global.__MIAPP_ACCESS_TOKEN;
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
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
            layout="reel"
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
          const testData = data.test;

          // ── Canales del test de máquina ──────────────────────────────
          const testCanales = testData.canales_activos || [];
          const testCanalesInfo = testData.canales_info || {};

          // ── Canales extra del trabajo (Pantones / spots) ─────────────
          const CMYK_COLORS = { C: '#00AEEF', M: '#EC008C', Y: '#FFF200', K: '#231F20' };
          // Buscar datos en datos_presupuesto Y en la raíz del trabajo (el backend guarda en ambos sitios)
          const dp = trabajo?.datos_presupuesto || {};
          const rootSelectedTintas = trabajo?.selectedTintas || [];
          const allSelectedTintas = dp.selectedTintas?.length ? dp.selectedTintas : rootSelectedTintas;
          const allPantones = dp.pantones || trabajo?.pantones || [];
          const allDetalleTinta = dp.detalleTintaEspecial || trabajo?.detalleTintaEspecial || [];

          const jobCanalesInfo = {};
          const jobExtra = []; // canales del trabajo no presentes en el test

          // CMYK del pedido (por si el test no los incluye todos)
          allSelectedTintas.filter((x) => ['C', 'M', 'Y', 'K'].includes(x)).forEach((x) => {
            if (!testCanales.includes(x)) {
              jobExtra.push(x);
              jobCanalesInfo[x] = { color: CMYK_COLORS[x], tipo: 'cmyk' };
            }
          });

          // Tintas planas (Pantones) del pedido — de las 3 fuentes posibles
          const spotSet = new Set();
          allSelectedTintas.filter((x) => !['C', 'M', 'Y', 'K'].includes(x)).forEach((x) => spotSet.add(x));
          allPantones.forEach((p) => {
            const n = p.label || p.key || '';
            if (n && !['C', 'M', 'Y', 'K'].includes(n)) spotSet.add(n);
          });
          // detalleTintaEspecial puede ser string[] o string
          (Array.isArray(allDetalleTinta) ? allDetalleTinta : (allDetalleTinta ? [allDetalleTinta] : [])).forEach((x) => {
            if (x && !['C', 'M', 'Y', 'K'].includes(x)) spotSet.add(x);
          });

          spotSet.forEach((name) => {
            jobCanalesInfo[name] = { color: '#8B5CF6', tipo: 'spot' };
          });

          // Canales del trabajo: CMYK del pedido + spots del pedido
          const jobCmyk = allSelectedTintas.filter((x) => ['C', 'M', 'Y', 'K'].includes(x));
          const jobSpots = [...spotSet];
          // Si el pedido no tiene canales definidos (datos antiguos), usar los del test
          let mergedCanales = [...jobCmyk, ...jobSpots];
          if (mergedCanales.length === 0) mergedCanales = [...testCanales];

          // canalesInfo: test tiene prioridad para CMYK compartidos, jobCanalesInfo para spots
          const mergedCanalesInfo = { ...jobCanalesInfo, ...testCanalesInfo };

          // Pre-rellenar mediciones con los valores del test para canales que coincidan
          const mergedMeds = {};
          mergedCanales.forEach((c) => {
            mergedMeds[c] = testData.mediciones?.[c]
              ? JSON.parse(JSON.stringify(testData.mediciones[c]))
              : {};
          });

          setFormDesviacion({
            velocidad_mmin: testData.velocidad_mmin != null ? String(testData.velocidad_mmin) : '',
            notas_operario: '',
            canales_activos: mergedCanales,
            canales_info: mergedCanalesInfo,
            mediciones: mergedMeds,
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
                      layout="reel"
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
          <View style={[s.card, { maxHeight: '90%' }]}>
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
    width: '100%', maxWidth: 560, padding: 20,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 8,
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
  fieldRow: { marginBottom: 20 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  fieldInput: {
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9,
    fontSize: 14, color: '#0F172A',
  },
});

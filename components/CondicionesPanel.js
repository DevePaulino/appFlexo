import React, { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';

const API = 'http://localhost:8080';

function authHeaders() {
  const token = global.__MIAPP_ACCESS_TOKEN;
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

function SnapRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <View style={s.snapRow}>
      <Text style={s.snapKey}>{label}</Text>
      <Text style={s.snapVal}>{value}</Text>
    </View>
  );
}

function TestSnapshot({ test, materialMatch }) {
  if (!test) return <Text style={s.emptyText}>No hay tests registrados para esta máquina.</Text>;
  const canales = test.canales_activos || [];
  return (
    <View>
      {materialMatch === false && (
        <View style={s.warnBadge}>
          <Text style={s.warnBadgeText}>⚠ No se encontró test con este material exacto — mostrando el más reciente</Text>
        </View>
      )}
      <SnapRow label="Fecha" value={test.fecha} />
      <SnapRow label="Material" value={test.material} />
      <SnapRow label="Velocidad" value={test.velocidad_mmin != null ? `${test.velocidad_mmin} m/min` : null} />
      {test.anilox ? <SnapRow label="Anilox" value={test.anilox} /> : null}
      <SnapRow label="Fab. tintas" value={test.fabricante_tintas} />
      <SnapRow label="Fab. plancha" value={test.fabricante_plancha} />
      {test.referencia_plancha ? <SnapRow label="Ref. plancha" value={test.referencia_plancha} /> : null}
      {canales.length > 0 && (
        <View style={s.canalesWrap}>
          <Text style={s.canalSectionLabel}>Mediciones por canal</Text>
          <View style={s.canalesGrid}>
            {canales.map((canal) => {
              const color = (test.canales_info?.[canal]?.color) || '#94A3B8';
              const meds = (test.mediciones || {})[canal] || {};
              return (
                <View key={canal} style={s.canalCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <View style={[s.canalDot, { backgroundColor: color }]} />
                    <Text style={s.canalLabel}>{canal}</Text>
                  </View>
                  {meds.anilox ? (
                    <View style={s.canalRow}>
                      <Text style={s.canalKey}>anilox</Text>
                      <Text style={[s.canalVal, { fontSize: 10 }]} numberOfLines={1}>{meds.anilox}</Text>
                    </View>
                  ) : null}
                  {['densidad', 'L', 'a', 'b'].map((key) => (
                    <View key={key} style={s.canalRow}>
                      <Text style={s.canalKey}>{key}</Text>
                      <Text style={s.canalVal}>{meds[key] ?? '—'}</Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        </View>
      )}
      {test.notas ? <Text style={s.notasText}>📝 {test.notas}</Text> : null}
    </View>
  );
}

export default function CondicionesPanel({ visible, trabajo, maquinas, onClose }) {
  const [vista, setVista] = useState('menu'); // 'menu' | 'maquina' | 'similar'
  const [loading, setLoading] = useState(false);
  const [testData, setTestData] = useState(null);
  const [testMaterialMatch, setTestMaterialMatch] = useState(null);
  const [testError, setTestError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState(null);
  const [busquedaLoading, setBusquedaLoading] = useState(false);
  const [similarDetalle, setSimilarDetalle] = useState(null);

  const maquinaId = trabajo?._maquina_id;
  const maquinaNombre =
    maquinas?.find((m) => String(m.id) === String(maquinaId))?.nombre || trabajo?._maquina_nombre || 'la máquina';
  const material = trabajo?.material || trabajo?.datos_presupuesto?.material || '';

  const handleClose = () => {
    setVista('menu');
    setTestData(null);
    setTestError(null);
    setBusqueda('');
    setResultados(null);
    setSimilarDetalle(null);
    onClose();
  };

  const verCondicionesMaquina = () => {
    if (!maquinaId) return;
    setVista('maquina');
    setLoading(true);
    setTestData(null);
    setTestError(null);
    const params = material ? `?material=${encodeURIComponent(material)}` : '';
    fetch(`${API}/api/maquinas/${maquinaId}/tests/latest${params}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => { setTestData(d.test || null); setTestMaterialMatch(d.material_match ?? null); })
      .catch(() => setTestError('No se pudieron cargar las condiciones'))
      .finally(() => setLoading(false));
  };

  const buscarSimilar = () => {
    setBusquedaLoading(true);
    setResultados(null);
    const q = busqueda.trim();
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (maquinaId) params.set('maquina_id', String(maquinaId));
    fetch(`${API}/api/produccion/buscar-con-condiciones?${params}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setResultados(d.resultados || []))
      .catch(() => setResultados([]))
      .finally(() => setBusquedaLoading(false));
  };

  const verDetalleSimilar = (item) => {
    setLoading(true);
    fetch(`${API}/api/pedidos/${item.id}/condiciones`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setSimilarDetalle({ pedido: item, condiciones: d.condiciones }))
      .catch(() => setSimilarDetalle({ pedido: item, condiciones: null }))
      .finally(() => setLoading(false));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={s.overlay}>
        <View style={[s.card, { maxHeight: '90%' }]}>

          {/* ── Menú ── */}
          {vista === 'menu' && (
            <>
              <Text style={s.cardTitle}>Condiciones de impresión</Text>
              <Text style={s.cardSub}>{trabajo?.nombre || ''}</Text>
              {maquinaNombre ? <Text style={s.maquinaTag}>⚙ {maquinaNombre}</Text> : null}

              <TouchableOpacity style={s.opcionBtn} onPress={verCondicionesMaquina}>
                <Text style={s.opcionIcon}>⚙</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.opcionLabel}>Ver condiciones de la máquina</Text>
                  <Text style={s.opcionHint}>Test más reciente de {maquinaNombre}{material ? ` con ${material}` : ''}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={s.opcionBtn} onPress={() => { setVista('similar'); buscarSimilar(); }}>
                <Text style={s.opcionIcon}>🔍</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.opcionLabel}>Buscar pedido similar</Text>
                  <Text style={s.opcionHint}>Consulta las condiciones con las que se imprimió un trabajo parecido</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={s.cancelLink} onPress={handleClose}>
                <Text style={s.cancelLinkText}>Cerrar</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Condiciones de la máquina ── */}
          {vista === 'maquina' && (
            <>
              <TouchableOpacity style={s.backBtn} onPress={() => setVista('menu')}>
                <Text style={s.backBtnText}>← Volver</Text>
              </TouchableOpacity>
              <Text style={s.cardTitle}>Test de referencia</Text>
              <Text style={s.cardSub}>{maquinaNombre}</Text>
              <ScrollView style={{ flex: 1, marginTop: 12 }}>
                {loading && <ActivityIndicator color="#4F46E5" style={{ marginVertical: 20 }} />}
                {testError && <Text style={s.errorText}>{testError}</Text>}
                {!loading && <TestSnapshot test={testData} materialMatch={testMaterialMatch} />}
              </ScrollView>
              <TouchableOpacity style={s.closeBtn} onPress={handleClose}>
                <Text style={s.closeBtnText}>Cerrar</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Buscar pedido similar ── */}
          {vista === 'similar' && !similarDetalle && (
            <>
              <TouchableOpacity style={s.backBtn} onPress={() => setVista('menu')}>
                <Text style={s.backBtnText}>← Volver</Text>
              </TouchableOpacity>
              <Text style={s.cardTitle}>Buscar pedido similar</Text>
              <View style={s.searchRow}>
                <TextInput
                  style={s.searchInput}
                  value={busqueda}
                  onChangeText={setBusqueda}
                  placeholder="Nombre, nº pedido, cliente…"
                  placeholderTextColor="#94A3B8"
                  onSubmitEditing={buscarSimilar}
                  returnKeyType="search"
                />
                <TouchableOpacity style={s.searchBtn} onPress={buscarSimilar}>
                  <Text style={s.searchBtnText}>Buscar</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={{ flex: 1 }}>
                {busquedaLoading && <ActivityIndicator color="#4F46E5" style={{ marginVertical: 20 }} />}
                {!busquedaLoading && resultados !== null && resultados.length === 0 && (
                  <Text style={s.emptyText}>Sin resultados. Prueba con otro término.</Text>
                )}
                {(resultados || []).map((item) => (
                  <TouchableOpacity key={item.id} style={s.resultItem} onPress={() => verDetalleSimilar(item)}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.resultNombre} numberOfLines={1}>#{item.numero_pedido} {item.nombre}</Text>
                      <Text style={s.resultSub} numberOfLines={1}>{item.cliente} · {item.maquina_nombre || '—'}</Text>
                      {item.resumen?.material && <Text style={s.resultMeta}>{item.resumen.material}</Text>}
                    </View>
                    <Text style={s.resultArrow}>›</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {/* ── Detalle pedido similar ── */}
          {vista === 'similar' && similarDetalle && (
            <>
              <TouchableOpacity style={s.backBtn} onPress={() => setSimilarDetalle(null)}>
                <Text style={s.backBtnText}>← Resultados</Text>
              </TouchableOpacity>
              <Text style={s.cardTitle}>#{similarDetalle.pedido.numero_pedido} {similarDetalle.pedido.nombre}</Text>
              <Text style={s.cardSub}>{similarDetalle.pedido.maquina_nombre || '—'} · {similarDetalle.pedido.cliente}</Text>
              <ScrollView style={{ flex: 1, marginTop: 12 }}>
                {loading && <ActivityIndicator color="#4F46E5" style={{ marginVertical: 20 }} />}
                {!loading && similarDetalle.condiciones && (
                  <TestSnapshot
                    test={similarDetalle.condiciones.valores_reales || similarDetalle.condiciones.test_referencia_snapshot}
                    materialMatch={null}
                  />
                )}
                {!loading && !similarDetalle.condiciones && (
                  <Text style={s.emptyText}>No hay condiciones detalladas disponibles.</Text>
                )}
              </ScrollView>
              <TouchableOpacity style={s.closeBtn} onPress={handleClose}>
                <Text style={s.closeBtnText}>Cerrar</Text>
              </TouchableOpacity>
            </>
          )}

        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 480, padding: 20, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 10 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#1E1B4B', marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#475569', marginBottom: 4 },
  maquinaTag: { fontSize: 12, color: '#4F46E5', fontWeight: '600', marginBottom: 16 },
  opcionBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, marginBottom: 10, backgroundColor: '#FAFBFF' },
  opcionIcon: { fontSize: 18, width: 28, textAlign: 'center' },
  opcionLabel: { fontSize: 14, fontWeight: '700', color: '#1E1B4B', marginBottom: 2 },
  opcionHint: { fontSize: 12, color: '#64748B' },
  cancelLink: { alignItems: 'center', marginTop: 8, paddingVertical: 8 },
  cancelLinkText: { fontSize: 13, color: '#94A3B8' },
  backBtn: { marginBottom: 12 },
  backBtnText: { fontSize: 13, color: '#4F46E5', fontWeight: '600' },
  closeBtn: { marginTop: 14, paddingVertical: 11, borderRadius: 10, alignItems: 'center', borderWidth: 1.5, borderColor: '#E2E8F0' },
  closeBtnText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  errorText: { color: '#DC2626', fontSize: 13, marginVertical: 8 },
  emptyText: { color: '#94A3B8', fontSize: 13, marginVertical: 16, textAlign: 'center' },
  snapRow: { flexDirection: 'row', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  snapKey: { fontSize: 12, color: '#64748B', width: 100 },
  snapVal: { fontSize: 12, fontWeight: '600', color: '#1E1B4B', flex: 1 },
  notasText: { fontSize: 12, color: '#475569', marginTop: 10, fontStyle: 'italic' },
  warnBadge: { backgroundColor: '#FEF3C7', borderRadius: 8, padding: 8, marginBottom: 10 },
  warnBadgeText: { fontSize: 12, color: '#92400E' },
  canalesWrap: { marginTop: 12 },
  canalSectionLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  canalesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  canalCard: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 10, minWidth: 80, flex: 1 },
  canalDot: { width: 8, height: 8, borderRadius: 4 },
  canalLabel: { fontSize: 12, fontWeight: '700', color: '#1E1B4B' },
  canalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  canalKey: { fontSize: 11, color: '#64748B' },
  canalVal: { fontSize: 11, fontWeight: '600', color: '#1E1B4B' },
  searchRow: { flexDirection: 'row', gap: 8, marginVertical: 12 },
  searchInput: { flex: 1, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, color: '#0F172A' },
  searchBtn: { backgroundColor: '#4F46E5', borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' },
  searchBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  resultItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', gap: 8 },
  resultNombre: { fontSize: 13, fontWeight: '700', color: '#1E1B4B' },
  resultSub: { fontSize: 12, color: '#64748B', marginTop: 1 },
  resultMeta: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  resultArrow: { fontSize: 18, color: '#CBD5E1' },
});

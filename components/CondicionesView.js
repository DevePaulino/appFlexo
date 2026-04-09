/**
 * CondicionesView — componente unificado para mostrar/editar mediciones de colorimetría.
 *
 * Exports:
 *   deltaColor(v, type)  — colores ISO 12647
 *   CanalesGrid(props)   — grid o reel de tarjetas por canal (read-only o editable)
 *   DeltasPanel(props)   — panel de deltas con tabs por canal
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView,
  TouchableOpacity, StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';

// ── Umbrales ISO 12647 ────────────────────────────────────────────────────────
export function deltaColor(v, type = 'lab') {
  if (v === null || v === undefined) return '#94A3B8';
  const abs = Math.abs(v);
  if (type === 'densidad') {
    // Densitometría: ±0.02 excelente, ±0.05 aceptable, >0.05 fuera de rango
    if (abs <= 0.02) return '#16A34A';
    if (abs <= 0.05) return '#D97706';
    return '#DC2626';
  }
  if (type === 'deltaE') {
    // ΔE: ≤2 imperceptible, ≤4 aceptable, >4 problemático (ISO 12647)
    if (v <= 2) return '#16A34A';
    if (v <= 4) return '#D97706';
    return '#DC2626';
  }
  // L*, a*, b*: ±1 excelente, ±2 aceptable, >2 fuera de rango
  if (abs <= 1.0) return '#16A34A';
  if (abs <= 2.0) return '#D97706';
  return '#DC2626';
}

function deltaBg(v, type = 'lab') {
  const c = deltaColor(v, type);
  if (c === '#16A34A') return '#DCFCE7';
  if (c === '#D97706') return '#FEF9C3';
  return '#FEE2E2';
}

function fmtDelta(v) {
  return v == null ? null : (v > 0 ? `+${v}` : String(v));
}

// ── Campo individual (read-only con badge opcional, o input editable) ─────────
function CanalField({ label, value, delta, deltaType, onChangeText, readOnly, keyboardType = 'numeric', fullWidth = false, flex }) {
  const dStr = fmtDelta(delta);
  const dColor = delta != null ? deltaColor(delta, deltaType || (label === 'densidad' ? 'densidad' : 'lab')) : null;
  const dBgColor = delta != null ? deltaBg(delta, deltaType || (label === 'densidad' ? 'densidad' : 'lab')) : null;

  return (
    <View style={[cv.canalCell, fullWidth && { width: '100%' }, flex != null && { flex }]}>
      <Text style={cv.canalCellKey}>{label}</Text>
      {readOnly ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={cv.canalCellValRO}>{value ?? '—'}</Text>
          {dStr != null && (
            <View style={{ paddingHorizontal: 6, paddingVertical: 2, backgroundColor: dBgColor, borderRadius: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: dColor }}>{dStr}</Text>
            </View>
          )}
        </View>
      ) : (
        <TextInput
          style={cv.canalCellInput}
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

// ── Grid/Reel de tarjetas por canal ──────────────────────────────────────────
/**
 * @param {string[]}  canales        - lista de nombres de canal
 * @param {object}    canalesInfo    - { [canal]: { color, tipo } }
 * @param {object}    mediciones     - { [canal]: { anilox?, densidad?, L?, a?, b? } }
 * @param {object}    [deltas]       - { mediciones: { [canal]: {...} }, ...escalares }
 * @param {boolean}   [readOnly]     - true = display, false = inputs (default: true)
 * @param {'grid'|'reel'} [layout]  - 'grid' = flex wrap, 'reel' = horizontal scroll (default: 'grid')
 * @param {function}  [onChange]     - (canal, key, val) => void  (solo en !readOnly)
 */
export function CanalesGrid({ canales, canalesInfo, mediciones, deltas, readOnly = true, layout = 'grid', onChange }) {
  const cards = (canales || []).map((canal) => {
    const color = canalesInfo?.[canal]?.color || '#94A3B8';
    const isSpot = canalesInfo?.[canal]?.tipo === 'spot';
    const meds = mediciones?.[canal] || {};
    const dm = (deltas?.mediciones || {})[canal] || {};
    const setMed = (key, val) => onChange && onChange(canal, key, val);
    const showAnilox = readOnly ? !!meds.anilox : true;

    return (
      <View key={canal} style={[cv.canalCard, layout === 'reel' && { width: 162, flex: undefined }]}>
        {/* Cabecera: punto de color + nombre + badge SPOT */}
        <View style={cv.canalHeader}>
          <View style={[cv.canalDot, { backgroundColor: color }]} />
          <Text style={[cv.canalLabel, { flex: 1 }]}>{canal}</Text>
          {isSpot && (
            <View style={cv.spotBadge}>
              <Text style={cv.spotBadgeText}>SPOT</Text>
            </View>
          )}
        </View>

        {/* Campos */}
        <View style={cv.canalFields}>
          {showAnilox && (
            <CanalField
              label="anilox"
              value={meds.anilox}
              onChangeText={(v) => setMed('anilox', v)}
              readOnly={readOnly}
              keyboardType="default"
              fullWidth
            />
          )}
          <CanalField
            label="densidad"
            value={meds.densidad}
            delta={dm.densidad}
            deltaType="densidad"
            onChangeText={(v) => setMed('densidad', v)}
            readOnly={readOnly}
            fullWidth
          />
          {readOnly ? (
            // En modo display: L, a, b apilados (cada uno fullWidth)
            ['L', 'a', 'b'].map((k) => (
              <CanalField
                key={k}
                label={k}
                value={meds[k]}
                delta={dm[k]}
                onChangeText={(v) => setMed(k, v)}
                readOnly
                fullWidth
              />
            ))
          ) : (
            // En modo edición: L, a, b en fila
            <View style={cv.canalLabRow}>
              <CanalField label="L" value={meds.L} onChangeText={(v) => setMed('L', v)} readOnly={false} flex={1} />
              <CanalField label="a" value={meds.a} onChangeText={(v) => setMed('a', v)} readOnly={false} flex={1} />
              <CanalField label="b" value={meds.b} onChangeText={(v) => setMed('b', v)} readOnly={false} flex={1} />
            </View>
          )}
        </View>
      </View>
    );
  });

  if (layout === 'reel') {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -4 }}
        contentContainerStyle={{ gap: 10, paddingHorizontal: 4, paddingBottom: 6 }}
      >
        {cards}
      </ScrollView>
    );
  }

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {cards}
    </View>
  );
}

// ── Panel de deltas: tabs por canal + detalle al seleccionar ─────────────────
/**
 * @param {object} deltas       - { mediciones: { [canal]: { densidad?, L?, a?, b?, deltaE? } }, ...escalares }
 * @param {object} canalesInfo  - { [canal]: { color, tipo } }
 */
export function DeltasPanel({ deltas, canalesInfo }) {
  const { t } = useTranslation();
  const [selectedCanal, setSelectedCanal] = useState(null);
  if (!deltas) return null;

  const { mediciones, ...escalares } = deltas;
  const hasEscalares = Object.keys(escalares).length > 0;
  const hasMeds = mediciones && Object.keys(mediciones).length > 0;
  if (!hasEscalares && !hasMeds) return null;

  const canalNames = hasMeds ? Object.keys(mediciones) : [];
  const activeCanalName = selectedCanal && mediciones[selectedCanal] ? selectedCanal : (canalNames[0] ?? null);
  const activeMeds = activeCanalName ? (mediciones[activeCanalName] || {}) : {};
  const activeColor = canalesInfo?.[activeCanalName]?.color || '#94A3B8';

  const calcDE = (meds) => {
    const { L, a, b } = meds;
    return (L != null && a != null && b != null)
      ? Math.round(Math.sqrt(L ** 2 + a ** 2 + b ** 2) * 100) / 100
      : null;
  };

  const activeDE = calcDE(activeMeds);
  const activeDEColor = deltaColor(activeDE, 'deltaE');

  return (
    <View style={cv.deltaPanel}>
      <Text style={cv.deltaPanelTitle}>{t('screens.produccion.condiciones.form.deltasTitle')}</Text>

      {/* Escalares: velocidad, etc. */}
      {hasEscalares && (
        <View style={cv.deltaEscalaresRow}>
          {Object.entries(escalares).map(([k, v]) => (
            <View key={k} style={cv.deltaEscalarChip}>
              <Text style={cv.deltaEscalarKey}>{k.replace('_', ' ')}</Text>
              <Text style={[cv.deltaEscalarVal, { color: deltaColor(v, 'lab') }]}>{fmtDelta(v)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Tabs horizontales por canal */}
      {hasMeds && (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 10 }}
            contentContainerStyle={{ gap: 6, paddingBottom: 2 }}
          >
            {canalNames.map((canal) => {
              const col = canalesInfo?.[canal]?.color || '#94A3B8';
              const isActive = canal === activeCanalName;
              const cDE = calcDE(mediciones[canal] || {});
              const cDEColor = cDE != null ? deltaColor(cDE, 'deltaE') : '#94A3B8';
              const deBg = cDE != null ? (cDE <= 2 ? '#DCFCE7' : cDE <= 4 ? '#FEF9C3' : '#FEE2E2') : null;
              return (
                <TouchableOpacity
                  key={canal}
                  onPress={() => setSelectedCanal(canal)}
                  style={[cv.deltaCanalTab, isActive && cv.deltaCanalTabActive]}
                >
                  <View style={[cv.canalDot, { backgroundColor: col, width: 8, height: 8, borderRadius: 4 }]} />
                  <Text style={[cv.deltaCanalTabLabel, isActive && cv.deltaCanalTabLabelActive]}>{canal}</Text>
                  {cDE != null && (
                    <View style={[cv.deltaCanalTabDEBadge, { backgroundColor: deBg }]}>
                      <Text style={[cv.deltaCanalTabDEText, { color: cDEColor }]}>ΔE {cDE}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Detalle del canal activo */}
          {activeCanalName && (
            <View style={cv.deltaCanalDetail}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <View style={[cv.canalDot, { backgroundColor: activeColor, width: 9, height: 9, borderRadius: 5 }]} />
                <Text style={cv.deltaCanalName}>{activeCanalName}</Text>
                {activeDE != null && (
                  <View style={[cv.deltaEBadge, { borderColor: activeDEColor, marginLeft: 'auto' }]}>
                    <Text style={cv.deltaELabel}>ΔE</Text>
                    <Text style={[cv.deltaEVal, { color: activeDEColor }]}>{activeDE}</Text>
                  </View>
                )}
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {activeMeds.densidad != null && (
                  <View style={cv.deltaMetricChip}>
                    <Text style={cv.deltaMetricKey}>dens</Text>
                    <Text style={[cv.deltaMetricVal, { color: deltaColor(activeMeds.densidad, 'densidad') }]}>
                      {fmtDelta(activeMeds.densidad)}
                    </Text>
                  </View>
                )}
                {['L', 'a', 'b'].map((k) => activeMeds[k] != null ? (
                  <View key={k} style={cv.deltaMetricChip}>
                    <Text style={cv.deltaMetricKey}>{k}*</Text>
                    <Text style={[cv.deltaMetricVal, { color: deltaColor(activeMeds[k], 'lab') }]}>
                      {fmtDelta(activeMeds[k])}
                    </Text>
                  </View>
                ) : null)}
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const cv = StyleSheet.create({
  // Tarjeta de canal
  canalCard: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12,
    padding: 14, minWidth: 110, flex: 1,
    backgroundColor: '#FAFBFF',
  },
  canalHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  canalDot: { width: 10, height: 10, borderRadius: 5 },
  canalLabel: { fontSize: 14, fontWeight: '800', color: '#1E1B4B' },
  canalFields: { gap: 8 },
  canalLabRow: { flexDirection: 'row', gap: 6 },
  spotBadge: {
    paddingHorizontal: 5, paddingVertical: 2,
    backgroundColor: '#FFF7ED', borderRadius: 4,
    borderWidth: 1, borderColor: '#FED7AA',
  },
  spotBadgeText: { fontSize: 8, fontWeight: '700', color: '#C2410C', letterSpacing: 0.5 },
  // Campo dentro de la tarjeta
  canalCell: { marginBottom: 0 },
  canalCellKey: {
    fontSize: 10, fontWeight: '700', color: '#94A3B8',
    textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4,
  },
  canalCellValRO: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  canalCellInput: {
    fontSize: 13, color: '#1E1B4B', fontWeight: '600',
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D9DBFF',
    borderRadius: 7, paddingHorizontal: 8, paddingVertical: 6,
    textAlign: 'center', width: '100%',
  },
  // Panel de deltas
  deltaPanel: {
    backgroundColor: '#F8FAFF', borderRadius: 12,
    borderWidth: 1, borderColor: '#C7D2FE',
    padding: 16, marginTop: 20,
  },
  deltaPanelTitle: {
    fontSize: 10, fontWeight: '800', color: '#4F46E5',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14,
  },
  deltaEscalaresRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  deltaEscalarChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EEF2FF', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  deltaEscalarKey: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  deltaEscalarVal: { fontSize: 13, fontWeight: '800' },
  // Tabs por canal
  deltaCanalTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 7,
    borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  deltaCanalTabActive: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  deltaCanalTabLabel: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  deltaCanalTabLabelActive: { color: '#4F46E5' },
  deltaCanalTabDEBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  deltaCanalTabDEText: { fontSize: 10, fontWeight: '800' },
  // Detalle canal activo
  deltaCanalDetail: {
    backgroundColor: '#FFFFFF', borderRadius: 10,
    borderWidth: 1, borderColor: '#E2E8F0', padding: 14,
  },
  deltaCanalName: { fontSize: 13, fontWeight: '800', color: '#1E1B4B' },
  deltaEBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  deltaELabel: { fontSize: 11, fontWeight: '800', color: '#64748B', letterSpacing: 0.5 },
  deltaEVal: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  deltaMetricChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F8FAFC', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  deltaMetricKey: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  deltaMetricVal: { fontSize: 15, fontWeight: '800' },
});

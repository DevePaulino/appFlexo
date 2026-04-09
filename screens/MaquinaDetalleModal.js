import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import DeleteConfirmRow from '../components/DeleteConfirmRow';

const API_BASE = 'http://localhost:8080';

const fmt = (v) => (v === null || v === undefined ? '' : String(v));
const parseNum = (v) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(String(v).replace(',', '.'));
  return isNaN(n) ? null : n;
};

// Convierte YYYY-MM-DD → DD-MM-YYYY para mostrar
const formatDateDisplay = (iso) => {
  if (!iso) return '';
  const p = iso.split('-');
  if (p.length !== 3) return iso;
  return `${p[2]}-${p[1]}-${p[0]}`;
};

// Convierte DD-MM-YYYY → YYYY-MM-DD para guardar
const parseDateToISO = (ddmm) => {
  if (!ddmm) return '';
  const p = ddmm.split('-');
  if (p.length !== 3) return ddmm;
  return `${p[2]}-${p[1]}-${p[0]}`;
};

const emptyForm = {
  nombre: '',
  anio_fabricacion: '',
  tipo_maquina: '',
  numero_colores: '',
  estado: 'Activa',
  ancho_max_material_mm: '',
  ancho_max_impresion_mm: '',
  repeticion_min_mm: '',
  repeticion_max_mm: '',
  velocidad_max_maquina_mmin: '',
  espesor_planchas_mm: '',
  sistemas_secado: '',
};

// ── Canales de color ─────────────────────────────────────────────────────────
const CANALES_CMYK = [
  { label: 'C', color: '#00AEEF', isCMYK: true },
  { label: 'M', color: '#EC008C', isCMYK: true },
  { label: 'Y', color: '#EAB308', isCMYK: true },
  { label: 'K', color: '#232323', isCMYK: true },
];

// Canales de gama extendida por defecto en heptacromía (ECG / Hi-Fi)
const CANALES_HEPTA_EXTRA = [
  { label: 'Orange', color: '#FE5000' },
  { label: 'Violet', color: '#440099' },
  { label: 'Green',  color: '#009A44' },
];

const contrastText = (hex) => {
  if (!hex || hex.length < 6) return '#fff';
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128 ? '#0F172A' : '#FFFFFF';
};

let PANTONE_MAP = {};
try { PANTONE_MAP = require('../data/pantone_map.json'); } catch (_) {}

// Mismo mecanismo que NuevoPresupuestoModal: srgb array → hex + prueba variantes de clave
const srgbToHex = (srgb) => {
  if (!srgb || srgb.length < 3) return null;
  return '#' + srgb.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase();
};

const pantoneHex = (text) => {
  if (!text) return null;
  const t = String(text).trim();
  const tries = [];
  if (/^\d+$/.test(t)) tries.push(`PANTONE ${t} C`);
  tries.push(t.toUpperCase());
  if (!t.toUpperCase().startsWith('PANTONE')) tries.push(`PANTONE ${t.toUpperCase()} C`);
  for (const k of tries) {
    const entry = PANTONE_MAP[k];
    if (entry) return srgbToHex(entry.srgb) || null;
  }
  return null;
};

const emptyMedicion = () => ({ anilox: '', densidad: '', L: '', a: '', b: '' });

const emptyTestForm = () => ({
  fecha: formatDateDisplay(new Date().toISOString().slice(0, 10)),
  material: '',
  velocidad_mmin: '',
  fabricante_tintas: '',
  fabricante_plancha: '',
  referencia_plancha: '',
  // Todos los canales (proceso + Pantone/spot) en una sola lista
  canales_activos: ['C', 'M', 'Y', 'K'],
  canales_info: Object.fromEntries(CANALES_CMYK.map((c) => [c.label, { color: c.color }])),
  mediciones: Object.fromEntries(CANALES_CMYK.map((c) => [c.label, emptyMedicion()])),
  notas: '',
});

// ── Grid de mediciones dinámico (CMYK + canales extra) ───────────────────────
function CanalesGrid({ canalesActivos, canalesInfo, mediciones, onChange }) {
  if (!canalesActivos || canalesActivos.length === 0) return null;
  const numCols = ['Densidad', 'L*', 'a*', 'b*'];
  const numKeys = ['densidad', 'L', 'a', 'b'];
  return (
    <View style={cmykStyles.container}>
      <View style={cmykStyles.row}>
        <View style={[cmykStyles.channelCell, { backgroundColor: '#EEF2FF' }]} />
        <View style={[cmykStyles.headerCell, cmykStyles.aniloxHeaderCell]}>
          <Text style={cmykStyles.headerText}>Anilox</Text>
        </View>
        {numCols.map((col) => (
          <View key={col} style={cmykStyles.headerCell}>
            <Text style={cmykStyles.headerText}>{col}</Text>
          </View>
        ))}
      </View>
      {canalesActivos.map((ch) => {
        const info = (canalesInfo || {})[ch] || {};
        const bgColor = info.color || '#94A3B8';
        const txtColor = contrastText(bgColor);
        const meds = (mediciones || {})[ch] || emptyMedicion();
        return (
          <View key={ch} style={cmykStyles.row}>
            <View style={[cmykStyles.channelCell, { backgroundColor: bgColor }]}>
              <Text style={[cmykStyles.channelText, { color: txtColor }]} numberOfLines={1}>{ch}</Text>
            </View>
            <View style={[cmykStyles.inputCell, cmykStyles.aniloxInputCell]}>
              <TextInput
                style={[cmykStyles.input, cmykStyles.aniloxInput]}
                value={String(meds.anilox ?? '')}
                onChangeText={(v) => onChange(ch, 'anilox', v)}
                keyboardType="default"
                placeholder="Ej. 400 L/cm"
                placeholderTextColor="#CBD5E1"
              />
            </View>
            {numKeys.map((key) => (
              <View key={key} style={cmykStyles.inputCell}>
                <TextInput
                  style={cmykStyles.input}
                  value={String(meds[key] ?? '')}
                  onChangeText={(v) => onChange(ch, key, v)}
                  keyboardType="numeric"
                  placeholder="–"
                  placeholderTextColor="#CBD5E1"
                />
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}

const cmykStyles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  channelCell: {
    minWidth: 90,
    flex: 0,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: '#F8FAFC',
  },
  channelText: {
    fontWeight: '800',
    fontSize: 12,
    color: '#FFFFFF',
  },
  headerCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    backgroundColor: '#EEF2FF',
  },
  headerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4F46E5',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputCell: {
    flex: 1,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  aniloxHeaderCell: {
    flex: 2,
  },
  aniloxInputCell: {
    flex: 2,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 6,
    fontSize: 12,
    color: '#0F172A',
    textAlign: 'center',
  },
  aniloxInput: {
    textAlign: 'left',
  },
});

function TestRow({ test, onDelete, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const channels = test.canales_activos && test.canales_activos.length > 0
    ? test.canales_activos
    : Object.keys(test.canales_cuatricromia || { C: 1, M: 1, Y: 1, K: 1 });
  const canalesInfo = test.canales_info || { C: { color: '#00AEEF' }, M: { color: '#EC008C' }, Y: { color: '#EAB308' }, K: { color: '#232323' } };
  const mediciones = test.mediciones || test.canales_cuatricromia || {};

  return (
    <View style={testRowStyles.card}>
      {/* Header oscuro — mismo patrón que fileSectionHeader */}
      <TouchableOpacity style={testRowStyles.header} onPress={() => setExpanded((p) => !p)} activeOpacity={0.85}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text style={testRowStyles.fecha}>{formatDateDisplay(test.fecha) || '–'}</Text>
            {test.modo === 'heptacromia' && (
              <View style={testRowStyles.modoBadge}><Text style={testRowStyles.modoBadgeText}>7C</Text></View>
            )}
            <Text style={testRowStyles.material} numberOfLines={1}>{test.material || '–'}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 3, flexWrap: 'wrap' }}>
            {test.velocidad_mmin ? <Text style={testRowStyles.meta}>{test.velocidad_mmin} m/min</Text> : null}
            {test.fabricante_plancha ? <Text style={testRowStyles.meta}>{test.fabricante_plancha}</Text> : null}
            {test.referencia_plancha ? <Text style={testRowStyles.meta}>{test.referencia_plancha}</Text> : null}
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={testRowStyles.expandIcon}>{expanded ? '▲' : '▼'}</Text>
          {!confirmingDelete && (
            <TouchableOpacity style={testRowStyles.deleteBtn} onPress={(e) => { e.stopPropagation?.(); setConfirmingDelete(true); }}>
              <Text style={testRowStyles.deleteBtnText}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      {confirmingDelete && (
        <View style={{ paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
          <DeleteConfirmRow
            onCancel={() => setConfirmingDelete(false)}
            onConfirm={() => { setConfirmingDelete(false); onDelete(); }}
          />
        </View>
      )}

      {expanded && (
        <View style={testRowStyles.detail}>
          {/* Campos generales — patrón label/value con filas separadas */}
          {test.fabricante_tintas ? (
            <View style={testRowStyles.row}>
              <Text style={testRowStyles.rowLabel}>Fab. tintas</Text>
              <Text style={testRowStyles.rowValue}>{test.fabricante_tintas}</Text>
            </View>
          ) : null}
          {test.fabricante_plancha ? (
            <View style={testRowStyles.row}>
              <Text style={testRowStyles.rowLabel}>Fab. plancha</Text>
              <Text style={testRowStyles.rowValue}>{test.fabricante_plancha}</Text>
            </View>
          ) : null}
          {test.referencia_plancha ? (
            <View style={testRowStyles.row}>
              <Text style={testRowStyles.rowLabel}>Ref. plancha</Text>
              <Text style={testRowStyles.rowValue}>{test.referencia_plancha}</Text>
            </View>
          ) : null}
          {test.anilox ? (
            <View style={testRowStyles.row}>
              <Text style={testRowStyles.rowLabel}>Anilox</Text>
              <Text style={testRowStyles.rowValue}>{test.anilox}</Text>
            </View>
          ) : null}
          {test.notas ? (
            <View style={testRowStyles.row}>
              <Text style={testRowStyles.rowLabel}>Notas</Text>
              <Text style={testRowStyles.rowValue}>{test.notas}</Text>
            </View>
          ) : null}

          {/* Tabla de canales */}
          {channels.length > 0 && (
            <View style={testRowStyles.section}>
              <Text style={testRowStyles.sectionLabel}>CANALES DE COLOR</Text>
              <View style={testRowStyles.cmykHeader}>
                <View style={testRowStyles.cmykChBadge} />
                <Text style={[testRowStyles.cmykHeaderCell, testRowStyles.cmykAniloxCell]}>Anilox</Text>
                <Text style={testRowStyles.cmykHeaderCell}>Densidad</Text>
                <Text style={testRowStyles.cmykHeaderCell}>L*</Text>
                <Text style={testRowStyles.cmykHeaderCell}>a*</Text>
                <Text style={testRowStyles.cmykHeaderCell}>b*</Text>
              </View>
              {channels.map((ch) => {
                const d = mediciones[ch] || {};
                const bg = (canalesInfo[ch] || {}).color || '#94A3B8';
                return (
                  <View key={ch} style={testRowStyles.cmykRow}>
                    <View style={[testRowStyles.cmykChBadge, { backgroundColor: bg }]}>
                      <Text style={[testRowStyles.cmykChLabel, { color: contrastText(bg) }]}>{ch}</Text>
                    </View>
                    <Text style={[testRowStyles.cmykCell, testRowStyles.cmykAniloxCell]} numberOfLines={1}>{d.anilox || '–'}</Text>
                    <Text style={testRowStyles.cmykCell}>{d.densidad ?? '–'}</Text>
                    <Text style={testRowStyles.cmykCell}>{d.L ?? '–'}</Text>
                    <Text style={testRowStyles.cmykCell}>{d.a ?? '–'}</Text>
                    <Text style={testRowStyles.cmykCell}>{d.b ?? '–'}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {test.tintas_planas && test.tintas_planas.length > 0 && (
            <View style={testRowStyles.section}>
              <Text style={testRowStyles.sectionLabel}>TINTAS PLANAS / PANTONE</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingTop: 8, paddingHorizontal: 2 }}>
                {test.tintas_planas.map((tp, i) => {
                  const bg = tp.hex || '#E2E8F0';
                  return (
                    <View key={i} style={[testRowStyles.tintaChip, { backgroundColor: bg, borderColor: bg }]}>
                      <Text style={[testRowStyles.tintaChipNombre, { color: contrastText(bg) }]}>{tp.nombre || '–'}</Text>
                      {tp.densidad != null && (
                        <Text style={[testRowStyles.tintaChipDens, { color: contrastText(bg) }]}>{tp.densidad}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const testRowStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    marginBottom: 8,
    overflow: 'hidden',
  },
  // Header oscuro — igual que fileSectionHeader de PedidoDetalleModal
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1B4B',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  fecha: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  material: { fontSize: 13, fontWeight: '400', color: '#C7D2FE', flex: 1 },
  meta: { fontSize: 12, color: 'rgba(255,255,255,0.55)' },
  expandIcon: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  deleteBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: { fontSize: 14, color: '#FCA5A5', fontWeight: '900', lineHeight: 16 },
  detail: { paddingHorizontal: 12, paddingBottom: 8 },
  // Filas label/value — igual que el patrón row/label/value de PedidoDetalleModal
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 8,
  },
  rowLabel: { width: 100, flexShrink: 0, fontSize: 11, fontWeight: '500', color: '#94A3B8' },
  rowValue: { flex: 1, fontSize: 13, fontWeight: '600', color: '#1E1B4B' },
  // Sección de canales
  section: { marginTop: 8 },
  sectionLabel: {
    fontSize: 10, fontWeight: '800', color: '#F1F5F9', letterSpacing: 0.8,
    textTransform: 'uppercase', backgroundColor: '#1E1B4B',
    paddingHorizontal: 12, paddingVertical: 6,
    marginHorizontal: -12, marginBottom: 0,
  },
  cmykHeader: {
    flexDirection: 'row',
    paddingVertical: 5,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  cmykHeaderCell: { flex: 1, fontSize: 10, fontWeight: '700', color: '#94A3B8', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 },
  cmykRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center',
  },
  cmykCell: { flex: 1, fontSize: 13, color: '#1E1B4B', textAlign: 'center', fontWeight: '600' },
  cmykAniloxCell: { flex: 2, textAlign: 'center' },
  cmykChLabel: { fontSize: 12, fontWeight: '800', textAlign: 'center' },
  cmykChBadge: { width: 36, borderRadius: 4, alignItems: 'center', justifyContent: 'center', paddingVertical: 3, marginRight: 4 },
  modoBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  modoBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
  tintaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  tintaChipNombre: { fontSize: 12, fontWeight: '700' },
  tintaChipDens: { fontSize: 12, opacity: 0.8 },
});

// ── Selector unificado de tintas (proceso + Pantone/spot) ────────────────────
// Input con previsualización de color Pantone en tiempo real
function PantoneInput({ onConfirm, placeholder }) {
  const [val, setVal] = useState('');
  const matchHex = pantoneHex(val);
  return (
    <TextInput
      value={val}
      onChangeText={setVal}
      placeholder={placeholder || 'C, Orange, Pantone 485 C…'}
      placeholderTextColor="#94A3B8"
      autoFocus
      onSubmitEditing={(e) => onConfirm((e.nativeEvent && e.nativeEvent.text) || val, matchHex)}
      onBlur={() => { if (val.trim()) onConfirm(val, matchHex); }}
      style={[ntfStyles.extraInput, matchHex && { backgroundColor: matchHex, borderColor: matchHex, color: contrastText(matchHex) }]}
    />
  );
}

// Chip individual de tinta activa
function TintaChip({ label, color, onRemove }) {
  const bg = color || '#E2E8F0';
  const txt = contrastText(bg);
  return (
    <View style={{ marginRight: 8, marginBottom: 8 }}>
      <View style={[ntfStyles.canalBtn, { backgroundColor: bg, borderColor: bg, paddingRight: 22 }]}>
        <Text style={[ntfStyles.canalBtnText, { color: txt }]} numberOfLines={1}>{label}</Text>
      </View>
      <TouchableOpacity
        onPress={onRemove}
        style={{ position: 'absolute', right: -4, top: -6, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ color: '#fff', fontSize: 11, lineHeight: 13 }}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Autocomplete genérico (fabricantes, materiales, etc.) ────────────────────
function AutocompleteInput({ value, onChange, sugerencias, placeholder }) {
  const [open, setOpen] = useState(false);
  const filtered = (sugerencias || []).filter(
    (s) => s && (!value.trim() || s.toLowerCase().includes(value.trim().toLowerCase()))
  );
  return (
    <View>
      <TextInput
        style={ntfStyles.input}
        value={value}
        onChangeText={(v) => { onChange(v); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder || ''}
        placeholderTextColor="#94A3B8"
      />
      {open && filtered.length > 0 && (
        <View style={ntfStyles.sugerenciasBox}>
          {filtered.map((s) => (
            <TouchableOpacity
              key={s}
              style={ntfStyles.sugerenciaItem}
              onPress={() => { onChange(s); setOpen(false); }}
            >
              <Text style={ntfStyles.sugerenciaText} selectable={false}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function NuevoTestForm({ onSubmit, onCancel, fabricantesSugeridos = [], fabricantesTintasSugeridos = [], materialesCatalogo = [] }) {
  const [form, setForm] = useState(emptyTestForm());
  const [adding, setAdding] = useState(false);
  const setField = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  // Añade canales de un preset (cuatricromía o heptacromía) sin borrar los existentes
  const applyPreset = (preset) => {
    setForm((p) => {
      let activos = [...p.canales_activos];
      let meds = { ...p.mediciones };
      let info = { ...p.canales_info };
      const channels = preset === 'hepta'
        ? [...CANALES_CMYK, ...CANALES_HEPTA_EXTRA]
        : CANALES_CMYK;
      channels.forEach(({ label, color }) => {
        if (!activos.includes(label)) activos.push(label);
        if (!meds[label]) meds[label] = emptyMedicion();
        if (!info[label]) info[label] = { color };
      });
      return { ...p, canales_activos: activos, canales_info: info, mediciones: meds };
    });
  };

  const addCanal = (label, hex) => {
    const l = label.trim();
    if (!l) return;
    // Si no tiene color asignado, buscar en CMYK, extras estándar, o usar Pantone
    const std = [...CANALES_CMYK, ...CANALES_HEPTA_EXTRA].find((c) => c.label.toLowerCase() === l.toLowerCase());
    const color = hex || std?.color || '#94A3B8';
    const key = std ? std.label : l; // normalizar mayúsculas para canales estándar
    setForm((p) => {
      if (p.canales_activos.includes(key)) return p;
      return {
        ...p,
        canales_activos: [...p.canales_activos, key],
        canales_info: { ...p.canales_info, [key]: { color } },
        mediciones: { ...p.mediciones, [key]: emptyMedicion() },
      };
    });
    setAdding(false);
  };

  const removeCanal = (label) =>
    setForm((p) => {
      const { [label]: _i, ...restInfo } = p.canales_info;
      const { [label]: _m, ...restMeds } = p.mediciones;
      return { ...p, canales_activos: p.canales_activos.filter((l) => l !== label), canales_info: restInfo, mediciones: restMeds };
    });

  const setMedicion = (ch, key, val) => {
    if (key === 'anilox' && ch === form.canales_activos[0]) {
      // Propagar a todos los canales que estén vacíos o tengan el mismo valor que el primero
      const prevFirst = (form.mediciones[ch] || emptyMedicion()).anilox;
      setForm((p) => {
        const newMeds = { ...p.mediciones };
        p.canales_activos.forEach((c) => {
          const cur = (p.mediciones[c] || emptyMedicion()).anilox;
          if (c === ch || cur === '' || cur === prevFirst) {
            newMeds[c] = { ...(p.mediciones[c] || emptyMedicion()), anilox: val };
          }
        });
        return { ...p, mediciones: newMeds };
      });
    } else {
      setForm((p) => ({
        ...p,
        mediciones: { ...p.mediciones, [ch]: { ...(p.mediciones[ch] || emptyMedicion()), [key]: val } },
      }));
    }
  };

  const handleSubmit = () => {
    const parsedMediciones = {};
    form.canales_activos.forEach((ch) => {
      const src = form.mediciones[ch] || emptyMedicion();
      parsedMediciones[ch] = { anilox: (src.anilox || '').replace(',', '.'), densidad: parseNum(src.densidad), L: parseNum(src.L), a: parseNum(src.a), b: parseNum(src.b) };
    });
    onSubmit({
      fecha: parseDateToISO(form.fecha),
      material: form.material,
      velocidad_mmin: parseNum(form.velocidad_mmin),
      fabricante_tintas: form.fabricante_tintas,
      fabricante_plancha: form.fabricante_plancha,
      referencia_plancha: form.referencia_plancha,
      canales_activos: form.canales_activos,
      canales_info: form.canales_info,
      mediciones: parsedMediciones,
      notas: form.notas,
    });
  };

  return (
    <View style={ntfStyles.container}>
      <Text style={ntfStyles.formTitle}>Nuevo test</Text>

      {/* Campos generales */}
      <View style={ntfStyles.grid}>
        <View style={ntfStyles.field}>
          <Text style={ntfStyles.label}>Fecha</Text>
          <TextInput style={ntfStyles.input} value={form.fecha} onChangeText={(v) => setField('fecha', v)} placeholder="DD-MM-AAAA" placeholderTextColor="#94A3B8" />
        </View>
        <View style={ntfStyles.field}>
          <Text style={ntfStyles.label}>Velocidad (m/min)</Text>
          <TextInput style={ntfStyles.input} value={form.velocidad_mmin} onChangeText={(v) => setField('velocidad_mmin', v)} keyboardType="numeric" placeholder="Ej. 120" placeholderTextColor="#94A3B8" />
        </View>
        <View style={ntfStyles.fieldFull}>
          <Text style={ntfStyles.label}>Material</Text>
          <AutocompleteInput
            value={form.material}
            onChange={(v) => setField('material', v)}
            sugerencias={materialesCatalogo}
            placeholder="Ej. BOPP 30µm"
          />
        </View>
        <View style={ntfStyles.field}>
          <Text style={ntfStyles.label}>Fabricante de tintas</Text>
          <AutocompleteInput
            value={form.fabricante_tintas}
            onChange={(v) => setField('fabricante_tintas', v)}
            sugerencias={fabricantesTintasSugeridos}
            placeholder="Ej. Flint Group"
          />
        </View>
        <View style={ntfStyles.field}>
          <Text style={ntfStyles.label}>Fabricante de plancha</Text>
          <AutocompleteInput
            value={form.fabricante_plancha}
            onChange={(v) => setField('fabricante_plancha', v)}
            sugerencias={fabricantesSugeridos}
            placeholder="Ej. Flint, Asahi, Kodak"
          />
        </View>
        <View style={ntfStyles.field}>
          <Text style={ntfStyles.label}>Referencia de plancha</Text>
          <TextInput
            style={ntfStyles.input}
            value={form.referencia_plancha}
            onChangeText={(v) => setField('referencia_plancha', v)}
            placeholder="Ej. nyloflex NExT 114"
            placeholderTextColor="#94A3B8"
          />
        </View>
      </View>

      {/* Tintas — sección unificada */}
      <Text style={ntfStyles.sectionLabel}>TINTAS</Text>

      {/* Presets rápidos */}
      <View style={ntfStyles.modoRow}>
        <TouchableOpacity style={ntfStyles.presetBtn} onPress={() => applyPreset('cmyk')}>
          <Text style={ntfStyles.presetBtnText}>+ Cuatricromía</Text>
        </TouchableOpacity>
        <TouchableOpacity style={ntfStyles.presetBtn} onPress={() => applyPreset('hepta')}>
          <Text style={ntfStyles.presetBtnText}>+ Heptacromía</Text>
        </TouchableOpacity>
      </View>

      {/* Chips de canales activos + botón añadir */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: 8 }}>
        {form.canales_activos.map((label) => (
          <TintaChip
            key={label}
            label={label}
            color={(form.canales_info[label] || {}).color}
            onRemove={() => removeCanal(label)}
          />
        ))}
        {adding ? (
          <PantoneInput onConfirm={addCanal} />
        ) : (
          <TouchableOpacity style={ntfStyles.addExtraBtn} onPress={() => setAdding(true)}>
            <Text style={ntfStyles.addExtraBtnText}>+</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Grid de medición para todos los canales activos */}
      {form.canales_activos.length > 0 && (
        <CanalesGrid
          canalesActivos={form.canales_activos}
          canalesInfo={form.canales_info}
          mediciones={form.mediciones}
          onChange={setMedicion}
        />
      )}

      {/* Notas */}
      <Text style={[ntfStyles.label, { marginTop: 8 }]}>Notas</Text>
      <TextInput style={[ntfStyles.input, ntfStyles.textArea]} value={form.notas} onChangeText={(v) => setField('notas', v)} placeholder="Observaciones opcionales…" placeholderTextColor="#94A3B8" multiline numberOfLines={3} />

      <View style={ntfStyles.actions}>
        <TouchableOpacity style={ntfStyles.cancelBtn} onPress={onCancel}>
          <Text style={ntfStyles.cancelBtnText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={ntfStyles.submitBtn} onPress={handleSubmit}>
          <Text style={ntfStyles.submitBtnText}>Guardar test</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const ntfStyles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E1B4B',
    marginBottom: 12,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  field: { flex: 1, minWidth: 130 },
  fieldFull: { width: '100%' },
  label: { fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: '#64748B',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8,
  },
  input: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 2,
  },
  textArea: { minHeight: 60, textAlignVertical: 'top' },
  modoRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  presetBtn: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
    borderWidth: 1.5, borderColor: '#C7D2FE', backgroundColor: '#EEF2FF',
  },
  presetBtnText: { fontSize: 12, fontWeight: '700', color: '#4F46E5' },
  canalBtn: {
    paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1,
    marginRight: 8, marginBottom: 8, minWidth: 40, alignItems: 'center',
  },
  canalBtnText: { fontWeight: '700', fontSize: 13 },
  addExtraBtn: {
    paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10,
    backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0',
    marginRight: 8, marginBottom: 8, minWidth: 36, alignItems: 'center',
  },
  addExtraBtnText: { fontSize: 13, fontWeight: '700', color: '#475569' },
  extraInput: {
    paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, minWidth: 120,
    marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0',
    backgroundColor: '#F1F5F9', color: '#0F172A', fontSize: 13,
  },
  sugerenciasBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 10,
    shadowColor: '#1E1B4B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
    marginTop: 2,
  },
  sugerenciaItem: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    cursor: 'pointer',
  },
  sugerenciaText: { fontSize: 13, color: '#1E1B4B', fontWeight: '500', userSelect: 'none' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
  cancelBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  cancelBtnText: { color: '#64748B', fontWeight: '600', fontSize: 13 },
  submitBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8,
    backgroundColor: '#4F46E5',
  },
  submitBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});

export default function MaquinaDetalleModal({ visible, onClose, onSave, maquina, puedeEditar }) {
  const [activeTab, setActiveTab] = useState('especificaciones');
  const [form, setForm] = useState({ ...emptyForm });
  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  // Tests state
  const [tests, setTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [testsError, setTestsError] = useState(null);
  const [showNuevoTestForm, setShowNuevoTestForm] = useState(false);
  const [savingTest, setSavingTest] = useState(false);
  const [activePlancha, setActivePlancha] = useState(null);
  const [materialesCatalogo, setMaterialesCatalogo] = useState([]);

  // Cargar catálogo de materiales una sola vez al montar
  useEffect(() => {
    const token = global.__MIAPP_ACCESS_TOKEN;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    fetch('http://localhost:8080/api/materiales/catalogo', { headers })
      .then((r) => r.json())
      .then((d) => {
        const lista = (d.catalogo || []).map((m) => m.nombre).filter(Boolean);
        setMaterialesCatalogo(lista);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (visible && maquina) {
      setActiveTab('especificaciones');
      setShowNuevoTestForm(false);
      setActivePlancha(null);
      setForm({
        nombre: fmt(maquina.nombre),
        anio_fabricacion: fmt(maquina.anio_fabricacion),
        tipo_maquina: fmt(maquina.tipo_maquina),
        numero_colores: fmt(maquina.numero_colores),
        estado: fmt(maquina.estado || 'Activa'),
        ancho_max_material_mm: fmt(maquina.ancho_max_material_mm),
        ancho_max_impresion_mm: fmt(maquina.ancho_max_impresion_mm),
        repeticion_min_mm: fmt(maquina.repeticion_min_mm),
        repeticion_max_mm: fmt(maquina.repeticion_max_mm),
        velocidad_max_maquina_mmin: fmt(
          maquina.velocidad_max_maquina_mmin ?? maquina.velocidad_max_impresion_mmin
        ),
        espesor_planchas_mm: fmt(maquina.espesor_planchas_mm),
        sistemas_secado: fmt(maquina.sistemas_secado),
      });
    }
  }, [visible, maquina]);

  useEffect(() => {
    if (visible && maquina && activeTab === 'tests') {
      fetchTests();
    }
  }, [visible, maquina, activeTab]);

  const authHeaders = () => {
    const token = global.__MIAPP_ACCESS_TOKEN;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchTests = async () => {
    if (!maquina?.id) return;
    setLoadingTests(true);
    setTestsError(null);
    try {
      const res = await fetch(`${API_BASE}/api/maquinas/${maquina.id}/tests`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Error al cargar tests');
      const loaded = data.tests || [];
      setTests(loaded);
      if (loaded.length > 0) {
        setActivePlancha((prev) => {
          const fabricantes = [...new Set(loaded.map((t) => t.fabricante_plancha?.trim() || ''))];
          return fabricantes.includes(prev) ? prev : fabricantes[0];
        });
      }
    } catch (e) {
      setTestsError(e.message);
    } finally {
      setLoadingTests(false);
    }
  };

  const handleSaveEspecificaciones = () => {
    if (!form.nombre.trim()) { alert('Marca y modelo es obligatorio'); return; }
    onSave({
      nombre: form.nombre.trim(),
      anio_fabricacion: form.anio_fabricacion.trim() || null,
      tipo_maquina: form.tipo_maquina.trim() || null,
      numero_colores: parseNum(form.numero_colores),
      estado: form.estado || 'Activa',
      ancho_max_material_mm: parseNum(form.ancho_max_material_mm),
      ancho_max_impresion_mm: parseNum(form.ancho_max_impresion_mm),
      repeticion_min_mm: parseNum(form.repeticion_min_mm),
      repeticion_max_mm: parseNum(form.repeticion_max_mm),
      velocidad_max_maquina_mmin: parseNum(form.velocidad_max_maquina_mmin),
      velocidad_max_impresion_mmin: parseNum(form.velocidad_max_maquina_mmin),
      espesor_planchas_mm: parseNum(form.espesor_planchas_mm),
      sistemas_secado: form.sistemas_secado.trim() || null,
    });
    onClose();
  };

  const handleCrearTest = async (testData) => {
    if (!maquina?.id) return;
    setSavingTest(true);
    try {
      const res = await fetch(`${API_BASE}/api/maquinas/${maquina.id}/tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(testData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Error al guardar test');
      setShowNuevoTestForm(false);
      await fetchTests();
    } catch (e) {
      alert(e.message);
    } finally {
      setSavingTest(false);
    }
  };

  const handleEliminarTest = async (testId) => {
    try {
      const res = await fetch(`${API_BASE}/api/maquinas/${maquina.id}/tests/${testId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { alert(data?.error || 'Error al eliminar'); return; }
      setTests((prev) => prev.filter((t) => t.id !== testId));
    } catch {
      alert('Error al eliminar el test');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Ficha de máquina</Text>
            {maquina?.nombre ? (
              <Text style={styles.headerSubtitle} numberOfLines={1}>{maquina.nombre}</Text>
            ) : null}
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs — estilo píldora igual que PedidoDetalleModal */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={activeTab === 'especificaciones' ? styles.tabActive : styles.tab}
              onPress={() => setActiveTab('especificaciones')}
            >
              <Text style={activeTab === 'especificaciones' ? styles.tabTextActive : styles.tabText}>
                Especificaciones
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={activeTab === 'tests' ? styles.tabActive : styles.tab}
              onPress={() => setActiveTab('tests')}
            >
              <Text style={activeTab === 'tests' ? styles.tabTextActive : styles.tabText}>
                Historial de tests
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab content */}
          {activeTab === 'especificaciones' ? (
            <>
              <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 16, gap: 12 }}>

                {/* ── Identificación ── */}
                <View style={styles.specCard}>
                  <Text style={styles.specCardHeader}>Identificación</Text>
                  <View style={styles.specGrid}>
                    <View style={styles.fieldFull}>
                      <Text style={styles.label}>Marca y modelo *</Text>
                      <TextInput style={styles.input} value={form.nombre} onChangeText={(v) => set('nombre', v)}
                        placeholder="Ej. Rotativa A" placeholderTextColor="#94A3B8" editable={!!puedeEditar} />
                    </View>
                    <View style={styles.field}>
                      <Text style={styles.label}>Año fabricación / versión</Text>
                      <TextInput style={styles.input} value={form.anio_fabricacion} onChangeText={(v) => set('anio_fabricacion', v)}
                        placeholder="Ej. 2018" placeholderTextColor="#94A3B8" editable={!!puedeEditar} />
                    </View>
                    <View style={styles.field}>
                      <Text style={styles.label}>Tipo de máquina</Text>
                      <TextInput style={styles.input} value={form.tipo_maquina} onChangeText={(v) => set('tipo_maquina', v)}
                        placeholder="Ej. Flexográfica" placeholderTextColor="#94A3B8" editable={!!puedeEditar} />
                    </View>
                    <View style={styles.field}>
                      <Text style={styles.label}>Número de colores</Text>
                      <TextInput style={styles.input} value={form.numero_colores} onChangeText={(v) => set('numero_colores', v)}
                        placeholder="Ej. 4" placeholderTextColor="#94A3B8" keyboardType="numeric" editable={!!puedeEditar} />
                    </View>
                    <View style={styles.field}>
                      <Text style={styles.label}>Estado</Text>
                      {Platform.OS === 'web' ? (
                        <View style={[styles.selectWrap, !puedeEditar && { opacity: 0.6 }]}>
                          <select
                            value={form.estado || 'Activa'}
                            onChange={(e) => set('estado', e.target.value)}
                            disabled={!puedeEditar}
                            style={{ width: '100%', border: 'none', backgroundColor: 'transparent', paddingTop: 8, paddingBottom: 8, paddingLeft: 10, paddingRight: 10, fontSize: 14, color: '#0F172A', cursor: puedeEditar ? 'pointer' : 'default', outlineWidth: 0 }}
                          >
                            <option value="Activa">Activa</option>
                            <option value="Inactiva">Inactiva</option>
                          </select>
                        </View>
                      ) : (
                        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                          {['Activa', 'Inactiva'].map((op) => (
                            <TouchableOpacity key={op} onPress={() => puedeEditar && set('estado', op)}
                              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: form.estado === op ? '#475569' : '#EEF2F8', opacity: puedeEditar ? 1 : 0.6 }}>
                              <Text style={{ color: form.estado === op ? '#fff' : '#475569', fontSize: 13 }}>{op}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* ── Capacidades ── */}
                <View style={styles.specCard}>
                  <Text style={styles.specCardHeader}>Capacidades</Text>
                  <View style={styles.specGrid}>
                    <View style={styles.field}>
                      <Text style={styles.label}>Ancho máx. material (mm)</Text>
                      <TextInput style={styles.input} value={form.ancho_max_material_mm} onChangeText={(v) => set('ancho_max_material_mm', v)}
                        placeholder="Ej. 450" placeholderTextColor="#94A3B8" keyboardType="numeric" editable={!!puedeEditar} />
                    </View>
                    <View style={styles.field}>
                      <Text style={styles.label}>Ancho máx. impresión (mm)</Text>
                      <TextInput style={styles.input} value={form.ancho_max_impresion_mm} onChangeText={(v) => set('ancho_max_impresion_mm', v)}
                        placeholder="Ej. 420" placeholderTextColor="#94A3B8" keyboardType="numeric" editable={!!puedeEditar} />
                    </View>
                    <View style={styles.field}>
                      <Text style={styles.label}>Repetición mín. (mm)</Text>
                      <TextInput style={styles.input} value={form.repeticion_min_mm} onChangeText={(v) => set('repeticion_min_mm', v)}
                        placeholder="Ej. 150" placeholderTextColor="#94A3B8" keyboardType="numeric" editable={!!puedeEditar} />
                    </View>
                    <View style={styles.field}>
                      <Text style={styles.label}>Repetición máx. (mm)</Text>
                      <TextInput style={styles.input} value={form.repeticion_max_mm} onChangeText={(v) => set('repeticion_max_mm', v)}
                        placeholder="Ej. 600" placeholderTextColor="#94A3B8" keyboardType="numeric" editable={!!puedeEditar} />
                    </View>
                  </View>
                </View>

                {/* ── Operación ── */}
                <View style={styles.specCard}>
                  <Text style={styles.specCardHeader}>Operación</Text>
                  <View style={styles.specGrid}>
                    <View style={styles.field}>
                      <Text style={styles.label}>Velocidad máx. (m/min)</Text>
                      <TextInput style={styles.input} value={form.velocidad_max_maquina_mmin} onChangeText={(v) => set('velocidad_max_maquina_mmin', v)}
                        placeholder="Ej. 150" placeholderTextColor="#94A3B8" keyboardType="numeric" editable={!!puedeEditar} />
                    </View>
                    <View style={styles.field}>
                      <Text style={styles.label}>Espesor planchas (mm)</Text>
                      <TextInput style={styles.input} value={form.espesor_planchas_mm} onChangeText={(v) => set('espesor_planchas_mm', v)}
                        placeholder="Ej. 1.14" placeholderTextColor="#94A3B8" keyboardType="numeric" editable={!!puedeEditar} />
                    </View>
                    <View style={styles.fieldFull}>
                      <Text style={styles.label}>Sistemas de secado</Text>
                      <TextInput style={styles.input} value={form.sistemas_secado} onChangeText={(v) => set('sistemas_secado', v)}
                        placeholder="Ej. UV, secado por aire" placeholderTextColor="#94A3B8" editable={!!puedeEditar} />
                    </View>
                  </View>
                </View>

              </ScrollView>

              <View style={styles.footer}>
                <TouchableOpacity onPress={onClose} style={styles.btnCancel}>
                  <Text style={styles.btnCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => puedeEditar && handleSaveEspecificaciones()}
                  disabled={!puedeEditar}
                  style={[styles.btnSave, !puedeEditar && { opacity: 0.45 }]}
                >
                  <Text style={styles.btnSaveText}>Guardar cambios</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            /* Tab 2: Historial de tests */
            <View style={styles.testsContainer}>
              <View style={styles.testsHeader}>
                <Text style={styles.testsCount}>
                  {loadingTests ? 'Cargando…' : `${tests.length} test${tests.length !== 1 ? 's' : ''}`}
                </Text>
                <TouchableOpacity
                  style={styles.btnNuevoTest}
                  onPress={() => setShowNuevoTestForm((p) => !p)}
                >
                  <Text style={styles.btnNuevoTestText}>{showNuevoTestForm ? 'Cancelar' : '+ Nuevo test'}</Text>
                </TouchableOpacity>
              </View>

              {/* Pestañas por fabricante de plancha */}
              {tests.length > 0 && (() => {
                const fabricantes = [...new Set(tests.map((t) => t.fabricante_plancha?.trim() || ''))];
                return (
                  <View style={styles.planchaTabBar}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingHorizontal: 14, gap: 6, alignItems: 'center' }}
                    >
                      {fabricantes.map((fab) => {
                        const isActive = activePlancha === fab;
                        const count = tests.filter((t) => (t.fabricante_plancha?.trim() || '') === fab).length;
                        return (
                          <TouchableOpacity
                            key={fab || '__sin__'}
                            style={[styles.planchaTab, isActive && styles.planchaTabActive]}
                            onPress={() => setActivePlancha(fab)}
                          >
                            <Text style={[styles.planchaTabText, isActive && styles.planchaTabTextActive]} numberOfLines={1}>
                              {fab || 'Sin proveedor'}
                            </Text>
                            <Text style={[styles.planchaTabCount, isActive && styles.planchaTabCountActive]}>
                              {count}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                );
              })()}

              <ScrollView style={styles.testsList} contentContainerStyle={{ paddingBottom: 16 }}>
                {showNuevoTestForm && (
                  <NuevoTestForm
                    onSubmit={handleCrearTest}
                    onCancel={() => setShowNuevoTestForm(false)}
                    fabricantesSugeridos={[...new Set(tests.map((t) => t.fabricante_plancha?.trim()).filter(Boolean))]}
                    fabricantesTintasSugeridos={[...new Set(tests.map((t) => t.fabricante_tintas?.trim()).filter(Boolean))]}
                    materialesCatalogo={materialesCatalogo}
                  />
                )}

                {loadingTests && (
                  <View style={styles.centered}>
                    <ActivityIndicator size="small" color="#4F46E5" />
                  </View>
                )}

                {testsError && (
                  <Text style={styles.errorText}>{testsError}</Text>
                )}

                {!loadingTests && !testsError && tests.length === 0 && !showNuevoTestForm && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>Sin tests registrados</Text>
                    <Text style={styles.emptyMsg}>
                      Registra el primer test de condiciones de impresión para esta máquina.
                    </Text>
                  </View>
                )}

                {(() => {
                  const filtrados = tests.filter((t) => (t.fabricante_plancha?.trim() || '') === activePlancha);
                  const ultimoId = filtrados.length > 0 ? filtrados[filtrados.length - 1].id : null;
                  return filtrados.map((test) => (
                    <TestRow
                      key={test.id}
                      test={test}
                      defaultExpanded={test.id === ultimoId}
                      onDelete={() => handleEliminarTest(test.id)}
                    />
                  ));
                })()}
              </ScrollView>
            </View>
          )}

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 1100,
    maxHeight: '96%',
    overflow: 'hidden',
    flexDirection: 'column',
  },
  header: {
    backgroundColor: '#1E1B4B',
    paddingVertical: 14,
    paddingHorizontal: 20,
    paddingRight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    position: 'relative',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 14, fontWeight: '400', color: '#94A3B8', flex: 1 },
  closeBtn: {
    position: 'absolute',
    right: 14,
    top: 14,
    padding: 4,
  },
  closeBtnText: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },

  // Tabs — estilo píldora igual que PedidoDetalleModal
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F8',
    borderRadius: 10,
    margin: 12,
    marginBottom: 0,
    padding: 3,
    gap: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabText: { fontSize: 13, fontWeight: '500', color: '#94A3B8' },
  tabTextActive: { fontSize: 13, fontWeight: '700', color: '#1E1B4B' },

  // Especificaciones tab
  body: { padding: 12, flex: 1 },
  // specCard — igual que sectionCard de PedidoDetalleModal
  specCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 0,
  },
  specCardHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F1F5F9',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    backgroundColor: '#1E1B4B',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  specGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, padding: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  field: { flex: 1, minWidth: 140 },
  fieldFull: { width: '100%' },
  label: { fontSize: 11, color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 },
  input: {
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F1F5F9',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 10,
    color: '#0F172A',
  },
  selectWrap: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  btnCancel: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  btnCancelText: { color: '#64748B', fontWeight: '600' },
  btnSave: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  btnSaveText: { color: '#4F46E5', fontWeight: '700' },

  // Tests tab
  testsContainer: { flex: 1, flexDirection: 'column' },
  testsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  testsCount: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  btnNuevoTest: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
  },
  btnNuevoTestText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  testsList: { flex: 1, paddingHorizontal: 14, paddingTop: 10 },
  centered: { alignItems: 'center', paddingVertical: 24 },
  errorText: { color: '#DC2626', textAlign: 'center', marginTop: 16, fontSize: 13 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#334155', marginBottom: 6 },
  emptyMsg: { fontSize: 13, color: '#94A3B8', textAlign: 'center', maxWidth: 320 },
  planchaTabBar: {
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    justifyContent: 'center',
  },
  planchaTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  planchaTabActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  planchaTabText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  planchaTabTextActive: { color: '#4F46E5', fontWeight: '800' },
  planchaTabCount: {
    fontSize: 11, fontWeight: '700', color: '#94A3B8',
    backgroundColor: '#E2E8F0', borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 1,
  },
  planchaTabCountActive: { color: '#4F46E5', backgroundColor: '#C7D2FE' },
});

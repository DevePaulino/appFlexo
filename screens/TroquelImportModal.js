import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator, StyleSheet } from 'react-native';

const API_BASE = 'http://localhost:8080';

// Campos base fijos del troquel
const CAMPOS_BASE = [
  { key: 'numero',           label: 'Número / Referencia', required: true },
  { key: 'tipo',             label: 'Tipo (regular/irregular/corbata)' },
  { key: 'forma',            label: 'Forma' },
  { key: 'estado',           label: 'Estado' },
  { key: 'anchoMotivo',      label: 'Ancho motivo (mm)' },
  { key: 'altoMotivo',       label: 'Alto motivo (mm)' },
  { key: 'motivosAncho',     label: 'Motivos ancho' },
  { key: 'separacionAncho',  label: 'Separación ancho' },
  { key: 'valorZ',           label: 'Valor Z' },
  { key: 'distanciaSesgado', label: 'Distancia sesgado' },
  { key: 'sentido_impresion',label: 'Sentido impresión' },
];

const NO_MAPEAR = '__none__';

export default function TroquelImportModal({ visible, fileHeaders, fileRows, onClose, onImport }) {
  const [camposCustom, setCamposCustom] = useState([]);
  const [mapeo, setMapeo] = useState({});       // { appKey: fileColumnHeader | NO_MAPEAR }
  const [importing, setImporting] = useState(false);

  // Carga campos personalizados del form builder al abrir
  useEffect(() => {
    if (!visible) return;
    const token = global.__MIAPP_ACCESS_TOKEN;
    fetch(`${API_BASE}/api/campos-formulario?form=troquel`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((d) => setCamposCustom(d.campos || []))
      .catch(() => setCamposCustom([]));
  }, [visible]);

  // Auto-mapear columnas del archivo que coincidan con labels o keys
  useEffect(() => {
    if (!visible || !fileHeaders.length) return;
    const normalizar = (s) =>
      String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[\s_\-]+/g, '_');

    const autoMap = {};
    const allCampos = [
      ...CAMPOS_BASE,
      ...camposCustom.map((c) => ({ key: `__custom__${c.campo_id}`, label: c.etiqueta, campo_id: c.campo_id })),
    ];

    allCampos.forEach((campo) => {
      const labelNorm = normalizar(campo.label);
      const keyNorm = normalizar(campo.key.replace('__custom__', ''));
      const match = fileHeaders.find((h) => {
        const hn = normalizar(h);
        return hn === labelNorm || hn === keyNorm || labelNorm.includes(hn) || hn.includes(keyNorm);
      });
      autoMap[campo.key] = match || NO_MAPEAR;
    });
    setMapeo(autoMap);
  }, [visible, fileHeaders, camposCustom]);

  const allCampos = [
    ...CAMPOS_BASE,
    ...camposCustom.map((c) => ({ key: `__custom__${c.campo_id}`, label: c.etiqueta, campo_id: c.campo_id, isCustom: true })),
  ];

  // Preview primeras 3 filas con mapeo actual
  const previewRows = fileRows.slice(0, 3).map((row) => {
    const result = {};
    allCampos.forEach((campo) => {
      const col = mapeo[campo.key];
      result[campo.label] = col && col !== NO_MAPEAR ? (row[col] ?? '') : '';
    });
    return result;
  });
  const previewLabels = allCampos.map((c) => c.label);

  const handleImport = async () => {
    const missingRequired = CAMPOS_BASE.filter((c) => c.required && (!mapeo[c.key] || mapeo[c.key] === NO_MAPEAR));
    if (missingRequired.length > 0) {
      alert(`Campos obligatorios sin mapear: ${missingRequired.map((c) => c.label).join(', ')}`);
      return;
    }

    setImporting(true);
    const troqueles = fileRows.map((row) => {
      const t = {};
      // Base fields
      CAMPOS_BASE.forEach((campo) => {
        const col = mapeo[campo.key];
        if (col && col !== NO_MAPEAR) t[campo.key] = String(row[col] ?? '').trim();
      });
      // Custom fields
      const camposExtra = {};
      camposCustom.forEach((c) => {
        const col = mapeo[`__custom__${c.campo_id}`];
        if (col && col !== NO_MAPEAR) camposExtra[c.campo_id] = String(row[col] ?? '').trim();
      });
      if (Object.keys(camposExtra).length > 0) t.campos_extra = camposExtra;
      return t;
    }).filter((t) => t.numero);

    await onImport(troqueles);
    setImporting(false);
  };

  const validRows = fileRows.filter((row) => {
    const col = mapeo['numero'];
    return col && col !== NO_MAPEAR && String(row[col] || '').trim();
  }).length;

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.modal}>
          {/* Header */}
          <View style={s.header}>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>Mapear campos de importación</Text>
              <Text style={s.subtitle}>{fileRows.length} registros detectados en el archivo</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Text style={s.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
            {/* Mapeo de campos */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>MAPEO DE CAMPOS</Text>
              <Text style={s.sectionHint}>
                Selecciona qué columna del archivo corresponde a cada campo de la app.
              </Text>

              {allCampos.map((campo) => (
                <View key={campo.key} style={s.mapRow}>
                  <View style={s.mapLabel}>
                    <Text style={s.mapLabelText} numberOfLines={1}>
                      {campo.label}
                      {campo.required ? <Text style={s.required}> *</Text> : null}
                    </Text>
                    {campo.isCustom && <Text style={s.customBadge}>personalizado</Text>}
                  </View>
                  <View style={s.mapSelect}>
                    {/* En web usamos <select> nativo para máxima compatibilidad */}
                    <select
                      value={mapeo[campo.key] || NO_MAPEAR}
                      onChange={(e) => setMapeo((m) => ({ ...m, [campo.key]: e.target.value }))}
                      style={{
                        flex: 1,
                        height: 32,
                        borderRadius: 6,
                        border: '1px solid #CBD5E1',
                        backgroundColor: mapeo[campo.key] && mapeo[campo.key] !== NO_MAPEAR ? '#F0FDF4' : '#F8FAFC',
                        fontSize: 12,
                        color: '#0F172A',
                        paddingLeft: 8,
                        cursor: 'pointer',
                        outline: 'none',
                        width: '100%',
                      }}
                    >
                      <option value={NO_MAPEAR}>— No importar —</option>
                      {fileHeaders.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </View>
                </View>
              ))}
            </View>

            {/* Preview */}
            {previewRows.length > 0 && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>VISTA PREVIA (primeras {previewRows.length} filas)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator>
                  <View>
                    {/* Cabecera */}
                    <View style={[s.previewRow, s.previewHeader]}>
                      {previewLabels.filter((_, i) => {
                        const campo = allCampos[i];
                        return mapeo[campo.key] && mapeo[campo.key] !== NO_MAPEAR;
                      }).map((label) => (
                        <Text key={label} style={s.previewHeaderCell} numberOfLines={1}>{label}</Text>
                      ))}
                    </View>
                    {/* Filas */}
                    {previewRows.map((row, ri) => (
                      <View key={ri} style={[s.previewRow, ri % 2 === 1 && s.previewRowAlt]}>
                        {previewLabels.filter((_, i) => {
                          const campo = allCampos[i];
                          return mapeo[campo.key] && mapeo[campo.key] !== NO_MAPEAR;
                        }).map((label) => (
                          <Text key={label} style={s.previewCell} numberOfLines={1}>{String(row[label] ?? '')}</Text>
                        ))}
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={s.footer}>
            <TouchableOpacity style={s.cancelBtn} onPress={onClose} disabled={importing}>
              <Text style={s.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.importBtn, (importing || validRows === 0) && s.importBtnDisabled]}
              onPress={handleImport}
              disabled={importing || validRows === 0}
            >
              {importing
                ? <ActivityIndicator size="small" color="#FFF" />
                : <Text style={s.importBtnText}>Importar {validRows} troqueles</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay:       { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'center', alignItems: 'center' },
  modal:         { width: '92%', maxWidth: 800, maxHeight: '90%', backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', flexDirection: 'column' },
  header:        { flexDirection: 'row', alignItems: 'flex-start', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  title:         { fontSize: 16, fontWeight: '800', color: '#1E1B4B' },
  subtitle:      { fontSize: 12, color: '#64748B', marginTop: 2 },
  closeBtn:      { padding: 4 },
  closeBtnText:  { fontSize: 16, color: '#94A3B8' },
  section:       { margin: 16, marginBottom: 0, backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', padding: 14 },
  sectionTitle:  { fontSize: 10, fontWeight: '800', color: '#4F46E5', letterSpacing: 0.8, marginBottom: 4 },
  sectionHint:   { fontSize: 12, color: '#64748B', marginBottom: 12 },
  mapRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  mapLabel:      { width: 180, gap: 2 },
  mapLabelText:  { fontSize: 12, fontWeight: '600', color: '#334155' },
  required:      { color: '#EF4444' },
  customBadge:   { fontSize: 9, color: '#7C3AED', backgroundColor: '#F5F3FF', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, alignSelf: 'flex-start' },
  mapSelect:     { flex: 1 },
  previewRow:    { flexDirection: 'row' },
  previewHeader: { backgroundColor: '#EEF2FF' },
  previewRowAlt: { backgroundColor: '#F8FAFC' },
  previewHeaderCell: { width: 130, fontSize: 10, fontWeight: '700', color: '#4F46E5', padding: 6, borderRightWidth: 1, borderRightColor: '#E2E8F0' },
  previewCell:   { width: 130, fontSize: 11, color: '#334155', padding: 6, borderRightWidth: 1, borderRightColor: '#F1F5F9' },
  footer:        { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  cancelBtn:     { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#FFF' },
  cancelBtnText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  importBtn:     { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 8, backgroundColor: '#4F46E5' },
  importBtnDisabled: { backgroundColor: '#A5B4FC' },
  importBtnText: { fontSize: 13, color: '#FFF', fontWeight: '700' },
});

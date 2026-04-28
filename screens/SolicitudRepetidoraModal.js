import { useState, useEffect } from 'react';
import {
  View, Text, Modal, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, StyleSheet, Switch, Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';

const API_BASE = 'http://localhost:8080';

function apiFetch(path, opts = {}) {
  const token = global.__MIAPP_ACCESS_TOKEN;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opts.headers || {}),
  };
  return fetch(`${API_BASE}${path}`, { ...opts, headers }).then(async (res) => {
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json;
  });
}

export default function SolicitudRepetidoraModal({ visible, onClose, pedido, onSaved }) {
  const { t } = useTranslation();

  const [calles,  setCalles]  = useState('');
  const [motivos, setMotivos] = useState('');
  const [tamano,  setTamano]  = useState('');
  const [sesgado, setSesgado] = useState(false);
  const [desp,    setDesp]    = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);
  const [saved,   setSaved]   = useState(false);

  const pedidoId = pedido?._id || pedido?.pedido_id || pedido?.id;
  const dp = pedido?.datos_presupuesto || pedido?.datos_json || {};

  useEffect(() => {
    if (!visible) return;
    setCalles(String(dp.rep_calles  || ''));
    setMotivos(String(dp.rep_motivos || ''));
    setTamano(String(dp.rep_tamano  || ''));
    setSesgado(!!dp.rep_sesgado);
    setDesp(String(dp.rep_desp || ''));
    setError(null);
    setSaved(false);
  }, [visible, pedidoId]);

  const handleSesgadoToggle = (v) => {
    setSesgado(v);
    if (!v) setDesp('');
  };

  const handleGuardar = async () => {
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/api/pedidos/${pedidoId}/repetidora`, {
        method: 'PATCH',
        body: JSON.stringify({
          rep_calles:  calles.trim()  || null,
          rep_motivos: motivos.trim() || null,
          rep_tamano:  tamano.trim()  || null,
          rep_sesgado: sesgado,
          rep_desp:    sesgado ? (desp.trim() || null) : null,
        }),
      });
      setSaved(true);
      if (onSaved) onSaved();
    } catch (e) {
      setError(e.message);
    }
    setSaving(false);
  };

  const yaConfigurado = !!(dp.rep_calles || dp.rep_motivos || dp.rep_tamano);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>

          {/* ── Header ── */}
          <View style={s.header}>
            <View style={{ flex: 1 }}>
              <Text style={s.headerTitle}>⟳ {t('repetidora.modalTitle')}</Text>
              <Text style={s.headerSub} numberOfLines={1}>
                {pedido?.referencia || pedido?.numero_pedido || pedidoId}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Text style={s.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>

            {/* ── Banners ── */}
            {yaConfigurado && !saved && (
              <View style={s.alertInfo}>
                <Text style={s.alertInfoText}>{t('repetidora.yaConfigurado')}</Text>
              </View>
            )}
            {saved && (
              <View style={s.alertOk}>
                <Text style={[s.alertText, { color: '#166534', fontWeight: '800', fontSize: 15 }]}>
                  ✓ {t('repetidora.guardadoOk')}
                </Text>
              </View>
            )}

            {/* ── Campos principales ── */}
            <View style={s.row}>
              <View style={s.col}>
                <Text style={s.label}>{t('forms.repCalles')}</Text>
                <TextInput
                  value={calles}
                  onChangeText={setCalles}
                  keyboardType="numeric"
                  placeholder="4"
                  placeholderTextColor="#94A3B8"
                  style={s.input}
                />
              </View>
              <View style={s.col}>
                <Text style={s.label}>{t('forms.repMotivos')}</Text>
                <TextInput
                  value={motivos}
                  onChangeText={setMotivos}
                  keyboardType="numeric"
                  placeholder="2"
                  placeholderTextColor="#94A3B8"
                  style={s.input}
                />
              </View>
              <View style={s.col}>
                <Text style={s.label}>{t('forms.repTamano')}</Text>
                <TextInput
                  value={tamano}
                  onChangeText={setTamano}
                  placeholder="500 mm"
                  placeholderTextColor="#94A3B8"
                  style={s.input}
                />
              </View>
            </View>

            {/* ── Sesgado ── */}
            <View style={s.switchRow}>
              <Text style={s.switchLabel}>{t('forms.repSesgado')}</Text>
              <Switch
                value={sesgado}
                onValueChange={handleSesgadoToggle}
                trackColor={{ false: '#CBD5E1', true: '#4F46E5' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* ── Desplazamiento ── */}
            {sesgado && (
              <View style={s.row}>
                <View style={s.col}>
                  <Text style={s.label}>{t('forms.repDesp')}</Text>
                  <TextInput
                    value={desp}
                    onChangeText={setDesp}
                    placeholder="mm"
                    placeholderTextColor="#94A3B8"
                    style={s.input}
                  />
                </View>
                <View style={s.col} />
                <View style={s.col} />
              </View>
            )}

            {error && (
              <View style={s.alertErr}>
                <Text style={s.alertText}>{error}</Text>
              </View>
            )}

          </ScrollView>

          {/* ── Footer ── */}
          <View style={s.footer}>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 0 }}>
              <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
                <Text style={s.cancelBtnText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.saveBtn, saving && { opacity: 0.5 }]}
                onPress={handleGuardar}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator size="small" color="#FFF" />
                  : <Text style={s.saveBtnText}>{t('common.save')}</Text>}
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  sheet:   { backgroundColor: '#FFFFFF', borderRadius: 16, maxHeight: '90%', width: '100%', maxWidth: 620,
             ...(Platform.OS === 'web' ? { minHeight: 360 } : {}),
             overflow: 'hidden',
             shadowColor: '#0F172A', shadowOpacity: 0.18, shadowRadius: 28, shadowOffset: { width: 0, height: 10 }, elevation: 10 },

  header:      { flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1E1B4B' },
  headerSub:   { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  closeBtn:    { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  closeBtnText:{ fontSize: 14, color: '#64748B', fontWeight: '700' },

  label: { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 6 },

  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },

  input: { backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 8, padding: 10, fontSize: 14, color: '#0F172A' },

  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1.5, borderColor: '#E2E8F0',
    paddingHorizontal: 14, paddingVertical: 12,
  },
  switchLabel: { fontSize: 14, fontWeight: '600', color: '#0F172A' },

  alertInfo:     { backgroundColor: '#EEF2FF', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#C7D2FE' },
  alertInfoText: { fontSize: 13, color: '#3730A3', fontWeight: '600' },
  alertOk:       { backgroundColor: '#F0FDF4', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#BBF7D0' },
  alertErr:      { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#FECACA' },
  alertText:     { fontSize: 13, color: '#0F172A' },

  footer:       { padding: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  cancelBtn:    { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#E2E8F0', alignItems: 'center' },
  cancelBtnText:{ fontSize: 14, fontWeight: '600', color: '#64748B' },
  saveBtn:      { flex: 2, backgroundColor: '#4F46E5', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  saveBtnText:  { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});

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

  const [calles,      setCalles]      = useState('');
  const [motivos,     setMotivos]     = useState('');
  const [tamano,      setTamano]      = useState('');
  const [sesgado,     setSesgado]     = useState(false);
  const [desp,        setDesp]        = useState('');
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState(null);
  const [saved,       setSaved]       = useState(false);

  const pedidoId = pedido?._id || pedido?.pedido_id || pedido?.id;
  const dp = pedido?.datos_presupuesto || pedido?.datos_json || {};

  // Cargar valores existentes al abrir
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
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('repetidora.modalTitle')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 20 }}>
            {/* Referencia del pedido */}
            {pedido?.referencia && (
              <View style={styles.refRow}>
                <Text style={styles.refLabel}>{t('forms.referencia')}</Text>
                <Text style={styles.refValue}>{pedido.referencia}</Text>
              </View>
            )}

            {/* Badge: ya configurado */}
            {yaConfigurado && !saved && (
              <View style={styles.infoBanner}>
                <Text style={styles.infoBannerText}>{t('repetidora.yaConfigurado')}</Text>
              </View>
            )}

            {/* Éxito guardado */}
            {saved && (
              <View style={styles.successBanner}>
                <Text style={styles.successBannerText}>{t('repetidora.guardadoOk')}</Text>
              </View>
            )}

            {/* Campos */}
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>{t('forms.repCalles')}</Text>
                <TextInput
                  value={calles}
                  onChangeText={setCalles}
                  keyboardType="numeric"
                  placeholder="4"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>{t('forms.repMotivos')}</Text>
                <TextInput
                  value={motivos}
                  onChangeText={setMotivos}
                  keyboardType="numeric"
                  placeholder="2"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>{t('forms.repTamano')}</Text>
                <TextInput
                  value={tamano}
                  onChangeText={setTamano}
                  placeholder="500 mm"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={[styles.row, { alignItems: 'center' }]}>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>{t('forms.repSesgado')}</Text>
                <Switch
                  value={sesgado}
                  onValueChange={handleSesgadoToggle}
                  trackColor={{ false: '#CBD5E1', true: '#4F46E5' }}
                  thumbColor="#FFFFFF"
                />
              </View>
              {sesgado && (
                <View style={styles.col}>
                  <Text style={styles.label}>{t('forms.repDesp')}</Text>
                  <TextInput
                    value={desp}
                    onChangeText={setDesp}
                    placeholder="mm"
                    placeholderTextColor="#94A3B8"
                    style={styles.input}
                  />
                </View>
              )}
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleGuardar}
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.saveBtnText}>{t('common.save')}</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  header: {
    backgroundColor: '#1E1B4B',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    color: '#C7D2FE',
    fontSize: 18,
    fontWeight: '600',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  refLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  refValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
  },
  infoBanner: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  infoBannerText: {
    fontSize: 13,
    color: '#3730A3',
    fontWeight: '600',
  },
  successBanner: {
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  successBannerText: {
    fontSize: 13,
    color: '#166534',
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  col: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F1F5F9',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
    color: '#0F172A',
  },
  switchRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  saveBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    minWidth: 100,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

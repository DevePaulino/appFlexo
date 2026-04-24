import { useState, useEffect } from 'react';
import {
  View, Text, Modal, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, StyleSheet, Platform,
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

// Muestra un chip de color de separación
function SepChip({ sep, selected, onToggle }) {
  const color = sep.color || '#CBD5E1';
  const isLight = _isLightColor(color);
  return (
    <TouchableOpacity
      onPress={onToggle}
      style={[
        s.sepChip,
        selected && s.sepChipSelected,
        selected && { borderColor: color },
      ]}
      activeOpacity={0.75}
    >
      <View style={[s.sepDot, { backgroundColor: color, borderColor: isLight ? '#94A3B8' : 'transparent' }]} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={s.sepName} numberOfLines={1}>{sep.nombre}</Text>
        {(sep.tipo || sep.lpi) ? (
          <Text style={s.sepMeta}>
            {[sep.tipo, sep.lpi ? `${sep.lpi} lpi` : null, sep.angulo ? `${sep.angulo}°` : null]
              .filter(Boolean).join(' · ')}
          </Text>
        ) : null}
      </View>
      <View style={[s.checkbox, selected && s.checkboxSelected]}>
        {selected && <Text style={s.checkmark}>✓</Text>}
      </View>
    </TouchableOpacity>
  );
}

function _isLightColor(hex) {
  try {
    const c = hex.replace('#', '');
    const r = parseInt(c.substr(0, 2), 16);
    const g = parseInt(c.substr(2, 2), 16);
    const b = parseInt(c.substr(4, 2), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 180;
  } catch { return false; }
}

// ─── Modal principal ──────────────────────────────────────────────────────────
export default function SolicitudClichesModal({ visible, onClose, pedido, currentUser }) {
  const { t } = useTranslation();
  const isResellerClient = Boolean(currentUser?.reseller_id);

  const [loading, setLoading]           = useState(false);
  const [separaciones, setSeparaciones] = useState([]);
  const [archivoId, setArchivoId]       = useState(null);
  const [selected, setSelected]         = useState(new Set());
  const [proveedores, setProveedores]   = useState([]);
  const [proveedorId, setProveedorId]   = useState(null);
  const [notas, setNotas]               = useState('');
  const [sending, setSending]           = useState(false);
  const [result, setResult]             = useState(null); // { ok, email_sent, url_descarga, error }

  const pedidoId = pedido?._id || pedido?.pedido_id || pedido?.id;
  const maquina  = pedido?.datos_presupuesto?.maquina || pedido?.maquina || '—';
  const material = pedido?.datos_presupuesto?.material || '—';

  useEffect(() => {
    if (!visible || !pedidoId) return;
    setSelected(new Set());
    setResult(null);
    setNotas('');
    setProveedorId(null);
    loadData();
  }, [visible, pedidoId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sepData, provData] = await Promise.all([
        apiFetch(`/api/pedidos/${pedidoId}/separaciones-repetidora`),
        isResellerClient ? Promise.resolve({ proveedores: [] }) : apiFetch('/api/proveedores-grabados'),
      ]);
      setSeparaciones(sepData.separaciones || []);
      setArchivoId(sepData.archivo_id || null);
      setProveedores(provData.proveedores || []);
    } catch (e) {
      setResult({ error: e.message });
    }
    setLoading(false);
  };

  const toggleSep = (nombre) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(nombre) ? next.delete(nombre) : next.add(nombre);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === separaciones.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(separaciones.map((s) => s.nombre)));
    }
  };

  const provSeleccionado = isResellerClient
    ? { _id: null, nombre: t('cliches.resellerFabricante'), email: currentUser?.reseller_email || '' }
    : proveedores.find((p) => p._id === proveedorId) || null;

  const puedeEnviar = selected.size > 0 && (isResellerClient || provSeleccionado?.email);

  const enviar = async () => {
    if (!puedeEnviar) return;
    setSending(true); setResult(null);
    try {
      const sepsSeleccionadas = separaciones.filter((s) => selected.has(s.nombre));
      const res = await apiFetch(`/api/pedidos/${pedidoId}/solicitud-cliches`, {
        method: 'POST',
        body: JSON.stringify({
          separaciones: sepsSeleccionadas,
          proveedor_id: provSeleccionado?._id || null,
          proveedor_nombre: provSeleccionado?.nombre || '',
          proveedor_email: provSeleccionado?.email || '',
          notas,
        }),
      });
      setResult({ ok: true, email_sent: res.email_sent, url_descarga: res.url_descarga });
    } catch (e) {
      setResult({ error: e.message });
    }
    setSending(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          {/* Header */}
          <View style={s.header}>
            <View style={{ flex: 1 }}>
              <Text style={s.headerTitle}>🖨️ {t('cliches.modalTitle')}</Text>
              <Text style={s.headerSub} numberOfLines={1}>
                {pedido?.referencia || pedido?.numero_pedido || pedidoId}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Text style={s.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>

            {/* ── Contexto del pedido ── */}
            <View style={s.contextRow}>
              <View style={s.contextItem}>
                <Text style={s.contextLabel}>{t('cliches.maquina')}</Text>
                <Text style={s.contextValue}>{maquina}</Text>
              </View>
              <View style={s.contextItem}>
                <Text style={s.contextLabel}>{t('cliches.material')}</Text>
                <Text style={s.contextValue}>{material}</Text>
              </View>
            </View>

            {loading ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={[s.contextLabel, { marginTop: 10 }]}>{t('cliches.cargandoSeparaciones')}</Text>
              </View>
            ) : result?.error && separaciones.length === 0 ? (
              <View style={s.alertErr}>
                <Text style={s.alertText}>{result.error}</Text>
              </View>
            ) : (
              <>
                {/* ── Separaciones ── */}
                <View style={s.sectionHeader}>
                  <Text style={s.sectionLabel}>{t('cliches.separacionesTitle')} ({separaciones.length})</Text>
                  {separaciones.length > 0 && (
                    <TouchableOpacity onPress={toggleAll}>
                      <Text style={s.selectAll}>
                        {selected.size === separaciones.length ? t('cliches.deselAll') : t('cliches.selAll')}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {separaciones.length === 0 ? (
                  <View style={s.emptyBox}>
                    <Text style={s.emptyText}>{t('cliches.sinSeparaciones')}</Text>
                    <Text style={[s.contextLabel, { textAlign: 'center', marginTop: 4 }]}>{t('cliches.sinSeparacionesSub')}</Text>
                  </View>
                ) : (
                  <View style={s.sepList}>
                    {separaciones.map((sep) => (
                      <SepChip
                        key={sep.nombre}
                        sep={sep}
                        selected={selected.has(sep.nombre)}
                        onToggle={() => toggleSep(sep.nombre)}
                      />
                    ))}
                  </View>
                )}

                {/* ── Proveedor ── */}
                <Text style={[s.sectionLabel, { marginTop: 20, marginBottom: 10 }]}>
                  {t('cliches.proveedorTitle')}
                </Text>

                {isResellerClient ? (
                  <View style={[s.resellerInfoBox]}>
                    <Text style={s.resellerInfoIcon}>🤝</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={s.resellerInfoTitle}>{t('cliches.resellerFabricante')}</Text>
                      <Text style={s.resellerInfoSub}>{t('cliches.resellerFabricanteSub')}</Text>
                    </View>
                  </View>
                ) : proveedores.length === 0 ? (
                  <View style={s.emptyBox}>
                    <Text style={s.emptyText}>{t('cliches.sinProveedores')}</Text>
                    <Text style={[s.contextLabel, { textAlign: 'center', marginTop: 4 }]}>{t('cliches.sinProveedoresSub')}</Text>
                  </View>
                ) : (
                  <View style={s.provList}>
                    {proveedores.map((prov) => {
                      const active = prov._id === proveedorId;
                      return (
                        <TouchableOpacity
                          key={prov._id}
                          style={[s.provCard, active && s.provCardActive]}
                          onPress={() => setProveedorId(prov._id)}
                          activeOpacity={0.75}
                        >
                          <View style={[s.provRadio, active && s.provRadioActive]}>
                            {active && <View style={s.provRadioDot} />}
                          </View>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={[s.provName, active && { color: '#4F46E5' }]}>{prov.nombre}</Text>
                            {prov.contacto ? <Text style={s.provMeta}>{prov.contacto}</Text> : null}
                            {prov.email ? (
                              <Text style={[s.provMeta, { color: active ? '#4F46E5' : '#475569' }]}>{prov.email}</Text>
                            ) : (
                              <Text style={[s.provMeta, { color: '#EF4444' }]}>⚠ {t('cliches.sinEmail')}</Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* ── Notas ── */}
                <Text style={[s.sectionLabel, { marginTop: 20, marginBottom: 6 }]}>{t('cliches.notasTitle')}</Text>
                <TextInput
                  style={s.notasInput}
                  value={notas}
                  onChangeText={setNotas}
                  placeholder={t('cliches.notasPlaceholder')}
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                {/* ── Resultado ── */}
                {result?.ok && (
                  <View style={s.alertOk}>
                    <Text style={[s.alertText, { color: '#166534', fontWeight: '800', fontSize: 15 }]}>
                      ✓ {t('cliches.enviado')}
                    </Text>
                    {result.email_sent && (
                      <Text style={[s.alertText, { color: '#166534', marginTop: 4 }]}>
                        {t('cliches.emailEnviado', { email: provSeleccionado?.email || '' })}
                      </Text>
                    )}
                    {!result.email_sent && (
                      <Text style={[s.alertText, { color: '#92400E', marginTop: 4 }]}>
                        {t('cliches.emailNoEnviado')}
                      </Text>
                    )}
                    {result.url_descarga && result.url_descarga !== '#' && Platform.OS === 'web' && (
                      <TouchableOpacity
                        style={{ marginTop: 10 }}
                        onPress={() => window.open(result.url_descarga, '_blank')}
                      >
                        <Text style={{ color: '#4F46E5', fontWeight: '600', fontSize: 13 }}>
                          ↗ {t('cliches.verEnlaceDescarga')}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {result?.error && (
                  <View style={s.alertErr}>
                    <Text style={s.alertText}>{result.error}</Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {/* Footer */}
          {!result?.ok && (
            <View style={s.footer}>
              {!puedeEnviar && selected.size > 0 && !isResellerClient && (
                <Text style={s.footerHint}>{t('cliches.seleccionaProveedor')}</Text>
              )}
              {!puedeEnviar && selected.size === 0 && (
                <Text style={s.footerHint}>{t('cliches.seleccionaSep')}</Text>
              )}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
                  <Text style={s.cancelBtnText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.sendBtn, (!puedeEnviar || sending) && { opacity: 0.5 }]}
                  onPress={enviar}
                  disabled={!puedeEnviar || sending}
                >
                  {sending
                    ? <ActivityIndicator size="small" color="#FFF" />
                    : <Text style={s.sendBtnText}>
                        {t('cliches.enviarSolicitud')} ({selected.size})
                      </Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          )}

          {result?.ok && (
            <View style={s.footer}>
              <TouchableOpacity style={[s.sendBtn, { flex: 1, backgroundColor: '#10B981' }]} onPress={onClose}>
                <Text style={s.sendBtnText}>{t('cliches.cerrar')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:      { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '92%', flex: 1 },

  header:     { flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerTitle:{ fontSize: 17, fontWeight: '800', color: '#1E1B4B' },
  headerSub:  { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  closeBtn:   { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  closeBtnText:{ fontSize: 14, color: '#64748B', fontWeight: '700' },

  contextRow: { flexDirection: 'row', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  contextItem:{ flex: 1, minWidth: 120, backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  contextLabel:{ fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  contextValue:{ fontSize: 14, fontWeight: '600', color: '#0F172A', marginTop: 3 },

  sectionHeader:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.7 },
  selectAll:    { fontSize: 12, fontWeight: '600', color: '#4F46E5' },

  sepList:    { gap: 6 },
  sepChip:    {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10,
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10, backgroundColor: '#F8FAFC',
  },
  sepChipSelected: { backgroundColor: '#EEF2FF', borderColor: '#A5B4FC' },
  sepDot:     { width: 20, height: 20, borderRadius: 10, flexShrink: 0, borderWidth: 1 },
  sepName:    { fontSize: 13, fontWeight: '600', color: '#0F172A' },
  sepMeta:    { fontSize: 10, color: '#94A3B8', marginTop: 1 },
  checkbox:   { width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkboxSelected: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  checkmark:  { fontSize: 11, color: '#FFF', fontWeight: '800' },

  provList:   { gap: 8 },
  provCard:   { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10, backgroundColor: '#F8FAFC' },
  provCardActive: { backgroundColor: '#EEF2FF', borderColor: '#A5B4FC' },
  provRadio:  { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  provRadioActive: { borderColor: '#4F46E5' },
  provRadioDot:{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#4F46E5' },
  provName:   { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  provMeta:   { fontSize: 11, color: '#94A3B8', marginTop: 1 },

  resellerInfoBox: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: '#F0FDF4', borderRadius: 12, borderWidth: 1.5, borderColor: '#BBF7D0' },
  resellerInfoIcon:{ fontSize: 24 },
  resellerInfoTitle:{ fontSize: 14, fontWeight: '700', color: '#166534' },
  resellerInfoSub: { fontSize: 12, color: '#16A34A', marginTop: 2 },

  notasInput: { backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, fontSize: 14, color: '#0F172A', minHeight: 70 },

  emptyBox:   { alignItems: 'center', paddingVertical: 20, backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  emptyText:  { fontSize: 14, fontWeight: '700', color: '#64748B' },

  alertOk:    { marginTop: 14, backgroundColor: '#F0FDF4', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#BBF7D0' },
  alertErr:   { marginTop: 14, backgroundColor: '#FEF2F2', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#FECACA' },
  alertText:  { fontSize: 13, color: '#0F172A' },

  footer:     { padding: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  footerHint: { fontSize: 12, color: '#94A3B8', textAlign: 'center', marginBottom: 4 },
  cancelBtn:  { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#E2E8F0', alignItems: 'center' },
  cancelBtnText:{ fontSize: 14, fontWeight: '600', color: '#64748B' },
  sendBtn:    { flex: 2, backgroundColor: '#4F46E5', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  sendBtnText:{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});

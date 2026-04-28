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

function _isLightColor(hex) {
  try {
    const c = hex.replace('#', '');
    const r = parseInt(c.substr(0, 2), 16);
    const g = parseInt(c.substr(2, 2), 16);
    const b = parseInt(c.substr(4, 2), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 180;
  } catch { return false; }
}

// ─── Modal principal ───────────────────────────────────────────────────────────
export default function SolicitudClichesModal({ visible, onClose, pedido, currentUser }) {
  const { t } = useTranslation();
  const isResellerClient = Boolean(currentUser?.reseller_id);

  const [loading, setLoading]           = useState(false);
  const [separaciones, setSeparaciones] = useState([]);
  const [selected, setSelected]         = useState(new Set());
  const [proveedores, setProveedores]   = useState([]);
  const [proveedorId, setProveedorId]   = useState(null);
  const [planchaPerSep, setPlanchaPerSep] = useState({}); // { nombre: idx | null }
  const [notas, setNotas]               = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [sending, setSending]           = useState(false);
  const [result, setResult]             = useState(null);
  const [previewHtml, setPreviewHtml]   = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const pedidoId = pedido?._id || pedido?.pedido_id || pedido?.id;
  const maquina  = pedido?.datos_presupuesto?.maquina || pedido?.maquina || '—';
  const material = pedido?.datos_presupuesto?.material || '—';

  useEffect(() => {
    if (!visible || !pedidoId) return;
    setSelected(new Set());
    setResult(null);
    setNotas('');
    setFechaEntrega('');
    setProveedorId(null);
    setPlanchaPerSep({});
    loadData();
  }, [visible, pedidoId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sepData, provData] = await Promise.all([
        apiFetch(`/api/pedidos/${pedidoId}/separaciones-repetidora`),
        isResellerClient ? Promise.resolve({ proveedores: [] }) : apiFetch('/api/proveedores?tipo=cliches'),
      ]);
      setSeparaciones(sepData.separaciones || []);
      setProveedores(provData.proveedores || []);
    } catch (e) {
      setResult({ error: e.message });
    }
    setLoading(false);
  };

  const toggleSep = (nombre) => {
    const wasSelected = selected.has(nombre);
    setSelected((prev) => {
      const next = new Set(prev);
      wasSelected ? next.delete(nombre) : next.add(nombre);
      return next;
    });
    if (wasSelected) {
      setPlanchaPerSep((prev) => {
        const next = { ...prev };
        delete next[nombre];
        return next;
      });
    }
  };

  const toggleAll = () => {
    const allSelected = selected.size === separaciones.length;
    setSelected(allSelected ? new Set() : new Set(separaciones.map((s) => s.nombre)));
    if (allSelected) setPlanchaPerSep({});
  };

  // Aplica una plancha a todas las separaciones SELECCIONADAS
  const applyColumnToAll = (idx) => {
    const next = { ...planchaPerSep };
    separaciones.filter((s) => selected.has(s.nombre)).forEach((s) => { next[s.nombre] = idx; });
    setPlanchaPerSep(next);
  };

  const provSeleccionado = isResellerClient
    ? { _id: null, nombre: t('cliches.resellerFabricante'), email: currentUser?.reseller_email || '' }
    : proveedores.find((p) => p._id === proveedorId) || null;

  const planchas = provSeleccionado?.planchas || [];
  const hasPlanchas = !isResellerClient && planchas.length > 0;
  const todasConPlancha = !hasPlanchas || [...selected].every((n) => planchaPerSep[n] != null);
  const puedeEnviar = selected.size > 0 && (isResellerClient || provSeleccionado?.email) && todasConPlancha;

  const buildSepsPayload = () =>
    separaciones
      .filter((sep) => selected.has(sep.nombre))
      .map((sep) => {
        const idx = planchaPerSep[sep.nombre] ?? null;
        return { ...sep, plancha: idx != null ? (planchas[idx] || null) : null };
      });

  const fetchPreview = async () => {
    if (!puedeEnviar) return;
    setPreviewLoading(true);
    try {
      const res = await apiFetch(`/api/pedidos/${pedidoId}/solicitud-cliches/preview`, {
        method: 'POST',
        body: JSON.stringify({
          separaciones: buildSepsPayload(),
          proveedor_nombre: provSeleccionado?.nombre || '',
          notas,
          fecha_entrega: fechaEntrega.trim() || null,
        }),
      });
      setPreviewHtml(res.html || '');
    } catch (e) {
      setPreviewHtml(`<p style="color:red;font-family:sans-serif;padding:20px">Error: ${e.message}</p>`);
    }
    setPreviewLoading(false);
  };

  const enviar = async () => {
    if (!puedeEnviar) return;
    setSending(true); setResult(null);
    try {
      const res = await apiFetch(`/api/pedidos/${pedidoId}/solicitud-cliches`, {
        method: 'POST',
        body: JSON.stringify({
          separaciones: buildSepsPayload(),
          proveedor_id: provSeleccionado?._id || null,
          proveedor_nombre: provSeleccionado?.nombre || '',
          proveedor_email: provSeleccionado?.email || '',
          notas,
          fecha_entrega: fechaEntrega.trim() || null,
        }),
      });
      setResult({ ok: true, email_sent: res.email_sent, url_descarga: res.url_descarga });
    } catch (e) {
      setResult({ error: e.message });
    }
    setSending(false);
  };

  return (
    <>
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>

          {/* ── Header ── */}
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

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }}>
            {loading ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={[s.label, { marginTop: 10 }]}>{t('cliches.cargandoSeparaciones')}</Text>
              </View>
            ) : result?.error && separaciones.length === 0 ? (
              <View style={s.alertErr}><Text style={s.alertText}>{result.error}</Text></View>
            ) : (
              <>
                {/* ── Barra de contexto ── */}
                <View style={s.infoBar}>
                  <View style={s.infoBarItem}>
                    <Text style={s.label}>{t('cliches.maquina')}</Text>
                    <Text style={s.infoBarValue} numberOfLines={1}>{maquina}</Text>
                  </View>
                  <View style={s.infoBarDivider} />
                  <View style={s.infoBarItem}>
                    <Text style={s.label}>{t('cliches.material')}</Text>
                    <Text style={s.infoBarValue} numberOfLines={1}>{material}</Text>
                  </View>
                </View>

                {/* ── Proveedor de grabados ── */}
                <View>
                  <Text style={[s.label, { marginBottom: 8 }]}>{t('cliches.proveedorTitle')}</Text>
                  {isResellerClient ? (
                    <View style={s.resellerBox}>
                      <Text style={s.resellerTitle}>{t('cliches.resellerFabricante')}</Text>
                      <Text style={s.resellerSub}>{t('cliches.resellerFabricanteSub')}</Text>
                    </View>
                  ) : proveedores.length === 0 ? (
                    <View style={s.emptyBox}>
                      <Text style={s.emptyText}>{t('cliches.sinProveedores')}</Text>
                    </View>
                  ) : (
                    <View style={s.provRow}>
                      {proveedores.map((prov) => {
                        const active = prov._id === proveedorId;
                        return (
                          <TouchableOpacity
                            key={prov._id}
                            style={[s.provCard, active && s.provCardActive]}
                            onPress={() => { setProveedorId(prov._id); setPlanchaPerSep({}); }}
                            activeOpacity={0.75}
                          >
                            <View style={[s.provRadio, active && s.provRadioActive]}>
                              {active && <View style={s.provRadioDot} />}
                            </View>
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <Text style={[s.provName, active && { color: '#4F46E5' }]} numberOfLines={1}>{prov.nombre}</Text>
                              {prov.email ? (
                                <Text style={[s.provMeta, { color: active ? '#4F46E5' : '#64748B' }]} numberOfLines={1}>{prov.email}</Text>
                              ) : (
                                <Text style={[s.provMeta, { color: '#EF4444' }]}>⚠ {t('cliches.sinEmail')}</Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* ── Tabla separaciones + planchas ── */}
                <View>
                  {/* Cabecera sección */}
                  <View style={s.tableHeaderBar}>
                    <TouchableOpacity onPress={toggleAll} style={s.tableCheckCell}>
                      <View style={[s.checkbox, selected.size === separaciones.length && separaciones.length > 0 && s.checkboxSelected]}>
                        {selected.size === separaciones.length && separaciones.length > 0 && <Text style={s.checkmark}>✓</Text>}
                      </View>
                    </TouchableOpacity>
                    <Text style={[s.label, { flex: 1 }]}>{t('cliches.separacionesTitle')} · {separaciones.length}</Text>
                    {hasPlanchas && planchas.map((pl, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={s.tableColHeader}
                        onPress={() => applyColumnToAll(idx)}
                        activeOpacity={0.7}
                      >
                        <Text style={s.tableColHeaderMarca} numberOfLines={1}>{pl.marca}</Text>
                        {pl.referencia ? <Text style={s.tableColHeaderRef} numberOfLines={1}>{pl.referencia}</Text> : null}
                        <Text style={s.tableColHeaderHint}>Todas ↓</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Filas */}
                  {separaciones.length === 0 ? (
                    <View style={s.emptyBox}>
                      <Text style={s.emptyText}>{t('cliches.sinSeparaciones')}</Text>
                      <Text style={[s.label, { textAlign: 'center', marginTop: 4 }]}>{t('cliches.sinSeparacionesSub')}</Text>
                    </View>
                  ) : separaciones.map((sep, i) => {
                    const isSelected = selected.has(sep.nombre);
                    const pIdx = planchaPerSep[sep.nombre] ?? null;
                    const color = sep.color || '#CBD5E1';
                    const isLight = _isLightColor(color);
                    const isLast = i === separaciones.length - 1;
                    return (
                      <View key={sep.nombre} style={[s.tableRow, !isLast && s.tableRowBorder, isSelected && s.tableRowSelected]}>
                        {/* Checkbox */}
                        <TouchableOpacity style={s.tableCheckCell} onPress={() => toggleSep(sep.nombre)}>
                          <View style={[s.checkbox, isSelected && s.checkboxSelected]}>
                            {isSelected && <Text style={s.checkmark}>✓</Text>}
                          </View>
                        </TouchableOpacity>

                        {/* Nombre tinta */}
                        <View style={s.tableNameCell}>
                          <View style={[s.sepDot, { backgroundColor: color, borderColor: isLight ? '#94A3B8' : 'rgba(0,0,0,0.1)' }]} />
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={s.sepName} numberOfLines={1}>{sep.nombre}</Text>
                            {sep.tipo ? <Text style={s.sepMeta}>{sep.tipo}{sep.lpi ? ` · ${sep.lpi} lpi` : ''}</Text> : null}
                          </View>
                        </View>

                        {/* Radio por cada plancha */}
                        {hasPlanchas && planchas.map((pl, idx) => (
                          <TouchableOpacity
                            key={idx}
                            style={[s.tableRadioCell, !isSelected && { opacity: 0.2 }]}
                            onPress={() => setPlanchaPerSep((prev) => ({ ...prev, [sep.nombre]: idx }))}
                            disabled={!isSelected}
                          >
                            <View style={[s.radio, pIdx === idx && s.radioActive]}>
                              {pIdx === idx && <View style={s.radioDot} />}
                            </View>
                          </TouchableOpacity>
                        ))}

                      </View>
                    );
                  })}
                </View>

                {/* ── Fecha + Notas ── */}
                <View style={s.bottomRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.label, { marginBottom: 6 }]}>{t('cliches.fechaEntregaTitle')}</Text>
                    {Platform.OS === 'web' ? (
                      <input
                        type="date"
                        value={fechaEntrega}
                        onChange={(e) => setFechaEntrega(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', fontSize: 14, borderRadius: 8, border: '1.5px solid #E2E8F0', backgroundColor: '#F8FAFC', color: '#0F172A', boxSizing: 'border-box', outline: 'none' }}
                      />
                    ) : (
                      <TextInput style={s.input} value={fechaEntrega} onChangeText={setFechaEntrega} placeholder="DD/MM/AAAA" placeholderTextColor="#94A3B8" keyboardType="numbers-and-punctuation" />
                    )}
                  </View>
                  <View style={{ flex: 2 }}>
                    <Text style={[s.label, { marginBottom: 6 }]}>{t('cliches.notasTitle')}</Text>
                    <TextInput
                      style={[s.input, { minHeight: 60, textAlignVertical: 'top' }]}
                      value={notas}
                      onChangeText={setNotas}
                      placeholder={t('cliches.notasPlaceholder')}
                      placeholderTextColor="#94A3B8"
                      multiline
                    />
                  </View>
                </View>

                {/* ── Resultado ── */}
                {result?.ok && (
                  <View style={s.alertOk}>
                    <Text style={[s.alertText, { color: '#166534', fontWeight: '800', fontSize: 15 }]}>✓ {t('cliches.enviado')}</Text>
                    {result.email_sent && <Text style={[s.alertText, { color: '#166534', marginTop: 4 }]}>{t('cliches.emailEnviado', { email: provSeleccionado?.email || '' })}</Text>}
                    {!result.email_sent && <Text style={[s.alertText, { color: '#92400E', marginTop: 4 }]}>{t('cliches.emailNoEnviado')}</Text>}
                    {result.url_descarga && result.url_descarga !== '#' && Platform.OS === 'web' && (
                      <TouchableOpacity style={{ marginTop: 10 }} onPress={() => window.open(result.url_descarga, '_blank')}>
                        <Text style={{ color: '#4F46E5', fontWeight: '600', fontSize: 13 }}>↗ {t('cliches.verEnlaceDescarga')}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                {result?.error && <View style={s.alertErr}><Text style={s.alertText}>{result.error}</Text></View>}
              </>
            )}
          </ScrollView>

          {/* ── Footer ── */}
          {!result?.ok && (
            <View style={s.footer}>
              {selected.size === 0 && (
                <Text style={s.footerHint}>{t('cliches.seleccionaSep')}</Text>
              )}
              {selected.size > 0 && !isResellerClient && !provSeleccionado?.email && (
                <Text style={s.footerHint}>{t('cliches.seleccionaProveedor')}</Text>
              )}
              {selected.size > 0 && hasPlanchas && !todasConPlancha && (
                <Text style={s.footerHint}>{t('cliches.seleccionaPlancha')}</Text>
              )}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
                  <Text style={s.cancelBtnText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                {Platform.OS === 'web' && (
                  <TouchableOpacity
                    style={[s.previewBtn, (!puedeEnviar || previewLoading) && { opacity: 0.5 }]}
                    onPress={fetchPreview}
                    disabled={!puedeEnviar || previewLoading}
                  >
                    {previewLoading
                      ? <ActivityIndicator size="small" color="#4F46E5" />
                      : <Text style={s.previewBtnText}>Vista previa</Text>}
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[s.sendBtn, (!puedeEnviar || sending) && { opacity: 0.5 }]}
                  onPress={enviar}
                  disabled={!puedeEnviar || sending}
                >
                  {sending
                    ? <ActivityIndicator size="small" color="#FFF" />
                    : <Text style={s.sendBtnText}>{t('cliches.enviarSolicitud', { count: selected.size })}</Text>}
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

    {/* Vista previa del email */}
    {previewHtml !== null && Platform.OS === 'web' && (
      <Modal visible={true} transparent animationType="fade" onRequestClose={() => setPreviewHtml(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#FFF', borderRadius: 14, width: '100%', maxWidth: 860, maxHeight: '92%', overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#1E1B4B' }}>Vista previa del email</Text>
              <TouchableOpacity onPress={() => setPreviewHtml(null)} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 14, color: '#64748B', fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <iframe srcDoc={previewHtml} style={{ width: '100%', height: 680, border: 'none', backgroundColor: '#F0F0F0' }} title="Vista previa email" sandbox="allow-same-origin allow-popups allow-downloads" />
          </View>
        </View>
      </Modal>
    )}
    </>
  );
}

// ─── Estilos ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  sheet:   { backgroundColor: '#FFFFFF', borderRadius: 16, maxHeight: '90%', width: '100%', maxWidth: 760 },

  header:      { flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1E1B4B' },
  headerSub:   { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  closeBtn:    { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  closeBtnText:{ fontSize: 14, color: '#64748B', fontWeight: '700' },

  label: { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.7 },

  // Barra de contexto (máquina + material)
  infoBar:       { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 16, paddingVertical: 12 },
  infoBarItem:   { flex: 1 },
  infoBarDivider:{ width: 1, backgroundColor: '#E2E8F0', marginVertical: 2, marginHorizontal: 16 },
  infoBarValue:  { fontSize: 14, fontWeight: '600', color: '#0F172A', marginTop: 3 },

  // Proveedor
  provRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  provList:     { gap: 6 },
  provCard:     { flex: 1, minWidth: 180, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 8, backgroundColor: '#F8FAFC' },
  provCardActive:{ backgroundColor: '#EEF2FF', borderColor: '#A5B4FC' },
  provRadio:    { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  provRadioActive:{ borderColor: '#4F46E5' },
  provRadioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4F46E5' },
  provName:     { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  provMeta:     { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  resellerBox:  { padding: 12, backgroundColor: '#F0FDF4', borderRadius: 8, borderWidth: 1.5, borderColor: '#BBF7D0' },
  resellerTitle:{ fontSize: 13, fontWeight: '700', color: '#166534' },
  resellerSub:  { fontSize: 11, color: '#16A34A', marginTop: 2 },

  // Tabla de separaciones
  tableHeaderBar:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, paddingVertical: 8 },
  tableRow:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#E2E8F0' },
  tableRowBorder:  { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  tableRowSelected:{ backgroundColor: '#FAFBFF' },
  tableCheckCell:  { width: 40, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  tableNameCell:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingRight: 8 },
  tableRadioCell:  { width: 110, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderLeftWidth: 1, borderLeftColor: '#F1F5F9' },
  tableColHeader:  { width: 110, alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6, borderLeftWidth: 1, borderLeftColor: '#E2E8F0' },
  tableColHeaderMarca: { fontSize: 13, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
  tableColHeaderRef:   { fontSize: 11, color: '#475569', textAlign: 'center', marginTop: 2 },
  tableColHeaderHint:  { fontSize: 9, color: '#A5B4FC', marginTop: 3, textAlign: 'center', letterSpacing: 0.3 },

  // Separación
  sepDot:  { width: 16, height: 16, borderRadius: 8, flexShrink: 0, borderWidth: 1 },
  sepName: { fontSize: 13, fontWeight: '600', color: '#0F172A' },
  sepMeta: { fontSize: 10, color: '#94A3B8', marginTop: 1 },

  // Radio button
  radio:      { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
  radioActive:{ borderColor: '#4F46E5' },
  radioDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4F46E5' },

  // Checkbox
  checkbox:        { width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
  checkboxSelected:{ backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  checkmark:       { fontSize: 10, color: '#FFF', fontWeight: '800' },

  // Fila inferior: fecha + notas
  bottomRow: { flexDirection: 'row', gap: 12 },
  input:     { backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 8, padding: 10, fontSize: 14, color: '#0F172A' },

  emptyBox:  { alignItems: 'center', paddingVertical: 16, backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  emptyText: { fontSize: 13, fontWeight: '600', color: '#64748B' },

  alertOk:  { backgroundColor: '#F0FDF4', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#BBF7D0' },
  alertErr: { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#FECACA' },
  alertText:{ fontSize: 13, color: '#0F172A' },

  footer:       { padding: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  footerHint:   { fontSize: 12, color: '#94A3B8', textAlign: 'center', marginBottom: 4 },
  cancelBtn:    { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#E2E8F0', alignItems: 'center' },
  cancelBtnText:{ fontSize: 14, fontWeight: '600', color: '#64748B' },
  previewBtn:   { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#C7D2FE', backgroundColor: '#EEF2FF', alignItems: 'center' },
  previewBtnText:{ fontSize: 13, fontWeight: '700', color: '#4F46E5' },
  sendBtn:      { flex: 2, backgroundColor: '#4F46E5', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  sendBtnText:  { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});

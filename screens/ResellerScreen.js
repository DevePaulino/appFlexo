import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, StyleSheet, RefreshControl, Modal,
} from 'react-native';
import DeleteConfirmRow from '../components/DeleteConfirmRow';

const API_BASE = 'http://localhost:8080';

function apiFetch(token) {
  const hdr = token ? { Authorization: `Bearer ${token}` } : {};
  return async (path, opts = {}) => {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...hdr, ...(opts.headers || {}) },
      ...opts,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json;
  };
}

function _humanBytes(b) {
  if (!b) return '0 B';
  if (b < 1024) return `${b} B`;
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(2)} MB`;
  return `${(b / 1024 ** 3).toFixed(3)} GB`;
}

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function ResellerScreen({ currentUser, onLogout }) {
  const api = apiFetch(currentUser?.access_token);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showNuevoCliente, setShowNuevoCliente] = useState(false);
  const [expandedCliente, setExpandedCliente] = useState(null);
  // facturacion: { empresaId, mode } — null = cerrado
  const [editFacturacion, setEditFacturacion] = useState(null);
  const [savingFacturacion, setSavingFacturacion] = useState(false);
  const [factMsg, setFactMsg] = useState(null);

  // Bloquear/desbloquear cliente
  const [confirmBloquear, setConfirmBloquear] = useState(null); // empresa_id
  const [toggling, setToggling] = useState(null); // empresa_id en proceso

  // Créditos y auto-recarga
  const [autoRecarga, setAutoRecarga] = useState(null);
  const [buyingPack, setBuyingPack] = useState(null);
  const [buyMsg, setBuyMsg] = useState(null);
  const [savingAR, setSavingAR] = useState(false);
  const [arMsg, setArMsg] = useState(null);

  useEffect(() => {
    api('/api/billing/auto-recarga').then(setAutoRecarga).catch(() => {});
  }, [currentUser?.access_token]);

  const buyPack = async (packId) => {
    setBuyingPack(packId); setBuyMsg(null);
    try {
      const res = await api('/api/billing/creditos/topup', { method: 'POST', body: JSON.stringify({ package_id: packId }) });
      setBuyMsg({ type: 'ok', text: `+${res.credits_added} créditos añadidos. Saldo: ${res.new_balance}` });
      load();
    } catch (e) { setBuyMsg({ type: 'error', text: e.message }); }
    setBuyingPack(null);
  };

  const saveAutoRecarga = async () => {
    if (!autoRecarga) return;
    setSavingAR(true); setArMsg(null);
    try {
      await api('/api/billing/auto-recarga', { method: 'PUT', body: JSON.stringify(autoRecarga) });
      setArMsg({ type: 'ok', text: 'Configuración guardada' });
    } catch (e) { setArMsg({ type: 'error', text: e.message }); }
    setSavingAR(false);
  };

  const saveFacturacion = async () => {
    if (!editFacturacion) return;
    setSavingFacturacion(true); setFactMsg(null);
    try {
      await api(`/api/revendedor/clientes/${editFacturacion.empresaId}/facturacion`, {
        method: 'PUT',
        body: JSON.stringify({ reseller_billing_mode: editFacturacion.mode }),
      });
      setFactMsg({ type: 'ok', text: 'Guardado' });
      setTimeout(() => { setEditFacturacion(null); setFactMsg(null); load(); }, 700);
    } catch (e) { setFactMsg({ type: 'error', text: e.message }); }
    setSavingFacturacion(false);
  };

  const toggleBloqueo = async (empresaId, estaBloqueado) => {
    setToggling(empresaId);
    const endpoint = estaBloqueado ? 'desbloquear' : 'bloquear';
    try {
      await api(`/api/revendedor/clientes/${empresaId}/${endpoint}`, { method: 'PUT' });
      load();
    } catch (e) { setError(e.message); }
    setToggling(null);
    setConfirmBloquear(null);
  };

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const d = await api('/api/revendedor/dashboard');
      setData(d);
    } catch (e) { setError(e.message); }
    if (isRefresh) setRefreshing(false); else setLoading(false);
  }, [currentUser?.access_token]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <View style={s.centered}>
      <ActivityIndicator size="large" color="#4F46E5" />
    </View>
  );

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>{data?.empresa_nombre || data?.nombre || 'Portal Revendedor'}</Text>
          <Text style={s.headerSub}>{currentUser?.email}</Text>
        </View>
        <TouchableOpacity style={s.logoutBtn} onPress={onLogout}>
          <Text style={s.logoutBtnText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
      >
        {error && <Text style={s.errorText}>{error}</Text>}

        {/* KPIs */}
        <View style={s.kpiRow}>
          <KpiCard label="Créditos disponibles" value={data?.creditos ?? 0} color="#4F46E5" big />
          <KpiCard label="Coste este mes" value={`${data?.coste_mes_actual_eur ?? 0} €`} color="#EF4444" big />
        </View>
        <View style={s.kpiRow}>
          <KpiCard label="Empresas cliente" value={data?.clientes?.length ?? 0} color="#0EA5E9" />
          <KpiCard label="Descuento aplicado" value={`${data?.discount_pct ?? 0}%`} color="#10B981" />
          <KpiCard label="Coste total acum." value={`${data?.coste_total_eur ?? 0} €`} color="#F59E0B" />
        </View>

        {/* Tarifas aplicables */}
        <View style={s.infoBox}>
          <Text style={s.infoBoxText}>
            Tarifas con tu descuento del {data?.discount_pct ?? 0}%{'  '}·{'  '}
            Pago por uso: {data?.precio_credito_eur ?? 0} €/crédito{'  '}·{'  '}
            Cuota mensual: {data?.suscripcion_eur ?? 0} €/mes
          </Text>
        </View>

        {/* Info descuento */}
        {(data?.discount_pct ?? 0) > 0 && (
          <View style={s.infoBox}>
            <Text style={s.infoBoxText}>
              Tienes un descuento del {data.discount_pct}% sobre las tarifas estándar.
              El consumo de todas tus empresas cliente se descuenta de tu saldo de créditos.
            </Text>
          </View>
        )}

        {/* ── Compra de créditos ── */}
        <Text style={s.sectionTitle}>Recargar créditos</Text>
        {buyMsg && (
          <View style={[s.alertBox, buyMsg.type === 'ok' ? s.alertOk : s.alertError, { marginBottom: 8 }]}>
            <Text style={s.alertText}>{buyMsg.text}</Text>
          </View>
        )}
        <View style={s.packsGrid}>
          {(autoRecarga?.packs || []).map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[s.packCard, buyingPack === p.id && { opacity: 0.6 }]}
              onPress={() => buyPack(p.id)}
              disabled={!!buyingPack}
            >
              {p.popular && <View style={s.packPopular}><Text style={s.packPopularText}>Popular</Text></View>}
              <Text style={s.packCredits}>{p.credits}</Text>
              <Text style={s.packLabel}>créditos</Text>
              <Text style={s.packPrice}>{p.price_eur} €</Text>
              {buyingPack === p.id
                ? <ActivityIndicator size="small" color="#4F46E5" style={{ marginTop: 6 }} />
                : <Text style={s.packBuy}>Comprar</Text>}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Auto-recarga ── */}
        {autoRecarga && (
          <>
            <Text style={[s.sectionTitle, { marginTop: 16 }]}>Auto-recarga</Text>
            <View style={s.card}>
              {/* Toggle */}
              <View style={[s.infoRow, { marginBottom: 4 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowPrimary}>Activar auto-recarga</Text>
                  <Text style={s.rowSecondary}>Recarga automática cuando los créditos bajan del umbral</Text>
                </View>
                <TouchableOpacity
                  style={[s.toggleBtn, autoRecarga.auto_recarga_enabled && s.toggleBtnOn]}
                  onPress={() => setAutoRecarga((ar) => ({ ...ar, auto_recarga_enabled: !ar.auto_recarga_enabled }))}
                >
                  <Text style={[s.toggleBtnText, autoRecarga.auto_recarga_enabled && { color: '#4F46E5' }]}>
                    {autoRecarga.auto_recarga_enabled ? 'ON' : 'OFF'}
                  </Text>
                </TouchableOpacity>
              </View>

              {autoRecarga.auto_recarga_enabled && (
                <>
                  {/* Umbral */}
                  <View style={s.formRow}>
                    <Text style={s.formLabel}>Umbral mínimo de créditos</Text>
                    <TextInput
                      style={s.formInput}
                      value={String(autoRecarga.auto_recarga_umbral ?? 20)}
                      onChangeText={(v) => setAutoRecarga((ar) => ({ ...ar, auto_recarga_umbral: parseInt(v) || 0 }))}
                      keyboardType="numeric"
                      placeholder="Ej: 20"
                      placeholderTextColor="#94A3B8"
                    />
                    <Text style={s.rowSecondary}>Se recargará automáticamente cuando el saldo baje de este número</Text>
                  </View>

                  {/* Pack a usar */}
                  <View style={s.formRow}>
                    <Text style={s.formLabel}>Pack a recargar automáticamente</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                      {(autoRecarga.packs || []).map((p) => (
                        <TouchableOpacity
                          key={p.id}
                          style={[s.packSelectBtn, autoRecarga.auto_recarga_pack === p.id && s.packSelectBtnActive]}
                          onPress={() => setAutoRecarga((ar) => ({ ...ar, auto_recarga_pack: p.id }))}
                        >
                          <Text style={[s.packSelectText, autoRecarga.auto_recarga_pack === p.id && { color: '#4F46E5' }]}>
                            {p.credits} créditos — {p.price_eur} €
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </>
              )}

              {arMsg && (
                <View style={[s.alertBox, arMsg.type === 'ok' ? s.alertOk : s.alertError, { marginBottom: 8 }]}>
                  <Text style={s.alertText}>{arMsg.text}</Text>
                </View>
              )}
              <TouchableOpacity
                style={[s.primaryBtn, savingAR && { opacity: 0.6 }]}
                onPress={saveAutoRecarga} disabled={savingAR}
              >
                {savingAR ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={s.primaryBtnText}>Guardar configuración</Text>}
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Clientes con detalle de facturación */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Empresas cliente ({data?.clientes?.length ?? 0})</Text>
          <TouchableOpacity style={s.addBtn} onPress={() => setShowNuevoCliente(true)}>
            <Text style={s.addBtnText}>+ Nuevo cliente</Text>
          </TouchableOpacity>
        </View>

        {(data?.clientes || []).length === 0 ? (
          <View style={s.card}>
            <View style={s.emptyState}>
              <Text style={s.emptyTitle}>Sin clientes aún</Text>
              <Text style={s.emptySub}>Añade tu primera empresa cliente para empezar.</Text>
              <TouchableOpacity style={[s.addBtn, { marginTop: 12 }]} onPress={() => setShowNuevoCliente(true)}>
                <Text style={s.addBtnText}>+ Añadir empresa cliente</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (data?.clientes || []).map((c) => (
          <View key={c.empresa_id} style={s.card}>

            {/* Cabecera cliente — pulsable */}
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
              onPress={() => setExpandedCliente(expandedCliente === c.empresa_id ? null : c.empresa_id)}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.rowPrimary} numberOfLines={1}>{c.empresa_nombre || c.nombre || '—'}</Text>
                <Text style={s.rowSecondary} numberOfLines={1}>{c.email}</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                  <View style={[s.modeBadge, c.reseller_billing_mode === 'cuota_mensual' ? s.modeBadgeSub : s.modeBadgePpu]}>
                    <Text style={s.modeBadgeText}>
                      {c.reseller_billing_mode === 'cuota_mensual' ? '📅 Cuota mensual' : '📊 Pago por uso'}
                    </Text>
                  </View>
                  {c.bloqueado && (
                    <View style={{ backgroundColor: '#FEE2E2', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: '#FECACA' }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#DC2626' }}>🔒 Bloqueado</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 2 }}>
                <Text style={s.consumoBadge}>{c.coste_acumulado_eur ?? 0} €</Text>
                <Text style={[s.rowSecondary, { fontSize: 10 }]}>
                  {c.reseller_billing_mode === 'cuota_mensual'
                    ? `${c.meses_activos ?? 1} mes(es)`
                    : `${c.consumo_creditos ?? 0} cr. usados`}
                </Text>
                <Text style={[s.rowSecondary, { fontSize: 10, color: '#EF4444' }]}>
                  este mes: {c.coste_mes_actual_eur ?? 0} €
                </Text>
              </View>
              <Text style={{ fontSize: 14, color: '#94A3B8', marginLeft: 4 }}>
                {expandedCliente === c.empresa_id ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {/* Bloquear/desbloquear */}
            {confirmBloquear === c.empresa_id ? (
              <View style={{ marginTop: 8 }}>
                <DeleteConfirmRow
                  message={c.bloqueado ? '¿Reactivar acceso de este cliente?' : '¿Bloquear acceso de este cliente?'}
                  confirmLabel={c.bloqueado ? 'Reactivar' : 'Bloquear'}
                  onCancel={() => setConfirmBloquear(null)}
                  onConfirm={() => toggleBloqueo(c.empresa_id, c.bloqueado)}
                />
              </View>
            ) : (
              <TouchableOpacity
                style={[s.editFactBtn, { marginTop: 8 }, c.bloqueado && { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}
                onPress={() => setConfirmBloquear(c.empresa_id)}
                disabled={toggling === c.empresa_id}
              >
                {toggling === c.empresa_id
                  ? <ActivityIndicator size="small" color="#64748B" />
                  : <Text style={[s.editFactBtnText, c.bloqueado && { color: '#DC2626' }]}>
                      {c.bloqueado ? '🔓 Reactivar cliente' : '🔒 Bloquear cliente'}
                    </Text>
                }
              </TouchableOpacity>
            )}

            {/* Detalle expandido */}
            {expandedCliente === c.empresa_id && (
              <View style={{ marginTop: 12 }}>

                {/* ── Modo de facturación ── */}
                {editFacturacion?.empresaId === c.empresa_id ? (
                  <View style={s.factBox}>
                    <Text style={s.txSectionLabel}>Modo de facturación</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                      {['pago_por_uso', 'cuota_mensual'].map((m) => (
                        <TouchableOpacity
                          key={m}
                          style={[s.modeBtn, editFacturacion.mode === m && s.modeBtnActive]}
                          onPress={() => setEditFacturacion((f) => ({ ...f, mode: m }))}
                        >
                          <Text style={[s.modeBtnText, editFacturacion.mode === m && s.modeBtnTextActive]}>
                            {m === 'cuota_mensual' ? '📅 Cuota mensual' : '📊 Pago por uso'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {editFacturacion.mode === 'cuota_mensual' && (
                      <View style={[s.alertBox, s.alertOk, { marginBottom: 8 }]}>
                        <Text style={[s.alertText, { color: '#166534' }]}>
                          Cuota fijada por el proveedor: {data?.suscripcion_eur ?? 0} €/mes
                          {(data?.discount_pct ?? 0) > 0 ? ` (${data.discount_pct}% dto. aplicado)` : ''}
                        </Text>
                      </View>
                    )}
                    {factMsg && (
                      <View style={[s.alertBox, factMsg.type === 'ok' ? s.alertOk : s.alertError]}>
                        <Text style={s.alertText}>{factMsg.text}</Text>
                      </View>
                    )}
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        style={[s.primaryBtn, { flex: 1 }, savingFacturacion && { opacity: 0.6 }]}
                        onPress={saveFacturacion} disabled={savingFacturacion}
                      >
                        {savingFacturacion
                          ? <ActivityIndicator size="small" color="#FFF" />
                          : <Text style={s.primaryBtnText}>Guardar</Text>}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[s.secondaryBtn, { flex: 1 }]}
                        onPress={() => { setEditFacturacion(null); setFactMsg(null); }}
                      >
                        <Text style={s.secondaryBtnText}>Cancelar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={s.editFactBtn}
                    onPress={() => setEditFacturacion({
                      empresaId: c.empresa_id,
                      mode: c.reseller_billing_mode || 'pago_por_uso',
                    })}
                  >
                    <Text style={s.editFactBtnText}>✎ Cambiar modo de facturación</Text>
                  </TouchableOpacity>
                )}

                {/* Resumen mensual */}
                <Text style={s.txSectionLabel}>Consumo por mes</Text>
                {(c.consumo_mensual || []).length === 0 ? (
                  <Text style={[s.rowSecondary, { marginBottom: 8 }]}>Sin datos mensuales</Text>
                ) : (
                  <View style={[s.card, { padding: 10, marginBottom: 10 }]}>
                    <View style={s.tblHead}>
                      <Text style={[s.tblCol, { flex: 2 }]}>Mes</Text>
                      <Text style={[s.tblCol, { flex: 1, textAlign: 'right' }]}>Créditos</Text>
                    </View>
                    {(c.consumo_mensual || []).map((m, i) => (
                      <View key={i} style={[s.tblRow, m.mes === new Date().toISOString().slice(0, 7) && { backgroundColor: '#FFFBEB' }]}>
                        <Text style={[s.rowPrimary, { flex: 2 }]}>
                          {m.mes === new Date().toISOString().slice(0, 7) ? `${m.mes} ← actual` : m.mes}
                        </Text>
                        <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: '#F59E0B', textAlign: 'right' }}>{m.total}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Transacciones recientes */}
                <Text style={s.txSectionLabel}>Últimas transacciones</Text>
                {(c.transacciones || []).length === 0 ? (
                  <Text style={s.rowSecondary}>Sin transacciones registradas</Text>
                ) : (
                  <>
                    <View style={s.tblHead}>
                      <Text style={[s.tblCol, { flex: 3 }]}>Concepto</Text>
                      <Text style={[s.tblCol, { flex: 2 }]}>Fecha</Text>
                      <Text style={[s.tblCol, { flex: 1, textAlign: 'right' }]}>Créd.</Text>
                    </View>
                    {(c.transacciones || []).map((tx, i) => (
                      <View key={i} style={s.tblRow}>
                        <Text style={[s.rowPrimary, { flex: 3 }]} numberOfLines={1}>{tx.concepto || tx.action || '—'}</Text>
                        <Text style={[s.rowSecondary, { flex: 2 }]}>{tx.created_at?.slice(0, 10) || '—'}</Text>
                        <Text style={[s.txAmount, { flex: 1, textAlign: 'right' }]}>
                          {(tx.amount ?? tx.cantidad ?? 0) < 0
                            ? (tx.amount ?? tx.cantidad)
                            : `+${tx.amount ?? tx.cantidad ?? 0}`}
                        </Text>
                      </View>
                    ))}
                    <View style={s.txTotal}>
                      <Text style={s.txTotalLabel}>Total acumulado</Text>
                      <Text style={s.txTotalValue}>{c.consumo_creditos ?? 0} créditos</Text>
                    </View>
                  </>
                )}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Modal nuevo cliente */}
      <NuevoClienteModal
        visible={showNuevoCliente}
        onClose={() => setShowNuevoCliente(false)}
        onCreated={() => { setShowNuevoCliente(false); load(); }}
        api={api}
      />
    </View>
  );
}

// ─── Modal: nuevo cliente ─────────────────────────────────────────────────────
function NuevoClienteModal({ visible, onClose, onCreated, api }) {
  const [form, setForm] = useState({ nombre: '', empresa_nombre: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const reset = () => { setForm({ nombre: '', empresa_nombre: '', email: '', password: '' }); setMsg(null); };

  const submit = async () => {
    if (!form.email.trim() || !form.password.trim()) {
      setMsg({ type: 'error', text: 'Email y contraseña son obligatorios' }); return;
    }
    setSaving(true); setMsg(null);
    try {
      await api('/api/revendedor/clientes', { method: 'POST', body: JSON.stringify(form) });
      setMsg({ type: 'ok', text: 'Cliente creado correctamente' });
      reset();
      setTimeout(onCreated, 800);
    } catch (e) { setMsg({ type: 'error', text: e.message }); }
    setSaving(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={s.modalBox}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Nueva empresa cliente</Text>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <Text style={s.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView>
            <FormField label="Nombre del contacto" value={form.nombre}
              onChange={(v) => setForm((f) => ({ ...f, nombre: v }))}
              placeholder="Ej: Juan García" />
            <FormField label="Nombre de la empresa" value={form.empresa_nombre}
              onChange={(v) => setForm((f) => ({ ...f, empresa_nombre: v }))}
              placeholder="Ej: Imprenta López S.L." />
            <FormField label="Email de acceso *" value={form.email}
              onChange={(v) => setForm((f) => ({ ...f, email: v }))}
              placeholder="cliente@empresa.com"
              keyboardType="email-address" autoCapitalize="none" />
            <FormField label="Contraseña inicial *" value={form.password}
              onChange={(v) => setForm((f) => ({ ...f, password: v }))}
              placeholder="Mín. 8 caracteres"
              secureTextEntry />

            {msg && (
              <View style={[s.alertBox, msg.type === 'ok' ? s.alertOk : s.alertError]}>
                <Text style={s.alertText}>{msg.text}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[s.primaryBtn, saving && { opacity: 0.6 }]}
              onPress={submit} disabled={saving}
            >
              {saving
                ? <ActivityIndicator size="small" color="#FFF" />
                : <Text style={s.primaryBtnText}>Crear empresa cliente</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────
function KpiCard({ label, value, color, big }) {
  return (
    <View style={[s.kpiCard, big && { flex: 2 }]}>
      <Text style={[s.kpiValue, { color }]}>{value ?? '—'}</Text>
      <Text style={s.kpiLabel}>{label}</Text>
    </View>
  );
}

function FormField({ label, value, onChange, ...rest }) {
  return (
    <View style={s.formRow}>
      <Text style={s.formLabel}>{label}</Text>
      <TextInput
        style={s.formInput}
        value={value}
        onChangeText={onChange}
        placeholderTextColor="#94A3B8"
        {...rest}
      />
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F8FAFC' },
  centered:       { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header:         { backgroundColor: '#1E1B4B', paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center' },
  headerTitle:    { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  headerSub:      { fontSize: 12, color: '#A5B4FC', marginTop: 2 },
  logoutBtn:      { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#A5B4FC' },
  logoutBtnText:  { fontSize: 13, fontWeight: '600', color: '#A5B4FC' },

  kpiRow:         { flexDirection: 'row', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
  kpiCard:        { flex: 1, minWidth: 120, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, alignItems: 'center' },
  kpiValue:       { fontSize: 24, fontWeight: '800' },
  kpiLabel:       { fontSize: 11, color: '#94A3B8', marginTop: 3, textAlign: 'center' },

  sectionHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitle:   { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8 },
  addBtn:         { backgroundColor: '#4F46E5', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText:     { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

  card:           { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 16, overflow: 'hidden' },
  tblHead:        { flexDirection: 'row', alignItems: 'center', paddingBottom: 7, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', marginBottom: 2 },
  tblCol:         { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.4 },
  tblRow:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  rowPrimary:     { fontSize: 12, fontWeight: '600', color: '#0F172A' },
  rowSecondary:   { fontSize: 11, color: '#94A3B8', marginTop: 1 },

  emptyState:     { alignItems: 'center', paddingVertical: 24 },
  emptyTitle:     { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  emptySub:       { fontSize: 13, color: '#94A3B8', textAlign: 'center' },

  consumoBadge:   { fontSize: 13, fontWeight: '700', color: '#F59E0B' },
  txSectionLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  txAmount:       { fontSize: 12, fontWeight: '700', color: '#EF4444' },
  txTotal:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  txTotalLabel:   { fontSize: 12, fontWeight: '600', color: '#64748B' },
  txTotalValue:   { fontSize: 14, fontWeight: '800', color: '#F59E0B' },

  packsGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 4 },
  packCard:         { flex: 1, minWidth: 100, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0', padding: 12, alignItems: 'center', position: 'relative' },
  packCredits:      { fontSize: 22, fontWeight: '800', color: '#4F46E5' },
  packLabel:        { fontSize: 11, color: '#94A3B8', marginBottom: 4 },
  packPrice:        { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  packBuy:          { marginTop: 6, fontSize: 11, fontWeight: '700', color: '#4F46E5', backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  packPopular:      { position: 'absolute', top: -1, right: -1, backgroundColor: '#4F46E5', borderTopRightRadius: 10, borderBottomLeftRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  packPopularText:  { fontSize: 9, fontWeight: '700', color: '#FFFFFF' },

  infoRow:          { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  toggleBtn:        { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#F1F5F9' },
  toggleBtnOn:      { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  toggleBtnText:    { fontSize: 13, fontWeight: '700', color: '#94A3B8' },

  packSelectBtn:    { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  packSelectBtnActive: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  packSelectText:   { fontSize: 12, fontWeight: '600', color: '#64748B' },

  modeBadge:        { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  modeBadgePpu:     { backgroundColor: '#EEF2FF' },
  modeBadgeSub:     { backgroundColor: '#F0FDF4' },
  modeBadgeText:    { fontSize: 10, fontWeight: '700', color: '#1E1B4B' },

  factBox:          { backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', padding: 12, marginBottom: 12 },
  modeBtn:          { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: '#E2E8F0', alignItems: 'center' },
  modeBtnActive:    { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  modeBtnText:      { fontSize: 12, fontWeight: '600', color: '#64748B' },
  modeBtnTextActive:{ color: '#4F46E5' },
  editFactBtn:      { backgroundColor: '#F1F5F9', borderRadius: 8, paddingVertical: 8, alignItems: 'center', marginBottom: 12 },
  editFactBtnText:  { fontSize: 12, fontWeight: '600', color: '#4F46E5' },
  secondaryBtn:     { borderRadius: 8, paddingVertical: 10, alignItems: 'center', borderWidth: 1.5, borderColor: '#E2E8F0' },
  secondaryBtnText: { fontSize: 14, fontWeight: '600', color: '#64748B' },

  infoBox:        { backgroundColor: '#EEF2FF', borderRadius: 10, borderWidth: 1, borderColor: '#C7D2FE', padding: 14, marginBottom: 16 },
  infoBoxText:    { fontSize: 13, color: '#4338CA', lineHeight: 19 },

  errorText:      { fontSize: 13, color: '#DC2626', textAlign: 'center', marginBottom: 12 },

  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalBox:       { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, width: '100%', maxWidth: 480, maxHeight: '90%' },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle:     { fontSize: 17, fontWeight: '800', color: '#1E1B4B' },
  modalClose:     { fontSize: 18, color: '#94A3B8', fontWeight: '700', padding: 4 },

  formRow:        { marginBottom: 14 },
  formLabel:      { fontSize: 11, fontWeight: '600', color: '#64748B', marginBottom: 4 },
  formInput:      { backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: '#0F172A' },

  primaryBtn:     { backgroundColor: '#4F46E5', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },

  alertBox:       { borderRadius: 8, padding: 10, marginBottom: 10 },
  alertOk:        { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0' },
  alertError:     { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  alertText:      { fontSize: 13, fontWeight: '600', color: '#0F172A' },
});

import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, StyleSheet, Platform, RefreshControl,
} from 'react-native';
import DeleteConfirmRow from '../components/DeleteConfirmRow';
const API_BASE = 'http://localhost:8080';

const TABS = [
  { key: 'monitor',     label: '📊 Monitorización' },
  { key: 'servidor',    label: '⚙️ Servidor' },
  { key: 'tarifas',     label: '💶 Tarifas' },
  { key: 'empresas',    label: '🏢 Empresas' },
  { key: 'revendedores',label: '🤝 Revendedores' },
  { key: 'promos',      label: '🎁 Promos' },
  { key: 'detalle',     label: '🔍 Detalle empresa' },
];

function makeApiFetch(token) {
  const authHdr = token ? { Authorization: `Bearer ${token}` } : {};
  return async function apiFetch(path, opts = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...authHdr, ...(opts.headers || {}) },
      ...opts,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
    return json;
  };
}

// ─────────────────────────────────────────────────────────────────
// Tab: Monitorización
// ─────────────────────────────────────────────────────────────────
const ESTADO_COLORS = {
  pendiente: '#F59E0B', en_proceso: '#3B82F6', finalizado: '#16A34A',
  cancelado: '#EF4444', aprobado: '#8B5CF6',
};

function TabMonitor({ currentUser }) {
  const apiFetch = makeApiFetch(currentUser?.access_token);
  const [status, setStatus]     = useState(null);
  const [empresas, setEmpresas] = useState([]);
  const [panel, setPanel]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [st, emp, pan] = await Promise.all([
        apiFetch('/api/superadmin/status'),
        apiFetch('/api/superadmin/empresas'),
        apiFetch('/api/superadmin/panel'),
      ]);
      setStatus(st);
      setEmpresas(emp.empresas || []);
      setPanel(pan);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color="#4F46E5" />;
  if (error)   return <Text style={s.errorText}>{error}</Text>;

  const totalPedidos  = empresas.reduce((a, e) => a + e.num_pedidos, 0);
  const totalUsuarios = empresas.reduce((a, e) => a + e.num_usuarios, 0);
  const totalBytes    = empresas.reduce((a, e) => a + e.storage_bytes, 0);
  const totalCreditos = empresas.reduce((a, e) => a + (e.creditos || 0), 0);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>

      {/* ── KPIs globales ── */}
      <View style={s.statsRow}>
        <StatCard label="Empresas"       value={empresas.length}        color="#4F46E5" />
        <StatCard label="Usuarios"       value={totalUsuarios}          color="#0EA5E9" />
        <StatCard label="Pedidos"        value={totalPedidos}           color="#10B981" />
        <StatCard label="Créditos tot."  value={totalCreditos}          color="#F59E0B" />
      </View>
      <View style={[s.statsRow, { marginTop: 0 }]}>
        <StatCard label="Almacenamiento" value={_humanBytes(totalBytes)} color="#8B5CF6" wide />
        <StatCard label="Uptime servidor" value={status?.uptime || '–'} color="#64748B" wide />
        <StatCard label="Mem. servidor"  value={status?.mem_mb ? `${status.mem_mb} MB` : '–'} color="#475569" wide />
      </View>

      {/* ── Layout 2 columnas ── */}
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>

        {/* Columna izq: tabla empresas */}
        <View style={{ flex: 1, minWidth: 260 }}>
          <Text style={s.sectionTitle}>Empresas ({empresas.length})</Text>
          <View style={s.card}>
            <View style={s.tblHead}>
              <Text style={[s.tblCol, { flex: 3 }]}>Empresa</Text>
              <Text style={[s.tblCol, { flex: 1, textAlign: 'right' }]}>Ped</Text>
              <Text style={[s.tblCol, { flex: 1, textAlign: 'right' }]}>Cred</Text>
              <Text style={[s.tblCol, { flex: 2, textAlign: 'right' }]}>Storage</Text>
            </View>
            {empresas.map((e) => (
              <View key={e.empresa_id} style={s.tblRow}>
                <View style={{ flex: 3, minWidth: 0 }}>
                  <Text style={s.rowPrimary} numberOfLines={1}>{e.admin_email || e.empresa_id}</Text>
                  <View style={[s.planBadge, e.billing_model === 'suscripcion' ? s.planSub : s.planCred, { alignSelf: 'flex-start', marginTop: 2 }]}>
                    <Text style={[s.planBadgeText, { fontSize: 9 }]}>{e.billing_model || 'creditos'}</Text>
                  </View>
                </View>
                <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: '#4F46E5', textAlign: 'right' }}>{e.num_pedidos}</Text>
                <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: '#F59E0B', textAlign: 'right' }}>{e.creditos || 0}</Text>
                <Text style={{ flex: 2, fontSize: 11, color: '#8B5CF6', textAlign: 'right' }}>{e.storage_human}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Columna dcha: panel de actividad */}
        <View style={{ flex: 1, minWidth: 260 }}>

          <Text style={s.sectionTitle}>Alertas</Text>
          <View style={s.card}>
            {(panel?.alertas || []).length === 0 ? (
              <Text style={[s.rowPrimary, { color: '#16A34A' }]}>Sin alertas activas</Text>
            ) : (panel?.alertas || []).map((a, i) => (
              <View key={i} style={s.panelRow}>
                <View style={[s.iconBox, { backgroundColor: a.tipo === 'creditos_bajos' ? '#FEF9C3' : '#FEE2E2' }]}>
                  <Text style={{ fontSize: 13 }}>{a.tipo === 'creditos_bajos' ? '💰' : '💾'}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.rowPrimary} numberOfLines={1}>{a.email}</Text>
                  <Text style={[s.rowSecondary, { color: a.tipo === 'creditos_bajos' ? '#B45309' : '#DC2626' }]}>
                    {a.tipo === 'creditos_bajos' ? `Créditos: ${a.valor}` : `Storage: ${a.valor}`}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={s.sectionTitle}>Últimos accesos</Text>
          <View style={s.card}>
            {(panel?.logins || []).length === 0
              ? <Text style={s.emptyText}>Sin registros</Text>
              : (panel?.logins || []).map((l, i) => (
              <View key={i} style={s.panelRow}>
                <View style={[s.iconBox, { backgroundColor: '#EEF2FF' }]}>
                  <Text style={{ fontSize: 13 }}>🔐</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.rowPrimary} numberOfLines={1}>{l.email}</Text>
                  <Text style={s.rowSecondary}>{l.ts?.slice(0, 16).replace('T', ' ')} · {l.ip}</Text>
                </View>
                <View style={[s.planBadge, s.planCred]}>
                  <Text style={[s.planBadgeText, { fontSize: 9 }]}>{l.rol}</Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={s.sectionTitle}>Nuevas empresas</Text>
          <View style={s.card}>
            {(panel?.registros || []).length === 0
              ? <Text style={s.emptyText}>Sin registros</Text>
              : (panel?.registros || []).map((r, i) => (
              <View key={i} style={s.panelRow}>
                <View style={[s.iconBox, { backgroundColor: '#F0FDF4' }]}>
                  <Text style={{ fontSize: 13 }}>🏢</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.rowPrimary} numberOfLines={1}>{r.email}</Text>
                  <Text style={s.rowSecondary}>{r.created_at?.slice(0, 10)}</Text>
                </View>
                <View style={[s.planBadge, r.billing_model === 'suscripcion' ? s.planSub : s.planCred]}>
                  <Text style={[s.planBadgeText, { fontSize: 9 }]}>{r.billing_model}</Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={s.sectionTitle}>Transacciones recientes</Text>
          <View style={s.card}>
            {(panel?.transacciones || []).length === 0
              ? <Text style={s.emptyText}>Sin transacciones</Text>
              : (panel?.transacciones || []).map((tx, i) => (
              <View key={i} style={s.panelRow}>
                <View style={[s.iconBox, { backgroundColor: '#FEF9C3' }]}>
                  <Text style={{ fontSize: 13 }}>💳</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.rowPrimary}>{tx.concepto}</Text>
                  <Text style={s.rowSecondary} numberOfLines={1}>{tx.email} · {tx.created_at?.slice(0, 10)}</Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: '800', color: (tx.cantidad || 0) >= 0 ? '#16A34A' : '#EF4444' }}>
                  {(tx.cantidad || 0) >= 0 ? '+' : ''}{tx.cantidad}
                </Text>
              </View>
            ))}
          </View>

        </View>

      </View>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Tab: Servidor
// ─────────────────────────────────────────────────────────────────
function TabServidor({ currentUser }) {
  const apiFetch = makeApiFetch(currentUser?.access_token);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restarting, setRestarting] = useState(false);
  const [confirmingRestart, setConfirmingRestart] = useState(false);
  const [msg, setMsg] = useState(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try { setStatus(await apiFetch('/api/superadmin/status')); }
    catch (e) { setMsg({ type: 'error', text: e.message }); }
    setLoading(false);
  }, [currentUser?.access_token]);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const handleRestart = async () => {
    setRestarting(true); setConfirmingRestart(false); setMsg(null);
    try {
      await apiFetch('/api/superadmin/restart', { method: 'POST' });
    } catch (_) { /* la conexión se corta al reiniciar — es normal */ }
    setMsg({ type: 'ok', text: 'Reiniciando… esperando respuesta del servidor' });
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      try {
        await apiFetch('/api/superadmin/status');
        clearInterval(poll);
        setMsg({ type: 'ok', text: '✓ Servidor online' });
        setRestarting(false);
        loadStatus();
      } catch (_) {
        if (attempts >= 30) {
          clearInterval(poll);
          setMsg({ type: 'error', text: 'El servidor no respondió tras 30 intentos' });
          setRestarting(false);
        }
      }
    }, 1000);
  };

  const [cuentaForm, setCuentaForm] = useState({ email: '', password: '', password2: '' });
  const [savingCuenta, setSavingCuenta] = useState(false);
  const [msgCuenta, setMsgCuenta] = useState(null);

  const saveCuenta = async () => {
    if (cuentaForm.password && cuentaForm.password !== cuentaForm.password2) {
      setMsgCuenta({ type: 'error', text: 'Las contraseñas no coinciden' }); return;
    }
    setSavingCuenta(true); setMsgCuenta(null);
    try {
      const payload = {};
      if (cuentaForm.email.trim())    payload.email    = cuentaForm.email.trim();
      if (cuentaForm.password.trim()) payload.password = cuentaForm.password.trim();
      await apiFetch('/api/superadmin/cuenta', { method: 'PUT', body: JSON.stringify(payload) });
      setMsgCuenta({ type: 'ok', text: 'Datos actualizados. Vuelve a iniciar sesión si cambiaste el email.' });
      setCuentaForm({ email: '', password: '', password2: '' });
    } catch (e) { setMsgCuenta({ type: 'error', text: e.message }); }
    setSavingCuenta(false);
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>

        {/* Columna izquierda: estado + acciones */}
        <View style={{ flex: 1, minWidth: 220 }}>
          <Text style={s.sectionTitle}>Estado del servidor</Text>
          {loading ? <ActivityIndicator color="#4F46E5" /> : (
            <View style={s.card}>
              <View style={s.statsRow}>
                <StatCard label="Uptime"  value={status?.uptime || '–'}                    color="#16A34A" wide />
                <StatCard label="Memoria" value={status?.mem_mb ? `${status.mem_mb} MB` : '–'} color="#0EA5E9" wide />
              </View>
              <InfoRow label="PID"    value={status?.pid} />
              <InfoRow label="Python" value={status?.python_version?.split(' ')[0]} />
            </View>
          )}
          {msg && (
            <View style={[s.alertBox, msg.type === 'ok' ? s.alertOk : s.alertError, { marginTop: 8 }]}>
              <Text style={s.alertText}>{msg.text}</Text>
            </View>
          )}
          <TouchableOpacity style={[s.refreshBtn, { marginTop: 10 }]} onPress={loadStatus}>
            <Text style={s.refreshBtnText}>↻ Actualizar estado</Text>
          </TouchableOpacity>

          <Text style={[s.sectionTitle, { marginTop: 20 }]}>Acciones</Text>
          {confirmingRestart ? (
            <View style={s.confirmRow}>
              <Text style={s.confirmText}>¿Reiniciar el servidor? La app tardará unos segundos en volver.</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TouchableOpacity style={s.confirmBtnCancel} onPress={() => setConfirmingRestart(false)}>
                  <Text style={s.confirmBtnCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.dangerBtn, { flex: 1, marginTop: 0 }]} onPress={handleRestart} disabled={restarting}>
                  {restarting ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={s.dangerBtnText}>Sí, reiniciar</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={s.dangerBtn} onPress={() => setConfirmingRestart(true)}>
              <Text style={s.dangerBtnText}>⟳ Reiniciar servidor</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Columna derecha: mi cuenta */}
        <View style={{ flex: 1, minWidth: 220 }}>
          <Text style={s.sectionTitle}>Mi cuenta (root)</Text>
          <View style={s.card}>
            <View style={s.formRow}>
              <Text style={s.formLabel}>Nuevo email</Text>
              <TextInput style={s.formInput} value={cuentaForm.email}
                onChangeText={(v) => setCuentaForm((f) => ({ ...f, email: v }))}
                placeholder="nuevo@email.com" placeholderTextColor="#94A3B8"
                keyboardType="email-address" autoCapitalize="none" />
            </View>
            <View style={s.formRow}>
              <Text style={s.formLabel}>Nueva contraseña</Text>
              <TextInput style={s.formInput} value={cuentaForm.password}
                onChangeText={(v) => setCuentaForm((f) => ({ ...f, password: v }))}
                placeholder="mín. 8 caracteres" placeholderTextColor="#94A3B8" secureTextEntry />
            </View>
            <View style={s.formRow}>
              <Text style={s.formLabel}>Repetir contraseña</Text>
              <TextInput style={s.formInput} value={cuentaForm.password2}
                onChangeText={(v) => setCuentaForm((f) => ({ ...f, password2: v }))}
                placeholder="repite la contraseña" placeholderTextColor="#94A3B8" secureTextEntry />
            </View>
            {msgCuenta && (
              <View style={[s.alertBox, msgCuenta.type === 'ok' ? s.alertOk : s.alertError]}>
                <Text style={s.alertText}>{msgCuenta.text}</Text>
              </View>
            )}
            <TouchableOpacity style={[s.primaryBtn, savingCuenta && { opacity: 0.6 }]} onPress={saveCuenta} disabled={savingCuenta}>
              {savingCuenta ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={s.primaryBtnText}>Guardar cambios</Text>}
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Tab: Tarifas
// ─────────────────────────────────────────────────────────────────
function TabTarifas({ currentUser }) {
  const apiFetch = makeApiFetch(currentUser?.access_token);
  const [cfg, setCfg]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState(null);
  const [form, setForm]       = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/superadmin/tarifas');
      setCfg(data);
      setForm({
        storage_cost_eur_per_gb: String(data.storage_cost_eur_per_gb ?? ''),
        suscripcion_mensual_eur: String(data.suscripcion_mensual_eur ?? ''),
        credito_price_eur:       String(data.credito_price_eur ?? ''),
        packs: data.packs ? data.packs.map(p => ({ ...p })) : [],
      });
    } catch (e) { setMsg({ type: 'error', text: e.message }); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      const payload = {
        storage_cost_eur_per_gb: parseFloat(form.storage_cost_eur_per_gb),
        suscripcion_mensual_eur: parseFloat(form.suscripcion_mensual_eur),
        credito_price_eur:       parseFloat(form.credito_price_eur),
        packs: form.packs,
      };
      const res = await apiFetch('/api/superadmin/tarifas', { method: 'PUT', body: JSON.stringify(payload) });
      setCfg(res.config);
      setMsg({ type: 'ok', text: 'Tarifas guardadas' });
    } catch (e) { setMsg({ type: 'error', text: e.message }); }
    setSaving(false);
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color="#4F46E5" />;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      {msg && (
        <View style={[s.alertBox, msg.type === 'ok' ? s.alertOk : s.alertError, { marginBottom: 12 }]}>
          <Text style={s.alertText}>{msg.text}</Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>

        {/* Columna izquierda: tarifas base */}
        <View style={{ flex: 1, minWidth: 220 }}>
          <Text style={s.sectionTitle}>Tarifas base</Text>
          <View style={s.card}>
            <TarifaField label="Almacenamiento (€/GB/mes)" field="storage_cost_eur_per_gb" form={form} setForm={setForm} />
            <TarifaField label="Suscripción mensual (€)"   field="suscripcion_mensual_eur"  form={form} setForm={setForm} />
            <TarifaField label="Precio por crédito (€)"    field="credito_price_eur"         form={form} setForm={setForm} />
          </View>
          <TouchableOpacity style={[s.primaryBtn, { marginTop: 4 }, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={s.primaryBtnText}>Guardar tarifas</Text>}
          </TouchableOpacity>
        </View>

        {/* Columna derecha: packs */}
        <View style={{ flex: 1, minWidth: 220 }}>
          <Text style={s.sectionTitle}>Packs de créditos</Text>
          <View style={s.card}>
            {/* cabecera */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
              <Text style={[s.formLabel, { flex: 2 }]}>Etiqueta</Text>
              <Text style={[s.formLabel, { flex: 1, textAlign: 'center' }]}>Créditos</Text>
              <Text style={[s.formLabel, { width: 64, textAlign: 'center' }]}>Precio €</Text>
            </View>
            {(form.packs || cfg?.packs || []).map((p, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <TextInput style={[s.formInput, { flex: 2, marginBottom: 0 }]}
                  value={p.label} placeholder="Etiqueta" placeholderTextColor="#94A3B8"
                  onChangeText={(v) => setForm((f) => { const packs = [...(f.packs || [])]; packs[i] = { ...packs[i], label: v }; return { ...f, packs }; })} />
                <TextInput style={[s.formInput, { flex: 1, marginBottom: 0, textAlign: 'center' }]}
                  value={String(p.credits)} keyboardType="numeric" placeholder="0" placeholderTextColor="#94A3B8"
                  onChangeText={(v) => setForm((f) => { const packs = [...(f.packs || [])]; packs[i] = { ...packs[i], credits: parseInt(v) || 0 }; return { ...f, packs }; })} />
                <TextInput style={[s.formInput, { width: 64, marginBottom: 0, textAlign: 'center' }]}
                  value={String(p.price_eur)} keyboardType="decimal-pad" placeholder="€" placeholderTextColor="#94A3B8"
                  onChangeText={(v) => setForm((f) => { const packs = [...(f.packs || [])]; packs[i] = { ...packs[i], price_eur: parseFloat(v) || 0 }; return { ...f, packs }; })} />
              </View>
            ))}
          </View>
          <TouchableOpacity style={[s.primaryBtn, { marginTop: 4 }, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={s.primaryBtnText}>Guardar packs</Text>}
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
  );
}

function TarifaField({ label, field, form, setForm }) {
  return (
    <View style={s.formRow}>
      <Text style={s.formLabel}>{label}</Text>
      <TextInput
        style={s.formInput}
        value={form[field] ?? ''}
        onChangeText={(v) => setForm((f) => ({ ...f, [field]: v }))}
        keyboardType="decimal-pad"
        placeholderTextColor="#94A3B8"
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Tab: Empresas
// ─────────────────────────────────────────────────────────────────
function TabEmpresas({ currentUser }) {
  const apiFetch = makeApiFetch(currentUser?.access_token);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [ajuste, setAjuste]     = useState({});
  const [msg, setMsg]           = useState({});
  const [saving, setSaving]     = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await apiFetch('/api/superadmin/empresas');
      setEmpresas(data.empresas || []);
    } catch (e) { /* ignore */ }
    if (isRefresh) setRefreshing(false); else setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const ajustarCreditos = async (eid) => {
    const cantidad = parseInt(ajuste[eid] || '0');
    if (!cantidad) return;
    setSaving(eid); setMsg((m) => ({ ...m, [eid]: null }));
    try {
      const res = await apiFetch(`/api/superadmin/empresas/${eid}/creditos`, {
        method: 'POST', body: JSON.stringify({ cantidad }),
      });
      setMsg((m) => ({ ...m, [eid]: { type: 'ok', text: `Créditos nuevos: ${res.creditos_nuevos}` } }));
      setAjuste((a) => ({ ...a, [eid]: '' }));
      load();
    } catch (e) { setMsg((m) => ({ ...m, [eid]: { type: 'error', text: e.message } })); }
    setSaving(null);
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color="#4F46E5" />;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
    >
      <Text style={s.sectionTitle}>Empresas registradas ({empresas.length})</Text>
      <View style={s.card}>
        <View style={s.tblHead}>
          <Text style={[s.tblCol, { flex: 3 }]}>Empresa / Email</Text>
          <Text style={[s.tblCol, { flex: 1, textAlign: 'center' }]}>Usr</Text>
          <Text style={[s.tblCol, { flex: 1, textAlign: 'center' }]}>Ped</Text>
          <Text style={[s.tblCol, { flex: 1, textAlign: 'center' }]}>Cred</Text>
          <Text style={[s.tblCol, { flex: 2, textAlign: 'right' }]}>Storage</Text>
          <Text style={[s.tblCol, { flex: 2, textAlign: 'center' }]}>Ajuste ±</Text>
        </View>
        {empresas.map((emp) => (
          <View key={emp.empresa_id}>
            <View style={s.tblRow}>
              <View style={{ flex: 3, minWidth: 0 }}>
                <Text style={s.rowPrimary} numberOfLines={1}>{emp.admin_email || emp.empresa_id}</Text>
                <View style={[s.planBadge, emp.billing_model === 'suscripcion' ? s.planSub : s.planCred, { alignSelf: 'flex-start', marginTop: 2 }]}>
                  <Text style={[s.planBadgeText, { fontSize: 9 }]}>{emp.billing_model || 'creditos'}</Text>
                </View>
              </View>
              <Text style={{ flex: 1, fontSize: 12, color: '#0EA5E9', fontWeight: '700', textAlign: 'center' }}>{emp.num_usuarios}</Text>
              <Text style={{ flex: 1, fontSize: 12, color: '#4F46E5', fontWeight: '700', textAlign: 'center' }}>{emp.num_pedidos}</Text>
              <Text style={{ flex: 1, fontSize: 12, color: '#F59E0B', fontWeight: '700', textAlign: 'center' }}>{emp.creditos || 0}</Text>
              <Text style={{ flex: 2, fontSize: 11, color: '#8B5CF6', textAlign: 'right' }} numberOfLines={1}>{emp.storage_human}</Text>
              <View style={{ flex: 2, flexDirection: 'row', gap: 4, paddingLeft: 6 }}>
                <TextInput
                  style={[s.formInput, { flex: 1, marginBottom: 0, paddingVertical: 4, paddingHorizontal: 6, fontSize: 12, textAlign: 'center' }]}
                  placeholder="±"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numbers-and-punctuation"
                  value={ajuste[emp.empresa_id] || ''}
                  onChangeText={(v) => setAjuste((a) => ({ ...a, [emp.empresa_id]: v }))}
                />
                <TouchableOpacity
                  style={[s.primaryBtn, { paddingHorizontal: 8, paddingVertical: 4, marginBottom: 0 }, saving === emp.empresa_id && { opacity: 0.6 }]}
                  onPress={() => ajustarCreditos(emp.empresa_id)}
                  disabled={saving === emp.empresa_id}
                >
                  {saving === emp.empresa_id
                    ? <ActivityIndicator size="small" color="#FFF" />
                    : <Text style={[s.primaryBtnText, { fontSize: 11 }]}>OK</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
            {msg[emp.empresa_id] && (
              <Text style={{ fontSize: 11, paddingVertical: 3, paddingLeft: 4, color: msg[emp.empresa_id].type === 'ok' ? '#16A34A' : '#DC2626' }}>
                {msg[emp.empresa_id].text}
              </Text>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Tab: Códigos Promocionales
// ─────────────────────────────────────────────────────────────────
function TabPromos({ currentUser }) {
  const apiFetch = makeApiFetch(currentUser?.access_token);
  const [promos, setPromos]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [creating, setCreating] = useState(false);
  const [msg, setMsg]           = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(null); // code string
  const [form, setForm]         = useState({ credits: '50', prefix: 'PROMO', max_uses: '1', expires_at: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try { setPromos((await apiFetch('/api/superadmin/promos')).promos || []); }
    catch (e) { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!form.credits || parseInt(form.credits) <= 0) {
      setMsg({ type: 'error', text: 'Indica créditos > 0' }); return;
    }
    setCreating(true); setMsg(null);
    try {
      const payload = {
        credits:   parseInt(form.credits),
        prefix:    form.prefix || 'PROMO',
        max_uses:  parseInt(form.max_uses) || 1,
        expires_at: form.expires_at || null,
      };
      const res = await apiFetch('/api/superadmin/promos', { method: 'POST', body: JSON.stringify(payload) });
      setMsg({ type: 'ok', text: `Código creado: ${res.promo.code}` });
      load();
    } catch (e) { setMsg({ type: 'error', text: e.message }); }
    setCreating(false);
  };

  const toggle = async (code) => {
    try {
      await apiFetch(`/api/superadmin/promos/${code}/toggle`, { method: 'POST' });
      load();
    } catch (e) { setMsg({ type: 'error', text: e.message }); }
  };

  const remove = async (code) => {
    try {
      await apiFetch(`/api/superadmin/promos/${code}`, { method: 'DELETE' });
      setConfirmingDelete(null);
      load();
    } catch (e) { setMsg({ type: 'error', text: e.message }); }
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>

        {/* Columna izquierda: formulario creación */}
        <View style={{ flex: 1, minWidth: 220 }}>
          <Text style={s.sectionTitle}>Nuevo código</Text>
          <View style={s.card}>
            <View style={s.formRow}>
              <Text style={s.formLabel}>Prefijo</Text>
              <TextInput style={s.formInput} value={form.prefix} onChangeText={(v) => setForm((f) => ({ ...f, prefix: v }))} placeholderTextColor="#94A3B8" />
            </View>
            <View style={s.formRow}>
              <Text style={s.formLabel}>Créditos</Text>
              <TextInput style={s.formInput} value={form.credits} onChangeText={(v) => setForm((f) => ({ ...f, credits: v }))} keyboardType="numeric" placeholderTextColor="#94A3B8" />
            </View>
            <View style={s.formRow}>
              <Text style={s.formLabel}>Usos máximos</Text>
              <TextInput style={s.formInput} value={form.max_uses} onChangeText={(v) => setForm((f) => ({ ...f, max_uses: v }))} keyboardType="numeric" placeholderTextColor="#94A3B8" />
            </View>
            {Platform.OS === 'web' && (
              <View style={s.formRow}>
                <Text style={s.formLabel}>Caduca (opcional)</Text>
                <input type="date"
                  style={{ height: 38, borderRadius: 8, border: '1.5px solid #E2E8F0', backgroundColor: '#F8FAFC', padding: '0 10px', fontSize: 13, color: '#0F172A', width: '100%' }}
                  value={form.expires_at?.slice(0, 10) || ''}
                  onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value ? `${e.target.value}T23:59:59Z` : '' }))}
                />
              </View>
            )}
            {msg && (
              <View style={[s.alertBox, msg.type === 'ok' ? s.alertOk : s.alertError, { marginBottom: 8 }]}>
                <Text style={s.alertText}>{msg.text}</Text>
              </View>
            )}
            <TouchableOpacity style={[s.primaryBtn, creating && { opacity: 0.6 }]} onPress={create} disabled={creating}>
              {creating ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={s.primaryBtnText}>+ Generar código</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* Columna derecha: lista de códigos */}
        <View style={{ flex: 2, minWidth: 280 }}>
          <Text style={s.sectionTitle}>Códigos existentes ({promos.length})</Text>
          {loading ? <ActivityIndicator color="#4F46E5" /> : promos.length === 0 ? (
            <Text style={s.emptyText}>Sin códigos aún</Text>
          ) : (
            <View style={s.card}>
              <View style={s.tblHead}>
                <Text style={[s.tblCol, { flex: 3 }]}>Código</Text>
                <Text style={[s.tblCol, { flex: 1, textAlign: 'center' }]}>Cred</Text>
                <Text style={[s.tblCol, { flex: 1, textAlign: 'center' }]}>Usos</Text>
                <Text style={[s.tblCol, { flex: 2, textAlign: 'center' }]}>Caduca</Text>
                <Text style={[s.tblCol, { flex: 2, textAlign: 'center' }]}>Acciones</Text>
              </View>
              {promos.map((p) => (
                <View key={p.code}>
                  <View style={s.tblRow}>
                    <View style={{ flex: 3, minWidth: 0 }}>
                      <Text style={[s.promoCode, { fontSize: 13 }]} numberOfLines={1}>{p.code}</Text>
                    </View>
                    <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: '#F59E0B', textAlign: 'center' }}>{p.credits}</Text>
                    <Text style={{ flex: 1, fontSize: 12, color: '#64748B', textAlign: 'center' }}>{p.uses}/{p.max_uses}</Text>
                    <Text style={{ flex: 2, fontSize: 11, color: '#94A3B8', textAlign: 'center' }} numberOfLines={1}>
                      {p.expires_at ? p.expires_at.slice(0, 10) : '∞'}
                    </Text>
                    <View style={{ flex: 2, flexDirection: 'row', gap: 4, justifyContent: 'center' }}>
                      <TouchableOpacity style={[s.smallBtn, p.active ? s.smallBtnOk : s.smallBtnGray]} onPress={() => toggle(p.code)}>
                        <Text style={s.smallBtnText}>{p.active ? '✓' : '✗'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[s.smallBtn, s.smallBtnDanger]} onPress={() => setConfirmingDelete(p.code)}>
                        <Text style={s.smallBtnText}>🗑</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {confirmingDelete === p.code && (
                    <View style={s.confirmRow}>
                      <Text style={s.confirmText}>¿Eliminar el código {p.code}?</Text>
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                        <TouchableOpacity style={s.confirmBtnCancel} onPress={() => setConfirmingDelete(null)}>
                          <Text style={s.confirmBtnCancelText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.dangerBtn, { flex: 1, marginTop: 0 }]} onPress={() => remove(p.code)}>
                          <Text style={s.dangerBtnText}>Eliminar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

      </View>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Tab: Detalle empresa
// ─────────────────────────────────────────────────────────────────
function TabDetalle({ currentUser }) {
  const apiFetch = makeApiFetch(currentUser?.access_token);
  const [empresas, setEmpresas] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null); // empresa_id string
  const [detalle, setDetalle] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch('/api/superadmin/empresas')
      .then((d) => setEmpresas(d.empresas || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoadingList(false));
  }, []);

  const selectEmpresa = async (eid) => {
    setSelected(eid);
    setDetalle(null);
    setError(null);
    setLoadingDetalle(true);
    try {
      const d = await apiFetch(`/api/superadmin/empresas/${eid}/detalle`);
      setDetalle(d);
    } catch (e) { setError(e.message); }
    setLoadingDetalle(false);
  };

  const filtered = search.trim()
    ? empresas.filter((e) => (e.admin_email || '').toLowerCase().includes(search.trim().toLowerCase()))
    : empresas;


  return (
    <View style={{ flex: 1 }}>
      {/* Selector de empresa */}
      <View style={{ backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', padding: 12, zIndex: 10 }}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TextInput
            style={[s.formInput, { flex: 1, marginBottom: 0 }]}
            placeholder="Buscar por email del administrador…"
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={(v) => { setSearch(v); setSelected(null); setDetalle(null); }}
          />
          {!!(selected || search.trim()) && (
            <TouchableOpacity
              style={{ padding: 8, borderRadius: 8, backgroundColor: '#F1F5F9' }}
              onPress={() => { setSearch(''); setSelected(null); setDetalle(null); setError(null); }}
            >
              <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        {!selected && (
          <View style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, marginTop: 4, maxHeight: 240, overflow: 'hidden' }}>
            {loadingList ? (
              <ActivityIndicator style={{ padding: 12 }} color="#4F46E5" />
            ) : filtered.length === 0 ? (
              <Text style={{ padding: 12, fontSize: 13, color: '#94A3B8' }}>Sin resultados</Text>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled">
                {filtered.map((e) => (
                  <TouchableOpacity
                    key={e.empresa_id}
                    style={{ paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}
                    onPress={() => { selectEmpresa(e.empresa_id); setSearch(e.admin_email || e.empresa_id); }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#0F172A' }}>
                      {e.admin_email || '(sin email)'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}
      </View>

      {/* Detalle */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {error && <Text style={s.errorText}>{error}</Text>}
        {loadingDetalle && <ActivityIndicator style={{ marginTop: 40 }} color="#4F46E5" />}

        {!selected && !loadingDetalle && !error && (
          <Text style={s.emptyText}>Selecciona una empresa para ver su detalle</Text>
        )}

        {detalle && !loadingDetalle && (() => {
          const cr = detalle.creditos || {};
          const st = detalle.storage || {};
          return (
            <>
              {/* ── Header empresa ── */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 17, fontWeight: '800', color: '#1E1B4B' }}>{detalle.admin_email || selected}</Text>
                  <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>ID: {selected}</Text>
                </View>
                <View style={[s.planBadge, detalle.billing_model === 'suscripcion' ? s.planSub : s.planCred]}>
                  <Text style={s.planBadgeText}>{detalle.billing_model}</Text>
                </View>
              </View>

              {/* ── Fila KPIs ── */}
              <View style={s.statsRow}>
                <StatCard label="Créditos"   value={cr.saldo_actual ?? 0}            color="#F59E0B" />
                <StatCard label="Pedidos"    value={detalle.pedidos?.total ?? 0}      color="#4F46E5" />
                <StatCard label="Usuarios"   value={detalle.usuarios?.length ?? 0}    color="#0EA5E9" />
                <StatCard label="Storage"    value={st.total_human ?? '0 B'}          color="#8B5CF6" />
              </View>

              {/* ── Créditos 30d ── */}
              <View style={[s.statsRow, { marginTop: 0 }]}>
                <StatCard label="Consumo 30d"  value={`-${cr.consumo_30d ?? 0}`}  color="#EF4444" wide />
                <StatCard label="Recarga 30d"  value={`+${cr.recarga_30d ?? 0}`}  color="#16A34A" wide />
                <StatCard label="Coste storage" value={st.coste_mes_eur != null ? `${st.coste_mes_eur.toFixed(3)} €/mes` : '–'} color="#8B5CF6" wide />
              </View>

              {/* ── Layout 2 columnas ── */}
              <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>

                {/* Columna izquierda: Usuarios + Actividad pedidos/presupuestos */}
                <View style={{ flex: 1, minWidth: 260 }}>
                  <Text style={s.sectionTitle}>Usuarios ({detalle.usuarios?.length ?? 0})</Text>
                  <View style={s.card}>
                    {(detalle.usuarios || []).map((u, i) => (
                      <View key={i} style={s.panelRow}>
                        <View style={[s.iconBox, { backgroundColor: '#EEF2FF' }]}>
                          <Text style={{ fontSize: 13 }}>👤</Text>
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={s.rowPrimary} numberOfLines={1}>{u.nombre || u.email}</Text>
                          {u.nombre ? <Text style={s.rowSecondary} numberOfLines={1}>{u.email}</Text> : null}
                        </View>
                        <View style={{ flexDirection: 'row', gap: 4 }}>
                          <View style={[s.planBadge, s.planCred]}>
                            <Text style={[s.planBadgeText, { fontSize: 9 }]}>{u.rol}</Text>
                          </View>
                          {u.activo === false && (
                            <View style={[s.planBadge, { backgroundColor: '#FEE2E2' }]}>
                              <Text style={[s.planBadgeText, { fontSize: 9, color: '#DC2626' }]}>inactivo</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>

                  <Text style={[s.sectionTitle, { marginTop: 12 }]}>Actividad</Text>
                  <View style={s.card}>
                    <View style={s.tblRow}>
                      <Text style={[s.rowPrimary, { flex: 1 }]}>Pedidos totales</Text>
                      <Text style={[s.rowPrimary, { color: '#4F46E5' }]}>{detalle.pedidos?.total ?? 0}</Text>
                    </View>
                    {Object.entries(detalle.pedidos?.por_estado || {}).map(([est, cnt]) => (
                      <View key={est} style={s.tblRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: ESTADO_COLORS[est] ?? '#94A3B8' }} />
                          <Text style={s.rowSecondary}>{est}</Text>
                        </View>
                        <Text style={[s.rowPrimary, { color: ESTADO_COLORS[est] ?? '#64748B' }]}>{cnt}</Text>
                      </View>
                    ))}
                    <View style={s.tblRow}>
                      <Text style={[s.rowPrimary, { flex: 1 }]}>Presupuestos</Text>
                      <Text style={[s.rowPrimary, { color: '#8B5CF6' }]}>{detalle.presupuestos?.total ?? 0}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, paddingTop: 6 }}>
                      {Object.entries(detalle.presupuestos?.por_estado || {}).map(([est, cnt]) => (
                        <View key={est} style={[s.planBadge, { backgroundColor: '#F1F5F9' }]}>
                          <Text style={[s.planBadgeText, { fontSize: 9, color: '#475569' }]}>{est}: {cnt}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <Text style={[s.sectionTitle, { marginTop: 12 }]}>Almacenamiento</Text>
                  <View style={s.card}>
                    <InfoRow label="Total" value={st.total_human} />
                    <InfoRow label="Coste/mes" value={st.coste_mes_eur != null ? `${st.coste_mes_eur.toFixed(4)} €` : '–'} />
                    {(st.por_tipo || []).map((t, i) => (
                      <InfoRow key={i} label={t.tipo || 'otro'} value={`${t.human} · ${t.count} arch.`} />
                    ))}
                  </View>
                </View>

                {/* Columna derecha: Transacciones */}
                <View style={{ flex: 1, minWidth: 260 }}>
                  <Text style={s.sectionTitle}>Transacciones de créditos ({(cr.ultimas_tx || []).length})</Text>
                  <View style={s.card}>
                    {(cr.ultimas_tx || []).length === 0 ? (
                      <Text style={s.emptyText}>Sin transacciones</Text>
                    ) : (cr.ultimas_tx || []).map((tx, i) => (
                      <View key={i} style={s.panelRow}>
                        <View style={[s.iconBox, { backgroundColor: '#FEF9C3' }]}>
                          <Text style={{ fontSize: 13 }}>💳</Text>
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={s.rowPrimary}>{tx.concepto}</Text>
                          <Text style={s.rowSecondary} numberOfLines={1}>
                            {tx.email ? `${tx.email} · ` : ''}{tx.fecha?.slice(0, 10)}
                          </Text>
                          {tx.saldo != null && tx.saldo !== '' ? (
                            <Text style={s.rowSecondary}>Saldo: {tx.saldo}</Text>
                          ) : null}
                        </View>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: (tx.cantidad ?? 0) >= 0 ? '#16A34A' : '#EF4444' }}>
                          {(tx.cantidad ?? 0) >= 0 ? '+' : ''}{tx.cantidad}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

              </View>
            </>
          );
        })()}
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Helpers de UI
// ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, wide }) {
  return (
    <View style={[s.statCard, wide && { flex: 1 }]}>
      <Text style={[s.statValue, { color }]}>{value ?? '–'}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}


function InfoRow({ label, value }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value ?? '–'}</Text>
    </View>
  );
}

function _humanBytes(b) {
  if (!b) return '0 B';
  if (b < 1024) return `${b} B`;
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(2)} MB`;
  return `${(b / 1024 ** 3).toFixed(3)} GB`;
}

// ─────────────────────────────────────────────────────────────────
// Pantalla principal SuperAdmin
// ─────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────
// Tab: Revendedores
// ─────────────────────────────────────────────────────────────────
function TabRevendedores({ currentUser }) {
  const apiFetch = makeApiFetch(currentUser?.access_token);
  const [revendedores, setRevendedores] = useState([]);
  const [empresas, setEmpresas]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [expanded, setExpanded]         = useState(null); // empresa_id del revendedor abierto

  // Formulario nuevo revendedor
  const [showNuevo, setShowNuevo]           = useState(false);
  const [nuevoForm, setNuevoForm]           = useState({ email: '', password: '', empresa_nombre: '', discount_pct: '0' });
  const [saving, setSaving]                 = useState(false);
  const [msg, setMsg]                       = useState(null);

  // Asignar cliente
  const [asignando, setAsignando]           = useState(null);  // empresa_id del revendedor destino
  const [clienteSearch, setClienteSearch]   = useState('');
  const [asignMsg, setAsignMsg]             = useState(null);

  // Confirm quitar cliente
  const [confirmQuitar, setConfirmQuitar]   = useState(null); // { revendedorId, clienteEmpresaId }

  // Descuento
  const [editDescuento, setEditDescuento]   = useState(null); // { id, value }

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [rev, emp] = await Promise.all([
        apiFetch('/api/superadmin/revendedores'),
        apiFetch('/api/superadmin/empresas'),
      ]);
      setRevendedores(rev.revendedores || []);
      setEmpresas(emp.empresas || []);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, [currentUser?.access_token]);

  useEffect(() => { load(); }, [load]);

  const crearRevendedor = async () => {
    if (!nuevoForm.email.trim() || !nuevoForm.password.trim()) {
      setMsg({ type: 'error', text: 'Email y contraseña son obligatorios' }); return;
    }
    setSaving(true); setMsg(null);
    try {
      await apiFetch('/api/superadmin/revendedores', { method: 'POST', body: JSON.stringify({
        email: nuevoForm.email.trim(),
        password: nuevoForm.password.trim(),
        empresa_nombre: nuevoForm.empresa_nombre.trim() || undefined,
        discount_pct: parseFloat(nuevoForm.discount_pct) || 0,
      }) });
      setMsg({ type: 'ok', text: 'Revendedor creado' });
      setNuevoForm({ email: '', password: '', empresa_nombre: '', discount_pct: '0' });
      setShowNuevo(false);
      load();
    } catch (e) { setMsg({ type: 'error', text: e.message }); }
    setSaving(false);
  };

  const asignarCliente = async (revendedorId, clienteEmpresaId) => {
    setAsignMsg(null);
    try {
      await apiFetch(`/api/superadmin/revendedores/${revendedorId}/clientes`, {
        method: 'POST',
        body: JSON.stringify({ empresa_id: clienteEmpresaId }),
      });
      setAsignando(null); setClienteSearch('');
      load();
    } catch (e) { setAsignMsg(e.message); }
  };

  const quitarCliente = async (revendedorId, clienteEmpresaId) => {
    try {
      await apiFetch(`/api/superadmin/revendedores/${revendedorId}/clientes/${clienteEmpresaId}`, { method: 'DELETE' });
      load();
    } catch (e) { setError(e.message); }
  };

  const guardarDescuento = async (revendedorId, pct) => {
    try {
      await apiFetch(`/api/superadmin/revendedores/${revendedorId}/descuento`, {
        method: 'PUT',
        body: JSON.stringify({ discount_pct: parseFloat(pct) || 0 }),
      });
      setEditDescuento(null);
      load();
    } catch (e) { setError(e.message); }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color="#4F46E5" />;
  if (error)   return <Text style={s.errorText}>{error}</Text>;

  // Empresas sin revendedor asignado (para el selector de asignación)
  const resellerClientIds = new Set(revendedores.flatMap((r) => (r.clientes || []).map((c) => c.empresa_id)));
  const resellerIds       = new Set(revendedores.map((r) => r.empresa_id));
  const empresasLibres    = empresas.filter(
    (e) => !resellerClientIds.has(e.empresa_id) && !resellerIds.has(e.empresa_id),
  );
  const empresasFiltradas = clienteSearch.trim()
    ? empresasLibres.filter((e) =>
        (e.admin_email || '').toLowerCase().includes(clienteSearch.toLowerCase()) ||
        (e.empresa_id  || '').toLowerCase().includes(clienteSearch.toLowerCase()),
      )
    : empresasLibres;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>

      {/* Cabecera */}
      <View style={[s.tblHead, { marginBottom: 12 }]}>
        <Text style={[s.sectionTitle, { flex: 1, marginBottom: 0, marginTop: 0 }]}>
          Revendedores ({revendedores.length})
        </Text>
        <TouchableOpacity style={s.primaryBtn} onPress={() => { setShowNuevo(!showNuevo); setMsg(null); }}>
          <Text style={s.primaryBtnText}>{showNuevo ? '✕ Cancelar' : '+ Nuevo revendedor'}</Text>
        </TouchableOpacity>
      </View>

      {/* Formulario nuevo revendedor */}
      {showNuevo && (
        <View style={[s.card, { marginBottom: 16 }]}>
          <Text style={[s.sectionTitle, { marginTop: 0 }]}>Crear revendedor</Text>
          {[
            { key: 'email',          label: 'Email *',          placeholder: 'distribuidor@empresa.com', keyboard: 'email-address' },
            { key: 'password',       label: 'Contraseña *',     placeholder: 'Mín. 8 caracteres',       secure: true },
            { key: 'empresa_nombre', label: 'Nombre empresa',   placeholder: 'Ej: Flexo Distribución S.L.' },
            { key: 'discount_pct',   label: 'Descuento (%)',    placeholder: '0',                       keyboard: 'numeric' },
          ].map(({ key, label, placeholder, keyboard, secure }) => (
            <View key={key} style={s.formRow}>
              <Text style={s.formLabel}>{label}</Text>
              <TextInput
                style={s.formInput}
                value={nuevoForm[key]}
                onChangeText={(v) => setNuevoForm((f) => ({ ...f, [key]: v }))}
                placeholder={placeholder}
                placeholderTextColor="#94A3B8"
                keyboardType={keyboard || 'default'}
                secureTextEntry={!!secure}
                autoCapitalize="none"
              />
            </View>
          ))}
          {msg && (
            <View style={[s.alertBox, msg.type === 'ok' ? s.alertOk : s.alertError]}>
              <Text style={s.alertText}>{msg.text}</Text>
            </View>
          )}
          <TouchableOpacity style={[s.primaryBtn, saving && { opacity: 0.6 }]} onPress={crearRevendedor} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={s.primaryBtnText}>Crear revendedor</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* Lista de revendedores */}
      {revendedores.length === 0 ? (
        <View style={s.card}>
          <Text style={s.emptyText}>No hay revendedores todavía</Text>
        </View>
      ) : revendedores.map((rev) => (
        <View key={`rev-${rev.empresa_id}`} style={[s.card, { marginBottom: 12 }]}>

          {/* Cabecera revendedor */}
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
            onPress={() => setExpanded(expanded === rev.empresa_id ? null : rev.empresa_id)}
          >
            <View style={[s.iconBox, { backgroundColor: '#EEF2FF' }]}>
              <Text style={{ fontSize: 14 }}>🤝</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.rowPrimary} numberOfLines={1}>{rev.admin_email}</Text>
              <Text style={s.rowSecondary} numberOfLines={1}>
                {rev.empresa_nombre || rev.empresa_id} · {rev.clientes?.length ?? 0} cliente{(rev.clientes?.length ?? 0) !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 3 }}>
              <View style={[s.planBadge, { backgroundColor: '#DCFCE7' }]}>
                <Text style={[s.planBadgeText, { color: '#166534' }]}>{rev.discount_pct ?? 0}% dto.</Text>
              </View>
              <Text style={[s.rowSecondary, { fontSize: 10 }]}>
                {rev.creditos ?? 0} cred. · {rev.consumo_total ?? 0} consumido
              </Text>
            </View>
            <Text style={{ fontSize: 16, color: '#94A3B8', marginLeft: 4 }}>
              {expanded === rev.empresa_id ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>

          {expanded === rev.empresa_id && (
            <View style={{ marginTop: 12 }}>

              {/* Descuento */}
              <View style={[s.infoRow, { marginBottom: 8 }]}>
                <Text style={s.infoLabel}>Descuento aplicado</Text>
                {editDescuento?.id === rev.empresa_id ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TextInput
                      style={[s.formInput, { width: 60, marginBottom: 0, paddingVertical: 4 }]}
                      value={editDescuento.value}
                      onChangeText={(v) => setEditDescuento((d) => ({ ...d, value: v }))}
                      keyboardType="numeric"
                    />
                    <Text style={s.infoLabel}>%</Text>
                    <TouchableOpacity style={[s.smallBtn, s.smallBtnOk]} onPress={() => guardarDescuento(rev.empresa_id, editDescuento.value)}>
                      <Text style={s.smallBtnText}>✓ Guardar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.smallBtn, s.smallBtnGray]} onPress={() => setEditDescuento(null)}>
                      <Text style={s.smallBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={s.infoValue}>{rev.discount_pct ?? 0}%</Text>
                    <TouchableOpacity style={[s.smallBtn, s.smallBtnGray]} onPress={() => setEditDescuento({ id: rev.empresa_id, value: String(rev.discount_pct ?? 0) })}>
                      <Text style={s.smallBtnText}>✎ Editar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Resumen financiero */}
              <View style={[s.card, { marginTop: 4 }]}>
                <View style={s.tblRow}>
                  <Text style={[s.infoLabel, { flex: 1 }]}>Créditos disponibles</Text>
                  <Text style={[s.infoValue, { color: '#4F46E5' }]}>{rev.creditos ?? 0}</Text>
                </View>
                <View style={s.tblRow}>
                  <Text style={[s.infoLabel, { flex: 1 }]}>Consumo este mes</Text>
                  <Text style={[s.infoValue, { color: '#EF4444' }]}>{rev.coste_mes_actual_eur ?? 0} €</Text>
                </View>
                <View style={s.tblRow}>
                  <Text style={[s.infoLabel, { flex: 1 }]}>Consumo total acumulado</Text>
                  <Text style={[s.infoValue, { color: '#F59E0B' }]}>{rev.coste_total_eur ?? 0} €</Text>
                </View>
                <View style={[s.tblRow, { borderBottomWidth: 0 }]}>
                  <Text style={[s.infoLabel, { flex: 1 }]}>Descuento pactado</Text>
                  <Text style={[s.infoValue, { color: '#16A34A' }]}>{rev.discount_pct ?? 0}%</Text>
                </View>
              </View>

              {/* Histórico mensual del revendedor */}
              {(rev.consumo_mensual || []).length > 0 && (
                <>
                  <Text style={[s.sectionTitle, { marginTop: 8 }]}>Consumo mensual</Text>
                  <View style={s.card}>
                    <View style={s.tblHead}>
                      <Text style={[s.tblCol, { flex: 2 }]}>Mes</Text>
                      <Text style={[s.tblCol, { flex: 1, textAlign: 'right' }]}>Créditos</Text>
                    </View>
                    {(rev.consumo_mensual || []).map((m, i) => {
                      const mesActual = new Date().toISOString().slice(0, 7);
                      return (
                        <View key={i} style={[s.tblRow, m.mes === mesActual && { backgroundColor: '#FFFBEB' }]}>
                          <Text style={[s.rowPrimary, { flex: 2 }]}>
                            {m.mes}{m.mes === mesActual ? ' ← actual' : ''}
                          </Text>
                          <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: '#F59E0B', textAlign: 'right' }}>
                            {m.total}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </>
              )}

              {/* Clientes del revendedor */}
              <Text style={[s.sectionTitle, { marginTop: 8 }]}>
                Empresas cliente ({rev.clientes?.length ?? 0})
              </Text>
              {(rev.clientes || []).length === 0 ? (
                <Text style={[s.rowSecondary, { marginBottom: 8 }]}>Sin clientes asignados</Text>
              ) : (
                <>
                  {(rev.clientes || []).map((c) => (
                    <View key={`cli-${c.empresa_id}`} style={[s.tblRow, { flexDirection: 'column', alignItems: 'flex-start', gap: 4 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%' }}>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={s.rowPrimary} numberOfLines={1}>{c.empresa_nombre || c.nombre || c.admin_email || c.empresa_id}</Text>
                          <Text style={s.rowSecondary} numberOfLines={1}>{c.admin_email || c.email}</Text>
                        </View>
                        {confirmQuitar?.revendedorId === rev.empresa_id && confirmQuitar?.clienteEmpresaId === c.empresa_id ? (
                          <DeleteConfirmRow
                            message="¿Quitar cliente del revendedor?"
                            confirmLabel="Quitar"
                            onCancel={() => setConfirmQuitar(null)}
                            onConfirm={() => { setConfirmQuitar(null); quitarCliente(rev.empresa_id, c.empresa_id); }}
                          />
                        ) : (
                          <TouchableOpacity style={[s.smallBtn, s.smallBtnDanger]} onPress={() => setConfirmQuitar({ revendedorId: rev.empresa_id, clienteEmpresaId: c.empresa_id })}>
                            <Text style={s.smallBtnText}>✕ Quitar</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                        <View style={[s.planBadge, c.reseller_billing_mode === 'cuota_mensual' ? { backgroundColor: '#F0FDF4' } : { backgroundColor: '#EEF2FF' }]}>
                          <Text style={[s.planBadgeText, { fontSize: 9 }]}>
                            {c.reseller_billing_mode === 'cuota_mensual' ? '📅 Cuota' : '📊 Por uso'}
                          </Text>
                        </View>
                        {c.bloqueado && (
                          <View style={[s.planBadge, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
                            <Text style={[s.planBadgeText, { fontSize: 9, color: '#DC2626' }]}>🔒 Bloqueado</Text>
                          </View>
                        )}
                        {c.reseller_billing_mode === 'cuota_mensual' && (
                          <View style={[s.planBadge, { backgroundColor: '#FEF9C3' }]}>
                            <Text style={[s.planBadgeText, { fontSize: 9 }]}>{rev.suscripcion_eur ?? 0} €/mes</Text>
                          </View>
                        )}
                        <View style={[s.planBadge, { backgroundColor: '#FFF7ED' }]}>
                          <Text style={[s.planBadgeText, { fontSize: 9, color: '#B45309' }]}>
                            Acum: {c.coste_acumulado_eur ?? 0} €
                          </Text>
                        </View>
                        <View style={[s.planBadge, { backgroundColor: '#F1F5F9' }]}>
                          <Text style={[s.planBadgeText, { fontSize: 9, color: '#64748B' }]}>
                            Este mes: {c.consumo_mes_actual ?? 0} cr
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </>
              )}

              {/* Asignar nuevo cliente */}
              {asignando === rev.empresa_id ? (
                <View style={{ marginTop: 8 }}>
                  <TextInput
                    style={[s.formInput, { marginBottom: 6 }]}
                    value={clienteSearch}
                    onChangeText={setClienteSearch}
                    placeholder="Buscar empresa por email o ID…"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                  />
                  {asignMsg && (
                    <View style={[s.alertBox, s.alertError, { marginBottom: 6 }]}>
                      <Text style={s.alertText}>{asignMsg}</Text>
                    </View>
                  )}
                  {empresasFiltradas.slice(0, 8).map((e) => (
                    <TouchableOpacity
                      key={`libre-${e.empresa_id}`}
                      style={[s.panelRow, { backgroundColor: '#F8FAFC', borderRadius: 6, paddingHorizontal: 8 }]}
                      onPress={() => asignarCliente(rev.empresa_id, e.empresa_id)}
                    >
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={s.rowPrimary} numberOfLines={1}>{e.admin_email}</Text>
                        <Text style={s.rowSecondary} numberOfLines={1}>{e.empresa_id}</Text>
                      </View>
                      <Text style={[s.smallBtnText, { color: '#4F46E5' }]}>+ Asignar</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity style={[s.refreshBtn, { marginTop: 6 }]} onPress={() => { setAsignando(null); setClienteSearch(''); setAsignMsg(null); }}>
                    <Text style={s.refreshBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={[s.refreshBtn, { marginTop: 8 }]} onPress={() => { setAsignando(rev.empresa_id); setClienteSearch(''); setAsignMsg(null); }}>
                  <Text style={s.refreshBtnText}>+ Asignar empresa cliente</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

export default function SuperAdminScreen({ currentUser }) {
  const [activeTab, setActiveTab] = useState('monitor');

  if (!currentUser || currentUser.rol !== 'root') {
    return (
      <View style={s.accessDenied}>
        <Text style={s.accessDeniedText}>🔒 Acceso restringido</Text>
        <Text style={s.accessDeniedSub}>Solo disponible para el administrador global.</Text>
      </View>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'monitor':  return <TabMonitor  currentUser={currentUser} />;
      case 'servidor': return <TabServidor currentUser={currentUser} />;
      case 'tarifas':  return <TabTarifas  currentUser={currentUser} />;
      case 'empresas':     return <TabEmpresas     currentUser={currentUser} />;
      case 'revendedores': return <TabRevendedores currentUser={currentUser} />;
      case 'promos':       return <TabPromos       currentUser={currentUser} />;
      case 'detalle':  return <TabDetalle  currentUser={currentUser} />;
      default:         return null;
    }
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>⚡ Panel SuperAdmin</Text>
        <Text style={s.headerSub}>{currentUser.email}</Text>
      </View>

      {/* Sub-tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabBar} contentContainerStyle={s.tabBarContent}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[s.tabBtn, activeTab === t.key && s.tabBtnActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text style={[s.tabBtnText, activeTab === t.key && s.tabBtnTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {renderTab()}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F8FAFC' },
  header:         { backgroundColor: '#1E1B4B', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle:    { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  headerSub:      { fontSize: 12, color: '#A5B4FC', marginTop: 2 },

  tabBar:         { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', maxHeight: 46 },
  tabBarContent:  { paddingHorizontal: 12, gap: 4, alignItems: 'center' },
  tabBtn:         { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 6 },
  tabBtnActive:   { backgroundColor: '#EEF2FF' },
  tabBtnText:     { fontSize: 13, fontWeight: '600', color: '#64748B' },
  tabBtnTextActive: { color: '#4F46E5' },

  sectionTitle:   { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 4 },
  card:           { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 12, overflow: 'hidden' },

  tblHead:        { flexDirection: 'row', alignItems: 'center', paddingBottom: 7, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', marginBottom: 2 },
  tblCol:         { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.4 },
  tblRow:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  panelRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  iconBox:        { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowPrimary:     { fontSize: 12, fontWeight: '600', color: '#0F172A' },
  rowSecondary:   { fontSize: 11, color: '#94A3B8', marginTop: 1 },

  statsRow:       { flexDirection: 'row', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  statCard:       { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', padding: 12, alignItems: 'center', minWidth: 80 },
  statValue:      { fontSize: 22, fontWeight: '800' },
  statLabel:      { fontSize: 11, color: '#94A3B8', marginTop: 2 },

  miniStat:       { flex: 1, alignItems: 'center' },
  miniStatValue:  { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  miniStatLabel:  { fontSize: 10, color: '#94A3B8' },

  actividadRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', padding: 10, marginBottom: 6 },
  actividadBadge: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  actividadBadgeText: { fontSize: 10, fontWeight: '700' },
  actividadRef:    { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  actividadNombre: { fontSize: 13, color: '#475569', flex: 1 },
  actividadMeta:   { fontSize: 11, color: '#64748B' },
  actividadFecha:  { fontSize: 11, color: '#94A3B8' },
  estadoBadge:     { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, borderWidth: 1 },
  estadoBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },

  infoRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  infoLabel:      { fontSize: 12, color: '#64748B' },
  infoValue:      { fontSize: 12, fontWeight: '600', color: '#0F172A' },

  formRow:        { marginBottom: 12 },
  formLabel:      { fontSize: 11, fontWeight: '600', color: '#64748B', marginBottom: 4 },
  formInput:      { backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: '#0F172A', marginBottom: 4 },

  primaryBtn:     { backgroundColor: '#4F46E5', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center', marginBottom: 4 },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  refreshBtn:     { backgroundColor: '#EEF2FF', borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginTop: 8 },
  refreshBtnText: { color: '#4F46E5', fontWeight: '600', fontSize: 13 },
  dangerBtn:      { backgroundColor: '#DC2626', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  dangerBtnText:  { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

  alertBox:       { borderRadius: 8, padding: 10, marginBottom: 8 },
  alertOk:        { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0' },
  alertError:     { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  alertText:      { fontSize: 13, fontWeight: '600', color: '#0F172A' },

  empresaId:      { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  planBadge:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  planSub:        { backgroundColor: '#EEF2FF' },
  planCred:       { backgroundColor: '#FEF9C3' },
  planBadgeText:  { fontSize: 11, fontWeight: '700', color: '#1E1B4B' },

  promoCode:      { fontSize: 16, fontWeight: '800', color: '#4F46E5', letterSpacing: 1 },
  promoMeta:      { fontSize: 12, color: '#64748B' },
  smallBtn:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  smallBtnOk:     { backgroundColor: '#DCFCE7' },
  smallBtnGray:   { backgroundColor: '#F1F5F9' },
  smallBtnDanger: { backgroundColor: '#FEE2E2' },
  smallBtnText:   { fontSize: 11, fontWeight: '700', color: '#0F172A' },

  emptyText:      { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginTop: 20 },
  errorText:      { fontSize: 13, color: '#DC2626', textAlign: 'center', marginTop: 20, padding: 16 },

  confirmRow:         { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 8, padding: 12, marginTop: 8 },
  confirmText:        { fontSize: 12, fontWeight: '600', color: '#B91C1C' },
  confirmBtnCancel:   { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', alignItems: 'center' },
  confirmBtnCancelText: { fontSize: 13, fontWeight: '600', color: '#475569' },

  accessDenied:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  accessDeniedText: { fontSize: 22, fontWeight: '800', color: '#1E1B4B', marginBottom: 8 },
  accessDeniedSub:  { fontSize: 14, color: '#64748B', textAlign: 'center' },
});

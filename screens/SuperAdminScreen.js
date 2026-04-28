import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, StyleSheet, Platform, RefreshControl,
} from 'react-native';
import DeleteConfirmRow from '../components/DeleteConfirmRow';
import { isValidEmail } from '../utils/phoneFormat';

const API_BASE = 'http://localhost:8080';

const NAV_ITEMS = [
  { key: 'dashboard',    icon: '📊', label: 'Dashboard' },
  { key: 'financiero',   icon: '💹', label: 'Financiero' },
  { key: 'riesgo',       icon: '⚠️', label: 'Riesgo' },
  { key: 'empresas',     icon: '🏢', label: 'Empresas' },
  { key: 'revendedores', icon: '🤝', label: 'Revendedores' },
  { key: 'tarifas',      icon: '💶', label: 'Tarifas' },
  { key: 'promos',       icon: '🎁', label: 'Promociones' },
  { key: 'comunicacion', icon: '📣', label: 'Comunicación' },
  { key: 'auditoria',    icon: '🔎', label: 'Auditoría' },
  { key: 'configuracion',icon: '🚩', label: 'Flags' },
  { key: 'servidor',     icon: '⚙️', label: 'Servidor' },
];

const ESTADO_COLORS = {
  pendiente: '#F59E0B', en_proceso: '#3B82F6', finalizado: '#16A34A',
  cancelado: '#EF4444', aprobado: '#8B5CF6',
};

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

function _humanBytes(b) {
  if (!b) return '0 B';
  if (b < 1024) return `${b} B`;
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(2)} MB`;
  return `${(b / 1024 ** 3).toFixed(3)} GB`;
}

// ─────────────────────────────────────────────────────────────────
// UI Primitives
// ─────────────────────────────────────────────────────────────────

function Card({ children, style }) {
  return <View style={[s.card, style]}>{children}</View>;
}

function SectionHeader({ title, action }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {action}
    </View>
  );
}

function Badge({ label, color = '#4F46E5', bg }) {
  return (
    <View style={[s.badge, { backgroundColor: bg || `${color}22` }]}>
      <Text style={[s.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function InfoRow({ label, value, valueColor }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={[s.infoValue, valueColor && { color: valueColor }]}>{value ?? '–'}</Text>
    </View>
  );
}

function FeedRow({ icon, iconBg, primary, secondary, right }) {
  return (
    <View style={s.feedRow}>
      <View style={[s.feedIcon, { backgroundColor: iconBg || '#EEF2FF' }]}>
        <Text style={{ fontSize: 12 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={s.rowPrimary} numberOfLines={1}>{primary}</Text>
        {secondary ? <Text style={s.rowSecondary} numberOfLines={1}>{secondary}</Text> : null}
      </View>
      {right}
    </View>
  );
}

function KpiCard({ icon, label, value, color, sub }) {
  return (
    <View style={[s.kpiCard, { borderLeftColor: color }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <View style={[s.kpiIcon, { backgroundColor: `${color}18` }]}>
          <Text style={{ fontSize: 13 }}>{icon}</Text>
        </View>
        <Text style={s.kpiLabel}>{label}</Text>
      </View>
      <Text style={[s.kpiValue, { color }]}>{value ?? '–'}</Text>
      {sub ? <Text style={s.kpiSub}>{sub}</Text> : null}
    </View>
  );
}

function MiniKpi({ label, value, color }) {
  return (
    <View style={s.miniKpi}>
      <Text style={[s.miniKpiValue, { color }]}>{value}</Text>
      <Text style={s.miniKpiLabel}>{label}</Text>
    </View>
  );
}

function FormField({ label, style, ...props }) {
  return (
    <View style={[{ marginBottom: 12 }, style]}>
      <Text style={s.formLabel}>{label}</Text>
      <TextInput style={s.formInput} placeholderTextColor="#94A3B8" {...props} />
    </View>
  );
}

function Btn({ label, onPress, disabled, loading: isLoading, style, textStyle }) {
  return (
    <TouchableOpacity style={[s.btn, disabled && { opacity: 0.6 }, style]} onPress={onPress} disabled={disabled || isLoading}>
      {isLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={[s.btnText, textStyle]}>{label}</Text>}
    </TouchableOpacity>
  );
}

function AlertBanner({ alerts }) {
  if (!alerts || alerts.length === 0) return null;
  return (
    <View style={s.alertBanner}>
      <Text style={{ fontSize: 18, marginRight: 10 }}>⚠️</Text>
      <View style={{ flex: 1 }}>
        <Text style={s.alertBannerTitle}>{alerts.length} alerta{alerts.length > 1 ? 's' : ''} activa{alerts.length > 1 ? 's' : ''}</Text>
        {alerts.slice(0, 3).map((a, i) => (
          <Text key={i} style={s.alertBannerItem}>
            {a.tipo === 'creditos_bajos' ? '💰' : '💾'} {a.email} — {a.tipo === 'creditos_bajos' ? `Créditos: ${a.valor}` : `Storage: ${a.valor}`}
          </Text>
        ))}
        {alerts.length > 3 && <Text style={s.alertBannerItem}>+{alerts.length - 3} más…</Text>}
      </View>
    </View>
  );
}

function StatusDot({ online }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={[s.statusDot, { backgroundColor: online ? '#16A34A' : '#EF4444' }]} />
      <Text style={{ fontSize: 12, fontWeight: '600', color: online ? '#16A34A' : '#EF4444' }}>
        {online ? 'Online' : 'Offline'}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Tab: Dashboard
// ─────────────────────────────────────────────────────────────────
function TabDashboard({ currentUser }) {
  const apiFetch = makeApiFetch(currentUser?.access_token);
  const [status, setStatus]     = useState(null);
  const [empresas, setEmpresas] = useState([]);
  const [panel, setPanel]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
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
    if (isRefresh) setRefreshing(false); else setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <ActivityIndicator style={{ marginTop: 60 }} color="#4F46E5" size="large" />;
  if (error) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <Text style={s.errorText}>{error}</Text>
      <Btn label="Reintentar" onPress={() => load()} style={{ marginTop: 12 }} />
    </View>
  );

  const totalPedidos  = empresas.reduce((a, e) => a + e.num_pedidos, 0);
  const totalUsuarios = empresas.reduce((a, e) => a + e.num_usuarios, 0);
  const totalBytes    = empresas.reduce((a, e) => a + e.storage_bytes, 0);
  const totalCreditos = empresas.reduce((a, e) => a + (e.creditos || 0), 0);
  const alertas = panel?.alertas || [];

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
    >
      <View style={{ maxWidth: 1200, width: '100%', alignSelf: 'center', gap: 14 }}>

        <AlertBanner alerts={alertas} />

        {/* KPIs */}
        <View style={s.kpiGrid}>
          <KpiCard icon="🏢" label="Empresas"        value={empresas.length}        color="#4F46E5" />
          <KpiCard icon="👥" label="Usuarios"         value={totalUsuarios}          color="#0EA5E9" />
          <KpiCard icon="📦" label="Pedidos totales"  value={totalPedidos}           color="#10B981" />
          <KpiCard icon="💰" label="Créditos totales" value={totalCreditos}          color="#F59E0B" />
          <KpiCard icon="💾" label="Almacenamiento"   value={_humanBytes(totalBytes)} color="#8B5CF6" />
          <KpiCard icon="⏱️" label="Uptime servidor"  value={status?.uptime || '–'}  color="#64748B"
            sub={status?.mem_mb ? `${status.mem_mb} MB RAM` : undefined} />
        </View>

        {/* 2 columnas: tabla empresas + feeds */}
        <View style={s.twoCol}>

          {/* Tabla empresas */}
          <View style={{ flex: 2, minWidth: 260 }}>
            <SectionHeader title={`Resumen empresas (${empresas.length})`} />
            <Card>
              <View style={s.tblHead}>
                <Text style={[s.tblCol, { flex: 3 }]}>Empresa</Text>
                <Text style={[s.tblCol, { width: 44, textAlign: 'right' }]}>Ped</Text>
                <Text style={[s.tblCol, { width: 54, textAlign: 'right' }]}>Cred</Text>
                <Text style={[s.tblCol, { width: 80, textAlign: 'right' }]}>Storage</Text>
              </View>
              {empresas.slice(0, 12).map((e) => (
                <View key={e.empresa_id} style={s.tblRow}>
                  <View style={{ flex: 3, minWidth: 0 }}>
                    <Text style={s.rowPrimary} numberOfLines={1}>{e.admin_email || e.empresa_id}</Text>
                    <Badge
                      label={e.billing_model || 'creditos'}
                      color={e.billing_model === 'suscripcion' ? '#4F46E5' : '#B45309'}
                      bg={e.billing_model === 'suscripcion' ? '#EEF2FF' : '#FEF9C3'}
                    />
                  </View>
                  <Text style={{ width: 44, fontSize: 12, fontWeight: '700', color: '#4F46E5', textAlign: 'right' }}>{e.num_pedidos}</Text>
                  <Text style={{ width: 54, fontSize: 12, fontWeight: '700', color: '#F59E0B', textAlign: 'right' }}>{e.creditos || 0}</Text>
                  <Text style={{ width: 80, fontSize: 11, color: '#8B5CF6', textAlign: 'right' }}>{e.storage_human}</Text>
                </View>
              ))}
              {empresas.length > 12 && (
                <Text style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', paddingTop: 8 }}>
                  +{empresas.length - 12} más en la sección Empresas
                </Text>
              )}
            </Card>
          </View>

          {/* Feed lateral */}
          <View style={{ flex: 1, minWidth: 220, gap: 14 }}>

            <View>
              <SectionHeader title="Alertas" />
              <Card>
                {alertas.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                    <Text style={{ fontSize: 20, marginBottom: 4 }}>✅</Text>
                    <Text style={{ fontSize: 12, color: '#16A34A', fontWeight: '600' }}>Sin alertas activas</Text>
                  </View>
                ) : alertas.map((a, i) => (
                  <FeedRow
                    key={i}
                    icon={a.tipo === 'creditos_bajos' ? '💰' : '💾'}
                    iconBg={a.tipo === 'creditos_bajos' ? '#FEF9C3' : '#FEE2E2'}
                    primary={a.email}
                    secondary={a.tipo === 'creditos_bajos' ? `Créditos: ${a.valor}` : `Storage: ${a.valor}`}
                  />
                ))}
              </Card>
            </View>

            <View>
              <SectionHeader title="Últimos accesos" />
              <Card>
                {(panel?.logins || []).length === 0
                  ? <Text style={s.emptyText}>Sin registros</Text>
                  : (panel?.logins || []).slice(0, 5).map((l, i) => (
                  <FeedRow
                    key={i}
                    icon="🔐"
                    iconBg="#EEF2FF"
                    primary={l.email}
                    secondary={l.ts?.slice(0, 16).replace('T', ' ')}
                    right={<Badge label={l.rol} color="#475569" bg="#F1F5F9" />}
                  />
                ))}
              </Card>
            </View>

            <View>
              <SectionHeader title="Nuevas empresas" />
              <Card>
                {(panel?.registros || []).length === 0
                  ? <Text style={s.emptyText}>Sin registros</Text>
                  : (panel?.registros || []).slice(0, 5).map((r, i) => (
                  <FeedRow
                    key={i}
                    icon="🏢"
                    iconBg="#F0FDF4"
                    primary={r.email}
                    secondary={r.created_at?.slice(0, 10)}
                    right={
                      <Badge
                        label={r.billing_model}
                        color={r.billing_model === 'suscripcion' ? '#4F46E5' : '#B45309'}
                        bg={r.billing_model === 'suscripcion' ? '#EEF2FF' : '#FEF9C3'}
                      />
                    }
                  />
                ))}
              </Card>
            </View>

            <View>
              <SectionHeader title="Transacciones recientes" />
              <Card>
                {(panel?.transacciones || []).length === 0
                  ? <Text style={s.emptyText}>Sin transacciones</Text>
                  : (panel?.transacciones || []).slice(0, 5).map((tx, i) => (
                  <FeedRow
                    key={i}
                    icon="💳"
                    iconBg="#FEF9C3"
                    primary={tx.concepto}
                    secondary={tx.email}
                    right={
                      <Text style={[s.rowPrimary, { color: (tx.cantidad || 0) >= 0 ? '#16A34A' : '#EF4444' }]}>
                        {(tx.cantidad || 0) >= 0 ? '+' : ''}{tx.cantidad}
                      </Text>
                    }
                  />
                ))}
              </Card>
            </View>

          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Tab: Empresas (con detalle integrado — sin tab separado)
// ─────────────────────────────────────────────────────────────────
function TabEmpresas({ currentUser }) {
  const apiFetch = makeApiFetch(currentUser?.access_token);
  const [empresas, setEmpresas]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState('');
  const [expanded, setExpanded]     = useState(null);
  const [detalle, setDetalle]       = useState({});
  const [loadingDet, setLoadingDet] = useState(null);
  const [ajuste, setAjuste]         = useState({});
  const [ajusteMsg, setAjusteMsg]   = useState({});
  const [saving, setSaving]         = useState(null);
  const [editDto, setEditDto]       = useState({});   // { [empresa_id]: string }
  const [savingDto, setSavingDto]   = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await apiFetch('/api/superadmin/empresas');
      setEmpresas(data.empresas || []);
    } catch (_) {}
    if (isRefresh) setRefreshing(false); else setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleExpand = async (eid) => {
    if (expanded === eid) { setExpanded(null); return; }
    setExpanded(eid);
    if (!detalle[eid]) {
      setLoadingDet(eid);
      try {
        const d = await apiFetch(`/api/superadmin/empresas/${eid}/detalle`);
        setDetalle((prev) => ({ ...prev, [eid]: d }));
      } catch (_) {}
      setLoadingDet(null);
    }
  };

  const guardarDescuento = async (eid) => {
    const pct = parseInt(editDto[eid] ?? '0') || 0;
    setSavingDto(eid);
    try {
      await apiFetch(`/api/superadmin/empresas/${eid}/descuento`, {
        method: 'PUT', body: JSON.stringify({ discount_pct: pct }),
      });
      setEmpresas((prev) => prev.map((e) => e.empresa_id === eid ? { ...e, billing_discount_pct: pct } : e));
      setEditDto((d) => { const n = { ...d }; delete n[eid]; return n; });
    } catch (e) { setAjusteMsg((m) => ({ ...m, [eid]: { type: 'error', text: e.message } })); }
    setSavingDto(null);
  };

  const ajustarCreditos = async (eid) => {
    const cantidad = parseInt(ajuste[eid] || '0');
    if (!cantidad) return;
    setSaving(eid);
    setAjusteMsg((m) => ({ ...m, [eid]: null }));
    try {
      const res = await apiFetch(`/api/superadmin/empresas/${eid}/creditos`, {
        method: 'POST', body: JSON.stringify({ cantidad }),
      });
      setAjusteMsg((m) => ({ ...m, [eid]: { type: 'ok', text: `Créditos nuevos: ${res.creditos_nuevos}` } }));
      setAjuste((a) => ({ ...a, [eid]: '' }));
      load();
    } catch (e) { setAjusteMsg((m) => ({ ...m, [eid]: { type: 'error', text: e.message } })); }
    setSaving(null);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return empresas;
    return empresas.filter((e) =>
      (e.admin_email || '').toLowerCase().includes(q) ||
      (e.empresa_id || '').toLowerCase().includes(q)
    );
  }, [empresas, search]);

  if (loading) return <ActivityIndicator style={{ marginTop: 60 }} color="#4F46E5" size="large" />;

  return (
    <View style={{ flex: 1 }}>
      <View style={s.searchBar}>
        <Text style={{ fontSize: 16, marginRight: 6 }}>🔍</Text>
        <TextInput
          style={{ flex: 1, fontSize: 14, color: '#0F172A' }}
          placeholder="Buscar empresa por email o ID…"
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={{ padding: 4 }}>
            <Text style={{ fontSize: 13, color: '#94A3B8', fontWeight: '700' }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
      >
        <View style={{ maxWidth: 1200, width: '100%', alignSelf: 'center' }}>

          {filtered.length === 0 && (
            <Text style={s.emptyText}>Sin resultados para "{search}"</Text>
          )}

          {filtered.map((emp) => {
            const isOpen = expanded === emp.empresa_id;
            const det    = detalle[emp.empresa_id];
            const isSub  = emp.billing_model === 'suscripcion';

            return (
              <Card key={emp.empresa_id} style={{ marginBottom: 0 }}>

                {/* Fila resumen */}
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
                  onPress={() => toggleExpand(emp.empresa_id)}
                >
                  <View style={[s.empAvatar, { backgroundColor: isSub ? '#EEF2FF' : '#FEF9C3' }]}>
                    <Text style={{ fontSize: 16 }}>🏢</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[s.rowPrimary, { fontSize: 14 }]} numberOfLines={1}>{emp.admin_email || emp.empresa_id}</Text>
                    <View style={{ flexDirection: 'row', gap: 5, marginTop: 3, flexWrap: 'wrap' }}>
                      <Badge
                        label={emp.billing_model || 'creditos'}
                        color={isSub ? '#4F46E5' : '#B45309'}
                        bg={isSub ? '#EEF2FF' : '#FEF9C3'}
                      />
                      {emp.billing_discount_pct > 0 && (
                        <Badge label={`🏷️ -${emp.billing_discount_pct}%`} color="#92400E" bg="#FEF3C7" />
                      )}
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 2 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#4F46E5' }}>{emp.num_pedidos} ped.</Text>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#F59E0B' }}>{emp.creditos || 0} cred.</Text>
                    <Text style={{ fontSize: 10, color: '#8B5CF6' }}>{emp.storage_human}</Text>
                  </View>
                  <Text style={{ fontSize: 14, color: '#CBD5E1', marginLeft: 6 }}>{isOpen ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {/* Detalle expandible */}
                {isOpen && (
                  <View style={{ marginTop: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 14 }}>

                    {/* Ajuste créditos + descuento de facturación */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                      <Text style={[s.infoLabel, { flex: 1 }]}>Ajuste de créditos (±)</Text>
                      <TextInput
                        style={[s.formInput, { width: 80, marginBottom: 0, paddingVertical: 5, textAlign: 'center' }]}
                        placeholder="±0"
                        placeholderTextColor="#94A3B8"
                        keyboardType="numbers-and-punctuation"
                        value={ajuste[emp.empresa_id] || ''}
                        onChangeText={(v) => setAjuste((a) => ({ ...a, [emp.empresa_id]: v }))}
                      />
                      <Btn
                        label="Aplicar"
                        onPress={() => ajustarCreditos(emp.empresa_id)}
                        disabled={saving === emp.empresa_id}
                        loading={saving === emp.empresa_id}
                        style={{ paddingHorizontal: 14, paddingVertical: 7 }}
                      />
                    </View>

                    {/* Descuento de facturación */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap',
                      backgroundColor: '#FFFBEB', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#FDE68A' }}>
                      <Text style={{ fontSize: 13 }}>🏷️</Text>
                      <Text style={[s.infoLabel, { flex: 1 }]}>
                        Descuento facturación{emp.billing_discount_pct > 0 ? ` · actual: ${emp.billing_discount_pct}%` : ' · sin descuento'}
                      </Text>
                      <TextInput
                        style={[s.formInput, { width: 70, marginBottom: 0, paddingVertical: 5, textAlign: 'center' }]}
                        placeholder="0"
                        placeholderTextColor="#94A3B8"
                        keyboardType="numeric"
                        value={editDto[emp.empresa_id] ?? String(emp.billing_discount_pct ?? 0)}
                        onChangeText={(v) => setEditDto((d) => ({ ...d, [emp.empresa_id]: v }))}
                      />
                      <Text style={[s.infoLabel, { marginRight: 4 }]}>%</Text>
                      <Btn
                        label="Guardar"
                        onPress={() => guardarDescuento(emp.empresa_id)}
                        disabled={savingDto === emp.empresa_id}
                        loading={savingDto === emp.empresa_id}
                        style={{ paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#D97706' }}
                      />
                    </View>

                    {ajusteMsg[emp.empresa_id] && (
                      <Text style={{ fontSize: 11, marginBottom: 10, color: ajusteMsg[emp.empresa_id].type === 'ok' ? '#16A34A' : '#DC2626' }}>
                        {ajusteMsg[emp.empresa_id].text}
                      </Text>
                    )}

                    {loadingDet === emp.empresa_id && (
                      <ActivityIndicator color="#4F46E5" style={{ marginVertical: 16 }} />
                    )}

                    {det && (
                      <View style={s.twoCol}>

                        {/* Col izq: KPIs + usuarios + actividad */}
                        <View style={{ flex: 1, minWidth: 220 }}>
                          <View style={s.kpiGrid2}>
                            <MiniKpi label="Créditos"    value={det.creditos?.saldo_actual ?? 0}          color="#F59E0B" />
                            <MiniKpi label="Pedidos"     value={det.pedidos?.total ?? 0}                  color="#4F46E5" />
                            <MiniKpi label="Usuarios"    value={det.usuarios?.length ?? 0}                color="#0EA5E9" />
                            <MiniKpi label="Storage"     value={det.storage?.total_human ?? '0 B'}        color="#8B5CF6" />
                            <MiniKpi label="Consumo 30d" value={`-${det.creditos?.consumo_30d ?? 0}`}     color="#EF4444" />
                            <MiniKpi label="Recarga 30d" value={`+${det.creditos?.recarga_30d ?? 0}`}     color="#16A34A" />
                          </View>

                          <Text style={[s.sectionTitle, { marginTop: 12 }]}>Usuarios ({det.usuarios?.length ?? 0})</Text>
                          {(det.usuarios || []).map((u, i) => (
                            <FeedRow
                              key={i}
                              icon="👤"
                              iconBg="#EEF2FF"
                              primary={u.nombre || u.email}
                              secondary={u.nombre ? u.email : null}
                              right={
                                <View style={{ gap: 3, alignItems: 'flex-end' }}>
                                  <Badge label={u.rol} color="#475569" bg="#F1F5F9" />
                                  {u.activo === false && <Badge label="inactivo" color="#DC2626" bg="#FEE2E2" />}
                                </View>
                              }
                            />
                          ))}

                          <Text style={[s.sectionTitle, { marginTop: 12 }]}>Estado pedidos</Text>
                          {Object.entries(det.pedidos?.por_estado || {}).map(([est, cnt]) => (
                            <InfoRow
                              key={est}
                              label={est}
                              value={String(cnt)}
                              valueColor={ESTADO_COLORS[est] ?? '#64748B'}
                            />
                          ))}

                          <Text style={[s.sectionTitle, { marginTop: 12 }]}>Almacenamiento</Text>
                          <InfoRow label="Total" value={det.storage?.total_human} />
                          <InfoRow label="Coste/mes" value={det.storage?.coste_mes_eur != null ? `${det.storage.coste_mes_eur.toFixed(4)} €` : '–'} />
                          {(det.storage?.por_tipo || []).map((t, i) => (
                            <InfoRow key={i} label={t.tipo || 'otro'} value={`${t.human} · ${t.count} arch.`} />
                          ))}
                        </View>

                        {/* Col dcha: transacciones */}
                        <View style={{ flex: 1, minWidth: 220 }}>
                          <Text style={s.sectionTitle}>Transacciones ({(det.creditos?.ultimas_tx || []).length})</Text>
                          {(det.creditos?.ultimas_tx || []).length === 0 ? (
                            <Text style={s.emptyText}>Sin transacciones</Text>
                          ) : (det.creditos?.ultimas_tx || []).map((tx, i) => (
                            <FeedRow
                              key={i}
                              icon="💳"
                              iconBg="#FEF9C3"
                              primary={tx.concepto}
                              secondary={tx.fecha?.slice(0, 10)}
                              right={
                                <Text style={[s.rowPrimary, { color: (tx.cantidad ?? 0) >= 0 ? '#16A34A' : '#EF4444' }]}>
                                  {(tx.cantidad ?? 0) >= 0 ? '+' : ''}{tx.cantidad}
                                </Text>
                              }
                            />
                          ))}
                        </View>

                      </View>
                    )}
                  </View>
                )}
              </Card>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Tab: Revendedores
// ─────────────────────────────────────────────────────────────────
function TabRevendedores({ currentUser }) {
  const apiFetch = makeApiFetch(currentUser?.access_token);
  const [revendedores, setRevendedores] = useState([]);
  const [empresas, setEmpresas]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [expanded, setExpanded]         = useState(null);
  const [showNuevo, setShowNuevo]       = useState(false);
  const [nuevoForm, setNuevoForm]       = useState({ email: '', password: '', empresa_nombre: '', discount_pct: '0' });
  const [saving, setSaving]             = useState(false);
  const [msg, setMsg]                   = useState(null);
  const [asignando, setAsignando]       = useState(null);
  const [clienteSearch, setClienteSearch] = useState('');
  const [asignMsg, setAsignMsg]         = useState(null);
  const [confirmQuitar, setConfirmQuitar] = useState(null);
  const [editDescuento, setEditDescuento] = useState(null);

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
    if (!isValidEmail(nuevoForm.email.trim())) {
      setMsg({ type: 'error', text: 'El email no tiene un formato válido' }); return;
    }
    setSaving(true); setMsg(null);
    try {
      await apiFetch('/api/superadmin/revendedores', {
        method: 'POST',
        body: JSON.stringify({
          email: nuevoForm.email.trim(),
          password: nuevoForm.password.trim(),
          empresa_nombre: nuevoForm.empresa_nombre.trim() || undefined,
          discount_pct: parseFloat(nuevoForm.discount_pct) || 0,
        }),
      });
      setMsg({ type: 'ok', text: 'Revendedor creado correctamente' });
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

  if (loading) return <ActivityIndicator style={{ marginTop: 60 }} color="#4F46E5" size="large" />;
  if (error)   return <Text style={s.errorText}>{error}</Text>;

  const resellerClientIds = new Set(revendedores.flatMap((r) => (r.clientes || []).map((c) => c.empresa_id)));
  const resellerIds       = new Set(revendedores.map((r) => r.empresa_id));
  const empresasLibres    = empresas.filter((e) => !resellerClientIds.has(e.empresa_id) && !resellerIds.has(e.empresa_id));
  const empresasFiltradas = clienteSearch.trim()
    ? empresasLibres.filter((e) =>
        (e.admin_email || '').toLowerCase().includes(clienteSearch.toLowerCase()) ||
        (e.empresa_id || '').toLowerCase().includes(clienteSearch.toLowerCase()))
    : empresasLibres;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 10 }}>
      <View style={{ maxWidth: 1100, width: '100%', alignSelf: 'center' }}>

        {/* Cabecera + botón nuevo */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Text style={[s.sectionTitle, { flex: 1, marginBottom: 0 }]}>Revendedores ({revendedores.length})</Text>
          <TouchableOpacity
            style={[s.btn, showNuevo && { backgroundColor: '#64748B' }]}
            onPress={() => { setShowNuevo(!showNuevo); setMsg(null); }}
          >
            <Text style={s.btnText}>{showNuevo ? '✕ Cancelar' : '+ Nuevo revendedor'}</Text>
          </TouchableOpacity>
        </View>

        {/* Formulario nuevo */}
        {showNuevo && (
          <Card>
            <Text style={[s.sectionTitle, { marginBottom: 12 }]}>Crear revendedor</Text>
            <View style={s.twoCol}>
              <View style={{ flex: 1, minWidth: 200 }}>
                <FormField label="Email *" placeholder="distribuidor@empresa.com"
                  value={nuevoForm.email} keyboardType="email-address" autoCapitalize="none"
                  onChangeText={(v) => setNuevoForm((f) => ({ ...f, email: v }))} />
                <FormField label="Contraseña *" placeholder="Mín. 8 caracteres"
                  value={nuevoForm.password} secureTextEntry
                  onChangeText={(v) => setNuevoForm((f) => ({ ...f, password: v }))} />
              </View>
              <View style={{ flex: 1, minWidth: 200 }}>
                <FormField label="Nombre empresa" placeholder="Ej: Flexo Distribución S.L."
                  value={nuevoForm.empresa_nombre}
                  onChangeText={(v) => setNuevoForm((f) => ({ ...f, empresa_nombre: v }))} />
                <FormField label="Descuento (%)" placeholder="0"
                  value={nuevoForm.discount_pct} keyboardType="numeric"
                  onChangeText={(v) => setNuevoForm((f) => ({ ...f, discount_pct: v }))} />
              </View>
            </View>
            {msg && (
              <View style={[s.alertBox, msg.type === 'ok' ? s.alertOk : s.alertErr]}>
                <Text style={s.alertText}>{msg.text}</Text>
              </View>
            )}
            <Btn label="Crear revendedor" onPress={crearRevendedor} loading={saving} disabled={saving} />
          </Card>
        )}

        {/* Lista revendedores */}
        {revendedores.length === 0 ? (
          <Card><Text style={s.emptyText}>No hay revendedores todavía</Text></Card>
        ) : revendedores.map((rev) => (
          <Card key={`rev-${rev.empresa_id}`}>

            {/* Cabecera revendedor */}
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
              onPress={() => setExpanded(expanded === rev.empresa_id ? null : rev.empresa_id)}
            >
              <View style={[s.feedIcon, { backgroundColor: '#EEF2FF', width: 36, height: 36, borderRadius: 10 }]}>
                <Text style={{ fontSize: 16 }}>🤝</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[s.rowPrimary, { fontSize: 14 }]} numberOfLines={1}>{rev.admin_email}</Text>
                <Text style={s.rowSecondary} numberOfLines={1}>
                  {rev.empresa_nombre || rev.empresa_id} · {rev.clientes?.length ?? 0} cliente{(rev.clientes?.length ?? 0) !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Badge label={`${rev.discount_pct ?? 0}% dto.`} color="#166534" bg="#DCFCE7" />
                <Text style={s.rowSecondary}>{rev.creditos ?? 0} cred. · {rev.consumo_total ?? 0} consumido</Text>
              </View>
              <Text style={{ fontSize: 14, color: '#CBD5E1', marginLeft: 6 }}>
                {expanded === rev.empresa_id ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {expanded === rev.empresa_id && (
              <View style={{ marginTop: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 14 }}>
                <View style={s.twoCol}>

                  {/* Izquierda: descuento + finanzas + consumo mensual */}
                  <View style={{ flex: 1, minWidth: 200 }}>
                    <Text style={s.sectionTitle}>Descuento aplicado</Text>
                    {editDescuento?.id === rev.empresa_id ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                        <TextInput
                          style={[s.formInput, { width: 70, marginBottom: 0, paddingVertical: 5 }]}
                          value={editDescuento.value}
                          onChangeText={(v) => setEditDescuento((d) => ({ ...d, value: v }))}
                          keyboardType="numeric"
                        />
                        <Text style={s.infoLabel}>%</Text>
                        <Btn label="✓ Guardar" onPress={() => guardarDescuento(rev.empresa_id, editDescuento.value)}
                          style={{ backgroundColor: '#16A34A', paddingHorizontal: 10, paddingVertical: 6 }} />
                        <TouchableOpacity onPress={() => setEditDescuento(null)}
                          style={[s.btn, { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 6 }]}>
                          <Text style={[s.btnText, { color: '#64748B' }]}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <Text style={[s.infoValue, { fontSize: 16 }]}>{rev.discount_pct ?? 0}%</Text>
                        <TouchableOpacity
                          onPress={() => setEditDescuento({ id: rev.empresa_id, value: String(rev.discount_pct ?? 0) })}
                          style={[s.btn, { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 6 }]}>
                          <Text style={[s.btnText, { color: '#475569' }]}>✎ Editar</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    <InfoRow label="Créditos disponibles"    value={String(rev.creditos ?? 0)}           valueColor="#4F46E5" />
                    <InfoRow label="Consumo este mes"        value={`${rev.coste_mes_actual_eur ?? 0} €`} valueColor="#EF4444" />
                    <InfoRow label="Consumo total acumulado" value={`${rev.coste_total_eur ?? 0} €`}      valueColor="#F59E0B" />

                    {(rev.consumo_mensual || []).length > 0 && (
                      <>
                        <Text style={[s.sectionTitle, { marginTop: 12 }]}>Consumo mensual</Text>
                        {(rev.consumo_mensual || []).map((m, i) => {
                          const mesActual = new Date().toISOString().slice(0, 7);
                          return (
                            <View key={i} style={[s.infoRow, m.mes === mesActual && { backgroundColor: '#FFFBEB' }]}>
                              <Text style={s.infoLabel}>{m.mes}{m.mes === mesActual ? ' ← actual' : ''}</Text>
                              <Text style={[s.infoValue, { color: '#F59E0B' }]}>{m.total}</Text>
                            </View>
                          );
                        })}
                      </>
                    )}
                  </View>

                  {/* Derecha: clientes */}
                  <View style={{ flex: 1, minWidth: 200 }}>
                    <Text style={s.sectionTitle}>Empresas cliente ({rev.clientes?.length ?? 0})</Text>

                    {(rev.clientes || []).length === 0 ? (
                      <Text style={[s.rowSecondary, { marginBottom: 8 }]}>Sin clientes asignados</Text>
                    ) : (rev.clientes || []).map((c) => (
                      <View key={`cli-${c.empresa_id}`} style={[s.feedRow, { flexDirection: 'column', alignItems: 'flex-start', gap: 6 }]}>
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
                            <TouchableOpacity
                              style={[s.btn, { backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 4 }]}
                              onPress={() => setConfirmQuitar({ revendedorId: rev.empresa_id, clienteEmpresaId: c.empresa_id })}
                            >
                              <Text style={[s.btnText, { color: '#DC2626', fontSize: 11 }]}>✕ Quitar</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                        <View style={{ flexDirection: 'row', gap: 5, flexWrap: 'wrap' }}>
                          <Badge
                            label={c.reseller_billing_mode === 'cuota_mensual' ? '📅 Cuota' : '📊 Por uso'}
                            color={c.reseller_billing_mode === 'cuota_mensual' ? '#166534' : '#1D4ED8'}
                            bg={c.reseller_billing_mode === 'cuota_mensual' ? '#F0FDF4' : '#EEF2FF'}
                          />
                          {c.bloqueado && <Badge label="🔒 Bloqueado" color="#DC2626" bg="#FEE2E2" />}
                          {c.reseller_billing_mode === 'cuota_mensual' && (
                            <Badge label={`${rev.suscripcion_eur ?? 0} €/mes`} color="#B45309" bg="#FEF9C3" />
                          )}
                          <Badge label={`Acum: ${c.coste_acumulado_eur ?? 0} €`} color="#B45309" bg="#FFF7ED" />
                          <Badge label={`Mes: ${c.consumo_mes_actual ?? 0} cr`} color="#64748B" bg="#F1F5F9" />
                        </View>
                      </View>
                    ))}

                    {/* Asignar cliente */}
                    {asignando === rev.empresa_id ? (
                      <View style={{ marginTop: 10 }}>
                        <TextInput
                          style={[s.formInput, { marginBottom: 6 }]}
                          value={clienteSearch}
                          onChangeText={setClienteSearch}
                          placeholder="Buscar empresa por email o ID…"
                          placeholderTextColor="#94A3B8"
                          autoCapitalize="none"
                        />
                        {asignMsg && (
                          <View style={[s.alertBox, s.alertErr, { marginBottom: 6 }]}>
                            <Text style={s.alertText}>{asignMsg}</Text>
                          </View>
                        )}
                        {empresasFiltradas.slice(0, 8).map((e) => (
                          <TouchableOpacity
                            key={`libre-${e.empresa_id}`}
                            style={[s.feedRow, { backgroundColor: '#F8FAFC', borderRadius: 6, paddingHorizontal: 8 }]}
                            onPress={() => asignarCliente(rev.empresa_id, e.empresa_id)}
                          >
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <Text style={s.rowPrimary} numberOfLines={1}>{e.admin_email}</Text>
                              <Text style={s.rowSecondary} numberOfLines={1}>{e.empresa_id}</Text>
                            </View>
                            <Text style={{ fontSize: 12, color: '#4F46E5', fontWeight: '700' }}>+ Asignar</Text>
                          </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                          style={[s.btn, { backgroundColor: '#F1F5F9', marginTop: 6 }]}
                          onPress={() => { setAsignando(null); setClienteSearch(''); setAsignMsg(null); }}
                        >
                          <Text style={[s.btnText, { color: '#475569' }]}>Cancelar</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[s.btn, { backgroundColor: '#EEF2FF', marginTop: 10 }]}
                        onPress={() => { setAsignando(rev.empresa_id); setClienteSearch(''); setAsignMsg(null); }}
                      >
                        <Text style={[s.btnText, { color: '#4F46E5' }]}>+ Asignar empresa cliente</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            )}
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Tab: Tarifas
// ─────────────────────────────────────────────────────────────────
const FEATURES_LIST = [
  { key: 'repetidora', label: 'Repetidora', icon: '🔁' },
  { key: 'trapping',   label: 'Trapping',   icon: '🎯' },
  { key: 'troquel',    label: 'Troquel',     icon: '✂️' },
  { key: 'report',     label: 'Informe',     icon: '📄' },
];

function CreditInput({ value, onChange }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <TextInput
        style={[s.formInput, { width: 72, marginBottom: 0, textAlign: 'center', fontSize: 15, fontWeight: '700' }]}
        value={value} keyboardType="numeric"
        placeholderTextColor="#94A3B8"
        onChangeText={onChange}
      />
      <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>cr</Text>
    </View>
  );
}

function TarRow({ label, desc, children, tint }) {
  return (
    <View style={[tarStyles.tarRow, tint && { backgroundColor: tint }]}>
      <View style={{ flex: 1 }}>
        <Text style={tarStyles.tarRowLabel}>{label}</Text>
        {desc ? <Text style={tarStyles.tarRowDesc}>{desc}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function IncludedBadge({ label }) {
  return (
    <View style={tarStyles.includedBadge}>
      <Text style={tarStyles.includedBadgeText}>✓ {label}</Text>
    </View>
  );
}

function TabTarifas({ currentUser }) {
  const apiFetch = makeApiFetch(currentUser?.access_token);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState(null);
  const [base, setBase] = useState({ suscripcion_mensual_eur: '', credito_price_eur: '', storage_cost_eur_per_gb: '' });
  const [costs, setCosts] = useState({ pedido: '', storage_gb: '', features: '', repetidora: '', trapping: '', troquel: '', report: '' });
  const [packs, setPacks] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/superadmin/tarifas');
      setBase({
        suscripcion_mensual_eur: String(data.suscripcion_mensual_eur ?? ''),
        credito_price_eur:       String(data.credito_price_eur ?? ''),
        storage_cost_eur_per_gb: String(data.storage_cost_eur_per_gb ?? ''),
      });
      const cc = data.credit_costs || {};
      setCosts({ pedido: String(cc.pedido ?? ''), storage_gb: String(cc.storage_gb ?? ''),
                 features: String(cc.features ?? ''), repetidora: String(cc.repetidora ?? ''),
                 trapping: String(cc.trapping ?? ''), troquel: String(cc.troquel ?? ''), report: String(cc.report ?? '') });
      setPacks((data.packs || []).map((p) => ({ ...p })));
    } catch (e) { setMsg({ type: 'error', text: e.message }); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      await apiFetch('/api/superadmin/tarifas', {
        method: 'PUT',
        body: JSON.stringify({
          suscripcion_mensual_eur: parseFloat(base.suscripcion_mensual_eur) || 0,
          credito_price_eur:       parseFloat(base.credito_price_eur) || 0,
          storage_cost_eur_per_gb: parseFloat(base.storage_cost_eur_per_gb) || 0,
          packs,
          credit_costs: Object.fromEntries(Object.entries(costs).map(([k, v]) => [k, parseInt(v) || 0])),
        }),
      });
      setMsg({ type: 'ok', text: '✓ Tarifas guardadas correctamente' });
    } catch (e) { setMsg({ type: 'error', text: e.message }); }
    setSaving(false);
  };

  const setC = (k) => (v) => setCosts((c) => ({ ...c, [k]: v }));

  // Mantener storage_gb (créditos) sincronizado con storage_cost_eur_per_gb / credito_price_eur
  useEffect(() => {
    const storageEur  = parseFloat(base.storage_cost_eur_per_gb) || 0;
    const creditoEur  = parseFloat(base.credito_price_eur) || 0;
    if (storageEur > 0 && creditoEur > 0) {
      const derived = Math.round((storageEur / creditoEur) * 100) / 100;
      setCosts((c) => ({ ...c, storage_gb: String(derived) }));
    }
  }, [base.storage_cost_eur_per_gb, base.credito_price_eur]);
  const updatePack = (i, field, raw) =>
    setPacks((prev) => prev.map((p, idx) => idx !== i ? p : {
      ...p,
      [field]: field === 'label' ? raw : (field === 'credits' ? (parseInt(raw) || 0) : (parseFloat(raw) || 0)),
    }));
  const addPack    = () => setPacks((prev) => [...prev, { label: '', credits: 0, price_eur: 0 }]);
  const removePack = (i) => setPacks((prev) => prev.filter((_, idx) => idx !== i));

  if (loading) return <ActivityIndicator style={{ marginTop: 60 }} color="#4F46E5" size="large" />;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
      <View style={{ maxWidth: 980, width: '100%', alignSelf: 'center' }}>

        {msg && (
          <View style={[s.alertBox, msg.type === 'ok' ? s.alertOk : s.alertErr, { marginBottom: 16 }]}>
            <Text style={s.alertText}>{msg.text}</Text>
          </View>
        )}

        {/* ══ DOS COLUMNAS: mensual | créditos ══ */}
        <View style={s.twoCol}>

          {/* ── Plan Mensual ─────────────────────────── */}
          <View style={{ flex: 1, minWidth: 280 }}>
            <View style={tarStyles.planHeader}>
              <Text style={tarStyles.planIcon}>📅</Text>
              <View>
                <Text style={tarStyles.planTitle}>Plan Mensual</Text>
                <Text style={tarStyles.planSub}>Cuota fija + costes variables</Text>
              </View>
            </View>
            <Card style={{ padding: 0, overflow: 'hidden' }}>

              {/* Cuota mensual */}
              <View style={[tarStyles.tarSection, { backgroundColor: '#F0FDF4' }]}>
                <Text style={tarStyles.tarSectionTitle}>💰 Cuota fija</Text>
                <TarRow label="Cuota mensual" desc="Facturada automáticamente cada mes">
                  <View style={tarStyles.inputRow}>
                    <Text style={tarStyles.prefix}>€</Text>
                    <TextInput style={[s.formInput, tarStyles.inputWithPrefix, { width: 90 }]}
                      value={base.suscripcion_mensual_eur} placeholder="29.99"
                      placeholderTextColor="#94A3B8" keyboardType="decimal-pad"
                      onChangeText={(v) => setBase((b) => ({ ...b, suscripcion_mensual_eur: v }))} />
                    <Text style={tarStyles.suffix}>/mes</Text>
                  </View>
                </TarRow>
              </View>

              {/* Almacenamiento — único coste variable en plan mensual */}
              <View style={tarStyles.tarSection}>
                <Text style={tarStyles.tarSectionTitle}>📦 Almacenamiento (coste variable)</Text>
                <Text style={{ fontSize: 11, color: '#94A3B8', marginBottom: 8 }}>
                  Se suma a la cuota mensual. Crece con el espacio ocupado por los archivos PDF de los trabajos.
                </Text>
                <TarRow label="Almacenamiento" desc="Acumulativo — mayor uso = mayor coste mensual">
                  <View style={tarStyles.inputRow}>
                    <Text style={tarStyles.prefix}>€</Text>
                    <TextInput style={[s.formInput, tarStyles.inputWithPrefix, { width: 80 }]}
                      value={base.storage_cost_eur_per_gb} placeholder="0.10"
                      placeholderTextColor="#94A3B8" keyboardType="decimal-pad"
                      onChangeText={(v) => setBase((b) => ({ ...b, storage_cost_eur_per_gb: v }))} />
                    <Text style={tarStyles.suffix}>/GB·mes</Text>
                  </View>
                </TarRow>
              </View>

              {/* Features incluidas */}
              <View style={[tarStyles.tarSection, { borderBottomWidth: 0 }]}>
                <Text style={tarStyles.tarSectionTitle}>✅ Incluido en la cuota</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingTop: 4 }}>
                  {FEATURES_LIST.map((f) => (
                    <IncludedBadge key={f.key} label={`${f.icon} ${f.label}`} />
                  ))}
                </View>
              </View>

            </Card>
          </View>

          {/* ── Plan Por Créditos ────────────────────── */}
          <View style={{ flex: 1, minWidth: 280 }}>
            <View style={[tarStyles.planHeader, { backgroundColor: '#EEF2FF' }]}>
              <Text style={tarStyles.planIcon}>💳</Text>
              <View>
                <Text style={tarStyles.planTitle}>Plan Por Créditos</Text>
                <Text style={tarStyles.planSub}>Pago por uso — solo lo que consumes</Text>
              </View>
            </View>
            <Card style={{ padding: 0, overflow: 'hidden' }}>

              {/* Precio crédito */}
              <View style={[tarStyles.tarSection, { backgroundColor: '#EEF2FF' }]}>
                <Text style={tarStyles.tarSectionTitle}>💰 Precio del crédito</Text>
                <TarRow label="Coste por crédito" desc="Precio de referencia para facturación">
                  <View style={tarStyles.inputRow}>
                    <Text style={tarStyles.prefix}>€</Text>
                    <TextInput style={[s.formInput, tarStyles.inputWithPrefix, { width: 90 }]}
                      value={base.credito_price_eur} placeholder="0.10"
                      placeholderTextColor="#94A3B8" keyboardType="decimal-pad"
                      onChangeText={(v) => setBase((b) => ({ ...b, credito_price_eur: v }))} />
                    <Text style={tarStyles.suffix}>/crédito</Text>
                  </View>
                </TarRow>
              </View>

              {/* Costes variables */}
              <View style={tarStyles.tarSection}>
                <Text style={tarStyles.tarSectionTitle}>📊 Costes por uso</Text>
                <TarRow label="Por pedido" desc="Descontado al crear cada pedido">
                  <CreditInput value={costs.pedido} onChange={setC('pedido')} />
                </TarRow>
                <TarRow label="Almacenamiento" desc="Calculado desde el plan mensual">
                  <View style={{ alignItems: 'flex-end', gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4,
                      backgroundColor: '#F1F5F9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
                      borderWidth: 1, borderColor: '#E2E8F0' }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}>{costs.storage_gb || '—'}</Text>
                      <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>cr</Text>
                    </View>
                    <Text style={{ fontSize: 10, color: '#94A3B8' }}>
                      🔗 {base.storage_cost_eur_per_gb || '?'} € ÷ {base.credito_price_eur || '?'} €/cr
                    </Text>
                  </View>
                </TarRow>
              </View>

              {/* Features — cuota única */}
              <View style={[tarStyles.tarSection, { borderBottomWidth: 0 }]}>
                <Text style={tarStyles.tarSectionTitle}>⚡ Features — cuota única por pedido</Text>
                <Text style={{ fontSize: 11, color: '#94A3B8', marginBottom: 8 }}>
                  Se cobra una sola vez por pedido si se usa cualquiera de estas acciones, independientemente de cuántas veces se repita.
                </Text>
                <TarRow label="Cuota por pedido con features" desc="Repetidora · Trapping · Troquel · Informe" tint="#FFFBEB">
                  <CreditInput value={costs.features} onChange={setC('features')} />
                </TarRow>
              </View>

            </Card>
          </View>

        </View>

        {/* ── Packs de créditos ── */}
        <SectionHeader title="Packs de créditos" />
        <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: -8, marginBottom: 10 }}>
          Paquetes de recarga disponibles para compra (plan por créditos)
        </Text>
        <Card style={{ marginBottom: 12 }}>
          <View style={tarStyles.tableHeader}>
            <Text style={[tarStyles.thCell, { flex: 3 }]}>Etiqueta</Text>
            <Text style={[tarStyles.thCell, { flex: 2, textAlign: 'center' }]}>Créditos</Text>
            <Text style={[tarStyles.thCell, { flex: 2, textAlign: 'center' }]}>Precio €</Text>
            <Text style={[tarStyles.thCell, { flex: 2, textAlign: 'right' }]}>€/crédito</Text>
            <View style={{ width: 36 }} />
          </View>
          {packs.length === 0 && (
            <Text style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center', paddingVertical: 16 }}>
              Sin packs — pulsa «＋ Añadir pack»
            </Text>
          )}
          {packs.map((p, i) => {
            const ratio = p.credits > 0 && p.price_eur > 0 ? (p.price_eur / p.credits).toFixed(4) : '—';
            return (
              <View key={i} style={[tarStyles.tableRow, i % 2 === 0 && tarStyles.tableRowAlt]}>
                <TextInput style={[s.formInput, tarStyles.tdInput, { flex: 3 }]}
                  value={p.label} placeholder="Ej: Pack Básico" placeholderTextColor="#CBD5E1"
                  onChangeText={(v) => updatePack(i, 'label', v)} />
                <TextInput style={[s.formInput, tarStyles.tdInput, { flex: 2, textAlign: 'center' }]}
                  value={String(p.credits)} keyboardType="numeric" placeholderTextColor="#CBD5E1"
                  onChangeText={(v) => updatePack(i, 'credits', v)} />
                <TextInput style={[s.formInput, tarStyles.tdInput, { flex: 2, textAlign: 'center' }]}
                  value={String(p.price_eur)} keyboardType="decimal-pad" placeholderTextColor="#CBD5E1"
                  onChangeText={(v) => updatePack(i, 'price_eur', v)} />
                <Text style={[tarStyles.tdRatio, { flex: 2 }]}>{ratio}</Text>
                <TouchableOpacity onPress={() => removePack(i)} style={tarStyles.removeBtn}>
                  <Text style={{ color: '#EF4444', fontSize: 16, lineHeight: 20 }}>✕</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </Card>
        <TouchableOpacity onPress={addPack} style={tarStyles.addPackBtn}>
          <Text style={tarStyles.addPackTxt}>＋ Añadir pack</Text>
        </TouchableOpacity>

        {/* ── Guardar ── */}
        <View style={{ marginTop: 24, flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Btn label="Guardar todo" onPress={save} loading={saving} disabled={saving} />
        </View>

      </View>
    </ScrollView>
  );
}

const tarStyles = StyleSheet.create({
  tarSection:       { paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderColor: '#E2E8F0' },
  tarSectionTitle:  { fontSize: 12, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  tarRow:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6, paddingHorizontal: 4, borderRadius: 6, marginBottom: 2 },
  tarRowLabel:      { fontSize: 13, color: '#0F172A', fontWeight: '500', flex: 1 },
  tarRowDesc:       { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  planHeader:       { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: '#F0FDF4', borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  planIcon:         { fontSize: 22 },
  planTitle:        { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  planSub:          { fontSize: 11, color: '#64748B', marginTop: 1 },
  includedBadge:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 4, alignSelf: 'flex-start' },
  includedBadgeText:{ fontSize: 12, color: '#15803D', fontWeight: '600' },
  inputRow:        { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  prefix:          { fontSize: 13, color: '#64748B', fontWeight: '600', paddingHorizontal: 8,
                     backgroundColor: '#F1F5F9', borderWidth: 1.5, borderColor: '#E2E8F0',
                     borderRightWidth: 0, borderTopLeftRadius: 8, borderBottomLeftRadius: 8,
                     paddingVertical: 9, minWidth: 28, textAlign: 'center' },
  suffix:          { fontSize: 12, color: '#64748B', paddingHorizontal: 8, paddingVertical: 9,
                     backgroundColor: '#F1F5F9', borderWidth: 1.5, borderColor: '#E2E8F0',
                     borderLeftWidth: 0, borderTopRightRadius: 8, borderBottomRightRadius: 8 },
  inputWithPrefix: { flex: 1, borderRadius: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0,
                     borderTopLeftRadius: 0, borderBottomLeftRadius: 0, marginBottom: 0 },
  tableHeader:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 8,
                     borderBottomWidth: 1.5, borderColor: '#E2E8F0', marginBottom: 4 },
  thCell:          { fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.4 },
  tableRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5, borderRadius: 6 },
  tableRowAlt:     { backgroundColor: '#F8FAFC' },
  tdInput:         { marginBottom: 0, paddingVertical: 7, fontSize: 13 },
  tdRatio:         { fontSize: 12, color: '#94A3B8', textAlign: 'right', fontVariant: ['tabular-nums'] },
  removeBtn:       { width: 36, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  addPackBtn:      { borderWidth: 1.5, borderColor: '#C7D2FE', borderStyle: 'dashed', borderRadius: 8,
                     paddingVertical: 10, alignItems: 'center', backgroundColor: '#EEF2FF' },
  addPackTxt:      { color: '#4F46E5', fontWeight: '600', fontSize: 14 },
});

// ─────────────────────────────────────────────────────────────────
// Tab: Promos
// ─────────────────────────────────────────────────────────────────
function TabPromos({ currentUser }) {
  const apiFetch = makeApiFetch(currentUser?.access_token);
  const [promos, setPromos]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [creating, setCreating] = useState(false);
  const [msg, setMsg]           = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(null);
  const [form, setForm]         = useState({ credits: '50', prefix: 'PROMO', max_uses: '1', expires_at: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try { setPromos((await apiFetch('/api/superadmin/promos')).promos || []); }
    catch (_) {}
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
        credits:    parseInt(form.credits),
        prefix:     form.prefix || 'PROMO',
        max_uses:   parseInt(form.max_uses) || 1,
        expires_at: form.expires_at || null,
      };
      const res = await apiFetch('/api/superadmin/promos', { method: 'POST', body: JSON.stringify(payload) });
      setMsg({ type: 'ok', text: `Código creado: ${res.promo.code}` });
      load();
    } catch (e) { setMsg({ type: 'error', text: e.message }); }
    setCreating(false);
  };

  const toggle = async (code) => {
    try { await apiFetch(`/api/superadmin/promos/${code}/toggle`, { method: 'POST' }); load(); }
    catch (e) { setMsg({ type: 'error', text: e.message }); }
  };

  const remove = async (code) => {
    try {
      await apiFetch(`/api/superadmin/promos/${code}`, { method: 'DELETE' });
      setConfirmingDelete(null); load();
    } catch (e) { setMsg({ type: 'error', text: e.message }); }
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      <View style={{ maxWidth: 1100, width: '100%', alignSelf: 'center', gap: 14 }}>
        <View style={s.twoCol}>

          {/* Formulario creación */}
          <View style={{ flex: 1, minWidth: 220 }}>
            <SectionHeader title="Nuevo código promocional" />
            <Card>
              <FormField label="Prefijo" placeholder="PROMO"
                value={form.prefix} onChangeText={(v) => setForm((f) => ({ ...f, prefix: v }))} placeholderTextColor="#94A3B8" />
              <FormField label="Créditos" placeholder="50"
                value={form.credits} keyboardType="numeric"
                onChangeText={(v) => setForm((f) => ({ ...f, credits: v }))} />
              <FormField label="Usos máximos" placeholder="1"
                value={form.max_uses} keyboardType="numeric"
                onChangeText={(v) => setForm((f) => ({ ...f, max_uses: v }))} />
              {Platform.OS === 'web' && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={s.formLabel}>Caduca (opcional)</Text>
                  <input type="date"
                    style={{ height: 38, borderRadius: 8, border: '1.5px solid #E2E8F0', backgroundColor: '#F8FAFC', padding: '0 10px', fontSize: 13, color: '#0F172A', width: '100%' }}
                    value={form.expires_at?.slice(0, 10) || ''}
                    onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value ? `${e.target.value}T23:59:59Z` : '' }))}
                  />
                </View>
              )}
              {msg && (
                <View style={[s.alertBox, msg.type === 'ok' ? s.alertOk : s.alertErr, { marginBottom: 8 }]}>
                  <Text style={s.alertText}>{msg.text}</Text>
                </View>
              )}
              <Btn label="+ Generar código" onPress={create} loading={creating} disabled={creating} />
            </Card>
          </View>

          {/* Lista de códigos */}
          <View style={{ flex: 2, minWidth: 280 }}>
            <SectionHeader title={`Códigos existentes (${promos.length})`} />
            {loading ? <ActivityIndicator color="#4F46E5" /> : promos.length === 0 ? (
              <Text style={s.emptyText}>Sin códigos aún</Text>
            ) : (
              <Card>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ minWidth: 480 }}>
                    <View style={s.tblHead}>
                      <Text style={[s.tblCol, { flex: 3, minWidth: 130 }]}>Código</Text>
                      <Text style={[s.tblCol, { width: 54, textAlign: 'center' }]}>Cred</Text>
                      <Text style={[s.tblCol, { width: 54, textAlign: 'center' }]}>Usos</Text>
                      <Text style={[s.tblCol, { width: 90, textAlign: 'center' }]}>Caduca</Text>
                      <Text style={[s.tblCol, { width: 90, textAlign: 'center' }]}>Acciones</Text>
                    </View>
                    {promos.map((p) => (
                      <View key={p.code}>
                        <View style={s.tblRow}>
                          <View style={{ flex: 3, minWidth: 0 }}>
                            <Text style={s.promoCode} numberOfLines={1}>{p.code}</Text>
                          </View>
                          <Text style={{ width: 54, fontSize: 12, fontWeight: '700', color: '#F59E0B', textAlign: 'center' }}>{p.credits}</Text>
                          <Text style={{ width: 54, fontSize: 12, color: '#64748B', textAlign: 'center' }}>{p.uses}/{p.max_uses}</Text>
                          <Text style={{ width: 90, fontSize: 11, color: '#94A3B8', textAlign: 'center' }}>
                            {p.expires_at ? p.expires_at.slice(0, 10) : '∞'}
                          </Text>
                          <View style={{ width: 90, flexDirection: 'row', gap: 4, justifyContent: 'center' }}>
                            <TouchableOpacity
                              style={[s.smallBtn, p.active ? s.smallBtnOk : s.smallBtnGray]}
                              onPress={() => toggle(p.code)}
                            >
                              <Text style={s.smallBtnText}>{p.active ? '✓' : '✗'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[s.smallBtn, s.smallBtnDanger]}
                              onPress={() => setConfirmingDelete(p.code)}
                            >
                              <Text style={s.smallBtnText}>🗑</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                        {confirmingDelete === p.code && (
                          <View style={s.confirmRow}>
                            <Text style={s.confirmText}>¿Eliminar el código {p.code}?</Text>
                            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                              <TouchableOpacity
                                style={[s.btn, { flex: 1, backgroundColor: '#F1F5F9' }]}
                                onPress={() => setConfirmingDelete(null)}
                              >
                                <Text style={[s.btnText, { color: '#475569' }]}>Cancelar</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[s.btn, { flex: 1, backgroundColor: '#DC2626' }]}
                                onPress={() => remove(p.code)}
                              >
                                <Text style={s.btnText}>Eliminar</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </Card>
            )}
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
  const [status, setStatus]             = useState(null);
  const [loading, setLoading]           = useState(true);
  const [restarting, setRestarting]     = useState(false);
  const [confirmingRestart, setConfirmingRestart] = useState(false);
  const [msg, setMsg]                   = useState(null);
  const [cuentaForm, setCuentaForm]     = useState({ email: '', password: '', password2: '' });
  const [savingCuenta, setSavingCuenta] = useState(false);
  const [msgCuenta, setMsgCuenta]       = useState(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try { setStatus(await apiFetch('/api/superadmin/status')); }
    catch (e) { setMsg({ type: 'error', text: e.message }); }
    setLoading(false);
  }, [currentUser?.access_token]);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const handleRestart = async () => {
    setRestarting(true); setConfirmingRestart(false); setMsg(null);
    try { await apiFetch('/api/superadmin/restart', { method: 'POST' }); } catch (_) {}

    // Esperar 4s antes de empezar a sondear — el servidor necesita tiempo para cerrar
    setMsg({ type: 'ok', text: 'Reiniciando… esperando 4 s antes de comprobar' });
    await new Promise((r) => setTimeout(r, 4000));

    let attempts = 0;
    const MAX = 20;
    const INTERVAL = 2500;
    setMsg({ type: 'ok', text: `Comprobando si el servidor ha vuelto… (0/${MAX})` });

    const poll = setInterval(async () => {
      attempts++;
      setMsg({ type: 'ok', text: `Comprobando si el servidor ha vuelto… (${attempts}/${MAX})` });
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        await fetch(`${API_BASE}/api/superadmin/status`, {
          headers: { Authorization: `Bearer ${currentUser?.access_token}` },
          signal: controller.signal,
        });
        clearTimeout(timeout);
        clearInterval(poll);
        setMsg({ type: 'ok', text: '✓ Servidor online de nuevo' });
        setRestarting(false);
        loadStatus();
      } catch (_) {
        if (attempts >= MAX) {
          clearInterval(poll);
          setMsg({ type: 'error', text: `El servidor no respondió tras ${MAX} intentos. Reinícialo manualmente.` });
          setRestarting(false);
        }
      }
    }, INTERVAL);
  };

  const saveCuenta = async () => {
    if (cuentaForm.password && cuentaForm.password !== cuentaForm.password2) {
      setMsgCuenta({ type: 'error', text: 'Las contraseñas no coinciden' }); return;
    }
    if (cuentaForm.email.trim() && !isValidEmail(cuentaForm.email.trim())) {
      setMsgCuenta({ type: 'error', text: 'El email no tiene un formato válido' }); return;
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
      <View style={{ maxWidth: 900, width: '100%', alignSelf: 'center', gap: 14 }}>
        <View style={s.twoCol}>

          {/* Estado + acciones */}
          <View style={{ flex: 1, minWidth: 220 }}>
            <SectionHeader title="Estado del servidor" />
            {loading ? <ActivityIndicator color="#4F46E5" /> : (
              <Card>
                <StatusDot online={!!status} />
                <View style={{ height: 1, backgroundColor: '#F1F5F9', marginVertical: 10 }} />
                <View style={s.kpiGrid2}>
                  <MiniKpi label="Uptime"   value={status?.uptime || '–'}                          color="#16A34A" />
                  <MiniKpi label="Memoria"  value={status?.mem_mb ? `${status.mem_mb} MB` : '–'}  color="#0EA5E9" />
                </View>
                <InfoRow label="PID"    value={status?.pid} />
                <InfoRow label="Python" value={status?.python_version?.split(' ')[0]} />
              </Card>
            )}

            {msg && (
              <View style={[s.alertBox, msg.type === 'ok' ? s.alertOk : s.alertErr, { marginTop: 8 }]}>
                <Text style={s.alertText}>{msg.text}</Text>
              </View>
            )}

            <TouchableOpacity style={[s.btn, { backgroundColor: '#EEF2FF', marginTop: 8 }]} onPress={loadStatus}>
              <Text style={[s.btnText, { color: '#4F46E5' }]}>↻ Actualizar estado</Text>
            </TouchableOpacity>

            <SectionHeader title="Acciones peligrosas" />
            {confirmingRestart ? (
              <Card style={{ borderColor: '#FECACA', borderWidth: 1.5, backgroundColor: '#FEF2F2' }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#B91C1C', marginBottom: 12 }}>
                  ¿Reiniciar el servidor? La app tardará unos segundos en volver.
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity style={[s.btn, { flex: 1, backgroundColor: '#F1F5F9' }]} onPress={() => setConfirmingRestart(false)}>
                    <Text style={[s.btnText, { color: '#475569' }]}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.btn, { flex: 1, backgroundColor: '#DC2626' }]} onPress={handleRestart} disabled={restarting}>
                    {restarting ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={s.btnText}>Sí, reiniciar</Text>}
                  </TouchableOpacity>
                </View>
              </Card>
            ) : (
              <TouchableOpacity style={[s.btn, { backgroundColor: '#DC2626', marginTop: 0 }]} onPress={() => setConfirmingRestart(true)}>
                <Text style={s.btnText}>⟳ Reiniciar servidor</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Mi cuenta */}
          <View style={{ flex: 1, minWidth: 220 }}>
            <SectionHeader title="Mi cuenta (root)" />
            <Card>
              <FormField label="Nuevo email" placeholder="nuevo@email.com"
                value={cuentaForm.email} keyboardType="email-address" autoCapitalize="none"
                onChangeText={(v) => setCuentaForm((f) => ({ ...f, email: v }))} />
              <FormField label="Nueva contraseña" placeholder="mín. 8 caracteres"
                value={cuentaForm.password} secureTextEntry
                onChangeText={(v) => setCuentaForm((f) => ({ ...f, password: v }))} />
              <FormField label="Repetir contraseña" placeholder="repite la contraseña"
                value={cuentaForm.password2} secureTextEntry
                onChangeText={(v) => setCuentaForm((f) => ({ ...f, password2: v }))} />
              {msgCuenta && (
                <View style={[s.alertBox, msgCuenta.type === 'ok' ? s.alertOk : s.alertErr]}>
                  <Text style={s.alertText}>{msgCuenta.text}</Text>
                </View>
              )}
              <Btn label="Guardar cambios" onPress={saveCuenta} loading={savingCuenta} disabled={savingCuenta} />
            </Card>
          </View>

        </View>
      </View>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Tab: Financiero (MRR / ARR / ingresos)
// ─────────────────────────────────────────────────────────────────
function TabFinanciero({ currentUser }) {
  const apiFetch = makeApiFetch(currentUser?.access_token);
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try { setData(await apiFetch('/api/superadmin/revenue')); }
    catch (e) { setError(e.message); }
    if (isRefresh) setRefreshing(false); else setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <ActivityIndicator style={{ marginTop: 60 }} color="#4F46E5" size="large" />;
  if (error)   return <Text style={s.errorText}>{error}</Text>;

  const mesActual = new Date().toISOString().slice(0, 7);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 14 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
    >
      <View style={{ maxWidth: 1100, width: '100%', alignSelf: 'center' }}>

        {/* KPIs principales */}
        <View style={s.kpiGrid}>
          <KpiCard icon="📈" label="MRR estimado"    value={`${data.mrr} €`}                  color="#10B981" sub="Mes en curso" />
          <KpiCard icon="🗓️" label="ARR estimado"    value={`${data.arr} €`}                   color="#4F46E5" sub="MRR × 12" />
          <KpiCard icon="🔄" label="Ingresos suscr." value={`${data.mrr_suscripcion} €/mes`}   color="#0EA5E9" sub={`${data.num_suscripcion} cuentas`} />
          <KpiCard icon="💰" label="Ingresos cred."  value={`${data.ingreso_creditos_mes} €`}  color="#F59E0B" sub="Este mes" />
          <KpiCard icon="💶" label="Precio crédito"  value={`${data.precio_credito_eur} €`}    color="#8B5CF6" />
          <KpiCard icon="📋" label="Precio suscr."   value={`${data.precio_suscripcion_eur} €/mes`} color="#64748B" />
        </View>

        {/* Distribución de modelos */}
        <View style={s.twoCol}>
          <View style={{ flex: 1, minWidth: 200 }}>
            <SectionHeader title="Distribución de planes" />
            <Card>
              <InfoRow label="Suscripción" value={`${data.num_suscripcion} empresas`} valueColor="#0EA5E9" />
              <InfoRow label="Créditos"    value={`${data.num_creditos} empresas`}    valueColor="#F59E0B" />
              <InfoRow label="Revendedor"  value={`${data.num_revendedor} empresas`}  valueColor="#8B5CF6" />
              <InfoRow label="Total"       value={`${data.num_suscripcion + data.num_creditos + data.num_revendedor} empresas`} />
            </Card>
          </View>

          {/* Ingresos por créditos por mes */}
          <View style={{ flex: 2, minWidth: 280 }}>
            <SectionHeader title="Ingresos por compras de créditos (últimos 12 meses)" />
            <Card>
              <View style={s.tblHead}>
                <Text style={[s.tblCol, { flex: 2 }]}>Mes</Text>
                <Text style={[s.tblCol, { flex: 1, textAlign: 'right' }]}>Créditos</Text>
                <Text style={[s.tblCol, { flex: 1, textAlign: 'right' }]}>Ingresos</Text>
              </View>
              {(data.ingresos_por_mes || []).length === 0 ? (
                <Text style={s.emptyText}>Sin compras registradas</Text>
              ) : (data.ingresos_por_mes || []).map((m) => (
                <View key={m.mes} style={[s.tblRow, m.mes === mesActual && { backgroundColor: '#F0FDF4' }]}>
                  <Text style={[s.rowPrimary, { flex: 2 }]}>{m.mes}{m.mes === mesActual ? ' ← actual' : ''}</Text>
                  <Text style={{ flex: 1, fontSize: 12, color: '#F59E0B', fontWeight: '700', textAlign: 'right' }}>{m.creditos}</Text>
                  <Text style={{ flex: 1, fontSize: 12, color: '#10B981', fontWeight: '700', textAlign: 'right' }}>{m.eur} €</Text>
                </View>
              ))}
            </Card>
          </View>
        </View>

        {/* Nuevas suscripciones por mes */}
        {(data.nuevas_subs_por_mes || []).length > 0 && (
          <View>
            <SectionHeader title="Nuevas suscripciones por mes" />
            <Card>
              <View style={s.tblHead}>
                <Text style={[s.tblCol, { flex: 2 }]}>Mes</Text>
                <Text style={[s.tblCol, { flex: 1, textAlign: 'right' }]}>Nuevas</Text>
              </View>
              {(data.nuevas_subs_por_mes || []).map((m) => (
                <View key={m.mes} style={[s.tblRow, m.mes === mesActual && { backgroundColor: '#EEF2FF' }]}>
                  <Text style={[s.rowPrimary, { flex: 2 }]}>{m.mes}{m.mes === mesActual ? ' ← actual' : ''}</Text>
                  <Text style={{ flex: 1, fontSize: 12, color: '#4F46E5', fontWeight: '700', textAlign: 'right' }}>{m.nuevas}</Text>
                </View>
              ))}
            </Card>
          </View>
        )}

      </View>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Tab: Riesgo de churn
// ─────────────────────────────────────────────────────────────────
function TabRiesgo({ currentUser }) {
  const apiFetch = makeApiFetch(currentUser?.access_token);
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState(null);
  const [filtro, setFiltro]     = useState('todos');  // todos | alto | medio | bajo

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try { setData(await apiFetch('/api/superadmin/growth')); }
    catch (e) { setError(e.message); }
    if (isRefresh) setRefreshing(false); else setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const RIESGO_COLOR = { alto: '#EF4444', medio: '#F59E0B', bajo: '#10B981' };
  const RIESGO_BG    = { alto: '#FEE2E2', medio: '#FEF9C3', bajo: '#DCFCE7' };

  if (loading) return <ActivityIndicator style={{ marginTop: 60 }} color="#4F46E5" size="large" />;
  if (error)   return <Text style={s.errorText}>{error}</Text>;

  const enRiesgoFiltrado = (data.en_riesgo || []).filter(
    (e) => filtro === 'todos' || e.nivel_riesgo === filtro
  );
  const numAlto  = (data.en_riesgo || []).filter((e) => e.nivel_riesgo === 'alto').length;
  const numMedio = (data.en_riesgo || []).filter((e) => e.nivel_riesgo === 'medio').length;
  const numBajo  = (data.en_riesgo || []).filter((e) => e.nivel_riesgo === 'bajo').length;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 14 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
    >
      <View style={{ maxWidth: 1100, width: '100%', alignSelf: 'center' }}>

        {/* KPIs */}
        <View style={s.kpiGrid}>
          <KpiCard icon="🏢" label="Total empresas"   value={data.total_empresas}           color="#4F46E5" />
          <KpiCard icon="✅" label="Activas (30d)"    value={data.activas_30d}               color="#10B981" sub={`${data.tasa_actividad_pct}% del total`} />
          <KpiCard icon="⚡" label="Activas (7d)"     value={data.activas_7d}                color="#0EA5E9" />
          <KpiCard icon="🔴" label="Riesgo alto"      value={numAlto}                        color="#EF4444" />
          <KpiCard icon="🟡" label="Riesgo medio"     value={numMedio}                       color="#F59E0B" />
          <KpiCard icon="🟢" label="Riesgo bajo"      value={numBajo}                        color="#16A34A" />
        </View>

        {/* Filtros de nivel */}
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {['todos', 'alto', 'medio', 'bajo'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[s.btn, filtro === f ? {} : { backgroundColor: '#F1F5F9' }, { paddingHorizontal: 14, paddingVertical: 7 }]}
              onPress={() => setFiltro(f)}
            >
              <Text style={[s.btnText, filtro !== f && { color: '#475569' }]}>
                {f === 'todos' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Lista empresas en riesgo */}
        <SectionHeader title={`Empresas en riesgo (${enRiesgoFiltrado.length})`} />
        {enRiesgoFiltrado.length === 0 ? (
          <Card><Text style={s.emptyText}>No hay empresas en ese nivel de riesgo</Text></Card>
        ) : (
          <Card>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ minWidth: 620 }}>
                <View style={s.tblHead}>
                  <Text style={[s.tblCol, { flex: 3, minWidth: 160 }]}>Empresa</Text>
                  <Text style={[s.tblCol, { width: 60, textAlign: 'center' }]}>Riesgo</Text>
                  <Text style={[s.tblCol, { width: 60, textAlign: 'right' }]}>Cred.</Text>
                  <Text style={[s.tblCol, { width: 70, textAlign: 'right' }]}>Ped. total</Text>
                  <Text style={[s.tblCol, { width: 60, textAlign: 'right' }]}>Ped. 30d</Text>
                  <Text style={[s.tblCol, { width: 110, textAlign: 'right' }]}>Último pedido</Text>
                </View>
                {enRiesgoFiltrado.map((emp) => (
                  <View key={emp.empresa_id} style={s.tblRow}>
                    <View style={{ flex: 3, minWidth: 0 }}>
                      <Text style={s.rowPrimary} numberOfLines={1}>{emp.admin_email}</Text>
                      <Badge
                        label={emp.billing_model}
                        color={emp.billing_model === 'suscripcion' ? '#4F46E5' : '#B45309'}
                        bg={emp.billing_model === 'suscripcion' ? '#EEF2FF' : '#FEF9C3'}
                      />
                    </View>
                    <View style={{ width: 60, alignItems: 'center' }}>
                      <Badge
                        label={emp.nivel_riesgo}
                        color={RIESGO_COLOR[emp.nivel_riesgo]}
                        bg={RIESGO_BG[emp.nivel_riesgo]}
                      />
                    </View>
                    <Text style={{ width: 60, fontSize: 12, fontWeight: '700', color: '#F59E0B', textAlign: 'right' }}>{emp.creditos}</Text>
                    <Text style={{ width: 70, fontSize: 12, color: '#64748B', textAlign: 'right' }}>{emp.total_pedidos}</Text>
                    <Text style={{ width: 60, fontSize: 12, color: emp.pedidos_30d > 0 ? '#10B981' : '#EF4444', fontWeight: '700', textAlign: 'right' }}>{emp.pedidos_30d}</Text>
                    <Text style={{ width: 110, fontSize: 10, color: '#94A3B8', textAlign: 'right' }} numberOfLines={1}>
                      {emp.ultimo_pedido ? emp.ultimo_pedido.slice(0, 10) : 'Nunca'}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </Card>
        )}

        {/* Empresas nuevas por mes */}
        {(data.empresas_por_mes || []).length > 0 && (
          <View>
            <SectionHeader title="Nuevas empresas por mes" />
            <Card>
              <View style={s.tblHead}>
                <Text style={[s.tblCol, { flex: 2 }]}>Mes</Text>
                <Text style={[s.tblCol, { flex: 1, textAlign: 'right' }]}>Nuevas empresas</Text>
              </View>
              {(data.empresas_por_mes || []).map((m) => {
                const mesActual = new Date().toISOString().slice(0, 7);
                return (
                  <View key={m.mes} style={[s.tblRow, m.mes === mesActual && { backgroundColor: '#EEF2FF' }]}>
                    <Text style={[s.rowPrimary, { flex: 2 }]}>{m.mes}{m.mes === mesActual ? ' ← actual' : ''}</Text>
                    <Text style={{ flex: 1, fontSize: 12, color: '#4F46E5', fontWeight: '700', textAlign: 'right' }}>{m.nuevas}</Text>
                  </View>
                );
              })}
            </Card>
          </View>
        )}

      </View>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Tab: Auditoría
// ─────────────────────────────────────────────────────────────────
function TabAuditoria({ currentUser }) {
  const apiFetch = makeApiFetch(currentUser?.access_token);
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [page, setPage]         = useState(1);
  const [filterAction, setFilterAction] = useState('');
  const [filterEmail, setFilterEmail]   = useState('');

  const load = useCallback(async (p = 1, action = '', email = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, per_page: 50 });
      if (action) params.append('action', action);
      if (email)  params.append('email', email);
      setData(await apiFetch(`/api/superadmin/audit?${params}`));
      setPage(p);
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(1); }, [load]);

  const ACTION_COLOR = {
    login: '#10B981', logout: '#64748B', create: '#4F46E5', update: '#F59E0B',
    delete: '#EF4444', superadmin_notify: '#8B5CF6', superadmin_features_update: '#0EA5E9',
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Filtros */}
      <View style={{ backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', padding: 12, flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <TextInput
          style={[s.formInput, { flex: 1, minWidth: 140, marginBottom: 0 }]}
          placeholder="Filtrar por email…"
          placeholderTextColor="#94A3B8"
          value={filterEmail}
          onChangeText={(v) => { setFilterEmail(v); load(1, filterAction, v); }}
          autoCapitalize="none"
        />
        <TextInput
          style={[s.formInput, { flex: 1, minWidth: 140, marginBottom: 0 }]}
          placeholder="Filtrar por acción…"
          placeholderTextColor="#94A3B8"
          value={filterAction}
          onChangeText={(v) => { setFilterAction(v); load(1, v, filterEmail); }}
          autoCapitalize="none"
        />
        <Btn label="↻" onPress={() => load(1, filterAction, filterEmail)} style={{ paddingHorizontal: 14 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <View style={{ maxWidth: 1200, width: '100%', alignSelf: 'center' }}>
          {data && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 }}>
              <Text style={s.sectionTitle}>{data.total} registros · pág. {data.page}/{data.pages}</Text>
            </View>
          )}

          {loading && <ActivityIndicator color="#4F46E5" style={{ marginVertical: 20 }} />}

          {data && !loading && (
            <Card>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ minWidth: 680 }}>
                  <View style={s.tblHead}>
                    <Text style={[s.tblCol, { width: 140 }]}>Fecha/Hora</Text>
                    <Text style={[s.tblCol, { flex: 2, minWidth: 130 }]}>Email</Text>
                    <Text style={[s.tblCol, { width: 80 }]}>Rol</Text>
                    <Text style={[s.tblCol, { flex: 2, minWidth: 140 }]}>Acción</Text>
                    <Text style={[s.tblCol, { width: 100 }]}>IP</Text>
                  </View>
                  {data.logs.map((log, i) => (
                    <View key={i} style={s.tblRow}>
                      <Text style={{ width: 140, fontSize: 10, color: '#94A3B8' }}>
                        {log.ts?.slice(0, 16).replace('T', ' ')}
                      </Text>
                      <Text style={{ flex: 2, minWidth: 130, fontSize: 12, color: '#0F172A', fontWeight: '500' }} numberOfLines={1}>
                        {log.email || '–'}
                      </Text>
                      <View style={{ width: 80 }}>
                        <Badge label={log.rol || '?'} color="#475569" bg="#F1F5F9" />
                      </View>
                      <View style={{ flex: 2, minWidth: 140 }}>
                        <Badge
                          label={log.action}
                          color={ACTION_COLOR[log.action] || '#475569'}
                          bg={`${ACTION_COLOR[log.action] || '#475569'}18`}
                        />
                      </View>
                      <Text style={{ width: 100, fontSize: 10, color: '#94A3B8' }} numberOfLines={1}>{log.ip || '–'}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </Card>
          )}

          {/* Paginación */}
          {data && data.pages > 1 && (
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 12 }}>
              <Btn label="← Anterior" onPress={() => load(page - 1, filterAction, filterEmail)}
                disabled={page <= 1} style={{ backgroundColor: '#EEF2FF' }}
                textStyle={{ color: '#4F46E5' }} />
              <Text style={{ alignSelf: 'center', fontSize: 12, color: '#64748B' }}>
                {page} / {data.pages}
              </Text>
              <Btn label="Siguiente →" onPress={() => load(page + 1, filterAction, filterEmail)}
                disabled={page >= data.pages} style={{ backgroundColor: '#EEF2FF' }}
                textStyle={{ color: '#4F46E5' }} />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Tab: Comunicación masiva
// ─────────────────────────────────────────────────────────────────
function TabComunicacion({ currentUser }) {
  const apiFetch = makeApiFetch(currentUser?.access_token);
  const [form, setForm]   = useState({ asunto: '', cuerpo: '', destino: 'todos' });
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState(null);
  const [msg, setMsg]     = useState(null);

  const sendTest = async () => {
    if (!form.asunto || !form.cuerpo) { setMsg({ type: 'error', text: 'Asunto y cuerpo son obligatorios' }); return; }
    setSending(true); setMsg(null); setPreview(null);
    try {
      const res = await apiFetch('/api/superadmin/notify', {
        method: 'POST',
        body: JSON.stringify({ ...form, test: true }),
      });
      setPreview(res);
    } catch (e) { setMsg({ type: 'error', text: e.message }); }
    setSending(false);
  };

  const sendReal = async () => {
    if (!form.asunto || !form.cuerpo) { setMsg({ type: 'error', text: 'Asunto y cuerpo son obligatorios' }); return; }
    setSending(true); setMsg(null); setPreview(null);
    try {
      const res = await apiFetch('/api/superadmin/notify', {
        method: 'POST',
        body: JSON.stringify({ ...form, test: false }),
      });
      setMsg({ type: 'ok', text: `✅ Enviado a ${res.enviados} de ${res.destinatarios} destinatarios` });
      if (res.errores?.length > 0) {
        setMsg((m) => ({ ...m, text: m.text + ` · ${res.errores.length} errores` }));
      }
    } catch (e) { setMsg({ type: 'error', text: e.message }); }
    setSending(false);
  };

  const DESTINOS = [
    { key: 'todos',        label: 'Todos los admins' },
    { key: 'suscripcion',  label: 'Solo suscripción' },
    { key: 'creditos',     label: 'Solo créditos' },
  ];

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      <View style={{ maxWidth: 800, width: '100%', alignSelf: 'center', gap: 14 }}>
        <SectionHeader title="Enviar comunicación por email" />

        <Card>
          {/* Destinatarios */}
          <Text style={s.formLabel}>Destinatarios</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            {DESTINOS.map((d) => (
              <TouchableOpacity
                key={d.key}
                style={[s.btn, form.destino !== d.key && { backgroundColor: '#F1F5F9' }, { paddingHorizontal: 12, paddingVertical: 7 }]}
                onPress={() => setForm((f) => ({ ...f, destino: d.key }))}
              >
                <Text style={[s.btnText, form.destino !== d.key && { color: '#475569' }]}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <FormField
            label="Asunto"
            placeholder="Ej: Novedades de PrintForge Pro — Abril 2026"
            value={form.asunto}
            onChangeText={(v) => setForm((f) => ({ ...f, asunto: v }))}
          />

          <Text style={s.formLabel}>Cuerpo del mensaje</Text>
          <TextInput
            style={[s.formInput, { height: 160, textAlignVertical: 'top', paddingTop: 10 }]}
            placeholder="Escribe aquí el cuerpo del email…"
            placeholderTextColor="#94A3B8"
            value={form.cuerpo}
            onChangeText={(v) => setForm((f) => ({ ...f, cuerpo: v }))}
            multiline
          />

          {msg && (
            <View style={[s.alertBox, msg.type === 'ok' ? s.alertOk : s.alertErr]}>
              <Text style={s.alertText}>{msg.text}</Text>
            </View>
          )}

          {/* Preview resultado */}
          {preview && (
            <View style={[s.alertBox, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE', borderWidth: 1 }]}>
              <Text style={[s.alertText, { color: '#4F46E5' }]}>
                Vista previa: {preview.destinatarios} destinatarios
              </Text>
              {(preview.preview || []).map((e, i) => (
                <Text key={i} style={{ fontSize: 11, color: '#6366F1', marginTop: 2 }}>• {e}</Text>
              ))}
              {preview.destinatarios > 5 && (
                <Text style={{ fontSize: 11, color: '#6366F1', marginTop: 2 }}>+{preview.destinatarios - 5} más…</Text>
              )}
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <Btn
              label="👁 Vista previa"
              onPress={sendTest}
              loading={sending}
              style={{ flex: 1, backgroundColor: '#EEF2FF' }}
              textStyle={{ color: '#4F46E5' }}
            />
            <Btn
              label="📣 Enviar ahora"
              onPress={sendReal}
              loading={sending}
              style={{ flex: 1 }}
            />
          </View>
        </Card>

        <View style={[s.alertBox, { backgroundColor: '#FEF9C3', borderColor: '#FCD34D', borderWidth: 1, marginTop: 0 }]}>
          <Text style={[s.alertText, { color: '#92400E' }]}>
            ⚠️ Usa "Vista previa" antes de enviar para confirmar los destinatarios. El envío es inmediato y no se puede deshacer.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Tab: Configuración / Feature Flags
// ─────────────────────────────────────────────────────────────────
function TabConfiguracion({ currentUser }) {
  const apiFetch = makeApiFetch(currentUser?.access_token);
  const [features, setFeatures] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState(null);
  const [logs, setLogs]         = useState(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsNivel, setLogsNivel]     = useState('all');

  const loadFeatures = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/superadmin/features');
      setFeatures(res.features);
    } catch (e) { setMsg({ type: 'error', text: e.message }); }
    setLoading(false);
  }, []);

  const loadLogs = useCallback(async (nivel = 'all') => {
    setLogsLoading(true);
    try {
      const res = await apiFetch(`/api/superadmin/serverlogs?lines=150&nivel=${nivel}`);
      setLogs(res);
    } catch (_) {}
    setLogsLoading(false);
  }, []);

  useEffect(() => { loadFeatures(); loadLogs('all'); }, [loadFeatures, loadLogs]);

  const saveFeatures = async () => {
    setSaving(true); setMsg(null);
    try {
      const res = await apiFetch('/api/superadmin/features', {
        method: 'PUT',
        body: JSON.stringify(features),
      });
      setFeatures(res.features);
      setMsg({ type: 'ok', text: 'Flags actualizados correctamente' });
    } catch (e) { setMsg({ type: 'error', text: e.message }); }
    setSaving(false);
  };

  const FLAG_INFO = {
    registro_publico:         { label: 'Registro público', desc: 'Permite que nuevas empresas se registren', icon: '🔓' },
    billing_creditos:         { label: 'Modelo créditos', desc: 'Sistema de créditos disponible', icon: '💰' },
    billing_suscripcion:      { label: 'Modelo suscripción', desc: 'Suscripción mensual disponible', icon: '🔄' },
    revendedores_activos:     { label: 'Revendedores', desc: 'Módulo de revendedores activo', icon: '🤝' },
    modo_mantenimiento:       { label: 'Modo mantenimiento', desc: 'Bloquea login de usuarios no-root', icon: '🔧', danger: true },
    max_empresas:             { label: 'Máx. empresas', desc: '0 = sin límite', icon: '🏢', isNumber: true },
    max_usuarios_por_empresa: { label: 'Máx. usuarios/empresa', desc: '0 = sin límite', icon: '👥', isNumber: true },
    ayuda_ia:                 { label: 'Asistente IA', desc: 'Habilita el asistente IA (requiere ANTHROPIC_API_KEY en el servidor)', icon: '🤖' },
    ai_help_max_preguntas:    { label: 'Máx. preguntas IA/hora', desc: '0 = sin límite', icon: '💬', isNumber: true },
  };

  const LOG_COLOR = { error: '#EF4444', warn: '#F59E0B', info: '#94A3B8' };

  if (loading) return <ActivityIndicator style={{ marginTop: 60 }} color="#4F46E5" size="large" />;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 14 }}>
      <View style={{ maxWidth: 1100, width: '100%', alignSelf: 'center' }}>
        <View style={s.twoCol}>

          {/* Feature flags */}
          <View style={{ flex: 1, minWidth: 280 }}>
            <SectionHeader title="Feature Flags" />
            <Card>
              {features && Object.entries(FLAG_INFO).map(([key, info]) => {
                const val = features[key];
                const isBool = typeof val === 'boolean';
                return (
                  <View key={key} style={[s.infoRow, { paddingVertical: 12, alignItems: 'flex-start', flexDirection: 'column', gap: 6 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 16 }}>{info.icon}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[s.rowPrimary, info.danger && { color: '#DC2626' }]}>{info.label}</Text>
                          <Text style={s.rowSecondary}>{info.desc}</Text>
                        </View>
                      </View>
                      {isBool ? (
                        <TouchableOpacity
                          style={[s.btn, { paddingHorizontal: 14, paddingVertical: 6 },
                            val ? { backgroundColor: info.danger ? '#DC2626' : '#10B981' } : { backgroundColor: '#E2E8F0' }]}
                          onPress={() => setFeatures((f) => ({ ...f, [key]: !val }))}
                        >
                          <Text style={s.btnText}>{val ? 'ON' : 'OFF'}</Text>
                        </TouchableOpacity>
                      ) : (
                        <TextInput
                          style={[s.formInput, { width: 80, marginBottom: 0, paddingVertical: 5, textAlign: 'center' }]}
                          value={String(val ?? 0)}
                          keyboardType="numeric"
                          onChangeText={(v) => setFeatures((f) => ({ ...f, [key]: parseInt(v) || 0 }))}
                        />
                      )}
                    </View>
                    {info.danger && features[key] && (
                      <View style={[s.alertBox, { backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1, marginTop: 0, marginBottom: 0 }]}>
                        <Text style={{ fontSize: 11, color: '#B91C1C', fontWeight: '600' }}>
                          ⚠️ El modo mantenimiento bloquea el acceso a todos los usuarios no-root
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
              {msg && (
                <View style={[s.alertBox, msg.type === 'ok' ? s.alertOk : s.alertErr, { marginTop: 8 }]}>
                  <Text style={s.alertText}>{msg.text}</Text>
                </View>
              )}
              <Btn label="Guardar flags" onPress={saveFeatures} loading={saving} disabled={saving} style={{ marginTop: 8 }} />
            </Card>
          </View>

          {/* Logs del servidor */}
          <View style={{ flex: 2, minWidth: 280 }}>
            <SectionHeader
              title={`Logs del servidor${logs ? ` · ${logs.size_human}` : ''}`}
              action={
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {['all', 'error', 'warn', 'info'].map((n) => (
                    <TouchableOpacity
                      key={n}
                      style={[s.btn, logsNivel !== n && { backgroundColor: '#F1F5F9' }, { paddingHorizontal: 10, paddingVertical: 4 }]}
                      onPress={() => { setLogsNivel(n); loadLogs(n); }}
                    >
                      <Text style={[s.btnText, { fontSize: 11 }, logsNivel !== n && { color: '#475569' }]}>{n}</Text>
                    </TouchableOpacity>
                  ))}
                  <Btn label="↻" onPress={() => loadLogs(logsNivel)} style={{ paddingHorizontal: 10, paddingVertical: 4 }} />
                </View>
              }
            />
            <Card style={{ padding: 0 }}>
              {logsLoading ? (
                <ActivityIndicator color="#4F46E5" style={{ padding: 20 }} />
              ) : !logs || !logs.exists ? (
                <Text style={[s.emptyText, { padding: 16 }]}>No se encontró backend.log</Text>
              ) : (
                <ScrollView style={{ maxHeight: 500 }} nestedScrollEnabled>
                  {(logs.logs || []).map((line, i) => (
                    <View key={i} style={{
                      paddingHorizontal: 12, paddingVertical: 4,
                      backgroundColor: line.nivel === 'error' ? '#FEF2F2' : line.nivel === 'warn' ? '#FFFBEB' : 'transparent',
                      borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
                    }}>
                      <Text style={{ fontSize: 10, fontFamily: Platform.OS === 'web' ? 'monospace' : undefined, color: LOG_COLOR[line.nivel] || '#94A3B8' }}
                        selectable>
                        {line.texto}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              )}
            </Card>

            {/* Exportar CSV */}
            <SectionHeader title="Exportar datos" />
            <Card>
              <Text style={[s.rowSecondary, { marginBottom: 12 }]}>
                Descarga un CSV con todas las empresas, sus modelos de facturación, créditos, pedidos y almacenamiento.
              </Text>
              {Platform.OS === 'web' ? (
                <TouchableOpacity
                  style={s.btn}
                  onPress={() => {
                    const token = currentUser?.access_token;
                    fetch(`${API_BASE}/api/superadmin/export/empresas`, {
                      headers: { Authorization: `Bearer ${token}` },
                    })
                      .then((r) => r.blob())
                      .then((blob) => {
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url; a.download = 'empresas_export.csv'; a.click();
                        URL.revokeObjectURL(url);
                      });
                  }}
                >
                  <Text style={s.btnText}>⬇ Descargar empresas.csv</Text>
                </TouchableOpacity>
              ) : (
                <Text style={s.emptyText}>Exportación disponible solo en web</Text>
              )}
            </Card>
          </View>

        </View>
      </View>
    </ScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Pantalla principal SuperAdmin
// ─────────────────────────────────────────────────────────────────
export default function SuperAdminScreen({ currentUser }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!currentUser || currentUser.rol !== 'root') {
    return (
      <View style={s.accessDenied}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>🔒</Text>
        <Text style={s.accessDeniedText}>Acceso restringido</Text>
        <Text style={s.accessDeniedSub}>Solo disponible para el administrador global.</Text>
      </View>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':    return <TabDashboard    currentUser={currentUser} />;
      case 'financiero':   return <TabFinanciero   currentUser={currentUser} />;
      case 'riesgo':       return <TabRiesgo       currentUser={currentUser} />;
      case 'empresas':     return <TabEmpresas     currentUser={currentUser} />;
      case 'revendedores': return <TabRevendedores currentUser={currentUser} />;
      case 'tarifas':      return <TabTarifas      currentUser={currentUser} />;
      case 'promos':       return <TabPromos       currentUser={currentUser} />;
      case 'comunicacion': return <TabComunicacion currentUser={currentUser} />;
      case 'auditoria':    return <TabAuditoria    currentUser={currentUser} />;
      case 'configuracion':return <TabConfiguracion currentUser={currentUser} />;
      case 'servidor':     return <TabServidor     currentUser={currentUser} />;
      default:             return null;
    }
  };

  const isWeb = Platform.OS === 'web';

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>⚡ Panel SuperAdmin</Text>
          <Text style={s.headerSub}>{currentUser.email}</Text>
        </View>
        <View style={[s.statusDotInline, { backgroundColor: '#16A34A' }]} />
      </View>

      <View style={{ flex: 1, flexDirection: isWeb ? 'row' : 'column' }}>

        {/* Sidebar (web) */}
        {isWeb && (
          <View style={s.sidebar}>
            {NAV_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[s.sidebarItem, activeTab === item.key && s.sidebarItemActive]}
                onPress={() => setActiveTab(item.key)}
              >
                <Text style={s.sidebarIcon}>{item.icon}</Text>
                <Text style={[s.sidebarLabel, activeTab === item.key && s.sidebarLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* TabBar (móvil) */}
        {!isWeb && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.tabBar}
            contentContainerStyle={s.tabBarContent}
          >
            {NAV_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[s.tabBtn, activeTab === item.key && s.tabBtnActive]}
                onPress={() => setActiveTab(item.key)}
              >
                <Text style={{ fontSize: 14 }}>{item.icon}</Text>
                <Text style={[s.tabBtnText, activeTab === item.key && s.tabBtnTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Contenido */}
        <View style={{ flex: 1 }}>
          {renderContent()}
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F1F5F9' },

  header:      { backgroundColor: '#1E1B4B', paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  headerSub:   { fontSize: 12, color: '#A5B4FC', marginTop: 2 },
  statusDotInline: { width: 10, height: 10, borderRadius: 5 },

  // Sidebar (web)
  sidebar:          { width: 190, backgroundColor: '#0F0E2B', paddingTop: 12, paddingHorizontal: 10 },
  sidebarItem:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 9, marginBottom: 2 },
  sidebarItemActive:{ backgroundColor: '#4F46E5' },
  sidebarIcon:      { fontSize: 16, width: 22, textAlign: 'center' },
  sidebarLabel:     { fontSize: 13, fontWeight: '600', color: '#94A3B8' },
  sidebarLabelActive: { color: '#FFFFFF' },

  // TabBar (móvil)
  tabBar:         { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', maxHeight: 52 },
  tabBarContent:  { paddingHorizontal: 10, gap: 4, alignItems: 'center' },
  tabBtn:         { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  tabBtnActive:   { backgroundColor: '#EEF2FF' },
  tabBtnText:     { fontSize: 12, fontWeight: '600', color: '#64748B' },
  tabBtnTextActive: { color: '#4F46E5' },

  // Layout
  twoCol:     { flexDirection: 'row', gap: 14, flexWrap: 'wrap' },

  // Cards
  card:       { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 10, overflow: 'hidden' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, marginTop: 4 },
  sectionTitle:  { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8 },

  // KPI
  kpiGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard:    { flex: 1, minWidth: 150, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, borderLeftWidth: 3 },
  kpiIcon:    { width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  kpiLabel:   { fontSize: 11, fontWeight: '600', color: '#64748B', flex: 1 },
  kpiValue:   { fontSize: 24, fontWeight: '800' },
  kpiSub:     { fontSize: 11, color: '#94A3B8', marginTop: 2 },

  kpiGrid2:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  miniKpi:    { flex: 1, minWidth: 80, backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10, alignItems: 'center' },
  miniKpiValue: { fontSize: 16, fontWeight: '800' },
  miniKpiLabel: { fontSize: 10, color: '#94A3B8', marginTop: 2 },

  // Feed / rows
  feedRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  feedIcon:   { width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  rowPrimary: { fontSize: 12, fontWeight: '600', color: '#0F172A' },
  rowSecondary: { fontSize: 11, color: '#94A3B8', marginTop: 1 },

  tblHead:    { flexDirection: 'row', alignItems: 'center', paddingBottom: 7, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', marginBottom: 2 },
  tblCol:     { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.4 },
  tblRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },

  infoRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  infoLabel:  { fontSize: 12, color: '#64748B' },
  infoValue:  { fontSize: 12, fontWeight: '600', color: '#0F172A' },

  // Empresa avatar
  empAvatar:  { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  // Search
  searchBar:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingHorizontal: 16, paddingVertical: 10 },
  searchInput:   { flex: 1, fontSize: 14, color: '#0F172A' },

  // Badge
  badge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
  badgeText: { fontSize: 10, fontWeight: '700' },

  // Buttons
  btn:       { backgroundColor: '#4F46E5', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  btnText:   { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

  // Status dot
  statusDot: { width: 8, height: 8, borderRadius: 4 },

  // Alerts
  alertBanner:       { backgroundColor: '#FEF3C7', borderWidth: 1.5, borderColor: '#F59E0B', borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'flex-start' },
  alertBannerTitle:  { fontSize: 13, fontWeight: '700', color: '#92400E', marginBottom: 4 },
  alertBannerItem:   { fontSize: 12, color: '#92400E', marginTop: 2 },

  alertBox:  { borderRadius: 8, padding: 10, marginBottom: 8 },
  alertOk:   { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0' },
  alertErr:  { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  alertText: { fontSize: 13, fontWeight: '600', color: '#0F172A' },

  // Forms
  formLabel:  { fontSize: 11, fontWeight: '600', color: '#64748B', marginBottom: 4 },
  formInput:  { backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: '#0F172A', marginBottom: 4 },

  // Promos
  promoCode:      { fontSize: 13, fontWeight: '800', color: '#4F46E5', letterSpacing: 0.8 },
  smallBtn:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  smallBtnOk:     { backgroundColor: '#DCFCE7' },
  smallBtnGray:   { backgroundColor: '#F1F5F9' },
  smallBtnDanger: { backgroundColor: '#FEE2E2' },
  smallBtnText:   { fontSize: 11, fontWeight: '700', color: '#0F172A' },

  confirmRow:  { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 8, padding: 12, marginTop: 8 },
  confirmText: { fontSize: 12, fontWeight: '600', color: '#B91C1C' },

  emptyText:   { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginTop: 20 },
  errorText:   { fontSize: 13, color: '#DC2626', textAlign: 'center', marginTop: 20, padding: 16 },

  accessDenied:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  accessDeniedText: { fontSize: 22, fontWeight: '800', color: '#1E1B4B', marginBottom: 8 },
  accessDeniedSub:  { fontSize: 14, color: '#64748B', textAlign: 'center' },
});

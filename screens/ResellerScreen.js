import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, StyleSheet, RefreshControl, Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import DeleteConfirmRow from '../components/DeleteConfirmRow';
import { changeLanguage, LANGUAGES } from '../i18n/index';
import { isValidEmail } from '../utils/phoneFormat';

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
  const { t, i18n } = useTranslation();
  const api = apiFetch(currentUser?.access_token);

  const [activeTab, setActiveTab] = useState('cuenta');
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState(null);

  // Créditos / auto-recarga
  const [autoRecarga, setAutoRecarga] = useState(null);
  const [buyingPack, setBuyingPack]   = useState(null);
  const [buyMsg, setBuyMsg]           = useState(null);
  const [savingAR, setSavingAR]       = useState(false);
  const [arMsg, setArMsg]             = useState(null);

  // Clientes
  const [showNuevoCliente, setShowNuevoCliente] = useState(false);
  const [expandedCliente, setExpandedCliente]   = useState(null);
  const [editFacturacion, setEditFacturacion]   = useState(null);
  const [savingFacturacion, setSavingFacturacion] = useState(false);
  const [factMsg, setFactMsg]                   = useState(null);
  const [confirmBloquear, setConfirmBloquear]   = useState(null);
  const [toggling, setToggling]                 = useState(null);
  const [togglingRepetidora, setTogglingRepetidora] = useState(null);

  useEffect(() => {
    api('/api/billing/auto-recarga').then(setAutoRecarga).catch(() => {});
  }, [currentUser?.access_token]);

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

  const buyPack = async (packId) => {
    setBuyingPack(packId); setBuyMsg(null);
    try {
      const res = await api('/api/billing/creditos/topup', { method: 'POST', body: JSON.stringify({ package_id: packId }) });
      setBuyMsg({ type: 'ok', text: `+${res.credits_added} ${t('screens.reseller.creditosUnit')}. ${res.new_balance}` });
      load();
    } catch (e) { setBuyMsg({ type: 'error', text: e.message }); }
    setBuyingPack(null);
  };

  const saveAutoRecarga = async () => {
    if (!autoRecarga) return;
    setSavingAR(true); setArMsg(null);
    try {
      await api('/api/billing/auto-recarga', { method: 'PUT', body: JSON.stringify(autoRecarga) });
      setArMsg({ type: 'ok', text: t('screens.reseller.configGuardada') });
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
      setFactMsg({ type: 'ok', text: t('screens.reseller.guardado') });
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

  const toggleDescargaRepetidora = async (empresaId, estaActualmenteBloqueado) => {
    setTogglingRepetidora(empresaId);
    try {
      await api(`/api/revendedor/clientes/${empresaId}/bloquear-descarga-repetidora`, {
        method: 'PUT',
        body: JSON.stringify({ bloqueado: !estaActualmenteBloqueado }),
      });
      load();
    } catch (e) { setError(e.message); }
    setTogglingRepetidora(null);
  };

  if (loading) return (
    <View style={s.centered}>
      <ActivityIndicator size="large" color="#4F46E5" />
    </View>
  );

  const TABS = [
    { key: 'cuenta',   label: t('screens.reseller.tabCuenta'),   icon: '💼' },
    { key: 'clientes', label: t('screens.reseller.tabClientes'),  icon: '👥' },
  ];

  return (
    <View style={s.container}>
      {/* ── Header ── */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>{data?.empresa_nombre || data?.nombre || t('screens.reseller.portalTitle')}</Text>
          <Text style={s.headerSub}>{currentUser?.email}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {LANGUAGES.map((lang) => {
            const active = i18n.language === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                onPress={() => changeLanguage(lang.code)}
                style={[s.langBtn, active && s.langBtnActive]}
              >
                <Text style={s.langFlag}>{lang.flag}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity style={[s.logoutBtn, { marginLeft: 10 }]} onPress={onLogout}>
          <Text style={s.logoutBtnText}>{t('screens.reseller.cerrarSesion')}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Tab bar ── */}
      <View style={s.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tabItem, activeTab === tab.key && s.tabItemActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[s.tabIcon]}>{tab.icon}</Text>
            <Text style={[s.tabLabel, activeTab === tab.key && s.tabLabelActive]}>{tab.label}</Text>
            {tab.key === 'clientes' && (data?.clientes?.length ?? 0) > 0 && (
              <View style={s.tabBadge}>
                <Text style={s.tabBadgeText}>{data.clientes.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Contenido ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
      >
        {error && <Text style={s.errorText}>{error}</Text>}

        {activeTab === 'cuenta' && (
          <TabCuenta
            data={data}
            autoRecarga={autoRecarga}
            setAutoRecarga={setAutoRecarga}
            buyingPack={buyingPack}
            buyPack={buyPack}
            buyMsg={buyMsg}
            savingAR={savingAR}
            arMsg={arMsg}
            saveAutoRecarga={saveAutoRecarga}
            t={t}
          />
        )}

        {activeTab === 'clientes' && (
          <TabClientes
            data={data}
            expandedCliente={expandedCliente}
            setExpandedCliente={setExpandedCliente}
            editFacturacion={editFacturacion}
            setEditFacturacion={setEditFacturacion}
            savingFacturacion={savingFacturacion}
            factMsg={factMsg}
            setFactMsg={setFactMsg}
            saveFacturacion={saveFacturacion}
            confirmBloquear={confirmBloquear}
            setConfirmBloquear={setConfirmBloquear}
            toggling={toggling}
            toggleBloqueo={toggleBloqueo}
            togglingRepetidora={togglingRepetidora}
            toggleDescargaRepetidora={toggleDescargaRepetidora}
            onNuevoCliente={() => setShowNuevoCliente(true)}
            t={t}
          />
        )}
      </ScrollView>

      <NuevoClienteModal
        visible={showNuevoCliente}
        onClose={() => setShowNuevoCliente(false)}
        onCreated={() => { setShowNuevoCliente(false); load(); }}
        api={api}
      />
    </View>
  );
}

// ─── Tab: Mi cuenta ───────────────────────────────────────────────────────────
function TabCuenta({ data, autoRecarga, setAutoRecarga, buyingPack, buyPack, buyMsg, savingAR, arMsg, saveAutoRecarga, t }) {
  return (
    <>
      {/* KPIs */}
      <View style={s.kpiRow}>
        <KpiCard label={t('screens.reseller.kpiCreditos')} value={data?.creditos ?? 0} color="#4F46E5" big />
        <KpiCard label={t('screens.reseller.kpiCosteMes')} value={`${data?.coste_mes_actual_eur ?? 0} €`} color="#EF4444" big />
      </View>
      <View style={s.kpiRow}>
        <KpiCard label={t('screens.reseller.kpiEmpresas')} value={data?.clientes?.length ?? 0} color="#0EA5E9" />
        <KpiCard label={t('screens.reseller.kpiDescuento')} value={`${data?.discount_pct ?? 0}%`} color="#10B981" />
        <KpiCard label={t('screens.reseller.kpiCosteTotal')} value={`${data?.coste_total_eur ?? 0} €`} color="#F59E0B" />
      </View>

      {/* Info tarifas */}
      <View style={s.infoBox}>
        <Text style={s.infoBoxText}>
          {t('screens.reseller.infoTarifas', {
            pct: data?.discount_pct ?? 0,
            precio_credito: data?.precio_credito_eur ?? 0,
            suscripcion: data?.suscripcion_eur ?? 0,
          })}
        </Text>
      </View>
      {(data?.discount_pct ?? 0) > 0 && (
        <View style={s.infoBox}>
          <Text style={s.infoBoxText}>
            {t('screens.reseller.infoDescuento', { pct: data.discount_pct })}
          </Text>
        </View>
      )}

      {/* Compra de créditos */}
      <Text style={s.sectionTitle}>{t('screens.reseller.recargarCreditos')}</Text>
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
            {p.popular && <View style={s.packPopular}><Text style={s.packPopularText}>{t('screens.reseller.packPopular')}</Text></View>}
            <Text style={s.packCredits}>{p.credits}</Text>
            <Text style={s.packLabel}>{t('screens.reseller.packCreditos')}</Text>
            <Text style={s.packPrice}>{p.price_eur} €</Text>
            {buyingPack === p.id
              ? <ActivityIndicator size="small" color="#4F46E5" style={{ marginTop: 6 }} />
              : <Text style={s.packBuy}>{t('screens.reseller.packComprar')}</Text>}
          </TouchableOpacity>
        ))}
      </View>

      {/* Auto-recarga */}
      {autoRecarga && (
        <>
          <Text style={[s.sectionTitle, { marginTop: 16 }]}>{t('screens.reseller.autoRecarga')}</Text>
          <View style={s.card}>
            <View style={[s.infoRow, { marginBottom: 4 }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.rowPrimary}>{t('screens.reseller.autoRecargaActivar')}</Text>
                <Text style={s.rowSecondary}>{t('screens.reseller.autoRecargaDesc')}</Text>
              </View>
              <TouchableOpacity
                style={[s.toggleBtn, autoRecarga.auto_recarga_enabled && s.toggleBtnOn]}
                onPress={() => setAutoRecarga((ar) => ({ ...ar, auto_recarga_enabled: !ar.auto_recarga_enabled }))}
              >
                <Text style={[s.toggleBtnText, autoRecarga.auto_recarga_enabled && { color: '#4F46E5' }]}>
                  {autoRecarga.auto_recarga_enabled ? t('screens.reseller.autoRecargaOn') : t('screens.reseller.autoRecargaOff')}
                </Text>
              </TouchableOpacity>
            </View>

            {autoRecarga.auto_recarga_enabled && (
              <>
                <View style={s.formRow}>
                  <Text style={s.formLabel}>{t('screens.reseller.umbralLabel')}</Text>
                  <TextInput
                    style={s.formInput}
                    value={String(autoRecarga.auto_recarga_umbral ?? 20)}
                    onChangeText={(v) => setAutoRecarga((ar) => ({ ...ar, auto_recarga_umbral: parseInt(v) || 0 }))}
                    keyboardType="numeric"
                    placeholder="20"
                    placeholderTextColor="#94A3B8"
                  />
                  <Text style={s.rowSecondary}>{t('screens.reseller.umbralHint')}</Text>
                </View>
                <View style={s.formRow}>
                  <Text style={s.formLabel}>{t('screens.reseller.packAutoLabel')}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                    {(autoRecarga.packs || []).map((p) => (
                      <TouchableOpacity
                        key={p.id}
                        style={[s.packSelectBtn, autoRecarga.auto_recarga_pack === p.id && s.packSelectBtnActive]}
                        onPress={() => setAutoRecarga((ar) => ({ ...ar, auto_recarga_pack: p.id }))}
                      >
                        <Text style={[s.packSelectText, autoRecarga.auto_recarga_pack === p.id && { color: '#4F46E5' }]}>
                          {p.credits} {t('screens.reseller.creditosUnit')} — {p.price_eur} €
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
              {savingAR ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={s.primaryBtnText}>{t('screens.reseller.guardarConfig')}</Text>}
            </TouchableOpacity>
          </View>
        </>
      )}
    </>
  );
}

// ─── Tab: Clientes ────────────────────────────────────────────────────────────
function TabClientes({
  data, expandedCliente, setExpandedCliente,
  editFacturacion, setEditFacturacion, savingFacturacion, factMsg, setFactMsg, saveFacturacion,
  confirmBloquear, setConfirmBloquear, toggling, toggleBloqueo,
  togglingRepetidora, toggleDescargaRepetidora,
  onNuevoCliente, t,
}) {
  const clientes = data?.clientes || [];

  return (
    <>
      {/* Cabecera */}
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>
          {t('screens.reseller.empresasCliente', { count: clientes.length })}
        </Text>
        <TouchableOpacity style={s.addBtn} onPress={onNuevoCliente}>
          <Text style={s.addBtnText}>{t('screens.reseller.nuevoCliente')}</Text>
        </TouchableOpacity>
      </View>

      {clientes.length === 0 ? (
        <View style={s.card}>
          <View style={s.emptyState}>
            <Text style={s.emptyTitle}>{t('screens.reseller.sinClientes')}</Text>
            <Text style={s.emptySub}>{t('screens.reseller.sinClientesSub')}</Text>
            <TouchableOpacity style={[s.addBtn, { marginTop: 12 }]} onPress={onNuevoCliente}>
              <Text style={s.addBtnText}>{t('screens.reseller.addEmpresaCliente')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : clientes.map((c) => (
        <ClienteCard
          key={c.empresa_id}
          c={c}
          data={data}
          expanded={expandedCliente === c.empresa_id}
          onToggleExpand={() => setExpandedCliente(expandedCliente === c.empresa_id ? null : c.empresa_id)}
          editFacturacion={editFacturacion}
          setEditFacturacion={setEditFacturacion}
          savingFacturacion={savingFacturacion}
          factMsg={factMsg}
          setFactMsg={setFactMsg}
          saveFacturacion={saveFacturacion}
          confirmBloquear={confirmBloquear}
          setConfirmBloquear={setConfirmBloquear}
          toggling={toggling}
          toggleBloqueo={toggleBloqueo}
          togglingRepetidora={togglingRepetidora}
          toggleDescargaRepetidora={toggleDescargaRepetidora}
          t={t}
        />
      ))}
    </>
  );
}

// ─── Card de cliente ──────────────────────────────────────────────────────────
function ClienteCard({
  c, data, expanded, onToggleExpand,
  editFacturacion, setEditFacturacion, savingFacturacion, factMsg, setFactMsg, saveFacturacion,
  confirmBloquear, setConfirmBloquear, toggling, toggleBloqueo,
  togglingRepetidora, toggleDescargaRepetidora, t,
}) {
  const isSub = c.reseller_billing_mode === 'cuota_mensual';

  return (
    <View style={s.clientCard}>
      {/* ── Encabezado ── */}
      <TouchableOpacity style={s.clientCardHeader} onPress={onToggleExpand} activeOpacity={0.7}>
        <View style={s.clientAvatarWrap}>
          <Text style={s.clientAvatar}>
            {(c.empresa_nombre || c.nombre || c.email || '?').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.clientName} numberOfLines={1}>
            {c.empresa_nombre || c.nombre || '—'}
          </Text>
          <Text style={s.clientEmail} numberOfLines={1}>{c.email}</Text>
          {/* badges de estado */}
          <View style={{ flexDirection: 'row', gap: 5, marginTop: 4, flexWrap: 'wrap' }}>
            <View style={[s.badge, isSub ? s.badgeSub : s.badgePpu]}>
              <Text style={[s.badgeText, isSub ? { color: '#166534' } : { color: '#1D4ED8' }]}>
                {isSub ? '📅 ' + t('screens.reseller.cuotaMensual') : '📊 ' + t('screens.reseller.pagoPorUso')}
              </Text>
            </View>
            {c.bloqueado && (
              <View style={[s.badge, s.badgeRed]}>
                <Text style={[s.badgeText, { color: '#DC2626' }]}>🔒 {t('screens.reseller.bloqueado')}</Text>
              </View>
            )}
            {c.bloquear_descarga_repetidora && (
              <View style={[s.badge, s.badgeAmber]}>
                <Text style={[s.badgeText, { color: '#B45309' }]}>🔁 {t('screens.reseller.descargaRepetidoraBloqueada')}</Text>
              </View>
            )}
          </View>
        </View>
        {/* Stats compactos */}
        <View style={s.clientStats}>
          <Text style={s.clientStatValue}>{c.coste_acumulado_eur ?? 0} €</Text>
          <Text style={s.clientStatLabel}>{t('screens.reseller.totalAcumulado')}</Text>
          <Text style={[s.clientStatValue, { color: '#EF4444', fontSize: 12, marginTop: 4 }]}>
            {c.coste_mes_actual_eur ?? 0} €
          </Text>
          <Text style={s.clientStatLabel}>{t('screens.reseller.esteMesSuffix')}</Text>
        </View>
        <Text style={s.chevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {/* ── Acciones rápidas (siempre visibles) ── */}
      <View style={s.actionsRow}>
        {/* Bloquear acceso */}
        {confirmBloquear === c.empresa_id ? (
          <View style={{ flex: 1 }}>
            <DeleteConfirmRow
              message={c.bloqueado ? t('screens.reseller.confirmarReactivar') : t('screens.reseller.confirmarBloquear')}
              confirmLabel={c.bloqueado ? t('screens.reseller.reactivar') : t('screens.reseller.bloquear')}
              onCancel={() => setConfirmBloquear(null)}
              onConfirm={() => toggleBloqueo(c.empresa_id, c.bloqueado)}
            />
          </View>
        ) : (
          <TouchableOpacity
            style={[s.actionBtn, c.bloqueado ? s.actionBtnRed : s.actionBtnGhost]}
            onPress={() => setConfirmBloquear(c.empresa_id)}
            disabled={toggling === c.empresa_id}
          >
            {toggling === c.empresa_id
              ? <ActivityIndicator size="small" color="#64748B" />
              : <Text style={[s.actionBtnText, c.bloqueado && { color: '#DC2626' }]}>
                  {c.bloqueado ? '🔓 ' + t('screens.reseller.reactivar') : '🔒 ' + t('screens.reseller.bloquear')}
                </Text>
            }
          </TouchableOpacity>
        )}

        {/* Bloquear descarga repetidora */}
        <TouchableOpacity
          style={[s.actionBtn, c.bloquear_descarga_repetidora ? s.actionBtnAmber : s.actionBtnGhost]}
          onPress={() => toggleDescargaRepetidora(c.empresa_id, c.bloquear_descarga_repetidora)}
          disabled={togglingRepetidora === c.empresa_id}
        >
          {togglingRepetidora === c.empresa_id
            ? <ActivityIndicator size="small" color="#64748B" />
            : <Text style={[s.actionBtnText, c.bloquear_descarga_repetidora && { color: '#B45309' }]}>
                {c.bloquear_descarga_repetidora
                  ? '🔁 ' + t('screens.reseller.permitirDescarga')
                  : '🔁 ' + t('screens.reseller.bloquearDescarga')}
              </Text>
          }
        </TouchableOpacity>
      </View>

      {/* ── Detalle expandido ── */}
      {expanded && (
        <View style={s.clientDetail}>
          {/* Modo facturación */}
          <Text style={s.detailSectionLabel}>{t('screens.reseller.modFacturacion')}</Text>
          {editFacturacion?.empresaId === c.empresa_id ? (
            <View style={s.factBox}>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                {['pago_por_uso', 'cuota_mensual'].map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[s.modeBtn, editFacturacion.mode === m && s.modeBtnActive]}
                    onPress={() => setEditFacturacion((f) => ({ ...f, mode: m }))}
                  >
                    <Text style={[s.modeBtnText, editFacturacion.mode === m && s.modeBtnTextActive]}>
                      {m === 'cuota_mensual' ? t('screens.reseller.cuotaMensual') : t('screens.reseller.pagoPorUso')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {editFacturacion.mode === 'cuota_mensual' && (
                <View style={[s.alertBox, s.alertOk, { marginBottom: 8 }]}>
                  <Text style={[s.alertText, { color: '#166534' }]}>
                    {t('screens.reseller.cuotaFijada', { eur: data?.suscripcion_eur ?? 0 })}
                    {(data?.discount_pct ?? 0) > 0
                      ? t('screens.reseller.dtoAplicado', { pct: data.discount_pct })
                      : ''}
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
                    : <Text style={s.primaryBtnText}>{t('screens.reseller.guardar')}</Text>}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.secondaryBtn, { flex: 1 }]}
                  onPress={() => { setEditFacturacion(null); setFactMsg(null); }}
                >
                  <Text style={s.secondaryBtnText}>{t('screens.reseller.cancelar')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={s.editFactBtn}
              onPress={() => setEditFacturacion({ empresaId: c.empresa_id, mode: c.reseller_billing_mode || 'pago_por_uso' })}
            >
              <Text style={s.editFactBtnText}>{t('screens.reseller.cambiarModo')}</Text>
            </TouchableOpacity>
          )}

          {/* Consumo mensual */}
          <Text style={[s.detailSectionLabel, { marginTop: 14 }]}>{t('screens.reseller.consumoPorMes')}</Text>
          {(c.consumo_mensual || []).length === 0 ? (
            <Text style={[s.rowSecondary, { marginBottom: 8 }]}>{t('screens.reseller.sinDatosMensuales')}</Text>
          ) : (
            <View style={s.innerTable}>
              <View style={s.tblHead}>
                <Text style={[s.tblCol, { flex: 2 }]}>{t('screens.reseller.colMes')}</Text>
                <Text style={[s.tblCol, { flex: 1, textAlign: 'right' }]}>{t('screens.reseller.colCreditos')}</Text>
              </View>
              {(c.consumo_mensual || []).map((m, i) => {
                const esMesActual = m.mes === new Date().toISOString().slice(0, 7);
                return (
                  <View key={i} style={[s.tblRow, esMesActual && { backgroundColor: '#FFFBEB' }]}>
                    <Text style={[s.rowPrimary, { flex: 2 }]}>
                      {esMesActual ? `${m.mes} ${t('screens.reseller.mesActualSuffix')}` : m.mes}
                    </Text>
                    <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: '#F59E0B', textAlign: 'right' }}>{m.total}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Últimas transacciones */}
          <Text style={[s.detailSectionLabel, { marginTop: 14 }]}>{t('screens.reseller.ultimasTransacciones')}</Text>
          {(c.transacciones || []).length === 0 ? (
            <Text style={s.rowSecondary}>{t('screens.reseller.sinTransacciones')}</Text>
          ) : (
            <>
              <View style={s.tblHead}>
                <Text style={[s.tblCol, { flex: 3 }]}>{t('screens.reseller.colConcepto')}</Text>
                <Text style={[s.tblCol, { flex: 2 }]}>{t('screens.reseller.colFecha')}</Text>
                <Text style={[s.tblCol, { flex: 1, textAlign: 'right' }]}>{t('screens.reseller.colCred')}</Text>
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
                <Text style={s.txTotalLabel}>{t('screens.reseller.totalAcumulado')}</Text>
                <Text style={s.txTotalValue}>{c.consumo_creditos ?? 0} {t('screens.reseller.creditosUnit')}</Text>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Modal: nuevo cliente ─────────────────────────────────────────────────────
function NuevoClienteModal({ visible, onClose, onCreated, api }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ nombre: '', empresa_nombre: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const reset = () => { setForm({ nombre: '', empresa_nombre: '', email: '', password: '' }); setMsg(null); };

  const submit = async () => {
    if (!form.email.trim() || !form.password.trim()) {
      setMsg({ type: 'error', text: t('screens.reseller.emailRequired') }); return;
    }
    if (!isValidEmail(form.email.trim())) {
      setMsg({ type: 'error', text: t('forms.errorEmail') }); return;
    }
    setSaving(true); setMsg(null);
    try {
      await api('/api/revendedor/clientes', { method: 'POST', body: JSON.stringify(form) });
      setMsg({ type: 'ok', text: t('screens.reseller.clienteCreado') });
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
            <Text style={s.modalTitle}>{t('screens.reseller.modalTitle')}</Text>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <Text style={s.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView>
            <FormField label={t('screens.reseller.fieldNombreContacto')} value={form.nombre}
              onChange={(v) => setForm((f) => ({ ...f, nombre: v }))}
              placeholder={t('screens.reseller.placeholderNombre')} />
            <FormField label={t('screens.reseller.fieldNombreEmpresa')} value={form.empresa_nombre}
              onChange={(v) => setForm((f) => ({ ...f, empresa_nombre: v }))}
              placeholder={t('screens.reseller.placeholderEmpresa')} />
            <FormField label={t('screens.reseller.fieldEmail')} value={form.email}
              onChange={(v) => setForm((f) => ({ ...f, email: v }))}
              placeholder={t('screens.reseller.placeholderEmail')}
              keyboardType="email-address" autoCapitalize="none" />
            <FormField label={t('screens.reseller.fieldPassword')} value={form.password}
              onChange={(v) => setForm((f) => ({ ...f, password: v }))}
              placeholder={t('screens.reseller.placeholderPassword')}
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
                : <Text style={s.primaryBtnText}>{t('screens.reseller.crearEmpresaBtn')}</Text>
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
  container:      { flex: 1, backgroundColor: '#F1F5F9' },
  centered:       { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header:         { backgroundColor: '#1E1B4B', paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center' },
  headerTitle:    { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  headerSub:      { fontSize: 12, color: '#A5B4FC', marginTop: 2 },
  logoutBtn:      { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#A5B4FC' },
  logoutBtnText:  { fontSize: 13, fontWeight: '600', color: '#A5B4FC' },
  langBtn:        { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  langBtnActive:  { borderColor: '#A5B4FC', backgroundColor: 'rgba(165,180,252,0.15)' },
  langFlag:       { fontSize: 16 },

  // Tab bar
  tabBar:         { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tabItem:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabItemActive:  { borderBottomColor: '#4F46E5' },
  tabIcon:        { fontSize: 15 },
  tabLabel:       { fontSize: 13, fontWeight: '600', color: '#94A3B8' },
  tabLabelActive: { color: '#4F46E5' },
  tabBadge:       { backgroundColor: '#4F46E5', borderRadius: 10, minWidth: 18, paddingHorizontal: 5, paddingVertical: 1, alignItems: 'center' },
  tabBadgeText:   { fontSize: 10, fontWeight: '700', color: '#FFF' },

  // KPIs
  kpiRow:         { flexDirection: 'row', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
  kpiCard:        { flex: 1, minWidth: 120, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, alignItems: 'center' },
  kpiValue:       { fontSize: 24, fontWeight: '800' },
  kpiLabel:       { fontSize: 11, color: '#94A3B8', marginTop: 3, textAlign: 'center' },

  sectionHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle:   { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.8 },
  addBtn:         { backgroundColor: '#4F46E5', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText:     { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

  card:           { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginBottom: 16, overflow: 'hidden' },

  // Cliente card
  clientCard:     { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 14, overflow: 'hidden' },
  clientCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  clientAvatarWrap: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  clientAvatar:   { fontSize: 18, fontWeight: '800', color: '#4F46E5' },
  clientName:     { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  clientEmail:    { fontSize: 12, color: '#94A3B8', marginTop: 1 },
  clientStats:    { alignItems: 'flex-end', flexShrink: 0 },
  clientStatValue:{ fontSize: 14, fontWeight: '800', color: '#F59E0B' },
  clientStatLabel:{ fontSize: 10, color: '#94A3B8' },
  chevron:        { fontSize: 12, color: '#CBD5E1', marginLeft: 4, flexShrink: 0 },

  // Badges
  badge:          { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, borderWidth: 1 },
  badgePpu:       { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' },
  badgeSub:       { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  badgeRed:       { backgroundColor: '#FEE2E2', borderColor: '#FECACA' },
  badgeAmber:     { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
  badgeText:      { fontSize: 10, fontWeight: '700' },

  // Acciones rápidas
  actionsRow:     { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 12, flexWrap: 'wrap' },
  actionBtn:      { flex: 1, minWidth: 140, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1.5 },
  actionBtnGhost: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
  actionBtnRed:   { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  actionBtnAmber: { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
  actionBtnText:  { fontSize: 12, fontWeight: '600', color: '#475569' },

  // Detalle expandido
  clientDetail:   { borderTopWidth: 1, borderTopColor: '#F1F5F9', padding: 14, backgroundColor: '#F8FAFC' },
  detailSectionLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  innerTable:     { backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', padding: 10, marginBottom: 4 },

  tblHead:        { flexDirection: 'row', alignItems: 'center', paddingBottom: 7, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', marginBottom: 2 },
  tblCol:         { fontSize: 10, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.4 },
  tblRow:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  rowPrimary:     { fontSize: 12, fontWeight: '600', color: '#0F172A' },
  rowSecondary:   { fontSize: 11, color: '#94A3B8', marginTop: 1 },

  emptyState:     { alignItems: 'center', paddingVertical: 24 },
  emptyTitle:     { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  emptySub:       { fontSize: 13, color: '#94A3B8', textAlign: 'center' },

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

  packSelectBtn:      { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  packSelectBtnActive:{ borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  packSelectText:     { fontSize: 12, fontWeight: '600', color: '#64748B' },

  factBox:          { backgroundColor: '#FFFFFF', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', padding: 12, marginBottom: 12 },
  modeBtn:          { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, borderColor: '#E2E8F0', alignItems: 'center' },
  modeBtnActive:    { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  modeBtnText:      { fontSize: 12, fontWeight: '600', color: '#64748B' },
  modeBtnTextActive:{ color: '#4F46E5' },
  editFactBtn:      { backgroundColor: '#F1F5F9', borderRadius: 8, paddingVertical: 8, alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
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

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

const API = 'http://localhost:8080';

const C = {
  bg:           '#F4F5FD',
  header:       '#EEF2FF',
  headerBorder: '#C7D2FE',
  navDark:      '#1E1B4B',
  surface:      '#FFFFFF',
  border:       '#E2E8F0',
  borderStrong: '#CBD5E1',
  text:         '#0F172A',
  textSec:      '#475569',
  textMuted:    '#94A3B8',
  accent:       '#4F46E5',
  accentDim:    'rgba(79,70,229,0.08)',
  accentBorder: 'rgba(79,70,229,0.22)',
  green:        '#16A34A',
  greenDim:     'rgba(22,163,74,0.10)',
  greenBorder:  'rgba(22,163,74,0.25)',
  warn:         '#D97706',
  warnDim:      'rgba(217,119,6,0.08)',
  warnBorder:   'rgba(217,119,6,0.22)',
};

const ACTION_ICONS = {
  pedido:       '•',
  features:     '•',
  purchase:     '•',
  signup_bonus: '•',
  default:      '•',
};

export default function BillingScreen({ navigation, currentUser }) {
  const { t } = useTranslation();
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null);
  const [subscribing, setSubscribing] = useState(false);
  const [changingPlan, setChangingPlan] = useState(false);
  const [expandedTx, setExpandedTx] = useState(new Set());

  const token = currentUser?.access_token;
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, hRes] = await Promise.all([
        fetch(`${API}/api/billing/status`, { headers: authHeader }),
        fetch(`${API}/api/billing/history?limit=30`, { headers: authHeader }),
      ]);
      if (sRes.ok) setStatus(await sRes.json());
      if (hRes.ok) {
        const hData = await hRes.json();
        setHistory(hData.transactions || []);
      }
    } catch (_) {}
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const confirmCheckout = useCallback(async (sessionId) => {
    try {
      const res = await fetch(`${API}/api/billing/checkout-confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const data = await res.json();
      if (res.ok && !data.already_credited) {
        Alert.alert(t('billing.topupSuccessTitle'), t('billing.topupSuccess', { amount: data.credits_added, balance: data.new_balance }));
      }
      load();
    } catch (_) {}
  }, [authHeader, load]);

  const confirmSubscription = useCallback(async (sessionId) => {
    try {
      const res = await fetch(`${API}/api/billing/subscription-confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const data = await res.json();
      if (res.ok && !data.already_activated) {
        Alert.alert(t('billing.subSuccessTitle'), t('billing.subSuccess'));
      }
      load();
    } catch (_) {}
  }, [authHeader, load]);

  const handleSubscribe = useCallback(async () => {
    setSubscribing(true);
    try {
      const res = await fetch(`${API}/api/billing/subscription-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert(t('billing.errorTitle'), data.error || t('common.error'));
      } else if (data.simulated) {
        Alert.alert(t('billing.subSuccessTitle'), t('billing.subSuccess'));
        load();
      } else {
        if (Platform.OS === 'web') {
          window.location.href = data.session_url;
        } else {
          Linking.openURL(data.session_url);
        }
      }
    } catch (e) {
      Alert.alert(t('billing.errorTitle'), t('common.error'));
    }
    setSubscribing(false);
  }, [authHeader, load]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const url = new URL(window.location.href);
    const billing = url.searchParams.get('billing');
    const sessionId = url.searchParams.get('session_id');
    if (billing === 'success' && sessionId) {
      url.searchParams.delete('billing');
      url.searchParams.delete('session_id');
      window.history.replaceState({}, '', url.toString());
      confirmCheckout(sessionId);
    } else if (billing === 'sub_success' && sessionId) {
      url.searchParams.delete('billing');
      url.searchParams.delete('session_id');
      window.history.replaceState({}, '', url.toString());
      confirmSubscription(sessionId);
    } else if (billing === 'cancel') {
      url.searchParams.delete('billing');
      window.history.replaceState({}, '', url.toString());
      Alert.alert(t('billing.cancelTitle'), t('billing.cancelMsg'));
    }
  }, []);

  const handleBuy = async (pkg) => {
    setBuying(pkg.id);
    try {
      if (status?.stripe_enabled) {
        const res = await fetch(`${API}/api/billing/checkout-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify({ package_id: pkg.id }),
        });
        const data = await res.json();
        if (!res.ok) {
          Alert.alert(t('billing.errorTitle'), data.error || t('common.error'));
        } else {
          if (Platform.OS === 'web') {
            window.location.href = data.session_url;
          } else {
            Linking.openURL(data.session_url);
          }
        }
      } else {
        const res = await fetch(`${API}/api/billing/creditos/topup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify({ package_id: pkg.id }),
        });
        const data = await res.json();
        if (!res.ok) {
          Alert.alert(t('billing.errorTitle'), data.error || t('common.error'));
        } else {
          Alert.alert(t('billing.topupSuccessTitle'), t('billing.topupSuccess', { amount: pkg.credits, balance: data.new_balance }));
          load();
        }
      }
    } catch (e) {
      Alert.alert(t('billing.errorTitle'), t('common.error'));
    }
    setBuying(null);
  };

  const handleChangePlan = async (plan) => {
    setChangingPlan(true);
    try {
      const res = await fetch(`${API}/api/billing/change-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert(t('billing.errorTitle'), data.error || t('common.error'));
      } else {
        load();
      }
    } catch (e) {
      Alert.alert(t('billing.errorTitle'), t('common.error'));
    }
    setChangingPlan(false);
  };

  const toggleTx = (i) => {
    setExpandedTx((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const isCredits = status?.billing_model === 'creditos';
  const isSub = status?.billing_model === 'suscripcion';

  const formatDate = (iso) => {
    if (!iso) return '';
    try { return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return iso.slice(0, 10); }
  };

  const formatDateTime = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString(undefined, {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    }
    catch { return iso.slice(0, 16).replace('T', ' '); }
  };

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>{t('billing.title')}</Text>
      </View>

      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator color={C.accent} size="large" />
        </View>
      ) : (
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>

          {/* ── Plan actual ────────────────────────────────────────────── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>{t('billing.currentPlan')}</Text>
            <View style={s.planRow}>
              <View style={[s.modeBadge, isSub ? s.modeBadgeSub : s.modeBadgeCredits]}>
                <Text style={[s.modeBadgeText, isSub ? s.modeBadgeTextSub : s.modeBadgeTextCredits]}>
                  {isSub ? t('billing.modeSubscription') : t('billing.modeCredits')}
                </Text>
              </View>
            </View>

            {isCredits && (
              <>
                <Text style={s.balanceNumber}>{status?.creditos ?? '—'}</Text>
                <Text style={s.balanceLabel}>{t('billing.creditsAvailable')}</Text>
              </>
            )}
            {isSub && (
              <>
                <Text style={s.unlimitedText}>{t('billing.unlimited')}</Text>
                <Text style={s.planDesc}>{t('billing.subscriptionDesc')}</Text>
                <Text style={[s.planPriceLabel, { marginTop: 8 }]}>
                  {status?.subscription_price_eur
                    ? `${status.subscription_price_eur.toFixed(2)} € / ${t('billing.perMonth')}`
                    : t('billing.priceOnRequest')}
                </Text>
              </>
            )}
          </View>

          {/* ── Cambiar plan ───────────────────────────────────────────── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>{t('billing.changePlan')}</Text>
            <View style={s.planToggleRow}>
              <TouchableOpacity
                style={[s.planToggleBtn, isCredits && s.planToggleBtnActive]}
                onPress={() => !isCredits && handleChangePlan('creditos')}
                disabled={isCredits || changingPlan}
              >
                <Text style={[s.planToggleBtnText, isCredits && s.planToggleBtnTextActive]}>
                  {t('billing.modeCredits')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.planToggleBtn, isSub && s.planToggleBtnActive]}
                onPress={() => !isSub && (status?.stripe_enabled ? handleSubscribe() : handleChangePlan('suscripcion'))}
                disabled={isSub || changingPlan || subscribing}
              >
                <Text style={[s.planToggleBtnText, isSub && s.planToggleBtnTextActive]}>
                  {t('billing.modeSubscription')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Pago de suscripción ───────────────────────────────────── */}
          {isSub && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>{t('billing.subscriptionPayment')}</Text>
              {status?.subscription_active ? (
                <View style={[s.warnBox, { backgroundColor: C.greenDim, borderColor: C.greenBorder }]}>
                  <Text style={[s.warnText, { color: C.green }]}>{t('billing.subscriptionActive')}</Text>
                </View>
              ) : (
                <>
                  <Text style={[s.planDesc, { marginBottom: 12 }]}>{t('billing.subscriptionPaymentDesc')}</Text>
                  {!status?.stripe_enabled && (
                    <View style={s.warnBox}>
                      <Text style={s.warnText}>{t('billing.simulatedNotice')}</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={[s.buyBtn, s.buyBtnPopular, subscribing && { opacity: 0.6 }]}
                    onPress={handleSubscribe}
                    disabled={subscribing}
                  >
                    <Text style={[s.buyBtnText, s.buyBtnTextPopular]}>
                      {subscribing
                        ? t('billing.buying')
                        : `${t('billing.subscribe')} · ${status?.subscription_price_eur != null ? status.subscription_price_eur.toFixed(2) : '—'} €/${t('billing.perMonth')}`}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* ── Coste de acciones (solo créditos) ─────────────────────── */}
          {isCredits && (
            <>
              <View style={s.section}>
                <Text style={s.sectionTitle}>{t('billing.costsTitle')}</Text>
                <View style={s.costRow}>
                  <Text style={s.costIcon}>•</Text>
                  <View style={s.costInfo}>
                    <Text style={s.costName}>{t('billing.costOrder')}</Text>
                  </View>
                  <View style={s.costBadge}>
                    <Text style={s.costBadgeText}>{status?.credit_cost_pedido ?? 5} {t('billing.credits')}</Text>
                  </View>
                </View>
                <View style={s.costDivider} />
                <View style={s.costRow}>
                  <Text style={s.costIcon}>•</Text>
                  <View style={s.costInfo}>
                    <Text style={s.costName}>{t('billing.costFeatures')}</Text>
                    <Text style={s.costHint}>{t('billing.costFeaturesHint')}</Text>
                  </View>
                  <View style={s.costBadge}>
                    <Text style={s.costBadgeText}>{status?.credit_cost_features ?? 10} {t('billing.credits')}</Text>
                  </View>
                </View>

                {!status?.stripe_enabled && (
                  <View style={s.warnBox}>
                    <Text style={s.warnText}>{t('billing.simulatedNotice')}</Text>
                  </View>
                )}
              </View>

              {/* ── Comprar créditos ──────────────────────────────────── */}
              <View style={s.section}>
                <Text style={s.sectionTitle}>{t('billing.buyCredits')}</Text>
                <View style={s.packagesGrid}>
                  {(status?.credit_packages || []).map((pkg) => (
                    <View key={pkg.id} style={[s.packageCard, pkg.popular && s.packageCardPopular]}>
                      {pkg.popular && (
                        <View style={s.popularBadge}>
                          <Text style={s.popularBadgeText}>{t('billing.popular')}</Text>
                        </View>
                      )}
                      <Text style={s.packageCredits}>{pkg.credits}</Text>
                      <Text style={s.packageCreditsLabel}>{t('billing.credits')}</Text>
                      <Text style={s.packagePrice}>{pkg.price_eur?.toFixed(2)} €</Text>
                      <TouchableOpacity
                        style={[s.buyBtn, pkg.popular && s.buyBtnPopular, buying === pkg.id && { opacity: 0.6 }]}
                        onPress={() => handleBuy(pkg)}
                        disabled={!!buying}
                      >
                        <Text style={[s.buyBtnText, pkg.popular && s.buyBtnTextPopular]}>
                          {buying === pkg.id ? t('billing.buying') : t('billing.buy')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* ── Historial ─────────────────────────────────────────────── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>{t('billing.historyTitle')}</Text>
            {history.length === 0 ? (
              <Text style={s.emptyHistory}>{t('billing.historyEmpty')}</Text>
            ) : (
              history.map((tx, i) => {
                const isPos = tx.amount > 0;
                const isExpanded = expandedTx.has(i);
                return (
                  <View key={i}>
                    {i > 0 && <View style={s.txDivider} />}
                    <TouchableOpacity
                      style={s.txRow}
                      onPress={() => toggleTx(i)}
                      activeOpacity={0.7}
                    >
                      <View style={[s.txAmountBadge, isPos ? s.txAmountBadgePos : s.txAmountBadgeNeg]}>
                        <Text style={[s.txAmountBadgeText, isPos ? s.txAmountBadgeTextPos : s.txAmountBadgeTextNeg]}>
                          {isPos ? '+' : ''}{tx.amount}
                        </Text>
                      </View>
                      <View style={s.txInfo}>
                        <Text style={s.txAction}>{t(`billing.action_${tx.action}`, { defaultValue: tx.action })}</Text>
                        {tx.pedido_id && (
                          <Text style={s.txRef}>{t('billing.order')} #{tx.pedido_id.slice(-6)}</Text>
                        )}
                        <Text style={s.txDate}>{formatDate(tx.created_at)}</Text>
                      </View>
                      <Text style={s.txChevron}>{isExpanded ? '▲' : '▼'}</Text>
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={s.txDetail}>
                        {tx.pedido_id && (
                          <View style={s.txDetailRow}>
                            <Text style={s.txDetailLabel}>{t('billing.order')}</Text>
                            <Text style={s.txDetailValue}>#{tx.pedido_id?.slice(-6)}</Text>
                          </View>
                        )}
                        <View style={s.txDetailRow}>
                          <Text style={s.txDetailLabel}>{t('billing.historyTitle')}</Text>
                          <Text style={s.txDetailValue}>{formatDateTime(tx.created_at)}</Text>
                        </View>
                        <View style={s.txDetailRow}>
                          <Text style={s.txDetailLabel}>{t('billing.balanceAfter', { n: '' }).replace(':', '').trim()}</Text>
                          <Text style={s.txDetailValue}>{tx.balance_after} {t('billing.credits')}</Text>
                        </View>
                        {tx.description && (
                          <View style={s.txDetailRow}>
                            <Text style={s.txDetailLabel}>{t('common.description') || 'Descripción'}</Text>
                            <Text style={[s.txDetailValue, { flex: 1 }]}>{tx.description}</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    backgroundColor: C.header,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: C.headerBorder,
    minHeight: 54,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.navDark,
    letterSpacing: -0.3,
  },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  scroll: { flex: 1 },
  scrollContent: { padding: 12, paddingTop: 14 },

  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    backgroundColor: C.navDark,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: -16,
    marginTop: -16,
    marginBottom: 14,
  },

  // Plan
  planRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  modeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  modeBadgeCredits: { backgroundColor: C.accentDim, borderColor: C.accentBorder },
  modeBadgeSub:     { backgroundColor: C.greenDim,  borderColor: C.greenBorder },
  modeBadgeText:    { fontSize: 12, fontWeight: '700' },
  modeBadgeTextCredits: { color: C.accent },
  modeBadgeTextSub:     { color: C.green },
  balanceNumber: {
    fontSize: 40,
    fontWeight: '900',
    color: C.accent,
    lineHeight: 46,
    letterSpacing: -1,
  },
  balanceLabel: { fontSize: 13, color: C.textSec, marginTop: 2 },
  unlimitedText: { fontSize: 18, fontWeight: '800', color: C.green },
  planDesc: { fontSize: 13, color: C.textSec, marginTop: 6, lineHeight: 20 },
  planPriceLabel: { fontSize: 13, fontWeight: '600', color: C.textMuted },

  // Costs
  costRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  costDivider: { height: 1, backgroundColor: C.border, marginVertical: 12 },
  costIcon: { fontSize: 18, marginTop: 1 },
  costInfo: { flex: 1 },
  costName: { fontSize: 14, fontWeight: '600', color: C.text },
  costHint: { fontSize: 11, color: C.textMuted, marginTop: 2, lineHeight: 16 },
  costBadge: {
    backgroundColor: C.accentDim,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.accentBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  costBadgeText: { fontSize: 12, fontWeight: '700', color: C.accent },

  // Warn box
  warnBox: {
    backgroundColor: C.warnDim,
    borderWidth: 1,
    borderColor: C.warnBorder,
    borderRadius: 8,
    padding: 10,
    marginTop: 14,
  },
  warnText: { fontSize: 11, color: C.warn, lineHeight: 17 },

  // Packages
  packagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  packageCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    padding: 14,
    alignItems: 'center',
    width: Platform.OS === 'web' ? '22%' : '47%',
    minWidth: 130,
    position: 'relative',
  },
  packageCardPopular: {
    borderColor: C.accentBorder,
    borderWidth: 1.5,
    backgroundColor: C.accentDim,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: C.accent,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  popularBadgeText: { fontSize: 10, fontWeight: '700', color: '#FFF' },
  packageCredits: { fontSize: 28, fontWeight: '900', color: C.text, lineHeight: 34 },
  packageCreditsLabel: { fontSize: 11, color: C.textMuted, marginBottom: 4 },
  packagePrice: { fontSize: 14, fontWeight: '700', color: C.textSec, marginBottom: 10 },
  buyBtn: {
    width: '100%',
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: C.borderStrong,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  buyBtnPopular: { backgroundColor: C.accent, borderColor: C.accent },
  buyBtnText: { fontSize: 13, fontWeight: '700', color: C.textSec },
  buyBtnTextPopular: { color: '#FFF' },

  // History
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  txDivider: { height: 1, backgroundColor: C.border, marginVertical: 2 },
  txAmountBadge: {
    width: 52,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    flexShrink: 0,
  },
  txAmountBadgePos:     { backgroundColor: C.greenDim,  borderColor: C.greenBorder },
  txAmountBadgeNeg:     { backgroundColor: C.accentDim, borderColor: C.accentBorder },
  txAmountBadgeText:    { fontSize: 13, fontWeight: '800' },
  txAmountBadgeTextPos: { color: C.green },
  txAmountBadgeTextNeg: { color: C.accent },
  txInfo: { flex: 1 },
  txAction: { fontSize: 13, fontWeight: '600', color: C.text },
  txRef: { fontSize: 11, color: C.accent, fontWeight: '600', marginTop: 1 },
  txDate: { fontSize: 11, color: C.textMuted, marginTop: 1 },
  txChevron: { fontSize: 9, color: C.textMuted, paddingHorizontal: 4 },

  // Expanded detail
  txDetail: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    padding: 10,
    marginBottom: 4,
    gap: 6,
  },
  txDetailRow: { flexDirection: 'row', gap: 8 },
  txDetailLabel: { fontSize: 11, color: C.textMuted, width: 90 },
  txDetailValue: { fontSize: 11, fontWeight: '600', color: C.text },

  emptyHistory: { fontSize: 13, color: C.textMuted, textAlign: 'center', paddingVertical: 12 },

  // Plan toggle
  planToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F8',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  planToggleBtn: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
  },
  planToggleBtnActive: {
    backgroundColor: C.accent,
  },
  planToggleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textSec,
  },
  planToggleBtnTextActive: {
    color: '#FFFFFF',
  },
});

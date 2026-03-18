import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  bg:          '#EEF2F8',
  header:      '#1E293B',
  headerBorder:'rgba(255,255,255,0.07)',
  surface:     '#FFFFFF',
  border:      '#E2E8F0',
  borderStrong:'#CBD5E1',
  text:        '#0F172A',
  textSec:     '#475569',
  textMuted:   '#94A3B8',
  accent:      '#3B82F6',
  accentDim:   'rgba(59,130,246,0.08)',
  accentBorder:'rgba(59,130,246,0.22)',
  green:       '#16A34A',
  greenDim:    'rgba(22,163,74,0.10)',
  greenBorder: 'rgba(22,163,74,0.25)',
  blue:        '#3B82F6',
  blueDim:     'rgba(59,130,246,0.08)',
  blueBorder:  'rgba(59,130,246,0.22)',
  warn:        '#D97706',
  warnDim:     'rgba(217,119,6,0.08)',
  warnBorder:  'rgba(217,119,6,0.22)',
};

const ACTION_ICONS = {
  pedido:   '📋',
  features: '⚙️',
  purchase: '💳',
  signup_bonus: '🎁',
  default:  '•',
};

export default function BillingScreen({ navigation, currentUser }) {
  const { t } = useTranslation();
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null); // package_id being purchased
  const [changingPlan, setChangingPlan] = useState(false);

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

  const handleBuy = async (pkg) => {
    setBuying(pkg.id);
    try {
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

  const isCredits = status?.billing_model === 'creditos';
  const isSub = status?.billing_model === 'suscripcion';

  const formatDate = (iso) => {
    if (!iso) return '';
    try { return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return iso.slice(0, 10); }
  };

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerRow}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation?.goBack?.()}>
            <Text style={s.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>{t('billing.title')}</Text>
          <View style={{ width: 38 }} />
        </View>
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
                <Text style={s.unlimitedText}>✓ {t('billing.unlimited')}</Text>
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
                onPress={() => !isSub && handleChangePlan('suscripcion')}
                disabled={isSub || changingPlan}
              >
                <Text style={[s.planToggleBtnText, isSub && s.planToggleBtnTextActive]}>
                  {t('billing.modeSubscription')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Coste de acciones (solo créditos) ─────────────────────── */}
          {isCredits && (
            <>
              <View style={s.section}>
                <Text style={s.sectionTitle}>{t('billing.costsTitle')}</Text>
                <View style={s.costRow}>
                  <Text style={s.costIcon}>📋</Text>
                  <View style={s.costInfo}>
                    <Text style={s.costName}>{t('billing.costOrder')}</Text>
                  </View>
                  <View style={s.costBadge}>
                    <Text style={s.costBadgeText}>{status?.credit_cost_pedido ?? 5} {t('billing.credits')}</Text>
                  </View>
                </View>
                <View style={s.costDivider} />
                <View style={s.costRow}>
                  <Text style={s.costIcon}>⚙️</Text>
                  <View style={s.costInfo}>
                    <Text style={s.costName}>{t('billing.costFeatures')}</Text>
                    <Text style={s.costHint}>{t('billing.costFeaturesHint')}</Text>
                  </View>
                  <View style={s.costBadge}>
                    <Text style={s.costBadgeText}>{status?.credit_cost_features ?? 10} {t('billing.credits')}</Text>
                  </View>
                </View>

                {/* Aviso pasarela simulada */}
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
                return (
                  <View key={i}>
                    {i > 0 && <View style={s.txDivider} />}
                    <View style={s.txRow}>
                      <Text style={s.txIcon}>{ACTION_ICONS[tx.action] || ACTION_ICONS.default}</Text>
                      <View style={s.txInfo}>
                        <Text style={s.txAction}>{t(`billing.action_${tx.action}`, { defaultValue: tx.action })}</Text>
                        {tx.pedido_id && <Text style={s.txRef}>{t('billing.order')} #{tx.pedido_id?.slice(-6)}</Text>}
                        <Text style={s.txDate}>{formatDate(tx.created_at)}</Text>
                      </View>
                      <View style={s.txAmountWrap}>
                        <Text style={[s.txAmount, isPos ? s.txAmountPos : s.txAmountNeg]}>
                          {isPos ? '+' : ''}{tx.amount}
                        </Text>
                        <Text style={s.txBalance}>{t('billing.balanceAfter', { n: tx.balance_after })}</Text>
                      </View>
                    </View>
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
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    minHeight: 96,
    borderBottomWidth: 1,
    borderBottomColor: C.headerBorder,
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 38,
  },
  backBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: '#F1F5F9',
    lineHeight: 32,
    fontWeight: '300',
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
    color: '#F1F5F9',
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    textAlign: 'center',
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
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F1F5F9',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: -12,
    marginTop: -12,
    marginBottom: 14,
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
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
    backgroundColor: C.blueDim,
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
  txRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  txDivider: { height: 1, backgroundColor: C.border, marginVertical: 10 },
  txIcon: { fontSize: 16, marginTop: 1 },
  txInfo: { flex: 1 },
  txAction: { fontSize: 13, fontWeight: '600', color: C.text },
  txRef: { fontSize: 11, color: C.textMuted, marginTop: 1 },
  txDate: { fontSize: 11, color: C.textMuted, marginTop: 1 },
  txAmountWrap: { alignItems: 'flex-end' },
  txAmount: { fontSize: 15, fontWeight: '800' },
  txAmountPos: { color: C.green },
  txAmountNeg: { color: C.accent },
  txBalance: { fontSize: 10, color: C.textMuted, marginTop: 1 },

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

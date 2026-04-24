import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import HelpModal from '../components/HelpModal';

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
  const [storageInfo, setStorageInfo] = useState(null);
  const [consumoMes, setConsumoMes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null);
  const [subscribing, setSubscribing] = useState(false);
  const [changingPlan, setChangingPlan] = useState(false);
  const [expandedTx, setExpandedTx] = useState(new Set());
  const [historyOpen, setHistoryOpen] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [helpVisible, setHelpVisible] = useState(false);
  const helpPlanRef    = useRef(null);
  const helpCreditsRef = useRef(null);
  const helpStorageRef = useRef(null);
  const helpHistoryRef = useRef(null);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemMsg, setRedeemMsg] = useState(null); // { type: 'ok'|'error', text }
  const [autoRecarga, setAutoRecarga] = useState(null);
  const [savingAR, setSavingAR] = useState(false);
  const [arMsg, setArMsg] = useState(null);

  const token = currentUser?.access_token;
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, hRes, stRes, cmRes] = await Promise.all([
        fetch(`${API}/api/billing/status`, { headers: authHeader }),
        fetch(`${API}/api/billing/history?limit=30`, { headers: authHeader }),
        fetch(`${API}/api/storage/resumen`, { headers: authHeader }),
        fetch(`${API}/api/billing/consumo-mes`, { headers: authHeader }),
      ]);
      if (sRes.ok) setStatus(await sRes.json());
      if (hRes.ok) {
        const hData = await hRes.json();
        setHistory(hData.transactions || []);
      }
      if (stRes.ok) setStorageInfo(await stRes.json());
      if (cmRes.ok) setConsumoMes(await cmRes.json());
    } catch (_) {}
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => {
    load();
    fetch(`${API}/api/billing/auto-recarga`, { headers: authHeader })
      .then((r) => r.json()).then(setAutoRecarga).catch(() => {});
  }, [load]));

  const saveAutoRecarga = async () => {
    if (!autoRecarga) return;
    setSavingAR(true); setArMsg(null);
    try {
      const res = await fetch(`${API}/api/billing/auto-recarga`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify(autoRecarga),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setArMsg({ type: 'ok', text: t('billing.autoRechargeSaved') });
    } catch (e) { setArMsg({ type: 'error', text: e.message }); }
    setSavingAR(false);
  };

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

  const handleRedeemPromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    setRedeeming(true);
    setRedeemMsg(null);
    try {
      const res = await fetch(`${API}/api/billing/redeem-promo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRedeemMsg({ type: 'error', text: data.error || t('common.error') });
      } else {
        setRedeemMsg({ type: 'ok', text: t('billing.promoSuccess', { credits: data.credits_added, balance: data.new_balance }) });
        setPromoCode('');
        load();
      }
    } catch (_) {
      setRedeemMsg({ type: 'error', text: t('common.error') });
    }
    setRedeeming(false);
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

  // Empresas gestionadas por un revendedor no ven facturación
  if (currentUser?.reseller_id) {
    return (
      <View style={s.root}>
        <View style={s.header}>
          <Text style={s.headerTitle}>{t('billing.title')}</Text>
        </View>
        <View style={s.resellerNotice}>
          <Text style={s.resellerIcon}>🤝</Text>
          <Text style={s.resellerTitle}>{t('billing.resellerTitle')}</Text>
          <Text style={s.resellerSub}>{t('billing.resellerSub')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.root}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>{t('billing.title')}</Text>
        <Pressable onPress={() => setHelpVisible(true)} style={s.helpBtn}>
          <Text style={s.helpBtnText}>?</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator color={C.accent} size="large" />
        </View>
      ) : (
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>

          {/* ── Plan actual + Coste por acción (misma fila) ───────────── */}
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'stretch' }}>

            {/* Plan actual */}
            <View style={[s.section, { flex: 1 }]} ref={helpPlanRef}>
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
                  {status?.billing_discount_pct > 0 ? (
                    <View style={{ marginTop: 8, gap: 2 }}>
                      <Text style={[s.planPriceLabel, { textDecorationLine: 'line-through', color: '#94A3B8', fontSize: 13 }]}>
                        {status.subscription_price_base_eur?.toFixed(2)} € / {t('billing.perMonth')}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={[s.planPriceLabel, { color: '#16A34A' }]}>
                          {status.subscription_price_eur.toFixed(2)} € / {t('billing.perMonth')}
                        </Text>
                        <View style={{ backgroundColor: '#DCFCE7', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#15803D' }}>
                            {t('billing.discountBadge', { n: status.billing_discount_pct })}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <Text style={[s.planPriceLabel, { marginTop: 8 }]}>
                      {status?.subscription_price_eur
                        ? `${status.subscription_price_eur.toFixed(2)} € / ${t('billing.perMonth')}`
                        : t('billing.priceOnRequest')}
                    </Text>
                  )}
                </>
              )}
            </View>

            {/* Coste por acción (solo créditos) */}
            {isCredits && (
              <View style={[s.section, { flex: 1 }]}>
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
            )}

          </View>

          {/* ── Consumo del mes (ambos planes) ─────────────────────────── */}
          {consumoMes && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>{t('billing.consumoMesTitle', { mes: consumoMes.mes })}</Text>

              {isSub ? (
                <>
                  <View style={s.costRow}>
                    <View style={s.costInfo}>
                      <Text style={s.costName}>{t('billing.cuotaMensualFija')}</Text>
                      {consumoMes.billing_discount_pct > 0 && (
                        <Text style={s.costHint}>{t('billing.descuentoAplicado', { n: consumoMes.billing_discount_pct })}</Text>
                      )}
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: C.text }}>
                      {consumoMes.cuota_fija_eur.toFixed(2)} €
                    </Text>
                  </View>
                  <View style={s.costDivider} />
                  <View style={s.costRow}>
                    <View style={s.costInfo}>
                      <Text style={s.costName}>{t('billing.almacenamientoPDF')}</Text>
                      <Text style={s.costHint}>
                        {t('billing.storageAccumHint', { gb: consumoMes.storage_gb.toFixed(4), rate: consumoMes.storage_cost_eur_per_gb })}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: C.text }}>
                      {consumoMes.coste_storage_eur.toFixed(4)} €
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  {/* ── Resumen créditos → € ── */}
                  <View style={s.costRow}>
                    <View style={s.costInfo}>
                      <Text style={s.costName}>{t('billing.creditosConsumidos')}</Text>
                      <Text style={s.costHint}>
                        {consumoMes.total_creditos_mes} cr × {consumoMes.credito_price_final_eur ?? consumoMes.credito_price_eur} €/cr
                        {consumoMes.billing_discount_pct > 0 && ` · 🏷️ -${consumoMes.billing_discount_pct}%`}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: C.text }}>
                      {consumoMes.total_uso_eur.toFixed(2)} €
                    </Text>
                  </View>

                  {/* ── Desglose por acción (secundario) ── */}
                  {(consumoMes.detalle_acciones || []).length > 0 && (
                    <View style={{ marginLeft: 12, marginTop: 4, marginBottom: 4,
                      borderLeftWidth: 2, borderLeftColor: C.border, paddingLeft: 10 }}>
                      {(consumoMes.detalle_acciones || []).map((item, i) => (
                        <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between',
                          alignItems: 'center', paddingVertical: 3 }}>
                          <Text style={{ fontSize: 12, color: C.textSec, flex: 1 }}>
                            {item.label}
                            <Text style={{ color: C.textMuted }}> · {item.usos} uso{item.usos !== 1 ? 's' : ''} · {item.creditos} cr</Text>
                          </Text>
                          <Text style={{ fontSize: 12, fontWeight: '600', color: C.textSec }}>
                            {item.eur.toFixed(4)} €
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={s.costDivider} />

                  {/* ── Almacenamiento ── */}
                  <View style={s.costRow}>
                    <View style={s.costInfo}>
                      <Text style={s.costName}>{t('billing.almacenamientoPDF')}</Text>
                      <Text style={s.costHint}>
                        {t('billing.storageDetailHint', { gb: consumoMes.storage_gb.toFixed(4), rate: consumoMes.storage_cost_eur_per_gb })}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: C.text }}>
                      {consumoMes.coste_storage_eur.toFixed(4)} €
                    </Text>
                  </View>
                </>
              )}

              <View style={s.costDivider} />
              <View style={[s.costRow, { marginTop: 8 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: C.text }}>{t('billing.totalEstimadoMes')}</Text>
                  {isSub && (
                    <Text style={s.costHint}>{t('billing.pedidosEnCuota')}</Text>
                  )}
                </View>
                <Text style={{ fontSize: 20, fontWeight: '800', color: C.accent }}>
                  {consumoMes.total_estimado_eur.toFixed(2)} €
                </Text>
              </View>
            </View>
          )}

          {/* ── Cambiar plan ───────────────────────────────────────────── */}
          <View style={s.section} ref={helpCreditsRef}>
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

          {/* ── Comprar créditos ─────────────────────────────────────── */}
          {isCredits && (
            <>
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

          {/* ── Código promocional ───────────────────────────────────── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>{t('billing.promoTitle')}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                style={[s.promoInput]}
                placeholder={t('billing.promoPlaceholder')}
                placeholderTextColor={C.textMuted}
                value={promoCode}
                onChangeText={(v) => { setPromoCode(v.toUpperCase()); setRedeemMsg(null); }}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[s.promoBtn, redeeming && { opacity: 0.6 }]}
                onPress={handleRedeemPromo}
                disabled={redeeming || !promoCode.trim()}
              >
                {redeeming
                  ? <ActivityIndicator size="small" color="#FFFFFF" />
                  : <Text style={s.promoBtnText}>{t('billing.promoRedeem')}</Text>
                }
              </TouchableOpacity>
            </View>
            {redeemMsg && (
              <View style={[s.redeemMsg, redeemMsg.type === 'ok' ? s.redeemMsgOk : s.redeemMsgError]}>
                <Text style={[s.redeemMsgText, redeemMsg.type === 'ok' ? { color: C.green } : { color: '#DC2626' }]}>
                  {redeemMsg.text}
                </Text>
              </View>
            )}
          </View>

          {/* ── Auto-recarga ─────────────────────────────────────────── */}
          {autoRecarga && !isSub && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>{t('billing.autoRechargeTitle')}</Text>
              <View style={s.arRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.arLabel}>{t('billing.autoRechargeEnable')}</Text>
                  <Text style={s.arSub}>{t('billing.autoRechargeDesc')}</Text>
                </View>
                <TouchableOpacity
                  style={[s.arToggle, autoRecarga.auto_recarga_enabled && s.arToggleOn]}
                  onPress={() => setAutoRecarga((ar) => ({ ...ar, auto_recarga_enabled: !ar.auto_recarga_enabled }))}
                >
                  <Text style={[s.arToggleText, autoRecarga.auto_recarga_enabled && { color: C.accent }]}>
                    {autoRecarga.auto_recarga_enabled ? t('billing.autoRechargeOn') : t('billing.autoRechargeOff')}
                  </Text>
                </TouchableOpacity>
              </View>

              {autoRecarga.auto_recarga_enabled && (
                <>
                  <Text style={s.arFieldLabel}>{t('billing.autoRechargeThreshold')}</Text>
                  <TextInput
                    style={s.arInput}
                    value={String(autoRecarga.auto_recarga_umbral ?? 20)}
                    onChangeText={(v) => setAutoRecarga((ar) => ({ ...ar, auto_recarga_umbral: parseInt(v) || 0 }))}
                    keyboardType="numeric"
                    placeholder={t('billing.autoRechargeThresholdPlaceholder')}
                    placeholderTextColor={C.textMuted}
                  />
                  <Text style={[s.arSub, { marginBottom: 8 }]}>{t('billing.autoRechargeThresholdHint')}</Text>

                  <Text style={s.arFieldLabel}>{t('billing.autoRechargePack')}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, marginBottom: 12 }}>
                    {(autoRecarga.packs || []).map((p) => (
                      <TouchableOpacity
                        key={p.id}
                        style={[s.arPackBtn, autoRecarga.auto_recarga_pack === p.id && s.arPackBtnActive]}
                        onPress={() => setAutoRecarga((ar) => ({ ...ar, auto_recarga_pack: p.id }))}
                      >
                        <Text style={[s.arPackText, autoRecarga.auto_recarga_pack === p.id && { color: C.accent }]}>
                          {t('billing.packLabel', { credits: p.credits, price: p.price_eur })}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {arMsg && (
                <View style={[s.redeemMsg, arMsg.type === 'ok' ? s.redeemMsgOk : s.redeemMsgError]}>
                  <Text style={[s.redeemMsgText, { color: arMsg.type === 'ok' ? C.green : '#DC2626' }]}>{arMsg.text}</Text>
                </View>
              )}
              <TouchableOpacity
                style={[s.promoBtn, savingAR && { opacity: 0.6 }]}
                onPress={saveAutoRecarga} disabled={savingAR}
              >
                {savingAR ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={s.promoBtnText}>{t('billing.autoRechargeSave')}</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* ── Almacenamiento ────────────────────────────────────────── */}
          {storageInfo && (
            <View style={s.section} ref={helpStorageRef}>
              <Text style={s.sectionTitle}>{t('billing.storageTitle')}</Text>
              <View style={s.storageRow}>
                <View style={s.storageStat}>
                  <Text style={s.storageStatNum}>{storageInfo.total_human}</Text>
                  <Text style={s.storageStatLabel}>{t('billing.storageTotal')}</Text>
                </View>
                <View style={s.storageDivider} />
                <View style={s.storageStat}>
                  <Text style={s.storageStatNum}>{storageInfo.total_archivos}</Text>
                  <Text style={s.storageStatLabel}>{t('billing.storageFiles')}</Text>
                </View>
                <View style={s.storageDivider} />
                <View style={s.storageStat}>
                  <Text style={s.storageStatNum}>{storageInfo.num_pedidos}</Text>
                  <Text style={s.storageStatLabel}>{t('billing.storageOrders')}</Text>
                </View>
              </View>
              <View style={[s.warnBox, { backgroundColor: C.accentDim, borderColor: C.accentBorder, marginTop: 12 }]}>
                <Text style={[s.warnText, { color: C.accent }]}>
                  {t('billing.storageCost', {
                    coste: storageInfo.coste_mes_eur.toFixed(4),
                    tarifa: storageInfo.coste_por_gb_eur.toFixed(2),
                  })}
                </Text>
              </View>
            </View>
          )}

          {/* ── Historial ─────────────────────────────────────────────── */}
          <View style={s.section} ref={helpHistoryRef}>
            <TouchableOpacity
              style={s.sectionTitleRow}
              onPress={() => setHistoryOpen((v) => !v)}
              activeOpacity={0.7}
            >
              <Text style={[s.sectionTitle, s.sectionTitleCollapsible]}>{t('billing.historyTitle')}</Text>
              <Text style={s.sectionTitleChevron}>{historyOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {historyOpen && (history.length === 0 ? (
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
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
      <HelpModal
        visible={helpVisible}
        onClose={() => { AsyncStorage.setItem('help_seen_facturacion', '1'); setHelpVisible(false); }}
        title={t('help.facturacion.title')}
        steps={[
          { icon: t('help.facturacion.s1i'), title: t('help.facturacion.s1t'), desc: t('help.facturacion.s1d'), spotlight: { ref: helpPlanRef } },
          { icon: t('help.facturacion.s2i'), title: t('help.facturacion.s2t'), desc: t('help.facturacion.s2d'), spotlight: { ref: helpCreditsRef } },
          { icon: t('help.facturacion.s3i'), title: t('help.facturacion.s3t'), desc: t('help.facturacion.s3d'), spotlight: { ref: helpStorageRef } },
          { icon: t('help.facturacion.s4i'), title: t('help.facturacion.s4t'), desc: t('help.facturacion.s4d'), spotlight: { ref: helpHistoryRef } },
        ]}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  resellerNotice: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  resellerIcon:   { fontSize: 48, marginBottom: 16 },
  resellerTitle:  { fontSize: 18, fontWeight: '700', color: '#1E1B4B', marginBottom: 10, textAlign: 'center' },
  resellerSub:    { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22 },

  // Header
  header: {
    backgroundColor: C.header,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: C.headerBorder,
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helpBtn: { padding: 4 },
  helpBtnText: { fontSize: 14, color: '#94A3B8' },
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
    backgroundColor: '#FAFBFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E7ED',
    padding: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECEFFE',
    marginHorizontal: -12,
    marginTop: -12,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4F46E5',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    backgroundColor: '#ECEFFE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: -12,
    marginTop: -12,
    marginBottom: 14,
  },
  sectionTitleCollapsible: {
    flex: 1,
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
  },
  sectionTitleChevron: {
    fontSize: 9,
    color: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 8,
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

  // Storage
  storageRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 8 },
  storageStat: { alignItems: 'center', flex: 1 },
  storageStatNum: { fontSize: 22, fontWeight: '900', color: C.text },
  storageStatLabel: { fontSize: 11, color: C.textMuted, marginTop: 2, textAlign: 'center' },
  storageDivider: { width: 1, height: 36, backgroundColor: C.border },

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
  promoInput: {
    flex: 1,
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    fontWeight: '700',
    color: C.accent,
    letterSpacing: 1,
  },
  promoBtn: {
    backgroundColor: C.accent,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  arRow:        { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  arLabel:      { fontSize: 14, fontWeight: '600', color: C.text },
  arSub:        { fontSize: 12, color: C.textMuted, marginTop: 1 },
  arToggle:     { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg },
  arToggleOn:   { borderColor: C.accent, backgroundColor: C.accentDim },
  arToggleText: { fontSize: 13, fontWeight: '700', color: C.textMuted },
  arFieldLabel: { fontSize: 12, fontWeight: '600', color: C.textSec, marginBottom: 4 },
  arInput:      { backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: C.text, marginBottom: 4 },
  arPackBtn:    { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg },
  arPackBtnActive: { borderColor: C.accent, backgroundColor: C.accentDim },
  arPackText:   { fontSize: 12, fontWeight: '600', color: C.textSec },

  redeemMsg: {
    marginTop: 8,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
  },
  redeemMsgOk: {
    backgroundColor: C.greenDim,
    borderColor: C.greenBorder,
  },
  redeemMsgError: {
    backgroundColor: 'rgba(220,38,38,0.06)',
    borderColor: 'rgba(220,38,38,0.2)',
  },
  redeemMsgText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

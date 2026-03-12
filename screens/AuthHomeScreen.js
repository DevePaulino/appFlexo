import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { C, R, S } from './theme';

const API_BASE = 'http://localhost:8080';

// ─── Estilos ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // Layout split (web: row, mobile: column)
  split: {
    flex: 1,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    minHeight: Platform.OS === 'web' ? '100vh' : undefined,
  },

  // ── Panel izquierdo (marca) ──────────────────────────────────────────────
  brand: {
    backgroundColor: C.header,
    justifyContent: 'center',
    padding: 40,
    ...(Platform.OS === 'web'
      ? { width: '45%', minHeight: '100vh' }
      : { paddingVertical: 36, paddingHorizontal: 28 }),
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  logoMark: {
    width: 48,
    height: 48,
    borderRadius: R.lg,
    backgroundColor: '#DC262620',
    borderWidth: 1,
    borderColor: '#DC262640',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  logoMarkInner: {
    width: 24,
    height: 24,
    borderRadius: 5,
    backgroundColor: '#DC2626',
  },
  logoName: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  logoNamePrint: {
    color: '#FFFFFF',
  },
  logoNameForge: {
    color: '#DC2626',
  },
  logoSuffix: {
    fontSize: 28,
    fontWeight: '400',
    color: '#94A3B8',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: Platform.OS === 'web' ? 32 : 24,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: Platform.OS === 'web' ? 40 : 30,
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  brandSub: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 22,
    marginBottom: 32,
    maxWidth: 340,
  },
  prepressSection: {
    marginBottom: 24,
  },
  prepressSectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  pill: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: R.full,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#FFFFFF0A',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  featureList: {
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  featureDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#475569',
    marginTop: 8,
    flexShrink: 0,
  },
  featureText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    flex: 1,
  },

  // ── Panel derecho (formulario) ───────────────────────────────────────────
  formPanel: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Platform.OS === 'web' ? 40 : 24,
    backgroundColor: C.bg,
  },
  formCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: C.surface,
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: C.border,
    padding: 28,
    ...S.card,
  },

  // ── Tabs login / registro ────────────────────────────────────────────────
  tabs: {
    flexDirection: 'row',
    backgroundColor: C.surfaceAlt,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: C.header,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textMuted,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // ── Encabezado del formulario ────────────────────────────────────────────
  formTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: C.text,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  formSub: {
    fontSize: 13,
    color: C.textMuted,
    lineHeight: 19,
    marginBottom: 20,
  },

  // ── Campos ──────────────────────────────────────────────────────────────
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textSec,
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: C.borderStrong,
    borderRadius: R.md,
    backgroundColor: C.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: C.text,
    fontSize: 14,
  },
  inputFocused: {
    borderColor: C.borderFocus,
    backgroundColor: C.surface,
  },

  // ── Billing model (registro) ─────────────────────────────────────────────
  billingRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  billingBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surfaceAlt,
    alignItems: 'center',
  },
  billingBtnActive: {
    borderColor: C.header,
    backgroundColor: C.header,
  },
  billingBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.textMuted,
  },
  billingBtnTextActive: {
    color: '#FFFFFF',
  },
  billingDesc: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 5,
    lineHeight: 16,
  },

  // ── Error ────────────────────────────────────────────────────────────────
  errorBox: {
    backgroundColor: C.errorBg,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: R.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 12,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.danger,
  },

  // ── Botón principal ──────────────────────────────────────────────────────
  submitBtn: {
    marginTop: 16,
    minHeight: 44,
    borderRadius: R.md,
    backgroundColor: C.header,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },

  // ── Botón secundario (volver) ────────────────────────────────────────────
  backBtn: {
    marginTop: 10,
    minHeight: 40,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: C.textSec,
    fontSize: 13,
    fontWeight: '600',
  },

  // ── MFA ─────────────────────────────────────────────────────────────────
  mfaHelper: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 5,
    lineHeight: 16,
  },
  mfaDevBadge: {
    backgroundColor: C.warningBg,
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: R.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
  },
  mfaDevText: {
    fontSize: 12,
    color: C.warningText,
    fontWeight: '600',
  },
});

// ─── Componente principal ─────────────────────────────────────────────────────
export default function AuthHomeScreen({ onAuthSuccess }) {
  const { t } = useTranslation();
  const [authMode, setAuthMode] = useState('login');
  const [billingModel, setBillingModel] = useState('creditos');
  const [nombre, setNombre] = useState('');
  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [cif, setCif] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaChallengeId, setMfaChallengeId] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaExpiresAt, setMfaExpiresAt] = useState(0);
  const [mfaDevCode, setMfaDevCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState('');

  const inp = (field) => [
    s.input,
    focusedField === field && s.inputFocused,
  ];

  // ── Login ─────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    setError('');
    setMfaDevCode('');
    if (!email.trim()) { setError(t('auth.errorEmail')); return; }
    if (!password.trim()) { setError(t('auth.errorPassword')); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || t('auth.errorLogin')); return; }

      if (data.mfa_required && data.challenge_id) {
        setMfaChallengeId(data.challenge_id);
        setMfaExpiresAt(Number(data.mfa_expires_at || 0));
        setMfaDevCode(String(data.dev_mfa_code || ''));
        setError('');
        return;
      }

      onAuthSuccess?.({
        usuario: data.usuario,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        access_expires_at: data.access_expires_at,
      });
    } catch (e) {
      setError(t('auth.errorLogin'));
    } finally {
      setLoading(false);
    }
  };

  // ── MFA ───────────────────────────────────────────────────────────────────
  const handleVerifyMfa = async () => {
    setError('');
    if (!mfaCode.trim()) { setError(t('auth.errorMfa')); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/mfa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_id: mfaChallengeId, code: mfaCode.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || t('auth.errorMfaInvalid')); return; }

      onAuthSuccess?.({
        usuario: data.usuario,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        access_expires_at: data.access_expires_at,
      });
    } catch (e) {
      setError(t('auth.errorMfaInvalid'));
    } finally {
      setLoading(false);
    }
  };

  // ── Registro ──────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    setError('');
    if (!nombre.trim()) { setError(t('auth.errorName')); return; }
    if (!nombreEmpresa.trim()) { setError(t('auth.errorCompany')); return; }
    const cifNorm = String(cif || '').trim().replace(/[\s-]/g, '').toUpperCase();
    if (!cifNorm) { setError(t('auth.errorCif')); return; }
    if (!/^[A-Z]\d{7}[A-Z0-9]$/.test(cifNorm)) { setError(t('auth.errorCifInvalid')); return; }
    if (!email.trim()) { setError(t('auth.errorEmailRequired')); return; }
    if (password.length < 6) { setError(t('auth.errorPasswordLength')); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          nombre_empresa: nombreEmpresa.trim(),
          cif: cifNorm,
          email: email.trim().toLowerCase(),
          password,
          billing_model: billingModel,
          payment_method: 'paypal',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || t('auth.errorLogin')); return; }

      onAuthSuccess?.({
        usuario: data.usuario,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        access_expires_at: data.access_expires_at,
      });
    } catch (e) {
      setError(t('auth.errorLogin'));
    } finally {
      setLoading(false);
    }
  };

  // ── MFA view ──────────────────────────────────────────────────────────────
  const MfaView = () => (
    <>
      <Text style={s.formTitle}>{t('auth.mfaTitle')}</Text>
      <Text style={s.formSub}>{t('auth.mfaSubtitle')}</Text>

      {mfaExpiresAt > 0 && (
        <Text style={s.mfaHelper}>
          {t('auth.mfaExpires', { seconds: Math.max(0, Math.floor(mfaExpiresAt - Date.now() / 1000)) })}
        </Text>
      )}
      {!!mfaDevCode && (
        <View style={s.mfaDevBadge}>
          <Text style={s.mfaDevText}>Código de dev: {mfaDevCode}</Text>
        </View>
      )}

      <Text style={s.label}>{t('auth.mfaCodeLabel')}</Text>
      <TextInput
        style={inp('mfa')}
        value={mfaCode}
        onChangeText={setMfaCode}
        placeholder={t('auth.mfaCodePlaceholder')}
        placeholderTextColor={C.textMuted}
        keyboardType="number-pad"
        onFocus={() => setFocusedField('mfa')}
        onBlur={() => setFocusedField('')}
      />

      {!!error && <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View>}

      <TouchableOpacity
        style={[s.submitBtn, loading && { opacity: 0.7 }]}
        onPress={handleVerifyMfa}
        disabled={loading}
      >
        <Text style={s.submitBtnText}>{loading ? t('auth.verifyBtnLoading') : t('auth.verifyBtn')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={s.backBtn}
        onPress={() => {
          setMfaChallengeId('');
          setMfaCode('');
          setMfaExpiresAt(0);
          setMfaDevCode('');
          setError('');
        }}
      >
        <Text style={s.backBtnText}>{t('auth.backBtn')}</Text>
      </TouchableOpacity>
    </>
  );

  // ── Login view ────────────────────────────────────────────────────────────
  const LoginView = () => (
    <>
      <Text style={s.formTitle}>{t('auth.loginTitle')}</Text>
      <Text style={s.formSub}>{t('auth.loginSubtitle')}</Text>

      <Text style={s.label}>{t('auth.emailLabel')}</Text>
      <TextInput
        style={inp('email')}
        value={email}
        onChangeText={setEmail}
        placeholder={t('auth.emailPlaceholder')}
        placeholderTextColor={C.textMuted}
        autoCapitalize="none"
        keyboardType="email-address"
        onFocus={() => setFocusedField('email')}
        onBlur={() => setFocusedField('')}
      />

      <Text style={s.label}>{t('auth.passwordLabel')}</Text>
      <TextInput
        style={inp('password')}
        value={password}
        onChangeText={setPassword}
        placeholder={t('auth.passwordPlaceholder')}
        placeholderTextColor={C.textMuted}
        secureTextEntry
        onFocus={() => setFocusedField('password')}
        onBlur={() => setFocusedField('')}
        onSubmitEditing={handleLogin}
      />

      {!!error && <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View>}

      <TouchableOpacity
        style={[s.submitBtn, loading && { opacity: 0.7 }]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={s.submitBtnText}>{loading ? t('auth.loginBtnLoading') : t('auth.loginBtn')}</Text>
      </TouchableOpacity>
    </>
  );

  // ── Register view ─────────────────────────────────────────────────────────
  const RegisterView = () => (
    <>
      <Text style={s.formTitle}>{t('auth.registerTitle')}</Text>
      <Text style={s.formSub}>{t('auth.registerSubtitle')}</Text>

      <Text style={s.label}>{t('auth.nameLabel')}</Text>
      <TextInput
        style={inp('nombre')}
        value={nombre}
        onChangeText={setNombre}
        placeholder={t('auth.namePlaceholder')}
        placeholderTextColor={C.textMuted}
        onFocus={() => setFocusedField('nombre')}
        onBlur={() => setFocusedField('')}
      />

      <Text style={s.label}>{t('auth.companyLabel')}</Text>
      <TextInput
        style={inp('empresa')}
        value={nombreEmpresa}
        onChangeText={setNombreEmpresa}
        placeholder={t('auth.companyPlaceholder')}
        placeholderTextColor={C.textMuted}
        onFocus={() => setFocusedField('empresa')}
        onBlur={() => setFocusedField('')}
      />

      <Text style={s.label}>{t('auth.cifLabel')}</Text>
      <TextInput
        style={inp('cif')}
        value={cif}
        onChangeText={setCif}
        placeholder={t('auth.cifPlaceholder')}
        placeholderTextColor={C.textMuted}
        autoCapitalize="characters"
        onFocus={() => setFocusedField('cif')}
        onBlur={() => setFocusedField('')}
      />

      <Text style={s.label}>{t('auth.emailLabel')}</Text>
      <TextInput
        style={inp('email')}
        value={email}
        onChangeText={setEmail}
        placeholder={t('auth.emailPlaceholder')}
        placeholderTextColor={C.textMuted}
        autoCapitalize="none"
        keyboardType="email-address"
        onFocus={() => setFocusedField('email')}
        onBlur={() => setFocusedField('')}
      />

      <Text style={s.label}>{t('auth.passwordLabel')}</Text>
      <TextInput
        style={inp('password')}
        value={password}
        onChangeText={setPassword}
        placeholder={t('auth.passwordPlaceholder')}
        placeholderTextColor={C.textMuted}
        secureTextEntry
        onFocus={() => setFocusedField('password')}
        onBlur={() => setFocusedField('')}
      />

      <Text style={[s.label, { marginTop: 14 }]}>{t('auth.billingLabel')}</Text>
      <View style={s.billingRow}>
        <Pressable
          style={[s.billingBtn, billingModel === 'creditos' && s.billingBtnActive]}
          onPress={() => setBillingModel('creditos')}
        >
          <Text style={[s.billingBtnText, billingModel === 'creditos' && s.billingBtnTextActive]}>
            {t('auth.billingCredits')}
          </Text>
        </Pressable>
        <Pressable
          style={[s.billingBtn, billingModel === 'suscripcion' && s.billingBtnActive]}
          onPress={() => setBillingModel('suscripcion')}
        >
          <Text style={[s.billingBtnText, billingModel === 'suscripcion' && s.billingBtnTextActive]}>
            {t('auth.billingSubscription')}
          </Text>
        </Pressable>
      </View>
      <Text style={s.billingDesc}>
        {billingModel === 'creditos'
          ? t('auth.billingCreditsDesc')
          : t('auth.billingSubscriptionDesc')}
      </Text>

      {!!error && <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View>}

      <TouchableOpacity
        style={[s.submitBtn, loading && { opacity: 0.7 }]}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={s.submitBtnText}>{loading ? t('auth.registerBtnLoading') : t('auth.registerBtn')}</Text>
      </TouchableOpacity>
    </>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <View style={s.split}>

        {/* Panel de marca */}
        <View style={s.brand}>
          <View style={s.logoRow}>
            <View style={s.logoMark}>
              <View style={s.logoMarkInner} />
            </View>
            <Text style={s.logoName}>
              <Text style={s.logoNamePrint}>Print</Text>
              <Text style={s.logoNameForge}>Forge</Text>
              <Text style={s.logoSuffix}> Pro</Text>
            </Text>
          </View>

          <Text style={s.brandTagline}>
            {t('auth.brandTagline')}
          </Text>
          <Text style={s.brandSub}>
            {t('auth.brandDesc')}
          </Text>

          {/* Capacidades de preimpresión */}
          <View style={s.prepressSection}>
            <Text style={s.prepressSectionLabel}>{t('auth.prepressTitle')}</Text>
            <View style={s.pillRow}>
              <View style={s.pill}>
                <Text style={s.pillText}>{t('auth.prepressDesc')}</Text>
              </View>
            </View>
          </View>

          {/* Otras capacidades */}
          <View style={s.featureList}>
            {[
              t('auth.feature1'),
              t('auth.feature2'),
              t('auth.feature3'),
            ].map((f, i) => (
              <View key={i} style={s.featureRow}>
                <View style={s.featureDot} />
                <Text style={s.featureText}>{f}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Panel de formulario */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.formPanel}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.formCard}>
            {mfaChallengeId ? (
              <MfaView />
            ) : (
              <>
                {/* Tabs */}
                <View style={s.tabs}>
                  <Pressable
                    style={[s.tab, authMode === 'login' && s.tabActive]}
                    onPress={() => { setAuthMode('login'); setError(''); }}
                  >
                    <Text style={[s.tabText, authMode === 'login' && s.tabTextActive]}>
                      {t('auth.switchToLogin')}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[s.tab, authMode === 'register' && s.tabActive]}
                    onPress={() => { setAuthMode('register'); setError(''); }}
                  >
                    <Text style={[s.tabText, authMode === 'register' && s.tabTextActive]}>
                      {t('auth.switchToRegister')}
                    </Text>
                  </Pressable>
                </View>

                {authMode === 'login' ? <LoginView /> : <RegisterView />}
              </>
            )}
          </View>
        </ScrollView>

      </View>
    </View>
  );
}

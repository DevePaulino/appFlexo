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
import { R, S } from './theme';
import LegalModal from '../components/LegalModal';

const API_BASE = 'http://localhost:8080';

// ─── Paleta ───────────────────────────────────────────────────────────────────
const P = {
  bg:          '#0A0A0C',
  bgPanel:     '#0E0E10',
  surface:     '#141416',
  surfaceAlt:  '#1C1C1F',
  border:      'rgba(255,255,255,0.08)',
  borderInput: 'rgba(255,255,255,0.12)',
  borderFocus: '#E8522A',
  accent:      '#E8522A',
  accentDim:   'rgba(232,82,42,0.15)',
  accentBorder:'rgba(232,82,42,0.30)',
  text:        '#FFFFFF',
  textSec:     'rgba(255,255,255,0.55)',
  textMuted:   'rgba(255,255,255,0.28)',
  danger:      '#F87171',
  dangerBg:    'rgba(248,113,113,0.10)',
  dangerBorder:'rgba(248,113,113,0.25)',
};

// ─── Módulos de la app ────────────────────────────────────────────────────────
const MODULES = [
  { icon: '📋', key: 'Pedidos' },
  { icon: '💼', key: 'Presupuestos' },
  { icon: '⚙️', key: 'Producción' },
  { icon: '📦', key: 'Materiales' },
  { icon: '🖨️', key: 'Máquinas' },
  { icon: '👥', key: 'Roles y permisos' },
];

// ─── Estilos ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: P.bg,
  },

  split: {
    flex: 1,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    minHeight: Platform.OS === 'web' ? '100vh' : undefined,
  },

  // ── Panel izquierdo ──────────────────────────────────────────────────────
  brand: {
    backgroundColor: P.bg,
    justifyContent: 'center',
    padding: 48,
    ...(Platform.OS === 'web'
      ? { width: '48%', minHeight: '100vh' }
      : { paddingVertical: 40, paddingHorizontal: 28 }),
  },

  // Marca superior
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 56,
  },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: P.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: P.accent,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  logoMarkSlash: {
    width: 3,
    height: 22,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    transform: [{ rotate: '20deg' }],
  },
  logoName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  logoNamePrint: {
    color: '#FFFFFF',
  },
  logoNameForge: {
    color: P.accent,
  },
  logoSuffix: {
    fontSize: 20,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 0.2,
  },

  // Titular principal
  brandEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: P.accent,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  brandTagline: {
    fontSize: Platform.OS === 'web' ? 38 : 26,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: Platform.OS === 'web' ? 46 : 32,
    letterSpacing: -1,
    marginBottom: 16,
  },
  brandTaglineAccent: {
    color: P.accent,
  },
  brandSub: {
    fontSize: 14,
    color: P.textSec,
    lineHeight: 24,
    marginBottom: 44,
    maxWidth: 380,
  },

  // Módulos
  modulesLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: P.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  moduleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: R.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  moduleChipIcon: {
    fontSize: 12,
  },
  moduleChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.50)',
  },
  modulesCaption: {
    fontSize: 11,
    color: P.textMuted,
    lineHeight: 17,
  },
  modulesCaptionAccent: {
    color: P.accent,
    fontWeight: '600',
  },

  // ── Separador vertical ───────────────────────────────────────────────────
  divider: {
    ...(Platform.OS === 'web'
      ? { width: 1, backgroundColor: 'rgba(255,255,255,0.05)' }
      : { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 28 }),
  },

  // ── Panel derecho (formulario) ───────────────────────────────────────────
  formPanel: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Platform.OS === 'web' ? 48 : 24,
    backgroundColor: P.bgPanel,
  },
  formCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: P.surface,
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: P.border,
    padding: 30,
    ...S.modal,
  },

  // ── Tabs login / registro ────────────────────────────────────────────────
  tabs: {
    flexDirection: 'row',
    backgroundColor: P.surfaceAlt,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: P.border,
    overflow: 'hidden',
    marginBottom: 28,
    padding: 3,
    gap: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 7,
  },
  tabActive: {
    backgroundColor: P.accent,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: P.textMuted,
    letterSpacing: 0.2,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // ── Cabecera del formulario ──────────────────────────────────────────────
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: P.text,
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  formSub: {
    fontSize: 13,
    color: P.textSec,
    lineHeight: 20,
    marginBottom: 24,
  },

  // ── Campos ──────────────────────────────────────────────────────────────
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: P.textSec,
    marginBottom: 6,
    marginTop: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: P.borderInput,
    borderRadius: R.md,
    backgroundColor: P.surfaceAlt,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: P.text,
    fontSize: 14,
  },
  inputFocused: {
    borderColor: P.borderFocus,
    backgroundColor: 'rgba(232,82,42,0.04)',
  },

  // ── Billing ──────────────────────────────────────────────────────────────
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
    borderColor: P.border,
    backgroundColor: P.surfaceAlt,
    alignItems: 'center',
  },
  billingBtnActive: {
    borderColor: P.accentBorder,
    backgroundColor: P.accentDim,
  },
  billingBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: P.textSec,
  },
  billingBtnTextActive: {
    color: P.accent,
    fontWeight: '700',
  },
  billingDesc: {
    fontSize: 11,
    color: P.textMuted,
    marginTop: 6,
    lineHeight: 16,
  },

  // ── Error ────────────────────────────────────────────────────────────────
  errorBox: {
    backgroundColor: P.dangerBg,
    borderWidth: 1,
    borderColor: P.dangerBorder,
    borderRadius: R.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 12,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: P.danger,
  },

  // ── Botón principal ──────────────────────────────────────────────────────
  submitBtn: {
    marginTop: 20,
    minHeight: 46,
    borderRadius: R.md,
    backgroundColor: P.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.accent,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // ── Botón secundario ─────────────────────────────────────────────────────
  backBtn: {
    marginTop: 10,
    minHeight: 40,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: P.border,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: P.textSec,
    fontSize: 13,
    fontWeight: '600',
  },

  // ── MFA ──────────────────────────────────────────────────────────────────
  mfaHelper: {
    fontSize: 11,
    color: P.textMuted,
    marginTop: 5,
    lineHeight: 16,
  },
  mfaDevBadge: {
    backgroundColor: 'rgba(217,119,6,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(217,119,6,0.30)',
    borderRadius: R.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
  },
  mfaDevText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },

  // ── Checkboxes de consentimiento ─────────────────────────────────────────
  consentBox: {
    marginTop: 16,
    backgroundColor: 'rgba(232,82,42,0.06)',
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: 'rgba(232,82,42,0.18)',
    padding: 12,
    gap: 10,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: P.accent,
    borderColor: P.accent,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 13,
  },
  consentText: {
    flex: 1,
    fontSize: 12,
    color: P.textSec,
    lineHeight: 18,
  },
  legalLink: {
    color: 'rgba(232,82,42,0.80)',
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(232,82,42,0.35)',
  },

  // ── Legal ────────────────────────────────────────────────────────────────
  legalConsent: {
    marginTop: 14,
    fontSize: 10.5,
    color: P.textMuted,
    lineHeight: 16,
    textAlign: 'center',
  },
  legalDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: -30,
    marginTop: 24,
    marginBottom: 14,
  },
  legalFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  legalFooterText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.18)',
  },
});

// ─── Componente principal ─────────────────────────────────────────────────────
export default function AuthHomeScreen({ onAuthSuccess }) {
  const { t } = useTranslation();
  const [authMode, setAuthMode] = useState('login');
  const [legalModal, setLegalModal] = useState({ visible: false, tab: 'pp' });
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
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  const inp = (field) => [s.input, focusedField === field && s.inputFocused];

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
    // RGPD Art. 7 — consentimiento explícito obligatorio antes de registrar
    if (!acceptTerms || !acceptPrivacy) { setError(t('legal.errorConsent')); return; }
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
          gdpr_consent_accepted: true,  // RGPD Art. 7 — registrado en servidor
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
        placeholderTextColor={P.textMuted}
        keyboardType="number-pad"
        onFocus={() => setFocusedField('mfa')}
        onBlur={() => setFocusedField('')}
      />
      {!!error && <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View>}
      <TouchableOpacity style={[s.submitBtn, loading && { opacity: 0.7 }]} onPress={handleVerifyMfa} disabled={loading}>
        <Text style={s.submitBtnText}>{loading ? t('auth.verifyBtnLoading') : t('auth.verifyBtn')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.backBtn} onPress={() => { setMfaChallengeId(''); setMfaCode(''); setMfaExpiresAt(0); setMfaDevCode(''); setError(''); }}>
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
        placeholderTextColor={P.textMuted}
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
        placeholderTextColor={P.textMuted}
        secureTextEntry
        onFocus={() => setFocusedField('password')}
        onBlur={() => setFocusedField('')}
        onSubmitEditing={handleLogin}
      />
      {!!error && <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View>}
      <TouchableOpacity style={[s.submitBtn, loading && { opacity: 0.6 }]} onPress={handleLogin} disabled={loading}>
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
      <TextInput style={inp('nombre')} value={nombre} onChangeText={setNombre} placeholder={t('auth.namePlaceholder')} placeholderTextColor={P.textMuted} onFocus={() => setFocusedField('nombre')} onBlur={() => setFocusedField('')} />
      <Text style={s.label}>{t('auth.companyLabel')}</Text>
      <TextInput style={inp('empresa')} value={nombreEmpresa} onChangeText={setNombreEmpresa} placeholder={t('auth.companyPlaceholder')} placeholderTextColor={P.textMuted} onFocus={() => setFocusedField('empresa')} onBlur={() => setFocusedField('')} />
      <Text style={s.label}>{t('auth.cifLabel')}</Text>
      <TextInput style={inp('cif')} value={cif} onChangeText={setCif} placeholder={t('auth.cifPlaceholder')} placeholderTextColor={P.textMuted} autoCapitalize="characters" onFocus={() => setFocusedField('cif')} onBlur={() => setFocusedField('')} />
      <Text style={s.label}>{t('auth.emailLabel')}</Text>
      <TextInput style={inp('email')} value={email} onChangeText={setEmail} placeholder={t('auth.emailPlaceholder')} placeholderTextColor={P.textMuted} autoCapitalize="none" keyboardType="email-address" onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField('')} />
      <Text style={s.label}>{t('auth.passwordLabel')}</Text>
      <TextInput style={inp('password')} value={password} onChangeText={setPassword} placeholder={t('auth.passwordPlaceholder')} placeholderTextColor={P.textMuted} secureTextEntry onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField('')} />
      <Text style={[s.label, { marginTop: 16 }]}>{t('auth.billingLabel')}</Text>
      <View style={s.billingRow}>
        <Pressable style={[s.billingBtn, billingModel === 'creditos' && s.billingBtnActive]} onPress={() => setBillingModel('creditos')}>
          <Text style={[s.billingBtnText, billingModel === 'creditos' && s.billingBtnTextActive]}>{t('auth.billingCredits')}</Text>
        </Pressable>
        <Pressable style={[s.billingBtn, billingModel === 'suscripcion' && s.billingBtnActive]} onPress={() => setBillingModel('suscripcion')}>
          <Text style={[s.billingBtnText, billingModel === 'suscripcion' && s.billingBtnTextActive]}>{t('auth.billingSubscription')}</Text>
        </Pressable>
      </View>
      <Text style={s.billingDesc}>
        {billingModel === 'creditos' ? t('auth.billingCreditsDesc') : t('auth.billingSubscriptionDesc')}
      </Text>
      {/* Consentimiento explícito RGPD Art. 7 — checkboxes obligatorios */}
      <View style={s.consentBox}>
        <Pressable style={s.consentRow} onPress={() => setAcceptTerms((v) => !v)}>
          <View style={[s.checkbox, acceptTerms && s.checkboxChecked]}>
            {acceptTerms && <Text style={s.checkmark}>✓</Text>}
          </View>
          <Text style={s.consentText}>
            {t('legal.acceptTermsPre')}{' '}
            <Text style={s.legalLink} onPress={() => setLegalModal({ visible: true, tab: 'tos' })}>{t('legal.terms')}</Text>
          </Text>
        </Pressable>
        <Pressable style={s.consentRow} onPress={() => setAcceptPrivacy((v) => !v)}>
          <View style={[s.checkbox, acceptPrivacy && s.checkboxChecked]}>
            {acceptPrivacy && <Text style={s.checkmark}>✓</Text>}
          </View>
          <Text style={s.consentText}>
            {t('legal.acceptPrivacyPre')}{' '}
            <Text style={s.legalLink} onPress={() => setLegalModal({ visible: true, tab: 'pp' })}>{t('legal.privacy')}</Text>
          </Text>
        </Pressable>
      </View>

      {!!error && <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View>}
      <TouchableOpacity
        style={[s.submitBtn, (loading || !acceptTerms || !acceptPrivacy) && { opacity: 0.5 }]}
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
      <LegalModal
        visible={legalModal.visible}
        initialTab={legalModal.tab}
        onClose={() => setLegalModal({ visible: false, tab: 'pp' })}
      />
      <View style={s.split}>

        {/* ── Panel de marca ─────────────────────────────────────────────── */}
        <View style={s.brand}>

          {/* Logo */}
          <View style={s.logoRow}>
            <View style={s.logoMark}>
              <View style={s.logoMarkSlash} />
            </View>
            <Text style={s.logoName}>
              <Text style={s.logoNamePrint}>Print</Text>
              <Text style={s.logoNameForge}>Forge</Text>
              <Text style={s.logoSuffix}> Pro</Text>
            </Text>
          </View>

          {/* Titular */}
          <Text style={s.brandEyebrow}>{t('auth.brandEyebrow')}</Text>
          <Text style={s.brandTagline}>
            {t('auth.brandTaglinePre')}
            {'\n'}
            <Text style={s.brandTaglineAccent}>{t('auth.brandTaglineAccent')}</Text>
          </Text>
          <Text style={s.brandSub}>{t('auth.brandDesc')}</Text>

          {/* Módulos */}
          <Text style={s.modulesLabel}>{t('auth.modulesLabel')}</Text>
          <View style={s.modulesGrid}>
            {MODULES.map((m) => (
              <View key={m.key} style={s.moduleChip}>
                <Text style={s.moduleChipIcon}>{m.icon}</Text>
                <Text style={s.moduleChipText}>{m.key}</Text>
              </View>
            ))}
          </View>
          <Text style={s.modulesCaption}>
            {t('auth.modulesCaption')}{' '}
            <Text style={s.modulesCaptionAccent}>{t('auth.modulesCaptionAccent')}</Text>
          </Text>


        </View>

        {/* Separador */}
        <View style={s.divider} />

        {/* ── Panel de formulario ─────────────────────────────────────────── */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.formPanel} keyboardShouldPersistTaps="handled">
          <View style={s.formCard}>
            {mfaChallengeId ? (
              <MfaView />
            ) : (
              <>
                <View style={s.tabs}>
                  <Pressable style={[s.tab, authMode === 'login' && s.tabActive]} onPress={() => { setAuthMode('login'); setError(''); }}>
                    <Text style={[s.tabText, authMode === 'login' && s.tabTextActive]}>{t('auth.switchToLogin')}</Text>
                  </Pressable>
                  <Pressable style={[s.tab, authMode === 'register' && s.tabActive]} onPress={() => { setAuthMode('register'); setError(''); }}>
                    <Text style={[s.tabText, authMode === 'register' && s.tabTextActive]}>{t('auth.switchToRegister')}</Text>
                  </Pressable>
                </View>
                {authMode === 'login' ? <LoginView /> : <RegisterView />}
              </>
            )}

            {/* Pie del formulario */}
            <View style={s.legalDivider} />
            <View style={s.legalFooter}>
              <Text style={s.legalFooterText}>© {new Date().getFullYear()} PrintForgePro</Text>
            </View>
          </View>
        </ScrollView>

      </View>
    </View>
  );
}

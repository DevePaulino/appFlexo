import React, { useState, useEffect } from 'react';
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
import AuroraCanvas from '../components/AuroraCanvas';
import { isValidEmail } from '../utils/phoneFormat';

const API_BASE = 'http://localhost:8080';

// ─── Fuera del componente para evitar pérdida de foco en inputs ───────────────
const getPasswordStrength = (pwd) => {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
};

function PasswordStrengthBar({ pwd }) {
  const { t } = useTranslation();
  const score = getPasswordStrength(pwd);
  if (!pwd) return null;
  const LEVELS = [
    { color: '#EF4444', label: t('auth.strengthWeak') },
    { color: '#EF4444', label: t('auth.strengthWeak') },
    { color: '#F97316', label: t('auth.strengthFair') },
    { color: '#EAB308', label: t('auth.strengthGood') },
    { color: '#22C55E', label: t('auth.strengthStrong') },
    { color: '#16A34A', label: t('auth.strengthVeryStrong') },
  ];
  const level = LEVELS[score] || LEVELS[0];
  return (
    <View style={{ marginTop: 6 }}>
      <View style={{ flexDirection: 'row', gap: 3, marginBottom: 4 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View
            key={i}
            style={{
              flex: 1, height: 3, borderRadius: 2,
              backgroundColor: i <= score ? level.color : P.fSurfaceAlt,
            }}
          />
        ))}
      </View>
      <Text style={{ fontSize: 11, color: score >= 4 ? level.color : P.fTextMuted }}>
        {level.label}
      </Text>
    </View>
  );
}

// ─── Paleta ───────────────────────────────────────────────────────────────────
const P = {
  // Panel izquierdo (marca) — índigo oscuro de la app
  bg:          '#1E1B4B',
  bgPanel:     '#1E1B4B',
  surface:     '#2D2A6E',
  surfaceAlt:  '#3730A3',
  border:      'rgba(255,255,255,0.08)',
  borderInput: 'rgba(255,255,255,0.12)',
  borderFocus: '#818CF8',
  accent:      '#818CF8',   // índigo-400 — visible sobre fondo oscuro
  accentDim:   'rgba(129,140,248,0.18)',
  accentBorder:'rgba(129,140,248,0.35)',
  text:        '#FFFFFF',
  textSec:     'rgba(255,255,255,0.55)',
  textMuted:   'rgba(255,255,255,0.28)',
  danger:      '#F87171',
  dangerBg:    'rgba(248,113,113,0.10)',
  dangerBorder:'rgba(248,113,113,0.25)',

  // Panel derecho (formulario) — índigo-50 de la app
  fBg:         '#EEF2FF',   // fondo panel: indigo-50
  fSurface:    '#FFFFFF',   // card: blanco puro
  fSurfaceAlt: '#E0E7FF',   // inputs, pills: indigo-100
  fBorder:     'rgba(79,70,229,0.10)',
  fBorderInput:'rgba(79,70,229,0.14)',
  fBorderFocus:'#4F46E5',
  fAccent:     '#4F46E5',   // índigo-600 — CTA principal
  fAccentDim:  'rgba(79,70,229,0.08)',
  fAccentBorder:'rgba(79,70,229,0.25)',
  fText:       '#0F172A',   // texto principal: slate-900
  fTextSec:    'rgba(15,23,42,0.55)',
  fTextMuted:  'rgba(15,23,42,0.38)',
};


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
    position: 'relative',
    overflow: 'hidden',
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
    shadowColor: '#818CF8',
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
  logoNamePress: {
    color: '#FFFFFF',
  },
  logoNameMate: {
    color: P.accent,   // índigo-400
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
    color: P.accent,   // índigo-400 sobre fondo oscuro
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

  // Beneficios
  benefitList: {
    gap: 16,
    marginTop: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  benefitBar: {
    width: 3,
    height: 36,
    borderRadius: 2,
    backgroundColor: P.accent,
    marginTop: 2,
    flexShrink: 0,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 22,
    fontWeight: '400',
  },
  benefitHighlight: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // ── Separador vertical ───────────────────────────────────────────────────
  divider: {
    ...(Platform.OS === 'web'
      ? { width: 1, backgroundColor: 'rgba(30,41,59,0.18)' }
      : { height: 1, backgroundColor: 'rgba(30,41,59,0.18)', marginHorizontal: 28 }),
  },

  // ── Panel derecho (formulario) ───────────────────────────────────────────
  formPanel: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Platform.OS === 'web' ? 48 : 24,
    backgroundColor: P.fBg,
  },
  formCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: P.fSurface,
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: P.fBorder,
    padding: 30,
    shadowColor: '#0F172A',
    shadowOpacity: 0.10,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },

  // ── Tabs login / registro ────────────────────────────────────────────────
  tabs: {
    flexDirection: 'row',
    backgroundColor: P.fSurfaceAlt,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: P.fBorder,
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
    backgroundColor: P.fAccent,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: P.fTextMuted,
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
    color: P.fText,
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  formSub: {
    fontSize: 13,
    color: P.fTextSec,
    lineHeight: 20,
    marginBottom: 24,
  },

  // ── Campos ──────────────────────────────────────────────────────────────
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: P.fTextSec,
    marginBottom: 6,
    marginTop: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: P.fBorderInput,
    borderRadius: R.md,
    backgroundColor: P.fSurfaceAlt,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: P.fText,
    fontSize: 14,
  },
  inputFocused: {
    borderColor: P.fBorderFocus,
    backgroundColor: P.fAccentDim,
  },

  // ── Error ────────────────────────────────────────────────────────────────
  errorBox: {
    backgroundColor: 'rgba(220,38,38,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.20)',
    borderRadius: R.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 12,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C0170D',
  },

  // ── Botón principal ──────────────────────────────────────────────────────
  submitBtn: {
    marginTop: 20,
    minHeight: 46,
    borderRadius: R.md,
    backgroundColor: P.fAccent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: P.fAccent,
    shadowOpacity: 0.30,
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
    borderColor: P.fBorder,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: P.fTextSec,
    fontSize: 13,
    fontWeight: '600',
  },

  // ── MFA ──────────────────────────────────────────────────────────────────
  mfaHelper: {
    fontSize: 11,
    color: P.fTextMuted,
    marginTop: 5,
    lineHeight: 16,
  },
  mfaDevBadge: {
    backgroundColor: 'rgba(217,119,6,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(217,119,6,0.25)',
    borderRadius: R.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
  },
  mfaDevText: {
    fontSize: 12,
    color: '#B45309',
    fontWeight: '600',
  },

  // ── Checkboxes de consentimiento ─────────────────────────────────────────
  consentBox: {
    marginTop: 16,
    backgroundColor: P.fAccentDim,
    borderRadius: R.md,
    borderWidth: 1,
    borderColor: P.fAccentBorder,
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
    borderColor: 'rgba(15,23,42,0.22)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: P.fAccent,
    borderColor: P.fAccent,
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
    color: P.fTextSec,
    lineHeight: 18,
  },
  legalLink: {
    color: P.fAccent,
    textDecorationLine: 'underline',
    textDecorationColor: P.fAccentBorder,
  },

  // ── Forgot password link ─────────────────────────────────────────────────
  forgotLink: {
    fontSize: 12,
    color: P.fTextMuted,
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(15,23,42,0.20)',
  },

  // ── Legal ────────────────────────────────────────────────────────────────
  legalConsent: {
    marginTop: 14,
    fontSize: 10.5,
    color: P.fTextMuted,
    lineHeight: 16,
    textAlign: 'center',
  },
  legalDivider: {
    height: 1,
    backgroundColor: P.fBorder,
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
    color: P.fTextMuted,
  },
});

// ─── Componente principal ─────────────────────────────────────────────────────
export default function AuthHomeScreen({ onAuthSuccess }) {
  const { t } = useTranslation();
  const [authMode, setAuthMode] = useState('login');
  const [legalModal, setLegalModal] = useState({ visible: false, tab: 'pp' });

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
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetDevCode, setResetDevCode] = useState('');
  const [resetStep, setResetStep] = useState('request'); // 'request' | 'confirm'
  const [inviteToken, setInviteToken] = useState('');
  const [inviteInfo, setInviteInfo] = useState(null); // { nombre, email }
  const [invitePassword, setInvitePassword] = useState('');
  const [invitePassword2, setInvitePassword2] = useState('');

  const inp = (field) => [s.input, focusedField === field && s.inputFocused];

  // Detect invite token in URL (web)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const url = new URL(window.location.href);
    const inv = url.searchParams.get('invite');
    if (!inv) return;
    url.searchParams.delete('invite');
    window.history.replaceState({}, '', url.toString());
    setInviteToken(inv);
    fetch(`${API_BASE}/api/auth/invite-info?token=${encodeURIComponent(inv)}`)
      .then(r => r.json())
      .then(d => { if (d.nombre) setInviteInfo(d); else setError(d.error || 'Invitación no válida'); })
      .catch(() => setError('Error al verificar la invitación'));
  }, []);

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return t('auth.errorPasswordLength');
    if (!/[A-Z]/.test(pwd)) return t('auth.errorPasswordUppercase');
    if (!/[a-z]/.test(pwd)) return t('auth.errorPasswordLowercase');
    if (!/\d/.test(pwd)) return t('auth.errorPasswordDigit');
    if (!/[^A-Za-z0-9]/.test(pwd)) return t('auth.errorPasswordSpecial');
    return null;
  };

  // ── Login ─────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    setError('');
    setMfaDevCode('');
    if (!email.trim()) { setError(t('auth.errorEmail')); return; }
    if (!isValidEmail(email.trim())) { setError(t('forms.errorEmail')); return; }
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
    const cifNorm = String(cif || '').trim().replace(/[\s\-\.]/g, '').toUpperCase();
    if (!cifNorm || cifNorm.length < 5) { setError(t('auth.errorCif')); return; }
    if (!/^[A-Z0-9]{5,25}$/.test(cifNorm)) { setError(t('auth.errorCifInvalid')); return; }
    if (!email.trim()) { setError(t('auth.errorEmailRequired')); return; }
    if (!isValidEmail(email.trim())) { setError(t('forms.errorEmail')); return; }
    const pwdErr = validatePassword(password);
    if (pwdErr) { setError(pwdErr); return; }
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

  // ── Forgot password ───────────────────────────────────────────────────────
  const handleForgotPassword = async () => {
    setError('');
    if (!resetEmail.trim()) { setError(t('auth.errorEmail')); return; }
    if (!isValidEmail(resetEmail.trim())) { setError(t('forms.errorEmail')); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || t('auth.errorResetRequest')); return; }
      setResetDevCode(String(data.dev_reset_code || ''));
      setResetStep('confirm');
    } catch (e) {
      setError(t('auth.errorResetRequest'));
    } finally {
      setLoading(false);
    }
  };

  // ── Reset password ────────────────────────────────────────────────────────
  const handleResetPassword = async () => {
    setError('');
    if (!resetCode.trim()) { setError(t('auth.errorResetCode')); return; }
    const pwdErr = validatePassword(resetNewPassword);
    if (pwdErr) { setError(pwdErr); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail.trim().toLowerCase(),
          code: resetCode.trim(),
          new_password: resetNewPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || t('auth.errorResetCode')); return; }
      // Éxito — volver al login con email pre-rellenado
      setEmail(resetEmail.trim().toLowerCase());
      setPassword('');
      setAuthMode('login');
      setResetStep('request');
      setResetEmail('');
      setResetCode('');
      setResetNewPassword('');
      setResetDevCode('');
      setError('');
    } catch (e) {
      setError(t('auth.errorResetCode'));
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
        placeholderTextColor={P.fTextMuted}
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

  // ── Forgot password view (paso 1: introducir email) ───────────────────────
  const ForgotView = () => (
    <>
      <Text style={s.formTitle}>{t('auth.forgotTitle')}</Text>
      <Text style={s.formSub}>{t('auth.forgotSubtitle')}</Text>
      <Text style={s.label}>{t('auth.emailLabel')}</Text>
      <TextInput
        style={inp('resetEmail')}
        value={resetEmail}
        onChangeText={setResetEmail}
        placeholder={t('auth.emailPlaceholder')}
        placeholderTextColor={P.fTextMuted}
        autoCapitalize="none"
        keyboardType="email-address"
        onFocus={() => setFocusedField('resetEmail')}
        onBlur={() => setFocusedField('')}
        onSubmitEditing={handleForgotPassword}
      />
      {!!resetDevCode && (
        <View style={s.mfaDevBadge}>
          <Text style={s.mfaDevText}>Código de dev: {resetDevCode}</Text>
        </View>
      )}
      {!!error && <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View>}
      <TouchableOpacity style={[s.submitBtn, loading && { opacity: 0.7 }]} onPress={handleForgotPassword} disabled={loading}>
        <Text style={s.submitBtnText}>{loading ? t('auth.forgotBtnLoading') : t('auth.forgotBtn')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.backBtn} onPress={() => { setAuthMode('login'); setResetStep('request'); setResetEmail(''); setError(''); }}>
        <Text style={s.backBtnText}>{t('auth.backToLogin')}</Text>
      </TouchableOpacity>
    </>
  );

  // ── Reset password view (paso 2: código + nueva contraseña) ───────────────
  const ResetView = () => (
    <>
      <Text style={s.formTitle}>{t('auth.resetTitle')}</Text>
      <Text style={s.formSub}>{t('auth.resetSubtitle', { email: resetEmail })}</Text>
      {!!resetDevCode && (
        <View style={s.mfaDevBadge}>
          <Text style={s.mfaDevText}>Código de dev: {resetDevCode}</Text>
        </View>
      )}
      <Text style={s.label}>{t('auth.resetCodeLabel')}</Text>
      <TextInput
        style={inp('resetCode')}
        value={resetCode}
        onChangeText={setResetCode}
        placeholder={t('auth.resetCodePlaceholder')}
        placeholderTextColor={P.fTextMuted}
        keyboardType="number-pad"
        maxLength={6}
        onFocus={() => setFocusedField('resetCode')}
        onBlur={() => setFocusedField('')}
      />
      <Text style={s.label}>{t('auth.resetNewPasswordLabel')}</Text>
      <TextInput
        style={inp('resetNewPassword')}
        value={resetNewPassword}
        onChangeText={setResetNewPassword}
        placeholder={t('auth.passwordPlaceholder')}
        placeholderTextColor={P.fTextMuted}
        secureTextEntry
        onFocus={() => setFocusedField('resetNewPassword')}
        onBlur={() => setFocusedField('')}
        onSubmitEditing={handleResetPassword}
      />
      <PasswordStrengthBar pwd={resetNewPassword} />
      {!!error && <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View>}
      <TouchableOpacity style={[s.submitBtn, loading && { opacity: 0.7 }]} onPress={handleResetPassword} disabled={loading}>
        <Text style={s.submitBtnText}>{loading ? t('auth.resetBtnLoading') : t('auth.resetBtn')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.backBtn} onPress={() => { setResetStep('request'); setResetCode(''); setResetNewPassword(''); setError(''); }}>
        <Text style={s.backBtnText}>{t('auth.resetBackToEmail')}</Text>
      </TouchableOpacity>
    </>
  );

  // ── Activate invite view ───────────────────────────────────────────────────
  const handleAcceptInvite = async () => {
    setError('');
    const pwdErr = validatePassword(invitePassword);
    if (pwdErr) { setError(pwdErr); return; }
    if (invitePassword !== invitePassword2) { setError(t('auth.errorPasswordMatch')); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/accept-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: inviteToken, password: invitePassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || t('auth.errorLogin')); return; }
      onAuthSuccess?.({
        usuario: data.usuario,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        access_expires_at: data.access_expires_at,
      });
    } catch {
      setError(t('auth.errorLogin'));
    } finally {
      setLoading(false);
    }
  };

  const InviteView = () => (
    <>
      <Text style={s.formTitle}>{t('auth.inviteTitle')}</Text>
      <Text style={s.formSub}>
        {inviteInfo
          ? t('auth.inviteSubtitleNamed', { nombre: inviteInfo.nombre, email: inviteInfo.email })
          : t('auth.inviteSubtitle')}
      </Text>
      <Text style={s.label}>{t('auth.passwordLabel')}</Text>
      <TextInput
        style={inp('invPwd')}
        value={invitePassword}
        onChangeText={setInvitePassword}
        placeholder={t('auth.passwordPlaceholder')}
        placeholderTextColor={P.fTextMuted}
        secureTextEntry
        onFocus={() => setFocusedField('invPwd')}
        onBlur={() => setFocusedField('')}
      />
      <PasswordStrengthBar pwd={invitePassword} />
      <Text style={s.label}>{t('auth.confirmPasswordLabel')}</Text>
      <TextInput
        style={inp('invPwd2')}
        value={invitePassword2}
        onChangeText={setInvitePassword2}
        placeholder={t('auth.confirmPasswordPlaceholder')}
        placeholderTextColor={P.fTextMuted}
        secureTextEntry
        onFocus={() => setFocusedField('invPwd2')}
        onBlur={() => setFocusedField('')}
        onSubmitEditing={handleAcceptInvite}
      />
      {!!error && <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View>}
      <TouchableOpacity
        style={[s.submitBtn, loading && { opacity: 0.7 }]}
        disabled={loading}
        onPress={handleAcceptInvite}
      >
        <Text style={s.submitBtnText}>{loading ? t('auth.inviteBtnLoading') : t('auth.inviteBtn')}</Text>
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
        placeholderTextColor={P.fTextMuted}
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
        placeholderTextColor={P.fTextMuted}
        secureTextEntry
        onFocus={() => setFocusedField('password')}
        onBlur={() => setFocusedField('')}
        onSubmitEditing={handleLogin}
      />
      {!!error && <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View>}
      <TouchableOpacity style={[s.submitBtn, loading && { opacity: 0.6 }]} onPress={handleLogin} disabled={loading}>
        <Text style={s.submitBtnText}>{loading ? t('auth.loginBtnLoading') : t('auth.loginBtn')}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{ marginTop: 14, alignItems: 'center' }}
        onPress={() => { setAuthMode('forgot'); setResetEmail(email); setResetStep('request'); setError(''); }}
      >
        <Text style={s.forgotLink}>{t('auth.forgotPassword')}</Text>
      </TouchableOpacity>
    </>
  );

  // ── Register view ─────────────────────────────────────────────────────────
  const RegisterView = () => (
    <>
      <Text style={s.formTitle}>{t('auth.registerTitle')}</Text>
      <Text style={s.formSub}>{t('auth.registerSubtitle')}</Text>
      <Text style={s.label}>{t('auth.nameLabel')}</Text>
      <TextInput style={inp('nombre')} value={nombre} onChangeText={setNombre} placeholder={t('auth.namePlaceholder')} placeholderTextColor={P.fTextMuted} onFocus={() => setFocusedField('nombre')} onBlur={() => setFocusedField('')} />
      <Text style={s.label}>{t('auth.companyLabel')}</Text>
      <TextInput style={inp('empresa')} value={nombreEmpresa} onChangeText={setNombreEmpresa} placeholder={t('auth.companyPlaceholder')} placeholderTextColor={P.fTextMuted} onFocus={() => setFocusedField('empresa')} onBlur={() => setFocusedField('')} />
      <Text style={s.label}>{t('auth.cifLabel', { defaultValue: 'NIF / VAT / CIF' })}</Text>
      <TextInput style={inp('cif')} value={cif} onChangeText={setCif} placeholder={t('auth.cifPlaceholder', { defaultValue: 'Ej: B12345678, FR12345678901…' })} placeholderTextColor={P.fTextMuted} autoCapitalize="characters" onFocus={() => setFocusedField('cif')} onBlur={() => setFocusedField('')} />
      <Text style={s.label}>{t('auth.emailLabel')}</Text>
      <TextInput style={inp('email')} value={email} onChangeText={setEmail} placeholder={t('auth.emailPlaceholder')} placeholderTextColor={P.fTextMuted} autoCapitalize="none" keyboardType="email-address" onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField('')} />
      <Text style={s.label}>{t('auth.passwordLabel')}</Text>
      <TextInput style={inp('password')} value={password} onChangeText={setPassword} placeholder={t('auth.passwordPlaceholder')} placeholderTextColor={P.fTextMuted} secureTextEntry onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField('')} />
      <PasswordStrengthBar pwd={password} />
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

          {/* Aurora cursor animation (web only) */}
          <AuroraCanvas />

          {/* Contenido sobre la aurora */}
          <View style={{ position: 'relative', zIndex: 1 }}>

          {/* Logo */}
          <View style={s.logoRow}>
            <View style={s.logoMark}>
              <View style={s.logoMarkSlash} />
            </View>
            <Text style={s.logoName}>
              <Text style={s.logoNamePress}>Press</Text>
              <Text style={s.logoNameMate}>Mate</Text>
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

          {/* Beneficios */}
          <View style={s.benefitList}>
            {[
              { key: 'benefit1', bold: t('auth.benefit1Bold') },
              { key: 'benefit2', bold: t('auth.benefit2Bold') },
              { key: 'benefit3', bold: t('auth.benefit3Bold') },
            ].map(({ key, bold }) => (
              <View key={key} style={s.benefitItem}>
                <View style={s.benefitBar} />
                <Text style={s.benefitText}>
                  <Text style={s.benefitHighlight}>{bold} </Text>
                  {t(`auth.${key}Rest`)}
                </Text>
              </View>
            ))}
          </View>

          </View>{/* fin contenido sobre aurora */}

        </View>

        {/* Separador */}
        <View style={s.divider} />

        {/* ── Panel de formulario ─────────────────────────────────────────── */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.formPanel} keyboardShouldPersistTaps="handled">
          <View style={s.formCard}>
            {inviteToken ? (
              InviteView()
            ) : mfaChallengeId ? (
              MfaView()
            ) : authMode === 'forgot' ? (
              resetStep === 'confirm' ? ResetView() : ForgotView()
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
                {authMode === 'login' ? LoginView() : RegisterView()}
              </>
            )}

            {/* Pie del formulario */}
            <View style={s.legalDivider} />
            <View style={s.legalFooter}>
              <Text style={s.legalFooterText}>© {new Date().getFullYear()} PressMate Pro</Text>
              <Text style={s.legalFooterText}>·</Text>
              <Text
                style={[s.legalFooterText, { color: P.fAccent, textDecorationLine: 'underline' }]}
                onPress={() => setLegalModal({ visible: true, tab: 'pp' })}
              >{t('legal.privacy')}</Text>
              <Text style={s.legalFooterText}>·</Text>
              <Text
                style={[s.legalFooterText, { color: P.fAccent, textDecorationLine: 'underline' }]}
                onPress={() => setLegalModal({ visible: true, tab: 'tos' })}
              >{t('legal.terms')}</Text>
            </View>
          </View>
        </ScrollView>

      </View>
    </View>
  );
}

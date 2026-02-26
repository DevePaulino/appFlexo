import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const API_BASE = 'http://localhost:8080';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  content: {
    paddingHorizontal: 18,
    paddingVertical: 26,
    alignItems: 'center',
  },
  wrapper: {
    width: '100%',
    maxWidth: 1080,
  },
  split: {
    flexDirection: 'column',
    gap: 16,
    alignItems: 'center',
  },
  leftCol: {
    width: '100%',
    maxWidth: 920,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: '#0061FF',
    marginRight: 12,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 32,
  },
  logoPrintForge: {
    color: '#DC2626',
  },
  logoPro: {
    color: '#1F2937',
  },
  heroTitle: {
    color: '#111827',
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '900',
    marginBottom: 10,
    letterSpacing: -0.4,
  },
  heroText: {
    color: '#334155',
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '500',
    marginBottom: 14,
    maxWidth: 580,
  },
  freeTrialBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#86EFAC',
    backgroundColor: '#ECFDF3',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 12,
  },
  freeTrialBadgeText: {
    color: '#027A48',
    fontSize: 11,
    fontWeight: '800',
  },
  heroCtaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  heroCtaPrimary: {
    backgroundColor: '#0061FF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  heroCtaPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  valueHighlight: {
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#D6E4FF',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
  },
  valueHighlightLabel: {
    color: '#1E3A8A',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  valueHighlightTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 8,
  },
  valuePillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 8,
  },
  valuePill: {
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  valuePillText: {
    color: '#1E3A8A',
    fontSize: 11,
    fontWeight: '700',
  },
  valueHighlightNote: {
    color: '#334155',
    fontSize: 12,
    lineHeight: 18,
  },
  featureList: {
    gap: 9,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0061FF',
    marginTop: 7,
    marginRight: 8,
  },
  featureText: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  pricingWrap: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D6E4FF',
    borderRadius: 14,
    padding: 16,
  },
  pricingTitle: {
    color: '#0F172A',
    fontSize: 19,
    fontWeight: '900',
    marginBottom: 4,
  },
  pricingSub: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  plansRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  planCard: {
    flexGrow: 1,
    flexBasis: 220,
    borderWidth: 1,
    borderColor: '#D6E4FF',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#FFFFFF',
    minHeight: 210,
    justifyContent: 'space-between',
  },
  planCardActive: {
    borderColor: '#0061FF',
    backgroundColor: '#EAF2FF',
  },
  planBody: {
    marginBottom: 10,
  },
  planType: {
    color: '#1E3A8A',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 5,
  },
  planName: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 6,
  },
  planLine: {
    color: '#334155',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 5,
  },
  planSelect: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  planSelectActive: {
    borderColor: '#0061FF',
    backgroundColor: '#0061FF',
  },
  planSelectText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
  },
  planSelectTextActive: {
    color: '#FFFFFF',
  },
  authCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#0B1020',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCardWrap: {
    width: '100%',
    maxWidth: 460,
  },
  authCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  authCloseBtn: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#FFFFFF',
  },
  authCloseBtnText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '800',
  },
  authTabs: {
    flexDirection: 'row',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  authTabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    backgroundColor: '#F8FAFC',
  },
  authTabBtnActive: {
    backgroundColor: '#0061FF',
  },
  authTabText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '800',
  },
  authTabTextActive: {
    color: '#FFFFFF',
  },
  authTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 5,
  },
  authSub: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  fieldLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 11,
    paddingVertical: 10,
    color: '#0F172A',
    fontSize: 14,
    marginBottom: 4,
  },
  helper: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 6,
  },
  payMethodRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  payMethodBtn: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  payMethodBtnActive: {
    borderColor: '#0061FF',
    backgroundColor: '#EFF6FF',
  },
  payMethodText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  payMethodTextActive: {
    color: '#0061FF',
  },
  submitBtn: {
    marginTop: 10,
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: '#0061FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  secondaryBtn: {
    marginTop: 8,
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    color: '#B42318',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 7,
  },
});

export default function AuthHomeScreen({ onAuthSuccess }) {
  const [authMode, setAuthMode] = useState('login');
  const [billingModel, setBillingModel] = useState('creditos');
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [nombre, setNombre] = useState('');
  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [cif, setCif] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaChallengeId, setMfaChallengeId] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaExpiresAt, setMfaExpiresAt] = useState(0);
  const [mfaDevCode, setMfaDevCode] = useState('');
  const [showAuthPanel, setShowAuthPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    setMfaDevCode('');
    if (!email.trim()) {
      setError('Introduce tu email para iniciar sesión');
      return;
    }
    if (!password.trim()) {
      setError('Introduce tu contraseña');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || 'No se pudo iniciar sesión');
        return;
      }

      if (data.mfa_required && data.challenge_id) {
        setMfaChallengeId(data.challenge_id);
        setMfaExpiresAt(Number(data.mfa_expires_at || 0));
        setMfaDevCode(String(data.dev_mfa_code || ''));
        setShowAuthPanel(true);
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
      setError(`No se pudo iniciar sesión: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMfa = async () => {
    setError('');
    if (!mfaChallengeId) {
      setError('No hay challenge MFA activo');
      return;
    }
    if (!mfaCode.trim()) {
      setError('Introduce el código MFA');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/mfa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_id: mfaChallengeId, code: mfaCode.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || 'No se pudo verificar el código MFA');
        return;
      }

      onAuthSuccess?.({
        usuario: data.usuario,
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        access_expires_at: data.access_expires_at,
      });
    } catch (e) {
      setError(`No se pudo verificar MFA: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setError('');
    if (!nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    if (!nombreEmpresa.trim()) {
      setError('El nombre de la empresa es obligatorio');
      return;
    }
    const cifNormalizado = String(cif || '').trim().replace(/[\s-]/g, '').toUpperCase();
    if (!cifNormalizado) {
      setError('El CIF es obligatorio');
      return;
    }
    if (!/^[A-Z]\d{7}[A-Z0-9]$/.test(cifNormalizado)) {
      setError('CIF no válido (ejemplo: A1234567B)');
      return;
    }
    if (!email.trim()) {
      setError('El email es obligatorio');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const registerResponse = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          nombre_empresa: nombreEmpresa.trim(),
          cif: cifNormalizado,
          email: email.trim().toLowerCase(),
          password,
          billing_model: billingModel,
          payment_method: paymentMethod,
        }),
      });
      const registerData = await registerResponse.json().catch(() => ({}));
      if (!registerResponse.ok) {
        setError(registerData.error || 'No se pudo completar el registro');
        return;
      }

      onAuthSuccess?.({
        usuario: registerData.usuario,
        access_token: registerData.access_token,
        refresh_token: registerData.refresh_token,
        access_expires_at: registerData.access_expires_at,
      });
    } catch (e) {
      setError(`No se pudo completar el registro: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.wrapper}>
        <View style={styles.split}>
          <View style={styles.leftCol}>
            <View style={styles.logoRow}>
              <View style={styles.logoBox} />
              <Text style={styles.logoText}>
                <Text style={styles.logoPrintForge}>PrintForge</Text>
                <Text> </Text>
                <Text style={styles.logoPro}>Pro</Text>
              </Text>
            </View>

            <Text style={styles.heroTitle}>El control de impresión que acelera tu negocio</Text>
            <Text style={styles.heroText}>Planifica pedidos, coordina producción y toma decisiones comerciales con una interfaz clara, rápida y preparada para crecer contigo.</Text>

            <View style={styles.freeTrialBadge}>
              <Text style={styles.freeTrialBadgeText}>Pruébala gratis y valida el flujo antes de escalar</Text>
            </View>

            <View style={styles.heroCtaRow}>
              <TouchableOpacity style={styles.heroCtaPrimary} onPress={() => setShowAuthPanel(true)}>
                <Text style={styles.heroCtaPrimaryText}>Probar gratis / Acceder</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.valueHighlight}>
              <Text style={styles.valueHighlightLabel}>FUNCIONES CLAVE</Text>
              <Text style={styles.valueHighlightTitle}>Herramientas técnicas para acelerar la preparación de trabajos</Text>
              <View style={styles.valuePillRow}>
                <View style={styles.valuePill}><Text style={styles.valuePillText}>Report</Text></View>
                <View style={styles.valuePill}><Text style={styles.valuePillText}>Repetidoras</Text></View>
                <View style={styles.valuePill}><Text style={styles.valuePillText}>Trapping</Text></View>
                <View style={styles.valuePill}><Text style={styles.valuePillText}>Troqueles</Text></View>
              </View>
              <Text style={styles.valueHighlightNote}>Estas capacidades concentran la mayor parte del trabajo técnico diario y ayudan a estandarizar resultados en preimpresión.</Text>
            </View>

            <View style={styles.featureList}>
              <View style={styles.featureItem}><View style={styles.featureDot} /><Text style={styles.featureText}>Visibilidad total de pedidos, estados y producción en un solo flujo.</Text></View>
              <View style={styles.featureItem}><View style={styles.featureDot} /><Text style={styles.featureText}>Base sólida para equipos comerciales y operativos que quieren escalar.</Text></View>
              <View style={styles.featureItem}><View style={styles.featureDot} /><Text style={styles.featureText}>Diseñado para decisiones rápidas y mejor margen por trabajo.</Text></View>
            </View>

            <View style={styles.pricingWrap}>
              <Text style={styles.pricingTitle}>Elige tu modalidad</Text>
              <Text style={styles.pricingSub}>Selecciona el modelo que mejor encaja con tu ritmo operativo actual.</Text>
              <View style={styles.plansRow}>
                <View style={[styles.planCard, billingModel === 'creditos' && styles.planCardActive]}>
                  <View style={styles.planBody}>
                    <Text style={styles.planType}>PAGO POR USO</Text>
                    <Text style={styles.planName}>Créditos</Text>
                    <Text style={styles.planLine}>• Máxima flexibilidad para cargas variables.</Text>
                    <Text style={styles.planLine}>• Pagas según uso real.</Text>
                    <Text style={styles.planLine}>• Ideal para empezar rápido.</Text>
                  </View>
                  <TouchableOpacity style={[styles.planSelect, billingModel === 'creditos' && styles.planSelectActive]} onPress={() => setBillingModel('creditos')}>
                    <Text style={[styles.planSelectText, billingModel === 'creditos' && styles.planSelectTextActive]}>{billingModel === 'creditos' ? 'Seleccionado' : 'Elegir créditos'}</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.planCard, billingModel === 'suscripcion' && styles.planCardActive]}>
                  <View style={styles.planBody}>
                    <Text style={styles.planType}>CUOTA FIJA</Text>
                    <Text style={styles.planName}>Suscripción</Text>
                    <Text style={styles.planLine}>• Coste mensual predecible.</Text>
                    <Text style={styles.planLine}>• Operación continua sin sobresaltos.</Text>
                    <Text style={styles.planLine}>• Perfecta para volumen estable.</Text>
                  </View>
                  <TouchableOpacity style={[styles.planSelect, billingModel === 'suscripcion' && styles.planSelectActive]} onPress={() => setBillingModel('suscripcion')}>
                    <Text style={[styles.planSelectText, billingModel === 'suscripcion' && styles.planSelectTextActive]}>{billingModel === 'suscripcion' ? 'Seleccionado' : 'Elegir suscripción'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

            </View>
          </View>

          <Modal
            transparent
            visible={showAuthPanel || !!mfaChallengeId}
            animationType="fade"
            onRequestClose={() => {
              if (!mfaChallengeId) setShowAuthPanel(false);
            }}
          >
            <View style={styles.modalBackdrop}>
              <Pressable style={StyleSheet.absoluteFill} onPress={() => {
                if (!mfaChallengeId) {
                  setShowAuthPanel(false);
                }
              }} />
              <View style={styles.modalCardWrap}>
                <View style={styles.authCard}>
              <View style={styles.authCardTop}>
                <Text style={styles.authTitle}>Acceso</Text>
                {!mfaChallengeId && (
                  <TouchableOpacity style={styles.authCloseBtn} onPress={() => setShowAuthPanel(false)}>
                    <Text style={styles.authCloseBtnText}>Ocultar</Text>
                  </TouchableOpacity>
                )}
              </View>
              {mfaChallengeId ? (
                <>
                  <Text style={styles.authTitle}>Verificación MFA</Text>
                  <Text style={styles.authSub}>Introduce el código enviado para completar el acceso seguro.</Text>
                  {mfaExpiresAt > 0 && <Text style={styles.helper}>Expira en: {Math.max(0, Math.floor(mfaExpiresAt - Date.now() / 1000))} s</Text>}
                  {!!mfaDevCode && <Text style={styles.helper}>Código de desarrollo: {mfaDevCode}</Text>}

                  <Text style={styles.fieldLabel}>Código MFA</Text>
                  <TextInput
                    style={styles.input}
                    value={mfaCode}
                    onChangeText={setMfaCode}
                    placeholder="000000"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                  />

                  {!!error && <Text style={styles.error}>{error}</Text>}

                  <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.75 }]} onPress={handleVerifyMfa} disabled={loading}>
                    <Text style={styles.submitBtnText}>{loading ? 'Verificando...' : 'Verificar código'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    onPress={() => {
                      setMfaChallengeId('');
                      setMfaCode('');
                      setMfaExpiresAt(0);
                      setMfaDevCode('');
                      setShowAuthPanel(false);
                      setError('');
                    }}
                  >
                    <Text style={styles.submitBtnText}>Volver</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.authTabs}>
                    <TouchableOpacity style={[styles.authTabBtn, authMode === 'login' && styles.authTabBtnActive]} onPress={() => setAuthMode('login')}>
                      <Text style={[styles.authTabText, authMode === 'login' && styles.authTabTextActive]}>Login</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.authTabBtn, authMode === 'register' && styles.authTabBtnActive]} onPress={() => setAuthMode('register')}>
                      <Text style={[styles.authTabText, authMode === 'register' && styles.authTabTextActive]}>Registro</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.authTitle}>{authMode === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}</Text>
                  <Text style={styles.authSub}>{authMode === 'login' ? 'Accede y continúa con tu flujo de trabajo.' : 'Regístrate y pon en marcha tu operación digital.'}</Text>

                  {authMode === 'register' && (
                    <>
                      <Text style={styles.fieldLabel}>Nombre</Text>
                      <TextInput style={styles.input} value={nombre} onChangeText={setNombre} placeholder="Tu nombre" placeholderTextColor="#94A3B8" />

                      <Text style={styles.fieldLabel}>Nombre de la empresa</Text>
                      <TextInput style={styles.input} value={nombreEmpresa} onChangeText={setNombreEmpresa} placeholder="Empresa S.L." placeholderTextColor="#94A3B8" />

                      <Text style={styles.fieldLabel}>CIF</Text>
                      <TextInput
                        style={styles.input}
                        value={cif}
                        onChangeText={setCif}
                        placeholder="A1234567B"
                        placeholderTextColor="#94A3B8"
                        autoCapitalize="characters"
                      />

                      <Text style={styles.fieldLabel}>Método de pago</Text>
                      <View style={styles.payMethodRow}>
                        <TouchableOpacity style={[styles.payMethodBtn, paymentMethod === 'paypal' && styles.payMethodBtnActive]} onPress={() => setPaymentMethod('paypal')}>
                          <Text style={[styles.payMethodText, paymentMethod === 'paypal' && styles.payMethodTextActive]}>PayPal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.payMethodBtn, paymentMethod === 'tarjeta' && styles.payMethodBtnActive]} onPress={() => setPaymentMethod('tarjeta')}>
                          <Text style={[styles.payMethodText, paymentMethod === 'tarjeta' && styles.payMethodTextActive]}>Tarjeta</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.helper}>Modalidad seleccionada: {billingModel === 'creditos' ? 'Créditos' : 'Suscripción'}</Text>
                    </>
                  )}

                  <Text style={styles.fieldLabel}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="usuario@dominio.com"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />

                  <Text style={styles.fieldLabel}>Contraseña</Text>
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Mínimo 6 caracteres"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry
                  />

                  {!!error && <Text style={styles.error}>{error}</Text>}

                  <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.75 }]} onPress={authMode === 'login' ? handleLogin : handleRegister} disabled={loading}>
                    <Text style={styles.submitBtnText}>{loading ? 'Procesando...' : (authMode === 'login' ? 'Entrar' : 'Crear cuenta')}</Text>
                  </TouchableOpacity>
                </>
              )}
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </View>
    </ScrollView>
  );
}

/**
 * CookieBanner — LSSI-CE Art. 6 / RGPD Recital 30
 * Aviso de uso de almacenamiento local (localStorage / AsyncStorage).
 * Solo se muestra en web y solo si el usuario no ha respondido aún.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

const CONSENT_KEY = 'pfp_cookie_consent_v1';

export default function CookieBanner() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    try {
      const stored = window.localStorage.getItem(CONSENT_KEY);
      if (!stored) setVisible(true);
    } catch (_) {}
  }, []);

  const handleAccept = () => {
    try {
      window.localStorage.setItem(CONSENT_KEY, JSON.stringify({
        accepted: true,
        timestamp: new Date().toISOString(),
        version: '1.0',
      }));
    } catch (_) {}
    setVisible(false);
  };

  const handleReject = () => {
    // Sin consentimiento no guardamos preferencia de idioma en localStorage
    try { window.localStorage.removeItem('pfp_lang'); } catch (_) {}
    try {
      window.localStorage.setItem(CONSENT_KEY, JSON.stringify({
        accepted: false,
        timestamp: new Date().toISOString(),
        version: '1.0',
      }));
    } catch (_) {}
    setVisible(false);
  };

  if (!visible || Platform.OS !== 'web') return null;

  return (
    <View style={styles.banner}>
      <View style={styles.inner}>
        <View style={styles.textWrap}>
          <Text style={styles.title}>{t('legal.cookieTitle')}</Text>
          <Text style={styles.body}>{t('legal.cookieBody')}</Text>
        </View>
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.btnReject} onPress={handleReject}>
            <Text style={styles.btnRejectText}>{t('legal.cookieReject')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnAccept} onPress={handleAccept}>
            <Text style={styles.btnAcceptText}>{t('legal.cookieAccept')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: 'rgba(15,23,42,0.97)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(232,82,42,0.30)',
  },
  inner: {
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 20,
    flexWrap: 'wrap',
  },
  textWrap: {
    flex: 1,
    minWidth: 200,
    gap: 3,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  body: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 16,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    flexShrink: 0,
  },
  btnReject: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  btnRejectText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
  },
  btnAccept: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 7,
    backgroundColor: '#E8522A',
  },
  btnAcceptText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

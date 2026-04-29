import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet,
  Platform, ScrollView, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Pressable, Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useModulos } from '../ModulosContext';

function buildAuthHeaders() {
  const token = (typeof global !== 'undefined' && global.__MIAPP_ACCESS_TOKEN) || null;
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

export default function AiHelpFab() {
  const { t } = useTranslation();
  const { modulos } = useModulos();
  const iaActiva = !!modulos.ayuda_ia;

  const [open, setOpen]               = useState(false);
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);
  const [limitReached, setLimitReached] = useState(false);

  const inputDisabled = !iaActiva || loading || limitReached;

  const send = async () => {
    const texto = input.trim();
    if (!texto || inputDisabled) return;
    setInput('');
    setError(null);
    setMessages(prev => [...prev, { role: 'user', text: texto }]);
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8080/api/ai-help', {
        method: 'POST',
        headers: buildAuthHeaders(),
        body: JSON.stringify({ mensaje: texto }),
      });
      const data = await res.json();
      if (res.status === 429) {
        setLimitReached(true);
        setError(data.error || t('help.aiLimitReached'));
      } else if (!res.ok) {
        setError(data.error || t('help.aiError'));
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: data.respuesta }]);
      }
    } catch (_) {
      setError(t('help.aiError'));
    }
    setLoading(false);
  };

  return (
    <>
      {/* ── Botón flotante ─────────────────────────────────────── */}
      <TouchableOpacity
        style={[s.fab, !iaActiva && s.fabDisabled]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Image
          source={require('../assets/logo-printforge.png')}
          style={s.fabLogo}
          resizeMode="contain"
        />
        <View style={s.aiBadge}>
          <Text style={s.aiBadgeText}>AI</Text>
        </View>
        {!iaActiva && <View style={s.fabDot} />}
      </TouchableOpacity>

      {/* ── Panel de chat ──────────────────────────────────────── */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={s.overlay} onPress={() => setOpen(false)} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={s.panelWrap}
          pointerEvents="box-none"
        >
          <View style={s.panel}>
            {/* Cabecera */}
            <View style={s.panelHeader}>
              <Image
                source={require('../assets/logo-printforge.png')}
                style={s.panelLogo}
                resizeMode="contain"
              />
              <View style={{ flex: 1 }}>
                <Text style={s.panelTitle}>{t('help.aiTitle')}</Text>
                {!iaActiva && (
                  <Text style={s.panelSubtitle}>{t('help.aiDesactivado')}</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setOpen(false)} style={s.closeBtn}>
                <Text style={s.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Banner desactivado */}
            {!iaActiva && (
              <View style={s.noticeBanner}>
                <Text style={s.noticeBannerText}>{t('help.aiNoDisponible')}</Text>
              </View>
            )}

            {/* Mensajes */}
            <ScrollView
              style={s.chat}
              contentContainerStyle={s.chatContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.length === 0 && iaActiva && (
                <Text style={s.emptyHint}>{t('help.aiIntro')}</Text>
              )}
              {messages.map((m, i) => (
                <View key={i} style={[s.bubble, m.role === 'user' ? s.bubbleUser : s.bubbleAssistant]}>
                  <Text style={[s.bubbleText, m.role === 'user' ? s.bubbleTextUser : s.bubbleTextAssistant]}>
                    {m.text}
                  </Text>
                </View>
              ))}
              {loading && (
                <View style={[s.bubble, s.bubbleAssistant]}>
                  <ActivityIndicator size="small" color="#4F46E5" />
                  <Text style={[s.bubbleText, s.bubbleTextAssistant, { marginLeft: 8 }]}>
                    {t('help.aiThinking')}
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Error / límite */}
            {error && (
              <View style={[s.errorBanner, limitReached && s.errorBannerLimit]}>
                <Text style={s.errorBannerText}>{error}</Text>
              </View>
            )}

            {/* Input */}
            <View style={[s.inputRow, inputDisabled && s.inputRowDisabled]}>
              <TextInput
                style={[s.input, inputDisabled && s.inputDisabled]}
                value={input}
                onChangeText={setInput}
                placeholder={
                  !iaActiva    ? t('help.aiNoDisponibleShort') :
                  limitReached ? t('help.aiLimitReachedShort') :
                                 t('help.aiPlaceholder')
                }
                placeholderTextColor={inputDisabled ? '#CBD5E1' : '#94A3B8'}
                maxLength={500}
                multiline={false}
                returnKeyType="send"
                onSubmitEditing={send}
                editable={!inputDisabled}
              />
              <TouchableOpacity
                style={[s.sendBtn, (inputDisabled || !input.trim()) && s.sendBtnDisabled]}
                onPress={send}
                disabled={inputDisabled || !input.trim()}
                activeOpacity={0.75}
              >
                <Text style={s.sendBtnText}>{t('help.aiSend')}</Text>
              </TouchableOpacity>
            </View>
            {iaActiva && !limitReached && (
              <Text style={s.charCount}>{input.length}/500</Text>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const PANEL_W = Platform.OS === 'web' ? 380 : '92%';

const s = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E1B4B',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    zIndex: 999,
  },
  fabDisabled: {
    backgroundColor: '#94A3B8',
  },
  fabLogo: {
    width: 28,
    height: 28,
    tintColor: '#FFFFFF',
  },
  aiBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#10B981',
    borderRadius: 7,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  aiBadgeText: {
    fontSize: 7,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  fabDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F59E0B',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.4)',
  },
  panelWrap: {
    position: 'absolute',
    bottom: 90,
    right: 24,
    width: PANEL_W,
    maxWidth: 420,
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#1E1B4B',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  panelLogo: {
    width: 24,
    height: 24,
    tintColor: '#FFFFFF',
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  panelSubtitle: {
    fontSize: 11,
    color: '#C7D2FE',
    marginTop: 1,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  noticeBanner: {
    backgroundColor: '#FFF7ED',
    borderBottomWidth: 1,
    borderBottomColor: '#FED7AA',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  noticeBannerText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
  },
  emptyHint: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
    textAlign: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  chat: {
    maxHeight: 280,
    paddingHorizontal: 12,
  },
  chatContent: {
    paddingVertical: 12,
    gap: 8,
  },
  bubble: {
    maxWidth: '86%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bubbleUser: {
    backgroundColor: '#4F46E5',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 3,
  },
  bubbleAssistant: {
    backgroundColor: '#F1F5F9',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 3,
  },
  bubbleText: { fontSize: 13, lineHeight: 19, flexShrink: 1 },
  bubbleTextUser: { color: '#FFFFFF' },
  bubbleTextAssistant: { color: '#1E1B4B' },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderTopWidth: 1,
    borderTopColor: '#FECACA',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  errorBannerLimit: {
    backgroundColor: '#FFFBEB',
    borderTopColor: '#FDE68A',
  },
  errorBannerText: { fontSize: 12, color: '#991B1B', lineHeight: 18 },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  inputRowDisabled: { opacity: 0.6 },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'web' ? 7 : 9,
    fontSize: 13,
    color: '#1E1B4B',
    backgroundColor: '#F8FAFC',
    outlineStyle: 'none',
  },
  inputDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  sendBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    flexShrink: 0,
  },
  sendBtnDisabled: { backgroundColor: '#C7D2FE' },
  sendBtnText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  charCount: {
    fontSize: 10,
    color: '#CBD5E1',
    textAlign: 'right',
    paddingRight: 12,
    paddingBottom: 4,
    marginTop: -6,
  },
});

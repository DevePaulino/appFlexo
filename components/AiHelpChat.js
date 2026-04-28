import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useModulos } from '../ModulosContext';

function buildAuthHeaders() {
  const token = (typeof global !== 'undefined' && global.__MIAPP_ACCESS_TOKEN) || null;
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

export default function AiHelpChat() {
  const { t } = useTranslation();
  const { modulos } = useModulos();
  const iaActiva = !!modulos.ayuda_ia;

  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [limitReached, setLimitReached] = useState(false);
  const scrollRef = useRef(null);

  const send = async () => {
    const texto = input.trim();
    if (!texto || loading || !iaActiva || limitReached) return;
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
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (_) {
      setError(t('help.aiError'));
    }
    setLoading(false);
  };

  const inputDisabled = !iaActiva || loading || limitReached;

  return (
    <View style={s.container}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionIcon}>🤖</Text>
        <Text style={s.sectionTitle}>{t('help.aiTitle')}</Text>
        {!iaActiva && (
          <View style={s.badge}>
            <Text style={s.badgeText}>{t('help.aiDesactivado')}</Text>
          </View>
        )}
      </View>

      {/* Banner de estado cuando no está disponible */}
      {!iaActiva && (
        <View style={s.noticeBanner}>
          <Text style={s.noticeBannerText}>{t('help.aiNoDisponible')}</Text>
        </View>
      )}

      {iaActiva && (
        <Text style={s.intro}>{t('help.aiIntro')}</Text>
      )}

      {messages.length > 0 && (
        <ScrollView
          ref={scrollRef}
          style={s.chat}
          contentContainerStyle={s.chatContent}
          showsVerticalScrollIndicator={false}
        >
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
              <Text style={[s.bubbleText, s.bubbleTextAssistant, { marginLeft: 8 }]}>{t('help.aiThinking')}</Text>
            </View>
          )}
        </ScrollView>
      )}

      {error && (
        <View style={[s.errorBanner, limitReached && s.errorBannerLimit]}>
          <Text style={s.errorBannerText}>{error}</Text>
        </View>
      )}

      <View style={[s.inputRow, inputDisabled && s.inputRowDisabled]}>
        <TextInput
          style={[s.input, inputDisabled && s.inputDisabled]}
          value={input}
          onChangeText={setInput}
          placeholder={
            !iaActiva        ? t('help.aiNoDisponibleShort') :
            limitReached     ? t('help.aiLimitReachedShort') :
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
          style={[s.sendBtn, inputDisabled && s.sendBtnDisabled]}
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
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
    shadowColor: '#1E1B4B',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  sectionIcon: { fontSize: 18 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E1B4B',
    flex: 1,
  },
  badge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  noticeBanner: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  noticeBannerText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
  },
  intro: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
    lineHeight: 18,
  },
  chat: {
    maxHeight: 260,
    marginBottom: 10,
  },
  chatContent: {
    gap: 8,
    paddingBottom: 4,
  },
  bubble: {
    maxWidth: '88%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bubbleUser: {
    backgroundColor: '#4F46E5',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: '#F1F5F9',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 19,
  },
  bubbleTextUser: { color: '#FFFFFF' },
  bubbleTextAssistant: { color: '#1E1B4B' },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  errorBannerLimit: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  errorBannerText: {
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 18,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  inputRowDisabled: {
    opacity: 0.6,
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'web' ? 8 : 10,
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    flexShrink: 0,
  },
  sendBtnDisabled: {
    backgroundColor: '#C7D2FE',
  },
  sendBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  charCount: {
    fontSize: 10,
    color: '#CBD5E1',
    textAlign: 'right',
    marginTop: 4,
  },
});

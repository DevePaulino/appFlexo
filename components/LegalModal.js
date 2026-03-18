import React, { useState, useEffect } from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

const P = {
  bg:          '#0E0E10',
  surface:     '#141416',
  border:      'rgba(255,255,255,0.08)',
  accent:      '#E8522A',
  text:        '#FFFFFF',
  textSec:     'rgba(255,255,255,0.55)',
  textMuted:   'rgba(255,255,255,0.30)',
  warnBg:      'rgba(255,200,0,0.10)',
  warnBorder:  'rgba(255,200,0,0.25)',
  warnText:    'rgba(255,220,60,0.85)',
};

export default function LegalModal({ visible, onClose, initialTab = 'pp' }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState(initialTab);

  useEffect(() => { if (visible) setTab(initialTab); }, [visible, initialTab]);

  const tabs = [
    { id: 'pp',     label: t('legal.tabPrivacy') },
    { id: 'tos',    label: t('legal.tabTerms') },
    { id: 'notice', label: t('legal.tabNotice') },
  ];

  const doc = t(`legal.${tab}`, { returnObjects: true }) || {};
  const sections = Array.isArray(doc.sections) ? doc.sections : [];

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>

          {/* Header */}
          <View style={s.header}>
            <Text style={s.headerTitle}>{doc.title || ''}</Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Text style={s.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={s.tabRow}>
            {tabs.map(tb => (
              <TouchableOpacity
                key={tb.id}
                style={[s.tab, tab === tb.id && s.tabActive]}
                onPress={() => setTab(tb.id)}
              >
                <Text style={[s.tabText, tab === tb.id && s.tabTextActive]}>{tb.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Content */}
          <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
            {!!doc.lastUpdated && <Text style={s.lastUpdated}>{doc.lastUpdated}</Text>}
            <View style={s.warnBox}>
              <Text style={s.warnText}>{t('legal.placeholderWarning')}</Text>
            </View>
            {sections.map((sec, i) => (
              <View key={i} style={s.section}>
                <Text style={s.sectionTitle}>{sec.title}</Text>
                <Text style={s.sectionBody}>{sec.body}</Text>
              </View>
            ))}
          </ScrollView>

        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Platform.OS === 'web' ? 24 : 0,
  },
  sheet: {
    backgroundColor: P.surface,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: P.border,
    ...(Platform.OS === 'web'
      ? { borderRadius: 14, width: '100%', maxWidth: 680, maxHeight: '90vh' }
      : { flex: 1, width: '100%' }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: P.border,
    backgroundColor: P.bg,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: P.text,
    flex: 1,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  closeText: { fontSize: 12, color: P.textSec, fontWeight: '600' },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: P.bg,
    borderBottomWidth: 1,
    borderBottomColor: P.border,
    paddingHorizontal: 12,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: P.accent },
  tabText: { fontSize: 12, fontWeight: '500', color: P.textMuted },
  tabTextActive: { color: P.text, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  lastUpdated: { fontSize: 11, color: P.textMuted, marginBottom: 12 },
  warnBox: {
    backgroundColor: P.warnBg,
    borderWidth: 1,
    borderColor: P.warnBorder,
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  warnText: { fontSize: 11, color: P.warnText, lineHeight: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: P.text, marginBottom: 6 },
  sectionBody: { fontSize: 12, color: P.textSec, lineHeight: 20 },
});

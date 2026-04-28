import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { helpEvents } from '../helpEvents';

const SECTIONS = [
  {
    key: 'pedidos',
    icon: '📋',
    navTarget: { tab: 'Pedidos' },
    stepsCount: 4,
  },
  {
    key: 'presupuestos',
    icon: '💰',
    navTarget: { tab: 'Presupuesto' },
    stepsCount: 4,
  },
  {
    key: 'produccion',
    icon: '🏭',
    navTarget: { tab: 'Producción' },
    stepsCount: 4,
  },
  {
    key: 'clientes',
    icon: '👥',
    navTarget: { tab: 'Activos', screen: 'ActivosClientes' },
    stepsCount: 3,
  },
  {
    key: 'maquinas',
    icon: '⚙️',
    navTarget: { tab: 'Activos', screen: 'ActivosMaquinas' },
    stepsCount: 3,
  },
  {
    key: 'facturacion',
    icon: '💳',
    navTarget: { stack: 'SettingsBilling' },
    stepsCount: 4,
  },
  {
    key: 'usuarios',
    icon: '🔐',
    navTarget: { stack: 'SettingsUsuariosRoles' },
    stepsCount: 3,
  },
];

export default function AyudaScreen({ navigation }) {
  const { t } = useTranslation();
  const launchTour = (section) => {
    if (section.navTarget.stack) {
      navigation.navigate(section.navTarget.stack);
    } else if (section.navTarget.screen) {
      navigation.navigate(section.navTarget.tab, { screen: section.navTarget.screen });
    } else {
      navigation.navigate(section.navTarget.tab);
    }
    setTimeout(() => helpEvents.trigger(section.key), 300);
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>{t('nav.ayuda')}</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>

        {/* ── Tours guiados ────────────────────────────────────── */}
        <Text style={s.intro}>{t('help.ayudaIntro')}</Text>
        {SECTIONS.map((section) => (
          <View key={section.key} style={s.card}>
            <View style={s.cardLeft}>
              <View style={s.iconWrap}>
                <Text style={s.icon}>{section.icon}</Text>
              </View>
              <View style={s.cardInfo}>
                <Text style={s.cardTitle}>{t(`help.${section.key}.title`)}</Text>
                <Text style={s.cardSub}>
                  {section.stepsCount} {t('help.ayudaSteps')}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={s.tourBtn}
              onPress={() => launchTour(section)}
              activeOpacity={0.75}
            >
              <Text style={s.tourBtnText}>{t('help.ayudaStart')}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E1B4B',
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: Platform.OS === 'web' ? 640 : undefined,
    alignSelf: Platform.OS === 'web' ? 'center' : undefined,
    width: Platform.OS === 'web' ? '100%' : undefined,
  },
  intro: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1E1B4B',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  icon: { fontSize: 20 },
  cardInfo: { flex: 1 },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E1B4B',
    marginBottom: 2,
  },
  cardSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  tourBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    flexShrink: 0,
  },
  tourBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

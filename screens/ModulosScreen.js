import React from 'react';
import { Alert, View, Text, StyleSheet, Switch, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useModulos } from '../ModulosContext';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5FD',
  },
  header: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#C7D2FE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 38,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1B4B',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  content: {
    padding: 12,
    paddingTop: 14,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
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
    marginBottom: 12,
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
  },
  hint: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F8',
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  rowHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});

export default function ModulosScreen() {
  const { t } = useTranslation();
  const { modulos, setModulo } = useModulos();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={{ width: 38 }} />
          <Text style={styles.headerTitle}>{t('nav.modulos')}</Text>
          <View style={{ width: 38 }} />
        </View>
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('screens.config.modulosTitle')}</Text>
          <Text style={styles.hint}>{t('screens.config.modulosHint')}</Text>

          {/* Módulo Presupuestos */}
          <View style={styles.row}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.rowLabel}>{t('screens.config.moduloPresupuestos')}</Text>
              <Text style={styles.rowHint}>{t('screens.config.moduloPresupuestosHint')}</Text>
            </View>
            <Switch
              value={modulos.presupuestos !== false}
              onValueChange={(v) => setModulo('presupuestos', v)}
              trackColor={{ false: '#CBD5E1', true: '#3B82F6' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Módulo Producción */}
          <View style={styles.row}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.rowLabel}>{t('screens.config.moduloProduccion')}</Text>
              <Text style={styles.rowHint}>{t('screens.config.moduloProduccionHint')}</Text>
            </View>
            <Switch
              value={!!modulos.produccion}
              onValueChange={(v) => {
                if (v && !modulos.produccion_trigger_estado) {
                  Alert.alert(
                    t('screens.config.moduloProduccionTriggerRequired'),
                    t('screens.config.moduloProduccionTriggerRequiredHint')
                  );
                  return;
                }
                setModulo('produccion', v);
              }}
              trackColor={{ false: '#CBD5E1', true: '#3B82F6' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Módulo Colorimetría */}
          <View style={[styles.row, styles.rowLast]}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.rowLabel}>Colorimetría</Text>
              <Text style={styles.rowHint}>Registra y consulta las condiciones con las que se imprime cada trabajo</Text>
            </View>
            <Switch
              value={!!modulos.condiciones_impresion}
              onValueChange={(v) => setModulo('condiciones_impresion', v)}
              trackColor={{ false: '#CBD5E1', true: '#3B82F6' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

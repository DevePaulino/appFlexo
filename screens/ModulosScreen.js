import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, Modal, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useModulos } from '../ModulosContext';
import { useSettings } from '../SettingsContext';

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
  triggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 0,
    marginTop: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  triggerLabel: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },
  triggerValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F46E5',
    marginRight: 6,
  },
  triggerBtn: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  triggerBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    width: '85%',
    maxWidth: 420,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  modalHint: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 14,
  },
  estadoItem: {
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  estadoItemSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  estadoItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  estadoItemTextSelected: {
    color: '#1D4ED8',
  },
  modalCancelBtn: {
    marginTop: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  modalCancelBtnText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
});

export default function ModulosScreen() {
  const { t } = useTranslation();
  const { modulos, setModulo } = useModulos();
  const { settings } = useSettings();
  const [showTriggerPicker, setShowTriggerPicker] = useState(false);
  // pendingActivation: true when we opened the picker to enable the module
  const [pendingActivation, setPendingActivation] = useState(false);

  const estadosDisponibles = settings.estados_pedido || [];

  const handleToggleProduccion = (value) => {
    if (!value) {
      setModulo('produccion', false);
      return;
    }
    // Activating: if trigger not set, force selection first
    if (!modulos.produccion_trigger_estado) {
      setPendingActivation(true);
      setShowTriggerPicker(true);
    } else {
      setModulo('produccion', true);
    }
  };

  const handleSelectTrigger = (estadoValor) => {
    setModulo('produccion_trigger_estado', estadoValor);
    if (pendingActivation) {
      setModulo('produccion', true);
      setPendingActivation(false);
    }
    setShowTriggerPicker(false);
  };

  const handleCancelPicker = () => {
    setPendingActivation(false);
    setShowTriggerPicker(false);
  };

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
          <View style={[styles.row, !modulos.produccion && styles.rowLast]}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.rowLabel}>{t('screens.config.moduloProduccion')}</Text>
              <Text style={styles.rowHint}>{t('screens.config.moduloProduccionHint')}</Text>
            </View>
            <Switch
              value={!!modulos.produccion}
              onValueChange={handleToggleProduccion}
              trackColor={{ false: '#CBD5E1', true: '#3B82F6' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Trigger de producción — visible solo cuando el módulo está activo */}
          {!!modulos.produccion && (
            <View style={[styles.triggerRow, styles.rowLast]}>
              <Text style={styles.triggerLabel}>{t('screens.config.moduloProduccionTrigger')}</Text>
              <Text style={styles.triggerValue}>
                {modulos.produccion_trigger_estado || '—'}
              </Text>
              <TouchableOpacity style={styles.triggerBtn} onPress={() => { setPendingActivation(false); setShowTriggerPicker(true); }}>
                <Text style={styles.triggerBtnText}>{t('common.change')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal selección de estado trigger */}
      <Modal visible={showTriggerPicker} transparent animationType="fade" onRequestClose={handleCancelPicker}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('screens.config.seleccionarTriggerEstado')}</Text>
            <Text style={styles.modalHint}>{t('screens.config.seleccionarTriggerEstadoHint')}</Text>
            <ScrollView style={{ maxHeight: 280 }}>
              {estadosDisponibles.map((item) => {
                const isSelected = modulos.produccion_trigger_estado === item.valor;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.estadoItem, isSelected && styles.estadoItemSelected]}
                    onPress={() => handleSelectTrigger(item.valor)}
                  >
                    <Text style={[styles.estadoItemText, isSelected && styles.estadoItemTextSelected]}>
                      {item.valor}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {!pendingActivation && (
              <TouchableOpacity style={styles.modalCancelBtn} onPress={handleCancelPicker}>
                <Text style={styles.modalCancelBtnText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

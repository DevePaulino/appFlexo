/**
 * CamposDinamicos
 * Renderiza los campos personalizados de una sección del formulario de pedido.
 *
 * Props:
 *   seccion    'producto' | 'impresion'
 *   campos     array de definiciones de campo (de /api/campos-formulario)
 *   valores    objeto { campo_id: valor }
 *   onChange   (campo_id, valor) => void
 *   submitted  boolean — activa validación visual de obligatorios
 */
import React from 'react';
import { View, Text, TextInput, Switch, StyleSheet, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

// Picker con fallback para web
let Picker = null;
try {
  Picker = require('@react-native-picker/picker').Picker;
} catch (e) { /* no-op */ }

/**
 * Acepta contenedorId (nuevo) o seccion (legado).
 * Prioriza contenedor_id si está presente en el campo; si no, cae al seccion legacy.
 */
export default function CamposDinamicos({ seccion, contenedorId, campos = [], valores = {}, onChange, submitted = false }) {
  const { t } = useTranslation();
  const camposSeccion = campos
    .filter(c => {
      if (c.activo === false) return false;
      if (contenedorId) {
        // Nuevo sistema: filtrar por contenedor_id
        if (c.contenedor_id) return c.contenedor_id === contenedorId;
        // Fallback legado: si no tiene contenedor_id, usar seccion
        return seccion ? c.seccion === seccion : false;
      }
      // Modo legacy: filtrar solo por seccion
      return c.seccion === seccion;
    })
    .sort((a, b) => (a.fila !== b.fila ? a.fila - b.fila : a.col - b.col));

  if (camposSeccion.length === 0) return null;

  const renderCampo = (campo) => {
    const id = campo.campo_id || campo.id;
    const valor = valores[id] ?? '';
    const invalid = submitted && campo.obligatorio && !valor && valor !== false;

    switch (campo.tipo) {
      case 'texto':
        return (
          <TextInput
            style={[styles.input, invalid && styles.inputError]}
            value={String(valor)}
            onChangeText={v => onChange(id, v)}
            placeholder={campo.etiqueta}
            placeholderTextColor="#94A3B8"
          />
        );

      case 'numero':
        return (
          <TextInput
            style={[styles.input, styles.inputNumero, invalid && styles.inputError]}
            value={String(valor)}
            onChangeText={v => onChange(id, v)}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#94A3B8"
          />
        );

      case 'textarea':
        return (
          <TextInput
            style={[styles.input, styles.inputTextarea, invalid && styles.inputError]}
            value={String(valor)}
            onChangeText={v => onChange(id, v)}
            placeholder={campo.etiqueta}
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
          />
        );

      case 'checkbox':
        return (
          <Switch
            value={!!valor}
            onValueChange={v => onChange(id, v)}
            trackColor={{ true: '#4F46E5' }}
          />
        );

      case 'select':
        if (Platform.OS === 'web') {
          return (
            <select
              style={webSelectStyle(invalid)}
              value={String(valor)}
              onChange={e => onChange(id, e.target.value)}
            >
              <option value="">{t('formBuilder.selectPlaceholder')}</option>
              {(campo.opciones || []).map((op, i) => (
                <option key={i} value={op}>{op}</option>
              ))}
            </select>
          );
        }
        if (Picker) {
          return (
            <View style={[styles.pickerWrap, invalid && styles.inputError]}>
              <Picker selectedValue={String(valor)} onValueChange={v => onChange(id, v)} style={styles.picker}>
                <Picker.Item label={t('formBuilder.selectPlaceholder')} value="" />
                {(campo.opciones || []).map((op, i) => (
                  <Picker.Item key={i} label={op} value={op} />
                ))}
              </Picker>
            </View>
          );
        }
        // último fallback nativo sin Picker
        return (
          <TextInput
            style={[styles.input, invalid && styles.inputError]}
            value={String(valor)}
            onChangeText={v => onChange(id, v)}
            placeholder={`${campo.etiqueta} (${(campo.opciones || []).join(', ')})`}
            placeholderTextColor="#94A3B8"
          />
        );

      case 'fecha':
        if (Platform.OS === 'web') {
          return (
            <input
              type="date"
              style={webDateStyle(invalid)}
              value={String(valor)}
              onChange={e => onChange(id, e.target.value)}
            />
          );
        }
        return (
          <TextInput
            style={[styles.input, invalid && styles.inputError]}
            value={String(valor)}
            onChangeText={v => onChange(id, v)}
            placeholder="dd/mm/aaaa"
            placeholderTextColor="#94A3B8"
          />
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {camposSeccion.map(campo => {
          const id = campo.campo_id || campo.id;
          const valor = valores[id] ?? '';
          const invalid = submitted && campo.obligatorio && !valor && valor !== false;
          const widthPct = `${((Math.min(12, campo.ancho || 6) / 12) * 100).toFixed(4)}%`;

          return (
            <View key={id} style={[styles.fieldWrap, { flexBasis: widthPct, flexShrink: 0, flexGrow: 0 }]}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{campo.etiqueta}</Text>
                {campo.obligatorio && <Text style={styles.required}> *</Text>}
              </View>
              {renderCampo(campo)}
              {invalid && <Text style={styles.errorText}>{t('formBuilder.requiredField')}</Text>}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const webSelectStyle = (invalid) => ({
  width: '100%',
  height: 40,
  borderRadius: 8,
  border: `1.5px solid ${invalid ? '#EF4444' : '#E2E8F0'}`,
  backgroundColor: '#F8FAFC',
  padding: '0 10px',
  fontSize: 14,
  color: '#0F172A',
  outline: 'none',
  cursor: 'pointer',
});

const webDateStyle = (invalid) => ({
  width: '100%',
  height: 40,
  borderRadius: 8,
  border: `1.5px solid ${invalid ? '#EF4444' : '#E2E8F0'}`,
  backgroundColor: '#F8FAFC',
  padding: '0 10px',
  fontSize: 14,
  color: '#0F172A',
  outline: 'none',
});

const styles = StyleSheet.create({
  container: { marginTop: 8 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginRight: -10,
  },
  fieldWrap: {
    minWidth: 120,
    paddingRight: 10,
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  label: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  required: { fontSize: 12, color: '#EF4444', fontWeight: '700' },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
  },
  inputError: { borderColor: '#EF4444' },
  inputNumero: { width: 100 },
  inputTextarea: { height: 72, textAlignVertical: 'top' },
  pickerWrap: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: { height: 40 },
  errorText: { fontSize: 11, color: '#EF4444', marginTop: 2 },
});

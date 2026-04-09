import React, { useEffect, useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const emptyForm = {
  nombre: '',
  anio_fabricacion: '',
  tipo_maquina: '',
  numero_colores: '',
  estado: 'Activa',
  ancho_max_material_mm: '',
  ancho_max_impresion_mm: '',
  repeticion_min_mm: '',
  repeticion_max_mm: '',
  velocidad_max_maquina_mmin: '',
  espesor_planchas_mm: '',
  sistemas_secado: '',
};

const fmt = (v) => (v === null || v === undefined ? '' : String(v));
const parseNum = (v) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
};

export default function NuevaMaquinaModal({
  visible,
  onClose,
  onSave = () => {},
  modoEdicion = false,
  initialMaquina = null,
  puedeCrear = true,
}) {
  const [form, setForm] = useState({ ...emptyForm });
  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));
  // Congelar el título cuando el modal se abre para que no cambie durante la animación de cierre
  const [titulo, setTitulo] = useState('Nueva máquina');

  useEffect(() => {
    if (visible) {
      setTitulo(modoEdicion ? 'Ficha de máquina' : 'Nueva máquina');
      if (modoEdicion && initialMaquina) {
        setForm({
          nombre:                   fmt(initialMaquina.nombre),
          anio_fabricacion:         fmt(initialMaquina.anio_fabricacion),
          tipo_maquina:             fmt(initialMaquina.tipo_maquina),
          numero_colores:           fmt(initialMaquina.numero_colores),
          estado:                   fmt(initialMaquina.estado || 'Activa'),
          ancho_max_material_mm:    fmt(initialMaquina.ancho_max_material_mm),
          ancho_max_impresion_mm:   fmt(initialMaquina.ancho_max_impresion_mm),
          repeticion_min_mm:        fmt(initialMaquina.repeticion_min_mm),
          repeticion_max_mm:        fmt(initialMaquina.repeticion_max_mm),
          velocidad_max_maquina_mmin: fmt(
            initialMaquina.velocidad_max_maquina_mmin ?? initialMaquina.velocidad_max_impresion_mmin
          ),
          espesor_planchas_mm:      fmt(initialMaquina.espesor_planchas_mm),
          sistemas_secado:          fmt(initialMaquina.sistemas_secado),
        });
      } else {
        setForm({ ...emptyForm });
      }
    }
  }, [visible, modoEdicion, initialMaquina]);

  const handleClose = () => {
    onClose();
  };

  const handleSave = () => {
    if (!puedeCrear) { alert('Permiso denegado'); return; }
    if (!form.nombre.trim()) { alert('Marca y modelo es obligatorio'); return; }
    onSave({
      nombre:                    form.nombre.trim(),
      anio_fabricacion:          form.anio_fabricacion.trim() || null,
      tipo_maquina:              form.tipo_maquina.trim() || null,
      numero_colores:            parseNum(form.numero_colores),
      estado:                    form.estado || 'Activa',
      ancho_max_material_mm:     parseNum(form.ancho_max_material_mm),
      ancho_max_impresion_mm:    parseNum(form.ancho_max_impresion_mm),
      repeticion_min_mm:         parseNum(form.repeticion_min_mm),
      repeticion_max_mm:         parseNum(form.repeticion_max_mm),
      velocidad_max_maquina_mmin:   parseNum(form.velocidad_max_maquina_mmin),
      velocidad_max_impresion_mmin: parseNum(form.velocidad_max_maquina_mmin),
      espesor_planchas_mm:       parseNum(form.espesor_planchas_mm),
      sistemas_secado:           form.sistemas_secado.trim() || null,
    });
    handleClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{titulo}</Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.headerClose}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 8 }}>
            <View style={styles.grid}>

              <View style={styles.fieldFull}>
                <Text style={styles.label}>Marca y modelo *</Text>
                <TextInput style={styles.input} value={form.nombre}
                  onChangeText={(v) => set('nombre', v)}
                  placeholder="Ej. Rotativa A" placeholderTextColor="#94A3B8" autoFocus />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Año fabricación / versión</Text>
                <TextInput style={styles.input} value={form.anio_fabricacion}
                  onChangeText={(v) => set('anio_fabricacion', v)}
                  placeholder="Ej. 2018" placeholderTextColor="#94A3B8" />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Tipo de máquina</Text>
                <TextInput style={styles.input} value={form.tipo_maquina}
                  onChangeText={(v) => set('tipo_maquina', v)}
                  placeholder="Ej. Flexográfica" placeholderTextColor="#94A3B8" />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Número de colores</Text>
                <TextInput style={styles.input} value={form.numero_colores}
                  onChangeText={(v) => set('numero_colores', v)}
                  placeholder="Ej. 4" placeholderTextColor="#94A3B8" keyboardType="numeric" />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Estado</Text>
                {Platform.OS === 'web' ? (
                  <View style={styles.selectWrap}>
                    <select
                      value={form.estado || 'Activa'}
                      onChange={(e) => set('estado', e.target.value)}
                      style={{ width: '100%', border: 'none', backgroundColor: 'transparent', paddingTop: 8, paddingBottom: 8, paddingLeft: 10, paddingRight: 10, fontSize: 14, color: '#0F172A', cursor: 'pointer', outlineWidth: 0 }}
                    >
                      <option value="Activa">Activa</option>
                      <option value="Inactiva">Inactiva</option>
                    </select>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                    {['Activa', 'Inactiva'].map((op) => (
                      <TouchableOpacity key={op} onPress={() => set('estado', op)}
                        style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: form.estado === op ? '#475569' : '#EEF2F8' }}>
                        <Text style={{ color: form.estado === op ? '#fff' : '#475569', fontSize: 13 }}>{op}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Ancho máx. material (mm)</Text>
                <TextInput style={styles.input} value={form.ancho_max_material_mm}
                  onChangeText={(v) => set('ancho_max_material_mm', v)}
                  placeholder="Ej. 450" placeholderTextColor="#94A3B8" keyboardType="numeric" />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Ancho máx. impresión (mm)</Text>
                <TextInput style={styles.input} value={form.ancho_max_impresion_mm}
                  onChangeText={(v) => set('ancho_max_impresion_mm', v)}
                  placeholder="Ej. 420" placeholderTextColor="#94A3B8" keyboardType="numeric" />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Repetición mín. (mm)</Text>
                <TextInput style={styles.input} value={form.repeticion_min_mm}
                  onChangeText={(v) => set('repeticion_min_mm', v)}
                  placeholder="Ej. 150" placeholderTextColor="#94A3B8" keyboardType="numeric" />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Repetición máx. (mm)</Text>
                <TextInput style={styles.input} value={form.repeticion_max_mm}
                  onChangeText={(v) => set('repeticion_max_mm', v)}
                  placeholder="Ej. 600" placeholderTextColor="#94A3B8" keyboardType="numeric" />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Velocidad máx. (m/min)</Text>
                <TextInput style={styles.input} value={form.velocidad_max_maquina_mmin}
                  onChangeText={(v) => set('velocidad_max_maquina_mmin', v)}
                  placeholder="Ej. 150" placeholderTextColor="#94A3B8" keyboardType="numeric" />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Espesor planchas (mm)</Text>
                <TextInput style={styles.input} value={form.espesor_planchas_mm}
                  onChangeText={(v) => set('espesor_planchas_mm', v)}
                  placeholder="Ej. 1.14" placeholderTextColor="#94A3B8" keyboardType="numeric" />
              </View>

              <View style={styles.fieldFull}>
                <Text style={styles.label}>Sistemas de secado</Text>
                <TextInput style={styles.input} value={form.sistemas_secado}
                  onChangeText={(v) => set('sistemas_secado', v)}
                  placeholder="Ej. UV, secado por aire" placeholderTextColor="#94A3B8" />
              </View>

            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={handleClose} style={styles.btnCancel}>
              <Text style={styles.btnCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => puedeCrear && handleSave()}
              disabled={!puedeCrear}
              style={[styles.btnSave, !puedeCrear && { opacity: 0.45 }]}
            >
              <Text style={styles.btnSaveText}>{titulo === 'Ficha de máquina' ? 'Guardar cambios' : 'Guardar'}</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 560,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#1E1B4B',
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
  headerClose: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', padding: 4 },
  body: { padding: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  field: { flex: 1, minWidth: 140 },
  fieldFull: { width: '100%' },
  label: { fontSize: 13, color: '#475569', fontWeight: '700', marginBottom: 6 },
  input: {
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F1F5F9',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 10,
    color: '#0F172A',
  },
  selectWrap: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  btnCancel: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  btnCancelText: { color: '#64748B', fontWeight: '600' },
  btnSave: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  btnSaveText: { color: '#4F46E5', fontWeight: '700' },
});

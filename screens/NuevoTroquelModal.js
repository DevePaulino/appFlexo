import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, StyleSheet } from 'react-native';

export default function NuevoTroquelModal({
  visible,
  onClose,
  onSave = () => {},
  defaultNumero = '',
  existingNumeros = [],
  initialTroquel = null,
  modoEdicion = false,
  currentUser = null,
  puedeCrear = true,
}) {
  const [refTroquel, setRefTroquel]           = useState('');
  const [tipoTroquel, setTipoTroquel]         = useState('regular');
  const [forma, setForma]                     = useState('Rectangular');
  const [estado, setEstado]                   = useState('Disponible');
  const [anchoMotivo, setAnchoMotivo]         = useState('');
  const [altoMotivo, setAltoMotivo]           = useState('');
  const [motivosAncho, setMotivosAncho]       = useState('');
  const [separacionAncho, setSeparacionAncho] = useState('');
  const [valorZ, setValorZ]                   = useState('');
  const [distanciaSesgado, setDistanciaSesgado] = useState('');

  useEffect(() => {
    if (visible) {
      if (modoEdicion && initialTroquel) {
        setRefTroquel(initialTroquel.numero || initialTroquel.referencia || '');
        setTipoTroquel(initialTroquel.tipo || 'regular');
        setForma(initialTroquel.forma || 'Rectangular');
        setEstado(initialTroquel.estado || 'Disponible');
        setAnchoMotivo(initialTroquel.anchoMotivo || '');
        setAltoMotivo(initialTroquel.altoMotivo || '');
        setMotivosAncho(initialTroquel.motivosAncho || '');
        setSeparacionAncho(initialTroquel.separacionAncho || '');
        setValorZ(initialTroquel.valorZ || '');
        setDistanciaSesgado(initialTroquel.distanciaSesgado || '');
      } else {
        setRefTroquel(defaultNumero || '');
        setTipoTroquel('regular');
        setForma('Rectangular');
        setEstado('Disponible');
        setAnchoMotivo('');
        setAltoMotivo('');
        setMotivosAncho('');
        setSeparacionAncho('');
        setValorZ('');
        setDistanciaSesgado('');
      }
    }
  }, [visible, defaultNumero, initialTroquel, modoEdicion]);

  const resetAndClose = () => {
    setRefTroquel('');
    setTipoTroquel('regular');
    setForma('Rectangular');
    setEstado('Disponible');
    setAnchoMotivo('');
    setAltoMotivo('');
    setMotivosAncho('');
    setSeparacionAncho('');
    setValorZ('');
    setDistanciaSesgado('');
    onClose();
  };

  const handleSave = () => {
    if (!puedeCrear) {
      alert('Permiso denegado: no puedes crear/editar troqueles con este rol');
      return;
    }
    const referenciaNormalizada = String(refTroquel || '').trim();
    if (!referenciaNormalizada) {
      alert('Por favor completa la referencia del troquel');
      return;
    }
    const existeDuplicado = (existingNumeros || []).some(
      (n) => String(n || '').trim().toLowerCase() === referenciaNormalizada.toLowerCase()
    );
    if (existeDuplicado) {
      alert('Ya existe un troquel con ese número');
      return;
    }
    if (!anchoMotivo || !altoMotivo || !motivosAncho || !separacionAncho || !valorZ || !distanciaSesgado) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }
    onSave({
      id: modoEdicion && initialTroquel?.id ? initialTroquel.id : Date.now(),
      numero: referenciaNormalizada,
      referencia: referenciaNormalizada,
      tipo: tipoTroquel,
      forma,
      estado,
      anchoMotivo,
      altoMotivo,
      motivosAncho,
      separacionAncho,
      valorZ,
      distanciaSesgado,
    });
    resetAndClose();
  };

  const pill = (active) => ({
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: active ? '#475569' : '#f0f0f0',
  });
  const pillTxt = (active) => ({
    color: active ? '#fff' : '#444',
    fontSize: 13,
    fontWeight: active ? '700' : '500',
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={resetAndClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>
            {modoEdicion ? 'Editar Troquel' : 'Nuevo Troquel'}
          </Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Referencia */}
            <Text style={styles.label}>Número / Referencia *</Text>
            <TextInput
              style={styles.input}
              value={refTroquel}
              onChangeText={setRefTroquel}
              placeholder="Ej. TR-001"
              placeholderTextColor="#94A3B8"
              autoFocus
            />

            {/* Tipo */}
            <Text style={[styles.label, { marginTop: 4 }]}>Tipo</Text>
            <View style={styles.pillRow}>
              {['regular', 'irregular', 'corbata'].map((t) => (
                <TouchableOpacity key={t} onPress={() => setTipoTroquel(t)} style={pill(tipoTroquel === t)}>
                  <Text style={pillTxt(tipoTroquel === t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Forma */}
            <Text style={styles.label}>Forma</Text>
            <View style={styles.pillRow}>
              {['Rectangular', 'Circular', 'Irregular', 'Ovalado'].map((f) => (
                <TouchableOpacity key={f} onPress={() => setForma(f)} style={pill(forma === f)}>
                  <Text style={pillTxt(forma === f)}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Estado */}
            <Text style={styles.label}>Estado</Text>
            <View style={[styles.pillRow, { marginBottom: 16 }]}>
              {['Disponible', 'En uso'].map((e) => (
                <TouchableOpacity key={e} onPress={() => setEstado(e)} style={pill(estado === e)}>
                  <Text style={pillTxt(estado === e)}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Medidas — fila 1 */}
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Ancho motivo (mm)</Text>
                <TextInput style={styles.input} value={anchoMotivo} onChangeText={setAnchoMotivo}
                  placeholder="Ej. 100" placeholderTextColor="#94A3B8" keyboardType="decimal-pad" />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Alto motivo (mm)</Text>
                <TextInput style={styles.input} value={altoMotivo} onChangeText={setAltoMotivo}
                  placeholder="Ej. 150" placeholderTextColor="#94A3B8" keyboardType="decimal-pad" />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Motivos ancho</Text>
                <TextInput style={styles.input} value={motivosAncho} onChangeText={setMotivosAncho}
                  placeholder="Ej. 4" placeholderTextColor="#94A3B8" keyboardType="decimal-pad" />
              </View>
            </View>

            {/* Medidas — fila 2 */}
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Separación (mm)</Text>
                <TextInput style={styles.input} value={separacionAncho} onChangeText={setSeparacionAncho}
                  placeholder="Ej. 3" placeholderTextColor="#94A3B8" keyboardType="decimal-pad" />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Valor Z (mm)</Text>
                <TextInput style={styles.input} value={valorZ} onChangeText={setValorZ}
                  placeholder="Ej. 110" placeholderTextColor="#94A3B8" keyboardType="decimal-pad" />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Dist. sesgado (mm)</Text>
                <TextInput style={styles.input} value={distanciaSesgado} onChangeText={setDistanciaSesgado}
                  placeholder="Ej. 0" placeholderTextColor="#94A3B8" keyboardType="decimal-pad" />
              </View>
            </View>
          </ScrollView>

          {!puedeCrear && (
            <Text style={styles.permisoText}>Tu rol no permite crear/editar troqueles.</Text>
          )}

          {/* Botones */}
          <View style={styles.btnRow}>
            <TouchableOpacity onPress={resetAndClose} style={styles.btnCancel}>
              <Text style={styles.btnCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => puedeCrear && handleSave()}
              disabled={!puedeCrear}
              style={[styles.btnSave, !puedeCrear && { opacity: 0.45 }]}
            >
              <Text style={styles.btnSaveText}>{modoEdicion ? 'Guardar cambios' : 'Guardar'}</Text>
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
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1D2939',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 10,
    color: '#0F172A',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  col: {
    flex: 1,
  },
  permisoText: {
    color: '#777',
    fontSize: 12,
    marginTop: 6,
    marginBottom: 4,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  btnCancel: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  btnCancelText: {
    color: '#555',
    fontWeight: '600',
  },
  btnSave: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#475569',
  },
  btnSaveText: {
    color: '#fff',
    fontWeight: '700',
  },
});

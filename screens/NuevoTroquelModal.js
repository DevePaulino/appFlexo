import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  modalHeader: {
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  modalCloseText: {
    fontSize: 15,
    color: '#F8FAFC',
    fontWeight: '800',
  },
  container: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#F1F5F9',
    flex: 1,
  },
  section: {
    marginBottom: 10,
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FBFBFD',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 10,
    color: '#0F172A',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  col: {
    flex: 1,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  typeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FBFBFD',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#CBD5E1',
  },
  typeBtnActive: {
    backgroundColor: '#E8E8EC',
    borderColor: '#3AB274',
  },
  typeBtnText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 13,
  },
  typeBtnTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  submitContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: '#475569',
  },
  btnSecondary: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginVertical: 12,
  },
});

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
  const [refTroquel, setRefTroquel] = useState('');
  const [tipoTroquel, setTipoTroquel] = useState('regular');
  
  // Regular
  const [anchoMotivo, setAnchoMotivo] = useState('');
  const [altoMotivo, setAltoMotivo] = useState('');
  const [motivosAncho, setMotivosAncho] = useState('');
  const [separacionAncho, setSeparacionAncho] = useState('');
  const [valorZ, setValorZ] = useState('');

  const [distanciaSesgado, setDistanciaSesgado] = useState('');

  useEffect(() => {
    if (visible) {
      if (modoEdicion && initialTroquel) {
        setRefTroquel(initialTroquel.numero || initialTroquel.referencia || '');
        setTipoTroquel(initialTroquel.tipo || 'regular');
        setAnchoMotivo(initialTroquel.anchoMotivo || '');
        setAltoMotivo(initialTroquel.altoMotivo || '');
        setMotivosAncho(initialTroquel.motivosAncho || '');
        setSeparacionAncho(initialTroquel.separacionAncho || '');
        setValorZ(initialTroquel.valorZ || '');
        setDistanciaSesgado(initialTroquel.distanciaSesgado || '');
      } else {
        setRefTroquel(defaultNumero || '');
        setTipoTroquel('regular');
        setAnchoMotivo('');
        setAltoMotivo('');
        setMotivosAncho('');
        setSeparacionAncho('');
        setValorZ('');
        setDistanciaSesgado('');
      }
    }
  }, [visible, defaultNumero, initialTroquel, modoEdicion]);

  const handleClose = () => {
    setRefTroquel('');
    setTipoTroquel('regular');
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
      (numero) => String(numero || '').trim().toLowerCase() === referenciaNormalizada.toLowerCase()
    );

    if (existeDuplicado) {
      alert('Ya existe un troquel con ese número');
      return;
    }

    let troquel = {
      id: modoEdicion && initialTroquel?.id ? initialTroquel.id : Date.now(),
      numero: referenciaNormalizada,
      tipo: tipoTroquel,
      referencia: referenciaNormalizada,
    };

    if (!anchoMotivo || !altoMotivo || !motivosAncho || !separacionAncho || !valorZ || !distanciaSesgado) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    const formaPorTipo = {
      regular: 'Rectangular',
      irregular: 'Irregular',
      corbata: 'Corbata',
    };

    troquel = {
      ...troquel,
      anchoMotivo,
      altoMotivo,
      motivosAncho,
      separacionAncho,
      valorZ,
      distanciaSesgado,
      estado: initialTroquel?.estado || 'Disponible',
      forma: formaPorTipo[tipoTroquel] || 'Rectangular',
    };

    onSave(troquel);
    handleClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={{ flex: 1, backgroundColor: '#F1F3F5' }}>
        <View style={styles.modalHeader}>
          <Text style={styles.headerTitle}>{modoEdicion ? 'Detalle / Editar Troquel' : 'Nuevo Troquel'}</Text>
          <TouchableOpacity onPress={handleClose} style={styles.modalCloseBtn}>
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.container}>
          {/* DATOS GENERALES */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Datos Generales</Text>
            <Text style={styles.label}>Referencia Troquel *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: TR-001"
              placeholderTextColor="#94A3B8"
              value={refTroquel}
              onChangeText={setRefTroquel}
            />
            
            <Text style={styles.label}>Tipo de Troquel *</Text>
            <View style={styles.typeSelector}>
              {['regular', 'irregular', 'corbata'].map((tipo) => (
                <TouchableOpacity
                  key={tipo}
                  style={[styles.typeBtn, tipoTroquel === tipo && styles.typeBtnActive]}
                  onPress={() => setTipoTroquel(tipo)}
                >
                  <Text style={[styles.typeBtnText, tipoTroquel === tipo && styles.typeBtnTextActive]}>
                    {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Especificaciones {tipoTroquel.charAt(0).toUpperCase() + tipoTroquel.slice(1)}</Text>
            <Text style={styles.label}>Ancho Motivo (mm) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 100"
              placeholderTextColor="#94A3B8"
              value={anchoMotivo}
              onChangeText={setAnchoMotivo}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Alto Motivo (mm) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 150"
              placeholderTextColor="#94A3B8"
              value={altoMotivo}
              onChangeText={setAltoMotivo}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Motivos en Ancho *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 4"
              placeholderTextColor="#94A3B8"
              value={motivosAncho}
              onChangeText={setMotivosAncho}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Separación Ancho (mm) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 2"
              placeholderTextColor="#94A3B8"
              value={separacionAncho}
              onChangeText={setSeparacionAncho}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Valor Z *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 110"
              placeholderTextColor="#94A3B8"
              value={valorZ}
              onChangeText={setValorZ}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Distancia de Sesgado (mm) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 3"
              placeholderTextColor="#94A3B8"
              value={distanciaSesgado}
              onChangeText={setDistanciaSesgado}
              keyboardType="numeric"
            />
          </View>
        </ScrollView>

        <View style={styles.submitContainer}>
          <TouchableOpacity style={[styles.btn, styles.btnPrimary, !puedeCrear && { opacity: 0.45 }]} onPress={() => puedeCrear && handleSave()} disabled={!puedeCrear}>
            <Text style={styles.btnText}>{modoEdicion ? 'Guardar cambios' : 'Guardar'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={handleClose}>
            <Text style={styles.btnText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
        {!puedeCrear && (
          <View style={{ paddingHorizontal: 16, marginTop: 6 }}>
            <Text style={{ color: '#777', fontSize: 12 }}>Tu rol no permite crear/editar troqueles.</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

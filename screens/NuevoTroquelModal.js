import React, { useEffect, useState, Fragment } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

const TROQUEL_BASE_DEF = [
  { campo_id: '__base_tq_numero',        col: 0, fila: 0, ancho: 4 },
  { campo_id: '__base_tq_tipo',          col: 4, fila: 0, ancho: 4 },
  { campo_id: '__base_tq_forma',         col: 8, fila: 0, ancho: 4 },
  { campo_id: '__base_tq_estado',        col: 0, fila: 1, ancho: 4 },
  { campo_id: '__base_tq_sentido',       col: 4, fila: 1, ancho: 8 },
  { campo_id: '__base_tq_ancho_motivo',  col: 0, fila: 2, ancho: 4 },
  { campo_id: '__base_tq_alto_motivo',   col: 4, fila: 2, ancho: 4 },
  { campo_id: '__base_tq_motivos_ancho', col: 8, fila: 2, ancho: 4 },
  { campo_id: '__base_tq_separacion',    col: 0, fila: 3, ancho: 4 },
  { campo_id: '__base_tq_valor_z',       col: 4, fila: 3, ancho: 4 },
  { campo_id: '__base_tq_dist_sesgado',  col: 8, fila: 3, ancho: 4 },
];

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
  const { t } = useTranslation();
  const [baseLayoutData, setBaseLayoutData] = useState({});
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
  const [sentidoImpresion, setSentidoImpresion] = useState('vertical');

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
        setSentidoImpresion(initialTroquel.sentido_impresion || 'vertical');
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
        setSentidoImpresion('vertical');
      }
    }
  }, [visible, defaultNumero, initialTroquel, modoEdicion]);

  useEffect(() => {
    if (!visible) return;
    const token = global.__MIAPP_ACCESS_TOKEN;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    fetch('http://localhost:8080/api/campos-base-layout?form=troquel', { headers })
      .then(r => r.json())
      .then(d => setBaseLayoutData(d.layout || {}))
      .catch(() => {});
  }, [visible]);

  const layoutRows = (renderMap) => {
    const withLayout = TROQUEL_BASE_DEF.map(c => {
      const ov = baseLayoutData[c.campo_id];
      return { ...c, col: ov?.col ?? c.col, fila: ov?.fila ?? c.fila, ancho: ov?.ancho ?? c.ancho };
    });
    withLayout.sort((a, b) => (a.fila * 100 + a.col) - (b.fila * 100 + b.col));
    const groups = {};
    withLayout.forEach(c => { (groups[c.fila] = groups[c.fila] || []).push(c); });
    const rows = Object.entries(groups)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([fila, items]) => {
        const GAP = 12;
        const COLS = 12;
        const visibles = items.filter(item => renderMap[item.campo_id] != null);
        if (visibles.length === 0) return null;
        const cells = [];
        let cursor = 0;
        visibles.forEach(item => {
          const gap = item.col - cursor;
          if (gap > 0) {
            const spacerPct = `${((gap / COLS) * 100).toFixed(4)}%`;
            cells.push(<View key={`sp_${fila}_${item.col}`} style={{ flexBasis: spacerPct, flexShrink: 0, flexGrow: 0 }} />);
          }
          const pct = `${((item.ancho / COLS) * 100).toFixed(4)}%`;
          cells.push(
            <View key={item.campo_id} style={{ flexBasis: pct, flexShrink: 0, flexGrow: 0, paddingRight: GAP }}>
              {renderMap[item.campo_id]}
            </View>
          );
          cursor = item.col + item.ancho;
        });
        return (
          <View key={`fila_${fila}`} style={{ flexDirection: 'row', marginRight: -GAP, marginBottom: 12, alignItems: 'flex-start' }}>
            {cells}
          </View>
        );
      }).filter(Boolean);
    return <Fragment>{rows}</Fragment>;
  };

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
    setSentidoImpresion('vertical');
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
      sentido_impresion: sentidoImpresion,
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
          <View style={styles.titleRow}>
            <Text style={styles.title}>
              {modoEdicion ? 'Editar Troquel' : 'Nuevo Troquel'}
            </Text>
            <TouchableOpacity onPress={resetAndClose}>
              <Text style={styles.closeX}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {layoutRows({
              '__base_tq_numero': (
                <View>
                  <Text style={styles.label}>Número / Referencia *</Text>
                  <TextInput style={styles.input} value={refTroquel} onChangeText={setRefTroquel} placeholder="Ej. TR-001" placeholderTextColor="#94A3B8" autoFocus />
                </View>
              ),
              '__base_tq_tipo': (
                <View>
                  <Text style={styles.label}>Tipo</Text>
                  <View style={styles.pillRow}>
                    {['regular', 'irregular', 'corbata'].map((v) => (
                      <TouchableOpacity key={v} onPress={() => setTipoTroquel(v)} style={pill(tipoTroquel === v)}>
                        <Text style={pillTxt(tipoTroquel === v)}>{v.charAt(0).toUpperCase() + v.slice(1)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ),
              '__base_tq_forma': (
                <View>
                  <Text style={styles.label}>Forma</Text>
                  <View style={styles.pillRow}>
                    {['Rectangular', 'Circular', 'Irregular', 'Ovalado'].map((v) => (
                      <TouchableOpacity key={v} onPress={() => setForma(v)} style={pill(forma === v)}>
                        <Text style={pillTxt(forma === v)}>{v}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ),
              '__base_tq_estado': (
                <View>
                  <Text style={styles.label}>Estado</Text>
                  <View style={styles.pillRow}>
                    {['Disponible', 'En uso'].map((v) => (
                      <TouchableOpacity key={v} onPress={() => setEstado(v)} style={pill(estado === v)}>
                        <Text style={pillTxt(estado === v)}>{v}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ),
              '__base_tq_sentido': (
                <View>
                  <Text style={styles.label}>{t('screens.troqueles.sentidoImpresion')}</Text>
                  <View style={styles.pillRow}>
                    {[{ value: 'vertical', label: t('screens.troqueles.sentidoVertical') }, { value: 'horizontal', label: t('screens.troqueles.sentidoHorizontal') }].map((s) => (
                      <TouchableOpacity key={s.value} onPress={() => setSentidoImpresion(s.value)} style={pill(sentidoImpresion === s.value)}>
                        <Text style={pillTxt(sentidoImpresion === s.value)}>{s.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ),
              '__base_tq_ancho_motivo': (
                <View>
                  <Text style={styles.label}>Ancho motivo (mm)</Text>
                  <TextInput style={styles.input} value={anchoMotivo} onChangeText={setAnchoMotivo} placeholder="Ej. 100" placeholderTextColor="#94A3B8" keyboardType="decimal-pad" />
                </View>
              ),
              '__base_tq_alto_motivo': (
                <View>
                  <Text style={styles.label}>Alto motivo (mm)</Text>
                  <TextInput style={styles.input} value={altoMotivo} onChangeText={setAltoMotivo} placeholder="Ej. 150" placeholderTextColor="#94A3B8" keyboardType="decimal-pad" />
                </View>
              ),
              '__base_tq_motivos_ancho': (
                <View>
                  <Text style={styles.label}>Motivos ancho</Text>
                  <TextInput style={styles.input} value={motivosAncho} onChangeText={setMotivosAncho} placeholder="Ej. 4" placeholderTextColor="#94A3B8" keyboardType="decimal-pad" />
                </View>
              ),
              '__base_tq_separacion': (
                <View>
                  <Text style={styles.label}>Separación (mm)</Text>
                  <TextInput style={styles.input} value={separacionAncho} onChangeText={setSeparacionAncho} placeholder="Ej. 3" placeholderTextColor="#94A3B8" keyboardType="decimal-pad" />
                </View>
              ),
              '__base_tq_valor_z': (
                <View>
                  <Text style={styles.label}>Valor Z (mm)</Text>
                  <TextInput style={styles.input} value={valorZ} onChangeText={setValorZ} placeholder="Ej. 110" placeholderTextColor="#94A3B8" keyboardType="decimal-pad" />
                </View>
              ),
              '__base_tq_dist_sesgado': (
                <View>
                  <Text style={styles.label}>Dist. sesgado (mm)</Text>
                  <TextInput style={styles.input} value={distanciaSesgado} onChangeText={setDistanciaSesgado} placeholder="Ej. 0" placeholderTextColor="#94A3B8" keyboardType="decimal-pad" />
                </View>
              ),
            })}
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
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 560,
    maxHeight: '90%',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1D2939',
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeX: {
    fontSize: 20,
    fontWeight: '900',
    color: '#475569',
    padding: 4,
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
    backgroundColor: '#F1F5F9',
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
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  btnCancelText: {
    color: '#64748B',
    fontWeight: '600',
  },
  btnSave: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  btnSaveText: {
    color: '#4F46E5',
    fontWeight: '700',
  },
});

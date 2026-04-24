import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  TextInput, Modal, Alert, Platform, ActivityIndicator,
} from 'react-native';
import DeleteConfirmRow from '../components/DeleteConfirmRow';
import EmptyState from '../components/EmptyState';
import { useTranslation } from 'react-i18next';

const API_BASE = 'http://localhost:8080';

const TIPOS = [
  { key: 'cliches',   labelKey: 'screens.proveedores.tabCliches' },
  { key: 'troqueles', labelKey: 'screens.proveedores.tabTroqueles' },
];

const EMPTY_FORM = { nombre: '', contacto: '', email: '', telefono: '', notas: '' };

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F5FD' },
  header: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 20, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: '#C7D2FE',
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, minHeight: 54,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E1B4B', letterSpacing: -0.3 },
  searchInput: {
    flex: 1, minWidth: 140, backgroundColor: '#F8FAFC',
    borderRadius: 8, borderWidth: 1, borderColor: '#E4E7ED',
    paddingHorizontal: 12, paddingVertical: 7, fontSize: 13, color: '#0F172A',
  },
  tabBar: {
    flexDirection: 'row', backgroundColor: '#EEF2FF',
    borderBottomWidth: 1, borderBottomColor: '#C7D2FE', paddingHorizontal: 12, gap: 4,
  },
  tab: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#4F46E5' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#4F46E5' },
  btnPlus: {
    backgroundColor: '#4F46E5', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8,
  },
  btnPlusText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  tableContainer: { flex: 1, paddingHorizontal: 10, paddingVertical: 10 },
  tableHeader: {
    flexDirection: 'row', backgroundColor: '#ECEFFE',
    borderWidth: 1, borderColor: '#D9DBFF',
    paddingVertical: 10, paddingHorizontal: 12, marginBottom: 6,
    borderRadius: 10, minHeight: 40, alignItems: 'center',
  },
  tableRow: {
    flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12,
    backgroundColor: '#FFF', borderRadius: 10, marginBottom: 4,
    shadowColor: '#1E1B4B', shadowOpacity: 0.03, shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  rowAlt: { backgroundColor: '#FAFBFF' },
  cell: { justifyContent: 'center' },
  headerText: { fontSize: 11, fontWeight: '700', color: '#4F46E5', letterSpacing: 0.5 },
  cellText: { fontSize: 13, fontWeight: '500', color: '#0F172A' },
  cellSub: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
  colNombre: { flex: 0.22 },
  colContacto: { flex: 0.18 },
  colEmail: { flex: 0.22 },
  colTelefono: { flex: 0.14 },
  colPlanchas: { flex: 0.1 },
  colAcciones: { flex: 0.14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  actionBtn: {
    backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0',
    paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6,
  },
  deleteBtn: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  actionBtnText: { fontSize: 11, fontWeight: '600', color: '#475569' },
  // Modal
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center', alignItems: 'center', padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFF', borderRadius: 18, borderWidth: 1,
    borderColor: '#E2E8F0', padding: 20, width: '100%', maxWidth: 520,
    maxHeight: '90%',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 14 },
  fieldLabel: { fontSize: 12, color: '#475569', fontWeight: '700', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.4 },
  fieldInput: {
    backgroundColor: '#F1F5F9', borderRadius: 10, borderWidth: 1,
    borderColor: '#CBD5E1', paddingHorizontal: 10, paddingVertical: 9,
    fontSize: 14, color: '#0F172A', marginBottom: 10,
  },
  fieldInputError: { borderColor: '#D21820' },
  errorText: { color: '#D21820', fontSize: 12, marginTop: -6, marginBottom: 8 },
  textArea: { height: 60, textAlignVertical: 'top' },
  // Planchas
  planchasSec: {
    borderTopWidth: 1, borderTopColor: '#E2E8F0',
    marginTop: 6, paddingTop: 12, marginBottom: 6,
  },
  planchaRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F1F5F9', borderRadius: 8, padding: 8,
    marginBottom: 4, gap: 8,
  },
  planchaRowText: { flex: 1, fontSize: 13, color: '#0F172A', fontWeight: '500' },
  planchaRowSub: { fontSize: 11, color: '#64748B' },
  planchaDelBtn: { padding: 4 },
  planchaDelBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 14 },
  planchaAddRow: { flexDirection: 'row', gap: 6, marginTop: 6, alignItems: 'center' },
  planchaAddInput: {
    flex: 1, backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1,
    borderColor: '#CBD5E1', paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, color: '#0F172A',
  },
  planchaAddBtn: {
    backgroundColor: '#4F46E5', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 9, alignItems: 'center',
  },
  planchaAddBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  planchaEmptyText: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic', marginBottom: 6 },
  // Footer
  modalActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 10 },
  btn: { borderWidth: 1.5, borderColor: '#E2E8F0', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  btnCancel: { backgroundColor: '#EEF2F8' },
  btnSave: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  btnText: { color: '#64748B', fontWeight: '600', fontSize: 13 },
  btnSaveText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
});

function getAuthHeaders() {
  const tok = global.__MIAPP_ACCESS_TOKEN;
  return tok ? { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }
             : { 'Content-Type': 'application/json' };
}

export default function ProveedoresScreen() {
  const { t } = useTranslation();
  const [tipoActivo, setTipoActivo] = useState(TIPOS[0].key);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [planchas, setPlanchas] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [nuevaMarca, setNuevaMarca] = useState('');
  const [nuevaRef, setNuevaRef] = useState('');

  const cargar = useCallback(async (tipo) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/proveedores?tipo=${tipo}`, { headers: getAuthHeaders() });
      const data = await res.json();
      setProveedores(data.proveedores || []);
    } catch {
      setProveedores([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar(tipoActivo);
    setBusqueda('');
  }, [tipoActivo, cargar]);

  const filtrados = proveedores.filter((p) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return [p.nombre, p.contacto, p.email, p.telefono]
      .map((v) => (v || '').toLowerCase())
      .some((v) => v.includes(q));
  });

  const abrirNuevo = () => {
    setEditandoId(null);
    setForm(EMPTY_FORM);
    setPlanchas([]);
    setNuevaMarca(''); setNuevaRef('');
    setSubmitted(false);
    setModalVisible(true);
  };

  const abrirEditar = (prov) => {
    setEditandoId(prov._id);
    setForm({
      nombre: prov.nombre || '',
      contacto: prov.contacto || '',
      email: prov.email || '',
      telefono: prov.telefono || '',
      notas: prov.notas || '',
    });
    setPlanchas(Array.isArray(prov.planchas) ? prov.planchas : []);
    setNuevaMarca(''); setNuevaRef('');
    setSubmitted(false);
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setEditandoId(null);
    setForm(EMPTY_FORM);
    setPlanchas([]);
    setNuevaMarca(''); setNuevaRef('');
    setSubmitted(false);
  };

  const addPlancha = () => {
    const marca = nuevaMarca.trim();
    const ref = nuevaRef.trim();
    if (!marca) return;
    setPlanchas((prev) => [...prev, { marca, referencia: ref }]);
    setNuevaMarca(''); setNuevaRef('');
  };

  const removePlancha = (idx) => {
    setPlanchas((prev) => prev.filter((_, i) => i !== idx));
  };

  const guardar = async () => {
    setSubmitted(true);
    if (!form.nombre.trim()) return;
    setGuardando(true);
    try {
      const planchasFinal = nuevaMarca.trim()
        ? [...planchas, { marca: nuevaMarca.trim(), referencia: nuevaRef.trim() }]
        : planchas;
      const url = editandoId ? `${API_BASE}/api/proveedores/${editandoId}` : `${API_BASE}/api/proveedores`;
      const method = editandoId ? 'PUT' : 'POST';
      const body = editandoId
        ? { ...form, planchas: planchasFinal }
        : { ...form, planchas: planchasFinal, tipo: tipoActivo };
      const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { Alert.alert(t('common.error'), data.error || t('common.error')); return; }
      cerrarModal();
      cargar(tipoActivo);
    } catch (e) {
      Alert.alert(t('common.error'), e.message);
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/proveedores/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (!res.ok) { const d = await res.json(); Alert.alert(t('common.error'), d.error || t('common.error')); return; }
      cargar(tipoActivo);
    } catch (e) {
      Alert.alert(t('common.error'), e.message);
    }
  };

  const nombreError = submitted && !form.nombre.trim();

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>{t('nav.proveedores')}</Text>
        <TextInput
          style={s.searchInput}
          placeholder={t('common.search')}
          value={busqueda}
          onChangeText={setBusqueda}
          placeholderTextColor="#94A3B8"
        />
        <TouchableOpacity style={s.btnPlus} onPress={abrirNuevo}>
          <Text style={s.btnPlusText}>{t('screens.proveedores.newBtn')}</Text>
        </TouchableOpacity>
      </View>

      <View style={s.tabBar}>
        {TIPOS.map((tipo) => (
          <TouchableOpacity
            key={tipo.key}
            style={[s.tab, tipoActivo === tipo.key && s.tabActive]}
            onPress={() => setTipoActivo(tipo.key)}
          >
            <Text style={[s.tabText, tipoActivo === tipo.key && s.tabTextActive]}>
              {t(tipo.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : filtrados.length === 0 ? (
        <View style={s.tableContainer}>
          <EmptyState
            title={busqueda ? t('common.noResults') : t('screens.proveedores.emptyTitle')}
            message={busqueda ? t('screens.proveedores.noResultsMsg') : t('screens.proveedores.emptyMsg')}
            action={!busqueda ? t('screens.proveedores.newBtn') : undefined}
            onAction={!busqueda ? abrirNuevo : undefined}
          />
        </View>
      ) : (
        <ScrollView style={s.tableContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
            <View style={Platform.select({ web: { width: '100%' }, default: { minWidth: 640 } })}>
              <View style={s.tableHeader}>
                <View style={[s.cell, s.colNombre]}>
                  <Text style={s.headerText}>{t('screens.proveedores.colNombre')}</Text>
                </View>
                <View style={[s.cell, s.colContacto]}>
                  <Text style={s.headerText}>{t('screens.proveedores.colContacto')}</Text>
                </View>
                <View style={[s.cell, s.colEmail]}>
                  <Text style={s.headerText}>{t('screens.proveedores.colEmail')}</Text>
                </View>
                <View style={[s.cell, s.colTelefono]}>
                  <Text style={s.headerText}>{t('screens.proveedores.colTelefono')}</Text>
                </View>
                <View style={[s.cell, s.colPlanchas]}>
                  <Text style={s.headerText}>{t('screens.proveedores.colPlanchas')}</Text>
                </View>
                <View style={[s.cell, s.colAcciones]}>
                  <Text style={s.headerText}>{t('common.actions')}</Text>
                </View>
              </View>
              {filtrados.map((prov, idx) => (
                <TouchableOpacity
                  key={prov._id}
                  style={[s.tableRow, idx % 2 === 1 && s.rowAlt]}
                  onPress={() => abrirEditar(prov)}
                  activeOpacity={0.75}
                >
                  <View style={[s.cell, s.colNombre]}>
                    <Text style={s.cellText} numberOfLines={1}>{prov.nombre || '-'}</Text>
                  </View>
                  <View style={[s.cell, s.colContacto]}>
                    <Text style={s.cellText} numberOfLines={1}>{prov.contacto || '-'}</Text>
                  </View>
                  <View style={[s.cell, s.colEmail]}>
                    <Text style={s.cellText} numberOfLines={1}>{prov.email || '-'}</Text>
                  </View>
                  <View style={[s.cell, s.colTelefono]}>
                    <Text style={s.cellText} numberOfLines={1}>{prov.telefono || '-'}</Text>
                  </View>
                  <View style={[s.cell, s.colPlanchas]}>
                    <Text style={s.cellText}>{(prov.planchas || []).length}</Text>
                  </View>
                  <View style={[s.cell, s.colAcciones]}>
                    {confirmDelete === prov._id ? (
                      <DeleteConfirmRow
                        onCancel={() => setConfirmDelete(null)}
                        onConfirm={() => { setConfirmDelete(null); eliminar(prov._id); }}
                      />
                    ) : (
                      <TouchableOpacity
                        style={[s.actionBtn, s.deleteBtn]}
                        onPress={(e) => { e.stopPropagation?.(); setConfirmDelete(prov._id); }}
                      >
                        <Text style={[s.actionBtnText, { color: '#DC2626' }]}>{t('common.delete')}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </ScrollView>
      )}

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={cerrarModal}>
        <View style={s.modalBackdrop}>
          <View style={s.modalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.modalTitle}>
                {editandoId ? t('screens.proveedores.editTitle') : t('screens.proveedores.newTitle')}
              </Text>

              <Text style={s.fieldLabel}>{t('screens.proveedores.fieldNombre')}</Text>
              <TextInput
                style={[s.fieldInput, nombreError && s.fieldInputError]}
                value={form.nombre}
                onChangeText={(v) => setForm((f) => ({ ...f, nombre: v }))}
                placeholder={t('screens.proveedores.placeholderNombre')}
                placeholderTextColor="#94A3B8"
              />
              {nombreError && <Text style={s.errorText}>{t('screens.proveedores.nombreRequired')}</Text>}

              <Text style={s.fieldLabel}>{t('screens.proveedores.fieldContacto')}</Text>
              <TextInput
                style={s.fieldInput}
                value={form.contacto}
                onChangeText={(v) => setForm((f) => ({ ...f, contacto: v }))}
                placeholder={t('screens.proveedores.placeholderContacto')}
                placeholderTextColor="#94A3B8"
              />

              <Text style={s.fieldLabel}>{t('screens.proveedores.fieldEmail')}</Text>
              <TextInput
                style={s.fieldInput}
                value={form.email}
                onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
                placeholder={t('screens.proveedores.placeholderEmail')}
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text style={s.fieldLabel}>{t('screens.proveedores.fieldTelefono')}</Text>
              <TextInput
                style={s.fieldInput}
                value={form.telefono}
                onChangeText={(v) => setForm((f) => ({ ...f, telefono: v }))}
                placeholder={t('screens.proveedores.placeholderTelefono')}
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
              />

              <Text style={s.fieldLabel}>{t('screens.proveedores.fieldNotas')}</Text>
              <TextInput
                style={[s.fieldInput, s.textArea]}
                value={form.notas}
                onChangeText={(v) => setForm((f) => ({ ...f, notas: v }))}
                placeholder={t('screens.proveedores.placeholderNotas')}
                placeholderTextColor="#94A3B8"
                multiline
              />

              {/* ── Planchas ── */}
              <View style={s.planchasSec}>
                <Text style={s.fieldLabel}>{t('screens.proveedores.fieldPlanchas')}</Text>

                {planchas.length === 0 && (
                  <Text style={s.planchaEmptyText}>{t('screens.proveedores.planchasVacio')}</Text>
                )}
                {planchas.map((p, i) => (
                  <View key={i} style={s.planchaRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.planchaRowText}>{p.marca}</Text>
                      {p.referencia ? <Text style={s.planchaRowSub}>{p.referencia}</Text> : null}
                    </View>
                    <TouchableOpacity style={s.planchaDelBtn} onPress={() => removePlancha(i)}>
                      <Text style={s.planchaDelBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                <View style={s.planchaAddRow}>
                  <TextInput
                    style={s.planchaAddInput}
                    value={nuevaMarca}
                    onChangeText={setNuevaMarca}
                    placeholder={t('screens.proveedores.planchaMarca')}
                    placeholderTextColor="#94A3B8"
                  />
                  <TextInput
                    style={s.planchaAddInput}
                    value={nuevaRef}
                    onChangeText={setNuevaRef}
                    placeholder={t('screens.proveedores.planchaReferencia')}
                    placeholderTextColor="#94A3B8"
                  />
                  <TouchableOpacity style={s.planchaAddBtn} onPress={addPlancha}>
                    <Text style={s.planchaAddBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={s.modalActions}>
                <TouchableOpacity style={[s.btn, s.btnCancel]} onPress={cerrarModal}>
                  <Text style={s.btnText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.btn, s.btnSave]} onPress={guardar} disabled={guardando}>
                  <Text style={s.btnSaveText}>
                    {guardando ? t('common.saving') : editandoId ? t('common.saveChanges') : t('common.save')}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

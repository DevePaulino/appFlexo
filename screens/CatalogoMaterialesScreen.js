import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import EmptyState from '../components/EmptyState';
import DeleteConfirmRow from '../components/DeleteConfirmRow';
import { usePermission } from './usePermission';

const API_BASE = 'http://localhost:8080';

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
    gap: 12,
    minHeight: 54,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1B4B',
    letterSpacing: -0.3,
  },
  searchInput: {
    flex: 1,
    maxWidth: 320,
    backgroundColor: '#F8FAFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 11,
    paddingVertical: 5,
    fontSize: 12,
    color: '#0F172A',
  },
  btnPlus: {
    borderWidth: 1.5,
    borderColor: '#4F46E5',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnPlusText: {
    color: '#4F46E5',
    fontWeight: '600',
    fontSize: 13,
  },
  tableContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  tableContent: {
    width: '100%',
    minWidth: 600,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#ECEFFE',
    borderWidth: 1.5,
    borderColor: '#D9DBFF',
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 6,
    borderRadius: 10,
    minHeight: 44,
    alignItems: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 3,
    alignItems: 'center',
  },
  rowAlternate: {
    backgroundColor: '#F8FAFC',
  },
  expandedRow: {
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 3,
    borderRadius: 10,
  },
  headerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
    letterSpacing: 0.5,
  },
  cellText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0F172A',
  },
  colMaterial: {
    flex: 2,
    minWidth: 140,
  },
  colFabricantes: {
    flex: 3,
    minWidth: 200,
  },
  colAcciones: {
    width: 100,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
  },
  actionBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  deleteBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  expandedEmpty: { color: '#94A3B8', fontSize: 12, fontStyle: 'italic' },
  fabRow: { marginBottom: 8 },
  fabNombre: { fontSize: 13, fontWeight: '600', color: '#0F172A', marginBottom: 4 },
  anchosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  anchosEmpty: { color: '#BBB', fontSize: 12, fontStyle: 'italic' },
  anchoChip: {
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  anchoChipText: { fontSize: 12, color: '#1565C0' },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 16,
  },
  modalBox: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    marginBottom: 8,
  },
  fieldSelect: {
    width: '100%',
    height: 36,
    border: '1px solid #CBD5E1',
    borderRadius: 8,
    paddingLeft: 8,
    paddingRight: 8,
    fontSize: 14,
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
    cursor: 'pointer',
    outlineWidth: 0,
    marginBottom: 8,
  },
  fabEditRow: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  fabEditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fabEditName: { fontSize: 13, fontWeight: '700', color: '#4F46E5' },
  removeText: { fontSize: 12, color: '#DC2626', fontWeight: '600' },
  anchosEditRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  anchoChipEdit: {
    backgroundColor: '#DBEAFE',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  anchoChipEditText: { fontSize: 12, color: '#1D4ED8' },
  addAnchoRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  anchoInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#FFF',
    width: 90,
  },
  addFabRow: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 6 },
  btnSecondarySmall: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F8FAFC',
  },
  btnSecondarySmallText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    marginTop: 14,
  },
  btnCancel: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: '#F8FAFC',
  },
  btnCancelText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  btnSave: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  btnSaveText: { fontSize: 14, fontWeight: '700', color: '#4F46E5' },

  // Proveedor card
  provCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 8,
  },
  provCardNombre: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  provCardMeta: { fontSize: 12, color: '#64748B', marginBottom: 4 },
  provCardRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  provCardChip: { fontSize: 12, color: '#475569' },
  provCardNotas: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic', marginTop: 4 },
  provCardActions: { flexDirection: 'row', gap: 6, justifyContent: 'flex-end', marginTop: 8 },
  actionBtnSmall: {
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDanger: { backgroundColor: '#FFEBEE' },
  actionBtnSmallText: { fontSize: 14, color: '#0F172A' },
  // Tab bar
  tabBar: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingHorizontal: 10 },
  tabBtn: { paddingHorizontal: 16, paddingVertical: 10, marginRight: 4, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: '#4F46E5' },
  tabBtnText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  tabBtnTextActive: { color: '#4F46E5' },
});

export default function CatalogoMaterialesScreen({ currentUser }) {
  const { t } = useTranslation();
  const puedeCrear = usePermission('manage_app_settings');

  // ── Auth headers ─────────────────────────────────────────────────────────
  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'X-Empresa-Id': String(currentUser?.empresa_id || '1'),
    'X-User-Id': String(currentUser?.id || 'admin'),
    'X-Role': String(currentUser?.rol || currentUser?.role || 'administrador'),
  }), [currentUser]);

  // ── Catálogo state ───────────────────────────────────────────────────────
  const [catalogo, setCatalogo] = useState([]);
  const [loadingCatalogo, setLoadingCatalogo] = useState(false);
  const [expandedMat, setExpandedMat] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const migratedRef = useRef(false);

  // ── Catalog modal state ──────────────────────────────────────────────────
  const [catModal, setCatModal] = useState({ visible: false, editing: null });
  const [catNombre, setCatNombre] = useState('');
  const [catFabricantes, setCatFabricantes] = useState([]);
  const [catFabInput, setCatFabInput] = useState('');
  const [catAnchoInputs, setCatAnchoInputs] = useState({});

  // ── Proveedores state ────────────────────────────────────────────────────
  const [proveedores, setProveedores] = useState([]);
  const [loadingProveedores, setLoadingProveedores] = useState(false);
  const [provModal, setProvModal] = useState({ visible: false, editing: null });
  const [provForm, setProvForm] = useState({ nombre: '', contacto: '', telefono: '', email: '', notas: '' });

  // ── Búsqueda proveedores ─────────────────────────────────────────────────
  const [busquedaProv, setBusquedaProv] = useState('');

  // ── Tabs ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('catalogo'); // 'catalogo' | 'proveedores'

  // ── Delete confirmation ──────────────────────────────────────────────────
  const [confirmingDelete, setConfirmingDelete] = useState(null);

  // ── Data loaders ─────────────────────────────────────────────────────────

  const loadProveedores = useCallback(async () => {
    setLoadingProveedores(true);
    try {
      const resp = await fetch(`${API_BASE}/api/materiales/proveedores`, { headers: authHeaders() });
      const data = await resp.json();
      if (resp.ok) setProveedores(data.proveedores || []);
    } catch (e) {
      console.error('Error loading proveedores:', e);
    } finally {
      setLoadingProveedores(false);
    }
  }, [authHeaders]);

  const loadCatalogo = useCallback(async () => {
    setLoadingCatalogo(true);
    try {
      const resp = await fetch(`${API_BASE}/api/materiales/catalogo`, { headers: authHeaders() });
      const data = await resp.json();
      if (resp.ok) {
        const items = data.catalogo || [];
        setCatalogo(items);
        if (items.length === 0 && !migratedRef.current) {
          migratedRef.current = true;
          try {
            const migKey = `pfp_mat_migrated_${currentUser?.empresa_id || '1'}`;
            const already = typeof localStorage !== 'undefined' ? localStorage.getItem(migKey) : null;
            if (!already) {
              await fetch(`${API_BASE}/api/materiales/migracion`, { method: 'POST', headers: authHeaders() });
              if (typeof localStorage !== 'undefined') localStorage.setItem(migKey, '1');
              const r2 = await fetch(`${API_BASE}/api/materiales/catalogo`, { headers: authHeaders() });
              const d2 = await r2.json();
              if (r2.ok) setCatalogo(d2.catalogo || []);
            }
          } catch (e) { /* migration failed silently */ }
        }
      }
    } catch (e) {
      console.error('Error loading catalogo materiales:', e);
    } finally {
      setLoadingCatalogo(false);
    }
  }, [authHeaders, currentUser]);

  useFocusEffect(
    React.useCallback(() => {
      loadCatalogo();
      loadProveedores();
    }, [loadCatalogo, loadProveedores])
  );

  // ── Filtered catalog ─────────────────────────────────────────────────────
  const catalogoFiltrado = busqueda.trim()
    ? catalogo.filter(m => {
        const q = busqueda.trim().toLowerCase();
        const fabNames = (m.fabricantes || []).map(f => f.nombre).join(' ');
        return m.nombre.toLowerCase().includes(q) || fabNames.toLowerCase().includes(q);
      })
    : catalogo;

  // ── Filtered proveedores ─────────────────────────────────────────────────
  const proveedoresFiltrados = busquedaProv.trim()
    ? proveedores.filter(p => {
        const q = busquedaProv.trim().toLowerCase();
        return (p.nombre || '').toLowerCase().includes(q)
          || (p.contacto || '').toLowerCase().includes(q)
          || (p.email || '').toLowerCase().includes(q);
      })
    : proveedores;

  // ── Catálogo CRUD ─────────────────────────────────────────────────────────

  const openCatCreate = () => {
    setCatNombre('');
    setCatFabricantes([]);
    setCatFabInput('');
    setCatAnchoInputs({});
    setCatModal({ visible: true, editing: null });
  };

  const openCatEdit = (mat) => {
    setCatNombre(mat.nombre || '');
    setCatFabricantes(JSON.parse(JSON.stringify(mat.fabricantes || [])));
    setCatFabInput('');
    setCatAnchoInputs({});
    setCatModal({ visible: true, editing: mat });
  };

  const addFabricante = () => {
    const nombre = catFabInput.trim();
    if (!nombre) return;
    const newFab = { id: `fab-${Date.now()}`, nombre, anchos_cm: [] };
    setCatFabricantes(prev => [...prev, newFab]);
    setCatFabInput('');
  };

  const removeFabricante = (fabId) => {
    setCatFabricantes(prev => prev.filter(f => f.id !== fabId));
  };

  const addAncho = (fabId) => {
    const text = (catAnchoInputs[fabId] || '').trim();
    const val = parseFloat(text);
    if (!text || isNaN(val) || val <= 0) return;
    setCatFabricantes(prev => prev.map(f =>
      f.id === fabId ? { ...f, anchos_cm: [...(f.anchos_cm || []), val].sort((a, b) => a - b) } : f
    ));
    setCatAnchoInputs(prev => ({ ...prev, [fabId]: '' }));
  };

  const removeAncho = (fabId, ancho) => {
    setCatFabricantes(prev => prev.map(f =>
      f.id === fabId ? { ...f, anchos_cm: (f.anchos_cm || []).filter(a => a !== ancho) } : f
    ));
  };

  const saveCatalogo = async () => {
    const nombre = catNombre.trim();
    if (!nombre) return alert(t('screens.materiales.errNombreRequired'));
    const body = { nombre, fabricantes: catFabricantes };
    try {
      let resp;
      if (catModal.editing) {
        resp = await fetch(`${API_BASE}/api/materiales/catalogo/${catModal.editing._id || catModal.editing.id}`, {
          method: 'PUT', headers: authHeaders(), body: JSON.stringify(body),
        });
      } else {
        resp = await fetch(`${API_BASE}/api/materiales/catalogo`, {
          method: 'POST', headers: authHeaders(), body: JSON.stringify(body),
        });
      }
      const data = await resp.json();
      if (!resp.ok) return alert(data.error || t('screens.materiales.errGuardando'));
      setCatModal({ visible: false, editing: null });
      loadCatalogo();
    } catch (e) {
      alert(t('screens.materiales.errConexion'));
    }
  };

  const deleteCatalogo = async (mat) => {
    try {
      const resp = await fetch(`${API_BASE}/api/materiales/catalogo/${mat._id || mat.id}`, {
        method: 'DELETE', headers: authHeaders(),
      });
      if (resp.ok) loadCatalogo();
      else {
        const d = await resp.json();
        alert(d.error || t('screens.materiales.errEliminar'));
      }
    } catch (e) {
      alert(t('screens.materiales.errConexion'));
    }
  };

  // ── Proveedores CRUD ──────────────────────────────────────────────────────

  const openProvCreate = () => {
    setProvForm({ nombre: '', contacto: '', telefono: '', email: '', notas: '' });
    setProvModal({ visible: true, editing: null });
  };

  const openProvEdit = (prov) => {
    setProvForm({
      nombre: prov.nombre || '',
      contacto: prov.contacto || '',
      telefono: prov.telefono || '',
      email: prov.email || '',
      notas: prov.notas || '',
    });
    setProvModal({ visible: true, editing: prov });
  };

  const saveProveedor = async () => {
    const nombre = provForm.nombre.trim();
    if (!nombre) return alert(t('screens.materiales.errProveedorRequired'));
    try {
      let resp;
      if (provModal.editing) {
        resp = await fetch(`${API_BASE}/api/materiales/proveedores/${provModal.editing._id || provModal.editing.id}`, {
          method: 'PUT', headers: authHeaders(), body: JSON.stringify(provForm),
        });
      } else {
        resp = await fetch(`${API_BASE}/api/materiales/proveedores`, {
          method: 'POST', headers: authHeaders(), body: JSON.stringify(provForm),
        });
      }
      const data = await resp.json();
      if (!resp.ok) return alert(data.error || t('screens.materiales.errGuardandoProveedor'));
      setProvModal({ visible: false, editing: null });
      loadProveedores();
    } catch (e) {
      alert(t('screens.materiales.errConexion'));
    }
  };

  const deleteProveedor = async (prov) => {
    try {
      const resp = await fetch(`${API_BASE}/api/materiales/proveedores/${prov._id || prov.id}`, {
        method: 'DELETE', headers: authHeaders(),
      });
      if (resp.ok) loadProveedores();
      else {
        const d = await resp.json();
        alert(d.error || t('screens.materiales.errEliminar'));
      }
    } catch (e) {
      alert(t('screens.materiales.errConexion'));
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {activeTab === 'proveedores' ? t('screens.materiales.proveedoresMaterialTitle') : t('nav.materiales')}
        </Text>
        <TextInput
          style={styles.searchInput}
          placeholder={t('common.searchAny')}
          value={activeTab === 'catalogo' ? busqueda : busquedaProv}
          onChangeText={activeTab === 'catalogo' ? setBusqueda : setBusquedaProv}
          placeholderTextColor="#94A3B8"
        />
        <TouchableOpacity
          style={[styles.btnPlus, !puedeCrear && { opacity: 0.45 }]}
          onPress={() => puedeCrear && (activeTab === 'catalogo' ? openCatCreate() : openProvCreate())}
          disabled={!puedeCrear}
        >
          <Text style={styles.btnPlusText}>
            {activeTab === 'catalogo' ? t('screens.materiales.addMaterialBtn') : t('screens.materiales.addProveedorBtn')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {['catalogo', 'proveedores'].map(tab => (
          <TouchableOpacity key={tab} style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
              {tab === 'catalogo' ? t('screens.materiales.tabCatalogo') : t('screens.materiales.tabProveedores')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Proveedores table */}
      {activeTab === 'proveedores' && (
        proveedoresFiltrados.length === 0 ? (
          <View style={styles.tableContainer}>
            <EmptyState
              title={busquedaProv ? t('common.noResults') : t('screens.materiales.sinProveedores')}
              message={busquedaProv ? t('common.noResultsMsg') : t('screens.materiales.noProveedores')}
              action={!busquedaProv && puedeCrear ? t('screens.materiales.addProveedorBtn') : undefined}
              onAction={!busquedaProv && puedeCrear ? openProvCreate : undefined}
            />
          </View>
        ) : (
          <ScrollView style={styles.tableContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ flexGrow: 1 }}>
              <View style={styles.tableContent}>
                {/* Table header */}
                <View style={styles.tableHeader}>
                  <View style={styles.colMaterial}>
                    <Text style={styles.headerText}>{t('screens.materiales.proveedoresTitle')}</Text>
                  </View>
                  <View style={styles.colFabricantes}>
                    <Text style={styles.headerText}>{t('screens.materiales.contactoLabel').replace(':', '')}</Text>
                  </View>
                  <View style={styles.colAcciones}>
                    <Text style={styles.headerText}>{t('screens.materiales.colAcciones')}</Text>
                  </View>
                </View>

                {/* Table rows */}
                {proveedoresFiltrados.map((prov, idx) => (
                  <View key={prov._id || prov.id || idx} style={[styles.tableRow, idx % 2 === 1 && styles.rowAlternate]}>
                    <View style={styles.colMaterial}>
                      <Text style={[styles.cellText, { fontWeight: '600' }]} numberOfLines={1}>{prov.nombre}</Text>
                      {prov.notas ? <Text style={[styles.cellText, { color: '#94A3B8', fontSize: 11 }]} numberOfLines={1}>{prov.notas}</Text> : null}
                    </View>
                    <View style={styles.colFabricantes}>
                      {prov.contacto ? <Text style={[styles.cellText, { color: '#475569' }]} numberOfLines={1}>{prov.contacto}</Text> : null}
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {prov.telefono ? <Text style={[styles.cellText, { color: '#64748B', fontSize: 12 }]} numberOfLines={1}>{prov.telefono}</Text> : null}
                        {prov.email ? <Text style={[styles.cellText, { color: '#64748B', fontSize: 12 }]} numberOfLines={1}>{prov.email}</Text> : null}
                      </View>
                    </View>
                    <View style={styles.colAcciones}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => puedeCrear && openProvEdit(prov)}
                        disabled={!puedeCrear}
                      >
                        <Text style={styles.actionBtnText}>{t('common.edit')}</Text>
                      </TouchableOpacity>
                      {confirmingDelete === (prov._id || prov.id) ? (
                        <DeleteConfirmRow
                          onCancel={() => setConfirmingDelete(null)}
                          onConfirm={() => { setConfirmingDelete(null); deleteProveedor(prov); }}
                        />
                      ) : (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.deleteBtn]}
                          onPress={() => setConfirmingDelete(prov._id || prov.id)}
                        >
                          <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>{t('common.delete')}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </ScrollView>
        )
      )}

      {/* Table */}
      {activeTab === 'catalogo' && (
        catalogoFiltrado.length === 0 ? (
          <View style={styles.tableContainer}>
            <EmptyState
              title={busqueda ? t('common.noResults') : t('screens.materiales.sinCatalogoMateriales')}
              message={busqueda ? t('common.noResultsMsg') : t('screens.materiales.noCatalogoMateriales')}
              action={!busqueda && puedeCrear ? t('screens.materiales.addMaterialBtn') : undefined}
              onAction={!busqueda && puedeCrear ? openCatCreate : undefined}
            />
          </View>
        ) : (
        <ScrollView style={styles.tableContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ flexGrow: 1 }}>
            <View style={styles.tableContent}>
              {/* Table header */}
              <View style={styles.tableHeader}>
                <View style={styles.colMaterial}>
                  <Text style={styles.headerText}>{t('screens.materiales.colMaterial')}</Text>
                </View>
                <View style={styles.colFabricantes}>
                  <Text style={styles.headerText}>{t('screens.materiales.colFabricantes')}</Text>
                </View>
                <View style={styles.colAcciones}>
                  <Text style={styles.headerText}>{t('screens.materiales.colAcciones')}</Text>
                </View>
              </View>

              {/* Table rows */}
              {catalogoFiltrado.map((mat, matIdx) => (
                <View key={mat._id || mat.id || matIdx}>
                  <TouchableOpacity
                    style={[styles.tableRow, matIdx % 2 === 1 && styles.rowAlternate]}
                    onPress={() => setExpandedMat(expandedMat === (mat._id || mat.id) ? null : (mat._id || mat.id))}
                    activeOpacity={0.8}
                  >
                    <View style={styles.colMaterial}>
                      <Text style={[styles.cellText, { fontWeight: '600' }]} numberOfLines={1}>{mat.nombre}</Text>
                    </View>
                    <View style={styles.colFabricantes}>
                      <Text style={[styles.cellText, { color: '#64748B' }]} numberOfLines={1}>
                        {(mat.fabricantes || []).length === 0
                          ? t('screens.materiales.sinFabricantes')
                          : (mat.fabricantes || []).map(f => f.nombre).join(', ')}
                      </Text>
                    </View>
                    <View style={styles.colAcciones}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => puedeCrear && openCatEdit(mat)}
                        disabled={!puedeCrear}
                      >
                        <Text style={styles.actionBtnText}>{t('common.edit')}</Text>
                      </TouchableOpacity>
                      {confirmingDelete === (mat._id || mat.id) ? (
                        <DeleteConfirmRow
                          onCancel={() => setConfirmingDelete(null)}
                          onConfirm={() => { setConfirmingDelete(null); deleteCatalogo(mat); }}
                        />
                      ) : (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.deleteBtn]}
                          onPress={() => setConfirmingDelete(mat._id || mat.id)}
                        >
                          <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>{t('common.delete')}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Expanded: fabricantes and anchos */}
                  {expandedMat === (mat._id || mat.id) && (
                    <View style={styles.expandedRow}>
                      {(mat.fabricantes || []).length === 0 ? (
                        <Text style={styles.expandedEmpty}>{t('screens.materiales.sinFabricantesMsg')}</Text>
                      ) : (
                        (mat.fabricantes || []).map((fab, fabIdx) => (
                          <View key={fab.id || `fab-${matIdx}-${fabIdx}`} style={styles.fabRow}>
                            <Text style={styles.fabNombre}>{fab.nombre}</Text>
                            <View style={styles.anchosRow}>
                              {(fab.anchos_cm || []).length === 0
                                ? <Text style={styles.anchosEmpty}>{t('screens.materiales.sinAnchosDefined')}</Text>
                                : (fab.anchos_cm || []).map((a, aIdx) => (
                                    <View key={`${a}-${aIdx}`} style={styles.anchoChip}>
                                      <Text style={styles.anchoChipText}>{a} cm</Text>
                                    </View>
                                  ))}
                            </View>
                          </View>
                        ))
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>
        </ScrollView>
        )
      )}

      {/* Modal: Catálogo crear/editar */}
      <Modal visible={catModal.visible} transparent animationType="fade" onRequestClose={() => setCatModal({ visible: false, editing: null })}>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>
                {catModal.editing ? t('screens.materiales.editMaterialTitle') : t('screens.materiales.newMaterialTitle')}
              </Text>

              <Text style={styles.fieldLabel}>{t('screens.materiales.nombreMaterialLabel')}</Text>
              <TextInput
                style={styles.fieldInput}
                value={catNombre}
                onChangeText={setCatNombre}
                placeholder={t('screens.materiales.nombreMaterialPlaceholder')}
                placeholderTextColor="#94A3B8"
                autoFocus
              />

              <Text style={[styles.fieldLabel, { marginTop: 10 }]}>{t('screens.materiales.fabricantesLabel')}</Text>
              {catFabricantes.map((fab, fabIdx) => (
                <View key={fab.id || `new-fab-${fabIdx}`} style={styles.fabEditRow}>
                  <View style={styles.fabEditHeader}>
                    <Text style={styles.fabEditName}>{fab.nombre}</Text>
                    <TouchableOpacity onPress={() => removeFabricante(fab.id)}>
                      <Text style={styles.removeText}>{t('screens.materiales.deleteWidthBtn')}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.anchosEditRow}>
                    {(fab.anchos_cm || []).map((a, aIdx) => (
                      <TouchableOpacity key={`${a}-${aIdx}`} style={styles.anchoChipEdit} onPress={() => removeAncho(fab.id, a)}>
                        <Text style={styles.anchoChipEditText}>{a} cm ✕</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.addAnchoRow}>
                    <TextInput
                      style={styles.anchoInput}
                      value={catAnchoInputs[fab.id] || ''}
                      onChangeText={v => setCatAnchoInputs(prev => ({ ...prev, [fab.id]: v }))}
                      placeholder={t('screens.materiales.anchoCmPlaceholder')}
                      placeholderTextColor="#94A3B8"
                      keyboardType="decimal-pad"
                    />
                    <TouchableOpacity style={styles.btnSecondarySmall} onPress={() => addAncho(fab.id)}>
                      <Text style={styles.btnSecondarySmallText}>{t('screens.materiales.addAnchoBtn')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {/* Add fabricante/proveedor */}
              <View style={styles.addFabRow}>
                {Platform.OS === 'web' && proveedores.length > 0 ? (
                  <select
                    style={{ ...styles.fieldSelect, flex: 1, marginRight: 8, marginBottom: 0 }}
                    value={catFabInput}
                    onChange={e => setCatFabInput(e.target.value)}
                  >
                    <option value="">{t('screens.materiales.selectProveedorPlaceholder')}</option>
                    {proveedores
                      .filter(p => !catFabricantes.some(f => f.nombre === p.nombre))
                      .map((p, i) => (
                        <option key={p._id || p.id || i} value={p.nombre}>{p.nombre}</option>
                      ))}
                  </select>
                ) : (
                  <TextInput
                    style={[styles.anchoInput, { flex: 1 }]}
                    value={catFabInput}
                    onChangeText={setCatFabInput}
                    placeholder={t('screens.materiales.nombreProvPlaceholder')}
                    placeholderTextColor="#94A3B8"
                  />
                )}
                <TouchableOpacity style={styles.btnSecondarySmall} onPress={addFabricante}>
                  <Text style={styles.btnSecondarySmallText}>{t('screens.materiales.addBtn')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnSecondarySmall, { marginLeft: 2 }]} onPress={openProvCreate}>
                  <Text style={styles.btnSecondarySmallText}>{t('screens.materiales.addProveedorBtn2')}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.btnCancel} onPress={() => setCatModal({ visible: false, editing: null })}>
                  <Text style={styles.btnCancelText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnSave} onPress={saveCatalogo}>
                  <Text style={styles.btnSaveText}>{t('common.save')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal: Proveedor crear/editar */}
      <Modal visible={provModal.visible} transparent animationType="fade" onRequestClose={() => setProvModal({ visible: false, editing: null })}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {provModal.editing ? t('screens.materiales.editProveedorTitle') : t('screens.materiales.newProveedorTitle')}
            </Text>

            <Text style={styles.fieldLabel}>{t('screens.materiales.nombreProveedorLabel')}</Text>
            <TextInput
              style={styles.fieldInput}
              value={provForm.nombre}
              onChangeText={v => setProvForm(p => ({ ...p, nombre: v }))}
              placeholder={t('screens.materiales.nombreProveedorEjemplo')}
              placeholderTextColor="#94A3B8"
              autoFocus
            />

            <Text style={styles.fieldLabel}>{t('screens.materiales.personaContactoLabel')}</Text>
            <TextInput
              style={styles.fieldInput}
              value={provForm.contacto}
              onChangeText={v => setProvForm(p => ({ ...p, contacto: v }))}
              placeholder={t('screens.materiales.personaContactoPlaceholder')}
              placeholderTextColor="#94A3B8"
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>{t('screens.materiales.telefonoLabel')}</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={provForm.telefono}
                  onChangeText={v => setProvForm(p => ({ ...p, telefono: v }))}
                  placeholder="+34 600 000 000"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>{t('screens.materiales.emailLabel')}</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={provForm.email}
                  onChangeText={v => setProvForm(p => ({ ...p, email: v }))}
                  placeholder="comercial@proveedor.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>{t('screens.materiales.notasLabel')}</Text>
            <TextInput
              style={[styles.fieldInput, { minHeight: 50 }]}
              value={provForm.notas}
              onChangeText={v => setProvForm(p => ({ ...p, notas: v }))}
              multiline
              placeholder={t('screens.materiales.condicionesPlaceholder')}
              placeholderTextColor="#94A3B8"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setProvModal({ visible: false, editing: null })}>
                <Text style={styles.btnCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSave} onPress={saveProveedor}>
                <Text style={styles.btnSaveText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

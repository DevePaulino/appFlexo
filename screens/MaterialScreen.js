import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import EmptyState from '../components/EmptyState';
import DeleteConfirmRow from '../components/DeleteConfirmRow';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useModulos } from '../ModulosContext';

// Color palette for per-material chart bars
const MATERIAL_COLORS = [
  '#1976D2', '#E53935', '#43A047', '#FB8C00', '#8E24AA',
  '#00ACC1', '#D81B60', '#6D4C41', '#546E7A', '#C0CA33',
];

const API_BASE = 'http://localhost:8080';

export default function MaterialScreen({ currentUser, navigation }) {
  const { t } = useTranslation();
  // ── Módulos ───────────────────────────────────────────────────────────────
  const { modulos } = useModulos();
  const consumoModuloActivo = modulos.consumo_material !== false;

  // ── Tabs ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('resumen'); // 'resumen' | 'stock' | 'historial'

  useEffect(() => {
    AsyncStorage.getItem('MaterialScreen_activeTab')
      .then(v => { if (v && v !== 'catalogo' && v !== 'proveedores' && (v !== 'historial' || consumoModuloActivo)) setActiveTab(v); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeTab = useCallback((tab) => {
    setActiveTab(tab);
    setBusquedaStock('');
    AsyncStorage.setItem('MaterialScreen_activeTab', tab).catch(() => {});
  }, []);

  // ── Catálogo ─────────────────────────────────────────────────────────────
  const [catalogo, setCatalogo] = useState([]);
  const [loadingCatalogo, setLoadingCatalogo] = useState(false);
  const [expandedMat, setExpandedMat] = useState(null); // material _id expanded
  const [catModal, setCatModal] = useState({ visible: false, editing: null });
  const [catNombre, setCatNombre] = useState('');
  const [catFabricantes, setCatFabricantes] = useState([]); // [{id,nombre,anchos_cm:[]}]
  const [catFabInput, setCatFabInput] = useState(''); // new fabricante name
  const [catAnchoInputs, setCatAnchoInputs] = useState({}); // {fabId: anchoText}
  const migratedRef = useRef(false);

  // ── Stock ─────────────────────────────────────────────────────────────────
  const [stock, setStock] = useState([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [stockFilter, setStockFilter] = useState('');
  const [busquedaStock, setBusquedaStock] = useState('');
  const [stockModal, setStockModal] = useState({ visible: false, editing: null });
  const [stockForm, setStockForm] = useState({
    material_nombre: '',
    fabricante: '',
    ancho_cm: '',
    gramaje: '',
    metros_total: '',
    numero_lote: '',
    notas: '',
    cantidad: '1',
  });
  const [stockEditMetros, setStockEditMetros] = useState('');
  const [stockEditNotas, setStockEditNotas] = useState('');

  // ── Historial ─────────────────────────────────────────────────────────────
  const [consumos, setConsumos] = useState([]);
  const [loadingConsumos, setLoadingConsumos] = useState(false);
  const [consumosPage, setConsumosPage] = useState(1);
  const [consumosTotal, setConsumosTotal] = useState(0);
  const [historialSearchMaterial, setHistorialSearchMaterial] = useState('');
  const [historialPeriodo, setHistorialPeriodo] = useState('todo'); // 'todo' | 'mes_actual' | 'mes_anterior'

  // ── Stock sorting & availability filter ───────────────────────────────────
  const [stockSortBy, setStockSortBy] = useState(null); // null | 'nombre' | 'disponible' | 'fecha'
  const [stockSortDir, setStockSortDir] = useState('asc');
  const [stockAvailFilter, setStockAvailFilter] = useState('todos'); // 'todos' | 'bajo' | 'critico'

  // ── Consumo modal ─────────────────────────────────────────────────────────
  const [consumoModal, setConsumoModal] = useState({ visible: false });
  const [consumoForm, setConsumoForm] = useState({
    stock_id: '', pedido_ref: '', ancho_trabajo_cm: '', largo_trabajo_m: '', crear_retal: false,
  });

  // ── Proveedores (data only, for catalog modal dropdowns) ─────────────────
  const [proveedores, setProveedores] = useState([]);

  // ── Inline delete confirmation ────────────────────────────────────────────
  const [confirmingDelete, setConfirmingDelete] = useState(null);

  // ── Auth headers ─────────────────────────────────────────────────────────
  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'X-Empresa-Id': String(currentUser?.empresa_id || '1'),
    'X-User-Id': String(currentUser?.id || 'admin'),
    'X-Role': String(currentUser?.rol || currentUser?.role || 'administrador'),
  }), [currentUser]);

  // ═══════════════════════════════════════════════════════════════
  // DATA LOADERS
  // ═══════════════════════════════════════════════════════════════

  const loadCatalogo = useCallback(async () => {
    setLoadingCatalogo(true);
    try {
      const resp = await fetch(`${API_BASE}/api/materiales/catalogo`, { headers: authHeaders() });
      const data = await resp.json();
      if (resp.ok) {
        const items = data.catalogo || [];
        setCatalogo(items);
        // Auto-migrate legacy materials if catalog is empty (idempotent)
        if (items.length === 0 && !migratedRef.current) {
          migratedRef.current = true;
          try {
            const migKey = `pfp_mat_migrated_${currentUser?.empresa_id || '1'}`;
            const already = typeof localStorage !== 'undefined' ? localStorage.getItem(migKey) : null;
            if (!already) {
              await fetch(`${API_BASE}/api/materiales/migracion`, { method: 'POST', headers: authHeaders() });
              if (typeof localStorage !== 'undefined') localStorage.setItem(migKey, '1');
              // Reload after migration
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

  const loadStock = useCallback(async () => {
    setLoadingStock(true);
    try {
      const qs = stockFilter ? `?material_nombre=${encodeURIComponent(stockFilter)}` : '';
      const resp = await fetch(`${API_BASE}/api/materiales/stock${qs}`, { headers: authHeaders() });
      const data = await resp.json();
      if (resp.ok) setStock(data.stock || []);
    } catch (e) {
      console.error('Error loading stock materiales:', e);
    } finally {
      setLoadingStock(false);
    }
  }, [authHeaders, stockFilter]);

  const loadConsumos = useCallback(async (page = 1) => {
    setLoadingConsumos(true);
    try {
      let qs = `page=${page}&limit=50`;
      if (historialSearchMaterial.trim()) qs += `&material=${encodeURIComponent(historialSearchMaterial.trim())}`;
      if (historialPeriodo !== 'todo') qs += `&periodo=${historialPeriodo}`;
      const resp = await fetch(`${API_BASE}/api/materiales/consumos?${qs}`, { headers: authHeaders() });
      const data = await resp.json();
      if (resp.ok) {
        setConsumos(data.consumos || []);
        setConsumosTotal(data.total || 0);
        setConsumosPage(page);
      }
    } catch (e) {
      console.error('Error loading consumos:', e);
    } finally {
      setLoadingConsumos(false);
    }
  }, [authHeaders, historialSearchMaterial, historialPeriodo]);

  const loadProveedores = useCallback(async () => {
    try {
      const resp = await fetch(`${API_BASE}/api/materiales/proveedores`, { headers: authHeaders() });
      const data = await resp.json();
      if (resp.ok) setProveedores(data.proveedores || []);
    } catch (e) {
      console.error('Error loading proveedores:', e);
    }
  }, [authHeaders]);

  // Load on focus
  useFocusEffect(
    React.useCallback(() => {
      loadCatalogo(); // always load for stock form dropdowns
      if (activeTab === 'resumen' || activeTab === 'stock') loadStock();
      if (activeTab === 'historial') loadConsumos(1);
    }, [activeTab, loadCatalogo, loadStock, loadConsumos, loadProveedores])
  );

  // Load when tab changes
  useEffect(() => {
    if (activeTab === 'resumen' || activeTab === 'stock') loadStock();
    else if (activeTab === 'historial') loadConsumos(1);
  }, [activeTab]);

  // Chart data: group stock by material_nombre for Resumen tab
  const chartData = useMemo(() => {
    const groups = {};
    const order = [];
    stock.forEach(entry => {
      const name = entry.material_nombre;
      if (!groups[name]) {
        groups[name] = { name, disponible: 0, consumido: 0, retales: 0 };
        order.push(name);
      }
      if (entry.es_retal) {
        groups[name].retales += entry.metros_disponibles || 0;
      } else {
        groups[name].disponible += entry.metros_disponibles || 0;
        groups[name].consumido += (entry.metros_total || 0) - (entry.metros_disponibles || 0);
      }
    });
    return order.map((name, idx) => ({ ...groups[name], colorIdx: idx }));
  }, [stock]);

  // Re-load stock when filter changes
  useEffect(() => {
    if (activeTab === 'stock') loadStock();
  }, [stockFilter]);

  // Re-load historial when filters change
  useEffect(() => {
    if (activeTab === 'historial') loadConsumos(1);
  }, [historialSearchMaterial, historialPeriodo]);

  // ═══════════════════════════════════════════════════════════════
  // CATÁLOGO CRUD
  // ═══════════════════════════════════════════════════════════════

  const openCatCreate = () => {
    setCatNombre('');
    setCatFabricantes([]);
    setCatFabInput('');
    setCatAnchoInputs({});
    loadProveedores();
    setCatModal({ visible: true, editing: null });
  };

  const openCatEdit = (mat) => {
    setCatNombre(mat.nombre || '');
    setCatFabricantes(JSON.parse(JSON.stringify(mat.fabricantes || [])));
    setCatFabInput('');
    setCatAnchoInputs({});
    loadProveedores();
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

  // ═══════════════════════════════════════════════════════════════
  // STOCK CRUD
  // ═══════════════════════════════════════════════════════════════

  const openStockCreate = () => {
    setStockForm({ material_nombre: '', fabricante: '', ancho_cm: '', gramaje: '', metros_total: '', numero_lote: '', notas: '', cantidad: '1' });
    setStockModal({ visible: true, editing: null });
  };

  const openStockEdit = (entry) => {
    const isVirgin = Math.abs((entry.metros_disponibles || 0) - (entry.metros_total || 0)) < 0.01;
    if (isVirgin) {
      setStockForm({
        material_nombre: entry.material_nombre || '',
        fabricante: entry.fabricante || '',
        ancho_cm: String(entry.ancho_cm || ''),
        gramaje: String(entry.gramaje || ''),
        metros_total: String(entry.metros_total || ''),
        numero_lote: entry.numero_lote || '',
        notas: entry.notas || '',
        cantidad: '1',
      });
    }
    setStockEditNotas(entry.notas || '');
    setStockModal({ visible: true, editing: entry, isVirgin });
  };

  const saveStock = async () => {
    if (stockModal.editing) {
      if (stockModal.isVirgin) {
        // Virgin edit: allow changing all fields, metros_disponibles follows metros_total
        const nombre = stockForm.material_nombre.trim();
        const ancho = parseFloat(stockForm.ancho_cm);
        const metros = parseFloat(stockForm.metros_total);
        if (!nombre) return alert(t('screens.materiales.errNombreRequired2'));
        if (isNaN(ancho) || ancho <= 0) return alert(t('screens.materiales.errAnchoInvalido'));
        if (isNaN(metros) || metros <= 0) return alert(t('screens.materiales.errMetrosPositivos'));
        try {
          const resp = await fetch(`${API_BASE}/api/materiales/stock/${stockModal.editing._id || stockModal.editing.id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({
              material_nombre: nombre,
              fabricante: stockForm.fabricante.trim(),
              ancho_cm: ancho,
              gramaje: parseFloat(stockForm.gramaje) || 0,
              metros_total: metros,
              metros_disponibles: metros, // keep % at 100%
              numero_lote: stockForm.numero_lote.trim(),
              notas: stockForm.notas.trim(),
            }),
          });
          const data = await resp.json();
          if (!resp.ok) return alert(data.error || t('screens.materiales.errActualizandoStock'));
          setStockModal({ visible: false, editing: null });
          loadStock();
        } catch (e) {
          alert(t('screens.materiales.errConexion'));
        }
      } else {
        // Consumed roll: only notas is editable
        try {
          const resp = await fetch(`${API_BASE}/api/materiales/stock/${stockModal.editing._id || stockModal.editing.id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ notas: stockEditNotas }),
          });
          const data = await resp.json();
          if (!resp.ok) return alert(data.error || t('screens.materiales.errActualizandoStock'));
          setStockModal({ visible: false, editing: null });
          loadStock();
        } catch (e) {
          alert(t('screens.materiales.errConexion'));
        }
      }
    } else {
      // Create: loop cantidad times
      const nombre = stockForm.material_nombre.trim();
      const ancho = parseFloat(stockForm.ancho_cm);
      const metros = parseFloat(stockForm.metros_total);
      const cantidad = Math.max(1, Math.min(50, parseInt(stockForm.cantidad) || 1));
      if (!nombre) return alert(t('screens.materiales.errMaterialRequired'));
      if (isNaN(ancho) || ancho <= 0) return alert(t('screens.materiales.errAnchoInvalido'));
      if (isNaN(metros) || metros <= 0) return alert(t('screens.materiales.errMetrosPositivos'));
      try {
        for (let i = 0; i < cantidad; i++) {
          const resp = await fetch(`${API_BASE}/api/materiales/stock`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({
              material_nombre: nombre,
              fabricante: stockForm.fabricante.trim(),
              ancho_cm: ancho,
              gramaje: parseFloat(stockForm.gramaje) || 0,
              metros_total: metros,
              numero_lote: stockForm.numero_lote.trim(),
              notas: stockForm.notas.trim(),
            }),
          });
          const data = await resp.json();
          if (!resp.ok) return alert(data.error || t('screens.materiales.errConexion'));
        }
        setStockModal({ visible: false, editing: null });
        loadStock();
      } catch (e) {
        alert(t('screens.materiales.errConexion'));
      }
    }
  };

  const deleteStock = async (entry) => {
    try {
      const resp = await fetch(`${API_BASE}/api/materiales/stock/${entry._id || entry.id}`, {
        method: 'DELETE', headers: authHeaders(),
      });
      if (resp.ok) loadStock();
      else {
        const d = await resp.json();
        alert(d.error || t('screens.materiales.errEliminar'));
      }
    } catch (e) {
      alert(t('screens.materiales.errConexion'));
    }
  };


  // ── Consumo ───────────────────────────────────────────────────────────────

  const registrarConsumo = async () => {
    const { stock_id, pedido_ref, ancho_trabajo_cm, largo_trabajo_m, crear_retal } = consumoForm;
    const ancho = parseFloat(ancho_trabajo_cm);
    const largo = parseFloat(largo_trabajo_m);
    if (!stock_id) return alert(t('screens.materiales.errSeleccionaStock'));
    if (isNaN(ancho) || ancho <= 0) return alert(t('screens.materiales.errAnchoTrabajo'));
    if (isNaN(largo) || largo <= 0) return alert(t('screens.materiales.errLargoTrabajo'));
    const entry = stock.find(e => (e._id || e.id) === stock_id);
    if (entry && ancho > entry.ancho_cm) return alert(t('screens.materiales.errAnchoSuperaMaterial', { ancho, max: entry.ancho_cm }));
    try {
      const resp = await fetch(`${API_BASE}/api/materiales/consumos`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          stock_id,
          pedido_id: pedido_ref || `manual-${Date.now()}`,
          numero_pedido: pedido_ref || '',
          ancho_trabajo_cm: ancho,
          largo_trabajo_m: largo,
          metros_consumidos: largo,
          crear_retal,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) return alert(data.error || t('screens.materiales.errConsumo'));
      setConsumoModal({ visible: false });
      setConsumoForm({ stock_id: '', pedido_ref: '', ancho_trabajo_cm: '', largo_trabajo_m: '', crear_retal: false });
      loadStock();
      if (activeTab === 'historial') loadConsumos(1);
    } catch (e) {
      alert(t('screens.materiales.errConexion'));
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const stockColor = (entry) => {
    if (!entry.metros_total || entry.metros_total === 0) return '#9E9E9E';
    const pct = entry.metros_disponibles / entry.metros_total;
    if (pct > 0.5) return '#388E3C';
    if (pct > 0.1) return '#F57C00';
    return '#D32F2F';
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString('es-ES'); } catch { return iso; }
  };

  const catalogoNames = catalogo.map(m => m.nombre);

  // ═══════════════════════════════════════════════════════════════
  // RENDERS
  // ═══════════════════════════════════════════════════════════════

  const renderResumenTab = () => {
    const materialesActivos = stock.filter(e => !e.es_retal);
    const retales = stock.filter(e => e.es_retal);

    const alertasCritico = stock.filter(e => !e.es_retal && e.metros_total > 0 && (e.metros_disponibles / e.metros_total) <= 0.1);
    const alertasBajo = stock.filter(e => !e.es_retal && e.metros_total > 0 && (e.metros_disponibles / e.metros_total) > 0.1 && (e.metros_disponibles / e.metros_total) <= 0.3);

    return (
      <ScrollView style={styles.tabContent}>
        {loadingStock && <Text style={styles.loadingText}>{t('common.loading')}</Text>}

        {/* ── Alertas de stock ──────────────────────────── */}
        {(alertasCritico.length > 0 || alertasBajo.length > 0) && (
          <View style={styles.alertasCard}>
            <Text style={styles.alertasTitle}>⚠ Alertas de stock</Text>
            {alertasCritico.map((e, i) => {
              const pct = Math.round((e.metros_disponibles / e.metros_total) * 100);
              return (
                <View key={e._id || i} style={styles.alertaRow}>
                  <View style={[styles.alertaDot, { backgroundColor: '#D32F2F' }]} />
                  <Text style={styles.alertaNombre}>{e.material_nombre}</Text>
                  <Text style={[styles.alertaPct, { color: '#D32F2F' }]}>{pct}%</Text>
                  <View style={[styles.alertaBadge, { backgroundColor: '#FFEBEE', borderColor: '#FFCDD2' }]}>
                    <Text style={[styles.alertaBadgeText, { color: '#D32F2F' }]}>CRÍTICO</Text>
                  </View>
                </View>
              );
            })}
            {alertasBajo.map((e, i) => {
              const pct = Math.round((e.metros_disponibles / e.metros_total) * 100);
              return (
                <View key={e._id || i} style={styles.alertaRow}>
                  <View style={[styles.alertaDot, { backgroundColor: '#F57C00' }]} />
                  <Text style={styles.alertaNombre}>{e.material_nombre}</Text>
                  <Text style={[styles.alertaPct, { color: '#F57C00' }]}>{pct}%</Text>
                  <View style={[styles.alertaBadge, { backgroundColor: '#FFF3E0', borderColor: '#FFE0B2' }]}>
                    <Text style={[styles.alertaBadgeText, { color: '#F57C00' }]}>BAJO</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Material stock chart ──────────────────────── */}
        {chartData.length > 0 && Platform.OS === 'web' && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>{t('screens.materiales.metrosPorMaterial')}</Text>
            {chartData.map((entry) => {
              const total = entry.disponible + entry.consumido + entry.retales;
              if (total === 0) return null;
              const pctDisp = entry.disponible / total;
              const pctRetal = entry.retales / total;
              const color = MATERIAL_COLORS[entry.colorIdx % MATERIAL_COLORS.length];
              return (
                <View key={entry.name} style={{ marginBottom: 20 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, marginRight: 8 }} />
                      <Text style={{ fontWeight: '700', fontSize: 14, color: '#111827' }}>{entry.name}</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '500' }}>{total.toFixed(0)} {t('screens.materiales.mTotal')}</Text>
                  </View>
                  <View style={{ height: 12, borderRadius: 6, backgroundColor: '#E9EDF2', overflow: 'hidden', flexDirection: 'row' }}>
                    {pctDisp > 0 && (
                      <View style={{ width: `${pctDisp * 100}%`, backgroundColor: color }} />
                    )}
                    {pctRetal > 0 && (
                      <View style={{ width: `${pctRetal * 100}%`, backgroundColor: '#FFB300' }} />
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 7, gap: 14 }}>
                    <Text style={{ fontSize: 12, color: '#374151' }}>
                      <Text style={{ color, fontWeight: '700' }}>{entry.disponible.toFixed(0)} m</Text>
                      {'  '}{t('screens.materiales.disponibleLabel')}
                    </Text>
                    {entry.retales > 0 && (
                      <Text style={{ fontSize: 12, color: '#374151' }}>
                        <Text style={{ color: '#F59E0B', fontWeight: '700' }}>{entry.retales.toFixed(0)} m</Text>
                        {'  '}{t('screens.materiales.retalesLabel')}
                      </Text>
                    )}
                    <Text style={{ fontSize: 12, color: '#374151' }}>
                      <Text style={{ color: '#9CA3AF', fontWeight: '700' }}>{entry.consumido.toFixed(0)} m</Text>
                      {'  '}{t('screens.materiales.consumidoLabel')}
                    </Text>
                  </View>
                </View>
              );
            })}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F2F5' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#1976D2', marginRight: 5 }} />
                <Text style={{ fontSize: 11, color: '#6B7280' }}>{t('screens.materiales.disponibleCap')}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#FFB300', marginRight: 5 }} />
                <Text style={{ fontSize: 11, color: '#6B7280' }}>{t('screens.materiales.retalesCap')}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#E9EDF2', borderWidth: 1, borderColor: '#CBD5E0', marginRight: 5 }} />
                <Text style={{ fontSize: 11, color: '#6B7280' }}>{t('screens.materiales.consumidoCap')}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Materiales activos ──────────────────────────────── */}
        <Text style={styles.resumenSectionHeader}>
          {t('screens.materiales.materialesActivos', { count: materialesActivos.length })}
        </Text>
        {materialesActivos.length === 0 && !loadingStock && (
          <EmptyState variant="inline" title={t('screens.materiales.sinMateriales')} message={t('screens.materiales.noMateriales')} />
        )}
        {materialesActivos.map((entry, idx) => {
          const pct = entry.metros_total > 0 ? (entry.metros_disponibles / entry.metros_total) : 0;
          const pctRound = Math.round(pct * 100);
          const color = stockColor(entry);
          return (
            <View key={entry._id || entry.id || idx} style={styles.rollCard}>
              <View style={styles.rollCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rollCardTitle}>{entry.material_nombre}</Text>
                  <Text style={styles.rollCardSub}>
                    {entry.fabricante || '—'} · {entry.ancho_cm} cm{entry.gramaje ? ` · ${entry.gramaje} g/m²` : ''}
                    {entry.numero_lote ? ` · Lote: ${entry.numero_lote}` : ''}
                  </Text>
                </View>
                <View style={styles.rollCardBadge}>
                  <View style={[styles.rollCardDot, { backgroundColor: color }]} />
                  <Text style={[styles.rollCardPct, { color }]}>{pctRound}%</Text>
                </View>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${pctRound}%`, backgroundColor: color }]} />
              </View>
              <View style={styles.rollCardMetros}>
                <Text style={styles.rollCardMetrosText}>
                  <Text style={{ fontWeight: '700', color }}>{entry.metros_disponibles?.toFixed(0)} m</Text>
                  <Text style={{ color: '#999' }}> disponibles de {entry.metros_total?.toFixed(0)} m</Text>
                </Text>
                <Text style={styles.rollCardDate}>{formatDate(entry.fecha_entrada)}</Text>
              </View>
            </View>
          );
        })}

        {/* ── Retales ─────────────────────────────────────── */}
        <Text style={[styles.resumenSectionHeader, { marginTop: 20 }]}>
          {t('screens.materiales.retalesDisponibles', { count: retales.length })}
        </Text>
        {retales.length === 0 && (
          <EmptyState variant="inline" title={t('screens.materiales.sinRetales')} message={t('screens.materiales.noRetalesSaved')} />
        )}
        <View style={styles.retalesGrid}>
          {retales.map((entry, idx) => {
            const pct = entry.metros_total > 0 ? Math.round((entry.metros_disponibles / entry.metros_total) * 100) : 0;
            const color = stockColor(entry);
            return (
              <View key={entry._id || entry.id || idx} style={styles.retalCard}>
                <View style={styles.retalBadge}><Text style={styles.retalBadgeText}>{t('screens.materiales.retalBadge')}</Text></View>
                <Text style={styles.retalMaterial}>{entry.material_nombre}</Text>
                <Text style={styles.retalDimensions}>{entry.ancho_cm} cm × {entry.metros_disponibles?.toFixed(1)} m</Text>
                {entry.retal_origen_pedido ? (
                  <Text style={styles.retalOrigen}>{t('screens.materiales.pedShort')} {entry.retal_origen_pedido.slice(0, 8)}</Text>
                ) : null}
                <View style={[styles.progressBarBg, { marginTop: 6 }]}>
                  <View style={[styles.progressBarFill, { width: `${pct}%`, backgroundColor: color }]} />
                </View>
                <Text style={[styles.retalPct, { color }]}>{pct}%</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  const renderCatalogoTab = () => (
    <ScrollView style={styles.tabContent}>
      {loadingCatalogo && <Text style={styles.loadingText}>{t('common.loading')}</Text>}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={Platform.select({ web: { width: '100%' }, default: { minWidth: 460 } })}>
      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.th, { flex: 2 }]}>{t('screens.materiales.colMaterial')}</Text>
        <Text style={[styles.th, { flex: 3 }]}>{t('screens.materiales.colFabricantes')}</Text>
        <Text style={[styles.th, { width: 100 }]}>{t('screens.materiales.colAcciones')}</Text>
      </View>

      {catalogo.length === 0 && !loadingCatalogo && (
        <EmptyState variant="inline" title={t('screens.materiales.sinCatalogoMateriales')} message={t('screens.materiales.noCatalogoMateriales')} />
      )}

      {catalogo.map((mat, matIdx) => (
        <View key={mat._id || mat.id || matIdx}>
          <TouchableOpacity
            style={styles.tableRow}
            onPress={() => setExpandedMat(expandedMat === mat._id ? null : mat._id)}
          >
            <Text style={[styles.td, { flex: 2, fontWeight: '600' }]}>{mat.nombre}</Text>
            <Text style={[styles.td, { flex: 3, color: '#666' }]}>
              {(mat.fabricantes || []).length === 0
                ? t('screens.materiales.sinFabricantes')
                : (mat.fabricantes || []).map(f => f.nombre).join(', ')}
            </Text>
            <View style={[styles.tdActions, { width: 120 }]}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => openCatEdit(mat)}>
                <Text style={styles.actionBtnText}>{t('common.edit')}</Text>
              </TouchableOpacity>
              {confirmingDelete === (mat._id || mat.id) ? (
                <DeleteConfirmRow
                  onCancel={() => setConfirmingDelete(null)}
                  onConfirm={() => { setConfirmingDelete(null); deleteCatalogo(mat); }}
                />
              ) : (
                <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => setConfirmingDelete(mat._id || mat.id)}>
                  <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>{t('common.delete')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>

          {/* Expanded: fabricantes and anchos */}
          {expandedMat === mat._id && (
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
  );

  const toggleStockSort = (col) => {
    if (stockSortBy === col) {
      setStockSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setStockSortBy(col);
      setStockSortDir('asc');
    }
  };

  const renderSortIcon = (col) => {
    if (stockSortBy !== col) return <Text style={styles.thSortIcon}>⇅</Text>;
    return <Text style={styles.thSortIcon}>{stockSortDir === 'asc' ? '↑' : '↓'}</Text>;
  };

  const renderStockTab = () => {
    const q = busquedaStock.trim().toLowerCase();
    let stockFiltrado = q
      ? stock.filter(e =>
          (e.material_nombre || '').toLowerCase().includes(q) ||
          (e.fabricante || '').toLowerCase().includes(q) ||
          (e.numero_lote || '').toLowerCase().includes(q)
        )
      : stock;

    if (stockAvailFilter === 'critico') {
      stockFiltrado = stockFiltrado.filter(e => e.metros_total > 0 && (e.metros_disponibles / e.metros_total) <= 0.1);
    } else if (stockAvailFilter === 'bajo') {
      stockFiltrado = stockFiltrado.filter(e => e.metros_total > 0 && (e.metros_disponibles / e.metros_total) > 0.1 && (e.metros_disponibles / e.metros_total) <= 0.3);
    }

    if (stockSortBy) {
      stockFiltrado = [...stockFiltrado].sort((a, b) => {
        let va, vb;
        if (stockSortBy === 'nombre') {
          va = (a.material_nombre || '').toLowerCase();
          vb = (b.material_nombre || '').toLowerCase();
        } else if (stockSortBy === 'disponible') {
          va = a.metros_total > 0 ? a.metros_disponibles / a.metros_total : 0;
          vb = b.metros_total > 0 ? b.metros_disponibles / b.metros_total : 0;
        } else if (stockSortBy === 'fecha') {
          va = new Date(a.fecha_entrada || 0).getTime();
          vb = new Date(b.fecha_entrada || 0).getTime();
        }
        if (va < vb) return stockSortDir === 'asc' ? -1 : 1;
        if (va > vb) return stockSortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return (
    <ScrollView style={styles.tabContent}>
      {loadingStock && <Text style={styles.loadingText}>{t('common.loading')}</Text>}

      {/* Chart — identical to resumen tab */}
      {chartData.length > 0 && Platform.OS === 'web' && !loadingStock && (
        <View style={[styles.chartCard, { marginBottom: 16 }]}>
          <Text style={styles.chartTitle}>{t('screens.materiales.metrosPorMaterial')}</Text>
          {chartData.map((entry) => {
            const total = entry.disponible + entry.consumido + entry.retales;
            if (total === 0) return null;
            const pctDisp = entry.disponible / total;
            const pctRetal = entry.retales / total;
            const color = MATERIAL_COLORS[entry.colorIdx % MATERIAL_COLORS.length];
            return (
              <View key={entry.name} style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, marginRight: 8 }} />
                    <Text style={{ fontWeight: '700', fontSize: 14, color: '#111827' }}>{entry.name}</Text>
                  </View>
                  <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '500' }}>{total.toFixed(0)} {t('screens.materiales.mTotal')}</Text>
                </View>
                <View style={{ height: 12, borderRadius: 6, backgroundColor: '#E9EDF2', overflow: 'hidden', flexDirection: 'row' }}>
                  {pctDisp > 0 && <View style={{ width: `${pctDisp * 100}%`, backgroundColor: color }} />}
                  {pctRetal > 0 && <View style={{ width: `${pctRetal * 100}%`, backgroundColor: '#FFB300' }} />}
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 7, gap: 14 }}>
                  <Text style={{ fontSize: 12, color: '#374151' }}>
                    <Text style={{ color, fontWeight: '700' }}>{entry.disponible.toFixed(0)} m</Text>
                    {'  '}{t('screens.materiales.disponibleLabel')}
                  </Text>
                  {entry.retales > 0 && (
                    <Text style={{ fontSize: 12, color: '#374151' }}>
                      <Text style={{ color: '#F59E0B', fontWeight: '700' }}>{entry.retales.toFixed(0)} m</Text>
                      {'  '}{t('screens.materiales.retalesLabel')}
                    </Text>
                  )}
                  <Text style={{ fontSize: 12, color: '#374151' }}>
                    <Text style={{ color: '#9CA3AF', fontWeight: '700' }}>{entry.consumido.toFixed(0)} m</Text>
                    {'  '}{t('screens.materiales.consumidoLabel')}
                  </Text>
                </View>
              </View>
            );
          })}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F2F5' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#1976D2', marginRight: 5 }} />
              <Text style={{ fontSize: 11, color: '#6B7280' }}>{t('screens.materiales.disponibleCap')}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#FFB300', marginRight: 5 }} />
              <Text style={{ fontSize: 11, color: '#6B7280' }}>{t('screens.materiales.retalesCap')}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#E9EDF2', borderWidth: 1, borderColor: '#CBD5E0', marginRight: 5 }} />
              <Text style={{ fontSize: 11, color: '#6B7280' }}>{t('screens.materiales.consumidoCap')}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Quick availability filter pills */}
      <View style={styles.stockFilterRow}>
        {[
          { key: 'todos', label: 'Todos' },
          { key: 'bajo', label: 'Bajo (<30%)' },
          { key: 'critico', label: 'Crítico (<10%)' },
        ].map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.stockFilterPill, stockAvailFilter === f.key && styles.stockFilterPillActive]}
            onPress={() => setStockAvailFilter(f.key)}
          >
            <Text style={[styles.stockFilterPillText, stockAvailFilter === f.key && styles.stockFilterPillTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
        <Text style={{ fontSize: 11, color: '#94A3B8', marginLeft: 4 }}>
          {stockFiltrado.length} entrada{stockFiltrado.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={Platform.select({ web: { width: '100%' }, default: { minWidth: 760 } })}>
      {/* Table Header */}
      <View style={styles.tableHeader}>
        <TouchableOpacity style={[styles.thSortable, { flex: 2 }]} onPress={() => toggleStockSort('nombre')}>
          <Text style={styles.th}>{t('screens.materiales.colMaterial')}</Text>
          {renderSortIcon('nombre')}
        </TouchableOpacity>
        <Text style={[styles.th, { flex: 1.5 }]}>{t('screens.materiales.colFabricante')}</Text>
        <Text style={[styles.th, { width: 70 }]}>{t('screens.materiales.colAncho')}</Text>
        <Text style={[styles.th, { width: 65 }]}>{t('screens.materiales.colGsm')}</Text>
        <Text style={[styles.th, { width: 80 }]}>{t('screens.materiales.colTotalM')}</Text>
        <Text style={[styles.th, { width: 90 }]}>{t('screens.materiales.colDispM')}</Text>
        <TouchableOpacity style={[styles.thSortable, { width: 50 }]} onPress={() => toggleStockSort('disponible')}>
          <Text style={styles.th}>{t('screens.materiales.colPct')}</Text>
          {renderSortIcon('disponible')}
        </TouchableOpacity>
        <Text style={[styles.th, { flex: 1 }]}>{t('screens.materiales.colLote')}</Text>
        <TouchableOpacity style={[styles.thSortable, { width: 90 }]} onPress={() => toggleStockSort('fecha')}>
          <Text style={styles.th}>{t('screens.materiales.colEntrada')}</Text>
          {renderSortIcon('fecha')}
        </TouchableOpacity>
        <Text style={[styles.th, { width: 100 }]}>{t('screens.materiales.colAcciones')}</Text>
      </View>

      {stockFiltrado.length === 0 && !loadingStock && (
        <EmptyState variant="inline"
          title={busquedaStock || stockAvailFilter !== 'todos' ? t('common.noResults') : t('screens.materiales.sinStockEntradas')}
          message={busquedaStock || stockAvailFilter !== 'todos' ? '' : t('screens.materiales.addToStart')}
        />
      )}

      {stockFiltrado.map((entry, idx) => {
        const pct = entry.metros_total > 0 ? Math.round((entry.metros_disponibles / entry.metros_total) * 100) : 0;
        const color = stockColor(entry);
        return (
          <TouchableOpacity key={entry._id || entry.id || idx} style={styles.tableRow} onPress={() => openStockEdit(entry)} activeOpacity={0.75}>
            <Text style={[styles.td, { flex: 2 }]}>{entry.material_nombre}</Text>
            <Text style={[styles.td, { flex: 1.5, color: '#555' }]}>{entry.fabricante || '—'}</Text>
            <Text style={[styles.td, { width: 70 }]}>{entry.ancho_cm} cm</Text>
            <Text style={[styles.td, { width: 65, color: '#555' }]}>{entry.gramaje ? `${entry.gramaje}` : '—'}</Text>
            <Text style={[styles.td, { width: 80 }]}>{entry.metros_total?.toFixed(1)}</Text>
            <Text style={[styles.td, { width: 90, fontWeight: '600' }]}>{entry.metros_disponibles?.toFixed(1)}</Text>
            <View style={[styles.td, { width: 40, flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
              <View style={[styles.stockDot, { backgroundColor: color }]} />
              <Text style={{ fontSize: 11, color }}>{pct}%</Text>
            </View>
            <Text style={[styles.td, { flex: 1, color: '#888' }]}>{entry.numero_lote || '—'}</Text>
            <Text style={[styles.td, { width: 90, color: '#888', fontSize: 11 }]}>{formatDate(entry.fecha_entrada)}</Text>
            <View style={[styles.tdActions, { width: 80 }]}>
              {confirmingDelete === (entry._id || entry.id) ? (
                <DeleteConfirmRow
                  onCancel={() => setConfirmingDelete(null)}
                  onConfirm={() => { setConfirmingDelete(null); deleteStock(entry); }}
                />
              ) : (
                <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={(e) => { e.stopPropagation?.(); setConfirmingDelete(entry._id || entry.id); }}>
                  <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>{t('common.delete')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
      </View>
      </ScrollView>
    </ScrollView>
    );
  };

  const renderHistorialTab = () => {
    const totalPages = Math.max(1, Math.ceil(consumosTotal / 50));
    const totalConsumido = consumos.reduce((sum, c) => sum + (c.metros_consumidos || 0), 0);
    return (
      <ScrollView style={styles.tabContent}>
        {/* Filter bar */}
        <View style={styles.historialFilterBar}>
          <TextInput
            style={styles.historialSearchInput}
            placeholder="Buscar material..."
            value={historialSearchMaterial}
            onChangeText={setHistorialSearchMaterial}
            placeholderTextColor="#94A3B8"
          />
          <View style={styles.periodoPills}>
            {[
              { key: 'todo', label: 'Todo' },
              { key: 'mes_actual', label: 'Mes actual' },
              { key: 'mes_anterior', label: 'Mes anterior' },
            ].map(p => (
              <TouchableOpacity
                key={p.key}
                style={[styles.periodoPill, historialPeriodo === p.key && styles.periodoPillActive]}
                onPress={() => setHistorialPeriodo(p.key)}
              >
                <Text style={[styles.periodoPillText, historialPeriodo === p.key && styles.periodoPillTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {loadingConsumos && <Text style={styles.loadingText}>{t('common.loading')}</Text>}

        <View style={styles.tableHeader}>
          <Text style={[styles.th, { width: 80 }]}>{t('screens.materiales.colPedido')}</Text>
          <Text style={[styles.th, { flex: 2 }]}>{t('screens.materiales.colMaterial')}</Text>
          <Text style={[styles.th, { flex: 1.5 }]}>{t('screens.materiales.colFabricante')}</Text>
          <Text style={[styles.th, { width: 70 }]}>{t('screens.materiales.colAncho')}</Text>
          <Text style={[styles.th, { width: 90 }]}>{t('screens.materiales.colConsumido')}</Text>
          <Text style={[styles.th, { width: 90 }]}>{t('screens.materiales.colSobrante')}</Text>
          <Text style={[styles.th, { width: 90 }]}>{t('screens.materiales.colFecha')}</Text>
        </View>

        {consumos.length === 0 && !loadingConsumos && (
          <EmptyState variant="inline" title={t('screens.materiales.sinConsumos')} message={t('screens.materiales.noConsumos')} />
        )}

        {consumos.map((c, idx) => (
          <View key={c._id || c.id || idx} style={styles.tableRow}>
            <Text style={[styles.td, { width: 80, fontWeight: '600', color: '#4F46E5' }]}>#{c.numero_pedido || c.pedido_id}</Text>
            <Text style={[styles.td, { flex: 2 }]}>{c.material_nombre}</Text>
            <Text style={[styles.td, { flex: 1.5, color: '#555' }]}>{c.fabricante || '—'}</Text>
            <Text style={[styles.td, { width: 70 }]}>{c.ancho_cm} cm</Text>
            <Text style={[styles.td, { width: 90, fontWeight: '600', color: '#D32F2F' }]}>{c.metros_consumidos?.toFixed(2)} m</Text>
            <Text style={[styles.td, { width: 90, color: '#388E3C' }]}>{c.metros_sobrante?.toFixed(2)} m</Text>
            <Text style={[styles.td, { width: 90, color: '#888', fontSize: 11 }]}>{formatDate(c.fecha)}</Text>
          </View>
        ))}

        {consumos.length > 0 && (
          <View style={styles.historialFooter}>
            <Text style={styles.historialFooterLabel}>
              Total consumido ({consumos.length} registro{consumos.length !== 1 ? 's' : ''}):
            </Text>
            <Text style={styles.historialFooterValue}>{totalConsumido.toFixed(2)} m</Text>
          </View>
        )}

        {totalPages > 1 && (
          <View style={styles.paginationRow}>
            <TouchableOpacity
              style={[styles.paginationBtn, consumosPage <= 1 && styles.paginationBtnDisabled]}
              disabled={consumosPage <= 1}
              onPress={() => loadConsumos(consumosPage - 1)}
            >
              <Text style={styles.paginationBtnText}>{t('common.prev')}</Text>
            </TouchableOpacity>
            <Text style={styles.paginationInfo}>{t('common.pageOf', { current: consumosPage, total: totalPages })}</Text>
            <TouchableOpacity
              style={[styles.paginationBtn, consumosPage >= totalPages && styles.paginationBtnDisabled]}
              disabled={consumosPage >= totalPages}
              onPress={() => loadConsumos(consumosPage + 1)}
            >
              <Text style={styles.paginationBtnText}>{t('common.next')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // MODAL: Catálogo crear/editar
  // ═══════════════════════════════════════════════════════════════
  const renderCatModal = () => (
    <Modal visible={catModal.visible} transparent animationType="fade" onRequestClose={() => setCatModal({ visible: false, editing: null })}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>{catModal.editing ? t('screens.materiales.editMaterialTitle') : t('screens.materiales.newMaterialTitle')}</Text>

          <Text style={styles.fieldLabel}>{t('screens.materiales.nombreMaterialLabel')}</Text>
          <TextInput
            style={styles.fieldInput}
            value={catNombre}
            onChangeText={setCatNombre}
            placeholder={t('screens.materiales.nombreMaterialPlaceholder')}
            placeholderTextColor="#94A3B8"
            autoFocus
          />

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>{t('screens.materiales.fabricantesLabel')}</Text>
          {catFabricantes.map((fab, fabIdx) => (
            <View key={fab.id || `new-fab-${fabIdx}`} style={styles.fabEditRow}>
              <View style={styles.fabEditHeader}>
                <Text style={styles.fabEditName}>{fab.nombre}</Text>
                <TouchableOpacity onPress={() => removeFabricante(fab.id)}>
                  <Text style={styles.removeText}>{t('screens.materiales.deleteWidthBtn')}</Text>
                </TouchableOpacity>
              </View>
              {/* Anchos */}
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

          {/* Add proveedor */}
          <View style={styles.addFabRow}>
            {Platform.OS === 'web' && proveedores.length > 0 ? (
              <select
                style={{ ...styles.fieldSelect, flex: 1, marginRight: 8 }}
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
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.btnCancel} onPress={() => setCatModal({ visible: false, editing: null })}>
              <Text style={styles.btnCancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnPrimary} onPress={saveCatalogo}>
              <Text style={styles.btnPrimaryText}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ═══════════════════════════════════════════════════════════════
  // MODAL: Stock crear/editar
  // ═══════════════════════════════════════════════════════════════
  const renderStockModal = () => {
    const isEdit = !!stockModal.editing;
    const isVirgin = stockModal.isVirgin;
    const showFullForm = !isEdit || isVirgin; // create OR virgin edit
    const fabriOptions = showFullForm
      ? (catalogo.find(m => m.nombre === stockForm.material_nombre)?.fabricantes || [])
      : [];
    const cantidad = Math.max(1, Math.min(50, parseInt(stockForm.cantidad) || 1));

    const fullFormFields = (
      <>
        <Text style={styles.fieldLabel}>{t('screens.materiales.colMaterial')}</Text>
        {Platform.OS === 'web' ? (
          <select
            style={styles.fieldSelect}
            value={stockForm.material_nombre}
            onChange={e => setStockForm(p => ({ ...p, material_nombre: e.target.value, fabricante: '' }))}
          >
            <option value="">{t('screens.materiales.selectMaterialPlaceholder')}</option>
            {catalogoNames.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        ) : (
          <TextInput
            style={styles.fieldInput}
            value={stockForm.material_nombre}
            onChangeText={v => setStockForm(p => ({ ...p, material_nombre: v }))}
            placeholder={t('screens.materiales.colMaterial')}
            placeholderTextColor="#94A3B8"
          />
        )}

        <Text style={styles.fieldLabel}>{t('screens.materiales.fabricanteLabel')}</Text>
        {Platform.OS === 'web' && proveedores.length > 0 ? (
          <select
            style={styles.fieldSelect}
            value={stockForm.fabricante}
            onChange={e => setStockForm(p => ({ ...p, fabricante: e.target.value }))}
          >
            <option value="">{t('screens.materiales.sinEspecificar')}</option>
            {proveedores.map((p, i) => <option key={p._id || p.id || i} value={p.nombre}>{p.nombre}</option>)}
          </select>
        ) : Platform.OS === 'web' && fabriOptions.length > 0 ? (
          <select
            style={styles.fieldSelect}
            value={stockForm.fabricante}
            onChange={e => setStockForm(p => ({ ...p, fabricante: e.target.value }))}
          >
            <option value="">{t('screens.materiales.sinEspecificar')}</option>
            {fabriOptions.map((f, fIdx) => <option key={f.id || f.nombre || fIdx} value={f.nombre}>{f.nombre}</option>)}
          </select>
        ) : (
          <TextInput
            style={styles.fieldInput}
            value={stockForm.fabricante}
            onChangeText={v => setStockForm(p => ({ ...p, fabricante: v }))}
            placeholder={t('screens.materiales.fabricanteLabel')}
            placeholderTextColor="#94A3B8"
          />
        )}

        <Text style={styles.fieldLabel}>{t('screens.materiales.anchoLabel')}</Text>
        {Platform.OS === 'web' &&
          fabriOptions.length > 0 &&
          (catalogo.find(m => m.nombre === stockForm.material_nombre)?.fabricantes || [])
            .find(f => f.nombre === stockForm.fabricante)?.anchos_cm?.length > 0 ? (
          <select
            style={styles.fieldSelect}
            value={stockForm.ancho_cm}
            onChange={e => setStockForm(p => ({ ...p, ancho_cm: e.target.value }))}
          >
            <option value="">{t('screens.materiales.selectAnchoPlaceholder')}</option>
            {((catalogo.find(m => m.nombre === stockForm.material_nombre)?.fabricantes || [])
              .find(f => f.nombre === stockForm.fabricante)?.anchos_cm || [])
              .map((a, aIdx) => <option key={`${a}-${aIdx}`} value={a}>{a} cm</option>)}
          </select>
        ) : (
          <TextInput
            style={styles.fieldInput}
            value={stockForm.ancho_cm}
            onChangeText={v => setStockForm(p => ({ ...p, ancho_cm: v }))}
            keyboardType="decimal-pad"
            placeholder={t('screens.materiales.anchoEjemplo')}
            placeholderTextColor="#94A3B8"
          />
        )}

        <Text style={styles.fieldLabel}>{t('screens.materiales.gramajeLabel')}</Text>
        <TextInput
          style={styles.fieldInput}
          value={stockForm.gramaje}
          onChangeText={v => setStockForm(p => ({ ...p, gramaje: v }))}
          keyboardType="decimal-pad"
          placeholder={t('screens.materiales.gramajeEjemplo')}
          placeholderTextColor="#94A3B8"
        />

        <Text style={styles.fieldLabel}>{t('screens.materiales.metrosTotalesLabel')}</Text>
        <TextInput
          style={styles.fieldInput}
          value={stockForm.metros_total}
          onChangeText={v => setStockForm(p => ({ ...p, metros_total: v }))}
          keyboardType="decimal-pad"
          placeholder={t('screens.materiales.metrosTotalesEjemplo')}
          placeholderTextColor="#94A3B8"
        />

        <Text style={styles.fieldLabel}>{t('screens.materiales.loteLabel')}</Text>
        <TextInput
          style={styles.fieldInput}
          value={stockForm.numero_lote}
          onChangeText={v => setStockForm(p => ({ ...p, numero_lote: v }))}
          placeholder={t('screens.materiales.loteEjemplo')}
          placeholderTextColor="#94A3B8"
        />

        <Text style={styles.fieldLabel}>{t('screens.materiales.notasLabel')}</Text>
        <TextInput
          style={[styles.fieldInput, { minHeight: 50 }]}
          value={stockForm.notas}
          onChangeText={v => setStockForm(p => ({ ...p, notas: v }))}
          multiline
          placeholder={t('screens.materiales.observacionesPlaceholder')}
          placeholderTextColor="#94A3B8"
        />
      </>
    );

    return (
      <Modal visible={stockModal.visible} transparent animationType="fade" onRequestClose={() => setStockModal({ visible: false, editing: null })}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {isEdit ? (isVirgin ? t('screens.materiales.editStockNoConsumo') : t('screens.materiales.editStockTitle')) : t('screens.materiales.addStockTitle')}
            </Text>

            {isEdit && !isVirgin ? (
              /* Consumed roll: read-only info + notas only */
              <>
                <Text style={styles.fieldLabel}>
                  {stockModal.editing?.material_nombre} · {stockModal.editing?.fabricante} · {stockModal.editing?.ancho_cm} cm
                </Text>
                <Text style={styles.fieldLabelSmall}>{t('screens.materiales.loteInfo')} {stockModal.editing?.numero_lote || '—'}</Text>
                <View style={styles.stockInfoRow}>
                  <View style={styles.stockInfoItem}>
                    <Text style={styles.stockInfoLabel}>{t('screens.materiales.totalMetros')}</Text>
                    <Text style={styles.stockInfoValue}>{stockModal.editing?.metros_total?.toFixed(1)}</Text>
                  </View>
                  <View style={styles.stockInfoItem}>
                    <Text style={styles.stockInfoLabel}>{t('screens.materiales.disponibleMetros')}</Text>
                    <Text style={[styles.stockInfoValue, { color: stockColor(stockModal.editing || {}) }]}>
                      {stockModal.editing?.metros_disponibles?.toFixed(1)}
                    </Text>
                  </View>
                  <View style={styles.stockInfoItem}>
                    <Text style={styles.stockInfoLabel}>{t('screens.materiales.consumidoMetros')}</Text>
                    <Text style={styles.stockInfoValue}>
                      {((stockModal.editing?.metros_total || 0) - (stockModal.editing?.metros_disponibles || 0)).toFixed(1)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.stockInfoHint}>{t('screens.materiales.stockAutoInfo')}</Text>
                <Text style={[styles.fieldLabel, { marginTop: 12 }]}>{t('screens.materiales.notasLabel')}</Text>
                <TextInput
                  style={[styles.fieldInput, { minHeight: 60 }]}
                  value={stockEditNotas}
                  onChangeText={setStockEditNotas}
                  multiline
                  placeholder={t('screens.materiales.observacionesMaterialPlaceholder')}
                  placeholderTextColor="#94A3B8"
                  autoFocus
                />
              </>
            ) : (
              /* Create or virgin edit: full form */
              <>
                {fullFormFields}
                {/* Cantidad: only on create */}
                {!isEdit && (
                  <View style={styles.cantidadRow}>
                    <Text style={styles.cantidadLabel}>{t('screens.materiales.cantidadLabel')}</Text>
                    <View style={styles.cantidadControls}>
                      <TouchableOpacity
                        style={styles.cantidadBtn}
                        onPress={() => setStockForm(p => ({ ...p, cantidad: String(Math.max(1, (parseInt(p.cantidad) || 1) - 1)) }))}
                      >
                        <Text style={styles.cantidadBtnText}>−</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={styles.cantidadInput}
                        value={stockForm.cantidad}
                        onChangeText={v => setStockForm(p => ({ ...p, cantidad: v.replace(/[^0-9]/g, '') }))}
                        keyboardType="number-pad"
                        textAlign="center"
                      />
                      <TouchableOpacity
                        style={styles.cantidadBtn}
                        onPress={() => setStockForm(p => ({ ...p, cantidad: String(Math.min(50, (parseInt(p.cantidad) || 1) + 1)) }))}
                      >
                        <Text style={styles.cantidadBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setStockModal({ visible: false, editing: null })}>
                <Text style={styles.btnCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={saveStock}>
                <Text style={styles.btnPrimaryText}>
                  {!isEdit && cantidad > 1 ? t('screens.materiales.addMultipleBtn', { count: cantidad }) : t('common.save')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // MODAL: Registrar consumo
  // ═══════════════════════════════════════════════════════════════
  const renderConsumoModal = () => {
    const materialesActivos = stock.filter(e => !e.es_retal && e.metros_disponibles > 0);
    const selEntry = stock.find(e => (e._id || e.id) === consumoForm.stock_id);
    const ancho = parseFloat(consumoForm.ancho_trabajo_cm) || 0;
    const largo = parseFloat(consumoForm.largo_trabajo_m) || 0;
    const aprovechamiento = selEntry && selEntry.ancho_cm > 0 && ancho > 0
      ? Math.round((ancho / selEntry.ancho_cm) * 100) : 0;
    const sobrante_cm = selEntry && ancho > 0 ? Math.max(0, selEntry.ancho_cm - ancho) : 0;
    const suficiente = selEntry ? largo <= selEntry.metros_disponibles : true;
    const showRetal = sobrante_cm > 0 && largo > 0;

    return (
      <Modal visible={consumoModal.visible} transparent animationType="fade" onRequestClose={() => setConsumoModal({ visible: false })}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{t('screens.materiales.registrarConsumo')}</Text>

            <Text style={styles.fieldLabel}>{t('screens.materiales.stockMaterialLabel')}</Text>
            {Platform.OS === 'web' ? (
              <select
                style={styles.fieldSelect}
                value={consumoForm.stock_id}
                onChange={e => setConsumoForm(p => ({ ...p, stock_id: e.target.value }))}
              >
                <option value="">{t('screens.materiales.selectMaterialPlaceholder')}</option>
                {materialesActivos.map((e, i) => (
                  <option key={e._id || e.id || i} value={e._id || e.id}>
                    {e.material_nombre} · {e.fabricante || '—'} · {e.ancho_cm}cm{e.gramaje ? ` · ${e.gramaje}g/m²` : ''} · {e.metros_disponibles?.toFixed(0)}m disp.
                  </option>
                ))}
              </select>
            ) : (
              <TextInput
                style={styles.fieldInput}
                value={consumoForm.stock_id}
                onChangeText={v => setConsumoForm(p => ({ ...p, stock_id: v }))}
                placeholder={t('screens.materiales.stockMaterialLabel')}
                placeholderTextColor="#94A3B8"
              />
            )}

            <Text style={styles.fieldLabel}>{t('screens.materiales.referenciaPedidoLabel')}</Text>
            <TextInput
              style={styles.fieldInput}
              value={consumoForm.pedido_ref}
              onChangeText={v => setConsumoForm(p => ({ ...p, pedido_ref: v }))}
              placeholder={t('screens.materiales.referenciaPedidoEjemplo')}
              placeholderTextColor="#94A3B8"
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>{t('screens.materiales.anchoTrabajoLabel')}</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={consumoForm.ancho_trabajo_cm}
                  onChangeText={v => setConsumoForm(p => ({ ...p, ancho_trabajo_cm: v }))}
                  keyboardType="decimal-pad"
                  placeholder={selEntry ? `máx ${selEntry.ancho_cm} cm` : 'Ej. 54'}
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>{t('screens.materiales.largoTrabajoLabel')}</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={consumoForm.largo_trabajo_m}
                  onChangeText={v => setConsumoForm(p => ({ ...p, largo_trabajo_m: v }))}
                  keyboardType="decimal-pad"
                  placeholder={t('screens.materiales.largoTrabajoEjemplo')}
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* Preview */}
            {selEntry && ancho > 0 && largo > 0 && (
              <View style={styles.consumoPreview}>
                <View style={styles.consumoPreviewRow}>
                  <View style={styles.consumoPreviewItem}>
                    <Text style={styles.consumoPreviewLabel}>{t('screens.materiales.aDescontar')}</Text>
                    <Text style={[styles.consumoPreviewValue, { color: suficiente ? '#388E3C' : '#D32F2F' }]}>
                      {largo.toFixed(1)} m
                    </Text>
                  </View>
                  <View style={styles.consumoPreviewItem}>
                    <Text style={styles.consumoPreviewLabel}>{t('screens.materiales.aprovechamiento')}</Text>
                    <Text style={[styles.consumoPreviewValue, {
                      color: aprovechamiento >= 70 ? '#388E3C' : aprovechamiento >= 40 ? '#F57C00' : '#D32F2F',
                    }]}>
                      {aprovechamiento}%
                    </Text>
                  </View>
                  <View style={styles.consumoPreviewItem}>
                    <Text style={styles.consumoPreviewLabel}>{t('screens.materiales.sobranteAncho')}</Text>
                    <Text style={styles.consumoPreviewValue}>{sobrante_cm.toFixed(0)} cm</Text>
                  </View>
                </View>
                {!suficiente && (
                  <Text style={styles.consumoPreviewWarning}>
                    {t('screens.materiales.stockInsuficiente', { disponible: selEntry.metros_disponibles?.toFixed(1) })}
                  </Text>
                )}
                {showRetal && (
                  <View style={styles.consumoRetalToggle}>
                    <Text style={styles.consumoRetalLabel}>
                      {t('screens.materiales.guardarRetalPregunta', { sobrante: sobrante_cm.toFixed(0), largo: largo.toFixed(1) })}
                    </Text>
                    {Platform.OS === 'web' ? (
                      <input
                        type="checkbox"
                        checked={consumoForm.crear_retal}
                        onChange={e => setConsumoForm(p => ({ ...p, crear_retal: e.target.checked }))}
                        style={{ width: 16, height: 16, cursor: 'pointer', marginLeft: 8 }}
                      />
                    ) : (
                      <TouchableOpacity onPress={() => setConsumoForm(p => ({ ...p, crear_retal: !p.crear_retal }))}>
                        <Text style={{ fontSize: 18, color: consumoForm.crear_retal ? '#1976D2' : '#999', marginLeft: 8 }}>
                          {consumoForm.crear_retal ? 'ON' : 'OFF'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setConsumoModal({ visible: false })}>
                <Text style={styles.btnCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={registrarConsumo}>
                <Text style={styles.btnPrimaryText}>{t('screens.materiales.registrarBtn')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <View style={styles.container}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>{t('nav.materiales')}</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={t('common.search')}
          value={busquedaStock}
          onChangeText={(v) => { setBusquedaStock(v); if (activeTab !== 'stock') changeTab('stock'); }}
          placeholderTextColor="#94A3B8"
        />
        {activeTab === 'resumen' && (
          <TouchableOpacity style={styles.btnHeaderAction} onPress={() => setConsumoModal({ visible: true })}>
            <Text style={styles.btnHeaderActionText}>{t('screens.materiales.registrarConsumo')}</Text>
          </TouchableOpacity>
        )}
        {(activeTab === 'stock' || activeTab === 'catalogo') && (
          <TouchableOpacity
            style={styles.btnHeaderAction}
            onPress={activeTab === 'stock' ? openStockCreate : openCatCreate}
          >
            <Text style={styles.btnHeaderActionText}>{t('screens.materiales.addMaterialBtn')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {['resumen', 'stock', ...(consumoModuloActivo ? ['historial'] : [])].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => changeTab(tab)}
          >
            <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
              {tab === 'resumen' ? t('screens.materiales.tabResumen')
                : tab === 'stock' ? t('screens.materiales.tabStock')
                : t('screens.materiales.tabHistorial')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      {activeTab === 'resumen' && renderResumenTab()}
      {activeTab === 'stock' && renderStockTab()}
      {activeTab === 'historial' && consumoModuloActivo && renderHistorialTab()}

      {/* Modals */}
      {stockModal.visible && renderStockModal()}
      {consumoModal.visible && renderConsumoModal()}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F5FD' },
  pageHeader: {
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
  headerTopRow: { flexDirection: 'row', alignItems: 'center' },
  searchInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4E7ED',
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 13,
    color: '#0F172A',
    maxWidth: 320,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1B4B',
    letterSpacing: -0.3,
  },
  btnHeaderAction: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnHeaderActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7ED',
    paddingHorizontal: 16,
    gap: 4,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#4F46E5',
  },
  tabBtnText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  tabBtnTextActive: { color: '#4F46E5', fontWeight: '700' },

  // Tab content
  tabContent: { flex: 1, padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  loadingText: { textAlign: 'center', color: '#94A3B8', padding: 20 },
  emptyText: { textAlign: 'center', color: '#94A3B8', padding: 24, fontStyle: 'italic' },

  // Filter row
  filterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  filterLabel: { fontSize: 13, color: '#475569', fontWeight: '500' },
  filterSelectWrap: { flex: 1, maxWidth: 260 },
  filterSelect: { width: '100%', height: 32, border: '1px solid #E2E8F0', borderRadius: 10, paddingTop: 4, paddingBottom: 4, paddingLeft: 8, paddingRight: 8, fontSize: 13, backgroundColor: '#F1F5F9', color: '#0F172A', cursor: 'pointer', outlineWidth: 0 },
  filterInput: { height: 32, borderWidth: 1, borderColor: '#DDD', borderRadius: 6, paddingHorizontal: 8, fontSize: 13, backgroundColor: '#FFF' },

  // Table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#ECEFFE',
    borderWidth: 1,
    borderColor: '#D9DBFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
    minHeight: 40,
    alignItems: 'center',
  },
  th: { fontSize: 11, fontWeight: '700', color: '#4F46E5', letterSpacing: 0.5, textAlign: 'center' },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 3,
    shadowColor: '#1E1B4B',
    shadowOpacity: 0.03,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  td: { fontSize: 13, color: '#0F172A', paddingRight: 8, textAlign: 'center' },
  tdActions: { flexDirection: 'row', gap: 6, justifyContent: 'flex-end' },

  // Expanded row (fabricantes)
  expandedRow: {
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
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

  // Stock dot indicator
  stockDot: { width: 8, height: 8, borderRadius: 4 },

  // Stock info panel (read-only in edit modal)
  stockInfoRow: {
    flexDirection: 'row',
    backgroundColor: '#F5F8FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D0DDF7',
    padding: 12,
    marginTop: 10,
    gap: 4,
  },
  stockInfoItem: { flex: 1, alignItems: 'center' },
  stockInfoLabel: { fontSize: 11, color: '#888', fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  stockInfoValue: { fontSize: 18, fontWeight: '700', color: '#222' },
  stockInfoHint: { fontSize: 11, color: '#94A3B8', fontStyle: 'italic', marginTop: 6, textAlign: 'center' },

  // Action buttons — mismo patrón que ClientesScreen/MachinasScreen/TroquelessScreen
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

  // Primary/secondary buttons
  btnPrimary: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  btnPrimaryText: { color: '#4F46E5', fontWeight: '600', fontSize: 13 },
  btnCancel: {
    backgroundColor: 'transparent',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  btnCancelText: { color: '#64748B', fontWeight: '600', fontSize: 13 },
  btnSecondarySmall: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: 'transparent',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  btnSecondarySmallText: { color: '#475569', fontSize: 12, fontWeight: '600' },

  // Pagination
  paginationRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, padding: 16 },
  paginationBtn: { backgroundColor: '#4F46E5', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  paginationBtnDisabled: { backgroundColor: '#C7D2FE' },
  paginationBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  paginationInfo: { fontSize: 12, fontWeight: '700', color: '#4F46E5' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 24,
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    overflow: 'scroll',
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A2E', marginBottom: 18 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 20 },

  // Form fields in modal
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 5, marginTop: 10 },
  fieldLabelSmall: { fontSize: 12, color: '#888' },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#FAFAFA',
  },
  fieldSelect: {
    width: '100%',
    height: 36,
    border: '1px solid #E2E8F0',
    borderRadius: 10,
    paddingTop: 4, paddingBottom: 4, paddingLeft: 8, paddingRight: 8,
    fontSize: 13,
    backgroundColor: '#F1F5F9',
    color: '#0F172A',
    cursor: 'pointer',
    outlineWidth: 0,
  },

  // Fabricante edit rows
  fabEditRow: {
    backgroundColor: '#F9F9FF',
    borderWidth: 1,
    borderColor: '#E0E4F0',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  fabEditHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  fabEditName: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  removeText: { fontSize: 12, color: '#DC2626' },
  anchosEditRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 6 },
  anchoChipEdit: { backgroundColor: '#E8EAF6', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  anchoChipEditText: { fontSize: 12, color: '#3949AB' },
  addAnchoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  anchoInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 12,
    width: 90,
    backgroundColor: '#FFF',
  },
  addFabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },

  // ── Alertas de stock ────────────────────────────────────────────────────
  alertasCard: {
    backgroundColor: '#FFFBFB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#FDE8E8',
  },
  alertasTitle: { fontSize: 12, fontWeight: '700', color: '#B91C1C', marginBottom: 8, letterSpacing: 0.4, textTransform: 'uppercase' },
  alertaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FDF2F2',
  },
  alertaDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  alertaNombre: { flex: 1, fontSize: 13, color: '#0F172A', fontWeight: '500' },
  alertaPct: { fontSize: 13, fontWeight: '700', width: 38, textAlign: 'right' },
  alertaBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  alertaBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },

  // ── Stock filter pills ───────────────────────────────────────────────────
  stockFilterRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' },
  stockFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D9DBFF',
    backgroundColor: '#F8FAFC',
  },
  stockFilterPillActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  stockFilterPillText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  stockFilterPillTextActive: { color: '#FFFFFF' },

  // ── Sortable th ─────────────────────────────────────────────────────────
  thSortable: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  thSortIcon: { fontSize: 9, color: '#7C7FD0' },

  // ── Historial filter bar ─────────────────────────────────────────────────
  historialFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  historialSearchInput: {
    flex: 1,
    minWidth: 160,
    maxWidth: 260,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4E7ED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 13,
    color: '#0F172A',
  },
  periodoPills: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  periodoPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D9DBFF',
    backgroundColor: '#F8FAFC',
  },
  periodoPillActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  periodoPillText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  periodoPillTextActive: { color: '#FFFFFF' },

  // ── Historial footer total ───────────────────────────────────────────────
  historialFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 6,
    marginBottom: 8,
    borderTopWidth: 1.5,
    borderTopColor: '#D9DBFF',
    backgroundColor: '#ECEFFE',
    borderRadius: 8,
  },
  historialFooterLabel: { fontSize: 12, color: '#4F46E5', fontWeight: '600' },
  historialFooterValue: { fontSize: 15, color: '#1E1B4B', fontWeight: '800' },

  // ── Resumen tab ─────────────────────────────────────────────────────────
  chartCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8EDF2',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  chartTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 18 },
  resumenSectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#444',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },

  // Roll cards
  rollCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rollCardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  rollCardTitle: { fontSize: 14, fontWeight: '700', color: '#222' },
  rollCardSub: { fontSize: 12, color: '#888', marginTop: 2 },
  rollCardBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8 },
  rollCardDot: { width: 10, height: 10, borderRadius: 5 },
  rollCardPct: { fontSize: 14, fontWeight: '700' },
  rollCardMetros: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  rollCardMetrosText: { fontSize: 13 },
  rollCardDate: { fontSize: 11, color: '#94A3B8' },

  // Progress bar
  progressBarBg: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: { height: 8, borderRadius: 6 },

  // Retales grid
  retalesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  retalCard: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FFE0B2',
    borderRadius: 10,
    padding: 12,
    minWidth: 140,
    flex: 1,
    maxWidth: 200,
  },
  retalBadge: {
    backgroundColor: '#FF9800',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  retalBadgeText: { fontSize: 10, color: '#FFF', fontWeight: '700', letterSpacing: 0.5 },
  retalMaterial: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  retalDimensions: { fontSize: 12, color: '#475569', marginBottom: 2 },
  retalOrigen: { fontSize: 11, color: '#94A3B8', marginBottom: 4 },
  retalPct: { fontSize: 12, fontWeight: '700', marginTop: 4, textAlign: 'right' },

  // Consumo preview panel
  consumoPreview: {
    backgroundColor: '#F0F7FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBDEFB',
    padding: 12,
    marginTop: 14,
  },
  consumoPreviewRow: { flexDirection: 'row', gap: 4 },
  consumoPreviewItem: { flex: 1, alignItems: 'center' },
  consumoPreviewLabel: { fontSize: 10, color: '#888', fontWeight: '600', textTransform: 'uppercase', marginBottom: 3 },
  consumoPreviewValue: { fontSize: 20, fontWeight: '700', color: '#222' },
  consumoPreviewWarning: {
    marginTop: 8, fontSize: 12, color: '#DC2626', fontWeight: '600', textAlign: 'center',
  },
  consumoRetalToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#BBDEFB',
  },
  consumoRetalLabel: { fontSize: 13, color: '#1565C0', fontWeight: '500' },

  // Cantidad controls (multi-roll creation)
  cantidadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cantidadLabel: { fontSize: 13, fontWeight: '600', color: '#475569' },
  cantidadControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cantidadBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cantidadBtnText: { fontSize: 18, color: '#1565C0', fontWeight: '700', lineHeight: 22 },
  cantidadInput: {
    width: 48,
    height: 32,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 6,
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    backgroundColor: '#FAFAFA',
  },

  // Proveedores tab
  provCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  provCardMain: { flexDirection: 'row', alignItems: 'flex-start' },
  provCardNombre: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 3 },
  provCardMeta: { fontSize: 12, color: '#475569', marginBottom: 4 },
  provCardRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 3 },
  provCardChip: { fontSize: 12, color: '#1976D2', backgroundColor: '#E3F2FD', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  provCardNotas: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic', marginTop: 4 },
});

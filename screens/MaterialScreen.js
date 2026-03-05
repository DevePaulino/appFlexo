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
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Color palette for per-material chart bars
const MATERIAL_COLORS = [
  '#1976D2', '#E53935', '#43A047', '#FB8C00', '#8E24AA',
  '#00ACC1', '#D81B60', '#6D4C41', '#546E7A', '#C0CA33',
];

const API_BASE = 'http://localhost:8080';

export default function MaterialScreen({ currentUser }) {
  // ── Tabs ─────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('catalogo'); // 'catalogo' | 'stock' | 'historial'

  useEffect(() => {
    AsyncStorage.getItem('MaterialScreen_activeTab')
      .then(v => { if (v) setActiveTab(v); })
      .catch(() => {});
  }, []);

  const changeTab = useCallback((tab) => {
    setActiveTab(tab);
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

  // ── Consumo modal ─────────────────────────────────────────────────────────
  const [consumoModal, setConsumoModal] = useState({ visible: false });
  const [consumoForm, setConsumoForm] = useState({
    stock_id: '', pedido_ref: '', ancho_trabajo_cm: '', largo_trabajo_m: '', crear_retal: false,
  });

  // ── Proveedores ───────────────────────────────────────────────────────────
  const [proveedores, setProveedores] = useState([]);
  const [loadingProveedores, setLoadingProveedores] = useState(false);
  const [provModal, setProvModal] = useState({ visible: false, editing: null });
  const [provForm, setProvForm] = useState({ nombre: '', contacto: '', telefono: '', email: '', notas: '' });

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
      const resp = await fetch(`${API_BASE}/api/materiales/consumos?page=${page}&limit=50`, { headers: authHeaders() });
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
  }, [authHeaders]);

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

  // Load on focus
  useFocusEffect(
    React.useCallback(() => {
      if (activeTab === 'resumen' || activeTab === 'stock') loadStock();
      if (activeTab === 'catalogo') loadCatalogo();
      if (activeTab === 'historial') loadConsumos(1);
      if (activeTab === 'proveedores') loadProveedores();
    }, [activeTab, loadCatalogo, loadStock, loadConsumos, loadProveedores])
  );

  // Load when tab changes
  useEffect(() => {
    if (activeTab === 'resumen' || activeTab === 'stock') loadStock();
    else if (activeTab === 'catalogo') loadCatalogo();
    else if (activeTab === 'historial') loadConsumos(1);
    else if (activeTab === 'proveedores') loadProveedores();
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
    if (!nombre) return alert('El nombre del material es obligatorio.');
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
      if (!resp.ok) return alert(data.error || 'Error guardando material');
      setCatModal({ visible: false, editing: null });
      loadCatalogo();
    } catch (e) {
      alert('Error de conexión');
    }
  };

  const deleteCatalogo = async (mat) => {
    if (!window.confirm(`¿Eliminar el material "${mat.nombre}"?`)) return;
    try {
      const resp = await fetch(`${API_BASE}/api/materiales/catalogo/${mat._id || mat.id}`, {
        method: 'DELETE', headers: authHeaders(),
      });
      if (resp.ok) loadCatalogo();
      else {
        const d = await resp.json();
        alert(d.error || 'Error eliminando');
      }
    } catch (e) {
      alert('Error de conexión');
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
        if (!nombre) return alert('El nombre del material es obligatorio');
        if (isNaN(ancho) || ancho <= 0) return alert('Ancho inválido');
        if (isNaN(metros) || metros <= 0) return alert('Metros debe ser > 0');
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
          if (!resp.ok) return alert(data.error || 'Error actualizando stock');
          setStockModal({ visible: false, editing: null });
          loadStock();
        } catch (e) {
          alert('Error de conexión');
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
          if (!resp.ok) return alert(data.error || 'Error actualizando stock');
          setStockModal({ visible: false, editing: null });
          loadStock();
        } catch (e) {
          alert('Error de conexión');
        }
      }
    } else {
      // Create: loop cantidad times
      const nombre = stockForm.material_nombre.trim();
      const ancho = parseFloat(stockForm.ancho_cm);
      const metros = parseFloat(stockForm.metros_total);
      const cantidad = Math.max(1, Math.min(50, parseInt(stockForm.cantidad) || 1));
      if (!nombre) return alert('El material es obligatorio');
      if (isNaN(ancho) || ancho <= 0) return alert('Ancho inválido');
      if (isNaN(metros) || metros <= 0) return alert('Metros debe ser > 0');
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
          if (!resp.ok) return alert(data.error || `Error creando material ${i + 1}`);
        }
        setStockModal({ visible: false, editing: null });
        loadStock();
      } catch (e) {
        alert('Error de conexión');
      }
    }
  };

  const deleteStock = async (entry) => {
    if (!window.confirm(`¿Eliminar esta entrada de stock (${entry.material_nombre} · ${entry.fabricante} · ${entry.ancho_cm} cm)?`)) return;
    try {
      const resp = await fetch(`${API_BASE}/api/materiales/stock/${entry._id || entry.id}`, {
        method: 'DELETE', headers: authHeaders(),
      });
      if (resp.ok) loadStock();
      else {
        const d = await resp.json();
        alert(d.error || 'Error eliminando');
      }
    } catch (e) {
      alert('Error de conexión');
    }
  };

  // ── Proveedores CRUD ─────────────────────────────────────────────────────

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
    if (!nombre) return alert('El nombre del proveedor es obligatorio');
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
      if (!resp.ok) return alert(data.error || 'Error guardando proveedor');
      setProvModal({ visible: false, editing: null });
      loadProveedores();
    } catch (e) {
      alert('Error de conexión');
    }
  };

  const deleteProveedor = async (prov) => {
    if (!window.confirm(`¿Eliminar el proveedor "${prov.nombre}"?`)) return;
    try {
      const resp = await fetch(`${API_BASE}/api/materiales/proveedores/${prov._id || prov.id}`, {
        method: 'DELETE', headers: authHeaders(),
      });
      if (resp.ok) loadProveedores();
      else {
        const d = await resp.json();
        alert(d.error || 'Error eliminando');
      }
    } catch (e) {
      alert('Error de conexión');
    }
  };

  // ── Consumo ───────────────────────────────────────────────────────────────

  const registrarConsumo = async () => {
    const { stock_id, pedido_ref, ancho_trabajo_cm, largo_trabajo_m, crear_retal } = consumoForm;
    const ancho = parseFloat(ancho_trabajo_cm);
    const largo = parseFloat(largo_trabajo_m);
    if (!stock_id) return alert('Selecciona una entrada de stock');
    if (isNaN(ancho) || ancho <= 0) return alert('El ancho del trabajo debe ser > 0');
    if (isNaN(largo) || largo <= 0) return alert('El largo del trabajo debe ser > 0');
    const entry = stock.find(e => (e._id || e.id) === stock_id);
    if (entry && ancho > entry.ancho_cm) return alert(`El ancho (${ancho} cm) supera el del material (${entry.ancho_cm} cm)`);
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
      if (!resp.ok) return alert(data.error || 'Error registrando consumo');
      setConsumoModal({ visible: false });
      setConsumoForm({ stock_id: '', pedido_ref: '', ancho_trabajo_cm: '', largo_trabajo_m: '', crear_retal: false });
      loadStock();
      if (activeTab === 'historial') loadConsumos(1);
    } catch (e) {
      alert('Error de conexión');
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

    return (
      <ScrollView style={styles.tabContent}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Resumen de stock</Text>
          <TouchableOpacity style={styles.btnPrimary} onPress={() => setConsumoModal({ visible: true })}>
            <Text style={styles.btnPrimaryText}>+ Registrar consumo</Text>
          </TouchableOpacity>
        </View>

        {loadingStock && <Text style={styles.loadingText}>Cargando...</Text>}

        {/* ── Material stock chart ──────────────────────── */}
        {chartData.length > 0 && Platform.OS === 'web' && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Metros por material</Text>
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
                    <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '500' }}>{total.toFixed(0)} m total</Text>
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
                      {'  disponible'}
                    </Text>
                    {entry.retales > 0 && (
                      <Text style={{ fontSize: 12, color: '#374151' }}>
                        <Text style={{ color: '#F59E0B', fontWeight: '700' }}>{entry.retales.toFixed(0)} m</Text>
                        {'  retales'}
                      </Text>
                    )}
                    <Text style={{ fontSize: 12, color: '#374151' }}>
                      <Text style={{ color: '#9CA3AF', fontWeight: '700' }}>{entry.consumido.toFixed(0)} m</Text>
                      {'  consumido'}
                    </Text>
                  </View>
                </View>
              );
            })}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F0F2F5' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#1976D2', marginRight: 5 }} />
                <Text style={{ fontSize: 11, color: '#6B7280' }}>Disponible</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#FFB300', marginRight: 5 }} />
                <Text style={{ fontSize: 11, color: '#6B7280' }}>Retales</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#E9EDF2', borderWidth: 1, borderColor: '#CBD5E0', marginRight: 5 }} />
                <Text style={{ fontSize: 11, color: '#6B7280' }}>Consumido</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Materiales activos ──────────────────────────────── */}
        <Text style={styles.resumenSectionHeader}>
          Materiales activos ({materialesActivos.length})
        </Text>
        {materialesActivos.length === 0 && !loadingStock && (
          <Text style={styles.emptyText}>Sin materiales en stock.</Text>
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
          Retales disponibles ({retales.length})
        </Text>
        {retales.length === 0 && (
          <Text style={styles.emptyText}>Sin retales guardados.</Text>
        )}
        <View style={styles.retalesGrid}>
          {retales.map((entry, idx) => {
            const pct = entry.metros_total > 0 ? Math.round((entry.metros_disponibles / entry.metros_total) * 100) : 0;
            const color = stockColor(entry);
            return (
              <View key={entry._id || entry.id || idx} style={styles.retalCard}>
                <View style={styles.retalBadge}><Text style={styles.retalBadgeText}>RETAL</Text></View>
                <Text style={styles.retalMaterial}>{entry.material_nombre}</Text>
                <Text style={styles.retalDimensions}>{entry.ancho_cm} cm × {entry.metros_disponibles?.toFixed(1)} m</Text>
                {entry.retal_origen_pedido ? (
                  <Text style={styles.retalOrigen}>Ped. {entry.retal_origen_pedido.slice(0, 8)}</Text>
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
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Catálogo de Materiales</Text>
        <TouchableOpacity style={styles.btnPrimary} onPress={openCatCreate}>
          <Text style={styles.btnPrimaryText}>+ Añadir material</Text>
        </TouchableOpacity>
      </View>

      {loadingCatalogo && <Text style={styles.loadingText}>Cargando...</Text>}

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.th, { flex: 2 }]}>Material</Text>
        <Text style={[styles.th, { flex: 3 }]}>Fabricantes</Text>
        <Text style={[styles.th, { width: 100 }]}>Acciones</Text>
      </View>

      {catalogo.length === 0 && !loadingCatalogo && (
        <Text style={styles.emptyText}>No hay materiales configurados.</Text>
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
                ? 'Sin fabricantes'
                : (mat.fabricantes || []).map(f => f.nombre).join(', ')}
            </Text>
            <View style={[styles.tdActions, { width: 100 }]}>
              <TouchableOpacity style={styles.actionBtnSmall} onPress={() => openCatEdit(mat)}>
                <Text style={styles.actionBtnSmallText}>✎</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtnSmall, styles.actionBtnDanger]} onPress={() => deleteCatalogo(mat)}>
                <Text style={styles.actionBtnSmallText}>✕</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {/* Expanded: fabricantes and anchos */}
          {expandedMat === mat._id && (
            <View style={styles.expandedRow}>
              {(mat.fabricantes || []).length === 0 ? (
                <Text style={styles.expandedEmpty}>Sin fabricantes registrados. Edita el material para añadir.</Text>
              ) : (
                (mat.fabricantes || []).map((fab, fabIdx) => (
                  <View key={fab.id || `fab-${matIdx}-${fabIdx}`} style={styles.fabRow}>
                    <Text style={styles.fabNombre}>{fab.nombre}</Text>
                    <View style={styles.anchosRow}>
                      {(fab.anchos_cm || []).length === 0
                        ? <Text style={styles.anchosEmpty}>Sin anchos definidos</Text>
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
    </ScrollView>
  );

  const renderStockTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Stock de Materiales</Text>
        <TouchableOpacity style={styles.btnPrimary} onPress={openStockCreate}>
          <Text style={styles.btnPrimaryText}>+ Añadir material</Text>
        </TouchableOpacity>
      </View>

      {/* Filter */}
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Filtrar por material:</Text>
        <View style={styles.filterSelectWrap}>
          {Platform.OS === 'web' ? (
            <select
              style={styles.filterSelect}
              value={stockFilter}
              onChange={e => setStockFilter(e.target.value)}
            >
              <option value="">Todos</option>
              {catalogoNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          ) : (
            <TextInput
              style={styles.filterInput}
              value={stockFilter}
              onChangeText={setStockFilter}
              placeholder="Nombre material..."
            />
          )}
        </View>
      </View>

      {loadingStock && <Text style={styles.loadingText}>Cargando...</Text>}

      {/* Table Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.th, { flex: 2 }]}>Material</Text>
        <Text style={[styles.th, { flex: 1.5 }]}>Fabricante</Text>
        <Text style={[styles.th, { width: 70 }]}>Ancho</Text>
        <Text style={[styles.th, { width: 65 }]}>g/m²</Text>
        <Text style={[styles.th, { width: 80 }]}>Total (m)</Text>
        <Text style={[styles.th, { width: 90 }]}>Disp. (m)</Text>
        <Text style={[styles.th, { width: 40 }]}>%</Text>
        <Text style={[styles.th, { flex: 1 }]}>Lote</Text>
        <Text style={[styles.th, { width: 90 }]}>Entrada</Text>
        <Text style={[styles.th, { width: 100 }]}>Acciones</Text>
      </View>

      {stock.length === 0 && !loadingStock && (
        <Text style={styles.emptyText}>No hay entradas de stock. Añade un material para empezar.</Text>
      )}

      {stock.map((entry, idx) => {
        const pct = entry.metros_total > 0 ? Math.round((entry.metros_disponibles / entry.metros_total) * 100) : 0;
        const color = stockColor(entry);
        return (
          <View key={entry._id || entry.id || idx} style={styles.tableRow}>
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
            <View style={[styles.tdActions, { width: 100 }]}>
              <TouchableOpacity style={styles.actionBtnSmall} onPress={() => openStockEdit(entry)}>
                <Text style={styles.actionBtnSmallText}>✎</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtnSmall, styles.actionBtnDanger]} onPress={() => deleteStock(entry)}>
                <Text style={styles.actionBtnSmallText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );

  const renderHistorialTab = () => {
    const totalPages = Math.max(1, Math.ceil(consumosTotal / 50));
    return (
      <ScrollView style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Historial de consumos</Text>

        {loadingConsumos && <Text style={styles.loadingText}>Cargando...</Text>}

        <View style={styles.tableHeader}>
          <Text style={[styles.th, { width: 80 }]}>Pedido</Text>
          <Text style={[styles.th, { flex: 2 }]}>Material</Text>
          <Text style={[styles.th, { flex: 1.5 }]}>Fabricante</Text>
          <Text style={[styles.th, { width: 70 }]}>Ancho</Text>
          <Text style={[styles.th, { width: 90 }]}>Consumido</Text>
          <Text style={[styles.th, { width: 90 }]}>Sobrante</Text>
          <Text style={[styles.th, { width: 90 }]}>Fecha</Text>
        </View>

        {consumos.length === 0 && !loadingConsumos && (
          <Text style={styles.emptyText}>No hay consumos registrados.</Text>
        )}

        {consumos.map((c, idx) => (
          <View key={c._id || c.id || idx} style={styles.tableRow}>
            <Text style={[styles.td, { width: 80, fontWeight: '600', color: '#1976D2' }]}>#{c.numero_pedido || c.pedido_id}</Text>
            <Text style={[styles.td, { flex: 2 }]}>{c.material_nombre}</Text>
            <Text style={[styles.td, { flex: 1.5, color: '#555' }]}>{c.fabricante || '—'}</Text>
            <Text style={[styles.td, { width: 70 }]}>{c.ancho_cm} cm</Text>
            <Text style={[styles.td, { width: 90, fontWeight: '600', color: '#D32F2F' }]}>{c.metros_consumidos?.toFixed(2)} m</Text>
            <Text style={[styles.td, { width: 90, color: '#388E3C' }]}>{c.metros_sobrante?.toFixed(2)} m</Text>
            <Text style={[styles.td, { width: 90, color: '#888', fontSize: 11 }]}>{formatDate(c.fecha)}</Text>
          </View>
        ))}

        {totalPages > 1 && (
          <View style={styles.paginationRow}>
            <TouchableOpacity
              style={[styles.paginationBtn, consumosPage <= 1 && styles.paginationBtnDisabled]}
              disabled={consumosPage <= 1}
              onPress={() => loadConsumos(consumosPage - 1)}
            >
              <Text style={styles.paginationBtnText}>← Anterior</Text>
            </TouchableOpacity>
            <Text style={styles.paginationInfo}>Página {consumosPage} de {totalPages}</Text>
            <TouchableOpacity
              style={[styles.paginationBtn, consumosPage >= totalPages && styles.paginationBtnDisabled]}
              disabled={consumosPage >= totalPages}
              onPress={() => loadConsumos(consumosPage + 1)}
            >
              <Text style={styles.paginationBtnText}>Siguiente →</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderProveedoresTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Proveedores</Text>
        <TouchableOpacity style={styles.btnPrimary} onPress={openProvCreate}>
          <Text style={styles.btnPrimaryText}>+ Añadir proveedor</Text>
        </TouchableOpacity>
      </View>

      {loadingProveedores && <Text style={styles.loadingText}>Cargando...</Text>}

      {proveedores.length === 0 && !loadingProveedores && (
        <Text style={styles.emptyText}>No hay proveedores registrados.</Text>
      )}

      {proveedores.map((prov, idx) => (
        <View key={prov._id || prov.id || idx} style={styles.provCard}>
          <View style={styles.provCardMain}>
            <View style={{ flex: 1 }}>
              <Text style={styles.provCardNombre}>{prov.nombre}</Text>
              {prov.contacto ? <Text style={styles.provCardMeta}>Contacto: {prov.contacto}</Text> : null}
              <View style={styles.provCardRow}>
                {prov.telefono ? <Text style={styles.provCardChip}>📞 {prov.telefono}</Text> : null}
                {prov.email ? <Text style={styles.provCardChip}>✉ {prov.email}</Text> : null}
              </View>
              {prov.notas ? <Text style={styles.provCardNotas}>{prov.notas}</Text> : null}
            </View>
            <View style={styles.tdActions}>
              <TouchableOpacity style={styles.actionBtnSmall} onPress={() => openProvEdit(prov)}>
                <Text style={styles.actionBtnSmallText}>✎</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtnSmall, styles.actionBtnDanger]} onPress={() => deleteProveedor(prov)}>
                <Text style={styles.actionBtnSmallText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  // ═══════════════════════════════════════════════════════════════
  // MODAL: Catálogo crear/editar
  // ═══════════════════════════════════════════════════════════════
  const renderCatModal = () => (
    <Modal visible={catModal.visible} transparent animationType="fade" onRequestClose={() => setCatModal({ visible: false, editing: null })}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>{catModal.editing ? 'Editar material' : 'Nuevo material'}</Text>

          <Text style={styles.fieldLabel}>Nombre del material *</Text>
          <TextInput
            style={styles.fieldInput}
            value={catNombre}
            onChangeText={setCatNombre}
            placeholder="Ej. Polipropileno"
            autoFocus
          />

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Proveedores</Text>
          {catFabricantes.map((fab, fabIdx) => (
            <View key={fab.id || `new-fab-${fabIdx}`} style={styles.fabEditRow}>
              <View style={styles.fabEditHeader}>
                <Text style={styles.fabEditName}>{fab.nombre}</Text>
                <TouchableOpacity onPress={() => removeFabricante(fab.id)}>
                  <Text style={styles.removeText}>✕ Eliminar</Text>
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
                  placeholder="Ancho cm"
                  keyboardType="decimal-pad"
                />
                <TouchableOpacity style={styles.btnSecondarySmall} onPress={() => addAncho(fab.id)}>
                  <Text style={styles.btnSecondarySmallText}>+ Ancho</Text>
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
                <option value="">Seleccionar proveedor...</option>
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
                placeholder="Nombre proveedor"
              />
            )}
            <TouchableOpacity style={styles.btnSecondarySmall} onPress={addFabricante}>
              <Text style={styles.btnSecondarySmallText}>Añadir</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnSecondarySmall, { marginLeft: 6 }]} onPress={openProvCreate}>
              <Text style={styles.btnSecondarySmallText}>+ Proveedor</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.btnCancel} onPress={() => setCatModal({ visible: false, editing: null })}>
              <Text style={styles.btnCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnPrimary} onPress={saveCatalogo}>
              <Text style={styles.btnPrimaryText}>Guardar</Text>
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
        <Text style={styles.fieldLabel}>Material *</Text>
        {Platform.OS === 'web' ? (
          <select
            style={styles.fieldSelect}
            value={stockForm.material_nombre}
            onChange={e => setStockForm(p => ({ ...p, material_nombre: e.target.value, fabricante: '' }))}
          >
            <option value="">Seleccionar material...</option>
            {catalogoNames.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        ) : (
          <TextInput
            style={styles.fieldInput}
            value={stockForm.material_nombre}
            onChangeText={v => setStockForm(p => ({ ...p, material_nombre: v }))}
            placeholder="Nombre del material"
          />
        )}

        <Text style={styles.fieldLabel}>Fabricante / Proveedor</Text>
        {Platform.OS === 'web' && proveedores.length > 0 ? (
          <select
            style={styles.fieldSelect}
            value={stockForm.fabricante}
            onChange={e => setStockForm(p => ({ ...p, fabricante: e.target.value }))}
          >
            <option value="">Sin especificar</option>
            {proveedores.map((p, i) => <option key={p._id || p.id || i} value={p.nombre}>{p.nombre}</option>)}
          </select>
        ) : Platform.OS === 'web' && fabriOptions.length > 0 ? (
          <select
            style={styles.fieldSelect}
            value={stockForm.fabricante}
            onChange={e => setStockForm(p => ({ ...p, fabricante: e.target.value }))}
          >
            <option value="">Sin especificar</option>
            {fabriOptions.map((f, fIdx) => <option key={f.id || f.nombre || fIdx} value={f.nombre}>{f.nombre}</option>)}
          </select>
        ) : (
          <TextInput
            style={styles.fieldInput}
            value={stockForm.fabricante}
            onChangeText={v => setStockForm(p => ({ ...p, fabricante: v }))}
            placeholder="Nombre del fabricante"
          />
        )}

        <Text style={styles.fieldLabel}>Ancho (cm) *</Text>
        {Platform.OS === 'web' &&
          fabriOptions.length > 0 &&
          (catalogo.find(m => m.nombre === stockForm.material_nombre)?.fabricantes || [])
            .find(f => f.nombre === stockForm.fabricante)?.anchos_cm?.length > 0 ? (
          <select
            style={styles.fieldSelect}
            value={stockForm.ancho_cm}
            onChange={e => setStockForm(p => ({ ...p, ancho_cm: e.target.value }))}
          >
            <option value="">Seleccionar ancho...</option>
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
            placeholder="Ej. 33"
          />
        )}

        <Text style={styles.fieldLabel}>Gramaje (g/m²)</Text>
        <TextInput
          style={styles.fieldInput}
          value={stockForm.gramaje}
          onChangeText={v => setStockForm(p => ({ ...p, gramaje: v }))}
          keyboardType="decimal-pad"
          placeholder="Ej. 80"
        />

        <Text style={styles.fieldLabel}>Metros totales *</Text>
        <TextInput
          style={styles.fieldInput}
          value={stockForm.metros_total}
          onChangeText={v => setStockForm(p => ({ ...p, metros_total: v }))}
          keyboardType="decimal-pad"
          placeholder="Ej. 5000"
        />

        <Text style={styles.fieldLabel}>Número de lote</Text>
        <TextInput
          style={styles.fieldInput}
          value={stockForm.numero_lote}
          onChangeText={v => setStockForm(p => ({ ...p, numero_lote: v }))}
          placeholder="Ej. LOT-2026-001"
        />

        <Text style={styles.fieldLabel}>Notas</Text>
        <TextInput
          style={[styles.fieldInput, { minHeight: 50 }]}
          value={stockForm.notas}
          onChangeText={v => setStockForm(p => ({ ...p, notas: v }))}
          multiline
          placeholder="Observaciones..."
        />
      </>
    );

    return (
      <Modal visible={stockModal.visible} transparent animationType="fade" onRequestClose={() => setStockModal({ visible: false, editing: null })}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {isEdit ? (isVirgin ? 'Editar material (sin consumo)' : 'Editar entrada de stock') : 'Añadir material al stock'}
            </Text>

            {isEdit && !isVirgin ? (
              /* Consumed roll: read-only info + notas only */
              <>
                <Text style={styles.fieldLabel}>
                  {stockModal.editing?.material_nombre} · {stockModal.editing?.fabricante} · {stockModal.editing?.ancho_cm} cm
                </Text>
                <Text style={styles.fieldLabelSmall}>Lote: {stockModal.editing?.numero_lote || '—'}</Text>
                <View style={styles.stockInfoRow}>
                  <View style={styles.stockInfoItem}>
                    <Text style={styles.stockInfoLabel}>Total (m)</Text>
                    <Text style={styles.stockInfoValue}>{stockModal.editing?.metros_total?.toFixed(1)}</Text>
                  </View>
                  <View style={styles.stockInfoItem}>
                    <Text style={styles.stockInfoLabel}>Disponible (m)</Text>
                    <Text style={[styles.stockInfoValue, { color: stockColor(stockModal.editing || {}) }]}>
                      {stockModal.editing?.metros_disponibles?.toFixed(1)}
                    </Text>
                  </View>
                  <View style={styles.stockInfoItem}>
                    <Text style={styles.stockInfoLabel}>Consumido (m)</Text>
                    <Text style={styles.stockInfoValue}>
                      {((stockModal.editing?.metros_total || 0) - (stockModal.editing?.metros_disponibles || 0)).toFixed(1)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.stockInfoHint}>El stock disponible se actualiza automáticamente al registrar consumos en pedidos.</Text>
                <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Notas</Text>
                <TextInput
                  style={[styles.fieldInput, { minHeight: 60 }]}
                  value={stockEditNotas}
                  onChangeText={setStockEditNotas}
                  multiline
                  placeholder="Observaciones sobre este material..."
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
                    <Text style={styles.cantidadLabel}>Cantidad de materiales iguales</Text>
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
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={saveStock}>
                <Text style={styles.btnPrimaryText}>
                  {!isEdit && cantidad > 1 ? `Añadir ${cantidad} materiales` : 'Guardar'}
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
            <Text style={styles.modalTitle}>Registrar consumo</Text>

            <Text style={styles.fieldLabel}>Material de stock *</Text>
            {Platform.OS === 'web' ? (
              <select
                style={styles.fieldSelect}
                value={consumoForm.stock_id}
                onChange={e => setConsumoForm(p => ({ ...p, stock_id: e.target.value }))}
              >
                <option value="">Seleccionar material...</option>
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
                placeholder="ID del stock"
              />
            )}

            <Text style={styles.fieldLabel}>Referencia pedido</Text>
            <TextInput
              style={styles.fieldInput}
              value={consumoForm.pedido_ref}
              onChangeText={v => setConsumoForm(p => ({ ...p, pedido_ref: v }))}
              placeholder="Ej. #2026-045 (opcional)"
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Ancho trabajo (cm) *</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={consumoForm.ancho_trabajo_cm}
                  onChangeText={v => setConsumoForm(p => ({ ...p, ancho_trabajo_cm: v }))}
                  keyboardType="decimal-pad"
                  placeholder={selEntry ? `máx ${selEntry.ancho_cm} cm` : 'Ej. 54'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Largo trabajo (m) *</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={consumoForm.largo_trabajo_m}
                  onChangeText={v => setConsumoForm(p => ({ ...p, largo_trabajo_m: v }))}
                  keyboardType="decimal-pad"
                  placeholder="Ej. 10"
                />
              </View>
            </View>

            {/* Preview */}
            {selEntry && ancho > 0 && largo > 0 && (
              <View style={styles.consumoPreview}>
                <View style={styles.consumoPreviewRow}>
                  <View style={styles.consumoPreviewItem}>
                    <Text style={styles.consumoPreviewLabel}>A descontar</Text>
                    <Text style={[styles.consumoPreviewValue, { color: suficiente ? '#388E3C' : '#D32F2F' }]}>
                      {largo.toFixed(1)} m
                    </Text>
                  </View>
                  <View style={styles.consumoPreviewItem}>
                    <Text style={styles.consumoPreviewLabel}>Aprovechamiento</Text>
                    <Text style={[styles.consumoPreviewValue, {
                      color: aprovechamiento >= 70 ? '#388E3C' : aprovechamiento >= 40 ? '#F57C00' : '#D32F2F',
                    }]}>
                      {aprovechamiento}%
                    </Text>
                  </View>
                  <View style={styles.consumoPreviewItem}>
                    <Text style={styles.consumoPreviewLabel}>Sobrante ancho</Text>
                    <Text style={styles.consumoPreviewValue}>{sobrante_cm.toFixed(0)} cm</Text>
                  </View>
                </View>
                {!suficiente && (
                  <Text style={styles.consumoPreviewWarning}>
                    ⚠ Stock insuficiente: disponible {selEntry.metros_disponibles?.toFixed(1)} m
                  </Text>
                )}
                {showRetal && (
                  <View style={styles.consumoRetalToggle}>
                    <Text style={styles.consumoRetalLabel}>
                      ¿Guardar retal ({sobrante_cm.toFixed(0)} cm × {largo.toFixed(1)} m)?
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
                          {consumoForm.crear_retal ? '☑' : '☐'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setConsumoModal({ visible: false })}>
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={registrarConsumo}>
                <Text style={styles.btnPrimaryText}>Registrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // MODAL: Proveedor crear/editar
  // ═══════════════════════════════════════════════════════════════
  const renderProvModal = () => (
    <Modal visible={provModal.visible} transparent animationType="fade" onRequestClose={() => setProvModal({ visible: false, editing: null })}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>{provModal.editing ? 'Editar proveedor' : 'Nuevo proveedor'}</Text>

          <Text style={styles.fieldLabel}>Nombre *</Text>
          <TextInput
            style={styles.fieldInput}
            value={provForm.nombre}
            onChangeText={v => setProvForm(p => ({ ...p, nombre: v }))}
            placeholder="Ej. Antalis, Sihl, HP..."
            autoFocus
          />

          <Text style={styles.fieldLabel}>Persona de contacto</Text>
          <TextInput
            style={styles.fieldInput}
            value={provForm.contacto}
            onChangeText={v => setProvForm(p => ({ ...p, contacto: v }))}
            placeholder="Nombre del comercial"
          />

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Teléfono</Text>
              <TextInput
                style={styles.fieldInput}
                value={provForm.telefono}
                onChangeText={v => setProvForm(p => ({ ...p, telefono: v }))}
                placeholder="+34 600 000 000"
                keyboardType="phone-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={styles.fieldInput}
                value={provForm.email}
                onChangeText={v => setProvForm(p => ({ ...p, email: v }))}
                placeholder="comercial@proveedor.com"
                keyboardType="email-address"
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>Notas</Text>
          <TextInput
            style={[styles.fieldInput, { minHeight: 50 }]}
            value={provForm.notas}
            onChangeText={v => setProvForm(p => ({ ...p, notas: v }))}
            multiline
            placeholder="Condiciones, plazos de entrega..."
          />

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.btnCancel} onPress={() => setProvModal({ visible: false, editing: null })}>
              <Text style={styles.btnCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnPrimary} onPress={saveProveedor}>
              <Text style={styles.btnPrimaryText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // ═══════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <View style={styles.container}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Materiales</Text>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {['resumen', 'catalogo', 'stock', 'proveedores', 'historial'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => changeTab(tab)}
          >
            <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
              {tab === 'resumen' ? 'Resumen'
                : tab === 'catalogo' ? 'Catálogo'
                : tab === 'stock' ? 'Stock'
                : tab === 'proveedores' ? 'Proveedores'
                : 'Historial'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      {activeTab === 'resumen' && renderResumenTab()}
      {activeTab === 'catalogo' && renderCatalogoTab()}
      {activeTab === 'stock' && renderStockTab()}
      {activeTab === 'proveedores' && renderProveedoresTab()}
      {activeTab === 'historial' && renderHistorialTab()}

      {/* Modals */}
      {catModal.visible && renderCatModal()}
      {stockModal.visible && renderStockModal()}
      {consumoModal.visible && renderConsumoModal()}
      {provModal.visible && renderProvModal()}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  pageHeader: {
    backgroundColor: '#FFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  pageTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A2E' },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingHorizontal: 16,
    gap: 2,
  },
  tabBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: '#1976D2' },
  tabBtnText: { fontSize: 14, color: '#666', fontWeight: '500' },
  tabBtnTextActive: { color: '#1976D2', fontWeight: '700' },

  // Tab content
  tabContent: { flex: 1, padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  loadingText: { textAlign: 'center', color: '#999', padding: 20 },
  emptyText: { textAlign: 'center', color: '#999', padding: 24, fontStyle: 'italic' },

  // Filter row
  filterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  filterLabel: { fontSize: 13, color: '#555', fontWeight: '500' },
  filterSelectWrap: { flex: 1, maxWidth: 260 },
  filterSelect: { width: '100%', height: 32, border: '1px solid #DDD', borderRadius: 4, paddingHorizontal: 8, fontSize: 13, backgroundColor: '#FFF' },
  filterInput: { height: 32, borderWidth: 1, borderColor: '#DDD', borderRadius: 4, paddingHorizontal: 8, fontSize: 13, backgroundColor: '#FFF' },

  // Table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F0F4FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 2,
  },
  th: { fontSize: 11, fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  td: { fontSize: 13, color: '#333', paddingRight: 8 },
  tdActions: { flexDirection: 'row', gap: 6, justifyContent: 'flex-end' },

  // Expanded row (fabricantes)
  expandedRow: {
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  expandedEmpty: { color: '#AAA', fontSize: 12, fontStyle: 'italic' },
  fabRow: { marginBottom: 8 },
  fabNombre: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 4 },
  anchosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  anchosEmpty: { color: '#BBB', fontSize: 12, fontStyle: 'italic' },
  anchoChip: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D0DDF7',
    padding: 12,
    marginTop: 10,
    gap: 4,
  },
  stockInfoItem: { flex: 1, alignItems: 'center' },
  stockInfoLabel: { fontSize: 11, color: '#888', fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  stockInfoValue: { fontSize: 18, fontWeight: '700', color: '#222' },
  stockInfoHint: { fontSize: 11, color: '#999', fontStyle: 'italic', marginTop: 6, textAlign: 'center' },

  // Action buttons
  actionBtnSmall: {
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDanger: { backgroundColor: '#FFEBEE' },
  actionBtnSmallText: { fontSize: 14, color: '#333' },

  // Primary/secondary buttons
  btnPrimary: {
    backgroundColor: '#1976D2',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  btnPrimaryText: { color: '#FFF', fontWeight: '600', fontSize: 13 },
  btnCancel: {
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  btnCancelText: { color: '#555', fontWeight: '500', fontSize: 13 },
  btnSecondarySmall: {
    backgroundColor: '#E3F2FD',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  btnSecondarySmallText: { color: '#1565C0', fontSize: 12, fontWeight: '600' },

  // Pagination
  paginationRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, padding: 16 },
  paginationBtn: { backgroundColor: '#1976D2', borderRadius: 6, paddingHorizontal: 14, paddingVertical: 7 },
  paginationBtnDisabled: { backgroundColor: '#CCC' },
  paginationBtnText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  paginationInfo: { fontSize: 13, color: '#555' },

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
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 5, marginTop: 10 },
  fieldLabelSmall: { fontSize: 12, color: '#888' },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  fieldSelect: {
    width: '100%',
    height: 36,
    border: '1px solid #DDD',
    borderRadius: 6,
    paddingHorizontal: 8,
    fontSize: 13,
    backgroundColor: '#FAFAFA',
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
  fabEditName: { fontSize: 13, fontWeight: '700', color: '#333' },
  removeText: { fontSize: 12, color: '#D32F2F' },
  anchosEditRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 6 },
  anchoChipEdit: { backgroundColor: '#E8EAF6', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  anchoChipEditText: { fontSize: 12, color: '#3949AB' },
  addAnchoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  anchoInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 4,
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
    borderTopColor: '#EEE',
  },

  // ── Resumen tab ─────────────────────────────────────────────────────────
  chartCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8EDF2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  chartTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 18 },
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
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  rollCardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  rollCardTitle: { fontSize: 14, fontWeight: '700', color: '#222' },
  rollCardSub: { fontSize: 12, color: '#888', marginTop: 2 },
  rollCardBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8 },
  rollCardDot: { width: 10, height: 10, borderRadius: 5 },
  rollCardPct: { fontSize: 14, fontWeight: '700' },
  rollCardMetros: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  rollCardMetrosText: { fontSize: 13 },
  rollCardDate: { fontSize: 11, color: '#AAA' },

  // Progress bar
  progressBarBg: {
    height: 8,
    backgroundColor: '#EEEEEE',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: { height: 8, borderRadius: 4 },

  // Retales grid
  retalesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  retalCard: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FFE0B2',
    borderRadius: 8,
    padding: 12,
    minWidth: 140,
    flex: 1,
    maxWidth: 200,
  },
  retalBadge: {
    backgroundColor: '#FF9800',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  retalBadgeText: { fontSize: 10, color: '#FFF', fontWeight: '700', letterSpacing: 0.5 },
  retalMaterial: { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 2 },
  retalDimensions: { fontSize: 12, color: '#555', marginBottom: 2 },
  retalOrigen: { fontSize: 11, color: '#999', marginBottom: 4 },
  retalPct: { fontSize: 12, fontWeight: '700', marginTop: 4, textAlign: 'right' },

  // Consumo preview panel
  consumoPreview: {
    backgroundColor: '#F0F7FF',
    borderRadius: 8,
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
    marginTop: 8, fontSize: 12, color: '#D32F2F', fontWeight: '600', textAlign: 'center',
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
    borderTopColor: '#EEE',
  },
  cantidadLabel: { fontSize: 13, fontWeight: '600', color: '#555' },
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
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  provCardMain: { flexDirection: 'row', alignItems: 'flex-start' },
  provCardNombre: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 3 },
  provCardMeta: { fontSize: 12, color: '#666', marginBottom: 4 },
  provCardRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 3 },
  provCardChip: { fontSize: 12, color: '#1976D2', backgroundColor: '#E3F2FD', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  provCardNotas: { fontSize: 12, color: '#999', fontStyle: 'italic', marginTop: 4 },
});

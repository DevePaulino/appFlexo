import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, Switch, Platform, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePermission } from './usePermission';
import DeleteConfirmRow from '../components/DeleteConfirmRow';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';

// react-grid-layout solo en web
let GridLayout = null;
if (Platform.OS === 'web') {
  try {
    const RGL = require('react-grid-layout');
    GridLayout = RGL.default || RGL;
    require('react-grid-layout/css/styles.css');
    require('react-resizable/css/styles.css');
  } catch (e) { /* no-op */ }
}

const TIPOS = ['texto', 'numero', 'select', 'checkbox', 'textarea', 'fecha'];
const COLS = 12;


// Campos base del formulario — etiqueta y tipo son fijos, posición es editable.
// Refleja las secciones base de cada tipo de formulario.
const CAMPOS_BASE_DEF = {
  // Sección "Datos Generales"
  general: [
    { campo_id: '__base_cliente',    etiqueta: 'Cliente',        tipo: 'texto', ancho: 6, alto: 1, col: 0, fila: 0 },
    { campo_id: '__base_referencia', etiqueta: 'Referencia',     tipo: 'texto', ancho: 6, alto: 1, col: 6, fila: 0 },
    { campo_id: '__base_fecha',      etiqueta: 'Fecha pedido',   tipo: 'fecha', ancho: 4, alto: 1, col: 0, fila: 1 },
    { campo_id: '__base_entrega',    etiqueta: 'Fecha entrega',  tipo: 'fecha', ancho: 4, alto: 1, col: 4, fila: 1 },
    { campo_id: '__base_vendedor',   etiqueta: 'Comercial',      tipo: 'texto', ancho: 4, alto: 1, col: 8, fila: 1 },
  ],
  // Sección "Producto"
  producto: [
    { campo_id: '__base_maquina',  etiqueta: 'Máquina',      tipo: 'select', ancho: 6, alto: 1, col: 0, fila: 0 },
    { campo_id: '__base_material', etiqueta: 'Material',     tipo: 'select', ancho: 6, alto: 1, col: 6, fila: 0 },
    { campo_id: '__base_acabado',  etiqueta: 'Acabado',      tipo: 'select', ancho: 6, alto: 1, col: 0, fila: 1 },
    { campo_id: '__base_tirada',   etiqueta: 'Tirada total', tipo: 'numero', ancho: 3, alto: 1, col: 6, fila: 1 },
    { campo_id: '__base_troquel',  etiqueta: 'Troquel',      tipo: 'select', ancho: 3, alto: 1, col: 9, fila: 1 },
  ],
  // Sección "Impresión"
  impresion: [
    { campo_id: '__base_tintas',         etiqueta: 'Tintas',          tipo: 'select',   ancho: 6,  alto: 1, col: 0, fila: 0 },
    { campo_id: '__base_tinta_especial', etiqueta: 'Tinta especial',  tipo: 'select',   ancho: 6,  alto: 1, col: 6, fila: 0 },
    { campo_id: '__base_observ',         etiqueta: 'Observaciones',   tipo: 'textarea', ancho: 12, alto: 2, col: 0, fila: 1 },
  ],
  // Sección "Troquel" — refleja exactamente NuevoTroquelModal
  troquel: [
    { campo_id: '__base_tq_numero',        etiqueta: 'Número / Referencia',  tipo: 'texto',  ancho: 4, alto: 1, col: 0, fila: 0 },
    { campo_id: '__base_tq_tipo',          etiqueta: 'Tipo',                 tipo: 'select', ancho: 4, alto: 1, col: 4, fila: 0, opciones: ['Regular', 'Irregular', 'Corbata'] },
    { campo_id: '__base_tq_forma',         etiqueta: 'Forma',                tipo: 'select', ancho: 4, alto: 1, col: 8, fila: 0, opciones: ['Rectangular', 'Circular', 'Irregular', 'Ovalado'] },
    { campo_id: '__base_tq_estado',        etiqueta: 'Estado',               tipo: 'select', ancho: 4, alto: 1, col: 0, fila: 1, opciones: ['Disponible', 'En uso'] },
    { campo_id: '__base_tq_sentido',       etiqueta: 'Sentido de impresión', tipo: 'select', ancho: 8, alto: 1, col: 4, fila: 1, opciones: ['Vertical', 'Horizontal'] },
    { campo_id: '__base_tq_ancho_motivo',  etiqueta: 'Ancho motivo (mm)',    tipo: 'numero', ancho: 4, alto: 1, col: 0, fila: 2 },
    { campo_id: '__base_tq_alto_motivo',   etiqueta: 'Alto motivo (mm)',     tipo: 'numero', ancho: 4, alto: 1, col: 4, fila: 2 },
    { campo_id: '__base_tq_motivos_ancho', etiqueta: 'Motivos ancho',        tipo: 'numero', ancho: 4, alto: 1, col: 8, fila: 2 },
    { campo_id: '__base_tq_separacion',    etiqueta: 'Separación (mm)',      tipo: 'numero', ancho: 4, alto: 1, col: 0, fila: 3 },
    { campo_id: '__base_tq_valor_z',       etiqueta: 'Valor Z (mm)',         tipo: 'numero', ancho: 4, alto: 1, col: 4, fila: 3 },
    { campo_id: '__base_tq_dist_sesgado',  etiqueta: 'Dist. sesgado (mm)',   tipo: 'numero', ancho: 4, alto: 1, col: 8, fila: 3 },
  ],
};

// Todos los campos base en lista plana (para búsqueda)
const ALL_CAMPOS_BASE = Object.values(CAMPOS_BASE_DEF).flat();

const emptyField = () => ({
  etiqueta: '',
  tipo: 'texto',
  contenedor_id: '',
  opciones: [],
  obligatorio: false,
  ancho: 6,
  alto: 1,
  col: 0,
  fila: 0,
});

// ── Sortable section tab (para reordenar pestañas de secciones) ──────────────
const SECTION_BASE_NAMES_MAP = { general: 'forms.sectionGeneral', producto: 'forms.sectionProducto', impresion: 'forms.sectionImpresion', troquel: 'forms.sectionTroquel' };
function SortableTab({ cont, isActive, canEdit, onPress, onEdit, confirmingDeleteCont, setConfirmingDeleteCont, ejecutarEliminarCont, t, styles: s }) {
  const nombre = SECTION_BASE_NAMES_MAP[cont?.tipo] ? t(SECTION_BASE_NAMES_MAP[cont.tipo]) : (cont?.nombre || '');
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({ id: cont.contenedor_id, disabled: !canEdit });
  const wrapStyle = {
    opacity: isDragging ? 0.5 : 1,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  };
  const confirmando = confirmingDeleteCont === cont.contenedor_id;
  return (
    <div ref={setNodeRef} style={wrapStyle} {...attributes} {...(canEdit ? listeners : {})}>
      {confirmando ? (
        <View style={[s.tab, { width: 260 }]}>
          <DeleteConfirmRow
            size="sm"
            message={t('formBuilder.deleteTitleCont')}
            onCancel={() => setConfirmingDeleteCont(null)}
            onConfirm={() => ejecutarEliminarCont(cont)}
          />
        </View>
      ) : (
        <TouchableOpacity style={[s.tab, isActive && s.tabActive]} onPress={onPress}>
          <Text style={[s.tabText, isActive && s.tabTextActive]} numberOfLines={1}>{nombre}</Text>
          {canEdit && (
            <TouchableOpacity style={s.tabEditBtn} onPress={e => { e.stopPropagation?.(); onEdit(); }}>
              <Text style={s.tabEditBtnText}>✏</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      )}
    </div>
  );
}

export default function FormBuilderScreen() {
  const { t } = useTranslation();
  const canEdit = usePermission('manage_form_builder');
  const { width: windowWidth } = useWindowDimensions();

  const [formTipo, setFormTipo] = useState('pedido');
  const fq = `?form=${formTipo}`;
  const SECTION_BASE_NAMES = {
    general:   t('forms.sectionGeneral'),
    producto:  t('forms.sectionProducto'),
    impresion: t('forms.sectionImpresion'),
    troquel:   t('forms.sectionTroquel'),
  };
  const contNombre = (cont) => SECTION_BASE_NAMES[cont?.tipo] || cont?.nombre || '';

  const TIPO_LABELS = {
    texto:    t('formBuilder.tipoTexto'),
    numero:   t('formBuilder.tipoNumero'),
    select:   t('formBuilder.tipoSelect'),
    checkbox: t('formBuilder.tipoCheckbox'),
    textarea: t('formBuilder.tipoTextarea'),
    fecha:    t('formBuilder.tipoFecha'),
  };

  // ── DnD sensors ─────────────────────────────────────────────────────────────
  const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // ── Estado ──────────────────────────────────────────────────────────────────
  const [contenedores, setContenedores] = useState([]);
  const [activeContenedorId, setActiveContenedorId] = useState(null);
  const [campos, setCampos] = useState([]);           // custom
  const [baseLayout, setBaseLayout] = useState({});   // campo_id → override
  const [loading, setLoading] = useState(true);
  const [layoutDirty, setLayoutDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modal campo (custom)
  const [modalCampoVisible, setModalCampoVisible] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(emptyField());
  const [opcionInput, setOpcionInput] = useState('');

  // Modal sección
  const [modalContVisible, setModalContVisible] = useState(false);
  const [editandoCont, setEditandoCont] = useState(null);
  const [formCont, setFormCont] = useState({ nombre: '' });

  // Mover campo base a otra sección
  const [movingBaseId, setMovingBaseId] = useState(null);

  // Editar etiqueta/opciones de campo base
  const [editandoBase, setEditandoBase] = useState(null); // campo completo con overrides
  const [formBase, setFormBase] = useState({ etiqueta: '', opciones: [] });
  const [opcionInputBase, setOpcionInputBase] = useState('');
  const [canvasWidth, setCanvasWidth] = useState(() => windowWidth - 24);
  useEffect(() => { setCanvasWidth(windowWidth - 24); }, [windowWidth]);

  // Confirmaciones inline (sin Alert ni window.confirm)
  const [confirmingDeleteCampo, setConfirmingDeleteCampo] = useState(null); // campo_id
  const [confirmingDeleteCont, setConfirmingDeleteCont] = useState(null);   // contenedor_id

  const cambiarFormTipo = (tipo) => {
    setActiveContenedorId(null);
    setContenedores([]);
    setCampos([]);
    setBaseLayout({});
    setFormTipo(tipo);
  };

  const abrirEditarBase = (campo) => {
    const ov = baseLayout[campo.campo_id] || {};
    setEditandoBase(campo);
    setFormBase({
      etiqueta: ov.etiqueta ?? campo.etiqueta ?? '',
      opciones: Array.isArray(ov.opciones ?? campo.opciones) ? [...(ov.opciones ?? campo.opciones)] : [],
    });
    setOpcionInputBase('');
  };

  const guardarCampoBase = async () => {
    if (!editandoBase) return;
    setSaving(true);
    try {
      const cid = editandoBase.campo_id;
      const existing = baseLayout[cid] || {};
      const updated = {
        ...existing,
        campo_id: cid,
        etiqueta: formBase.etiqueta,
        opciones: formBase.opciones,
        contenedor_id: existing.contenedor_id || activeContenedorId || '',
        col: existing.col ?? editandoBase.col ?? 0,
        fila: existing.fila ?? editandoBase.fila ?? 0,
        ancho: existing.ancho ?? editandoBase.ancho ?? 6,
        alto: existing.alto ?? editandoBase.alto ?? 1,
      };
      await fetch(`http://localhost:8080/api/campos-base-layout${fq}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ layout: [updated] }),
      });
      setBaseLayout(prev => ({ ...prev, [cid]: updated }));
      setEditandoBase(null);
    } catch (e) {
      // no-op
    } finally {
      setSaving(false);
    }
  };

  const authHeaders = () => {
    const token = global.__MIAPP_ACCESS_TOKEN;
    const h = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  };

  // ── Carga de datos ──────────────────────────────────────────────────────────
  const cargarTodo = useCallback(async () => {
    setLoading(true);
    try {
      const headers = authHeaders();
      const [rCont, rCampos, rBase] = await Promise.all([
        fetch(`http://localhost:8080/api/contenedores-formulario${fq}`, { headers }),
        fetch(`http://localhost:8080/api/campos-formulario${fq}`, { headers }),
        fetch(`http://localhost:8080/api/campos-base-layout${fq}`, { headers }),
      ]);
      const [dCont, dCampos, dBase] = await Promise.all([rCont.json(), rCampos.json(), rBase.json()]);
      const cont = dCont.contenedores || [];
      setContenedores(cont);
      setCampos(dCampos.campos || []);
      setBaseLayout(dBase.layout || {});
      setActiveContenedorId(prev => {
        if (prev && cont.find(c => c.contenedor_id === prev)) return prev;
        return cont[0]?.contenedor_id || null;
      });
    } catch (e) {
      // no-op
    } finally {
      setLoading(false);
    }
  }, [fq]);

  useEffect(() => { cargarTodo(); }, [cargarTodo]);

  // ── Contenedor activo ───────────────────────────────────────────────────────
  const activeCont = contenedores.find(c => c.contenedor_id === activeContenedorId);

  // Campos base que pertenecen al contenedor activo
  const baseCamposForActive = ALL_CAMPOS_BASE.filter(b => {
    const override = baseLayout[b.campo_id];
    if (override?.contenedor_id) return override.contenedor_id === activeContenedorId;
    // Default: asignar por tipo de contenedor
    if (!activeCont) return false;
    const tipo = activeCont.tipo;
    const def = CAMPOS_BASE_DEF[tipo];
    if (def) return def.some(d => d.campo_id === b.campo_id);
    return false;
  }).map(b => {
    const ov = baseLayout[b.campo_id];
    return ov ? { ...b, col: ov.col ?? b.col, fila: ov.fila ?? b.fila, ancho: ov.ancho ?? b.ancho, alto: ov.alto ?? b.alto, etiqueta: ov.etiqueta ?? b.etiqueta, opciones: ov.opciones ?? b.opciones } : { ...b };
  });

  // Campos custom que pertenecen al contenedor activo.
  // Fallback: campos sin contenedor_id se asignan al contenedor por tipo (producto/impresion).
  const customCamposForActive = campos.filter(c => {
    if (c.contenedor_id) return c.contenedor_id === activeContenedorId;
    // Campos legacy sin contenedor_id: asignar por seccion al contenedor de su tipo
    if (!activeCont) return false;
    return c.seccion === activeCont.tipo;
  });

  // ── Guardar layout ──────────────────────────────────────────────────────────
  const guardarLayout = async () => {
    setSaving(true);
    try {
      const headers = authHeaders();
      // Custom layout — también migra campos legacy (sin contenedor_id) asignándoles el contenedor actual
      const customLayout = customCamposForActive.map(c => ({
        campo_id: c.campo_id || c.id,
        i: c.campo_id || c.id,
        x: c.col, y: c.fila, w: c.ancho, h: c.alto,
        contenedor_id: c.contenedor_id || activeContenedorId,
      }));
      // Base layout — solo los que tienen override
      const baseLayoutArr = ALL_CAMPOS_BASE.map(b => {
        const ov = baseLayout[b.campo_id] || {};
        return {
          campo_id: b.campo_id,
          x: ov.col ?? b.col,
          y: ov.fila ?? b.fila,
          w: ov.ancho ?? b.ancho,
          h: ov.alto ?? b.alto,
          contenedor_id: ov.contenedor_id ?? getDefaultContenedorId(b.campo_id),
        };
      });
      await Promise.all([
        fetch(`http://localhost:8080/api/campos-formulario/layout${fq}`, {
          method: 'PUT', headers, body: JSON.stringify({ layout: customLayout }),
        }),
        fetch(`http://localhost:8080/api/campos-base-layout${fq}`, {
          method: 'PUT', headers, body: JSON.stringify({ layout: baseLayoutArr }),
        }),
      ]);
      setLayoutDirty(false);
    } catch (e) {
      console.error('FormBuilder error:', e.message);
    } finally {
      setSaving(false);
    }
  };

  const getDefaultContenedorId = (campo_id) => {
    let tipo = 'general';
    if (CAMPOS_BASE_DEF.producto.some(b => b.campo_id === campo_id))  tipo = 'producto';
    if (CAMPOS_BASE_DEF.impresion.some(b => b.campo_id === campo_id)) tipo = 'impresion';
    return contenedores.find(c => c.tipo === tipo)?.contenedor_id || '';
  };

  // ── Reordenar secciones con dnd-kit ────────────────────────────────────────
  const handleSectionDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = contenedores.findIndex(c => c.contenedor_id === active.id);
    const newIndex = contenedores.findIndex(c => c.contenedor_id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(contenedores, oldIndex, newIndex);
    setContenedores(reordered);
    // Persistir nuevo orden
    try {
      await Promise.all(reordered.map((c, i) =>
        fetch(`http://localhost:8080/api/contenedores-formulario/${c.contenedor_id}${fq}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ orden: i }),
        })
      ));
    } catch (e) {
      console.error('Error guardando orden secciones:', e.message);
    }
  };

  // ── Layout change (react-grid-layout) ──────────────────────────────────────
  const handleLayoutChange = (newLayout) => {
    const baseIds = new Set(ALL_CAMPOS_BASE.map(b => b.campo_id));
    setCampos(prev => prev.map(c => {
      const id = c.campo_id || c.id;
      const item = newLayout.find(l => l.i === id);
      if (!item) return c;
      return { ...c, col: item.x, fila: item.y, ancho: item.w, alto: item.h };
    }));
    setBaseLayout(prev => {
      const next = { ...prev };
      newLayout.forEach(item => {
        if (!baseIds.has(item.i)) return;
        const def = ALL_CAMPOS_BASE.find(b => b.campo_id === item.i);
        const existing = prev[item.i] || {};
        next[item.i] = { ...def, ...existing, col: item.x, fila: item.y, ancho: item.w, alto: item.h, contenedor_id: existing.contenedor_id || activeContenedorId };
      });
      return next;
    });
    setLayoutDirty(true);
  };

  // ── Mover campo base a otro contenedor ─────────────────────────────────────
  const moverBaseACont = (campo_id, newContId) => {
    setBaseLayout(prev => {
      const def = ALL_CAMPOS_BASE.find(b => b.campo_id === campo_id);
      const existing = prev[campo_id] || {};
      return { ...prev, [campo_id]: { ...def, ...existing, contenedor_id: newContId } };
    });
    setMovingBaseId(null);
    setLayoutDirty(true);
  };

  // ── CRUD Campos custom ──────────────────────────────────────────────────────
  const abrirNuevoCampo = () => {
    setEditando(null);
    setForm({ ...emptyField(), contenedor_id: activeContenedorId });
    setOpcionInput('');
    setModalCampoVisible(true);
  };

  const abrirEditarCampo = (campo) => {
    setEditando(campo);
    setForm({
      etiqueta:       campo.etiqueta || '',
      tipo:           campo.tipo || 'texto',
      contenedor_id:  campo.contenedor_id || activeContenedorId,
      opciones:       Array.isArray(campo.opciones) ? [...campo.opciones] : [],
      obligatorio:    !!campo.obligatorio,
      ancho:          campo.ancho || 6,
      alto:           campo.alto || 1,
      col:            campo.col || 0,
      fila:           campo.fila || 0,
    });
    setOpcionInput('');
    setModalCampoVisible(true);
  };

  const guardarCampo = async () => {
    if (!form.etiqueta.trim()) {
      return;
      return;
    }
    setSaving(true);
    try {
      if (editando) {
        const id = editando.campo_id || editando.id;
        await fetch(`http://localhost:8080/api/campos-formulario/${id}${fq}`, {
          method: 'PUT', headers: authHeaders(), body: JSON.stringify(form),
        });
      } else {
        await fetch(`http://localhost:8080/api/campos-formulario${fq}`, {
          method: 'POST', headers: authHeaders(), body: JSON.stringify(form),
        });
      }
      setModalCampoVisible(false);
      await cargarTodo();
    } catch (e) {
      console.error('FormBuilder error:', e.message);
    } finally {
      setSaving(false);
    }
  };

  const ejecutarEliminarCampo = async (campo) => {
    const id = campo.campo_id || campo.id;
    await fetch(`http://localhost:8080/api/campos-formulario/${id}${fq}`, {
      method: 'DELETE', headers: authHeaders(),
    });
    setConfirmingDeleteCampo(null);
    cargarTodo();
  };

  const addOpcion = () => {
    if (!opcionInput.trim()) return;
    setForm(f => ({ ...f, opciones: [...f.opciones, opcionInput.trim()] }));
    setOpcionInput('');
  };

  // ── CRUD Contenedores ───────────────────────────────────────────────────────
  const abrirNuevoCont = () => {
    setEditandoCont(null);
    setFormCont({ nombre: '' });
    setModalContVisible(true);
  };

  const abrirEditarCont = (cont) => {
    setEditandoCont(cont);
    setFormCont({ nombre: cont.nombre });
    setModalContVisible(true);
  };

  const guardarCont = async () => {
    if (!formCont.nombre.trim()) return;
    setSaving(true);
    try {
      if (editandoCont) {
        await fetch(`http://localhost:8080/api/contenedores-formulario/${editandoCont.contenedor_id}${fq}`, {
          method: 'PUT', headers: authHeaders(), body: JSON.stringify({ nombre: formCont.nombre }),
        });
      } else {
        const res = await fetch(`http://localhost:8080/api/contenedores-formulario${fq}`, {
          method: 'POST', headers: authHeaders(), body: JSON.stringify({ nombre: formCont.nombre }),
        });
        const data = await res.json();
        if (data.contenedor) setActiveContenedorId(data.contenedor.contenedor_id);
      }
      setModalContVisible(false);
      await cargarTodo();
    } catch (e) {
      // no-op
    } finally {
      setSaving(false);
    }
  };

  const ejecutarEliminarCont = async (cont) => {
    const res = await fetch(
      `http://localhost:8080/api/contenedores-formulario/${cont.contenedor_id}${fq}`,
      { method: 'DELETE', headers: authHeaders() }
    );
    setConfirmingDeleteCont(null);
    setModalContVisible(false);
    if (res.ok) await cargarTodo();
  };

  // ── Preview de campo ────────────────────────────────────────────────────────
  const renderFieldPreview = (campo) => {
    const label = campo.etiqueta + (campo.obligatorio ? ' *' : '');
    switch (campo.tipo) {
      case 'texto':
        return (<View style={styles.previewField}><Text style={styles.previewLabel}>{label}</Text><View style={styles.previewInput} /></View>);
      case 'numero':
        return (<View style={styles.previewField}><Text style={styles.previewLabel}>{label}</Text><View style={[styles.previewInput, { width: 80 }]} /></View>);
      case 'textarea':
        return (<View style={styles.previewField}><Text style={styles.previewLabel}>{label}</Text><View style={[styles.previewInput, { height: 56 }]} /></View>);
      case 'select':
        return (
          <View style={styles.previewField}>
            <Text style={styles.previewLabel}>{label}</Text>
            <View style={[styles.previewInput, { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }]}>
              <Text style={{ color: '#94A3B8', fontSize: 12 }}>{campo.opciones?.[0] || t('formBuilder.selectPlaceholder')}</Text>
              <Text style={{ marginLeft: 'auto', color: '#94A3B8' }}>▾</Text>
            </View>
          </View>
        );
      case 'checkbox':
        return (<View style={[styles.previewField, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}><View style={styles.previewCheckbox} /><Text style={styles.previewLabel}>{label}</Text></View>);
      case 'fecha':
        return (
          <View style={styles.previewField}>
            <Text style={styles.previewLabel}>{label}</Text>
            <View style={[styles.previewInput, { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }]}>
              <Text style={{ color: '#94A3B8', fontSize: 12 }}>dd/mm/aaaa</Text>
            </View>
          </View>
        );
      default: return null;
    }
  };

  // ── Canvas (react-grid-layout) ─────────────────────────────────────────────
  const renderCanvas = () => {
    if (Platform.OS === 'web' && GridLayout) {
      const layoutBase = baseCamposForActive.map(c => ({
        i: c.campo_id, x: Number(c.col || 0), y: Number(c.fila || 0),
        w: Number(c.ancho || 6), h: Number(c.alto || 1), minW: 2, maxW: COLS, minH: 1,
      }));
      const layoutCustom = customCamposForActive.map(c => ({
        i: c.campo_id || c.id, x: Number(c.col || 0), y: Number(c.fila || 0),
        w: Number(c.ancho || 6), h: Number(c.alto || 1), minW: 2, maxW: COLS, minH: 1,
      }));
      const layout = [...layoutBase, ...layoutCustom];
      return (
        <View style={styles.canvasWrapper} onLayout={e => setCanvasWidth(e.nativeEvent.layout.width - 24)}>
          <GridLayout
            className="layout" layout={layout} cols={COLS} rowHeight={72} width={canvasWidth}
            onLayoutChange={handleLayoutChange} isDraggable={canEdit} isResizable={canEdit}
            compactType={null} preventCollision={false} margin={[10, 10]}
          >
            {baseCamposForActive.map(campo => (
              <div key={campo.campo_id} style={{ cursor: canEdit ? 'grab' : 'default' }}>
                <View style={[styles.gridCell, styles.gridCellBase, { overflow: 'visible' }]}>
                  {renderFieldPreview(campo)}
                  {canEdit && (
                    <View style={styles.cellActions}>
                      <TouchableOpacity style={styles.cellBtn} onPress={() => abrirEditarBase(campo)}>
                        <Text style={styles.cellBtnText}>✏</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.moveBaseBtn} onPress={() => setMovingBaseId(campo.campo_id)}>
                        <Text style={styles.moveBtnText}>⇄</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <View style={styles.baseBadge}><Text style={styles.baseBadgeText}>{t('formBuilder.badgeBase')}</Text></View>
                </View>
              </div>
            ))}
            {customCamposForActive.map(campo => {
              const cid = campo.campo_id || campo.id;
              const confirmando = confirmingDeleteCampo === cid;
              return (
                <div key={cid} style={{ cursor: canEdit && !confirmando ? 'grab' : 'default', position: 'relative' }}>
                  <View style={[styles.gridCell, styles.gridCellCustom, confirmando && { overflow: 'visible', zIndex: 10 }]}>
                    {confirmando ? (
                      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1.5, borderColor: '#EF4444', padding: 8, zIndex: 20 }}>
                        <DeleteConfirmRow size="sm"
                          message={t('formBuilder.deleteMsg', { nombre: campo.etiqueta })}
                          onCancel={() => setConfirmingDeleteCampo(null)}
                          onConfirm={() => ejecutarEliminarCampo(campo)}
                        />
                      </View>
                    ) : (
                      <>
                        {renderFieldPreview(campo)}
                        {canEdit && (
                          <View style={styles.cellActions}>
                            <TouchableOpacity style={styles.cellBtn} onPress={() => abrirEditarCampo(campo)}>
                              <Text style={styles.cellBtnText}>✏</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.cellBtn, styles.cellBtnDanger]} onPress={() => setConfirmingDeleteCampo(cid)}>
                              <Text style={[styles.cellBtnText, { color: '#EF4444' }]}>✕</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </>
                    )}
                    <View style={styles.customBadge}><Text style={styles.customBadgeText}>{t('formBuilder.badgeCustom')}</Text></View>
                  </View>
                </div>
              );
            })}
          </GridLayout>
          {(baseCamposForActive.length === 0 && customCamposForActive.length === 0) && canEdit && (
            <View style={styles.addHint}><Text style={styles.addHintText}>{t('formBuilder.addHint')}</Text></View>
          )}
        </View>
      );
    }
    // Nativo
    return (
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {baseCamposForActive.map(campo => (
          <View key={campo.campo_id} style={[styles.listCard, styles.listCardBase]}>
            {renderFieldPreview(campo)}
            {canEdit && <TouchableOpacity style={[styles.cellBtn, { marginLeft: 8 }]} onPress={() => setMovingBaseId(campo.campo_id)}><Text style={styles.cellBtnText}>⇄</Text></TouchableOpacity>}
            <View style={styles.baseBadge}><Text style={styles.baseBadgeText}>{t('formBuilder.badgeBase')}</Text></View>
          </View>
        ))}
        {customCamposForActive.map(campo => (
          <View key={campo.campo_id || campo.id} style={[styles.listCard, styles.listCardCustom]}>
            {renderFieldPreview(campo)}
            {canEdit && (
              <View style={styles.listCardActions}>
                <TouchableOpacity style={styles.cellBtn} onPress={() => abrirEditarCampo(campo)}><Text style={styles.cellBtnText}>✏</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.cellBtn, styles.cellBtnDanger]} onPress={() => setConfirmingDeleteCampo(campo.campo_id || campo.id)}><Text style={[styles.cellBtnText, { color: '#EF4444' }]}>✕</Text></TouchableOpacity>
              </View>
            )}
            <View style={styles.customBadge}><Text style={styles.customBadgeText}>{t('formBuilder.badgeCustom')}</Text></View>
          </View>
        ))}
      </ScrollView>
    );
  };

  // ── Modal mover campo base ──────────────────────────────────────────────────
  const renderMoveBaseModal = () => {
    if (!movingBaseId) return null;
    const campo = ALL_CAMPOS_BASE.find(b => b.campo_id === movingBaseId);
    return (
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { width: 320 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('formBuilder.moveToContainer')}</Text>
            <TouchableOpacity onPress={() => setMovingBaseId(null)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.fieldLabel, { marginTop: 0 }]}>{campo?.etiqueta}</Text>
          <View style={{ gap: 8, marginTop: 12 }}>
            {contenedores.map(cont => (
              <TouchableOpacity
                key={cont.contenedor_id}
                style={[
                  styles.contMoveItem,
                  (baseLayout[movingBaseId]?.contenedor_id || getDefaultContenedorId(movingBaseId)) === cont.contenedor_id && styles.contMoveItemActive,
                ]}
                onPress={() => moverBaseACont(movingBaseId, cont.contenedor_id)}
              >
                <Text style={styles.contMoveItemText}>{contNombre(cont)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  // ── Modal editar campo base (solo etiqueta + opciones) ──────────────────────
  const renderModalEditBase = () => {
    if (!editandoBase) return null;
    const esSelect = editandoBase.tipo === 'select';
    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('formBuilder.editField')}</Text>
            <TouchableOpacity onPress={() => setEditandoBase(null)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.fieldLabel}>{t('formBuilder.fieldLabel')}</Text>
          <TextInput
            style={styles.input}
            value={formBase.etiqueta}
            onChangeText={v => setFormBase(p => ({ ...p, etiqueta: v }))}
            placeholder={editandoBase.etiqueta}
            placeholderTextColor="#94A3B8"
          />

          {esSelect && (
            <>
              <Text style={[styles.fieldLabel, { marginTop: 4 }]}>{t('formBuilder.options')}</Text>
              <View style={styles.opcionesList}>
                {formBase.opciones.map((op, i) => (
                  <TouchableOpacity key={i} style={styles.opcionChip} onPress={() => setFormBase(p => ({ ...p, opciones: p.opciones.filter((_, j) => j !== i) }))}>
                    <Text style={styles.opcionChipText}>{op}</Text>
                    <Text style={styles.opcionChipRemove}>✕</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={[styles.opcionRow, { marginTop: 8 }]}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  value={opcionInputBase}
                  onChangeText={setOpcionInputBase}
                  placeholder={t('formBuilder.addOption')}
                  placeholderTextColor="#94A3B8"
                  onSubmitEditing={() => { const v = opcionInputBase.trim(); if (v) { setFormBase(p => ({ ...p, opciones: [...p.opciones, v] })); setOpcionInputBase(''); } }}
                />
                <TouchableOpacity style={styles.addOpcionBtn} onPress={() => { const v = opcionInputBase.trim(); if (v) { setFormBase(p => ({ ...p, opciones: [...p.opciones, v] })); setOpcionInputBase(''); } }}>
                  <Text style={styles.addOpcionBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <TouchableOpacity style={{ flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' }} onPress={() => setEditandoBase(null)}>
              <Text style={{ color: '#64748B', fontWeight: '600' }}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, { flex: 1 }]} onPress={guardarCampoBase} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? '...' : t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // ── Modal añadir/editar campo ───────────────────────────────────────────────
  const renderModalCampo = () => {
    if (!modalCampoVisible) return null;
    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editando ? t('formBuilder.editField') : t('formBuilder.newField')}</Text>
            <TouchableOpacity onPress={() => setModalCampoVisible(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 520 }}>
            <Text style={styles.fieldLabel}>{t('formBuilder.labelField')}</Text>
            <TextInput
              style={styles.input}
              value={form.etiqueta}
              onChangeText={v => setForm(f => ({ ...f, etiqueta: v }))}
              placeholder={t('formBuilder.labelPlaceholder')}
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.fieldLabel}>{t('formBuilder.tipoField')}</Text>
            <View style={styles.tipoRow}>
              {TIPOS.map(tipo => (
                <TouchableOpacity
                  key={tipo}
                  style={[styles.tipoBtn, form.tipo === tipo && styles.tipoBtnActive]}
                  onPress={() => setForm(f => ({ ...f, tipo }))}
                >
                  <Text style={[styles.tipoBtnText, form.tipo === tipo && styles.tipoBtnTextActive]}>
                    {TIPO_LABELS[tipo]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>{t('formBuilder.contenedorField')}</Text>
            <View style={styles.tipoRow}>
              {contenedores.map(cont => (
                <TouchableOpacity
                  key={cont.contenedor_id}
                  style={[styles.tipoBtn, form.contenedor_id === cont.contenedor_id && styles.tipoBtnActive]}
                  onPress={() => setForm(f => ({ ...f, contenedor_id: cont.contenedor_id }))}
                >
                  <Text style={[styles.tipoBtnText, form.contenedor_id === cont.contenedor_id && styles.tipoBtnTextActive]}>
                    {contNombre(cont)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {form.tipo === 'select' && (
              <View>
                <Text style={styles.fieldLabel}>{t('formBuilder.opcionesField')}</Text>
                <View style={styles.opcionRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    value={opcionInput}
                    onChangeText={setOpcionInput}
                    placeholder={t('formBuilder.addOpcionPlaceholder')}
                    placeholderTextColor="#94A3B8"
                    onSubmitEditing={addOpcion}
                  />
                  <TouchableOpacity style={styles.addOpcionBtn} onPress={addOpcion}>
                    <Text style={styles.addOpcionBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.opcionesList}>
                  {form.opciones.map((op, idx) => (
                    <View key={idx} style={styles.opcionChip}>
                      <Text style={styles.opcionChipText}>{op}</Text>
                      <TouchableOpacity onPress={() => setForm(f => ({ ...f, opciones: f.opciones.filter((_, i) => i !== idx) }))}>
                        <Text style={styles.opcionChipRemove}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <Text style={styles.fieldLabel}>{t('formBuilder.anchoField')}</Text>
            <View style={styles.anchoRow}>
              {[2, 3, 4, 6, 8, 12].map(w => (
                <TouchableOpacity
                  key={w}
                  style={[styles.anchoBtn, form.ancho === w && styles.anchoBtnActive]}
                  onPress={() => setForm(f => ({ ...f, ancho: w }))}
                >
                  <Text style={[styles.anchoBtnText, form.ancho === w && styles.anchoBtnTextActive]}>{w}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.fieldLabel}>{t('formBuilder.obligatorioField')}</Text>
              <Switch value={form.obligatorio} onValueChange={v => setForm(f => ({ ...f, obligatorio: v }))} trackColor={{ true: '#4F46E5' }} />
            </View>
          </ScrollView>

          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={guardarCampo} disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? t('formBuilder.saving') : t('formBuilder.saveField')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ── Modal crear/renombrar contenedor ────────────────────────────────────────
  const renderModalCont = () => {
    if (!modalContVisible) return null;
    const isDefaultCont = editandoCont && (editandoCont.tipo === 'producto' || editandoCont.tipo === 'impresion');
    return (
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { width: 340 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editandoCont ? t('formBuilder.editContainer') : t('formBuilder.newContainer')}
            </Text>
            <TouchableOpacity onPress={() => { setModalContVisible(false); setConfirmingDeleteCont(null); }}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.fieldLabel}>{t('formBuilder.containerName')}</Text>
          <TextInput
            style={styles.input}
            value={formCont.nombre}
            onChangeText={v => setFormCont(f => ({ ...f, nombre: v }))}
            placeholder={t('formBuilder.containerNamePlaceholder')}
            placeholderTextColor="#94A3B8"
          />
          {isDefaultCont && (
            <Text style={styles.contDefaultNote}>{t('formBuilder.containerDefaultNote')}</Text>
          )}
          {/* Confirmación inline eliminar sección */}
          {confirmingDeleteCont === editandoCont?.contenedor_id ? (
            <View style={{ marginTop: 16 }}>
              <DeleteConfirmRow
                size="md"
                message={t('formBuilder.deleteMsgCont', { nombre: editandoCont?.nombre })}
                onCancel={() => setConfirmingDeleteCont(null)}
                onConfirm={() => ejecutarEliminarCont(editandoCont)}
              />
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
              {editandoCont && !isDefaultCont && (
                <TouchableOpacity
                  style={[styles.saveBtn, { flex: 1, backgroundColor: '#FEF2F2', marginTop: 0 }]}
                  onPress={() => setConfirmingDeleteCont(editandoCont.contenedor_id)}
                >
                  <Text style={[styles.saveBtnText, { color: '#EF4444' }]}>{t('formBuilder.delete')}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.saveBtn, { flex: 2, marginTop: 0 }, saving && { opacity: 0.6 }]}
                onPress={guardarCont}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>{saving ? t('formBuilder.saving') : t('formBuilder.save')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  // ── Render principal ────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('formBuilder.title')}</Text>
        <View style={styles.headerActions}>
          {layoutDirty && (
            <TouchableOpacity style={styles.saveLayoutBtn} onPress={guardarLayout} disabled={saving}>
              <Text style={styles.saveLayoutBtnText}>{saving ? '...' : t('formBuilder.saveLayout')}</Text>
            </TouchableOpacity>
          )}
          {canEdit && (
            <>
              <TouchableOpacity style={styles.addContBtn} onPress={abrirNuevoCont}>
                <Text style={styles.addContBtnText}>+ {t('formBuilder.container')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addBtn} onPress={abrirNuevoCampo}>
                <Text style={styles.addBtnText}>{t('formBuilder.addField')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Sub-tabs: Pedido / Presupuesto / Troquel */}
      <View style={styles.subTabBar}>
        {[
          { key: 'pedido',      label: t('formBuilder.tabPedido') },
          { key: 'presupuesto', label: t('formBuilder.tabPresupuesto') },
          { key: 'troquel',     label: t('formBuilder.tabTroquel') },
        ].map(({ key, label }) => (
          <TouchableOpacity key={key} style={styles.subTabBtn} onPress={() => cambiarFormTipo(key)}>
            <Text style={[styles.subTabLabel, formTipo === key && styles.subTabLabelActive]}>
              {label}
            </Text>
            {formTipo === key && <View style={styles.subTabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Hint */}
      <View style={styles.hintBox}>
        <Text style={styles.hintText}>
          {Platform.OS === 'web' ? t('formBuilder.hint') : t('formBuilder.hintNative')}
        </Text>
      </View>

      {/* Tabs contenedores — arrastrables para reordenar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBarScroll} contentContainerStyle={styles.tabBar}>
        {Platform.OS === 'web' && canEdit ? (
          <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
            <SortableContext items={contenedores.map(c => c.contenedor_id)} strategy={horizontalListSortingStrategy}>
              {contenedores.map(cont => (
                <SortableTab
                  key={cont.contenedor_id}
                  cont={cont}
                  isActive={activeContenedorId === cont.contenedor_id}
                  canEdit={canEdit}
                  onPress={() => setActiveContenedorId(cont.contenedor_id)}
                  onEdit={() => abrirEditarCont(cont)}
                  confirmingDeleteCont={confirmingDeleteCont}
                  setConfirmingDeleteCont={setConfirmingDeleteCont}
                  ejecutarEliminarCont={ejecutarEliminarCont}
                  t={t}
                  styles={styles}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          contenedores.map(cont => (
            <TouchableOpacity
              key={cont.contenedor_id}
              style={[styles.tab, activeContenedorId === cont.contenedor_id && styles.tabActive]}
              onPress={() => setActiveContenedorId(cont.contenedor_id)}
            >
              <Text style={[styles.tabText, activeContenedorId === cont.contenedor_id && styles.tabTextActive]}>{contNombre(cont)}</Text>
              {canEdit && (
                <TouchableOpacity style={styles.tabEditBtn} onPress={() => abrirEditarCont(cont)}>
                  <Text style={styles.tabEditBtnText}>✏</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Canvas */}
      {loading ? (
        <View style={styles.loadingBox}><Text style={styles.loadingText}>{t('formBuilder.loading')}</Text></View>
      ) : (
        renderCanvas()
      )}

      {/* Modales */}
      {renderModalCampo()}
      {renderModalCont()}
      {renderMoveBaseModal()}
      {renderModalEditBase()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', backgroundColor: '#F4F5FD' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 0 },
  subTabBar: { flexDirection: 'row', backgroundColor: '#EEF2FF', paddingHorizontal: 20, paddingVertical: 0, borderBottomWidth: 1, borderBottomColor: '#C7D2FE' },
  subTabBtn: { paddingHorizontal: 2, paddingVertical: 10, marginRight: 28, position: 'relative', cursor: 'pointer' },
  subTabLabel: { fontSize: 13, fontWeight: '500', color: '#6B7280', letterSpacing: 0.1 },
  subTabLabelActive: { color: '#4F46E5', fontWeight: '700' },
  subTabIndicator: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, borderRadius: 1, backgroundColor: '#4F46E5' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E1B4B' },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addBtn: { backgroundColor: '#4F46E5', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  addContBtn: { backgroundColor: '#0F172A', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  addContBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  saveLayoutBtn: { backgroundColor: '#10B981', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  saveLayoutBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  hintBox: { margin: 16, marginBottom: 8, backgroundColor: '#EEF2FF', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#C7D2FE' },
  hintText: { color: '#4338CA', fontSize: 13, lineHeight: 20 },
  // Tabs
  tabBarScroll: { maxHeight: 52, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tabBar: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 6, alignItems: 'center' },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, backgroundColor: '#E2E8F0' },
  tabActive: { backgroundColor: '#4F46E5' },
  tabText: { color: '#64748B', fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: '#fff' },
  tabEditBtn: { width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  tabEditBtnText: { fontSize: 10, color: '#94A3B8' },
  // Loading
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#94A3B8', fontSize: 14 },
  // Canvas
  canvasWrapper: { flex: 1, width: '100%', padding: 12, overflowY: 'auto' },
  sortableRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'flex-start' },
  sortableCard: { flex: 1, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1.5, borderColor: '#E2E8F0', padding: 10, position: 'relative', overflow: 'hidden', minHeight: 90, height: '100%' },
  addHint: { marginTop: 8, padding: 12, backgroundColor: '#FEF9C3', borderRadius: 8, borderWidth: 1, borderColor: '#FDE047', marginHorizontal: 12 },
  addHintText: { fontSize: 12, color: '#854D0E', textAlign: 'center' },
  // Grid cell
  gridCell: { flex: 1, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1.5, borderColor: '#E2E8F0', padding: 10, position: 'relative', overflow: 'hidden', height: '100%' },
  gridCellBase: { borderColor: '#C7D2FE', backgroundColor: '#F5F3FF' },
  gridCellCustom: { borderColor: '#BBF7D0', backgroundColor: '#F0FDF4', borderStyle: 'dashed' },
  cellActions: { position: 'absolute', top: 6, right: 6, flexDirection: 'row', gap: 4 },
  cellBtn: { width: 26, height: 26, borderRadius: 6, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  cellBtnDanger: { backgroundColor: '#FEF2F2' },
  cellBtnText: { fontSize: 12, color: '#475569' },
  moveBaseBtn: { position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 6, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  moveBtnText: { fontSize: 13, color: '#4F46E5' },
  // List card (nativo)
  listCard: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  listCardBase: { backgroundColor: '#F5F3FF', borderColor: '#C7D2FE' },
  listCardCustom: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0', borderStyle: 'dashed' },
  listCardActions: { flexDirection: 'row', gap: 6, marginLeft: 'auto' },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  // Field preview
  previewField: { flex: 1, paddingRight: 36 },
  previewLabel: { fontSize: 11, fontWeight: '600', color: '#64748B', marginBottom: 4 },
  previewInput: { height: 28, borderRadius: 6, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  previewCheckbox: { width: 16, height: 16, borderRadius: 4, borderWidth: 1.5, borderColor: '#94A3B8', backgroundColor: '#F8FAFC' },
  // Badges
  baseBadge: { position: 'absolute', bottom: 4, right: 4, backgroundColor: '#C7D2FE', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  baseBadgeText: { fontSize: 9, color: '#4338CA', fontWeight: '700', letterSpacing: 0.5 },
  customBadge: { position: 'absolute', bottom: 4, right: 4, backgroundColor: '#BBF7D0', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  customBadgeText: { fontSize: 9, color: '#15803D', fontWeight: '700', letterSpacing: 0.5 },
  // Modal
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modalCard: { backgroundColor: '#fff', borderRadius: 16, width: 420, maxWidth: '95%', padding: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1E1B4B' },
  modalClose: { fontSize: 18, color: '#94A3B8', padding: 4 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#0F172A', marginBottom: 4 },
  tipoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tipoBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  tipoBtnActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  tipoBtnText: { fontSize: 12, color: '#475569', fontWeight: '500' },
  tipoBtnTextActive: { color: '#fff' },
  anchoRow: { flexDirection: 'row', gap: 8 },
  anchoBtn: { width: 44, paddingVertical: 7, borderRadius: 6, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  anchoBtnActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  anchoBtnText: { fontSize: 13, color: '#475569', fontWeight: '600' },
  anchoBtnTextActive: { color: '#fff' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  opcionRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addOpcionBtn: { backgroundColor: '#4F46E5', borderRadius: 8, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  addOpcionBtnText: { color: '#fff', fontSize: 20, fontWeight: '600' },
  opcionesList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  opcionChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, gap: 4 },
  opcionChipText: { fontSize: 12, color: '#4338CA' },
  opcionChipRemove: { fontSize: 10, color: '#94A3B8', marginLeft: 2 },
  saveBtn: { backgroundColor: '#4F46E5', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  // Contenedor modal
  contDefaultNote: { fontSize: 12, color: '#F59E0B', marginTop: 8 },
  contMoveItem: { padding: 12, borderRadius: 8, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  contMoveItemActive: { backgroundColor: '#EEF2FF', borderColor: '#4F46E5' },
  contMoveItemText: { fontSize: 14, color: '#1E1B4B', fontWeight: '500' },
});

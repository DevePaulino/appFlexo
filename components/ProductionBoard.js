import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, TextInput, Platform } from 'react-native';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useTranslation } from 'react-i18next';
import { useGridColumns } from '../hooks/useGridColumns';
import ColumnSelector from './ColumnSelector';
import TrabajoRow from './TrabajoRow';
import EmptyState from './EmptyState';
import { useModulos } from '../ModulosContext';
import { useSettings } from '../SettingsContext';
import RegistroCondicionesModal from './RegistroCondicionesModal';
import CondicionesPanel from './CondicionesPanel';

const PRODUCCION_COL_DEFS = (t) => [
  { key: 'pos',          label: '#',                                        flex: 0.06, locked: true },
  { key: 'numPedido',    label: t('screens.produccion.colNumPedido'),       flex: 0.10 },
  { key: 'nombre',       label: t('screens.produccion.colPedido'),          flex: 0.18 },
  { key: 'cliente',      label: t('screens.produccion.colCliente'),         flex: 0.12 },
  { key: 'estado',       label: t('screens.produccion.colEstado'),          flex: 0.14 },
  { key: 'fechaPedido',  label: t('screens.produccion.colFechaPedido'),     flex: 0.09 },
  { key: 'fechaEntrega', label: t('screens.produccion.colFechaEntrega'),    flex: 0.09 },
  { key: 'dias',         label: t('screens.produccion.colDias'),            flex: 0.06 },
  { key: 'maquina',      label: t('screens.produccion.colMaquina'),         flex: 0.13 },
  { key: 'impreso',      label: '',                                         flex: 0.12 },
  { key: 'colorimetria', label: '',                                         flex: 0.06 },
];

export default function ProductionBoard({ maquinas, trabajosPorMaquina, onRefresh, initialMaquinaId, maquinaActivaIds = [], searchText = '', trabajosTotals = {}, onRequestPage, onOpenDetalle }) {
  const { t } = useTranslation();
  const { visibleCols, orderedCols, hiddenKeys, toggleColumn, reorderColumns, resetColumns } =
    useGridColumns('produccion', PRODUCCION_COL_DEFS(t), null);
  const [maquinaActual, setMaquinaActual] = useState(0);
  const [trabajos, setTrabajos] = useState([]);
  const [paginaActual, setPaginaActual] = useState(0);
  const [cambiandoMaquina, setCambiandoMaquina] = useState(null);
  // ── Módulos ────────────────────────────────────────────────────────────────
  const { modulos } = useModulos();
  const consumoModuloActivo = modulos.consumo_material !== false;
  const condicionesModuloActivo = !!modulos.condiciones_impresion;
  // ── Modales de condiciones ─────────────────────────────────────────────────
  const [condicionesPanel, setCondicionesPanel] = useState(null);   // trabajo
  const [registroModal, setRegistroModal] = useState(null);          // trabajo pendiente de "Impreso"
  const [condicionesPendientes, setCondicionesPendientes] = useState(null); // payload condiciones a adjuntar
  const { estadoRules } = useSettings();
  const estadosFinalizadosSlugs = new Set(estadoRules?.estados_finalizados?.length ? estadoRules.estados_finalizados : ['finalizado']);
  // ── Consumo automático ─────────────────────────────────────────────────────
  const [consumoModal, setConsumoModal] = useState(null);  // trabajo seleccionado
  const [consumoLoading, setConsumoLoading] = useState(false);
  const [consumoResultado, setConsumoResultado] = useState(null);  // respuesta del backend
  const [consumoError, setConsumoError] = useState(null);
  const [consumoPreview, setConsumoPreview] = useState(null);
  const [consumoPreviewLoading, setConsumoPreviewLoading] = useState(false);
  const [mermaMetros, setMermaMetros] = useState('0');
  const TRABAJOS_POR_PAGINA = 100;

  const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const maquinasFiltradasIds = (maquinaActivaIds || [])
    .map((id) => String(id))
    .filter((id) => maquinas.some((m) => String(m.id) === id));
  const canReorder = maquinasFiltradasIds.length === 1;

  // Sync trabajos when machines/filter change
  useEffect(() => {
    if (!maquinas || maquinas.length === 0) return;

    if (maquinasFiltradasIds.length === 1) {
      const indice = maquinas.findIndex((m) => String(m.id) === String(maquinasFiltradasIds[0]));
      if (indice !== -1 && indice !== maquinaActual) {
        setMaquinaActual(indice);
      }
    }

    const maquinasFuente = maquinasFiltradasIds.length > 0
      ? maquinas.filter((m) => maquinasFiltradasIds.includes(String(m.id)))
      : maquinas;

    const combinado = maquinasFuente.flatMap((maq) =>
      ((trabajosPorMaquina[String(maq.id)] || trabajosPorMaquina[maq.id]) || []).map((trab) => ({
        ...trab,
        _maquina_id: maq.id,
        _maquina_nombre: maq.nombre,
      }))
    );

    const ordenados = [...combinado].sort((a, b) => {
      if (maquinasFuente.length === 1) {
        return (a.posicion || 0) - (b.posicion || 0);
      }
      const nombreA = a._maquina_nombre || '';
      const nombreB = b._maquina_nombre || '';
      if (nombreA !== nombreB) return nombreA.localeCompare(nombreB);
      return (a.posicion || 0) - (b.posicion || 0);
    });

    // Deduplicate by trabajo id
    const idToEntries = {};
    for (const t of ordenados) {
      const idKey = String(t.trabajo_id || t.id || '');
      if (!idKey) continue;
      idToEntries[idKey] = idToEntries[idKey] || [];
      idToEntries[idKey].push(t);
    }
    const preferredMachineId = (maquinasFiltradasIds.length === 1)
      ? maquinasFiltradasIds[0]
      : (maquinas[maquinaActual] && String(maquinas[maquinaActual].id));

    const unique = Object.keys(idToEntries).map((idKey) => {
      const entries = idToEntries[idKey];
      if (entries.length === 1) return entries[0];
      const pref = entries.find((e) => String(e._maquina_id) === String(preferredMachineId));
      return pref || entries[0];
    });

    setTrabajos(unique);
    setPaginaActual(0);
  }, [maquinaActual, maquinas, trabajosPorMaquina, maquinaActivaIds]);

  // Sync maquinaActual on filter/initial change
  useEffect(() => {
    if (!maquinas || maquinas.length === 0) return;
    const objetivo = (maquinaActivaIds && maquinaActivaIds.length > 0) ? maquinaActivaIds[0] : initialMaquinaId;
    if (!objetivo) return;
    const indice = maquinas.findIndex((m) => String(m.id) === String(objetivo));
    if (indice !== -1 && indice !== maquinaActual) {
      setMaquinaActual(indice);
    }
  }, [maquinaActivaIds, initialMaquinaId, maquinas, maquinaActual]);


  // Reset pagination on search/machine change
  useEffect(() => {
    setPaginaActual(0);
  }, [searchText, maquinaActual, maquinaActivaIds]);

  // DnD reorder
  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id || !canReorder) return;
    const items = [...trabajos];
    const oldIndex = items.findIndex((t) => String(t.trabajo_id || t.id || '') === String(active.id));
    const newIndex = items.findIndex((t) => String(t.trabajo_id || t.id || '') === String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(items, oldIndex, newIndex);
    reordered.forEach((t, i) => { t.posicion = i + 1; });
    setTrabajos(reordered);
    const maqActual = maquinas.find((m) => String(m.id) === String(maquinasFiltradasIds[0])) || maquinas[maquinaActual];
    try {
      const res = await fetch('http://localhost:8080/api/produccion/reordenar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maquina_id: maqActual.id,
          trabajos: reordered.map((t) => ({ trabajo_id: t.id || t.trabajo_id, nueva_posicion: t.posicion })),
        }),
      });
      if (res.ok && onRefresh) await onRefresh();
      else if (!res.ok) console.error('Error guardando orden:', res.statusText);
    } catch (e) {
      console.error('Error guardando orden:', e);
    }
  };

  // Helpers
  const slugifyEstado = (texto) => String(texto || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const generateColorFromHash = (text) => {
    const normalized = slugifyEstado(text);
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      hash = ((hash << 5) - hash) + normalized.charCodeAt(i);
      hash = hash & hash;
    }
    const vibrantes = ['#E91E63','#2196F3','#00BCD4','#4CAF50','#FFC107','#FF5722','#9C27B0','#3F51B5','#009688','#FF6F00'];
    return vibrantes[Math.abs(hash) % vibrantes.length];
  };

  const getStatusColor = (estado) => {
    const slug = slugifyEstado(estado);
    const color = generateColorFromHash(slug);
    switch (slug) {
      case 'en-diseno': case 'diseno': return [styles.statusDiseno, styles.statusDisenoText];
      case 'pendiente-de-aprobacion': return [styles.statusPendienteAprobacion, styles.statusPendienteAprobacionText];
      case 'pendiente-de-cliche': return [styles.statusPendienteCliche, styles.statusPendienteClicheText];
      case 'pendiente-de-impresion': return [styles.statusPendienteImpresion, styles.statusPendienteImpresionText];
      case 'pendiente-post-impresion': return [styles.statusPendientePostImpresion, styles.statusPendientePostImpresionText];
      case 'finalizado': return [styles.statusFinalizado, styles.statusFinalizadoText];
      case 'parado': return [styles.statusParado, styles.statusParadoText];
      case 'cancelado': return [styles.statusCancelado, styles.statusCanceladoText];
      default: return [{ ...styles.statusBadge, backgroundColor: color + '20' }, { ...styles.statusText, color }];
    }
  };

  const getStatusLabel = (estado) => {
    const labels = {
      'diseno': 'Diseño', 'en-diseno': 'En diseño',
      'pendiente-de-aprobacion': 'Pendiente de Aprobación',
      'pendiente-de-cliche': 'Pendiente de Cliché',
      'pendiente-de-impresion': 'Pendiente de Impresión',
      'pendiente-post-impresion': 'Pendiente Post-Impresión',
      'finalizado': 'Finalizado', 'parado': 'Parado', 'cancelado': 'Cancelado',
    };
    return labels[estado] || (estado || 'Pendiente');
  };

  const ejecutarMoverMaquina = async (trabajoId, nuevaMaquinaId) => {
    const token = global.__MIAPP_ACCESS_TOKEN;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch('http://localhost:8080/api/produccion/mover', {
      method: 'POST',
      headers,
      body: JSON.stringify({ trabajo_id: trabajoId, maquina_destino: nuevaMaquinaId, force: true }),
    });
    if (res.ok) {
      const indiceMaquinaDestino = maquinas.findIndex((m) => String(m.id) === String(nuevaMaquinaId));
      try { if (onRequestPage) await onRequestPage(nuevaMaquinaId, 1); } catch (e) { /* no fatal */ }
      if (indiceMaquinaDestino !== -1) setMaquinaActual(indiceMaquinaDestino);
      setTrabajos((prev) => prev.filter((t) => String(t.id || t.trabajo_id || '') !== String(trabajoId)));
      if (onRefresh) await onRefresh();
      try {
        if (onRequestPage) {
          setTimeout(() => { onRequestPage(nuevaMaquinaId, 1).catch(() => {}); }, 500);
        }
      } catch (e) { /* ignore */ }
    } else {
      if (onRefresh) await onRefresh();
      alert('Error al cambiar de máquina');
    }
  };

  const handleCambiarMaquina = async (trabajoId, nuevaMaquinaId) => {
    if (cambiandoMaquina) return;
    setCambiandoMaquina(trabajoId);
    try {
      const token = global.__MIAPP_ACCESS_TOKEN;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      // Paso 1: validar compatibilidad (force: false)
      const resCheck = await fetch('http://localhost:8080/api/produccion/mover', {
        method: 'POST',
        headers,
        body: JSON.stringify({ trabajo_id: trabajoId, maquina_destino: nuevaMaquinaId, force: false }),
      });
      const jsonCheck = await resCheck.json();
      if (resCheck.ok && jsonCheck.needs_confirm && jsonCheck.advertencias?.length > 0) {
        const msgs = jsonCheck.advertencias.map((a) => {
          if (a.tipo === 'colores') return `• Tintas: el trabajo necesita ${a.requerido} colores, la máquina tiene ${a.maximo}`;
          if (a.tipo === 'ancho') return `• Ancho de material: necesita ${a.requerido} mm, máquina admite ${a.maximo} mm`;
          return `• ${a.tipo}`;
        }).join('\n');
        const confirmar = window.confirm(`Incompatibilidad detectada:\n\n${msgs}\n\n¿Desea asignar igualmente?`);
        if (!confirmar) {
          if (onRefresh) await onRefresh();
          setCambiandoMaquina(null);
          return;
        }
      }
      // Paso 2: ejecutar el movimiento
      await ejecutarMoverMaquina(trabajoId, nuevaMaquinaId);
    } catch (e) {
      if (onRefresh) await onRefresh();
      alert('Error al cambiar de máquina');
    }
    setCambiandoMaquina(null);
  };

  const formatearFecha = (valor) => {
    if (!valor) return '-';
    const texto = String(valor).includes('T') ? String(valor).split('T')[0] : String(valor);
    const [anio, mes, dia] = texto.split('-');
    if (!anio || !mes || !dia) return texto;
    return `${dia}-${mes}-${anio}`;
  };

  const calcularDiasEntrega = (fechaEntrega) => {
    if (!fechaEntrega) return null;
    const hoy = new Date();
    const hoyInicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const texto = String(fechaEntrega).includes('T') ? String(fechaEntrega).split('T')[0] : String(fechaEntrega);
    const [anio, mes, dia] = texto.split('-').map(Number);
    if (!anio || !mes || !dia) return null;
    return Math.round((new Date(anio, mes - 1, dia).getTime() - hoyInicio.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getEntregaSemaforo = (fechaEntrega) => {
    const dias = calcularDiasEntrega(fechaEntrega);
    if (dias === null) return { container: [styles.retrasoContainer, styles.retrasoAmarillo], text: [styles.retrasoText, styles.retrasoAmarilloText], label: '-' };
    if (dias < 0) return { container: [styles.retrasoContainer, styles.retrasoRojo], text: [styles.retrasoText, styles.retrasoRojoText], label: `+${Math.abs(dias)}` };
    if (dias <= 3) return { container: [styles.retrasoContainer, styles.retrasoAmarillo], text: [styles.retrasoText, styles.retrasoAmarilloText], label: `${dias}` };
    return { container: [styles.retrasoContainer, styles.retrasoVerde], text: [styles.retrasoText, styles.retrasoVerdeText], label: `${dias}` };
  };

  const [sinRepetidora, setSinRepetidora] = useState(false);

  // Abre el modal de condiciones antes de proceder con la impresión
  const handleMarcarImpreso = (trabajo) => {
    if (condicionesModuloActivo) {
      setRegistroModal(trabajo);
    } else if (consumoModuloActivo) {
      abrirConsumoModal(trabajo);
    } else {
      marcarImpresoSinConsumo(trabajo);
    }
  };

  const handleCondicionesConfirmadas = (condicionesObj) => {
    const trabajo = registroModal;
    setRegistroModal(null);
    setCondicionesPendientes(condicionesObj);
    if (consumoModuloActivo) {
      abrirConsumoModal(trabajo);
    } else {
      marcarImpresoConCondiciones(trabajo, condicionesObj);
    }
  };

  const marcarImpresoConCondiciones = async (trabajo, condicionesObj) => {
    const pedidoId = String(trabajo._id || trabajo.id || trabajo.trabajo_id || '');
    if (!pedidoId) return;
    try {
      const token = global.__MIAPP_ACCESS_TOKEN;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const body = condicionesObj && condicionesObj.origen !== 'no_registrado'
        ? { condiciones_impresion: condicionesObj }
        : {};
      const res = await fetch(`http://localhost:8080/api/pedidos/${pedidoId}/marcar-impreso`, {
        method: 'POST', headers, body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setTrabajos((prev) => prev.map((t) => {
          if (String(t.id || t._id || t.trabajo_id || '') !== pedidoId) return t;
          const updated = { ...t, impresion_registrada: true };
          if (data.nuevo_estado) updated.estado = data.nuevo_estado;
          return updated;
        }));
        if (onRefresh) onRefresh();
      }
    } catch (_) {}
    setCondicionesPendientes(null);
  };

  const abrirConsumoModal = async (trabajo) => {
    setConsumoModal(trabajo);
    setConsumoResultado(null);
    setConsumoError(null);
    setSinRepetidora(false);
    setConsumoPreview(null);
    // Cargar preview
    const pedidoId = String(trabajo._id || trabajo.id || trabajo.trabajo_id || '');
    if (!pedidoId) return;
    setConsumoPreviewLoading(true);
    try {
      const token = global.__MIAPP_ACCESS_TOKEN;
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`http://localhost:8080/api/materiales/consumos/preview?pedido_id=${pedidoId}`, { headers });
      const json = await res.json();
      if (res.ok) {
        setConsumoPreview(json);
      } else if (json.code === 'SIN_REPETIDORA') {
        setSinRepetidora(true);
      }
      // otros errores (SIN_STOCK, SIN_DIMENSIONES_PDF) los dejamos silenciosos en preview;
      // el endpoint de registro los reportará con mensaje completo
    } catch (_) { /* silencioso */ }
    setConsumoPreviewLoading(false);
  };

  const marcarImpresoSinConsumo = async (trabajo) => {
    const pedidoId = String(trabajo._id || trabajo.id || trabajo.trabajo_id || '');
    if (!pedidoId) return;
    try {
      const token = global.__MIAPP_ACCESS_TOKEN;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`http://localhost:8080/api/pedidos/${pedidoId}/marcar-impreso`, { method: 'POST', headers });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setTrabajos((prev) => prev.map((t) => {
          if (String(t.id || t._id || t.trabajo_id || '') !== pedidoId) return t;
          const updated = { ...t, impresion_registrada: true };
          if (data.nuevo_estado) updated.estado = data.nuevo_estado;
          return updated;
        }));
        if (onRefresh) onRefresh();
      }
    } catch (_) {}
  };

  const cerrarConsumoModal = () => {
    setConsumoModal(null);
    setConsumoResultado(null);
    setConsumoError(null);
    setSinRepetidora(false);
    setConsumoPreview(null);
    setMermaMetros('0');
  };

  const llamarEndpointConsumo = async (sinMaterial) => {
    if (!consumoModal) return;
    const pedidoId = String(consumoModal._id || consumoModal.id || consumoModal.trabajo_id || '');
    if (!pedidoId) { setConsumoError('No se pudo obtener el ID del pedido'); return; }
    setConsumoLoading(true);
    setConsumoError(null);
    setSinRepetidora(false);
    try {
      const token = global.__MIAPP_ACCESS_TOKEN;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('http://localhost:8080/api/materiales/consumos/auto', {
        method: 'POST',
        headers,
        body: JSON.stringify({ pedido_id: pedidoId, sin_material: sinMaterial, merma_metros: parseFloat(mermaMetros) || 0 }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.code === 'SIN_REPETIDORA') {
          setSinRepetidora(true);
        } else {
          setConsumoError(json.error || 'Error al registrar consumo');
        }
      } else {
        setConsumoResultado(json);
        // Actualización optimista: marcar como impreso inmediatamente en el estado local
        setTrabajos((prev) => prev.map((t) =>
          String(t.id || t._id || t.trabajo_id || '') === pedidoId
            ? { ...t, impresion_registrada: true }
            : t
        ));
        if (onRefresh) onRefresh();
      }
    } catch (e) {
      setConsumoError('Error de red: ' + e.message);
    }
    setConsumoLoading(false);
  };

  const confirmarConsumo = () => llamarEndpointConsumo(false);
  const confirmarSinMaterial = () => llamarEndpointConsumo(true);

  if (!maquinas || maquinas.length === 0) {
    return (
      <EmptyState
        variant="inline"
        title={t('screens.produccion.sinMaquinas')}
        message={t('screens.produccion.noMaquinas')}
      />
    );
  }

  const filtro = (searchText || '').trim().toLowerCase();
  const trabajosFiltrados = filtro
    ? trabajos.filter((t) => {
        const vals = [t?.id, t?.nombre, t?.cliente, t?.referencia, t?.estado, t?.fecha_pedido, t?.fecha_entrega, t?.numero_pedido]
          .map((v) => String(v || '').toLowerCase()).join(' ');
        return vals.includes(filtro);
      })
    : trabajos;

  const totalCount = (searchText && searchText.trim() !== '' && trabajosTotals?.search_total)
    ? trabajosTotals.search_total
    : (trabajosTotals?.[(maquinasFiltradasIds.length === 1) ? maquinasFiltradasIds[0] : String(maquinas[maquinaActual]?.id || '')] || trabajosFiltrados.length);
  const totalPaginas = Math.ceil(totalCount / TRABAJOS_POR_PAGINA) || 1;
  const sortableIds = trabajosFiltrados.map((t) => String(t.trabajo_id || t.id || ''));

  const rowList = trabajosFiltrados.length === 0
    ? (
      <EmptyState
        variant="inline"
        title={filtro ? t('screens.produccion.sinResultados') : t('screens.produccion.sinTrabajos')}
        message={filtro ? t('screens.produccion.sinResultadosBusqueda') : t('screens.produccion.noTrabajosFilro')}
      />
    )
    : trabajosFiltrados.map((item, index) => (
      <TrabajoRow
        key={String(item.trabajo_id || item.id || '')}
        trabajo={item}
        index={index}
        maquinas={maquinas}
        maquinaActual={maquinaActual}
        canReorder={canReorder}
        cambiandoMaquina={cambiandoMaquina}
        handleCambiarMaquina={handleCambiarMaquina}
        getStatusColor={getStatusColor}
        getStatusLabel={getStatusLabel}
        getEntregaSemaforo={getEntregaSemaforo}
        formatearFecha={formatearFecha}
        onMarcarImpreso={handleMarcarImpreso}
        onVerCondiciones={condicionesModuloActivo ? (t) => setCondicionesPanel(t) : undefined}
        onOpenDetalle={onOpenDetalle}
        isFinalizado={estadosFinalizadosSlugs.has(slugifyEstado(item.estado))}
        impresionRegistrada={!!item.impresion_registrada}
        visibleCols={visibleCols}
        styles={styles}
      />
    ));

  return (
    <View style={styles.container}>
      <View style={styles.tableContainer}>

        {/* Hint: reorder requires exactly one machine */}
        {!canReorder && (
          <View style={styles.reorderHint}>
            <Text style={styles.reorderHintText}>
              {maquinasFiltradasIds.length === 0
                ? t('screens.produccion.reorderHintNone')
                : t('screens.produccion.reorderHintMulti')}
            </Text>
          </View>
        )}

        {/* Column headers */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={Platform.select({ web: { width: '100%' }, default: { minWidth: 780 } })}>
        <View style={styles.tableHeader}>
          {visibleCols.map(col => (
            <View key={col.key} style={[styles.tableCell, { flex: col.adjustedFlex }]}>
              <Text style={styles.headerText}>{col.label}</Text>
            </View>
          ))}
          <ColumnSelector
            orderedCols={orderedCols}
            hiddenKeys={hiddenKeys}
            onToggle={toggleColumn}
            onReorder={reorderColumns}
            onReset={resetColumns}
          />
        </View>

        {/* Rows */}
        {canReorder ? (
          <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              <ScrollView style={styles.rowsContainer}>
                <View style={Platform.select({ web: { width: '100%' }, default: { minWidth: 780 } })}>{rowList}</View>
              </ScrollView>
            </SortableContext>
          </DndContext>
        ) : (
          <ScrollView style={styles.rowsContainer}>
            <View style={Platform.select({ web: { width: '100%' }, default: { minWidth: 780 } })}>{rowList}</View>
          </ScrollView>
        )}
        </View>
        </ScrollView>

        {/* Pagination */}
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            style={[styles.paginationButton, paginaActual === 0 && styles.paginationButtonDisabled]}
            onPress={() => setPaginaActual(Math.max(0, paginaActual - 1))}
            disabled={paginaActual === 0}
          >
            <Text style={styles.paginationButtonText}>← {t('common.prev')}</Text>
          </TouchableOpacity>
          <Text style={styles.paginationInfo}>
            {t('screens.produccion.paginaInfo', { pagina: paginaActual + 1, total: totalPaginas, count: totalCount })}
          </Text>
          <TouchableOpacity
            style={[styles.paginationButton, paginaActual >= totalPaginas - 1 && styles.paginationButtonDisabled]}
            onPress={async () => {
              if (paginaActual >= totalPaginas - 1) return;
              if (typeof onRequestPage === 'function') {
                const currentMachineId = (maquinasFiltradasIds.length === 1)
                  ? maquinasFiltradasIds[0]
                  : String(maquinas[maquinaActual]?.id || '');
                const ok = await onRequestPage(currentMachineId);
                if (ok) setPaginaActual(Math.min(totalPaginas - 1, paginaActual + 1));
              } else {
                setPaginaActual(Math.min(totalPaginas - 1, paginaActual + 1));
              }
            }}
            disabled={paginaActual >= totalPaginas - 1}
          >
            <Text style={styles.paginationButtonText}>{t('common.next')} →</Text>
          </TouchableOpacity>
        </View>

      </View>

      {/* ── Modal: Registro de condiciones de impresión ──────────────────── */}
      <RegistroCondicionesModal
        visible={!!registroModal}
        trabajo={registroModal}
        maquinas={maquinas}
        onClose={() => setRegistroModal(null)}
        onConfirm={handleCondicionesConfirmadas}
      />

      {/* ── Panel: Ver condiciones / Buscar similar ───────────────────────── */}
      <CondicionesPanel
        visible={!!condicionesPanel}
        trabajo={condicionesPanel}
        maquinas={maquinas}
        onClose={() => setCondicionesPanel(null)}
      />

      {/* ── Modal de consumo automático ─────────────────────────────────── */}
      <Modal visible={!!consumoModal} transparent animationType="fade" onRequestClose={cerrarConsumoModal}>
        <View style={styles.consumoOverlay}>
          <View style={styles.consumoCard}>
            {/* Header */}
            <View style={styles.consumoHeader}>
              <Text style={styles.consumoTitle}>{t('screens.produccion.consumo.modalTitle')}</Text>
              <TouchableOpacity onPress={cerrarConsumoModal}>
                <Text style={styles.consumoCloseX}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Pedido info (estado normal o sin repetidora) */}
            {consumoModal && !consumoResultado && (
              <View style={[styles.consumoInfo, sinRepetidora && styles.consumoInfoWarning]}>
                <Text style={styles.consumoLabel}>{t('screens.produccion.consumo.labelPedido')}</Text>
                <Text style={styles.consumoValue}>{consumoModal.nombre || consumoModal.numero_pedido || String(consumoModal._id || consumoModal.id || '-')}</Text>
                <Text style={styles.consumoLabel}>{t('screens.produccion.consumo.labelCliente')}</Text>
                <Text style={styles.consumoValue}>{typeof consumoModal.cliente === 'string' ? consumoModal.cliente : (consumoModal.cliente?.nombre || '-')}</Text>
                {consumoPreview?.repetidora_nombre ? (
                  <View style={styles.consumoRepetidoraRow}>
                                        <Text style={styles.consumoRepetidoraNombre} numberOfLines={1}>{consumoPreview.repetidora_nombre}</Text>
                  </View>
                ) : null}
                {sinRepetidora ? (
                  <Text style={styles.consumoWarningText}>
                    {t('screens.produccion.consumo.warnSinRepetidora')}
                  </Text>
                ) : consumoPreviewLoading ? (
                  <View style={styles.consumoPreviewLoading}>
                    <ActivityIndicator size="small" color="#475569" />
                    <Text style={styles.consumoPreviewLoadingText}>{t('screens.produccion.consumo.calculando')}</Text>
                  </View>
                ) : consumoPreview ? (
                  <View style={styles.consumoPreviewBox}>
                    {consumoPreview.calculo && (
                      <>
                        <View style={styles.consumoPreviewRow}>
                          <Text style={styles.consumoPreviewKey}>{t('screens.produccion.consumo.labelAncho')}</Text>
                          <Text style={styles.consumoPreviewVal}>{consumoPreview.calculo.ancho_repetidora_mm} mm + 10 mm</Text>
                        </View>
                        <View style={styles.consumoPreviewRow}>
                          <Text style={styles.consumoPreviewKey}>{t('screens.produccion.consumo.labelMetros')}</Text>
                          <Text style={styles.consumoPreviewVal}>
                            {(consumoPreview.calculo.metros_consumidos + (parseFloat(mermaMetros) || 0)).toFixed(4)} m
                            {(parseFloat(mermaMetros) || 0) > 0 ? ` (base: ${consumoPreview.calculo.metros_consumidos} m + ${parseFloat(mermaMetros)} m merma)` : ''}
                          </Text>
                        </View>
                      </>
                    )}
                    {consumoPreview.stock && (
                      <View style={styles.consumoPreviewRow}>
                        <Text style={styles.consumoPreviewKey}>{t('screens.produccion.consumo.labelStock')}</Text>
                        <Text style={styles.consumoPreviewVal}>
                          {consumoPreview.stock.material_nombre} — {consumoPreview.stock.ancho_cm} cm
                          {consumoPreview.stock.es_retal ? ' (retal)' : ''}
                          {' · '}{consumoPreview.stock.metros_disponibles} m {t('screens.produccion.consumo.disponibles')}
                        </Text>
                      </View>
                    )}
                    {consumoPreview.retal_generado && (
                      <View style={styles.consumoPreviewRow}>
                        <Text style={styles.consumoPreviewKey}>{t('screens.produccion.consumo.labelRetal')}</Text>
                        <Text style={styles.consumoPreviewVal}>
                          {consumoPreview.retal_generado.ancho_cm} cm × {consumoPreview.retal_generado.metros_disponibles} m
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <Text style={styles.consumoHint}>{t('screens.produccion.consumo.hint')}</Text>
                )}
              </View>
            )}

            {/* Merma */}
            {consumoModal && !consumoResultado && (
              <View style={styles.mermaRow}>
                <Text style={styles.mermaLabel}>{t('screens.produccion.consumo.labelMerma')}</Text>
                <View style={styles.mermaInputWrap}>
                  <TextInput
                    style={styles.mermaInput}
                    value={mermaMetros}
                    onChangeText={setMermaMetros}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor="#94A3B8"
                  />
                  <Text style={styles.mermaUnit}>m</Text>
                </View>
              </View>
            )}

            {/* Error genérico */}
            {consumoError && (
              <View style={styles.consumoErrorBox}>
                <Text style={styles.consumoErrorText}>{consumoError}</Text>
              </View>
            )}

            {/* Resultado */}
            {consumoResultado && (
              <View style={styles.consumoResultBox}>
                <Text style={styles.consumoResultTitle}>
                  {consumoResultado.sin_material ? t('screens.produccion.consumo.resultTitleSinMaterial') : t('screens.produccion.consumo.resultTitle')}
                </Text>
                {consumoResultado.estado_nuevo && (
                  <Text style={styles.consumoResultRow}>
                    {t('screens.produccion.consumo.labelEstadoCambio')}: <Text style={styles.consumoResultVal}>{consumoResultado.estado_anterior} → {consumoResultado.estado_nuevo}</Text>
                  </Text>
                )}
                {consumoResultado.calculo && (
                  <>
                    <Text style={styles.consumoResultRow}>
                      {t('screens.produccion.consumo.labelAncho')}: <Text style={styles.consumoResultVal}>{consumoResultado.calculo.ancho_repetidora_mm} mm + 10 mm</Text>
                    </Text>
                    <Text style={styles.consumoResultRow}>
                      {t('screens.produccion.consumo.labelMetros')}: <Text style={styles.consumoResultVal}>{consumoResultado.calculo.metros_consumidos} m</Text>
                    </Text>
                  </>
                )}
                {consumoResultado.consumo?.material_nombre && (
                  <Text style={styles.consumoResultRow}>
                    {t('screens.produccion.consumo.labelStock')}: <Text style={styles.consumoResultVal}>{consumoResultado.consumo.material_nombre} — {consumoResultado.consumo.ancho_cm} cm{consumoResultado.consumo.es_retal ? ' (retal)' : ''}</Text>
                  </Text>
                )}
                {consumoResultado.retal_generado && (
                  <Text style={styles.consumoResultRow}>
                    {t('screens.produccion.consumo.labelRetal')}: <Text style={styles.consumoResultVal}>{consumoResultado.retal_generado.ancho_cm} cm × {consumoResultado.retal_generado.metros_disponibles} m</Text>
                  </Text>
                )}
              </View>
            )}

            {/* Botones */}
            <View style={styles.consumoBtnRow}>
              {!consumoResultado ? (
                <>
                  <TouchableOpacity onPress={cerrarConsumoModal} style={styles.consumoBtnCancel} disabled={consumoLoading}>
                    <Text style={styles.consumoBtnCancelText}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                  {sinRepetidora ? (
                    <TouchableOpacity onPress={confirmarSinMaterial} style={[styles.consumoBtnWarning, consumoLoading && { opacity: 0.6 }]} disabled={consumoLoading}>
                      {consumoLoading
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={styles.consumoBtnConfirmText}>{t('screens.produccion.consumo.btnSinConsumo')}</Text>
                      }
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={confirmarConsumo} style={[styles.consumoBtnConfirm, consumoLoading && { opacity: 0.6 }]} disabled={consumoLoading}>
                      {consumoLoading
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={styles.consumoBtnConfirmText}>{t('screens.produccion.consumo.btnRegistrar')}</Text>
                      }
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <TouchableOpacity onPress={cerrarConsumoModal} style={styles.consumoBtnConfirm}>
                  <Text style={styles.consumoBtnConfirmText}>{t('common.close')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tableContainer: {
    flex: 1,
    paddingHorizontal: 10,
    flexDirection: 'column',
  },
  rowsContainer: {
    flex: 1,
    marginTop: 6,
  },
  reorderHint: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    alignItems: 'center',
  },
  reorderHintText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#ECEFFE',
    borderWidth: 1,
    borderColor: '#D9DBFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderRadius: 8,
    minHeight: 36,
    alignItems: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 4,
    borderLeftWidth: 3,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  rowAlternate: {},
  draggedRow: {
    opacity: 0.75,
    backgroundColor: '#EFF6FF',
    zIndex: 999,
  },
  tableCell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  colPos: {
    width: '6%',
    alignItems: 'center',
  },
  colId: {
    flex: 0.12,
    alignItems: 'center',
  },
  colNumPedido: {
    flex: 0.10,
    alignItems: 'center',
  },
  colNombre: {
    flex: 0.18,
  },
  colCliente: {
    flex: 0.12,
    alignItems: 'center',
  },
  colEstado: {
    flex: 0.14,
    alignItems: 'center',
  },
  colFechaPedido: {
    flex: 0.09,
    alignItems: 'center',
  },
  colFechaEntrega: {
    flex: 0.09,
    alignItems: 'center',
  },
  colDias: {
    flex: 0.06,
    alignItems: 'center',
  },
  colMaquina: {
    flex: 0.13,
    alignItems: 'center',
  },
  maquinaPickerWrap: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
  },
  maquinaPickerWrapDisabled: {
    opacity: 0.5,
  },
  maquinaPicker: {
    height: 36,
    color: '#0F172A',
    fontSize: 12,
    backgroundColor: 'transparent',
    borderWidth: 0,
    cursor: 'pointer',
    outlineWidth: 0,
  },
  headerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  cellText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0F172A',
    textAlign: 'center',
    width: '100%',
  },
  numeroPedidoPill: {
    backgroundColor: '#ECEFFE',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  numeroPedidoPillText: {
    color: '#4F46E5',
    fontWeight: '800',
    fontSize: 12,
  },
  dragHandle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    cursor: 'grab',
    userSelect: 'none',
  },
  dragHandleDisabled: {
    color: '#CBD5E1',
    cursor: 'default',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusDiseno: { backgroundColor: '#E3F2FD' },
  statusDisenoText: { color: '#1976D2' },
  statusPendienteAprobacion: { backgroundColor: '#FFF3E0' },
  statusPendienteAprobacionText: { color: '#F57C00' },
  statusPendienteCliche: { backgroundColor: '#FCE4EC' },
  statusPendienteClicheText: { color: '#C2185B' },
  statusPendienteImpresion: { backgroundColor: '#F3E5F5' },
  statusPendienteImpresionText: { color: '#7B1FA2' },
  statusPendientePostImpresion: { backgroundColor: '#E0F2F1' },
  statusPendientePostImpresionText: { color: '#00796B' },
  statusFinalizado: { backgroundColor: '#E8F5E9' },
  statusFinalizadoText: { color: '#388E3C' },
  statusParado: { backgroundColor: '#FFEBEE' },
  statusParadoText: { color: '#D32F2F' },
  statusCancelado: { backgroundColor: '#F5F5F5' },
  statusCanceladoText: { color: '#94A3B8' },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  paginationButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
  },
  paginationButtonDisabled: {
    backgroundColor: '#C7D2FE',
  },
  paginationButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  paginationInfo: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  retrasoContainer: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retrasoText: {
    fontWeight: '600',
    fontSize: 12,
  },
  retrasoVerde: { backgroundColor: '#E8F5E9' },
  retrasoAmarillo: { backgroundColor: '#FFF3E0' },
  retrasoRojo: { backgroundColor: '#FFEBEE' },
  retrasoVerdeText: { color: '#2E7D32' },
  retrasoAmarilloText: { color: '#F57C00' },
  retrasoRojoText: { color: '#DC2626' },
  colImpreso: {
    flex: 0.15,
    alignItems: 'center',
  },
  // ── Modal consumo ──────────────────────────────────────────────────────────
  consumoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  consumoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 480,
  },
  consumoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  consumoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  consumoCloseX: {
    fontSize: 18,
    fontWeight: '900',
    color: '#64748B',
    padding: 4,
  },
  consumoInfo: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    gap: 4,
  },
  consumoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 6,
  },
  consumoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  consumoHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 10,
    lineHeight: 18,
  },
  consumoErrorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  consumoErrorText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500',
  },
  consumoResultBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    gap: 4,
  },
  consumoResultTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#16A34A',
    marginBottom: 8,
  },
  consumoResultRow: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 2,
  },
  consumoResultVal: {
    fontWeight: '700',
    color: '#0F172A',
  },
  consumoBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  consumoBtnCancel: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  consumoBtnCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  consumoBtnConfirm: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
    minWidth: 140,
    alignItems: 'center',
  },
  consumoBtnWarning: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#B45309',
    minWidth: 160,
    alignItems: 'center',
  },
  consumoBtnConfirmText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  consumoInfoWarning: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: 'rgba(217,119,6,0.3)',
  },
  consumoWarningText: {
    fontSize: 12,
    color: '#92400E',
    marginTop: 10,
    lineHeight: 18,
    fontWeight: '500',
  },
  consumoPreviewLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  consumoPreviewLoadingText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  consumoRepetidoraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  consumoRepetidoraIcon: {
    fontSize: 14,
  },
  consumoRepetidoraNombre: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  consumoPreviewBox: {
    marginTop: 12,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.25)',
    borderRadius: 8,
    padding: 10,
    gap: 6,
  },
  consumoPreviewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'baseline',
  },
  consumoPreviewKey: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  consumoPreviewVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  mermaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: 'rgba(217,119,6,0.25)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    gap: 12,
  },
  mermaLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    flex: 1,
  },
  mermaInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mermaInput: {
    borderWidth: 1.5,
    borderColor: '#D97706',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    width: 70,
    textAlign: 'right',
    backgroundColor: '#fff',
  },
  mermaUnit: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
  },
});

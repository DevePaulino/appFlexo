import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import TrabajoRow from './TrabajoRow';

export default function ProductionBoard({ maquinas, trabajosPorMaquina, onRefresh, initialMaquinaId, maquinaActivaIds = [], searchText = '', trabajosTotals = {}, onRequestPage }) {
  const [maquinaActual, setMaquinaActual] = useState(0);
  const [trabajos, setTrabajos] = useState([]);
  const [paginaActual, setPaginaActual] = useState(0);
  const [cambiandoMaquina, setCambiandoMaquina] = useState(null);
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
    const color = generateColorFromHash(estado);
    switch (estado) {
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

  const handleCambiarMaquina = async (trabajoId, nuevaMaquinaId) => {
    if (cambiandoMaquina) return;
    setCambiandoMaquina(trabajoId);
    try {
      const res = await fetch('http://localhost:8080/api/produccion/mover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trabajo_id: trabajoId, maquina_destino: nuevaMaquinaId }),
      });
      if (res.ok) {
        const indiceMaquinaDestino = maquinas.findIndex((m) => String(m.id) === String(nuevaMaquinaId));
        try { if (onRequestPage) await onRequestPage(nuevaMaquinaId, 1); } catch (e) { /* no fatal */ }
        if (indiceMaquinaDestino !== -1) setMaquinaActual(indiceMaquinaDestino);
        setTrabajos((prev) => prev.filter((t) => String(t.id || t.trabajo_id || '') !== String(trabajoId)));
        if (onRefresh) await onRefresh();
        try {
          if (onRequestPage) {
            setTimeout(() => {
              onRequestPage(nuevaMaquinaId, 1).catch((e) => console.warn('onRequestPage retry', e));
            }, 500);
          }
        } catch (e) { /* ignore */ }
      } else {
        alert('Error al cambiar de máquina');
      }
    } catch (e) {
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

  if (!maquinas || maquinas.length === 0) {
    return <Text style={{ color: '#94A3B8', padding: 16 }}>No hay máquinas configuradas</Text>;
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
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {filtro ? 'Sin resultados para la búsqueda' : 'No hay trabajos para el filtro seleccionado'}
        </Text>
      </View>
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
                ? '⠿  Selecciona una máquina en la barra superior para activar el reordenamiento por arrastre'
                : '⠿  Selecciona solo una máquina para activar el reordenamiento por arrastre'}
            </Text>
          </View>
        )}

        {/* Column headers */}
        <View style={styles.tableHeader}>
          <View style={[styles.tableCell, styles.colPos]}>
            <Text style={styles.headerText}>#</Text>
          </View>
          <View style={[styles.tableCell, styles.colId]}>
            <Text style={styles.headerText}>ID</Text>
          </View>
          <View style={[styles.tableCell, styles.colNombre]}>
            <Text style={styles.headerText}>Pedido</Text>
          </View>
          <View style={[styles.tableCell, styles.colCliente]}>
            <Text style={styles.headerText}>Cliente</Text>
          </View>
          <View style={[styles.tableCell, styles.colEstado]}>
            <Text style={styles.headerText}>Estado</Text>
          </View>
          <View style={[styles.tableCell, styles.colFechaPedido]}>
            <Text style={styles.headerText}>F. Pedido</Text>
          </View>
          <View style={[styles.tableCell, styles.colFechaEntrega]}>
            <Text style={styles.headerText}>F. Entrega</Text>
          </View>
          <View style={[styles.tableCell, styles.colDias]}>
            <Text style={styles.headerText}>Días</Text>
          </View>
          <View style={[styles.tableCell, styles.colMaquina]}>
            <Text style={styles.headerText}>Máquina</Text>
          </View>
        </View>

        {/* Rows */}
        {canReorder ? (
          <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              <ScrollView style={styles.rowsContainer}>
                {rowList}
              </ScrollView>
            </SortableContext>
          </DndContext>
        ) : (
          <ScrollView style={styles.rowsContainer}>
            {rowList}
          </ScrollView>
        )}

        {/* Pagination */}
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            style={[styles.paginationButton, paginaActual === 0 && styles.paginationButtonDisabled]}
            onPress={() => setPaginaActual(Math.max(0, paginaActual - 1))}
            disabled={paginaActual === 0}
          >
            <Text style={styles.paginationButtonText}>← Anterior</Text>
          </TouchableOpacity>
          <Text style={styles.paginationInfo}>
            Página {paginaActual + 1} de {totalPaginas} ({totalCount} trabajos)
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
            <Text style={styles.paginationButtonText}>Siguiente →</Text>
          </TouchableOpacity>
        </View>

      </View>
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
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginTop: 10,
    borderRadius: 10,
    minHeight: 44,
    alignItems: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    minHeight: 40,
  },
  rowAlternate: {
    backgroundColor: '#F8FAFC',
  },
  draggedRow: {
    opacity: 0.75,
    backgroundColor: '#EFF6FF',
    zIndex: 999,
  },
  tableCell: {
    justifyContent: 'center',
  },
  colPos: {
    width: '6%',
  },
  colId: {
    flex: 0.12,
  },
  colNombre: {
    flex: 0.22,
  },
  colCliente: {
    flex: 0.13,
  },
  colEstado: {
    flex: 0.16,
  },
  colFechaPedido: {
    flex: 0.10,
  },
  colFechaEntrega: {
    flex: 0.10,
  },
  colDias: {
    flex: 0.07,
    alignItems: 'center',
  },
  colMaquina: {
    flex: 0.13,
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
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  cellText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0F172A',
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
    backgroundColor: '#475569',
    borderRadius: 6,
  },
  paginationButtonDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.6,
  },
  paginationButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  paginationInfo: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
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
});

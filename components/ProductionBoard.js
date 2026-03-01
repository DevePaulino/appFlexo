import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

export default function ProductionBoard({ maquinas, trabajosPorMaquina, onRefresh, initialMaquinaId, maquinaActivaIds = [], searchText = '' }) {
  const [maquinaActual, setMaquinaActual] = useState(0);
  const [trabajos, setTrabajos] = useState([]);
  const [draggingId, setDraggingId] = useState(null);
  const [targetIndex, setTargetIndex] = useState(null);
  const [paginaActual, setPaginaActual] = useState(0);
  const [cambiandoMaquina, setCambiandoMaquina] = useState(null);
  const TRABAJOS_POR_PAGINA = 100;
  
  const dragStartRef = useRef({ startY: 0, trabajoId: null, currentIndex: null });
  const rowRefsRef = useRef({});
  const targetIndexRef = useRef(null);
  const maquinasFiltradasIds = (maquinaActivaIds || [])
    .map((id) => Number(id))
    .filter((id) => maquinas.some((m) => Number(m.id) === id));
  const canReorder = maquinasFiltradasIds.length === 1;

  // Actualizar trabajos según filtro de máquinas activo
  useEffect(() => {
    if (!maquinas || maquinas.length === 0) return;

    if (maquinasFiltradasIds.length === 1) {
      const indice = maquinas.findIndex((m) => Number(m.id) === Number(maquinasFiltradasIds[0]));
      if (indice !== -1 && indice !== maquinaActual) {
        setMaquinaActual(indice);
      }
    }

    const maquinasFuente = maquinasFiltradasIds.length > 0
      ? maquinas.filter((m) => maquinasFiltradasIds.includes(Number(m.id)))
      : maquinas;

    const combinado = maquinasFuente.flatMap((maq) =>
      (trabajosPorMaquina[maq.id] || []).map((trab) => ({
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

    setTrabajos(ordenados);
    setPaginaActual(0);
  }, [maquinaActual, maquinas, trabajosPorMaquina, maquinaActivaIds]);

  useEffect(() => {
    if (!maquinas || maquinas.length === 0) return;
    const objetivo = (maquinaActivaIds && maquinaActivaIds.length > 0) ? maquinaActivaIds[0] : initialMaquinaId;
    if (!objetivo) return;
    const indice = maquinas.findIndex((m) => Number(m.id) === Number(objetivo));
    if (indice !== -1 && indice !== maquinaActual) {
      setMaquinaActual(indice);
    }
  }, [maquinaActivaIds, initialMaquinaId, maquinas, maquinaActual]);

  useEffect(() => {
    setPaginaActual(0);
  }, [searchText, maquinaActual, maquinaActivaIds]);

  const handleMouseDown = (e, trabajoId, index) => {
    e.preventDefault();
    dragStartRef.current = {
      startY: e.clientY,
      trabajoId: trabajoId,
      currentIndex: index,
    };
    setDraggingId(trabajoId);
  };

  // Listener global para mouse move
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (draggingId === null) return;

      const draggedIndex = trabajos.findIndex((t) => t.id === draggingId);
      let closestIndex = draggedIndex;
      let closestDistance = Infinity;

      // Recalcular posiciones en tiempo real
      trabajos.forEach((trabajo, idx) => {
        const rowEl = rowRefsRef.current[trabajo.id];
        if (rowEl) {
          const rect = rowEl.getBoundingClientRect();
          const rowCenterY = rect.top + rect.height / 2;
          const distance = Math.abs(e.clientY - rowCenterY);
          
          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = idx;
          }
        }
      });

      targetIndexRef.current = closestIndex;
      setTargetIndex(closestIndex);
    };

    const handleGlobalMouseUp = async () => {
      if (draggingId !== null && canReorder) {
        const draggedIndex = trabajos.findIndex((t) => t.id === draggingId);
        const finalTargetIndex = targetIndexRef.current !== null ? targetIndexRef.current : draggedIndex;
        
        if (draggedIndex !== -1 && draggedIndex !== finalTargetIndex) {
          // Reordenar trabajos
          const newTrabajos = [...trabajos];
          const [movedItem] = newTrabajos.splice(draggedIndex, 1);
          const adjustedTargetIndex = finalTargetIndex > draggedIndex ? finalTargetIndex - 1 : finalTargetIndex;
          newTrabajos.splice(adjustedTargetIndex, 0, movedItem);

          // Actualizar posiciones
          newTrabajos.forEach((t, i) => {
            t.posicion = i + 1;
          });

          setTrabajos(newTrabajos);

          // GUARDAR EN SERVIDOR
          const maqActual = maquinas.find((m) => Number(m.id) === Number(maquinasFiltradasIds[0])) || maquinas[maquinaActual];
          try {
            const trabajosParaGuardar = newTrabajos.map(t => ({
              trabajo_id: t.id,
              nueva_posicion: t.posicion
            }));
            
            const res = await fetch('http://localhost:8080/api/produccion/reordenar', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                maquina_id: maqActual.id,
                trabajos: trabajosParaGuardar
              })
            });
            
            if (!res.ok) {
              console.error('Error guardando orden:', res.statusText);
            } else if (onRefresh) {
              await onRefresh();
            }
          } catch (e) {
            console.error('Error guardando orden:', e);
          }
        }
      }

      setDraggingId(null);
      setTargetIndex(null);
      targetIndexRef.current = null;
    };

    if (draggingId !== null && canReorder) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [draggingId, trabajos, maquinas, maquinaActual, canReorder, maquinasFiltradasIds]);

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'diseno':
        return [styles.statusDiseno, styles.statusDisenoText];
      case 'pendiente-de-aprobacion':
        return [styles.statusPendienteAprobacion, styles.statusPendienteAprobacionText];
      case 'pendiente-de-cliche':
        return [styles.statusPendienteCliche, styles.statusPendienteClicheText];
      case 'pendiente-de-impresion':
        return [styles.statusPendienteImpresion, styles.statusPendienteImpresionText];
      case 'pendiente-post-impresion':
        return [styles.statusPendientePostImpresion, styles.statusPendientePostImpresionText];
      case 'finalizado':
        return [styles.statusFinalizado, styles.statusFinalizadoText];
      case 'parado':
        return [styles.statusParado, styles.statusParadoText];
      case 'cancelado':
        return [styles.statusCancelado, styles.statusCanceladoText];
      default:
        return [styles.statusDiseno, styles.statusDisenoText];
    }
  };

  const getStatusLabel = (estado) => {
    const labels = {
      'diseno': 'Diseño',
      'pendiente-de-aprobacion': 'Pendiente de Aprobación',
      'pendiente-de-cliche': 'Pendiente de Cliché',
      'pendiente-de-impresion': 'Pendiente de Impresión',
      'pendiente-post-impresion': 'Pendiente Post-Impresión',
      'finalizado': 'Finalizado',
      'parado': 'Parado',
      'cancelado': 'Cancelado',
    };
    return labels[estado] || (estado || 'Pendiente');
  };

  const handleCambiarMaquina = async (trabajoId, nuevaMaquinaId) => {
    if (cambiandoMaquina) return; // Evitar múltiples cambios simultáneos
    
    setCambiandoMaquina(trabajoId);
    try {
      const res = await fetch('http://localhost:8080/api/produccion/mover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trabajo_id: trabajoId,
          maquina_destino: nuevaMaquinaId
        })
      });
      
      if (res.ok) {
        // Encontrar el índice de la máquina destino
        const indiceMaquinaDestino = maquinas.findIndex(m => Number(m.id) === Number(nuevaMaquinaId));

        // Cambiar inmediatamente a la pestaña de destino para mantener el contexto
        if (indiceMaquinaDestino !== -1) {
          setMaquinaActual(indiceMaquinaDestino);
        }
        
        // Recargar datos
        if (onRefresh) {
          await onRefresh();
        }
      } else {
        console.error('Error cambiando máquina:', res.statusText);
        alert('Error al cambiar de máquina');
      }
    } catch (e) {
      console.error('Error cambiando máquina:', e);
      alert('Error al cambiar de máquina');
    }
    setCambiandoMaquina(null);
  };

  const getRetrasoStyle = (dias) => {
    if (dias <= 0) {
      return [styles.retrasoContainer, styles.retrasoVerde];
    } else if (dias <= 3) {
      return [styles.retrasoContainer, styles.retrasoAmarillo];
    } else {
      return [styles.retrasoContainer, styles.retrasoRojo];
    }
  };

  const formatearFecha = (valor) => {
    if (!valor) return '-';
    const texto = String(valor).includes('T') ? String(valor).split('T')[0] : String(valor);
    const [anio, mes, dia] = texto.split('-');
    if (!anio || !mes || !dia) return texto;
    return `${dia}-${mes}-${anio}`;
  };

  const getRetrasoTextStyle = (dias) => {
    if (dias <= 0) {
      return [styles.retrasoText, styles.retrasoVerdeText];
    } else if (dias <= 3) {
      return [styles.retrasoText, styles.retrasoAmarilloText];
    } else {
      return [styles.retrasoText, styles.retrasoRojoText];
    }
  };

  const calcularDiasEntrega = (fechaEntrega) => {
    if (!fechaEntrega) return null;

    const hoy = new Date();
    const hoyInicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

    const texto = String(fechaEntrega).includes('T')
      ? String(fechaEntrega).split('T')[0]
      : String(fechaEntrega);
    const [anio, mes, dia] = texto.split('-').map(Number);
    if (!anio || !mes || !dia) return null;

    const entrega = new Date(anio, mes - 1, dia);
    const diffMs = entrega.getTime() - hoyInicio.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  };

  const getEntregaSemaforo = (fechaEntrega) => {
    const dias = calcularDiasEntrega(fechaEntrega);
    if (dias === null) return {
      container: [styles.retrasoContainer, styles.retrasoAmarillo],
      text: [styles.retrasoText, styles.retrasoAmarilloText],
      label: '-',
    };

    if (dias < 0) {
      return {
        container: [styles.retrasoContainer, styles.retrasoRojo],
        text: [styles.retrasoText, styles.retrasoRojoText],
        label: `+${Math.abs(dias)}`,
      };
    }

    if (dias <= 3) {
      return {
        container: [styles.retrasoContainer, styles.retrasoAmarillo],
        text: [styles.retrasoText, styles.retrasoAmarilloText],
        label: `${dias}`,
      };
    }

    return {
      container: [styles.retrasoContainer, styles.retrasoVerde],
      text: [styles.retrasoText, styles.retrasoVerdeText],
      label: `${dias}`,
    };
  };

  if (!maquinas || maquinas.length === 0) {
    return <Text>No hay máquinas</Text>;
  }

  const filtro = (searchText || '').trim().toLowerCase();
  const trabajosFiltrados = filtro
    ? trabajos.filter((trabajo) => {
        const valoresBusqueda = [
          trabajo?.id,
          trabajo?.nombre,
          trabajo?.cliente,
          trabajo?.referencia,
          trabajo?.estado,
          trabajo?.fecha_pedido,
          trabajo?.fecha_entrega,
          trabajo?.fecha_finalizacion,
          trabajo?.dias_retraso,
          trabajo?.numero_pedido,
        ]
          .map((v) => String(v || '').toLowerCase())
          .join(' ');
        return valoresBusqueda.includes(filtro);
      })
    : trabajos;

  return (
    <View style={styles.container}>
      {/* Tabla de trabajos */}
      <View style={styles.tableContainer}>
        {/* Encabezado */}
        <View style={styles.tableHeader}>
          <View style={[styles.tableCell, styles.colPos]}>
            <Text style={styles.headerText}>#</Text>
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

        {/* Contenedor de filas sin scroll */}
        <View style={styles.rowsContainer}>
          {trabajosFiltrados && trabajosFiltrados.length > 0 ? (
            (() => {
              const startIdx = paginaActual * TRABAJOS_POR_PAGINA;
              const endIdx = startIdx + TRABAJOS_POR_PAGINA;
              const trabajosPagina = trabajosFiltrados.slice(startIdx, endIdx);
              const totalPaginas = Math.ceil(trabajosFiltrados.length / TRABAJOS_POR_PAGINA);

              return (
                <>
                  {trabajosPagina.map((trabajo, idxPagina) => {
                    const [statusStyle, statusTextStyle] = getStatusColor(trabajo.estado);
                    const entregaSemaforo = getEntregaSemaforo(trabajo.fecha_entrega);
                    const isDragging = draggingId === trabajo.id;
                    const showDropIndicator = canReorder && targetIndex === (startIdx + idxPagina) && !isDragging;
                    const idxGlobal = startIdx + idxPagina;
                    const maquinaFilaId = trabajo._maquina_id ?? maquinas[maquinaActual]?.id;

                    return (
                      <View key={trabajo.id}>
                        {showDropIndicator && <View style={styles.dropIndicator} />}
                        <View
                          ref={(el) => {
                            if (el) {
                              rowRefsRef.current[trabajo.id] = el;
                            }
                          }}
                          style={[
                            styles.tableRow,
                            idxGlobal % 2 === 1 && styles.rowAlternate,
                            canReorder && isDragging && styles.draggedRow,
                            !canReorder && { cursor: 'default' },
                          ]}
                          onMouseDown={canReorder ? (e) => handleMouseDown(e, trabajo.id, idxGlobal) : undefined}
                        >
                          <View style={[styles.tableCell, styles.colPos]}>
                            <Text style={styles.dragHandle}>{canReorder ? '≡' : '-'}</Text>
                          </View>
                          <View style={[styles.tableCell, styles.colNombre]}>
                            <Text style={styles.cellText} numberOfLines={1}>
                              {trabajo.nombre}
                            </Text>
                          </View>
                          <View style={[styles.tableCell, styles.colCliente]}>
                            <Text style={styles.cellText} numberOfLines={1}>
                              {typeof trabajo.cliente === 'string' ? trabajo.cliente : (trabajo.cliente && (trabajo.cliente.nombre || '-'))}
                            </Text>
                          </View>
                          <View style={[styles.tableCell, styles.colEstado]}>
                            <View style={[styles.statusBadge, statusStyle]}>
                              <Text style={[styles.statusText, statusTextStyle]} numberOfLines={1}>
                                {getStatusLabel(trabajo.estado)}
                              </Text>
                            </View>
                          </View>
                          <View style={[styles.tableCell, styles.colFechaPedido]}>
                            <Text style={styles.cellText} numberOfLines={1}>
                              {formatearFecha(trabajo.fecha_pedido)}
                            </Text>
                          </View>
                          <View style={[styles.tableCell, styles.colFechaEntrega]}>
                            <Text style={styles.cellText} numberOfLines={1}>
                              {formatearFecha(trabajo.fecha_entrega)}
                            </Text>
                          </View>
                          <View style={[styles.tableCell, styles.colDias]}>
                            <View style={entregaSemaforo.container}>
                              <Text style={entregaSemaforo.text} numberOfLines={1}>
                                {entregaSemaforo.label}
                              </Text>
                            </View>
                          </View>
                          <View style={[styles.tableCell, styles.colMaquina]}>
                            <select
                              style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: '1px solid #CCC',
                                backgroundColor: '#FFF',
                                fontSize: '12px',
                                cursor: 'pointer',
                              }}
                              value={maquinaFilaId}
                              onChange={(e) => {
                                const nuevaMaquina = parseInt(e.target.value);
                                if (nuevaMaquina !== maquinaFilaId) {
                                  handleCambiarMaquina(trabajo.id, nuevaMaquina);
                                }
                              }}
                              disabled={cambiandoMaquina === trabajo.id}
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              {maquinas.map((maq) => (
                                <option key={maq.id} value={maq.id}>
                                  {maq.nombre}
                                </option>
                              ))}
                            </select>
                          </View>
                        </View>
                      </View>
                    );
                  })}

                  {/* Controles de paginación */}
                  <View style={styles.paginationContainer}>
                    <TouchableOpacity
                      style={[styles.paginationButton, paginaActual === 0 && styles.paginationButtonDisabled]}
                      onPress={() => setPaginaActual(Math.max(0, paginaActual - 1))}
                      disabled={paginaActual === 0}
                    >
                      <Text style={styles.paginationButtonText}>← Anterior</Text>
                    </TouchableOpacity>
                    
                    <Text style={styles.paginationInfo}>
                      Página {paginaActual + 1} de {totalPaginas} ({trabajosFiltrados.length} trabajos)
                    </Text>
                    
                    <TouchableOpacity
                      style={[styles.paginationButton, paginaActual >= totalPaginas - 1 && styles.paginationButtonDisabled]}
                      onPress={() => setPaginaActual(Math.min(totalPaginas - 1, paginaActual + 1))}
                      disabled={paginaActual >= totalPaginas - 1}
                    >
                      <Text style={styles.paginationButtonText}>Siguiente →</Text>
                    </TouchableOpacity>
                  </View>
                </>
              );
            })()
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {filtro ? 'No hay resultados para la búsqueda con este filtro' : 'No hay trabajos para el filtro seleccionado'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tableScroll: {
    flex: 1,
    paddingHorizontal: 10,
  },
  tableContainer: {
    flex: 1,
    paddingHorizontal: 10,
    flexDirection: 'column',
  },
  rowsContainer: {
    flex: 1,
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#344054',
    borderWidth: 1.5,
    borderColor: '#243447',
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginTop: 10,
    borderRadius: 10,
    minHeight: 44,
    alignItems: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    cursor: 'grab',
  },
  rowAlternate: {
    backgroundColor: '#EEF1F4',
  },
  draggedRow: {
    opacity: 0.6,
    backgroundColor: '#E3F2FD',
  },
  dropIndicator: {
    height: 2,
    backgroundColor: '#000',
    marginVertical: 0,
  },
  tableCell: {
    justifyContent: 'center',
  },
  colPos: {
    width: '8%',
  },
  colNombre: {
    flex: 0.22,
  },
  colCliente: {
    flex: 0.13,
  },
  colReferencia: {
    flex: 0.12,
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
  colRetraso: {
    flex: 0.08,
    alignItems: 'center',
  },
  colPresupuesto: {
    flex: 0.08,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  cellText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#232323',
  },
  retrasoText: {
    color: '#D32F2F',
    fontWeight: '600',
  },
  dragHandle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4B5563',
    textAlign: 'center',
    cursor: 'grab',
    userSelect: 'none',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Estados de color
  statusDiseno: {
    backgroundColor: '#E3F2FD',
  },
  statusDisenoText: {
    color: '#1976D2',
  },
  statusPendienteAprobacion: {
    backgroundColor: '#FFF3E0',
  },
  statusPendienteAprobacionText: {
    color: '#F57C00',
  },
  statusPendienteCliche: {
    backgroundColor: '#FCE4EC',
  },
  statusPendienteClicheText: {
    color: '#C2185B',
  },
  statusPendienteImpresion: {
    backgroundColor: '#F3E5F5',
  },
  statusPendienteImpresionText: {
    color: '#7B1FA2',
  },
  statusPendientePostImpresion: {
    backgroundColor: '#E0F2F1',
  },
  statusPendientePostImpresionText: {
    color: '#00796B',
  },
  statusFinalizado: {
    backgroundColor: '#E8F5E9',
  },
  statusFinalizadoText: {
    color: '#388E3C',
  },
  statusParado: {
    backgroundColor: '#FFEBEE',
  },
  statusParadoText: {
    color: '#D32F2F',
  },
  statusCancelado: {
    backgroundColor: '#F5F5F5',
  },
  statusCanceladoText: {
    color: '#616161',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFF',
    gap: 12,
  },
  paginationButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#3AB274',
    borderRadius: 4,
  },
  paginationButtonDisabled: {
    backgroundColor: '#CCC',
    opacity: 0.6,
  },
  paginationButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  paginationInfo: {
    fontSize: 12,
    fontWeight: '600',
    color: '#232323',
  },
  // Semáforo para retraso
  retrasoContainer: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retrasoVerde: {
    backgroundColor: '#E8F5E9',
  },
  retrasoAmarillo: {
    backgroundColor: '#FFF3E0',
  },
  retrasoRojo: {
    backgroundColor: '#FFEBEE',
  },
  retrasoVerdeText: {
    color: '#2E7D32',
  },
  retrasoAmarilloText: {
    color: '#F57C00',
  },
  retrasoRojoText: {
    color: '#D32F2F',
  },
});


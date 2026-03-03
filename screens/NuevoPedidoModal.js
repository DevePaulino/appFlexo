import React from 'react';
import { Alert } from 'react-native';
import NuevoPresupuestoModal from './NuevoPresupuestoModal';

export default function NuevoPedidoModal({ visible, onClose, onSave, initialValues, currentUser }) {
  try { console.log('NuevoPedidoModal render -> visible:', visible, 'initialValues id:', initialValues && (initialValues.id || initialValues.pedido_id || initialValues._id)); } catch(e) {}
  const handleCrearPedidoDesdeFormulario = async (formulario) => {
    const puedeCrear = ['root', 'administrador', 'admin'].includes(String(currentUser?.rol || '').toLowerCase());
    if (!puedeCrear) {
      Alert.alert('Permiso denegado', 'Tu rol no tiene permiso para crear pedidos.');
      return;
    }
    const nombreTrabajo = formulario.nombre || formulario.referencia || `Trabajo ${formulario.numero}`;

    try {
      // If editing existing pedido, update it
      const editingPedidoId = formulario.pedido_id || (initialValues && (initialValues.id || initialValues.pedido_id));
      if (editingPedidoId) {
        // Prepare update body
        const updateBody = {};
        if (formulario.referencia) updateBody['referencia'] = formulario.referencia;
        if (formulario.fecha) updateBody['fecha_pedido'] = formulario.fecha;
        if (formulario.fechaEntrega) updateBody['fecha_entrega'] = formulario.fechaEntrega;
        updateBody['datos_presupuesto'] = {
          cliente: formulario.cliente,
          razon_social: formulario.razonSocial,
          cif: formulario.cif,
          personas_contacto: formulario.personasContacto,
          email: formulario.email,
          vendedor: formulario.vendedor,
          referencia: formulario.referencia,
          fecha: formulario.fecha,
          formatoAncho: formulario.formatoAncho,
          formatoLargo: formulario.formatoLargo,
          maquina: formulario.maquina,
          material: formulario.material,
          acabado: formulario.acabado,
          tirada: formulario.tirada,
          selectedTintas: formulario.selectedTintas,
          detalleTintaEspecial: formulario.detalleTintaEspecial,
          troquelEstadoSel: formulario.troquelEstadoSel,
          troquelFormaSel: formulario.troquelFormaSel,
          troquelCoste: formulario.troquelCoste,
          observaciones: formulario.observaciones,
        };

        try {
          const res = await fetch(`http://localhost:8080/api/pedidos/${editingPedidoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateBody),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            Alert.alert('Error', data.error || 'Error actualizando pedido');
            return;
          }
          Alert.alert('Éxito', 'Pedido actualizado correctamente');
          onSave({ ...formulario, pedido_id: editingPedidoId });
          onClose();
        } catch (err) {
          Alert.alert('Error', 'Error de conexión: ' + err.message);
        }
        return;
      }

      // Primero crear el trabajo asociado
      const trabajo = {
        nombre: nombreTrabajo,
        cliente: formulario.cliente,
        referencia: formulario.referencia,
        fecha_entrega: formulario.fechaEntrega || formulario.fecha || new Date().toISOString().split('T')[0]
      };

      const resTrabajo = await fetch('http://localhost:8080/api/trabajos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trabajo)
      });
      const dataTrabajo = await resTrabajo.json();
      if (!resTrabajo.ok) {
        Alert.alert('Error', dataTrabajo.error || 'Error creando trabajo');
        return;
      }

      const trabajo_id = dataTrabajo.trabajo_id || dataTrabajo.id || null;
      if (!trabajo_id) {
        Alert.alert('Error', 'Respuesta inválida al crear trabajo');
        return;
      }

      // Generar número de pedido
      const numero_pedido = `PED-${Date.now()}`;

      const bodyPedido = {
        trabajo_id: trabajo_id,
        numero_pedido: numero_pedido,
        referencia: formulario.referencia,
        fecha_pedido: formulario.fecha,
        fecha_entrega: formulario.fechaEntrega || formulario.fecha,
        datos_presupuesto: {
          cliente: formulario.cliente,
          razon_social: formulario.razonSocial,
          cif: formulario.cif,
          personas_contacto: formulario.personasContacto,
          email: formulario.email
        }
      };

      const respPedido = await fetch('http://localhost:8080/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPedido)
      });
      const dataPedido = await respPedido.json();
      if (!respPedido.ok) {
        Alert.alert('Error', dataPedido.error || 'Error creando pedido');
        return;
      }

      Alert.alert('Éxito', 'Pedido creado exitosamente');
      onSave({
        ...formulario,
        nombre: nombreTrabajo,
        numero_pedido: numero_pedido,
        pedido_id: dataPedido.pedido_id
      });
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Error de conexión: ' + error.message);
    }
  };

  return (
    <NuevoPresupuestoModal
      visible={visible}
      onClose={onClose}
      onSave={handleCrearPedidoDesdeFormulario}
      initialValues={initialValues}
      modalTitle="Nuevo Pedido"
      submitLabel="Guardar Pedido"
      fechaLabel="Fecha de creación"
      showFechaEntrega={true}
      fechaEntregaLabel="Fecha de entrega"
      showMaquinaField={true}
      maquinaLabel="Máquina"
      currentUser={currentUser}
    />
  );
}

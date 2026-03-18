import React from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import NuevoPresupuestoModal from './NuevoPresupuestoModal';

export default function NuevoPedidoModal({ visible, onClose, onSave, initialValues, currentUser, puedeCrear }) {
  const { t } = useTranslation();
  const handleCrearPedidoDesdeFormulario = async (formulario) => {
    if (!puedeCrear) {
      Alert.alert(t('forms.permisoDenegado'), t('forms.sinPermisoPed'));
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
          maquina: formulario.maquina,
          material: formulario.material,
          acabado: formulario.acabado,
          tirada: formulario.tirada,
          selectedTintas: formulario.selectedTintas,
          pantones: formulario.pantones || [],
          detalleTintaEspecial: formulario.detalleTintaEspecial,
          troquelEstadoSel: formulario.troquelEstadoSel,
          troquelFormaSel: formulario.troquelFormaSel,
          troquelCoste: formulario.troquelCoste,
          troquelId: formulario.troquelId || null,
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
            Alert.alert(t('common.error'), data.error || t('common.error'));
            return;
          }
          Alert.alert(t('common.success'), t('common.success'));
          onSave({ ...formulario, pedido_id: editingPedidoId });
          onClose();
        } catch (err) {
          Alert.alert(t('common.error'), t('common.error') + ': ' + err.message);
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
        Alert.alert(t('common.error'), dataTrabajo.error || t('common.error'));
        return;
      }

      const trabajo_id = dataTrabajo.trabajo_id || dataTrabajo.id || null;
      if (!trabajo_id) {
        Alert.alert(t('common.error'), t('common.error'));
        return;
      }

      const bodyPedido = {
        trabajo_id: trabajo_id,
        referencia: formulario.referencia,
        fecha_pedido: formulario.fecha,
        fecha_entrega: formulario.fechaEntrega || formulario.fecha,
        datos_presupuesto: {
          cliente: formulario.cliente,
          razon_social: formulario.razonSocial,
          cif: formulario.cif,
          personas_contacto: formulario.personasContacto,
          email: formulario.email,
          vendedor: formulario.vendedor,
          referencia: formulario.referencia,
          fecha: formulario.fecha,
          maquina: formulario.maquina,
          material: formulario.material,
          acabado: formulario.acabado,
          tirada: formulario.tirada,
          selectedTintas: formulario.selectedTintas,
          pantones: formulario.pantones || [],
          detalleTintaEspecial: formulario.detalleTintaEspecial,
          troquelEstadoSel: formulario.troquelEstadoSel,
          troquelFormaSel: formulario.troquelFormaSel,
          troquelCoste: formulario.troquelCoste,
          troquelId: formulario.troquelId || null,
          observaciones: formulario.observaciones,
        }
      };

      const respPedido = await fetch('http://localhost:8080/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPedido)
      });
      const dataPedido = await respPedido.json();
      if (!respPedido.ok) {
        if (respPedido.status === 402) {
          Alert.alert(
            t('billing.insufficientCredits'),
            t('billing.insufficientCreditsMsg', {
              required: dataPedido.required ?? '',
              balance: dataPedido.balance ?? '',
            })
          );
        } else {
          Alert.alert(t('common.error'), dataPedido.error || t('common.error'));
        }
        return;
      }

      onSave({
        ...formulario,
        nombre: nombreTrabajo,
        numero_pedido: dataPedido.numero_pedido,
        pedido_id: dataPedido.pedido_id
      });
      onClose();
    } catch (error) {
      Alert.alert(t('common.error'), t('common.error') + ': ' + error.message);
    }
  };

  return (
    <NuevoPresupuestoModal
      visible={visible}
      onClose={onClose}
      onSave={handleCrearPedidoDesdeFormulario}
      initialValues={initialValues}
      modalTitle={t('forms.newPedido')}
      submitLabel={t('forms.savePedido')}
      fechaLabel={t('forms.fechaCreacion')}
      showFechaEntrega={true}
      fechaEntregaLabel={t('forms.fechaEntrega')}
      showMaquinaField={true}
      maquinaLabel={t('forms.maquina')}
      currentUser={currentUser}
    />
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Modal, Alert, Platform, Pressable } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { usePermission } from './usePermission';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  header: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    minHeight: 96,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: 38,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    textAlign: 'left',
    marginLeft: 10,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 11,
    paddingVertical: 5,
    fontSize: 12,
    color: '#0F172A',
    width: '62%',
    alignSelf: 'center',
  },
  btn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnNew: {
    backgroundColor: '#475569',
  },
  btnNewText: {
    color: '#FFFFFF',
  },
  btnText: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 13,
  },
  btnPlusWrap: {
    position: 'relative',
  },
  btnPlus: {
    backgroundColor: '#475569',
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPlusText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 28,
    lineHeight: 28,
    marginTop: -2,
  },
  hoverHint: {
    position: 'absolute',
    left: 44,
    top: 8,
    backgroundColor: '#0F172A',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  hoverHintText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700',
  },
  tableContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 6,
    borderRadius: 10,
    minHeight: 44,
    alignItems: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 6,
  },
  rowAlternate: {
    backgroundColor: '#F8FAFC',
  },
  tableCell: {
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  cellText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0F172A',
  },
  colNombre: {
    flex: 0.18,
  },
  colRazonSocial: {
    flex: 0.18,
  },
  colCif: {
    flex: 0.12,
  },
  colContacto: {
    flex: 0.2,
  },
  colEmail: {
    flex: 0.2,
  },
  colAcciones: {
    flex: 0.16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  actionBtn: {
    backgroundColor: '#475569',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteBtn: {
    backgroundColor: '#DC2626',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
  },
  emptyText: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 32,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  paginationBtn: {
    backgroundColor: '#475569',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  paginationBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  paginationBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  paginationInfo: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '700',
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 10,
  },
  fieldInputError: {
    borderColor: '#D21820',
  },
  errorText: {
    color: '#D21820',
    fontSize: 12,
    marginTop: -6,
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  btnCancel: {
    backgroundColor: '#F1F5F9',
  },
});

export default function ClientesScreen({ currentUser }) {
  const ITEMS_PER_PAGE = 100;
  const [clientes, setClientes] = useState([]);
  const [filtrados, setFiltrados] = useState(clientes);
  const [paginaClientes, setPaginaClientes] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [clienteEditandoId, setClienteEditandoId] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [hoverNuevo, setHoverNuevo] = useState(false);
  const hoverNuevoTimerRef = useRef(null);
  const [submittedNuevo, setSubmittedNuevo] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoRazonSocial, setNuevoRazonSocial] = useState('');
  const [nuevoCif, setNuevoCif] = useState('');
  const [nuevoContacto, setNuevoContacto] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');

  const normalizarTexto = (value) => (value || '').toString().trim();

  const normalizarCif = (value) => normalizarTexto(value).replace(/[\s-]/g, '').toUpperCase();
  const emailValido = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const cifValido = (value) => /^[A-Z]\d{7}[A-Z0-9]$/.test(value);

  const cargarClientes = async () => {
    setLoading(true);
    try {
      const cliRes = await fetch('http://localhost:8080/api/clientes');
      const clientesData = cliRes.ok ? await cliRes.json() : { clientes: [] };
      console.log('DEBUG cargarClientes response:', clientesData);

      const lista = (clientesData.clientes || [])
        .map((item) => ({
          id: item.id,
          nombre: item.nombre || '',
          razonSocial: item.razon_social || '',
          cif: item.cif || '',
          contacto: item.personas_contacto || '',
          email: item.email || '',
        }))
        .sort((a, b) =>
        (a.nombre || a.razonSocial || '').localeCompare(b.nombre || b.razonSocial || '', 'es')
      );

      setClientes(lista);
    } catch {
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      cargarClientes();
    }, [])
  );

  useEffect(() => {
    const query = (busqueda || '').trim().toLowerCase();
    const filtered = clientes.filter((c) => {
      if (!query) return true;
      const valoresBusqueda = [
        c.id,
        c.nombre,
        c.razonSocial,
        c.cif,
        c.contacto,
        c.email,
      ]
        .map((v) => String(v || '').toLowerCase())
        .join(' ');
      return valoresBusqueda.includes(query);
    });
    setFiltrados(filtered);
  }, [busqueda, clientes]);

  useEffect(() => {
    setPaginaClientes(1);
  }, [busqueda, clientes]);

  const totalPaginasClientes = Math.max(1, Math.ceil(filtrados.length / ITEMS_PER_PAGE));
  const clientesPaginados = filtrados.slice((paginaClientes - 1) * ITEMS_PER_PAGE, paginaClientes * ITEMS_PER_PAGE);

  useEffect(() => {
    if (paginaClientes > totalPaginasClientes) {
      setPaginaClientes(totalPaginasClientes);
    }
  }, [paginaClientes, totalPaginasClientes]);

  const resetFormularioNuevoCliente = () => {
    setNuevoNombre('');
    setNuevoRazonSocial('');
    setNuevoCif('');
    setNuevoContacto('');
    setNuevoEmail('');
    setModoEdicion(false);
    setClienteEditandoId(null);
    setSubmittedNuevo(false);
  };

  const cerrarModalNuevoCliente = () => {
    setModalVisible(false);
    resetFormularioNuevoCliente();
  };

  const abrirDetalleEdicion = (cliente) => {
    setNuevoNombre(cliente.nombre || '');
    setNuevoRazonSocial(cliente.razonSocial || '');
    setNuevoCif(cliente.cif || '');
    setNuevoContacto(cliente.contacto || '');
    setNuevoEmail(cliente.email || '');
    setModoEdicion(true);
    setClienteEditandoId(cliente.id || null);
    setSubmittedNuevo(false);
    setModalVisible(true);
  };

  const guardarCliente = async () => {
    setSubmittedNuevo(true);

    const nombre = normalizarTexto(nuevoNombre);
    const razonSocial = normalizarTexto(nuevoRazonSocial);
    const cif = normalizarCif(nuevoCif);
    const contacto = normalizarTexto(nuevoContacto);
    const email = normalizarTexto(nuevoEmail).toLowerCase();

    const emailVacio = !email;
    const emailInvalido = !emailVacio && !emailValido(email);
    const cifInvalido = cif !== '' && !cifValido(cif);

    if (!nombre) return;
    if (emailVacio) return;
    if (emailInvalido || cifInvalido) return;

    setGuardando(true);
    try {
      const endpoint = modoEdicion
        ? `http://localhost:8080/api/clientes/${clienteEditandoId}`
        : 'http://localhost:8080/api/clientes';
      const response = await fetch(endpoint, {
        method: modoEdicion ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          razon_social: razonSocial,
          cif,
          personas_contacto: contacto,
          email,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        Alert.alert('Error', data.error || 'No se pudo guardar el cliente');
        return;
      }

      cerrarModalNuevoCliente();
      await cargarClientes();
      Alert.alert('Éxito', modoEdicion ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente');
    } catch (error) {
      Alert.alert('Error', 'Error de conexión: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  const nombreVacio = submittedNuevo && !normalizarTexto(nuevoNombre);
  const cifNuevoNormalizado = normalizarCif(nuevoCif);
  const cifNuevoInvalido = submittedNuevo && cifNuevoNormalizado !== '' && !cifValido(cifNuevoNormalizado);
  const emailNuevoNormalizado = normalizarTexto(nuevoEmail).toLowerCase();
  const emailNuevoVacio = submittedNuevo && emailNuevoNormalizado === '';
  const emailNuevoInvalido = submittedNuevo && emailNuevoNormalizado !== '' && !emailValido(emailNuevoNormalizado);

  const ejecutarEliminacionCliente = async (cliente) => {
    try {
      if (!cliente?.id) {
        Alert.alert('Error', 'Cliente inválido para eliminar');
        return;
      }

      const response = await fetch(`http://localhost:8080/api/clientes/${cliente.id}`, {
        method: 'DELETE',
      });
      const data = await response.json().catch(() => ({}));
      console.log('DEBUG delete response ok=', response.ok, 'status=', response.status, 'data=', data);

      if (!response.ok) {
        if (response.status === 409 && data?.in_use) {
          Alert.alert('Cliente en uso', data.error || 'No se puede eliminar porque el cliente tiene trabajos asociados');
          return;
        }
        Alert.alert('Error', data.error || 'No se pudo eliminar el cliente');
        return;
      }

      await cargarClientes();
      console.log('DEBUG after reload clientes, loading=', loading);
      Alert.alert('OK', 'Cliente eliminado correctamente');
    } catch (error) {
      Alert.alert('Error', `No se pudo eliminar: ${error.message}`);
    }
  };

  const eliminarCliente = (cliente) => {
    const mensaje = `¿Seguro que quieres eliminar "${cliente.nombre || 'este cliente'}"?`;

    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.confirm === 'function') {
      const confirmado = window.confirm(mensaje);
      if (confirmado) {
        ejecutarEliminacionCliente(cliente);
      }
      return;
    }

    Alert.alert('Eliminar cliente', mensaje, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => ejecutarEliminacionCliente(cliente),
      },
    ]);
  };

  const handleHoverNuevoIn = () => {
    if (hoverNuevoTimerRef.current) clearTimeout(hoverNuevoTimerRef.current);
    hoverNuevoTimerRef.current = setTimeout(() => setHoverNuevo(true), 2000);
  };

  const handleHoverNuevoOut = () => {
    if (hoverNuevoTimerRef.current) clearTimeout(hoverNuevoTimerRef.current);
    hoverNuevoTimerRef.current = null;
    setHoverNuevo(false);
  };

  useEffect(() => {
    return () => {
      if (hoverNuevoTimerRef.current) clearTimeout(hoverNuevoTimerRef.current);
    };
  }, []);

  const puedeCrear = usePermission('edit_clientes');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.btnPlusWrap}>
            <Pressable
              style={[styles.btnPlus, !puedeCrear && { opacity: 0.45 }]}
              onPress={() => puedeCrear && setModalVisible(true)}
              disabled={!puedeCrear}
              onHoverIn={handleHoverNuevoIn}
              onHoverOut={handleHoverNuevoOut}
            >
              <Text style={styles.btnPlusText}>+</Text>
            </Pressable>
            {hoverNuevo && (
              <View style={styles.hoverHint}>
                <Text style={styles.hoverHintText}>{!puedeCrear ? 'Permiso denegado' : 'Nuevo cliente'}</Text>
              </View>
            )}
          </View>
          <Text style={styles.headerTitle}>Clientes</Text>
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por cualquier campo..."
          value={busqueda}
          onChangeText={setBusqueda}
          placeholderTextColor="#94A3B8"
        />
      </View>

      {loading ? (
        <View style={styles.tableContainer}>
          <Text style={styles.emptyText}>Cargando clientes...</Text>
        </View>
      ) : filtrados.length === 0 ? (
        <View style={styles.tableContainer}>
          <Text style={styles.emptyText}>
            {busqueda ? 'No se encontraron resultados' : 'No hay clientes'}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <View style={[styles.tableCell, styles.colNombre]}>
              <Text style={styles.headerText}>Cliente</Text>
            </View>
            <View style={[styles.tableCell, styles.colRazonSocial]}>
              <Text style={styles.headerText}>Razón social</Text>
            </View>
            <View style={[styles.tableCell, styles.colCif]}>
              <Text style={styles.headerText}>CIF</Text>
            </View>
            <View style={[styles.tableCell, styles.colContacto]}>
              <Text style={styles.headerText}>Contacto</Text>
            </View>
            <View style={[styles.tableCell, styles.colEmail]}>
              <Text style={styles.headerText}>Email</Text>
            </View>
            <View style={[styles.tableCell, styles.colAcciones]}>
              <Text style={styles.headerText}>Acciones</Text>
            </View>
          </View>
          {clientesPaginados.map((cliente, idx) => (
            <View key={cliente.id} style={[styles.tableRow, (idx + (paginaClientes - 1) * ITEMS_PER_PAGE) % 2 === 1 && styles.rowAlternate]}>
              <View style={[styles.tableCell, styles.colNombre]}>
                <Text style={styles.cellText} numberOfLines={1}>{cliente.nombre || '-'}</Text>
              </View>
              <View style={[styles.tableCell, styles.colRazonSocial]}>
                <Text style={styles.cellText} numberOfLines={1}>{cliente.razonSocial || '-'}</Text>
              </View>
              <View style={[styles.tableCell, styles.colCif]}>
                <Text style={styles.cellText} numberOfLines={1}>{cliente.cif || '-'}</Text>
              </View>
              <View style={[styles.tableCell, styles.colContacto]}>
                <Text style={styles.cellText} numberOfLines={1}>{cliente.contacto || '-'}</Text>
              </View>
              <View style={[styles.tableCell, styles.colEmail]}>
                <Text style={styles.cellText} numberOfLines={1}>{cliente.email || '-'}</Text>
              </View>
              <View style={[styles.tableCell, styles.colAcciones]}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => abrirDetalleEdicion(cliente)}>
                  <Text style={styles.actionBtnText}>Ver</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => eliminarCliente(cliente)}>
                  <Text style={styles.actionBtnText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          {totalPaginasClientes > 1 && (
            <View style={styles.paginationRow}>
              <TouchableOpacity
                style={[styles.paginationBtn, paginaClientes === 1 && styles.paginationBtnDisabled]}
                onPress={() => setPaginaClientes((prev) => Math.max(1, prev - 1))}
                disabled={paginaClientes === 1}
              >
                <Text style={styles.paginationBtnText}>Anterior</Text>
              </TouchableOpacity>
              <Text style={styles.paginationInfo}>Página {paginaClientes} de {totalPaginasClientes}</Text>
              <TouchableOpacity
                style={[styles.paginationBtn, paginaClientes === totalPaginasClientes && styles.paginationBtnDisabled]}
                onPress={() => setPaginaClientes((prev) => Math.min(totalPaginasClientes, prev + 1))}
                disabled={paginaClientes === totalPaginasClientes}
              >
                <Text style={styles.paginationBtnText}>Siguiente</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={cerrarModalNuevoCliente}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{modoEdicion ? 'Detalle / Editar cliente' : 'Nuevo cliente'}</Text>

            <Text style={styles.fieldLabel}>Cliente *</Text>
            <TextInput
              style={[styles.fieldInput, nombreVacio && styles.fieldInputError]}
              value={nuevoNombre}
              onChangeText={setNuevoNombre}
              placeholder="Nombre cliente"
              placeholderTextColor="#94A3B8"
            />
            {nombreVacio && <Text style={styles.errorText}>El nombre del cliente es obligatorio</Text>}

            <Text style={styles.fieldLabel}>Razón social</Text>
            <TextInput
              style={styles.fieldInput}
              value={nuevoRazonSocial}
              onChangeText={setNuevoRazonSocial}
              placeholder="Razón social"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.fieldLabel}>CIF</Text>
            <TextInput
              style={[styles.fieldInput, cifNuevoInvalido && styles.fieldInputError]}
              value={nuevoCif}
              onChangeText={setNuevoCif}
              placeholder="A1234567B"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
            />
            {cifNuevoInvalido && <Text style={styles.errorText}>CIF no válido (ejemplo: A1234567B)</Text>}

            <Text style={styles.fieldLabel}>Personas de contacto</Text>
            <TextInput
              style={styles.fieldInput}
              value={nuevoContacto}
              onChangeText={setNuevoContacto}
              placeholder="Nombre(s) de contacto"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={[styles.fieldInput, emailNuevoInvalido && styles.fieldInputError]}
              value={nuevoEmail}
              onChangeText={setNuevoEmail}
              placeholder="email@cliente.com"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {emailNuevoVacio && <Text style={styles.errorText}>El email es obligatorio</Text>}
            {emailNuevoInvalido && <Text style={styles.errorText}>Email no válido</Text>}

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={cerrarModalNuevoCliente}>
                <Text style={styles.btnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnNew]} onPress={guardarCliente}>
                <Text style={[styles.btnText, styles.btnNewText]}>
                  {guardando ? 'Guardando...' : modoEdicion ? 'Guardar cambios' : 'Guardar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

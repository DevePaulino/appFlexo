import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Modal, Alert, Platform, Pressable } from 'react-native';
import { usePermission } from './usePermission';
import EmptyState from '../components/EmptyState';
import DeleteConfirmRow from '../components/DeleteConfirmRow';
import { useTranslation } from 'react-i18next';
import { useClientes } from '../ClientesContext';

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
  btn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnNew: {
    borderColor: '#CBD5E1',
  },
  btnNewText: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  btnText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 13,
  },
  btnPlusWrap: {
    position: 'relative',
  },
  btnPlus: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnPlusDisabled: {
    backgroundColor: '#A5B4FC',
  },
  btnPlusText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
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
    color: '#F1F5F9',
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
    backgroundColor: '#ECEFFE',
    borderWidth: 1,
    borderColor: '#D9DBFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderRadius: 10,
    minHeight: 40,
    alignItems: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 4,
    cursor: 'pointer',
    shadowColor: '#1E1B4B',
    shadowOpacity: 0.03,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  rowAlternate: {
    backgroundColor: '#FAFBFF',
  },
  tableCell: {
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#4F46E5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  paginationBtnDisabled: {
    backgroundColor: '#C7D2FE',
  },
  paginationBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  paginationInfo: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    width: '100%',
    maxWidth: 480,
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
    backgroundColor: '#F1F5F9',
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
    backgroundColor: '#EEF2F8',
  },
});

export default function ClientesScreen({ currentUser }) {
  const { t } = useTranslation();
  const ITEMS_PER_PAGE = 100;
  const { clientes: rawClientes, recargarClientes } = useClientes();
  const clientes = useMemo(() => (rawClientes || [])
    .map((item) => ({
      id: item.id,
      nombre: item.nombre || '',
      razonSocial: item.razon_social || '',
      cif: item.cif || '',
      contacto: item.personas_contacto || '',
      email: item.email || '',
    }))
    .sort((a, b) => (a.nombre || a.razonSocial || '').localeCompare(b.nombre || b.razonSocial || '', 'es')),
  [rawClientes]);
  const [filtrados, setFiltrados] = useState([]);
  const [paginaClientes, setPaginaClientes] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [clienteEditandoId, setClienteEditandoId] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmingDeleteCliente, setConfirmingDeleteCliente] = useState(null);
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
        Alert.alert(t('common.error'), data.error || t('common.error'));
        return;
      }

      cerrarModalNuevoCliente();
      await recargarClientes();
      Alert.alert(t('common.success'), modoEdicion ? t('screens.clientes.updatedOk') : t('screens.clientes.createdOk'));
    } catch (error) {
      Alert.alert(t('common.error'), t('common.error') + ': ' + error.message);
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
        Alert.alert(t('common.error'), t('screens.clientes.deleteError'));
        return;
      }

      const response = await fetch(`http://localhost:8080/api/clientes/${cliente.id}`, {
        method: 'DELETE',
      });
      const data = await response.json().catch(() => ({}));
      console.log('DEBUG delete response ok=', response.ok, 'status=', response.status, 'data=', data);

      if (!response.ok) {
        if (response.status === 409 && data?.in_use) {
          Alert.alert(t('screens.clientes.inUseTitle'), data.error || t('screens.clientes.inUseMsg'));
          return;
        }
        Alert.alert(t('common.error'), data.error || t('common.error'));
        return;
      }

      await recargarClientes();
      Alert.alert(t('common.success'), t('screens.clientes.deletedOk'));
    } catch (error) {
      Alert.alert(t('common.error'), t('common.error') + ': ' + error.message);
    }
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
        <Text style={styles.headerTitle}>{t('nav.clientes')}</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={t('common.search')}
          value={busqueda}
          onChangeText={setBusqueda}
          placeholderTextColor="#94A3B8"
        />
        <View style={styles.btnPlusWrap}>
          <Pressable
            style={[styles.btnPlus, !puedeCrear && styles.btnPlusDisabled]}
            onPress={() => puedeCrear && setModalVisible(true)}
            disabled={!puedeCrear}
            onHoverIn={handleHoverNuevoIn}
            onHoverOut={handleHoverNuevoOut}
          >
            <Text style={styles.btnPlusText}>{t('screens.clientes.newBtn')}</Text>
          </Pressable>
          {hoverNuevo && (
            <View style={styles.hoverHint}>
              <Text style={styles.hoverHintText}>{!puedeCrear ? t('forms.permisoDenegado') : t('screens.clientes.newTitle')}</Text>
            </View>
          )}
        </View>
      </View>

      {filtrados.length === 0 ? (
        <View style={styles.tableContainer}>
          <EmptyState
            title={busqueda ? t('common.noResults') : t('nav.clientes')}
            message={busqueda ? t('screens.clientes.noResultsMsg') : t('screens.clientes.noItems')}
            action={!busqueda && puedeCrear ? t('screens.clientes.newBtn') : undefined}
            onAction={!busqueda && puedeCrear ? () => setModalVisible(true) : undefined}
          />
        </View>
      ) : (
        <ScrollView style={styles.tableContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ minWidth: 560 }}>
          <View style={styles.tableHeader}>
            <View style={[styles.tableCell, styles.colNombre]}>
              <Text style={styles.headerText}>{t('forms.fieldCliente')}</Text>
            </View>
            <View style={[styles.tableCell, styles.colRazonSocial]}>
              <Text style={styles.headerText}>{t('forms.razonSocial')}</Text>
            </View>
            <View style={[styles.tableCell, styles.colCif]}>
              <Text style={styles.headerText}>{t('forms.cif')}</Text>
            </View>
            <View style={[styles.tableCell, styles.colContacto]}>
              <Text style={styles.headerText}>{t('screens.clientes.colContacto')}</Text>
            </View>
            <View style={[styles.tableCell, styles.colEmail]}>
              <Text style={styles.headerText}>{t('forms.email')}</Text>
            </View>
            <View style={[styles.tableCell, styles.colAcciones]}>
              <Text style={styles.headerText}>{t('common.actions')}</Text>
            </View>
          </View>
          {clientesPaginados.map((cliente, idx) => (
            <TouchableOpacity key={cliente.id} style={[styles.tableRow, (idx + (paginaClientes - 1) * ITEMS_PER_PAGE) % 2 === 1 && styles.rowAlternate]} onPress={() => abrirDetalleEdicion(cliente)} activeOpacity={0.75}>
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
                {confirmingDeleteCliente === cliente.id ? (
                  <DeleteConfirmRow
                    onCancel={() => setConfirmingDeleteCliente(null)}
                    onConfirm={() => { setConfirmingDeleteCliente(null); ejecutarEliminacionCliente(cliente); }}
                  />
                ) : (
                  <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={(e) => { e.stopPropagation?.(); setConfirmingDeleteCliente(cliente.id); }}>
                    <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>{t('common.delete')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))}
          {totalPaginasClientes > 1 && (
            <View style={styles.paginationRow}>
              <TouchableOpacity
                style={[styles.paginationBtn, paginaClientes === 1 && styles.paginationBtnDisabled]}
                onPress={() => setPaginaClientes((prev) => Math.max(1, prev - 1))}
                disabled={paginaClientes === 1}
              >
                <Text style={styles.paginationBtnText}>{t('common.prev')}</Text>
              </TouchableOpacity>
              <Text style={styles.paginationInfo}>{t('common.pageOf', { current: paginaClientes, total: totalPaginasClientes })}</Text>
              <TouchableOpacity
                style={[styles.paginationBtn, paginaClientes === totalPaginasClientes && styles.paginationBtnDisabled]}
                onPress={() => setPaginaClientes((prev) => Math.min(totalPaginasClientes, prev + 1))}
                disabled={paginaClientes === totalPaginasClientes}
              >
                <Text style={styles.paginationBtnText}>{t('common.next')}</Text>

              </TouchableOpacity>
            </View>
          )}
          </View>
          </ScrollView>
        </ScrollView>
      )}

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={cerrarModalNuevoCliente}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{modoEdicion ? t('screens.clientes.editTitle') : t('screens.clientes.newTitle')}</Text>

            <Text style={styles.fieldLabel}>{t('screens.clientes.nombreLabel')}</Text>
            <TextInput
              style={[styles.fieldInput, nombreVacio && styles.fieldInputError]}
              value={nuevoNombre}
              onChangeText={setNuevoNombre}
              placeholder={t('screens.clientes.nombrePlaceholder')}
              placeholderTextColor="#94A3B8"
            />
            {nombreVacio && <Text style={styles.errorText}>{t('screens.clientes.nombreRequired')}</Text>}

            <Text style={styles.fieldLabel}>{t('forms.razonSocial')}</Text>
            <TextInput
              style={styles.fieldInput}
              value={nuevoRazonSocial}
              onChangeText={setNuevoRazonSocial}
              placeholder={t('forms.razonSocialPlaceholder')}
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.fieldLabel}>{t('forms.cif')}</Text>
            <TextInput
              style={[styles.fieldInput, cifNuevoInvalido && styles.fieldInputError]}
              value={nuevoCif}
              onChangeText={setNuevoCif}
              placeholder={t('forms.cifPlaceholder')}
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
            />
            {cifNuevoInvalido && <Text style={styles.errorText}>{t('forms.errorCif')}</Text>}

            <Text style={styles.fieldLabel}>{t('screens.clientes.contactoLabel')}</Text>
            <TextInput
              style={styles.fieldInput}
              value={nuevoContacto}
              onChangeText={setNuevoContacto}
              placeholder={t('forms.personasContactoPlaceholder')}
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.fieldLabel}>{t('forms.email')}</Text>
            <TextInput
              style={[styles.fieldInput, emailNuevoInvalido && styles.fieldInputError]}
              value={nuevoEmail}
              onChangeText={setNuevoEmail}
              placeholder={t('forms.emailPlaceholder')}
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {emailNuevoVacio && <Text style={styles.errorText}>{t('forms.errorEmailRequired')}</Text>}
            {emailNuevoInvalido && <Text style={styles.errorText}>{t('forms.errorEmail')}</Text>}

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={cerrarModalNuevoCliente}>
                <Text style={styles.btnText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnNew]} onPress={guardarCliente}>
                <Text style={[styles.btnText, styles.btnNewText]}>
                  {guardando ? t('common.saving') : modoEdicion ? t('common.saveChanges') : t('common.save')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

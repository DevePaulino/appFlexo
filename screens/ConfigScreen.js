import React, { useCallback, useEffect, useState } from 'react';
import { useSettings } from '../SettingsContext';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Platform, Modal, Linking, Switch } from 'react-native';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { useFocusEffect } from '@react-navigation/native';
import EmptyState from '../components/EmptyState';
import DeleteConfirmRow from '../components/DeleteConfirmRow';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePermission } from './usePermission';

const API_URL = 'http://localhost:8080/api/settings';
const API_MODO_URL = 'http://localhost:8080/api/settings/modo-creacion';
const API_SESSION_TIMEOUT_URL = 'http://localhost:8080/api/settings/session-timeout';
const API_ESTADOS_RULES_URL = 'http://localhost:8080/api/settings/estados-pedido-rules';
const API_SETTINGS_REORDER_URL = 'http://localhost:8080/api/settings/reorder';
const API_ROLE_PERMISSIONS_URL = 'http://localhost:8080/api/settings/roles-permissions';
const API_ESTADO_USAGE_URL = 'http://localhost:8080/api/settings/estado-usage';
const API_ROL_USAGE_URL = 'http://localhost:8080/api/settings/rol-usage';
const API_USERS_URL = 'http://localhost:8080/api/usuarios';
const API_OPCION_URL = 'http://localhost:8080/api/settings/opcion';
const API_BILLING_CONFIG_URL = 'http://localhost:8080/api/billing/config';
const API_BILLING_CHECKOUT_SESSION_URL = 'http://localhost:8080/api/billing/checkout-session';
const API_BILLING_CHECKOUT_CONFIRM_URL = 'http://localhost:8080/api/billing/checkout-confirm';
const PEDIDO_RULES_EXPANDED_KEY = 'config_pedido_rules_expanded';
const ROLE_RULES_EXPANDED_KEY = 'config_role_rules_expanded';

const ROLE_PERMISSION_CONFIG = [
  { key: 'manage_app_settings', title: 'Editar configuración de la app', hint: 'Permite modificar catálogos y reglas globales.' },
  { key: 'manage_roles_permissions', title: 'Editar roles y permisos', hint: 'Permite cambiar el rol activo y la matriz de permisos.' },
  { key: 'manage_usuarios', title: 'Gestionar usuarios', hint: 'Permite añadir, editar y eliminar usuarios del sistema.' },
  { key: 'manage_session_timeout', title: 'Gestionar tiempo de sesión', hint: 'Permite configurar el tiempo de inactividad por usuario antes del cierre automático.' },
  { key: 'manage_estados_pedido', title: 'Editar estados de pedidos', hint: 'Permite crear, modificar y eliminar estados disponibles.' },
  { key: 'editar_estado_finalizado', title: 'Editar Estado de trabajos Finalizados', hint: 'Permite avanzar o retroceder el estado de pedidos que ya están finalizados.' },
  { key: 'edit_clientes', title: 'Editar clientes', hint: 'Alta, edición y eliminación de clientes.' },
  { key: 'edit_maquinas', title: 'Editar máquinas', hint: 'Alta, edición y eliminación de máquinas.' },
  { key: 'edit_pedidos', title: 'Editar pedidos', hint: 'Creación y cambios de pedidos y trabajos.' },
  { key: 'edit_presupuestos', title: 'Editar presupuestos', hint: 'Creación, edición y aprobación de presupuestos.' },
  { key: 'edit_produccion', title: 'Editar producción', hint: 'Enviar, mover, reordenar y cambiar estado en producción.' },
  { key: 'eliminar_archivos', title: 'Eliminar archivos de pedidos', hint: 'Permite borrar artes y versiones unitario en el detalle de un pedido.' },
  { key: 'edit_modo_creacion', title: 'Cambiar modo de creación de pedidos', hint: 'Permite alternar entre modo manual y automático en la configuración.' },
  { key: 'manage_billing', title: 'Gestionar facturación', hint: 'Permite acceder y configurar el plan de pago, créditos e historial de facturación.' },
  { key: 'manage_modulos', title: 'Gestionar módulos', hint: 'Permite activar o desactivar módulos opcionales de la aplicación.' },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EEF2F8' },
  header: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 38,
  },
  title: {
    flex: 1,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
    color: '#F1F5F9',
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    textAlign: 'center',
  },
  contentWrap: {
    padding: 12,
  },
  groupTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
    marginTop: 0,
    alignSelf: 'flex-start',
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    letterSpacing: 0.2,
  },
  blockContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 10,
    marginBottom: 14,
  },
  section: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: -12,
    marginTop: -12,
    marginBottom: 12,
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
  },
  row: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: '#0F172A',
    fontSize: 14,
  },
  submenuAddInput: {
    flex: 0,
    width: '75%',
    maxWidth: 442,
    minWidth: 234,
  },
  addBtn: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: { color: '#1E293B', fontWeight: '600', fontSize: 13 },
  chipList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 6,
  },
  chipText: { color: '#0F172A', fontSize: 13, fontWeight: '600', marginRight: 6 },
  chipDelete: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFE4E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipDeleteDisabled: {
    opacity: 0.35,
  },
  chipDeleteText: { color: '#DC2626', fontWeight: '900' },
  chipEdit: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EEF2F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  chipEditDisabled: {
    opacity: 0.35,
  },
  chipEditText: {
    color: '#374151',
    fontWeight: '900',
    fontSize: 11,
  },
  dragHandle: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderRadius: 6,
    cursor: 'grab',
  },
  dragHandleText: {
    color: '#94A3B8',
    fontSize: 16,
    lineHeight: 16,
    userSelect: 'none',
  },
  estadoChipList: {
    gap: 4,
  },
  estadoChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  muted: { color: '#475569', fontSize: 12 },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  modeButtonsWrap: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    flex: 1,
  },
  modeBtn: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFF',
  },
  modeBtnActive: {
    backgroundColor: '#475569',
    borderColor: '#475569',
  },
  modeBtnText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '700',
  },
  modeBtnTextActive: {
    color: '#F1F5F9',
  },
  codeTitle: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  codeBlock: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 10,
  },
  codeText: {
    fontSize: 11,
    color: '#0F172A',
    fontWeight: '600',
    lineHeight: 16,
  },
  ruleGroup: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  ruleTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  ruleHint: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
  },
  selectChip: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FFF',
  },
  selectChipActive: {
    borderColor: '#E55A2B',
    backgroundColor: '#EAF8F0',
  },
  selectChipText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '700',
  },
  selectChipTextActive: {
    color: '#027A48',
  },
  selectChipDisabled: {
    opacity: 0.5,
  },
  selectChipTextDisabled: {
    color: '#98A2B3',
  },
  selectChipProtected: {
    backgroundColor: '#FFF4E6',
    borderColor: '#FF9500',
    borderWidth: 1,
  },
  selectChipTextProtected: {
    color: '#FF9500',
  },
  rulesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rulesToggleBtn: {
    backgroundColor: '#EEF2F8',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  rulesToggleBtnText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '700',
  },
  usersRoleRow: {
    gap: 6,
    marginBottom: 10,
  },
  usersBtnPlus: {
    borderWidth: 1.5,
    borderColor: 'rgba(248,250,252,0.55)',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  usersBtnPlusText: {
    color: '#F1F5F9',
    fontWeight: '600',
    fontSize: 13,
  },
  usersRoleLabel: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
  usersFormTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  usersFieldLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '700',
    marginBottom: 6,
  },
  usersFieldInput: {
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
  usersFieldInputError: {
    borderColor: '#DC2626',
  },
  usersSearchInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: '#0F172A',
    fontSize: 14,
    width: '75%',
    maxWidth: 442,
    minWidth: 234,
    marginBottom: 10,
  },
  usersTableWrap: {
    maxHeight: 280,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  usersTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 10,
    minHeight: 44,
    alignItems: 'center',
  },
  usersTableRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFF',
    alignItems: 'center',
  },
  usersTableRowAlt: {
    backgroundColor: '#F1F5F9',
  },
  usersColNombre: {
    flex: 0.30,
    paddingRight: 8,
  },
  usersColEmail: {
    flex: 0.34,
    paddingRight: 8,
  },
  usersColRol: {
    flex: 0.12,
    paddingRight: 8,
  },
  usersColSesion: {
    flex: 0.13,
    paddingRight: 8,
    justifyContent: 'center',
  },
  sesionTimeoutBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sesionTimeoutBadgeText: {
    fontSize: 11,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  usersColAcciones: {
    flex: 0.24,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 6,
  },
  usersHeaderText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '800',
  },
  usersCellText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '600',
  },
  usersPaginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  usersPaginationBtn: {
    backgroundColor: '#475569',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  usersPaginationBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  usersPaginationBtnText: {
    color: '#F1F5F9',
    fontSize: 12,
    fontWeight: '700',
  },
  usersPaginationInfo: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  usersActionBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  usersActionBtnDelete: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  usersActionBtnBilling: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  usersActionBtnText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '600',
  },
  usersFormActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    marginTop: 6,
    marginBottom: 2,
  },
  usersBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  usersBtnPrimary: {
    borderColor: '#CBD5E1',
  },
  usersBtnText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 13,
  },
  usersBtnPrimaryText: {
    color: '#1E293B',
    fontWeight: '700',
  },
  usersModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  usersModalCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    maxWidth: 480,
    width: '100%',
  },
  inputError: {
    borderColor: '#DC2626',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: -4,
    marginBottom: 8,
  },
});

const ESTADO_RULE_DEFAULTS = {
  bloqueados_produccion: ['cancelado', 'parado', 'finalizado'],
  en_cola_produccion: ['pendiente-de-impresion', 'pendiente-post-impresion'],
  preimpresion: ['diseno', 'pendiente-de-aprobacion', 'pendiente-de-cliche'],
  estados_finalizados: ['finalizado'],
  ocultar_timeline: ['parado', 'cancelado'],
  ocultar_grafica: ['parado', 'cancelado', 'finalizado'],
};

const ESTADO_RULE_CONFIG = [
  { key: 'bloqueados_produccion', title: 'Bloquean envío a producción', hint: 'No permite enviar desde Pedidos a producción.' },
  { key: 'en_cola_produccion', title: 'Estados en cola de producción', hint: 'Se muestran como "en cola".' },
  { key: 'preimpresion', title: 'Estados de preimpresión', hint: 'Al volver a estos, se quita de la cola.' },
  { key: 'estados_finalizados', title: 'Estados finalizados', hint: 'Usados para lógica de cierre y limpieza.' },
  { key: 'ocultar_timeline', title: 'Ocultar en timeline', hint: 'No se muestran en los círculos de fase.' },
  { key: 'ocultar_grafica', title: 'Ocultar en gráfica', hint: 'No se cuentan en la gráfica de estados.' },
];

function SortableEstadoChip({ item, isProtected, onEdit, onDelete, getColor, editing, onEditChange, onEditColorChange, onEditSave, palette }) {
  const { t } = useTranslation();
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({ id: item.id });

  const rnRef = useCallback(
    (node) => {
      if (!node) return;
      setNodeRef(node.getNativeNode?.() ?? node);
    },
    [setNodeRef]
  );

  const isEditing = editing.id === item.id;
  const displayColor = isEditing && editing.color ? editing.color : getColor(item.valor);

  const rowStyle = [
    styles.estadoChipRow,
    isDragging && { opacity: 0.75, zIndex: 999 },
    transform ? { transform: [{ translateX: transform.x }, { translateY: transform.y }] } : null,
    isEditing && { flexDirection: 'column', alignItems: 'stretch' },
  ];

  return (
    <View ref={rnRef} style={rowStyle} {...attributes}>
      {isEditing ? (
        <View style={{ width: '100%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={styles.dragHandle} {...listeners}>
              <Text style={styles.dragHandleText}>⠿</Text>
            </View>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: displayColor, flexShrink: 0 }} />
            <TextInput
              style={[styles.input, { flex: 1, paddingVertical: 4, marginBottom: 0 }]}
              value={editing.text}
              onChangeText={onEditChange}
              onSubmitEditing={onEditSave}
              autoFocus
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.chipEdit} onPress={onEditSave}>
              <Text style={[styles.chipEditText, { color: '#16A34A' }]}>✓</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10, paddingBottom: 2 }}>
            {(palette || []).map(color => (
              <TouchableOpacity
                key={color}
                onPress={() => onEditColorChange(color)}
                style={{
                  width: 22, height: 22, borderRadius: 11,
                  backgroundColor: color,
                  borderWidth: editing.color === color ? 2 : 1,
                  borderColor: editing.color === color ? '#0F172A' : 'rgba(0,0,0,0.12)',
                  transform: editing.color === color ? [{ scale: 1.2 }] : [],
                }}
              />
            ))}
          </View>
        </View>
      ) : (
        <>
          <View style={styles.dragHandle} {...listeners}>
            <Text style={styles.dragHandleText}>⠿</Text>
          </View>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: displayColor, marginRight: 8, flexShrink: 0 }} />
          <Text style={[styles.chipText, { flex: 1 }]}>{item.label || item.valor}</Text>
          <TouchableOpacity
            style={[styles.chipEdit, isProtected && styles.chipEditDisabled]}
            disabled={isProtected}
            onPress={() => onEdit(item)}
          >
            <Text style={styles.chipEditText}>✎</Text>
          </TouchableOpacity>
          {confirmingDelete ? (
            <DeleteConfirmRow
              onCancel={() => setConfirmingDelete(false)}
              onConfirm={() => { setConfirmingDelete(false); onDelete(item.id); }}
            />
          ) : (
            <TouchableOpacity
              style={[styles.chipDelete, isProtected && styles.chipDeleteDisabled]}
              disabled={isProtected}
              onPress={() => setConfirmingDelete(true)}
            >
              <Text style={styles.chipDeleteText}>✕</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

export default function ConfigScreen({ route, currentUser }) {
  const { t } = useTranslation();
  const ITEMS_PER_PAGE = 100;
  const { settings, estadoRules: ctxEstadoRules, modoCreacion, recargarSettings, setModoCreacion: setModoCreacionCtx } = useSettings();
  const [estadoRules, setEstadoRules] = React.useState(ctxEstadoRules);
  React.useEffect(() => { setEstadoRules(ctxEstadoRules); }, [ctxEstadoRules]);
  const [inputs, setInputs] = useState({
    roles: '',
    acabados: '',
    tintas_especiales: '',
    estados_pedido: '',
  });
  const [usuarios, setUsuarios] = useState([]);
  const [busquedaUsuarios, setBusquedaUsuarios] = useState('');
  const [paginaUsuarios, setPaginaUsuarios] = useState(1);
  const [modalUsuarioVisible, setModalUsuarioVisible] = useState(false);
  const [usuarioEditandoId, setUsuarioEditandoId] = useState(null);
  const [nuevoUsuarioNombre, setNuevoUsuarioNombre] = useState('');
  const [nuevoUsuarioEmail, setNuevoUsuarioEmail] = useState('');
  const [nuevoUsuarioRol, setNuevoUsuarioRol] = useState('comercial');
  const [nuevoUsuarioSesionTimeout, setNuevoUsuarioSesionTimeout] = useState('');
  const [submittedUsuario, setSubmittedUsuario] = useState(false);
  
  const [guardandoRules, setGuardandoRules] = useState(false);
  const [pedidoRulesExpanded, setPedidoRulesExpanded] = useState(false);
  const [roleRulesExpanded, setRoleRulesExpanded] = useState(false);
  const [rolePermissions, setRolePermissions] = useState({});
  const [guardandoRole, setGuardandoRole] = useState(false);
  const [guardandoPermisos, setGuardandoPermisos] = useState(false);
  const [editing, setEditing] = useState({ category: null, id: null, text: '', color: '' });
  const [newEstadoColor, setNewEstadoColor] = useState('');
  const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState('30');
  const [sessionTimeoutMin, setSessionTimeoutMin] = useState(5);
  const [sessionTimeoutMax, setSessionTimeoutMax] = useState(480);
  const [guardandoSessionTimeout, setGuardandoSessionTimeout] = useState(false);
  const [forceRootEnabled, setForceRootEnabled] = useState(false);
  const [apiExamplesExpanded, setApiExamplesExpanded] = useState(false);
  const [guardandoModoCreacion, setGuardandoModoCreacion] = useState(false);
  const [billingConfig, setBillingConfig] = useState({
    checkout_enabled: false,
    payment_methods: [
      { key: 'paypal', label: 'PayPal' },
      { key: 'tarjeta', label: 'Tarjeta bancaria' },
    ],
  });
  const [modalRecargaVisible, setModalRecargaVisible] = useState(false);
  const [recargaUsuario, setRecargaUsuario] = useState(null);
  const [recargaCreditos, setRecargaCreditos] = useState('50');
  const [recargaPaymentMethod, setRecargaPaymentMethod] = useState('tarjeta');
  const [procesandoRecarga, setProcesandoRecarga] = useState(false);
  const [migrarEstadoModal, setMigrarEstadoModal] = useState(false);
  const [estadoAMigrar, setEstadoAMigrar] = useState(null);
  const [estadoDestinoMigracion, setEstadoDestinoMigracion] = useState(null);
  const [migrandoEstados, setMigrandoEstados] = useState(false);

  const section = String(route?.params?.section || 'all');
  const showUsuariosRoles = section === 'all' || section === 'usuarios-roles';
  const showCreditos = section === 'all' || section === 'creditos';
  
  const showImpresion = section === 'all' || section === 'impresion';

  const titleBySection = {
    'usuarios-roles': t('screens.config.usuariosTitle'),
    creditos: t('screens.config.creditosTitle'),
    impresion: t('screens.config.impresionTitle'),
    pedidos: t('nav.pedidosConfig'),
  };
  const pageTitle = titleBySection[section] || t('nav.pedidosConfig');
  const showBlockTitles = section === 'all';
  const showTopUsersPlus = section === 'usuarios-roles';

  const slugifyEstado = (texto) => {
    return String(texto || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const generateColorFromHash = (texto) => {
    // Normalizar el texto antes de hacer hash para consistencia
    const normalized = slugifyEstado(texto);
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const vibrantes = [
      '#E91E63', '#2196F3', '#00BCD4', '#4CAF50', '#FFC107',
      '#FF5722', '#9C27B0', '#3F51B5', '#009688', '#FF6F00',
    ];
    const index = Math.abs(hash) % vibrantes.length;
    return vibrantes[index];
  };

  // Paleta de colores ofrecida al usuario al crear/editar estados
  const ESTADO_PALETTE = [
    '#334155', '#64748B', '#1976D2', '#3B82F6',
    '#0F766E', '#14B8A6', '#7B1FA2', '#A855F7',
    '#C2185B', '#EC4899', '#D32F2F', '#EF4444',
    '#FF5722', '#F59E0B', '#1F9D55', '#22C55E',
  ];

  // Mapa fijo de colores para estados del sistema (consistente con las otras vistas)
  const ESTADO_COLOR_MAP = {
    'en-diseno': '#1976D2',
    'diseno': '#1976D2', // compat con pedidos antiguos
    'pendiente-de-aprobacion': '#F57C00',
    'pendiente-de-cliche': '#C2185B',
    'pendiente-de-impresion': '#7B1FA2',
    'pendiente-post-impresion': '#00796B',
    'finalizado': '#1F9D55',
    'parado': '#D32F2F',
    'cancelado': '#9E9E9E',
  };

  const getEstadoColor = (estadoValor) => {
    const normalized = slugifyEstado(estadoValor);
    // 1. Color personalizado guardado en BD (tiene prioridad sobre el mapa del sistema)
    const estadoItem = (settings.estados_pedido || []).find(item => slugifyEstado(item.valor) === normalized);
    if (estadoItem?.color) {
      return estadoItem.color;
    }
    // 2. Color fijo del sistema como fallback
    if (ESTADO_COLOR_MAP[normalized]) {
      return ESTADO_COLOR_MAP[normalized];
    }
    // 3. Color generado dinámicamente
    return generateColorFromHash(estadoValor);
  };

  const capitalizeFirst = (s) => {
    const str = String(s || '');
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const estadosPedidoDisponibles = (settings.estados_pedido || [])
    .map((item) => {
      const label = String(item?.valor || '').trim();
      return { label, value: slugifyEstado(label) };
    })
    .filter((item) => item.label && item.value)
    .filter((item, index, arr) => index === arr.findIndex((it) => it.value === item.value));

  const cargarSettings = recargarSettings;

  const cargarUsuarios = async () => {
    try {
      const response = await fetch(API_USERS_URL);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        Alert.alert('Error', data.error || 'No se pudieron cargar los usuarios');
        return;
      }
      setUsuarios(Array.isArray(data.usuarios) ? data.usuarios : []);
    } catch (e) {
      Alert.alert('Error', `No se pudieron cargar los usuarios: ${e.message}`);
    }
  };

  

  const cargarBillingConfig = async () => {
    try {
      const response = await fetch(API_BILLING_CONFIG_URL);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return;
      }
      const methods = Array.isArray(data.payment_methods) && data.payment_methods.length > 0
        ? data.payment_methods
        : [{ key: 'paypal', label: 'PayPal' }, { key: 'tarjeta', label: 'Tarjeta bancaria' }];
      setBillingConfig({
        ...data,
        checkout_enabled: !!data.checkout_enabled,
        payment_methods: methods,
      });
      if (!methods.some((m) => m?.key === recargaPaymentMethod)) {
        setRecargaPaymentMethod(String(methods[0]?.key || 'tarjeta'));
      }
    } catch (e) {
    }
  };

  const cargarEstadoRules = recargarSettings;

  const actualizarModoCreacion = async (modo) => {
    try {
      setGuardandoModoCreacion(true);
      await setModoCreacionCtx(modo);
    } catch (e) {
      Alert.alert('Error', `No se pudo actualizar el modo: ${e.message}`);
    } finally {
      setGuardandoModoCreacion(false);
    }
  };

  const cargarPermisosRoles = async () => {
    try {
      const response = await fetch(API_ROLE_PERMISSIONS_URL);
      const data = await response.json().catch(() => ({}));
      if (response.ok && data && data.roles_permissions) {
        setRolePermissions(data.roles_permissions || {});
      }
    } catch (e) {
      // ignore
    }
  };

  const cargarSessionTimeout = () => {
    try {
      fetch(API_SESSION_TIMEOUT_URL)
        .then((r) => r.json().catch(() => ({})))
        .then((data) => {
          if (data && typeof data.session_timeout_minutes !== 'undefined') {
            setSessionTimeoutMinutes(String(data.session_timeout_minutes || '30'));
          }
          if (data && typeof data.session_timeout_min !== 'undefined') {
            setSessionTimeoutMin(Number(data.session_timeout_min || 5));
          }
          if (data && typeof data.session_timeout_max !== 'undefined') {
            setSessionTimeoutMax(Number(data.session_timeout_max || 480));
          }
        })
        .catch(() => {});
    } catch (e) {
      // ignore
    }
  };

  const cargarPedidoRulesExpanded = async () => {
    try {
      const raw = await AsyncStorage.getItem(PEDIDO_RULES_EXPANDED_KEY);
      if (raw != null) {
        setPedidoRulesExpanded(raw === '1' || raw === 'true');
      }
    } catch (e) {
      // ignore
    }
  };

  const toggleRoleRulesExpanded = async () => {
    try {
      const next = !roleRulesExpanded;
      setRoleRulesExpanded(next);
      await AsyncStorage.setItem(ROLE_RULES_EXPANDED_KEY, next ? '1' : '0');
    } catch (e) {
      setRoleRulesExpanded((v) => !v);
    }
  };

  const recargarConfiguracion = () => {
    recargarSettings();
    cargarPermisosRoles();
    cargarUsuarios();
    cargarSessionTimeout();
    cargarBillingConfig();
  };

  useEffect(() => {
    recargarConfiguracion();
    cargarPedidoRulesExpanded();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // Agregar un pequeño delay para evitar sobrescribir cambios recientes
      const timer = setTimeout(() => {
        recargarConfiguracion();
      }, 300);
      
      return () => clearTimeout(timer);
    }, [])
  );

  useEffect(() => {
    const confirmarDesdeUrl = async () => {
      if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof window.location === 'undefined') {
        return;
      }
      const search = String(window.location.search || '');
      if (!search) return;

      const params = new URLSearchParams(search);
      const billingState = String(params.get('billing') || '').toLowerCase();
      const sessionId = String(params.get('session_id') || '').trim();

      if (!billingState) return;

      const clearQuery = () => {
        try {
          const base = `${window.location.origin}${window.location.pathname}`;
          window.history.replaceState({}, '', base);
        } catch (e) {
        }
      };

      if (billingState === 'cancel') {
        clearQuery();
        Alert.alert(t('screens.config.okPagoCancelado'), t('screens.config.okNoCargo'));
        return;
      }

      if (billingState === 'success' && sessionId) {
        try {
          const response = await fetch(API_BILLING_CHECKOUT_CONFIRM_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ checkout_session_id: sessionId }),
          });
          const data = await response.json().catch(() => ({}));
          clearQuery();
          if (!response.ok) {
            Alert.alert(t('screens.config.okPagoPendiente'), data.error || t('screens.config.okPagoNoConfirmado'));
            return;
          }
          const agregados = Number(data.creditos_agregados || 0);
          const saldo = Number(data.creditos || 0);
          Alert.alert(t('screens.config.okRecargaConfirmada'), t('screens.config.okCreditosAgregados', { count: agregados, saldo }));
          await cargarUsuarios();
        } catch (e) {
          clearQuery();
          Alert.alert('Error', `No se pudo confirmar el pago: ${e.message}`);
        }
      }
    };

    confirmarDesdeUrl();
  }, []);

  const emailValido = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
  const currentUserRole = slugifyEstado(String(currentUser?.rol || currentUser?.role || ''));
  const displayedRole = currentUserRole;
  const currentUserPermissionValue = (() => {
    const raw = currentUser?.permissions;
    if (Array.isArray(raw)) {
      return raw.includes('manage_app_settings');
    }
    if (raw && typeof raw === 'object') {
      if (typeof raw.manage_app_settings === 'boolean') {
        return raw.manage_app_settings;
      }
      if (raw.manage_app_settings != null) {
        return !!raw.manage_app_settings;
      }
    }
    return null;
  })();
  const rolePermissionValue = (() => {
    const rolePerms = rolePermissions[currentUserRole] || {};
    if (typeof rolePerms.manage_app_settings === 'boolean') {
      return rolePerms.manage_app_settings;
    }
    if (rolePerms.manage_app_settings != null) {
      return !!rolePerms.manage_app_settings;
    }
    return null;
  })();
  // Determinamos en cliente si el usuario actual puede administrar usuarios.
  // El backend sigue validando la operación final; esto solo habilita/inhabilita la UI.
  const puedeAdministrarUsuariosHook = usePermission('manage_usuarios');
  const manageUsuariosRoleValue = (() => {
    const rolePerms = rolePermissions[currentUserRole] || {};
    if (typeof rolePerms.manage_usuarios === 'boolean') return rolePerms.manage_usuarios;
    if (rolePerms.manage_usuarios != null) return !!rolePerms.manage_usuarios;
    return null;
  })();
  const puedeAdministrarUsuarios = Boolean(
    currentUserRole === 'root'
    || currentUserRole === 'administrador'
    || currentUserRole === 'admin'
    || currentUserPermissionValue === true
    || rolePermissionValue === true
    || manageUsuariosRoleValue === true
    || puedeAdministrarUsuariosHook
  );
  // Sincronizar PFP_SELECTED_ROLE con el rol del usuario actual para que usePermission siempre use el rol correcto
  useEffect(() => {
    if (displayedRole && typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem('PFP_SELECTED_ROLE');
      if (stored !== displayedRole) {
        window.localStorage.setItem('PFP_SELECTED_ROLE', displayedRole);
        if (typeof window.dispatchEvent === 'function') {
          window.dispatchEvent(new CustomEvent('pfp-role-changed', { detail: displayedRole }));
        }
      }
    }
  }, [displayedRole]);

  // Usar permiso dinámico desde el backend
  const puedeEditarSessionTimeout = usePermission('manage_app_settings');
  const puedeGestionarSesionTimeout = usePermission('manage_session_timeout');
  const puedeEditarRolesPermisosFromHook = usePermission('manage_roles_permissions');

  // Estado local para reflejar cambios inmediatos cuando el usuario se quita permisos a si mismo
  const [puedeEditarRolesPermisosLocal, setPuedeEditarRolesPermisosLocal] = useState(puedeEditarRolesPermisosFromHook);

  useEffect(() => {
    setPuedeEditarRolesPermisosLocal(puedeEditarRolesPermisosFromHook);
  }, [puedeEditarRolesPermisosFromHook]);

  // Fallback directo: root y administrador siempre pueden editar (la columna Administrador sigue bloqueada en la UI)
  const puedeEditarRolesPermisos = puedeEditarRolesPermisosLocal
    || currentUserRole === 'root'
    || currentUserRole === 'administrador';

  // Build availableRoles from settings (hide only internal roles in UI lists)
  const availableRoles = (settings.roles || [])
    .filter((item) => !item?.internal)
    .map((item) => {
      const raw = String(item?.valor || item?.key || item?.label || '').trim();
      const key = slugifyEstado(raw);
      return {
        key,
        label: String(item?.label || item?.valor || item?.key || raw).trim(),
      };
    })
    .filter((r) => r.key);

  const rolesDisponibles = (() => {
    const fromActiveRoles = (availableRoles || [])
      .map((role) => ({
        key: String(role?.key || '').trim().toLowerCase(),
        label: String(role?.label || role?.key || '').trim(),
      }))
      .filter((role) => role.key);

    if (fromActiveRoles.length > 0) return fromActiveRoles;

    const fromSettingsRoles = (settings.roles || [])
      .map((item) => {
        const label = String(item?.valor || '').trim();
        const key = slugifyEstado(label);
        return { key, label };
      })
      .filter((role) => role.key);

    if (fromSettingsRoles.length > 0) return fromSettingsRoles;

    return [{ key: 'comercial', label: 'Comercial' }];
  })();

  useEffect(() => {
    const existe = rolesDisponibles.some((role) => role.key === nuevoUsuarioRol);
    if (!existe) {
      setNuevoUsuarioRol(rolesDisponibles[0]?.key || 'comercial');
    }
  }, [availableRoles, settings.roles]);

  const limpiarFormularioUsuario = () => {
    setUsuarioEditandoId(null);
    setNuevoUsuarioNombre('');
    setNuevoUsuarioEmail('');
    setNuevoUsuarioRol(rolesDisponibles[0]?.key || 'comercial');
    setNuevoUsuarioSesionTimeout('');
    setSubmittedUsuario(false);
  };

  // La comprobación/alerta de permiso de usuarios se ha eliminado (backend sigue validando).

  const mostrarPermisoRecargasDenegado = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert(t('screens.config.errPermisoDenegadoRecargas'));
      return;
    }
    Alert.alert(t('screens.config.errPermisoDenegadoRecargas'));
  };

  const mostrarPermisoUsuariosDenegado = () => {
    const roleInfo = `rol=${currentUserRole} manage_app_settings=${String(currentUserPermissionValue)} rolePerm=${String(rolePermissionValue)}`;
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert(t('screens.config.errPermisoDenegadoUsuarios'));
      return;
    }
    Alert.alert(t('screens.config.errPermisoDenegadoUsuarios'));
  };

  const abrirModalNuevoUsuario = () => {
    limpiarFormularioUsuario();
    setModalUsuarioVisible(true);
  };

  const cerrarModalUsuario = () => {
    limpiarFormularioUsuario();
    setModalUsuarioVisible(false);
  };

  const guardarUsuario = async () => {
    if (!puedeAdministrarUsuarios) {
      mostrarPermisoUsuariosDenegado();
      return;
    }

    setSubmittedUsuario(true);
    const nombre = String(nuevoUsuarioNombre || '').trim();
    const email = String(nuevoUsuarioEmail || '').trim().toLowerCase();
    const rol = String(nuevoUsuarioRol || '').trim().toLowerCase();

    if (!nombre || !email) {
      Alert.alert('Error', t('screens.config.errNombreEmailRequired'));
      return;
    }

    if (!rol) {
      Alert.alert('Error', t('screens.config.errSelectRol'));
      return;
    }

    if (!emailValido(email)) {
      Alert.alert('Error', t('screens.config.errEmailInvalid'));
      return;
    }

    try {
      const endpoint = usuarioEditandoId ? `${API_USERS_URL}/${usuarioEditandoId}` : API_USERS_URL;
      const method = usuarioEditandoId ? 'PUT' : 'POST';
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        nombre,
        email,
        rol,
        ...(puedeGestionarSesionTimeout ? {
          sesion_timeout_minutos: nuevoUsuarioSesionTimeout.trim() !== '' ? parseInt(nuevoUsuarioSesionTimeout, 10) || null : null,
        } : {}),
      }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        Alert.alert('Error', `(${response.status}) ${data.error || t('screens.config.errSaveUser')}`);
        return;
      }

      // On success, show created/updated id and any temp password returned
      const id = data.id || data._id || (data.usuario && data.usuario.id) || null;
      const temp = data._temp_password || (data.usuario && data.usuario._temp_password) || null;
      if (id) {
        Alert.alert(t('screens.config.okUserCreated'), `${t('screens.config.okUserId', { id })}${temp ? `\n${t('screens.config.okTempPassword', { temp })}` : ''}`);
      }

      limpiarFormularioUsuario();
      setModalUsuarioVisible(false);
      await cargarUsuarios();
    } catch (e) {
      console.error('guardarUsuario exception', e);
      Alert.alert('Error', `${t('screens.config.errSaveUser')}: ${e.message}`);
    }
  };

  const nombreUsuarioVacio = submittedUsuario && !String(nuevoUsuarioNombre || '').trim();
  const emailUsuarioRaw = String(nuevoUsuarioEmail || '').trim().toLowerCase();
  const emailUsuarioVacio = submittedUsuario && !emailUsuarioRaw;
  const emailUsuarioInvalido = submittedUsuario && !!emailUsuarioRaw && !emailValido(emailUsuarioRaw);

  const iniciarEdicionUsuario = (usuario) => {
    if (!puedeAdministrarUsuarios) {
      mostrarPermisoUsuariosDenegado();
      return;
    }
    setUsuarioEditandoId(usuario?.id || null);
    setNuevoUsuarioNombre(String(usuario?.nombre || ''));
    setNuevoUsuarioEmail(String(usuario?.email || ''));
    setNuevoUsuarioRol(String(usuario?.rol || rolesDisponibles[0]?.key || 'comercial').toLowerCase());
    setNuevoUsuarioSesionTimeout(usuario?.sesion_timeout_minutos != null ? String(usuario.sesion_timeout_minutos) : '');
    setSubmittedUsuario(false);
    setModalUsuarioVisible(true);
  };

  const [deletingUserId, setDeletingUserId] = useState(null);
  const [confirmingDeleteUsuario, setConfirmingDeleteUsuario] = useState(null);
  const [confirmingDeleteValor, setConfirmingDeleteValor] = useState(null);

  const eliminarUsuario = async (id) => {
    if (!puedeAdministrarUsuarios) {
      mostrarPermisoUsuariosDenegado();
      return;
    }

    if (!id) return;
    setDeletingUserId(id);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (global.__MIAPP_ACCESS_TOKEN) {
        headers.Authorization = `Bearer ${global.__MIAPP_ACCESS_TOKEN}`;
      }

      const response = await fetch(`${API_USERS_URL}/${id}`, { method: 'DELETE', headers });
      let data = {};
      try {
        data = await response.json();
      } catch (e) {
        // no JSON body (204) - ignore
        data = {};
      }

      if (!response.ok) {
        // eslint-disable-next-line no-console
        console.error('Eliminar usuario failed', response.status, data);
        Alert.alert('Error', data.error || `${t('screens.config.errDeleteUser')} (status ${response.status})`);
        return;
      }

      if (usuarioEditandoId === id) {
        limpiarFormularioUsuario();
      }
      await cargarUsuarios();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Eliminar usuario exception', e);
      Alert.alert('Error', `${t('screens.config.errDeleteUser')}: ${e.message}`);
    } finally {
      setDeletingUserId(null);
    }
  };

  const confirmarEliminarUsuario = (usuario) => {
    if (!usuario?.id) return;
    if (!puedeAdministrarUsuarios) {
      mostrarPermisoUsuariosDenegado();
      return;
    }
    setConfirmingDeleteUsuario(usuario.id);
  };

  const abrirModalRecarga = (usuario) => {
    if (!puedeAdministrarUsuarios) {
      mostrarPermisoRecargasDenegado();
      return;
    }
    if (!billingConfig.checkout_enabled) {
      Alert.alert(t('screens.config.errPagoNoConfigurado'), t('screens.config.errConfiguracionStripe'));
      return;
    }

    setRecargaUsuario(usuario || null);
    setRecargaCreditos('50');
    setRecargaPaymentMethod('tarjeta');
    setModalRecargaVisible(true);
  };

  const cerrarModalRecarga = () => {
    setModalRecargaVisible(false);
    setRecargaUsuario(null);
    setProcesandoRecarga(false);
  };

  const iniciarRecargaCheckout = async () => {
    if (!recargaUsuario?.id) {
      Alert.alert('Error', t('screens.config.errSelectValidUser'));
      return;
    }

    const creditos = Number(recargaCreditos);
    if (!Number.isFinite(creditos) || !Number.isInteger(creditos) || creditos <= 0) {
      Alert.alert('Error', t('screens.config.errInvalidCredits'));
      return;
    }

    setProcesandoRecarga(true);
    try {
      const payload = {
        usuario_id: recargaUsuario.id,
        creditos,
        payment_method: recargaPaymentMethod,
      };

      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
        const base = `${window.location.origin}${window.location.pathname}`;
        payload.success_url = `${base}?billing=success&session_id={CHECKOUT_SESSION_ID}`;
        payload.cancel_url = `${base}?billing=cancel`;
      }

      const response = await fetch(API_BILLING_CHECKOUT_SESSION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        Alert.alert('Error', data.error || t('screens.config.errCheckoutFailed'));
        return;
      }

      const checkoutUrl = String(data.checkout_url || '').trim();
      if (!checkoutUrl) {
        Alert.alert('Error', t('screens.config.errNoCheckoutUrl'));
        return;
      }

      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
        window.location.assign(checkoutUrl);
        return;
      }

      const canOpen = await Linking.canOpenURL(checkoutUrl);
      if (!canOpen) {
        Alert.alert('Error', t('screens.config.errCantOpenCheckout'));
        return;
      }
      await Linking.openURL(checkoutUrl);
      cerrarModalRecarga();
    } catch (e) {
      Alert.alert('Error', `${t('screens.config.errCheckoutFailed')}: ${e.message}`);
    } finally {
      setProcesandoRecarga(false);
    }
  };

  const terminoUsuarios = String(busquedaUsuarios || '').trim().toLowerCase();
  const usuariosFiltrados = (usuarios || []).filter((item) => {
    if (!terminoUsuarios) return true;
    const texto = [item?.nombre, item?.email, item?.rol]
      .map((val) => String(val || '').toLowerCase())
      .join(' ');
    return texto.includes(terminoUsuarios);
  });
  const totalPaginasUsuarios = Math.max(1, Math.ceil(usuariosFiltrados.length / ITEMS_PER_PAGE));
  const usuariosPaginados = usuariosFiltrados.slice((paginaUsuarios - 1) * ITEMS_PER_PAGE, paginaUsuarios * ITEMS_PER_PAGE);

  useEffect(() => {
    setPaginaUsuarios(1);
  }, [busquedaUsuarios, usuarios]);

  useEffect(() => {
    if (paginaUsuarios > totalPaginasUsuarios) {
      setPaginaUsuarios(totalPaginasUsuarios);
    }
  }, [paginaUsuarios, totalPaginasUsuarios]);

  useEffect(() => {
    const permitidos = new Set(estadosPedidoDisponibles.map((item) => item.value));
    setEstadoRules((prev) => {
      const cleaned = {};
      Object.keys(ESTADO_RULE_DEFAULTS).forEach((key) => {
        const current = Array.isArray(prev[key]) ? prev[key] : [];
        cleaned[key] = current.filter((value) => permitidos.has(value));
      });
      return { ...prev, ...cleaned };
    });
  }, [settings.estados_pedido]);

  

  const agregarValor = async (categoria) => {
    const valor = (inputs[categoria] || '').trim();
    if (!valor) return;

    try {
      // Generar color para estados_pedido
      let color = '';
      if (categoria === 'estados_pedido') {
        color = newEstadoColor || generateColorFromHash(valor);
        setNewEstadoColor('');
      }

      // Backend expects creation via /api/settings/opcion with query params
      let url = `${API_OPCION_URL}?categoria=${encodeURIComponent(categoria)}&valor=${encodeURIComponent(valor)}`;
      if (color) {
        url += `&color=${encodeURIComponent(color)}`;
      }
      const response = await fetch(url, { method: 'POST' });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        Alert.alert('Error', data.error || t('screens.config.errSaveValue'));
        return;
      }

      setInputs((prev) => ({ ...prev, [categoria]: '' }));
      await cargarSettings();
      if (categoria === 'roles') {
        await cargarPermisosRoles();
      }
      if (categoria === 'estados_pedido') {
        await recargarSettings();
      }
    } catch (e) {
      Alert.alert('Error', `${t('screens.config.errSaveValue')}: ${e.message}`);
    }
  };

  const eliminarValor = async (id) => {
    const esRol = (settings.roles || []).some((item) => item.id === id);
    const esEstado = (settings.estados_pedido || []).some((item) => item.id === id);
    
    // Validar rol protegido
    const rolItem = (settings.roles || []).find((item) => item.id === id);
    if (rolItem && (rolItem.internal === true || slugifyEstado(String(rolItem?.valor || '')) === 'administrador')) {
      Alert.alert('Acción no permitida', t('screens.config.errRolProtected'));
      return;
    }

    // Validar si el rol está siendo usado por algún usuario
    if (esRol) {
      try {
        const response = await fetch(`${API_ROL_USAGE_URL}?rol_id=${encodeURIComponent(id)}`);
        const data = await response.json().catch(() => ({ in_use: false, count: 0 }));
        
        if (data.in_use) {
          Alert.alert(
            t('screens.config.errCantDelete'),
            t('screens.config.errRolInUse', { count: data.count })
          );
          return;
        }
      } catch (e) {
        // Si hay error verificando, permitir continuar con la eliminación
      }
    }

    // Validar estado protegido o en uso
    if (esEstado) {
      const estadoItem = (settings.estados_pedido || []).find((item) => item.id === id);
      const estadoKey = slugifyEstado(String(estadoItem?.valor || ''));
      const estadosProtegidos = new Set([
        'en-diseno',
        'finalizado',
      ]);
      
      if (estadosProtegidos.has(estadoKey)) {
        Alert.alert('Acción no permitida', t('screens.config.errStatusProtected'));
        return;
      }

      // Validar si el estado está siendo usado en algún pedido
      try {
        const response = await fetch(`${API_ESTADO_USAGE_URL}?estado_id=${encodeURIComponent(id)}`);
        const data = await response.json().catch(() => ({ in_use: false, count: 0 }));
        
        if (data.in_use) {
          // En lugar de bloquear, mostrar modal para migrar
          setEstadoAMigrar({
            id: id,
            valor: estadoItem.valor,
            count: data.count
          });
          setMigrarEstadoModal(true);
          return;
        }
      } catch (e) {
        // Si hay error verificando, permitir continuar con la eliminación
      }
    }

    try {
      const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 404) {
          await cargarSettings();
        }
        Alert.alert('Error', data.error || t('screens.config.errCantDelete'));
        return;
      }
      await cargarSettings();
      if (esRol) {
        await cargarPermisosRoles();
      }
      if (esEstado) {
        await recargarSettings();
      }
    } catch (e) {
      Alert.alert('Error', `${t('screens.config.errCantDelete')}: ${e.message}`);
    }
  };

  const migrarpedidosYEliminarEstado = async () => {
    if (!estadoAMigrar || !estadoDestinoMigracion) {
      Alert.alert('Error', t('screens.config.errSelectDestino'));
      return;
    }

    setMigrandoEstados(true);

    try {
      // Llamar al backend para migrar pedidos
      const response = await fetch('http://localhost:8080/api/pedidos/migrate-estado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_estado_id: estadoAMigrar.id,
          destination_estado_value: estadoDestinoMigracion.valor
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        Alert.alert('Error en migración', data.error || t('screens.config.errMigrationFailed'));
        setMigrandoEstados(false);
        return;
      }

      const migratedCount = data.migrated_count || 0;

      // Eliminar el estado
      const deleteResponse = await fetch(`${API_URL}/${estadoAMigrar.id}`, { 
        method: 'DELETE' 
      });

      const deleteData = await deleteResponse.json().catch(() => ({}));

      if (!deleteResponse.ok) {
        Alert.alert('Error', deleteData.error || t('screens.config.errStatusDeleteFailed'));
        setMigrandoEstados(false);
        return;
      }

      // Éxito - actualizar datos y cerrar modal
      setMigrarEstadoModal(false);
      setEstadoAMigrar(null);
      setEstadoDestinoMigracion(null);

      await cargarSettings();
      await cargarEstadoRules();

      Alert.alert(
        t('screens.config.okMigrationCompleted'),
        t('screens.config.okMigrationSuccess', { count: migratedCount, estado: estadoDestinoMigracion.valor }),
        [
          {
            text: 'OK',
          }
        ]
      );
    } catch (e) {
      Alert.alert('Error', `No se pudo completar la migración: ${e.message}`);
    } finally {
      setMigrandoEstados(false);
    }
  };

  const editarValor = async (item, categoria) => {
    // Prevent editing internal or protected roles (only 'administrador' protected)
    if (categoria === 'roles' && (item?.internal === true || slugifyEstado(String(item?.valor || '')) === 'administrador')) {
      Alert.alert('Acción no permitida', t('screens.config.errCantEditRole'));
      return;
    }

    // Activate inline editing state (works on web and native)
    const currentColor = item?.color || '';
    setEditing({ category: categoria, id: item.id, text: String(item?.valor || ''), color: currentColor });
  };

  const saveEditedValor = async () => {
    const { category, id, text, color } = editing;
    if (!category || !id) {
      setEditing({ category: null, id: null, text: '', color: '' });
      return;
    }
    const nuevo = String(text || '').trim();
    const lista = settings[category] || [];
    const original = (lista.find((it) => it.id === id) || {});
    const originalValor = original.valor || '';
    const originalColor = original.color || '';
    const textUnchanged = !nuevo || nuevo.toLowerCase() === String(originalValor || '').toLowerCase();
    const colorUnchanged = !color || color === originalColor;
    if (textUnchanged && colorUnchanged) {
      setEditing({ category: null, id: null, text: '', color: '' });
      return;
    }
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor: nuevo || originalValor, label: nuevo || originalValor, ...(color ? { color } : {}) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        Alert.alert('Error', data.error || t('screens.config.errEditValueFailed'));
        return;
      }
      await cargarSettings();
      if (category === 'roles') await cargarPermisosRoles();
      if (category === 'estados_pedido') {
        await recargarSettings();
      }
    } catch (e) {
      Alert.alert('Error', `${t('screens.config.errEditValueFailed')}: ${e.message}`);
    } finally {
      setEditing({ category: null, id: null, text: '', color: '' });
    }
  };

  const toggleEstadoRule = (ruleKey, estadoValue) => {
    setEstadoRules((prev) => {
      const actual = Array.isArray(prev[ruleKey]) ? prev[ruleKey] : [];
      const existe = actual.includes(estadoValue);
      return {
        ...prev,
        [ruleKey]: existe ? actual.filter((v) => v !== estadoValue) : [...actual, estadoValue],
      };
    });
  };

  const guardarEstadoRules = async () => {
    setGuardandoRules(true);
    try {
      const response = await fetch(API_ESTADOS_RULES_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: estadoRules }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        Alert.alert('Error', data.error || t('screens.config.errSaveRulesFailed'));
        return;
      }
      Alert.alert('OK', t('screens.config.okReglasGuardadas'));
      await cargarEstadoRules();
    } catch (e) {
      Alert.alert('Error', `${t('screens.config.errSaveRulesFailed')}: ${e.message}`);
    } finally {
      setGuardandoRules(false);
    }
  };

  const actualizarRolActivo = async (nextRole) => {
    setGuardandoRole(true);
    try {
      const response = await fetch(API_ACTIVE_ROLE_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active_role: nextRole }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        Alert.alert('Error', data.error || t('screens.config.errUpdateActiveRole'));
        return;
      }
      setActiveRole((data.active_role || nextRole || 'root').toLowerCase());
      Alert.alert('OK', t('screens.config.okRolActualizado', { label: data.active_role_label || nextRole }));
    } catch (e) {
      Alert.alert('Error', `${t('screens.config.errUpdateActiveRole')}: ${e.message}`);
    } finally {
      setGuardandoRole(false);
    }
  };


  const toggleRolePermission = async (roleKey, permissionKey) => {
    if (!puedeEditarRolesPermisos) {
      Alert.alert('Permiso denegado', t('screens.config.errPermisoDenegadoEditarReglas'));
      return;
    }

    // El administrador nunca puede ser desactivado
    if (roleKey === 'administrador') {
      Alert.alert('Permiso protegido', t('screens.config.errAdminNoPerderPermisos'));
      return;
    }
    
    // Calculamos el nuevo estado
    const currentRolePerms = rolePermissions[roleKey] || {};
    const newValue = !currentRolePerms[permissionKey];
    const newPermissions = {
      ...rolePermissions,
      [roleKey]: {
        ...currentRolePerms,
        [permissionKey]: newValue,
      },
    };
    
    // Actualizamos el estado local
    setRolePermissions(newPermissions);
    
    // Guardamos inmediatamente
    try {
      setGuardandoPermisos(true);
      const response = await fetch(API_ROLE_PERMISSIONS_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: newPermissions }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        Alert.alert('Error', data.error || t('screens.config.errSavePermsFailed'));
        // Revertir cambio local
        setRolePermissions(rolePermissions);
        return;
      }
      setRolePermissions(data.permissions || newPermissions);

      // Notificar a todos los hooks usePermission para que re-consulten el backend
      // con los nuevos permisos guardados
      try {
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
          const currentRole = window.localStorage?.getItem('PFP_SELECTED_ROLE') || displayedRole;
          window.dispatchEvent(new CustomEvent('pfp-role-changed', { detail: currentRole }));
        }
      } catch (e) { /* ignorar */ }

      // Si el usuario quitó el permiso 'manage_roles_permissions' a su propio rol, actualizar estado local
      if (roleKey === currentUserRole && permissionKey === 'manage_roles_permissions' && newValue === false) {
        setPuedeEditarRolesPermisosLocal(false);
      }
    } catch (e) {
      Alert.alert('Error', `${t('screens.config.errSavePermsFailed')}: ${e.message}`);
      // Revertir cambio local
      setRolePermissions(rolePermissions);
    } finally {
      setGuardandoPermisos(false);
    }
  };



  const guardarSessionTimeout = async () => {
    if (!puedeEditarSessionTimeout) {
      Alert.alert('Permiso denegado', t('screens.config.errPermisoDenegadoEditarValor'));
      return;
    }

    const minutes = Number(sessionTimeoutMinutes);
    if (!Number.isFinite(minutes) || !Number.isInteger(minutes)) {
      Alert.alert('Error', t('screens.config.errTimeInteger'));
      return;
    }
    if (minutes < sessionTimeoutMin || minutes > sessionTimeoutMax) {
      Alert.alert('Error', t('screens.config.errTimeRange', { min: sessionTimeoutMin, max: sessionTimeoutMax }));
      return;
    }

    setGuardandoSessionTimeout(true);
    try {
      const response = await fetch(API_SESSION_TIMEOUT_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_timeout_minutes: minutes }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        Alert.alert('Error', data.error || t('screens.config.errSaveSessionTimeout'));
        return;
      }
      setSessionTimeoutMinutes(String(data.session_timeout_minutes || minutes));
      Alert.alert('OK', t('screens.config.okSessionTimeoutUpdated'));
    } catch (e) {
      Alert.alert('Error', `${t('screens.config.errSaveSessionTimeout')}: ${e.message}`);
    } finally {
      setGuardandoSessionTimeout(false);
    }
  };

  const reordenarCategoria = async (categoria, orderedIds) => {
    const response = await fetch(API_SETTINGS_REORDER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoria, ordered_ids: orderedIds }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || t('screens.config.errReorderFailed'));
    }
  };

  const handleEstadosDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const items = settings.estados_pedido || [];
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove([...items], oldIndex, newIndex);
    setSettings((prev) => ({ ...prev, estados_pedido: reordered }));
    try {
      await reordenarCategoria('estados_pedido', reordered.map((i) => i.id));
      await cargarSettings();
    } catch (e) {
      await cargarSettings();
      Alert.alert('Error', `${t('screens.config.errReorderFailed')}: ${e.message}`);
    }
  };

  const renderCategoria = (categoryKey, categoryTitle, sectionStyle = null) => {
    const itemsRaw = settings[categoryKey] || [];
    const items = categoryKey === 'roles'
      ? itemsRaw.filter((item) => !item?.internal)
      : itemsRaw;
    const rolesProtegidos = new Set(['administrador']);
    const estadosProtegidos = new Set([
      'en-diseno',
      'finalizado',
    ]);
    return (
      <View key={categoryKey} style={[styles.section, sectionStyle]}>
        <Text style={styles.sectionTitle}>{categoryTitle}</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.submenuAddInput]}
            value={inputs[categoryKey]}
            onChangeText={(text) => setInputs((prev) => ({ ...prev, [categoryKey]: text }))}
            placeholder={t('screens.config.addItemPlaceholder', { category: categoryTitle.toLowerCase() })}
            placeholderTextColor="#94A3B8"
          />
          <TouchableOpacity style={styles.addBtn} onPress={() => agregarValor(categoryKey)}>
            <Text style={styles.addBtnText}>{t('screens.config.addBtn')}</Text>
          </TouchableOpacity>
        </View>
        {categoryKey === 'estados_pedido' && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12, alignItems: 'center' }}>
            {ESTADO_PALETTE.map(color => (
              <TouchableOpacity
                key={color}
                onPress={() => setNewEstadoColor(prev => prev === color ? '' : color)}
                style={{
                  width: 22, height: 22, borderRadius: 11,
                  backgroundColor: color,
                  borderWidth: newEstadoColor === color ? 2 : 1,
                  borderColor: newEstadoColor === color ? '#0F172A' : 'rgba(0,0,0,0.12)',
                  transform: newEstadoColor === color ? [{ scale: 1.2 }] : [],
                }}
              />
            ))}
            {inputs.estados_pedido ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 10, paddingLeft: 10, borderLeftWidth: 1, borderLeftColor: '#E2E8F0' }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: newEstadoColor || generateColorFromHash(inputs.estados_pedido), borderWidth: 2, borderColor: 'rgba(0,0,0,0.15)', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 }} />
                <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600' }}>{t('screens.config.preview')}</Text>
              </View>
            ) : null}
          </View>
        )}

        {items.length === 0 ? (
          <EmptyState variant="inline" icon="⚙️" title={t('screens.config.sinValores')} message={t('screens.config.noValoresConfigurados')} />
        ) : categoryKey === 'estados_pedido' ? (
          <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleEstadosDragEnd}>
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <View style={styles.estadoChipList}>
                {items.map((item) => {
                  const esEstadoProtegido = estadosProtegidos.has(slugifyEstado(item?.valor || ''));
                  return (
                    <SortableEstadoChip
                      key={item.id}
                      item={item}
                      isProtected={esEstadoProtegido}
                      onEdit={(i) => editarValor(i, categoryKey)}
                      onDelete={eliminarValor}
                      getColor={getEstadoColor}
                      editing={editing}
                      onEditChange={(t) => setEditing((prev) => ({ ...prev, text: t }))}
                      onEditColorChange={(c) => setEditing((prev) => ({ ...prev, color: c }))}
                      onEditSave={saveEditedValor}
                      palette={ESTADO_PALETTE}
                    />
                  );
                })}
              </View>
            </SortableContext>
          </DndContext>
        ) : (
          <View style={styles.chipList}>
            {items.map((item) => {
              const esRolProtegido = categoryKey === 'roles' && rolesProtegidos.has(slugifyEstado(item?.valor || ''));
              return (
                <View key={item.id} style={styles.chip}>
                  {editing.id === item.id && editing.category === categoryKey ? (
                    <TextInput
                      style={[styles.input, { minWidth: 120, paddingVertical: 6 }]}
                      value={editing.text}
                      onChangeText={(t) => setEditing((prev) => ({ ...prev, text: t }))}
                      onBlur={() => saveEditedValor()}
                      onSubmitEditing={() => saveEditedValor()}
                      autoFocus
                      returnKeyType="done"
                    />
                  ) : (
                    <Text style={styles.chipText}>{categoryKey === 'roles' ? capitalizeFirst(item.valor) : (item.label || item.valor)}</Text>
                  )}
                  <TouchableOpacity
                    style={[styles.chipEdit, esRolProtegido && styles.chipEditDisabled]}
                    disabled={esRolProtegido}
                    onPress={() => editarValor(item, categoryKey)}
                  >
                    <Text style={styles.chipEditText}>✎</Text>
                  </TouchableOpacity>
                  {confirmingDeleteValor === item.id ? (
                    <DeleteConfirmRow
                      onCancel={() => setConfirmingDeleteValor(null)}
                      onConfirm={() => { setConfirmingDeleteValor(null); eliminarValor(item.id); }}
                    />
                  ) : (
                    <TouchableOpacity
                      style={[styles.chipDelete, esRolProtegido && styles.chipDeleteDisabled]}
                      disabled={esRolProtegido}
                      onPress={() => setConfirmingDeleteValor(item.id)}
                    >
                      <Text style={styles.chipDeleteText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={{ width: 38 }} />
          <Text style={styles.title}>{pageTitle}</Text>
          {showTopUsersPlus ? (
            <TouchableOpacity style={[styles.usersBtnPlus, !puedeAdministrarUsuarios && { opacity: 0.45 }]} onPress={() => puedeAdministrarUsuarios && abrirModalNuevoUsuario()} disabled={!puedeAdministrarUsuarios}>
              <Text style={styles.usersBtnPlusText}>{t('screens.config.newUserBtn')}</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 38 }} />
          )}
        </View>
      </View>
      <View style={styles.contentWrap}>

      {showUsuariosRoles && (
      <View style={styles.blockContainer}>
        {showBlockTitles && <Text style={styles.groupTitle}>{t('screens.config.usuariosTitle')}</Text>}

        {/* Active-role UI removed: app no longer depends on configurable active_role */}

        <View style={styles.section}>

              <TextInput
                style={styles.usersSearchInput}
                value={busquedaUsuarios}
                onChangeText={setBusquedaUsuarios}
                placeholder={t('screens.config.searchUsersPlaceholder')}
                placeholderTextColor="#94A3B8"
              />

              {usuariosFiltrados.length === 0 ? (
                <EmptyState variant="inline" icon="👥" title={t('screens.config.noUsuarios')} message={t('screens.config.noUsuariosMsg')} />
              ) : (
                <>
                  <View style={styles.usersTableWrap}>
                    <View style={styles.usersTableHeader}>
                      <View style={styles.usersColNombre}><Text style={styles.usersHeaderText}>{t('screens.config.colNombre')}</Text></View>
                      <View style={styles.usersColEmail}><Text style={styles.usersHeaderText}>{t('screens.config.colEmail')}</Text></View>
                      <View style={styles.usersColRol}><Text style={styles.usersHeaderText}>{t('screens.config.colRol')}</Text></View>
                      {puedeGestionarSesionTimeout && (
                        <View style={styles.usersColSesion}><Text style={styles.usersHeaderText}>{t('screens.config.colSesion')}</Text></View>
                      )}
                      <View style={styles.usersColAcciones}><Text style={styles.usersHeaderText}>{t('screens.config.colAcciones')}</Text></View>
                    </View>
                    <ScrollView>
                      {usuariosPaginados.map((usuario, idx) => (
                        <View key={usuario.id} style={[styles.usersTableRow, (idx + (paginaUsuarios - 1) * ITEMS_PER_PAGE) % 2 === 1 && styles.usersTableRowAlt]}>
                          <View style={styles.usersColNombre}><Text style={styles.usersCellText} numberOfLines={1}>{usuario.nombre || '-'}</Text></View>
                          <View style={styles.usersColEmail}><Text style={styles.usersCellText} numberOfLines={1}>{usuario.email || '-'}</Text></View>
                          <View style={styles.usersColRol}><Text style={styles.usersCellText} numberOfLines={1}>{usuario.rol || '-'}</Text></View>
                          {puedeGestionarSesionTimeout && (
                            <View style={styles.usersColSesion}>
                              {usuario.sesion_timeout_minutos ? (
                                <View style={styles.sesionTimeoutBadge}>
                                  <Text style={styles.sesionTimeoutBadgeText}>⏱ {usuario.sesion_timeout_minutos} min</Text>
                                </View>
                              ) : (
                                <Text style={[styles.usersCellText, { color: '#94A3B8' }]}>{t('screens.config.sesionDefault')}</Text>
                              )}
                            </View>
                          )}
                          <View style={styles.usersColAcciones}>
                            <TouchableOpacity
                              style={[styles.usersActionBtn, !puedeAdministrarUsuarios && { opacity: 0.5 }]}
                              onPress={() => iniciarEdicionUsuario(usuario)}
                              disabled={!puedeAdministrarUsuarios}
                            >
                              <Text style={styles.usersActionBtnText}>{t('screens.config.editUserBtn')}</Text>
                            </TouchableOpacity>
                            {confirmingDeleteUsuario === usuario.id ? (
                              <DeleteConfirmRow
                                onCancel={() => setConfirmingDeleteUsuario(null)}
                                onConfirm={() => { setConfirmingDeleteUsuario(null); eliminarUsuario(usuario.id); }}
                              />
                            ) : (
                              <TouchableOpacity
                                style={[styles.usersActionBtn, styles.usersActionBtnDelete, (!puedeAdministrarUsuarios || deletingUserId === usuario.id) && { opacity: 0.5 }]}
                                onPress={() => confirmarEliminarUsuario(usuario)}
                                disabled={!puedeAdministrarUsuarios || deletingUserId === usuario.id}
                              >
                                <Text style={[styles.usersActionBtnText, { color: '#DC2626' }]}>{deletingUserId === usuario.id ? t('screens.config.deletingUserBtn') : t('screens.config.deleteUserBtn')}</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                  {totalPaginasUsuarios > 1 && (
                    <View style={styles.usersPaginationRow}>
                      <TouchableOpacity
                        style={[styles.usersPaginationBtn, paginaUsuarios === 1 && styles.usersPaginationBtnDisabled]}
                        onPress={() => setPaginaUsuarios((prev) => Math.max(1, prev - 1))}
                        disabled={paginaUsuarios === 1}
                      >
                        <Text style={styles.usersPaginationBtnText}>{t('common.prev')}</Text>
                      </TouchableOpacity>
                      <Text style={styles.usersPaginationInfo}>{t('common.pageOf', { current: paginaUsuarios, total: totalPaginasUsuarios })}</Text>
                      <TouchableOpacity
                        style={[styles.usersPaginationBtn, paginaUsuarios === totalPaginasUsuarios && styles.usersPaginationBtnDisabled]}
                        onPress={() => setPaginaUsuarios((prev) => Math.min(totalPaginasUsuarios, prev + 1))}
                        disabled={paginaUsuarios === totalPaginasUsuarios}
                      >
                        <Text style={styles.usersPaginationBtnText}>{t('common.next')}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}

              <Modal visible={modalUsuarioVisible} transparent animationType="fade" onRequestClose={cerrarModalUsuario}>
                <View style={styles.usersModalBackdrop}>
                  <View style={styles.usersModalCard}>
                    <Text style={styles.usersFormTitle}>{usuarioEditandoId ? t('screens.config.editUserTitle') : t('screens.config.newUserTitle')}</Text>

                    <Text style={styles.usersFieldLabel}>{t('screens.config.userNombreLabel')}</Text>
                    <TextInput
                      style={[styles.usersFieldInput, nombreUsuarioVacio && styles.usersFieldInputError]}
                      value={nuevoUsuarioNombre}
                      onChangeText={setNuevoUsuarioNombre}
                      placeholder={t('screens.config.userNombrePlaceholder')}
                      placeholderTextColor="#94A3B8"
                    />
                    {nombreUsuarioVacio && <Text style={styles.errorText}>{t('screens.config.userNombreRequired')}</Text>}

                    <Text style={styles.usersFieldLabel}>{t('screens.config.userEmailLabel')}</Text>
                    <TextInput
                      style={[styles.usersFieldInput, (emailUsuarioVacio || emailUsuarioInvalido) && styles.usersFieldInputError]}
                      value={nuevoUsuarioEmail}
                      onChangeText={setNuevoUsuarioEmail}
                      placeholder={t('screens.config.userEmailPlaceholder')}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      placeholderTextColor="#94A3B8"
                    />
                    {emailUsuarioVacio && <Text style={styles.errorText}>{t('screens.config.userEmailRequired')}</Text>}
                    {emailUsuarioInvalido && <Text style={styles.errorText}>{t('screens.config.userEmailInvalid')}</Text>}

                    <View style={styles.usersRoleRow}>
                      <Text style={styles.usersRoleLabel}>{t('screens.config.userRolLabel')}</Text>
                      <View style={styles.chipList}>
                        {rolesDisponibles.map((role) => {
                          const active = role.key === nuevoUsuarioRol;
                          return (
                            <TouchableOpacity
                              key={`user-role-${role.key}`}
                              style={[styles.selectChip, active && styles.selectChipActive]}
                              onPress={() => setNuevoUsuarioRol(role.key)}
                            >
                              <Text style={[styles.selectChipText, active && styles.selectChipTextActive]}>{capitalizeFirst(role.label)}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    {puedeGestionarSesionTimeout && (
                      <View style={{ marginTop: 12 }}>
                        <Text style={styles.usersFieldLabel}>{t('screens.config.userSesionTimeoutLabel')}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <TextInput
                            style={[styles.usersFieldInput, { flex: 1 }]}
                            value={nuevoUsuarioSesionTimeout}
                            onChangeText={(v) => setNuevoUsuarioSesionTimeout(v.replace(/[^0-9]/g, ''))}
                            placeholder={t('screens.config.userSesionTimeoutPlaceholder')}
                            placeholderTextColor="#94A3B8"
                            keyboardType="number-pad"
                            maxLength={4}
                          />
                          <Text style={{ fontSize: 12, color: '#64748B' }}>{t('screens.config.userSesionTimeoutUnit')}</Text>
                        </View>
                        <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>{t('screens.config.userSesionTimeoutHint')}</Text>
                      </View>
                    )}

                    <View style={styles.usersFormActions}>
                      <TouchableOpacity style={styles.usersBtn} onPress={cerrarModalUsuario}>
                        <Text style={styles.usersBtnText}>{t('common.cancel')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.usersBtn, styles.usersBtnPrimary]} onPress={guardarUsuario}>
                        <Text style={[styles.usersBtnText, styles.usersBtnPrimaryText]}>{t('common.save')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>

        <View>
          {renderCategoria('roles', 'Roles')}
          <Text style={[styles.muted, { marginTop: -6, marginBottom: 10 }]}>{t('screens.config.rolesProtegidos')}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.rulesHeaderRow}>
            <Text style={[styles.sectionTitle, { marginHorizontal: 0, marginTop: 0, marginBottom: 0, borderRadius: 6, alignSelf: 'flex-start' }]}>{t('screens.config.permisosTitle')}</Text>
            <TouchableOpacity style={styles.rulesToggleBtn} onPress={toggleRoleRulesExpanded}>
              <Text style={styles.rulesToggleBtnText}>{roleRulesExpanded ? t('screens.config.ocultar') : t('screens.config.expandir')}</Text>
            </TouchableOpacity>
          </View>
          {!puedeEditarRolesPermisos && (
            <Text style={[styles.muted, { marginTop: 6, marginBottom: 10 }]}>{t('screens.config.errPermisoDenegadoEditarReglas')}</Text>
          )}
          {!roleRulesExpanded ? (
            <Text style={styles.muted}>{t('screens.config.clickExpandir')}</Text>
          ) : (availableRoles || []).length === 0 ? (
            <EmptyState variant="inline" icon="📌" title={t('screens.config.sinRoles')} message={t('screens.config.addRolesFirst')} />
          ) : (
            <>
              {ROLE_PERMISSION_CONFIG.map((perm) => {
                return (
                  <View key={`perm-rule-${perm.key}`} style={styles.ruleGroup}>
                    <Text style={styles.ruleTitle}>{perm.title}</Text>
                    <Text style={styles.ruleHint}>{perm.hint}</Text>
                    <View style={styles.chipList}>
                      {(availableRoles || []).map((role) => {
                        const roleKey = String(role?.key || '').toLowerCase();
                        const rolePerms = rolePermissions[roleKey] || {};
                        const active = !!rolePerms[perm.key];
                        const isAdministrador = roleKey === 'administrador';
                        return (
                          <TouchableOpacity
                            key={`${perm.key}-${roleKey}`}
                            style={[
                              styles.selectChip, 
                              active && styles.selectChipActive,
                              !puedeEditarRolesPermisos && styles.selectChipDisabled,
                              isAdministrador && styles.selectChipProtected
                            ]}
                            onPress={() => toggleRolePermission(roleKey, perm.key)}
                            disabled={!puedeEditarRolesPermisos || isAdministrador}
                          >
                            <Text style={[
                              styles.selectChipText, 
                              active && styles.selectChipTextActive,
                              !puedeEditarRolesPermisos && styles.selectChipTextDisabled,
                              isAdministrador && styles.selectChipTextProtected
                            ]}>{capitalizeFirst(role?.label || roleKey)}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </View>

        </View>

      </View>
      )}

      {section && (section === 'all' || section === 'funcionalidades') && (
        <View style={styles.blockContainer}>
          {showBlockTitles && <Text style={styles.groupTitle}>{t('nav.pedidos')}</Text>}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('screens.config.modoCreacionTitle')}</Text>
            <View style={styles.modeRow}>
              <View style={styles.modeButtonsWrap}>
                <TouchableOpacity
                  style={[styles.modeBtn, modoCreacion === 'manual' && styles.modeBtnActive]}
                  onPress={() => actualizarModoCreacion('manual')}
                  disabled={guardandoModoCreacion}
                >
                  <Text style={[styles.modeBtnText, modoCreacion === 'manual' && styles.modeBtnTextActive]}>{t('screens.config.manual')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeBtn, modoCreacion === 'automatico' && styles.modeBtnActive]}
                  onPress={() => actualizarModoCreacion('automatico')}
                  disabled={guardandoModoCreacion}
                >
                  <Text style={[styles.modeBtnText, modoCreacion === 'automatico' && styles.modeBtnTextActive]}>{t('screens.config.automatico')}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.rulesToggleBtn} onPress={() => setApiExamplesExpanded((v) => !v)}>
                <Text style={styles.rulesToggleBtnText}>{apiExamplesExpanded ? t('screens.config.ocultarEjemplosApi') : t('screens.config.verEjemplosApi')}</Text>
              </TouchableOpacity>
            </View>

            {apiExamplesExpanded && (
              <>
                <Text style={styles.codeTitle}>1. Cambiar modo (curl)</Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.codeText}>{`curl -X PUT ${API_MODO_URL} \\
  -H 'Content-Type: application/json' \\
  -H 'X-Empresa-Id: 1' \\
  -H 'X-User-Id: admin' \\
  -H 'X-Role: administrador' \\
  -d '{"modo":"automatico"}'`}</Text>
                </View>

                <Text style={styles.codeTitle}>2. Crear pedido desde ERP (curl)</Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.codeText}>{`curl -X POST http://localhost:8080/api/pedidos/crear-desde-erp \\
  -H 'Content-Type: application/json' \\
  -H 'X-Empresa-Id: 1' \\
  -H 'X-User-Id: erp-system' \\
  -H 'X-Role: erp' \\
  -d '{
    "trabajo_id": "ERP-2026-001",
    "cliente": "Cliente ABC",
    "referencia": "REF-001",
    "nombre": "Pedido desde ERP",
    "fecha_entrega": "2026-03-15",
    "datos_presupuesto": {
      "tirada": 1000,
      "material": "PP",
      "acabado": ["Mate"]
    }
  }'`}</Text>
                </View>

                <Text style={styles.codeTitle}>3. Verificar si modo automático está activo (curl)</Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.codeText}>{`curl -X GET http://localhost:8080/api/pedidos/validar-modo-automatico \\
  -H 'X-Empresa-Id: 1' \\
  -H 'X-User-Id: erp-system' \\
  -H 'X-Role: erp'`}</Text>
                </View>

                <Text style={styles.codeTitle}>4. Cambiar estado de un pedido (fetch)</Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.codeText}>{`const updatePedido = (pedidoId, nuevoEstado) => {
  fetch(\`http://localhost:8080/api/pedidos/\${pedidoId}\`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Empresa-Id': '1',
      'X-User-Id': 'admin',
      'X-Role': 'administrador'
    },
    body: JSON.stringify({
      estado: nuevoEstado,
      // Soporta campos adicionales
      observaciones: '',
      datos_presupuesto: {}
    })
  }).then(r => r.json())
   .then(d => console.log(d));
};`}</Text>
                </View>

                <Text style={styles.codeTitle}>Notas importantes:</Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.codeText}>{`• Los headers X-Empresa-Id, X-User-Id y X-Role son OBLIGATORIOS
• Para ERP: X-Role puede ser "erp" o similar
• El modo automático: "automatico" o "manual"
• Los campos adicionales en pedidos/presupuestos se
  guardan en "datos_presupuesto" para compatibilidad futura
• Idempotencia: crear 2 veces mismo trabajo_id retorna el existente`}</Text>
                </View>
              </>
            )}
          </View>

          {renderCategoria('estados_pedido', t('screens.config.estadosPedidoTitle'))}
        </View>
      )}

      {showCreditos && (
      <View style={styles.blockContainer}>
        {showBlockTitles && <Text style={styles.groupTitle}>{t('screens.config.creditosTitle')}</Text>}

        <View style={styles.section}>
          {!puedeAdministrarUsuarios && <Text style={styles.muted}>{t('screens.config.sinPermisoCreditosMsg')}</Text>}

          <TextInput
            style={styles.usersSearchInput}
            value={busquedaUsuarios}
            onChangeText={setBusquedaUsuarios}
            placeholder={t('screens.config.searchUsersPlaceholder')}
            placeholderTextColor="#94A3B8"
          />

          {usuariosFiltrados.length === 0 ? (
            <EmptyState variant="inline" icon="👥" title={t('screens.config.noUsuarios')} message={t('screens.config.noUsuariosMsg')} />
          ) : (
            <>
              <View style={styles.usersTableWrap}>
                <View style={styles.usersTableHeader}>
                  <View style={styles.usersColNombre}><Text style={styles.usersHeaderText}>{t('screens.config.colNombre')}</Text></View>
                  <View style={styles.usersColEmail}><Text style={styles.usersHeaderText}>{t('screens.config.colEmail')}</Text></View>
                  <View style={styles.usersColRol}><Text style={styles.usersHeaderText}>{t('screens.config.colCreditos')}</Text></View>
                  <View style={styles.usersColAcciones}><Text style={styles.usersHeaderText}>{t('screens.config.colAcciones')}</Text></View>
                </View>
                <ScrollView>
                  {usuariosPaginados.map((usuario, idx) => (
                    <View key={`creditos-${usuario.id}`} style={[styles.usersTableRow, (idx + (paginaUsuarios - 1) * ITEMS_PER_PAGE) % 2 === 1 && styles.usersTableRowAlt]}>
                      <View style={styles.usersColNombre}><Text style={styles.usersCellText} numberOfLines={1}>{usuario.nombre || '-'}</Text></View>
                      <View style={styles.usersColEmail}><Text style={styles.usersCellText} numberOfLines={1}>{usuario.email || '-'}</Text></View>
                      <View style={styles.usersColRol}><Text style={styles.usersCellText} numberOfLines={1}>{Number(usuario.creditos || 0)}</Text></View>
                      <View style={styles.usersColAcciones}>
                        <TouchableOpacity
                          style={[styles.usersActionBtn, styles.usersActionBtnBilling, !puedeAdministrarUsuarios && { opacity: 0.5 }]}
                          onPress={() => abrirModalRecarga(usuario)}
                          disabled={!puedeAdministrarUsuarios}
                        >
                          <Text style={styles.usersActionBtnText}>{t('screens.config.recargarBtn')}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
              {totalPaginasUsuarios > 1 && (
                <View style={styles.usersPaginationRow}>
                  <TouchableOpacity
                    style={[styles.usersPaginationBtn, paginaUsuarios === 1 && styles.usersPaginationBtnDisabled]}
                    onPress={() => setPaginaUsuarios((prev) => Math.max(1, prev - 1))}
                    disabled={paginaUsuarios === 1}
                  >
                    <Text style={styles.usersPaginationBtnText}>{t('common.prev')}</Text>
                  </TouchableOpacity>
                  <Text style={styles.usersPaginationInfo}>{t('common.pageOf', { current: paginaUsuarios, total: totalPaginasUsuarios })}</Text>
                  <TouchableOpacity
                    style={[styles.usersPaginationBtn, paginaUsuarios === totalPaginasUsuarios && styles.usersPaginationBtnDisabled]}
                    onPress={() => setPaginaUsuarios((prev) => Math.min(totalPaginasUsuarios, prev + 1))}
                    disabled={paginaUsuarios === totalPaginasUsuarios}
                  >
                    <Text style={styles.usersPaginationBtnText}>{t('common.next')}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      </View>
      )}

      

      {showImpresion && (
      <View style={styles.blockContainer}>
        {showBlockTitles && <Text style={styles.groupTitle}>{t('screens.config.impresionTitle')}</Text>}
        {renderCategoria('acabados', t('screens.config.acabadosTitle'))}
        {renderCategoria('tintas_especiales', t('screens.config.tintasEspecialesTitle'))}

      </View>
      )}

      <Modal visible={modalRecargaVisible} transparent animationType="fade" onRequestClose={cerrarModalRecarga}>
        <View style={styles.usersModalBackdrop}>
          <View style={styles.usersModalCard}>
            <Text style={styles.usersFormTitle}>{t('screens.config.recargarCreditosTitle')}</Text>
            <Text style={styles.muted}>{t('screens.config.recargarUsuario', { nombre: recargaUsuario?.nombre || '-', email: recargaUsuario?.email || '-' })}</Text>

            <Text style={styles.usersFieldLabel}>{t('screens.config.creditosLabel')}</Text>
            <TextInput
              style={styles.usersFieldInput}
              value={recargaCreditos}
              onChangeText={(text) => setRecargaCreditos(String(text || '').replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              placeholder={t('screens.config.creditosEjemplo')}
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.usersFieldLabel}>{t('screens.config.metodoPagoLabel')}</Text>
            <View style={styles.chipList}>
              {(billingConfig.payment_methods || []).map((method) => {
                const key = String(method?.key || '').toLowerCase();
                const active = key === recargaPaymentMethod;
                return (
                  <TouchableOpacity
                    key={`recarga-${key}`}
                    style={[styles.selectChip, active && styles.selectChipActive]}
                    onPress={() => setRecargaPaymentMethod(key)}
                  >
                    <Text style={[styles.selectChipText, active && styles.selectChipTextActive]}>{method?.label || key}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.usersFormActions}>
              <TouchableOpacity style={styles.usersBtn} onPress={cerrarModalRecarga} disabled={procesandoRecarga}>
                <Text style={styles.usersBtnText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.usersBtn, styles.usersBtnPrimary]} onPress={iniciarRecargaCheckout} disabled={procesandoRecarga}>
                <Text style={[styles.usersBtnText, styles.usersBtnPrimaryText]}>{procesandoRecarga ? t('screens.config.procesandoBtn') : t('screens.config.irPagoBtn')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={migrarEstadoModal} transparent animationType="fade" onRequestClose={() => setMigrarEstadoModal(false)}>
        <View style={styles.usersModalBackdrop}>
          <View style={styles.usersModalCard}>
            <Text style={styles.usersFormTitle}>{t('screens.config.migrarTitle')}</Text>
            {estadoAMigrar && (
              <Text style={styles.muted}>
                {t('screens.config.migrarInfo', { count: estadoAMigrar.count, estado: estadoAMigrar.valor })}
              </Text>
            )}

            <Text style={styles.usersFieldLabel}>{t('screens.config.migrarSelectDestino')}</Text>
            <ScrollView style={styles.estadoSelectContainer} nestedScrollEnabled>
              {(settings.estados_pedido || [])
                .filter((estado) => estado.id !== estadoAMigrar?.id)
                .map((estado) => {
                  const isSelected = estadoDestinoMigracion?.id === estado.id;
                  // Usar color guardado si existe, si no usar mapa fijo o generar uno
                  const estadoColor = getEstadoColor(estado.valor);
                  return (
                    <TouchableOpacity
                      key={`migrar-estado-${estado.id}`}
                      style={[
                        styles.selectChip,
                        isSelected && styles.selectChipActive,
                        { borderLeftWidth: 4, borderLeftColor: estadoColor }
                      ]}
                      onPress={() => setEstadoDestinoMigracion(estado)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: estadoColor }} />
                        <Text style={[styles.selectChipText, isSelected && styles.selectChipTextActive]}>
                          {estado.valor}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>

            <View style={styles.usersFormActions}>
              <TouchableOpacity
                style={styles.usersBtn}
                onPress={() => setMigrarEstadoModal(false)}
                disabled={migrandoEstados}
              >
                <Text style={styles.usersBtnText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.usersBtn, styles.usersBtnPrimary]}
                onPress={migrarpedidosYEliminarEstado}
                disabled={!estadoDestinoMigracion || migrandoEstados}
              >
                <Text style={[styles.usersBtnText, styles.usersBtnPrimaryText]}>
                  {migrandoEstados ? t('screens.config.migrandoBtn') : t('screens.config.migrarEliminarBtn')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      </View>
    </ScrollView>
  );
}

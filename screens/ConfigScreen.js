import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Platform, Modal, Linking, Switch } from 'react-native';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { useFocusEffect } from '@react-navigation/native';
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
  { key: 'manage_estados_pedido', title: 'Editar estados de pedidos', hint: 'Permite crear, modificar y eliminar estados disponibles.' },
  { key: 'edit_clientes', title: 'Editar clientes', hint: 'Alta, edición y eliminación de clientes.' },
  { key: 'edit_maquinas', title: 'Editar máquinas', hint: 'Alta, edición y eliminación de máquinas.' },
  { key: 'edit_pedidos', title: 'Editar pedidos', hint: 'Creación y cambios de pedidos y trabajos.' },
  { key: 'edit_presupuestos', title: 'Editar presupuestos', hint: 'Creación, edición y aprobación de presupuestos.' },
  { key: 'edit_produccion', title: 'Editar producción', hint: 'Enviar, mover, reordenar y cambiar estado en producción.' },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
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
  },
  title: {
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
  logoutBtn: {
    marginLeft: 'auto',
    borderWidth: 1,
    borderColor: '#98A2B3',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#1F2937',
  },
  logoutBtnText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '800',
  },
  contentWrap: {
    padding: 12,
  },
  groupTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 10,
    marginTop: 0,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 34,
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
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 12,
  },
  pedidoStatesCard: {
    borderColor: '#C7D7FE',
    backgroundColor: '#F5F8FF',
    borderWidth: 1.5,
  },
  pedidoRulesCard: {
    borderColor: '#C7D7FE',
    backgroundColor: '#F7F9FC',
    borderWidth: 1.5,
  },
  pedidoRulesHeader: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1D2939',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  row: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#FBFBFD',
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
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  chipList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 999,
    backgroundColor: '#FBFBFD',
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
  chipDeleteText: { color: '#B42318', fontWeight: '900' },
  chipEdit: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EEF2F6',
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
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  modeBtnText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '700',
  },
  modeBtnTextActive: {
    color: '#F3F4F6',
  },
  codeTitle: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '800',
    color: '#1D2939',
  },
  codeBlock: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
  },
  codeText: {
    fontSize: 11,
    color: '#1D2939',
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
    color: '#667085',
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
    borderColor: '#3AB274',
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
  saveRulesBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#3AB274',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  saveRulesBtnDisabled: {
    opacity: 0.5,
  },
  saveRulesBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  pedidoRuleGroup: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#DDE6F7',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
  },
  pedidoRuleTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1D2939',
    marginBottom: 4,
  },
  pedidoRuleHint: {
    fontSize: 12,
    color: '#667085',
    marginBottom: 8,
  },
  pedidoRuleChip: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F8FAFC',
  },
  pedidoRuleChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  pedidoRuleChipText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '700',
  },
  pedidoRuleChipTextActive: {
    color: '#F8FAFC',
  },
  saveRulesBtnPedido: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
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
    backgroundColor: '#EEF2F6',
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
  usersHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  usersBlockTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  usersBtnPlus: {
    backgroundColor: '#2563EB',
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  usersBtnPlusText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 28,
    lineHeight: 28,
    marginTop: -2,
  },
  usersRoleLabel: {
    color: '#444',
    fontSize: 13,
    fontWeight: '700',
  },
  usersFormCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 16,
    marginBottom: 10,
  },
  usersFormTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  usersFieldLabel: {
    fontSize: 13,
    color: '#444',
    fontWeight: '700',
    marginBottom: 6,
  },
  usersFieldInput: {
    backgroundColor: '#FBFBFD',
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
    borderColor: '#D21820',
  },
  usersSearchInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    backgroundColor: '#FBFBFD',
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
    backgroundColor: '#F8FAFC',
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
    backgroundColor: '#F8FAFC',
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
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  usersPaginationBtnDisabled: {
    backgroundColor: '#A8A8AA',
  },
  usersPaginationBtnText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  usersPaginationInfo: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  usersActionBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  usersActionBtnDelete: {
    backgroundColor: '#B42318',
  },
  usersActionBtnBilling: {
    backgroundColor: '#1D4ED8',
  },
  usersActionBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  usersFormActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    marginTop: 6,
    marginBottom: 2,
  },
  usersBtn: {
    backgroundColor: '#A8A8AA',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  usersBtnPrimary: {
    backgroundColor: '#2563EB',
  },
  usersBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  usersBtnPrimaryText: {
    color: '#FFFFFF',
  },
  usersModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 16,
  },
  usersModalCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 16,
  },
  inputError: {
    borderColor: '#D21820',
  },
  errorText: {
    color: '#D21820',
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
  { key: 'en_cola_produccion', title: 'Estados en cola de producción', hint: 'Se muestran como “en cola”.' },
  { key: 'preimpresion', title: 'Estados de preimpresión', hint: 'Al volver a estos, se quita de la cola.' },
  { key: 'estados_finalizados', title: 'Estados finalizados', hint: 'Usados para lógica de cierre y limpieza.' },
  { key: 'ocultar_timeline', title: 'Ocultar en timeline', hint: 'No se muestran en los círculos de fase.' },
  { key: 'ocultar_grafica', title: 'Ocultar en gráfica', hint: 'No se cuentan en la gráfica de estados.' },
];

function SortableEstadoChip({ item, isProtected, onEdit, onDelete, getColor, editing, onEditChange, onEditSave }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({ id: item.id });

  const rnRef = useCallback(
    (node) => {
      if (!node) return;
      setNodeRef(node.getNativeNode?.() ?? node);
    },
    [setNodeRef]
  );

  const rowStyle = [
    styles.estadoChipRow,
    isDragging && { opacity: 0.75, zIndex: 999 },
    transform ? { transform: [{ translateX: transform.x }, { translateY: transform.y }] } : null,
  ];

  return (
    <View ref={rnRef} style={rowStyle} {...attributes}>
      <View style={styles.dragHandle} {...listeners}>
        <Text style={styles.dragHandleText}>⠿</Text>
      </View>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: getColor(item.valor), marginRight: 8, flexShrink: 0 }} />
      {editing.id === item.id ? (
        <TextInput
          style={[styles.input, { flex: 1, paddingVertical: 4 }]}
          value={editing.text}
          onChangeText={onEditChange}
          onBlur={onEditSave}
          onSubmitEditing={onEditSave}
          autoFocus
          returnKeyType="done"
        />
      ) : (
        <Text style={[styles.chipText, { flex: 1 }]}>{item.label || item.valor}</Text>
      )}
      <TouchableOpacity
        style={[styles.chipEdit, isProtected && styles.chipEditDisabled]}
        disabled={isProtected}
        onPress={() => onEdit(item)}
      >
        <Text style={styles.chipEditText}>✎</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.chipDelete, isProtected && styles.chipDeleteDisabled]}
        disabled={isProtected}
        onPress={() => onDelete(item.id)}
      >
        <Text style={styles.chipDeleteText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ConfigScreen({ route, currentUser }) {
  const ITEMS_PER_PAGE = 100;
  const [settings, setSettings] = useState({
    roles: [],
    acabados: [],
    tintas_especiales: [],
    estados_pedido: [],
  });
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
  const [submittedUsuario, setSubmittedUsuario] = useState(false);
  
  const [estadoRules, setEstadoRules] = useState(ESTADO_RULE_DEFAULTS);
  const [guardandoRules, setGuardandoRules] = useState(false);
  const [pedidoRulesExpanded, setPedidoRulesExpanded] = useState(false);
  const [roleRulesExpanded, setRoleRulesExpanded] = useState(false);
  const [rolePermissions, setRolePermissions] = useState({});
  const [guardandoRole, setGuardandoRole] = useState(false);
  const [guardandoPermisos, setGuardandoPermisos] = useState(false);
  const [editing, setEditing] = useState({ category: null, id: null, text: '' });
  const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState('30');
  const [sessionTimeoutMin, setSessionTimeoutMin] = useState(5);
  const [sessionTimeoutMax, setSessionTimeoutMax] = useState(480);
  const [guardandoSessionTimeout, setGuardandoSessionTimeout] = useState(false);
  const [forceRootEnabled, setForceRootEnabled] = useState(false);
  const [modoCreacion, setModoCreacion] = useState('manual');
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
    'usuarios-roles': 'Usuarios',
    creditos: 'Créditos',
    impresion: 'Impresión',
  };
  const pageTitle = titleBySection[section] || 'Configuración';
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
    // Primero intenta usar color fijo del sistema
    if (ESTADO_COLOR_MAP[normalized]) {
      return ESTADO_COLOR_MAP[normalized];
    }
    // Luego intenta usar color persistido
    const estadoItem = (settings.estados_pedido || []).find(item => slugifyEstado(item.valor) === normalized);
    if (estadoItem?.color) {
      return estadoItem.color;
    }
    // Por último, genera un color dinámico
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

  const cargarSettings = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      if (response.ok && data.settings) {
        setSettings({
          roles: data.settings.roles || [],
          acabados: data.settings.acabados || [],
          tintas_especiales: data.settings.tintas_especiales || [],
          estados_pedido: data.settings.estados_pedido || [],
        });
      }
    } catch (e) {
      Alert.alert('Error', `No se pudieron cargar settings: ${e.message}`);
    }
  };

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

  const cargarModoCreacion = () => {
    try {
      fetch(API_MODO_URL)
        .then((r) => r.json().catch(() => ({})))
        .then((data) => {
          if (data && data.modo) {
            setModoCreacion(String(data.modo || 'manual'));
          }
        })
        .catch(() => setModoCreacion('manual'));
    } catch (e) {
      setModoCreacion('manual');
    }
  };

  const actualizarModoCreacion = async (modo) => {
    try {
      setGuardandoModoCreacion(true);
      await fetch(API_MODO_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modo }),
      });
      setModoCreacion(modo);
    } catch (e) {
      Alert.alert('Error', `No se pudo actualizar el modo: ${e.message}`);
    } finally {
      setGuardandoModoCreacion(false);
    }
  };

  const cargarEstadoRules = () => {
    try {
      fetch(API_ESTADOS_RULES_URL)
        .then((r) => r.json().catch(() => ({})))
        .then((data) => {
          if (data && data.rules) {
            setEstadoRules((prev) => ({ ...prev, ...data.rules }));
          } else if (!data) {
            setEstadoRules(ESTADO_RULE_DEFAULTS);
          }
        })
        .catch(() => {
          setEstadoRules(ESTADO_RULE_DEFAULTS);
        });
    } catch (e) {
      setEstadoRules(ESTADO_RULE_DEFAULTS);
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
    cargarSettings();
    cargarEstadoRules();
    cargarPermisosRoles();
    cargarUsuarios();
    cargarSessionTimeout();
    cargarModoCreacion();
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
        Alert.alert('Pago cancelado', 'No se realizó ningún cargo.');
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
            Alert.alert('Pago pendiente', data.error || 'No se pudo confirmar el pago aún.');
            return;
          }
          const agregados = Number(data.creditos_agregados || 0);
          const saldo = Number(data.creditos || 0);
          Alert.alert('Recarga confirmada', `Se añadieron ${agregados} créditos. Saldo actual: ${saldo}.`);
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
  const currentUserRole = String(currentUser?.rol || '').toLowerCase();
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
  const puedeAdministrarUsuarios = Boolean(
    currentUserRole === 'root'
    || currentUserRole === 'administrador'
    || currentUserRole === 'admin'
    || currentUserPermissionValue === true
    || rolePermissionValue === true
  );
  // Sincronizar PFP_SELECTED_ROLE con el rol del usuario actual para que usePermission siempre use el rol correcto
  useEffect(() => {
    if (currentUserRole && typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem('PFP_SELECTED_ROLE');
      if (stored !== currentUserRole) {
        window.localStorage.setItem('PFP_SELECTED_ROLE', currentUserRole);
        if (typeof window.dispatchEvent === 'function') {
          window.dispatchEvent(new CustomEvent('pfp-role-changed', { detail: currentUserRole }));
        }
      }
    }
  }, [currentUserRole]);

  // Usar permiso dinámico desde el backend
  const puedeEditarSessionTimeout = usePermission('manage_app_settings');
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
    setSubmittedUsuario(false);
  };

  // La comprobación/alerta de permiso de usuarios se ha eliminado (backend sigue validando).

  const mostrarPermisoRecargasDenegado = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert('Permiso denegado: Tu rol no tiene permiso para gestionar recargas');
      return;
    }
    Alert.alert('Permiso denegado', 'Tu rol no tiene permiso para gestionar recargas');
  };

  const mostrarPermisoUsuariosDenegado = () => {
    const roleInfo = `rol=${currentUserRole} manage_app_settings=${String(currentUserPermissionValue)} rolePerm=${String(rolePermissionValue)}`;
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert(`Permiso denegado: Tu rol no tiene permiso para gestionar usuarios. (${roleInfo})`);
      return;
    }
    Alert.alert('Permiso denegado', `Tu rol no tiene permiso para gestionar usuarios. (${roleInfo})`);
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
    console.log('guardarUsuario invoked', { nuevoUsuarioNombre, nuevoUsuarioEmail, nuevoUsuarioRol, puedeAdministrarUsuarios });
    if (!puedeAdministrarUsuarios) {
      mostrarPermisoUsuariosDenegado();
      return;
    }

    setSubmittedUsuario(true);
    const nombre = String(nuevoUsuarioNombre || '').trim();
    const email = String(nuevoUsuarioEmail || '').trim().toLowerCase();
    const rol = String(nuevoUsuarioRol || '').trim().toLowerCase();

    if (!nombre || !email) {
      Alert.alert('Error', 'Nombre y email son obligatorios');
      return;
    }

    if (!rol) {
      Alert.alert('Error', 'Debes seleccionar un rol');
      return;
    }

    if (!emailValido(email)) {
      Alert.alert('Error', 'Email no válido');
      return;
    }

    try {
      const endpoint = usuarioEditandoId ? `${API_USERS_URL}/${usuarioEditandoId}` : API_USERS_URL;
      const method = usuarioEditandoId ? 'PUT' : 'POST';
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, rol }),
      });
      const data = await response.json().catch(() => ({}));

      // Debug: show status and response body to help diagnose web client issues
      console.log('guardarUsuario response', response.status, data);
      if (!response.ok) {
        Alert.alert('Error', `(${response.status}) ${data.error || 'No se pudo guardar el usuario'}`);
        return;
      }

      // On success, show created/updated id and any temp password returned
      const id = data.id || data._id || (data.usuario && data.usuario.id) || null;
      const temp = data._temp_password || (data.usuario && data.usuario._temp_password) || null;
      if (id) {
        Alert.alert('Usuario creado', `ID: ${id}${temp ? `\nContraseña temporal: ${temp}` : ''}`);
      }

      limpiarFormularioUsuario();
      setModalUsuarioVisible(false);
      await cargarUsuarios();
    } catch (e) {
      console.error('guardarUsuario exception', e);
      Alert.alert('Error', `No se pudo guardar el usuario: ${e.message}`);
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
    setSubmittedUsuario(false);
    setModalUsuarioVisible(true);
  };

  const [deletingUserId, setDeletingUserId] = useState(null);

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

      // eslint-disable-next-line no-console
      console.log('Eliminar usuario request:', `${API_USERS_URL}/${id}`);
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
        Alert.alert('Error', data.error || `No se pudo eliminar el usuario (status ${response.status})`);
        return;
      }

      // eslint-disable-next-line no-console
      console.log('Usuario eliminado:', id);
      if (usuarioEditandoId === id) {
        limpiarFormularioUsuario();
      }
      await cargarUsuarios();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Eliminar usuario exception', e);
      Alert.alert('Error', `No se pudo eliminar el usuario: ${e.message}`);
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

    try {
      const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';
      // On web, react-native Alert may not trigger the onPress handlers; use window.confirm instead.
      if (isWeb && typeof window.confirm === 'function') {
        // eslint-disable-next-line no-console
        console.log('confirmarEliminarUsuario (web)', usuario.id, usuario.nombre);
        const accepted = window.confirm(`¿Seguro que quieres eliminar a ${usuario?.nombre || 'este usuario'}?`);
        if (accepted) {
          eliminarUsuario(usuario.id);
        }
        return;
      }
    } catch (e) {
      // ignore and fallback to Alert
    }

    Alert.alert(
      'Confirmar eliminación',
      `¿Seguro que quieres eliminar a ${usuario?.nombre || 'este usuario'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => eliminarUsuario(usuario.id),
        },
      ]
    );
  };

  const abrirModalRecarga = (usuario) => {
    if (!puedeAdministrarUsuarios) {
      mostrarPermisoRecargasDenegado();
      return;
    }
    if (!billingConfig.checkout_enabled) {
      Alert.alert('Pasarela no configurada', 'Configura STRIPE_SECRET_KEY en el backend para habilitar cobros reales.');
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
      Alert.alert('Error', 'Selecciona un usuario válido');
      return;
    }

    const creditos = Number(recargaCreditos);
    if (!Number.isFinite(creditos) || !Number.isInteger(creditos) || creditos <= 0) {
      Alert.alert('Error', 'Introduce una cantidad de créditos válida');
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
        Alert.alert('Error', data.error || 'No se pudo iniciar el checkout');
        return;
      }

      const checkoutUrl = String(data.checkout_url || '').trim();
      if (!checkoutUrl) {
        Alert.alert('Error', 'No se recibió URL de checkout');
        return;
      }

      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
        window.location.assign(checkoutUrl);
        return;
      }

      const canOpen = await Linking.canOpenURL(checkoutUrl);
      if (!canOpen) {
        Alert.alert('Error', 'No se pudo abrir el checkout en este dispositivo.');
        return;
      }
      await Linking.openURL(checkoutUrl);
      cerrarModalRecarga();
    } catch (e) {
      Alert.alert('Error', `No se pudo iniciar el checkout: ${e.message}`);
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
        color = generateColorFromHash(valor);
      }

      // Backend expects creation via /api/settings/opcion with query params
      let url = `${API_OPCION_URL}?categoria=${encodeURIComponent(categoria)}&valor=${encodeURIComponent(valor)}`;
      if (color) {
        url += `&color=${encodeURIComponent(color)}`;
      }
      const response = await fetch(url, { method: 'POST' });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        Alert.alert('Error', data.error || 'No se pudo guardar el valor');
        return;
      }

      setInputs((prev) => ({ ...prev, [categoria]: '' }));
      await cargarSettings();
      if (categoria === 'roles') {
        await cargarPermisosRoles();
      }
      if (categoria === 'estados_pedido') {
        // Reload page to sync colors across all views
        window.location.reload();
      }
    } catch (e) {
      Alert.alert('Error', `No se pudo guardar: ${e.message}`);
    }
  };

  const eliminarValor = async (id) => {
    const esRol = (settings.roles || []).some((item) => item.id === id);
    const esEstado = (settings.estados_pedido || []).some((item) => item.id === id);
    
    // Validar rol protegido
    const rolItem = (settings.roles || []).find((item) => item.id === id);
    if (rolItem && (rolItem.internal === true || slugifyEstado(String(rolItem?.valor || '')) === 'administrador')) {
      Alert.alert('Acción no permitida', 'No se puede eliminar este rol protegido del sistema.');
      return;
    }

    // Validar si el rol está siendo usado por algún usuario
    if (esRol) {
      try {
        const response = await fetch(`${API_ROL_USAGE_URL}?rol_id=${encodeURIComponent(id)}`);
        const data = await response.json().catch(() => ({ in_use: false, count: 0 }));
        
        if (data.in_use) {
          Alert.alert(
            'No se puede eliminar',
            `Este rol está siendo utilizado por ${data.count} usuario(s). Cambia los usuarios a otro rol antes de eliminar este.`
          );
          return;
        }
      } catch (e) {
        // Si hay error verificando, permitir continuar con la eliminación
        console.log('Error validating rol usage:', e.message);
      }
    }

    // Validar estado protegido o en uso
    if (esEstado) {
      const estadoItem = (settings.estados_pedido || []).find((item) => item.id === id);
      const estadoKey = slugifyEstado(String(estadoItem?.valor || ''));
      const estadosProtegidos = new Set([
        'en-diseno',
      ]);
      
      if (estadosProtegidos.has(estadoKey)) {
        Alert.alert('Acción no permitida', 'No se puede eliminar este estado (protegido del sistema).');
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
        console.log('Error validating estado usage:', e.message);
      }
    }

    try {
      const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 404) {
          await cargarSettings();
        }
        Alert.alert('Error', data.error || 'No se pudo eliminar');
        return;
      }
      await cargarSettings();
      if (esRol) {
        await cargarPermisosRoles();
      }
      if (esEstado) {
        await cargarEstadoRules();
        // Reload page to update all views with correct colors
        window.location.reload();
      }
    } catch (e) {
      Alert.alert('Error', `No se pudo eliminar: ${e.message}`);
    }
  };

  const migrarpedidosYEliminarEstado = async () => {
    if (!estadoAMigrar || !estadoDestinoMigracion) {
      Alert.alert('Error', 'Debes seleccionar un estado destino');
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
        Alert.alert('Error en migración', data.error || 'No se pudo migrar los pedidos');
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
        Alert.alert('Error', deleteData.error || 'No se pudo eliminar el estado');
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
        'Migración completada',
        `Se migraron exitosamente ${migratedCount} pedido(s) a "${estadoDestinoMigracion.valor}" y se eliminó el estado.`,
        [
          {
            text: 'OK',
            onPress: () => window.location.reload(),
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
      Alert.alert('Acción no permitida', 'No se puede editar este rol.');
      return;
    }

    // Activate inline editing state (works on web and native)
    setEditing({ category: categoria, id: item.id, text: String(item?.valor || '') });
  };

  const saveEditedValor = async () => {
    const { category, id, text } = editing;
    if (!category || !id) {
      setEditing({ category: null, id: null, text: '' });
      return;
    }
    const nuevo = String(text || '').trim();
    const lista = settings[category] || [];
    const original = (lista.find((it) => it.id === id) || {}).valor || '';
    if (!nuevo || nuevo.toLowerCase() === String(original || '').toLowerCase()) {
      setEditing({ category: null, id: null, text: '' });
      return;
    }
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor: nuevo, label: nuevo }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        Alert.alert('Error', data.error || 'No se pudo editar el valor');
        return;
      }
      await cargarSettings();
      if (category === 'roles') await cargarPermisosRoles();
      if (category === 'estados_pedido') {
        await cargarEstadoRules();
        // Reload page to sync colors across all views
        window.location.reload();
      }
    } catch (e) {
      Alert.alert('Error', `No se pudo editar: ${e.message}`);
    } finally {
      setEditing({ category: null, id: null, text: '' });
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
        Alert.alert('Error', data.error || 'No se pudieron guardar las reglas');
        return;
      }
      Alert.alert('OK', 'Reglas de estados guardadas');
      await cargarEstadoRules();
    } catch (e) {
      Alert.alert('Error', `No se pudieron guardar las reglas: ${e.message}`);
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
        Alert.alert('Error', data.error || 'No se pudo actualizar el rol activo');
        return;
      }
      setActiveRole((data.active_role || nextRole || 'root').toLowerCase());
      Alert.alert('OK', `Rol activo actualizado: ${data.active_role_label || nextRole}`);
    } catch (e) {
      Alert.alert('Error', `No se pudo actualizar el rol activo: ${e.message}`);
    } finally {
      setGuardandoRole(false);
    }
  };


  const toggleRolePermission = async (roleKey, permissionKey) => {
    if (!puedeEditarRolesPermisos) {
      Alert.alert('Permiso denegado', 'Solo administrador y root pueden editar reglas de permisos');
      return;
    }
    
    // El administrador nunca puede ser desactivado
    if (roleKey === 'administrador') {
      Alert.alert('Permiso protegido', 'El rol administrador no puede perder permisos');
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
        Alert.alert('Error', data.error || 'No se pudieron guardar los permisos');
        // Revertir cambio local
        setRolePermissions(rolePermissions);
        return;
      }
      setRolePermissions(data.permissions || newPermissions);
      
      // Si el usuario quitó el permiso 'manage_roles_permissions' a su propio rol, actualizar estado local
      if (roleKey === currentUserRole && permissionKey === 'manage_roles_permissions' && newValue === false) {
        setPuedeEditarRolesPermisosLocal(false);
      }
    } catch (e) {
      Alert.alert('Error', `No se pudieron guardar los permisos: ${e.message}`);
      // Revertir cambio local
      setRolePermissions(rolePermissions);
    } finally {
      setGuardandoPermisos(false);
    }
  };



  const guardarSessionTimeout = async () => {
    if (!puedeEditarSessionTimeout) {
      Alert.alert('Permiso denegado', 'Solo administrador y root pueden editar este valor');
      return;
    }

    const minutes = Number(sessionTimeoutMinutes);
    if (!Number.isFinite(minutes) || !Number.isInteger(minutes)) {
      Alert.alert('Error', 'El tiempo debe ser un número entero');
      return;
    }
    if (minutes < sessionTimeoutMin || minutes > sessionTimeoutMax) {
      Alert.alert('Error', `El tiempo debe estar entre ${sessionTimeoutMin} y ${sessionTimeoutMax} minutos`);
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
        Alert.alert('Error', data.error || 'No se pudo guardar el tiempo de cierre de sesión');
        return;
      }
      setSessionTimeoutMinutes(String(data.session_timeout_minutes || minutes));
      Alert.alert('OK', 'Tiempo de cierre de sesión actualizado');
    } catch (e) {
      Alert.alert('Error', `No se pudo guardar el tiempo de cierre de sesión: ${e.message}`);
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
      throw new Error(data.error || 'No se pudo reordenar');
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
      Alert.alert('Error', `No se pudo reordenar estados: ${e.message}`);
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
    ]);
    return (
      <View key={categoryKey} style={[styles.section, sectionStyle]}>
        <Text style={styles.sectionTitle}>{categoryTitle}</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.submenuAddInput]}
            value={inputs[categoryKey]}
            onChangeText={(text) => setInputs((prev) => ({ ...prev, [categoryKey]: text }))}
            placeholder={`Añadir ${categoryTitle.toLowerCase()}`}
            placeholderTextColor="#999"
          />
          <TouchableOpacity style={styles.addBtn} onPress={() => agregarValor(categoryKey)}>
            <Text style={styles.addBtnText}>+ Añadir</Text>
          </TouchableOpacity>
        </View>

        {items.length === 0 ? (
          <Text style={styles.muted}>No hay valores configurados</Text>
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
                      onEditSave={saveEditedValor}
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
                  <TouchableOpacity
                    style={[styles.chipDelete, esRolProtegido && styles.chipDeleteDisabled]}
                    disabled={esRolProtegido}
                    onPress={() => eliminarValor(item.id)}
                  >
                    <Text style={styles.chipDeleteText}>✕</Text>
                  </TouchableOpacity>
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
          {showTopUsersPlus && (
            <TouchableOpacity style={[styles.usersBtnPlus, !puedeAdministrarUsuarios && { opacity: 0.45 }]} onPress={() => puedeAdministrarUsuarios && abrirModalNuevoUsuario()} disabled={!puedeAdministrarUsuarios}>
              <Text style={styles.usersBtnPlusText}>+</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.title}>{pageTitle}</Text>
        </View>
      </View>
      <View style={styles.contentWrap}>

      {showUsuariosRoles && (
      <View style={styles.blockContainer}>
        {showBlockTitles && <Text style={styles.groupTitle}>Usuarios</Text>}

        {/* Active-role UI removed: app no longer depends on configurable active_role */}

        <View style={styles.section}>

              <TextInput
                style={styles.usersSearchInput}
                value={busquedaUsuarios}
                onChangeText={setBusquedaUsuarios}
                placeholder="Buscar por nombre, email o rol..."
                placeholderTextColor="#999"
              />

              {usuariosFiltrados.length === 0 ? (
                <Text style={styles.muted}>No hay usuarios para mostrar</Text>
              ) : (
                <>
                  <View style={styles.usersTableWrap}>
                    <View style={styles.usersTableHeader}>
                      <View style={styles.usersColNombre}><Text style={styles.usersHeaderText}>Nombre</Text></View>
                      <View style={styles.usersColEmail}><Text style={styles.usersHeaderText}>Email</Text></View>
                      <View style={styles.usersColRol}><Text style={styles.usersHeaderText}>Rol</Text></View>
                      <View style={styles.usersColAcciones}><Text style={styles.usersHeaderText}>Acciones</Text></View>
                    </View>
                    <ScrollView>
                      {usuariosPaginados.map((usuario, idx) => (
                        <View key={usuario.id} style={[styles.usersTableRow, (idx + (paginaUsuarios - 1) * ITEMS_PER_PAGE) % 2 === 1 && styles.usersTableRowAlt]}>
                          <View style={styles.usersColNombre}><Text style={styles.usersCellText} numberOfLines={1}>{usuario.nombre || '-'}</Text></View>
                          <View style={styles.usersColEmail}><Text style={styles.usersCellText} numberOfLines={1}>{usuario.email || '-'}</Text></View>
                          <View style={styles.usersColRol}><Text style={styles.usersCellText} numberOfLines={1}>{usuario.rol || '-'}</Text></View>
                          <View style={styles.usersColAcciones}>
                            <TouchableOpacity
                              style={[styles.usersActionBtn, !puedeAdministrarUsuarios && { opacity: 0.5 }]}
                              onPress={() => iniciarEdicionUsuario(usuario)}
                              disabled={!puedeAdministrarUsuarios}
                            >
                              <Text style={styles.usersActionBtnText}>Editar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.usersActionBtn, styles.usersActionBtnDelete, (!puedeAdministrarUsuarios || deletingUserId === usuario.id) && { opacity: 0.5 }]}
                              onPress={() => confirmarEliminarUsuario(usuario)}
                              disabled={!puedeAdministrarUsuarios || deletingUserId === usuario.id}
                            >
                              <Text style={styles.usersActionBtnText}>{deletingUserId === usuario.id ? 'Eliminando...' : 'Eliminar'}</Text>
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
                        <Text style={styles.usersPaginationBtnText}>Anterior</Text>
                      </TouchableOpacity>
                      <Text style={styles.usersPaginationInfo}>Página {paginaUsuarios} de {totalPaginasUsuarios}</Text>
                      <TouchableOpacity
                        style={[styles.usersPaginationBtn, paginaUsuarios === totalPaginasUsuarios && styles.usersPaginationBtnDisabled]}
                        onPress={() => setPaginaUsuarios((prev) => Math.min(totalPaginasUsuarios, prev + 1))}
                        disabled={paginaUsuarios === totalPaginasUsuarios}
                      >
                        <Text style={styles.usersPaginationBtnText}>Siguiente</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}

              <Modal visible={modalUsuarioVisible} transparent animationType="fade" onRequestClose={cerrarModalUsuario}>
                <View style={styles.usersModalBackdrop}>
                  <View style={styles.usersModalCard}>
                    <Text style={styles.usersFormTitle}>{usuarioEditandoId ? 'Detalle / Editar usuario' : 'Nuevo usuario'}</Text>

                    <Text style={styles.usersFieldLabel}>Nombre *</Text>
                    <TextInput
                      style={[styles.usersFieldInput, nombreUsuarioVacio && styles.usersFieldInputError]}
                      value={nuevoUsuarioNombre}
                      onChangeText={setNuevoUsuarioNombre}
                      placeholder="Nombre usuario"
                      placeholderTextColor="#999"
                    />
                    {nombreUsuarioVacio && <Text style={styles.errorText}>El nombre es obligatorio</Text>}

                    <Text style={styles.usersFieldLabel}>Email *</Text>
                    <TextInput
                      style={[styles.usersFieldInput, (emailUsuarioVacio || emailUsuarioInvalido) && styles.usersFieldInputError]}
                      value={nuevoUsuarioEmail}
                      onChangeText={setNuevoUsuarioEmail}
                      placeholder="email@dominio.com"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      placeholderTextColor="#999"
                    />
                    {emailUsuarioVacio && <Text style={styles.errorText}>El email es obligatorio</Text>}
                    {emailUsuarioInvalido && <Text style={styles.errorText}>Introduce un email válido (ej: usuario@dominio.com)</Text>}

                    <View style={styles.usersRoleRow}>
                      <Text style={styles.usersRoleLabel}>Rol *</Text>
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

                    <View style={styles.usersFormActions}>
                      <TouchableOpacity style={[styles.usersBtn, styles.usersBtnPrimary]} onPress={guardarUsuario}>
                        <Text style={[styles.usersBtnText, styles.usersBtnPrimaryText]}>{usuarioEditandoId ? 'Guardar cambios' : 'Guardar'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>

        <View>
          {renderCategoria('roles', 'Roles')}
          <Text style={[styles.muted, { marginTop: -6, marginBottom: 10 }]}>Los roles base Administrador y Root están protegidos.</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.rulesHeaderRow}>
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Reglas de permisos por rol</Text>
            <TouchableOpacity style={styles.rulesToggleBtn} onPress={toggleRoleRulesExpanded}>
              <Text style={styles.rulesToggleBtnText}>{roleRulesExpanded ? 'Ocultar' : 'Expandir'}</Text>
            </TouchableOpacity>
          </View>
          {!puedeEditarRolesPermisos && (
            <Text style={[styles.muted, { marginTop: 6, marginBottom: 10 }]}>Permiso denegado: Solo administrador y root pueden editar reglas de permisos.</Text>
          )}
          {!roleRulesExpanded ? (
            <Text style={styles.muted}>Pulsa "Expandir" para ver y editar reglas.</Text>
          ) : (availableRoles || []).length === 0 ? (
            <Text style={styles.muted}>Primero añade roles en "Roles".</Text>
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
          {showBlockTitles && <Text style={styles.groupTitle}>Funcionalidades web</Text>}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Modo de creación</Text>
            <View style={styles.modeRow}>
              <View style={styles.modeButtonsWrap}>
                <TouchableOpacity
                  style={[styles.modeBtn, modoCreacion === 'manual' && styles.modeBtnActive]}
                  onPress={() => actualizarModoCreacion('manual')}
                  disabled={guardandoModoCreacion}
                >
                  <Text style={[styles.modeBtnText, modoCreacion === 'manual' && styles.modeBtnTextActive]}>Manual</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeBtn, modoCreacion === 'automatico' && styles.modeBtnActive]}
                  onPress={() => actualizarModoCreacion('automatico')}
                  disabled={guardandoModoCreacion}
                >
                  <Text style={[styles.modeBtnText, modoCreacion === 'automatico' && styles.modeBtnTextActive]}>Automático</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.rulesToggleBtn} onPress={() => setApiExamplesExpanded((v) => !v)}>
                <Text style={styles.rulesToggleBtnText}>{apiExamplesExpanded ? 'Ocultar ejemplos API' : 'Ver ejemplos API'}</Text>
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

          {renderCategoria('estados_pedido', 'Estados de pedido')}
        </View>
      )}

      {showCreditos && (
      <View style={styles.blockContainer}>
        {showBlockTitles && <Text style={styles.groupTitle}>Créditos</Text>}

        <View style={styles.section}>
          {!puedeAdministrarUsuarios && <Text style={styles.muted}>Tu rol no tiene permiso para gestionar recargas.</Text>}

          <TextInput
            style={styles.usersSearchInput}
            value={busquedaUsuarios}
            onChangeText={setBusquedaUsuarios}
            placeholder="Buscar por nombre, email o rol..."
            placeholderTextColor="#999"
          />

          {usuariosFiltrados.length === 0 ? (
            <Text style={styles.muted}>No hay usuarios para mostrar</Text>
          ) : (
            <>
              <View style={styles.usersTableWrap}>
                <View style={styles.usersTableHeader}>
                  <View style={styles.usersColNombre}><Text style={styles.usersHeaderText}>Nombre</Text></View>
                  <View style={styles.usersColEmail}><Text style={styles.usersHeaderText}>Email</Text></View>
                  <View style={styles.usersColRol}><Text style={styles.usersHeaderText}>Créditos</Text></View>
                  <View style={styles.usersColAcciones}><Text style={styles.usersHeaderText}>Acciones</Text></View>
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
                          <Text style={styles.usersActionBtnText}>Recargar</Text>
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
                    <Text style={styles.usersPaginationBtnText}>Anterior</Text>
                  </TouchableOpacity>
                  <Text style={styles.usersPaginationInfo}>Página {paginaUsuarios} de {totalPaginasUsuarios}</Text>
                  <TouchableOpacity
                    style={[styles.usersPaginationBtn, paginaUsuarios === totalPaginasUsuarios && styles.usersPaginationBtnDisabled]}
                    onPress={() => setPaginaUsuarios((prev) => Math.min(totalPaginasUsuarios, prev + 1))}
                    disabled={paginaUsuarios === totalPaginasUsuarios}
                  >
                    <Text style={styles.usersPaginationBtnText}>Siguiente</Text>
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
        {showBlockTitles && <Text style={styles.groupTitle}>Impresión</Text>}
        {renderCategoria('acabados', 'Acabados / Post impresión')}
        {renderCategoria('tintas_especiales', 'Tintas especiales')}

      </View>
      )}

      <Modal visible={modalRecargaVisible} transparent animationType="fade" onRequestClose={cerrarModalRecarga}>
        <View style={styles.usersModalBackdrop}>
          <View style={styles.usersModalCard}>
            <Text style={styles.usersFormTitle}>Recargar créditos</Text>
            <Text style={styles.muted}>Usuario: {recargaUsuario?.nombre || '-'} ({recargaUsuario?.email || '-'})</Text>

            <Text style={styles.usersFieldLabel}>Créditos *</Text>
            <TextInput
              style={styles.usersFieldInput}
              value={recargaCreditos}
              onChangeText={(text) => setRecargaCreditos(String(text || '').replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              placeholder="Ej: 50"
              placeholderTextColor="#999"
            />

            <Text style={styles.usersFieldLabel}>Método de pago</Text>
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
                <Text style={styles.usersBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.usersBtn, styles.usersBtnPrimary]} onPress={iniciarRecargaCheckout} disabled={procesandoRecarga}>
                <Text style={[styles.usersBtnText, styles.usersBtnPrimaryText]}>{procesandoRecarga ? 'Procesando...' : 'Ir al pago'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={migrarEstadoModal} transparent animationType="fade" onRequestClose={() => setMigrarEstadoModal(false)}>
        <View style={styles.usersModalBackdrop}>
          <View style={styles.usersModalCard}>
            <Text style={styles.usersFormTitle}>Migrar pedidos</Text>
            {estadoAMigrar && (
              <Text style={styles.muted}>
                Se migrarán {estadoAMigrar.count} pedido(s) del estado "{estadoAMigrar.valor}" a otro estado.
              </Text>
            )}

            <Text style={styles.usersFieldLabel}>Selecciona el estado destino *</Text>
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
                <Text style={styles.usersBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.usersBtn, styles.usersBtnPrimary]}
                onPress={migrarpedidosYEliminarEstado}
                disabled={!estadoDestinoMigracion || migrandoEstados}
              >
                <Text style={[styles.usersBtnText, styles.usersBtnPrimaryText]}>
                  {migrandoEstados ? 'Migrando...' : 'Migrar y eliminar'}
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

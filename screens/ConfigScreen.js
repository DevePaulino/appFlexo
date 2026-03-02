import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Platform, Modal, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:8080/api/settings';
const API_MODO_URL = 'http://localhost:8080/api/settings/modo-creacion';
const API_SESSION_TIMEOUT_URL = 'http://localhost:8080/api/settings/session-timeout';
const API_ESTADOS_RULES_URL = 'http://localhost:8080/api/settings/estados-pedido-rules';
const API_SETTINGS_REORDER_URL = 'http://localhost:8080/api/settings/reorder';
const API_ACTIVE_ROLE_URL = 'http://localhost:8080/api/settings/active-role';
const API_ROLE_PERMISSIONS_URL = 'http://localhost:8080/api/settings/roles-permissions';
const API_USERS_URL = 'http://localhost:8080/api/usuarios';
const API_BILLING_CONFIG_URL = 'http://localhost:8080/api/billing/config';
const API_BILLING_CHECKOUT_SESSION_URL = 'http://localhost:8080/api/billing/checkout-session';
const API_BILLING_CHECKOUT_CONFIRM_URL = 'http://localhost:8080/api/billing/checkout-confirm';
const PEDIDO_RULES_EXPANDED_KEY = 'config_pedido_rules_expanded';
const ROLE_RULES_EXPANDED_KEY = 'config_role_rules_expanded';

const ROLE_PERMISSION_CONFIG = [
  { key: 'manage_app_settings', title: 'Editar configuración de la app', hint: 'Permite modificar catálogos y reglas globales.' },
  { key: 'manage_roles_permissions', title: 'Editar roles y permisos', hint: 'Permite cambiar el rol activo y la matriz de permisos.' },
  { key: 'edit_clientes', title: 'Editar clientes', hint: 'Alta, edición y eliminación de clientes.' },
  { key: 'edit_maquinas', title: 'Editar máquinas', hint: 'Alta, edición y eliminación de máquinas.' },
  { key: 'edit_pedidos', title: 'Editar pedidos', hint: 'Creación y cambios de pedidos y trabajos.' },
  { key: 'edit_presupuestos', title: 'Editar presupuestos', hint: 'Creación, edición y aprobación de presupuestos.' },
  { key: 'edit_produccion', title: 'Editar producción', hint: 'Enviar, mover, reordenar y cambiar estado en producción.' },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E9EEF5' },
  header: {
    backgroundColor: '#344054',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    minHeight: 96,
    borderBottomWidth: 1,
    borderBottomColor: '#243447',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
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
    borderRadius: 8,
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
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 34,
    letterSpacing: 0.2,
  },
  blockContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D0D5DD',
    borderRadius: 14,
    padding: 10,
    marginBottom: 14,
  },
  section: {
    backgroundColor: '#F2F4F7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E7EC',
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
    borderColor: '#CCC',
    borderRadius: 10,
    backgroundColor: '#FBFBFD',
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: '#232323',
    fontSize: 14,
  },
  submenuAddInput: {
    flex: 0,
    width: '75%',
    maxWidth: 442,
    minWidth: 234,
  },
  addBtn: {
    backgroundColor: '#4B5563',
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: { color: '#F3F4F6', fontWeight: '700', fontSize: 13 },
  chipList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 999,
    backgroundColor: '#FBFBFD',
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 6,
  },
  chipText: { color: '#232323', fontSize: 13, fontWeight: '600', marginRight: 6 },
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
    color: '#344054',
    fontWeight: '900',
    fontSize: 11,
  },
  chipMove: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EEF2F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  chipMoveDisabled: {
    opacity: 0.35,
  },
  chipMoveText: {
    color: '#344054',
    fontWeight: '900',
    fontSize: 11,
  },
  muted: { color: '#777', fontSize: 12 },
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
    borderColor: '#D0D5DD',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFF',
  },
  modeBtnActive: {
    backgroundColor: '#4B5563',
    borderColor: '#4B5563',
  },
  modeBtnText: {
    color: '#344054',
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
    borderColor: '#EAECF0',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
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
    borderTopColor: '#EEE',
  },
  ruleTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#232323',
    marginBottom: 4,
  },
  ruleHint: {
    fontSize: 12,
    color: '#667085',
    marginBottom: 6,
  },
  selectChip: {
    borderWidth: 1,
    borderColor: '#D0D5DD',
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
    color: '#344054',
    fontSize: 12,
    fontWeight: '700',
  },
  selectChipTextActive: {
    color: '#027A48',
  },
  saveRulesBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#3AB274',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
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
    borderRadius: 12,
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
    backgroundColor: '#344054',
    borderColor: '#344054',
  },
  pedidoRuleChipText: {
    color: '#344054',
    fontSize: 12,
    fontWeight: '700',
  },
  pedidoRuleChipTextActive: {
    color: '#F8FAFC',
  },
  saveRulesBtnPedido: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#344054',
    borderRadius: 12,
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
    borderColor: '#D0D5DD',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  rulesToggleBtnText: {
    color: '#344054',
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
    backgroundColor: '#4B5563',
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  usersBtnPlusText: {
    color: '#F3F4F6',
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 16,
    marginBottom: 10,
  },
  usersFormTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#232323',
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
    borderColor: '#CCC',
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
    color: '#232323',
    marginBottom: 10,
  },
  usersFieldInputError: {
    borderColor: '#D21820',
  },
  usersSearchInput: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 10,
    backgroundColor: '#FBFBFD',
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: '#232323',
    fontSize: 14,
    width: '75%',
    maxWidth: 442,
    minWidth: 234,
    marginBottom: 10,
  },
  usersTableWrap: {
    maxHeight: 280,
    borderWidth: 1,
    borderColor: '#E4E7EC',
    borderRadius: 10,
    overflow: 'hidden',
  },
  usersTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#344054',
    borderBottomWidth: 1.5,
    borderBottomColor: '#243447',
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
    borderTopColor: '#E4E7EC',
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
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '800',
  },
  usersCellText: {
    color: '#232323',
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
    backgroundColor: '#4B5563',
    borderRadius: 8,
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
    color: '#344054',
    fontSize: 12,
    fontWeight: '700',
  },
  usersActionBtn: {
    backgroundColor: '#4B5563',
    borderRadius: 8,
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
    borderRadius: 12,
    alignItems: 'center',
  },
  usersBtnPrimary: {
    backgroundColor: '#4B5563',
  },
  usersBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  usersBtnPrimaryText: {
    color: '#F3F4F6',
  },
  usersModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 16,
  },
  usersModalCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
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

export default function ConfigScreen({ route, currentUser }) {
  const ITEMS_PER_PAGE = 100;
  const [settings, setSettings] = useState({
    roles: [],
    materiales: [],
    acabados: [],
    tintas_especiales: [],
    estados_pedido: [],
  });
  const [inputs, setInputs] = useState({
    roles: '',
    materiales: '',
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
  const [modoCreacion, setModoCreacion] = useState('manual');
  const [apiExamplesExpanded, setApiExamplesExpanded] = useState(false);
  const [estadoRules, setEstadoRules] = useState(ESTADO_RULE_DEFAULTS);
  const [guardandoRules, setGuardandoRules] = useState(false);
  const [pedidoRulesExpanded, setPedidoRulesExpanded] = useState(false);
  const [roleRulesExpanded, setRoleRulesExpanded] = useState(false);
  const [activeRole, setActiveRole] = useState('root');
  const [availableRoles, setAvailableRoles] = useState([]);
  const [rolePermissions, setRolePermissions] = useState({});
  const [guardandoRole, setGuardandoRole] = useState(false);
  const [guardandoPermisos, setGuardandoPermisos] = useState(false);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState('30');
  const [sessionTimeoutMin, setSessionTimeoutMin] = useState(5);
  const [sessionTimeoutMax, setSessionTimeoutMax] = useState(480);
  const [guardandoSessionTimeout, setGuardandoSessionTimeout] = useState(false);
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

  const section = String(route?.params?.section || 'all');
  const showUsuariosRoles = section === 'all' || section === 'usuarios-roles';
  const showCreditos = section === 'all' || section === 'creditos';
  const showFuncionalidades = section === 'all' || section === 'funcionalidades';
  const showImpresion = section === 'all' || section === 'impresion';

  const titleBySection = {
    'usuarios-roles': 'Usuarios',
    creditos: 'Créditos',
    funcionalidades: 'Funcionalidades web',
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
          materiales: data.settings.materiales || [],
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

  const cargarModoCreacion = async () => {
    try {
      const response = await fetch(API_MODO_URL);
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.modo) {
        setModoCreacion(data.modo);
      }
    } catch (e) {
      Alert.alert('Error', `No se pudo cargar el modo de creación: ${e.message}`);
    }
  };

  const cargarEstadoRules = async () => {
    try {
      const response = await fetch(API_ESTADOS_RULES_URL);
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.rules) {
        setEstadoRules((prev) => ({ ...prev, ...data.rules }));
      }
    } catch (e) {
      Alert.alert('Error', `No se pudieron cargar reglas de estados: ${e.message}`);
    }
  };

  const cargarPedidoRulesExpanded = async () => {
    try {
      const [pedidoValue, roleValue] = await Promise.all([
        AsyncStorage.getItem(PEDIDO_RULES_EXPANDED_KEY),
        AsyncStorage.getItem(ROLE_RULES_EXPANDED_KEY),
      ]);
      if (pedidoValue === '1') setPedidoRulesExpanded(true);
      if (pedidoValue === '0') setPedidoRulesExpanded(false);
      if (roleValue === '1') setRoleRulesExpanded(true);
      if (roleValue === '0') setRoleRulesExpanded(false);
    } catch (e) {
    }
  };

  const togglePedidoRulesExpanded = async () => {
    const next = !pedidoRulesExpanded;
    setPedidoRulesExpanded(next);
    try {
      await AsyncStorage.setItem(PEDIDO_RULES_EXPANDED_KEY, next ? '1' : '0');
    } catch (e) {
    }
  };

  const toggleRoleRulesExpanded = async () => {
    const next = !roleRulesExpanded;
    setRoleRulesExpanded(next);
    try {
      await AsyncStorage.setItem(ROLE_RULES_EXPANDED_KEY, next ? '1' : '0');
    } catch (e) {
    }
  };

  const toggleApiExamplesExpanded = () => {
    setApiExamplesExpanded((prev) => !prev);
  };

  const cargarRolActivo = async () => {
    try {
      const response = await fetch(API_ACTIVE_ROLE_URL);
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setActiveRole((data.active_role || 'root').toLowerCase());
        setAvailableRoles(Array.isArray(data.roles) ? data.roles : []);
      }
    } catch (e) {
      Alert.alert('Error', `No se pudo cargar el rol activo: ${e.message}`);
    }
  };

  const cargarPermisosRoles = async () => {
    try {
      const response = await fetch(API_ROLE_PERMISSIONS_URL);
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.permissions) {
        setRolePermissions(data.permissions);
      }
    } catch (e) {
      Alert.alert('Error', `No se pudieron cargar los permisos por rol: ${e.message}`);
    }
  };

  const cargarSessionTimeout = async () => {
    try {
      const response = await fetch(API_SESSION_TIMEOUT_URL);
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        const next = Number(data.session_timeout_minutes);
        const nextMin = Number(data.min);
        const nextMax = Number(data.max);
        if (Number.isFinite(next)) setSessionTimeoutMinutes(String(next));
        if (Number.isFinite(nextMin)) setSessionTimeoutMin(nextMin);
        if (Number.isFinite(nextMax)) setSessionTimeoutMax(nextMax);
      }
    } catch (e) {
      Alert.alert('Error', `No se pudo cargar el tiempo de cierre de sesión: ${e.message}`);
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

  const recargarConfiguracion = () => {
    cargarSettings();
    cargarModoCreacion();
    cargarEstadoRules();
    cargarRolActivo();
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
      recargarConfiguracion();
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
  const puedeAdministrarUsuarios = (() => {
    if (currentUserPermissionValue !== null) return currentUserPermissionValue;
    if (rolePermissionValue !== null) return rolePermissionValue;
    return ['root', 'administrador', 'admin'].includes(currentUserRole);
  })();
  const esRootActivo = String(activeRole || '').toLowerCase() === 'root';
  const puedeEditarSessionTimeout = ['root', 'administrador', 'admin'].includes(currentUserRole);

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

  const mostrarPermisoUsuariosDenegado = () => {
    Alert.alert('Permiso denegado', 'Tu rol no tiene permiso para gestionar usuarios');
  };

  const mostrarPermisoRecargasDenegado = () => {
    Alert.alert('Permiso denegado', 'Tu rol no tiene permiso para gestionar recargas');
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

      if (!response.ok) {
        Alert.alert('Error', data.error || 'No se pudo guardar el usuario');
        return;
      }

      limpiarFormularioUsuario();
      setModalUsuarioVisible(false);
      await cargarUsuarios();
    } catch (e) {
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

  const eliminarUsuario = async (id) => {
    if (!puedeAdministrarUsuarios) {
      mostrarPermisoUsuariosDenegado();
      return;
    }

    try {
      const response = await fetch(`${API_USERS_URL}/${id}`, { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        Alert.alert('Error', data.error || 'No se pudo eliminar el usuario');
        return;
      }

      if (usuarioEditandoId === id) {
        limpiarFormularioUsuario();
      }
      await cargarUsuarios();
    } catch (e) {
      Alert.alert('Error', `No se pudo eliminar el usuario: ${e.message}`);
    }
  };

  const confirmarEliminarUsuario = (usuario) => {
    if (!usuario?.id) return;
    if (!puedeAdministrarUsuarios) {
      mostrarPermisoUsuariosDenegado();
      return;
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

  const actualizarModoCreacion = async (modo) => {
    try {
      const response = await fetch(API_MODO_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modo }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        Alert.alert('Error', data.error || 'No se pudo actualizar el modo');
        return;
      }
      setModoCreacion(modo);
      if (modo === 'automatico') {
        setApiExamplesExpanded(false);
      }
    } catch (e) {
      Alert.alert('Error', `No se pudo actualizar el modo: ${e.message}`);
    }
  };

  const agregarValor = async (categoria) => {
    const valor = (inputs[categoria] || '').trim();
    if (!valor) return;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoria, valor }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        Alert.alert('Error', data.error || 'No se pudo guardar el valor');
        return;
      }

      setInputs((prev) => ({ ...prev, [categoria]: '' }));
      await cargarSettings();
      if (categoria === 'roles') {
        await cargarRolActivo();
        await cargarPermisosRoles();
      }
    } catch (e) {
      Alert.alert('Error', `No se pudo guardar: ${e.message}`);
    }
  };

  const eliminarValor = async (id) => {
    const esRol = (settings.roles || []).some((item) => item.id === id);
    try {
      const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        Alert.alert('Error', data.error || 'No se pudo eliminar');
        return;
      }
      await cargarSettings();
      if (esRol) {
        await cargarRolActivo();
        await cargarPermisosRoles();
      }
    } catch (e) {
      Alert.alert('Error', `No se pudo eliminar: ${e.message}`);
    }
  };

  const editarValor = async (item, categoria) => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof window.prompt !== 'function') {
      Alert.alert('No disponible', 'La edición rápida está disponible en la versión web.');
      return;
    }

    const actual = String(item?.valor || '').trim();
    const nuevoValor = window.prompt('Nuevo nombre:', actual);
    if (nuevoValor === null) return;

    const nuevo = String(nuevoValor || '').trim();
    if (!nuevo || nuevo.toLowerCase() === actual.toLowerCase()) return;

    try {
      const response = await fetch(`${API_URL}/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor: nuevo }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        Alert.alert('Error', data.error || 'No se pudo editar el valor');
        return;
      }

      await cargarSettings();
      if (categoria === 'roles') {
        await cargarRolActivo();
        await cargarPermisosRoles();
      }
      if (categoria === 'estados_pedido') {
        await cargarEstadoRules();
      }
    } catch (e) {
      Alert.alert('Error', `No se pudo editar: ${e.message}`);
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

  const toggleRolePermission = (roleKey, permissionKey) => {
    setRolePermissions((prev) => {
      const currentRolePerms = prev[roleKey] || {};
      return {
        ...prev,
        [roleKey]: {
          ...currentRolePerms,
          [permissionKey]: !currentRolePerms[permissionKey],
        },
      };
    });
  };

  const guardarPermisosRoles = async () => {
    setGuardandoPermisos(true);
    try {
      const response = await fetch(API_ROLE_PERMISSIONS_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: rolePermissions }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        Alert.alert('Error', data.error || 'No se pudieron guardar los permisos');
        return;
      }
      setRolePermissions(data.permissions || rolePermissions);
      Alert.alert('OK', 'Permisos guardados');
    } catch (e) {
      Alert.alert('Error', `No se pudieron guardar los permisos: ${e.message}`);
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

  const moverEstadoPedido = async (itemId, direction) => {
    const items = [...(settings.estados_pedido || [])];
    const currentIndex = items.findIndex((item) => item.id === itemId);
    if (currentIndex < 0) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const reordered = [...items];
    const tmp = reordered[currentIndex];
    reordered[currentIndex] = reordered[targetIndex];
    reordered[targetIndex] = tmp;

    setSettings((prev) => ({ ...prev, estados_pedido: reordered }));

    try {
      await reordenarCategoria('estados_pedido', reordered.map((item) => item.id));
      await cargarSettings();
    } catch (e) {
      await cargarSettings();
      Alert.alert('Error', `No se pudo reordenar estados: ${e.message}`);
    }
  };

  const renderCategoria = (categoryKey, categoryTitle, sectionStyle = null) => {
    const items = settings[categoryKey] || [];
    const rolesProtegidos = new Set(['administrador', 'root']);
    const estadosProtegidos = new Set([
      'diseno',
      'pendiente-de-aprobacion',
      'pendiente-de-cliche',
      'pendiente-de-impresion',
      'pendiente-post-impresion',
      'finalizado',
      'parado',
      'cancelado',
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
        ) : (
          <View style={styles.chipList}>
            {items.map((item, index) => {
              const esEstadoPedido = categoryKey === 'estados_pedido';
              const esRolProtegido = categoryKey === 'roles' && rolesProtegidos.has(slugifyEstado(item?.valor || ''));
              const esEstadoProtegido = esEstadoPedido && estadosProtegidos.has(slugifyEstado(item?.valor || ''));
              const puedeSubir = index > 0;
              const puedeBajar = index < items.length - 1;
              return (
                <View key={item.id} style={styles.chip}>
                  {esEstadoPedido && (
                    <>
                      <TouchableOpacity
                        style={[styles.chipMove, !puedeSubir && styles.chipMoveDisabled]}
                        disabled={!puedeSubir}
                        onPress={() => moverEstadoPedido(item.id, 'up')}
                      >
                        <Text style={styles.chipMoveText}>↑</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.chipMove, !puedeBajar && styles.chipMoveDisabled]}
                        disabled={!puedeBajar}
                        onPress={() => moverEstadoPedido(item.id, 'down')}
                      >
                        <Text style={styles.chipMoveText}>↓</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  <Text style={styles.chipText}>{item.valor}</Text>
                  <TouchableOpacity
                    style={[styles.chipEdit, (esRolProtegido || esEstadoProtegido) && styles.chipEditDisabled]}
                    disabled={esRolProtegido || esEstadoProtegido}
                    onPress={() => editarValor(item, categoryKey)}
                  >
                    <Text style={styles.chipEditText}>✎</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.chipDelete, (esRolProtegido || esEstadoProtegido) && styles.chipDeleteDisabled]}
                    disabled={esRolProtegido || esEstadoProtegido}
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
            <TouchableOpacity style={styles.usersBtnPlus} onPress={abrirModalNuevoUsuario}>
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

        {esRootActivo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rol activo</Text>
            <>
                <View style={styles.chipList}>
                  {(availableRoles || []).map((role) => {
                    const key = String(role?.key || '').toLowerCase();
                    const active = key === activeRole;
                    return (
                      <TouchableOpacity
                        key={key}
                        style={[styles.selectChip, active && styles.selectChipActive]}
                        disabled={guardandoRole}
                        onPress={() => actualizarRolActivo(key)}
                      >
                        <Text style={[styles.selectChipText, active && styles.selectChipTextActive]}>{role?.label || key}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={[styles.muted, { marginTop: 8 }]}>El rol activo aplica las capacidades de edición en toda la app.</Text>
              </>
          </View>
        )}

        <View style={styles.section}>
          {!puedeAdministrarUsuarios && <Text style={styles.muted}>Tu rol no tiene permiso para gestionar usuarios.</Text>}

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
                            <TouchableOpacity style={[styles.usersActionBtn, styles.usersActionBtnDelete, !puedeAdministrarUsuarios && { opacity: 0.5 }]} onPress={() => confirmarEliminarUsuario(usuario)}>
                              <Text style={styles.usersActionBtnText}>Eliminar</Text>
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
                              <Text style={[styles.selectChipText, active && styles.selectChipTextActive]}>{role.label}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    <View style={styles.usersFormActions}>
                      <TouchableOpacity style={styles.usersBtn} onPress={cerrarModalUsuario}>
                        <Text style={styles.usersBtnText}>Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.usersBtn, styles.usersBtnPrimary]} onPress={guardarUsuario}>
                        <Text style={[styles.usersBtnText, styles.usersBtnPrimaryText]}>{usuarioEditandoId ? 'Guardar cambios' : 'Guardar'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>

        </View>

        {renderCategoria('roles', 'Roles')}
        <Text style={[styles.muted, { marginTop: -6, marginBottom: 10 }]}>Los roles base Administrador y Root están protegidos.</Text>

        <View style={styles.section}>
          <View style={styles.rulesHeaderRow}>
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Reglas de permisos por rol</Text>
            <TouchableOpacity style={styles.rulesToggleBtn} onPress={toggleRoleRulesExpanded}>
              <Text style={styles.rulesToggleBtnText}>{roleRulesExpanded ? 'Ocultar' : 'Expandir'}</Text>
            </TouchableOpacity>
          </View>
          {!roleRulesExpanded ? (
            <Text style={styles.muted}>Pulsa “Expandir” para ver y editar reglas.</Text>
          ) : (availableRoles || []).length === 0 ? (
            <Text style={styles.muted}>Primero añade roles en “Roles”.</Text>
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
                        return (
                          <TouchableOpacity
                            key={`${perm.key}-${roleKey}`}
                            style={[styles.selectChip, active && styles.selectChipActive]}
                            onPress={() => toggleRolePermission(roleKey, perm.key)}
                          >
                            <Text style={[styles.selectChipText, active && styles.selectChipTextActive]}>{role?.label || roleKey}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}

              <TouchableOpacity style={styles.saveRulesBtn} onPress={guardarPermisosRoles} disabled={guardandoPermisos}>
                <Text style={styles.saveRulesBtnText}>{guardandoPermisos ? 'Guardando...' : 'Guardar permisos'}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
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

      {showFuncionalidades && (
      <View style={styles.blockContainer}>
      {showBlockTitles && <Text style={styles.groupTitle}>Funcionalidades web</Text>}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Modo de creación</Text>
          <>
              <View style={styles.modeRow}>
                <View style={styles.modeButtonsWrap}>
                  <TouchableOpacity
                    style={[styles.modeBtn, modoCreacion === 'manual' && styles.modeBtnActive]}
                    onPress={() => actualizarModoCreacion('manual')}
                  >
                    <Text style={[styles.modeBtnText, modoCreacion === 'manual' && styles.modeBtnTextActive]}>
                      Manual
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modeBtn, modoCreacion === 'automatico' && styles.modeBtnActive]}
                    onPress={() => actualizarModoCreacion('automatico')}
                  >
                    <Text style={[styles.modeBtnText, modoCreacion === 'automatico' && styles.modeBtnTextActive]}>
                      Automático (API REST)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {modoCreacion === 'automatico' && (
                <>
                  <Text style={[styles.muted, { marginTop: 8 }]}>En Automático se bloquea la creación por botón en Pedidos y Presupuestos.</Text>
                  <Text style={[styles.muted, { marginTop: 6 }]}>Endpoint: POST /api/integracion/documentos</Text>

                  <View style={[styles.rulesHeaderRow, { marginTop: 10 }]}> 
                    <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Ejemplos JSON</Text>
                    <TouchableOpacity style={styles.rulesToggleBtn} onPress={toggleApiExamplesExpanded}>
                      <Text style={styles.rulesToggleBtnText}>{apiExamplesExpanded ? 'Ocultar' : 'Expandir'}</Text>
                    </TouchableOpacity>
                  </View>

                  {!apiExamplesExpanded ? (
                    <Text style={styles.muted}>Pulsa “Expandir” para ver los ejemplos JSON.</Text>
                  ) : (
                    <>
                      <Text style={styles.codeTitle}>Ejemplo Presupuesto</Text>
                      <View style={styles.codeBlock}>
                        <Text style={styles.codeText}>{`{
  "tipo": "presupuesto",
  "cliente": "Cliente Demo",
  "referencia": "REF-EXT-001",
  "nombre": "Trabajo externo",
  "fecha_pedido": "2026-02-25",
  "fecha_entrega": "2026-03-05",
  "numero_presupuesto": "PRE-EXT-001",
  "material": "PET"
}`}</Text>
                      </View>

                      <Text style={styles.codeTitle}>Ejemplo Pedido</Text>
                      <View style={styles.codeBlock}>
                        <Text style={styles.codeText}>{`{
  "tipo": "pedido",
  "cliente": "Cliente Demo",
  "referencia": "REF-EXT-002",
  "nombre": "Pedido externo",
  "numero_pedido": "PED-EXT-002",
  "fecha_pedido": "2026-02-25",
  "fecha_entrega": "2026-03-06",
  "maquina": "Nilpeter FA"
}`}</Text>
                      </View>
                    </>
                  )}
                </>
              )}
            </>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cierre automático de sesión</Text>
          <Text style={[styles.muted, { marginBottom: 8 }]}>Cierra sesión tras inactividad. Rango permitido: {sessionTimeoutMin} - {sessionTimeoutMax} minutos.</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.submenuAddInput, !puedeEditarSessionTimeout && { opacity: 0.6 }]}
              value={sessionTimeoutMinutes}
              onChangeText={(text) => setSessionTimeoutMinutes(String(text || '').replace(/[^0-9]/g, ''))}
              editable={puedeEditarSessionTimeout}
              keyboardType="number-pad"
              placeholder="Minutos"
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={[styles.addBtn, (!puedeEditarSessionTimeout || guardandoSessionTimeout) && { opacity: 0.5 }]}
              onPress={guardarSessionTimeout}
              disabled={!puedeEditarSessionTimeout || guardandoSessionTimeout}
            >
              <Text style={styles.addBtnText}>{guardandoSessionTimeout ? 'Guardando...' : 'Guardar'}</Text>
            </TouchableOpacity>
          </View>
          {!puedeEditarSessionTimeout && <Text style={styles.muted}>Solo administrador y root pueden editar este valor.</Text>}
        </View>

        {renderCategoria('estados_pedido', 'Estados de pedido', styles.pedidoStatesCard)}

        <View style={[styles.section, styles.pedidoRulesCard]}>
          <View style={styles.rulesHeaderRow}>
            <Text style={[styles.pedidoRulesHeader, { marginBottom: 0 }]}>Reglas de estados de pedido</Text>
            <TouchableOpacity style={styles.rulesToggleBtn} onPress={togglePedidoRulesExpanded}>
              <Text style={styles.rulesToggleBtnText}>{pedidoRulesExpanded ? 'Ocultar' : 'Expandir'}</Text>
            </TouchableOpacity>
          </View>
          {estadosPedidoDisponibles.length === 0 ? (
              <Text style={styles.muted}>Primero añade estados en “Estados de pedido”.</Text>
            ) : (
              pedidoRulesExpanded ? (
                <>
                  {ESTADO_RULE_CONFIG.map((rule) => {
                    const selected = estadoRules[rule.key] || [];
                    return (
                      <View key={rule.key} style={styles.pedidoRuleGroup}>
                        <Text style={styles.pedidoRuleTitle}>{rule.title}</Text>
                        <Text style={styles.pedidoRuleHint}>{rule.hint}</Text>
                        <View style={styles.chipList}>
                          {estadosPedidoDisponibles.map((estado) => {
                            const active = selected.includes(estado.value);
                            return (
                              <TouchableOpacity
                                key={`${rule.key}-${estado.value}`}
                                style={[styles.pedidoRuleChip, active && styles.pedidoRuleChipActive]}
                                onPress={() => toggleEstadoRule(rule.key, estado.value)}
                              >
                                <Text style={[styles.pedidoRuleChipText, active && styles.pedidoRuleChipTextActive]}>{estado.label}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })}

                  <TouchableOpacity style={styles.saveRulesBtnPedido} onPress={guardarEstadoRules} disabled={guardandoRules}>
                    <Text style={styles.saveRulesBtnText}>{guardandoRules ? 'Guardando...' : 'Guardar reglas'}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.muted}>Pulsa “Expandir” para ver y editar reglas.</Text>
              )
            )}
        </View>
      </View>
      )}

      {showImpresion && (
      <View style={styles.blockContainer}>
        {showBlockTitles && <Text style={styles.groupTitle}>Impresión</Text>}
        {renderCategoria('materiales', 'Materiales')}
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
      </View>
    </ScrollView>
  );
}

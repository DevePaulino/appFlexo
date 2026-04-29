import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './navigationRef';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Animated, AppState, Easing, Image, Modal, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { PedidosProvider } from './PedidosContext';
import { ModulosProvider, useModulos } from './ModulosContext';
import { SettingsProvider } from './SettingsContext';
import { MaquinasProvider } from './MaquinasContext';
import { ClientesProvider } from './ClientesContext';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { C, paperThemeColors } from './screens/theme';
import { useTranslation } from 'react-i18next';
import { initI18n, changeLanguage, LANGUAGES } from './i18n/index';
import { usePermission } from './screens/usePermission';
import { setTabNavigate } from './tabNavigationStore';

import TrabajoScreen from './screens/TrabajoScreen';
import MachinasScreen from './screens/MachinasScreen';
import PresupuestoScreen from './screens/PresupuestoScreen';
import ClientesScreen from './screens/ClientesScreen';
import TroquelessScreen from './screens/TroquelessScreen';
import ProduccionScreen from './screens/ProduccionScreen';
import NewQuoteScreen from './screens/NewQuoteScreen';
import ConfigScreen from './screens/ConfigScreen';
import MaterialScreen from './screens/MaterialScreen';
import CatalogoMaterialesScreen from './screens/CatalogoMaterialesScreen';
import SettingMenuScreen from './screens/SettingMenuScreen';
import ModulosScreen from './screens/ModulosScreen';
import AuthHomeScreen from './screens/AuthHomeScreen';
import BillingScreen from './screens/BillingScreen';
import FormBuilderScreen from './screens/FormBuilderScreen';
import ProveedoresScreen from './screens/ProveedoresScreen';
import SuperAdminScreen from './screens/SuperAdminScreen';
import ResellerScreen from './screens/ResellerScreen';
import CookieBanner from './components/CookieBanner';
import AiHelpFab from './components/AiHelpFab';

// Inject global web CSS: placeholder text italic + muted color
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const s = document.createElement('style');
  s.textContent = 'input::placeholder, textarea::placeholder { font-style: italic; color: #94A3B8 !important; }';
  document.head.appendChild(s);
}

const API_BASE = 'http://localhost:8080';
const API_SESSION_TIMEOUT_URL = `${API_BASE}/api/settings/session-timeout`;
const AUTH_EXCLUDED_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/mfa/verify',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/billing/config',
];

const Stack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();
const ActivosStack = createNativeStackNavigator();
const Tab = createMaterialTopTabNavigator();
const VALID_TABS = ['Presupuesto', 'Pedidos', 'Producción', 'Activos', 'Setting', 'Admin'];
const VISIBLE_TOP_TABS = ['Presupuesto', 'Pedidos', 'Producción', 'Activos', 'Setting', 'Admin'];
const DROPDOWN_TABS = ['Setting', 'Activos'];

// Tabs que ya no existen como pestaña general → redirigir
const MIGRATED_TO_ACTIVOS = ['Clientes', 'Máquinas', 'Troqueles', 'Materiales'];

const buildSettingsSubmenu = (t) => [
  { key: 'settings-billing', label: t('nav.billing'), target: { type: 'stack', tab: 'Setting', route: 'SettingsBilling' } },
  { key: 'settings-impresion', label: t('nav.impresion'), target: { type: 'stack', tab: 'Setting', route: 'SettingsImpresion' } },
  { key: 'settings-funcionalidades', label: t('nav.pedidosConfig'), target: { type: 'stack', tab: 'Setting', route: 'SettingsFuncionalidades' } },
  { key: 'settings-modulos', label: t('nav.modulos'), target: { type: 'stack', tab: 'Setting', route: 'SettingsModulos' } },
  { key: 'settings-form-builder', label: t('nav.formBuilder'), target: { type: 'stack', tab: 'Setting', route: 'SettingsFormBuilder' } },
  { key: 'settings-usuarios-roles', label: t('nav.usuariosRoles'), target: { type: 'stack', tab: 'Setting', route: 'SettingsUsuariosRoles' } },
];

const buildActivosSubmenu = (t) => [
  { key: 'activos-clientes', label: t('nav.clientes'), target: { type: 'stack', tab: 'Activos', route: 'ActivosClientes' } },
  { key: 'activos-maquinas', label: t('nav.maquinas'), target: { type: 'stack', tab: 'Activos', route: 'ActivosMaquinas' } },
  { key: 'activos-materiales', label: t('nav.materiales'), target: { type: 'stack', tab: 'Activos', route: 'ActivosMateriales' } },
  { key: 'activos-gestion-materiales', label: t('nav.gestionMateriales'), target: { type: 'stack', tab: 'Activos', route: 'ActivosGestionMateriales' } },
  { key: 'activos-troqueles', label: t('nav.troqueles'), target: { type: 'stack', tab: 'Activos', route: 'ActivosTroqueles' } },
  { key: 'activos-proveedores', label: t('nav.proveedores'), target: { type: 'stack', tab: 'Activos', route: 'ActivosProveedores' } },
];

const linking = {
  prefixes: [],
  config: {
    screens: {
      Home: {
        screens: {
          Pedidos: 'pedidos',
          Presupuesto: 'presupuestos',
          Producción: 'produccion',
          Activos: {
            screens: {
              ActivosClientes: 'activos/clientes',
              ActivosMaquinas: 'activos/maquinas',
              ActivosMateriales: 'activos/materiales',
              ActivosGestionMateriales: 'activos/gestion-materiales',
              ActivosTroqueles: 'activos/troqueles',
              ActivosProveedores: 'activos/proveedores',
              ActivosUsuariosRoles: 'activos/usuarios-roles',
            },
          },
          Setting: {
            screens: {
              SettingsMenu: 'setting',
              SettingsBilling: 'setting/billing',
              SettingsFuncionalidades: 'setting/funcionalidades',
              SettingsImpresion: 'setting/impresion',
              SettingsModulos: 'setting/modulos',
              SettingsFormBuilder: 'setting/form-builder',
              SettingsUsuariosRoles: 'setting/usuarios-roles',
            },
          },
        },
      },
      'Nueva Cotización': 'nueva-cotizacion',
    },
  },
};

function normalizeTabName(tabName) {
  if (!tabName) return 'Pedidos';
  if (tabName === 'Settings') return 'Pedidos'; // old route name, no longer exists
  if (MIGRATED_TO_ACTIVOS.includes(tabName)) return 'Activos';
  return VALID_TABS.includes(tabName) ? tabName : 'Pedidos';
}

function EmpresaBranding({ currentUser }) {
  const { t } = useTranslation();
  const canEditByPermission = usePermission('manage_empresa_branding');
  const canEditByRole = currentUser?.rol === 'administrador' || currentUser?.rol === 'root';
  const canEdit = canEditByRole || canEditByPermission;
  const [branding, setBranding] = React.useState({ display_name: '', logo_url: null, use_logo: true });
  const [editOpen, setEditOpen] = React.useState(false);
  const [editName, setEditName] = React.useState('');
  const [editUseLogo, setEditUseLogo] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const [pendingFile, setPendingFile] = React.useState(null);
  const [pendingPreview, setPendingPreview] = React.useState(null);
  const fileInputRef = React.useRef(null);
  const glowAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      if (!document.getElementById('pfp-brand-font')) {
        const link = document.createElement('link');
        link.id = 'pfp-brand-font';
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Exo+2:wght@800;900&display=swap';
        document.head.appendChild(link);
      }
    }
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ])
    ).start();
  }, [glowAnim]);

  const animatedNameColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E0E7FF', '#A5B4FC'],
  });

  const loadBranding = React.useCallback(async () => {
    try {
      const token = global.__MIAPP_ACCESS_TOKEN;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE}/api/empresa/branding`, { headers });
      if (res.ok) {
        const data = await res.json();
        setBranding(data);
      }
    } catch (_) {}
  }, []);

  React.useEffect(() => { loadBranding(); }, [loadBranding]);

  const displayLabel = branding.display_name || currentUser?.empresa_nombre || '';
  const logoUrl = branding.logo_url ? `${API_BASE}${branding.logo_url}` : null;
  // pendingPreview shown optimistically in header until server URL is confirmed
  const headerLogoUrl = (branding.use_logo || pendingPreview) ? (pendingPreview || logoUrl) : null;

  const openEdit = () => {
    setEditName(branding.display_name || currentUser?.empresa_nombre || '');
    setEditUseLogo(branding.use_logo !== false);
    setPendingFile(null);
    setPendingPreview(null);
    setEditOpen(true);
  };

  const closeEdit = () => {
    setPendingFile(null);
    setEditOpen(false);
    // pendingPreview stays until next openEdit to keep header updated optimistically
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    setPendingFile(file);
    setPendingPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setUploading(true);
    const newName = editName.trim();
    try {
      // Upload logo if pending
      let newLogoUrl = branding.logo_url;
      if (pendingFile) {
        const formData = new FormData();
        formData.append('file', pendingFile);
        const uploadRes = await fetch(`${API_BASE}/api/empresa/logo`, { method: 'POST', body: formData });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          newLogoUrl = uploadData.logo_url || newLogoUrl;
        }
      }
      // Optimistic update so state is correct immediately and after refresh
      setBranding(prev => ({ ...prev, display_name: newName, logo_url: newLogoUrl, use_logo: editUseLogo }));
      // Persist name + display mode
      await fetch(`${API_BASE}/api/empresa/branding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: newName, use_logo: editUseLogo }),
      });
      // Confirm with server (also ensures logo_url is in sync)
      await loadBranding();
    } catch (_) {
      await loadBranding();
    }
    setUploading(false);
    closeEdit();
  };

  const removeLogo = async () => {
    setBranding(prev => ({ ...prev, logo_url: null }));
    try {
      await fetch(`${API_BASE}/api/empresa/branding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remove_logo: true }),
      });
    } catch (_) {
      await loadBranding();
    }
  };

  const [wrapHovered, setWrapHovered] = React.useState(false);

  return (
    <View
      style={brandingStyles.wrap}
      onMouseEnter={() => setWrapHovered(true)}
      onMouseLeave={() => setWrapHovered(false)}
    >
      {/* Logo o nombre */}
      {headerLogoUrl ? (
        <View style={brandingStyles.logoCard}>
          <Image source={{ uri: headerLogoUrl }} style={brandingStyles.logo} resizeMode="contain" />
        </View>
      ) : (
        <Animated.Text style={[brandingStyles.name, { color: animatedNameColor }]} numberOfLines={1}>{displayLabel}</Animated.Text>
      )}

      {/* Botón editar — solo visible al hacer hover sobre el área */}
      {canEdit && wrapHovered && (
        <Pressable onPress={openEdit} style={brandingStyles.editBtn}>
          <Text style={brandingStyles.editIcon}>✎</Text>
        </Pressable>
      )}

      {/* Panel de edición */}
      {editOpen && (
        <Modal transparent visible animationType="fade" onRequestClose={closeEdit}>
          <Pressable style={brandingStyles.backdrop} onPress={closeEdit} />
          <View style={brandingStyles.panel}>
            <Text style={brandingStyles.panelTitle}>{t('branding.editTitle')}</Text>

            <Text style={brandingStyles.panelLabel}>{t('branding.nameLabel')}</Text>
            <TextInput
              style={brandingStyles.panelInput}
              value={editName}
              onChangeText={setEditName}
              placeholder={currentUser?.empresa_nombre || ''}
              placeholderTextColor="#94A3B8"
              onSubmitEditing={handleSave}
              returnKeyType="done"
              autoFocus
            />

            {/* Toggle: mostrar nombre o logo */}
            <Text style={brandingStyles.panelLabel}>{t('branding.displayModeLabel')}</Text>
            <View style={brandingStyles.toggleRow}>
              <TouchableOpacity
                style={[brandingStyles.toggleOption, !editUseLogo && brandingStyles.toggleOptionActive]}
                onPress={() => setEditUseLogo(false)}
              >
                <Text style={[brandingStyles.toggleOptionText, !editUseLogo && brandingStyles.toggleOptionTextActive]}>
                  {t('branding.showName')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[brandingStyles.toggleOption, editUseLogo && brandingStyles.toggleOptionActive]}
                onPress={() => setEditUseLogo(true)}
              >
                <Text style={[brandingStyles.toggleOptionText, editUseLogo && brandingStyles.toggleOptionTextActive]}>
                  {t('branding.showLogo')}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={brandingStyles.panelLabel}>{t('branding.logoLabel')}</Text>
            {(pendingPreview || logoUrl) && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Image source={{ uri: pendingPreview || logoUrl }} style={brandingStyles.previewLogo} resizeMode="contain" />
                {!pendingPreview && (
                  <TouchableOpacity onPress={removeLogo}>
                    <Text style={brandingStyles.removeLogoText}>{t('branding.removeLogo')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            {Platform.OS === 'web' ? (
              <>
                <TouchableOpacity
                  style={brandingStyles.uploadBtn}
                  onPress={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Text style={brandingStyles.uploadBtnText}>{t('branding.uploadLogo')}</Text>
                </TouchableOpacity>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                />
              </>
            ) : null}

            <View style={brandingStyles.panelActions}>
              <TouchableOpacity style={brandingStyles.panelBtn} onPress={closeEdit}>
                <Text style={brandingStyles.panelBtnText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[brandingStyles.panelBtn, brandingStyles.panelBtnPrimary]} onPress={handleSave} disabled={uploading}>
                <Text style={[brandingStyles.panelBtnText, brandingStyles.panelBtnPrimaryText]}>{uploading ? t('branding.uploading') : t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const brandingStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    paddingLeft: 12,
    paddingRight: 4,
    gap: 6,
    maxWidth: 220,
    overflow: 'visible',
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginLeft: 4,
  },
  logoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 10,
  },
  logo: {
    height: 34,
    width: 120,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    fontFamily: Platform.OS === 'web' ? '"Exo 2", system-ui, sans-serif' : undefined,
    letterSpacing: 0.8,
    flexShrink: 1,
  },
  editBtn: {
    paddingHorizontal: 3,
    paddingVertical: 2,
  },
  editIcon: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  panel: {
    position: 'absolute',
    top: 48,
    left: 12,
    width: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
  },
  panelTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E1B4B',
    marginBottom: 14,
  },
  panelLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  panelInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    marginBottom: 14,
  },
  previewLogo: {
    height: 32,
    width: 80,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  removeLogoText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 14,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  toggleOptionActive: {
    backgroundColor: '#1E40AF',
  },
  toggleOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  toggleOptionTextActive: {
    color: '#FFFFFF',
  },
  uploadBtn: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
  },
  uploadBtnText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  panelActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  panelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  panelBtnText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  panelBtnPrimary: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  panelBtnPrimaryText: {
    color: '#FFFFFF',
  },
});

function UserProfileBadge({ currentUser, onLogout, onAvatarUpdate }) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [confirmingLogout, setConfirmingLogout] = React.useState(false);
  const [panelPos, setPanelPos] = React.useState({ top: 50, right: 8 });
  const [uploading, setUploading] = React.useState(false);
  const badgeRef = React.useRef(null);
  const fileInputRef = React.useRef(null);

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const getAvatarColors = (name) => {
    const palettes = [
      ['#6366F1', '#8B5CF6'],
      ['#0EA5E9', '#6366F1'],
      ['#10B981', '#0EA5E9'],
      ['#F59E0B', '#EF4444'],
      ['#EC4899', '#8B5CF6'],
      ['#14B8A6', '#6366F1'],
    ];
    if (!name) return palettes[0];
    return palettes[name.charCodeAt(0) % palettes.length];
  };

  const initials = getInitials(currentUser?.nombre);
  const [c1, c2] = getAvatarColors(currentUser?.nombre);
  const avatarBg = Platform.OS === 'web'
    ? { background: `linear-gradient(135deg, ${c1}, ${c2})` }
    : { backgroundColor: c1 };
  const avatarUrl = currentUser?.avatar_url ? `${API_BASE}${currentUser.avatar_url}` : null;

  const handleOpen = () => {
    badgeRef.current?.measureInWindow?.((x, y, w, h) => {
      setPanelPos({ top: y + h + 8, right: 8 });
      setOpen(true);
    });
  };

  const uploadAvatar = async (fileOrUri, filename, mimeType) => {
    if (!currentUser?.id) return;
    setUploading(true);
    try {
      const formData = new FormData();
      if (Platform.OS === 'web') {
        formData.append('file', fileOrUri);
      } else {
        formData.append('file', { uri: fileOrUri, name: filename || 'avatar.jpg', type: mimeType || 'image/jpeg' });
      }
      const token = global.__MIAPP_ACCESS_TOKEN;
      const res = await fetch(`${API_BASE}/api/usuarios/${currentUser.id}/avatar`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.avatar_url) {
        if (typeof onAvatarUpdate === 'function') onAvatarUpdate(data.avatar_url);
      } else {
        Alert.alert('Error', data.error || 'No se pudo subir la imagen');
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handlePickAvatar = async () => {
    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
      return;
    }
    try {
      const { launchImageLibraryAsync } = await import('expo-image-picker');
      const result = await launchImageLibraryAsync({ mediaTypes: 'Images', quality: 0.8 });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        await uploadAvatar(asset.uri, asset.fileName || 'avatar.jpg', asset.mimeType || 'image/jpeg');
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo abrir el selector de imágenes');
    }
  };

  const confirmLogout = () => {
    if (!onLogout) return;
    setConfirmingLogout(true);
  };

  const AvatarCircle = ({ size, textSize, style }) => {
    const circleStyle = { width: size, height: size, borderRadius: size / 2 };
    if (avatarUrl) {
      return (
        <Image
          source={{ uri: avatarUrl }}
          style={[circleStyle, { overflow: 'hidden' }, style]}
          resizeMode="cover"
        />
      );
    }
    return (
      <View style={[circleStyle, avatarBg, { alignItems: 'center', justifyContent: 'center' }, style]}>
        <Text style={{ color: '#FFF', fontSize: textSize, fontWeight: '700', letterSpacing: 0.5 }}>{initials}</Text>
      </View>
    );
  };

  return (
    <>
      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) uploadAvatar(file);
            e.target.value = '';
          }}
        />
      )}

      <Pressable
        ref={badgeRef}
        onPress={handleOpen}
        style={({ pressed }) => [styles.userBadge, pressed && { opacity: 0.8 }]}
      >
        <AvatarCircle
          size={34}
          textSize={13}
          style={styles.userAvatarSmall}
        />
        <View style={styles.userOnlineDot} />
      </Pressable>

      {open && (
        <Modal transparent visible={open} animationType="fade" onRequestClose={() => { setOpen(false); setConfirmingLogout(false); }}>
          <View style={StyleSheet.absoluteFill}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => { setOpen(false); setConfirmingLogout(false); }} />
            <View style={[styles.userPanel, { top: panelPos.top, right: panelPos.right }]}>
              <View style={styles.userPanelHeader}>
                <Pressable onPress={handlePickAvatar} style={styles.userPanelAvatarWrap}>
                  <AvatarCircle size={50} textSize={19} />
                  <View style={styles.userPanelAvatarEdit}>
                    <Text style={styles.userPanelAvatarEditText}>
                      {uploading ? '...' : '✎'}
                    </Text>
                  </View>
                </Pressable>
                <View style={styles.userPanelMeta}>
                  <Text style={styles.userPanelName} numberOfLines={1}>
                    {currentUser?.nombre || 'Usuario'}
                  </Text>
                  {!!currentUser?.email && (
                    <Text style={styles.userPanelEmail} numberOfLines={1}>{currentUser.email}</Text>
                  )}
                  <View style={styles.userPanelRolePill}>
                    <Text style={styles.userPanelRolePillText}>
                      {currentUser?.rol || 'Invitado'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.userPanelDivider} />

              <Pressable
                onPress={handlePickAvatar}
                style={({ pressed }) => [styles.userPanelAction, pressed && { backgroundColor: C.surfaceAlt }]}
              >
                <Text style={styles.userPanelActionText}>
                  {uploading ? t('user.uploading') : t('user.changePhoto')}
                </Text>
              </Pressable>

              <View style={styles.userPanelDivider} />

              {/* ── Selector de idioma ── */}
              <View style={styles.userPanelLangSection}>
                <Text style={styles.userPanelLangTitle}>{t('user.language')}</Text>
                <View style={styles.userPanelLangRow}>
                  {LANGUAGES.map((lang) => {
                    const active = i18n.language === lang.code;
                    return (
                      <Pressable
                        key={lang.code}
                        onPress={async () => {
                          await changeLanguage(lang.code);
                          // Actualizar authUser en AsyncStorage para que el boot state no revierta el idioma
                          try {
                            const stored = await AsyncStorage.getItem('authUser');
                            if (stored) {
                              const u = JSON.parse(stored);
                              await AsyncStorage.setItem('authUser', JSON.stringify({ ...u, idioma: lang.code }));
                            }
                          } catch {}
                          if (currentUser?.id && global.__MIAPP_ACCESS_TOKEN) {
                            try {
                              fetch(`${API_BASE}/api/usuarios/${currentUser.id}/preferencias`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${global.__MIAPP_ACCESS_TOKEN}` },
                                body: JSON.stringify({ idioma: lang.code }),
                              });
                            } catch {}
                          }
                        }}
                        style={[styles.userPanelLangBtn, active && styles.userPanelLangBtnActive]}
                      >
                        <Text style={styles.userPanelLangFlag}>{lang.flag}</Text>
                        <Text style={[styles.userPanelLangCode, active && styles.userPanelLangCodeActive]}>
                          {lang.code.toUpperCase()}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.userPanelDivider} />

              {!!onLogout && !confirmingLogout && (
                <Pressable
                  onPress={confirmLogout}
                  style={({ pressed }) => [styles.userPanelLogout, pressed && { backgroundColor: '#FEF2F2' }]}
                >
                  <Text style={styles.userPanelLogoutText}>{t('user.logout')}</Text>
                </Pressable>
              )}

              {!!onLogout && confirmingLogout && (
                <View style={styles.userPanelLogoutConfirm}>
                  <Text style={styles.userPanelLogoutConfirmText}>{t('user.confirmLogout')}</Text>
                  <View style={styles.userPanelLogoutConfirmActions}>
                    <Pressable
                      onPress={() => setConfirmingLogout(false)}
                      style={({ pressed }) => [styles.userPanelLogoutConfirmBtn, pressed && { opacity: 0.7 }]}
                    >
                      <Text style={styles.userPanelLogoutConfirmCancelText}>{t('user.cancel')}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => { setOpen(false); setConfirmingLogout(false); onLogout(); }}
                      style={({ pressed }) => [styles.userPanelLogoutConfirmBtn, styles.userPanelLogoutConfirmBtnDanger, pressed && { opacity: 0.8 }]}
                    >
                      <Text style={styles.userPanelLogoutConfirmDangerText}>{t('user.logout')}</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

function TopTabsWithSettingsSubmenu({ state, descriptors, navigation, onTabChange, onLogout, currentUser, onAvatarUpdate }) {
  const { t } = useTranslation();
  const [openSubmenu, setOpenSubmenu] = React.useState(null); // null | 'Setting' | 'Activos'
  const { modulos } = useModulos();
  const consumoModuloActivo = modulos.consumo_material === true;
  const produccionModuloActivo = modulos.produccion === true;
  const presupuestosModuloActivo = modulos.presupuestos !== false;
  const troquelModuloActivo = modulos.troqueles !== false;
  const canManageBilling = usePermission('manage_billing');
  const canManageModulos = usePermission('manage_modulos');
  const [submenuPosition, setSubmenuPosition] = React.useState({ top: 44, left: 0 });
  const settingTabRef = React.useRef(null);
  const activosTabRef = React.useRef(null);
  const activeRoute = state.routes[state.index];
  const activeRouteName = activeRoute?.name;
  // Active screen inside the nested stack (e.g. 'ActivosClientes', 'SettingsImpresion')
  const activeNestedRoute = activeRoute?.state?.routes?.[activeRoute.state?.index ?? 0]?.name ?? null;

  React.useEffect(() => {
    setTabNavigate((tab, params) => navigation.navigate(tab, params));
  }, [navigation]);

  const handleTabPress = (route, isFocused) => {
    const isDropdown = DROPDOWN_TABS.includes(route.name);
    if (isDropdown) {
      if (openSubmenu === route.name) {
        setOpenSubmenu(null);
        return;
      }
      const ref = route.name === 'Setting' ? settingTabRef : activosTabRef;
      ref.current?.measureInWindow?.((x, y, w, height) => {
        setSubmenuPosition({ top: y + height, left: x, width: w });
        setOpenSubmenu(route.name);
      });
      return;
    }

    setOpenSubmenu(null);
    if (!isFocused) {
      navigation.navigate(route.name);
    }
    onTabChange(route.name);
  };

  const goToSubmenuTarget = (target) => {
    setOpenSubmenu(null);
    if (target?.type === 'stack' && target.route) {
      const tab = target.tab || 'Setting';
      navigation.navigate(tab, { screen: target.route });
      onTabChange(tab);
    }
  };

  const currentSubmenuItems = openSubmenu === 'Setting'
    ? buildSettingsSubmenu(t).filter(item => {
        if (item.key === 'settings-billing') return canManageBilling;
        if (item.key === 'settings-modulos') return canManageModulos;
        return true;
      })
    : openSubmenu === 'Activos'
      ? buildActivosSubmenu(t).filter(item => {
          if (item.key === 'activos-gestion-materiales') return consumoModuloActivo;
          if (item.key === 'activos-troqueles') return troquelModuloActivo;
          return true;
        })
      : [];

  return (
    <View>
      <View style={styles.tabsBar}>
        <Image
          source={require('./resources/logo-printforge.png')}
          style={styles.navLogoMark}
          resizeMode="contain"
        />
        <EmpresaBranding currentUser={currentUser} />
        <View style={styles.tabsList}>
          {state.routes
            .filter((route) => VISIBLE_TOP_TABS.includes(route.name) && (route.name !== 'Producción' || produccionModuloActivo) && (route.name !== 'Presupuesto' || presupuestosModuloActivo) && (route.name !== 'Admin' || currentUser?.rol === 'root'))
            .map((route) => {
              const options = descriptors[route.key]?.options || {};
              const label = options.tabBarLabel || options.title || route.name;
              const isFocused = activeRouteName === route.name;
              const isDropdown = DROPDOWN_TABS.includes(route.name);
              const isOpen = openSubmenu === route.name;
              const isActive = isFocused || (isDropdown && (isOpen || activeRouteName === route.name));
              const tabRef = route.name === 'Setting' ? settingTabRef : route.name === 'Activos' ? activosTabRef : undefined;

              return (
                <Pressable
                  key={route.key}
                  ref={tabRef}
                  onPress={() => handleTabPress(route, isFocused)}
                  style={({ pressed, hovered }) => [
                    styles.tabBtn,
                    isActive && styles.tabBtnActive,
                    !isActive && (pressed || hovered) && styles.tabBtnHover,
                  ]}
                >
                  <View style={styles.tabInner}>
                    <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{label}</Text>
                    {isDropdown && (
                      <Text style={[styles.tabChevron, isActive && styles.tabChevronActive]}>
                        {isOpen ? '▲' : '▾'}
                      </Text>
                    )}
                  </View>
                  {isActive && <View style={styles.tabActiveIndicator} />}
                </Pressable>
              );
            })}
        </View>
        <UserProfileBadge currentUser={currentUser} onLogout={onLogout} onAvatarUpdate={onAvatarUpdate} />
      </View>

      {openSubmenu && (
        <Modal transparent visible={!!openSubmenu} animationType="none" onRequestClose={() => setOpenSubmenu(null)}>
          <View style={StyleSheet.absoluteFill}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpenSubmenu(null)} />
            <View style={[styles.settingsSubmenuWrap, { top: submenuPosition.top, left: submenuPosition.left, minWidth: submenuPosition.width || 220 }]}>
              {currentSubmenuItems.map((item) => {
                const isItemActive = activeNestedRoute === item.target?.route;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => goToSubmenuTarget(item.target)}
                    style={({ pressed, hovered }) => [
                      styles.settingsSubmenuItem,
                      isItemActive && styles.settingsSubmenuItemActive,
                      !isItemActive && (pressed || hovered) && styles.settingsSubmenuItemHover,
                    ]}
                  >
                    {isItemActive && <View style={styles.settingsSubmenuItemDot} />}
                    <Text style={[styles.settingsSubmenuItemText, isItemActive && styles.settingsSubmenuItemTextActive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

function SettingsNavigator({ currentUser }) {
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <SettingsStack.Screen
        name="SettingsMenu"
        children={(props) => <SettingMenuScreen {...props} currentUser={currentUser} />}
      />
      <SettingsStack.Screen
        name="SettingsBilling"
        children={(props) => <BillingScreen {...props} currentUser={currentUser} />}
      />
      <SettingsStack.Screen
        name="SettingsFuncionalidades"
        initialParams={{ section: 'funcionalidades' }}
        children={(props) => <ConfigScreen {...props} currentUser={currentUser} />}
      />
      <SettingsStack.Screen
        name="SettingsImpresion"
        initialParams={{ section: 'impresion' }}
        children={(props) => <ConfigScreen {...props} currentUser={currentUser} />}
      />
      <SettingsStack.Screen
        name="SettingsModulos"
        children={(props) => <ModulosScreen {...props} />}
      />
      <SettingsStack.Screen
        name="SettingsFormBuilder"
        children={(props) => <FormBuilderScreen {...props} />}
      />
      <SettingsStack.Screen
        name="SettingsUsuariosRoles"
        initialParams={{ section: 'usuarios-roles' }}
        children={(props) => <ConfigScreen {...props} currentUser={currentUser} />}
      />
    </SettingsStack.Navigator>
  );
}

function ActivosNavigator({ currentUser }) {
  return (
    <ActivosStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <ActivosStack.Screen
        name="ActivosClientes"
        children={(props) => <ClientesScreen {...props} currentUser={currentUser} />}
      />
      <ActivosStack.Screen
        name="ActivosMaquinas"
        children={(props) => <MachinasScreen {...props} currentUser={currentUser} />}
      />
      <ActivosStack.Screen
        name="ActivosMateriales"
        children={(props) => <CatalogoMaterialesScreen {...props} currentUser={currentUser} />}
      />
      <ActivosStack.Screen
        name="ActivosGestionMateriales"
        children={(props) => <MaterialScreen {...props} currentUser={currentUser} />}
      />
      <ActivosStack.Screen
        name="ActivosTroqueles"
        children={(props) => <TroquelessScreen {...props} currentUser={currentUser} />}
      />
      <ActivosStack.Screen
        name="ActivosProveedores"
        children={(props) => <ProveedoresScreen {...props} currentUser={currentUser} />}
      />
      <ActivosStack.Screen
        name="ActivosUsuariosRoles"
        initialParams={{ section: 'usuarios-roles' }}
        children={(props) => <ConfigScreen {...props} currentUser={currentUser} />}
      />
    </ActivosStack.Navigator>
  );
}

function HomeTabs({ initialRouteName, onTabChange, onLogout, currentUser, onAvatarUpdate }) {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      id="HomeTabs"
      tabBar={(props) => <TopTabsWithSettingsSubmenu {...props} onTabChange={onTabChange} onLogout={onLogout} currentUser={currentUser} onAvatarUpdate={onAvatarUpdate} />}
      screenOptions={{
        tabBarStyle: { display: 'none' },
        animationEnabled: false,
        swipeEnabled: false,
      }}
      initialRouteName={initialRouteName}
    >
      <Tab.Screen
        name="Presupuesto"
        options={{ tabBarLabel: t('nav.presupuestos') }}
        children={(props) => <PresupuestoScreen {...props} currentUser={currentUser} />}
      />
      <Tab.Screen
        name="Pedidos"
        options={{ tabBarLabel: t('nav.pedidos') }}
        children={(props) => <TrabajoScreen {...props} currentUser={currentUser} />}
      />
      <Tab.Screen
        name="Producción"
        options={{ tabBarLabel: t('nav.produccion') }}
        children={(props) => <ProduccionScreen {...props} currentUser={currentUser} />}
      />
      <Tab.Screen
        name="Activos"
        children={(props) => <ActivosNavigator {...props} currentUser={currentUser} />}
        options={{ tabBarLabel: t('nav.activos') }}
      />
      <Tab.Screen
        name="Setting"
        children={(props) => <SettingsNavigator {...props} currentUser={currentUser} />}
        options={{ tabBarLabel: t('nav.ajustes') }}
      />
      <Tab.Screen
        name="Admin"
        children={(props) => <SuperAdminScreen {...props} currentUser={currentUser} />}
        options={{ tabBarLabel: '⚡ Admin' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1B4B',
    borderBottomWidth: 1,
    borderBottomColor: '#2D2A5E',
    position: 'relative',
    zIndex: 5,
    paddingRight: 8,
    paddingVertical: 5,
    overflow: 'visible',
  },
  navLogoMark: {
    width: 28,
    height: 28,
    tintColor: '#FFFFFF',
    marginLeft: 12,
    marginRight: 4,
    opacity: 0.9,
  },
  tabsList: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    gap: 2,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'transparent',
    borderRadius: 8,
    position: 'relative',
    cursor: 'pointer',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  tabBtnHover: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 8,
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tabActiveIndicator: {
    position: 'absolute',
    bottom: -6,
    left: '20%',
    right: '20%',
    height: 2,
    borderRadius: 2,
    backgroundColor: '#818CF8',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#A5B4FC',
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  tabChevron: {
    fontSize: 9,
    color: '#A5B4FC',
    lineHeight: 13,
  },
  tabChevronActive: {
    color: '#FFFFFF',
  },
  userBadge: {
    position: 'relative',
    marginLeft: 10,
    marginRight: 4,
    marginBottom: 0,
    alignSelf: 'center',
    padding: 2,
  },
  userAvatarSmall: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  userAvatarInitials: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  userOnlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    borderWidth: 1.5,
    borderColor: C.bg,
  },
  userPanel: {
    position: 'absolute',
    width: 248,
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 14,
    overflow: 'hidden',
    zIndex: 100,
  },
  userPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  userPanelAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userPanelAvatarWrap: {
    position: 'relative',
    flexShrink: 0,
  },
  userPanelAvatarEdit: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.action,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: C.surface,
  },
  userPanelAvatarEditText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  userPanelAvatarText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  userPanelAction: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  userPanelActionText: {
    fontSize: 13,
    fontWeight: '500',
    color: C.primary,
  },
  userPanelMeta: {
    flex: 1,
    gap: 2,
  },
  userPanelName: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
  },
  userPanelEmail: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 1,
  },
  userPanelRolePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2F8',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 4,
  },
  userPanelRolePillText: {
    fontSize: 10,
    fontWeight: '600',
    color: C.primary,
    textTransform: 'capitalize',
  },
  userPanelDivider: {
    height: 1,
    backgroundColor: C.border,
  },
  userPanelLogout: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  userPanelLogoutText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  userPanelLogoutConfirm: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  userPanelLogoutConfirmText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textMuted,
    textAlign: 'center',
  },
  userPanelLogoutConfirmActions: {
    flexDirection: 'row',
    gap: 8,
  },
  userPanelLogoutConfirmBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: C.surfaceAlt,
    borderWidth: 1,
    borderColor: C.border,
  },
  userPanelLogoutConfirmBtnDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  userPanelLogoutConfirmCancelText: {
    fontSize: 13,
    fontWeight: '500',
    color: C.text,
  },
  userPanelLogoutConfirmDangerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  userPanelLangSection: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userPanelLangTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  userPanelLangRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  userPanelLangBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F1F5F9',
  },
  userPanelLangBtnActive: {
    borderColor: C.primary,
    backgroundColor: '#EFF6FF',
  },
  userPanelLangFlag: {
    fontSize: 14,
  },
  userPanelLangCode: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  userPanelLangCodeActive: {
    color: C.primary,
  },
  userInfoContainer: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 4,
  },
  userInfoText: {
    fontSize: 12,
    color: C.text,
    fontWeight: '700',
  },
  settingsSubmenuWrap: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E7ED',
    borderRadius: 12,
    paddingVertical: 6,
    minWidth: 220,
    maxWidth: 280,
    zIndex: 50,
    shadowColor: '#0D1117',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 14,
  },
  settingsSubmenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginHorizontal: 6,
    marginVertical: 1,
    borderRadius: 8,
    minHeight: 38,
  },
  settingsSubmenuItemHover: {
    backgroundColor: '#F4F5F9',
  },
  settingsSubmenuItemActive: {
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  settingsSubmenuItemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4F46E5',
    flexShrink: 0,
  },
  settingsSubmenuItemText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '500',
  },
  settingsSubmenuItemTextActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  settingsSubmenuIndicator: {
    marginTop: 6,
    height: 2,
    width: 42,
    borderRadius: 2,
    backgroundColor: C.primary,
  },
});

export default function App() {
  const [initialTab, setInitialTab] = React.useState('Pedidos');
  const [loading, setLoading] = React.useState(true);
  const [i18nReady, setI18nReady] = React.useState(false);

  React.useEffect(() => {
    initI18n().then(() => setI18nReady(true));
  }, []);
  const [authUser, setAuthUser] = React.useState(null);
  const [authSession, setAuthSession] = React.useState(null);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = React.useState(30);
  const lastActivityRef = React.useRef(Date.now());
  const autoLogoutTriggeredRef = React.useRef(false);

  const markActivity = React.useCallback(() => {
    lastActivityRef.current = Date.now();
    autoLogoutTriggeredRef.current = false;
  }, []);

  React.useEffect(() => {
    global.__MIAPP_ACCESS_TOKEN = authSession?.access_token || null;
  }, [authSession]);

  React.useEffect(() => {
    global.__MIAPP_MARK_ACTIVITY = markActivity;
  }, [markActivity]);

  React.useEffect(() => {
    if (authUser) {
      markActivity();
    }
  }, [authUser, markActivity]);

  React.useEffect(() => {
    if (global.__MIAPP_FETCH_PATCHED) return;

    const normalizeHeaders = (headers) => {
      if (!headers) return {};
      if (headers instanceof Headers) {
        const obj = {};
        headers.forEach((value, key) => {
          obj[key] = value;
        });
        return obj;
      }
      if (Array.isArray(headers)) {
        return Object.fromEntries(headers);
      }
      return { ...headers };
    };

    const originalFetch = global.fetch.bind(global);
    global.fetch = async (input, init = {}) => {
      const requestUrl = typeof input === 'string' ? input : (input?.url || '');
      const isApiRequest = requestUrl.startsWith(`${API_BASE}/api/`);
      const isAuthExcluded = AUTH_EXCLUDED_PATHS.some((path) => requestUrl.includes(path));

      if (isApiRequest && typeof global.__MIAPP_MARK_ACTIVITY === 'function') {
        global.__MIAPP_MARK_ACTIVITY();
      }

      if (!isApiRequest || isAuthExcluded) {
        return originalFetch(input, init);
      }

      const accessToken = global.__MIAPP_ACCESS_TOKEN;
      const nextHeaders = normalizeHeaders(init?.headers);
      if (accessToken && !nextHeaders.Authorization && !nextHeaders.authorization) {
        nextHeaders.Authorization = `Bearer ${accessToken}`;
      }

      // Usar el rol seleccionado del desplegable si existe
      try {
        const selectedRole = typeof window !== 'undefined' && window.localStorage 
          ? window.localStorage.getItem('PFP_SELECTED_ROLE')
          : null;
        if (selectedRole && !nextHeaders['X-Role']) {
          nextHeaders['X-Role'] = selectedRole;
        }
      } catch (e) {
        // ignore localStorage errors
      }

      let response = await originalFetch(input, { ...init, headers: nextHeaders });
      if (response.status !== 401) {
        return response;
      }

      try {
        if (!global.__MIAPP_REFRESH_PROMISE) {
          global.__MIAPP_REFRESH_PROMISE = (async () => {
            const rawSession = await AsyncStorage.getItem('authSession');
            const session = rawSession ? JSON.parse(rawSession) : null;
            const refreshToken = String(session?.refresh_token || '').trim();
            if (!refreshToken) {
              return null;
            }

            const refreshResponse = await originalFetch(`${API_BASE}/api/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh_token: refreshToken }),
            });
            const refreshData = await refreshResponse.json().catch(() => ({}));

            if (!refreshResponse.ok) {
              await AsyncStorage.removeItem('authSession');
              await AsyncStorage.removeItem('authUser');
              global.__MIAPP_ACCESS_TOKEN = null;
              setAuthSession(null);
              setAuthUser(null);
              return null;
            }

            const nextSession = {
              usuario: refreshData.usuario,
              access_token: refreshData.access_token,
              refresh_token: refreshData.refresh_token,
              access_expires_at: refreshData.access_expires_at,
            };

            await AsyncStorage.setItem('authSession', JSON.stringify(nextSession));
            await AsyncStorage.setItem('authUser', JSON.stringify(refreshData.usuario || null));

            global.__MIAPP_ACCESS_TOKEN = nextSession.access_token || null;
            setAuthSession(nextSession);
            setAuthUser(refreshData.usuario || null);
            return nextSession;
          })();
        }

        const refreshedSession = await global.__MIAPP_REFRESH_PROMISE;
        if (!refreshedSession?.access_token) {
          return response;
        }

        const retryHeaders = normalizeHeaders(init?.headers);
        retryHeaders.Authorization = `Bearer ${refreshedSession.access_token}`;
        delete retryHeaders.authorization;

        // Usar el rol seleccionado del desplegable también en retry
        try {
          const selectedRole = typeof window !== 'undefined' && window.localStorage 
            ? window.localStorage.getItem('PFP_SELECTED_ROLE')
            : null;
          if (selectedRole && !retryHeaders['X-Role']) {
            retryHeaders['X-Role'] = selectedRole;
          }
        } catch (e) {
          // ignore localStorage errors
        }

        response = await originalFetch(input, { ...init, headers: retryHeaders });
        return response;
      } finally {
        global.__MIAPP_REFRESH_PROMISE = null;
      }
    };

    global.__MIAPP_FETCH_PATCHED = true;
  }, []);

  React.useEffect(() => {
    const loadBootState = async () => {
      try {
        const [lastTab, rawAuthUser, rawAuthSession] = await Promise.all([
          AsyncStorage.getItem('lastTab'),
          AsyncStorage.getItem('authUser'),
          AsyncStorage.getItem('authSession'),
        ]);
        const normalized = normalizeTabName(lastTab);
        setInitialTab(normalized);

        let nextUser = rawAuthUser ? JSON.parse(rawAuthUser) : null;
        let nextSession = rawAuthSession ? JSON.parse(rawAuthSession) : null;

        if (nextSession?.refresh_token) {
          const accessExpiresAt = Number(nextSession.access_expires_at || 0);
          const now = Math.floor(Date.now() / 1000);
          const accessStillValid = accessExpiresAt > now + 30;

          if (!accessStillValid) {
            try {
              const response = await fetch('http://localhost:8080/api/auth/refresh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: nextSession.refresh_token }),
              });
              const data = await response.json().catch(() => ({}));
              if (response.ok) {
                nextSession = {
                  usuario: data.usuario,
                  access_token: data.access_token,
                  refresh_token: data.refresh_token,
                  access_expires_at: data.access_expires_at,
                };
                nextUser = data.usuario;
                await AsyncStorage.setItem('authSession', JSON.stringify(nextSession));
                await AsyncStorage.setItem('authUser', JSON.stringify(nextUser));
              } else {
                nextSession = null;
                nextUser = null;
                await AsyncStorage.removeItem('authSession');
                await AsyncStorage.removeItem('authUser');
              }
            } catch {
              nextSession = null;
              nextUser = null;
              await AsyncStorage.removeItem('authSession');
              await AsyncStorage.removeItem('authUser');
            }
          }
        }

        // Si el token sigue válido (sin refresh), authUser en AsyncStorage puede tener
        // un rol simulado de una sesión anterior. Recuperar el rol real desde:
        // 1) nextSession.usuario.rol  (guardado al hacer refresh o login reciente)
        // 2) payload del JWT           (decodificado sin verificar firma, solo lectura)
        if (nextSession && nextUser) {
          let realRolFromSession = nextSession?.usuario?.rol || null;
          if (!realRolFromSession && nextSession?.access_token) {
            try {
              const parts = String(nextSession.access_token).split('.');
              if (parts.length === 3) {
                const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
                realRolFromSession = payload?.rol || payload?.role || null;
              }
            } catch (e) { /* JWT malformado, ignorar */ }
          }
          if (!realRolFromSession && typeof window !== 'undefined') {
            realRolFromSession = window.localStorage?.getItem('PFP_REAL_ROLE') || null;
          }
          if (realRolFromSession) {
            nextUser = { ...nextUser, rol: realRolFromSession };
            try { await AsyncStorage.setItem('authUser', JSON.stringify(nextUser)); } catch (e) {}
          }
        }

        // Al arrancar, sincronizar PFP_SELECTED_ROLE y PFP_EMPRESA_ID al usuario real autenticado
        // (no aplicar el rol simulado guardado — la simulación es solo de sesión)
        try {
          const realRole = String(nextUser?.rol || nextUser?.role || '').trim();
          const realEmpresaId = String(nextUser?.empresa_id || '').trim();
          if (typeof window !== 'undefined' && window.localStorage) {
            if (realRole) window.localStorage.setItem('PFP_SELECTED_ROLE', realRole);
            if (realEmpresaId) window.localStorage.setItem('PFP_EMPRESA_ID', realEmpresaId);
          }
        } catch (e) {
          // ignore localStorage errors
        }

        global.__MIAPP_ACCESS_TOKEN = nextSession?.access_token || null;
        setAuthSession(nextSession || null);
        setAuthUser(nextUser || null);
        // Restaurar idioma guardado en el servidor (tiene prioridad sobre AsyncStorage)
        if (nextUser?.idioma) {
          try { await changeLanguage(nextUser.idioma); } catch {}
        }
      } catch (error) {
        console.error('Error loading boot state:', error);
      } finally {
        setLoading(false);
      }
    };
    loadBootState();
  }, []);

  const handleTabChange = async (tabName) => {
    markActivity();
    try {
      await AsyncStorage.setItem('lastTab', normalizeTabName(tabName));
    } catch (error) {
      console.error('Error saving tab:', error);
    }
  };

  const handleAuthSuccess = async (session) => {
    const usuario = session?.usuario || null;
    // Establecer token ANTES del render para evitar race condition con useFocusEffect
    global.__MIAPP_ACCESS_TOKEN = session?.access_token || null;
    setInitialTab('Pedidos'); // Siempre redirigir a Pedidos tras login
    setAuthUser(usuario);
    setAuthSession(session || null);
    markActivity();
    // Restaurar idioma guardado en el servidor
    if (usuario?.idioma) {
      try { await changeLanguage(usuario.idioma); } catch {}
    }
    try {
      if (usuario) {
        await AsyncStorage.setItem('authUser', JSON.stringify(usuario));
        await AsyncStorage.setItem('authSession', JSON.stringify(session));
      } else {
        await AsyncStorage.removeItem('authUser');
        await AsyncStorage.removeItem('authSession');
      }
    } catch (error) {
      console.error('Error saving auth user:', error);
    }
    try {
      const realRol = String(usuario?.rol || '').trim();
      const realEmpresaId = String(usuario?.empresa_id || '').trim();
      if (typeof window !== 'undefined' && window.localStorage) {
        if (realRol) {
          window.localStorage.setItem('PFP_REAL_ROLE', realRol);
          window.localStorage.setItem('PFP_SELECTED_ROLE', realRol);
        }
        if (realEmpresaId) window.localStorage.setItem('PFP_EMPRESA_ID', realEmpresaId);
      }
    } catch (e) { /* ignore */ }
  };


  const handleAvatarUpdate = React.useCallback(async (avatarUrl) => {
    try {
      const updatedUser = { ...authUser, avatar_url: avatarUrl };
      setAuthUser(updatedUser);
      const updatedSession = authSession ? { ...authSession, usuario: { ...authSession.usuario, avatar_url: avatarUrl } } : null;
      if (updatedSession) setAuthSession(updatedSession);
      await AsyncStorage.setItem('authUser', JSON.stringify(updatedUser));
      if (updatedSession) await AsyncStorage.setItem('authSession', JSON.stringify(updatedSession));
    } catch (e) { /* ignore */ }
  }, [authUser, authSession]);

  const handleLogout = React.useCallback(async (options = {}) => {
    const timeoutExpired = !!options.timeoutExpired;
    try {
      if (authSession?.refresh_token || authSession?.access_token) {
        await fetch('http://localhost:8080/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            refresh_token: authSession?.refresh_token,
            access_token: authSession?.access_token,
          }),
        });
      }
    } catch {
    }

    setAuthUser(null);
    setAuthSession(null);
    autoLogoutTriggeredRef.current = false;
    try {
      await AsyncStorage.removeItem('authUser');
      await AsyncStorage.removeItem('authSession');
    } catch (error) {
      console.error('Error clearing auth user:', error);
    }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('PFP_REAL_ROLE');
        window.localStorage.removeItem('PFP_SELECTED_ROLE');
        window.localStorage.removeItem('PFP_EMPRESA_ID');
      }
    } catch (e) { /* ignore */ }
    if (timeoutExpired) {
      Alert.alert('Sesión cerrada', 'Tu sesión se cerró por inactividad.');
    }
  }, [authSession]);

  React.useEffect(() => {
    if (!authUser) return;
    let cancelled = false;

    const loadSessionTimeout = async () => {
      // Per-user timeout takes priority over company-wide setting
      const perUser = Number(authUser?.sesion_timeout_minutos);
      if (Number.isFinite(perUser) && perUser > 0) {
        if (!cancelled) setSessionTimeoutMinutes(perUser);
        return;
      }
      try {
        const response = await fetch(API_SESSION_TIMEOUT_URL);
        const data = await response.json().catch(() => ({}));
        if (!cancelled && response.ok) {
          const next = Number(data.session_timeout_minutes);
          if (Number.isFinite(next) && next > 0) {
            setSessionTimeoutMinutes(next);
          }
        }
      } catch {
      }
    };

    loadSessionTimeout();
    return () => {
      cancelled = true;
    };
  }, [authUser]);

  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        markActivity();
      }
    });
    return () => subscription.remove();
  }, [markActivity]);

  React.useEffect(() => {
    if (!authUser) return undefined;

    const timeoutMs = Math.max(1, Number(sessionTimeoutMinutes || 30)) * 60 * 1000;
    const intervalId = setInterval(() => {
      if (autoLogoutTriggeredRef.current) return;
      const inactiveMs = Date.now() - lastActivityRef.current;
      if (inactiveMs >= timeoutMs) {
        autoLogoutTriggeredRef.current = true;
        handleLogout({ timeoutExpired: true });
      }
    }, 15000);

    return () => clearInterval(intervalId);
  }, [authUser, sessionTimeoutMinutes, handleLogout]);

  if (loading || !i18nReady) {
    return null;
  }

  const paperTheme = { ...MD3LightTheme, colors: { ...MD3LightTheme.colors, ...paperThemeColors } };

  return (
    <PaperProvider theme={paperTheme}>
    <ModulosProvider authUser={authUser}>
    <SettingsProvider authUser={authUser}>
    <MaquinasProvider authUser={authUser}>
    <ClientesProvider authUser={authUser}>
    <PedidosProvider>
      {/* ActiveRoleSwitcher removed: left-side control restored in ConfigScreen */}
      <NavigationContainer ref={navigationRef} linking={linking}>
        <Stack.Navigator screenOptions={{ animation: 'none' }}>
          {!authUser ? (
            <Stack.Screen
              name="Auth"
              children={() => <AuthHomeScreen onAuthSuccess={handleAuthSuccess} />}
              options={{ headerShown: false }}
            />
          ) : authUser.billing_model === 'revendedor' ? (
            <Stack.Screen
              name="Revendedor"
              children={() => <ResellerScreen currentUser={authUser} onLogout={handleLogout} />}
              options={{ headerShown: false }}
            />
          ) : (
            <>
              <Stack.Screen
                name="Home"
                children={(props) => <HomeTabs {...props} initialRouteName={initialTab} onTabChange={handleTabChange} onLogout={handleLogout} currentUser={authUser} onAvatarUpdate={handleAvatarUpdate} />}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Nueva Cotización"
                component={NewQuoteScreen}
                options={{ headerShown: true }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      <CookieBanner />
      {authUser && !['revendedor'].includes(authUser.billing_model) && <AiHelpFab />}
    </PedidosProvider>
    </ClientesProvider>
    </MaquinasProvider>
    </SettingsProvider>
    </ModulosProvider>
    </PaperProvider>
  );
}

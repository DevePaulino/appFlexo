import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, AppState, Image, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { PedidosProvider } from './PedidosContext';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { C, paperThemeColors } from './screens/theme';

import TrabajoScreen from './screens/TrabajoScreen';
import MachinasScreen from './screens/MachinasScreen';
import PresupuestoScreen from './screens/PresupuestoScreen';
import ClientesScreen from './screens/ClientesScreen';
import TroquelessScreen from './screens/TroquelessScreen';
import ProduccionScreen from './screens/ProduccionScreen';
import NewQuoteScreen from './screens/NewQuoteScreen';
import ConfigScreen from './screens/ConfigScreen';
import MaterialScreen from './screens/MaterialScreen';
import SettingMenuScreen from './screens/SettingMenuScreen';
import AuthHomeScreen from './screens/AuthHomeScreen';

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
const Tab = createMaterialTopTabNavigator();
const VALID_TABS = ['Pedidos', 'Presupuesto', 'Producción', 'Clientes', 'Setting'];
const VISIBLE_TOP_TABS = ['Pedidos', 'Presupuesto', 'Producción', 'Clientes', 'Setting'];

// Tabs que existían antes y ahora viven en Ajustes → redirigir a Setting
const MIGRATED_TABS = ['Máquinas', 'Troqueles', 'Materiales'];

const SETTINGS_SUBMENU = [
  { key: 'settings-usuarios-roles', label: 'Usuarios y roles', target: { type: 'stack', route: 'SettingsUsuariosRoles' } },
  { key: 'settings-impresion', label: 'Impresión', target: { type: 'stack', route: 'SettingsImpresion' } },
  { key: 'settings-maquinas', label: 'Máquinas', target: { type: 'stack', route: 'SettingsMaquinas' } },
  { key: 'settings-troqueles', label: 'Troqueles', target: { type: 'stack', route: 'SettingsTroqueles' } },
  { key: 'settings-materiales', label: 'Materiales', target: { type: 'stack', route: 'SettingsMateriales' } },
  { key: 'settings-funcionalidades', label: 'Funcionalidades web', target: { type: 'stack', route: 'SettingsFuncionalidades' } },
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
          Clientes: 'clientes',
          Setting: {
            screens: {
              SettingsMenu: 'setting',
              SettingsUsuariosRoles: 'setting/usuarios-roles',
              SettingsFuncionalidades: 'setting/funcionalidades',
              SettingsImpresion: 'setting/impresion',
              SettingsMaquinas: 'setting/maquinas',
              SettingsTroqueles: 'setting/troqueles',
              SettingsMateriales: 'setting/materiales',
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
  if (MIGRATED_TABS.includes(tabName)) return 'Setting';
  return VALID_TABS.includes(tabName) ? tabName : 'Pedidos';
}

function UserProfileBadge({ currentUser, onLogout, onAvatarUpdate }) {
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
                  {uploading ? 'Subiendo...' : 'Cambiar foto de perfil'}
                </Text>
              </Pressable>

              <View style={styles.userPanelDivider} />

              {!!onLogout && !confirmingLogout && (
                <Pressable
                  onPress={confirmLogout}
                  style={({ pressed }) => [styles.userPanelLogout, pressed && { backgroundColor: '#FEF2F2' }]}
                >
                  <Text style={styles.userPanelLogoutText}>Cerrar sesión</Text>
                </Pressable>
              )}

              {!!onLogout && confirmingLogout && (
                <View style={styles.userPanelLogoutConfirm}>
                  <Text style={styles.userPanelLogoutConfirmText}>¿Cerrar la sesión?</Text>
                  <View style={styles.userPanelLogoutConfirmActions}>
                    <Pressable
                      onPress={() => setConfirmingLogout(false)}
                      style={({ pressed }) => [styles.userPanelLogoutConfirmBtn, pressed && { opacity: 0.7 }]}
                    >
                      <Text style={styles.userPanelLogoutConfirmCancelText}>Cancelar</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => { setOpen(false); setConfirmingLogout(false); onLogout(); }}
                      style={({ pressed }) => [styles.userPanelLogoutConfirmBtn, styles.userPanelLogoutConfirmBtnDanger, pressed && { opacity: 0.8 }]}
                    >
                      <Text style={styles.userPanelLogoutConfirmDangerText}>Cerrar sesión</Text>
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
  const [submenuOpen, setSubmenuOpen] = React.useState(false);
  const [submenuPosition, setSubmenuPosition] = React.useState({ top: 44, left: 0 });
  const settingTabRef = React.useRef(null);
  const activeRoute = state.routes[state.index];
  const activeRouteName = activeRoute?.name;
  const activeSettingSection = activeRouteName === 'Setting'
    ? String(activeRoute?.params?.section || 'usuarios-roles')
    : null;

  const handleTabPress = (route, isFocused) => {
    const isSetting = route.name === 'Setting';
    if (isSetting) {
      if (submenuOpen) {
        setSubmenuOpen(false);
        return;
      }
      settingTabRef.current?.measureInWindow?.((x, y, width, height) => {
        setSubmenuPosition({ top: y + height, left: x });
        setSubmenuOpen(true);
      });
      return;
    }

    setSubmenuOpen(false);
    if (!isFocused) {
      navigation.navigate(route.name);
    }
    onTabChange(route.name);
  };

  const goToSubmenuTarget = (target) => {
    setSubmenuOpen(false);
    if (target?.type === 'stack' && target.route) {
      navigation.navigate('Setting', { screen: target.route });
      onTabChange('Setting');
    }
  };

  const isSubmenuTargetActive = (_target) => false;

  return (
    <View>
      <View style={styles.tabsBar}>
        <View style={styles.tabsList}>
          {state.routes
            .filter((route) => VISIBLE_TOP_TABS.includes(route.name))
            .map((route) => {
          const options = descriptors[route.key]?.options || {};
          const label = options.tabBarLabel || options.title || route.name;
          const isFocused = activeRouteName === route.name;
          const isSetting = route.name === 'Setting';
          const settingContext = activeRouteName === 'Setting';
          const isActive = isFocused || (isSetting && (submenuOpen || settingContext));

          return (
            <Pressable
              key={route.key}
              ref={isSetting ? settingTabRef : undefined}
              onPress={() => handleTabPress(route, isFocused)}
              style={[styles.tabBtn, isActive && styles.tabBtnActive]}
            >
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{label}</Text>
            </Pressable>
          );
          })}
        </View>
        <UserProfileBadge currentUser={currentUser} onLogout={onLogout} onAvatarUpdate={onAvatarUpdate} />
      </View>

      {submenuOpen && (
        <Modal transparent visible={submenuOpen} animationType="none" onRequestClose={() => setSubmenuOpen(false)}>
          <View style={StyleSheet.absoluteFill}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setSubmenuOpen(false)} />
            <View
              style={[
                styles.settingsSubmenuWrap,
                {
                  top: submenuPosition.top,
                  left: submenuPosition.left,
                },
              ]}
            >
              {SETTINGS_SUBMENU.map((item) => (
                <Pressable
                  key={item.key}
                  onPress={() => goToSubmenuTarget(item.target)}
                  style={[styles.settingsSubmenuItem, isSubmenuTargetActive(item.target) && styles.settingsSubmenuItemActive]}
                >
                  <Text style={[styles.settingsSubmenuItemText, isSubmenuTargetActive(item.target) && styles.settingsSubmenuItemTextActive]}>{item.label}</Text>
                </Pressable>
              ))}
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
        name="SettingsUsuariosRoles"
        initialParams={{ section: 'usuarios-roles' }}
        children={(props) => <ConfigScreen {...props} currentUser={currentUser} />}
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
        name="SettingsMaquinas"
        children={(props) => <MachinasScreen {...props} currentUser={currentUser} />}
      />
      <SettingsStack.Screen
        name="SettingsTroqueles"
        children={(props) => <TroquelessScreen {...props} currentUser={currentUser} />}
      />
      <SettingsStack.Screen
        name="SettingsMateriales"
        children={(props) => <MaterialScreen {...props} currentUser={currentUser} />}
      />
    </SettingsStack.Navigator>
  );
}

function HomeTabs({ initialRouteName, onTabChange, onLogout, currentUser, onAvatarUpdate }) {
  return (
    <Tab.Navigator
      tabBar={(props) => <TopTabsWithSettingsSubmenu {...props} onTabChange={onTabChange} onLogout={onLogout} currentUser={currentUser} onAvatarUpdate={onAvatarUpdate} />}
      screenOptions={{
        tabBarStyle: { display: 'none' },
        animationEnabled: false,
        swipeEnabled: false,
      }}
      initialRouteName={initialRouteName}
    >
      <Tab.Screen
        name="Pedidos"
        options={{ tabBarLabel: 'Pedidos' }}
        children={(props) => <TrabajoScreen {...props} currentUser={currentUser} />}
      />
      <Tab.Screen
        name="Presupuesto"
        options={{ tabBarLabel: 'Presupuestos' }}
        children={(props) => <PresupuestoScreen {...props} currentUser={currentUser} />}
      />
      <Tab.Screen
        name="Producción"
        options={{ tabBarLabel: 'Producción' }}
        children={(props) => <ProduccionScreen {...props} currentUser={currentUser} />}
      />
      <Tab.Screen
        name="Clientes"
        options={{ tabBarLabel: 'Clientes' }}
        children={(props) => <ClientesScreen {...props} currentUser={currentUser} />}
      />
      <Tab.Screen
        name="Setting"
        children={(props) => <SettingsNavigator {...props} currentUser={currentUser} />}
        options={{ tabBarLabel: 'Ajustes' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabsBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    position: 'relative',
    zIndex: 5,
    paddingRight: 8,
    paddingTop: 8,
  },
  tabsList: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    gap: 2,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 14,
    minHeight: 38,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: '#DDE3EC',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopColor: '#C8D0DC',
    borderLeftColor: '#C8D0DC',
    borderRightColor: '#C8D0DC',
  },
  tabBtnActive: {
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: C.border,
    borderLeftColor: C.border,
    borderRightColor: C.border,
    borderBottomColor: C.surface,
    marginBottom: -1,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  tabLabelActive: {
    color: C.text,
    fontWeight: '700',
  },
  userBadge: {
    position: 'relative',
    marginLeft: 10,
    marginRight: 4,
    marginBottom: 6,
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
    borderColor: 'rgba(255,255,255,0.9)',
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
    backgroundColor: '#F1F5F9',
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
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderTopWidth: 1,
    borderRadius: 10,
    paddingVertical: 4,
    minWidth: 210,
    maxWidth: 260,
    zIndex: 50,
    elevation: 8,
  },
  settingsSubmenuItem: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: 0,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsSubmenuItemActive: {
    backgroundColor: '#1E293B',
    borderRadius: 6,
  },
  settingsSubmenuItemText: {
    color: C.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  settingsSubmenuItemTextActive: {
    color: '#F8FAFC',
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
    setAuthUser(usuario);
    setAuthSession(session || null);
    markActivity();
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

  if (loading) {
    return null; // o un loading screen
  }

  const paperTheme = { ...MD3LightTheme, colors: { ...MD3LightTheme.colors, ...paperThemeColors } };

  return (
    <PaperProvider theme={paperTheme}>
    <PedidosProvider>
      {/* ActiveRoleSwitcher removed: left-side control restored in ConfigScreen */}
      <NavigationContainer linking={linking}>
        <Stack.Navigator screenOptions={{ animation: 'none' }}>
          {!authUser ? (
            <Stack.Screen
              name="Auth"
              children={() => <AuthHomeScreen onAuthSuccess={handleAuthSuccess} />}
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
    </PedidosProvider>
    </PaperProvider>
  );
}

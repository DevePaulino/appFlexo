import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, AppState, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { PedidosProvider } from './PedidosContext';

import TrabajoScreen from './screens/TrabajoScreen';
import MachinasScreen from './screens/MachinasScreen';
import PresupuestoScreen from './screens/PresupuestoScreen';
import ClientesScreen from './screens/ClientesScreen';
import TroquelessScreen from './screens/TroquelessScreen';
import ProduccionScreen from './screens/ProduccionScreen';
import NewQuoteScreen from './screens/NewQuoteScreen';
import ConfigScreen from './screens/ConfigScreen';
import AuthHomeScreen from './screens/AuthHomeScreen';

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
const Tab = createMaterialTopTabNavigator();
const VALID_TABS = ['Pedidos', 'Máquinas', 'Presupuesto', 'Producción', 'Clientes', 'Troqueles', 'Setting'];
const VISIBLE_TOP_TABS = ['Pedidos', 'Presupuesto', 'Producción', 'Clientes', 'Setting'];

const SETTINGS_SUBMENU = [
  { key: 'settings-usuarios-roles', label: 'Usuarios', target: { type: 'setting-section', section: 'usuarios-roles' } },
  { key: 'settings-creditos', label: 'Créditos', target: { type: 'setting-section', section: 'creditos' } },
  { key: 'settings-funcionalidades', label: 'Funcionalidades web', target: { type: 'setting-section', section: 'funcionalidades' } },
  { key: 'settings-impresion', label: 'Impresión', target: { type: 'setting-section', section: 'impresion' } },
  { key: 'settings-maquinas', label: 'Máquinas', target: { type: 'tab', route: 'Máquinas' } },
  { key: 'settings-troqueles', label: 'Troqueles', target: { type: 'tab', route: 'Troqueles' } },
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
          Máquinas: 'maquinas',
          Troqueles: 'troqueles',
          Setting: 'setting',
        },
      },
      'Nueva Cotización': 'nueva-cotizacion',
      SettingsUsuariosRoles: 'setting/usuarios-roles',
      SettingsFuncionalidades: 'setting/funcionalidades',
      
      SettingsImpresion: 'setting/impresion',
    },
  },
};

function normalizeTabName(tabName) {
  if (!tabName) return 'Pedidos';
  if (tabName === 'Settings' || tabName === 'Setting') return 'Pedidos';
  return VALID_TABS.includes(tabName) ? tabName : 'Pedidos';
}

function TopTabsWithSettingsSubmenu({ state, descriptors, navigation, onTabChange, onLogout, currentUser, onRoleChange }) {
  const [submenuOpen, setSubmenuOpen] = React.useState(false);
  const [submenuPosition, setSubmenuPosition] = React.useState({ top: 44, left: 0 });
  const settingTabRef = React.useRef(null);
  const activeRoute = state.routes[state.index];
  const activeRouteName = activeRoute?.name;
  const activeSettingSection = activeRouteName === 'Setting'
    ? String(activeRoute?.params?.section || 'usuarios-roles')
    : null;
  const [rolesList, setRolesList] = React.useState([]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/settings?categoria=roles`);
        const data = await resp.json().catch(() => ({}));
        if (resp.ok && !cancelled) {
          const items = data.items || [];
          const list = (items || []).map((it) => {
            const valor = String(it?.valor || it?.label || it?.key || '').trim();
            return { key: String(valor).toLowerCase(), label: valor };
          }).filter((r) => r.key);
          setRolesList(list);
        }
      } catch (e) {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, []);

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
    if (target?.type === 'setting-section') {
      navigation.navigate('Setting', { section: target.section });
      onTabChange('Setting');
      return;
    }

    if (target?.type === 'tab' && target.route) {
      navigation.navigate(target.route);
      onTabChange(target.route);
    }
  };

  const isSubmenuTargetActive = (target) => {
    if (target?.type === 'tab' && target.route) {
      return activeRouteName === target.route;
    }
    if (target?.type === 'setting-section' && target.section) {
      return activeRouteName === 'Setting' && activeSettingSection === target.section;
    }
    return false;
  };

  const confirmLogout = () => {
    if (!onLogout) return;
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.confirm === 'function') {
      const accepted = window.confirm('¿Quieres cerrar la sesión actual?');
      if (accepted) {
        onLogout();
      }
      return;
    }
    Alert.alert(
      'Cerrar sesión',
      '¿Quieres cerrar la sesión actual?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: () => onLogout() },
      ]
    );
  };

  return (
    <View>
      <View style={styles.tabsBar}>
        <View style={styles.userInfoContainer}>
          {Platform.OS === 'web' ? (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <select
                value={String(currentUser?.rol || '').toLowerCase()}
                onChange={(e) => {
                  try {
                    const next = String(e.target.value || '').trim();
                    if (typeof onRoleChange === 'function') onRoleChange(next);
                    if (typeof window !== 'undefined' && window.localStorage) {
                      window.localStorage.setItem('PFP_SELECTED_ROLE', next);
                    }
                  } catch (err) {
                    // ignore
                  }
                }}
                style={{ fontSize: 12, fontWeight: 700, padding: '6px 8px', borderRadius: 6, border: '1px solid #E0E0E0', background: '#FFF' }}
              >
                {(rolesList && rolesList.length > 0 ? rolesList : [{ key: String(currentUser?.rol || '').toLowerCase(), label: currentUser?.rol || 'Invitado' }]).map((r) => (
                  <option key={r.key} value={r.key}>{r.label}</option>
                ))}
              </select>
            </div>
          ) : (
            <View style={{ width: 180 }}>
              <Picker
                selectedValue={String(currentUser?.rol || '').toLowerCase()}
                onValueChange={async (next) => {
                  try {
                    const nextVal = String(next || '').trim();
                    if (typeof onRoleChange === 'function') onRoleChange(nextVal);
                    try {
                      await AsyncStorage.setItem('PFP_SELECTED_ROLE', nextVal);
                    } catch (e) {
                      // ignore storage errors
                    }
                  } catch (err) {
                    // ignore
                  }
                }}
                mode="dropdown"
                style={{ height: 36 }}
              >
                {(rolesList && rolesList.length > 0 ? rolesList : [{ key: String(currentUser?.rol || '').toLowerCase(), label: currentUser?.rol || 'Invitado' }]).map((r) => (
                  <Picker.Item key={r.key} label={r.label} value={r.key} />
                ))}
              </Picker>
            </View>
          )}
        </View>
        <View style={styles.tabsList}>
          {state.routes
            .filter((route) => VISIBLE_TOP_TABS.includes(route.name))
            .map((route) => {
          const options = descriptors[route.key]?.options || {};
          const label = options.tabBarLabel || options.title || route.name;
          const isFocused = activeRouteName === route.name;
          const isSetting = route.name === 'Setting';
          const settingContext = activeRouteName === 'Setting' || activeRouteName === 'Máquinas' || activeRouteName === 'Troqueles';
          const isActive = isFocused || (isSetting && (submenuOpen || settingContext));

          return (
            <Pressable
              key={route.key}
              ref={isSetting ? settingTabRef : undefined}
              onPress={() => handleTabPress(route, isFocused)}
              style={styles.tabBtn}
            >
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{label}</Text>
              {isActive && route.name !== 'Setting' && <View style={styles.tabIndicator} />}
            </Pressable>
          );
          })}
        </View>
        {!!onLogout && (
          <Pressable onPress={confirmLogout} style={styles.topLogoutBtn}>
            <Text style={styles.topLogoutBtnText}>Cerrar sesión</Text>
          </Pressable>
        )}
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
                  {isSubmenuTargetActive(item.target) && <View style={styles.settingsSubmenuIndicator} />}
                </Pressable>
              ))}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

function HomeTabs({ initialRouteName, onTabChange, onLogout, currentUser, onRoleChange }) {
  return (
    <Tab.Navigator
      tabBar={(props) => <TopTabsWithSettingsSubmenu {...props} onTabChange={onTabChange} onLogout={onLogout} currentUser={currentUser} onRoleChange={onRoleChange} />}
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
        name="Máquinas"
        options={{ tabBarLabel: 'Máquinas' }}
        children={(props) => <MachinasScreen {...props} currentUser={currentUser} />}
      />
      <Tab.Screen
        name="Troqueles"
        options={{ tabBarLabel: 'Troqueles' }}
        children={(props) => <TroquelessScreen {...props} currentUser={currentUser} />}
      />
      <Tab.Screen
        name="Setting"
        initialParams={{ section: 'usuarios-roles' }}
        children={(props) => <ConfigScreen {...props} currentUser={currentUser} />}
        options={{
          tabBarLabel: 'Setting',
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    position: 'relative',
    zIndex: 5,
    paddingRight: 8,
  },
  tabsList: {
    flex: 1,
    flexDirection: 'row',
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    minHeight: 44,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A8A8AA',
  },
  tabLabelActive: {
    color: '#4B5563',
  },
  tabIndicator: {
    marginTop: 6,
    height: 2,
    width: 42,
    borderRadius: 2,
    backgroundColor: '#4B5563',
  },
  topLogoutBtn: {
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    marginLeft: 6,
  },
  topLogoutBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  userInfoContainer: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  userInfoText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '700',
  },
  settingsSubmenuWrap: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E7EC',
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
    backgroundColor: 'transparent',
  },
  settingsSubmenuItemText: {
    color: '#A8A8AA',
    fontSize: 12,
    fontWeight: '700',
  },
  settingsSubmenuItemTextActive: {
    color: '#4B5563',
  },
  settingsSubmenuIndicator: {
    marginTop: 6,
    height: 2,
    width: 42,
    borderRadius: 2,
    backgroundColor: '#4B5563',
  },
});

export default function App() {
  const [initialTab, setInitialTab] = React.useState('Pedidos');
  const [loading, setLoading] = React.useState(true);
  // BYPASS AUTH PARA DESARROLLO
  const [authUser, setAuthUser] = React.useState({ id: 1, nombre: 'DevUser', rol: 'root', empresa_id: 1 });
  const [authSession, setAuthSession] = React.useState({ access_token: 'dev', refresh_token: 'dev', usuario: { id: 1, nombre: 'DevUser', rol: 'root', empresa_id: 1 } });
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = React.useState(30);
  const lastActivityRef = React.useRef(Date.now());
  const autoLogoutTriggeredRef = React.useRef(false);

  const markActivity = React.useCallback(() => {
    lastActivityRef.current = Date.now();
    autoLogoutTriggeredRef.current = false;
  }, []);

  // DEV TEMP: Forzar usuario `root` controlado por `localStorage.PFP_FORCE_ROOT`.
  // - Para activar en el navegador: `localStorage.setItem('PFP_FORCE_ROOT','1')` y recarga.
  // - Para desactivar: `localStorage.setItem('PFP_FORCE_ROOT','0')` y recarga (o eliminar la clave).
  // Esto evita editar el código para activar/desactivar el forzado y facilita revertirlo.
  React.useEffect(() => {
    try {
      const isWeb = typeof window !== 'undefined' && typeof window.location !== 'undefined';
      if (!isWeb) return;

      const flag = String(window.localStorage.getItem('PFP_FORCE_ROOT') || '').trim();
      if (flag !== '1') {
        // Do nothing unless explicitly enabled
        // eslint-disable-next-line no-console
        console.log("DEV: PFP_FORCE_ROOT not set to '1' — skipping force-root");
        return;
      }

      const rootUser = { id: 'root', nombre: 'Root', rol: 'root', empresa_id: 1 };
      const nowSec = Math.floor(Date.now() / 1000);
      const rootSession = {
        usuario: rootUser,
        access_token: 'dev-access',
        refresh_token: 'dev-refresh',
        access_expires_at: nowSec + 3600 * 24,
      };

      setAuthUser(rootUser);
      setAuthSession(rootSession);
      AsyncStorage.setItem('authUser', JSON.stringify(rootUser)).catch(() => {});
      AsyncStorage.setItem('authSession', JSON.stringify(rootSession)).catch(() => {});
      // eslint-disable-next-line no-console
      console.log('DEV: authUser/authSession forzados a root (controlado por PFP_FORCE_ROOT)');
    } catch (e) {
      // ignore
    }
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

        // Si el usuario existe, aplicar el rol seleccionado en el desplegable
        try {
          const selectedRole = (typeof window !== 'undefined' && window.localStorage)
            ? window.localStorage.getItem('PFP_SELECTED_ROLE')
            : null;
          if (selectedRole && nextUser) {
            nextUser = { ...(nextUser || {}), rol: selectedRole };
            try {
              await AsyncStorage.setItem('authUser', JSON.stringify(nextUser));
            } catch (e) {
              // ignore AsyncStorage write errors
            }
          }
        } catch (e) {
          // ignore localStorage errors
        }

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
  };

  const handleRoleChange = async (nextRole) => {
    try {
      if (!nextRole) return;
      if (!authUser) return;
      const nextUser = { ...(authUser || {}), rol: nextRole };
      setAuthUser(nextUser);
      try {
        await AsyncStorage.setItem('authUser', JSON.stringify(nextUser));
      } catch (e) {
        // ignore
      }
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('PFP_SELECTED_ROLE', String(nextRole || '').trim());
        }
      } catch (e) {
        // ignore storage errors
      }
      try {
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
          window.dispatchEvent(new CustomEvent('pfp-role-changed', { detail: nextRole }));
        }
      } catch (e) {
        // ignore event errors
      }
    } catch (e) {
      // ignore
    }
  };

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

  return (
    <PedidosProvider>
      {/* ActiveRoleSwitcher removed: left-side control restored in ConfigScreen */}
      <NavigationContainer linking={linking}>
        <Stack.Navigator
          screenOptions={{
            animation: 'none',
          }}
        >
          {/* BYPASS AUTH PARA DESARROLLO */}
          <Stack.Screen
            name="Home"
            children={(props) => <HomeTabs {...props} initialRouteName={initialTab} onTabChange={handleTabChange} onLogout={handleLogout} currentUser={authUser} onRoleChange={handleRoleChange} />}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Nueva Cotización"
            component={NewQuoteScreen}
            options={{ headerShown: true }}
          />
          <Stack.Screen
            name="SettingsUsuariosRoles"
            initialParams={{ section: 'usuarios-roles' }}
            children={(props) => <ConfigScreen {...props} currentUser={authUser} />}
            options={{ title: 'Usuarios', headerShown: true }}
          />
          <Stack.Screen
            name="SettingsFuncionalidades"
            initialParams={{ section: 'funcionalidades' }}
            children={(props) => <ConfigScreen {...props} currentUser={authUser} />}
            options={{ title: 'Funcionalidades web', headerShown: true }}
          />
          
          <Stack.Screen
            name="SettingsImpresion"
            initialParams={{ section: 'impresion' }}
            children={(props) => <ConfigScreen {...props} currentUser={authUser} />}
            options={{ title: 'Impresión', headerShown: true }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PedidosProvider>
  );
}

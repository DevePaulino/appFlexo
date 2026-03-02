import React from 'react';
import { View, Text, StyleSheet, Alert, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';

const API_ACTIVE = 'http://localhost:8080/api/settings/active-role';

export default function ActiveRoleSwitcher() {
  const [roles, setRoles] = React.useState([]);
  const [active, setActive] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      const res = await fetch(API_ACTIVE);
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setRoles(Array.isArray(data.roles) ? data.roles : []);
        setActive(data.active_role || null);
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const onChange = async (next) => {
    if (!next) return;
    try {
      const res = await fetch(API_ACTIVE, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active_role: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        Alert.alert('Error', data.error || 'No se pudo cambiar el rol');
        return;
      }
      setActive(next);
      // small feedback
      if (Platform.OS === 'web') console.log('Active role set to', next);
    } catch (e) {
      Alert.alert('Error', 'No se pudo conectar al servidor');
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Rol activo:</Text>
      <View style={styles.pickerWrap}>
        <Picker
          selectedValue={active}
          onValueChange={(v) => onChange(v)}
          enabled={!loading}
          style={styles.picker}
        >
          {roles.map((r) => (
            <Picker.Item key={r.key} label={r.label} value={r.key} />
          ))}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#0f1724',
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    color: '#E6EEF8',
    fontWeight: '700',
    marginRight: 8,
  },
  pickerWrap: {
    flex: 1,
  },
  picker: {
    color: '#E6EEF8',
  },
});

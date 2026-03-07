import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const PALETTE = {
  error:   { bg: '#DC2626', text: '#FFFFFF' },
  success: { bg: '#16A34A', text: '#FFFFFF' },
  warning: { bg: '#D97706', text: '#FFFFFF' },
  info:    { bg: '#1E293B', text: '#F8FAFC' },
};

export default function Toast({ message, type = 'info', onHide, duration = 3500 }) {
  const translateY = useRef(new Animated.Value(80)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) return;

    translateY.setValue(80);
    opacity.setValue(0);

    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
      Animated.timing(opacity,    { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(hide, duration);
    return () => clearTimeout(timer);
  }, [message]);

  const hide = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 80,  duration: 220, useNativeDriver: true }),
      Animated.timing(opacity,    { toValue: 0,   duration: 180, useNativeDriver: true }),
    ]).start(() => onHide?.());
  };

  if (!message) return null;

  const colors = PALETTE[type] || PALETTE.info;

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: colors.bg, transform: [{ translateY }], opacity },
      ]}
    >
      <Text style={[styles.text, { color: colors.text }]} numberOfLines={3}>
        {message}
      </Text>
      <TouchableOpacity onPress={hide} style={styles.dismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={[styles.dismissText, { color: colors.text }]}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 20,
    left: 14,
    right: 14,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 10,
    zIndex: 9999,
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  dismiss: {
    marginLeft: 12,
  },
  dismissText: {
    fontSize: 16,
    fontWeight: '900',
  },
});

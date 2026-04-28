import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';

const OVERLAY  = 'rgba(10, 8, 40, 0.78)';
const CARD_H   = 190;
const PAD_SAFE = 14;

export default function HelpModal({ visible, onClose, title, steps }) {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();

  const [index, setIndex] = useState(0);
  const [sr, setSr] = useState(null);

  // Reset step to 0 each time the modal opens
  useEffect(() => {
    if (visible) setIndex(0);
  }, [visible]);

  const step  = steps?.[Math.min(index, (steps?.length ?? 1) - 1)];
  const total = steps?.length ?? 0;
  const isLast = index === total - 1;

  useEffect(() => {
    if (!visible || !step) { setSr(null); return; }
    const sl = step.spotlight;
    if (!sl) { setSr(null); return; }

    if (sl.ref?.current) {
      const PAD = sl.padding ?? 8;
      const timer = setTimeout(() => {
        sl.ref.current?.measureInWindow((x, y, w, h) => {
          setSr({
            x: Math.max(0, x - PAD),
            y: Math.max(0, y - PAD),
            width:  Math.min(width  - Math.max(0, x - PAD), w + PAD * 2),
            height: h + PAD * 2,
          });
        });
      }, 80);
      return () => clearTimeout(timer);
    }

    if (sl.top !== undefined) {
      setSr({ x: 0, y: Math.round(sl.top * height), width, height: Math.round(sl.height * height) });
    } else {
      setSr(null);
    }
  }, [index, visible]);

  // Keep Modal in tree so its fade-out animation completes properly.
  // Only skip rendering content when tours are disabled or there are no steps.
  if (!steps?.length) return null;

  // ── Tooltip position ──────────────────────────────────────────────────────
  let cardTop;
  if (sr) {
    const spaceBelow = height - (sr.y + sr.height) - PAD_SAFE;
    const spaceAbove = sr.y - PAD_SAFE;
    if (spaceBelow >= CARD_H || spaceBelow >= spaceAbove) {
      cardTop = sr.y + sr.height + 12;
    } else {
      cardTop = sr.y - CARD_H - 12;
    }
  } else {
    cardTop = (height - CARD_H) / 2;
  }
  cardTop = Math.max(PAD_SAFE, Math.min(height - CARD_H - PAD_SAFE, cardTop));

  const arrowBelow = sr && cardTop > sr.y;

  const handleNext = () => {
    if (isLast) { onClose(); }
    else setIndex((i) => i + 1);
  };
  const handleBack = () => setIndex((i) => Math.max(0, i - 1));
  const handleSkip = () => { onClose(); };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleSkip}>
      <View style={[s.root, { width, height }]}>

        {/* ── 4-strip spotlight cutout ── */}
        {sr ? (
          <>
            <View style={[s.dim, { top: 0,            height: sr.y,              left: 0, right: 0        }]} pointerEvents="none" />
            {sr.x > 0 && (
              <View style={[s.dim, { top: sr.y,        height: sr.height,         left: 0, width: sr.x     }]} pointerEvents="none" />
            )}
            {(sr.x + sr.width) < width && (
              <View style={[s.dim, { top: sr.y,        height: sr.height,         left: sr.x + sr.width, right: 0 }]} pointerEvents="none" />
            )}
            <View style={[s.dim, { top: sr.y + sr.height, bottom: 0,             left: 0, right: 0        }]} pointerEvents="none" />
            <View pointerEvents="none" style={[s.spotlightBorder, { top: sr.y - 2, left: sr.x - 2, width: sr.width + 4, height: sr.height + 4 }]} />
          </>
        ) : (
          <View style={[s.dim, { top: 0, height, left: 0, right: 0 }]} pointerEvents="none" />
        )}

        {/* ── Arrow connector ── */}
        {sr && (
          arrowBelow
            ? <View pointerEvents="none" style={[s.arrowUp,   { top: cardTop - 7, left: width / 2 - 7 }]} />
            : <View pointerEvents="none" style={[s.arrowDown, { top: cardTop + CARD_H + 2, left: width / 2 - 7 }]} />
        )}

        {/* ── Tooltip card (dark style) ── */}
        <View style={[s.card, { top: cardTop }]}>
          {/* Header */}
          <View style={s.cardHeader}>
            <View style={s.tourBadge}>
              <Text style={s.tourBadgeText}>TOUR</Text>
            </View>
            <Text style={s.cardTitle}>{title}</Text>
            <TouchableOpacity onPress={handleSkip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={s.skipText}>{t('help.skip')}</Text>
            </TouchableOpacity>
          </View>

          {/* Step content */}
          <View style={s.stepRow}>
            <View style={s.stepIconWrap}>
              <Text style={s.stepIcon}>{step.icon}</Text>
            </View>
            <View style={s.stepContent}>
              <Text style={s.stepTitle}>{step.title}</Text>
              <Text style={s.stepDesc}>{step.desc}</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={s.footer}>
            <View style={s.dots}>
              {steps.map((_, i) => (
                <View key={i} style={[s.dot, i === index && s.dotActive]} />
              ))}
            </View>
            <View style={s.btnRow}>
              {index > 0 && (
                <TouchableOpacity onPress={handleBack} style={s.backBtn}>
                  <Text style={s.backBtnText}>←</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleNext} style={s.nextBtn} activeOpacity={0.8}>
                <Text style={s.nextBtnText}>
                  {isLast ? t('help.closeBtn') : t('help.next')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0 },
  dim:  { position: 'absolute', backgroundColor: OVERLAY },

  spotlightBorder: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(129,140,248,0.75)',
    borderRadius: 6,
  },

  arrowUp: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#1E293B',
  },
  arrowDown: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1E293B',
  },

  card: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.35)',
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 20,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tourBadge: {
    backgroundColor: 'rgba(99,102,241,0.25)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.5)',
  },
  tourBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#818CF8',
    letterSpacing: 1,
  },
  cardTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  skipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },

  stepRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  stepIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(99,102,241,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
  },
  stepIcon: { fontSize: 18 },
  stepContent: { flex: 1 },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dots: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  dot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: '#334155' },
  dotActive: { backgroundColor: '#818CF8', width: 18 },

  btnRow: { flexDirection: 'row', gap: 8 },
  backBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
  },
  backBtnText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  nextBtn: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
  },
  nextBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
});

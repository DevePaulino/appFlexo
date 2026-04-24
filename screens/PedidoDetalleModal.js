import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  PanResponder,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePermission } from './usePermission';
import { useSettings } from '../SettingsContext';
import { useModulos } from '../ModulosContext';
import NuevoPedidoModal from './NuevoPedidoModal';
import DeleteConfirmRow from '../components/DeleteConfirmRow';
import { CanalesGrid, deltaColor } from '../components/CondicionesView';
import SolicitudClichesModal from './SolicitudClichesModal';

const API_BASE = 'http://localhost:8080';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  modal: {
    width: '98%',
    height: '94%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 16,
    flexDirection: 'column',
  },
  header: {
    backgroundColor: '#1E1B4B',
    paddingVertical: 11,
    paddingHorizontal: 16,
    paddingRight: 44,
    position: 'relative',
    marginBottom: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F1F5F9',
    letterSpacing: -0.3,
  },
  headerNum: {
    fontSize: 18,
    fontWeight: '400',
    color: '#94A3B8',
  },
  headerRef: {
    fontSize: 13,
    fontWeight: '400',
    color: '#64748B',
  },
  closeBtn: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  closeBtnText: {
    fontSize: 20,
    color: '#F1F5F9',
    fontWeight: '900',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingBottom: 6,
    marginBottom: 8,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F1F5F9',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    backgroundColor: '#1E1B4B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginHorizontal: -10,
    marginBottom: 0,
  },
  topGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  col: {
    flex: 1,
  },
  leftCol: {
    flex: 1,
  },
  rightCol: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 6,
  },
  label: {
    width: 92,
    flexShrink: 0,
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
  },
  value: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#1E1B4B',
  },
  fullWidthRow: {
    paddingVertical: 5,
  },
  fullWidthLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
    marginBottom: 3,
  },
  fullWidthValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E1B4B',
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActions: {
    position: 'absolute',
    right: 64,
    top: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  actionIconText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  editBtnText: { color: '#FFFFFF', fontWeight: '800' },
  dangerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  estadoPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    fontSize: 11,
    fontWeight: '700',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    marginTop: 20,
  },

  // ── Gestión de archivos ─────────────────────────────────────────────────
  fileSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1B4B',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginHorizontal: -10,
    marginBottom: 10,
    minHeight: 44,
  },
  fileUploadIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileUploadIconBtnText: {
    fontSize: 18,
    color: '#FFFFFF',
    lineHeight: 22,
    fontWeight: '600',
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F8',
  },
  fileIcon: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#EEF2F8',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    flexShrink: 0,
  },
  fileIconText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
  },
  fileName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  fileMeta: {
    fontSize: 11,
    color: '#94A3B8',
    marginRight: 6,
  },
  fileActionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 4,
  },
  fileDownloadBtn: { backgroundColor: '#475569' },
  fileDeleteBtn: { backgroundColor: '#DC2626' },
  fileActionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyFilesText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    paddingVertical: 8,
  },

  // ── Versiones unitario ──────────────────────────────────────────────────
  versionTabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  versionTab: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F1F5F9',
  },
  versionTabActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  versionTabDeleteBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  versionTabDeleteBtnText: {
    fontSize: 8,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 10,
  },
  versionTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  versionTabTextActive: {
    color: '#F1F5F9',
  },
  versionDate: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  versionTabsCol: {
    flexDirection: 'column',
    gap: 3,
    minWidth: 54,
    flexShrink: 0,
    paddingTop: 4,
    paddingRight: 4,
  },
  versionTabApproved: {
    borderColor: '#16A34A',
    borderWidth: 1.5,
  },
  approveBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  approveBtnActive: {
    borderColor: '#16A34A',
    backgroundColor: '#16A34A',
  },
  approveBtnText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
    lineHeight: 12,
  },
  approveBtnTextActive: {
    color: '#FFFFFF',
  },
  approvedBadge: {
    marginTop: 2,
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  approvedBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  // ── Panel aprobación ────────────────────────────────────────────────────
  approvalPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  approvalPanelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#16A34A',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 6,
    alignSelf: 'stretch',
    marginTop: 8,
  },
  approvalPanelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
    letterSpacing: 0.3,
  },
  approvalPanelApproved: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    gap: 8,
  },
  approvalPanelTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  approvalPanelDate: {
    fontSize: 10,
    color: '#4ADE80',
    marginTop: 2,
  },
  revocarBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: 'transparent',
  },
  revocarBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#EF4444',
  },
  revocarConfirmRow: {
    flexDirection: 'column',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  revocarConfirmText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B91C1C',
  },
  revocarConfirmNo: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  revocarConfirmNoText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  revocarConfirmYes: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  revocarConfirmYesText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ── PDF Lightbox ─────────────────────────────────────────────────────────
  lightboxOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  lightboxContent: {
    width: '92%',
    height: '92%',
    backgroundColor: '#1E1B4B',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  lightboxCloseBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    padding: 4,
  },
  lightboxCloseBtnText: {
    color: '#F1F5F9',
    fontSize: 20,
    fontWeight: '900',
  },

  // ── PDF preview ─────────────────────────────────────────────────────────
  previewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  pdfPreviewWrapper: {
    width: '38%',
    aspectRatio: 3 / 4,
    borderRadius: 6,
    overflow: 'hidden',
    flexShrink: 0,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  pdfPreviewWrapperLarge: {
    width: '58%',
    aspectRatio: 3 / 4,
    borderRadius: 8,
    overflow: 'hidden',
    flexShrink: 0,
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  versionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F1F5F9',
  },
  versionPillActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  versionPillApproved: {
    borderColor: '#16A34A',
  },
  versionPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  versionPillTextActive: {
    color: '#F1F5F9',
  },
  versionPillDate: {
    fontSize: 10,
    color: '#94A3B8',
  },
  versionPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  metaColumn: {
    flex: 1,
    minWidth: 0,
  },
  metaTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  sepChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  sepChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 4,
    flexBasis: '48%',
    flexGrow: 1,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sepChipWarn: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  sepSwatch: {
    width: 10,
    height: 10,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
    flexShrink: 0,
  },
  sepNombre: {
    fontSize: 10,
    fontWeight: '500',
    color: '#1E1B4B',
    flex: 1,
  },
  sepWarnIcon: {
    fontSize: 10,
    color: '#D97706',
    flexShrink: 0,
  },
  mismatchBanner: {
    marginTop: 8,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  mismatchText: {
    fontSize: 10,
    color: '#92400E',
    lineHeight: 15,
  },
  matchBanner: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  matchText: {
    fontSize: 10,
    color: '#166534',
    fontWeight: '600',
  },
  pdfOpenHint: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'left',
    marginBottom: 12,
    fontStyle: 'italic',
  },

  // ── Comparador de PDF ───────────────────────────────────────────────────────
  cmpSectionLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 7,
  },
  cmpEmpty: {
    fontSize: 11,
    color: '#CBD5E1',
    fontStyle: 'italic',
    paddingVertical: 2,
  },
  // Horizontal pill selection
  cmpPill: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    marginRight: 6,
    marginBottom: 6,
  },
  cmpPillActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4338CA',
  },
  cmpPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  cmpPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // Connector between sections
  cmpConnector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    gap: 6,
  },
  cmpConnectorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  cmpConnectorArrow: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '700',
  },
  // Search row — 3 compact labeled inputs
  cmpSearchRow: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 5,
  },
  cmpFieldGroup: {
    flex: 1,
  },
  cmpFieldLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  cmpSearchInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 5,
    fontSize: 12,
    color: '#1E1B4B',
    backgroundColor: '#F8FAFC',
  },
  cmpDropdown: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    marginBottom: 4,
  },
  cmpDropdownEmpty: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
    padding: 10,
  },
  cmpDropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  cmpDropdownNum: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E1B4B',
  },
  cmpDropdownSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  // Selected target order chip
  cmpTargetChip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 8,
  },
  cmpTargetChipNum: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4338CA',
  },
  cmpTargetChipSub: {
    fontSize: 11,
    color: '#6366F1',
    marginTop: 2,
  },
  cmpClearBtn: {
    padding: 2,
    marginTop: 2,
  },
  cmpClearBtnText: {
    fontSize: 13,
    color: '#A5B4FC',
  },
  // Status summary bar
  cmpStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginTop: 6,
    marginBottom: 8,
    gap: 4,
  },
  cmpStatusSeg: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
    flex: 1,
    textAlign: 'center',
  },
  cmpStatusSegEmpty: {
    fontSize: 11,
    color: '#CBD5E1',
    flex: 1,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  cmpStatusArrow: {
    fontSize: 14,
    color: '#CBD5E1',
    fontWeight: '700',
  },
  // Compare button
  cmpRunBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cmpRunBtnDisabled: {
    backgroundColor: '#E2E8F0',
  },
  cmpRunBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  cmpRunBtnTextDisabled: {
    color: '#94A3B8',
  },
  cmpDiffArea: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 12,
  },
  cmpDiffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  cmpDiffSimilarity: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  cmpPageNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cmpPageNavBtn: {
    fontSize: 20,
    fontWeight: '700',
    color: '#475569',
    paddingHorizontal: 4,
  },
  cmpPageNavText: {
    fontSize: 12,
    color: '#64748B',
  },
  cmpDiffImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },

  // ── Comparador lightbox ─────────────────────────────────────────────────
  cmpViewResultBtn: {
    marginTop: 8,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cmpViewResultBtnLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
    letterSpacing: 0.3,
  },
  cmpViewResultBtnSim: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4F46E5',
  },
  cmpLightboxOverlay: {
    flex: 1,
    backgroundColor: '#0A0F1A',
    flexDirection: 'column',
  },
  cmpLightboxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#4F46E5',
  },
  cmpLightboxLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'flex-start',
  },
  cmpLightboxCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  cmpLightboxModeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#4F46E5',
    borderWidth: 1,
    borderColor: '#334155',
  },
  cmpLightboxModeBtnActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  cmpLightboxModeBtnAuto: {
    backgroundColor: '#065F46',
    borderColor: '#10B981',
  },
  cmpLightboxModeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  cmpLightboxModeBtnTextActive: {
    color: '#FFFFFF',
  },
  cmpLightboxRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cmpLightboxSimilarity: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  cmpLightboxCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cmpLightboxCloseBtnText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '700',
  },
  cmpSepDiffBar: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#4F46E5',
    flexWrap: 'wrap',
  },
  cmpSepDiffChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#4F46E5',
    borderWidth: 1,
    borderColor: '#334155',
  },
  cmpSepDiffChipAlert: {
    backgroundColor: '#2D1515',
    borderColor: '#EF4444',
  },
  cmpSepDiffSwatch: {
    width: 10,
    height: 10,
    borderRadius: 3,
    flexShrink: 0,
  },
  cmpSepDiffName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  cmpSepDiffPct: {
    fontSize: 11,
    color: '#64748B',
  },
  cmpSepDiffPctAlert: {
    color: '#FCA5A5',
    fontWeight: '700',
  },
  cmpSepDiffWarn: {
    fontSize: 11,
    fontWeight: '900',
    color: '#EF4444',
  },
  cmpLightboxBody: {
    flex: 1,
    flexDirection: 'row',
  },
  cmpChannelSidebar: {
    width: 120,
    backgroundColor: '#0D1525',
    borderRightWidth: 1,
    borderRightColor: '#D9DBFF',
    paddingVertical: 8,
    paddingHorizontal: 6,
    gap: 4,
  },
  cmpChannelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#1E2D45',
    borderWidth: 1,
    borderColor: '#334155',
  },
  cmpChannelBtnOff: {
    backgroundColor: '#111827',
    borderColor: '#4F46E5',
  },
  cmpChannelBtnAlert: {
    borderColor: '#EF4444',
  },
  cmpChannelSwatch: {
    width: 8,
    height: 8,
    borderRadius: 2,
    flexShrink: 0,
  },
  cmpChannelName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#CBD5E1',
    lineHeight: 13,
  },
  cmpChannelNameOff: {
    color: '#475569',
  },
  cmpChannelPct: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 1,
  },
  cmpChannelPctAlert: {
    color: '#FCA5A5',
    fontWeight: '700',
  },
  cmpChannelAlertIcon: {
    fontSize: 10,
    fontWeight: '900',
    color: '#EF4444',
    flexShrink: 0,
  },
  cmpChannelOffIcon: {
    fontSize: 8,
    color: '#475569',
    flexShrink: 0,
  },
  cmpImageArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cmpZoomBtn: {
    width: 26,
    height: 26,
    borderRadius: 5,
    backgroundColor: '#4F46E5',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cmpZoomBtnText: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 18,
    fontWeight: '600',
  },
  cmpZoomLabel: {
    fontSize: 11,
    color: '#64748B',
    minWidth: 34,
    textAlign: 'center',
  },
  cmpLightboxImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  // Tool button active state
  cmpToolBtnActive: {
    backgroundColor: '#1E1B4B',
    borderColor: '#FACC15',
    borderWidth: 1.5,
  },

  // Page boxes info bar
  cmpPageBoxBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 6,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  cmpPageBoxItem: {
    fontSize: 11,
    color: '#64748B',
  },
  cmpPageBoxLabel: {
    fontWeight: '700',
    color: '#4F46E5',
  },
  cmpRulerResult: {
    fontSize: 12,
    color: '#FACC15',
    fontWeight: '700',
    marginLeft: 'auto',
  },

  // Eyedropper tooltip
  cmpEyedropTooltip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 10,
    minWidth: 180,
    zIndex: 999,
    boxShadow: '0px 3px 8px rgba(0,0,0,0.15)',
  },
  cmpEyedropCMYK: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 4,
  },
  cmpEyedropTAC: {
    fontSize: 13,
    fontWeight: '800',
  },

  // ── Contenedores PDF-Produccion ───────────────────────────────────────────────────
  pdfProduccionActionsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    flex: 1,
    alignContent: 'stretch',
    alignItems: 'stretch',
  },
  pdfProduccionToolCol: {
    flexBasis: '46%',
    flexGrow: 1,
    minWidth: 90,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  pdfProduccionCardHeader: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    alignItems: 'center',
  },
  pdfProduccionCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  pdfProduccionOutputBox: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pdfProduccionOutputBoxFilled: {
    backgroundColor: '#F8FAFC',
    alignItems: 'flex-start',
  },
  pdfProduccionGenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E40AF',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  pdfProduccionGenerateBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  pdfProduccionFileName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 1,
  },
  pdfProduccionFileMeta: {
    fontSize: 9,
    color: '#94A3B8',
    marginBottom: 5,
  },
  pdfProduccionFileBtns: {
    flexDirection: 'row',
    gap: 4,
    width: '100%',
  },
  pdfProduccionFileBtn: {
    flex: 1,
    paddingVertical: 4,
    borderRadius: 5,
    backgroundColor: '#16A34A',
    alignItems: 'center',
  },
  pdfProduccionFileBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  pdfProduccionUploadBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfProduccionUploadBtnText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  // ── Tabs navegación ──────────────────────────────────────────────────
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F8',
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
    gap: 2,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    boxShadow: '0px 1px 3px rgba(15,23,42,0.10)',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
    letterSpacing: 0.1,
  },
  tabTextActive: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E1B4B',
    letterSpacing: 0.1,
  },
  filesSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F1F5F9',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  fileCountBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 2,
  },
  fileCountBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  filesSeparator: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 14,
  },
  // ── Banner cancelado ──────────────────────────────────────────────
  canceladoBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
    alignItems: 'center',
  },
  canceladoBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B91C1C',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  // ── Barra de acciones inferior ────────────────────────────────────
  bottomBar: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 4,
    minHeight: 52,
  },
  bottomDestructiveBtns: {
    position: 'absolute',
    left: 0,
    top: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 1,
  },
  bottomMainBtns: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  bottomEditBtn: {
    backgroundColor: '#475569',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    minWidth: 130,
    boxShadow: '0px 3px 6px rgba(15,23,42,0.12)',
  },
  bottomEditBtnText: {
    color: '#F1F5F9',
    fontWeight: '600',
    fontSize: 13,
  },
  bottomCancelBtn: {
    backgroundColor: '#EEF2F8',
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    minWidth: 130,
  },
  bottomCancelBtnText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 13,
  },
  bottomDeleteBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomDeleteBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.75,
  },
  bottomCancelarPedidoBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomCancelarPedidoBtnText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '400',
    opacity: 0.8,
  },
  // ── Display de tintas 2 columnas ──────────────────────────────────
  inkSection: {
    marginBottom: 10,
  },
  inkSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  inkColsRow: {
    flexDirection: 'row',
    gap: 0,
  },
  inkCol: {
    flex: 1,
  },
  inkColBorder: {
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
    paddingLeft: 12,
  },
  inkColTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  inkChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 8,
  },
  inkSwatch: {
    width: 36,
    height: 36,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    flexShrink: 0,
  },
  inkChipLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1E1B4B',
    flex: 1,
  },
});

export default function PedidoDetalleModal({ visible, onClose, pedidoId, onDeleted, onEdit, onCancelled, currentUser = null, refreshKey = 0 }) {
  const { t } = useTranslation();
  const canDelete   = usePermission('eliminar_archivos');
  const canEdit     = usePermission('edit_pedidos');
  const canCancelar = usePermission('cancelar_pedido');
  const { estadoRules } = useSettings();
  const slugifyEstado = (texto) => String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const [editVisible, setEditVisible]           = useState(false);
  const [editInitialValues, setEditInitialValues] = useState(null);
  const [pedido, setPedido] = useState(null);
  const finalizadoSlugs = estadoRules?.estados_finalizados?.length ? estadoRules.estados_finalizados : ['finalizado'];
  const esFinalizado = pedido ? finalizadoSlugs.includes(slugifyEstado(pedido.estado)) : false;
  const esCancelado  = pedido ? slugifyEstado(pedido.estado) === 'cancelado' : false;
  const [activeRole, setActiveRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chargingAction, setChargingAction] = useState(null);
  const [activeTab, setActiveTab] = useState('archivos');
  const { modulos } = useModulos();
  const condicionesModuloActivo = !!modulos.condiciones_impresion;
  const [condicionesImpresion, setCondicionesImpresion] = useState(null);
  const [condicionesLoading, setCondicionesLoading] = useState(false);
  const [historicoSearch, setHistoricoSearch] = useState('');
  const [expandedHistorico, setExpandedHistorico] = useState(new Set([0]));

  // Archivos
  const [archivos, setArchivos] = useState({ artes: [], unitario: [], pdfProduccion: {} });
  const [archivosLoading, setArchivosLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [uploadingArtes, setUploadingArtes] = useState(false);
  const [uploadingUnitario, setUploadingUnitario] = useState(false);
  const [uploadingPdfProduccion, setUploadingPdfProduccion] = useState({});
  const [pdfMeta, setPdfMeta] = useState(null);
  const [pdfMetaLoading, setPdfMetaLoading] = useState(false);
  const [pdfLightboxUrl, setPdfLightboxUrl] = useState(null);
  const [confirmingDeleteArchivo, setConfirmingDeleteArchivo] = useState(null);
  const [confirmingDeletePedido, setConfirmingDeletePedido] = useState(false);
  const [confirmingCancelarPedido, setConfirmingCancelarPedido] = useState(false);
  const [approvingArchivoId, setApprovingArchivoId] = useState(null);
  const [confirmingRevocarId, setConfirmingRevocarId] = useState(null);
  const [solicitudClichesVisible, setSolicitudClichesVisible] = useState(false);
  const fileInputArtesRef      = useRef(null);
  const fileInputUnitarioRef   = useRef(null);
  const fileInputPdfProduccionRefs      = useRef({ report: null, repetidora: null, trapping: null, troquel: null });

  // PDF Comparador
  const [comparadorAllPedidos, setComparadorAllPedidos] = useState(null);
  const [comparadorSrcArchivoId, setComparadorSrcArchivoId] = useState(null);
  const [comparadorSearchNumero, setComparadorSearchNumero] = useState('');
  const [comparadorSearchCliente, setComparadorSearchCliente] = useState('');
  const [comparadorSearchNombre, setComparadorSearchNombre] = useState('');
  const [comparadorTargetPedido, setComparadorTargetPedido] = useState(null);
  const [comparadorTargetFiles, setComparadorTargetFiles] = useState([]);
  const [comparadorTargetArchivoId, setComparadorTargetArchivoId] = useState(null);
  const [comparadorRunning, setComparadorRunning] = useState(false);
  const [comparadorDiff, setComparadorDiff] = useState(null);
  const [comparadorDiffPage, setComparadorDiffPage] = useState(0);
  const [comparadorLightbox, setComparadorLightbox] = useState(false);
  const [cmpViewOnly, setCmpViewOnly] = useState(false);
  const [cmpViewOnlyLoading, setCmpViewOnlyLoading] = useState(null); // archivoId | null
  const [comparadorViewMode, setComparadorViewMode] = useState('diff'); // 'diff' | 'a' | 'b'
  const [comparadorAutoPlay, setComparadorAutoPlay] = useState(false);
  const comparadorAutoPlayRef = useRef(null);
  const [comparadorActiveSeps, setComparadorActiveSeps] = useState(null); // null=all, Set=selected
  const [comparadorZoom, setComparadorZoom] = useState(1.0);
  const [comparadorPan, setComparadorPan] = useState({ x: 0, y: 0 });
  const [comparadorRotation, setComparadorRotation] = useState(0); // 0 | 90 | 180 | 270
  const [comparadorFlip, setComparadorFlip] = useState(false);
  const cmpCanvasRef = useRef(null);
  const cmpCompositeIdRef = useRef(0);
  const cmpPanRef = useRef({ x: 0, y: 0 });
  const cmpPanStartRef = useRef({ x: 0, y: 0 });
  const cmpZoomRef = useRef(1.0);
  const cmpImgRef = useRef(null); // native <img> ref for sampling on web
  const [cmpTool, setCmpTool] = useState(null); // null | 'eyedropper' | 'ruler'
  const cmpToolRef = useRef(null); // mirrors cmpTool for use inside memo/callbacks
  const [cmpEyedropResult, setCmpEyedropResult] = useState(null);
  const [cmpEyedropRadius, setCmpEyedropRadius] = useState(1); // sample area radius in px
  const cmpEyedropDragging = useRef(false);
  const cmpRulerDragging = useRef(null); // null | 0 | 1 — index of point being dragged
  const [cmpRulerPoints, setCmpRulerPoints] = useState([]);
  const [cmpRulerDist, setCmpRulerDist] = useState(null);

  // Keep ref in sync so pan responder (created once via useMemo) can read current tool
  useEffect(() => { cmpToolRef.current = cmpTool; }, [cmpTool]);

  const cmpPanResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => cmpZoomRef.current > 1 && cmpToolRef.current !== 'eyedropper' && cmpToolRef.current !== 'ruler',
    onMoveShouldSetPanResponder: () => cmpZoomRef.current > 1 && cmpToolRef.current !== 'eyedropper' && cmpToolRef.current !== 'ruler',
    onPanResponderGrant: () => {
      cmpPanStartRef.current = { ...cmpPanRef.current };
    },
    onPanResponderMove: (_, g) => {
      const next = { x: cmpPanStartRef.current.x + g.dx, y: cmpPanStartRef.current.y + g.dy };
      cmpPanRef.current = next;
      setComparadorPan({ ...next });
    },
  }), []);

  // Carga metadatos XMP cuando cambia la versión seleccionada
  useEffect(() => {
    if (selectedVersion === null) { setPdfMeta(null); return; }
    const versionDoc = archivos.unitario.find((u) => u.version === selectedVersion);
    if (!versionDoc) return;
    setPdfMetaLoading(true);
    setPdfMeta(null);
    fetch(`${API_BASE}/api/archivos/${versionDoc.id}/metadatos`, {
      headers: getAuthHeaders(),
    })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setPdfMeta(data || null))
      .catch(() => setPdfMeta(null))
      .finally(() => setPdfMetaLoading(false));
  }, [selectedVersion, archivos.unitario]);

  // Auto-play A↔B cada 1.5s
  useEffect(() => {
    if (comparadorAutoPlay && comparadorDiff && comparadorDiff.length > 0) {
      comparadorAutoPlayRef.current = setInterval(() => {
        setComparadorViewMode((m) => (m === 'a' ? 'b' : 'a'));
      }, 1500);
    } else {
      clearInterval(comparadorAutoPlayRef.current);
    }
    return () => clearInterval(comparadorAutoPlayRef.current);
  }, [comparadorAutoPlay, comparadorDiff]);

  // Canvas composite: renderiza canales activos con mezcla multiply
  useEffect(() => {
    if (!comparadorLightbox || !comparadorDiff || Platform.OS !== 'web') return;
    if (comparadorViewMode === 'diff') return;
    const page = comparadorDiff[comparadorDiffPage] || {};
    const channels = comparadorViewMode === 'a' ? page.channels_a : page.channels_b;
    if (!channels || !Object.keys(channels).length) return;
    const allNames = (page.sep_diffs || []).map((s) => s.nombre);
    const activeSeps = comparadorActiveSeps instanceof Set ? comparadorActiveSeps : new Set(allNames);
    if (activeSeps.size === allNames.length) return; // usa imagen pre-renderizada
    const id = ++cmpCompositeIdRef.current;
    const colorMap = {};
    (page.sep_diffs || []).forEach((s) => { colorMap[s.nombre] = s.color || '#1A1A1A'; });
    const activeEntries = Object.entries(channels).filter(([n]) => activeSeps.has(n));
    Promise.all(activeEntries.map(([name, b64]) =>
      new Promise((resolve) => {
        const img = new window.Image();
        img.onload = () => resolve({ name, img });
        img.onerror = () => resolve(null);
        img.src = `data:image/jpeg;base64,${b64}`;
      }),
    )).then((results) => {
      if (id !== cmpCompositeIdRef.current) return;
      const valid = results.filter(Boolean);
      if (!valid.length) return;
      const canvas = cmpCanvasRef.current;
      if (!canvas) return;
      const w = valid[0].img.naturalWidth;
      const h = valid[0].img.naturalHeight;
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = '';
      canvas.style.height = '';
      const W = w, H = h;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, W, H);
      const off = document.createElement('canvas');
      off.width = W; off.height = H;
      const octx = off.getContext('2d', { willReadFrequently: true });
      for (const { name, img } of valid) {
        if (id !== cmpCompositeIdRef.current) return;
        octx.clearRect(0, 0, W, H);
        octx.drawImage(img, 0, 0, W, H);
        const data = octx.getImageData(0, 0, W, H);
        const d = data.data;
        const hex = (colorMap[name] || '#1A1A1A').replace('#', '');
        const cr = parseInt(hex.slice(0, 2), 16) || 0;
        const cg = parseInt(hex.slice(2, 4), 16) || 0;
        const cb = parseInt(hex.slice(4, 6), 16) || 0;
        for (let i = 0; i < d.length; i += 4) {
          const ink = (255 - d[i]) / 255; // 0=no ink 1=full ink
          d[i]   = Math.round(255 - ink * (255 - cr));
          d[i + 1] = Math.round(255 - ink * (255 - cg));
          d[i + 2] = Math.round(255 - ink * (255 - cb));
          d[i + 3] = 255;
        }
        octx.putImageData(data, 0, 0);
        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(off, 0, 0);
      }
      ctx.globalCompositeOperation = 'source-over';
    });
  }, [comparadorLightbox, comparadorDiff, comparadorDiffPage, comparadorViewMode, comparadorActiveSeps]);

  useEffect(() => {
    if (!visible) {
      setArchivos({ artes: [], unitario: [], pdfProduccion: {} });
      setSelectedVersion(null);
      setActiveTab('archivos');
      setPdfLightboxUrl(null);
      setConfirmingDeleteArchivo(null);
      setConfirmingDeletePedido(false);
      // Liberar memoria de renders del comparador
      setComparadorDiff(null);
      setComparadorLightbox(false);
      setComparadorAutoPlay(false);
      setComparadorSrcArchivoId(null);
      setComparadorTargetPedido(null);
      setComparadorTargetFiles([]);
      setComparadorTargetArchivoId(null);
      setComparadorAllPedidos(null);
      setComparadorSearchNumero('');
      setComparadorSearchCliente('');
      setComparadorSearchNombre('');
      setComparadorActiveSeps(null);
      setComparadorZoom(1.0);
      return;
    }
    if (pedidoId) {
      cargarPedido();
      cargarRolActivo();
      cargarArchivos();
      if (condicionesModuloActivo) {
        setCondicionesLoading(true);
        fetch(`${API_BASE}/api/pedidos/${pedidoId}/condiciones`, { headers: getAuthHeaders() })
          .then((r) => r.json())
          .then((d) => setCondicionesImpresion(d.condiciones || null))
          .catch(() => setCondicionesImpresion(null))
          .finally(() => setCondicionesLoading(false));
      }
    }
  }, [visible, pedidoId, refreshKey, condicionesModuloActivo]);

  const normalizarRolActivo = (value) =>
    String(value || '')
      .normalize('NFD')
      .replace(/[^\w\s-]/g, '')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();

  const cargarRolActivo = async () => {
    try {
      const respAll = await fetch(`${API_BASE}/api/settings`);
      if (!respAll.ok) { setActiveRole(''); return; }
      const all = await respAll.json().catch(() => ({}));
      setActiveRole(normalizarRolActivo((all.settings && (all.settings.active_role || all.settings.activeRole || all.settings.active)) || ''));
    } catch {
      setActiveRole('');
    }
  };

  const cargarPedido = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/pedidos/${pedidoId}`);
      if (response.ok) {
        setPedido(await response.json());
      } else {
        setError('No se pudo cargar el pedido');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getAuthHeaders = () => {
    const h = {};
    if (global.__MIAPP_ACCESS_TOKEN) h.Authorization = `Bearer ${global.__MIAPP_ACCESS_TOKEN}`;
    return h;
  };

  // ── Comparador PDF ───────────────────────────────────────────────────────────
  const loadComparadorPedidos = async () => {
    if (comparadorAllPedidos !== null) return;
    try {
      const res = await fetch(`${API_BASE}/api/pedidos`, { headers: getAuthHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      setComparadorAllPedidos(data.pedidos || []);
    } catch (_) {}
  };

  const getFilteredComparadorPedidos = () => {
    if (!comparadorAllPedidos) return [];
    const qNum = comparadorSearchNumero.trim().toLowerCase();
    const qCli = comparadorSearchCliente.trim().toLowerCase();
    const qNom = comparadorSearchNombre.trim().toLowerCase();
    if (!qNum && !qCli && !qNom) return [];
    return comparadorAllPedidos.filter((p) => {
      const matchNum = !qNum || String(p.numero_pedido || '').toLowerCase().includes(qNum);
      const matchCli = !qCli || String(p.cliente?.nombre || '').toLowerCase().includes(qCli);
      const matchNom = !qNom || String(p.referencia || p.datos_presupuesto?.referencia || '').toLowerCase().includes(qNom);
      return matchNum && matchCli && matchNom;
    }).slice(0, 10);
  };

  const selectTargetPedido = async (pedido) => {
    setComparadorTargetPedido(pedido);
    setComparadorTargetArchivoId(null);
    setComparadorTargetFiles([]);
    setComparadorDiff(null);
    try {
      const res = await fetch(`${API_BASE}/api/pedidos/${pedido.id}/archivos`, { headers: getAuthHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      setComparadorTargetFiles(data.archivos || []);
    } catch (_) {}
  };

  const clearTargetPedido = () => {
    setComparadorTargetPedido(null);
    setComparadorTargetFiles([]);
    setComparadorTargetArchivoId(null);
    setComparadorDiff(null);
    setComparadorDiffPage(0);
    setComparadorSearchNumero('');
    setComparadorSearchCliente('');
    setComparadorSearchNombre('');
  };

  const runComparison = async (scale = 7.0) => {
    if (!comparadorSrcArchivoId || !comparadorTargetArchivoId) return;
    if (comparadorSrcArchivoId === comparadorTargetArchivoId) return;
    setComparadorRunning(true);
    setComparadorDiff(null);
    try {
      const res = await fetch(`${API_BASE}/api/archivos/comparar-pdf`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ archivo_id_a: comparadorSrcArchivoId, archivo_id_b: comparadorTargetArchivoId, scale }),
      });
      if (res.ok) {
        const data = await res.json();
        setComparadorDiff(data.pages || []);
        setComparadorDiffPage(0);
        setComparadorViewMode('diff');
        setComparadorAutoPlay(false);
        setComparadorActiveSeps(null);
        setComparadorZoom(1.0);
        setComparadorLightbox(true);
      }
    } catch (_) {}
    setComparadorRunning(false);
  };


  const openViewOnlyLightbox = async (archivoId) => {
    setCmpViewOnlyLoading(archivoId);
    setCmpViewOnly(true);
    setComparadorDiff(null);
    try {
      const res = await fetch(`${API_BASE}/api/archivos/comparar-pdf`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ archivo_id_a: archivoId, archivo_id_b: archivoId, scale: 7.0 }),
      });
      if (res.ok) {
        const data = await res.json();
        setComparadorDiff(data.pages || []);
        setComparadorDiffPage(0);
        setComparadorViewMode('a');
        setComparadorAutoPlay(false);
        setComparadorActiveSeps(null);
        setComparadorZoom(1.0);
        setComparadorLightbox(true);
      }
    } catch (_) {}
    setCmpViewOnlyLoading(null);
  };

  const cargarArchivos = async () => {
    if (!pedidoId) return;
    setArchivosLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/pedidos/${pedidoId}/archivos`, {
        headers: getAuthHeaders(),
      });
      if (!resp.ok) return;
      const data = await resp.json().catch(() => ({}));
      const lista = data.archivos || [];
      const artes    = lista.filter((a) => a.tipo === 'arte');
      const unitario = lista
        .filter((a) => a.tipo === 'unitario')
        .sort((a, b) => (a.version || 0) - (b.version || 0));
      const PDF_PRODUCCION_TIPOS = ['report', 'repetidora', 'trapping', 'troquel'];
      const pdfProduccionData = {};
      PDF_PRODUCCION_TIPOS.forEach((tipo) => {
        const found = lista.filter((a) => a.tipo === tipo);
        pdfProduccionData[tipo] = found.length > 0 ? found[found.length - 1] : null;
      });
      setArchivos({ artes, unitario, pdfProduccion: pdfProduccionData });
      if (unitario.length > 0) {
        const latestVersion = unitario[unitario.length - 1].version;
        setSelectedVersion((prev) => {
          const stillExists = unitario.some((u) => u.version === prev);
          return stillExists ? prev : latestVersion;
        });
      } else {
        setSelectedVersion(null);
      }
    } catch (_) {
      // silent — sección muestra estado vacío
    } finally {
      setArchivosLoading(false);
    }
  };

  const handleUploadArtes = async (files) => {
    if (!files || files.length === 0) return;
    setUploadingArtes(true);
    try {
      const formData = new FormData();
      formData.append('tipo', 'arte');
      Array.from(files).forEach((file) => formData.append('files', file));
      const resp = await fetch(`${API_BASE}/api/pedidos/${pedidoId}/archivos`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) { Alert.alert(t('screens.pedidoDetalle.errSubir'), data.error || t('screens.pedidoDetalle.errNoSubirArtes')); return; }
      await cargarArchivos();
      setArtesExpanded(true);
    } catch (err) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setUploadingArtes(false);
      if (fileInputArtesRef.current) fileInputArtesRef.current.value = '';
    }
  };

  const handleUploadUnitario = async (file) => {
    if (!file) return;
    setUploadingUnitario(true);
    try {
      const formData = new FormData();
      formData.append('tipo', 'unitario');
      formData.append('files', file);
      const resp = await fetch(`${API_BASE}/api/pedidos/${pedidoId}/archivos`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) { Alert.alert(t('screens.pedidoDetalle.errSubir'), data.error || t('screens.pedidoDetalle.errNoSubirUnitario')); return; }
      await cargarArchivos();
    } catch (err) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setUploadingUnitario(false);
      if (fileInputUnitarioRef.current) fileInputUnitarioRef.current.value = '';
    }
  };

  const handleUploadPdfProduccion = async (tipo, file) => {
    if (!file) return;
    setUploadingPdfProduccion((prev) => ({ ...prev, [tipo]: true }));
    try {
      const formData = new FormData();
      formData.append('tipo', tipo);
      formData.append('files', file);
      const resp = await fetch(`${API_BASE}/api/pedidos/${pedidoId}/archivos`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        console.error('[uploadPDF-Produccion] error body:', JSON.stringify(data));
        Alert.alert(t('screens.pedidoDetalle.errSubir'), data.error || t('common.error'));
        return;
      }
      await cargarArchivos();
    } catch (err) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setUploadingPdfProduccion((prev) => ({ ...prev, [tipo]: false }));
      const ref = fileInputPdfProduccionRefs.current[tipo];
      if (ref) ref.value = '';
    }
  };

  const ejecutarEliminarArchivo = async (archivoId) => {
    try {
      const resp = await fetch(`${API_BASE}/api/archivos/${archivoId}`, { method: 'DELETE', headers: getAuthHeaders() });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) { Alert.alert(t('common.error'), data.error || t('screens.pedidoDetalle.errNoPudo')); return; }
      await cargarArchivos();
    } catch (err) {
      Alert.alert(t('common.error'), err.message);
    }
  };

  const toggleAprobarVersion = async (archivoId, yaAprobado) => {
    setApprovingArchivoId(archivoId);
    setConfirmingRevocarId(null);
    try {
      const resp = await fetch(`${API_BASE}/api/archivos/${archivoId}/aprobar`, { method: 'PATCH', headers: getAuthHeaders() });
      if (!resp.ok) return;
      const data = await resp.json();
      setArchivos((prev) => ({
        ...prev,
        unitario: prev.unitario.map((u) => {
          if (yaAprobado) {
            return u.id === archivoId ? { ...u, aprobado: false, fecha_aprobacion: null, aprobado_por: null } : u;
          }
          return u.id === archivoId
            ? { ...u, aprobado: true, fecha_aprobacion: data.fecha_aprobacion, aprobado_por: data.aprobado_por }
            : { ...u, aprobado: false, fecha_aprobacion: null, aprobado_por: null };
        }),
      }));
    } catch (_) {}
    finally { setApprovingArchivoId(null); }
  };

  const ejecutarCancelarPedido = async () => {
    if (!pedido?.id) return;
    try {
      const res = await fetch(`${API_BASE}/api/pedidos/${pedido.id}/cancelar`, { method: 'POST', headers: getAuthHeaders() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { Alert.alert(t('common.error'), data.error || t('screens.pedidoDetalle.errNoPudoCancelar')); return; }
      setConfirmingCancelarPedido(false);
      cargarPedido();
      if (typeof onCancelled === 'function') onCancelled();
    } catch (_) {}
  };

  const ejecutarEliminarPedido = async () => {
    if (!pedido?.id) return;
    try {
      const res = await fetch(`${API_BASE}/api/pedidos/${pedido.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { Alert.alert(t('common.error'), data.error || t('screens.pedidoDetalle.errNoPudoEliminar')); return; }
      Alert.alert(t('screens.pedidoDetalle.pedidoEliminado'), t('screens.pedidoDetalle.msgPedidoEliminado'));
      if (typeof onDeleted === 'function') onDeleted();
    } catch (err) {
      Alert.alert(t('common.error'), t('screens.pedidoDetalle.errConexion', { msg: err.message }));
    }
  };

  const formatearTamanio = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  };

  if (!visible) return null;

  const renderRow = (label, value, color) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, color ? { color } : null]}>{value ?? '-'}</Text>
    </View>
  );


  const formatearFecha = (valor) => {
    if (!valor) return '-';
    const texto = String(valor).includes('T') ? String(valor).split('T')[0] : String(valor);
    const [anio, mes, dia] = texto.split('-');
    if (!anio || !mes || !dia) return texto;
    return `${dia}-${mes}-${anio}`;
  };

  const formatearFechaHora = (valor) => {
    if (!valor) return '-';
    const str = String(valor);
    const [fechaParte, horaParte] = str.includes('T') ? str.split('T') : [str, null];
    const [anio, mes, dia] = fechaParte.split('-');
    if (!anio || !mes || !dia) return str;
    const horaStr = horaParte ? horaParte.substring(0, 5) : null;
    return horaStr ? `${dia}-${mes}-${anio} ${horaStr}` : `${dia}-${mes}-${anio}`;
  };

  const mapToolToAccion = (title) => {
    const normalized = String(title || '').trim().toLowerCase();
    if (normalized === 'report') return 'report';
    if (normalized === 'trapping') return 'trapping';
    if (normalized === 'repetidora') return 'repetidora';
    if (normalized === 'troquel') return 'troquel';
    return null;
  };

  const handleDescargarTool = async (title) => {
    const accion = mapToolToAccion(title);
    if (!accion || !pedido?.id) {
      Alert.alert(t('common.error'), t('screens.pedidoDetalle.errDescarga'));
      return;
    }
    const usuarioNombre = String(pedido?.datos_presupuesto?.vendedor || '').trim();
    if (!usuarioNombre) {
      Alert.alert(t('screens.pedidoDetalle.errFaltaVendedor'), t('screens.pedidoDetalle.msgFaltaVendedor'));
      return;
    }
    setChargingAction(accion);
    try {
      const response = await fetch(`${API_BASE}/api/billing/consumir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion,
          usuario_nombre: usuarioNombre,
          referencia: `PED-${pedido.id}-${accion}`,
          metadata: { pedido_id: pedido.id, numero_pedido: pedido.numero_pedido || null, tool: accion },
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 402) {
          Alert.alert(
            t('billing.insufficientCredits'),
            t('billing.insufficientCreditsMsg', { required: data.required ?? '', balance: data.balance ?? '' })
          );
        } else {
          Alert.alert(t('screens.pedidoDetalle.errNoPuedeDescargar'), data.error || t('common.error'));
        }
        return;
      }
      const charged = Number(data.charged_credits || 0);
      const saldo = Number(data.creditos || 0);
      if (charged > 0) {
        Alert.alert(t('screens.pedidoDetalle.descargaPreparada'), t('screens.pedidoDetalle.msgDescargaCreditos', { charged, saldo }));
      } else {
        Alert.alert(t('screens.pedidoDetalle.descargaPreparada'), t('screens.pedidoDetalle.msgDescargaSuscripcion', { saldo }));
      }
    } catch (err) {
      Alert.alert(t('common.error'), t('screens.pedidoDetalle.errProcesarDescarga', { msg: err.message }));
    } finally {
      setChargingAction(null);
    }
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="fade">
      <View style={styles.container}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('screens.pedidoDetalle.title')}</Text>
            <Text style={styles.headerNum}>{pedido?.numero_pedido || (loading ? '…' : '—')}</Text>
            {pedido?.referencia ? (
              <Text style={styles.headerRef} numberOfLines={1}>{pedido.referencia}</Text>
            ) : null}
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* ── Banner pedido cancelado ── */}
          {esCancelado && (
            <View style={styles.canceladoBanner}>
              <Text style={styles.canceladoBannerText}>🚫 {t('screens.pedidoDetalle.pedidoCanceladoBanner')}</Text>
            </View>
          )}

          {/* ── Pestañas ── */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={activeTab === 'archivos' ? styles.tabBtnActive : styles.tabBtn}
              onPress={() => setActiveTab('archivos')}
            >
              <Text style={activeTab === 'archivos' ? styles.tabTextActive : styles.tabText}>{t('screens.pedidoDetalle.tabArchivos')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={activeTab === 'datos' ? styles.tabBtnActive : styles.tabBtn}
              onPress={() => setActiveTab('datos')}
            >
              <Text style={activeTab === 'datos' ? styles.tabTextActive : styles.tabText}>{t('screens.pedidoDetalle.tabDatos')}</Text>
            </TouchableOpacity>
            {condicionesModuloActivo && (
              <TouchableOpacity
                style={activeTab === 'condiciones' ? styles.tabBtnActive : styles.tabBtn}
                onPress={() => { setActiveTab('condiciones'); setExpandedHistorico(new Set([0])); }}
              >
                <Text style={activeTab === 'condiciones' ? styles.tabTextActive : styles.tabText}>
                  {t('screens.pedidoDetalle.tabHistoricoImpresiones')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ flex: 1, overflow: 'hidden' }}>
            {loading ? (
              <View style={styles.loading}>
                <ActivityIndicator size="large" color="#64748B" />
              </View>
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : pedido ? (
              <ScrollView style={{ flex: 1 }}>

              {/* ═══════════════════ TAB: HISTÓRICO DE IMPRESIONES ═══════════════════ */}
              {activeTab === 'condiciones' && (
                <View style={{ padding: 12 }}>
                  {/* Buscador */}
                  {Array.isArray(pedido.historial_impresiones) && pedido.historial_impresiones.length > 0 && (
                    <TextInput
                      style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, fontSize: 13, color: '#0F172A', marginBottom: 12 }}
                      placeholder={t('screens.pedidoDetalle.historicoSearchPlaceholder')}
                      placeholderTextColor="#94A3B8"
                      value={historicoSearch}
                      onChangeText={setHistoricoSearch}
                    />
                  )}
                  {(!Array.isArray(pedido.historial_impresiones) || pedido.historial_impresiones.length === 0) && (
                    <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                      <Text style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center' }}>
                        {t('screens.pedidoDetalle.sinHistorialImpresiones')}
                      </Text>
                    </View>
                  )}
                  {Array.isArray(pedido.historial_impresiones) && (() => {
                    const reversed = [...pedido.historial_impresiones].reverse();
                    const q = historicoSearch.trim().toLowerCase();
                    const filtered = q ? reversed.filter((entry) => {
                      return [
                        entry.maquina,
                        entry.usuario,
                        entry.fecha ? new Date(entry.fecha).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '',
                      ].some((v) => String(v || '').toLowerCase().includes(q));
                    }) : reversed;
                    if (q && filtered.length === 0) {
                      return (
                        <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                          <Text style={{ fontSize: 13, color: '#94A3B8' }}>{t('common.noResults')}</Text>
                        </View>
                      );
                    }
                    return filtered.map((entry, i) => {
                    // Fallback: la entrada más reciente usa pedido.condiciones_impresion
                    // si no tiene condiciones_impresion propio (datos guardados antes del cambio de backend)
                    const c = entry.condiciones_impresion || (i === 0 ? pedido.condiciones_impresion : null);
                    const snap = c ? (c.test_referencia_snapshot || {}) : {};
                    const vals = c ? (c.valores_reales || snap) : {};
                    const deltas = c ? (c.deltas || {}) : {};
                    const canales = vals.canales_activos || snap.canales_activos || [];
                    const canalesInfo = vals.canales_info || snap.canales_info || {};
                    const meds = vals.mediciones || snap.mediciones || {};
                    const isExpanded = expandedHistorico.has(i);
                    const toggleExpand = () => setExpandedHistorico((prev) => {
                      const next = new Set(prev);
                      if (next.has(i)) { next.delete(i); } else { next.add(i); }
                      return next;
                    });
                    const Row = ({ label, value }) => value != null && value !== '' ? (
                      <View style={{ flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                        <Text style={{ fontSize: 12, color: '#64748B', width: 120 }}>{label}</Text>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#1E1B4B', flex: 1 }}>{value}</Text>
                      </View>
                    ) : null;
                    return (
                      <View key={i} style={[styles.sectionCard, { marginBottom: 8 }]}>
                        {/* Cabecera — siempre visible, pulsable */}
                        <TouchableOpacity
                          onPress={toggleExpand}
                          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                          activeOpacity={0.7}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1 }}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E1B4B' }}>
                              {entry.fecha ? new Date(entry.fecha).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                            </Text>
                            {entry.maquina ? (
                              <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, backgroundColor: '#E0F2FE' }}>
                                <Text style={{ fontSize: 11, fontWeight: '700', color: '#0369A1' }}>{entry.maquina}</Text>
                              </View>
                            ) : null}
                            {entry.usuario ? (
                              <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, backgroundColor: '#F1F5F9' }}>
                                <Text style={{ fontSize: 11, fontWeight: '600', color: '#475569' }}>{entry.usuario}</Text>
                              </View>
                            ) : null}
                            {i === 0 && (
                              <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, backgroundColor: '#DCFCE7' }}>
                                <Text style={{ fontSize: 10, fontWeight: '800', color: '#16A34A' }}>ÚLTIMO</Text>
                              </View>
                            )}
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={{ fontSize: 11, fontWeight: '800', color: '#CBD5E1' }}>#{pedido.historial_impresiones.length - i}</Text>
                            <Text style={{ fontSize: 16, color: '#94A3B8', fontWeight: '600' }}>{isExpanded ? '▲' : '▼'}</Text>
                          </View>
                        </TouchableOpacity>

                        {/* Cuerpo — sólo visible si expandido */}
                        {isExpanded && (
                          <View style={{ marginTop: 12 }}>
                            {/* Sin colorimetría */}
                            {!c && (
                              <Text style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>
                                {t('screens.pedidoDetalle.sinColorimetria')}
                              </Text>
                            )}

                            {/* Con colorimetría */}
                            {c && (
                              <View>
                                {/* Origen */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#EEF2FF', borderRadius: 6 }}>
                                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#4F46E5' }}>
                                      {c.origen === 'clon_test_maquina' ? 'Clonado de máquina' : c.origen === 'con_desviacion' ? 'Con desviación' : 'Pedido similar'}
                                    </Text>
                                  </View>
                                </View>
                                <Row label={t('screens.pedidoDetalle.labelMaquina')} value={c.maquina_nombre} />
                                {c.pedido_similar_id && <Row label="Pedido base" value={c.pedido_similar_nombre || c.pedido_similar_id} />}
                                <Row label="Material" value={vals.material || snap.material} />
                                <Row label="Velocidad" value={vals.velocidad_mmin != null ? `${vals.velocidad_mmin} m/min` : null} />
                                <Row label="Anilox" value={vals.anilox || snap.anilox} />
                                <Row label="Fab. tintas" value={vals.fabricante_tintas || snap.fabricante_tintas} />
                                {vals.notas_operario ? <Row label="Notas" value={vals.notas_operario} /> : null}

                                {/* Mediciones por canal */}
                                {canales.length > 0 && (
                                  <View style={{ marginTop: 10 }}>
                                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                      {t('screens.pedidoDetalle.medicionesPorCanal')}
                                    </Text>
                                    <CanalesGrid
                                      canales={canales}
                                      canalesInfo={canalesInfo}
                                      mediciones={meds}
                                      deltas={deltas}
                                      readOnly
                                      layout="grid"
                                    />
                                  </View>
                                )}

                                {/* Desviaciones escalares */}
                                {Object.keys(deltas).filter(k => k !== 'mediciones').length > 0 && (
                                  <View style={{ marginTop: 12 }}>
                                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                      {t('screens.pedidoDetalle.desviacionesEscalares')}
                                    </Text>
                                    {Object.entries(deltas).filter(([k]) => k !== 'mediciones').map(([k, v]) => {
                                      const dBg = Math.abs(v) < 0.02 ? '#DCFCE7' : Math.abs(v) < 0.08 ? '#FEF9C3' : '#FEE2E2';
                                      return (
                                        <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                                          <Text style={{ fontSize: 13, color: '#475569' }}>{k}</Text>
                                          <View style={{ paddingHorizontal: 10, paddingVertical: 4, backgroundColor: dBg, borderRadius: 8 }}>
                                            <Text style={{ fontSize: 14, fontWeight: '800', color: deltaColor(v) }}>
                                              {v > 0 ? `+${v}` : v}
                                            </Text>
                                          </View>
                                        </View>
                                      );
                                    })}
                                  </View>
                                )}
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  });
                  })()}
                </View>
              )}

              {/* ═══════════════════ TAB: PEDIDO ═══════════════════ */}
              {activeTab === 'datos' && (() => {
                const dp = pedido.datos_presupuesto || null;
                const CMYK_LABELS = { C: 'Cyan', M: 'Magenta', Y: 'Yellow', K: t('screens.pedidoDetalle.cmykNegro') };
                const tintasItems = (() => {
                  const items = [];
                  (dp?.selectedTintas || []).filter((x) => ['C','M','Y','K'].includes(x)).forEach((x) => items.push(CMYK_LABELS[x]));
                  const spotMap = new Map();
                  (dp?.selectedTintas || []).filter((x) => !['C','M','Y','K'].includes(x)).forEach((x) => spotMap.set(x, x));
                  (dp?.pantones || []).forEach((p) => { const lbl = p.label || p.key || ''; if (lbl && !spotMap.has(lbl) && !['C','M','Y','K'].includes(lbl)) spotMap.set(lbl, lbl); });
                  spotMap.forEach((lbl) => items.push(lbl));
                  (Array.isArray(dp?.detalleTintaEspecial) ? dp.detalleTintaEspecial : []).forEach((te) => { if (te && !items.includes(te)) items.push(te); });
                  return items;
                })();
                return (
                  <>
                    {/* ── 3 columnas ── */}
                    <View style={styles.topGrid}>
                      {/* Col 1: Cliente / Contacto */}
                      <View style={styles.col}>
                        <View style={styles.sectionCard}>
                          <Text style={styles.sectionTitle}>{t('screens.pedidoDetalle.secCliente')}</Text>
                          {renderRow(t('screens.pedidoDetalle.labelCliente'), (typeof pedido.cliente === 'string') ? pedido.cliente : (pedido.cliente?.nombre || '-'))}
                          {renderRow(t('screens.pedidoDetalle.labelRazonSocial'), dp?.razon_social || pedido.razon_social || '-')}
                          {renderRow(t('screens.pedidoDetalle.labelCif'), dp?.cif || pedido.cif || '-')}
                          {renderRow(t('screens.pedidoDetalle.labelContacto'), dp?.personas_contacto || pedido.personas_contacto || '-')}
                          {renderRow(t('screens.pedidoDetalle.labelEmail'), dp?.email || pedido.email || '-')}
                          {renderRow(t('screens.pedidoDetalle.labelVendedor'), dp?.vendedor || '-')}
                        </View>
                      </View>
                      {/* Col 2: Pedido */}
                      <View style={styles.col}>
                        <View style={styles.sectionCard}>
                          <Text style={styles.sectionTitle}>{t('screens.pedidoDetalle.secPedido')}</Text>
                          {renderRow(t('screens.pedidoDetalle.labelNumero'), pedido.numero_pedido || '-')}
                          {renderRow(t('screens.pedidoDetalle.labelFechaPedido'), formatearFecha(pedido.fecha_pedido))}
                          {renderRow(t('screens.pedidoDetalle.labelReferencia'), pedido.referencia || '-')}
                          {renderRow(t('screens.pedidoDetalle.labelNombreTrabajo'), pedido.nombre || '-')}
                          {renderRow(t('screens.pedidoDetalle.labelEstado'), pedido.estado || '-')}
                          {renderRow(t('screens.pedidoDetalle.labelFechaEntrega'), formatearFecha(pedido.fecha_entrega))}
                          {renderRow(t('screens.pedidoDetalle.labelRetraso'), String(pedido.dias_retraso ?? 0), (pedido.dias_retraso || 0) > 0 ? '#FF6B6B' : '#16A34A')}
                          {dp?.observaciones ? (
                            <View style={styles.fullWidthRow}>
                              <Text style={styles.fullWidthLabel}>{t('screens.pedidoDetalle.labelObservaciones')}</Text>
                              <Text style={styles.fullWidthValue}>{dp.observaciones}</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                      {/* Col 3: Presupuesto / Producto */}
                      <View style={styles.col}>
                        {dp && (
                          <View style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>{t('screens.pedidoDetalle.secPresupuesto')}</Text>
                            {renderRow(t('screens.pedidoDetalle.labelNPresupuesto'), dp?.numero_presupuesto || pedido.numero_presupuesto || '-')}
                            {pedido.fecha_aprobacion_presupuesto ? renderRow(t('screens.pedidoDetalle.labelFechaAprobacion'), formatearFechaHora(pedido.fecha_aprobacion_presupuesto)) : null}
                            {renderRow(t('screens.pedidoDetalle.labelFormato'), dp?.formatoAncho ? `${dp.formatoAncho} x ${dp.formatoLargo || '-'} mm` : '-')}
                            {renderRow(t('screens.pedidoDetalle.labelMaquina'), dp?.maquina || pedido.maquina || '-')}
                            {renderRow(t('screens.pedidoDetalle.labelMaterial'), dp?.material || '-')}
                            {renderRow(t('screens.pedidoDetalle.labelAcabado'), Array.isArray(dp?.acabado) ? (dp.acabado.length ? dp.acabado.join(', ') : '-') : (dp?.acabado || '-'))}
                            {renderRow(t('screens.pedidoDetalle.labelTirada'), dp?.tirada ? `${dp.tirada} ${t('screens.pedidoDetalle.unidades')}` : '-')}
                            {tintasItems.length > 0 ? renderRow(t('screens.pedidoDetalle.labelTintas'), tintasItems.join(' · ')) : null}
                            {renderRow(t('screens.pedidoDetalle.labelTroquelEstado'), dp?.troquelEstadoSel || '-')}
                            {renderRow(t('screens.pedidoDetalle.labelTroquelForma'), dp?.troquelFormaSel || '-')}
                            {renderRow(t('screens.pedidoDetalle.labelTroquelCoste'), dp?.troquelCoste || '-')}
                            {dp?.observaciones ? (
                              <View style={styles.fullWidthRow}>
                                <Text style={styles.fullWidthLabel}>{t('screens.pedidoDetalle.labelObservaciones')}</Text>
                                <Text style={styles.fullWidthValue}>{dp.observaciones}</Text>
                              </View>
                            ) : null}
                          </View>
                        )}
                      </View>
                    </View>

                    {/* ── Impresión (ancho completo) ── */}
                    {pedido.datos_impresion && (() => {
                      const di = pedido.datos_impresion;
                      if (di.sin_material) {
                        return (
                          <View style={[styles.sectionCard, { marginTop: 4 }]}>
                            <Text style={styles.sectionTitle}>{t('screens.pedidoDetalle.secImpresion')}</Text>
                            {renderRow(t('screens.pedidoDetalle.labelFechaImpresion'), di.fecha ? new Date(di.fecha).toLocaleString() : '-')}
                            {renderRow(t('screens.pedidoDetalle.labelSinMaterial'), t('screens.pedidoDetalle.valSinMaterial'))}
                          </View>
                        );
                      }
                      return (
                        <View style={[styles.sectionCard, { marginTop: 4 }]}>
                          <Text style={styles.sectionTitle}>{t('screens.pedidoDetalle.secImpresion')}</Text>
                          <View style={styles.topGrid}>
                            <View style={styles.col}>
                              {renderRow(t('screens.pedidoDetalle.labelFechaImpresion'), di.fecha ? new Date(di.fecha).toLocaleString() : '-')}
                              {renderRow(t('screens.pedidoDetalle.labelMaterialImpresion'), di.material_nombre || '-')}
                              {renderRow(t('screens.pedidoDetalle.labelFabricante'), di.fabricante || '-')}
                              {renderRow(t('screens.pedidoDetalle.labelAnchoRollo'), di.ancho_rollo_cm != null ? `${di.ancho_rollo_cm} cm` : '-')}
                              {renderRow(t('screens.pedidoDetalle.labelAnchoTrabajo'), di.ancho_trabajo_cm != null ? `${di.ancho_trabajo_cm} cm` : '-')}
                            </View>
                            <View style={styles.col}>
                              {renderRow(t('screens.pedidoDetalle.labelAprovechamiento'), di.aprovechamiento_pct != null ? `${di.aprovechamiento_pct}%` : '-')}
                              {renderRow(t('screens.pedidoDetalle.labelTirada'), di.tirada != null ? String(di.tirada) : '-')}
                              {renderRow(t('screens.pedidoDetalle.labelEtiqPorVuelta'), di.etiquetas_por_vuelta != null ? String(di.etiquetas_por_vuelta) : '-')}
                              {renderRow(t('screens.pedidoDetalle.labelVueltas'), di.vueltas != null ? String(di.vueltas) : '-')}
                            </View>
                            <View style={styles.col}>
                              {renderRow(t('screens.pedidoDetalle.labelMermaImpresion'), di.merma_metros != null ? `${di.merma_metros} m` : '-')}
                              {renderRow(t('screens.pedidoDetalle.labelMetrosConsumidos'), di.metros_consumidos != null ? `${di.metros_consumidos} m` : '-')}
                              {renderRow(t('screens.pedidoDetalle.labelSentidoImpresion'), di.sentido_impresion || '-')}
                              {renderRow(t('screens.pedidoDetalle.labelRetalGenerado'), di.retal_generado ? t('common.yes') : t('common.no'))}
                            </View>
                          </View>
                        </View>
                      );
                    })()}

                    {/* ── Almacenamiento ── */}
                    {(() => {
                      const allFiles = [
                        ...archivos.artes,
                        ...archivos.unitario,
                        ...Object.values(archivos.pdfProduccion).filter(Boolean),
                      ];
                      const totalBytes = allFiles.reduce((s, f) => s + (f.tamanio || 0), 0);
                      if (totalBytes === 0) return null;
                      const toHuman = (b) => {
                        if (b < 1024) return `${b} B`;
                        if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
                        if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(2)} MB`;
                        return `${(b / 1024 ** 3).toFixed(3)} GB`;
                      };
                      const byTipo = {};
                      allFiles.forEach(f => {
                        const t2 = f.tipo || 'otro';
                        byTipo[t2] = (byTipo[t2] || 0) + (f.tamanio || 0);
                      });
                      return (
                        <View style={[styles.sectionCard, { marginTop: 4 }]}>
                          <Text style={styles.sectionTitle}>Almacenamiento</Text>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
                            {renderRow('Total archivos', String(allFiles.length))}
                            {renderRow('Tamaño total', toHuman(totalBytes))}
                          </View>
                          {Object.entries(byTipo).length > 1 && (
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                              {Object.entries(byTipo).map(([tipo, bytes]) => (
                                <View key={tipo} style={{ backgroundColor: '#F1F5F9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
                                  <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600' }}>{tipo}: {toHuman(bytes)}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      );
                    })()}

                  </>
                );
              })()}

              {/* ═══════════════════ TAB: ARCHIVOS ═══════════════════ */}
              {activeTab === 'archivos' && (
                <>
                {/* ── Grid 2x2: Unitario | PDF-Produccion / Artes | Comparador ── */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginRight: -10 }}>
                <View style={{ flexBasis: Platform.OS === 'web' ? '50%' : '100%', paddingRight: 10, marginBottom: 10 }}>
                <View style={styles.sectionCard}>
                  <View style={styles.fileSectionHeader}>
                    <Text style={styles.filesSectionLabel}>{t('screens.pedidoDetalle.unitarioTitle')}</Text>
                    {uploadingUnitario
                      ? <ActivityIndicator size="small" color="#FFFFFF" />
                      : (
                        <TouchableOpacity
                          style={styles.fileUploadIconBtn}
                          onPress={() => fileInputUnitarioRef.current && fileInputUnitarioRef.current.click()}
                        >
                          <Text style={styles.fileUploadIconBtnText}>+</Text>
                        </TouchableOpacity>
                      )
                    }
                  </View>

                  {Platform.OS === 'web' && (
                    <input
                      type="file"
                      ref={fileInputUnitarioRef}
                      style={{ display: 'none' }}
                      accept=".pdf"
                      onChange={(e) => e.target.files[0] && handleUploadUnitario(e.target.files[0])}
                    />
                  )}

                  {archivosLoading && archivos.unitario.length === 0 ? (
                    <ActivityIndicator size="small" color="#475569" />
                  ) : archivos.unitario.length === 0 ? (
                    <Text style={styles.emptyFilesText}>{t('screens.pedidoDetalle.sinUnitario')}</Text>
                  ) : (
                    <>
                      {/* ── Fila de versiones (pastillas horizontales) ── */}
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                        {archivos.unitario.map((u) => {
                          const isActive = u.version === selectedVersion;
                          const isApproved = !!u.aprobado;
                          const fecha = u.fecha_subida ? u.fecha_subida.split('T')[0].split('-').reverse().join('/') : '';
                          return (
                            <View key={u.id} style={{ position: 'relative' }}>
                              <TouchableOpacity
                                onPress={() => setSelectedVersion(u.version)}
                                style={[styles.versionPill, isActive && styles.versionPillActive, isApproved && styles.versionPillApproved]}
                              >
                                <Text style={[styles.versionPillText, isActive && styles.versionPillTextActive]}>
                                  v{u.version}
                                </Text>
                                {isApproved && <View style={styles.versionPillDot} />}
                                {fecha ? <Text style={[styles.versionPillDate, isActive && { color: '#CBD5E1' }]}>{fecha}</Text> : null}
                              </TouchableOpacity>
                              {canDelete && (
                                confirmingDeleteArchivo === u.id ? (
                                  <DeleteConfirmRow
                                    onCancel={() => setConfirmingDeleteArchivo(null)}
                                    onConfirm={() => { setConfirmingDeleteArchivo(null); ejecutarEliminarArchivo(u.id); }}
                                  />
                                ) : (
                                  <TouchableOpacity
                                    onPress={() => setConfirmingDeleteArchivo(u.id)}
                                    style={styles.versionTabDeleteBtn}
                                  >
                                    <Text style={styles.versionTabDeleteBtnText}>✕</Text>
                                  </TouchableOpacity>
                                )
                              )}
                            </View>
                          );
                        })}
                      </View>

                      {/* ── Preview grande + meta ── */}
                      {(() => {
                        const selected = archivos.unitario.find((u) => u.version === selectedVersion);
                        if (!selected) return null;
                        const inlineToken = global.__MIAPP_ACCESS_TOKEN ? `?token=${encodeURIComponent(global.__MIAPP_ACCESS_TOKEN)}` : '';
                        const thumbnailUrl = `${API_BASE}/api/archivos/${selected.id}/thumbnail${inlineToken}`;

                        const CMYK_NORM = {
                          c: 'cyan', m: 'magenta', y: 'yellow', k: 'black',
                          cyan: 'cyan', magenta: 'magenta', yellow: 'yellow', black: 'black',
                          cian: 'cyan', amarillo: 'yellow', negro: 'black',
                          jaune: 'yellow', noir: 'black', schwarz: 'black',
                        };
                        const inkKey = (name) => {
                          const n = String(name).toLowerCase().trim().replace(/^process\s+/, '');
                          if (CMYK_NORM[n]) return CMYK_NORM[n];
                          const digits = n.match(/\d+/);
                          return digits ? digits[0] : n;
                        };
                        const dp = pedido?.datos_presupuesto || {};
                        const pedidoLabels = new Set([
                          ...(dp.selectedTintas || []),
                          ...(dp.pantones || []).map((p) => p.label || p.key || '').filter(Boolean),
                          ...(Array.isArray(dp.detalleTintaEspecial)
                            ? dp.detalleTintaEspecial
                            : dp.detalleTintaEspecial ? [String(dp.detalleTintaEspecial)] : []),
                        ]);
                        const pedidoKeys = new Set([...pedidoLabels].map(inkKey));
                        const pdfSeps = pdfMeta?.separaciones || [];
                        const pdfKeys = new Set(pdfSeps.map((s) => inkKey(s.nombre)));
                        const hasPedidoInks = pedidoKeys.size > 0 && pdfSeps.length > 0;
                        const extraEnPdf = hasPedidoInks
                          ? pdfSeps.filter((s) => s.tipo !== 'especial' && !pedidoKeys.has(inkKey(s.nombre)))
                          : [];
                        const extraEnPedido = hasPedidoInks
                          ? [...pedidoLabels].filter((t) => t && !pdfKeys.has(inkKey(t)))
                          : [];
                        const extraEnPdfSet = new Set(extraEnPdf.map((s) => s.nombre));

                        const isApproved = !!selected.aprobado;
                        const isApproving = approvingArchivoId === selected.id;
                        const fechaAprobacion = selected.fecha_aprobacion
                          ? new Date(selected.fecha_aprobacion).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                          : null;

                        return (
                          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                            {/* Preview PDF — ocupa ~60% */}
                            <View style={styles.pdfPreviewWrapperLarge}>
                              <Image
                                key={selected.id}
                                source={{ uri: thumbnailUrl }}
                                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                                resizeMode="contain"
                              />
                              <TouchableOpacity
                                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                                onPress={() => openViewOnlyLightbox(selected.id)}
                                activeOpacity={0.85}
                                disabled={cmpViewOnlyLoading !== null}
                              />
                              {cmpViewOnlyLoading === selected.id && (
                                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.55)', alignItems: 'center', justifyContent: 'center' }}>
                                  <ActivityIndicator size="small" color="#FFFFFF" />
                                </View>
                              )}
                            </View>

                            {/* Meta: separaciones + aprobación */}
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <Text style={styles.metaTitle}>{t('screens.pedidoDetalle.separacionesTitle')}</Text>
                              {pdfMetaLoading ? (
                                <ActivityIndicator size="small" color="#94A3B8" />
                              ) : pdfSeps.length === 0 ? (
                                <Text style={{ fontSize: 11, color: '#CBD5E1', fontStyle: 'italic' }}>{t('screens.pedidoDetalle.sinSeparaciones')}</Text>
                              ) : (
                                <>
                                  <View style={styles.sepChipsWrap}>
                                    {pdfSeps.map((s, i) => {
                                      const warn = extraEnPdfSet.has(s.nombre);
                                      return (
                                        <View key={i} style={[styles.sepChip, warn && styles.sepChipWarn]}>
                                          <View style={[styles.sepSwatch, { backgroundColor: s.color || '#CBD5E1' }]} />
                                          <Text style={styles.sepNombre} numberOfLines={1}>{s.nombre}</Text>
                                        </View>
                                      );
                                    })}
                                  </View>
                                  {hasPedidoInks && extraEnPdf.length === 0 && extraEnPedido.length === 0 ? (
                                    <View style={styles.matchBanner}>
                                      <Text style={styles.matchText}>{t('screens.pedidoDetalle.tintasCoinciden')}</Text>
                                    </View>
                                  ) : (extraEnPdf.length > 0 || extraEnPedido.length > 0) ? (
                                    <View style={styles.mismatchBanner}>
                                      {extraEnPdf.length > 0 && (
                                        <Text style={styles.mismatchText}>
                                          {t('screens.pedidoDetalle.enPdfNoPedido')}{extraEnPdf.map((s) => s.nombre).join(', ')}
                                        </Text>
                                      )}
                                      {extraEnPedido.length > 0 && (
                                        <Text style={[styles.mismatchText, { marginTop: extraEnPdf.length > 0 ? 2 : 0 }]}>
                                          {t('screens.pedidoDetalle.enPedidoNoPdf')}{extraEnPedido.join(', ')}
                                        </Text>
                                      )}
                                    </View>
                                  ) : null}
                                </>
                              )}

                              {/* Aprobar / revocar */}
                              {(() => {
                                if (!isApproved && !isApproving && confirmingRevocarId !== selected.id) {
                                  return (
                                    <TouchableOpacity style={[styles.approvalPanelBtn, { marginTop: 8 }]} onPress={() => toggleAprobarVersion(selected.id, false)}>
                                      <Text style={styles.approvalPanelBtnText}>✓ {t('screens.pedidoDetalle.aprobarBtn')}</Text>
                                    </TouchableOpacity>
                                  );
                                }
                                if (isApproving) return <ActivityIndicator size="small" color="#16A34A" style={{ marginTop: 8 }} />;
                                if (confirmingRevocarId === selected.id) return (
                                  <View style={styles.revocarConfirmRow}>
                                    <Text style={styles.revocarConfirmText}>{t('screens.pedidoDetalle.revocarConfirm')}</Text>
                                    <View style={{ flexDirection: 'row', gap: 6 }}>
                                      <TouchableOpacity style={styles.revocarConfirmNo} onPress={() => setConfirmingRevocarId(null)}>
                                        <Text style={styles.revocarConfirmNoText}>{t('common.cancel')}</Text>
                                      </TouchableOpacity>
                                      <TouchableOpacity style={styles.revocarConfirmYes} onPress={() => toggleAprobarVersion(selected.id, true)}>
                                        <Text style={styles.revocarConfirmYesText}>{t('screens.pedidoDetalle.revocarBtn')}</Text>
                                      </TouchableOpacity>
                                    </View>
                                  </View>
                                );
                                if (isApproved) return (
                                  <View style={[styles.approvalPanelApproved, { marginTop: 8 }]}>
                                    <View style={{ flex: 1 }}>
                                      <Text style={styles.approvalPanelTitle}>✓ {t('screens.pedidoDetalle.aprobadoLabel')} · v{selected.version}</Text>
                                      {fechaAprobacion ? <Text style={styles.approvalPanelDate}>{fechaAprobacion}{selected.aprobado_por ? ` · ${selected.aprobado_por}` : ''}</Text> : null}
                                    </View>
                                    <TouchableOpacity onPress={() => setConfirmingRevocarId(selected.id)} style={styles.revocarBtn}>
                                      <Text style={styles.revocarBtnText}>{t('screens.pedidoDetalle.revocarBtn')}</Text>
                                    </TouchableOpacity>
                                  </View>
                                );
                                return null;
                              })()}
                            </View>
                          </View>
                        );
                      })()}
                    </>
                  )}

                </View>{/* fin unitario sectionCard */}
                </View>{/* fin col unitario */}

                {/* ── Contenedores PDF-Produccion ── */}
                <View style={{ flexBasis: Platform.OS === 'web' ? '50%' : '100%', paddingRight: 10, marginBottom: 10 }}>
                <View style={styles.sectionCard}>
                  <View style={styles.fileSectionHeader}>
                    <Text style={styles.filesSectionLabel}>{t('screens.pedidoDetalle.pdf-produccionTitle')}</Text>
                  </View>
                  <View style={styles.pdfProduccionActionsRow}>
                    {['Report', 'Repetidora', 'Trapping', 'Troquel'].map((title) => {
                      const accion2 = mapToolToAccion(title);
                      const tipoKey2 = accion2;
                      const isLoading2 = chargingAction === accion2;
                      const isUploading2 = !!uploadingPdfProduccion[tipoKey2];
                      const pdfProduccionFile2 = archivos.pdfProduccion[tipoKey2] || null;
                      return (
                        <View key={title} style={styles.pdfProduccionToolCol}>
                          <View style={styles.pdfProduccionCardHeader}>
                            <Text style={styles.pdfProduccionCardLabel}>{title}</Text>
                          </View>
                          <View style={[styles.pdfProduccionOutputBox, pdfProduccionFile2 && styles.pdfProduccionOutputBoxFilled]}>
                            {isUploading2 ? (
                              <ActivityIndicator size="small" color="#475569" />
                            ) : pdfProduccionFile2 ? (
                              <>
                                {pdfProduccionFile2.nombre_original?.toLowerCase().endsWith('.pdf') && (() => {
                                  const tok2 = global.__MIAPP_ACCESS_TOKEN ? `?token=${encodeURIComponent(global.__MIAPP_ACCESS_TOKEN)}` : '';
                                  const thumbUrl2 = `${API_BASE}/api/archivos/${pdfProduccionFile2.id}/thumbnail${tok2}`;
                                  return (
                                    <View style={{ height: 80, width: '100%', marginBottom: 6, borderRadius: 4, overflow: 'hidden', position: 'relative', backgroundColor: '#F8FAFC' }}>
                                      <Image source={{ uri: thumbUrl2 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} resizeMode="contain" />
                                      <TouchableOpacity style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={() => openViewOnlyLightbox(pdfProduccionFile2.id)} activeOpacity={0.85} disabled={cmpViewOnlyLoading !== null} />
                                      {cmpViewOnlyLoading === pdfProduccionFile2.id && (
                                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.55)', alignItems: 'center', justifyContent: 'center' }}>
                                          <ActivityIndicator size="small" color="#FFFFFF" />
                                        </View>
                                      )}
                                    </View>
                                  );
                                })()}
                                <Text style={styles.pdfProduccionFileName} numberOfLines={1}>{pdfProduccionFile2.nombre_original}</Text>
                                <Text style={styles.pdfProduccionFileMeta}>{formatearTamanio(pdfProduccionFile2.tamanio)}</Text>
                                {confirmingDeleteArchivo === pdfProduccionFile2.id ? (
                                  <DeleteConfirmRow onCancel={() => setConfirmingDeleteArchivo(null)} onConfirm={() => { setConfirmingDeleteArchivo(null); ejecutarEliminarArchivo(pdfProduccionFile2.id); }} />
                                ) : (
                                  <>
                                  <View style={styles.pdfProduccionFileBtns}>
                                    <TouchableOpacity style={styles.pdfProduccionFileBtn} onPress={() => { if (typeof window !== 'undefined') window.open(`${API_BASE}/api/archivos/${pdfProduccionFile2.id}`, '_blank'); }}>
                                      <Text style={styles.pdfProduccionFileBtnText}>↓</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.pdfProduccionFileBtn, { backgroundColor: '#64748B' }]} onPress={() => fileInputPdfProduccionRefs.current[tipoKey2] && fileInputPdfProduccionRefs.current[tipoKey2].click()}>
                                      <Text style={styles.pdfProduccionFileBtnText}>↑</Text>
                                    </TouchableOpacity>
                                    {canDelete && (
                                      <TouchableOpacity style={[styles.pdfProduccionFileBtn, { backgroundColor: '#DC2626' }]} onPress={() => setConfirmingDeleteArchivo(pdfProduccionFile2.id)}>
                                        <Text style={styles.pdfProduccionFileBtnText}>✕</Text>
                                      </TouchableOpacity>
                                    )}
                                  </View>
                                  {tipoKey2 === 'repetidora' && (
                                    <TouchableOpacity
                                      style={{ marginTop: 6, backgroundColor: '#4F46E5', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 8, alignItems: 'center' }}
                                      onPress={() => setSolicitudClichesVisible(true)}
                                    >
                                      <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>{t('cliches.modalTitle')}</Text>
                                    </TouchableOpacity>
                                  )}
                                  </>
                                )}
                              </>
                            ) : (
                              <>
                                <TouchableOpacity style={[styles.pdfProduccionGenerateBtn, isLoading2 && { opacity: 0.6 }]} onPress={() => handleDescargarTool(title)} disabled={!!isLoading2}>
                                  <Text style={styles.pdfProduccionGenerateBtnText}>{isLoading2 ? '…' : `⬇ ${t('screens.pedidoDetalle.pdf-produccionGenerarBtn')}`}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => fileInputPdfProduccionRefs.current[tipoKey2] && fileInputPdfProduccionRefs.current[tipoKey2].click()} style={styles.pdfProduccionUploadBtn}>
                                  <Text style={styles.pdfProduccionUploadBtnText}>↑ {t('screens.pedidoDetalle.pdf-produccionSubirBtn')}</Text>
                                </TouchableOpacity>
                              </>
                            )}
                          </View>
                          {Platform.OS === 'web' && (
                            <input type="file" accept=".pdf" style={{ display: 'none' }}
                              ref={(el) => { fileInputPdfProduccionRefs.current[tipoKey2] = el; }}
                              onChange={(e) => { if (e.target.files[0]) handleUploadPdfProduccion(tipoKey2, e.target.files[0]); }}
                            />
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
                </View>{/* fin col pdf-produccion */}

                {/* ── Artes Finales del Cliente ── */}
                <View style={{ flexBasis: Platform.OS === 'web' ? '50%' : '100%', paddingRight: 10, marginBottom: 10 }}>
                <View style={styles.sectionCard}>
                  <View style={styles.fileSectionHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 6 }}>
                      <Text style={styles.filesSectionLabel}>{t('screens.pedidoDetalle.artesTitle')}</Text>
                      {archivos.artes.length > 0 && (
                        <View style={styles.fileCountBadge}>
                          <Text style={styles.fileCountBadgeText}>{archivos.artes.length}</Text>
                        </View>
                      )}
                    </View>
                    {uploadingArtes
                      ? <ActivityIndicator size="small" color="#FFFFFF" />
                      : (
                        <TouchableOpacity
                          style={styles.fileUploadIconBtn}
                          onPress={() => fileInputArtesRef.current && fileInputArtesRef.current.click()}
                        >
                          <Text style={styles.fileUploadIconBtnText}>+</Text>
                        </TouchableOpacity>
                      )
                    }
                  </View>

                  {Platform.OS === 'web' && (
                    <input
                      type="file"
                      ref={fileInputArtesRef}
                      style={{ display: 'none' }}
                      multiple
                      accept=".pdf,.ai,.eps,.jpg,.jpeg,.png"
                      onChange={(e) => handleUploadArtes(e.target.files)}
                    />
                  )}

                  {(archivosLoading && archivos.artes.length === 0 ? (
                    <ActivityIndicator size="small" color="#475569" />
                  ) : archivos.artes.length === 0 ? (
                    <Text style={styles.emptyFilesText}>{t('screens.pedidoDetalle.sinArtes')}</Text>
                  ) : (
                    archivos.artes.map((archivo) => {
                      const ext = (archivo.nombre_original || '').split('.').pop().toUpperCase().slice(0, 4);
                      return (
                        <View key={archivo.id} style={styles.fileRow}>
                          <View style={styles.fileIcon}>
                            <Text style={styles.fileIconText}>{ext}</Text>
                          </View>
                          <Text style={styles.fileName} numberOfLines={1}>{archivo.nombre_original}</Text>
                          <Text style={styles.fileMeta}>{formatearTamanio(archivo.tamanio)}</Text>
                          <TouchableOpacity
                            style={[styles.fileActionBtn, styles.fileDownloadBtn]}
                            onPress={() => { if (typeof window !== 'undefined') window.open(`${API_BASE}/api/archivos/${archivo.id}`, '_blank'); }}
                          >
                            <Text style={styles.fileActionBtnText}>↓</Text>
                          </TouchableOpacity>
                          {canDelete && (
                            confirmingDeleteArchivo === archivo.id ? (
                              <DeleteConfirmRow
                                onCancel={() => setConfirmingDeleteArchivo(null)}
                                onConfirm={() => { setConfirmingDeleteArchivo(null); ejecutarEliminarArchivo(archivo.id); }}
                              />
                            ) : (
                              <TouchableOpacity
                                style={[styles.fileActionBtn, styles.fileDeleteBtn]}
                                onPress={() => setConfirmingDeleteArchivo(archivo.id)}
                              >
                                <Text style={styles.fileActionBtnText}>✕</Text>
                              </TouchableOpacity>
                            )
                          )}
                        </View>
                      );
                    })
                  ))}
                </View>{/* fin artes sectionCard */}

                </View>{/* fin col artes */}

                {/* ── Comparador de PDF ── */}
                <View style={{ flexBasis: Platform.OS === 'web' ? '50%' : '100%', paddingRight: 10, marginBottom: 10 }}>
                {(() => {
                  const PDF_PRODUCCION_TIPOS = ['report', 'repetidora', 'trapping', 'troquel'];
                  const PDF_PRODUCCION_LABELS = { report: 'Report', repetidora: 'Repetidora', trapping: 'Trapping', troquel: 'Troquel' };
                  const srcOptions = [
                    ...archivos.unitario.map((u) => ({ id: u.id, label: `Unitario v${u.version}` })),
                    ...PDF_PRODUCCION_TIPOS.filter((t) => archivos.pdfProduccion[t]).map((t) => ({ id: archivos.pdfProduccion[t].id, label: PDF_PRODUCCION_LABELS[t] })),
                  ];
                  const targetOptions = [
                    ...comparadorTargetFiles.filter((f) => f.tipo === 'unitario').map((u) => ({ id: u.id, label: `Unitario v${u.version}` })),
                    ...PDF_PRODUCCION_TIPOS.filter((t) => comparadorTargetFiles.some((f) => f.tipo === t)).map((t) => ({
                      id: comparadorTargetFiles.find((f) => f.tipo === t).id, label: PDF_PRODUCCION_LABELS[t],
                    })),
                  ];
                  const filtered = getFilteredComparadorPedidos();
                  const srcLabel  = srcOptions.find(o => o.id === comparadorSrcArchivoId)?.label;
                  const tgtLabel  = targetOptions.find(o => o.id === comparadorTargetArchivoId)?.label;
                  const isDisabled = !comparadorSrcArchivoId || !comparadorTargetArchivoId || comparadorSrcArchivoId === comparadorTargetArchivoId || comparadorRunning;
                  return (
                    <View style={styles.sectionCard}>
                      <View style={styles.fileSectionHeader}>
                        <Text style={styles.filesSectionLabel}>⇄ {t('screens.pedidoDetalle.comparadorTitle')}</Text>
                      </View>

                      {/* ── ORIGEN ── */}
                      <View style={{ paddingTop: 10 }}>
                        <Text style={styles.cmpSectionLabel}>{t('screens.pedidoDetalle.comparadorColTitleOrigen')}</Text>
                        {srcOptions.length === 0
                          ? <Text style={styles.cmpEmpty}>{t('screens.pedidoDetalle.comparadorSinArchivos')}</Text>
                          : <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                              {srcOptions.map((opt) => {
                                const isActive = comparadorSrcArchivoId === opt.id;
                                return (
                                  <TouchableOpacity
                                    key={opt.id}
                                    style={[styles.cmpPill, isActive && styles.cmpPillActive]}
                                    onPress={() => setComparadorSrcArchivoId((id) => id === opt.id ? null : opt.id)}
                                  >
                                    <Text style={[styles.cmpPillText, isActive && styles.cmpPillTextActive]}>
                                      {isActive ? '✓ ' : ''}{opt.label}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                        }
                      </View>

                      {/* ── Connector ── */}
                      <View style={styles.cmpConnector}>
                        <View style={styles.cmpConnectorLine} />
                        <Text style={styles.cmpConnectorArrow}>↓</Text>
                        <View style={styles.cmpConnectorLine} />
                      </View>

                      {/* ── DESTINO ── */}
                      <View>
                        <Text style={styles.cmpSectionLabel}>{t('screens.pedidoDetalle.comparadorColTitleDestino')}</Text>
                        {comparadorTargetPedido ? (
                          <>
                            <View style={styles.cmpTargetChip}>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.cmpTargetChipNum}>{comparadorTargetPedido.numero_pedido}</Text>
                                {(comparadorTargetPedido.referencia || comparadorTargetPedido.datos_presupuesto?.referencia)
                                  ? <Text style={styles.cmpTargetChipSub} numberOfLines={1}>{comparadorTargetPedido.referencia || comparadorTargetPedido.datos_presupuesto?.referencia}</Text>
                                  : null}
                              </View>
                              <TouchableOpacity onPress={clearTargetPedido} style={styles.cmpClearBtn}>
                                <Text style={styles.cmpClearBtnText}>✕</Text>
                              </TouchableOpacity>
                            </View>
                            {targetOptions.length === 0
                              ? <Text style={styles.cmpEmpty}>{t('screens.pedidoDetalle.comparadorSinPdf')}</Text>
                              : <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                  {targetOptions.map((opt) => {
                                    const isActive = comparadorTargetArchivoId === opt.id;
                                    return (
                                      <TouchableOpacity
                                        key={opt.id}
                                        style={[styles.cmpPill, isActive && styles.cmpPillActive]}
                                        onPress={() => setComparadorTargetArchivoId((id) => id === opt.id ? null : opt.id)}
                                      >
                                        <Text style={[styles.cmpPillText, isActive && styles.cmpPillTextActive]}>
                                          {isActive ? '✓ ' : ''}{opt.label}
                                        </Text>
                                      </TouchableOpacity>
                                    );
                                  })}
                                </View>
                            }
                          </>
                        ) : (
                          <>
                            <View style={styles.cmpSearchRow}>
                              <View style={[styles.cmpFieldGroup, { flex: 0.7 }]}>
                                <Text style={styles.cmpFieldLabel}>Nº</Text>
                                <TextInput
                                  style={styles.cmpSearchInput}
                                  placeholder="000"
                                  placeholderTextColor="#CBD5E1"
                                  value={comparadorSearchNumero}
                                  onChangeText={setComparadorSearchNumero}
                                  onFocus={loadComparadorPedidos}
                                />
                              </View>
                              <View style={styles.cmpFieldGroup}>
                                <Text style={styles.cmpFieldLabel}>{t('screens.pedidoDetalle.comparadorPlaceholderCliente')}</Text>
                                <TextInput
                                  style={styles.cmpSearchInput}
                                  placeholder="..."
                                  placeholderTextColor="#CBD5E1"
                                  value={comparadorSearchCliente}
                                  onChangeText={setComparadorSearchCliente}
                                  onFocus={loadComparadorPedidos}
                                />
                              </View>
                              <View style={styles.cmpFieldGroup}>
                                <Text style={styles.cmpFieldLabel}>{t('screens.pedidoDetalle.comparadorPlaceholderReferencia')}</Text>
                                <TextInput
                                  style={styles.cmpSearchInput}
                                  placeholder="..."
                                  placeholderTextColor="#CBD5E1"
                                  value={comparadorSearchNombre}
                                  onChangeText={setComparadorSearchNombre}
                                  onFocus={loadComparadorPedidos}
                                />
                              </View>
                            </View>
                            {(comparadorSearchNumero.trim() || comparadorSearchCliente.trim() || comparadorSearchNombre.trim()) && (
                              <View style={styles.cmpDropdown}>
                                {filtered.length === 0
                                  ? <Text style={styles.cmpDropdownEmpty}>{t('screens.pedidoDetalle.comparadorSinResultados')}</Text>
                                  : filtered.map((p) => {
                                      const esMismo = p.id === pedidoId;
                                      return (
                                        <TouchableOpacity
                                          key={p.id}
                                          style={[styles.cmpDropdownItem, esMismo && { backgroundColor: '#EEF2FF' }]}
                                          onPress={() => selectTargetPedido(p)}
                                        >
                                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            <Text style={styles.cmpDropdownNum}>#{p.numero_pedido}</Text>
                                            {esMismo && <Text style={{ fontSize: 9, fontWeight: '700', color: '#6366F1', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('screens.pedidoDetalle.comparadorEstePedido')}</Text>}
                                          </View>
                                          {(p.referencia || p.datos_presupuesto?.referencia) && (
                                            <Text style={styles.cmpDropdownSub} numberOfLines={1}>{p.referencia || p.datos_presupuesto?.referencia}</Text>
                                          )}
                                        </TouchableOpacity>
                                      );
                                    })
                                }
                              </View>
                            )}
                          </>
                        )}
                      </View>

                      {/* ── Status + Compare ── */}
                      <View style={{ marginTop: 4 }}>
                        <View style={styles.cmpStatusBar}>
                          {srcLabel
                            ? <Text style={styles.cmpStatusSeg} numberOfLines={1}>{srcLabel}</Text>
                            : <Text style={styles.cmpStatusSegEmpty}>— {t('screens.pedidoDetalle.comparadorColTitleOrigen').toLowerCase()}</Text>
                          }
                          <Text style={styles.cmpStatusArrow}>⇄</Text>
                          {comparadorTargetPedido && tgtLabel
                            ? <Text style={styles.cmpStatusSeg} numberOfLines={1}>{tgtLabel}</Text>
                            : comparadorTargetPedido
                              ? <Text style={styles.cmpStatusSegEmpty}>— pdf</Text>
                              : <Text style={styles.cmpStatusSegEmpty}>— {t('screens.pedidoDetalle.comparadorColTitleDestino').toLowerCase()}</Text>
                          }
                        </View>

                        <TouchableOpacity
                          style={[styles.cmpRunBtn, isDisabled && styles.cmpRunBtnDisabled]}
                          onPress={() => runComparison()}
                          disabled={isDisabled}
                        >
                          {comparadorRunning
                            ? <ActivityIndicator size="small" color="#FFFFFF" />
                            : <Text style={[styles.cmpRunBtnText, isDisabled && styles.cmpRunBtnTextDisabled]}>⇄ {t('screens.pedidoDetalle.comparadorBtnComparar')}</Text>
                          }
                        </TouchableOpacity>

                        {comparadorDiff && comparadorDiff.length > 0 && (
                          <TouchableOpacity style={styles.cmpViewResultBtn} onPress={() => setComparadorLightbox(true)}>
                            <Text style={styles.cmpViewResultBtnLabel}>{t('screens.pedidoDetalle.comparadorVerResultado')} →</Text>
                            <Text style={styles.cmpViewResultBtnSim}>{comparadorDiff[0]?.similarity}%</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })()}
                </View>{/* fin col comparador */}

                </View>{/* fin grid 2x2 */}

                </>
              )}

              </ScrollView>
            ) : null}
          </View>

          {/* ── Barra de acciones inferior ── */}
          {pedido && (
            <View style={styles.bottomBar}>
              <View style={styles.bottomDestructiveBtns}>
                {canDelete && !esFinalizado && !esCancelado && (
                  !confirmingDeletePedido ? (
                    <TouchableOpacity style={styles.bottomDeleteBtn} onPress={() => setConfirmingDeletePedido(true)}>
                      <Text style={styles.bottomDeleteBtnText}>{t('screens.pedidoDetalle.btnEliminar')}</Text>
                    </TouchableOpacity>
                  ) : (
                    <DeleteConfirmRow
                      size="md"
                      message={t('screens.pedidoDetalle.confirmEliminarPedido')}
                      onCancel={() => setConfirmingDeletePedido(false)}
                      onConfirm={() => { setConfirmingDeletePedido(false); ejecutarEliminarPedido(); }}
                    />
                  )
                )}
                {canCancelar && !esFinalizado && !esCancelado && (
                  !confirmingCancelarPedido ? (
                    <TouchableOpacity style={styles.bottomCancelarPedidoBtn} onPress={() => setConfirmingCancelarPedido(true)}>
                      <Text style={styles.bottomCancelarPedidoBtnText}>{t('screens.pedidoDetalle.btnCancelarPedido')}</Text>
                    </TouchableOpacity>
                  ) : (
                    <DeleteConfirmRow
                      size="md"
                      message={t('screens.pedidoDetalle.confirmCancelarPedido')}
                      cancelLabel={t('common.no')}
                      confirmLabel={t('screens.pedidoDetalle.btnCancelarPedidoSi')}
                      onCancel={() => setConfirmingCancelarPedido(false)}
                      onConfirm={ejecutarCancelarPedido}
                    />
                  )
                )}
              </View>
              <View style={styles.bottomMainBtns}>
                {!esFinalizado && !esCancelado && <TouchableOpacity
                  style={styles.bottomEditBtn}
                  onPress={async () => {
                    if (!pedido) return;
                    let fullPedido = pedido;
                    const pid = pedido.id || pedido.pedido_id || pedido._id || null;
                    if (pid) {
                      try {
                        const resp = await fetch(`${API_BASE}/api/pedidos/${pid}`);
                        if (resp.ok) fullPedido = await resp.json();
                      } catch (e) {}
                    }
                    setEditInitialValues(fullPedido);
                    setEditVisible(true);
                  }}
                >
                  <Text style={styles.bottomEditBtnText}>{t('screens.pedidoDetalle.btnEditar')}</Text>
                </TouchableOpacity>}
              </View>
            </View>
          )}
        </View>
      </View>

      {/* ── Lightbox Comparador ── */}
      {comparadorLightbox && comparadorDiff && comparadorDiff.length > 0 && (() => {
        const page = comparadorDiff[comparadorDiffPage] || {};
        const allSeps = page.sep_diffs || [];
        const allNames = allSeps.map((s) => s.nombre);
        const activeSeps = comparadorActiveSeps instanceof Set ? comparadorActiveSeps : new Set(allNames);
        const allActive = activeSeps.size === allNames.length;
        const showCanvas = Platform.OS === 'web' && comparadorViewMode !== 'diff' && !allActive && page.channels_a;
        const imgUri = comparadorViewMode === 'a'
          ? `data:image/jpeg;base64,${page.page_a_base64}`
          : comparadorViewMode === 'b'
            ? `data:image/jpeg;base64,${page.page_b_base64}`
            : `data:image/jpeg;base64,${page.diff_base64}`;
        const closeLightbox = () => {
          setComparadorLightbox(false);
          setCmpViewOnly(false);
          setCmpViewOnlyLoading(null);
          setComparadorAutoPlay(false);
          setComparadorActiveSeps(null);
          cmpZoomRef.current = 1.0; setComparadorZoom(1.0);
          cmpPanRef.current = { x: 0, y: 0 }; setComparadorPan({ x: 0, y: 0 });
          setComparadorRotation(0); setComparadorFlip(false);
          setCmpTool(null); setCmpEyedropResult(null);
          setCmpRulerPoints([]); setCmpRulerDist(null);
          cmpRulerDragging.current = null;
        };

        // ── Helpers: coordinate extraction ───────────────────────────────
        const getCmpCoords = (e, containerEl) => {
          const containerRect = (containerEl || e.currentTarget).getBoundingClientRect();
          const svgPctX = (e.clientX - containerRect.left) / containerRect.width;
          const svgPctY = (e.clientY - containerRect.top) / containerRect.height;
          const activeEl = showCanvas ? cmpCanvasRef.current : cmpImgRef.current;
          if (!activeEl) return null;
          const imgRect = activeEl.getBoundingClientRect();
          // For <img objectFit:contain>, getBoundingClientRect gives the CSS box (includes
          // letterbox bars). We need coords relative to the actual image content area.
          let cLeft, cTop, cW, cH;
          if (!showCanvas && activeEl.naturalWidth && activeEl.naturalHeight) {
            const natAR = activeEl.naturalWidth / activeEl.naturalHeight;
            const boxAR = imgRect.width / imgRect.height;
            if (natAR > boxAR) {
              // landscape: fills full width, letterbox top/bottom
              cW = imgRect.width;
              cH = imgRect.width / natAR;
              cLeft = imgRect.left;
              cTop  = imgRect.top + (imgRect.height - cH) / 2;
            } else {
              // portrait: fills full height, letterbox left/right
              cH = imgRect.height;
              cW = imgRect.height * natAR;
              cLeft = imgRect.left + (imgRect.width - cW) / 2;
              cTop  = imgRect.top;
            }
          } else {
            cLeft = imgRect.left; cTop = imgRect.top;
            cW = imgRect.width;   cH = imgRect.height;
          }
          const imgPctX = Math.max(0, Math.min(1, (e.clientX - cLeft) / cW));
          const imgPctY = Math.max(0, Math.min(1, (e.clientY - cTop)  / cH));
          return { svgPctX, svgPctY, imgPctX, imgPctY };
        };

        // ── Eyedropper sample (radius-averaged) ──────────────────────────
        const sampleEyedrop = async (e, containerEl) => {
          const coords = getCmpCoords(e, containerEl);
          if (!coords) return;
          const { imgPctX, imgPctY } = coords;
          const rad = cmpEyedropRadius;

          // Average pixels in (2r+1)² area on each channel
          const sampleGrayAvg = (tc, iw, ih, fx, fy) => {
            const cx = Math.round(fx * iw);
            const cy = Math.round(fy * ih);
            const x0 = Math.max(0, cx - rad);
            const y0 = Math.max(0, cy - rad);
            const w = Math.min(iw, cx + rad + 1) - x0;
            const h = Math.min(ih, cy + rad + 1) - y0;
            if (w <= 0 || h <= 0) return 128;
            const data = tc.getImageData(x0, y0, w, h).data;
            let sum = 0;
            for (let i = 0; i < data.length; i += 4) sum += data[i];
            return sum / (data.length / 4);
          };

          const seps = page.sep_diffs || [];
          const sampleChannels = (channelsData) => Promise.all(
            Object.entries(channelsData).map(([name, b64]) =>
              new Promise((resolve) => {
                const img = new window.Image();
                img.onload = () => {
                  try {
                    const tmp = document.createElement('canvas');
                    tmp.width = img.naturalWidth; tmp.height = img.naturalHeight;
                    const tc = tmp.getContext('2d');
                    tc.drawImage(img, 0, 0);
                    const avg = sampleGrayAvg(tc, img.naturalWidth, img.naturalHeight, imgPctX, imgPctY);
                    const inkPct = Math.round((255 - avg) / 255 * 100);
                    const sepInfo = seps.find((s) => s.nombre === name);
                    resolve({ name, inkPct, color: sepInfo?.color || '#94A3B8' });
                  } catch (_) { resolve({ name, inkPct: 0, color: '#94A3B8' }); }
                };
                img.onerror = () => resolve({ name, inkPct: 0, color: '#94A3B8' });
                img.src = `data:image/jpeg;base64,${b64}`;
              })
            )
          );

          const sampleDiam = rad * 2 + 1;

          // Diff mode: sample both A and B channels simultaneously
          if (comparadorViewMode === 'diff' && page.channels_a && Object.keys(page.channels_a).length > 0) {
            const [separationsA, separationsB] = await Promise.all([
              sampleChannels(page.channels_a),
              page.channels_b ? sampleChannels(page.channels_b) : Promise.resolve([]),
            ]);
            const totalInkA = separationsA.reduce((s, r) => s + r.inkPct, 0);
            const totalInkB = separationsB.reduce((s, r) => s + r.inkPct, 0);
            setCmpEyedropResult({ screenX: e.clientX, screenY: e.clientY, separationsA, separationsB, totalInkA, totalInkB, samplePx: sampleDiam * sampleDiam });
            return;
          }

          const channelsObj = comparadorViewMode === 'a' ? page.channels_a
            : comparadorViewMode === 'b' ? page.channels_b : null;

          if (channelsObj && Object.keys(channelsObj).length > 0) {
            // Maintain insertion order (from Object.entries / sep_diffs) — no re-sort
            const sorted = (await sampleChannels(channelsObj)).filter(Boolean);
            const totalInk = sorted.reduce((s, r) => s + r.inkPct, 0);
            setCmpEyedropResult({ screenX: e.clientX, screenY: e.clientY, separations: sorted, totalInk, samplePx: sampleDiam * sampleDiam });
          } else {
            // Fallback: sample composite → RGB→CMYK
            let r = 255, g = 255, b = 255;
            try {
              const sampleRGBAvg = (tc, w, h) => {
                const cx = Math.round(imgPctX * w);
                const cy = Math.round(imgPctY * h);
                const x0 = Math.max(0, cx - rad); const y0 = Math.max(0, cy - rad);
                const sw = Math.min(w, cx + rad + 1) - x0; const sh = Math.min(h, cy + rad + 1) - y0;
                if (sw <= 0 || sh <= 0) return [255, 255, 255];
                const d = tc.getImageData(x0, y0, sw, sh).data;
                let sr = 0, sg = 0, sb = 0;
                for (let i = 0; i < d.length; i += 4) { sr += d[i]; sg += d[i+1]; sb += d[i+2]; }
                const n = d.length / 4;
                return [Math.round(sr/n), Math.round(sg/n), Math.round(sb/n)];
              };
              if (showCanvas) {
                const cvs = cmpCanvasRef.current;
                [r, g, b] = sampleRGBAvg(cvs.getContext('2d'), cvs.width, cvs.height);
              } else {
                const el = cmpImgRef.current;
                if (el) {
                  const tmp = document.createElement('canvas');
                  tmp.width = el.naturalWidth; tmp.height = el.naturalHeight;
                  tmp.getContext('2d').drawImage(el, 0, 0);
                  [r, g, b] = sampleRGBAvg(tmp.getContext('2d'), el.naturalWidth, el.naturalHeight);
                }
              }
            } catch (_) {}
            const R = r / 255, G = g / 255, B = b / 255;
            const K = 1 - Math.max(R, G, B);
            const dK = K < 1 ? 1 - K : 1;
            const C  = K < 1 ? Math.round(((1 - R - K) / dK) * 100) : 0;
            const M  = K < 1 ? Math.round(((1 - G - K) / dK) * 100) : 0;
            const Y  = K < 1 ? Math.round(((1 - B - K) / dK) * 100) : 0;
            const Kp = Math.round(K * 100);
            const sampleDiam = rad * 2 + 1;
            setCmpEyedropResult({
              screenX: e.clientX, screenY: e.clientY, r, g, b,
              separations: [
                { name: 'Cyan',    inkPct: C,  color: '#00BCD4' },
                { name: 'Magenta', inkPct: M,  color: '#E91E63' },
                { name: 'Yellow',  inkPct: Y,  color: '#FFC107' },
                { name: 'Black',   inkPct: Kp, color: '#78909C' },
              ].filter((s) => s.inkPct > 0),
              totalInk: C + M + Y + Kp,
              samplePx: sampleDiam * sampleDiam,
            });
          }
        };

        // ── Mouse handlers ────────────────────────────────────────────────
        const handleImageAreaMouseDown = Platform.OS === 'web' ? (e) => {
          if (cmpTool === 'eyedropper') {
            e.preventDefault(); // prevent browser image-drag ghost
            cmpEyedropDragging.current = true;
            sampleEyedrop(e, e.currentTarget);
          } else if (cmpTool === 'ruler' && cmpRulerPoints.length > 0) {
            // Check if click is near an existing ruler point (within 16px)
            const containerRect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - containerRect.left;
            const clickY = e.clientY - containerRect.top;
            for (let i = 0; i < cmpRulerPoints.length; i++) {
              const pt = cmpRulerPoints[i];
              const ptX = pt.svgPctX * containerRect.width;
              const ptY = pt.svgPctY * containerRect.height;
              const dist = Math.sqrt((clickX - ptX) ** 2 + (clickY - ptY) ** 2);
              if (dist < 16) {
                e.preventDefault();
                cmpRulerDragging.current = i;
                cmpRulerDragging._wasDragging = false; // will be set true on first move
                return;
              }
            }
          }
        } : undefined;

        const handleImageAreaMouseMove = Platform.OS === 'web' ? (e) => {
          if (cmpTool === 'eyedropper' && cmpEyedropDragging.current) {
            sampleEyedrop(e, e.currentTarget);
          } else if (cmpTool === 'ruler' && cmpRulerDragging.current !== null) {
            cmpRulerDragging._wasDragging = true; // mark so click handler skips
            const coords = getCmpCoords(e, e.currentTarget);
            if (!coords) return;
            const idx = cmpRulerDragging.current;
            setCmpRulerPoints((prev) => {
              const next = [...prev];
              next[idx] = { ...next[idx], svgPctX: coords.svgPctX, svgPctY: coords.svgPctY, imgPctX: coords.imgPctX, imgPctY: coords.imgPctY };
              if (next.length === 2) {
                const result = calcRulerDist(next);
                if (result) setCmpRulerDist(result);
              }
              return next;
            });
          }
        } : undefined;

        const handleImageAreaMouseUp = Platform.OS === 'web' ? () => {
          cmpEyedropDragging.current = false;
          cmpRulerDragging.current = null;
        } : undefined;

        // Helper: compute mm distance between two ruler points
        const calcRulerDist = (pts) => {
          if (pts.length < 2) return null;
          const pg = comparadorDiff[comparadorDiffPage];
          const dims = pg?.page_a_dims
            || (pg?.page_a_boxes?.media?.width_pt ? pg.page_a_boxes.media : null);
          if (!dims?.width_pt || !dims?.height_pt) {
            // Fallback: convert pixels to mm using fixed render DPI (5.0 × 72 = 360 DPI)
            const activeEl = showCanvas ? cmpCanvasRef.current : cmpImgRef.current;
            const imgW = activeEl ? (showCanvas ? activeEl.width : activeEl.naturalWidth) : 0;
            const imgH = activeEl ? (showCanvas ? activeEl.height : activeEl.naturalHeight) : 0;
            if (!imgW) return null;
            const MM_PER_PX = 25.4 / (7.0 * 72);
            const dx_px = Math.abs((pts[1].imgPctX - pts[0].imgPctX) * imgW);
            const dy_px = Math.abs((pts[1].imgPctY - pts[0].imgPctY) * imgH);
            const dist_px = Math.sqrt(dx_px * dx_px + dy_px * dy_px);
            return { dx_mm: (dx_px * MM_PER_PX).toFixed(2), dy_mm: (dy_px * MM_PER_PX).toFixed(2), dist_mm: (dist_px * MM_PER_PX).toFixed(2), unit: 'mm' };
          }
          const dx_pt = (pts[1].imgPctX - pts[0].imgPctX) * dims.width_pt;
          const dy_pt = (pts[1].imgPctY - pts[0].imgPctY) * dims.height_pt;
          const dx_mm = Math.abs(dx_pt * 25.4 / 72);
          const dy_mm = Math.abs(dy_pt * 25.4 / 72);
          const dist_mm = Math.sqrt(dx_pt * dx_pt + dy_pt * dy_pt) * 25.4 / 72;
          return { dx_mm: dx_mm.toFixed(2), dy_mm: dy_mm.toFixed(2), dist_mm: dist_mm.toFixed(2), unit: 'mm' };
        };

        const handleImageAreaClick = Platform.OS === 'web' ? (e) => {
          if (cmpTool !== 'ruler') return;
          // Skip click if it was the end of a drag (dragging ref is cleared in mouseup,
          // but onClick fires after mouseup — use a tiny flag to distinguish)
          if (cmpRulerDragging._wasDragging) { cmpRulerDragging._wasDragging = false; return; }
          // Ruler: click to place points
          const coords = getCmpCoords(e, e.currentTarget);
          if (!coords) return;
          const { svgPctX, svgPctY, imgPctX, imgPctY } = coords;
          setCmpRulerPoints((prev) => {
            const pt = { svgPctX, svgPctY, imgPctX, imgPctY };
            const next = prev.length >= 2 ? [pt] : [...prev, pt];
            if (next.length === 2) {
              const result = calcRulerDist(next);
              setCmpRulerDist(result);
            } else {
              setCmpRulerDist(null);
            }
            return next;
          });
        } : undefined;
        const setCmpZoom = (newZ) => {
          cmpZoomRef.current = newZ;
          setComparadorZoom(newZ);
          if (newZ <= 1) { cmpPanRef.current = { x: 0, y: 0 }; setComparadorPan({ x: 0, y: 0 }); }
        };
        const toggleSep = (nombre) => {
          const current = comparadorActiveSeps instanceof Set ? comparadorActiveSeps : new Set(allNames);
          const next = new Set(current);
          if (next.has(nombre)) { if (next.size > 1) next.delete(nombre); }
          else next.add(nombre);
          setComparadorActiveSeps(next.size === allNames.length ? null : next);
        };
        const isPanning = comparadorZoom > 1;
        const imgTransform = [
          { translateX: comparadorPan.x },
          { translateY: comparadorPan.y },
          { scale: comparadorZoom },
          { rotate: `${comparadorRotation}deg` },
          { scaleX: comparadorFlip ? -1 : 1 },
        ];
        const cmpWebTransform = `translate(${comparadorPan.x}px, ${comparadorPan.y}px) scale(${comparadorZoom}) rotate(${comparadorRotation}deg) scaleX(${comparadorFlip ? -1 : 1})`;
        return (
          <Modal visible={true} transparent animationType="fade" onRequestClose={closeLightbox}>
            <View style={styles.cmpLightboxOverlay}>
              {/* Header — 3 columnas: izquierda | centro | derecha */}
              <View style={styles.cmpLightboxHeader}>
                {/* Izquierda: similitud + páginas */}
                <View style={styles.cmpLightboxLeft}>
                  {!cmpViewOnly && <Text style={styles.cmpLightboxSimilarity}>{page.similarity}% {t('screens.pedidoDetalle.comparadorSimilitud')}</Text>}
                  {comparadorDiff.length > 1 && (
                    <View style={styles.cmpPageNav}>
                      <TouchableOpacity onPress={() => setComparadorDiffPage((p) => Math.max(0, p - 1))} disabled={comparadorDiffPage === 0}>
                        <Text style={[styles.cmpPageNavBtn, comparadorDiffPage === 0 && { color: '#64748B' }]}>‹</Text>
                      </TouchableOpacity>
                      <Text style={[styles.cmpPageNavText, { color: '#F1F5F9' }]}>{comparadorDiffPage + 1}/{comparadorDiff.length}</Text>
                      <TouchableOpacity onPress={() => setComparadorDiffPage((p) => Math.min(comparadorDiff.length - 1, p + 1))} disabled={comparadorDiffPage === comparadorDiff.length - 1}>
                        <Text style={[styles.cmpPageNavBtn, comparadorDiffPage === comparadorDiff.length - 1 && { color: '#64748B' }]}>›</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                {/* Centro: botones de modo */}
                <View style={styles.cmpLightboxCenter}>
                  {!cmpViewOnly && [
                    { key: 'diff', label: '⊕ Diferencias' },
                    { key: 'a',    label: 'PDF A' },
                    { key: 'b',    label: 'PDF B' },
                  ].map((m) => (
                    <TouchableOpacity key={m.key}
                      style={[styles.cmpLightboxModeBtn, comparadorViewMode === m.key && styles.cmpLightboxModeBtnActive]}
                      onPress={() => { setComparadorViewMode(m.key); setComparadorAutoPlay(false); }}>
                      <Text style={[styles.cmpLightboxModeBtnText, comparadorViewMode === m.key && styles.cmpLightboxModeBtnTextActive]}>{m.label}</Text>
                    </TouchableOpacity>
                  ))}
                  {!cmpViewOnly && (
                    <TouchableOpacity
                      style={[styles.cmpLightboxModeBtn, comparadorAutoPlay && styles.cmpLightboxModeBtnAuto]}
                      onPress={() => {
                        const next = !comparadorAutoPlay;
                        setComparadorAutoPlay(next);
                        if (next && comparadorViewMode === 'diff') setComparadorViewMode('a');
                      }}>
                      <Text style={[styles.cmpLightboxModeBtnText, comparadorAutoPlay && styles.cmpLightboxModeBtnTextActive]}>⟳ A↔B</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {/* Derecha: herramientas + zoom + cerrar */}
                <View style={styles.cmpLightboxRight}>
                  {/* Tool: eyedropper */}
                  <TouchableOpacity
                    style={[styles.cmpZoomBtn, cmpTool === 'eyedropper' && styles.cmpToolBtnActive]}
                    onPress={() => { setCmpTool(t => t === 'eyedropper' ? null : 'eyedropper'); setCmpEyedropResult(null); cmpEyedropDragging.current = false; }}
                    title="Cuentagotas de tinta"
                  >
                    {Platform.OS === 'web' ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill={cmpTool === 'eyedropper' ? '#FACC15' : '#CBD5E1'}>
                        <path d="M20.71 5.63l-2.34-2.34a1 1 0 0 0-1.41 0l-3.12 3.12-1.41-1.42-1.42 1.42 1.41 1.41L7.82 12.42A2 2 0 0 0 7.24 14v2.76l-2.12 2.12 1.41 1.41 2.12-2.12H11a2 2 0 0 0 1.41-.59l6.6-6.59 1.41 1.41 1.42-1.42-1.41-1.41 3.12-3.12a1 1 0 0 0-.84-1.66z"/>
                        <circle cx="4.5" cy="19.5" r="1.5"/>
                      </svg>
                    ) : (
                      <Text style={[styles.cmpZoomBtnText, cmpTool === 'eyedropper' && { color: '#FACC15' }]}>⊙</Text>
                    )}
                  </TouchableOpacity>
                  {/* Radius control — visible only when eyedropper active */}
                  {cmpTool === 'eyedropper' && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#1E1B4B', borderRadius: 6, paddingHorizontal: 4, paddingVertical: 2 }}>
                      <TouchableOpacity onPress={() => setCmpEyedropRadius(r => Math.max(1, r - 1))} style={{ padding: 2 }}>
                        <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '700' }}>−</Text>
                      </TouchableOpacity>
                      <Text style={{ color: '#FACC15', fontSize: 10, fontWeight: '700', minWidth: 20, textAlign: 'center' }}>{(cmpEyedropRadius * 2 + 1)}px</Text>
                      <TouchableOpacity onPress={() => setCmpEyedropRadius(r => Math.min(10, r + 1))} style={{ padding: 2 }}>
                        <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '700' }}>＋</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {/* Tool: ruler */}
                  <TouchableOpacity
                    style={[styles.cmpZoomBtn, cmpTool === 'ruler' && styles.cmpToolBtnActive]}
                    onPress={() => { setCmpTool(t => t === 'ruler' ? null : 'ruler'); setCmpRulerPoints([]); setCmpRulerDist(null); }}
                    title="Regla de medición"
                  >
                    <Text style={[styles.cmpZoomBtnText, cmpTool === 'ruler' && { color: '#FACC15' }]}>📏</Text>
                  </TouchableOpacity>
                  <View style={{ width: 1, height: 18, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 2 }} />
                  {/* Rotate */}
                  <TouchableOpacity
                    style={styles.cmpZoomBtn}
                    onPress={() => setComparadorRotation(r => (r + 90) % 360)}
                    title="Rotar 90°"
                  >
                    <Text style={styles.cmpZoomBtnText}>↻</Text>
                  </TouchableOpacity>
                  {/* Flip horizontal */}
                  <TouchableOpacity
                    style={[styles.cmpZoomBtn, comparadorFlip && styles.cmpToolBtnActive]}
                    onPress={() => setComparadorFlip(f => !f)}
                    title="Voltear horizontal"
                  >
                    <Text style={[styles.cmpZoomBtnText, comparadorFlip && { color: '#FACC15' }]}>⇆</Text>
                  </TouchableOpacity>
                  <View style={{ width: 1, height: 18, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 2 }} />
                  <TouchableOpacity style={styles.cmpZoomBtn} onPress={() => setCmpZoom(Math.min(4, parseFloat((comparadorZoom + 0.25).toFixed(2))))}>
                    <Text style={styles.cmpZoomBtnText}>＋</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.cmpZoomBtn, { paddingHorizontal: 6, width: 'auto' }]} onPress={() => setCmpZoom(1.0)}>
                    <Text style={[styles.cmpZoomBtnText, { fontSize: 10 }]}>{Math.round(comparadorZoom * 100)}%</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cmpZoomBtn} onPress={() => setCmpZoom(Math.max(0.25, parseFloat((comparadorZoom - 0.25).toFixed(2))))}>
                    <Text style={styles.cmpZoomBtnText}>－</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cmpLightboxCloseBtn} onPress={closeLightbox}>
                    <Text style={styles.cmpLightboxCloseBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Page boxes info bar — always visible */}
              <View style={styles.cmpPageBoxBar}>
                {/* PDF A boxes */}
                {(() => {
                  const ab = page.page_a_boxes;
                  if (!ab || !ab.media) return (
                    <Text style={{ fontSize: 10, color: '#475569', fontStyle: 'italic' }}>
                      Sin datos de cajas — vuelve a comparar para verlos
                    </Text>
                  );
                  const trimBox = ab.trim || ab.media;
                  if (!trimBox) return null;
                  const boxes = [{ label: 'Trim', box: trimBox }];
                  return (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
                      {!cmpViewOnly && <Text style={[styles.cmpPageBoxLabel, { fontSize: 10 }]}>A</Text>}
                      {boxes.map(x => (
                        <Text key={x.label} style={styles.cmpPageBoxItem}>
                          <Text style={styles.cmpPageBoxLabel}>{x.label} </Text>
                          {x.box.width_mm}×{x.box.height_mm}mm
                        </Text>
                      ))}
                      {ab.distortion && (
                        <Text style={[styles.cmpPageBoxItem, { color: '#F59E0B' }]}>
                          <Text style={{ fontWeight: '700', color: '#F59E0B' }}>⤡ </Text>
                          {ab.distortion.x !== ab.distortion.y
                            ? `${(ab.distortion.x * 100).toFixed(2)}% × ${(ab.distortion.y * 100).toFixed(2)}%`
                            : `${(ab.distortion.x * 100).toFixed(2)}%`}
                        </Text>
                      )}
                    </View>
                  );
                })()}
                {/* Divider */}
                {!cmpViewOnly && (page.page_a_boxes || page.page_b_boxes) && (
                  <View style={{ width: 1, height: 14, backgroundColor: '#1E1B4B', marginHorizontal: 4 }} />
                )}
                {/* PDF B boxes — hidden in view-only (same file as A) */}
                {!cmpViewOnly && (() => {
                  const bb = page.page_b_boxes;
                  if (!bb) return null;
                  const trimBox = bb.trim || bb.media;
                  if (!trimBox) return null;
                  const boxes = [{ label: 'Trim', box: trimBox }];
                  return (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
                      <Text style={[styles.cmpPageBoxLabel, { fontSize: 10, color: '#A78BFA' }]}>B</Text>
                      {boxes.map(x => (
                        <Text key={x.label} style={styles.cmpPageBoxItem}>
                          <Text style={[styles.cmpPageBoxLabel, { color: '#A78BFA' }]}>{x.label} </Text>
                          {x.box.width_mm}×{x.box.height_mm}mm
                        </Text>
                      ))}
                      {bb.distortion && (
                        <Text style={[styles.cmpPageBoxItem, { color: '#F59E0B' }]}>
                          <Text style={{ fontWeight: '700', color: '#F59E0B' }}>⤡ </Text>
                          {bb.distortion.x !== bb.distortion.y
                            ? `${(bb.distortion.x * 100).toFixed(2)}% × ${(bb.distortion.y * 100).toFixed(2)}%`
                            : `${(bb.distortion.x * 100).toFixed(2)}%`}
                        </Text>
                      )}
                    </View>
                  );
                })()}
                {/* Ruler result */}
                {cmpRulerDist && (
                  <Text style={[styles.cmpRulerResult, { marginLeft: 'auto' }]}>
                    {'⌗ '}{cmpRulerDist.dist_mm} {cmpRulerDist.unit}
                    {`  H: ${cmpRulerDist.dx_mm}  V: ${cmpRulerDist.dy_mm} ${cmpRulerDist.unit}`}
                  </Text>
                )}
                {/* Ruler waiting for second point */}
                {cmpTool === 'ruler' && cmpRulerPoints.length === 1 && !cmpRulerDist && (
                  <Text style={[styles.cmpRulerResult, { marginLeft: 'auto', color: '#64748B' }]}>⌗ Click para segundo punto…</Text>
                )}
              </View>


              {/* Body: sidebar izquierdo + imagen */}
              <View style={styles.cmpLightboxBody}>
                {/* Sidebar canales */}
                {allSeps.length > 0 && (
                  <View style={styles.cmpChannelSidebar}>
                    {allSeps.map((s) => {
                      const isActive = activeSeps.has(s.nombre);
                      const canToggle = comparadorViewMode !== 'diff';
                      return (
                        <TouchableOpacity
                          key={s.nombre}
                          style={[styles.cmpChannelBtn, !isActive && styles.cmpChannelBtnOff, s.tiene_diffs && isActive && styles.cmpChannelBtnAlert]}
                          onPress={() => canToggle && toggleSep(s.nombre)}
                          activeOpacity={canToggle ? 0.7 : 1}
                        >
                          <View style={[styles.cmpChannelSwatch, { backgroundColor: s.color || '#94A3B8', opacity: isActive ? 1 : 0.3 }]} />
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={[styles.cmpChannelName, !isActive && styles.cmpChannelNameOff]} numberOfLines={2}>{s.nombre}</Text>
                            <Text style={[styles.cmpChannelPct, s.tiene_diffs && isActive && styles.cmpChannelPctAlert]}>
                              {s.solo_en ? `solo en ${s.solo_en}` : `${s.similarity}%`}
                            </Text>
                          </View>
                          {s.tiene_diffs && isActive && <Text style={styles.cmpChannelAlertIcon}>!</Text>}
                          {!isActive && <Text style={styles.cmpChannelOffIcon}>✕</Text>}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Área de imagen paneable */}
                <View
                  style={[styles.cmpImageArea, Platform.OS === 'web' && {
                    cursor: cmpTool === 'eyedropper'
                      ? 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'%23fff\' stroke=\'%23000\' stroke-width=\'1\' d=\'M20.71 5.63l-2.34-2.34a1 1 0 0 0-1.41 0l-3.12 3.12-1.41-1.42-1.42 1.42 1.41 1.41L7.82 12.42A2 2 0 0 0 7.24 14v2.76l-2.12 2.12 1.41 1.41 2.12-2.12H11a2 2 0 0 0 1.41-.59l6.6-6.59 1.41 1.41 1.42-1.42-1.41-1.41 3.12-3.12a1 1 0 0 0-.84-1.66z\'/%3E%3Ccircle cx=\'4.5\' cy=\'19.5\' r=\'1.5\' fill=\'%23FACC15\'/%3E%3C/svg%3E") 4 20, crosshair'
                      : cmpTool === 'ruler'
                        ? 'crosshair'
                        : (isPanning ? 'grab' : 'default'),
                  }]}
                  {...cmpPanResponder.panHandlers}
                  onMouseDown={handleImageAreaMouseDown}
                  onMouseMove={handleImageAreaMouseMove}
                  onMouseUp={handleImageAreaMouseUp}
                  onMouseLeave={handleImageAreaMouseUp}
                  onClick={handleImageAreaClick}
                >
                  {showCanvas ? (
                    Platform.OS === 'web'
                      ? <canvas ref={cmpCanvasRef} draggable={false} onDragStart={e => e.preventDefault()} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', transform: cmpWebTransform, transformOrigin: 'center', display: 'block', userSelect: 'none' }} />
                      : <Image source={{ uri: imgUri }} style={[styles.cmpLightboxImage, { transform: imgTransform }]} resizeMode="contain" />
                  ) : Platform.OS === 'web' ? (
                    <img
                      ref={cmpImgRef}
                      src={imgUri}
                      alt=""
                      draggable={false}
                      onDragStart={e => e.preventDefault()}
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', transform: cmpWebTransform, transformOrigin: 'center', display: 'block', userSelect: 'none' }}
                    />
                  ) : (
                    <Image source={{ uri: imgUri }} style={[styles.cmpLightboxImage, { transform: imgTransform }]} resizeMode="contain" />
                  )}

                  {/* Ruler SVG overlay */}
                  {Platform.OS === 'web' && cmpRulerPoints.length > 0 && cmpRulerPoints[0].svgPctX != null && (() => {
                    const [p1, p2] = cmpRulerPoints;
                    const mx = p2 ? ((p1.svgPctX + p2.svgPctX) / 2 * 100).toFixed(1) : null;
                    const my = p2 ? ((p1.svgPctY + p2.svgPctY) / 2 * 100).toFixed(1) : null;
                    return (
                      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
                        {p2 && <line x1={`${p1.svgPctX * 100}%`} y1={`${p1.svgPctY * 100}%`} x2={`${p2.svgPctX * 100}%`} y2={`${p2.svgPctY * 100}%`} stroke="#FACC15" strokeWidth="1.5" strokeDasharray="6,3" />}
                        {cmpRulerPoints.map((pt, i) => (
                          <g key={i} style={{ pointerEvents: 'auto', cursor: 'grab' }}>
                            <circle cx={`${pt.svgPctX * 100}%`} cy={`${pt.svgPctY * 100}%`} r="8" fill="transparent" />
                            <circle cx={`${pt.svgPctX * 100}%`} cy={`${pt.svgPctY * 100}%`} r="5" fill="#FACC15" stroke="#0F172A" strokeWidth="1.5" />
                            <text x={`${pt.svgPctX * 100}%`} y={`${pt.svgPctY * 100}%`} dy="-10" fontSize="11" fill="#FACC15" textAnchor="middle" stroke="#0F172A" strokeWidth="3" paintOrder="stroke" fontWeight="700">{i === 0 ? 'A' : 'B'}</text>
                          </g>
                        ))}
                        {p2 && cmpRulerDist && (
                          <text x={`${mx}%`} y={`${my}%`} dy="-8" fontSize="12" fill="#FACC15" textAnchor="middle" stroke="#0F172A" strokeWidth="3" paintOrder="stroke" fontWeight="700">
                            {cmpRulerDist.dist_mm} {cmpRulerDist.unit}
                          </text>
                        )}
                      </svg>
                    );
                  })()}
                </View>

                {/* Eyedropper tooltip — positioned fixed within the modal overlay */}
                {Platform.OS === 'web' && cmpEyedropResult && cmpTool === 'eyedropper' && (() => {
                  const { screenX, screenY, r, g, b, separations, totalInk, separationsA, separationsB, totalInkA, totalInkB, samplePx } = cmpEyedropResult;

                  // ── Diff mode: dual A/B columns ──────────────────────────
                  if (separationsA) {
                    const allNames = [...new Set([...separationsA.map(s => s.name), ...(separationsB || []).map(s => s.name)])];
                    const tacColorA = totalInkA > 300 ? '#EF4444' : totalInkA > 240 ? '#F59E0B' : '#4ADE80';
                    const tacColorB = totalInkB > 300 ? '#EF4444' : totalInkB > 240 ? '#F59E0B' : '#4ADE80';
                    return (
                      <View pointerEvents="none" style={[styles.cmpEyedropTooltip, { position: 'fixed', left: screenX + 14, top: screenY - 80, minWidth: 220 }]}>
                        {/* Header */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 4 }}>
                          <View style={{ width: 10, height: 10, marginRight: 6 }} />
                          <Text style={{ fontSize: 11, color: '#6B7280', flex: 1 }}>Canal</Text>
                          <Text style={{ fontSize: 11, color: '#6366F1', fontWeight: '700', minWidth: 38, textAlign: 'right' }}>A</Text>
                          <Text style={{ fontSize: 11, color: '#A78BFA', fontWeight: '700', minWidth: 38, textAlign: 'right' }}>B</Text>
                        </View>
                        {allNames.map((name, i) => {
                          const a = separationsA.find(s => s.name === name);
                          const b2 = (separationsB || []).find(s => s.name === name);
                          return (
                            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                              <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: a?.color || b2?.color || '#9CA3AF', borderWidth: 1, borderColor: '#E5E7EB' }} />
                              <Text style={{ fontSize: 11, color: '#111827', flex: 1 }}>{name}</Text>
                              <Text style={{ fontSize: 12, color: '#6366F1', fontWeight: '700', minWidth: 38, textAlign: 'right' }}>{a != null ? `${a.inkPct}%` : '—'}</Text>
                              <Text style={{ fontSize: 12, color: '#A78BFA', fontWeight: '700', minWidth: 38, textAlign: 'right' }}>{b2 != null ? `${b2.inkPct}%` : '—'}</Text>
                            </View>
                          );
                        })}
                        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 4 }}>
                          <Text style={{ fontSize: 9, color: '#9CA3AF' }}>{samplePx}px²</Text>
                          <Text style={[styles.cmpEyedropTAC, { color: tacColorA }]}>A {totalInkA}%</Text>
                          <Text style={[styles.cmpEyedropTAC, { color: tacColorB }]}>B {totalInkB}%</Text>
                        </View>
                      </View>
                    );
                  }

                  // ── Single mode (A or B view) ─────────────────────────────
                  const tacColor = totalInk > 300 ? '#EF4444' : totalInk > 240 ? '#F59E0B' : '#4ADE80';
                  return (
                    <View pointerEvents="none" style={[styles.cmpEyedropTooltip, { position: 'fixed', left: screenX + 14, top: screenY - 80 }]}>
                      {/* RGB preview (fallback mode) */}
                      {(r != null) && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <View style={{ width: 16, height: 16, borderRadius: 3, backgroundColor: `rgb(${r},${g},${b})`, borderWidth: 1, borderColor: '#E5E7EB' }} />
                          <Text style={{ fontSize: 10, color: '#6B7280' }}>RGB {r} {g} {b}</Text>
                        </View>
                      )}
                      {/* Separation channels */}
                      {separations && separations.length > 0 ? (
                        separations.map((sep, i) => (
                          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: sep.color || '#9CA3AF', borderWidth: 1, borderColor: '#E5E7EB' }} />
                            <Text style={{ fontSize: 12, color: '#111827', fontWeight: '600', flex: 1 }}>{sep.name}</Text>
                            <Text style={{ fontSize: 13, color: '#111827', fontWeight: '800', minWidth: 36, textAlign: 'right' }}>{sep.inkPct}%</Text>
                          </View>
                        ))
                      ) : (
                        <Text style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>Sin datos de separación</Text>
                      )}
                      {/* TAC + sample size */}
                      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 4 }}>
                        <Text style={[styles.cmpEyedropTAC, { color: tacColor }]}>TAC: {totalInk}%</Text>
                        {samplePx != null && (
                          <Text style={{ fontSize: 9, color: '#9CA3AF' }}>{samplePx}px²</Text>
                        )}
                      </View>
                    </View>
                  );
                })()}
              </View>
            </View>
          </Modal>
        );
      })()}

      {/* ── Lightbox PDF ── */}
      {pdfLightboxUrl && (
        <Modal visible={true} transparent animationType="fade" onRequestClose={() => setPdfLightboxUrl(null)}>
          <View style={styles.lightboxOverlay}>
            <View style={styles.lightboxContent}>
              {Platform.OS === 'web' && (
                <iframe
                  src={pdfLightboxUrl}
                  style={{ width: '100%', height: '100%', border: 'none', colorScheme: 'light', backgroundColor: '#FFFFFF' }}
                  title={t('screens.pedidoDetalle.vistaPrevia')}
                />
              )}
              <TouchableOpacity style={styles.lightboxCloseBtn} onPress={() => setPdfLightboxUrl(null)}>
                <Text style={styles.lightboxCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </Modal>
    <NuevoPedidoModal
      visible={editVisible}
      onClose={() => { setEditVisible(false); setEditInitialValues(null); }}
      onSave={(p) => { setEditVisible(false); setEditInitialValues(null); cargarPedido(); if (typeof onEdit === 'function') onEdit(p); }}
      initialValues={editInitialValues}
      currentUser={currentUser}
      puedeCrear={canEdit}
    />
    <SolicitudClichesModal
      visible={solicitudClichesVisible}
      onClose={() => setSolicitudClichesVisible(false)}
      pedido={pedido}
      currentUser={currentUser}
    />
    </>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform, Image, Modal, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import NuevoTroquelModal from './NuevoTroquelModal';
import NuevaMaquinaModal from './NuevaMaquinaModal';
import EmptyState from '../components/EmptyState';
import CamposDinamicos from '../components/CamposDinamicos';
import { useSettings } from '../SettingsContext';
import { useMaquinas } from '../MaquinasContext';
import { useClientes } from '../ClientesContext';

const TINTAS_BASE_CMYK = [
    { label: 'C', color: '#00AEEF', isCMYK: true },
    { label: 'M', color: '#EC008C', isCMYK: true },
    { label: 'Y', color: '#FFF200', isCMYK: true },
    { label: 'K', color: '#232323', isCMYK: true }
];
const troquelEstado = ['Disponible', 'En uso'];
const troquelTipo = ['regular', 'irregular', 'corbata'];
const troquelForma = ['Rectangular', 'Circular', 'Irregular', 'Ovalado'];
const API_TROQUELES = 'http://localhost:8080/api/troqueles';

function borderColorState(value, isRequired, isNumeric = false, submitted = false) {
    if (!isRequired) return '#CCC';
    if ((value === undefined || value === null || value === '') && !submitted) return '#CCC';
    if ((value === undefined || value === null || value === '') && submitted) return '#D21820';
    if (isNumeric && value !== '' && !/^[0-9]+$/.test(value)) return '#D21820';
    if ((typeof value === 'string' && value.trim() === '') || (Array.isArray(value) && value.length === 0)) return submitted ? '#D21820' : '#CCC';
    return '#CBD5E1';
}

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeCif(value) {
    return (value || '').replace(/[\s-]/g, '').toUpperCase();
}

function isValidCif(value) {
    return /^[A-Z]\d{7}[A-Z0-9]$/.test(value);
}

function contrastText(hex) {
    if (!hex) return '#FFFFFF';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#1E293B' : '#FFFFFF';
}

const styles = {
    container: { paddingHorizontal: 12, paddingVertical: 12, flex: 1 },
    section: {
        marginBottom: 10,
        marginTop: 4,
        backgroundColor: '#FFF',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingBottom: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: '800',
        color: '#F1F5F9',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        backgroundColor: '#1E1B4B',
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginHorizontal: -12,
        marginBottom: 12,
    },
    divider: { borderBottomWidth: 1, borderBottomColor: '#E0E0E0', marginVertical: 8 },
    label: { fontSize: 11, color: '#94A3B8', fontWeight: '500', marginBottom: 4 },
    row: { flexDirection: 'row', gap: 12, marginBottom: 10, alignItems: 'flex-start' },
    col: { flex: 1 },
    input: (value, isRequired, isNumeric = false, submitted = false) => ({
        fontSize: 14,
        borderWidth: 1,
        borderColor: borderColorState(value, isRequired, isNumeric, submitted),
        backgroundColor: '#F1F5F9',
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 10,
        marginBottom: 10,
        fontFamily: 'System, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen"',
        color: '#0F172A'
    }),
    errorText: { color: '#D21820', fontSize: 13, marginTop: -5, marginBottom: 7, fontWeight: '500' },
    selectorRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
    bigBtn: {
        backgroundColor: '#F8FAFC', paddingHorizontal: 22, paddingVertical: 12,
        borderRadius: 10, borderWidth: 1.5, borderColor: '#E2E8F0',
        alignItems: 'center', minWidth: 130
    },
    bigBtnText: {
        color: '#475569', fontWeight: '600', fontSize: 14
    },
    tintaBtn: (active, tinta) => ({
        paddingHorizontal: 10, paddingVertical: 8,
        backgroundColor: active ? tinta.color : '#F1F5F9',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: active ? tinta.color : '#E2E8F0',
        marginRight: 8, marginBottom: 8, minWidth: 40, alignItems: 'center'
    }),
    tintaTxt: { fontWeight: '700', fontSize: 13, fontFamily: 'System, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen"' },
    tintaCounter: {
        marginTop: -4, marginBottom: 8, backgroundColor: '#E2E8F0', alignSelf: 'flex-start', paddingHorizontal: 18,
        paddingVertical: 7, borderRadius: 14, fontWeight: '700', fontSize: 16, color: '#444', letterSpacing: 0.5
    },
    coverageRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4, marginBottom: 8 },
    coverageBtn: (color) => ({
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22, borderWidth: 2,
        borderColor: color, backgroundColor: '#FBFBFD', marginRight: 8, marginBottom: 8, minWidth: 60, alignItems: 'center'
    }),
    coverageTxt: { color: '#0F172A', fontWeight: '700', fontSize: 15, fontFamily: 'System, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen"' },
    submitContainer: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 20, marginBottom: 20 },
    submitBtn: {
        backgroundColor: '#4F46E5', paddingHorizontal: 28, paddingVertical: 12,
        borderRadius: 10, borderWidth: 1.5, borderColor: '#4338CA',
        alignItems: 'center', minWidth: 160,
        shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 3,
    },
    submitText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
    etiquetaHalfCol: { width: 140, minHeight: 170, borderRadius: 14, marginRight: 10, resizeMode: 'contain', alignSelf: 'flex-start' },
    etiquetaBtn: { marginTop: 6, alignSelf: 'flex-start' },
    modalHeader: {
        backgroundColor: '#1E1B4B',
        paddingVertical: 14,
        paddingHorizontal: 16,
        position: 'relative',
        marginTop: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 12,
    },
    modalHeaderTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#F1F5F9',
    },
    modalCloseBtn: {
        position: 'absolute',
        right: 16,
        top: 14,
        padding: 4,
    },
    modalCloseText: {
        fontSize: 20,
        color: '#F1F5F9',
        fontWeight: '900',
    },
    clientePickerBtn: {
        borderWidth: 1,
        borderColor: '#CBD5E1',
        backgroundColor: '#FBFBFD',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    clientePickerBtnText: {
        fontSize: 14,
        color: '#0F172A',
        fontWeight: '600',
    },
    clientePickerHint: {
        fontSize: 12,
        color: '#475569',
        marginTop: -4,
        marginBottom: 10,
    },
    pickerModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        padding: 16,
    },
    pickerModalCard: {
        backgroundColor: '#FFF',
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        maxHeight: '75%',
        padding: 14,
    },
    pickerModalTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 10,
    },
    pickerItem: {
        borderWidth: 1,
        borderColor: '#E6E6E6',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 10,
        marginBottom: 8,
        backgroundColor: '#FBFBFD',
    },
    pickerItemTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
    },
    pickerItemSub: {
        fontSize: 12,
        color: '#475569',
        marginTop: 2,
    },
    pickerFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 6,
    },
    sugerenciasBox: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 10,
        backgroundColor: '#FFF',
        marginTop: -6,
        marginBottom: 10,
        maxHeight: 170,
    },
    sugerenciaItem: {
        paddingVertical: 9,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    sugerenciaTitulo: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0F172A',
    },
    sugerenciaSub: {
        fontSize: 12,
        color: '#475569',
        marginTop: 2,
    }
};

const BotonSelector = ({
    opciones,
    valorSeleccionado,
    onSelect,
    multiple = false,
    small,
    required,
    submitted,
    disabled = false,
}) => (
    <View style={styles.selectorRow}>
        {opciones.map((opcion) => {
            // Support both plain strings and {label, color} objects
            const label = typeof opcion === 'string' ? opcion : (opcion.label || '');
            const itemColor = typeof opcion === 'object' ? (opcion.color || null) : null;

            const active = multiple
                ? (Array.isArray(valorSeleccionado) && valorSeleccionado.includes(label))
                : valorSeleccionado === label;
            const sinSeleccion = multiple
                ? !(Array.isArray(valorSeleccionado) && valorSeleccionado.length > 0)
                : !valorSeleccionado;

            const activeBg = itemColor ? itemColor + '22' : '#E2E8F0';
            const activeBorder = itemColor || '#94A3B8';
            const borderColor = active
                ? activeBorder
                : (sinSeleccion && required && submitted ? '#D21820' : '#E2E8F0');

            return (
                <TouchableOpacity
                    key={label}
                    style={{
                        paddingHorizontal: small ? 10 : 14,
                        paddingVertical: small ? 6 : 8,
                        backgroundColor: active ? activeBg : '#F1F5F9',
                        borderRadius: 10,
                        borderWidth: active ? 1.5 : 1,
                        borderColor: borderColor,
                        marginRight: 8,
                        marginBottom: 8,
                        minWidth: small ? 55 : 70,
                        alignItems: 'center',
                        flexDirection: 'row',
                        gap: 5,
                    }}
                    onPress={() => {
                        if (disabled) return;
                        if (!multiple) {
                            onSelect(label);
                            return;
                        }
                        const actuales = Array.isArray(valorSeleccionado) ? valorSeleccionado : [];
                        const siguientes = active
                            ? actuales.filter((item) => item !== label)
                            : [...actuales, label];
                        onSelect(siguientes);
                    }}
                >
                    {active && itemColor && (
                        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: itemColor }} />
                    )}
                    <Text style={{
                        color: active ? (itemColor || '#0F172A') : '#475569',
                        fontWeight: active ? '700' : '500',
                        fontFamily: 'System, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen"',
                        fontSize: 13
                    }}>{label}</Text>
                </TouchableOpacity>
            );
        })}
    </View>
);

const TintasSelector = ({
    selectedTintas,
    setSelectedTintas,
    opcionesTintas = [],
    pantones = [],
    onRemovePantone,
    onStartAdd,
    addingPantone,
    addingValue,
    onChangeAdding,
    onConfirmAdding,
    addingMatchHex
    , disabled = false
}) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8, alignItems: 'flex-start' }}>
        {opcionesTintas.map((tinta) => {
            const active = selectedTintas.includes(tinta.label);
            return (
                <TouchableOpacity
                    key={tinta.label}
                    style={styles.tintaBtn(active, tinta)}
                    onPress={() => {
                        if (disabled) return;
                        setSelectedTintas(prev =>
                            active ? prev.filter(l => l !== tinta.label) : [...prev, tinta.label]
                        );
                    }}
                >
                    <Text style={[styles.tintaTxt, { color: active ? contrastText(tinta.color) : '#475569' }]}>{tinta.label}</Text>
                </TouchableOpacity>
            );
        })}

        {/* render pantone chips inline after CMYK */}
        {pantones.map((p, idx) => {
            const active = selectedTintas.includes(p.label);
            const tintaObj = { label: p.label, color: p.hex, isCMYK: false };
            return (
                <View key={`${p.label}-${idx}`} style={{ marginRight: 8, marginBottom: 8 }}>
                    <TouchableOpacity
                        style={[styles.tintaBtn(active, tintaObj), { backgroundColor: p.hex || (active ? '#E8E8EC' : '#FBFBFD') }]}
                        onPress={() => {
                            if (disabled) return;
                            setSelectedTintas(prev =>
                                active ? prev.filter(l => l !== p.label) : [...prev, p.label]
                            );
                        }}
                    >
                        <Text style={[styles.tintaTxt, { color: '#fff' }]}>{p.label}</Text>
                        {!disabled && (
                            <TouchableOpacity
                                onPress={() => typeof onRemovePantone === 'function' && onRemovePantone(idx)}
                                style={{ position: 'absolute', right: -6, top: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Text style={{ color: '#fff', fontSize: 12 }}>×</Text>
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>
                </View>
            );
        })}

        {addingPantone ? (
            <TextInput
                value={addingValue}
                onChangeText={onChangeAdding}
                placeholder="Nº Pantone"
                placeholderTextColor="#94A3B8"
                autoFocus
                onSubmitEditing={(e) => {
                    const txt = (e.nativeEvent && e.nativeEvent.text) || addingValue;
                    if (typeof onConfirmAdding === 'function') onConfirmAdding(txt);
                }}
                onBlur={() => {
                    if (typeof onConfirmAdding === 'function') onConfirmAdding(addingValue);
                }}
                style={{
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    borderRadius: 10,
                    minWidth: 70,
                    textAlign: 'center',
                    marginRight: 8,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: addingMatchHex ? 'transparent' : '#E2E8F0',
                    backgroundColor: addingMatchHex || '#F1F5F9',
                    color: addingMatchHex ? '#FFF' : '#0F172A',
                    fontSize: 13,
                }}
            />
        ) : (
            <TouchableOpacity
                style={{ paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0', marginRight: 8, marginBottom: 8, minWidth: 36, alignItems: 'center' }}
                onPress={() => {
                    if (disabled) return;
                    if (typeof onStartAdd === 'function') onStartAdd();
                }}
            >
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#475569' }}>+</Text>
            </TouchableOpacity>
        )}
    </View>
);

function calcularCoberturaAPI(imagen, selectedTintas) {
    const API_URL = 'http://localhost:8080/calcular-cobertura';
    const formData = new FormData();

    if (Platform.OS === 'web') {
        formData.append('imagen', imagen);
    } else {
        let imagenUri = imagen;
        let filename = imagenUri.split('/').pop() || "etiqueta.jpg";
        let ext = /\.(\w+)$/.exec(filename) ? /\.(\w+)$/.exec(filename)[1] : 'jpg';
        let type = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
        formData.append('imagen', {
            uri: imagenUri,
            name: filename,
            type: type
        });
    }
    formData.append('tintas', JSON.stringify(selectedTintas));

    return fetch(API_URL, {
        method: 'POST',
        body: formData
    }).then(async res => {
        if (!res.ok) throw new Error('Error: ' + res.status + " " + await res.text());
        return res.json();
    });
}

export default function NuevoPresupuestoModal({
    visible,
    onClose,
    onSave = () => {},
    modalTitle = 'Nuevo Presupuesto',
    submitLabel = 'Guardar Presupuesto',
    fechaLabel = 'Fecha',
    showFechaEntrega = false,
    fechaEntregaLabel = 'Fecha de entrega',
    showMaquinaField = false,
    maquinaLabel = 'Máquina',
    initialValues = null,
    readOnly = false,
    currentUser = null,
    puedeCrear = true,
    formTipo = 'presupuesto',
}) {
    const isReadOnly = !!readOnly;
    const { t } = useTranslation();
    const getNowDateStr = () => {
        const d = new Date();
        return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    };
    const getDatePlusDaysStr = (days) => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    };
    const [cliente, setCliente] = useState('');
    const [razonSocial, setRazonSocial] = useState('');
    const [cif, setCif] = useState('');
    const [personasContacto, setPersonasContacto] = useState('');
    const [email, setEmail] = useState('');
    const [fecha, setFecha] = useState(getNowDateStr());
    const [fechaEntrega, setFechaEntrega] = useState(getDatePlusDaysStr(7));
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [datePickerField, setDatePickerField] = useState('fecha');
    const [referencia, setReferencia] = useState('');
    const [vendedor, setVendedor] = useState(currentUser?.nombre || '');
    const [maquina, setMaquina] = useState('');
    const [material, setMaterial] = useState('');
    const [acabado, setAcabado] = useState([]);
    const [tirada, setTirada] = useState('');
    const [selectedTintas, setSelectedTintas] = useState([]);
    const [detalleTintaEspecial, setDetalleTintaEspecial] = useState([]);
    const [imagenCobertura, setImagenCobertura] = useState(null);
    const [etiquetaUri, setEtiquetaUri] = useState(null);
    const [troquelEstadoSel, setTroquelEstadoSel] = useState('');
    const [troquelFormaSel, setTroquelFormaSel] = useState('');
    const [troquelCoste, setTroquelCoste] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [coberturaResult, setCoberturaResult] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [camposExtra, setCamposExtra] = useState({});
    const [camposPersonalizados, setCamposPersonalizados] = useState([]);
    const [contenedoresFormulario, setContenedoresFormulario] = useState([]);
    const [baseLayoutData, setBaseLayoutData] = useState({});
    const [coberturaError, setCoberturaError] = useState('');
    const { clientes: rawClientes } = useClientes();
    const clientesGuardados = rawClientes || [];
    const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState(null);
    const [clienteExpandido, setClienteExpandido] = useState(false);
    const { maquinas: allMaquinas, recargarMaquinas } = useMaquinas();
    const maquinasActivas = useMemo(() => (allMaquinas || []).filter((m) => (m?.estado || 'Activa') === 'Activa'), [allMaquinas]);
    const { settings: ctxSettings } = useSettings();
    const [catalogos, setCatalogos] = useState({
        materiales: [],
        acabados: [],
        tintas_especiales: []
    });
    const [usuariosComerciales, setUsuariosComerciales] = useState([]);
    const [clientePickerVisible, setClientePickerVisible] = useState(false);
    const [busquedaCliente, setBusquedaCliente] = useState('');
    const [clienteInputFocused, setClienteInputFocused] = useState(false);
    const [troquelesCat, setTroquelesCat] = useState([]);
    const [troquelSel, setTroquelSel] = useState(null);
    const [showTroquelCreate, setShowTroquelCreate] = useState(false);
    const [showMaquinaCreate, setShowMaquinaCreate] = useState(false);

    // pedido id when editing
    const [pedidoId, setPedidoId] = useState(null);

    useEffect(() => {
        try { console.log('NuevoPresupuestoModal: initialValues changed ->', initialValues && (initialValues.id || initialValues.pedido_id || initialValues._id), 'visible=', visible); } catch(e) {}
        if (!initialValues) return;
        try {
            setPedidoId(initialValues.id || initialValues.pedido_id || null);
            setCliente(initialValues.datos_presupuesto?.cliente || initialValues.cliente || '');
            setRazonSocial(initialValues.datos_presupuesto?.razon_social || initialValues.razon_social || '');
            setCif(initialValues.datos_presupuesto?.cif || initialValues.cif || '');
            setPersonasContacto(initialValues.datos_presupuesto?.personas_contacto || initialValues.personas_contacto || '');
            setEmail(initialValues.datos_presupuesto?.email || initialValues.email || '');
            setFecha(initialValues.datos_presupuesto?.fecha || initialValues.fecha_pedido || initialValues.fecha || getNowDateStr());
            setFechaEntrega(initialValues.datos_presupuesto?.fecha || initialValues.fecha_entrega || initialValues.fechaEntrega || getDatePlusDaysStr(7));
            setReferencia(initialValues.referencia || initialValues.datos_presupuesto?.referencia || '');
            setVendedor(initialValues.datos_presupuesto?.vendedor || currentUser?.nombre || '');
            setMaquina(initialValues.datos_presupuesto?.maquina || initialValues.maquina || '');
            setMaterial(initialValues.datos_presupuesto?.material || initialValues.material || '');
            setAcabado(initialValues.datos_presupuesto?.acabado || initialValues.acabado || []);
            setTirada(initialValues.datos_presupuesto?.tirada || initialValues.tirada || '');
            const savedPantones = initialValues.datos_presupuesto?.pantones || initialValues.pantones || [];
            const savedSelectedTintas = initialValues.datos_presupuesto?.selectedTintas || initialValues.selectedTintas || [];
            const validPantoneLabels = new Set(savedPantones.map(p => p.label));
            const cmykLabels = new Set(['C', 'M', 'Y', 'K']);
            const filteredTintas = savedSelectedTintas.filter(l => cmykLabels.has(l) || validPantoneLabels.has(l));
            setPantones(savedPantones);
            setSelectedTintas(filteredTintas);
            setDetalleTintaEspecial(initialValues.datos_presupuesto?.detalleTintaEspecial || initialValues.detalleTintaEspecial || []);
            setTroquelEstadoSel(initialValues.datos_presupuesto?.troquelEstadoSel || initialValues.troquelEstadoSel || '');
            setTroquelFormaSel(initialValues.datos_presupuesto?.troquelFormaSel || initialValues.troquelFormaSel || '');
            setTroquelCoste(initialValues.datos_presupuesto?.troquelCoste || initialValues.troquelCoste || '');
            setObservaciones(initialValues.datos_presupuesto?.observaciones || initialValues.observaciones || '');
            setCamposExtra(initialValues.datos_presupuesto?.campos_extra || initialValues.campos_extra || {});
        } catch (e) {
            // ignore
        }
    }, [initialValues]);

    // Cargar campos personalizados + contenedores (se recarga cada vez que se abre el modal)
    useEffect(() => {
        if (!visible) return;
        const token = global.__MIAPP_ACCESS_TOKEN;
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        Promise.all([
            fetch(`http://localhost:8080/api/campos-formulario?form=${formTipo}`, { headers }).then(r => r.json()),
            fetch(`http://localhost:8080/api/contenedores-formulario?form=${formTipo}`, { headers }).then(r => r.json()),
            fetch(`http://localhost:8080/api/campos-base-layout?form=${formTipo}`, { headers }).then(r => r.json()),
        ]).then(([dCampos, dCont, dBase]) => {
            setCamposPersonalizados(dCampos.campos || []);
            setContenedoresFormulario(dCont.contenedores || []);
            setBaseLayoutData(dBase.layout || {});
        }).catch(() => {});
    }, [visible]);

    // Auto-select troquel when catalog loads (for editing existing pedidos)
    useEffect(() => {
        if (troquelesCat.length > 0 && !troquelSel && initialValues) {
            const troquelId = initialValues.datos_presupuesto?.troquelId || initialValues.troquelId;
            if (troquelId) {
                const found = troquelesCat.find(t => (t._id || t.id) === troquelId);
                if (found) handleTroquelSelect(found);
            }
        }
    }, [troquelesCat]);

    const emailNormalizado = (email || '').trim();
    const cifNormalizado = normalizeCif(cif);
    const emailVacio = emailNormalizado === '';
    const emailInvalido = emailNormalizado !== '' && !isValidEmail(emailNormalizado);
    const cifInvalido = cifNormalizado !== '' && !isValidCif(cifNormalizado);

    const parseDateString = (value) => {
        const [y, m, d] = String(value || '').split('-').map(Number);
        if (!y || !m || !d) return null;
        return new Date(y, m - 1, d);
    };

    const formatDateDisplay = (value) => {
        const [y, m, d] = String(value || '').split('-');
        if (!y || !m || !d) return value || '';
        return `${d}-${m}-${y}`;
    };

    const fechaCreacionObj = parseDateString(fecha);
    const fechaEntregaObj = parseDateString(fechaEntrega);
    const fechaEntregaAntesCreacion =
        !!showFechaEntrega &&
        !!fechaCreacionObj &&
        !!fechaEntregaObj &&
        fechaEntregaObj.getTime() < fechaCreacionObj.getTime();

    const comerciales = (usuariosComerciales || []).map((item) => item.nombre);
    const materiales = (catalogos.materiales || []).map((item) => item.valor).filter(Boolean);
    const acabados = (catalogos.acabados || []).map((item) => ({ label: item.valor || '', color: item.color || null })).filter((o) => o.label);
    const tintasEspeciales = (catalogos.tintas_especiales || []).map((item) => ({ label: item.valor || '', color: item.color || null })).filter((o) => o.label);
    const tintasEspecialesCount = Array.isArray(detalleTintaEspecial) ? detalleTintaEspecial.length : (detalleTintaEspecial ? 1 : 0);
    const numeroTintasSeleccionadas = selectedTintas.length + tintasEspecialesCount;
    const puedeSeleccionarMaquina = (itemMaquina) => {
        if (!showMaquinaField) return true;
        const coloresMaquina = Number(itemMaquina?.numero_colores || 0);
        if (numeroTintasSeleccionadas <= 0) return true;
        if (coloresMaquina <= 0) return true;
        return coloresMaquina >= numeroTintasSeleccionadas;
    };
    const maquinaSeleccionadaObj = (maquinasActivas || []).find((item) => item.nombre === maquina);
    const maquinaIncompatible = !!maquinaSeleccionadaObj && !puedeSeleccionarMaquina(maquinaSeleccionadaObj);
    const tintasOpciones = [...TINTAS_BASE_CMYK];
    // cargamos mapa de pantones generado por el script
    let PANTONE_MAP = {};
    try {
        PANTONE_MAP = require('../data/pantone_map.json');
    } catch (e) {
        PANTONE_MAP = {};
    }
    // three positional Pantone slots that replace the old P1/P2/P3 buttons
    const [pantones, setPantones] = useState([]); // dynamic list of added pantones
    const [pantoneInput, setPantoneInput] = useState('');
    const [addingPantone, setAddingPantone] = useState(false);

    const srgbToHex = (srgb) => {
        if (!srgb || srgb.length < 3) return '#EAEAEA';
        return '#' + srgb.map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
    };

    const findPantoneInMap = (text) => {
        if (!text) return null;
        const t = String(text).trim();
        const tries = [];
        // common variants
        if (/^\d+$/.test(t)) tries.push(`PANTONE ${t} C`);
        tries.push(t.toUpperCase());
        if (!t.toUpperCase().startsWith('PANTONE')) tries.push(`PANTONE ${t.toUpperCase()} C`);
        for (const k of tries) {
            if (PANTONE_MAP[k]) return { key: k, data: PANTONE_MAP[k] };
        }
        return null;
    };

    const addPantone = (text) => {
        const existing = findPantoneInMap(text);
        let label = text;
        let hex = '#EAEAEA';
        let found = false;
        if (existing) {
            found = true;
            label = `P. ${existing.key.replace(/PANTONE\s*/i, '').replace(/\s*C$/i, '').trim()} C`;
            hex = srgbToHex(existing.data.srgb);
        }
        const item = { key: label, label, hex, found };
        setPantones(prev => {
            const next = [...prev, item];
            return next;
        });
        // insert into selectedTintas after any CMYK entries, preserving other non-CMYK ordering
        setSelectedTintas(prev => {
            const prevCopy = Array.isArray(prev) ? [...prev] : [];
            // remove any existing occurrence of this label
            const filtered = prevCopy.filter(l => l !== item.label);
            // collect CMYK in order
            const cmykOrder = ['C', 'M', 'Y', 'K'];
            const cmyk = cmykOrder.filter(k => filtered.includes(k));
            const others = filtered.filter(l => !cmykOrder.includes(l));
            return [...cmyk, ...others, item.label];
        });
    };

    // removed addPantoneAt: pantones are appended correlatively after CMYK

    const removePantoneAt = (idx) => {
        setPantones(prev => {
            const copy = [...prev];
            const removed = copy.splice(idx, 1)[0];
            // remove from selectedTintas
            if (removed) {
                setSelectedTintas(sprev => (Array.isArray(sprev) ? sprev.filter(s => s !== removed.label) : []));
            }
            return copy;
        });
    };
    const parseTintasEspecialesTexto = (value) => {
        return (value || '')
            .split(',')
            .map((item) => item.trim())
            .filter((item, idx, arr) => item && arr.indexOf(item) === idx);
    };

    const cargarCatalogos = async () => {
        try {
            const authHdrs = {
                'Content-Type': 'application/json',
                'X-Empresa-Id': currentUser?.empresa_id || '1',
                'X-User-Id': currentUser?.id || 'admin',
                'X-Role': currentUser?.role || 'administrador',
            };
            const catRes = await fetch('http://localhost:8080/api/materiales/catalogo', { headers: authHdrs });
            const catData = catRes.ok ? await catRes.json() : { catalogo: [] };
            const catalogoMateriales = (catData.catalogo || []).map(item => ({ valor: item.nombre }));
            setCatalogos({
                materiales: catalogoMateriales.length > 0 ? catalogoMateriales : (ctxSettings.materiales || []),
                acabados: ctxSettings.acabados || [],
                tintas_especiales: ctxSettings.tintas_especiales || []
            });
        } catch {
            setCatalogos({
                materiales: [],
                acabados: ctxSettings.acabados || [],
                tintas_especiales: ctxSettings.tintas_especiales || []
            });
        }
    };

    const cargarUsuariosComerciales = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/usuarios?rol=comercial');
            const data = response.ok ? await response.json() : { usuarios: [] };
            let lista = Array.isArray(data.usuarios) ? data.usuarios : [];
            // Ensure the logged-in user always appears in the list
            if (currentUser?.nombre && !lista.some((u) => u.nombre === currentUser.nombre)) {
                lista = [{ id: currentUser.id || 'current', nombre: currentUser.nombre }, ...lista];
            }
            setUsuariosComerciales(lista);
        } catch {
            setUsuariosComerciales(currentUser?.nombre ? [{ id: currentUser.id || 'current', nombre: currentUser.nombre }] : []);
        }
    };

    const cargarTroqueles = async () => {
        try {
            const authHdrs = {
                'Content-Type': 'application/json',
                'X-Empresa-Id': currentUser?.empresa_id || '1',
                'X-User-Id': currentUser?.id || 'admin',
                'X-Role': currentUser?.role || 'administrador',
            };
            const resp = await fetch(API_TROQUELES, { headers: authHdrs });
            const data = resp.ok ? await resp.json() : { troqueles: [] };
            setTroquelesCat(data.troqueles || []);
        } catch {
            setTroquelesCat([]);
        }
    };

    const handleTroquelSelect = (troquel) => {
        setTroquelSel(troquel);
        if (troquel) {
            setTroquelEstadoSel(troquel.estado || '');
            setTroquelFormaSel(troquel.forma || '');
            setTroquelCoste('');
        } else {
            setTroquelEstadoSel('');
            setTroquelFormaSel('');
            setTroquelCoste('');
        }
    };

    useEffect(() => {
        if (visible) {
            cargarCatalogos();
            cargarUsuariosComerciales();
            cargarTroqueles();
        }
    }, [visible]);

    // Sync catalogos from context when settings change
    useEffect(() => {
        setCatalogos((prev) => ({
            ...prev,
            acabados: ctxSettings.acabados || [],
            tintas_especiales: ctxSettings.tintas_especiales || [],
        }));
    }, [ctxSettings]);

    const filtrarTexto = (value) => (value || '').toString().trim().toLowerCase();
    const terminoCliente = filtrarTexto(busquedaCliente);
    const clientesFiltrados = clientesGuardados.filter((item) => {
        if (!terminoCliente) return true;
        const nombre = filtrarTexto(item.nombre);
        const razonSocialDb = filtrarTexto(item.razon_social);
        const cifDb = filtrarTexto(item.cif);
        const contactoDb = filtrarTexto(item.personas_contacto);
        const emailDb = filtrarTexto(item.email);
        return (
            nombre.includes(terminoCliente) ||
            razonSocialDb.includes(terminoCliente) ||
            cifDb.includes(terminoCliente) ||
            contactoDb.includes(terminoCliente) ||
            emailDb.includes(terminoCliente)
        );
    });

    const seleccionarClienteGuardado = (item) => {
        if (isReadOnly) return;
        setClienteSeleccionadoId(item?.id || null);
        setCliente(item?.nombre || '');
        setRazonSocial(item?.razon_social || '');
        setCif(item?.cif || '');
        setPersonasContacto(item?.personas_contacto || '');
        setEmail(item?.email || '');
        setClientePickerVisible(false);
        setBusquedaCliente('');
        setClienteInputFocused(false);
        setClienteExpandido(false);
    };

    const pickImageEtiqueta = Platform.OS === 'web'
        ? (e) => {
            if (isReadOnly) return;
            if (e.target.files && e.target.files[0]) {
                setEtiquetaUri(URL.createObjectURL(e.target.files[0]));
                setImagenCobertura(e.target.files[0]);
                setCoberturaResult(null);
            }
        }
        : async () => {
            if (isReadOnly) return;
            const { launchImageLibraryAsync } = await import('expo-image-picker');
            let result = await launchImageLibraryAsync({ mediaTypes: 'Images', quality: 1 });
            if (!result.canceled) {
                setEtiquetaUri(result.assets[0].uri);
                setImagenCobertura(result.assets[0].uri);
                setCoberturaResult(null);
            }
        };

    const handleCalcularCobertura = async () => {
        if (isReadOnly) return;
        setCoberturaError('');
        if (!imagenCobertura) {
            setCoberturaError("Necesario subir un archivo de la etiqueta");
            return;
        }
        if (selectedTintas.length === 0) {
            setCoberturaError("Falta marcar al menos una tinta");
            return;
        }
        const cobertura = await calcularCoberturaAPI(imagenCobertura, selectedTintas);
        setCoberturaResult(cobertura);
    };

    useEffect(() => {
        setCoberturaError('');
    }, [imagenCobertura, selectedTintas]);

    const handleSubmit = () => {
        if (!puedeCrear) {
            Alert.alert(t('forms.permisoDenegado'), t('forms.sinPermisoPres'));
            return;
        }
        setSubmitted(true);
        if (emailVacio || emailInvalido || cifInvalido) {
            Alert.alert(t('common.error'), t('forms.errorEmailOrCif'));
            return;
        }

        const fechaEntregaValida = !showFechaEntrega || !!fechaEntrega;
        const maquinaValida = !showMaquinaField || !!maquina;
        if (fechaEntregaAntesCreacion) {
            Alert.alert(t('common.error'), t('forms.errorFechaEntrega'));
            return;
        }

        if (showMaquinaField && maquinaIncompatible) {
            Alert.alert(t('forms.maquinaIncompatibleTitle'), t('forms.maquinaIncompatibleMsg'));
            return;
        }

        const acabadoValido = Array.isArray(acabado) ? acabado.length > 0 : !!acabado;

        const missing = [];
        // Allow non-saved clients: require cliente name but don't force clienteSeleccionadoId
        if (!cliente) missing.push(t('forms.fieldCliente'));
        if (!referencia) missing.push(t('forms.fieldReferencia'));
        if (!material) missing.push(t('forms.material'));
        if (!acabadoValido) missing.push(t('forms.fieldAcabado'));
        if (!tirada) missing.push(t('forms.fieldTirada'));
        if (!(selectedTintas.length > 0)) missing.push(t('forms.tintas'));
        if (!fechaEntregaValida) missing.push(t('forms.fieldFechaEntrega'));
        if (!maquinaValida) missing.push(t('forms.fieldMaquina'));

        if (missing.length > 0) {
            Alert.alert(t('forms.missingFields'), t('forms.missingFieldsMsg') + ': ' + missing.join(', '));
            return;
        }

        if (cliente && referencia && material && acabadoValido && tirada && selectedTintas.length > 0 && fechaEntregaValida && maquinaValida) {
            // Clone arrays/objects to avoid passing references to component state
            const presupuesto = {
                id: Date.now(),
                numero: `PRE-${Math.floor(Math.random() * 10000)}`,
                cliente,
                razonSocial,
                cif: cifNormalizado,
                personasContacto,
                email: emailNormalizado,
                fecha,
                fechaEntrega,
                referencia,
                vendedor,
                maquina,
                maquina_id: maquinaSeleccionadaObj?.id || maquinaSeleccionadaObj?._id || null,
                campos_extra: camposExtra,
                material,
                acabado: Array.isArray(acabado) ? [...acabado] : acabado,
                tirada,
                selectedTintas: Array.isArray(selectedTintas) ? [...selectedTintas] : (selectedTintas || []),
                detalleTintaEspecial: Array.isArray(detalleTintaEspecial) ? [...detalleTintaEspecial] : (detalleTintaEspecial || []),
                coberturaResult: coberturaResult ? JSON.parse(JSON.stringify(coberturaResult)) : null,
                pantones: Array.isArray(pantones) ? pantones.map(p => ({ ...p })) : [],
                troquelEstadoSel,
                troquelFormaSel,
                troquelCoste,
                troquelId: troquelSel?._id || troquelSel?.id || null,
                observaciones
            };
            if (pedidoId) presupuesto.pedido_id = pedidoId;
            onSave(presupuesto);
            onClose();
        }
    };

    const onDateChange = (_event, selectedDate) => {
        if (Platform.OS !== 'ios') {
            setShowDatePicker(false);
        }
        if (!selectedDate) return;
        const yyyy = selectedDate.getFullYear();
        const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const dd = String(selectedDate.getDate()).padStart(2, '0');
        const valor = `${yyyy}-${mm}-${dd}`;
        if (datePickerField === 'fechaEntrega') {
            setFechaEntrega(valor);
        } else {
            setFecha(valor);
        }
    };

    const abrirDatePicker = (field) => {
        if (Platform.OS === 'web') return;
        setDatePickerField(field);
        setShowDatePicker(true);
    };

    const handleClose = () => {
        resetFormFields();
        onClose();
    };

    const resetFormFields = () => {
        setCliente('');
        setRazonSocial('');
        setCif('');
        setPersonasContacto('');
        setEmail('');
        setFecha(getNowDateStr());
        setFechaEntrega(getDatePlusDaysStr(7));
        setReferencia('');
        setVendedor('');
        setMaquina('');
        setMaterial('');
        setAcabado([]);
        setTirada('');
        setSelectedTintas([]);
        setDetalleTintaEspecial([]);
        setPantones([]);
        setAddingPantone(false);
        setPantoneInput('');
        setImagenCobertura(null);
        setEtiquetaUri(null);
        setTroquelEstadoSel('');
        setTroquelFormaSel('');
        setTroquelCoste('');
        setTroquelSel(null);
        setObservaciones('');
        setCoberturaResult(null);
        setSubmitted(false);
        setCoberturaError('');
        setClienteSeleccionadoId(null);
        setClienteExpandido(false);
        setClientePickerVisible(false);
        setBusquedaCliente('');
        setPedidoId(null);
    };

    // When opening modal for a new pedido (no initialValues), ensure the form is reset
    useEffect(() => {
        if (visible && !initialValues) {
            resetFormFields();
        }
    }, [visible, initialValues]);

    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 12 }}>
                <View style={{ width: '98%', height: '94%', backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1.5, borderColor: '#E2E8F0', overflow: 'hidden', flexDirection: 'column' }}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalHeaderTitle}>{modalTitle}</Text>
                    <TouchableOpacity onPress={handleClose} style={styles.modalCloseBtn}>
                        <Text style={styles.modalCloseText}>✕</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.container}>
                    {(() => {
                        // ── Helper: aplica baseLayout y renderiza filas de campos base ──
                        const layoutRows = (defCampos, renderMap) => {
                            const GAP = 12;
                            const COLS = 12;
                            const withLayout = defCampos.map(c => {
                                const ov = baseLayoutData[c.campo_id];
                                return { ...c, col: ov?.col ?? c.col, fila: ov?.fila ?? c.fila, ancho: ov?.ancho ?? c.ancho };
                            });
                            withLayout.sort((a, b) => (a.fila * 100 + a.col) - (b.fila * 100 + b.col));
                            const groups = {};
                            withLayout.forEach(c => { (groups[c.fila] = groups[c.fila] || []).push(c); });
                            const rows = Object.entries(groups)
                                .sort(([a], [b]) => Number(a) - Number(b))
                                .map(([fila, items]) => {
                                    const visibles = items.filter(item => renderMap[item.campo_id] != null);
                                    if (visibles.length === 0) return null;
                                    const cells = [];
                                    let cursor = 0;
                                    visibles.forEach(item => {
                                        const gap = item.col - cursor;
                                        if (gap > 0) {
                                            const spacerPct = `${((gap / COLS) * 100).toFixed(4)}%`;
                                            cells.push(<View key={`sp_${fila}_${item.col}`} style={{ flexBasis: spacerPct, flexShrink: 0, flexGrow: 0 }} />);
                                        }
                                        const pct = `${((item.ancho / COLS) * 100).toFixed(4)}%`;
                                        cells.push(
                                            <View key={item.campo_id} style={{ flexBasis: pct, flexShrink: 0, flexGrow: 0, paddingRight: GAP }}>
                                                {renderMap[item.campo_id]}
                                            </View>
                                        );
                                        cursor = item.col + item.ancho;
                                    });
                                    return (
                                        <View key={`fila_${fila}`} style={{ flexDirection: 'row', marginRight: -GAP, marginBottom: 8, alignItems: 'flex-start' }}>
                                            {cells}
                                        </View>
                                    );
                                }).filter(Boolean);
                            return <React.Fragment>{rows}</React.Fragment>;
                        };

                        const renderSeccionGeneral = (cont) => {
                            const campoCliente = (
                                <View>
                                    <Text style={styles.label}>{t('forms.cliente')}</Text>
                                    <TouchableOpacity style={[styles.clientePickerBtn, cliente ? { borderColor: '#475569', backgroundColor: '#EEF2F8' } : null]} onPress={() => { if (isReadOnly) return; setClientePickerVisible(true); }}>
                                        <Text style={[styles.clientePickerBtnText, cliente ? { color: '#334155', fontWeight: '700' } : null]}>{cliente ? (razonSocial || cliente) : t('forms.selectCliente')}</Text>
                                    </TouchableOpacity>
                                    {!cliente && <Text style={styles.clientePickerHint}>{t('forms.clienteHint')}</Text>}
                                </View>
                            );
                            const campoFecha = (
                                <View>
                                    <Text style={styles.label}>{fechaLabel}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <TextInput value={formatDateDisplay(fecha)} style={[styles.input(fecha, true, false, submitted), { flex: 1, marginBottom: 0 }]} editable={false} />
                                        {Platform.OS === 'web' ? (
                                            <View style={{ width: 38, height: 38, borderRadius: 8, borderWidth: 1, borderColor: '#CCC', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FBFBFD', position: 'relative' }}>
                                                <Text style={{ fontSize: 16 }}>📅</Text>
                                                <input type="date" value={fecha} onChange={(e) => { const valor = e?.target?.value || ''; if (!valor) return; setFecha(valor); }} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                                            </View>
                                        ) : (
                                            <TouchableOpacity onPress={() => abrirDatePicker('fecha')} style={{ width: 38, height: 38, borderRadius: 8, borderWidth: 1, borderColor: '#CCC', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FBFBFD' }}>
                                                <Text style={{ fontSize: 16 }}>📅</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            );
                            const campoEntrega = showFechaEntrega ? (
                                <View>
                                    <Text style={styles.label}>{fechaEntregaLabel}</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <TextInput value={formatDateDisplay(fechaEntrega)} style={[styles.input(fechaEntrega, true, false, submitted), { flex: 1, marginBottom: 0 }, submitted && fechaEntregaAntesCreacion ? { borderColor: '#D21820' } : null]} editable={false} />
                                        {Platform.OS === 'web' ? (
                                            <View style={{ width: 38, height: 38, borderRadius: 8, borderWidth: 1, borderColor: '#CCC', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FBFBFD', position: 'relative' }}>
                                                <Text style={{ fontSize: 16 }}>📅</Text>
                                                <input type="date" value={fechaEntrega} min={fecha || undefined} onChange={(e) => { const valor = e?.target?.value || ''; if (!valor) return; setFechaEntrega(valor); }} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                                            </View>
                                        ) : (
                                            <TouchableOpacity onPress={() => abrirDatePicker('fechaEntrega')} style={{ width: 38, height: 38, borderRadius: 8, borderWidth: 1, borderColor: '#CCC', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FBFBFD' }}>
                                                <Text style={{ fontSize: 16 }}>📅</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    {submitted && fechaEntregaAntesCreacion && <Text style={styles.errorText}>{t('forms.errorFechaEntrega')}</Text>}
                                </View>
                            ) : null;
                            const campoVendedor = (
                                <View>
                                    <Text style={styles.label}>{t('forms.comercial')}</Text>
                                    {Platform.OS === 'web' ? (
                                        <div style={{ borderWidth: 1, borderStyle: 'solid', borderColor: borderColorState(vendedor, true, false, submitted), backgroundColor: '#F1F5F9', borderRadius: 10, marginBottom: 10, overflow: 'hidden', padding: 0 }}>
                                            <select value={vendedor} onChange={(e) => { if (isReadOnly) return; setVendedor(e.target.value); }} disabled={isReadOnly} style={{ width: '100%', borderWidth: 0, backgroundColor: 'transparent', paddingTop: 4, paddingBottom: 4, paddingLeft: 8, paddingRight: 8, fontSize: 14, color: '#0F172A', outlineWidth: 0, WebkitAppearance: 'none', appearance: 'none', cursor: isReadOnly ? 'default' : 'pointer' }}>
                                                <option value="">{t('forms.selectComercial')}</option>
                                                {usuariosComerciales.map((u) => <option key={u.id || u.usuario_id || u.nombre} value={u.nombre}>{u.nombre}</option>)}
                                            </select>
                                        </div>
                                    ) : (
                                        <BotonSelector opciones={comerciales} valorSeleccionado={vendedor} onSelect={setVendedor} required={true} submitted={submitted} disabled={isReadOnly} />
                                    )}
                                </View>
                            );
                            const campoReferencia = (
                                <View>
                                    <Text style={styles.label}>{t('forms.referencia')}</Text>
                                    <TextInput value={referencia} onChangeText={(v) => { if (isReadOnly) return; setReferencia(v); }} placeholder={t('forms.refereciaPlaceholder')} placeholderTextColor="#94A3B8" style={styles.input(referencia, true, false, submitted)} editable={!isReadOnly} />
                                </View>
                            );
                            const renderMap = {
                                '__base_cliente':    campoCliente,
                                '__base_fecha':      campoFecha,
                                '__base_entrega':    campoEntrega,
                                '__base_vendedor':   campoVendedor,
                                '__base_referencia': campoReferencia,
                            };
                            return (
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>{cont?.nombre || t('forms.sectionGeneral')}</Text>
                                    {layoutRows([
                                        { campo_id: '__base_cliente',    col: 0, fila: 0, ancho: 6 },
                                        { campo_id: '__base_referencia', col: 6, fila: 0, ancho: 6 },
                                        { campo_id: '__base_fecha',      col: 0, fila: 1, ancho: 4 },
                                        { campo_id: '__base_entrega',    col: 4, fila: 1, ancho: 4 },
                                        { campo_id: '__base_vendedor',   col: 8, fila: 1, ancho: 4 },
                                    ], renderMap)}
                                    {!!cliente && (
                                        <View style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
                                            <TouchableOpacity onPress={() => setClienteExpandido(v => !v)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#F1F5F9' }}>
                                                <Text style={{ fontSize: 12, color: '#64748B', flex: 1 }} numberOfLines={1}>{[cif, personasContacto, email].filter(Boolean).join(' · ')}</Text>
                                                <Text style={{ fontSize: 12, color: '#475569', fontWeight: '600', marginLeft: 10 }}>{clienteExpandido ? t('forms.menosDatos') : t('forms.verDatos')}</Text>
                                            </TouchableOpacity>
                                            {clienteExpandido && (
                                                <View style={{ padding: 12, paddingTop: 8 }}>
                                                    <View style={{ flexDirection: 'row', gap: 16 }}>
                                                        <View style={styles.col}>
                                                            <Text style={styles.label}>{t('forms.razonSocial')}</Text>
                                                            <TextInput value={razonSocial} onChangeText={() => {}} placeholder={t('forms.razonSocialPlaceholder')} placeholderTextColor="#94A3B8" style={styles.input(razonSocial, false, false, submitted)} editable={false} />
                                                        </View>
                                                        <View style={styles.col}>
                                                            <Text style={styles.label}>{t('forms.cif')}</Text>
                                                            <TextInput value={cif} onChangeText={() => {}} placeholder={t('forms.cifPlaceholder')} placeholderTextColor="#94A3B8" style={[styles.input(cif, false, false, submitted), submitted && cifInvalido ? { borderColor: '#D21820' } : null]} editable={false} />
                                                            {submitted && cifInvalido && <Text style={styles.errorText}>{t('forms.errorCif')}</Text>}
                                                        </View>
                                                    </View>
                                                    <View style={{ flexDirection: 'row', gap: 16 }}>
                                                        <View style={styles.col}>
                                                            <Text style={styles.label}>{t('forms.personasContacto')}</Text>
                                                            <TextInput value={personasContacto} onChangeText={() => {}} placeholder={t('forms.personasContactoPlaceholder')} placeholderTextColor="#94A3B8" style={styles.input(personasContacto, false, false, submitted)} editable={false} />
                                                        </View>
                                                        <View style={styles.col}>
                                                            <Text style={styles.label}>{t('forms.email')}</Text>
                                                            <TextInput value={email} onChangeText={() => {}} placeholder={t('forms.emailPlaceholder')} placeholderTextColor="#94A3B8" style={[styles.input(email, false, false, submitted), submitted && emailInvalido ? { borderColor: '#D21820' } : null]} keyboardType="email-address" autoCapitalize="none" editable={false} />
                                                            {submitted && emailInvalido && <Text style={styles.errorText}>{t('forms.errorEmail')}</Text>}
                                                            {submitted && emailVacio && <Text style={styles.errorText}>{t('forms.errorEmailRequired')}</Text>}
                                                        </View>
                                                    </View>
                                                </View>
                                            )}
                                        </View>
                                    )}
                                </View>
                            );
                        };

                        const renderSeccionProducto = (cont) => {
                            const campoMaquina = showMaquinaField ? (
                                <View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <Text style={[styles.label, { marginBottom: 0 }]}>{maquinaLabel}</Text>
                                        {!isReadOnly && <TouchableOpacity onPress={() => setShowMaquinaCreate(true)} style={{ backgroundColor: '#EEF2F8', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}><Text style={{ color: '#475569', fontWeight: '600', fontSize: 13 }}>{t('forms.nuevaMaquina')}</Text></TouchableOpacity>}
                                    </View>
                                    {Platform.OS === 'web' ? (
                                        <View style={{ borderWidth: 1, borderColor: submitted && maquinaIncompatible ? '#D21820' : borderColorState(maquina, true, false, submitted), backgroundColor: '#F1F5F9', borderRadius: 10, marginBottom: 8, overflow: 'hidden' }}>
                                            <select value={maquina} onChange={(e) => setMaquina(e.target.value)} style={{ width: '100%', borderWidth: 0, backgroundColor: 'transparent', paddingTop: 8, paddingBottom: 8, paddingLeft: 10, paddingRight: 10, fontSize: 14, color: '#0F172A', outlineWidth: 0, cursor: 'pointer' }}>
                                                <option value="">{t('forms.selectMaquina')}</option>
                                                {maquinasActivas.map((m) => <option key={m.id} value={m.nombre}>{`${m.nombre} (${m.numero_colores || '-'} ${t('forms.colores')})${!puedeSeleccionarMaquina(m) ? ` ${t('forms.noCompatible')}` : ''}`}</option>)}
                                            </select>
                                        </View>
                                    ) : (
                                        <View style={styles.selectorRow}>
                                            {maquinasActivas.map((m) => { const activa = maquina === m.nombre; const habilitada = puedeSeleccionarMaquina(m); return <TouchableOpacity key={m.id} style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: activa ? '#E8E8EC' : '#FBFBFD', borderRadius: 22, borderWidth: 2, borderColor: submitted && activa && !habilitada ? '#D21820' : (activa ? '#E55A2B' : '#CCC'), marginRight: 8, marginBottom: 8, minWidth: 90, alignItems: 'center', opacity: habilitada ? 1 : 0.35 }} onPress={() => setMaquina(m.nombre)}><Text style={{ color: activa ? '#393B3F' : '#6C6C70', fontWeight: activa ? '700' : '500', fontSize: 13 }}>{`${m.nombre} (${m.numero_colores || '-'})`}</Text></TouchableOpacity>; })}
                                        </View>
                                    )}
                                    {submitted && !maquina && <Text style={styles.errorText}>{t('forms.errorMaquinaRequired')}</Text>}
                                    {submitted && maquinaIncompatible && <Text style={styles.errorText}>{t('forms.errorMaquinaIncompatible')} ({numeroTintasSeleccionadas}).</Text>}
                                </View>
                            ) : null;
                            const campoMaterial = (
                                <View>
                                    <Text style={styles.label}>{t('forms.material')}</Text>
                                    <BotonSelector opciones={materiales} valorSeleccionado={material} onSelect={setMaterial} required={true} submitted={submitted} disabled={isReadOnly} />
                                </View>
                            );
                            const campoAcabado = (
                                <View>
                                    <Text style={styles.label}>{t('forms.acabado')}</Text>
                                    <BotonSelector opciones={acabados} valorSeleccionado={acabado} onSelect={setAcabado} multiple={true} required={false} submitted={submitted} disabled={isReadOnly} />
                                </View>
                            );
                            const campoTirada = (
                                <View>
                                    <Text style={styles.label}>{t('forms.tirada')}</Text>
                                    <TextInput value={tirada} onChangeText={(v) => { if (isReadOnly) return; setTirada(v); }} keyboardType="numeric" placeholder={t('forms.tiradaPlaceholder')} placeholderTextColor="#94A3B8" style={styles.input(tirada, true, true, submitted)} editable={!isReadOnly} />
                                </View>
                            );
                            const campoTroquel = (
                                <View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <Text style={styles.label}>{t('forms.troquel')}</Text>
                                        {!isReadOnly && <TouchableOpacity onPress={() => setShowTroquelCreate(true)} style={{ backgroundColor: '#EEF2F8', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}><Text style={{ color: '#475569', fontWeight: '600', fontSize: 13 }}>{t('forms.nuevoTroquel')}</Text></TouchableOpacity>}
                                    </View>
                                    {troquelesCat.length === 0 ? <EmptyState variant="inline" title={t('forms.sinTroqueles')} message={t('forms.sinTroquelesMensaje')} /> : Platform.OS === 'web' ? (
                                        <View style={{ borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F1F5F9', borderRadius: 10, marginBottom: 8, overflow: 'hidden' }}>
                                            <select style={{ fontSize: 14, borderWidth: 0, backgroundColor: 'transparent', paddingTop: 8, paddingBottom: 8, paddingLeft: 10, paddingRight: 10, width: '100%', color: '#0F172A', cursor: isReadOnly ? 'not-allowed' : 'pointer', outlineWidth: 0 }} value={troquelSel?._id || troquelSel?.id || ''} disabled={isReadOnly} onChange={e => { const found = troquelesCat.find(tr => (tr._id || tr.id) === e.target.value); handleTroquelSelect(found || null); }}>
                                                <option value="">{t('forms.sinTroquel')}</option>
                                                {troquelesCat.map((tr, i) => <option key={tr._id || tr.id || i} value={tr._id || tr.id}>{tr.numero}{tr.tipo ? ` · ${tr.tipo}` : ''}{tr.estado ? ` · ${tr.estado}` : ''}{tr.anchoMotivo && tr.altoMotivo ? ` · ${tr.anchoMotivo}×${tr.altoMotivo}mm` : ''}</option>)}
                                            </select>
                                        </View>
                                    ) : (
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                                            <TouchableOpacity disabled={isReadOnly} onPress={() => handleTroquelSelect(null)} style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: !troquelSel ? '#475569' : '#EEF2F8' }}><Text style={{ color: !troquelSel ? '#fff' : '#475569', fontSize: 13 }}>{t('forms.sinTroquel')}</Text></TouchableOpacity>
                                            {troquelesCat.map((tr, i) => { const isSel = troquelSel && (troquelSel._id || troquelSel.id) === (tr._id || tr.id); return <TouchableOpacity key={tr._id || tr.id || i} disabled={isReadOnly} onPress={() => handleTroquelSelect(tr)} style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: isSel ? '#475569' : '#EEF2F8' }}><Text style={{ color: isSel ? '#fff' : '#475569', fontSize: 13 }}>{tr.numero}</Text></TouchableOpacity>; })}
                                        </View>
                                    )}
                                    {troquelSel && (
                                        <View style={{ backgroundColor: '#F1F5F9', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', padding: 12, marginBottom: 10 }}>
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                                                {[{ label: 'Número', value: troquelSel.numero }, { label: 'Tipo', value: troquelSel.tipo }, { label: 'Forma', value: troquelSel.forma }, { label: 'Estado', value: troquelSel.estado }, { label: 'Ancho motivo', value: troquelSel.anchoMotivo ? `${troquelSel.anchoMotivo} mm` : null }, { label: 'Alto motivo', value: troquelSel.altoMotivo ? `${troquelSel.altoMotivo} mm` : null }, { label: 'Motivos ancho', value: troquelSel.motivosAncho ? String(troquelSel.motivosAncho) : null }, { label: 'Separación ancho', value: troquelSel.separacionAncho ? `${troquelSel.separacionAncho} mm` : null }, { label: 'Valor Z', value: troquelSel.valorZ ? String(troquelSel.valorZ) : null }, { label: 'Dist. sesgado', value: troquelSel.distanciaSesgado ? `${troquelSel.distanciaSesgado} mm` : null }].filter(f => f.value != null && f.value !== '').map(f => (
                                                    <View key={f.label} style={{ minWidth: 110 }}><Text style={{ fontSize: 11, color: '#475569', fontWeight: '600', marginBottom: 2 }}>{f.label}</Text><Text style={{ fontSize: 13, color: '#0F172A', fontWeight: '700' }}>{f.value}</Text></View>
                                                ))}
                                            </View>
                                        </View>
                                    )}
                                </View>
                            );
                            const renderMap = {
                                '__base_maquina':  campoMaquina,
                                '__base_material': campoMaterial,
                                '__base_acabado':  campoAcabado,
                                '__base_tirada':   campoTirada,
                                '__base_troquel':  campoTroquel,
                            };
                            return (
                                <>
                                    <View style={styles.section}>
                                        <Text style={styles.sectionTitle}>{cont?.nombre || t('forms.sectionProducto')}</Text>
                                        {layoutRows([
                                            { campo_id: '__base_maquina',  col: 0, fila: 0, ancho: 6 },
                                            { campo_id: '__base_material', col: 6, fila: 0, ancho: 6 },
                                            { campo_id: '__base_acabado',  col: 0, fila: 1, ancho: 6 },
                                            { campo_id: '__base_tirada',   col: 6, fila: 1, ancho: 3 },
                                            { campo_id: '__base_troquel',  col: 9, fila: 1, ancho: 3 },
                                        ], renderMap)}
                                    </View>
                                    {(() => {
                                        const filtered = camposPersonalizados.filter(c => cont ? (c.contenedor_id === cont.contenedor_id || (!c.contenedor_id && c.seccion === 'producto')) : c.seccion === 'producto');
                                        return filtered.length > 0 ? (
                                            <View style={{ paddingHorizontal: 18, paddingBottom: 8 }}>
                                                <CamposDinamicos seccion="producto" contenedorId={cont?.contenedor_id} campos={camposPersonalizados} valores={camposExtra} onChange={(id, val) => setCamposExtra(prev => ({ ...prev, [id]: val }))} submitted={submitted} />
                                            </View>
                                        ) : null;
                                    })()}
                                </>
                            );
                        };

                        const renderSeccionImpresion = (cont) => {
                            const campoTintas = (
                                <View>
                                    <Text style={styles.label}>{t('forms.tintas')}</Text>
                                    <TintasSelector selectedTintas={selectedTintas} setSelectedTintas={setSelectedTintas} opcionesTintas={tintasOpciones} pantones={pantones} onRemovePantone={removePantoneAt} onStartAdd={() => { if (isReadOnly) return; setAddingPantone(true); setPantoneInput(''); }} addingPantone={addingPantone} addingValue={pantoneInput} onChangeAdding={(v) => { if (isReadOnly) return; setPantoneInput(v); }} onConfirmAdding={(txt) => { const val = (txt || '').trim(); if (val && !isReadOnly) addPantone(val); setAddingPantone(false); setPantoneInput(''); }} addingMatchHex={(findPantoneInMap(pantoneInput) || {}).data ? srgbToHex((findPantoneInMap(pantoneInput) || {}).data.srgb) : null} disabled={isReadOnly} />
                                    <Text style={styles.tintaCounter}>{t('forms.nTintasSeleccionadas')}: {numeroTintasSeleccionadas}</Text>
                                </View>
                            );
                            const campoTintaEspecial = (
                                <View>
                                    <Text style={styles.label}>{t('forms.tintaEspecial')}</Text>
                                    {tintasEspeciales.length > 0 ? (
                                        <BotonSelector opciones={tintasEspeciales} valorSeleccionado={detalleTintaEspecial} onSelect={setDetalleTintaEspecial} multiple={true} required={false} submitted={submitted} />
                                    ) : (
                                        <TextInput value={Array.isArray(detalleTintaEspecial) ? detalleTintaEspecial.join(', ') : ''} onChangeText={(text) => setDetalleTintaEspecial(parseTintasEspecialesTexto(text))} placeholder={t('forms.tintaEspecialPlaceholder')} placeholderTextColor="#94A3B8" style={styles.input(detalleTintaEspecial, false, false, submitted)} />
                                    )}
                                </View>
                            );
                            const campoObserv = (
                                <View>
                                    <Text style={styles.label}>{t('forms.observaciones')}</Text>
                                    <TextInput
                                        value={observaciones}
                                        onChangeText={setObservaciones}
                                        placeholder={t('forms.observacionesPlaceholder')}
                                        placeholderTextColor="#94A3B8"
                                        multiline
                                        numberOfLines={3}
                                        style={[styles.input(observaciones, false, false, submitted), { minHeight: 72, textAlignVertical: 'top' }]}
                                        editable={!isReadOnly}
                                    />
                                </View>
                            );
                            const renderMap = {
                                '__base_tintas':         campoTintas,
                                '__base_tinta_especial': campoTintaEspecial,
                                '__base_observ':         campoObserv,
                            };
                            return (
                                <>
                                    <View style={styles.section}>
                                        <Text style={styles.sectionTitle}>{cont?.nombre || t('forms.sectionImpresion')}</Text>
                                        {layoutRows([
                                            { campo_id: '__base_tintas',         col: 0, fila: 0, ancho: 6 },
                                            { campo_id: '__base_tinta_especial', col: 6, fila: 0, ancho: 6 },
                                            { campo_id: '__base_observ',         col: 0, fila: 1, ancho: 12 },
                                        ], renderMap)}
                                    </View>
                                    {(() => {
                                        const filtered = camposPersonalizados.filter(c => cont ? (c.contenedor_id === cont.contenedor_id || (!c.contenedor_id && c.seccion === 'impresion')) : c.seccion === 'impresion');
                                        return filtered.length > 0 ? (
                                            <View style={{ paddingHorizontal: 18, paddingBottom: 8 }}>
                                                <CamposDinamicos seccion="impresion" contenedorId={cont?.contenedor_id} campos={camposPersonalizados} valores={camposExtra} onChange={(id, val) => setCamposExtra(prev => ({ ...prev, [id]: val }))} submitted={submitted} />
                                            </View>
                                        ) : null;
                                    })()}
                                </>
                            );
                        };

                        const renderSeccionCustom = (cont) => {
                            const filtered = camposPersonalizados.filter(c => c.contenedor_id === cont.contenedor_id);
                            if (filtered.length === 0) return null;
                            return (
                                <View style={{ paddingHorizontal: 18, paddingBottom: 8 }}>
                                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E1B4B', marginBottom: 6, marginTop: 4 }}>
                                        {cont.nombre}
                                    </Text>
                                    <CamposDinamicos
                                        contenedorId={cont.contenedor_id}
                                        campos={camposPersonalizados}
                                        valores={camposExtra}
                                        onChange={(id, val) => setCamposExtra(prev => ({ ...prev, [id]: val }))}
                                        submitted={submitted}
                                    />
                                </View>
                            );
                        };

                        const renderSeccion = (cont) => {
                            switch (cont.tipo) {
                                case 'general':    return renderSeccionGeneral(cont);
                                case 'producto':   return renderSeccionProducto(cont);
                                case 'impresion':  return renderSeccionImpresion(cont);
                                case 'custom':     return renderSeccionCustom(cont);
                                default:           return null;
                            }
                        };

                        const sortedContenedores = [...contenedoresFormulario].sort((a, b) => (a.orden ?? 99) - (b.orden ?? 99));

                        return sortedContenedores.map((cont, i) => (
                            <React.Fragment key={cont.contenedor_id}>
                                {renderSeccion(cont)}
                                {i < sortedContenedores.length - 1 && <View style={styles.divider} />}
                            </React.Fragment>
                        ));
                    })()}

                </ScrollView>

                {/* ── Barra de acciones inferior ── */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#FFFFFF' }}>
                    <TouchableOpacity style={styles.bigBtn} onPress={handleClose}>
                        <Text style={styles.bigBtnText}>{t('forms.cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.submitBtn, !puedeCrear && { opacity: 0.45 }]}
                        onPress={() => puedeCrear && handleSubmit()}
                        disabled={!puedeCrear}
                    >
                        <Text style={styles.submitText}>{submitLabel}</Text>
                    </TouchableOpacity>
                </View>

                {showDatePicker && Platform.OS !== 'web' && (
                    <DateTimePicker
                        value={parseDateString(datePickerField === 'fechaEntrega' ? fechaEntrega : fecha) || new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        minimumDate={
                            showFechaEntrega && datePickerField === 'fechaEntrega'
                                ? (parseDateString(fecha) || undefined)
                                : undefined
                        }
                        onChange={onDateChange}
                    />
                )}

                <Modal
                    visible={clientePickerVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => {
                        setClientePickerVisible(false);
                        setBusquedaCliente('');
                    }}
                >
                    <View style={styles.pickerModalOverlay}>
                        <View style={styles.pickerModalCard}>
                            <Text style={styles.pickerModalTitle}>{t('forms.selectarCliente')}</Text>
                            <TextInput
                                value={busquedaCliente}
                                onChangeText={setBusquedaCliente}
                                placeholder={t('forms.buscarCliente')}
                                placeholderTextColor="#94A3B8"
                                style={styles.input(busquedaCliente, false, false, false)}
                            />

                            <ScrollView>
                                {clientesFiltrados.length === 0 ? (
                                    <EmptyState variant="inline" title={t('forms.sinClientes')} message={t('forms.sinClientesMsg')} />
                                ) : (
                                    clientesFiltrados.map((item) => (
                                        <TouchableOpacity
                                            key={item.id}
                                            style={styles.pickerItem}
                                            onPress={() => seleccionarClienteGuardado(item)}
                                        >
                                            <Text style={styles.pickerItemTitle}>{item.nombre || '-'}</Text>
                                            <Text style={styles.pickerItemSub}>
                                                {(item.razon_social || t('forms.sinRazonSocial'))} • {(item.cif || t('forms.sinCIF'))}
                                            </Text>
                                            <Text style={styles.pickerItemSub}>
                                                {(item.personas_contacto || t('forms.sinContacto'))} • {(item.email || t('forms.sinEmail'))}
                                            </Text>
                                        </TouchableOpacity>
                                    ))
                                )}
                            </ScrollView>

                            <View style={styles.pickerFooter}>
                                <TouchableOpacity
                                    style={styles.bigBtn}
                                    onPress={() => {
                                        setClientePickerVisible(false);
                                        setBusquedaCliente('');
                                    }}
                                >
                                    <Text style={styles.bigBtnText}>{t('common.close')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
                {/* ── Troquel create sub-modal ── */}
                <NuevoTroquelModal
                    visible={showTroquelCreate}
                    onClose={() => setShowTroquelCreate(false)}
                    onSave={async (troquelData) => {
                        try {
                            const resp = await fetch(API_TROQUELES, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(troquelData) });
                            const data = resp.ok ? await resp.json() : {};
                            if (!resp.ok) { alert(data.error || 'Error guardando troquel'); return; }
                            await cargarTroqueles();
                            const nuevo = data.troquel;
                            if (nuevo) handleTroquelSelect({ ...nuevo, id: nuevo._id || nuevo.id });
                        } catch (e) {
                            alert('Error de conexión');
                        }
                    }}
                />

                {/* ── Máquina create sub-modal ── */}
                <NuevaMaquinaModal
                    visible={showMaquinaCreate}
                    onClose={() => setShowMaquinaCreate(false)}
                    onSave={async (data) => {
                        try {
                            const res = await fetch('http://localhost:8080/api/maquinas', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(data),
                            });
                            const json = await res.json().catch(() => ({}));
                            if (!res.ok) { alert(json.error || 'Error guardando máquina'); return; }
                            await recargarMaquinas();
                            setMaquina(data.nombre);
                        } catch (e) {
                            alert('Error de conexión');
                        }
                    }}
                />

                </View>
            </View>
        </Modal>
    );
}

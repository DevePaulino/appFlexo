import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform, Image, Modal, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

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
    return '#3AB274';
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

const styles = {
    container: { paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#F1F5F9', flex: 1 },
    section: {
        marginBottom: 10,
        marginTop: 4,
        backgroundColor: '#FFF',
        borderRadius: 14,
        padding: 16,
        borderWidth: 1.5,
        borderColor: '#E2E8F0'
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: '#334155',
        letterSpacing: 1,
        textTransform: 'uppercase',
        backgroundColor: '#E2E8F0',
        paddingHorizontal: 16,
        paddingVertical: 9,
        marginHorizontal: -16,
        marginTop: -16,
        marginBottom: 14,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    divider: { borderBottomWidth: 1, borderBottomColor: '#E0E0E0', marginVertical: 8 },
    label: { fontSize: 13, color: '#444', fontWeight: '700', marginBottom: 6 },
    row: { flexDirection: 'row', gap: 12, marginBottom: 10, alignItems: 'flex-start' },
    col: { flex: 1 },
    input: (value, isRequired, isNumeric = false, submitted = false) => ({
        fontSize: 14,
        borderWidth: 1,
        borderColor: borderColorState(value, isRequired, isNumeric, submitted),
        backgroundColor: '#F8FAFC',
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
        backgroundColor: '#F1F5F9', paddingHorizontal: 22, paddingVertical: 11,
        borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0',
        alignItems: 'center', minWidth: 130
    },
    bigBtnText: {
        color: '#475569', fontWeight: '600', fontSize: 13
    },
    tintaBtn: (active, tinta) => ({
        paddingHorizontal: 10, paddingVertical: 8,
        backgroundColor: active ? '#E2E8F0' : '#F8FAFC',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: active ? (tinta.isCMYK ? tinta.color : '#94A3B8') : '#E2E8F0',
        marginRight: 8, marginBottom: 8, minWidth: 40, alignItems: 'center'
    }),
    tintaTxt: { color: '#0F172A', fontWeight: '700', fontSize: 13, fontFamily: 'System, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen"' },
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
        backgroundColor: '#475569', paddingHorizontal: 22, paddingVertical: 10,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: '#0F172A',
        shadowOpacity: 0.12,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
    },
    submitText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
    etiquetaHalfCol: { width: 140, minHeight: 170, borderRadius: 14, marginRight: 10, resizeMode: 'contain', alignSelf: 'flex-start' },
    etiquetaBtn: { marginTop: 6, alignSelf: 'flex-start' },
    modalHeader: {
        backgroundColor: '#1E293B',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#334155',
        position: 'relative',
    },
    modalHeaderTitle: {
        textAlign: 'center',
        fontSize: 22,
        fontWeight: '900',
        color: '#F8FAFC',
    },
    modalCloseBtn: {
        position: 'absolute',
        right: 16,
        top: 16,
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.18)',
    },
    modalCloseText: {
        fontSize: 15,
        color: '#F8FAFC',
        fontWeight: '800',
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
            const active = multiple
                ? (Array.isArray(valorSeleccionado) && valorSeleccionado.includes(opcion))
                : valorSeleccionado === opcion;
            const sinSeleccion = multiple
                ? !(Array.isArray(valorSeleccionado) && valorSeleccionado.length > 0)
                : !valorSeleccionado;
            const border =
                active
                    ? '#94A3B8'
                    : (sinSeleccion && required && submitted
                        ? '#D21820'
                        : '#E2E8F0');
            return (
                <TouchableOpacity
                    key={opcion}
                    style={{
                        paddingHorizontal: small ? 10 : 14,
                        paddingVertical: small ? 6 : 8,
                        backgroundColor: active ? '#E2E8F0' : '#F8FAFC',
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: border,
                        marginRight: 8,
                        marginBottom: 8,
                        minWidth: small ? 55 : 70,
                        alignItems: 'center'
                    }}
                    onPress={() => {
                        if (disabled) return;
                        if (!multiple) {
                            onSelect(opcion);
                            return;
                        }

                        const actuales = Array.isArray(valorSeleccionado) ? valorSeleccionado : [];
                        const siguientes = active
                            ? actuales.filter((item) => item !== opcion)
                            : [...actuales, opcion];
                        onSelect(siguientes);
                    }}
                >
                    <Text style={{
                        color: active ? '#0F172A' : '#475569',
                        fontWeight: active ? '700' : '500',
                        fontFamily: 'System, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen"',
                        fontSize: 13
                    }}>{opcion}</Text>
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
                    <Text style={styles.tintaTxt}>{tinta.label}</Text>
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
                    backgroundColor: addingMatchHex || '#F8FAFC',
                    color: addingMatchHex ? '#FFF' : '#0F172A',
                    fontSize: 13,
                }}
            />
        ) : (
            <TouchableOpacity
                style={{ paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', marginRight: 8, marginBottom: 8, minWidth: 36, alignItems: 'center' }}
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
}) {
    const isReadOnly = !!readOnly;
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
    const [coberturaError, setCoberturaError] = useState('');
    const [clientesGuardados, setClientesGuardados] = useState([]);
    const [clienteSeleccionadoId, setClienteSeleccionadoId] = useState(null);
    const [clienteExpandido, setClienteExpandido] = useState(false);
    const [cargandoClientes, setCargandoClientes] = useState(false);
    const [maquinasActivas, setMaquinasActivas] = useState([]);
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
    const [troquelCreateForm, setTroquelCreateForm] = useState({ numero: '', tipo: 'regular', forma: 'Rectangular', estado: 'Disponible', anchoMotivo: '', altoMotivo: '', motivosAncho: '', separacionAncho: '', valorZ: '', distanciaSesgado: '' });
    const [savingTroquel, setSavingTroquel] = useState(false);
    const [showMaquinaCreate, setShowMaquinaCreate] = useState(false);
    const [maquinaCreateForm, setMaquinaCreateForm] = useState({ nombre: '', anio_fabricacion: '', tipo_maquina: '', numero_colores: '', estado: 'Activa', ancho_max_material_mm: '', ancho_max_impresion_mm: '', velocidad_max_maquina_mmin: '', espesor_planchas_mm: '', sistemas_secado: '' });
    const [savingMaquina, setSavingMaquina] = useState(false);

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
        } catch (e) {
            // ignore
        }
    }, [initialValues]);

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
    const acabados = (catalogos.acabados || []).map((item) => item.valor).filter(Boolean);
    const tintasEspeciales = (catalogos.tintas_especiales || []).map((item) => item.valor).filter(Boolean);
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

    const cargarClientesGuardados = async () => {
        setCargandoClientes(true);
        try {
            const response = await fetch('http://localhost:8080/api/clientes');
            const data = response.ok ? await response.json() : { clientes: [] };
            setClientesGuardados(data.clientes || []);
        } catch {
            setClientesGuardados([]);
        } finally {
            setCargandoClientes(false);
        }
    };

    const cargarCatalogos = async () => {
        try {
            const authHdrs = {
                'Content-Type': 'application/json',
                'X-Empresa-Id': currentUser?.empresa_id || '1',
                'X-User-Id': currentUser?.id || 'admin',
                'X-Role': currentUser?.role || 'administrador',
            };
            const [settingsRes, catRes] = await Promise.all([
                fetch('http://localhost:8080/api/settings'),
                fetch('http://localhost:8080/api/materiales/catalogo', { headers: authHdrs }),
            ]);
            const settingsData = settingsRes.ok ? await settingsRes.json() : { settings: {} };
            const settings = settingsData.settings || {};
            const catData = catRes.ok ? await catRes.json() : { catalogo: [] };
            // Use full materials catalog if available, else fall back to settings.materiales
            const catalogoMateriales = (catData.catalogo || []).map(item => ({ valor: item.nombre }));
            setCatalogos({
                materiales: catalogoMateriales.length > 0 ? catalogoMateriales : (settings.materiales || []),
                acabados: settings.acabados || [],
                tintas_especiales: settings.tintas_especiales || []
            });
        } catch {
            setCatalogos({
                materiales: [],
                acabados: [],
                tintas_especiales: []
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

    const cargarMaquinasActivas = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/maquinas');
            const data = response.ok ? await response.json() : { maquinas: [] };
            const activas = (data.maquinas || []).filter((item) => (item?.estado || 'Activa') === 'Activa');
            setMaquinasActivas(activas);
        } catch {
            setMaquinasActivas([]);
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

    const saveTroquelFromModal = async () => {
        const numero = (troquelCreateForm.numero || '').trim();
        if (!numero) return alert('El número/referencia del troquel es obligatorio');
        setSavingTroquel(true);
        try {
            const body = {
                numero,
                tipo: troquelCreateForm.tipo || 'regular',
                forma: troquelCreateForm.forma,
                estado: troquelCreateForm.estado,
                anchoMotivo: troquelCreateForm.anchoMotivo,
                altoMotivo: troquelCreateForm.altoMotivo,
                motivosAncho: troquelCreateForm.motivosAncho,
                separacionAncho: troquelCreateForm.separacionAncho,
                valorZ: troquelCreateForm.valorZ,
                distanciaSesgado: troquelCreateForm.distanciaSesgado,
            };
            const resp = await fetch(API_TROQUELES, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            const data = resp.ok ? await resp.json() : {};
            if (!resp.ok) return alert(data.error || 'Error guardando troquel');
            const resetForm = { numero: '', tipo: 'regular', forma: 'Rectangular', estado: 'Disponible', anchoMotivo: '', altoMotivo: '', motivosAncho: '', separacionAncho: '', valorZ: '', distanciaSesgado: '' };
            setShowTroquelCreate(false);
            setTroquelCreateForm(resetForm);
            await cargarTroqueles();
            // Auto-select the new troquel
            const nuevo = data.troquel;
            if (nuevo) handleTroquelSelect({ ...nuevo, id: nuevo._id || nuevo.id });
        } catch (e) {
            alert('Error de conexión');
        } finally {
            setSavingTroquel(false);
        }
    };

    const saveMaquinaFromModal = async () => {
        const nombre = (maquinaCreateForm.nombre || '').trim();
        if (!nombre) return alert('El nombre de la máquina es obligatorio');
        const parseNum = (v) => { const n = Number(v); return (v === '' || v === null || v === undefined || isNaN(n)) ? null : n; };
        setSavingMaquina(true);
        try {
            const body = {
                nombre,
                anio_fabricacion: maquinaCreateForm.anio_fabricacion.trim() || null,
                tipo_maquina: maquinaCreateForm.tipo_maquina.trim() || null,
                numero_colores: parseNum(maquinaCreateForm.numero_colores),
                estado: maquinaCreateForm.estado || 'Activa',
                ancho_max_material_mm: parseNum(maquinaCreateForm.ancho_max_material_mm),
                ancho_max_impresion_mm: parseNum(maquinaCreateForm.ancho_max_impresion_mm),
                velocidad_max_maquina_mmin: parseNum(maquinaCreateForm.velocidad_max_maquina_mmin),
                velocidad_max_impresion_mmin: parseNum(maquinaCreateForm.velocidad_max_maquina_mmin),
                espesor_planchas_mm: parseNum(maquinaCreateForm.espesor_planchas_mm),
                sistemas_secado: maquinaCreateForm.sistemas_secado.trim() || null,
            };
            const res = await fetch('http://localhost:8080/api/maquinas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) return alert(data.error || 'Error guardando máquina');
            setShowMaquinaCreate(false);
            setMaquinaCreateForm({ nombre: '', anio_fabricacion: '', tipo_maquina: '', numero_colores: '', estado: 'Activa', ancho_max_material_mm: '', ancho_max_impresion_mm: '', velocidad_max_maquina_mmin: '', espesor_planchas_mm: '', sistemas_secado: '' });
            await cargarMaquinasActivas();
            setMaquina(nombre);
        } catch (e) {
            alert('Error de conexión');
        } finally {
            setSavingMaquina(false);
        }
    };

    useEffect(() => {
        if (visible) {
            cargarClientesGuardados();
            cargarCatalogos();
            cargarUsuariosComerciales();
            cargarTroqueles();
            if (showMaquinaField) {
                cargarMaquinasActivas();
            }
        }
    }, [visible, showMaquinaField]);

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
            Alert.alert('Permiso denegado', 'Tu rol no tiene permiso para crear presupuestos.');
            return;
        }
        setSubmitted(true);
        if (emailVacio || emailInvalido || cifInvalido) {
            Alert.alert('Error', 'Email vacío o inválido, o CIF inválido. Revisa los campos.');
            return;
        }

        const fechaEntregaValida = !showFechaEntrega || !!fechaEntrega;
        const maquinaValida = !showMaquinaField || !!maquina;
        if (fechaEntregaAntesCreacion) {
            Alert.alert('Error', 'La fecha de entrega no puede ser anterior a la fecha de creación.');
            return;
        }

        if (showMaquinaField && maquinaIncompatible) {
            Alert.alert('Máquina incompatible', 'La máquina seleccionada no soporta el número de tintas elegidas.');
            return;
        }

        const acabadoValido = Array.isArray(acabado) ? acabado.length > 0 : !!acabado;

        const missing = [];
        // Allow non-saved clients: require cliente name but don't force clienteSeleccionadoId
        if (!cliente) missing.push('Nombre cliente');
        if (!referencia) missing.push('Referencia');
        if (!material) missing.push('Material');
        if (!acabadoValido) missing.push('Acabado');
        if (!tirada) missing.push('Tirada');
        if (!(selectedTintas.length > 0)) missing.push('Tintas');
        if (!fechaEntregaValida) missing.push('Fecha de entrega válida');
        if (!maquinaValida) missing.push('Máquina compatible');

        if (missing.length > 0) {
            Alert.alert('Campos incompletos', 'Faltan o son inválidos: ' + missing.join(', '));
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
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 16 }}>
                <View style={{ backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: '#E2E8F0', maxHeight: '92%', overflow: 'hidden', shadowColor: '#0F172A', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8 }}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalHeaderTitle}>{modalTitle}</Text>
                    <TouchableOpacity onPress={handleClose} style={styles.modalCloseBtn}>
                        <Text style={styles.modalCloseText}>✕</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.container}>
                    {/* DATOS GENERALES */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Datos Generales</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 18 }}>
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', gap: 16 }}>
                                    <View style={styles.col}>
                                        <Text style={styles.label}>Cliente</Text>
                                        <TouchableOpacity
                                            style={[styles.clientePickerBtn, cliente ? { borderColor: '#475569', backgroundColor: '#F1F5F9' } : null]}
                                            onPress={() => { if (isReadOnly) return; setClientePickerVisible(true); }}
                                        >
                                            <Text style={[styles.clientePickerBtnText, cliente ? { color: '#334155', fontWeight: '700' } : null]}>
                                                {cliente ? (razonSocial || cliente) : 'Seleccionar cliente guardado'}
                                            </Text>
                                        </TouchableOpacity>
                                        {!cliente && <Text style={styles.clientePickerHint}>Al seleccionar un cliente, se autocompletan los datos comerciales</Text>}
                                        {/* eliminado campo placeholder innecesario para aprovechar espacio */}
                                    </View>
                                    <View style={styles.col}>
                                        <Text style={styles.label}>{fechaLabel}</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <TextInput
                                                value={formatDateDisplay(fecha)}
                                                style={[styles.input(fecha, true, false, submitted), { flex: 1, marginBottom: 0 }]}
                                                editable={false}
                                            />
                                            {Platform.OS === 'web' ? (
                                                <View
                                                    style={{
                                                        width: 38,
                                                        height: 38,
                                                        borderRadius: 8,
                                                        borderWidth: 1,
                                                        borderColor: '#CCC',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        backgroundColor: '#FBFBFD',
                                                        position: 'relative'
                                                    }}
                                                >
                                                    <Text style={{ fontSize: 16 }}>📅</Text>
                                                    <input
                                                        type="date"
                                                        value={fecha}
                                                        onChange={(e) => {
                                                            const valor = e?.target?.value || '';
                                                            if (!valor) return;
                                                            setFecha(valor);
                                                        }}
                                                        style={{
                                                            position: 'absolute',
                                                            inset: 0,
                                                            opacity: 0,
                                                            cursor: 'pointer'
                                                        }}
                                                    />
                                                </View>
                                            ) : (
                                                <TouchableOpacity
                                                    onPress={() => abrirDatePicker('fecha')}
                                                    style={{
                                                        width: 38,
                                                        height: 38,
                                                        borderRadius: 8,
                                                        borderWidth: 1,
                                                        borderColor: '#CCC',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        backgroundColor: '#FBFBFD'
                                                    }}
                                                >
                                                    <Text style={{ fontSize: 16 }}>📅</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                    {showFechaEntrega && (
                                        <View style={styles.col}>
                                            <Text style={styles.label}>{fechaEntregaLabel}</Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                <TextInput
                                                    value={formatDateDisplay(fechaEntrega)}
                                                    style={[
                                                        styles.input(fechaEntrega, true, false, submitted),
                                                        { flex: 1, marginBottom: 0 },
                                                        submitted && fechaEntregaAntesCreacion ? { borderColor: '#D21820' } : null
                                                    ]}
                                                    editable={false}
                                                />
                                                {Platform.OS === 'web' ? (
                                                    <View
                                                        style={{
                                                            width: 38,
                                                            height: 38,
                                                            borderRadius: 8,
                                                            borderWidth: 1,
                                                            borderColor: '#CCC',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            backgroundColor: '#FBFBFD',
                                                            position: 'relative'
                                                        }}
                                                    >
                                                        <Text style={{ fontSize: 16 }}>📅</Text>
                                                        <input
                                                            type="date"
                                                            value={fechaEntrega}
                                                            min={fecha || undefined}
                                                            onChange={(e) => {
                                                                const valor = e?.target?.value || '';
                                                                if (!valor) return;
                                                                setFechaEntrega(valor);
                                                            }}
                                                            style={{
                                                                position: 'absolute',
                                                                inset: 0,
                                                                opacity: 0,
                                                                cursor: 'pointer'
                                                            }}
                                                        />
                                                    </View>
                                                ) : (
                                                    <TouchableOpacity
                                                        onPress={() => abrirDatePicker('fechaEntrega')}
                                                        style={{
                                                            width: 38,
                                                            height: 38,
                                                            borderRadius: 8,
                                                            borderWidth: 1,
                                                            borderColor: '#CCC',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            backgroundColor: '#FBFBFD'
                                                        }}
                                                    >
                                                        <Text style={{ fontSize: 16 }}>📅</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                            {submitted && fechaEntregaAntesCreacion && (
                                                <Text style={styles.errorText}>La fecha de entrega no puede ser anterior a la fecha de creación</Text>
                                            )}
                                        </View>
                                    )}
                                    <View style={styles.col}>
                                        <Text style={styles.label}>Comercial</Text>
                                        {Platform.OS === 'web' ? (
                                            <div style={{ borderWidth: 1, borderStyle: 'solid', borderColor: borderColorState(vendedor, true, false, submitted), backgroundColor: '#F8FAFC', borderRadius: 10, marginBottom: 10, overflow: 'hidden', padding: 0 }}>
                                                <select
                                                    value={vendedor}
                                                    onChange={(e) => { if (isReadOnly) return; setVendedor(e.target.value); }}
                                                    disabled={isReadOnly}
                                                    style={{ width: '100%', borderWidth: 0, backgroundColor: 'transparent', paddingTop: 4, paddingBottom: 4, paddingLeft: 8, paddingRight: 8, fontSize: 14, color: '#0F172A', outlineWidth: 0, WebkitAppearance: 'none', appearance: 'none', cursor: isReadOnly ? 'default' : 'pointer' }}
                                                >
                                                    <option value="">Seleccionar comercial</option>
                                                    {usuariosComerciales.map((u) => (
                                                        <option key={u.id || u.usuario_id || u.nombre} value={u.nombre}>{u.nombre}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : (
                                            <BotonSelector
                                                opciones={comerciales}
                                                valorSeleccionado={vendedor}
                                                onSelect={setVendedor}
                                                required={true}
                                                submitted={submitted}
                                                disabled={isReadOnly}
                                            />
                                        )}
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row', gap: 16, marginTop: 0 }}>
                                    <View style={styles.col}>
                                        <Text style={styles.label}>Referencia / Descripción</Text>
                                        <TextInput
                                            value={referencia}
                                            onChangeText={(t) => { if (isReadOnly) return; setReferencia(t); }}
                                            placeholder="Trabajo/referencia"
                                            placeholderTextColor="#94A3B8"
                                            style={styles.input(referencia, true, false, submitted)}
                                            editable={!isReadOnly}
                                        />
                                    </View>
                                </View>
                                {cliente ? (
                                    <View style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, overflow: 'hidden', marginTop: 0, marginBottom: 8 }}>
                                        <TouchableOpacity
                                            onPress={() => setClienteExpandido(v => !v)}
                                            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#F8FAFC' }}
                                        >
                                            <Text style={{ fontSize: 12, color: '#64748B', flex: 1 }} numberOfLines={1}>
                                                {[cif, personasContacto, email].filter(Boolean).join(' · ')}
                                            </Text>
                                            <Text style={{ fontSize: 12, color: '#475569', fontWeight: '600', marginLeft: 10 }}>
                                                {clienteExpandido ? '▲ Menos' : '▼ Ver datos'}
                                            </Text>
                                        </TouchableOpacity>
                                        {clienteExpandido && (
                                            <View style={{ padding: 12, paddingTop: 8 }}>
                                                <View style={{ flexDirection: 'row', gap: 16 }}>
                                                    <View style={styles.col}>
                                                        <Text style={styles.label}>Razón social</Text>
                                                        <TextInput
                                                            value={razonSocial}
                                                            onChangeText={() => {}}
                                                            placeholder="Razón social"
                                                            placeholderTextColor="#94A3B8"
                                                            style={styles.input(razonSocial, false, false, submitted)}
                                                            editable={false}
                                                        />
                                                    </View>
                                                    <View style={styles.col}>
                                                        <Text style={styles.label}>CIF</Text>
                                                        <TextInput
                                                            value={cif}
                                                            onChangeText={() => {}}
                                                            placeholder="CIF"
                                                            placeholderTextColor="#94A3B8"
                                                            style={[
                                                                styles.input(cif, false, false, submitted),
                                                                submitted && cifInvalido ? { borderColor: '#D21820' } : null
                                                            ]}
                                                            editable={false}
                                                        />
                                                        {submitted && cifInvalido && (
                                                            <Text style={styles.errorText}>CIF no válido (formato esperado: A1234567B)</Text>
                                                        )}
                                                    </View>
                                                </View>
                                                <View style={{ flexDirection: 'row', gap: 16 }}>
                                                    <View style={styles.col}>
                                                        <Text style={styles.label}>Personas de contacto</Text>
                                                        <TextInput
                                                            value={personasContacto}
                                                            onChangeText={() => {}}
                                                            placeholder="Nombre(s) de contacto"
                                                            placeholderTextColor="#94A3B8"
                                                            style={styles.input(personasContacto, false, false, submitted)}
                                                            editable={false}
                                                        />
                                                    </View>
                                                    <View style={styles.col}>
                                                        <Text style={styles.label}>Email</Text>
                                                        <TextInput
                                                            value={email}
                                                            onChangeText={() => {}}
                                                            placeholder="email@cliente.com"
                                                            placeholderTextColor="#94A3B8"
                                                            style={[
                                                                styles.input(email, false, false, submitted),
                                                                submitted && emailInvalido ? { borderColor: '#D21820' } : null
                                                            ]}
                                                            keyboardType="email-address"
                                                            autoCapitalize="none"
                                                            editable={false}
                                                        />
                                                        {submitted && emailInvalido && (
                                                            <Text style={styles.errorText}>Email no válido</Text>
                                                        )}
                                                        {submitted && emailVacio && (
                                                            <Text style={styles.errorText}>El email es obligatorio</Text>
                                                        )}
                                                    </View>
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                ) : null}
                            </View>
                        </View>
                    </View>
                    <View style={styles.divider} />

                    {/* PRODUCTO */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Producto</Text>
                        <View style={[styles.row, { alignItems: 'flex-start' }]}>
                            {showMaquinaField && (
                            <View style={styles.col}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <Text style={[styles.label, { marginBottom: 0 }]}>{maquinaLabel}</Text>
                                    {!isReadOnly && (
                                        <TouchableOpacity
                                            onPress={() => {
                                                setMaquinaCreateForm({ nombre: '', anio_fabricacion: '', tipo_maquina: '', numero_colores: '', estado: 'Activa', ancho_max_material_mm: '', ancho_max_impresion_mm: '', velocidad_max_maquina_mmin: '', espesor_planchas_mm: '', sistemas_secado: '' });
                                                setShowMaquinaCreate(true);
                                            }}
                                            style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                                        >
                                            <Text style={{ color: '#475569', fontWeight: '600', fontSize: 13 }}>+ Nueva máquina</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                                {Platform.OS === 'web' ? (
                                    <View style={{
                                        borderWidth: 1,
                                        borderColor: submitted && maquinaIncompatible ? '#D21820' : borderColorState(maquina, true, false, submitted),
                                        backgroundColor: '#F8FAFC',
                                        borderRadius: 10,
                                        marginBottom: 8,
                                        overflow: 'hidden'
                                    }}>
                                        <select
                                            value={maquina}
                                            onChange={(e) => setMaquina(e.target.value)}
                                            style={{
                                                width: '100%',
                                                borderWidth: 0,
                                                backgroundColor: 'transparent',
                                                paddingTop: 8, paddingBottom: 8, paddingLeft: 10, paddingRight: 10,
                                                fontSize: 14,
                                                color: '#0F172A',
                                                outlineWidth: 0,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <option value="">Seleccionar máquina activa</option>
                                            {maquinasActivas.map((itemMaquina) => (
                                                <option
                                                    key={itemMaquina.id}
                                                    value={itemMaquina.nombre}
                                                >
                                                    {`${itemMaquina.nombre} (${itemMaquina.numero_colores || '-'} colores)${!puedeSeleccionarMaquina(itemMaquina) ? ' ⚠ no compatible' : ''}`}
                                                </option>
                                            ))}
                                        </select>
                                    </View>
                                ) : (
                                    <View style={styles.selectorRow}>
                                        {maquinasActivas.map((itemMaquina) => {
                                            const activa = maquina === itemMaquina.nombre;
                                            const habilitada = puedeSeleccionarMaquina(itemMaquina);
                                            return (
                                                <TouchableOpacity
                                                    key={itemMaquina.id}
                                                    style={{
                                                        paddingHorizontal: 12,
                                                        paddingVertical: 8,
                                                        backgroundColor: activa ? '#E8E8EC' : '#FBFBFD',
                                                        borderRadius: 22,
                                                        borderWidth: 2,
                                                        borderColor: submitted && activa && !habilitada ? '#D21820' : (activa ? '#3AB274' : '#CCC'),
                                                        marginRight: 8,
                                                        marginBottom: 8,
                                                        minWidth: 90,
                                                        alignItems: 'center',
                                                        opacity: habilitada ? 1 : 0.35,
                                                    }}
                                                    onPress={() => setMaquina(itemMaquina.nombre)}
                                                >
                                                    <Text style={{
                                                        color: activa ? '#393B3F' : '#6C6C70',
                                                        fontWeight: activa ? '700' : '500',
                                                        fontSize: 13,
                                                    }}>
                                                        {`${itemMaquina.nombre} (${itemMaquina.numero_colores || '-'})${!habilitada ? ' ⚠' : ''}`}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                )}
                                {submitted && !maquina && (
                                    <Text style={styles.errorText}>Selecciona una máquina activa</Text>
                                )}
                                {submitted && maquinaIncompatible && (
                                    <Text style={styles.errorText}>
                                        La máquina seleccionada no soporta las tintas marcadas ({numeroTintasSeleccionadas}).
                                    </Text>
                                )}
                            </View>
                            )}
                        <View style={styles.col}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <Text style={styles.label}>Troquel</Text>
                                {!isReadOnly && (
                                    <TouchableOpacity
                                        onPress={() => {
                                            setTroquelCreateForm({ numero: '', tipo: 'regular', forma: 'Rectangular', estado: 'Disponible', anchoMotivo: '', altoMotivo: '', motivosAncho: '', separacionAncho: '', valorZ: '', distanciaSesgado: '' });
                                            setShowTroquelCreate(true);
                                        }}
                                        style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                                    >
                                        <Text style={{ color: '#475569', fontWeight: '600', fontSize: 13 }}>+ Nuevo troquel</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            {troquelesCat.length === 0 ? (
                                <Text style={{ color: '#94A3B8', fontSize: 13 }}>No hay troqueles en el catálogo. Crea uno con el botón de arriba.</Text>
                            ) : Platform.OS === 'web' ? (
                                <View style={{ borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', borderRadius: 10, marginBottom: 8, overflow: 'hidden' }}>
                                    <select
                                        style={{ fontSize: 14, borderWidth: 0, backgroundColor: 'transparent', paddingTop: 8, paddingBottom: 8, paddingLeft: 10, paddingRight: 10, width: '100%', color: '#0F172A', cursor: isReadOnly ? 'not-allowed' : 'pointer', outlineWidth: 0 }}
                                        value={troquelSel?._id || troquelSel?.id || ''}
                                        disabled={isReadOnly}
                                        onChange={e => {
                                            const found = troquelesCat.find(t => (t._id || t.id) === e.target.value);
                                            handleTroquelSelect(found || null);
                                        }}
                                    >
                                        <option value="">Sin troquel</option>
                                        {troquelesCat.map((t, i) => (
                                            <option key={t._id || t.id || i} value={t._id || t.id}>
                                                {t.numero}{t.tipo ? ` · ${t.tipo}` : ''}{t.estado ? ` · ${t.estado}` : ''}{t.anchoMotivo && t.altoMotivo ? ` · ${t.anchoMotivo}×${t.altoMotivo}mm` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </View>
                            ) : (
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                                    <TouchableOpacity
                                        disabled={isReadOnly}
                                        onPress={() => handleTroquelSelect(null)}
                                        style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: !troquelSel ? '#475569' : '#F1F5F9' }}
                                    >
                                        <Text style={{ color: !troquelSel ? '#fff' : '#475569', fontSize: 13 }}>Sin troquel</Text>
                                    </TouchableOpacity>
                                    {troquelesCat.map((t, i) => {
                                        const isSelected = troquelSel && (troquelSel._id || troquelSel.id) === (t._id || t.id);
                                        return (
                                            <TouchableOpacity
                                                key={t._id || t.id || i}
                                                disabled={isReadOnly}
                                                onPress={() => handleTroquelSelect(t)}
                                                style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: isSelected ? '#475569' : '#F1F5F9' }}
                                            >
                                                <Text style={{ color: isSelected ? '#fff' : '#475569', fontSize: 13 }}>{t.numero}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            )}
                        </View>
                    </View>
                    {troquelSel && (
                        <View style={{ backgroundColor: '#F8FAFC', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', padding: 12, marginBottom: 10 }}>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                                {[
                                    { label: 'Número', value: troquelSel.numero },
                                    { label: 'Tipo', value: troquelSel.tipo },
                                    { label: 'Forma', value: troquelSel.forma },
                                    { label: 'Estado', value: troquelSel.estado },
                                    { label: 'Ancho motivo', value: troquelSel.anchoMotivo ? `${troquelSel.anchoMotivo} mm` : null },
                                    { label: 'Alto motivo', value: troquelSel.altoMotivo ? `${troquelSel.altoMotivo} mm` : null },
                                    { label: 'Motivos ancho', value: troquelSel.motivosAncho ? String(troquelSel.motivosAncho) : null },
                                    { label: 'Separación ancho', value: troquelSel.separacionAncho ? `${troquelSel.separacionAncho} mm` : null },
                                    { label: 'Valor Z', value: troquelSel.valorZ ? String(troquelSel.valorZ) : null },
                                    { label: 'Dist. sesgado', value: troquelSel.distanciaSesgado ? `${troquelSel.distanciaSesgado} mm` : null },
                                ].filter(f => f.value != null && f.value !== '').map(f => (
                                    <View key={f.label} style={{ minWidth: 110 }}>
                                        <Text style={{ fontSize: 11, color: '#475569', fontWeight: '600', marginBottom: 2 }}>{f.label}</Text>
                                        <Text style={{ fontSize: 13, color: '#0F172A', fontWeight: '700' }}>{f.value}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                        <View style={styles.row}>
                            <View style={styles.col}>
                                <Text style={styles.label}>Material</Text>
                                <BotonSelector
                                    opciones={materiales}
                                    valorSeleccionado={material}
                                    onSelect={setMaterial}
                                    required={true}
                                    submitted={submitted}
                                    disabled={isReadOnly}
                                />
                            </View>
                            <View style={styles.col}>
                                <Text style={styles.label}>Acabado</Text>
                                <BotonSelector
                                    opciones={acabados}
                                    valorSeleccionado={acabado}
                                    onSelect={setAcabado}
                                    multiple={true}
                                    required={false}
                                    submitted={submitted}
                                    disabled={isReadOnly}
                                />
                            </View>
                        </View>
                        <View style={styles.row}>
                            <View style={styles.col}>
                                <Text style={styles.label}>Tirada total</Text>
                                <TextInput
                                    value={tirada}
                                    onChangeText={(t) => { if (isReadOnly) return; setTirada(t); }}
                                    keyboardType="numeric"
                                    placeholder="Cantidad"
                                    placeholderTextColor="#94A3B8"
                                    style={styles.input(tirada, true, true, submitted)}
                                    editable={!isReadOnly}
                                />
                            </View>
                        </View>
                    </View>
                    <View style={styles.divider} />

                    {/* IMPRESIÓN */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Impresión</Text>
                        <View style={styles.row}>
                            <View style={styles.col}>
                                <Text style={styles.label}>Tintas</Text>
                                <TintasSelector
                                    selectedTintas={selectedTintas}
                                    setSelectedTintas={setSelectedTintas}
                                    opcionesTintas={tintasOpciones}
                                    pantones={pantones}
                                    onRemovePantone={removePantoneAt}
                                    onStartAdd={() => { if (isReadOnly) return; setAddingPantone(true); setPantoneInput(''); }}
                                    addingPantone={addingPantone}
                                    addingValue={pantoneInput}
                                    onChangeAdding={(t) => { if (isReadOnly) return; setPantoneInput(t); }}
                                    onConfirmAdding={(txt) => {
                                        const val = (txt || '').trim();
                                        if (val && !isReadOnly) addPantone(val);
                                        setAddingPantone(false);
                                        setPantoneInput('');
                                    }}
                                    addingMatchHex={(findPantoneInMap(pantoneInput) || {}).data ? srgbToHex((findPantoneInMap(pantoneInput) || {}).data.srgb) : null}
                                    disabled={isReadOnly}
                                />
                                <Text style={styles.tintaCounter}>Nº de tintas seleccionadas: {numeroTintasSeleccionadas}</Text>
                                
                            </View>
                            <View style={styles.col}>
                                <Text style={styles.label}>Tinta especial</Text>
                                {tintasEspeciales.length > 0 ? (
                                    <BotonSelector
                                        opciones={tintasEspeciales}
                                        valorSeleccionado={detalleTintaEspecial}
                                        onSelect={setDetalleTintaEspecial}
                                        multiple={true}
                                        required={false}
                                        submitted={submitted}
                                    />
                                ) : (
                                    <TextInput
                                        value={Array.isArray(detalleTintaEspecial) ? detalleTintaEspecial.join(', ') : ''}
                                        onChangeText={(text) => setDetalleTintaEspecial(parseTintasEspecialesTexto(text))}
                                        placeholder="Ej: metalizada, oro"
                                        placeholderTextColor="#94A3B8"
                                        style={styles.input(detalleTintaEspecial, false, false, submitted)}
                                    />
                                )}
                            </View>
                        </View>
                    </View>

                    {/* SUBMIT */}
                    <View style={styles.submitContainer}>
                        <TouchableOpacity
                            style={[styles.bigBtn, styles.submitBtn, !puedeCrear && { opacity: 0.45 }]}
                            onPress={() => puedeCrear && handleSubmit()}
                            disabled={!puedeCrear}
                        >
                            <Text style={[styles.bigBtnText, { color: '#F8FAFC' }]}>{submitLabel}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.bigBtn} onPress={handleClose}>
                            <Text style={styles.bigBtnText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                    {!puedeCrear && (
                        <View style={{ paddingHorizontal: 16, marginTop: 6 }}>
                            <Text style={{ color: '#777', fontSize: 12 }}>Tu rol no permite crear presupuestos.</Text>
                        </View>
                    )}
                </ScrollView>

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
                            <Text style={styles.pickerModalTitle}>Seleccionar cliente</Text>
                            <TextInput
                                value={busquedaCliente}
                                onChangeText={setBusquedaCliente}
                                placeholder="Buscar por nombre, CIF, contacto o email"
                                placeholderTextColor="#94A3B8"
                                style={styles.input(busquedaCliente, false, false, false)}
                            />

                            <ScrollView>
                                {cargandoClientes ? (
                                    <Text style={styles.pickerItemSub}>Cargando clientes...</Text>
                                ) : clientesFiltrados.length === 0 ? (
                                    <Text style={styles.pickerItemSub}>No hay clientes guardados</Text>
                                ) : (
                                    clientesFiltrados.map((item) => (
                                        <TouchableOpacity
                                            key={item.id}
                                            style={styles.pickerItem}
                                            onPress={() => seleccionarClienteGuardado(item)}
                                        >
                                            <Text style={styles.pickerItemTitle}>{item.nombre || '-'}</Text>
                                            <Text style={styles.pickerItemSub}>
                                                {(item.razon_social || 'Sin razón social')} • {(item.cif || 'Sin CIF')}
                                            </Text>
                                            <Text style={styles.pickerItemSub}>
                                                {(item.personas_contacto || 'Sin contacto')} • {(item.email || 'Sin email')}
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
                                    <Text style={styles.bigBtnText}>Cerrar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
                {/* ── Troquel create sub-modal ── */}
                <Modal visible={showTroquelCreate} transparent animationType="fade" onRequestClose={() => setShowTroquelCreate(false)}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 480 }}>
                            <Text style={{ fontSize: 18, fontWeight: '800', color: '#1D2939', marginBottom: 16 }}>Nuevo troquel</Text>

                            <Text style={styles.label}>Número / Referencia *</Text>
                            <TextInput
                                style={styles.input(troquelCreateForm.numero, true, false, false)}
                                value={troquelCreateForm.numero}
                                onChangeText={(v) => setTroquelCreateForm(p => ({ ...p, numero: v }))}
                                placeholder="Ej. TR-001"
                                placeholderTextColor="#94A3B8"
                                autoFocus
                            />

                            <Text style={[styles.label, { marginTop: 10 }]}>Tipo</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                                {troquelTipo.map((t) => (
                                    <TouchableOpacity
                                        key={t}
                                        onPress={() => setTroquelCreateForm(p => ({ ...p, tipo: t }))}
                                        style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: troquelCreateForm.tipo === t ? '#475569' : '#f0f0f0' }}
                                    >
                                        <Text style={{ color: troquelCreateForm.tipo === t ? '#fff' : '#444', fontSize: 13 }}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={[styles.label]}>Forma</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                                {troquelForma.map((f) => (
                                    <TouchableOpacity
                                        key={f}
                                        onPress={() => setTroquelCreateForm(p => ({ ...p, forma: f }))}
                                        style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: troquelCreateForm.forma === f ? '#475569' : '#f0f0f0' }}
                                    >
                                        <Text style={{ color: troquelCreateForm.forma === f ? '#fff' : '#444', fontSize: 13 }}>{f}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={[styles.label]}>Estado</Text>
                            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                                {troquelEstado.map((e) => (
                                    <TouchableOpacity
                                        key={e}
                                        onPress={() => setTroquelCreateForm(p => ({ ...p, estado: e }))}
                                        style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: troquelCreateForm.estado === e ? '#475569' : '#f0f0f0' }}
                                    >
                                        <Text style={{ color: troquelCreateForm.estado === e ? '#fff' : '#444', fontSize: 13 }}>{e}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 4 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Ancho motivo (mm)</Text>
                                    <TextInput
                                        style={styles.input('', false, true, false)}
                                        value={troquelCreateForm.anchoMotivo}
                                        onChangeText={(v) => setTroquelCreateForm(p => ({ ...p, anchoMotivo: v }))}
                                        placeholder="Ej. 100"
                                        placeholderTextColor="#94A3B8"
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Alto motivo (mm)</Text>
                                    <TextInput
                                        style={styles.input('', false, true, false)}
                                        value={troquelCreateForm.altoMotivo}
                                        onChangeText={(v) => setTroquelCreateForm(p => ({ ...p, altoMotivo: v }))}
                                        placeholder="Ej. 150"
                                        placeholderTextColor="#94A3B8"
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Motivos ancho</Text>
                                    <TextInput
                                        style={styles.input('', false, true, false)}
                                        value={troquelCreateForm.motivosAncho}
                                        onChangeText={(v) => setTroquelCreateForm(p => ({ ...p, motivosAncho: v }))}
                                        placeholder="Ej. 4"
                                        placeholderTextColor="#94A3B8"
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                            </View>

                            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Separación (mm)</Text>
                                    <TextInput
                                        style={styles.input('', false, true, false)}
                                        value={troquelCreateForm.separacionAncho}
                                        onChangeText={(v) => setTroquelCreateForm(p => ({ ...p, separacionAncho: v }))}
                                        placeholder="Ej. 3"
                                        placeholderTextColor="#94A3B8"
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Valor Z (mm)</Text>
                                    <TextInput
                                        style={styles.input('', false, true, false)}
                                        value={troquelCreateForm.valorZ}
                                        onChangeText={(v) => setTroquelCreateForm(p => ({ ...p, valorZ: v }))}
                                        placeholder="Ej. 110"
                                        placeholderTextColor="#94A3B8"
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Dist. sesgado (mm)</Text>
                                    <TextInput
                                        style={styles.input('', false, true, false)}
                                        value={troquelCreateForm.distanciaSesgado}
                                        onChangeText={(v) => setTroquelCreateForm(p => ({ ...p, distanciaSesgado: v }))}
                                        placeholder="Ej. 0"
                                        placeholderTextColor="#94A3B8"
                                        keyboardType="decimal-pad"
                                    />
                                </View>
                            </View>

                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                                <TouchableOpacity
                                    onPress={() => setShowTroquelCreate(false)}
                                    style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8, backgroundColor: '#f5f5f5' }}
                                >
                                    <Text style={{ color: '#555', fontWeight: '600' }}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={saveTroquelFromModal}
                                    disabled={savingTroquel}
                                    style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8, backgroundColor: '#475569' }}
                                >
                                    <Text style={{ color: '#fff', fontWeight: '700' }}>{savingTroquel ? 'Guardando...' : 'Guardar'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* ── Máquina create sub-modal ── */}
                <Modal visible={showMaquinaCreate} transparent animationType="fade" onRequestClose={() => setShowMaquinaCreate(false)}>
                    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 0, width: '100%', maxWidth: 580, overflow: 'hidden' }}>
                            <View style={{ backgroundColor: '#1E293B', paddingVertical: 14, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{ fontSize: 17, fontWeight: '800', color: '#F8FAFC' }}>Nueva máquina</Text>
                                <TouchableOpacity onPress={() => setShowMaquinaCreate(false)}>
                                    <Text style={{ color: '#94A3B8', fontSize: 14, fontWeight: '600' }}>Cerrar</Text>
                                </TouchableOpacity>
                            </View>
                            <ScrollView style={{ padding: 20 }} contentContainerStyle={{ paddingBottom: 8 }}>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                                    <View style={{ width: '100%' }}>
                                        <Text style={styles.label}>Marca y modelo *</Text>
                                        <TextInput
                                            style={styles.input(maquinaCreateForm.nombre, true, false, false)}
                                            value={maquinaCreateForm.nombre}
                                            onChangeText={(v) => setMaquinaCreateForm(p => ({ ...p, nombre: v }))}
                                            placeholder="Ej. Rotativa A"
                                            placeholderTextColor="#94A3B8"
                                            autoFocus
                                        />
                                    </View>
                                    <View style={{ flex: 1, minWidth: 140 }}>
                                        <Text style={styles.label}>Año fabricación / versión</Text>
                                        <TextInput
                                            style={styles.input(maquinaCreateForm.anio_fabricacion, false, false, false)}
                                            value={maquinaCreateForm.anio_fabricacion}
                                            onChangeText={(v) => setMaquinaCreateForm(p => ({ ...p, anio_fabricacion: v }))}
                                            placeholder="Ej. 2018"
                                            placeholderTextColor="#94A3B8"
                                        />
                                    </View>
                                    <View style={{ flex: 1, minWidth: 140 }}>
                                        <Text style={styles.label}>Tipo de máquina</Text>
                                        <TextInput
                                            style={styles.input(maquinaCreateForm.tipo_maquina, false, false, false)}
                                            value={maquinaCreateForm.tipo_maquina}
                                            onChangeText={(v) => setMaquinaCreateForm(p => ({ ...p, tipo_maquina: v }))}
                                            placeholder="Ej. Flexográfica"
                                            placeholderTextColor="#94A3B8"
                                        />
                                    </View>
                                    <View style={{ flex: 1, minWidth: 140 }}>
                                        <Text style={styles.label}>Número de colores</Text>
                                        <TextInput
                                            style={styles.input(maquinaCreateForm.numero_colores, false, true, false)}
                                            value={maquinaCreateForm.numero_colores}
                                            onChangeText={(v) => setMaquinaCreateForm(p => ({ ...p, numero_colores: v }))}
                                            placeholder="Ej. 4"
                                            placeholderTextColor="#94A3B8"
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <View style={{ flex: 1, minWidth: 140 }}>
                                        <Text style={styles.label}>Estado</Text>
                                        {Platform.OS === 'web' ? (
                                            <View style={{ borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', borderRadius: 10, marginBottom: 10, overflow: 'hidden' }}>
                                                <select
                                                    value={maquinaCreateForm.estado || 'Activa'}
                                                    onChange={(e) => setMaquinaCreateForm(p => ({ ...p, estado: e.target.value }))}
                                                    style={{ width: '100%', borderWidth: 0, backgroundColor: 'transparent', paddingTop: 8, paddingBottom: 8, paddingLeft: 10, paddingRight: 10, fontSize: 14, color: '#0F172A', cursor: 'pointer', outlineWidth: 0 }}
                                                >
                                                    <option value="Activa">Activa</option>
                                                    <option value="Inactiva">Inactiva</option>
                                                </select>
                                            </View>
                                        ) : (
                                            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                                                {['Activa', 'Inactiva'].map(op => (
                                                    <TouchableOpacity key={op} onPress={() => setMaquinaCreateForm(p => ({ ...p, estado: op }))}
                                                        style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: maquinaCreateForm.estado === op ? '#475569' : '#F1F5F9' }}>
                                                        <Text style={{ color: maquinaCreateForm.estado === op ? '#fff' : '#475569', fontSize: 13 }}>{op}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                    <View style={{ flex: 1, minWidth: 140 }}>
                                        <Text style={styles.label}>Ancho máx. material (mm)</Text>
                                        <TextInput
                                            style={styles.input(maquinaCreateForm.ancho_max_material_mm, false, true, false)}
                                            value={maquinaCreateForm.ancho_max_material_mm}
                                            onChangeText={(v) => setMaquinaCreateForm(p => ({ ...p, ancho_max_material_mm: v }))}
                                            placeholder="Ej. 450"
                                            placeholderTextColor="#94A3B8"
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <View style={{ flex: 1, minWidth: 140 }}>
                                        <Text style={styles.label}>Ancho máx. impresión (mm)</Text>
                                        <TextInput
                                            style={styles.input(maquinaCreateForm.ancho_max_impresion_mm, false, true, false)}
                                            value={maquinaCreateForm.ancho_max_impresion_mm}
                                            onChangeText={(v) => setMaquinaCreateForm(p => ({ ...p, ancho_max_impresion_mm: v }))}
                                            placeholder="Ej. 420"
                                            placeholderTextColor="#94A3B8"
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <View style={{ flex: 1, minWidth: 140 }}>
                                        <Text style={styles.label}>Velocidad máx. (m/min)</Text>
                                        <TextInput
                                            style={styles.input(maquinaCreateForm.velocidad_max_maquina_mmin, false, true, false)}
                                            value={maquinaCreateForm.velocidad_max_maquina_mmin}
                                            onChangeText={(v) => setMaquinaCreateForm(p => ({ ...p, velocidad_max_maquina_mmin: v }))}
                                            placeholder="Ej. 150"
                                            placeholderTextColor="#94A3B8"
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <View style={{ flex: 1, minWidth: 140 }}>
                                        <Text style={styles.label}>Espesor planchas (mm)</Text>
                                        <TextInput
                                            style={styles.input(maquinaCreateForm.espesor_planchas_mm, false, true, false)}
                                            value={maquinaCreateForm.espesor_planchas_mm}
                                            onChangeText={(v) => setMaquinaCreateForm(p => ({ ...p, espesor_planchas_mm: v }))}
                                            placeholder="Ej. 1.14"
                                            placeholderTextColor="#94A3B8"
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <View style={{ width: '100%' }}>
                                        <Text style={styles.label}>Sistemas de secado</Text>
                                        <TextInput
                                            style={styles.input(maquinaCreateForm.sistemas_secado, false, false, false)}
                                            value={maquinaCreateForm.sistemas_secado}
                                            onChangeText={(v) => setMaquinaCreateForm(p => ({ ...p, sistemas_secado: v }))}
                                            placeholder="Ej. UV, secado por aire"
                                            placeholderTextColor="#94A3B8"
                                        />
                                    </View>
                                </View>
                            </ScrollView>
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
                                <TouchableOpacity
                                    onPress={() => setShowMaquinaCreate(false)}
                                    style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' }}
                                >
                                    <Text style={{ color: '#475569', fontWeight: '600' }}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={saveMaquinaFromModal}
                                    disabled={savingMaquina}
                                    style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, backgroundColor: '#475569' }}
                                >
                                    <Text style={{ color: '#fff', fontWeight: '700' }}>{savingMaquina ? 'Guardando...' : 'Guardar'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                </View>
            </View>
        </Modal>
    );
}

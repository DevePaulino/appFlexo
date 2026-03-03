import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform, Image, Modal, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const TINTAS_BASE_CMYK = [
    { label: 'C', color: '#00AEEF', isCMYK: true },
    { label: 'M', color: '#EC008C', isCMYK: true },
    { label: 'Y', color: '#FFF200', isCMYK: true },
    { label: 'K', color: '#232323', isCMYK: true }
];
const troquelEstado = ['Nuevo', 'Usado'];
const troquelForma = ['Rectangular', 'Circular', 'Irregular'];

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
    container: { paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#E9EEF5', flex: 1 },
    section: {
        marginBottom: 10,
        marginTop: 4,
        backgroundColor: '#FFF',
        borderRadius: 14,
        padding: 16,
        borderWidth: 1.5,
        borderColor: '#D0D5DD'
    },
    sectionTitle: { fontSize: 16, fontWeight: '900', color: '#1D2939', marginBottom: 10, letterSpacing: 0.2 },
    divider: { borderBottomWidth: 1, borderBottomColor: '#E0E0E0', marginVertical: 8 },
    label: { fontSize: 13, color: '#444', fontWeight: '700', marginBottom: 6 },
    row: { flexDirection: 'row', gap: 12, marginBottom: 10, alignItems: 'flex-start' },
    col: { flex: 1 },
    input: (value, isRequired, isNumeric = false, submitted = false) => ({
        fontSize: 14,
        borderWidth: 1,
        borderColor: borderColorState(value, isRequired, isNumeric, submitted),
        backgroundColor: '#FBFBFD',
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 10,
        marginBottom: 10,
        fontFamily: 'System, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen"',
        color: '#232323'
    }),
    errorText: { color: '#D21820', fontSize: 13, marginTop: -5, marginBottom: 7, fontWeight: '500' },
    selectorRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
    bigBtn: {
        backgroundColor: '#A8A8AA', paddingHorizontal: 16, paddingVertical: 10,
        borderRadius: 12,
        alignItems: 'center', marginBottom: 8, minWidth: 160
    },
    bigBtnText: {
        color: '#FFF', fontWeight: '700', fontSize: 13
    },
    tintaBtn: (active, tinta) => ({
        paddingHorizontal: 14, paddingVertical: 12,
        backgroundColor: active ? '#E8E8EC' : '#FBFBFD',
        borderRadius: 22,
        borderWidth: active ? 2.4 : 1,
        borderColor: active ? (tinta.isCMYK ? tinta.color : '#DDD') : '#DDD',
        marginRight: 8, marginBottom: 8, minWidth: 45, alignItems: 'center'
    }),
    tintaTxt: { color: '#232323', fontWeight: '700', fontSize: 15, fontFamily: 'System, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen"' },
    tintaCounter: {
        marginTop: -4, marginBottom: 8, backgroundColor: '#EEEEEE', alignSelf: 'flex-start', paddingHorizontal: 18,
        paddingVertical: 7, borderRadius: 14, fontWeight: '700', fontSize: 16, color: '#444', letterSpacing: 0.5
    },
    coverageRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4, marginBottom: 8 },
    coverageBtn: (color) => ({
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22, borderWidth: 2,
        borderColor: color, backgroundColor: '#FBFBFD', marginRight: 8, marginBottom: 8, minWidth: 60, alignItems: 'center'
    }),
    coverageTxt: { color: '#232323', fontWeight: '700', fontSize: 15, fontFamily: 'System, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen"' },
    submitContainer: { alignItems: 'center', marginTop: 24, marginBottom: 20 },
    submitBtn: {
        backgroundColor: '#344054', paddingHorizontal: 22, paddingVertical: 10,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
    },
    submitText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
    etiquetaHalfCol: { width: 140, minHeight: 170, borderRadius: 14, marginRight: 10, resizeMode: 'contain', alignSelf: 'flex-start' },
    etiquetaBtn: { marginTop: 6, alignSelf: 'flex-start' },
    modalHeader: {
        backgroundColor: '#344054',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#243447',
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
        borderColor: '#CCC',
        backgroundColor: '#FBFBFD',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 10,
        marginBottom: 10,
    },
    clientePickerBtnText: {
        fontSize: 14,
        color: '#232323',
        fontWeight: '600',
    },
    clientePickerHint: {
        fontSize: 12,
        color: '#666',
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
        borderColor: '#D0D5DD',
        maxHeight: '75%',
        padding: 14,
    },
    pickerModalTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: '#232323',
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
        color: '#232323',
    },
    pickerItemSub: {
        fontSize: 12,
        color: '#666',
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
        color: '#232323',
    },
    sugerenciaSub: {
        fontSize: 12,
        color: '#666',
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
                    ? '#3AB274'
                    : (sinSeleccion && required && submitted
                        ? '#D21820'
                        : '#CCC');
            return (
                <TouchableOpacity
                    key={opcion}
                    style={{
                        paddingHorizontal: small ? 12 : 18,
                        paddingVertical: small ? 8 : 12,
                        backgroundColor: active ? '#E8E8EC' : '#FBFBFD',
                        borderRadius: 22,
                        borderWidth: 2,
                        borderColor: border,
                        marginRight: 8,
                        marginBottom: 8,
                        minWidth: small ? 70 : 90,
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
                        color: active ? '#393B3F' : '#6C6C70',
                        fontWeight: active ? '700' : '500',
                        fontFamily: 'System, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen"',
                        fontSize: 15
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
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
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
                autoFocus
                onSubmitEditing={(e) => {
                    const txt = (e.nativeEvent && e.nativeEvent.text) || addingValue;
                    if (typeof onConfirmAdding === 'function') onConfirmAdding(txt);
                }}
                onBlur={() => {
                    if (typeof onConfirmAdding === 'function') onConfirmAdding(addingValue);
                }}
                style={{
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 22,
                    minWidth: 80,
                    textAlign: 'center',
                    marginRight: 8,
                    marginBottom: 8,
                    backgroundColor: addingMatchHex || '#EFEFEF',
                    color: addingMatchHex ? '#FFF' : '#6C6C70',
                }}
            />
        ) : (
            <TouchableOpacity
                style={{ paddingHorizontal: 14, paddingVertical: 12, borderRadius: 22, backgroundColor: '#EFEFEF', borderWidth: 1, borderColor: '#DDD', marginRight: 8, marginBottom: 8, minWidth: 45, alignItems: 'center' }}
                onPress={() => {
                    if (disabled) return;
                    if (typeof onStartAdd === 'function') onStartAdd();
                }}
            >
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#6C6C70' }}>+</Text>
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
    const [vendedor, setVendedor] = useState('');
    const [formatoAncho, setFormatoAncho] = useState('');
    const [formatoLargo, setFormatoLargo] = useState('');
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
            setVendedor(initialValues.datos_presupuesto?.vendedor || '');
            setFormatoAncho(initialValues.datos_presupuesto?.formatoAncho || initialValues.formatoAncho || '');
            setFormatoLargo(initialValues.datos_presupuesto?.formatoLargo || initialValues.formatoLargo || '');
            setMaquina(initialValues.datos_presupuesto?.maquina || initialValues.maquina || '');
            setMaterial(initialValues.datos_presupuesto?.material || initialValues.material || '');
            setAcabado(initialValues.datos_presupuesto?.acabado || initialValues.acabado || []);
            setTirada(initialValues.datos_presupuesto?.tirada || initialValues.tirada || '');
            setSelectedTintas(initialValues.datos_presupuesto?.selectedTintas || initialValues.selectedTintas || []);
            setDetalleTintaEspecial(initialValues.datos_presupuesto?.detalleTintaEspecial || initialValues.detalleTintaEspecial || []);
            setTroquelEstadoSel(initialValues.datos_presupuesto?.troquelEstadoSel || initialValues.troquelEstadoSel || '');
            setTroquelFormaSel(initialValues.datos_presupuesto?.troquelFormaSel || initialValues.troquelFormaSel || '');
            setTroquelCoste(initialValues.datos_presupuesto?.troquelCoste || initialValues.troquelCoste || '');
            setObservaciones(initialValues.datos_presupuesto?.observaciones || initialValues.observaciones || '');
        } catch (e) {
            // ignore
        }
    }, [initialValues]);

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
    const numeroTintasSeleccionadas = selectedTintas.length;
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
    const [pantoneModalVisible, setPantoneModalVisible] = useState(false);
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
            const response = await fetch('http://localhost:8080/api/settings');
            const data = response.ok ? await response.json() : { settings: {} };
            const settings = data.settings || {};
            setCatalogos({
                materiales: settings.materiales || [],
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
            setUsuariosComerciales(Array.isArray(data.usuarios) ? data.usuarios : []);
        } catch {
            setUsuariosComerciales([]);
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

    useEffect(() => {
        if (visible) {
            cargarClientesGuardados();
            cargarCatalogos();
            cargarUsuariosComerciales();
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
        if (fechaEntregaAntesCreacion) return;

        if (showMaquinaField && maquinaIncompatible) return;

        const acabadoValido = Array.isArray(acabado) ? acabado.length > 0 : !!acabado;

        const missing = [];
        // Allow non-saved clients: require cliente name but don't force clienteSeleccionadoId
        if (!cliente) missing.push('Nombre cliente');
        if (!referencia) missing.push('Referencia');
        if (!formatoAncho) missing.push('Formato ancho');
        if (!formatoLargo) missing.push('Formato largo');
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

        if (cliente && referencia && formatoAncho && formatoLargo && material && acabadoValido && tirada && selectedTintas.length > 0 && fechaEntregaValida && maquinaValida) {
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
                formatoAncho,
                formatoLargo,
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
        setFormatoAncho('');
        setFormatoLargo('');
        setMaquina('');
        setMaterial('');
        setAcabado([]);
        setTirada('');
        setSelectedTintas([]);
        setDetalleTintaEspecial([]);
        setImagenCobertura(null);
        setEtiquetaUri(null);
        setTroquelEstadoSel('');
        setTroquelFormaSel('');
        setTroquelCoste('');
        setObservaciones('');
        setCoberturaResult(null);
        setSubmitted(false);
        setCoberturaError('');
        setClienteSeleccionadoId(null);
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
        <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
            <View style={{ flex: 1, backgroundColor: '#E9EEF5' }}>
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
                                            style={styles.clientePickerBtn}
                                            onPress={() => { if (isReadOnly) return; setClientePickerVisible(true); }}
                                        >
                                            <Text style={styles.clientePickerBtnText}>Seleccionar cliente guardado</Text>
                                        </TouchableOpacity>
                                        <Text style={styles.clientePickerHint}>Al seleccionar un cliente, se autocompletan los datos comerciales</Text>
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
                                            <div style={{ borderWidth: 1, borderStyle: 'solid', borderColor: borderColorState(vendedor, true, false, submitted), backgroundColor: '#FBFBFD', borderRadius: 10, marginBottom: 10, overflow: 'hidden', padding: 0 }}>
                                                <select
                                                    value={vendedor}
                                                    onChange={(e) => { if (isReadOnly) return; setVendedor(e.target.value); }}
                                                    disabled={isReadOnly}
                                                    style={{ width: '100%', border: 'none', backgroundColor: 'transparent', padding: '10px 12px', fontSize: '14px', color: '#232323', outline: 'none', WebkitAppearance: 'none', appearance: 'none', cursor: isReadOnly ? 'default' : 'pointer' }}
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
                                            style={styles.input(referencia, true, false, submitted)}
                                            editable={!isReadOnly}
                                        />
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row', gap: 16, marginTop: 0 }}>
                                    <View style={styles.col}>
                                        <Text style={styles.label}>Razón social</Text>
                                        <TextInput
                                            value={razonSocial}
                                            onChangeText={() => {}}
                                            placeholder="Razón social"
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
                                <View style={{ flexDirection: 'row', gap: 16, marginTop: 0 }}>
                                    <View style={styles.col}>
                                        <Text style={styles.label}>Personas de contacto</Text>
                                        <TextInput
                                            value={personasContacto}
                                            onChangeText={() => {}}
                                            placeholder="Nombre(s) de contacto"
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
                        </View>
                    </View>
                    <View style={styles.divider} />

                    {/* PRODUCTO */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Producto</Text>
                        <View style={styles.row}>
                            <View style={styles.col}>
                                <Text style={styles.label}>Formato ancho (mm)</Text>
                                <TextInput
                                    value={formatoAncho}
                                        onChangeText={(t) => { if (isReadOnly) return; setFormatoAncho(t); }}
                                    keyboardType="numeric"
                                    placeholder="Ej: 100"
                                            style={styles.input(formatoAncho, true, true, submitted)}
                                            editable={!isReadOnly}
                                />
                            </View>
                            <View style={styles.col}>
                                <Text style={styles.label}>Formato largo (mm)</Text>
                                <TextInput
                                    value={formatoLargo}
                                        onChangeText={(t) => { if (isReadOnly) return; setFormatoLargo(t); }}
                                    keyboardType="numeric"
                                    placeholder="Ej: 200"
                                            style={styles.input(formatoLargo, true, true, submitted)}
                                            editable={!isReadOnly}
                                />
                            </View>
                            {showMaquinaField && (
                                <View style={styles.col}>
                                    <Text style={styles.label}>{maquinaLabel}</Text>
                                    {Platform.OS === 'web' ? (
                                        <View style={{
                                            borderWidth: 1,
                                            borderColor: submitted && maquinaIncompatible ? '#D21820' : borderColorState(maquina, true, false, submitted),
                                            backgroundColor: '#FBFBFD',
                                            borderRadius: 10,
                                            marginBottom: 10,
                                            overflow: 'hidden'
                                        }}>
                                            <select
                                                value={maquina}
                                                onChange={(e) => setMaquina(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    border: 'none',
                                                    backgroundColor: 'transparent',
                                                    padding: '10px',
                                                    fontSize: '14px',
                                                    color: '#232323'
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
                        </View>
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
                                <Text style={styles.tintaCounter}>Nº de tintas seleccionadas: {selectedTintas.length}</Text>
                                
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
                            <Text style={styles.bigBtnText}>{submitLabel}</Text>
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
                <Modal
                    visible={pantoneModalVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setPantoneModalVisible(false)}
                >
                    <View style={styles.pickerModalOverlay}>
                        <View style={styles.pickerModalCard}>
                            <Text style={styles.pickerModalTitle}>Añadir Pantone</Text>
                            <TextInput
                                value={pantoneInput}
                                onChangeText={setPantoneInput}
                                placeholder="Ej: 485 o PANTONE 485 C"
                                style={styles.input(pantoneInput, false, false, false)}
                            />
                            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                                <TouchableOpacity style={styles.bigBtn} onPress={() => setPantoneModalVisible(false)}>
                                    <Text style={styles.bigBtnText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.bigBtn, { marginLeft: 8 }]}
                                    onPress={() => {
                                        if (pantoneInput && pantoneInput.trim()) {
                                            const txt = pantoneInput.trim();
                                            if (pantoneTargetIndex !== null && pantoneTargetIndex !== undefined) {
                                                addPantoneAt(pantoneTargetIndex, txt);
                                            } else {
                                                addPantone(txt);
                                            }
                                        }
                                        setPantoneTargetIndex(null);
                                        setPantoneModalVisible(false);
                                    }}
                                >
                                    <Text style={styles.bigBtnText}>Añadir</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            </View>
        </Modal>
    );
}

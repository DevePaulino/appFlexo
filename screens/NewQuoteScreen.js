import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform, Image } from 'react-native';  // asegurate de importar Platform
import DateTimePicker from '@react-native-community/datetimepicker';

const materiales = ['Polipropileno', 'Papel', 'PVC', 'PE', 'PET'];
const acabados = ['Barniz', 'Stamping', 'Laminado', 'Sin acabado'];
const tintas = [
    { label: 'C', color: '#00AEEF', isCMYK: true },
    { label: 'M', color: '#EC008C', isCMYK: true },
    { label: 'Y', color: '#FFF200', isCMYK: true },
    { label: 'K', color: '#232323', isCMYK: true },
    { label: 'P1', color: '#ddd', isCMYK: false },
    { label: 'P2', color: '#ddd', isCMYK: false },
    { label: 'P3', color: '#ddd', isCMYK: false },
    { label: 'P4', color: '#ddd', isCMYK: false },
    { label: 'P5', color: '#ddd', isCMYK: false }
];
const troquelEstado = ['Nuevo', 'Usado'];
const troquelForma = ['Rectangular', 'Circular', 'Irregular'];
const tipoImpresionOpciones = ['Frente', 'Reverso', 'Frente/Reverso'];

const maquinasEjemplo = [
    { id: 1, nombre: "Nilpeter FA" },
    { id: 2, nombre: "Gallus ECS" },
    { id: 3, nombre: "Mark Andy" },
    { id: 4, nombre: "Otros modelos" }
];

function borderColorState(value, isRequired, isNumeric = false, submitted = false) {
    if (!isRequired) return '#CCC';
    if ((value === undefined || value === null || value === '') && !submitted) return '#CCC';
    if ((value === undefined || value === null || value === '') && submitted) return '#D21820';
    if (isNumeric && value !== '' && !/^[0-9]+$/.test(value)) return '#D21820';
    if ((typeof value === 'string' && value.trim() === '') || (Array.isArray(value) && value.length === 0)) return submitted ? '#D21820' : '#CCC';
    return '#3AB274';
}

const styles = {
    container: { padding: 20, backgroundColor: '#E9EEF5', flex: 1 },
    section: { marginBottom: 10, marginTop: 4, backgroundColor: '#FFF', borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: '#D0D5DD' },
    sectionTitle: { fontSize: 16, fontWeight: '900', color: '#1D2939', marginBottom: 10, letterSpacing: 0.2 },
    divider: { borderBottomWidth: 1, borderBottomColor: '#E0E0E0', marginVertical: 10 },
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
        backgroundColor: '#A8A8AA', paddingHorizontal: 20, paddingVertical: 10,
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
        backgroundColor: '#344054', paddingHorizontal: 20, paddingVertical: 10,
        borderRadius: 14,
        alignItems: 'center'
    },
    submitText: { color: '#FFF', fontWeight: '700', fontSize: 16, letterSpacing: 0.2 },
    etiquetaHalfCol: { width: 140, minHeight: 170, borderRadius: 14, marginRight: 10, resizeMode: 'contain', alignSelf: 'flex-start' },
    etiquetaBtn: { marginTop: 6, alignSelf: 'flex-start' }
};

const BotonSelector = ({
    opciones,
    valorSeleccionado,
    onSelect,
    small,
    required,
    submitted,
}) => (
    <View style={styles.selectorRow}>
        {opciones.map((opcion) => {
            const active = valorSeleccionado === opcion;
            const border =
                active
                    ? '#3AB274'
                    : (!valorSeleccionado && required && submitted
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
                    onPress={() => onSelect(opcion)}
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

const TintasSelector = ({ selectedTintas, setSelectedTintas }) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
        {tintas.map((tinta) => {
            const active = selectedTintas.includes(tinta.label);
            return (
                <TouchableOpacity
                    key={tinta.label}
                    style={styles.tintaBtn(active, tinta)}
                    onPress={() => {
                        setSelectedTintas(prev =>
                            active ? prev.filter(l => l !== tinta.label) : [...prev, tinta.label]
                        );
                    }}
                >
                    <Text style={styles.tintaTxt}>{tinta.label}</Text>
                </TouchableOpacity>
            );
        })}
    </View>
);

function calcularCoberturaAPI(imagen, selectedTintas) {
    const API_URL = 'http://localhost:8080/calcular-cobertura';
    const formData = new FormData();

    if (Platform.OS === 'web') {
        // Web: imagen es File (del input)
        formData.append('imagen', imagen);
    } else {
        // Móvil: imagen es { uri, ... }
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


export default function NewQuoteScreen({ maquinas = maquinasEjemplo }) {
    const getNowDateStr = () => {
        const d = new Date();
        return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    };
    const formatDateDisplay = (value) => {
        const [y, m, d] = String(value || '').split('-');
        if (!y || !m || !d) return value || '';
        return `${d}-${m}-${y}`;
    };
    const formatDateFromObj = (dateObj) => {
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };
    const [cliente, setCliente] = useState('');
    const [fecha, setFecha] = useState(getNowDateStr());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [referencia, setReferencia] = useState('');
    const [vendedor, setVendedor] = useState('');
    const [formatoAncho, setFormatoAncho] = useState('');
    const [formatoLargo, setFormatoLargo] = useState('');
    const [maquina, setMaquina] = useState('');
    const [material, setMaterial] = useState('');
    const [acabado, setAcabado] = useState('');
    const [tirada, setTirada] = useState('');
    const [selectedTintas, setSelectedTintas] = useState([]);
    const [detalleTintaEspecial, setDetalleTintaEspecial] = useState('');
    const [imagenCobertura, setImagenCobertura] = useState(null);
    const [etiquetaUri, setEtiquetaUri] = useState(null);
    const [tipoImpresion, setTipoImpresion] = useState('');
    const [troquelEstadoSel, setTroquelEstadoSel] = useState('');
    const [troquelFormaSel, setTroquelFormaSel] = useState('');
    const [troquelCoste, setTroquelCoste] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [coberturaResult, setCoberturaResult] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [coberturaError, setCoberturaError] = useState('');

    const pickImageEtiqueta = Platform.OS === 'web'
        ? (e) => {
            if (e.target.files && e.target.files[0]) {
                setEtiquetaUri(URL.createObjectURL(e.target.files[0]));
                setImagenCobertura(e.target.files[0]);
                setCoberturaResult(null);
            }
        }
        : async () => {
            const { launchImageLibraryAsync } = await import('expo-image-picker');
            let result = await launchImageLibraryAsync({ mediaTypes: 'Images', quality: 1 });
            if (!result.canceled) {
                setEtiquetaUri(result.assets[0].uri);
                setImagenCobertura(result.assets[0].uri);
                setCoberturaResult(null);
            }
        };


    const handleCalcularCobertura = async () => {
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
        setSubmitted(true);
    };

    return (
        <ScrollView style={styles.container}>
            {/* DATOS GENERALES */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Datos Generales</Text>
                <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 18 }}>
                    <View style={{ width: 140 }}>
                        {Platform.OS === 'web' ? (
                            <>
                                <div style={{ width: '100%' }}>
                                    {etiquetaUri && (
                                        <img
                                            src={etiquetaUri}
                                            alt="Etiqueta"
                                            style={{
                                                width: 120,
                                                minHeight: 120,
                                                borderRadius: 14,
                                                objectFit: 'contain',
                                                marginBottom: 10,
                                                background: '#232323'
                                            }}
                                        />
                                    )}
                                    <div style={{ position: 'relative', width: '100%' }}>
                                        <button
                                            type="button"
                                            style={{
                                                backgroundColor: '#FBFBFD',
                                                border: '2px solid #CCC',
                                                borderRadius: 22,
                                                padding: '12px 8px',
                                                width: '100%',
                                                color: '#393B3F',
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                minHeight: 39,
                                                fontFamily: 'System, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen"',
                                                fontSize: 15,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            onClick={() => document.getElementById('file-upload').click()}
                                        >
                                            {etiquetaUri ? "Cambiar archivo" : "Seleccionar archivo"}
                                        </button>
                                        <input
                                            id="file-upload"
                                            type="file"
                                            accept=".pdf,image/*"
                                            style={{
                                                position: 'absolute',
                                                left: 0,
                                                top: 0,
                                                width: '100%',
                                                height: '100%',
                                                opacity: 0,
                                                cursor: 'pointer',
                                            }}
                                            onChange={pickImageEtiqueta}
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {etiquetaUri && <Image source={{ uri: etiquetaUri }} style={styles.etiquetaHalfCol} />}
                                <TouchableOpacity style={styles.etiquetaBtn} onPress={pickImageEtiqueta}>
                                    <Text style={{ color: '#6C6C70', fontWeight: '700', fontSize: 15 }}>
                                        {etiquetaUri ? "Cambiar imagen etiqueta" : "Subir imagen etiqueta"}
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>


                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', gap: 16 }}>
                            <View style={styles.col}>
                                <Text style={styles.label}>Cliente</Text>
                                <TextInput
                                    value={typeof cliente === 'string' ? cliente : (cliente && cliente.nombre) || ''}
                                    onChangeText={setCliente}
                                    placeholder="Nombre"
                                    style={styles.input(cliente, true, false, submitted)}
                                />
                            </View>
                            <View style={styles.col}>
                                <Text style={styles.label}>Fecha</Text>
                                {Platform.OS === 'web' ? (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <TextInput
                                            value={formatDateDisplay(fecha)}
                                            style={[styles.input(fecha, true, false, submitted), { flex: 1, marginBottom: 0 }]}
                                            editable={false}
                                        />
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
                                                onChange={e => setFecha(e.target.value)}
                                                style={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    opacity: 0,
                                                    cursor: 'pointer'
                                                }}
                                            />
                                        </View>
                                    </View>
                                ) : (
                                    <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
                                        <TextInput
                                            value={formatDateDisplay(fecha)}
                                            style={[styles.input(fecha, true, false, submitted), { pointerEvents: 'none' }]}
                                            editable={false}
                                        />
                                        {showDatePicker && (
                                            <DateTimePicker
                                                value={fecha ? new Date(fecha) : new Date()}
                                                mode="date"
                                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                                locale="es-ES"
                                                onChange={(event, selectedDate) => {
                                                    if (Platform.OS === 'android') setShowDatePicker(false);
                                                    if (selectedDate) setFecha(formatDateFromObj(selectedDate));
                                                }}
                                            />
                                        )}
                                    </TouchableOpacity>
                                )}
                            </View>
                            <View style={styles.col}>
                                <Text style={styles.label}>Vendedor</Text>
                                <TextInput
                                    value={vendedor}
                                    onChangeText={setVendedor}
                                    placeholder="Nombre vendedor"
                                    style={styles.input(vendedor, true, false, submitted)}
                                />
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 16, marginTop: 0 }}>
                            <View style={styles.col}>
                                <Text style={styles.label}>Referencia / Descripción</Text>
                                <TextInput
                                    value={referencia}
                                    onChangeText={setReferencia}
                                    placeholder="Trabajo/referencia"
                                    style={styles.input(referencia, true, false, submitted)}
                                />
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
                            onChangeText={setFormatoAncho}
                            keyboardType="numeric"
                            placeholder="Ej: 100"
                            style={styles.input(formatoAncho, true, true, submitted)}
                        />
                        {formatoAncho !== '' && !/^[0-9]+$/.test(formatoAncho) && (
                            <Text style={styles.errorText}>Sólo se admiten números</Text>
                        )}
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Formato largo (mm)</Text>
                        <TextInput
                            value={formatoLargo}
                            onChangeText={setFormatoLargo}
                            keyboardType="numeric"
                            placeholder="Ej: 200"
                            style={styles.input(formatoLargo, true, true, submitted)}
                        />
                        {formatoLargo !== '' && !/^[0-9]+$/.test(formatoLargo) && (
                            <Text style={styles.errorText}>Sólo se admiten números</Text>
                        )}
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Máquina</Text>
                        {Platform.OS === 'web' ? (
                            <select
                                value={maquina}
                                onChange={e => setMaquina(e.target.value)}
                                style={{
                                    fontSize: 13,
                                    fontFamily: 'System, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen"',
                                    color: '#0F172A',
                                    border: '1px solid #E2E8F0',
                                    backgroundColor: '#F8FAFC',
                                    borderRadius: 10,
                                    minHeight: 39,
                                    outline: 'none',
                                    padding: '4px 8px',
                                    marginBottom: 8,
                                    fontWeight: 400,
                                    letterSpacing: 0,
                                    appearance: 'none',
                                    cursor: 'pointer',
                                }}>
                                <option value="">Selecciona...</option>
                                {maquinasEjemplo.map(opt => (
                                    <option key={opt.id || opt.nombre || opt} value={opt.nombre || opt}>
                                        {opt.nombre || opt}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            // Pon tu lógica existente para móvil aquí
                            <TextInput
                                value={maquina}
                                onChangeText={setMaquina}
                                placeholder="Máquina"
                                style={styles.input(maquina, true, false, submitted)}
                            />
                        )}
                    </View>
                </View>
                {/* Material, acabado, tirada igual que original */}
                <View style={styles.row}>
                    <View style={styles.col}>
                        <Text style={styles.label}>Material</Text>
                        <BotonSelector
                            opciones={materiales}
                            valorSeleccionado={material}
                            onSelect={setMaterial}
                            required={true}
                            submitted={submitted}
                        />
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Acabado</Text>
                        <BotonSelector
                            opciones={acabados}
                            valorSeleccionado={acabado}
                            onSelect={setAcabado}
                            required={false}
                            submitted={submitted}
                        />
                    </View>
                </View>
                <View style={styles.row}>
                    <View style={styles.col}>
                        <Text style={styles.label}>Tirada total</Text>
                        <TextInput
                            value={tirada}
                            onChangeText={setTirada}
                            keyboardType="numeric"
                            placeholder="Cantidad"
                            style={styles.input(tirada, true, true, submitted)}
                        />
                        {tirada !== '' && !/^[0-9]+$/.test(tirada) && (
                            <Text style={styles.errorText}>Sólo se admiten números</Text>
                        )}
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
                        <TintasSelector selectedTintas={selectedTintas} setSelectedTintas={setSelectedTintas} />
                        <Text style={styles.tintaCounter}>Nº de tintas seleccionadas: {selectedTintas.length}</Text>
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Tinta especial</Text>
                        <TextInput
                            value={detalleTintaEspecial}
                            onChangeText={setDetalleTintaEspecial}
                            placeholder="Ej: metalizada"
                            style={styles.input(detalleTintaEspecial, false, false, submitted)}
                        />
                    </View>
                </View>
                <View style={styles.row}>
                    <View style={styles.col}>
                        <Text style={styles.label}>Calcular cobertura (CMYK)</Text>
                        <TouchableOpacity
                            style={[
                                styles.bigBtn,
                                { backgroundColor: imagenCobertura && selectedTintas.length > 0 ? '#3AB274' : '#A8A8AA' },
                            ]}
                            onPress={handleCalcularCobertura}
                            disabled={!(imagenCobertura && selectedTintas.length > 0)}
                        >
                            <Text style={styles.bigBtnText}>Calcular cobertura</Text>
                        </TouchableOpacity>
                        {coberturaError !== '' && <Text style={styles.errorText}>{coberturaError}</Text>}
                        {coberturaResult && (
                            <View style={styles.coverageRow}>
                                {Object.entries(coberturaResult).map(([key, value]) => {
                                    const colorTinta = (tintas.find(t => t.label === key) || { color: '#DDD' }).color;
                                    return (
                                        <View key={key} style={styles.coverageBtn(colorTinta)}>
                                            <Text style={styles.coverageTxt}>{key}: {value}%</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                </View>
            </View>
            <View style={styles.divider} />

            {/* TROQUEL */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Troquel</Text>
                <View style={styles.row}>
                    <View style={styles.col}>
                        <Text style={styles.label}>¿Nuevo o usado?</Text>
                        <BotonSelector
                            opciones={troquelEstado}
                            valorSeleccionado={troquelEstadoSel}
                            onSelect={setTroquelEstadoSel}
                            required={true}
                            submitted={submitted}
                        />
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Forma</Text>
                        <BotonSelector
                            opciones={troquelForma}
                            valorSeleccionado={troquelFormaSel}
                            onSelect={setTroquelFormaSel}
                            required={true}
                            submitted={submitted}
                        />
                    </View>
                </View>
                <View style={styles.row}>
                    <View style={styles.col}>
                        <Text style={styles.label}>Coste €</Text>
                        <TextInput
                            value={troquelCoste}
                            onChangeText={setTroquelCoste}
                            keyboardType="numeric"
                            placeholder="Coste troquel"
                            style={styles.input(troquelCoste, false, true, submitted)}
                        />
                        {troquelCoste !== '' && !/^[0-9]+$/.test(troquelCoste) && (
                            <Text style={styles.errorText}>Sólo se admiten números</Text>
                        )}
                    </View>
                </View>
            </View>
            <View style={styles.divider} />

            {/* OTROS */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Otros</Text>
                <View style={styles.row}>
                    <View style={styles.col}>
                        <Text style={styles.label}>Observaciones</Text>
                        <TextInput
                            value={observaciones}
                            onChangeText={setObservaciones}
                            placeholder="Notas o comentarios"
                            style={[styles.input(observaciones, false, false, submitted), { minHeight: 50 }]}
                            multiline
                        />
                    </View>
                </View>
            </View>

            {/* SUBMIT */}
            <View style={styles.submitContainer}>
                <TouchableOpacity style={[styles.bigBtn, styles.submitBtn]} onPress={handleSubmit}>
                    <Text style={styles.bigBtnText}>Siguiente: ver cálculo</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

}

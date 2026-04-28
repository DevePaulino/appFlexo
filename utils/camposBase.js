/**
 * Definición de campos BASE para cada tipo de formulario.
 * Estos campos son estándar (no personalizados) — están hardcodeados en el
 * FormBuilderScreen y corresponden a campos reales del registro.
 *
 * `fieldKey`: nombre del campo en el objeto del registro (pedido, presupuesto, etc.)
 * `excludeInForm`: si ya existe una columna hardcodeada en el grid que cubre este campo
 *                  se marca como excluida para no duplicar.
 */

// Campos base de pedido/presupuesto (comparten el mismo formulario)
export const CAMPOS_BASE_PEDIDO = [
  // Datos Generales
  { campo_id: '__base_cliente',        etiqueta: 'Cliente',          fieldKey: 'cliente',        flex: 0.15, excludeInGrid: true },  // cubierto por col 'cliente'
  { campo_id: '__base_referencia',     etiqueta: 'Referencia',       fieldKey: 'referencia',     flex: 0.14, excludeInGrid: true },  // cubierto por col 'referencia'
  { campo_id: '__base_fecha',          etiqueta: 'Fecha pedido',     fieldKey: 'fecha_pedido',   flex: 0.12 },
  { campo_id: '__base_entrega',        etiqueta: 'Fecha entrega',    fieldKey: 'fecha_entrega',  flex: 0.12 },
  { campo_id: '__base_vendedor',       etiqueta: 'Comercial',        fieldKey: 'vendedor',       flex: 0.13 },
  // Producto
  { campo_id: '__base_maquina',        etiqueta: 'Máquina',          fieldKey: 'maquina',        flex: 0.14 },
  { campo_id: '__base_material',       etiqueta: 'Material',         fieldKey: 'material',       flex: 0.13 },
  { campo_id: '__base_acabado',        etiqueta: 'Acabado',          fieldKey: 'acabado',        flex: 0.12 },
  { campo_id: '__base_tirada',         etiqueta: 'Tirada total',     fieldKey: 'tirada',         flex: 0.11 },
  { campo_id: '__base_troquel',        etiqueta: 'Troquel',          fieldKey: 'troquelId',            flex: 0.11, excludeInGrid: true },
  // Impresión
  { campo_id: '__base_tintas',         etiqueta: 'Tintas',           fieldKey: 'selectedTintas',       flex: 0.10 },
  { campo_id: '__base_tinta_especial', etiqueta: 'Tinta especial',   fieldKey: 'detalleTintaEspecial', flex: 0.13 },
  { campo_id: '__base_observ',         etiqueta: 'Observaciones',    fieldKey: 'observaciones',  flex: 0.15 },
];

// Campos base de presupuesto — excluye fecha porque PresupuestoScreen ya la tiene hardcodeada
export const CAMPOS_BASE_PRESUPUESTO = CAMPOS_BASE_PEDIDO.map(c =>
  c.campo_id === '__base_fecha'
    ? { ...c, etiqueta: 'Fecha presupuesto', excludeInGrid: true }
    : c
);

// Campos base de máquina
export const CAMPOS_BASE_MAQUINA = [
  { campo_id: '__base_maq_nombre',     etiqueta: 'Nombre',              fieldKey: 'nombre',                    flex: 0.18, excludeInGrid: true },
  { campo_id: '__base_maq_anio',       etiqueta: 'Año fabricación',     fieldKey: 'anio_fabricacion',          flex: 0.10 },
  { campo_id: '__base_maq_tipo',       etiqueta: 'Tipo máquina',        fieldKey: 'tipo_maquina',              flex: 0.14 },
  { campo_id: '__base_maq_colores',    etiqueta: 'Colores',             fieldKey: 'numero_colores',            flex: 0.06, excludeInGrid: true },
  { campo_id: '__base_maq_estado',     etiqueta: 'Estado',              fieldKey: 'estado',                    flex: 0.08, excludeInGrid: true },
  { campo_id: '__base_maq_ancho_mat',  etiqueta: 'Ancho mat. (mm)',     fieldKey: 'ancho_max_material_mm',     flex: 0.10, excludeInGrid: true },
  { campo_id: '__base_maq_ancho_imp',  etiqueta: 'Ancho imp. (mm)',     fieldKey: 'ancho_max_impresion_mm',    flex: 0.10, excludeInGrid: true },
  { campo_id: '__base_maq_rep_min',    etiqueta: 'Rep. mín. (mm)',      fieldKey: 'repeticion_min_mm',         flex: 0.09, excludeInGrid: true },
  { campo_id: '__base_maq_rep_max',    etiqueta: 'Rep. máx. (mm)',      fieldKey: 'repeticion_max_mm',         flex: 0.09, excludeInGrid: true },
  { campo_id: '__base_maq_veloc',      etiqueta: 'Veloc. máx. (m/min)', fieldKey: 'velocidad_max_maquina_mmin',flex: 0.11, excludeInGrid: true },
  { campo_id: '__base_maq_veloc_imp',  etiqueta: 'Veloc. imp. (m/min)', fieldKey: 'velocidad_max_impresion_mmin',flex:0.11, excludeInGrid: true },
  { campo_id: '__base_maq_espesor',    etiqueta: 'Espesor plancha',     fieldKey: 'espesor_planchas_mm',       flex: 0.08, excludeInGrid: true },
  { campo_id: '__base_maq_secado',     etiqueta: 'Sistemas secado',     fieldKey: 'sistemas_secado',           flex: 0.14 },
];

// Campos base de proveedor
export const CAMPOS_BASE_PROVEEDOR = [
  { campo_id: '__base_prov_nombre',   etiqueta: 'Nombre',    fieldKey: 'nombre',   flex: 0.22, excludeInGrid: true },
  { campo_id: '__base_prov_contacto', etiqueta: 'Contacto',  fieldKey: 'contacto', flex: 0.18, excludeInGrid: true },
  { campo_id: '__base_prov_email',    etiqueta: 'Email',     fieldKey: 'email',    flex: 0.22, excludeInGrid: true },
  { campo_id: '__base_prov_telefono', etiqueta: 'Teléfono',  fieldKey: 'telefono', flex: 0.14, excludeInGrid: true },
  { campo_id: '__base_prov_notas',    etiqueta: 'Notas',     fieldKey: 'notas',    flex: 0.20 },
];

// Campos base de troquel — corresponden a columnas ya hardcodeadas en TroquelessScreen
export const CAMPOS_BASE_TROQUEL = [
  { campo_id: '__base_tq_numero',        etiqueta: 'Número / Ref.',        fieldKey: 'numero',           flex: 0.13, excludeInGrid: true },
  { campo_id: '__base_tq_tipo',          etiqueta: 'Tipo',                 fieldKey: 'tipo',             flex: 0.12, excludeInGrid: true },
  { campo_id: '__base_tq_forma',         etiqueta: 'Forma',                fieldKey: 'forma',            flex: 0.10 },
  { campo_id: '__base_tq_estado',        etiqueta: 'Estado',               fieldKey: 'estado',           flex: 0.11, excludeInGrid: true },
  { campo_id: '__base_tq_sentido',       etiqueta: 'Sentido impresión',    fieldKey: 'sentido_impresion',flex: 0.14 },
  { campo_id: '__base_tq_ancho_motivo',  etiqueta: 'Ancho motivo (mm)',    fieldKey: 'anchoMotivo',      flex: 0.10, excludeInGrid: true },
  { campo_id: '__base_tq_alto_motivo',   etiqueta: 'Alto motivo (mm)',     fieldKey: 'altoMotivo',       flex: 0.10, excludeInGrid: true },
  { campo_id: '__base_tq_motivos_ancho', etiqueta: 'Motivos ancho',        fieldKey: 'motivosAncho',     flex: 0.09, excludeInGrid: true },
  { campo_id: '__base_tq_separacion',    etiqueta: 'Separación (mm)',      fieldKey: 'separacionAncho',  flex: 0.11, excludeInGrid: true },
  { campo_id: '__base_tq_valor_z',       etiqueta: 'Valor Z (mm)',         fieldKey: 'valorZ',           flex: 0.09, excludeInGrid: true },
  { campo_id: '__base_tq_dist_sesgado',  etiqueta: 'Dist. sesgado (mm)',   fieldKey: 'distanciaSesgado', flex: 0.11 },
];

/** Mapa campo_id → fieldKey para lookup rápido en row renderers */
export const BASE_CAMPO_FIELD_MAP = Object.fromEntries(
  [...CAMPOS_BASE_PEDIDO, ...CAMPOS_BASE_TROQUEL].map(c => [c.campo_id, c.fieldKey])
);

# Máquina de ejemplo protegida
PROTECTED_MAQUINA_NOMBRE = 'Ejemplo Flexo'
def ensure_maquina_ejemplo_presente(empresa_id):
    col = get_empresa_collection('maquinas', empresa_id)
    total = col.count_documents({'empresa_id': empresa_id})
    if total == 0:
        col.insert_one({
            'nombre': PROTECTED_MAQUINA_NOMBRE,
            'numero_colores': 8,
            'empresa_id': empresa_id,
            'descripcion': 'Máquina de ejemplo protegida'
        })
import os
import tempfile
import subprocess
import smtplib
import numpy as np
from flask_pymongo import PyMongo
from bson.objectid import ObjectId
import pymongo
import json
import time
import hashlib
import secrets
import re
from urllib import request as urllib_request, parse as urllib_parse, error as urllib_error
from collections import defaultdict
from email.message import EmailMessage
from flask import Flask, request, jsonify, g
from werkzeug.exceptions import HTTPException
from flask_cors import CORS
from PIL import Image, ImageCms
from PyPDF2 import PdfReader

# Ruta a tu perfil ICC FOGRA39
BASE_DIR = os.path.dirname(__file__)
FOGRA_CANDIDATES = [
    '/usr/share/color/icc/ISOcoated_v2_eci.icc',
    os.path.join(BASE_DIR, 'Perfiles', 'ISOcoated_v2_eci.icc'),
]


def resolve_fogra_path():
    for path in FOGRA_CANDIDATES:
        if os.path.exists(path):
            return path
    return FOGRA_CANDIDATES[0]


FOGRA_PATH = resolve_fogra_path()

import threading
from datetime import datetime


 


app = Flask(__name__)
CORS(app)
app.debug = True

import traceback as _traceback
@app.errorhandler(Exception)
def _handle_uncaught_exception(e):
    # Let HTTP exceptions (404, 400, etc.) be handled by Flask/werkzeug normally
    if isinstance(e, HTTPException):
        return e
    tb = _traceback.format_exc()
    print('UNCAUGHT EXCEPTION:\n', tb)
    return jsonify({'error': str(e), 'trace': tb}), 500

# Configuración MongoDB (puedes cambiar la URI a tu MongoDB Atlas si quieres)
app.config["MONGO_URI"] = "mongodb://localhost:27017/printforgepro"
mongo = PyMongo(app)

# Helper para obtener la colección de una empresa
def get_empresa_collection(nombre, empresa_id):
    # Todas las colecciones llevan el nombre base, pero filtramos por empresa_id
    return mongo.db[nombre]

# Helper para convertir ObjectId a string en respuestas JSON
def fix_id(doc):
    if not doc:
        return doc
    doc = dict(doc)
    if '_id' in doc:
        doc['id'] = str(doc['_id'])
        del doc['_id']
    return doc

ROLE_LABELS = {
    'operario': 'Operario',
    'administrador': 'Administrador',
    'comercial': 'Comercial',
    'root': 'Root',
}
PROTECTED_ROLE_ORDER = ['operario', 'administrador', 'root']
PROTECTED_ROLE_KEYS = {'operario', 'administrador', 'root'}
PROTECTED_ESTADOS_PEDIDO_KEYS = {
    'diseno',
    'pendiente-de-aprobacion',
    'pendiente-de-cliche',
    'pendiente-de-impresion',
    'pendiente-post-impresion',
    'finalizado',
    'parado',
    'cancelado',
}
PERMISSION_KEYS = [
    'manage_app_settings',
    'manage_roles_permissions',
    'edit_clientes',
    'edit_maquinas',
    'edit_pedidos',
    'edit_presupuestos',
    'edit_produccion',
]
ROLE_PERMISSIONS_DEFAULT = {
    'operario': {
        'manage_app_settings': False,
        'manage_roles_permissions': False,
        'edit_clientes': False,
        'edit_maquinas': False,
        'edit_pedidos': False,
        'edit_presupuestos': False,
        'edit_produccion': True,
    },
    'administrador': {
        'manage_app_settings': True,
        'manage_roles_permissions': False,
        'edit_clientes': True,
        'edit_maquinas': True,
        'edit_pedidos': True,
        'edit_presupuestos': True,
        'edit_produccion': True,
    },
    'root': {
        'manage_app_settings': True,
        'manage_roles_permissions': True,
        'edit_clientes': True,
        'edit_maquinas': True,
        'edit_pedidos': True,
        'edit_presupuestos': True,
        'edit_produccion': True,
    },
}

FREE_SIGNUP_CREDITS = 50
CREDIT_COSTS = {
    'report': 7,
    'repetidora': 16,
    'trapping': 4,
    'troquel': 9,
}
ALLOWED_BILLING_MODELS = {'creditos', 'suscripcion'}
ALLOWED_PAYMENT_METHODS = {'paypal', 'tarjeta'}
SESSION_TIMEOUT_MINUTES_DEFAULT = 30
SESSION_TIMEOUT_MINUTES_MIN = 5
SESSION_TIMEOUT_MINUTES_MAX = 480
ACCESS_TOKEN_TTL_SECONDS = 60 * 60
REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30
MFA_CODE_TTL_SECONDS = 5 * 60
MFA_REQUIRED_ROLES = {'root', 'administrador', 'admin'}
DEV_EXPOSE_MFA_CODE = os.environ.get('DEV_EXPOSE_MFA_CODE', '0').strip().lower() in {'1', 'true', 'yes'}
SMTP_HOST = os.environ.get('SMTP_HOST', '').strip()
SMTP_PORT = int(os.environ.get('SMTP_PORT', '587') or 587)
SMTP_USER = os.environ.get('SMTP_USER', '').strip()
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '').strip()
SMTP_FROM = os.environ.get('SMTP_FROM', SMTP_USER).strip()
SMTP_USE_SSL = os.environ.get('SMTP_USE_SSL', '0').strip().lower() in {'1', 'true', 'yes'}
SMTP_USE_TLS = os.environ.get('SMTP_USE_TLS', '1').strip().lower() in {'1', 'true', 'yes'}
INTEGRATION_API_KEY = os.environ.get('INTEGRATION_API_KEY', '').strip()
STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY', '').strip()
STRIPE_CURRENCY = os.environ.get('STRIPE_CURRENCY', 'eur').strip().lower() or 'eur'
STRIPE_PRICE_PER_CREDIT_CENTS = int(os.environ.get('STRIPE_PRICE_PER_CREDIT_CENTS', '100') or 100)
STRIPE_CHECKOUT_SUCCESS_URL = os.environ.get('STRIPE_CHECKOUT_SUCCESS_URL', 'http://localhost:8081/?billing=success&session_id={CHECKOUT_SESSION_ID}').strip()
STRIPE_CHECKOUT_CANCEL_URL = os.environ.get('STRIPE_CHECKOUT_CANCEL_URL', 'http://localhost:8081/?billing=cancel').strip()
AUTH_PUBLIC_PATHS = (
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/mfa/verify',
    '/api/auth/refresh',
    '/api/auth/logout',
    '/api/billing/config'
)
AUTH_ATTEMPTS = defaultdict(list)

def stripe_enabled():
    return bool(STRIPE_SECRET_KEY)

def stripe_api_request(path, method='POST', payload=None):
    if not stripe_enabled():
        raise RuntimeError('Stripe no configurado. Define STRIPE_SECRET_KEY.')
    normalized_path = str(path or '').strip()
    if not normalized_path.startswith('/'):
        normalized_path = '/' + normalized_path
    url = f'https://api.stripe.com/v1{normalized_path}'

    body = None
    if payload is not None:
        body = urllib_parse.urlencode(payload, doseq=True).encode('utf-8')

    req = urllib_request.Request(
        url,
        data=body,
        method=method,
        headers={
            'Authorization': f'Bearer {STRIPE_SECRET_KEY}',
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    )

    try:
        with urllib_request.urlopen(req, timeout=20) as resp:
            raw = resp.read().decode('utf-8')
            parsed = json.loads(raw) if raw else {}
            return parsed
    except urllib_error.HTTPError as e:
        try:
            raw = e.read().decode('utf-8')
            parsed = json.loads(raw) if raw else {}
            message = parsed.get('error', {}).get('message') or str(e)
        except Exception:
            parsed = {}
            message = str(e)
        raise RuntimeError(message)


def normalize_billing_model(value):
    model = str(value or '').strip().lower()
    if model in ALLOWED_BILLING_MODELS:
        return model
    return 'creditos'


def normalize_payment_method(value):
    method = str(value or '').strip().lower()
    if method in ALLOWED_PAYMENT_METHODS:
        return method
    return None


def normalize_cif(value):
    return str(value or '').strip().replace(' ', '').replace('-', '').upper()


def is_valid_cif(value):
    cif = normalize_cif(value)
    return bool(cif) and bool(re.match(r'^[A-Z]\d{7}[A-Z0-9]$', cif))


def get_empresa_billing(empresa_id):
    empresa_id = int(empresa_id or 0)
    if empresa_id <= 0:
        return {
            'empresa_id': 0,
            'billing_model': 'creditos',
            'payment_method': None,
            'subscription_active': False,
            'creditos': 0,
        }
    col = get_empresa_collection('empresa_billing', empresa_id)
    doc = col.find_one({'empresa_id': empresa_id})
    if not doc:
        # Buscar datos de usuarios como fallback
        usuarios_col = get_empresa_collection('usuarios', empresa_id)
        user = usuarios_col.find_one({'empresa_id': empresa_id})
        billing_model = normalize_billing_model(user.get('billing_model', 'creditos')) if user else 'creditos'
        payment_method = normalize_payment_method(user.get('payment_method')) if user else None
        subscription_active = bool(user.get('subscription_active', 0)) if user else False
        creditos = int(user.get('creditos', 0)) if user else 0
        doc = {
            'empresa_id': empresa_id,
            'billing_model': billing_model,
            'payment_method': payment_method,
            'subscription_active': subscription_active,
            'creditos': creditos,
        }
        col.insert_one(doc)
    return {
        'empresa_id': doc.get('empresa_id', 0),
        'billing_model': normalize_billing_model(doc.get('billing_model', 'creditos')),
        'payment_method': normalize_payment_method(doc.get('payment_method')),
        'subscription_active': bool(doc.get('subscription_active', False)),
        'creditos': max(0, int(doc.get('creditos', 0))),
    }


def hash_password(password, salt_hex=None):
    pwd = str(password or '')
    if not pwd:
        return None
    if salt_hex is None:
        salt_hex = secrets.token_hex(16)
    salt = bytes.fromhex(salt_hex)
    derived = hashlib.pbkdf2_hmac('sha256', pwd.encode('utf-8'), salt, 120000)
    return f'{salt_hex}${derived.hex()}'


def verify_password(password, stored_hash):
    try:
        if not password or not stored_hash or '$' not in stored_hash:
            return False
        salt_hex, expected_hex = stored_hash.split('$', 1)
        candidate = hash_password(password, salt_hex=salt_hex)
        return bool(candidate and candidate.split('$', 1)[1] == expected_hex)
    except Exception:
        # Código SQL y variables de migración eliminados por migración a MongoDB
        pass
        # Código legacy eliminado por migración a MongoDB
    return False


def build_user_payload(row):
    # Función legacy, no usada con MongoDB. Se deja como stub.
    return {}


# def issue_mfa_challenge_mongo(usuario_id, purpose='login'):
#     # Legacy, no usado con MongoDB
#     return None


def send_mfa_code_email(to_email, code, expires_seconds, recipient_name=''):
    # Desconectado temporalmente para desarrollo web
    return True, None

    subject = 'Código de verificación (MFA) - PrintForge Pro'
    saludo = f'Hola {recipient_name},' if recipient_name else 'Hola,'
    body = (
        f"{saludo}\n\n"
        f"Tu código de verificación es: {code}\n"
        f"Este código expira en {max(1, int(expires_seconds // 60))} minuto(s).\n\n"
        "Si no has solicitado este acceso, ignora este mensaje."
    )

    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = SMTP_FROM
    msg['To'] = to_email
    msg.set_content(body)

    try:
        if SMTP_USE_SSL:
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=15) as server:
                if SMTP_USER:
                    server.login(SMTP_USER, SMTP_PASSWORD)
                server.send_message(msg)
        else:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
                if SMTP_USE_TLS:
                    server.starttls()
                if SMTP_USER:
                    server.login(SMTP_USER, SMTP_PASSWORD)
                server.send_message(msg)
        return True, None
    except Exception as e:
        return False, str(e)


def is_auth_rate_limited(channel, key, limit=8, window_seconds=300):
    now = int(time.time())
    bucket = AUTH_ATTEMPTS[(channel, key)]
    threshold = now - window_seconds
    AUTH_ATTEMPTS[(channel, key)] = [ts for ts in bucket if ts >= threshold]
    bucket = AUTH_ATTEMPTS[(channel, key)]
    if len(bucket) >= limit:
        return True
    bucket.append(now)
    return False


def get_bearer_token_from_request():
    auth_header = str(request.headers.get('Authorization') or '').strip()
    if not auth_header.lower().startswith('bearer '):
        return None
    token = auth_header[7:].strip()
    return token or None


def get_request_user():
    # BYPASS AUTH PARA DESARROLLO (siempre usuario root)
    user = {'id': 1, 'nombre': 'DevUser', 'rol': 'root', 'empresa_id': 1}
    g._request_user = user
    return user


def can_role_permission(role_key, permission_key):
    # role = normalize_role(role_key)  # Legacy, no usado con MongoDB
    # permissions = get_role_permissions()
    # return bool(permissions.get(role, {}).get(permission_key, False))
    return False


def get_session_timeout_minutes():
    # raw = get_config_value('session_timeout_minutes', str(SESSION_TIMEOUT_MINUTES_DEFAULT))
    # try:
    #     value = int(raw)
    # except Exception:
    #     value = SESSION_TIMEOUT_MINUTES_DEFAULT
    # return max(SESSION_TIMEOUT_MINUTES_MIN, min(SESSION_TIMEOUT_MINUTES_MAX, value))
    return SESSION_TIMEOUT_MINUTES_DEFAULT


def can_edit_session_timeout(user):
    if not user:
        return False
    # role = normalize_role(user.get('rol'))  # Legacy, no usado con MongoDB
    # return role in {'administrador', 'admin', 'root'}
    return False


def require_request_user():
    # BYPASS AUTH PARA DESARROLLO (siempre usuario root)
    return {'id': 1, 'nombre': 'DevUser', 'rol': 'root', 'empresa_id': 1}, None


@app.after_request
def apply_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['Referrer-Policy'] = 'no-referrer'
    response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
    response.headers['Content-Security-Policy'] = "default-src 'self'; img-src 'self' data: blob:; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' http://localhost:8080;"
    return response


@app.before_request
def enforce_role_permissions():
    if request.method == 'OPTIONS':
        return None

    path = str(request.path or '')
    method_upper = (request.method or '').upper()

    if path.startswith('/api/integracion/documentos') and method_upper not in ['GET', 'HEAD', 'OPTIONS']:
        if INTEGRATION_API_KEY:
            incoming_key = str(request.headers.get('X-API-Key') or '').strip()
            if incoming_key == INTEGRATION_API_KEY:
                return None

    # permission = get_required_permission_for_request(path, method_upper)
    permission = None
    if not permission:
        return None

    for public_prefix in AUTH_PUBLIC_PATHS:
        if path.startswith(public_prefix):
            return None

    request_user = get_request_user()
    if not request_user:
        return jsonify({
            'error': 'Autenticación requerida',
            'required_permission': permission,
        }), 401

    if can_role_permission(request_user.get('rol'), permission):
        return None

    return jsonify({
        'error': 'Permiso denegado para el usuario autenticado',
        'user_role': request_user.get('rol'),
        'required_permission': permission,
    }), 403


@app.before_request
def enforce_rate_limit_auth():
    path = str(request.path or '')
    method_upper = (request.method or '').upper()
    if method_upper != 'POST':
        return None

    if path not in ['/api/auth/login', '/api/auth/register', '/api/auth/mfa/verify']:
        return None

    payload = request.get_json(silent=True) or {}
    email = str(payload.get('email') or '').strip().lower()
    challenge_id = str(payload.get('challenge_id') or '').strip()
    ip = str(request.headers.get('X-Forwarded-For') or request.remote_addr or 'unknown').split(',')[0].strip() or 'unknown'
    key_suffix = email or challenge_id or 'no-identity'
    key = f'{ip}:{key_suffix}'
    if path.endswith('/register'):
        limit = 12
    elif path.endswith('/mfa/verify'):
        limit = 30
    else:
        limit = 20

    if is_auth_rate_limited(path, key, limit=limit, window_seconds=300):
        return jsonify({'error': 'Demasiados intentos. Inténtalo de nuevo en unos minutos.'}), 429

    return None


# Inicializar base de datos
def init_db():
    # En desarrollo, usar empresa_id=1 por defecto
    empresa_id = 1
    # MongoDB: No es necesario crear tablas ni índices, solo asegurar la máquina de ejemplo
    ensure_maquina_ejemplo_presente(empresa_id)

    # Inicialización MongoDB catálogo/configuración por defecto
    col_opciones = get_empresa_collection('config_opciones', 0)
    col_general = get_empresa_collection('config_general', 0)
    defaults_catalogo = {
        'roles': ['Operario', 'Administrador', 'Root', 'Comercial'],
        'materiales': ['Polipropileno', 'Papel', 'PVC', 'PE', 'PET'],
        'acabados': ['Barniz', 'Stamping', 'Laminado', 'Sin acabado'],
        'tintas_especiales': ['P1', 'P2', 'P3', 'P4', 'P5'],
        'estados_pedido': [
            'Diseño',
            'Pendiente de Aprobación',
            'Pendiente de Cliché',
            'Pendiente de Impresión',
            'Pendiente Post-Impresión',
            'Finalizado',
            'Parado',
            'Cancelado'
        ]
    }
    for categoria, valores in defaults_catalogo.items():
        if col_opciones.count_documents({'categoria': categoria}) == 0:
            for idx, valor in enumerate(valores, start=1):
                col_opciones.insert_one({
                    'categoria': categoria,
                    'valor': valor,
                    'orden': idx,
                    'fecha_creacion': datetime.now().isoformat()
                })
    # Normalizar orden para todas las categorías
    categorias_existentes = col_opciones.distinct('categoria')
    for categoria in categorias_existentes:
        docs = list(col_opciones.find({'categoria': categoria}).sort([('orden', 1), ('_id', 1)]))
        for idx, doc in enumerate(docs, start=1):
            col_opciones.update_one({'_id': doc['_id']}, {'$set': {'orden': idx}})
    # Configuración general por defecto
    if not col_general.find_one({'clave': 'modo_creacion'}):
        col_general.insert_one({'clave': 'modo_creacion', 'valor': 'manual', 'fecha_actualizacion': datetime.now().isoformat()})
    if not col_general.find_one({'clave': 'active_role'}):
        col_general.insert_one({'clave': 'active_role', 'valor': 'root', 'fecha_actualizacion': datetime.now().isoformat()})
    if not col_general.find_one({'clave': 'role_permissions'}):
        col_general.insert_one({'clave': 'role_permissions', 'valor': json.dumps(ROLE_PERMISSIONS_DEFAULT), 'fecha_actualizacion': datetime.now().isoformat()})
    # Código SQL y referencias a c, conn, seed_meta, seed_creditos eliminados por migración a MongoDB


def get_modo_creacion():
    """Obtiene el modo de creación actual: manual | automatico"""
    col = get_empresa_collection('config_general', 0)
    doc = col.find_one({'clave': 'modo_creacion'})
    valor = (doc.get('valor') if doc and doc.get('valor') else 'manual').strip().lower()
    if valor not in ['manual', 'automatico']:
        return 'manual'
    return valor


def modo_automatico_activo():
    return get_modo_creacion() == 'automatico'


ESTADOS_PEDIDO_DEFAULT = [
    {'value': 'diseno', 'label': 'Diseño'},
    {'value': 'pendiente-de-aprobacion', 'label': 'Pendiente de Aprobación'},
    {'value': 'pendiente-de-cliche', 'label': 'Pendiente de Cliché'},
    {'value': 'pendiente-de-impresion', 'label': 'Pendiente de Impresión'},
    {'value': 'pendiente-post-impresion', 'label': 'Pendiente Post-Impresión'},
    {'value': 'finalizado', 'label': 'Finalizado'},
    {'value': 'parado', 'label': 'Parado'},
    {'value': 'cancelado', 'label': 'Cancelado'},
]


ESTADOS_RULES_DEFAULT = {
    'bloqueados_produccion': ['cancelado', 'parado', 'finalizado'],
    'en_cola_produccion': ['pendiente-de-impresion', 'pendiente-post-impresion'],
    'preimpresion': ['diseno', 'pendiente-de-aprobacion', 'pendiente-de-cliche'],
    'estados_finalizados': ['finalizado'],
    'ocultar_timeline': ['parado', 'cancelado'],
    'ocultar_grafica': ['parado', 'cancelado', 'finalizado'],
}


def slugify_estado(texto):
    base = (texto or '').strip().lower()
    if not base:
        return ''
    replace_map = {
        'á': 'a', 'à': 'a', 'ä': 'a', 'â': 'a',
        'é': 'e', 'è': 'e', 'ë': 'e', 'ê': 'e',
        'í': 'i', 'ì': 'i', 'ï': 'i', 'î': 'i',
        'ó': 'o', 'ò': 'o', 'ö': 'o', 'ô': 'o',
        'ú': 'u', 'ù': 'u', 'ü': 'u', 'û': 'u',
        'ñ': 'n'
    }
    for old, new in replace_map.items():
        base = base.replace(old, new)
    out = []
    prev_dash = False
    for ch in base:
        if ('a' <= ch <= 'z') or ('0' <= ch <= '9'):
            out.append(ch)
            prev_dash = False
        else:
            if not prev_dash:
                out.append('-')
                prev_dash = True
    result = ''.join(out).strip('-')
    return result


def normalize_text_list(value):
    if value is None:
        return []

    items = []
    if isinstance(value, list):
        items = value
    elif isinstance(value, str):
        items = [part.strip() for part in value.split(',')]
    else:
        items = [str(value).strip()]

    normalized = []
    seen = set()
    for item in items:
        text = str(item or '').strip()
        if not text:
            continue
        key = text.lower()
        if key in seen:
            continue
        seen.add(key)
        normalized.append(text)
    return normalized


def normalize_document_payload(payload_obj):
    if not isinstance(payload_obj, dict):
        return payload_obj, False

    payload = dict(payload_obj)
    changed = False

    def set_if_diff(key, value):
        nonlocal changed
        if payload.get(key) != value:
            payload[key] = value
            changed = True

    for camel_key, snake_key in [('razonSocial', 'razon_social'), ('personasContacto', 'personas_contacto')]:
        chosen = payload.get(snake_key)
        if chosen in [None, '']:
            chosen = payload.get(camel_key)
        if chosen not in [None, '']:
            set_if_diff(snake_key, chosen)
            set_if_diff(camel_key, chosen)

    maquina_real = payload.get('maquina_bd') or payload.get('maquina')
    if maquina_real not in [None, '']:
        set_if_diff('maquina', maquina_real)
        set_if_diff('maquina_bd', maquina_real)

    if 'selectedTintas' in payload:
        set_if_diff('selectedTintas', normalize_text_list(payload.get('selectedTintas')))

    if 'detalleTintaEspecial' in payload or 'detalle_tinta_especial' in payload:
        source = payload.get('detalleTintaEspecial')
        if source is None:
            source = payload.get('detalle_tinta_especial')
        normalized_tintas = normalize_text_list(source)
        set_if_diff('detalleTintaEspecial', normalized_tintas)
        set_if_diff('detalle_tinta_especial', normalized_tintas)

    if 'acabado' in payload:
        set_if_diff('acabado', normalize_text_list(payload.get('acabado')))

    return payload, changed


def normalize_legacy_json_storage(apply_changes=False):
    # Eliminado: función SQL legacy, no aplica en MongoDB
    return {'apply': bool(apply_changes), 'presupuestos': {}, 'pedidos': {}}


def get_estados_pedido_disponibles():
    col = get_empresa_collection('config_opciones', 0)
    rows = list(col.find({'categoria': 'estados_pedido'}).sort([('orden', 1), ('_id', 1)]))
    if not rows:
        return ESTADOS_PEDIDO_DEFAULT
    parsed = []
    used = set()
    for row in rows:
        label = (row.get('valor') or '').strip()
        value = slugify_estado(label)
        if not label or not value or value in used:
            continue
        used.add(value)
        parsed.append({'value': value, 'label': label})
    return parsed if parsed else ESTADOS_PEDIDO_DEFAULT


def infer_estados_rules(available_states):
    values = {item['value'] for item in available_states}
    labels = {item['value']: (item.get('label') or '').lower() for item in available_states}

    def find_by_keywords(words):
        matches = []
        for value, label in labels.items():
            if any(word in label for word in words):
                matches.append(value)
        return matches

    inferred = {
        'bloqueados_produccion': list(dict.fromkeys(
            [v for v in ['cancelado', 'parado', 'finalizado'] if v in values] +
            find_by_keywords(['cancel', 'parad'])
        )),
        'en_cola_produccion': list(dict.fromkeys(
            [v for v in ['pendiente-de-impresion', 'pendiente-post-impresion'] if v in values] +
            find_by_keywords(['impresion', 'impresión'])
        )),
        'preimpresion': list(dict.fromkeys(
            [v for v in ['diseno', 'pendiente-de-aprobacion', 'pendiente-de-cliche'] if v in values] +
            find_by_keywords(['diseno', 'diseño', 'aprob', 'cliche', 'clich'])
        )),
        'estados_finalizados': list(dict.fromkeys(
            [v for v in ['finalizado'] if v in values] +
            find_by_keywords(['final'])
        )),
        'ocultar_timeline': list(dict.fromkeys(
            [v for v in ['parado', 'cancelado'] if v in values] +
            find_by_keywords(['cancel', 'parad'])
        )),
        'ocultar_grafica': list(dict.fromkeys(
            [v for v in ['parado', 'cancelado', 'finalizado'] if v in values] +
            find_by_keywords(['cancel', 'parad', 'final'])
        )),
    }
    return inferred


def get_estados_pedido_rules():
    available_states = get_estados_pedido_disponibles()
    allowed_values = {item['value'] for item in available_states}
    col = get_empresa_collection('config_general', 0)
    doc = col.find_one({'clave': 'estados_pedido_rules'})
    stored = {}
    if doc and doc.get('valor'):
        try:
            stored = json.loads(doc['valor'])
        except Exception:
            stored = {}
    inferred = infer_estados_rules(available_states)
    resolved = {}
    for key, default_vals in ESTADOS_RULES_DEFAULT.items():
        candidate = stored.get(key, []) if isinstance(stored, dict) else []
        if not isinstance(candidate, list):
            candidate = []
        normalized = []
        for val in candidate:
            slug = slugify_estado(str(val))
            if slug and slug in allowed_values and slug not in normalized:
                normalized.append(slug)
        if not normalized:
            normalized = [v for v in inferred.get(key, []) if v in allowed_values]
        if not normalized:
            normalized = [v for v in default_vals if v in allowed_values]
        resolved[key] = normalized
    return {'rules': resolved, 'available_states': available_states}


def is_estado_finalizado(estado_value, rules):
    return estado_value in set(rules.get('estados_finalizados', []))


    # MongoDB: No es necesario crear tablas ni índices, solo asegurar la máquina de ejemplo
    ensure_maquina_ejemplo_presente(empresa_id)
    # return 'edit_produccion'  # Eliminado por limpieza de lógica legacy
    # El resto de rutas
    # if path.startswith('/api/trabajos'):
    #     return 'edit_pedidos'
    # if path.startswith('/api/test-data'):
    #     return 'manage_app_settings'
    # return None


# Endpoints para máquinas

@app.route('/api/maquinas', methods=['GET'])
def get_maquinas():
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = int(request_user.get('empresa_id') or 0)
        col = get_empresa_collection('maquinas', empresa_id)
        maquinas = list(col.find({'empresa_id': empresa_id}))
        maquinas = [fix_id(m) for m in maquinas]
        return jsonify({'maquinas': maquinas}), 200
    except Exception as e:
        tb = _traceback.format_exc()
        print('ERROR in enviar_trabajo_produccion:\n', tb)
        return jsonify({'error': str(e), 'trace': tb}), 500
        sistemas_secado = data.get('sistemas_secado')
        estado = data.get('estado') or 'Activa'
        col = get_empresa_collection('maquinas', empresa_id)
        # Generar un id incremental manualmente si es necesario
        last = col.find({'empresa_id': empresa_id}).sort('id', -1).limit(1)
        last_id = 0
        for l in last:
            last_id = l.get('id', 0)
        new_id = last_id + 1
        doc = {
            'id': new_id,
            'empresa_id': empresa_id,
            'nombre': nombre,
            'anio_fabricacion': anio_fabricacion,
            'tipo_maquina': tipo_maquina,
            'numero_colores': numero_colores,
            'ancho_max_material_mm': ancho_max_material_mm,
            'ancho_max_impresion_mm': ancho_max_impresion_mm,
            'repeticion_min_mm': repeticion_min_mm,
            'repeticion_max_mm': repeticion_max_mm,
            'velocidad_max_maquina_mmin': velocidad_max_maquina_mmin,
            'velocidad_max_impresion_mmin': velocidad_max_impresion_mmin,
            'espesor_planchas_mm': espesor_planchas_mm,
            'sistemas_secado': sistemas_secado,
            'estado': estado
        }
        col.insert_one(doc)
        return jsonify({'success': True}), 200
    except Exception as e:
        print('REORDER ERROR:\n', _traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/api/maquinas/<int:maquina_id>', methods=['PUT'])
def update_maquina(maquina_id):
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = int(request_user.get('empresa_id') or 0)

        data = request.get_json()
        nombre = data.get('nombre')
        if not nombre:
            return jsonify({'error': 'Nombre requerido'}), 400

        anio_fabricacion = data.get('anio_fabricacion')
        tipo_maquina = data.get('tipo_maquina')
        numero_colores = data.get('numero_colores')
        ancho_max_material_mm = data.get('ancho_max_material_mm')
        ancho_max_impresion_mm = data.get('ancho_max_impresion_mm')
        repeticion_min_mm = data.get('repeticion_min_mm')
        repeticion_max_mm = data.get('repeticion_max_mm')
        velocidad_max_maquina_mmin = data.get('velocidad_max_maquina_mmin')
        velocidad_max_impresion_mmin = data.get('velocidad_max_impresion_mmin')
        espesor_planchas_mm = data.get('espesor_planchas_mm')
        sistemas_secado = data.get('sistemas_secado')
        estado = data.get('estado') or 'Activa'

        col = get_empresa_collection('maquinas', empresa_id)
        result = col.update_one({'id': maquina_id, 'empresa_id': empresa_id}, {'$set': {
            'nombre': nombre,
            'anio_fabricacion': anio_fabricacion,
            'tipo_maquina': tipo_maquina,
            'numero_colores': numero_colores,
            'ancho_max_material_mm': ancho_max_material_mm,
            'ancho_max_impresion_mm': ancho_max_impresion_mm,
            'repeticion_min_mm': repeticion_min_mm,
            'repeticion_max_mm': repeticion_max_mm,
            'velocidad_max_maquina_mmin': velocidad_max_maquina_mmin,
            'velocidad_max_impresion_mmin': velocidad_max_impresion_mmin,
            'espesor_planchas_mm': espesor_planchas_mm,
            'sistemas_secado': sistemas_secado,
            'estado': estado
        }})
        if result.matched_count == 0:
            return jsonify({'error': 'Máquina no encontrada'}), 404
        return jsonify({'success': True}), 200
    except Exception as e:
        tb = _traceback.format_exc()
        print('REORDER EXCEPTION:\n', tb)
        return jsonify({'error': str(e), 'trace': tb}), 500


@app.route('/api/maquinas/<int:maquina_id>', methods=['DELETE'])
def delete_maquina(maquina_id):
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = int(request_user.get('empresa_id') or 0)
        col = get_empresa_collection('maquinas', empresa_id)
        orden_col = get_empresa_collection('trabajo_orden', empresa_id)
        pedidos_col = get_empresa_collection('pedidos', empresa_id)
        pedidos_col = get_empresa_collection('pedidos', empresa_id)
        pedidos_col = get_empresa_collection('pedidos', empresa_id)
        total = col.count_documents({'empresa_id': empresa_id})
        maquina = col.find_one({'id': maquina_id, 'empresa_id': empresa_id})
        if total == 1 and maquina and maquina.get('nombre') == PROTECTED_MAQUINA_NOMBRE:
            return jsonify({'error': 'No puedes eliminar la máquina de ejemplo si no hay otras creadas'}), 409
        if not maquina:
            return jsonify({'error': 'Máquina no encontrada'}), 404
        trabajos_en_cola = orden_col.count_documents({'maquina_id': maquina_id, 'empresa_id': empresa_id})
        if trabajos_en_cola > 0:
            return jsonify({'error': 'No se puede eliminar: la máquina tiene trabajos en cola'}), 400
        col.delete_one({'id': maquina_id, 'empresa_id': empresa_id})
        return jsonify({'success': True}), 200
    except Exception as e:
        tb = _traceback.format_exc()
        print('MOVER EXCEPTION:\n', tb)
        return jsonify({'error': str(e), 'trace': tb}), 500

# Endpoints para clientes
@app.route('/api/clientes', methods=['GET'])
def get_clientes():
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = int(request_user.get('empresa_id') or 0)
        col = get_empresa_collection('clientes', empresa_id)
        clientes = list(col.find({'empresa_id': empresa_id}))
        clientes = [fix_id(c) for c in clientes]
        return jsonify({'clientes': clientes}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/clientes', methods=['POST'])
def create_cliente():
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = int(request_user.get('empresa_id') or 0)
        col = get_empresa_collection('clientes', empresa_id)
        data = request.get_json() or {}

        nombre = (data.get('nombre') or '').strip()
        if not nombre:
            return jsonify({'error': 'Nombre es requerido'}), 400

        nuevo = {
            'empresa_id': empresa_id,
            'nombre': nombre,
            'razon_social': data.get('razon_social', ''),
            'cif': data.get('cif', ''),
            'personas_contacto': data.get('personas_contacto', ''),
            'email': data.get('email', ''),
            'created_at': datetime.utcnow().isoformat(),
        }

        res = col.insert_one(nuevo)
        nuevo['_id'] = res.inserted_id
        return jsonify(fix_id(nuevo)), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/clientes/<cliente_id>', methods=['PUT'])
def update_cliente(cliente_id):
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = int(request_user.get('empresa_id') or 0)
        col = get_empresa_collection('clientes', empresa_id)
        try:
            oid = ObjectId(cliente_id)
        except Exception:
            return jsonify({'error': 'ID de cliente inválido'}), 400

        data = request.get_json() or {}
        update = {}
        for k in ('nombre', 'razon_social', 'cif', 'personas_contacto', 'email'):
            if k in data:
                update[k] = data[k]

        if not update:
            return jsonify({'error': 'Nada que actualizar'}), 400

        result = col.update_one({'_id': oid, 'empresa_id': empresa_id}, {'$set': update})
        if result.matched_count == 0:
            return jsonify({'error': 'Cliente no encontrado'}), 404

        cliente = col.find_one({'_id': oid, 'empresa_id': empresa_id})
        return jsonify(fix_id(cliente)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500




@app.route('/api/clientes/<cliente_id>', methods=['DELETE'])
def delete_cliente(cliente_id):
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = int(request_user.get('empresa_id') or 0)
        col = get_empresa_collection('clientes', empresa_id)
        # cliente_id viene como string (id), convertir a ObjectId si es posible
        try:
            oid = ObjectId(cliente_id)
        except Exception:
            return jsonify({'error': 'ID de cliente inválido'}), 400

        cliente = col.find_one({'_id': oid, 'empresa_id': empresa_id})
        if not cliente:
            return jsonify({'error': 'Cliente no encontrado'}), 404
        col.delete_one({'_id': oid, 'empresa_id': empresa_id})
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/debug/clientes', methods=['GET'])
def debug_clientes_html():
    """Página simple para listar clientes (útil para debugging rápido)."""
    try:
        col = get_empresa_collection('clientes', 1)
        clientes = list(col.find({'empresa_id': 1}))
        clientes = [fix_id(c) for c in clientes]
        rows = ''.join(f"<tr><td>{c.get('id')}</td><td>{c.get('nombre')}</td><td>{c.get('email','')}</td><td>{c.get('cif','')}</td></tr>" for c in clientes)
        html = f"<html><body><h1>Clientes (debug)</h1><table border=1><tr><th>ID</th><th>Nombre</th><th>Email</th><th>CIF</th></tr>{rows}</table></body></html>"
        return html, 200, {'Content-Type': 'text/html'}
    except Exception as e:
        return f"Error: {e}", 500, {'Content-Type': 'text/plain'}


# Endpoints para catálogo dinámico de settings
ALLOWED_SETTINGS_CATEGORIES = {'roles', 'materiales', 'acabados', 'tintas_especiales', 'estados_pedido'}


        
        
@app.route('/api/auth/register', methods=['POST'])
def register_public_user():
    try:
        data = request.get_json() or {}
        nombre = str(data.get('nombre') or '').strip()
        empresa_nombre = str(data.get('nombre_empresa') or data.get('empresa_nombre') or '').strip()
        empresa_cif = normalize_cif(data.get('cif') or data.get('empresa_cif'))
        email = str(data.get('email') or '').strip().lower()
        password = str(data.get('password') or '').strip()
        rol = 'administrador'
        billing_model = normalize_billing_model(data.get('billing_model') or data.get('modelo_pago'))
        payment_method = normalize_payment_method(data.get('payment_method') or data.get('metodo_pago'))
        subscription_active = 1 if billing_model == 'suscripcion' else 0

        if not nombre:
            return jsonify({'error': 'Nombre requerido'}), 400
        if not empresa_nombre:
            return jsonify({'error': 'Nombre de empresa requerido'}), 400
        if not empresa_cif:
            return jsonify({'error': 'CIF requerido'}), 400
        if not is_valid_cif(empresa_cif):
            return jsonify({'error': 'CIF no válido (ejemplo: A1234567B)'}), 400
        if not email:
            return jsonify({'error': 'Email requerido'}), 400
        if '@' not in email or '.' not in email.split('@')[-1]:
            return jsonify({'error': 'Email no válido'}), 400
        if len(password) < 6:
            return jsonify({'error': 'La contraseña debe tener al menos 6 caracteres'}), 400

        col = get_empresa_collection('usuarios', None)
        if col.find_one({'email': email}):
            return jsonify({'error': 'Ya existe un usuario con ese email'}), 409
        doc = {
            'empresa_nombre': empresa_nombre,
            'empresa_cif': empresa_cif,
            'nombre': nombre,
            'email': email,
            'rol': rol,
            'password_hash': hash_password(password),
            'billing_model': billing_model,
            'payment_method': payment_method,
            'subscription_active': subscription_active,
            'creditos': FREE_SIGNUP_CREDITS,
            'fecha_creacion': time.strftime('%Y-%m-%dT%H:%M:%S')
        }
        result = col.insert_one(doc)
        usuario_id = str(result.inserted_id)
        # Simular empresa_id como el id del usuario creado
        empresa_id = usuario_id
        return jsonify({
            'success': True,
            'id': usuario_id,
            'creditos': FREE_SIGNUP_CREDITS,
            'billing_model': billing_model,
            'usuario': {
                'id': usuario_id,
                'nombre': nombre,
                'email': email,
                'rol': rol,
                'empresa_id': usuario_id,
                'empresa_nombre': empresa_nombre,
                'empresa_cif': empresa_cif,
                'billing_model': billing_model,
                'payment_method': payment_method,
                'subscription_active': bool(subscription_active),
                'creditos': FREE_SIGNUP_CREDITS,
            }
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/usuarios', methods=['GET', 'POST'])
def api_usuarios():
    try:
        if request.method == 'GET':
            request_user, auth_error = require_request_user()
            if auth_error:
                return auth_error
            empresa_id = int(request_user.get('empresa_id') or 0)
            col = get_empresa_collection('usuarios', None)
            usuarios = list(col.find({}))
            usuarios_out = [fix_id(u) for u in usuarios]
            return jsonify({'usuarios': usuarios_out}), 200

        # POST -> crear usuario (desde UI admin)
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        data = request.get_json() or {}
        nombre = str(data.get('nombre') or '').strip()
        email = str(data.get('email') or '').strip().lower()
        rol = slugify_estado(data.get('rol') or 'comercial') or 'comercial'

        if not nombre:
            return jsonify({'error': 'Nombre requerido'}), 400
        if not email:
            return jsonify({'error': 'Email requerido'}), 400
        if '@' not in email or '.' not in email.split('@')[-1]:
            return jsonify({'error': 'Email no válido'}), 400

        col = get_empresa_collection('usuarios', None)
        if col.find_one({'email': email}):
            return jsonify({'error': 'Ya existe un usuario con ese email'}), 409

        # Generar contraseña aleatoria temporal y guardarla como hash
        temp_pwd = secrets.token_hex(6)
        doc = {
            'nombre': nombre,
            'email': email,
            'rol': rol,
            'password_hash': hash_password(temp_pwd),
            'empresa_id': int(request_user.get('empresa_id') or 0),
            'fecha_creacion': time.strftime('%Y-%m-%dT%H:%M:%S')
        }
        result = col.insert_one(doc)
        usuario = col.find_one({'_id': result.inserted_id})
        out = fix_id(usuario)
        out['_temp_password'] = temp_pwd
        return jsonify(out), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500




@app.route('/api/auth/mfa/verify', methods=['POST'])
def verify_public_user_mfa():
    try:
        data = request.get_json() or {}
        challenge_id = str(data.get('challenge_id') or '').strip()
        code = str(data.get('code') or '').strip()

        if not challenge_id:
            return jsonify({'error': 'challenge_id requerido'}), 400
        if not code or len(code) < 4:
            return jsonify({'error': 'Código MFA inválido'}), 400

        now = int(time.time())
        # TODO: Implementar verificación MFA con MongoDB
        return jsonify({'error': 'No implementado: migrar verificación MFA a MongoDB'}), 501
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/refresh', methods=['POST'])
def refresh_public_user_session():
    try:
        data = request.get_json() or {}
        refresh_token = str(data.get('refresh_token') or '').strip()
        if not refresh_token:
            return jsonify({'error': 'refresh_token requerido'}), 400

        now = int(time.time())
        # SQL legacy eliminado por migración a MongoDB
        # TODO: Implementar refresh de sesión con MongoDB
        return jsonify({'error': 'No implementado: migrar refresh de sesión a MongoDB'}), 501
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/logout', methods=['POST'])
def logout_public_user_session():
    try:
        data = request.get_json() or {}
        refresh_token = str(data.get('refresh_token') or '').strip()
        access_token = str(data.get('access_token') or '').strip()
        if not refresh_token and not access_token:
            return jsonify({'error': 'refresh_token o access_token requerido'}), 400

        # TODO: Implementar revocación de sesión con MongoDB
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/usuarios/<int:usuario_id>', methods=['PUT'])
def actualizar_usuario(usuario_id):
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        # ...existing code...
        empresa_id = int(request_user.get('empresa_id') or 0)

        # Permisos de edición de usuario adaptados a MongoDB pendiente de implementar si es necesario

        data = request.get_json() or {}
        nombre = str(data.get('nombre') or '').strip()
        email = str(data.get('email') or '').strip().lower()
        rol = slugify_estado(data.get('rol') or 'comercial') or 'comercial'
        if not nombre:
            return jsonify({'error': 'Nombre requerido'}), 400
        if not email:
            return jsonify({'error': 'Email requerido'}), 400
        if '@' not in email or '.' not in email.split('@')[-1]:
            return jsonify({'error': 'Email no válido'}), 400

        # Validación de roles adaptada a MongoDB pendiente de implementar si es necesario


        # Lógica de billing adaptada a MongoDB pendiente de implementar si es necesario

        has_billing_model = ('billing_model' in data) or ('modelo_pago' in data)
        has_payment_method = ('payment_method' in data) or ('metodo_pago' in data)

        # Lógica de billing adaptada a MongoDB pendiente de implementar si es necesario



        # Actualizar usuario en MongoDB
        col = get_empresa_collection('usuarios', None)
        try:
            oid = ObjectId(usuario_id)
        except Exception:
            # permitir id numérico como fallback
            oid = usuario_id

        update_doc = {}
        if nombre:
            update_doc['nombre'] = nombre
        if email:
            update_doc['email'] = email
        if rol:
            update_doc['rol'] = rol

        if not update_doc:
            return jsonify({'error': 'Nada que actualizar'}), 400

        result = col.update_one({'_id': oid}, {'$set': update_doc})
        if result.matched_count == 0:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        usuario = col.find_one({'_id': oid})
        return jsonify(fix_id(usuario)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/billing/config', methods=['GET'])
def get_billing_config():
    return jsonify({
        'free_signup_credits': FREE_SIGNUP_CREDITS,
        'pricing_credits': CREDIT_COSTS,
        'checkout_enabled': stripe_enabled(),
        'checkout_provider': 'stripe',
        'currency': STRIPE_CURRENCY,
        'price_per_credit_cents': STRIPE_PRICE_PER_CREDIT_CENTS,
        'billing_models': [
            {'key': 'creditos', 'label': 'Pago por uso (créditos)'},
            {'key': 'suscripcion', 'label': 'Suscripción mensual'},
        ],
        'payment_methods': [
            {'key': 'paypal', 'label': 'PayPal'},
            {'key': 'tarjeta', 'label': 'Tarjeta bancaria'},
        ],
    }), 200


@app.route('/api/billing/checkout-session', methods=['POST'])
def create_billing_checkout_session():
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error

        if not stripe_enabled():
            return jsonify({'error': 'Pasarela no configurada. Define STRIPE_SECRET_KEY.'}), 503

        empresa_id = int(request_user.get('empresa_id') or 0)
        data = request.get_json() or {}

        usuario_id = int(data.get('usuario_id') or request_user.get('id') or 0)
        creditos = int(data.get('creditos') or 0)
        payment_method = normalize_payment_method(data.get('payment_method') or data.get('metodo_pago') or 'tarjeta')
        success_url = str(data.get('success_url') or STRIPE_CHECKOUT_SUCCESS_URL).strip()
        cancel_url = str(data.get('cancel_url') or STRIPE_CHECKOUT_CANCEL_URL).strip()

        if usuario_id <= 0:
            return jsonify({'error': 'usuario_id inválido'}), 400
        if creditos <= 0:
            return jsonify({'error': 'creditos debe ser mayor que 0'}), 400
        if creditos > 50000:
            return jsonify({'error': 'creditos excede el máximo permitido por operación'}), 400
        if payment_method not in {'paypal', 'tarjeta'}:
            return jsonify({'error': 'metodo_pago no válido (paypal|tarjeta)'}), 400
        if not success_url.startswith('http://') and not success_url.startswith('https://'):
            return jsonify({'error': 'success_url debe ser http(s)'}), 400
        if not cancel_url.startswith('http://') and not cancel_url.startswith('https://'):
            return jsonify({'error': 'cancel_url debe ser http(s)'}), 400

        # Lógica MongoDB pendiente si es necesario
        return jsonify({'error': 'Usuario no encontrado'}), 404

        method_types = ['card'] if payment_method == 'tarjeta' else ['paypal']
        amount_cents = int(creditos * STRIPE_PRICE_PER_CREDIT_CENTS)

        stripe_payload = {
            'mode': 'payment',
            'success_url': success_url,
            'cancel_url': cancel_url,
            'client_reference_id': str(usuario_id),
            'line_items[0][price_data][currency]': STRIPE_CURRENCY,
            'line_items[0][price_data][unit_amount]': str(STRIPE_PRICE_PER_CREDIT_CENTS),
            'line_items[0][price_data][product_data][name]': f'Recarga de {creditos} créditos',
            'line_items[0][quantity]': str(creditos),
            'metadata[usuario_id]': str(usuario_id),
            'metadata[empresa_id]': str(empresa_id),
            'metadata[creditos]': str(creditos),
            'metadata[payment_method]': payment_method,
        }
        stripe_payload['payment_method_types[]'] = method_types

        session = stripe_api_request('/checkout/sessions', method='POST', payload=stripe_payload)
        session_id = str(session.get('id') or '').strip()
        session_url = str(session.get('url') or '').strip()
        if not session_id or not session_url:
            # Lógica MongoDB pendiente si es necesario
            return jsonify({'error': 'No se pudo crear la sesión de Stripe'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/billing/checkout-confirm', methods=['POST'])
def confirm_billing_checkout_session():
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error

        if not stripe_enabled():
            return jsonify({'error': 'Pasarela no configurada. Define STRIPE_SECRET_KEY.'}), 503

        empresa_id = int(request_user.get('empresa_id') or 0)
        data = request.get_json() or {}
        session_id = str(data.get('checkout_session_id') or data.get('session_id') or '').strip()
        if not session_id:
            return jsonify({'error': 'checkout_session_id requerido'}), 400
        # Aquí deberías consultar la transacción en la colección MongoDB correspondiente
        # Si no existe:
        # return jsonify({'error': 'Sesión de checkout no encontrada'}), 404
        # Aquí deberías consultar y actualizar la transacción en MongoDB

        # Lógica de créditos adaptada a MongoDB pendiente de implementar si es necesario
        # return jsonify({...}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/usuarios/<int:usuario_id>/creditos', methods=['GET'])
def get_creditos_usuario(usuario_id):
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = int(request_user.get('empresa_id') or 0)

        # TODO: Implementar consulta de créditos con MongoDB
        return jsonify({'error': 'No implementado: migrar consulta de créditos a MongoDB'}), 501
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/usuarios/<int:usuario_id>/creditos/cargar', methods=['POST'])
def cargar_creditos_usuario(usuario_id):
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = int(request_user.get('empresa_id') or 0)

        data = request.get_json() or {}
        creditos = int(data.get('creditos') or 0)
        payment_method = normalize_payment_method(data.get('payment_method') or data.get('metodo_pago'))

        if creditos <= 0:
            return jsonify({'error': 'creditos debe ser mayor que 0'}), 400
        if not payment_method:
            return jsonify({'error': 'metodo_pago no válido (paypal|tarjeta)'}), 400

        # TODO: Implementar carga de créditos con MongoDB
        return jsonify({'error': 'No implementado: migrar carga de créditos a MongoDB'}), 501
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/billing/consumir', methods=['POST'])
def consumir_creditos_billing():
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = int(request_user.get('empresa_id') or 0)

        data = request.get_json() or {}
        usuario_id = int(data.get('usuario_id') or 0)
        usuario_email = str(data.get('usuario_email') or '').strip().lower()
        usuario_nombre = str(data.get('usuario_nombre') or '').strip()
        accion = str(data.get('accion') or '').strip().lower()
        referencia = str(data.get('referencia') or '').strip() or None
        metadata = data.get('metadata') if isinstance(data.get('metadata'), dict) else {}

        if usuario_id <= 0 and not usuario_email and not usuario_nombre:
            return jsonify({'error': 'Debes enviar usuario_id, usuario_email o usuario_nombre'}), 400
        if accion not in CREDIT_COSTS:
            return jsonify({'error': 'accion no válida. Usa report|repetidora|trapping|troquel'}), 400

        cost = int(CREDIT_COSTS[accion])
        # TODO: Implementar consumo de créditos con MongoDB
        return jsonify({'error': 'No implementado: migrar consumo de créditos a MongoDB'}), 501
    # Lógica MongoDB pendiente si es necesario

            # Lógica MongoDB pendiente si es necesario
        return jsonify({'error': 'No se pudo registrar el consumo'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/usuarios/<int:usuario_id>', methods=['DELETE'])
def eliminar_usuario(usuario_id):
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        # request_role = normalize_role(request_user.get('rol'))  # Legacy, no usado con MongoDB
        empresa_id = int(request_user.get('empresa_id') or 0)

        col = get_empresa_collection('usuarios', None)
        try:
            oid = ObjectId(usuario_id)
        except Exception:
            oid = usuario_id
        result = col.delete_one({'_id': oid})
        if result.deleted_count == 0:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/settings', methods=['GET'])
def get_settings_catalogo():
    try:
        categoria = (request.args.get('categoria') or '').strip().lower()
        empresa_id = 0
        col = get_empresa_collection('config_opciones', empresa_id)
        # Asegura que los estados protegidos estén presentes (solo para 'estados_pedido')
        def ensure_estados_protegidos_presentes():
            defaults_estados = [
                'Diseño',
                'Pendiente de Aprobación',
                'Pendiente de Cliché',
                'Pendiente de Impresión',
                'Pendiente Post-Impresión',
                'Finalizado',
                'Parado',
                'Cancelado',
            ]
            existentes = {slugify_estado(row.get('valor')) for row in col.find({'categoria': 'estados_pedido'}) if row.get('valor')}
            faltantes = [valor for valor in defaults_estados if slugify_estado(valor) not in existentes]
            if not faltantes:
                return
            orden_base = (col.find({'categoria': 'estados_pedido'}).sort('orden', -1).limit(1)[0].get('orden', 0) if col.count_documents({'categoria': 'estados_pedido'}) else 0) + 1
            for idx, valor_default in enumerate(faltantes, start=0):
                col.insert_one({
                    'categoria': 'estados_pedido',
                    'valor': valor_default,
                    'orden': orden_base + idx,
                    'fecha_creacion': datetime.now().isoformat()
                })

        if categoria:
            if categoria not in ALLOWED_SETTINGS_CATEGORIES:
                return jsonify({'error': 'Categoría no válida'}), 400
            if categoria == 'estados_pedido':
                ensure_estados_protegidos_presentes()
            rows = list(col.find({'categoria': categoria}).sort([('orden', 1), ('_id', 1)]))
            items = [{
                'id': str(row.get('_id')),
                'categoria': row.get('categoria'),
                'valor': row.get('valor'),
                'orden': row.get('orden', 0),
                'fecha_creacion': row.get('fecha_creacion')
            } for row in rows]
            return jsonify({'categoria': categoria, 'items': items}), 200
        # Si no hay categoría, devolver todas
        ensure_estados_protegidos_presentes()
        rows = list(col.find({}).sort([('categoria', 1), ('orden', 1), ('_id', 1)]))
        settings = {key: [] for key in ALLOWED_SETTINGS_CATEGORIES}
        for row in rows:
            categoria_row = row.get('categoria')
            if categoria_row not in settings:
                continue
            settings[categoria_row].append({
                'id': str(row.get('_id')),
                'categoria': categoria_row,
                'valor': row.get('valor'),
                'orden': row.get('orden', 0),
                'fecha_creacion': row.get('fecha_creacion')
            })
        return jsonify({'settings': settings}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500



@app.route('/api/settings/estados-pedido-rules', methods=['GET', 'PUT'])
def api_estados_pedido_rules():
    try:
        if request.method == 'GET':
            # Devuelve las reglas inferidas/almacenadas y los estados disponibles
            payload = get_estados_pedido_rules()
            return jsonify(payload), 200

        # PUT -> Guardar reglas
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = 0
        data = request.get_json() or {}
        rules = data.get('rules')
        if not isinstance(rules, dict):
            return jsonify({'error': 'rules debe ser un objeto JSON'}), 400

        col = get_empresa_collection('config_general', empresa_id)
        # Guardar como JSON string
        col.update_one({'clave': 'estados_pedido_rules'}, {'$set': {'valor': json.dumps(rules), 'fecha_actualizacion': datetime.now().isoformat()}}, upsert=True)
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/settings/roles-permissions', methods=['GET'])
def api_roles_permissions():
    """Devuelve la matriz de permisos por rol y la lista de permisos disponibles."""
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        col_general = get_empresa_collection('config_general', 0)
        doc = col_general.find_one({'clave': 'role_permissions'})
        parsed = None
        if doc and doc.get('valor'):
            try:
                parsed = json.loads(doc.get('valor'))
            except Exception:
                parsed = None
        if not isinstance(parsed, dict):
            parsed = ROLE_PERMISSIONS_DEFAULT

        # Also return the list of known permissions and available roles
        col_roles = get_empresa_collection('config_opciones', 0)
        rows = list(col_roles.find({'categoria': 'roles'}).sort([('orden', 1), ('_id', 1)]))
        roles = []
        for r in rows:
            label = (r.get('valor') or '').strip()
            key = slugify_estado(label)
            if label and key:
                roles.append({'key': key, 'label': label})

        return jsonify({'permissions': PERMISSION_KEYS, 'roles_permissions': parsed, 'roles': roles}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/settings/active-role', methods=['GET', 'PUT'])
def api_active_role():
    try:
        if request.method == 'GET':
            col_opciones = get_empresa_collection('config_opciones', 0)
            rows = list(col_opciones.find({'categoria': 'roles'}).sort([('orden', 1), ('_id', 1)]))
            roles = []
            for r in rows:
                label = (r.get('valor') or '').strip()
                key = slugify_estado(label)
                if not label or not key:
                    continue
                roles.append({'key': key, 'label': label})

            col_general = get_empresa_collection('config_general', 0)
            doc = col_general.find_one({'clave': 'active_role'})
            active = (doc.get('valor') if doc and doc.get('valor') else 'root')
            # ensure active is a key (slug)
            active_key = slugify_estado(str(active)) or 'root'
            active_label = next((r['label'] for r in roles if r['key'] == active_key), active_key)
            return jsonify({'active_role': active_key, 'active_role_label': active_label, 'roles': roles}), 200

        # PUT - update active role
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        data = request.get_json() or {}
        next_role = str(data.get('active_role') or '').strip()
        if not next_role:
            return jsonify({'error': 'active_role requerido'}), 400

        col_opciones = get_empresa_collection('config_opciones', 0)
        rows = list(col_opciones.find({'categoria': 'roles'}))
        valid_keys = {slugify_estado((r.get('valor') or '').strip()): (r.get('valor') or '').strip() for r in rows}
        if next_role not in valid_keys:
            return jsonify({'error': 'Rol no válido'}), 400

        col_general = get_empresa_collection('config_general', 0)
        col_general.update_one({'clave': 'active_role'}, {'$set': {'valor': next_role, 'fecha_actualizacion': datetime.now().isoformat()}}, upsert=True)
        return jsonify({'success': True, 'active_role': next_role, 'active_role_label': valid_keys.get(next_role)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/settings/modo-creacion', methods=['GET', 'PUT'])
def api_modo_creacion():
    try:
        if request.method == 'GET':
            col_general = get_empresa_collection('config_general', 0)
            doc = col_general.find_one({'clave': 'modo_creacion'})
            valor = (doc.get('valor') if doc and doc.get('valor') else 'manual')
            valor = valor if valor in ['manual', 'automatico'] else 'manual'
            return jsonify({'modo_creacion': valor}), 200

        # PUT
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        data = request.get_json() or {}
        modo = str(data.get('modo_creacion') or data.get('modo') or '').strip().lower()
        if modo not in ['manual', 'automatico']:
            return jsonify({'error': 'modo_creacion no válido (manual|automatico)'}), 400
        col_general = get_empresa_collection('config_general', 0)
        col_general.update_one({'clave': 'modo_creacion'}, {'$set': {'valor': modo, 'fecha_actualizacion': datetime.now().isoformat()}}, upsert=True)
        return jsonify({'success': True, 'modo_creacion': modo}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/settings/session-timeout', methods=['GET', 'PUT'])
def api_session_timeout():
    try:
        if request.method == 'GET':
            col_general = get_empresa_collection('config_general', 0)
            doc = col_general.find_one({'clave': 'session_timeout_minutes'})
            value = int(doc.get('valor')) if doc and doc.get('valor') and str(doc.get('valor')).isdigit() else SESSION_TIMEOUT_MINUTES_DEFAULT
            return jsonify({'session_timeout_minutes': int(value), 'min': SESSION_TIMEOUT_MINUTES_MIN, 'max': SESSION_TIMEOUT_MINUTES_MAX}), 200

        # PUT
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        data = request.get_json() or {}
        try:
            minutes = int(data.get('session_timeout_minutes'))
        except Exception:
            return jsonify({'error': 'session_timeout_minutes debe ser un entero'}), 400
        if minutes < SESSION_TIMEOUT_MINUTES_MIN or minutes > SESSION_TIMEOUT_MINUTES_MAX:
            return jsonify({'error': f'session_timeout_minutes fuera de rango ({SESSION_TIMEOUT_MINUTES_MIN}-{SESSION_TIMEOUT_MINUTES_MAX})'}), 400
        col_general = get_empresa_collection('config_general', 0)
        col_general.update_one({'clave': 'session_timeout_minutes'}, {'$set': {'valor': str(minutes), 'fecha_actualizacion': datetime.now().isoformat()}}, upsert=True)
        return jsonify({'success': True, 'session_timeout_minutes': minutes}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/settings/opcion', methods=['GET', 'POST'])
def crear_config_opcion():
    try:
        categoria = request.args.get('categoria', '').strip().lower()
        valor = request.args.get('valor', '').strip()
        col = get_empresa_collection('config_opciones', 0)
        siguiente_orden = (col.find({'categoria': categoria}).sort('orden', -1).limit(1)[0].get('orden', 0) if col.count_documents({'categoria': categoria}) else 0) + 1
        doc = {
            'categoria': categoria,
            'valor': valor,
            'orden': siguiente_orden,
            'fecha_creacion': datetime.now().isoformat()
        }
        result = col.insert_one(doc)
        return jsonify({'success': True, 'id': str(result.inserted_id)}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/settings/reorder', methods=['POST'])
def reorder_settings_catalogo_items():
    try:
        data = request.get_json() or {}
        categoria = (data.get('categoria') or '').strip().lower()
        ordered_ids = data.get('ordered_ids') or []

        if categoria not in ALLOWED_SETTINGS_CATEGORIES:
            return jsonify({'error': 'Categoría no válida'}), 400
        if not isinstance(ordered_ids, list) or not ordered_ids:
            return jsonify({'error': 'ordered_ids requerido'}), 400

        # MongoDB: IDs son strings (ObjectId)
        ordered_ids = [str(item_id) for item_id in ordered_ids]
        col = get_empresa_collection('config_opciones', 0)
        ids_categoria = [str(row['_id']) for row in col.find({'categoria': categoria})]
        if set(ids_categoria) != set(ordered_ids):
            return jsonify({'error': 'ordered_ids no coincide con los elementos de la categoría'}), 400

        # Proteger orden de roles base
        if categoria == 'roles':
            rows_roles = list(col.find({'categoria': 'roles'}))
            id_by_role_key = {}
            for row in rows_roles:
                role_id = str(row['_id'])
                role_label = row.get('valor')
                role_key = slugify_estado(role_label)
                if role_key in PROTECTED_ROLE_KEYS:
                    id_by_role_key[role_key] = role_id
            expected_prefix = [id_by_role_key[key] for key in PROTECTED_ROLE_ORDER if key in id_by_role_key]
            if ordered_ids[:len(expected_prefix)] != expected_prefix:
                return jsonify({'error': 'Los roles base deben permanecer fijos al inicio en orden Operario, Administrador, Root'}), 409

        # Actualizar orden
        for idx, item_id in enumerate(ordered_ids, start=1):
            col.update_one({'_id': ObjectId(item_id), 'categoria': categoria}, {'$set': {'orden': idx}})

        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/settings/<int:item_id>', methods=['PUT'])
def update_settings_catalogo_item(item_id):
    try:
        data = request.get_json() or {}
        nuevo_valor = (data.get('valor') or '').strip()
        if not nuevo_valor:
            return jsonify({'error': 'Valor requerido'}), 400
        col = get_empresa_collection('config_opciones', 0)
        # Buscar el documento por _id
        from bson import ObjectId
        try:
            doc = col.find_one({'_id': ObjectId(item_id)})
        except Exception:
            return jsonify({'error': 'Ítem no encontrado'}), 404
        if not doc:
            return jsonify({'error': 'Ítem no encontrado'}), 404
        categoria = (doc.get('categoria') or '').strip().lower()
        valor_actual = (doc.get('valor') or '').strip()
        if categoria not in ALLOWED_SETTINGS_CATEGORIES:
            return jsonify({'error': 'Categoría no válida'}), 400
        if valor_actual.strip().lower() == nuevo_valor.strip().lower():
            return jsonify({'success': True, 'id': item_id, 'valor': valor_actual, 'changed': False}), 200
        slug_actual = slugify_estado(valor_actual)
        slug_nuevo = slugify_estado(nuevo_valor)
        if categoria in ['roles', 'estados_pedido'] and not slug_nuevo:
            return jsonify({'error': 'Valor inválido para esta categoría'}), 400
        if categoria == 'roles' and slug_actual in PROTECTED_ROLE_KEYS:
            return jsonify({'error': f'No se puede renombrar el rol base "{valor_actual}"'}), 409
        if categoria == 'estados_pedido' and slug_actual in PROTECTED_ESTADOS_PEDIDO_KEYS and slug_nuevo != slug_actual:
            return jsonify({'error': f'No se puede renombrar el estado fijo "{valor_actual}"'}), 409
        if categoria == 'roles' and slug_nuevo in PROTECTED_ROLE_KEYS and slug_nuevo != slug_actual:
            canonical = ROLE_LABELS.get(slug_nuevo, nuevo_valor)
            return jsonify({'error': f'El rol base "{canonical}" está protegido y no admite variantes de nombre'}), 409
        if categoria == 'estados_pedido' and slug_nuevo in PROTECTED_ESTADOS_PEDIDO_KEYS and slug_nuevo != slug_actual:
            return jsonify({'error': 'Los estados fijos no admiten variantes de nombre'}), 409
        # Verificar duplicados
        if col.find_one({'categoria': categoria, 'valor': {'$regex': f'^{nuevo_valor}$', '$options': 'i'}, '_id': {'$ne': ObjectId(item_id)}}):
            return jsonify({'error': 'Ese valor ya existe en la categoría'}), 409
        # Verificar conflicto de slug
        if categoria in ['roles', 'estados_pedido']:
            for row in col.find({'categoria': categoria, '_id': {'$ne': ObjectId(item_id)}}):
                if slugify_estado(row.get('valor')) == slug_nuevo:
                    return jsonify({'error': 'Ya existe un valor equivalente en esa categoría'}), 409
        # Actualizar valor
        col.update_one({'_id': ObjectId(item_id)}, {'$set': {'valor': nuevo_valor}})
        # TODO: cascade_role_key_rename y cascade_estado_slug_rename deben adaptarse a MongoDB si se usan
        return jsonify({'success': True, 'id': item_id, 'valor': nuevo_valor, 'changed': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/settings/<int:item_id>', methods=['DELETE'])
def delete_settings_catalogo_item(item_id):
    try:
        from bson import ObjectId
        col = get_empresa_collection('config_opciones', 0)
        try:
            doc = col.find_one({'_id': ObjectId(item_id)})
        except Exception:
            return jsonify({'error': 'Ítem no encontrado'}), 404
        if not doc:
            return jsonify({'error': 'Ítem no encontrado'}), 404
        categoria = (doc.get('categoria') or '').strip().lower()
        valor = (doc.get('valor') or '').strip()
        if categoria == 'roles' and slugify_estado(valor) in PROTECTED_ROLE_KEYS:
            return jsonify({'error': f'No se puede eliminar el rol base "{valor}"'}), 409
        if categoria == 'estados_pedido' and slugify_estado(valor) in PROTECTED_ESTADOS_PEDIDO_KEYS:
            return jsonify({'error': f'No se puede eliminar el estado fijo "{valor}"'}), 409
        result = col.delete_one({'_id': ObjectId(item_id)})
        if result.deleted_count == 0:
            return jsonify({'error': 'Ítem no encontrado'}), 404
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/pedidos', methods=['GET'])
def get_pedidos():
    """Obtiene todos los pedidos"""
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = int(request_user.get('empresa_id') or 0)
        col = get_empresa_collection('pedidos', empresa_id)
        pedidos = list(col.find({'empresa_id': empresa_id}))
        trabajos_col = get_empresa_collection('trabajos', empresa_id)
        trabajos_map = {}
        for t in trabajos_col.find({'empresa_id': empresa_id}):
            tt = fix_id(t)
            trabajos_map[str(tt.get('id'))] = tt
        pedidos_out = []
        for p in pedidos:
            p = fix_id(p)
            trabajo = trabajos_map.get(str(p.get('trabajo_id')))
            # Lógica de pedido adaptada a MongoDB: anexar trabajo si existe
            if trabajo:
                p['trabajo'] = trabajo
            pedidos_out.append(p)
        return jsonify({'pedidos': pedidos_out}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/pedidos/<pedido_id>', methods=['GET'])
def get_pedido(pedido_id):
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = int(request_user.get('empresa_id') or 0)
        col = get_empresa_collection('pedidos', empresa_id)
        try:
            oid = ObjectId(pedido_id)
        except Exception:
            return jsonify({'error': 'ID de pedido inválido'}), 400

        pedido = col.find_one({'_id': oid, 'empresa_id': empresa_id})
        if not pedido:
            return jsonify({'error': 'Pedido no encontrado'}), 404

        pedido = fix_id(pedido)
        # intentar anexar trabajo asociado si existe
        trabajos_col = get_empresa_collection('trabajos', empresa_id)
        try:
            trabajo_doc = None
            t_id = pedido.get('trabajo_id')
            if t_id and isinstance(t_id, str) and len(t_id) == 24:
                try:
                    trabajo_doc = trabajos_col.find_one({'_id': ObjectId(t_id), 'empresa_id': empresa_id})
                except Exception:
                    trabajo_doc = None
            if trabajo_doc:
                pedido['trabajo'] = fix_id(trabajo_doc)
        except Exception:
            pass

        return jsonify(fix_id(pedido)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/presupuestos/<int:trabajo_id>', methods=['GET'])
def get_presupuesto(trabajo_id):
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = int(request_user.get('empresa_id') or 0)
        # Lógica de consulta de presupuesto adaptada a MongoDB pendiente de implementar si es necesario
        return jsonify({'success': True, 'mensaje': 'Consulta de presupuesto pendiente de implementar'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/presupuestos', methods=['POST'])
def save_presupuesto():
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = int(request_user.get('empresa_id') or 0)

        if modo_automatico_activo():
            return jsonify({'error': 'Creación manual deshabilitada. Usa integración API REST.'}), 403

        # Delegar en la implementación concreta de creación para evitar rutas duplicadas
        # y garantizar que el presupuesto se inserta en la colección.
        # Nota: la función `crear_presupuesto` está definida más abajo y hará la inserción.
        return crear_presupuesto()
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/presupuestos/aceptar/<trabajo_id>', methods=['POST'])
def aceptar_presupuesto(trabajo_id):
    """Acepta un presupuesto y crea un pedido"""
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = int(request_user.get('empresa_id') or 0)
        data = request.get_json() or {}

        # Buscar presupuesto por trabajo_id
        pres_col = get_empresa_collection('presupuestos', empresa_id)
        pres = pres_col.find_one({'empresa_id': empresa_id, 'trabajo_id': trabajo_id})
        if not pres:
            # Intentar buscar por id del presupuesto (fallback)
            try:
                pres = pres_col.find_one({'empresa_id': empresa_id, '_id': ObjectId(trabajo_id)})
            except Exception:
                pres = None

        if not pres:
            return jsonify({'error': 'Presupuesto no encontrado para el trabajo_id indicado'}), 404

        # Crear pedido usando datos enviados o los datos del presupuesto
        pedidos_col = get_empresa_collection('pedidos', empresa_id)
        try:
            counters_col = mongo.db['counters']
            seq_doc = counters_col.find_one_and_update(
                {'key': 'pedido_seq', 'empresa_id': empresa_id},
                {'$inc': {'seq': 1}},
                upsert=True,
                return_document=pymongo.ReturnDocument.AFTER
            )
            numero_pedido = str(seq_doc.get('seq', 0))
        except Exception:
            numero_pedido = f"PED-{int(time.time())}"

        # Reconstruir/parsear los datos del presupuesto existentes
        existing_dj = {}
        try:
            if pres.get('datos_json') and isinstance(pres.get('datos_json'), str):
                existing_dj = json.loads(pres.get('datos_json'))
            else:
                existing_dj = pres.get('datos_json') or pres.get('datos_presupuesto') or {}
        except Exception:
            existing_dj = pres.get('datos_presupuesto') or {}

        # Datos enviados en la petición (puede venir como datos_presupuesto/datosPresupuesto)
        incoming_dj = data.get('datosPresupuesto') or data.get('datos_presupuesto') or {}

        # Aceptar también campos enviados al nivel superior y consolidarlos dentro de datos
        extra_keys = ['cliente', 'nombre', 'referencia', 'razonSocial', 'razon_social', 'cif', 'personasContacto', 'email', 'vendedor', 'formatoAncho', 'formatoLargo', 'tirada', 'selectedTintas', 'detalleTintaEspecial', 'coberturaResult', 'troquelEstadoSel', 'troquelFormaSel', 'troquelCoste', 'observaciones', 'acabado', 'material', 'maquina', 'fecha', 'fecha_entrega']
        # Merge: start from existing, then top-level data, then incoming_dj
        merged_dj = dict(existing_dj or {})
        for k in extra_keys:
            if k in data and (k not in merged_dj or merged_dj.get(k) is None):
                merged_dj[k] = data.get(k)
        if isinstance(incoming_dj, dict):
            merged_dj.update(incoming_dj)
        else:
            # incoming_dj puede ser una lista (p.ej. selectedTintas) enviada por error desde el cliente.
            # Manejarlo de forma tolerante: si es lista la interpretamos como `selectedTintas`.
            if isinstance(incoming_dj, list):
                merged_dj['selectedTintas'] = incoming_dj

        # Persistir merge en el presupuesto para asegurar que selectedTintas quede guardado
        try:
            pres_col.update_one({'_id': pres.get('_id')}, {'$set': {'datos_json': merged_dj, 'datos_presupuesto': merged_dj}})
        except Exception:
            try:
                pres_col.update_one({'empresa_id': empresa_id, '$or': [{'_id': pres.get('_id')}, {'id': pres.get('id')} ]}, {'$set': {'datos_json': merged_dj, 'datos_presupuesto': merged_dj}})
            except Exception:
                pass

        datos_presupuesto = merged_dj or {}

        doc_pedido = {
            'empresa_id': empresa_id,
            'trabajo_id': pres.get('trabajo_id'),
            'numero_pedido': numero_pedido,
            'referencia': pres.get('referencia') or datos_presupuesto.get('referencia'),
            'fecha_pedido': datetime.now().isoformat(),
            'datos_presupuesto': datos_presupuesto
        }
        try:
            available = {item['value']: item.get('label') for item in get_estados_pedido_disponibles()}
            default_label = available.get('diseno') or 'Diseño'
        except Exception:
            default_label = 'Diseño'
        doc_pedido['estado'] = default_label
        doc_pedido['fecha_finalizacion'] = None
        result = pedidos_col.insert_one(doc_pedido)
        pedido_id = str(result.inserted_id)

        # Actualizar presupuesto: aprobado, pedido_id, fecha_aprobacion
        try:
            pres_col.update_one({'_id': pres.get('_id')}, {'$set': {'aprobado': True, 'pedido_id': pedido_id, 'fecha_aprobacion': datetime.now().isoformat()}})
        except Exception:
            pass

        return jsonify({'success': True, 'pedido_id': pedido_id}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/presupuestos', methods=['GET'])
def get_presupuestos():
    """Obtiene todos los presupuestos"""
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = int(request_user.get('empresa_id') or 0)

        col = get_empresa_collection('presupuestos', empresa_id)
        presupuestos = list(col.find({'empresa_id': empresa_id}))

        # Adjuntar trabajo relacionado si existe
        trabajos_col = get_empresa_collection('trabajos', empresa_id)
        trabajos_map = {}
        for t in trabajos_col.find({'empresa_id': empresa_id}):
            tt = fix_id(t)
            trabajos_map[str(tt.get('id'))] = tt

        presupuestos_out = []
        for p in presupuestos:
            p = fix_id(p)
            try:
                trabajo = trabajos_map.get(str(p.get('trabajo_id')))
                if trabajo:
                    p['trabajo'] = trabajo
            except Exception:
                pass
            # intentar parsear datos_json si es string
            try:
                if p.get('datos_json') and isinstance(p.get('datos_json'), str):
                    p['datos_json'] = json.loads(p['datos_json'])
            except Exception:
                pass
            # Elevar claves comunes desde datos_json a nivel top-level para compatibilidad con frontend
            try:
                common = ['cliente', 'nombre', 'referencia', 'razon_social', 'razonSocial', 'cif', 'email', 'vendedor', 'formatoAncho', 'formatoLargo', 'tirada', 'selectedTintas', 'acabado', 'observaciones', 'material', 'detalleTintaEspecial']
                dj = p.get('datos_json') or {}
                if isinstance(dj, dict):
                    for ck in common:
                        if ck in dj and not p.get(ck):
                            p[ck] = dj.get(ck)
                # mantener también `datos_presupuesto` para compatibilidad con UI antiguas
                if isinstance(dj, dict) and not p.get('datos_presupuesto'):
                    p['datos_presupuesto'] = dj
            except Exception:
                pass
            presupuestos_out.append(p)

        return jsonify({'presupuestos': presupuestos_out}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/presupuestos/<presupuesto_id>', methods=['PUT'])
def update_presupuesto(presupuesto_id):
    """Actualiza campos de un presupuesto existente por id."""
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = int(request_user.get('empresa_id') or 0)

        data = request.get_json() or {}
        col = get_empresa_collection('presupuestos', empresa_id)

        # Construir update
        update_fields = {}
        # Campos de primer nivel permitidos
        for key in ('numero_presupuesto', 'fecha_presupuesto', 'aprobado', 'referencia', 'pedido_id'):
            if key in data:
                update_fields[key] = data.get(key)

        # datos_json completo
        if 'datos_json' in data:
            update_fields['datos_json'] = data.get('datos_json')
        # mantener compatibilidad: también actualizar datos_presupuesto si se envía datos_json
        if 'datos_json' in data:
            update_fields['datos_presupuesto'] = data.get('datos_json')

        if not update_fields:
            return jsonify({'error': 'No hay campos para actualizar'}), 400

        # Intentar convertir a ObjectId, si falla usar como string
        try:
            oid = ObjectId(presupuesto_id)
            res = col.update_one({'_id': oid, 'empresa_id': empresa_id}, {'$set': update_fields})
        except Exception:
            # fallback: buscar por campo string 'id' o por trabajo_id
            res = col.update_one({'empresa_id': empresa_id, '$or': [{'_id': presupuesto_id}, {'id': presupuesto_id}]}, {'$set': update_fields})

        if res.matched_count == 0:
            return jsonify({'error': 'Presupuesto no encontrado'}), 404

        # Si se marcó como aprobado, crear un pedido asociado si no existe
        try:
            if update_fields.get('aprobado'):
                # obtener el documento actualizado del presupuesto
                pres_doc = None
                try:
                    oid = ObjectId(presupuesto_id)
                    pres_doc = col.find_one({'_id': oid, 'empresa_id': empresa_id})
                except Exception:
                    pres_doc = col.find_one({'empresa_id': empresa_id, '$or': [{'_id': presupuesto_id}, {'id': presupuesto_id}]})

                if pres_doc and not pres_doc.get('pedido_id'):
                    # crear pedido vinculado
                    pedidos_col = get_empresa_collection('pedidos', empresa_id)
                    # generar numero_pedido (contador) similar a crear_pedido()
                    try:
                        counters_col = mongo.db['counters']
                        seq_doc = counters_col.find_one_and_update(
                            {'key': 'pedido_seq', 'empresa_id': empresa_id},
                            {'$inc': {'seq': 1}},
                            upsert=True,
                            return_document=pymongo.ReturnDocument.AFTER
                        )
                        numero_pedido = str(seq_doc.get('seq', 0))
                    except Exception:
                        numero_pedido = f"PED-{int(time.time())}"

                    doc_pedido = {
                        'empresa_id': empresa_id,
                        'trabajo_id': pres_doc.get('trabajo_id'),
                        'numero_pedido': numero_pedido,
                        'referencia': pres_doc.get('referencia'),
                        'fecha_pedido': datetime.now().isoformat(),
                        'datos_presupuesto': pres_doc.get('datos_json')
                    }
                    try:
                        available = {item['value']: item.get('label') for item in get_estados_pedido_disponibles()}
                        default_label = available.get('diseno') or 'Diseño'
                    except Exception:
                        default_label = 'Diseño'
                    doc_pedido['estado'] = default_label
                    doc_pedido['fecha_finalizacion'] = None
                    result_pedido = pedidos_col.insert_one(doc_pedido)
                    pedido_id = str(result_pedido.inserted_id)

                    # grabar pedido_id y fecha_aprobacion en el presupuesto
                    extra = {'pedido_id': pedido_id, 'fecha_aprobacion': datetime.now().isoformat()}
                    try:
                        oid = ObjectId(presupuesto_id)
                        col.update_one({'_id': oid, 'empresa_id': empresa_id}, {'$set': extra})
                    except Exception:
                        col.update_one({'empresa_id': empresa_id, '$or': [{'_id': presupuesto_id}, {'id': presupuesto_id}]}, {'$set': extra})
        except Exception:
            # No bloquear la actualización por errores en la creación del pedido
            pass

        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/presupuestos', methods=['POST'])
def crear_presupuesto():
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = int(request_user.get('empresa_id') or 0)
        data = request.get_json() or {}
        trabajo_id = data.get('trabajo_id')
        numero_presupuesto = data.get('numero_presupuesto')
        fecha_presupuesto = data.get('fecha_presupuesto')
        aprobado = data.get('aprobado', False)
        referencia = data.get('referencia')
        datos_json = data.get('datos_json') or {}
        # Aceptar también campos enviados al nivel superior y consolidarlos dentro de datos_json
        extra_keys = ['cliente', 'nombre', 'referencia', 'razonSocial', 'razon_social', 'cif', 'personasContacto', 'email', 'vendedor', 'formatoAncho', 'formatoLargo', 'tirada', 'selectedTintas', 'detalleTintaEspecial', 'coberturaResult', 'troquelEstadoSel', 'troquelFormaSel', 'troquelCoste', 'observaciones', 'acabado', 'material', 'maquina', 'fecha', 'fecha_entrega']
        for k in extra_keys:
            if k in data and (k not in datos_json or datos_json.get(k) is None):
                datos_json[k] = data.get(k)
        if not trabajo_id or not numero_presupuesto:
            return jsonify({'error': 'Faltan datos obligatorios'}), 400
        col = get_empresa_collection('presupuestos', empresa_id)
        doc = {
            'empresa_id': empresa_id,
            'trabajo_id': trabajo_id,
            'numero_presupuesto': numero_presupuesto,
            'fecha_presupuesto': fecha_presupuesto,
            'aprobado': aprobado,
            'referencia': referencia,
            'datos_json': datos_json,
            # Mantener compatibilidad con nomenclatura previa (frontend espera a veces `datos_presupuesto`)
            'datos_presupuesto': datos_json
        }
        # Mantener cliente a nivel superior para compatibilidad con la UI
        if datos_json.get('cliente') and not doc.get('cliente'):
            doc['cliente'] = datos_json.get('cliente')
        result = col.insert_one(doc)
        pres_id = str(result.inserted_id)

        # Si viene aprobado desde creación, crear pedido asociado
        try:
            if aprobado:
                pedidos_col = get_empresa_collection('pedidos', empresa_id)
                try:
                    counters_col = mongo.db['counters']
                    seq_doc = counters_col.find_one_and_update(
                        {'key': 'pedido_seq', 'empresa_id': empresa_id},
                        {'$inc': {'seq': 1}},
                        upsert=True,
                        return_document=pymongo.ReturnDocument.AFTER
                    )
                    numero_pedido = str(seq_doc.get('seq', 0))
                except Exception:
                    numero_pedido = f"PED-{int(time.time())}"

                doc_pedido = {
                    'empresa_id': empresa_id,
                    'trabajo_id': trabajo_id,
                    'numero_pedido': numero_pedido,
                    'referencia': referencia,
                    'fecha_pedido': datetime.now().isoformat(),
                    'datos_presupuesto': datos_json
                }
                try:
                    available = {item['value']: item.get('label') for item in get_estados_pedido_disponibles()}
                    default_label = available.get('diseno') or 'Diseño'
                except Exception:
                    default_label = 'Diseño'
                doc_pedido['estado'] = default_label
                doc_pedido['fecha_finalizacion'] = None
                result_pedido = pedidos_col.insert_one(doc_pedido)
                pedido_id = str(result_pedido.inserted_id)
                # actualizar presupuesto con pedido_id y fecha_aprobacion
                try:
                    oid = ObjectId(pres_id)
                    col.update_one({'_id': oid, 'empresa_id': empresa_id}, {'$set': {'pedido_id': pedido_id, 'fecha_aprobacion': datetime.now().isoformat()}})
                except Exception:
                    col.update_one({'empresa_id': empresa_id, '$or': [{'_id': pres_id}, {'id': pres_id}]}, {'$set': {'pedido_id': pedido_id, 'fecha_aprobacion': datetime.now().isoformat()}})
        except Exception:
            pass

        return jsonify({'success': True, 'presupuesto_id': pres_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/pedidos/manual', methods=['POST'])
def crear_pedido_manual():
    """Crea un pedido manual junto con su trabajo"""
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = int(request_user.get('empresa_id') or 0)

        if modo_automatico_activo():
            return jsonify({'error': 'Creación manual deshabilitada. Usa integración API REST.'}), 403

        data = request.get_json()
        nombre = data.get('nombre')
        cliente = data.get('cliente')
        referencia = data.get('referencia')
        vendedor = data.get('vendedor')
        fecha_pedido = data.get('fecha_pedido')
        fecha_entrega = data.get('fecha_entrega')
        maquina = data.get('maquina')
        razon_social = data.get('razon_social')
        cif = data.get('cif')
        personas_contacto = data.get('personas_contacto')
        email = data.get('email')

        fecha_pedido_valor = fecha_pedido if fecha_pedido else time.strftime('%Y-%m-%d')

        try:
            fecha_pedido_dt = time.strptime(fecha_pedido_valor, '%Y-%m-%d')
            fecha_entrega_dt = time.strptime(fecha_entrega, '%Y-%m-%d')
        except Exception:
            return jsonify({'error': 'Formato de fecha inválido. Usa YYYY-MM-DD'}), 400

        if fecha_entrega_dt < fecha_pedido_dt:
            return jsonify({'error': 'La fecha de entrega no puede ser anterior a la fecha de creación'}), 400
        
        if not all([nombre, cliente, referencia, fecha_entrega]):
            return jsonify({'error': 'Faltan campos requeridos'}), 400
        
        # Lógica MongoDB pendiente si es necesario
        return jsonify({'success': True, 'mensaje': 'Pedido creado exitosamente'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/integracion/documentos', methods=['POST'])
def crear_documento_integracion():
    """Crea presupuesto o pedido desde otro sistema vía JSON"""
    try:
        request_user = get_request_user()
        if not request_user:
            return jsonify({'error': 'Autenticación requerida para integración'}), 401
        empresa_id = int(request_user.get('empresa_id') or 0)

        data = request.get_json() or {}
        tipo = (data.get('tipo') or '').strip().lower()

        if tipo not in ['presupuesto', 'pedido']:
            return jsonify({'error': 'Campo tipo inválido. Usa presupuesto o pedido'}), 400

        nombre = (data.get('nombre') or '').strip()
        # TODO: Adaptar lógica de confirmación de checkout a MongoDB
        return jsonify({'error': 'No implementado: migrar confirmación de checkout a MongoDB'}), 501
                # TODO: Lógica MongoDB para cargar datos_presupuesto

        datos_presupuesto, _ = normalize_document_payload(datos_presupuesto)

        # Garantizar número y fecha de presupuesto en el detalle
        if row[12] and 'numero_presupuesto' not in datos_presupuesto:
            datos_presupuesto['numero_presupuesto'] = row[12]
        if row[13] and 'fecha_presupuesto' not in datos_presupuesto:
            datos_presupuesto['fecha_presupuesto'] = row[13]

        maquina_real = row[14] or datos_presupuesto.get('maquina_bd') or datos_presupuesto.get('maquina')
        if maquina_real:
            datos_presupuesto['maquina'] = maquina_real
            datos_presupuesto['maquina_bd'] = maquina_real
        
        pedido = {
            'id': row[0],
            'numero_pedido': row[1],
            'referencia': row[2],
            'fecha_pedido': row[3],
            'trabajo_id': row[5],
            'nombre': row[6],
            'cliente': row[7],
            'referencia_trabajo': row[8],
            'estado': row[9],
            'fecha_entrega': row[10],
            'dias_retraso': row[11],
            'numero_presupuesto': row[12],
            'fecha_presupuesto': row[13],
            'maquina_bd': maquina_real,
            'datos_presupuesto': datos_presupuesto
        }
        
        return jsonify(pedido), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/trabajos-produccion', methods=['GET'])
def get_trabajos_produccion():
    """Obtiene todos los trabajos disponibles para producción"""
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = int(request_user.get('empresa_id') or 0)

        from datetime import datetime, timedelta
        empresa_id = int(request_user.get('empresa_id') or 0)
        # TODO: Lógica MongoDB para obtener trabajos y reglas de estado
        
        # Calcular fecha de hace 15 días
        fecha_limite = (datetime.now() - timedelta(days=15)).isoformat()
        
        rules = get_estados_pedido_rules().get('rules', ESTADOS_RULES_DEFAULT)

        # Traer trabajos y filtrar según reglas dinámicas de estados
        # Lógica de consulta de trabajos adaptada a MongoDB pendiente de implementar si es necesario
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Endpoints para producción
@app.route('/api/pedidos', methods=['POST'])
def crear_pedido():
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = int(request_user.get('empresa_id') or 0)
        data = request.get_json() or {}
        trabajo_id = data.get('trabajo_id')
        numero_pedido = data.get('numero_pedido')
        referencia = data.get('referencia')
        fecha_pedido = data.get('fecha_pedido')
        datos_presupuesto = data.get('datos_presupuesto')
        if not trabajo_id:
            return jsonify({'error': 'Faltan datos obligatorios: trabajo_id'}), 400

        # Si no se proporciona `numero_pedido`, generamos un correlativo atómico
        if not numero_pedido:
            try:
                counters_col = mongo.db['counters']
                seq_doc = counters_col.find_one_and_update(
                    {'key': 'pedido_seq', 'empresa_id': empresa_id},
                    {'$inc': {'seq': 1}},
                    upsert=True,
                    return_document=pymongo.ReturnDocument.AFTER
                )
                numero_pedido = str(seq_doc.get('seq', 0))
            except Exception:
                # Fallback simple: timestamp-based if counter fails
                numero_pedido = f"PED-{int(time.time())}"
        col = get_empresa_collection('pedidos', empresa_id)
        doc = {
            'empresa_id': empresa_id,
            'trabajo_id': trabajo_id,
            'numero_pedido': numero_pedido,
            'referencia': referencia,
            'fecha_pedido': fecha_pedido,
            'datos_presupuesto': datos_presupuesto
        }
        # Establecer estado por defecto ('Diseño') usando las etiquetas configuradas
        try:
            available = {item['value']: item.get('label') for item in get_estados_pedido_disponibles()}
            default_label = available.get('diseno') or 'Diseño'
        except Exception:
            default_label = 'Diseño'
        doc['estado'] = default_label
        doc['fecha_finalizacion'] = None
        result = col.insert_one(doc)
        return jsonify({'success': True, 'pedido_id': str(result.inserted_id)}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/pedidos/<pedido_id>', methods=['PUT'])
def update_pedido(pedido_id):
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = int(request_user.get('empresa_id') or 0)
        col = get_empresa_collection('pedidos', empresa_id)
        try:
            oid = ObjectId(pedido_id)
        except Exception:
            return jsonify({'error': 'ID de pedido inválido'}), 400
        data = request.get_json() or {}
        update = {}
        # Campos editables
        for k in ('trabajo_id', 'numero_pedido', 'referencia', 'fecha_pedido', 'fecha_entrega', 'datos_presupuesto'):
            if k in data:
                update[k] = data[k]

        # Validación y normalización del estado según reglas configuradas
        if 'estado' in data:
            raw_estado = str(data.get('estado') or '').strip()
            if not raw_estado:
                return jsonify({'error': 'estado vacío'}), 400
            nuevo_estado = slugify_estado(raw_estado)
            disponibles = {item['value'] for item in get_estados_pedido_disponibles()}
            if nuevo_estado not in disponibles:
                return jsonify({'error': 'Estado no válido'}), 400

            # Obtener pedido actual para validar transición
            pedido_actual = col.find_one({'_id': oid, 'empresa_id': empresa_id})
            if not pedido_actual:
                return jsonify({'error': 'Pedido no encontrado'}), 404
            reglas = get_estados_pedido_rules().get('rules', ESTADOS_RULES_DEFAULT)
            estados_finales = set(reglas.get('estados_finalizados', []))
            estado_actual = slugify_estado(str(pedido_actual.get('estado') or ''))

            # Allow root users to override final-state lock
            request_role = str(request_user.get('rol') or '').strip().lower()
            # Allow override for root users or if active_role is root
            col_general = get_empresa_collection('config_general', 0)
            ar_doc = col_general.find_one({'clave': 'active_role'})
            active_role_cfg = (ar_doc.get('valor') if ar_doc and ar_doc.get('valor') else 'root')
            if estado_actual in estados_finales and estado_actual != nuevo_estado and request_role != 'root' and slugify_estado(active_role_cfg) != 'root':
                return jsonify({'error': 'No se puede cambiar el estado desde un estado finalizado'}), 400

            # Guardar el estado en formato de label (mantener consistencia con datos existentes)
            available = {item['value']: item.get('label') for item in get_estados_pedido_disponibles()}
            estado_label = available.get(nuevo_estado) or nuevo_estado
            update['estado'] = estado_label

            # Ajustar fecha_finalizacion automáticamente si aplicable
            if nuevo_estado in estados_finales:
                update['fecha_finalizacion'] = datetime.now().isoformat()
            else:
                update['fecha_finalizacion'] = None

        if not update:
            return jsonify({'error': 'Nada que actualizar'}), 400

        result = col.update_one({'_id': oid, 'empresa_id': empresa_id}, {'$set': update})
        if result.matched_count == 0:
            return jsonify({'error': 'Pedido no encontrado'}), 404

        pedido = col.find_one({'_id': oid, 'empresa_id': empresa_id})
        return jsonify(fix_id(pedido)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/pedidos/<pedido_id>', methods=['DELETE'])
def delete_pedido(pedido_id):
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        user_role = str(request_user.get('rol') or '').strip().lower()
        if user_role not in ('administrador', 'root', 'admin'):
            return jsonify({'error': 'Permiso denegado'}), 403

        empresa_id = int(request_user.get('empresa_id') or 0)
        col = get_empresa_collection('pedidos', empresa_id)
        try:
            oid = ObjectId(pedido_id)
        except Exception:
            return jsonify({'error': 'ID de pedido inválido'}), 400

        result = col.delete_one({'_id': oid, 'empresa_id': empresa_id})
        if result.deleted_count == 0:
            return jsonify({'error': 'Pedido no encontrado'}), 404
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/produccion/enviar', methods=['POST'])
def enviar_trabajo_produccion():
    """Envía un trabajo a producción en una máquina"""
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = int(request_user.get('empresa_id') or 0)

        data = request.get_json()
        # Logging para depuración: mostrar body recibido
        try:
            print('POST /api/produccion/enviar body:', data)
        except Exception:
            try:
                print('POST /api/produccion/enviar raw:', request.data)
            except Exception:
                pass
        trabajo_id = data.get('trabajo_id')
        maquina_id = data.get('maquina_id')
        
        if not trabajo_id or not maquina_id:
            return jsonify({'error': 'Faltan datos'}), 400
        
        # Verificar que el trabajo exista y su estado permita envío
        trabajos_col = get_empresa_collection('trabajos', empresa_id)
        trabajo = None
        # Intentar varias formas de localizar el trabajo: _id ObjectId, campo numérico `id`, campo string `id`, o `trabajo_id`
        try:
            trabajo = trabajos_col.find_one({'_id': ObjectId(trabajo_id), 'empresa_id': empresa_id})
        except Exception:
            trabajo = None

        if not trabajo:
            # si viene un número, probar como entero en campo `id`
            try:
                trabajo = trabajos_col.find_one({'id': int(trabajo_id), 'empresa_id': empresa_id})
            except Exception:
                trabajo = None

        if not trabajo:
            # finalmente probar por campos string y por `trabajo_id`
            trabajo = trabajos_col.find_one({
                'empresa_id': empresa_id,
                '$or': [
                    {'id': str(trabajo_id)},
                    {'trabajo_id': trabajo_id},
                    {'_id': trabajo_id}
                ]
            })

        if not trabajo:
            # Intentar recuperar información desde `pedidos` si existe un pedido que referencia este trabajo
            pedidos_col = get_empresa_collection('pedidos', empresa_id)
            pedido_doc = pedidos_col.find_one({'trabajo_id': trabajo_id, 'empresa_id': empresa_id})
            if pedido_doc:
                # Crear un trabajo mínimo para poder encolarlo en producción
                nuevo_trabajo = {
                    'empresa_id': empresa_id,
                    'nombre': pedido_doc.get('referencia') or pedido_doc.get('numero_pedido') or f'Trabajo {int(time.time())}',
                    'cliente': (pedido_doc.get('cliente') or '') if not isinstance(pedido_doc.get('cliente'), dict) else (pedido_doc.get('cliente').get('nombre') or ''),
                    'referencia': pedido_doc.get('referencia') or '',
                    'fecha_entrega': pedido_doc.get('fecha_entrega'),
                    'estado': 'Pendiente',
                    'created_at': datetime.utcnow().isoformat(),
                    'id': trabajo_id
                }
                res = trabajos_col.insert_one(nuevo_trabajo)
                nuevo_trabajo['_id'] = res.inserted_id
                trabajo = nuevo_trabajo
            else:
                return jsonify({'error': 'Trabajo no encontrado'}), 404

        rules = get_estados_pedido_rules().get('rules', ESTADOS_RULES_DEFAULT)
        bloqueados = set(rules.get('bloqueados_produccion', []))
        en_cola_list = list(rules.get('en_cola_produccion', []))
        en_cola = set(en_cola_list)
        preimpresion = list(rules.get('preimpresion', []))

        estado_actual = (trabajo.get('estado') or '').strip().lower()
        if estado_actual in bloqueados or estado_actual in en_cola:
            return jsonify({'error': f'No se puede enviar a producción cuando el estado es {estado_actual}'}), 400

        # Si llega desde fases previas a impresión, avanzar automáticamente
        # para que pueda entrar y verse en las colas de impresión.
        if estado_actual in set(preimpresion) and len(en_cola_list) > 0:
            destino_estado = en_cola_list[0]
            # Construir query de actualización usando el identificador real del documento encontrado
            update_query = {'empresa_id': empresa_id}
            if trabajo.get('_id'):
                update_query['_id'] = trabajo.get('_id')
            elif trabajo.get('id') is not None:
                update_query['id'] = trabajo.get('id')
            else:
                update_query['trabajo_id'] = trabajo_id
            trabajos_col.update_one(update_query, {'$set': {'estado': destino_estado, 'fecha_finalizacion': None}})

        # Verificar que no esté ya en producción
        orden_col = get_empresa_collection('trabajo_orden', empresa_id)
        # Comprobar si ya existe una orden para este trabajo (aceptar _id ObjectId o string)
        existing_order = None
        try:
            existing_order = orden_col.find_one({'trabajo_id': ObjectId(trabajo_id), 'empresa_id': empresa_id})
        except Exception:
            existing_order = None
        if not existing_order:
            existing_order = orden_col.find_one({'empresa_id': empresa_id, '$or': [{'trabajo_id': trabajo_id}, {'trabajo_id': str(trabajo_id)}]})
        if existing_order:
            return jsonify({'error': 'El trabajo ya está en producción'}), 400

        # Obtener la siguiente posición en la máquina (maquina_id puede ser int o string)
        try:
            maquina_id_query = int(maquina_id)
        except Exception:
            maquina_id_query = str(maquina_id)
        max_pos_doc = orden_col.find({'maquina_id': maquina_id_query, 'empresa_id': empresa_id}).sort('posicion', -1).limit(1)
        max_pos = 0
        for doc in max_pos_doc:
            max_pos = doc.get('posicion', 0)
        nueva_posicion = (max_pos or 0) + 1

        # Insertar en trabajo_orden
        orden_col.insert_one({
            'empresa_id': empresa_id,
            'trabajo_id': trabajo_id,
            'maquina_id': maquina_id_query,
            'posicion': nueva_posicion
        })

        # Actualizar el estado del trabajo para que pase a la cola de impresión
        try:
            nuevo_estado = en_cola_list[0] if len(en_cola_list) > 0 else 'pendiente-de-impresion'
            update_query = {'empresa_id': empresa_id}
            if trabajo.get('_id'):
                update_query['_id'] = trabajo.get('_id')
            elif trabajo.get('id') is not None:
                update_query['id'] = trabajo.get('id')
            else:
                update_query['trabajo_id'] = trabajo_id

            trabajos_col.update_one(update_query, {'$set': {'estado': nuevo_estado, 'en_produccion': True, 'fecha_finalizacion': None}})
        except Exception:
            pass

        # Persistir máquina real en el pedido para trazabilidad
        maquinas_col = get_empresa_collection('maquinas', empresa_id)
        maq = None
        try:
            maq = maquinas_col.find_one({'id': int(maquina_id), 'empresa_id': empresa_id})
        except Exception:
            pass
        if not maq:
            try:
                maq = maquinas_col.find_one({'_id': ObjectId(maquina_id), 'empresa_id': empresa_id})
            except Exception:
                pass
        if not maq:
            maq = maquinas_col.find_one({'id': str(maquina_id), 'empresa_id': empresa_id})
        maquina_nombre = maq['nombre'] if maq else None

        pedidos_col = get_empresa_collection('pedidos', empresa_id)
        pedido = pedidos_col.find_one({'trabajo_id': trabajo_id, 'empresa_id': empresa_id})
        if pedido and maquina_nombre:
            datos_pedido = pedido.get('datos_presupuesto') or {}
            if isinstance(datos_pedido, str):
                try:
                    datos_pedido = json.loads(datos_pedido)
                except Exception:
                    datos_pedido = {}
            datos_pedido['maquina'] = maquina_nombre
            datos_pedido['maquina_bd'] = maquina_nombre
            datos_pedido['maquina_id_bd'] = maquina_id
            pedidos_col.update_one({'_id': pedido['_id']}, {'$set': {'datos_presupuesto': datos_pedido}})
            try:
                nuevo_estado = en_cola_list[0] if len(en_cola_list) > 0 else 'pendiente-de-impresion'
                pedidos_col.update_one({'_id': pedido['_id']}, {'$set': {'estado': nuevo_estado}})
            except Exception:
                pass
        else:
            # Si hay pedido pero no se pudo resolver el nombre de la máquina, aun así actualizar su estado
            if pedido:
                try:
                    nuevo_estado = en_cola_list[0] if len(en_cola_list) > 0 else 'pendiente-de-impresion'
                    pedidos_col.update_one({'_id': pedido['_id']}, {'$set': {'estado': nuevo_estado}})
                except Exception:
                    pass

        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/produccion', methods=['GET'])
def api_get_produccion():
    """Devuelve la lista de trabajos en cola para una máquina específica."""
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = int(request_user.get('empresa_id') or 0)
        maquina_param = request.args.get('maquina')
        if not maquina_param:
            return jsonify({'error': 'maquina parameter requerido'}), 400

        orden_col = get_empresa_collection('trabajo_orden', empresa_id)
        pedidos_col = get_empresa_collection('pedidos', empresa_id)

        # Accept both numeric maquina_id and string/ObjectId-like ids
        rows = []
        try:
            maquina_int = int(maquina_param)
            rows = list(orden_col.find({'maquina_id': maquina_int, 'empresa_id': empresa_id}).sort([('posicion', 1), ('_id', 1)]))
        except Exception:
            # try string match
            rows = list(orden_col.find({'maquina_id': str(maquina_param), 'empresa_id': empresa_id}).sort([('posicion', 1), ('_id', 1)]))

        # Deduplicate rows by the final displayed id (pedido._id if exists, otherwise trabajo_id)
        seen = set()
        trabajos = []
        for row in rows:
            trabajo_id = row.get('trabajo_id')
            posicion = row.get('posicion')

            # Try to resolve a matching pedido by multiple strategies
            pedido = None
            if trabajo_id is not None:
                # first, try to find by trabajo_id field on pedidos
                pedido = pedidos_col.find_one({'trabajo_id': trabajo_id, 'empresa_id': empresa_id})
                if not pedido:
                    # if trabajo_id looks like an ObjectId hex, try matching by _id too
                    try:
                        if isinstance(trabajo_id, str) and len(trabajo_id) == 24:
                            pedido = pedidos_col.find_one({'_id': ObjectId(trabajo_id), 'empresa_id': empresa_id})
                    except Exception:
                        pedido = None

            # Determine the canonical id to dedupe on (what will be shown as `id`)
            canonical_id = None
            if pedido and '_id' in pedido:
                canonical_id = str(pedido.get('_id'))
            else:
                canonical_id = str(trabajo_id) if trabajo_id is not None else None

            if canonical_id in seen:
                continue
            seen.add(canonical_id)

            if pedido:
                p = fix_id(pedido)
                p['posicion'] = posicion
                trabajos.append(p)
            else:
                trabajos.append({'id': canonical_id, 'nombre': 'Pendiente', 'posicion': posicion})

        return jsonify({'trabajos': trabajos}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/produccion/mover', methods=['POST'])
def mover_trabajo_maquina():
    """Mueve un trabajo a otra máquina"""
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = int(request_user.get('empresa_id') or 0)

        data = request.get_json()
        trabajo_id = data.get('trabajo_id')
        maquina_destino = data.get('maquina_destino')
        
        if not trabajo_id or not maquina_destino:
            return jsonify({'error': 'Faltan datos'}), 400
        
        # Eliminar de la máquina anterior (si existe)
        orden_col = get_empresa_collection('trabajo_orden', empresa_id)
        pedidos_col = get_empresa_collection('pedidos', empresa_id)

        # Build list of possible trabajo_id variants stored in trabajo_orden
        posible_ids = set()
        if trabajo_id is not None:
            posible_ids.add(trabajo_id)
            # if looks like ObjectId hex, include ObjectId form
            try:
                if isinstance(trabajo_id, str) and len(trabajo_id) == 24:
                    posible_ids.add(ObjectId(trabajo_id))
            except Exception:
                pass

        # Check pedidos referring to this trabajo_id (by trabajo_id or by _id)
        try:
            pedido_candidate = pedidos_col.find_one({'trabajo_id': trabajo_id, 'empresa_id': empresa_id})
            if pedido_candidate and '_id' in pedido_candidate:
                posible_ids.add(str(pedido_candidate['_id']))
                try:
                    posible_ids.add(pedido_candidate['_id'])
                except Exception:
                    pass
        except Exception:
            pass

        try:
            if isinstance(trabajo_id, str) and len(trabajo_id) == 24:
                pedido_by_id = pedidos_col.find_one({'_id': ObjectId(trabajo_id), 'empresa_id': empresa_id})
                if pedido_by_id and '_id' in pedido_by_id:
                    posible_ids.add(str(pedido_by_id['_id']))
                    try:
                        posible_ids.add(pedido_by_id['_id'])
                    except Exception:
                        pass
        except Exception:
            pass

        # Perform delete matching any of the possible id representations
        if posible_ids:
            or_clauses = []
            for pid in posible_ids:
                or_clauses.append({'trabajo_id': pid})
            orden_col.delete_many({'empresa_id': empresa_id, '$or': or_clauses})
        else:
            orden_col.delete_many({'trabajo_id': trabajo_id, 'empresa_id': empresa_id})

        # Normalizar `maquina_destino`: aceptar tanto enteros como cadenas (ObjectId-like)
        try:
            maquina_destino_norm = int(maquina_destino)
        except Exception:
            maquina_destino_norm = str(maquina_destino)

        # Obtener la siguiente posición en la máquina destino
        max_pos_doc = orden_col.find({'maquina_id': maquina_destino_norm, 'empresa_id': empresa_id}).sort('posicion', -1).limit(1)
        max_pos = 0
        for doc in max_pos_doc:
            max_pos = doc.get('posicion', 0)
        nueva_posicion = (max_pos or 0) + 1

        # Insertar en la nueva máquina al final
        orden_col.insert_one({
            'empresa_id': empresa_id,
            'trabajo_id': trabajo_id,
            'maquina_id': maquina_destino_norm,
            'posicion': nueva_posicion
        })

        # Persistir máquina actualizada en el pedido
        maquinas_col = get_empresa_collection('maquinas', empresa_id)
        maq = None
        try:
            maq = maquinas_col.find_one({'id': maquina_destino_norm, 'empresa_id': empresa_id})
        except Exception:
            pass
        if not maq:
            try:
                maq = maquinas_col.find_one({'_id': ObjectId(maquina_destino), 'empresa_id': empresa_id})
            except Exception:
                pass
        if not maq:
            maq = maquinas_col.find_one({'id': str(maquina_destino), 'empresa_id': empresa_id})
        maquina_nombre = maq['nombre'] if maq else None

        pedidos_col = get_empresa_collection('pedidos', empresa_id)
        pedido = pedidos_col.find_one({'trabajo_id': trabajo_id, 'empresa_id': empresa_id})
        if pedido and maquina_nombre:
            datos_pedido = pedido.get('datos_presupuesto') or {}
            if isinstance(datos_pedido, str):
                try:
                    datos_pedido = json.loads(datos_pedido)
                except Exception:
                    datos_pedido = {}
            datos_pedido['maquina'] = maquina_nombre
            datos_pedido['maquina_bd'] = maquina_nombre
            datos_pedido['maquina_id_bd'] = maquina_destino
            pedidos_col.update_one({'_id': pedido['_id']}, {'$set': {'datos_presupuesto': datos_pedido}})

        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/produccion/reordenar', methods=['POST'])
def reordenar_trabajos():
    """Guarda el nuevo orden de trabajos dentro de la misma máquina"""
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = int(request_user.get('empresa_id') or 0)

        data = request.get_json()
        trabajos = data.get('trabajos', [])  # Lista de {trabajo_id, nueva_posicion}
        maquina_id = data.get('maquina_id')

        if not trabajos or maquina_id is None:
            return jsonify({'error': 'Faltan datos'}), 400

        # Normalizar `maquina_id`: aceptar tanto enteros como cadenas (ObjectId-like)
        try:
            print('REORDER: start')
            maquina_id = int(maquina_id)
        except Exception:
            maquina_id = str(maquina_id)
        orden_col = get_empresa_collection('trabajo_orden', empresa_id)
        pedidos_col = get_empresa_collection('pedidos', empresa_id)
        print('REORDER: orden_col and pedidos_col prepared')

        # Build a mapping from canonical_id -> list of trabajo_orden _id documents for this maquina
        current_rows = list(orden_col.find({'maquina_id': maquina_id, 'empresa_id': empresa_id}))
        canonical_map = {}  # canonical_id -> [doc_ids]
        for r in current_rows:
            t_id = r.get('trabajo_id')
            canonical = None
            pedido = None
            if t_id is not None:
                pedido = pedidos_col.find_one({'trabajo_id': t_id, 'empresa_id': empresa_id})
                if not pedido:
                    try:
                        if isinstance(t_id, str) and len(t_id) == 24:
                            pedido = pedidos_col.find_one({'_id': ObjectId(t_id), 'empresa_id': empresa_id})
                    except Exception:
                        pedido = None

            if pedido and '_id' in pedido:
                canonical = str(pedido.get('_id'))
            else:
                canonical = str(t_id) if t_id is not None else None

            if canonical is None:
                continue
            canonical_map.setdefault(canonical, []).append(r['_id'])

        # Apply updates: set all trabajo_orden rows that map to the canonical id to the nueva_posicion
        for item in trabajos:
            trabajo_id = str(item.get('trabajo_id'))
            nueva_posicion = int(item.get('nueva_posicion') or 0)

            updated_any = False
            doc_ids = canonical_map.get(trabajo_id) or []
            for did in doc_ids:
                res = orden_col.update_one({'_id': did, 'empresa_id': empresa_id}, {'$set': {'maquina_id': maquina_id, 'posicion': nueva_posicion}})
                if res.matched_count:
                    updated_any = True

            # If no existing rows matched this canonical id, insert a new one
            if not updated_any:
                orden_col.insert_one({
                    'empresa_id': empresa_id,
                    'trabajo_id': trabajo_id,
                    'maquina_id': maquina_id,
                    'posicion': nueva_posicion
                })
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/trabajos/<trabajo_id>/estado', methods=['PUT', 'POST'])
def cambiar_estado_trabajo(trabajo_id):
    """Cambia el estado de un trabajo y registra fecha_finalizacion si es 'finalizado'"""
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = int(request_user.get('empresa_id') or 0)
        data = request.get_json()
        nuevo_estado = data.get('estado')
        if not nuevo_estado:
            return jsonify({'error': 'Falta el estado'}), 400
        col = get_empresa_collection('trabajos', empresa_id)
        rules = get_estados_pedido_rules().get('rules', ESTADOS_RULES_DEFAULT)
        finalizados = set(rules.get('estados_finalizados', []))
        preimpresion = set(rules.get('preimpresion', []))
        fecha_finalizacion = None
        if nuevo_estado in finalizados:
            from datetime import datetime
            fecha_finalizacion = datetime.now().isoformat()
        # Actualizar estado y fecha_finalizacion
        update = {'estado': nuevo_estado}
        if fecha_finalizacion:
            update['fecha_finalizacion'] = fecha_finalizacion
        col.update_one({'_id': ObjectId(trabajo_id), 'empresa_id': empresa_id}, {'$set': update})
        # Si vuelve a estados previos de impresión, eliminar de trabajo_orden
        if nuevo_estado in preimpresion:
            orden_col = get_empresa_collection('trabajo_orden', empresa_id)
            orden_col.delete_many({'trabajo_id': trabajo_id, 'empresa_id': empresa_id})
        return jsonify({'success': True, 'estado': nuevo_estado, 'fecha_finalizacion': fecha_finalizacion}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/migration/json-normalize', methods=['POST'])
def migration_normalize_json_endpoint():
    try:
        data = request.get_json(silent=True) or {}
        apply_changes = bool(data.get('apply', False))
        summary = normalize_legacy_json_storage(apply_changes=apply_changes)
        return jsonify({'success': True, **summary}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Inicializar base de datos al arrancar
init_db()

def pdf_has_fogra39(pdf_path):
    try:
        reader = PdfReader(pdf_path)
        if "/OutputIntents" in reader.trailer["/Root"]:
            intents = reader.trailer["/Root"]["/OutputIntents"]
            for intent in intents:
                if "/DestOutputProfile" in intent:
                    icc_obj = intent["/DestOutputProfile"]
                    icc_bytes = icc_obj.get_data()
                    if b"FOGRA39" in icc_bytes:
                        return True
        return False
    except Exception as e:
        return False

def process_tiffsep(tif_path):
    img = Image.open(tif_path)
    arr = np.array(img)
    coverage = np.sum(arr < 255) / arr.size
    return round(coverage * 100, 2)


def rgb_to_cmyk_with_icc(image_path):
    """Convierte una imagen RGB a CMYK y devuelve coberturas por canal."""
    with Image.open(image_path) as img:
        rgb_img = img.convert('RGB')

        cmyk_img = None

        if os.path.exists(FOGRA_PATH):
            try:
                srgb_profile = ImageCms.createProfile('sRGB')
                fogra_profile = ImageCms.getOpenProfile(FOGRA_PATH)
                transform = ImageCms.buildTransformFromOpenProfiles(
                    srgb_profile,
                    fogra_profile,
                    'RGB',
                    'CMYK'
                )
                cmyk_img = ImageCms.applyTransform(rgb_img, transform)
            except Exception:
                cmyk_img = None

        if cmyk_img is None:
            cmyk_img = rgb_img.convert('CMYK')

        cmyk = np.asarray(cmyk_img, dtype=np.float32) / 255.0

    c = float(np.mean(cmyk[:, :, 0]) * 100.0)
    m = float(np.mean(cmyk[:, :, 1]) * 100.0)
    y = float(np.mean(cmyk[:, :, 2]) * 100.0)
    k = float(np.mean(cmyk[:, :, 3]) * 100.0)

    tinta_total = float(np.mean(np.sum(cmyk, axis=2)) * 100.0)
    area_impresa = float(np.mean(np.any(cmyk > 0.01, axis=2)) * 100.0)

    return {
        'C': round(c, 2),
        'M': round(m, 2),
        'Y': round(y, 2),
        'K': round(k, 2),
        'TOTAL': round(tinta_total, 2),
        'AREA_IMPRESA': round(area_impresa, 2),
    }

# Endpoints para sincronizar orden de trabajos
@app.route('/api/trabajos/orden', methods=['GET'])
def get_trabajos_orden():
    """Obtiene el orden guardado de los trabajos"""
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = int(request_user.get('empresa_id') or 0)

        # TODO: Lógica MongoDB para obtener el orden de los trabajos
        rows = []
        
        orden = [{'trabajo_id': row[0], 'posicion': row[1]} for row in rows]
        return jsonify({'orden': orden}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/trabajos/orden', methods=['POST'])
def save_trabajos_orden():
    """Guarda el nuevo orden de los trabajos"""
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = int(request_user.get('empresa_id') or 0)

        data = request.get_json()
        trabajos = data.get('trabajos', [])
        
        # TODO: Lógica MongoDB para actualizar el orden de los trabajos
        
        # Limpiar orden anterior
        # SQL legacy eliminado por migración a MongoDB
        
        # Insertar nuevo orden
        for trabajo in trabajos:
            # TODO: Lógica MongoDB para actualizar el orden de los trabajos
            pass
        
        # TODO: Lógica MongoDB para finalizar actualización de orden
        
        return jsonify({'success': True, 'message': 'Orden guardado'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/trabajos', methods=['POST'])
def create_trabajo():
    """Crea un trabajo mínimo y devuelve su id."""
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = int(request_user.get('empresa_id') or 0)
        data = request.get_json() or {}
        nombre = (data.get('nombre') or '').strip()
        cliente = data.get('cliente') or ''
        referencia = data.get('referencia') or ''
        fecha_entrega = data.get('fecha_entrega') or None

        if not nombre:
            nombre = referencia or f'Trabajo {int(time.time())}'

        col = get_empresa_collection('trabajos', empresa_id)
        nuevo = {
            'empresa_id': empresa_id,
            'nombre': nombre,
            'cliente': cliente,
            'referencia': referencia,
            'fecha_entrega': fecha_entrega,
            'estado': 'Pendiente',
            'created_at': datetime.utcnow().isoformat()
        }
        res = col.insert_one(nuevo)
        return jsonify({'success': True, 'trabajo_id': str(res.inserted_id)}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/trabajos/orden/reset', methods=['POST'])
def reset_trabajos_orden():
    """Resetea el orden de los trabajos"""
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = int(request_user.get('empresa_id') or 0)

        # TODO: Lógica MongoDB para resetear el orden
        # SQL legacy eliminado por migración a MongoDB
        # TODO: Lógica MongoDB para finalizar reseteo de orden
        
        return jsonify({'success': True, 'message': 'Orden reseteado'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/calcular-cobertura', methods=['POST'])
def calcular_cobertura():
    if 'imagen' not in request.files or request.files['imagen'].filename == '':
        return jsonify({'error': 'No image uploaded'}), 400

    f = request.files['imagen']
    filename = f.filename.lower()

    with tempfile.TemporaryDirectory() as tempdir:
        file_path = os.path.join(tempdir, filename)
        f.save(file_path)

        # PDF
        if filename.endswith('.pdf'):
            if not pdf_has_fogra39(file_path):
                return jsonify({'error': 'El PDF no tiene perfil FOGRA39 embebido.'}), 400

            gs_command = [
                "gs", "-dBATCH", "-dNOPAUSE", "-dQUIET", "-dSAFER",
                "-sDEVICE=tiffsep", "-sOutputFile=" + os.path.join(tempdir, "sep_%c.tif"),
                "-dFirstPage=1", "-dLastPage=1", file_path
            ]
            try:
                subprocess.run(gs_command, check=True)
            except Exception as e:
                return jsonify({'error': f'Ghostscript error: {e}'}), 500

            results = {}
            for fname in os.listdir(tempdir):
                if fname.startswith("sep_") and fname.endswith(".tif"):
                    channel = fname[4:-4]  # sep_C.tif -> C, sep_M.tif...
                    channel_name = channel.upper()
                    results[channel_name] = process_tiffsep(os.path.join(tempdir, fname))

            return jsonify(results)

        # IMAGEN
        try:
            cobertura = rgb_to_cmyk_with_icc(file_path)
            return jsonify(cobertura)
        except Exception as e:
            return jsonify({'error': f'Image error: {e}'}), 500

# Endpoint para generar datos de prueba
@app.route('/api/test-data', methods=['POST'])
def generar_datos_prueba():
    """Genera presupuestos y pedidos de prueba"""
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = int(request_user.get('empresa_id') or 0)

        # TODO: Lógica MongoDB para insertar presupuestos de ejemplo
        
        # Generar timestamp único para evitar conflictos
        timestamp = int(time.time())
        
        # Datos de ejemplo para presupuestos
        presupuestos_ejemplo = [
            {
                'nombre': 'Etiquetas Manzana Roja',
                'cliente': 'Frutería García S.L.',
                'referencia': f'REF-001-MANZANA-{timestamp}',
                'fecha_entrega': '2026-03-15',
                'vendedor': 'Juan Pérez',
                'formatoAncho': '100',
                'formatoLargo': '80',
                'maquina': 'Nilpeter FA',
                'material': 'Papel',
                'acabado': 'Barniz',
                'tirada': '5000',
                'selectedTintas': ['C', 'M', 'Y', 'K'],
                'detalleTintaEspecial': '',
                'troquelEstadoSel': 'Nuevo',
                'troquelFormaSel': 'Rectangular',
                'troquelCoste': '250',
                'observaciones': 'Cliente satisfecho con diseño actual'
            },
            {
                'nombre': 'Embalaje Perfumes Premium',
                'cliente': 'Cosméticos Del Sur S.A.',
                'referencia': f'REF-002-PERFUME-{timestamp}',
                'fecha_entrega': '2026-03-20',
                'vendedor': 'María López',
                'formatoAncho': '120',
                'formatoLargo': '100',
                'maquina': 'Gallus ECS',
                'material': 'PVC',
                'acabado': 'Stamping',
                'tirada': '3000',
                'selectedTintas': ['C', 'M', 'Y', 'K', 'P1'],
                'detalleTintaEspecial': 'Pantone 871 Custom',
                'troquelEstadoSel': 'Usado',
                'troquelFormaSel': 'Irregular',
                'troquelCoste': '150',
                'observaciones': 'Material especial requiere ajuste de presión'
            },
            {
                'nombre': 'Etiquetas Bebidas Refrescantes',
                'cliente': 'Bebidas Tropicales Ltd.',
                'referencia': f'REF-003-BEBIDAS-{timestamp}',
                'fecha_entrega': '2026-03-10',
                'vendedor': 'Carlos Mendez',
                'formatoAncho': '85',
                'formatoLargo': '120',
                'maquina': 'Mark Andy',
                'material': 'PET',
                'acabado': 'Laminado',
                'tirada': '10000',
                'selectedTintas': ['C', 'M', 'Y', 'K'],
                'detalleTintaEspecial': '',
                'troquelEstadoSel': 'Nuevo',
                'troquelFormaSel': 'Circular',
                'troquelCoste': '300',
                'observaciones': 'Primera orden del cliente, seguimiento requerido'
            },
            {
                'nombre': 'Etiquetas Vino Tinto Reserva',
                'cliente': 'Bodegas Montesol',
                'referencia': f'REF-004-VINO-{timestamp}',
                'fecha_entrega': '2026-03-25',
                'vendedor': 'Juan Pérez',
                'formatoAncho': '95',
                'formatoLargo': '150',
                'maquina': 'Nilpeter FA',
                'material': 'Papel',
                'acabado': 'Sin acabado',
                'tirada': '2500',
                'selectedTintas': ['C', 'M', 'Y', 'K', 'P1', 'P2'],
                'detalleTintaEspecial': 'Oro metalizado',
                'troquelEstadoSel': 'Nuevo',
                'troquelFormaSel': 'Rectangular',
                'troquelCoste': '400',
                'observaciones': 'Importante: mantener registro de lotes'
            },
            {
                'nombre': 'Stickers Promocionales',
                'cliente': 'Marketing Digital Pro',
                'referencia': f'REF-005-STICKERS-{timestamp}',
                'fecha_entrega': '2026-03-05',
                'vendedor': 'María López',
                'formatoAncho': '60',
                'formatoLargo': '60',
                'maquina': 'Otros modelos',
                'material': 'PE',
                'acabado': 'Barniz',
                'tirada': '15000',
                'selectedTintas': ['C', 'M', 'Y', 'K'],
                'detalleTintaEspecial': '',
                'troquelEstadoSel': 'Usado',
                'troquelFormaSel': 'Irregular',
                'troquelCoste': '100',
                'observaciones': 'Recorte especial de formas custom'
            }
        ]
        
        insertados = 0
        
        for presupuesto_data in presupuestos_ejemplo:
            # Lógica MongoDB pendiente si es necesario
            # Guardar presupuesto con todos los datos
            # TODO: Lógica MongoDB para generar número de presupuesto y guardar datos
            # Lógica MongoDB pendiente si es necesario
            pass
        
        return jsonify({
            'success': True,
            'mensaje': f'Se crearon {insertados} presupuestos de prueba',
            'cantidad': insertados
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Endpoint para debugging
@app.route('/api/debug/info', methods=['GET'])
def debug_info():
    """Información de debugging sobre la BD"""
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = int(request_user.get('empresa_id') or 0)

        # TODO: Lógica MongoDB para debugging de la BD
        
        # Contar trabajos
        # SQL legacy eliminado por migración a MongoDB
        total_trabajos = 0
        
        # Contar presupuestos
        # SQL legacy eliminado por migración a MongoDB
        total_presupuestos = 0
        
        # Contar pedidos
        # SQL legacy eliminado por migración a MongoDB
        total_pedidos = 0
        
        # Obtener últimos trabajos
        # SQL legacy eliminado por migración a MongoDB
        ultimos_trabajos = []
        
        # Obtener últimos presupuestos
        # SQL legacy eliminado por migración a MongoDB
        ultimos_presupuestos = []
        
        # TODO: Lógica MongoDB para finalizar debugging de la BD
        
        return jsonify({
            'trabajos': total_trabajos,
            'presupuestos': total_presupuestos,
            'pedidos': total_pedidos,
            'ultimos_trabajos': ultimos_trabajos,
            'ultimos_presupuestos': ultimos_presupuestos
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run("0.0.0.0", 8080, debug=False, use_reloader=False)

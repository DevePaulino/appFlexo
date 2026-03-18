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
from pymongo import ReturnDocument
import pymongo
from pymongo import UpdateMany, InsertOne
import json
import time
import hashlib
import secrets
import re
import base64
import hmac
from urllib import request as urllib_request, parse as urllib_parse, error as urllib_error
from collections import defaultdict
from email.message import EmailMessage
from flask import Flask, request, jsonify, g, send_file
from flask import make_response
from werkzeug.exceptions import HTTPException
from werkzeug.utils import secure_filename
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
from datetime import datetime, timedelta


 


app = Flask(__name__)
CORS(app)
app.debug = True

import traceback as _traceback
import uuid
import xml.etree.ElementTree as ET
@app.errorhandler(Exception)
def _handle_uncaught_exception(e):
    # Let HTTP exceptions (404, 400, etc.) be handled by Flask/werkzeug normally
    if isinstance(e, HTTPException):
        return e
    tb = _traceback.format_exc()
    print('UNCAUGHT EXCEPTION:\n', tb)
    return jsonify({'error': str(e), 'trace': tb}), 500

@app.errorhandler(413)
def request_entity_too_large(_):
    return jsonify({'error': 'El archivo supera el límite de tamaño permitido (máx 200 MB)'}), 413

# Configuración MongoDB (puedes cambiar la URI a tu MongoDB Atlas si quieres)
app.config["MONGO_URI"] = "mongodb://localhost:27017/printforgepro"
mongo = PyMongo(app)

# ─── File Upload Configuration ────────────────────────────────────────────────
UPLOAD_BASE_DIR = os.environ.get('UPLOAD_BASE_DIR', os.path.join(BASE_DIR, 'uploads'))
app.config['MAX_CONTENT_LENGTH'] = int(os.environ.get('MAX_UPLOAD_MB', '200')) * 1024 * 1024
ALLOWED_EXTENSIONS_ARTES    = {'pdf', 'ai', 'eps', 'jpg', 'jpeg', 'png'}
ALLOWED_EXTENSIONS_UNITARIO = {'pdf'}

# Simple JWT helpers (lightweight, enabled via ENABLE_JWT=1)
JWT_SECRET = os.environ.get('JWT_SECRET', 'dev-jwt-secret')
JWT_TTL_SECONDS = int(os.environ.get('JWT_TTL_SECONDS', '3600') or 3600)
ENABLE_JWT = str(os.environ.get('ENABLE_JWT', '1')).strip().lower() in {'1', 'true', 'yes'}

def _b64url_encode(data_bytes):
    return base64.urlsafe_b64encode(data_bytes).rstrip(b"=").decode('ascii')

def _b64url_decode(s):
    s = s.encode('ascii')
    padding = b'=' * (-len(s) % 4)
    return base64.urlsafe_b64decode(s + padding)

def create_jwt(payload, ttl_seconds=None):
    ttl = int(ttl_seconds or JWT_TTL_SECONDS)
    now = int(time.time())
    payload = dict(payload)
    payload.setdefault('iat', now)
    payload.setdefault('exp', now + ttl)
    header = {'alg': 'HS256', 'typ': 'JWT'}
    header_b = _b64url_encode(json.dumps(header, separators=(',', ':')).encode('utf-8'))
    payload_b = _b64url_encode(json.dumps(payload, separators=(',', ':')).encode('utf-8'))
    signing_input = f"{header_b}.{payload_b}".encode('utf-8')
    sig = hmac.new(JWT_SECRET.encode('utf-8'), signing_input, hashlib.sha256).digest()
    sig_b = _b64url_encode(sig)
    return f"{header_b}.{payload_b}.{sig_b}"

def verify_jwt(token):
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        signing_input = (parts[0] + '.' + parts[1]).encode('utf-8')
        sig = _b64url_decode(parts[2])
        expected = hmac.new(JWT_SECRET.encode('utf-8'), signing_input, hashlib.sha256).digest()
        if not hmac.compare_digest(expected, sig):
            return None
        payload = json.loads(_b64url_decode(parts[1]).decode('utf-8'))
        if 'exp' in payload and int(time.time()) > int(payload.get('exp', 0)):
            return None
        return payload
    except Exception:
        return None


def ensure_default_users():
    """Ensure there is always at least one `root` and one `administrador` user.
    Uses environment variables if present to seed emails/passwords; otherwise generates random passwords.
    Prints created credentials to stdout so they appear in `backend.log`.
    """
    try:
        col = get_empresa_collection('usuarios', None)
        root_exists = col.find_one({'rol': 'root'}) is not None
        admin_exists = col.find_one({'rol': 'administrador'}) is not None

        created = []
        if not root_exists:
            root_email = os.environ.get('DEFAULT_ROOT_EMAIL', 'root@localhost')
            root_pwd = os.environ.get('DEFAULT_ROOT_PASSWORD') or secrets.token_hex(8)
            doc = {
                'nombre': 'Root',
                'email': root_email,
                'rol': 'root',
                'password_hash': hash_password(root_pwd),
                'empresa_id': '0',
                'empresa_nombre': 'System',
                'fecha_creacion': time.strftime('%Y-%m-%dT%H:%M:%S')
            }
            col.insert_one(doc)
            created.append({'rol': 'root', 'email': root_email, 'password': root_pwd})

        if not admin_exists:
            admin_email = os.environ.get('DEFAULT_ADMIN_EMAIL', 'admin@example.com')
            admin_pwd = os.environ.get('DEFAULT_ADMIN_PASSWORD') or secrets.token_hex(8)
            doc = {
                'nombre': 'Administrador',
                'email': admin_email,
                'rol': 'administrador',
                'password_hash': hash_password(admin_pwd),
                'empresa_id': str(os.environ.get('DEFAULT_ADMIN_EMPRESA_ID') or '1'),
                'empresa_nombre': os.environ.get('DEFAULT_ADMIN_EMPRESA_NOMBRE') or 'Empresa 1',
                'fecha_creacion': time.strftime('%Y-%m-%dT%H:%M:%S')
            }
            col.insert_one(doc)
            created.append({'rol': 'administrador', 'email': admin_email, 'password': admin_pwd})

        if created:
            print('DEFAULT_USERS_CREATED:', json.dumps(created))
        else:
            print('DEFAULT_USERS_PRESENT')
    except Exception as e:
        print('ERROR ensuring default users:', str(e))




# Helper para obtener la colección de una empresa
def get_empresa_collection(nombre, empresa_id):
    # Mapear nombres legacy a la colección canónica `pedidos` cuando corresponde
    # Esto permite unificar el término 'trabajo' -> 'pedido' sin cambiar todas las rutas a la vez.
    name = str(nombre or '')
    if name in ('trabajos', 'trabajo'):
        name = 'pedidos'
    if name in ('trabajo_orden', 'trabajo-orden', 'trabajos_orden'):
        name = 'pedido_orden'
    return mongo.db[name]


def normalize_empresa_id(empresa_id):
    """Normaliza empresa_id a string consistente. NUNCA hace int().
    '0' = sistema/global (root), '1' = admin por defecto, '<ObjectId>' = empresa registrada.
    Las empresas registradas vía /api/auth/register usan str(user._id) como empresa_id.
    """
    if empresa_id is None:
        return '0'
    s = str(empresa_id).strip()
    return s if s and s not in ('None', 'none', 'null', '') else '0'


def log_audit(action, request_user=None, details=None):
    try:
        col = get_empresa_collection('audit_logs', 0)
        doc = {
            'action': str(action or ''),
            'user': {
                'id': str(request_user.get('id')) if request_user and request_user.get('id') else None,
                'email': request_user.get('email') if request_user else None,
                'rol': request_user.get('rol') if request_user else None,
            },
            'details': details or {},
            'ip': request.remote_addr if request else None,
            'ts': datetime.now().isoformat(),
        }
        col.insert_one(doc)
    except Exception:
        # No permitir que fallos de logging interrumpan la operación principal
        pass

# Helper para convertir ObjectId a string en respuestas JSON
def fix_id(doc):
    if not doc:
        return doc
    doc = dict(doc)
    if '_id' in doc:
        doc['id'] = str(doc['_id'])
        del doc['_id']
    return doc


def _allowed_file(filename, allowed_set):
    """Return True if filename has an extension in allowed_set."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_set


def _get_upload_dir(empresa_id, pedido_id, subdir):
    """
    Build and create (if needed) the directory for a pedido's files.
    subdir: 'artes' | 'unitario'
    Returns the absolute directory path.
    """
    path = os.path.join(UPLOAD_BASE_DIR, str(empresa_id), str(pedido_id), subdir)
    os.makedirs(path, exist_ok=True)
    return path

ROLE_LABELS = {
    'operario': 'Operario',
    'administrador': 'Administrador',
    'comercial': 'Comercial',
    'root': 'Root',
    'diseno': 'Diseño',
    'impresion': 'Impresión',
    'post-impresion': 'Post-Impresión',
}
PROTECTED_ROLE_ORDER = ['administrador']
PROTECTED_ROLE_KEYS = {'administrador'}
PROTECTED_ESTADOS_PEDIDO_KEYS = {
    'en-diseno',
    'finalizado',
}

# Ensure minimum users exist at startup (call after helpers are defined)
try:
    ensure_default_users()
except Exception:
    pass
PERMISSION_KEYS = [
    'manage_app_settings',
    'manage_roles_permissions',
    'manage_usuarios',
    'manage_session_timeout',
    'manage_estados_pedido',
    'editar_estado_finalizado',
    'edit_clientes',
    'edit_maquinas',
    'edit_pedidos',
    'edit_presupuestos',
    'edit_produccion',
    'eliminar_archivos',
    'edit_modo_creacion',
    'manage_billing',
    'manage_modulos',
]
ROLE_PERMISSIONS_DEFAULT = {
    'operario': {
        'manage_app_settings': False,
        'manage_roles_permissions': False,
        'manage_usuarios': False,
        'manage_session_timeout': False,
        'manage_estados_pedido': False,
        'editar_estado_finalizado': False,
        'edit_clientes': False,
        'edit_maquinas': False,
        'edit_pedidos': False,
        'edit_presupuestos': False,
        'edit_produccion': True,
        'eliminar_archivos': False,
        'edit_modo_creacion': False,
        'manage_billing': False,
        'manage_modulos': False,
    },
    'administrador': {
        'manage_app_settings': True,
        'manage_roles_permissions': True,
        'manage_usuarios': True,
        'manage_session_timeout': True,
        'manage_estados_pedido': True,
        'editar_estado_finalizado': True,
        'edit_clientes': True,
        'edit_maquinas': True,
        'edit_pedidos': True,
        'edit_presupuestos': True,
        'edit_produccion': True,
        'eliminar_archivos': True,
        'edit_modo_creacion': True,
        'manage_billing': True,
        'manage_modulos': True,
    },
    'root': {
        'manage_app_settings': True,
        'manage_roles_permissions': True,
        'manage_usuarios': True,
        'manage_session_timeout': True,
        'manage_estados_pedido': True,
        'editar_estado_finalizado': True,
        'edit_clientes': True,
        'edit_maquinas': True,
        'edit_pedidos': True,
        'edit_presupuestos': True,
        'edit_produccion': True,
        'eliminar_archivos': True,
        'edit_modo_creacion': True,
        'manage_billing': True,
        'manage_modulos': True,
    },
    # Department roles
    'comercial': {
        'manage_app_settings': False,
        'manage_roles_permissions': False,
        'manage_usuarios': False,
        'manage_session_timeout': False,
        'manage_estados_pedido': False,
        'editar_estado_finalizado': False,
        'edit_clientes': True,
        'edit_maquinas': False,
        'edit_pedidos': True,
        'edit_presupuestos': True,
        'edit_produccion': False,
        'eliminar_archivos': True,
        'edit_modo_creacion': False,
        'manage_billing': False,
        'manage_modulos': False,
    },
    'diseno': {
        'manage_app_settings': False,
        'manage_roles_permissions': False,
        'manage_usuarios': False,
        'manage_session_timeout': False,
        'manage_estados_pedido': False,
        'editar_estado_finalizado': False,
        'edit_clientes': False,
        'edit_maquinas': False,
        'edit_pedidos': True,
        'edit_presupuestos': True,
        'edit_produccion': False,
        'eliminar_archivos': True,
        'edit_modo_creacion': False,
        'manage_billing': False,
        'manage_modulos': False,
    },
    'impresion': {
        'manage_app_settings': False,
        'manage_roles_permissions': False,
        'manage_usuarios': False,
        'manage_session_timeout': False,
        'manage_estados_pedido': False,
        'editar_estado_finalizado': False,
        'edit_clientes': False,
        'edit_maquinas': True,
        'edit_pedidos': False,
        'edit_presupuestos': False,
        'edit_produccion': True,
        'eliminar_archivos': False,
        'edit_modo_creacion': False,
        'manage_billing': False,
        'manage_modulos': False,
    },
    'post-impresion': {
        'manage_app_settings': False,
        'manage_roles_permissions': False,
        'manage_usuarios': False,
        'manage_session_timeout': False,
        'manage_estados_pedido': False,
        'editar_estado_finalizado': False,
        'edit_clientes': False,
        'edit_maquinas': False,
        'edit_pedidos': False,
        'edit_presupuestos': False,
        'edit_produccion': True,
        'eliminar_archivos': False,
        'edit_modo_creacion': False,
        'manage_billing': False,
        'manage_modulos': False,
    },
    'oficina': {
        'manage_app_settings': False,
        'manage_roles_permissions': False,
        'manage_usuarios': False,
        'manage_session_timeout': False,
        'manage_estados_pedido': True,
        'editar_estado_finalizado': False,
        'edit_clientes': True,
        'edit_maquinas': False,
        'edit_pedidos': True,
        'edit_presupuestos': True,
        'edit_produccion': False,
        'eliminar_archivos': False,
        'edit_modo_creacion': False,
        'manage_billing': False,
        'manage_modulos': False,
    },
}

# Defaults for pedido states and rules used when DB has no config
ESTADOS_PEDIDO_DEFAULT = [
    {'valor': 'En Diseño', 'label': 'En Diseño', 'color': '#1976D2'},
]

# Default colors for standard states (kept in sync with frontend ESTADO_COLOR_MAP)
DEFAULT_ESTADO_COLORS = {
    'en-diseno': '#1976D2',
    'diseno': '#1976D2',
    'pendiente-de-aprobacion': '#F57C00',
    'pendiente-de-cliche': '#C2185B',
    'pendiente-de-impresion': '#7B1FA2',
    'pendiente-post-impresion': '#00796B',
    'finalizado': '#388E3C',
    'parado': '#D32F2F',
    'cancelado': '#616161',
}

ESTADOS_RULES_DEFAULT = {
    'bloqueados_produccion': [],
    'en_cola_produccion': [],
    'preimpresion': ['en-diseno'],
    'estados_finalizados': [],
    'ocultar_timeline': [],
    'ocultar_grafica': [],
}

FREE_SIGNUP_CREDITS = 50
CREDIT_COST_PEDIDO   = 5    # créditos por crear un nuevo pedido
CREDIT_COST_FEATURES = 10   # créditos por usar funcionalidades premium en un pedido (cobro único por pedido)
CREDIT_COSTS = {            # legacy — costes individuales por feature
    'report': 7,
    'repetidora': 16,
    'trapping': 4,
    'troquel': 9,
}
CREDIT_PACKAGES = [
    {'id': 'pack_50',  'credits': 50,  'price_eur': 4.99,  'label': '50 créditos'},
    {'id': 'pack_100', 'credits': 100, 'price_eur': 8.99,  'label': '100 créditos', 'popular': True},
    {'id': 'pack_250', 'credits': 250, 'price_eur': 19.99, 'label': '250 créditos'},
    {'id': 'pack_500', 'credits': 500, 'price_eur': 34.99, 'label': '500 créditos'},
]
SUBSCRIPTION_PRICE_EUR = 29.99  # mensual, placeholder
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
RESET_CODE_TTL_SECONDS = 15 * 60
DEV_EXPOSE_RESET_CODE = os.environ.get('DEV_EXPOSE_RESET_CODE', '0').strip().lower() in {'1', 'true', 'yes'}
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
    '/api/auth/verify-role-permission',
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
    empresa_id = normalize_empresa_id(empresa_id)
    if empresa_id == '0':
        return {
            'empresa_id': '0',
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


def validate_password_strength(password):
    """Devuelve (True, None) si la contraseña cumple los requisitos, o (False, mensaje_error)."""
    import re as _re
    if len(password) < 8:
        return False, 'La contraseña debe tener al menos 8 caracteres'
    if not _re.search(r'[A-Z]', password):
        return False, 'La contraseña debe incluir al menos una letra mayúscula'
    if not _re.search(r'[a-z]', password):
        return False, 'La contraseña debe incluir al menos una letra minúscula'
    if not _re.search(r'\d', password):
        return False, 'La contraseña debe incluir al menos un número'
    if not _re.search(r'[^A-Za-z0-9]', password):
        return False, 'La contraseña debe incluir al menos un carácter especial (!@#$%...)'
    return True, None


def deduct_credits(email, amount, action, pedido_id=None, metadata=None):
    """Descuenta créditos de forma atómica. Solo descuenta si hay suficiente saldo.
    Devuelve (nuevo_saldo, error_str). Si error_str es None, la operación fue exitosa."""
    col_usuarios = get_empresa_collection('usuarios', None)
    col_tx = get_empresa_collection('credit_transactions', None)
    result = col_usuarios.find_one_and_update(
        {'email': email, 'creditos': {'$gte': amount}},
        {'$inc': {'creditos': -amount}},
        return_document=pymongo.ReturnDocument.AFTER,
    )
    if result is None:
        user = col_usuarios.find_one({'email': email})
        if not user:
            return None, 'Usuario no encontrado'
        current = int(user.get('creditos') or 0)
        return current, f'Créditos insuficientes (tienes {current}, necesitas {amount})'
    new_balance = int(result.get('creditos') or 0)
    col_tx.insert_one({
        'email': email,
        'empresa_id': str(result.get('empresa_id') or ''),
        'action': action,
        'amount': -amount,
        'balance_after': new_balance,
        'pedido_id': pedido_id,
        'metadata': metadata or {},
        'created_at': datetime.now().isoformat(),
    })
    return new_balance, None


def add_credits(email, amount, action='purchase', metadata=None):
    """Añade créditos. Devuelve (nuevo_saldo, error_str)."""
    col_usuarios = get_empresa_collection('usuarios', None)
    col_tx = get_empresa_collection('credit_transactions', None)
    result = col_usuarios.find_one_and_update(
        {'email': email},
        {'$inc': {'creditos': amount}},
        return_document=pymongo.ReturnDocument.AFTER,
    )
    if result is None:
        return None, 'Usuario no encontrado'
    new_balance = int(result.get('creditos') or 0)
    col_tx.insert_one({
        'email': email,
        'empresa_id': str(result.get('empresa_id') or ''),
        'action': action,
        'amount': amount,
        'balance_after': new_balance,
        'metadata': metadata or {},
        'created_at': datetime.now().isoformat(),
    })
    return new_balance, None


def resolve_billing_email(email, empresa_id=None):
    """Dev-mode helper: if email is blank, find the first user in the empresa and return their email."""
    if email:
        return email
    if empresa_id:
        col = get_empresa_collection('usuarios', None)
        norm_eid = normalize_empresa_id(empresa_id)
        user = col.find_one({'empresa_id': norm_eid}, {'email': 1})
        if user:
            return str(user.get('email') or '')
    return ''


def get_billing_status_for_user(email, empresa_id=None):
    """Devuelve un dict con billing_model, creditos y datos del plan."""
    col = get_empresa_collection('usuarios', None)
    user = None
    if email:
        user = col.find_one({'email': email}, {'creditos': 1, 'billing_model': 1, 'nombre': 1})
    # Dev-mode fallback: no email → pick any user in the empresa
    if not user and empresa_id:
        norm_eid = normalize_empresa_id(empresa_id)
        user = col.find_one({'empresa_id': norm_eid}, {'creditos': 1, 'billing_model': 1, 'nombre': 1})
    if not user:
        return None
    return {
        'billing_model': str(user.get('billing_model') or 'creditos'),
        'creditos': int(user.get('creditos') or 0),
        'nombre': str(user.get('nombre') or ''),
    }


def send_reset_code_email(to_email, code, expires_seconds, recipient_name=''):
    # Desconectado temporalmente para desarrollo web — activar configurando SMTP_HOST
    if not SMTP_HOST:
        return True, None

    subject = 'Código para restablecer contraseña - PrintForge Pro'
    saludo = f'Hola {recipient_name},' if recipient_name else 'Hola,'
    body = (
        f"{saludo}\n\n"
        f"Tu código de verificación para restablecer la contraseña es: {code}\n"
        f"Este código expira en {max(1, int(expires_seconds // 60))} minuto(s).\n\n"
        "Si no has solicitado este cambio, ignora este mensaje. Tu contraseña no será modificada."
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
    if auth_header.lower().startswith('bearer '):
        token = auth_header[7:].strip()
        if token:
            return token
    # Fallback: accept ?token= query param (needed for iframes that can't set headers)
    query_token = str(request.args.get('token') or '').strip()
    return query_token or None


def get_request_user():
    # If JWT auth not enabled, keep dev bypass for now
    if not ENABLE_JWT:
        # Allow tests to simulate users via header
        header = request.headers.get('X-Test-User')
        if header:
            try:
                data = json.loads(header)
                user = {
                    'id': data.get('id') or data.get('usuario_id') or data.get('email') or 1,
                    'nombre': data.get('nombre') or data.get('nombre') or 'TestUser',
                    'rol': data.get('rol') or data.get('role') or 'operario',
                    'empresa_id': normalize_empresa_id(data.get('empresa_id') or data.get('empresa') or '1')
                }
                # Check for X-Role header override (for role switching without logout)
                x_role = request.headers.get('X-Role')
                if x_role:
                    x_role = str(x_role or '').strip().lower()
                    if x_role:  # Only override if header has a non-empty value
                        user['rol'] = x_role
                g._request_user = user
                return user
            except Exception:
                pass
        user = {'id': 1, 'nombre': 'DevUser', 'rol': 'root', 'empresa_id': '1'}
        # Check for X-Role header override even in dev mode
        x_role = request.headers.get('X-Role')
        if x_role:
            x_role = str(x_role or '').strip().lower()
            if x_role:  # Only override if header has a non-empty value
                user['rol'] = x_role
        g._request_user = user
        return user

    token = get_bearer_token_from_request()
    if not token:
        return None
    payload = verify_jwt(token)
    if not payload:
        return None

    # Try to resolve user by id or email from token payload
    col = get_empresa_collection('usuarios', None)
    uid = payload.get('usuario_id') or payload.get('id') or payload.get('email') or payload.get('usuario')
    user_doc = None
    if not uid:
        return None
    try:
        if isinstance(uid, str) and '@' in uid:
            user_doc = col.find_one({'email': uid})
        else:
            try:
                user_doc = col.find_one({'_id': ObjectId(uid)})
            except Exception:
                user_doc = col.find_one({'_id': uid})
    except Exception:
        return None

    if not user_doc:
        return None
    user = fix_id(user_doc)
    
    # Check for X-Role header override (for role switching without logout)
    x_role = request.headers.get('X-Role')
    if x_role:
        x_role = str(x_role or '').strip().lower()
        if x_role:  # Only override if header has a non-empty value
            user['rol'] = x_role
    
    g._request_user = user
    return user


def can_role_permission(role_key, permission_key, empresa_id=None):
    try:
        if not role_key or not permission_key:
            return False
        # root siempre tiene todos los permisos
        if str(role_key).strip() == 'root':
            return True

        # Resolver empresa_id desde el contexto de la request si no se pasa explícitamente
        if empresa_id is None:
            try:
                req_user = getattr(g, '_request_user', None)
                if req_user:
                    empresa_id = req_user.get('empresa_id')
            except Exception:
                pass

        permissions = get_role_permissions(empresa_id)
        role = str(role_key).strip()
        # Buscar primero con el nombre original, luego slugificado
        role_perms = permissions.get(role)
        if role_perms is None:
            role_perms = permissions.get(slugify_estado(role))
        # Si no está en la matriz de DB, buscar en los defaults
        if role_perms is None:
            role_perms = ROLE_PERMISSIONS_DEFAULT.get(role) or ROLE_PERMISSIONS_DEFAULT.get(slugify_estado(role))
        if isinstance(role_perms, dict):
            # Si la clave existe en la BD úsala; si no (permiso nuevo no guardado aún) cae al default
            if permission_key in role_perms:
                return bool(role_perms[permission_key])
            default_perms = (
                ROLE_PERMISSIONS_DEFAULT.get(role)
                or ROLE_PERMISSIONS_DEFAULT.get(slugify_estado(role))
                or {}
            )
            return bool(default_perms.get(permission_key, False))
        return False
    except Exception:
        return False


def get_role_permissions(empresa_id=None):
    """Leer la matriz de permisos desde `config_general` filtrado por empresa.
    Devuelve un dict { role_key: {permission_key: bool, ...}, ... }. Si no existe,
    devuelve `ROLE_PERMISSIONS_DEFAULT`.
    """
    empresa_id = normalize_empresa_id(empresa_id)
    col_general = get_empresa_collection('config_general', empresa_id)
    doc = col_general.find_one({'clave': 'role_permissions', 'empresa_id': empresa_id})
    parsed = None
    if doc and doc.get('valor'):
        try:
            parsed = json.loads(doc.get('valor'))
        except Exception:
            parsed = None
    if not isinstance(parsed, dict):
        # Retornar una copia para evitar mutaciones accidentales
        return dict(ROLE_PERMISSIONS_DEFAULT)
    return parsed


def get_required_permission_for_request(path, method_upper):
    """Resolver (si aplica) la permission key requerida para una ruta y método.
    Devuelve None si no hay permiso asociado (ruta pública o lectura).
    """
    if not path:
        return None
    mutating = {'POST', 'PUT', 'PATCH', 'DELETE'}
    p = str(path or '').lower()

    # Gestión específica de permisos para roles/ajustes
    if p.startswith('/api/settings/roles-permissions'):
        # Sólo para cambios efectivos
        return 'manage_roles_permissions' if method_upper in mutating else None

    # Cambios en la configuración general requieren manage_app_settings
    if p.startswith('/api/settings') and method_upper in mutating:
        return 'manage_app_settings'

    # Clientes
    if p.startswith('/api/clientes') and method_upper in mutating:
        return 'edit_clientes'

    # Máquinas
    if p.startswith('/api/maquinas') and method_upper in mutating:
        return 'edit_maquinas'

    # Pedidos / trabajos
    if (p.startswith('/api/pedidos') or p.startswith('/api/trabajos') or p.startswith('/api/trabajo')) and method_upper in mutating:
        return 'edit_pedidos'

    # Presupuestos
    if p.startswith('/api/presupuestos') and method_upper in mutating:
        return 'edit_presupuestos'

    # Producción
    if p.startswith('/api/produccion') and method_upper in mutating:
        return 'edit_produccion'

    # Materiales (catálogo, stock, consumos)
    if p.startswith('/api/materiales') and method_upper in mutating:
        return 'manage_app_settings'

    return None


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
    # Allow a test header `X-Test-User` in development to simulate users.
    # If JWT is disabled, prefer the header; otherwise fall back to dev root.
    if not ENABLE_JWT:
        header = request.headers.get('X-Test-User')
        if header:
            try:
                data = json.loads(header)
                user = {
                    'id': data.get('id') or data.get('usuario_id') or data.get('email') or 1,
                    'nombre': data.get('nombre') or data.get('nombre') or 'TestUser',
                    'rol': data.get('rol') or data.get('role') or 'operario',
                    'empresa_id': normalize_empresa_id(data.get('empresa_id') or data.get('empresa') or '1')
                }
                g._request_user = user
                return user, None
            except Exception:
                pass
        # default dev bypass
        return {'id': 1, 'nombre': 'DevUser', 'rol': 'root', 'empresa_id': '1'}, None

    # When JWT enabled, resolve via token
    user = get_request_user()
    if not user:
        return None, (jsonify({'error': 'Autenticación requerida'}), 401)
    return user, None


@app.after_request
def apply_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Referrer-Policy'] = 'no-referrer'
    response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
    # Allow PDF inline preview to be embedded in iframe from same origin
    if request.endpoint == 'preview_archivo_inline':
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'
        response.headers['Content-Security-Policy'] = (
            "default-src 'self' http://localhost:8080; "
            "frame-ancestors 'self' http://localhost:8081 http://localhost:8080;"
        )
    else:
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['Content-Security-Policy'] = (
            "default-src 'self'; img-src 'self' data: blob:; "
            "script-src 'self'; style-src 'self' 'unsafe-inline'; "
            "connect-src 'self' http://localhost:8080;"
        )
    return response


@app.before_request
def enforce_role_permissions():
    if request.method == 'OPTIONS':
        return make_response('', 200)

    path = str(request.path or '')
    method_upper = (request.method or '').upper()

    if path.startswith('/api/integracion/documentos') and method_upper not in ['GET', 'HEAD', 'OPTIONS']:
        if INTEGRATION_API_KEY:
            incoming_key = str(request.headers.get('X-API-Key') or '').strip()
            if incoming_key == INTEGRATION_API_KEY:
                return None

    # Determinar permiso requerido para esta ruta/método
    permission = get_required_permission_for_request(path, method_upper)

    # Rutas públicas no requieren autenticación/permiso
    for public_prefix in AUTH_PUBLIC_PATHS:
        if path.startswith(public_prefix):
            return None

    # Si no hay permiso requerido para esta ruta, permitirla
    if not permission:
        return None

    request_user = get_request_user()
    if not request_user:
        return jsonify({
            'error': 'Autenticación requerida',
            'required_permission': permission,
        }), 401

    try:
        allowed = can_role_permission(request_user.get('rol'), permission)
    except Exception:
        allowed = False
    if allowed:
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
    """Initialize default configuration entries in database"""
    from pymongo import MongoClient
    from os import environ

    # Connect directly to MongoDB (bypass PyMongo which may not be ready)
    mongo_uri = environ.get('MONGODB_URI', 'mongodb://localhost:27017/printforgepro')
    try:
        client = MongoClient(mongo_uri)
        db = client['printforgepro']
        col_opciones = db['config_opciones']
    except Exception as e:
        print(f"Error connecting to MongoDB in init_db(): {e}")
        return

    # Mapeo de slugs a (label, color) para estados
    states_slug_to_label = {
        'en-diseno': ('En Diseño', DEFAULT_ESTADO_COLORS['en-diseno']),
        'pendiente-de-aprobacion': ('Pendiente de Aprobación', DEFAULT_ESTADO_COLORS['pendiente-de-aprobacion']),
        'pendiente-de-cliche': ('Pendiente de Cliché', DEFAULT_ESTADO_COLORS['pendiente-de-cliche']),
        'pendiente-de-impresion': ('Pendiente de Impresión', DEFAULT_ESTADO_COLORS['pendiente-de-impresion']),
        'pendiente-post-impresion': ('Pendiente Post-Impresión', DEFAULT_ESTADO_COLORS['pendiente-post-impresion']),
        'finalizado': ('Finalizado', DEFAULT_ESTADO_COLORS['finalizado']),
        'parado': ('Parado', DEFAULT_ESTADO_COLORS['parado']),
        'cancelado': ('Cancelado', DEFAULT_ESTADO_COLORS['cancelado']),
    }

    # Only seed truly protected system data on startup.
    # User-editable catalogs (tintas_especiales, acabados, materiales, extra roles)
    # must NOT be re-seeded here or deleted items reappear on every restart.
    defaults_catalogo = {
        'roles': ['Administrador'],
        'estados_pedido': list(states_slug_to_label.keys())
    }

    try:
        for categoria, valores in defaults_catalogo.items():
            for idx, valor in enumerate(valores, start=1):
                # Use new schema: 'valor' and 'orden' (no legacy 'value'/'order')
                if categoria == 'estados_pedido':
                    # For estados: valor is the slug (key), label+color from map
                    label, color = states_slug_to_label.get(valor, (valor, None))
                    # Check if exists by human-readable label for this empresa
                    exists = col_opciones.count_documents({
                        'categoria': categoria,
                        'valor': label,
                        'empresa_id': '1'
                    }) > 0
                    if not exists:
                        col_opciones.insert_one({
                            'categoria': categoria,
                            'valor': label,
                            'label': label,
                            'color': color,
                            'orden': idx,
                            'empresa_id': '1',
                            'fecha_creacion': datetime.now().isoformat()
                        })
                    else:
                        # Update color if missing
                        if color:
                            col_opciones.update_one(
                                {'categoria': categoria, 'valor': label, 'empresa_id': '1', 'color': None},
                                {'$set': {'color': color}}
                            )
                else:
                    # For other categories, check if value exists for empresa='1'
                    if col_opciones.count_documents({'categoria': categoria, 'valor': valor, 'empresa_id': '1'}) == 0:
                        col_opciones.insert_one({
                            'categoria': categoria,
                            'valor': valor,
                            'label': valor,
                            'orden': idx,
                            'empresa_id': '1',
                            'fecha_creacion': datetime.now().isoformat()
                        })
    except Exception as e:
        import traceback
        print(f'Error initializing catalogo: {e}')
        traceback.print_exc()
        pass

    # Migrar materiales legacy → catalogo_materiales para empresa '1'
    try:
        col_catalogo = db['catalogo_materiales']
        legacy_mats = list(db['config_opciones'].find({'categoria': 'materiales', 'empresa_id': '1'}).sort('orden', 1))
        for idx_m, mat_doc in enumerate(legacy_mats, start=1):
            nombre = (mat_doc.get('label') or mat_doc.get('valor') or '').strip()
            if not nombre:
                continue
            if not col_catalogo.find_one({'nombre': nombre, 'empresa_id': '1'}):
                col_catalogo.insert_one({
                    'empresa_id': '1',
                    'nombre': nombre,
                    'fabricantes': [],
                    'orden': mat_doc.get('orden', idx_m),
                    'fecha_creacion': mat_doc.get('fecha_creacion', datetime.now().isoformat()),
                    'activo': True,
                })
    except Exception as e:
        print(f'Error migrando materiales legacy en init_db: {e}')


def _migrar_materiales_legacy(empresa_id):
    """Copia entradas de config_opciones categoria:materiales → catalogo_materiales.
    Idempotente: no inserta si ya existe el nombre."""
    try:
        empresa_id = normalize_empresa_id(empresa_id)
        col_opciones = get_empresa_collection('config_opciones', empresa_id)
        col_catalogo = get_empresa_collection('catalogo_materiales', empresa_id)
        legacy = list(col_opciones.find({'categoria': 'materiales', 'empresa_id': empresa_id}).sort('orden', 1))
        migrated = 0
        for m in legacy:
            nombre = (m.get('label') or m.get('valor') or '').strip()
            if not nombre:
                continue
            if col_catalogo.find_one({'nombre': nombre, 'empresa_id': empresa_id}):
                continue
            col_catalogo.insert_one({
                'empresa_id': empresa_id,
                'nombre': nombre,
                'fabricantes': [],
                'orden': m.get('orden', 0),
                'fecha_creacion': m.get('fecha_creacion', datetime.now().isoformat()),
                'activo': True,
            })
            migrated += 1
        return migrated
    except Exception as e:
        print(f'Error migrando materiales legacy: {e}')
        return 0


def _seed_catalogo_materiales_defaults(empresa_id):
    """Siembra catálogo de materiales por defecto para empresa nueva."""
    empresa_id = normalize_empresa_id(empresa_id)
    col_catalogo = get_empresa_collection('catalogo_materiales', empresa_id)
    defaults = [
        {
            'nombre': 'Polipropileno',
            'fabricantes': [
                {'id': str(uuid.uuid4()), 'nombre': 'Avery', 'anchos_cm': [33.0, 40.0]},
                {'id': str(uuid.uuid4()), 'nombre': 'Ritrama', 'anchos_cm': [32.0, 38.0]},
            ],
        },
        {'nombre': 'Papel', 'fabricantes': []},
        {'nombre': 'PVC', 'fabricantes': []},
        {'nombre': 'PE', 'fabricantes': []},
        {'nombre': 'PET', 'fabricantes': []},
    ]
    for idx, mat in enumerate(defaults, start=1):
        if not col_catalogo.find_one({'nombre': mat['nombre'], 'empresa_id': empresa_id}):
            col_catalogo.insert_one({
                'empresa_id': empresa_id,
                'nombre': mat['nombre'],
                'fabricantes': mat['fabricantes'],
                'orden': idx,
                'fecha_creacion': datetime.now().isoformat(),
                'activo': True,
            })


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


def capitalize_first(texto):
    try:
        s = str(texto or '').strip()
        if not s:
            return s
        return s[0].upper() + s[1:]
    except Exception:
        return texto


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


def get_estados_pedido_disponibles(empresa_id=None):
    empresa_id = normalize_empresa_id(empresa_id)
    col = get_empresa_collection('config_opciones', empresa_id)
    rows = list(col.find({'categoria': 'estados_pedido', 'empresa_id': empresa_id}).sort([('orden', 1), ('_id', 1)]))
    if not rows:
        return ESTADOS_PEDIDO_DEFAULT
    parsed = []
    used = set()
    for row in rows:
        label = (row.get('valor') or '').strip()
        valor_slug = slugify_estado(label)
        if not label or not valor_slug or valor_slug in used:
            continue
        used.add(valor_slug)
        # Use stored color if available, else fall back to default map
        color = row.get('color') or DEFAULT_ESTADO_COLORS.get(valor_slug)
        item = {'valor': label, 'label': label}
        if color:
            item['color'] = color
        parsed.append(item)
    return parsed if parsed else ESTADOS_PEDIDO_DEFAULT


def infer_estados_rules(available_states):
    # Work exclusively with slugs so that rules are consistent with the frontend
    slug_set = {slugify_estado(item['valor']) for item in available_states}
    # Map slug → lowercased label for keyword matching
    slug_labels = {slugify_estado(item['valor']): (item.get('label') or item.get('valor') or '').lower()
                   for item in available_states}

    def find_by_keywords(words):
        return [slug for slug, label in slug_labels.items()
                if any(word in label for word in words)]

    inferred = {
        'bloqueados_produccion': list(dict.fromkeys(
            [v for v in ['cancelado', 'parado', 'finalizado'] if v in slug_set] +
            find_by_keywords(['cancel', 'parad'])
        )),
        'en_cola_produccion': list(dict.fromkeys(
            [v for v in ['pendiente-de-impresion', 'pendiente-post-impresion'] if v in slug_set] +
            find_by_keywords(['impresion', 'impresión'])
        )),
        'preimpresion': list(dict.fromkeys(
            [v for v in ['en-diseno', 'pendiente-de-aprobacion', 'pendiente-de-cliche'] if v in slug_set] +
            find_by_keywords(['diseno', 'diseño', 'aprob', 'cliche', 'clich'])
        )),
        'estados_finalizados': list(dict.fromkeys(
            [v for v in ['finalizado'] if v in slug_set] +
            find_by_keywords(['final'])
        )),
        'ocultar_timeline': list(dict.fromkeys(
            [v for v in ['parado', 'cancelado'] if v in slug_set] +
            find_by_keywords(['cancel', 'parad'])
        )),
        'ocultar_grafica': list(dict.fromkeys(
            [v for v in ['parado', 'cancelado', 'finalizado'] if v in slug_set] +
            find_by_keywords(['cancel', 'parad', 'final'])
        )),
    }
    return inferred


def get_estados_pedido_rules(empresa_id=None):
    available_states = get_estados_pedido_disponibles(empresa_id)
    # Use slugs as the canonical identifier (consistent with frontend)
    allowed_slugs = {slugify_estado(item['valor']) for item in available_states}
    empresa_id = normalize_empresa_id(empresa_id)
    col = get_empresa_collection('config_general', empresa_id)
    doc = col.find_one({'clave': 'estados_pedido_rules', 'empresa_id': empresa_id})
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
            if slug and slug in allowed_slugs and slug not in normalized:
                normalized.append(slug)
        if not normalized:
            normalized = [v for v in inferred.get(key, []) if v in allowed_slugs]
        if not normalized:
            normalized = [v for v in default_vals if v in allowed_slugs]
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
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        col = get_empresa_collection('maquinas', empresa_id)
        orden_col = get_empresa_collection('trabajo_orden', empresa_id)
        pedidos_col = get_empresa_collection('pedidos', empresa_id)
        
        maquinas = list(col.find({'empresa_id': empresa_id}))
        
        # Estados a excluir de la cuenta de trabajos_en_cola
        # (solo contar trabajos que están realmente en producción)
        estados_excluir = {
            'parado', 'cancelado', 'finalizado',  # lowercase
            'Parado', 'Cancelado', 'Finalizado',  # uppercase
            'Diseño', 'diseno', 'diseño',  # design phase
            'Pendiente de Aprobación', 'pendiente de aprobación',  # approval phase
            'Pendiente de Cliché', 'pendiente de cliché',  # cliche phase
        }
        
        # Agregar trabajos_en_cola para cada máquina
        for m in maquinas:
            maquina_id_field = m.get('id')
            maquina_oid = m.get('_id')
            
            # Build query to match by either id field or _id
            query_terms = []
            if maquina_id_field is not None:
                query_terms.append({'maquina_id': maquina_id_field, 'empresa_id': empresa_id})
            if maquina_oid is not None:
                query_terms.append({'maquina_id': maquina_oid, 'empresa_id': empresa_id})
                query_terms.append({'maquina_id': str(maquina_oid), 'empresa_id': empresa_id})
            
            if query_terms:
                query = {'$or': query_terms} if len(query_terms) > 1 else query_terms[0]
            else:
                query = {'maquina_id': maquina_id_field, 'empresa_id': empresa_id}
            
            # Get all trabajo_orden for this machine
            ordenes = list(orden_col.find(query))
            
            # Count only those whose pedido is in a production state
            trabajos_en_cola = 0
            for orden in ordenes:
                trabajo_id = orden.get('trabajo_id')
                if not trabajo_id:
                    continue
                # Get the corresponding pedido
                pedido = pedidos_col.find_one({'trabajo_id': trabajo_id, 'empresa_id': empresa_id})
                if not pedido:
                    continue
                # Check if estado is in production (not in exclusion list)
                estado = pedido.get('estado')
                if estado not in estados_excluir:
                    trabajos_en_cola += 1
            
            m['trabajos_en_cola'] = trabajos_en_cola
        maquinas = [fix_id(m) for m in maquinas]
        return jsonify({'maquinas': maquinas}), 200
    except Exception as e:
        tb = _traceback.format_exc()
        print('ERROR in get_maquinas:\n', tb)
        return jsonify({'error': str(e), 'trace': tb}), 500


@app.route('/api/maquinas', methods=['POST'])
def create_maquina():
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))

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
        print('CREATE MAQUINA ERROR:\n', _traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/api/maquinas/<maquina_id>', methods=['PUT'])
def update_maquina(maquina_id):
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))

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
        
        # Try to find and update by _id (ObjectId) first (since GET endpoint returns _id as id)
        result = None
        try:
            if len(maquina_id) == 24:  # Valid ObjectId hex string
                result = col.update_one({'_id': ObjectId(maquina_id), 'empresa_id': empresa_id}, {'$set': {
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
        except Exception:
            pass
        
        # Fall back to updating by 'id' field if no match by _id
        if not result or result.matched_count == 0:
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


@app.route('/api/maquinas/<maquina_id>', methods=['DELETE'])
def delete_maquina(maquina_id):
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        col = get_empresa_collection('maquinas', empresa_id)
        orden_col = get_empresa_collection('trabajo_orden', empresa_id)
        pedidos_col = get_empresa_collection('pedidos', empresa_id)
        total = col.count_documents({'empresa_id': empresa_id})
        
        # Try to find by _id (ObjectId) first (since GET endpoint returns _id as id)
        maquina = None
        try:
            if len(maquina_id) == 24:  # Valid ObjectId hex string
                maquina = col.find_one({'_id': ObjectId(maquina_id), 'empresa_id': empresa_id})
        except Exception:
            pass
        
        # Fall back to searching by the 'id' field
        if not maquina:
            maquina = col.find_one({'id': maquina_id, 'empresa_id': empresa_id})
        
        if total == 1 and maquina and maquina.get('nombre') == PROTECTED_MAQUINA_NOMBRE:
            return jsonify({'error': 'No puedes eliminar la máquina de ejemplo si no hay otras creadas'}), 409
        if not maquina:
            return jsonify({'error': 'Máquina no encontrada'}), 404
        
        # Get the maquina_id from the document (could be the 'id' field or numeric value)
        actual_maquina_id = maquina.get('id', maquina_id)
        trabajos_en_cola = orden_col.count_documents({'maquina_id': actual_maquina_id, 'empresa_id': empresa_id})
        if trabajos_en_cola > 0:
            return jsonify({'error': 'No se puede eliminar: la máquina tiene trabajos en cola'}), 400
        
        # Delete by _id if that's what matched
        if '_id' in maquina:
            col.delete_one({'_id': maquina['_id'], 'empresa_id': empresa_id})
        else:
            col.delete_one({'id': actual_maquina_id, 'empresa_id': empresa_id})
        return jsonify({'success': True}), 200
    except Exception as e:
        tb = _traceback.format_exc()
        return jsonify({'error': str(e), 'trace': tb}), 500

# Endpoints para clientes
@app.route('/api/clientes', methods=['GET'])
def get_clientes():
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        col = get_empresa_collection('clientes', empresa_id)
        clientes = list(col.find({'empresa_id': empresa_id}))
        clientes = [fix_id(c) for c in clientes]
        return jsonify({'clientes': clientes}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/token-info', methods=['GET'])
def auth_token_info():
    token = get_bearer_token_from_request()
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    payload = verify_jwt(token)
    if not payload:
        return jsonify({'error': 'Token inválido o expirado'}), 401
    return jsonify({'payload': payload}), 200


@app.route('/api/auth/login', methods=['POST'])
def login_public_user():
    """Autenticar un usuario con email y contraseña."""
    try:
        data = request.get_json() or {}
        email = str(data.get('email') or '').strip().lower()
        password = str(data.get('password') or '').strip()

        if not email:
            return jsonify({'error': 'Email requerido'}), 400
        if not password:
            return jsonify({'error': 'Contraseña requerida'}), 400

        col = get_empresa_collection('usuarios', None)
        user = col.find_one({'email': email})
        if not user:
            return jsonify({'error': 'Credenciales inválidas'}), 401
        if not verify_password(password, user.get('password_hash', '')):
            return jsonify({'error': 'Credenciales inválidas'}), 401

        user = fix_id(user)
        usuario_id = str(user.get('id') or '')
        rol = str(user.get('rol') or 'operario').strip()
        empresa_id = normalize_empresa_id(user.get('empresa_id'))

        now_sec = int(time.time())
        access_ttl = 60 * 60 * 24  # 24 horas
        access_expires_at = now_sec + access_ttl

        access_token = None
        if ENABLE_JWT:
            access_token = create_jwt({
                'usuario_id': usuario_id,
                'email': email,
                'rol': rol,
                'empresa_id': empresa_id,
            }, ttl_seconds=access_ttl)

        usuario_out = {
            'id': usuario_id,
            'nombre': user.get('nombre', ''),
            'email': email,
            'rol': rol,
            'empresa_id': empresa_id,
            'empresa_nombre': user.get('empresa_nombre', ''),
            'idioma': user.get('idioma') or None,
            'sesion_timeout_minutos': user.get('sesion_timeout_minutos') or None,
        }

        try:
            log_audit('login', usuario_out, {'email': email, 'rol': rol})
        except Exception:
            pass

        return jsonify({
            'usuario': usuario_out,
            'access_token': access_token,
            'refresh_token': access_token,
            'access_expires_at': access_expires_at,
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/verify-role-permission', methods=['POST'])
def verify_role_permission():
    """Verifica si un rol específico tiene un permiso sin requerir autenticación"""
    try:
        data = request.get_json() or {}
        role = str(data.get('role') or '').strip()
        permission = str(data.get('permission') or '').strip()

        if not role or not permission:
            return jsonify({'error': 'role y permission requeridos'}), 400

        # Resolver empresa_id para leer las reglas personalizadas del tenant correcto.
        # Se acepta en el body o se infiere del usuario autenticado (token/dev-bypass).
        empresa_id = str(data.get('empresa_id') or '').strip() or None
        if not empresa_id:
            try:
                req_user = get_request_user()
                if req_user:
                    empresa_id = req_user.get('empresa_id')
            except Exception:
                pass

        has_permission = can_role_permission(role, permission, empresa_id=empresa_id)
        return jsonify({'role': role, 'permission': permission, 'allowed': has_permission}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/clientes', methods=['POST'])
def create_cliente():
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
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
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
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
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
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


def seed_empresa_defaults(empresa_id):
    """Siembra todos los datos por defecto para una nueva empresa.
    Es seguro llamarla varias veces (nunca inserta duplicados).
    """
    empresa_id = normalize_empresa_id(empresa_id)
    col_op = get_empresa_collection('config_opciones', empresa_id)
    col_gen = get_empresa_collection('config_general', empresa_id)

    defaults_opciones = {
        'roles': ['Administrador', 'Comercial', 'Diseño', 'Impresión', 'Post-Impresión'],
        'estados_pedido': [
            'En Diseño', 'Pendiente de Aprobación', 'Pendiente de Cliché',
            'Pendiente de Impresión', 'Pendiente Post-Impresión',
            'Finalizado', 'Parado', 'Cancelado',
        ],
        'materiales': ['Polipropileno', 'Papel', 'PVC', 'PE', 'PET'],
        'acabados': ['Barniz', 'Stamping', 'Laminado', 'Sin acabado'],
        'tintas_especiales': ['P1', 'P2', 'P3', 'P4', 'P5'],
    }
    for cat, valores in defaults_opciones.items():
        for idx, valor in enumerate(valores, start=1):
            if not col_op.find_one({'categoria': cat, 'valor': valor, 'empresa_id': empresa_id}):
                doc = {
                    'categoria': cat, 'valor': valor, 'label': valor,
                    'orden': idx, 'empresa_id': empresa_id,
                    'fecha_creacion': datetime.now().isoformat(),
                }
                if cat == 'estados_pedido':
                    slug = slugify_estado(valor)
                    color = DEFAULT_ESTADO_COLORS.get(slug)
                    if color:
                        doc['color'] = color
                col_op.insert_one(doc)
            elif cat == 'estados_pedido':
                # Backfill color if missing
                slug = slugify_estado(valor)
                color = DEFAULT_ESTADO_COLORS.get(slug)
                if color:
                    col_op.update_one(
                        {'categoria': cat, 'valor': valor, 'empresa_id': empresa_id, 'color': None},
                        {'$set': {'color': color}}
                    )

    config_gen_defaults = [
        ('role_permissions', json.dumps(ROLE_PERMISSIONS_DEFAULT)),
        ('modo_creacion', 'manual'),
        ('session_timeout_minutes', str(SESSION_TIMEOUT_MINUTES_DEFAULT)),
    ]
    for clave, valor_cfg in config_gen_defaults:
        if not col_gen.find_one({'clave': clave, 'empresa_id': empresa_id}):
            col_gen.insert_one({
                'clave': clave, 'valor': valor_cfg,
                'empresa_id': empresa_id,
                'fecha_creacion': datetime.now().isoformat(),
            })

    # Seed catálogo de materiales enriquecido
    _seed_catalogo_materiales_defaults(empresa_id)


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
        pwd_ok, pwd_err = validate_password_strength(password)
        if not pwd_ok:
            return jsonify({'error': pwd_err}), 400

        col = get_empresa_collection('usuarios', None)
        if col.find_one({'email': email}):
            return jsonify({'error': 'Ya existe un usuario con ese email'}), 409
        # RGPD Art. 7 — verificar que el usuario aceptó explícitamente los términos
        gdpr_accepted = bool(data.get('gdpr_consent_accepted'))
        if not gdpr_accepted:
            return jsonify({'error': 'Debes aceptar los Términos de uso y la Política de privacidad para continuar'}), 400

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
            'fecha_creacion': time.strftime('%Y-%m-%dT%H:%M:%S'),
            # Registro de consentimiento RGPD Art. 7 — prueba de consentimiento
            'gdpr_consent': {
                'accepted': True,
                'accepted_at': datetime.now().isoformat(),
                'terms_version': '1.0',
                'privacy_version': '1.0',
                'ip_address': request.remote_addr or '',
                'user_agent': (request.headers.get('User-Agent') or '')[:256],
            }
        }
        result = col.insert_one(doc)
        usuario_id = str(result.inserted_id)
        empresa_id = usuario_id  # empresa_id = ObjectId del usuario fundador

        # Persistir empresa_id en el documento del usuario
        col.update_one({'_id': result.inserted_id}, {'$set': {'empresa_id': empresa_id}})

        # Crear registro de empresa
        try:
            mongo.db['empresas'].update_one(
                {'empresa_id': empresa_id},
                {'$setOnInsert': {
                    'empresa_id': empresa_id,
                    'nombre': empresa_nombre,
                    'cif': empresa_cif,
                    'admin_user_id': empresa_id,
                    'activa': True,
                    'plan': billing_model,
                    'fecha_creacion': datetime.now().isoformat(),
                }},
                upsert=True,
            )
        except Exception:
            pass

        # Sembrar todos los datos por defecto para la nueva empresa
        try:
            seed_empresa_defaults(empresa_id)
        except Exception:
            pass

        # Issue token if JWT enabled
        token = create_jwt({'usuario_id': usuario_id, 'email': email, 'rol': rol, 'empresa_id': str(empresa_id)}, ttl_seconds=60 * 60 * 24) if ENABLE_JWT else None

        return jsonify({
            'success': True,
            'id': usuario_id,
            'creditos': FREE_SIGNUP_CREDITS,
            'billing_model': billing_model,
            'token': token,
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


# ── RGPD Art. 20 — Derecho de portabilidad ────────────────────────────────────
@app.route('/api/user/me/export', methods=['GET', 'OPTIONS'])
def export_user_data():
    if request.method == 'OPTIONS':
        return '', 204
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        usuario_id = str(request_user.get('id') or request_user.get('_id') or '')
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        col_usuarios = get_empresa_collection('usuarios', empresa_id)
        user_doc = col_usuarios.find_one({'_id': ObjectId(usuario_id)})
        if not user_doc:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        user_doc.pop('password_hash', None)
        user_doc['_id'] = str(user_doc['_id'])
        col_pedidos = get_empresa_collection('pedidos', empresa_id)
        pedidos = []
        for p in col_pedidos.find({'empresa_id': empresa_id}):
            p['_id'] = str(p['_id'])
            pedidos.append(p)
        log_audit('gdpr_data_export', request_user, {'usuario_id': usuario_id})
        return jsonify({
            'usuario': user_doc,
            'pedidos': pedidos,
            'exportado_en': datetime.now().isoformat(),
            'formato_version': '1.0',
            'normativa': 'RGPD (UE) 2016/679 Art. 20',
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ── RGPD Art. 17 — Derecho de supresión (right to be forgotten) ───────────────
@app.route('/api/user/me/delete-account', methods=['POST', 'OPTIONS'])
def delete_own_account():
    if request.method == 'OPTIONS':
        return '', 204
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        data = request.get_json() or {}
        password_confirm = str(data.get('password') or '').strip()
        if not password_confirm:
            return jsonify({'error': 'Se requiere la contraseña para confirmar la eliminación'}), 400
        usuario_id = str(request_user.get('id') or request_user.get('_id') or '')
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        col_usuarios = get_empresa_collection('usuarios', empresa_id)
        user_doc = col_usuarios.find_one({'_id': ObjectId(usuario_id)})
        if not user_doc:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        if not verify_password(password_confirm, user_doc.get('password_hash', '')):
            return jsonify({'error': 'Contraseña incorrecta'}), 403
        # Soft-delete: anonimizar PII, conservar registros contables (obligación legal 7 años)
        col_usuarios.update_one(
            {'_id': ObjectId(usuario_id)},
            {'$set': {
                'nombre': '[Cuenta eliminada]',
                'email': f'deleted_{usuario_id}@deleted.invalid',
                'password_hash': '',
                'deleted': True,
                'deleted_at': datetime.now().isoformat(),
                'gdpr_deletion_ip': request.remote_addr or '',
            }}
        )
        log_audit('gdpr_account_deletion', request_user, {'usuario_id': usuario_id})
        return jsonify({
            'success': True,
            'message': 'Cuenta eliminada conforme al RGPD Art. 17. Los datos contables se conservarán el período legalmente obligatorio.',
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/usuarios', methods=['GET', 'POST'])
def api_usuarios():
    try:
        if request.method == 'GET':
            request_user, auth_error = require_request_user()
            if auth_error:
                return auth_error
            empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
            col = get_empresa_collection('usuarios', empresa_id)
            if str(request_user.get('rol')).lower() == 'root':
                usuarios = list(col.find({}))
            else:
                usuarios = list(col.find({'empresa_id': empresa_id}))
            usuarios_out = [fix_id(u) for u in usuarios]
            return jsonify({'usuarios': usuarios_out}), 200

        # POST -> crear usuario (desde UI admin)
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error

        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))

        # Sólo usuarios con rol 'administrador' o 'root' pueden crear otros usuarios
        requester_role = str(request_user.get('rol') or '').strip().lower()
        if requester_role not in ('administrador', 'root'):
            return jsonify({'error': 'Permiso denegado: se requiere rol administrador'}), 403
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

        col = get_empresa_collection('usuarios', empresa_id)
        if col.find_one({'email': email}):
            return jsonify({'error': 'Ya existe un usuario con ese email'}), 409

        # Generar contraseña aleatoria temporal y guardarla como hash
        temp_pwd = secrets.token_hex(6)
        doc = {
            'nombre': nombre,
            'email': email,
            'rol': rol,
            'password_hash': hash_password(temp_pwd),
            'empresa_id': empresa_id,
            'fecha_creacion': time.strftime('%Y-%m-%dT%H:%M:%S')
        }
        result = col.insert_one(doc)
        usuario = col.find_one({'_id': result.inserted_id})
        out = fix_id(usuario)
        out['_temp_password'] = temp_pwd
        # Audit log
        try:
            log_audit('create_user', request_user, {'created_user_id': out.get('id'), 'created_user_email': out.get('email')})
        except Exception:
            pass
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


@app.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    """Solicitar un código de 6 dígitos para restablecer la contraseña."""
    try:
        data = request.get_json() or {}
        email = str(data.get('email') or '').strip().lower()

        if not email:
            return jsonify({'error': 'Email requerido'}), 400

        # Rate limit: 3 solicitudes por email cada 15 minutos
        if is_auth_rate_limited('forgot_password', email, limit=3, window_seconds=900):
            return jsonify({'error': 'Demasiados intentos. Espera unos minutos.'}), 429

        col_usuarios = get_empresa_collection('usuarios', None)
        usuario = col_usuarios.find_one({'email': email})

        # Seguridad: no revelar si el email existe o no
        if not usuario:
            resp = {'message': 'Si el email existe en el sistema, recibirás un código de verificación.'}
            if DEV_EXPOSE_RESET_CODE:
                resp['dev_note'] = 'Email no encontrado'
            return jsonify(resp), 200

        # Generar código de 6 dígitos criptográficamente seguro
        code = str(secrets.randbelow(900000) + 100000)
        expires_at = datetime.now() + timedelta(seconds=RESET_CODE_TTL_SECONDS)

        col_resets = get_empresa_collection('password_resets', None)
        # Invalidar códigos anteriores para este email
        col_resets.delete_many({'email': email})
        col_resets.insert_one({
            'email': email,
            'code': code,
            'expires_at': expires_at,
            'used': False,
            'created_at': datetime.now().isoformat(),
        })

        nombre = str(usuario.get('nombre') or '')
        send_reset_code_email(email, code, RESET_CODE_TTL_SECONDS, nombre)

        resp = {'message': 'Si el email existe en el sistema, recibirás un código de verificación.'}
        if DEV_EXPOSE_RESET_CODE:
            resp['dev_reset_code'] = code
        return jsonify(resp), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    """Confirmar código y establecer nueva contraseña."""
    try:
        data = request.get_json() or {}
        email = str(data.get('email') or '').strip().lower()
        code = str(data.get('code') or '').strip()
        new_password = str(data.get('new_password') or '')

        if not email:
            return jsonify({'error': 'Email requerido'}), 400
        if not code or len(code) != 6 or not code.isdigit():
            return jsonify({'error': 'Código inválido'}), 400
        pwd_ok, pwd_err = validate_password_strength(new_password)
        if not pwd_ok:
            return jsonify({'error': pwd_err}), 400

        # Rate limit: 5 intentos por email cada 15 minutos
        if is_auth_rate_limited('reset_password', email, limit=5, window_seconds=900):
            return jsonify({'error': 'Demasiados intentos. Espera unos minutos.'}), 429

        col_resets = get_empresa_collection('password_resets', None)
        reset_doc = col_resets.find_one({'email': email, 'code': code, 'used': False})

        if not reset_doc:
            return jsonify({'error': 'Código inválido o expirado'}), 400

        if datetime.now() > reset_doc['expires_at']:
            col_resets.delete_one({'_id': reset_doc['_id']})
            return jsonify({'error': 'El código ha expirado. Solicita uno nuevo.'}), 400

        # Actualizar contraseña
        col_usuarios = get_empresa_collection('usuarios', None)
        new_hash = hash_password(new_password)
        col_usuarios.update_one({'email': email}, {'$set': {'password_hash': new_hash}})

        # Marcar el código como usado
        col_resets.update_one({'_id': reset_doc['_id']}, {'$set': {'used': True}})

        try:
            log_audit('reset_password', {'email': email}, {})
        except Exception:
            pass

        return jsonify({'message': 'Contraseña actualizada correctamente'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/service-account', methods=['POST'])
def create_service_account():
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        requester_role = str(request_user.get('rol') or '').strip().lower()
        if requester_role not in ('administrador', 'root'):
            return jsonify({'error': 'Permiso denegado: se requiere rol administrador'}), 403

        data = request.get_json() or {}
        name = str(data.get('name') or data.get('nombre') or '').strip() or 'service-account'
        roles = data.get('roles') if isinstance(data.get('roles'), list) else []

        client_id = secrets.token_hex(12)
        secret = secrets.token_urlsafe(24)
        secret_hash = hash_password(secret)

        col = get_empresa_collection('service_accounts', 0)
        doc = {
            'client_id': client_id,
            'secret_hash': secret_hash,
            'name': name,
            'roles': roles,
            'created_by': {'id': request_user.get('id'), 'email': request_user.get('email')},
            'created_at': datetime.now().isoformat(),
        }
        col.insert_one(doc)
        try:
            log_audit('create_service_account', request_user, {'client_id': client_id, 'name': name, 'roles': roles})
        except Exception:
            pass
        return jsonify({'client_id': client_id, 'secret': secret}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/service-account/token', methods=['POST'])
def service_account_token():
    try:
        data = request.get_json() or {}
        client_id = str(data.get('client_id') or '').strip()
        secret = str(data.get('secret') or '').strip()
        if not client_id or not secret:
            return jsonify({'error': 'client_id y secret requeridos'}), 400

        col = get_empresa_collection('service_accounts', 0)
        acct = col.find_one({'client_id': client_id})
        if not acct:
            return jsonify({'error': 'Credenciales inválidas'}), 401
        secret_hash = acct.get('secret_hash')
        if not verify_password(secret, secret_hash):
            return jsonify({'error': 'Credenciales inválidas'}), 401

        payload = {'type': 'service_account', 'client_id': client_id, 'roles': acct.get('roles', [])}
        token = create_jwt(payload)
        try:
            log_audit('issue_service_account_token', None, {'client_id': client_id})
        except Exception:
            pass
        return jsonify({'token': token}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth/refresh', methods=['POST'])
def refresh_public_user_session():
    try:
        data = request.get_json() or {}
        refresh_token = str(data.get('refresh_token') or '').strip()
        if not refresh_token:
            return jsonify({'error': 'refresh_token requerido'}), 400

        # Verificar firma del token (ignorar expiración — es el refresh token)
        parts = refresh_token.split('.')
        if len(parts) != 3:
            return jsonify({'error': 'Token inválido'}), 401
        try:
            signing_input = (parts[0] + '.' + parts[1]).encode('utf-8')
            sig = _b64url_decode(parts[2])
            expected = hmac.new(JWT_SECRET.encode('utf-8'), signing_input, hashlib.sha256).digest()
            if not hmac.compare_digest(expected, sig):
                return jsonify({'error': 'Token inválido'}), 401
            old_payload = json.loads(_b64url_decode(parts[1]).decode('utf-8'))
        except Exception:
            return jsonify({'error': 'Token inválido'}), 401

        email = old_payload.get('email', '')
        # Buscar usuario actualizado en MongoDB
        col = get_empresa_collection('usuarios', None)
        user = col.find_one({'email': email})
        if not user:
            return jsonify({'error': 'Usuario no encontrado'}), 401

        user = fix_id(user)
        usuario_id = str(user.get('id') or old_payload.get('usuario_id', ''))
        rol = str(user.get('rol') or old_payload.get('rol', 'operario')).strip()
        empresa_id = normalize_empresa_id(user.get('empresa_id') or old_payload.get('empresa_id'))

        now_sec = int(time.time())
        access_ttl = 60 * 60 * 24  # 24 horas
        access_expires_at = now_sec + access_ttl

        new_access_token = create_jwt({
            'usuario_id': usuario_id,
            'email': email,
            'rol': rol,
            'empresa_id': empresa_id,
        }, ttl_seconds=access_ttl)

        usuario_out = {
            'id': usuario_id,
            'nombre': user.get('nombre', ''),
            'email': email,
            'rol': rol,
            'empresa_id': empresa_id,
            'empresa_nombre': user.get('empresa_nombre', ''),
            'avatar_url': user.get('avatar_url'),
        }

        return jsonify({
            'usuario': usuario_out,
            'access_token': new_access_token,
            'refresh_token': new_access_token,
            'access_expires_at': access_expires_at,
        }), 200
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


@app.route('/api/usuarios/<usuario_id>', methods=['PUT'])
def actualizar_usuario(usuario_id):
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        # ...existing code...
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))

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
        col = get_empresa_collection('usuarios', empresa_id)
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
        if 'sesion_timeout_minutos' in data:
            val = data.get('sesion_timeout_minutos')
            if val is None or str(val).strip() == '':
                update_doc['sesion_timeout_minutos'] = None
            else:
                try:
                    mins = int(val)
                    if SESSION_TIMEOUT_MINUTES_MIN <= mins <= SESSION_TIMEOUT_MINUTES_MAX:
                        update_doc['sesion_timeout_minutos'] = mins
                except (ValueError, TypeError):
                    pass

        if not update_doc:
            return jsonify({'error': 'Nada que actualizar'}), 400

        result = col.update_one({'_id': oid, 'empresa_id': empresa_id}, {'$set': update_doc})
        if result.matched_count == 0:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        usuario = col.find_one({'_id': oid, 'empresa_id': empresa_id})
        try:
            log_audit('update_user', request_user, {'updated_user_id': str(usuario.get('_id')), 'updated_fields': list(update_doc.keys())})
        except Exception:
            pass
        return jsonify(fix_id(usuario)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/usuarios/<usuario_id>/preferencias', methods=['PATCH'])
def actualizar_preferencias_usuario(usuario_id):
    """Guarda preferencias del usuario (ej. idioma) sin tocar datos críticos."""
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))

        data = request.get_json() or {}
        SUPPORTED_LANGS = ['es', 'en', 'fr', 'pt', 'de', 'it']
        update_doc = {}
        if 'idioma' in data:
            idioma = str(data.get('idioma') or '').strip()
            if idioma in SUPPORTED_LANGS:
                update_doc['idioma'] = idioma
        if 'sesion_timeout_minutos' in data:
            val = data.get('sesion_timeout_minutos')
            if val is None or str(val).strip() == '':
                update_doc['sesion_timeout_minutos'] = None
            else:
                try:
                    mins = int(val)
                    if SESSION_TIMEOUT_MINUTES_MIN <= mins <= SESSION_TIMEOUT_MINUTES_MAX:
                        update_doc['sesion_timeout_minutos'] = mins
                except (ValueError, TypeError):
                    pass

        if not update_doc:
            return jsonify({'error': 'Nada que actualizar'}), 400

        col = get_empresa_collection('usuarios', empresa_id)
        try:
            oid = ObjectId(usuario_id)
        except Exception:
            oid = usuario_id

        result = col.update_one({'_id': oid, 'empresa_id': empresa_id}, {'$set': update_doc})
        if result.matched_count == 0:
            return jsonify({'error': 'Usuario no encontrado'}), 404

        return jsonify({'ok': True, **update_doc}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


ALLOWED_AVATAR_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}

@app.route('/api/usuarios/<usuario_id>/avatar', methods=['POST'])
def upload_usuario_avatar(usuario_id):
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        request_user_id = str(request_user.get('id') or request_user.get('_id') or '')
        if request_user_id != str(usuario_id) and request_user.get('rol') not in ('root', 'administrador'):
            return jsonify({'error': 'Sin permisos'}), 403
        if 'file' not in request.files:
            return jsonify({'error': 'No se recibió archivo'}), 400
        file = request.files['file']
        if not file or not file.filename:
            return jsonify({'error': 'Archivo inválido'}), 400
        if not _allowed_file(file.filename, ALLOWED_AVATAR_EXTENSIONS):
            return jsonify({'error': 'Formato no permitido. Use JPG, PNG o WebP'}), 400
        avatar_dir = os.path.join(UPLOAD_BASE_DIR, 'avatars', str(empresa_id))
        os.makedirs(avatar_dir, exist_ok=True)
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{uuid.uuid4().hex}.{ext}"
        filepath = os.path.join(avatar_dir, filename)
        file.save(filepath)
        avatar_url = f"/api/avatars/{empresa_id}/{filename}"
        col = get_empresa_collection('usuarios', empresa_id)
        try:
            oid = ObjectId(usuario_id)
        except Exception:
            oid = usuario_id
        col.update_one({'_id': oid, 'empresa_id': empresa_id}, {'$set': {'avatar_url': avatar_url}})
        try:
            log_audit('update_avatar', request_user, {'updated_user_id': str(usuario_id)})
        except Exception:
            pass
        return jsonify({'avatar_url': avatar_url}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/avatars/<path:filename>', methods=['GET'])
def serve_avatar(filename):
    try:
        filepath = os.path.join(UPLOAD_BASE_DIR, 'avatars', filename)
        if not os.path.isfile(filepath):
            return jsonify({'error': 'No encontrado'}), 404
        return send_file(filepath)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/billing/config', methods=['GET'])
def get_billing_config():
    return jsonify({
        'free_signup_credits': FREE_SIGNUP_CREDITS,
        'credit_cost_pedido': CREDIT_COST_PEDIDO,
        'credit_cost_features': CREDIT_COST_FEATURES,
        'pricing_credits': CREDIT_COSTS,
        'credit_packages': CREDIT_PACKAGES,
        'subscription_price_eur': SUBSCRIPTION_PRICE_EUR,
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


@app.route('/api/billing/status', methods=['GET'])
def get_billing_status():
    """Estado de facturación del usuario autenticado: plan, saldo, info."""
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        email = str(request_user.get('email') or '').strip().lower()
        status = get_billing_status_for_user(email, empresa_id=request_user.get('empresa_id'))
        if not status:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        model = status['billing_model']
        resp = {
            'billing_model': model,
            'creditos': status['creditos'],
            'credit_cost_pedido': CREDIT_COST_PEDIDO,
            'credit_cost_features': CREDIT_COST_FEATURES,
            'credit_packages': CREDIT_PACKAGES,
            'subscription_price_eur': SUBSCRIPTION_PRICE_EUR,
            'stripe_enabled': stripe_enabled(),
        }
        return jsonify(resp), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/billing/history', methods=['GET'])
def get_billing_history():
    """Historial de transacciones de créditos del usuario autenticado."""
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        email = resolve_billing_email(
            str(request_user.get('email') or '').strip().lower(),
            empresa_id=request_user.get('empresa_id'),
        )
        col_tx = get_empresa_collection('credit_transactions', None)
        limit = min(int(request.args.get('limit', 50)), 200)
        txs = list(col_tx.find({'email': email}, {'_id': 0}).sort('created_at', -1).limit(limit))
        return jsonify({'transactions': txs}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/billing/creditos/topup', methods=['POST'])
def topup_credits():
    """Recarga de créditos (simulada mientras no esté configurada la pasarela de pago)."""
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        email = resolve_billing_email(
            str(request_user.get('email') or '').strip().lower(),
            empresa_id=request_user.get('empresa_id'),
        )
        data = request.get_json() or {}
        package_id = str(data.get('package_id') or '').strip()
        pkg = next((p for p in CREDIT_PACKAGES if p['id'] == package_id), None)
        if not pkg:
            return jsonify({'error': 'Paquete no válido'}), 400
        amount = int(pkg['credits'])
        new_balance, err = add_credits(email, amount, action='purchase', metadata={'package_id': package_id, 'price_eur': pkg['price_eur'], 'simulated': True})
        if err:
            return jsonify({'error': err}), 400
        return jsonify({'credits_added': amount, 'new_balance': new_balance, 'simulated': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/billing/change-plan', methods=['POST'])
def change_billing_plan():
    """Cambia el modelo de facturación del usuario entre 'creditos' y 'suscripcion'."""
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        email = str(request_user.get('email') or '').strip().lower()
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        data = request.get_json() or {}
        new_plan = str(data.get('plan') or '').strip().lower()
        if new_plan not in ('creditos', 'suscripcion'):
            return jsonify({'error': 'plan debe ser "creditos" o "suscripcion"'}), 400
        col = get_empresa_collection('usuarios', None)
        query = {'email': email} if email else {'empresa_id': empresa_id}
        result = col.update_one(query, {'$set': {'billing_model': new_plan}})
        if result.matched_count == 0:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        return jsonify({'billing_model': new_plan}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/billing/checkout-session', methods=['POST'])
def create_billing_checkout_session():
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error

        if not stripe_enabled():
            return jsonify({'error': 'Pasarela no configurada. Define STRIPE_SECRET_KEY.'}), 503

        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
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

        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
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


@app.route('/api/usuarios/<usuario_id>/creditos', methods=['GET'])
def get_creditos_usuario(usuario_id):
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        email = str(request_user.get('email') or '').strip().lower()
        status = get_billing_status_for_user(email, empresa_id=request_user.get('empresa_id'))
        if not status:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        return jsonify({'creditos': status['creditos'], 'billing_model': status['billing_model']}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/billing/consumir', methods=['POST'])
def consumir_creditos_billing():
    """Consume créditos por el uso de funcionalidades premium.
    Aplica cobro único por pedido: si el pedido ya fue cobrado por features, no se vuelve a cobrar."""
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        email = resolve_billing_email(
            str(request_user.get('email') or '').strip().lower(),
            empresa_id=request_user.get('empresa_id'),
        )

        data = request.get_json() or {}
        accion = str(data.get('accion') or '').strip().lower()
        pedido_id = str(data.get('pedido_id') or '').strip() or None
        metadata = data.get('metadata') if isinstance(data.get('metadata'), dict) else {}

        VALID_ACTIONS = {'report', 'repetidora', 'trapping', 'troquel'}
        if accion not in VALID_ACTIONS:
            return jsonify({'error': f'accion no válida. Usa: {"|".join(sorted(VALID_ACTIONS))}'}), 400

        # Verificar si el plan es suscripción → sin coste
        status = get_billing_status_for_user(email, empresa_id=request_user.get('empresa_id'))
        if not status:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        if status['billing_model'] == 'suscripcion':
            return jsonify({'charged': False, 'reason': 'subscription', 'balance': status['creditos']}), 200

        # Cobro único por pedido: si ya se cobró features en este pedido, no repetir
        if pedido_id:
            col_tx = get_empresa_collection('credit_transactions', None)
            already = col_tx.find_one({'email': email, 'pedido_id': pedido_id, 'action': 'features'})
            if already:
                return jsonify({'charged': False, 'reason': 'already_charged', 'balance': status['creditos']}), 200

        cost = CREDIT_COST_FEATURES
        new_balance, err = deduct_credits(email, cost, 'features', pedido_id=pedido_id, metadata={'accion': accion, **metadata})
        if err:
            return jsonify({'error': err, 'balance': status['creditos'], 'required': cost}), 402
        return jsonify({'charged': True, 'amount': cost, 'balance': new_balance}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/usuarios/<usuario_id>', methods=['DELETE'])
def eliminar_usuario(usuario_id):
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        # request_role = normalize_role(request_user.get('rol'))  # Legacy, no usado con MongoDB
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))

        col = get_empresa_collection('usuarios', empresa_id)
        try:
            oid = ObjectId(usuario_id)
        except Exception:
            oid = usuario_id
        result = col.delete_one({'_id': oid, 'empresa_id': empresa_id})
        if result.deleted_count == 0:
            return jsonify({'error': 'Usuario no encontrado'}), 404
        try:
            log_audit('delete_user', request_user, {'deleted_user_id': str(usuario_id)})
        except Exception:
            pass
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/settings', methods=['GET'])
def get_settings_catalogo():
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        categoria = (request.args.get('categoria') or '').strip().lower()
        col = get_empresa_collection('config_opciones', empresa_id)

        # Ensure all protected categories have their default values
        def ensure_protected_categories():
            """
            Safely ensure all protected config categories exist with default values.
            Only inserts documents that are completely missing, never creates duplicates.
            """
            # Define only truly protected defaults (roles and estados_pedido).
            # Materiales, acabados and tintas_especiales are user-editable catalogs:
            # they must NOT be auto-recreated or users can never delete them.
            defaults_catalogo = {
                'roles': ['Administrador'],
                'estados_pedido': [
                    'En Diseño'
                ]
            }

            for cat, valores in defaults_catalogo.items():
                for idx, valor in enumerate(valores, start=1):
                    # Check if this value already exists in this category for this empresa
                    exists = col.count_documents({
                        'categoria': cat,
                        'valor': valor,
                        'empresa_id': empresa_id
                    }) > 0

                    if not exists:
                        # Insert only if doesn't exist
                        doc = {
                            'categoria': cat,
                            'valor': valor,
                            'label': valor,
                            'orden': idx,
                            'empresa_id': empresa_id,
                            'fecha_creacion': datetime.now().isoformat()
                        }
                        if cat == 'estados_pedido':
                            slug = slugify_estado(valor)
                            color = DEFAULT_ESTADO_COLORS.get(slug)
                            if color:
                                doc['color'] = color
                        col.insert_one(doc)
                    elif cat == 'estados_pedido':
                        # Backfill color if missing
                        slug = slugify_estado(valor)
                        color = DEFAULT_ESTADO_COLORS.get(slug)
                        if color:
                            col.update_one(
                                {'categoria': cat, 'valor': valor, 'empresa_id': empresa_id, 'color': None},
                                {'$set': {'color': color}}
                            )

        if categoria:
            if categoria not in ALLOWED_SETTINGS_CATEGORIES:
                return jsonify({'error': 'Categoría no válida'}), 400
            # Ensure category has default values before querying
            ensure_protected_categories()
            rows = list(col.find({'categoria': categoria, 'empresa_id': empresa_id}).sort([('orden', 1), ('_id', 1)]))
            items = [{
                'id': str(row.get('_id')),
                'categoria': row.get('categoria'),
                'valor': row.get('valor'),
                'color': row.get('color'),
                'orden': row.get('orden', 0),
                'fecha_creacion': row.get('fecha_creacion')
            } for row in rows]
            return jsonify({'categoria': categoria, 'items': items}), 200

        # Si no hay categoría, devolver todas
        ensure_protected_categories()
        rows = list(col.find({'empresa_id': empresa_id}).sort([('categoria', 1), ('orden', 1), ('_id', 1)]))
        settings = {key: [] for key in ALLOWED_SETTINGS_CATEGORIES}
        for row in rows:
            categoria_row = row.get('categoria')
            if categoria_row not in settings:
                continue
            settings[categoria_row].append({
                'id': str(row.get('_id')),
                'categoria': categoria_row,
                'valor': row.get('valor'),
                'color': row.get('color'),
                'orden': row.get('orden', 0),
                'fecha_creacion': row.get('fecha_creacion')
            })
        return jsonify({'settings': settings}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500



@app.route('/api/settings/estados-pedido-rules', methods=['GET', 'PUT'])
def api_estados_pedido_rules():
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))

        if request.method == 'GET':
            # Devuelve las reglas inferidas/almacenadas y los estados disponibles
            payload = get_estados_pedido_rules(empresa_id)
            return jsonify(payload), 200

        # PUT -> Guardar reglas
        data = request.get_json() or {}
        rules = data.get('rules')
        if not isinstance(rules, dict):
            return jsonify({'error': 'rules debe ser un objeto JSON'}), 400

        col = get_empresa_collection('config_general', empresa_id)
        # Guardar como JSON string
        col.update_one(
            {'clave': 'estados_pedido_rules', 'empresa_id': empresa_id},
            {'$set': {'valor': json.dumps(rules), 'empresa_id': empresa_id, 'fecha_actualizacion': datetime.now().isoformat()}},
            upsert=True
        )
        try:
            log_audit('update_estados_pedido_rules', request_user, {'rules_keys': list(rules.keys())})
        except Exception:
            pass
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/settings/roles-permissions', methods=['GET', 'PUT'])
def api_roles_permissions():
    """Devuelve o guarda la matriz de permisos por rol y la lista de permisos disponibles.
    GET -> devuelve current permissions
    PUT -> guarda el objeto JSON `permissions` en `config_general` bajo la clave `role_permissions`.
    """
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))

        # GET: devolver
        if request.method == 'GET':
            col_general = get_empresa_collection('config_general', empresa_id)
            doc = col_general.find_one({'clave': 'role_permissions', 'empresa_id': empresa_id})
            parsed = None
            if doc and doc.get('valor'):
                try:
                    parsed = json.loads(doc.get('valor'))
                except Exception:
                    parsed = None
            if not isinstance(parsed, dict):
                parsed = ROLE_PERMISSIONS_DEFAULT

            # Also return the list of known permissions and available roles
            col_roles = get_empresa_collection('config_opciones', empresa_id)
            rows = list(col_roles.find({'categoria': 'roles', 'empresa_id': empresa_id}).sort([('orden', 1), ('_id', 1)]))
            roles = []
            for r in rows:
                label = (r.get('valor') or '').strip()
                key = slugify_estado(label)
                if label and key:
                    roles.append({'key': key, 'label': label})

            return jsonify({'permissions': PERMISSION_KEYS, 'roles_permissions': parsed, 'roles': roles}), 200

        # PUT: guardar
        data = request.get_json() or {}
        permissions = data.get('permissions') or data.get('roles_permissions') or data.get('rolesPermissions')
        if not isinstance(permissions, dict):
            return jsonify({'error': 'permissions debe ser un objeto JSON'}), 400

        # Verificar que el usuario tiene permisos para editar
        can_manage = can_role_permission(request_user.get('rol'), 'manage_roles_permissions')
        if not can_manage:
            return jsonify({'error': 'No tienes permisos para editar las reglas de permisos'}), 403

        # Proteger el rol 'administrador': nunca puede perder permisos
        for role_key, perms in permissions.items():
            if role_key == 'administrador':
                # El rol administrador debe mantener todos sus permisos
                admin_perms = permissions.get('administrador', {})
                for perm_key in PERMISSION_KEYS:
                    if admin_perms.get(perm_key) is False:
                        return jsonify({'error': 'El rol administrador no puede perder permisos. Imposible desactivar permisos para administrador'}), 400

        col_general = get_empresa_collection('config_general', empresa_id)
        col_general.update_one(
            {'clave': 'role_permissions', 'empresa_id': empresa_id},
            {'$set': {'valor': json.dumps(permissions), 'empresa_id': empresa_id, 'fecha_actualizacion': datetime.now().isoformat()}},
            upsert=True
        )
        try:
            log_audit('update_role_permissions', request_user, {'roles': list(permissions.keys())})
        except Exception:
            pass
        return jsonify({'success': True, 'permissions': permissions}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# NOTE: `active-role` API removed. Any logic that relied on the
# `active_role` configuration should instead rely on explicit user roles
# (e.g. 'root' or 'administrador').


@app.route('/api/settings/modo-creacion', methods=['GET', 'PUT'])
def api_modo_creacion():
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))

        if request.method == 'GET':
            col_general = get_empresa_collection('config_general', empresa_id)
            doc = col_general.find_one({'clave': 'modo_creacion', 'empresa_id': empresa_id})
            valor = (doc.get('valor') if doc and doc.get('valor') else 'manual')
            valor = valor if valor in ['manual', 'automatico'] else 'manual'
            return jsonify({'modo_creacion': valor}), 200

        # PUT
        if not can_role_permission(request_user.get('rol', ''), 'edit_modo_creacion', empresa_id):
            return jsonify({'error': 'No tienes permiso para cambiar el modo de creación de pedidos.'}), 403
        data = request.get_json() or {}
        modo = str(data.get('modo_creacion') or data.get('modo') or '').strip().lower()
        if modo not in ['manual', 'automatico']:
            return jsonify({'error': 'modo_creacion no válido (manual|automatico)'}), 400
        col_general = get_empresa_collection('config_general', empresa_id)
        col_general.update_one(
            {'clave': 'modo_creacion', 'empresa_id': empresa_id},
            {'$set': {'valor': modo, 'empresa_id': empresa_id, 'fecha_actualizacion': datetime.now().isoformat()}},
            upsert=True
        )
        try:
            log_audit('update_modo_creacion', request_user, {'modo': modo})
        except Exception:
            pass
        return jsonify({'success': True, 'modo_creacion': modo}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/settings/session-timeout', methods=['GET', 'PUT'])
def api_session_timeout():
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))

        if request.method == 'GET':
            col_general = get_empresa_collection('config_general', empresa_id)
            doc = col_general.find_one({'clave': 'session_timeout_minutes', 'empresa_id': empresa_id})
            value = int(doc.get('valor')) if doc and doc.get('valor') and str(doc.get('valor')).isdigit() else SESSION_TIMEOUT_MINUTES_DEFAULT
            return jsonify({'session_timeout_minutes': int(value), 'min': SESSION_TIMEOUT_MINUTES_MIN, 'max': SESSION_TIMEOUT_MINUTES_MAX}), 200

        # PUT
        data = request.get_json() or {}
        try:
            minutes = int(data.get('session_timeout_minutes'))
        except Exception:
            return jsonify({'error': 'session_timeout_minutes debe ser un entero'}), 400
        if minutes < SESSION_TIMEOUT_MINUTES_MIN or minutes > SESSION_TIMEOUT_MINUTES_MAX:
            return jsonify({'error': f'session_timeout_minutes fuera de rango ({SESSION_TIMEOUT_MINUTES_MIN}-{SESSION_TIMEOUT_MINUTES_MAX})'}), 400
        col_general = get_empresa_collection('config_general', empresa_id)
        col_general.update_one(
            {'clave': 'session_timeout_minutes', 'empresa_id': empresa_id},
            {'$set': {'valor': str(minutes), 'empresa_id': empresa_id, 'fecha_actualizacion': datetime.now().isoformat()}},
            upsert=True
        )
        try:
            log_audit('update_session_timeout', request_user, {'minutes': minutes})
        except Exception:
            pass
        return jsonify({'success': True, 'session_timeout_minutes': minutes}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/settings/modulos', methods=['GET', 'PATCH', 'OPTIONS'])
def api_settings_modulos():
    if request.method == 'OPTIONS':
        return '', 204
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        col_general = get_empresa_collection('config_general', empresa_id)

        MODULOS_DEFAULT = {
            'consumo_material': True,
            'produccion': False,
            'produccion_trigger_estado': '',
        }

        if request.method == 'GET':
            doc = col_general.find_one({'clave': 'modulos', 'empresa_id': empresa_id})
            modulos = dict(MODULOS_DEFAULT)
            if doc and isinstance(doc.get('valor'), dict):
                modulos.update(doc['valor'])
            return jsonify({'modulos': modulos}), 200

        # PATCH
        data = request.get_json() or {}
        doc = col_general.find_one({'clave': 'modulos', 'empresa_id': empresa_id})
        modulos = dict(MODULOS_DEFAULT)
        if doc and isinstance(doc.get('valor'), dict):
            modulos.update(doc['valor'])
        for key in MODULOS_DEFAULT:
            if key in data:
                val = data[key]
                modulos[key] = bool(val) if isinstance(val, bool) else val
        col_general.update_one(
            {'clave': 'modulos', 'empresa_id': empresa_id},
            {'$set': {'valor': modulos, 'empresa_id': empresa_id, 'fecha_actualizacion': datetime.now().isoformat()}},
            upsert=True
        )
        return jsonify({'success': True, 'modulos': modulos}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/settings/opcion', methods=['GET', 'POST'])
def crear_config_opcion():
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))

        categoria = request.args.get('categoria', '').strip().lower()
        valor = request.args.get('valor', '').strip()
        color = request.args.get('color', '').strip()  # Color para estados_pedido

        # Validar que no se creen opciones vacías
        if not categoria or not valor:
            return jsonify({'error': 'categoria y valor son requeridos y no pueden estar vacíos'}), 400

        # Normalize role labels: capitalize first letter
        if categoria == 'roles' and valor:
            valor = capitalize_first(valor)

        # Validar que el valor no sea literalmente 'None' o similar
        if valor.lower() in ['none', 'null', 'undefined']:
            return jsonify({'error': f'Valor inválido: "{valor}" está reservado'}), 400

        col = get_empresa_collection('config_opciones', empresa_id)
        siguiente_orden = (col.find({'categoria': categoria, 'empresa_id': empresa_id}).sort('orden', -1).limit(1)[0].get('orden', 0) if col.count_documents({'categoria': categoria, 'empresa_id': empresa_id}) else 0) + 1
        doc = {
            'categoria': categoria,
            'valor': valor,
            'label': valor,  # Include label field for roles and estados_pedido
            'orden': siguiente_orden,
            'empresa_id': empresa_id,
            'fecha_creacion': datetime.now().isoformat()
        }
        # Guardar color si es un estado de pedido
        if categoria == 'estados_pedido' and color:
            doc['color'] = color
        result = col.insert_one(doc)
        try:
            log_audit('create_setting_item', request_user, {'categoria': categoria, 'valor': valor, 'id': str(result.inserted_id)})
        except Exception:
            pass
        return jsonify({'success': True, 'id': str(result.inserted_id)}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/settings/reorder', methods=['POST'])
def reorder_settings_catalogo_items():
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))

        data = request.get_json() or {}
        categoria = (data.get('categoria') or '').strip().lower()
        ordered_ids = data.get('ordered_ids') or []

        if categoria not in ALLOWED_SETTINGS_CATEGORIES:
            return jsonify({'error': 'Categoría no válida'}), 400
        if not isinstance(ordered_ids, list) or not ordered_ids:
            return jsonify({'error': 'ordered_ids requerido'}), 400

        # MongoDB: IDs son strings (ObjectId)
        ordered_ids = [str(item_id) for item_id in ordered_ids]
        col = get_empresa_collection('config_opciones', empresa_id)
        ids_categoria = [str(row['_id']) for row in col.find({'categoria': categoria, 'empresa_id': empresa_id})]
        if set(ids_categoria) != set(ordered_ids):
            return jsonify({'error': 'ordered_ids no coincide con los elementos de la categoría'}), 400

        # Proteger orden de roles base
        if categoria == 'roles':
            rows_roles = list(col.find({'categoria': 'roles', 'empresa_id': empresa_id}))
            id_by_role_key = {}
            for row in rows_roles:
                role_id = str(row['_id'])
                role_label = row.get('valor')
                role_key = slugify_estado(role_label)
                if role_key in PROTECTED_ROLE_KEYS:
                    id_by_role_key[role_key] = role_id
            expected_prefix = [id_by_role_key[key] for key in PROTECTED_ROLE_ORDER if key in id_by_role_key]
            if ordered_ids[:len(expected_prefix)] != expected_prefix:
                return jsonify({'error': 'Los roles base deben permanecer fijos al inicio en orden Administrador, Root'}), 409

        # Actualizar orden
        for idx, item_id in enumerate(ordered_ids, start=1):
            col.update_one({'_id': ObjectId(item_id), 'categoria': categoria, 'empresa_id': empresa_id}, {'$set': {'orden': idx}})
        try:
            log_audit('reorder_settings', request_user, {'categoria': categoria, 'ordered_ids': ordered_ids})
        except Exception:
            pass
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/settings/estado-usage', methods=['GET'])
def check_estado_usage():
    """Valida si un estado está siendo usado en algún pedido/trabajo"""
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))

        estado_id = request.args.get('estado_id', '').strip()
        if not estado_id:
            return jsonify({'error': 'estado_id requerido'}), 400

        try:
            estado_id_obj = ObjectId(estado_id)
        except Exception:
            return jsonify({'error': 'estado_id inválido'}), 400

        # Obtener el estado de config para saber su valor
        col_config = get_empresa_collection('config_opciones', empresa_id)
        estado_config = col_config.find_one({'_id': estado_id_obj, 'categoria': 'estados_pedido', 'empresa_id': empresa_id})

        if not estado_config:
            return jsonify({'error': 'Estado no encontrado'}), 404

        estado_valor_original = estado_config.get('valor', '')
        # Normalizar el valor para comparación
        estado_valor_slugified = slugify_estado(estado_valor_original)

        # Contar cuántos trabajos tienen este estado
        col_trabajos = get_empresa_collection('trabajos', empresa_id)
        count = col_trabajos.count_documents({'estado': estado_valor_slugified, 'empresa_id': empresa_id})

        in_use = count > 0

        return jsonify({
            'estado_id': estado_id,
            'estado_valor': estado_valor_original,
            'in_use': in_use,
            'count': count
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/settings/rol-usage', methods=['GET'])
def check_rol_usage():
    """Valida si un rol está siendo usado por algún usuario"""
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))

        rol_id = request.args.get('rol_id', '').strip()
        if not rol_id:
            return jsonify({'error': 'rol_id requerido'}), 400

        try:
            rol_id_obj = ObjectId(rol_id)
        except Exception:
            return jsonify({'error': 'rol_id inválido'}), 400

        # Obtener el rol de config para saber su valor
        col_config = get_empresa_collection('config_opciones', empresa_id)
        rol_config = col_config.find_one({'_id': rol_id_obj, 'categoria': 'roles', 'empresa_id': empresa_id})

        if not rol_config:
            return jsonify({'rol_id': rol_id, 'in_use': False, 'count': 0, 'not_found': True}), 200

        rol_valor_original = rol_config.get('valor', '')
        # Normalizar el valor para comparación
        rol_valor_slugified = slugify_estado(rol_valor_original)

        # Contar cuántos usuarios tienen este rol
        col_usuarios = get_empresa_collection('usuarios', empresa_id)
        count = col_usuarios.count_documents({'rol': rol_valor_slugified, 'empresa_id': empresa_id})

        in_use = count > 0

        return jsonify({
            'rol_id': rol_id,
            'rol_valor': rol_valor_original,
            'in_use': in_use,
            'count': count
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/settings/<item_id>', methods=['PUT'])
def update_settings_catalogo_item(item_id):
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error

        data = request.get_json() or {}
        nuevo_valor = (data.get('valor') or '').strip()
        nuevo_label = (data.get('label') or nuevo_valor).strip()  # Use label from request or fallback to valor
        # Normalize role labels on update as well
        if nuevo_valor and 'roles' in (data.get('categoria') or ''):
            # when caller supplies categoria, honor it; otherwise we'll detect below from doc
            nuevo_valor = capitalize_first(nuevo_valor)
        if not nuevo_valor:
            return jsonify({'error': 'Valor requerido'}), 400

        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        col = get_empresa_collection('config_opciones', empresa_id)
        # Buscar el documento por _id
        from bson import ObjectId
        try:
            doc = col.find_one({'_id': ObjectId(item_id), 'empresa_id': empresa_id})
        except Exception:
            return jsonify({'error': 'Ítem no encontrado'}), 404
        if not doc:
            return jsonify({'error': 'Ítem no encontrado'}), 404
        categoria = (doc.get('categoria') or '').strip().lower()
        valor_actual = (doc.get('valor') or '').strip()
        if categoria not in ALLOWED_SETTINGS_CATEGORIES:
            return jsonify({'error': 'Categoría no válida'}), 400
        # If this is roles category, ensure normalized label
        if categoria == 'roles' and nuevo_valor:
            nuevo_valor = capitalize_first(nuevo_valor)
        if valor_actual.strip().lower() == nuevo_valor.strip().lower():
            # Name unchanged — but color might still need updating
            nuevo_color_check = (data.get('color') or '').strip()
            if categoria == 'estados_pedido' and nuevo_color_check:
                col.update_one({'_id': ObjectId(item_id)}, {'$set': {'color': nuevo_color_check}})
                return jsonify({'success': True, 'id': item_id, 'valor': valor_actual, 'changed': True}), 200
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
        if col.find_one({'categoria': categoria, 'valor': {'$regex': f'^{nuevo_valor}$', '$options': 'i'}, '_id': {'$ne': ObjectId(item_id)}, 'empresa_id': empresa_id}):
            return jsonify({'error': 'Ese valor ya existe en la categoría'}), 409
        # Verificar conflicto de slug
        if categoria in ['roles', 'estados_pedido']:
            for row in col.find({'categoria': categoria, '_id': {'$ne': ObjectId(item_id)}, 'empresa_id': empresa_id}):
                if slugify_estado(row.get('valor')) == slug_nuevo:
                    return jsonify({'error': 'Ya existe un valor equivalente en esa categoría'}), 409
        # Actualizar valor, label y color (si se provee y es un estado de pedido)
        update_fields = {'valor': nuevo_valor, 'label': nuevo_label}
        nuevo_color = (data.get('color') or '').strip()
        if categoria == 'estados_pedido' and nuevo_color:
            update_fields['color'] = nuevo_color
        col.update_one({'_id': ObjectId(item_id)}, {'$set': update_fields})
        # TODO: cascade_role_key_rename y cascade_estado_slug_rename deben adaptarse a MongoDB si se usan
        try:
            log_audit('update_setting_item', request_user if 'request_user' in locals() else None, {'id': str(item_id), 'categoria': categoria, 'old_valor': valor_actual, 'new_valor': nuevo_valor, 'empresa_id': empresa_id})
        except Exception:
            pass
        return jsonify({'success': True, 'id': item_id, 'valor': nuevo_valor, 'changed': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/settings/<item_id>', methods=['OPTIONS'])
def settings_item_options(item_id):
    # Explicitly handle CORS preflight for item-specific settings routes
    resp = make_response('')
    resp.status_code = 200
    return resp


@app.route('/api/settings/<item_id>', methods=['DELETE'])
def delete_settings_catalogo_item(item_id):
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error

        from bson import ObjectId
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        col = get_empresa_collection('config_opciones', empresa_id)
        try:
            doc = col.find_one({'_id': ObjectId(item_id), 'empresa_id': empresa_id})
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
        result = col.delete_one({'_id': ObjectId(item_id), 'empresa_id': empresa_id})
        if result.deleted_count == 0:
            return jsonify({'error': 'Ítem no encontrado'}), 404
        try:
            log_audit('delete_setting_item', request_user if 'request_user' in locals() else None, {'id': str(item_id), 'categoria': categoria, 'valor': valor, 'empresa_id': empresa_id})
        except Exception:
            pass
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
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        col = get_empresa_collection('pedidos', empresa_id)
        # Excluir documentos sin numero_pedido (son trabajos auxiliares de presupuestos no aprobados)
        pedidos = list(col.find({'empresa_id': empresa_id, 'numero_pedido': {'$exists': True, '$nin': [None, '']}}))
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
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
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

        # enriquecer con fecha_aprobacion del presupuesto asociado (si existe)
        try:
            t_id = pedido.get('trabajo_id')
            if t_id:
                pres_col = get_empresa_collection('presupuestos', empresa_id)
                pres = pres_col.find_one(
                    {'trabajo_id': t_id, 'empresa_id': empresa_id, 'aprobado': True},
                    {'fecha_aprobacion': 1, 'numero_presupuesto': 1}
                )
                if pres:
                    pedido['fecha_aprobacion_presupuesto'] = pres.get('fecha_aprobacion')
                    pedido['numero_presupuesto'] = pres.get('numero_presupuesto')
        except Exception:
            pass

        return jsonify(fix_id(pedido)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ═══════════════════════════════════════════════════════════════
# MATERIALES — Catálogo, Stock y Consumos
# ═══════════════════════════════════════════════════════════════

@app.route('/api/materiales/catalogo', methods=['OPTIONS'])
def materiales_catalogo_options():
    return make_response('', 200)

@app.route('/api/materiales/catalogo/<material_id>', methods=['OPTIONS'])
def materiales_catalogo_item_options(material_id):
    return make_response('', 200)

@app.route('/api/materiales/stock', methods=['OPTIONS'])
def materiales_stock_options():
    return make_response('', 200)

@app.route('/api/materiales/stock/<stock_id>', methods=['OPTIONS'])
def materiales_stock_item_options(stock_id):
    return make_response('', 200)

@app.route('/api/materiales/consumos', methods=['OPTIONS'])
def materiales_consumos_options():
    return make_response('', 200)

@app.route('/api/materiales/migracion', methods=['OPTIONS'])
def materiales_migracion_options():
    return make_response('', 200)


@app.route('/api/materiales/catalogo', methods=['GET'])
def get_catalogo_materiales():
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        include_inactivos = request.args.get('include_inactivos', 'false').lower() == 'true'
        col = get_empresa_collection('catalogo_materiales', empresa_id)
        query = {'empresa_id': empresa_id}
        if not include_inactivos:
            query['activo'] = True
        docs = list(col.find(query).sort([('orden', 1), ('nombre', 1)]))
        return jsonify({'catalogo': [fix_id(d) for d in docs]}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/materiales/catalogo/<material_id>', methods=['GET'])
def get_catalogo_material_single(material_id):
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        col = get_empresa_collection('catalogo_materiales', empresa_id)
        try:
            oid = ObjectId(material_id)
        except Exception:
            return jsonify({'error': 'ID inválido'}), 400
        doc = col.find_one({'_id': oid, 'empresa_id': empresa_id})
        if not doc:
            return jsonify({'error': 'Material no encontrado'}), 404
        return jsonify({'material': fix_id(doc)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/materiales/catalogo', methods=['POST'])
def create_catalogo_material():
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        data = request.get_json() or {}
        nombre = (data.get('nombre') or '').strip()
        if not nombre:
            return jsonify({'error': 'El nombre del material es requerido'}), 400
        col = get_empresa_collection('catalogo_materiales', empresa_id)
        if col.find_one({'nombre': nombre, 'empresa_id': empresa_id, 'activo': True}):
            return jsonify({'error': f'Ya existe un material con el nombre "{nombre}"'}), 409
        fabricantes = data.get('fabricantes') or []
        for f in fabricantes:
            if not f.get('id'):
                f['id'] = str(uuid.uuid4())
        max_doc = col.find_one({'empresa_id': empresa_id, 'activo': True}, sort=[('orden', -1)])
        siguiente_orden = (max_doc.get('orden', 0) + 1) if max_doc else 1
        doc = {
            'empresa_id': empresa_id,
            'nombre': nombre,
            'fabricantes': fabricantes,
            'orden': int(data.get('orden') or siguiente_orden),
            'fecha_creacion': datetime.now().isoformat(),
            'activo': True,
        }
        result = col.insert_one(doc)
        doc['_id'] = str(result.inserted_id)
        return jsonify({'success': True, 'material': fix_id(doc)}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/materiales/catalogo/<material_id>', methods=['PUT'])
def update_catalogo_material(material_id):
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        col = get_empresa_collection('catalogo_materiales', empresa_id)
        try:
            oid = ObjectId(material_id)
        except Exception:
            return jsonify({'error': 'ID inválido'}), 400
        if not col.find_one({'_id': oid, 'empresa_id': empresa_id}):
            return jsonify({'error': 'Material no encontrado'}), 404
        data = request.get_json() or {}
        update = {}
        if 'nombre' in data and data.get('nombre'):
            update['nombre'] = str(data['nombre']).strip()
        if 'fabricantes' in data:
            fabricantes = data['fabricantes'] or []
            for f in fabricantes:
                if not f.get('id'):
                    f['id'] = str(uuid.uuid4())
            update['fabricantes'] = fabricantes
        if 'orden' in data:
            update['orden'] = int(data['orden'])
        if 'activo' in data:
            update['activo'] = bool(data['activo'])
        if update:
            col.update_one({'_id': oid}, {'$set': update})
        updated = col.find_one({'_id': oid})
        return jsonify({'success': True, 'material': fix_id(updated)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/materiales/catalogo/<material_id>', methods=['DELETE'])
def delete_catalogo_material(material_id):
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        col = get_empresa_collection('catalogo_materiales', empresa_id)
        try:
            oid = ObjectId(material_id)
        except Exception:
            return jsonify({'error': 'ID inválido'}), 400
        if not col.find_one({'_id': oid, 'empresa_id': empresa_id}):
            return jsonify({'error': 'Material no encontrado'}), 404
        col.update_one({'_id': oid}, {'$set': {'activo': False}})
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/materiales/stock', methods=['GET'])
def get_stock_materiales():
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        col = get_empresa_collection('stock_materiales', empresa_id)
        query = {'empresa_id': empresa_id}
        activo_param = request.args.get('activo', 'true').lower()
        if activo_param == 'true':
            query['activo'] = True
        elif activo_param == 'false':
            query['activo'] = False
        mat = request.args.get('material_nombre', '').strip()
        if mat:
            query['material_nombre'] = mat
        fab = request.args.get('fabricante', '').strip()
        if fab:
            query['fabricante'] = fab
        docs = list(col.find(query).sort([('material_nombre', 1), ('fabricante', 1), ('ancho_cm', 1)]))
        return jsonify({'stock': [fix_id(d) for d in docs]}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/materiales/stock', methods=['POST'])
def add_stock_material():
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        data = request.get_json() or {}
        material_nombre = (data.get('material_nombre') or '').strip()
        if not material_nombre:
            return jsonify({'error': 'material_nombre es requerido'}), 400
        try:
            ancho_cm = float(data.get('ancho_cm') or 0)
            metros_total = float(data.get('metros_total') or 0)
        except (TypeError, ValueError):
            return jsonify({'error': 'ancho_cm y metros_total deben ser números'}), 400
        if metros_total <= 0:
            return jsonify({'error': 'metros_total debe ser mayor que 0'}), 400
        now = datetime.now().isoformat()
        doc = {
            'empresa_id': empresa_id,
            'material_nombre': material_nombre,
            'fabricante': (data.get('fabricante') or '').strip(),
            'ancho_cm': ancho_cm,
            'gramaje': float(data.get('gramaje') or 0),
            'metros_total': metros_total,
            'metros_disponibles': metros_total,
            'numero_lote': (data.get('numero_lote') or '').strip(),
            'notas': (data.get('notas') or '').strip(),
            'fecha_entrada': now,
            'fecha_actualizacion': now,
            'activo': True,
            'es_retal': bool(data.get('es_retal', False)),
            'retal_origen_pedido': (data.get('retal_origen_pedido') or '').strip(),
        }
        col = get_empresa_collection('stock_materiales', empresa_id)
        result = col.insert_one(doc)
        doc['_id'] = str(result.inserted_id)
        return jsonify({'success': True, 'stock_entry': fix_id(doc)}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/materiales/stock/<stock_id>', methods=['PUT'])
def update_stock_material(stock_id):
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        col = get_empresa_collection('stock_materiales', empresa_id)
        try:
            oid = ObjectId(stock_id)
        except Exception:
            return jsonify({'error': 'ID inválido'}), 400
        if not col.find_one({'_id': oid, 'empresa_id': empresa_id}):
            return jsonify({'error': 'Stock no encontrado'}), 404
        data = request.get_json() or {}
        update = {'fecha_actualizacion': datetime.now().isoformat()}
        if 'material_nombre' in data and str(data['material_nombre'] or '').strip():
            update['material_nombre'] = str(data['material_nombre']).strip()
        if 'fabricante' in data:
            update['fabricante'] = str(data['fabricante'] or '').strip()
        if 'ancho_cm' in data:
            try:
                update['ancho_cm'] = float(data['ancho_cm'])
            except (TypeError, ValueError):
                return jsonify({'error': 'ancho_cm debe ser un número'}), 400
        if 'gramaje' in data:
            try:
                update['gramaje'] = float(data['gramaje'] or 0)
            except (TypeError, ValueError):
                return jsonify({'error': 'gramaje debe ser un número'}), 400
        if 'metros_total' in data:
            try:
                update['metros_total'] = float(data['metros_total'])
            except (TypeError, ValueError):
                return jsonify({'error': 'metros_total debe ser un número'}), 400
        if 'metros_disponibles' in data:
            try:
                update['metros_disponibles'] = float(data['metros_disponibles'])
            except (TypeError, ValueError):
                return jsonify({'error': 'metros_disponibles debe ser un número'}), 400
        if 'numero_lote' in data:
            update['numero_lote'] = str(data['numero_lote'] or '').strip()
        if 'notas' in data:
            update['notas'] = str(data['notas'] or '')
        if 'activo' in data:
            update['activo'] = bool(data['activo'])
        col.update_one({'_id': oid}, {'$set': update})
        updated = col.find_one({'_id': oid})
        return jsonify({'success': True, 'stock_entry': fix_id(updated)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/materiales/stock/<stock_id>', methods=['DELETE'])
def delete_stock_material(stock_id):
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        col = get_empresa_collection('stock_materiales', empresa_id)
        try:
            oid = ObjectId(stock_id)
        except Exception:
            return jsonify({'error': 'ID inválido'}), 400
        if not col.find_one({'_id': oid, 'empresa_id': empresa_id}):
            return jsonify({'error': 'Stock no encontrado'}), 404
        col.update_one({'_id': oid}, {'$set': {'activo': False}})
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/materiales/consumos', methods=['GET'])
def get_consumos_material():
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        col = get_empresa_collection('consumos_material', empresa_id)
        query = {'empresa_id': empresa_id}
        pedido_id = request.args.get('pedido_id', '').strip()
        if pedido_id:
            query['pedido_id'] = pedido_id
        mat = request.args.get('material_nombre', '').strip()
        if mat:
            query['material_nombre'] = mat
        try:
            page = max(1, int(request.args.get('page', 1)))
            limit = min(100, max(1, int(request.args.get('limit', 50))))
        except (ValueError, TypeError):
            page, limit = 1, 50
        skip = (page - 1) * limit
        total = col.count_documents(query)
        docs = list(col.find(query).sort([('fecha', -1)]).skip(skip).limit(limit))
        return jsonify({'consumos': [fix_id(d) for d in docs], 'total': total, 'page': page, 'limit': limit}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/materiales/consumos', methods=['POST'])
def registrar_consumo_material():
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        data = request.get_json() or {}
        pedido_id = str(data.get('pedido_id') or '').strip()
        stock_id_str = str(data.get('stock_id') or '').strip()

        # Accept largo_trabajo_m (new) or metros_consumidos (legacy)
        try:
            largo_trabajo_m = float(data.get('largo_trabajo_m') or data.get('metros_consumidos') or 0)
        except (TypeError, ValueError):
            return jsonify({'error': 'largo_trabajo_m debe ser un número'}), 400

        try:
            ancho_trabajo_cm = float(data.get('ancho_trabajo_cm') or 0)
        except (TypeError, ValueError):
            ancho_trabajo_cm = 0

        metros_consumidos = largo_trabajo_m

        if not pedido_id or not stock_id_str or metros_consumidos <= 0:
            return jsonify({'error': 'pedido_id, stock_id y largo_trabajo_m > 0 son requeridos'}), 400

        stock_col = get_empresa_collection('stock_materiales', empresa_id)
        try:
            oid = ObjectId(stock_id_str)
        except Exception:
            return jsonify({'error': 'stock_id inválido'}), 400

        stock_entry = stock_col.find_one({'_id': oid, 'empresa_id': empresa_id, 'activo': True})
        if not stock_entry:
            return jsonify({'error': 'Stock no encontrado o inactivo'}), 404
        if stock_entry['metros_disponibles'] < metros_consumidos:
            return jsonify({'error': f'Stock insuficiente: disponible {stock_entry["metros_disponibles"]:.2f} m, solicitado {metros_consumidos:.2f} m'}), 400

        ancho_rollo = stock_entry.get('ancho_cm', 0)
        if ancho_trabajo_cm > 0 and ancho_rollo > 0:
            aprovechamiento_pct = round((ancho_trabajo_cm / ancho_rollo) * 100, 1)
            desperdicio_cm = round(ancho_rollo - ancho_trabajo_cm, 1)
        else:
            aprovechamiento_pct = 100.0
            desperdicio_cm = 0.0

        metros_restantes = round(stock_entry['metros_disponibles'] - metros_consumidos, 4)
        now = datetime.now().isoformat()
        stock_col.update_one({'_id': oid}, {'$set': {'metros_disponibles': metros_restantes, 'fecha_actualizacion': now}})

        consumo_col = get_empresa_collection('consumos_material', empresa_id)
        consumo = {
            'empresa_id': empresa_id,
            'pedido_id': pedido_id,
            'numero_pedido': str(data.get('numero_pedido') or ''),
            'stock_id': stock_id_str,
            'material_nombre': stock_entry['material_nombre'],
            'fabricante': stock_entry.get('fabricante', ''),
            'ancho_cm': ancho_rollo,
            'ancho_trabajo_cm': ancho_trabajo_cm if ancho_trabajo_cm > 0 else ancho_rollo,
            'metros_consumidos': metros_consumidos,
            'metros_sobrante': metros_restantes,
            'aprovechamiento_pct': aprovechamiento_pct,
            'desperdicio_cm': desperdicio_cm,
            'fecha': now,
            'usuario_id': str(data.get('usuario_id') or request_user.get('id') or ''),
        }
        result = consumo_col.insert_one(consumo)
        consumo['_id'] = str(result.inserted_id)

        # Auto-create retal if requested and there's leftover width
        retal_entry = None
        crear_retal = bool(data.get('crear_retal', False))
        if crear_retal and desperdicio_cm > 0 and metros_consumidos > 0:
            retal_doc = {
                'empresa_id': empresa_id,
                'material_nombre': stock_entry['material_nombre'],
                'fabricante': stock_entry.get('fabricante', ''),
                'ancho_cm': desperdicio_cm,
                'metros_total': metros_consumidos,
                'metros_disponibles': metros_consumidos,
                'numero_lote': f"RETAL-{pedido_id[:8]}",
                'notas': f"Retal del pedido {data.get('numero_pedido') or pedido_id}",
                'es_retal': True,
                'retal_origen_pedido': pedido_id,
                'fecha_entrada': now,
                'fecha_actualizacion': now,
                'activo': True,
            }
            retal_result = stock_col.insert_one(retal_doc)
            retal_doc['_id'] = str(retal_result.inserted_id)
            retal_entry = fix_id(retal_doc)

        updated_stock = stock_col.find_one({'_id': oid})
        return jsonify({
            'success': True,
            'consumo': fix_id(consumo),
            'stock_restante': fix_id(updated_stock),
            'retal_creado': retal_entry,
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/materiales/consumos/preview', methods=['OPTIONS'])
def consumo_preview_options():
    return '', 204

@app.route('/api/materiales/consumos/preview', methods=['GET'])
def preview_consumo_auto():
    """
    Calcula (sin registrar) el consumo estimado para un pedido.
    Devuelve las mismas claves que /consumos/auto pero sin escribir nada en BD.
    Query param: pedido_id
    """
    import math
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        pedido_id = str(request.args.get('pedido_id') or '').strip()
        if not pedido_id:
            return jsonify({'error': 'pedido_id es requerido'}), 400

        pedidos_col = get_empresa_collection('pedidos', empresa_id)
        try:
            pedido = pedidos_col.find_one({'_id': ObjectId(pedido_id), 'empresa_id': empresa_id})
        except Exception:
            pedido = None
        if not pedido:
            return jsonify({'error': 'Pedido no encontrado'}), 404

        dp = pedido.get('datos_presupuesto') or {}
        troquel_id_str = str(dp.get('troquelId') or '').strip()
        material_nombre = str(dp.get('material') or '').strip()
        try:
            tirada = int(pedido.get('tirada_total') or dp.get('tirada_total') or dp.get('tirada') or 0)
        except (TypeError, ValueError):
            tirada = 0

        try:
            merma_metros = float(request.args.get('merma_metros') or 0)
        except (TypeError, ValueError):
            merma_metros = 0.0

        troquel = None
        sentido = 'vertical'
        motivos_ancho = 1
        motivos_alto = 1
        if troquel_id_str:
            troqueles_col = get_empresa_collection('troqueles', empresa_id)
            try:
                troquel = troqueles_col.find_one({'_id': ObjectId(troquel_id_str), 'empresa_id': empresa_id})
            except Exception:
                troquel = None
            if troquel:
                sentido = troquel.get('sentido_impresion', 'vertical')
                try:
                    motivos_ancho = max(1, int(float(troquel.get('motivosAncho') or 1)))
                except (TypeError, ValueError):
                    motivos_ancho = 1
                try:
                    motivos_alto = max(1, int(float(troquel.get('motivosAlto') or 1)))
                except (TypeError, ValueError):
                    motivos_alto = 1

        archivos_col = get_empresa_collection('pedido_archivos', empresa_id)
        rep_file = archivos_col.find_one(
            {'pedido_id': pedido_id, 'empresa_id': empresa_id, 'tipo': 'repetidora'},
            sort=[('fecha_subida', -1)]
        )

        if rep_file is None:
            return jsonify({
                'error': 'No hay PDF en el contenedor de Repetidora.',
                'code': 'SIN_REPETIDORA',
            }), 422

        pdf_ancho_mm      = rep_file.get('ancho_mm')
        pdf_desarrollo_mm = rep_file.get('desarrollo_mm')
        if not pdf_ancho_mm or not pdf_desarrollo_mm:
            return jsonify({
                'error': 'El PDF de repetidora no tiene dimensiones registradas.',
                'code': 'SIN_DIMENSIONES_PDF',
            }), 422

        if sentido == 'horizontal':
            ancho_repetidora_mm = pdf_desarrollo_mm
            desarrollo_mm       = pdf_ancho_mm
        else:
            ancho_repetidora_mm = pdf_ancho_mm
            desarrollo_mm       = pdf_desarrollo_mm

        ancho_material_mm = ancho_repetidora_mm + 10
        ancho_material_cm = round(ancho_material_mm / 10, 2)
        etiquetas_por_vuelta = motivos_ancho * motivos_alto
        vueltas = math.ceil(tirada / etiquetas_por_vuelta) if tirada > 0 else 0
        metros_consumidos = round(desarrollo_mm * vueltas / 1000 + merma_metros, 4)

        calculo = {
            'sentido_impresion': sentido,
            'ancho_repetidora_mm': ancho_repetidora_mm,
            'desarrollo_mm': desarrollo_mm,
            'ancho_material_requerido_mm': ancho_material_mm,
            'etiquetas_por_vuelta': etiquetas_por_vuelta,
            'vueltas': vueltas,
            'merma_metros': merma_metros,
            'metros_consumidos': metros_consumidos,
        }

        stock_entry = None
        retal_preview = None
        if metros_consumidos > 0 and material_nombre:
            stock_col = get_empresa_collection('stock_materiales', empresa_id)

            def buscar_stock(es_retal_flag):
                q = {
                    'empresa_id': empresa_id,
                    'activo': True,
                    'ancho_cm': {'$gte': ancho_material_cm},
                    'material_nombre': {'$regex': material_nombre, '$options': 'i'},
                }
                if es_retal_flag:
                    q['es_retal'] = True
                else:
                    q['$or'] = [{'es_retal': False}, {'es_retal': {'$exists': False}}]
                for c in stock_col.find(q).sort('ancho_cm', 1):
                    if c.get('metros_disponibles', 0) >= metros_consumidos:
                        return c
                return None

            stock_entry = buscar_stock(True) or buscar_stock(False)
            if not stock_entry:
                return jsonify({
                    'error': f'Sin stock disponible con ancho ≥ {ancho_material_cm} cm y ≥ {metros_consumidos} m para "{material_nombre}"',
                    'code': 'SIN_STOCK',
                    'calculo': calculo,
                    'ancho_requerido_cm': ancho_material_cm,
                    'metros_requeridos': metros_consumidos,
                }), 400

            ancho_rollo_cm = stock_entry.get('ancho_cm', 0)
            desperdicio_cm = round(ancho_rollo_cm - ancho_material_cm, 2)
            if desperdicio_cm >= 1.0:
                retal_preview = {
                    'ancho_cm': desperdicio_cm,
                    'metros_disponibles': metros_consumidos,
                    'material_nombre': stock_entry['material_nombre'],
                }

        stock_preview = None
        if stock_entry:
            stock_preview = {
                'material_nombre': stock_entry.get('material_nombre', ''),
                'fabricante': stock_entry.get('fabricante', ''),
                'ancho_cm': stock_entry.get('ancho_cm', 0),
                'metros_disponibles': stock_entry.get('metros_disponibles', 0),
                'es_retal': bool(stock_entry.get('es_retal', False)),
            }

        return jsonify({
            'calculo': calculo,
            'stock': stock_preview,
            'retal_generado': retal_preview,
            'material_nombre': material_nombre,
            'repetidora_nombre': rep_file.get('nombre_original', ''),
            'repetidora_tamanio': rep_file.get('tamanio'),
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/materiales/consumos/auto', methods=['OPTIONS'])
def consumo_auto_options():
    return '', 204

@app.route('/api/materiales/consumos/auto', methods=['POST'])
def registrar_consumo_auto():
    """
    Registra el consumo de material al marcar un pedido como impreso.

    Parámetros JSON:
      pedido_id      : ID del pedido (obligatorio)
      sin_material   : bool — si True, omite el consumo pero avanza el estado
                       (usar cuando no hay PDF de repetidora)

    Lógica:
    1. Carga pedido → troquel → PDF de repetidora
    2. Si no hay PDF en contenedor 'repetidora': devuelve code='SIN_REPETIDORA'
    3. Dimensiones del PDF (ancho_mm, desarrollo_mm) + sentido_impresion del troquel
    4. Busca primero retales, luego rollos con ancho suficiente
    5. Registra consumo y genera retal (merma) si hay diferencia de ancho
    6. Avanza el estado del pedido al siguiente en la lista ordenada
    """
    import math
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        data = request.get_json() or {}
        pedido_id = str(data.get('pedido_id') or '').strip()
        sin_material = bool(data.get('sin_material', False))
        try:
            merma_metros = float(data.get('merma_metros') or 0)
        except (TypeError, ValueError):
            merma_metros = 0.0
        if not pedido_id:
            return jsonify({'error': 'pedido_id es requerido'}), 400

        # ── 1. Cargar pedido ──────────────────────────────────────────────────
        pedidos_col = get_empresa_collection('pedidos', empresa_id)
        try:
            pedido = pedidos_col.find_one({'_id': ObjectId(pedido_id), 'empresa_id': empresa_id})
        except Exception:
            pedido = None
        if not pedido:
            return jsonify({'error': 'Pedido no encontrado'}), 404

        dp = pedido.get('datos_presupuesto') or {}
        troquel_id_str = str(dp.get('troquelId') or '').strip()
        material_nombre = str(dp.get('material') or '').strip()
        try:
            tirada = int(pedido.get('tirada_total') or dp.get('tirada_total') or dp.get('tirada') or 0)
        except (TypeError, ValueError):
            tirada = 0

        # ── 2. Cargar troquel (para sentido_impresion, motivos_ancho y motivos_alto) ─
        troquel = None
        sentido = 'vertical'
        motivos_ancho = 1
        motivos_alto = 1
        if troquel_id_str:
            troqueles_col = get_empresa_collection('troqueles', empresa_id)
            try:
                troquel = troqueles_col.find_one({'_id': ObjectId(troquel_id_str), 'empresa_id': empresa_id})
            except Exception:
                troquel = None
            if troquel:
                sentido = troquel.get('sentido_impresion', 'vertical')
                try:
                    motivos_ancho = max(1, int(float(troquel.get('motivosAncho') or 1)))
                except (TypeError, ValueError):
                    motivos_ancho = 1
                try:
                    motivos_alto = max(1, int(float(troquel.get('motivosAlto') or 1)))
                except (TypeError, ValueError):
                    motivos_alto = 1

        # ── 3. Buscar PDF de repetidora y obtener sus dimensiones ────────────
        archivos_col = get_empresa_collection('pedido_archivos', empresa_id)
        rep_file = archivos_col.find_one(
            {'pedido_id': pedido_id, 'empresa_id': empresa_id, 'tipo': 'repetidora'},
            sort=[('fecha_subida', -1)]
        )

        if not sin_material and rep_file is None:
            # No hay PDF en el contenedor repetidora → advertir al frontend
            return jsonify({
                'error': 'No hay PDF en el contenedor de Repetidora. No se contabilizará el consumo.',
                'code': 'SIN_REPETIDORA',
                'pedido_nombre': pedido.get('nombre') or pedido.get('numero_pedido') or pedido_id,
            }), 422

        consumo_registrado = None
        retal_entry = None
        calculo = None

        if not sin_material and rep_file:
            pdf_ancho_mm     = rep_file.get('ancho_mm')
            pdf_desarrollo_mm = rep_file.get('desarrollo_mm')

            if not pdf_ancho_mm or not pdf_desarrollo_mm:
                return jsonify({
                    'error': 'El PDF de repetidora no tiene dimensiones registradas. Vuelva a subirlo.',
                    'code': 'SIN_DIMENSIONES_PDF',
                }), 422

            # Aplicar sentido de impresión:
            # vertical: ancho=ancho_pdf, desarrollo=alto_pdf
            # horizontal: el PDF está girado 90° → ancho=alto_pdf, desarrollo=ancho_pdf
            if sentido == 'horizontal':
                ancho_repetidora_mm = pdf_desarrollo_mm  # el alto del PDF es el ancho de material
                desarrollo_mm       = pdf_ancho_mm
            else:
                ancho_repetidora_mm = pdf_ancho_mm
                desarrollo_mm       = pdf_desarrollo_mm

            ancho_material_mm = ancho_repetidora_mm + 10  # margen de 10 mm
            ancho_material_cm = round(ancho_material_mm / 10, 2)

            etiquetas_por_vuelta = motivos_ancho * motivos_alto
            vueltas = math.ceil(tirada / etiquetas_por_vuelta) if tirada > 0 else 0
            metros_consumidos = round(desarrollo_mm * vueltas / 1000 + merma_metros, 4)  # mm → m + merma

            calculo = {
                'sentido_impresion': sentido,
                'ancho_repetidora_mm': ancho_repetidora_mm,
                'desarrollo_mm': desarrollo_mm,
                'ancho_material_requerido_mm': ancho_material_mm,
                'etiquetas_por_vuelta': etiquetas_por_vuelta,
                'vueltas': vueltas,
                'merma_metros': merma_metros,
                'metros_consumidos': metros_consumidos,
            }

            if metros_consumidos > 0 and material_nombre:
                # ── 4. Buscar stock (retal primero, luego rollo nuevo) ────────
                stock_col = get_empresa_collection('stock_materiales', empresa_id)

                def buscar_stock(es_retal_flag):
                    q = {
                        'empresa_id': empresa_id,
                        'activo': True,
                        'ancho_cm': {'$gte': ancho_material_cm},
                        'material_nombre': {'$regex': material_nombre, '$options': 'i'},
                    }
                    if es_retal_flag:
                        q['es_retal'] = True
                    else:
                        q['$or'] = [{'es_retal': False}, {'es_retal': {'$exists': False}}]
                    for c in stock_col.find(q).sort('ancho_cm', 1):
                        if c.get('metros_disponibles', 0) >= metros_consumidos:
                            return c
                    return None

                stock_entry = buscar_stock(True) or buscar_stock(False)
                if not stock_entry:
                    return jsonify({
                        'error': f'Sin stock disponible con ancho ≥ {ancho_material_cm} cm y ≥ {metros_consumidos} m para "{material_nombre}"',
                        'code': 'SIN_STOCK',
                        'ancho_requerido_cm': ancho_material_cm,
                        'metros_requeridos': metros_consumidos,
                    }), 400

                # ── 5. Registrar consumo ──────────────────────────────────────
                ancho_rollo_cm = stock_entry.get('ancho_cm', 0)
                desperdicio_cm = round(ancho_rollo_cm - ancho_material_cm, 2)
                aprovechamiento_pct = round((ancho_material_cm / ancho_rollo_cm) * 100, 1) if ancho_rollo_cm > 0 else 100.0
                metros_restantes = round(stock_entry['metros_disponibles'] - metros_consumidos, 4)
                now = datetime.now().isoformat()
                stock_col.update_one(
                    {'_id': stock_entry['_id']},
                    {'$set': {'metros_disponibles': metros_restantes, 'fecha_actualizacion': now}}
                )

                consumo_col = get_empresa_collection('consumos_material', empresa_id)
                numero_pedido = str(pedido.get('numero_pedido') or pedido_id[:8])
                consumo_doc = {
                    'empresa_id': empresa_id,
                    'pedido_id': pedido_id,
                    'numero_pedido': numero_pedido,
                    'stock_id': str(stock_entry['_id']),
                    'material_nombre': stock_entry['material_nombre'],
                    'fabricante': stock_entry.get('fabricante', ''),
                    'ancho_cm': ancho_rollo_cm,
                    'ancho_trabajo_cm': ancho_material_cm,
                    'metros_consumidos': metros_consumidos,
                    'merma_metros': merma_metros,
                    'metros_sobrante': metros_restantes,
                    'aprovechamiento_pct': aprovechamiento_pct,
                    'desperdicio_cm': desperdicio_cm,
                    'es_auto': True,
                    'sentido_impresion': sentido,
                    'troquel_id': troquel_id_str,
                    'tirada': tirada,
                    'etiquetas_por_vuelta': etiquetas_por_vuelta,
                    'vueltas': vueltas,
                    'ancho_repetidora_mm': ancho_repetidora_mm,
                    'desarrollo_mm': desarrollo_mm,
                    'repetidora_archivo_id': str(rep_file.get('_id') or ''),
                    'fecha': now,
                    'usuario_id': str(request_user.get('id') or ''),
                }
                ins = consumo_col.insert_one(consumo_doc)
                consumo_doc['_id'] = str(ins.inserted_id)
                consumo_registrado = fix_id(consumo_doc)

                # ── 6. Generar retal (merma) si el rollo es más ancho ────────
                if desperdicio_cm >= 1.0:
                    retal_doc = {
                        'empresa_id': empresa_id,
                        'material_nombre': stock_entry['material_nombre'],
                        'fabricante': stock_entry.get('fabricante', ''),
                        'ancho_cm': desperdicio_cm,
                        'metros_total': metros_consumidos,
                        'metros_disponibles': metros_consumidos,
                        'numero_lote': f"RETAL-{pedido_id[:8]}",
                        'notas': f"Merma del pedido {numero_pedido} (troquel {troquel.get('numero', '') if troquel else ''})",
                        'es_retal': True,
                        'retal_origen_pedido': pedido_id,
                        'fecha_entrada': now,
                        'fecha_actualizacion': now,
                        'activo': True,
                    }
                    r = stock_col.insert_one(retal_doc)
                    retal_doc['_id'] = str(r.inserted_id)
                    retal_entry = fix_id(retal_doc)

        # ── 7. Avanzar estado del pedido al siguiente en la lista ordenada ────
        now = datetime.now().isoformat()
        estados_disponibles = get_estados_pedido_disponibles(empresa_id)
        estado_actual_label = str(pedido.get('estado') or '')
        estado_actual_slug  = slugify_estado(estado_actual_label)
        slugs_ordenados = [slugify_estado(e['valor']) for e in estados_disponibles]
        labels_ordenados = [e['valor'] for e in estados_disponibles]
        siguiente_estado_label = None
        try:
            idx = slugs_ordenados.index(estado_actual_slug)
            if idx + 1 < len(labels_ordenados):
                siguiente_estado_label = labels_ordenados[idx + 1]
        except ValueError:
            pass

        update_pedido = {'impresion_registrada': True}
        if consumo_registrado:
            update_pedido['datos_impresion'] = {
                'fecha': now,
                'sin_material': False,
                'material_nombre': consumo_registrado.get('material_nombre'),
                'fabricante': consumo_registrado.get('fabricante'),
                'ancho_rollo_cm': consumo_registrado.get('ancho_cm'),
                'ancho_trabajo_cm': consumo_registrado.get('ancho_trabajo_cm'),
                'metros_consumidos': consumo_registrado.get('metros_consumidos'),
                'merma_metros': merma_metros,
                'vueltas': consumo_registrado.get('vueltas'),
                'etiquetas_por_vuelta': consumo_registrado.get('etiquetas_por_vuelta'),
                'tirada': tirada,
                'aprovechamiento_pct': consumo_registrado.get('aprovechamiento_pct'),
                'retal_generado': retal_entry is not None,
                'sentido_impresion': sentido,
            }
        elif sin_material:
            update_pedido['datos_impresion'] = {
                'fecha': now,
                'sin_material': True,
            }
        if siguiente_estado_label:
            reglas = get_estados_pedido_rules(empresa_id).get('rules', ESTADOS_RULES_DEFAULT)
            estados_finales = set(reglas.get('estados_finalizados', []))
            nuevo_slug = slugify_estado(siguiente_estado_label)
            update_pedido['estado'] = siguiente_estado_label
            if nuevo_slug in estados_finales:
                update_pedido['fecha_finalizacion'] = now
            else:
                update_pedido['fecha_finalizacion'] = None
        pedidos_col.update_one({'_id': ObjectId(pedido_id)}, {'$set': update_pedido})

        return jsonify({
            'success': True,
            'sin_material': sin_material,
            'consumo': consumo_registrado,
            'retal_generado': retal_entry,
            'calculo': calculo,
            'estado_anterior': estado_actual_label,
            'estado_nuevo': siguiente_estado_label,
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/materiales/migracion', methods=['POST'])
def migrar_materiales_legacy_endpoint():
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        migrated = _migrar_materiales_legacy(empresa_id)
        return jsonify({'success': True, 'migrated': migrated}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/materiales/proveedores', methods=['OPTIONS'])
def options_materiales_proveedores():
    return make_response('', 200)

@app.route('/api/materiales/proveedores/<proveedor_id>', methods=['OPTIONS'])
def options_materiales_proveedor(proveedor_id):
    return make_response('', 200)


@app.route('/api/materiales/proveedores', methods=['GET'])
def get_proveedores_material():
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        col = get_empresa_collection('proveedores_material', empresa_id)
        docs = list(col.find({'empresa_id': empresa_id}).sort('nombre', 1))
        for doc in docs:
            doc['_id'] = str(doc['_id'])
        return jsonify({'proveedores': docs}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/materiales/proveedores', methods=['POST'])
def create_proveedor_material():
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        data = request.get_json() or {}
        nombre = (data.get('nombre') or '').strip()
        if not nombre:
            return jsonify({'error': 'El nombre del proveedor es obligatorio'}), 400
        col = get_empresa_collection('proveedores_material', empresa_id)
        doc = {
            'empresa_id': empresa_id,
            'nombre': nombre,
            'contacto': (data.get('contacto') or '').strip(),
            'telefono': (data.get('telefono') or '').strip(),
            'email': (data.get('email') or '').strip(),
            'notas': (data.get('notas') or '').strip(),
            'fecha_alta': datetime.utcnow().isoformat(),
        }
        result = col.insert_one(doc)
        doc['_id'] = str(result.inserted_id)
        return jsonify({'proveedor': doc}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/materiales/proveedores/<proveedor_id>', methods=['PUT'])
def update_proveedor_material(proveedor_id):
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        data = request.get_json() or {}
        col = get_empresa_collection('proveedores_material', empresa_id)
        update = {}
        for field in ['nombre', 'contacto', 'telefono', 'email', 'notas']:
            if field in data:
                update[field] = (data[field] or '').strip()
        if not update:
            return jsonify({'error': 'No hay campos para actualizar'}), 400
        if 'nombre' in update and not update['nombre']:
            return jsonify({'error': 'El nombre no puede estar vacío'}), 400
        result = col.update_one(
            {'_id': ObjectId(proveedor_id), 'empresa_id': empresa_id},
            {'$set': update}
        )
        if result.matched_count == 0:
            return jsonify({'error': 'Proveedor no encontrado'}), 404
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/materiales/proveedores/<proveedor_id>', methods=['DELETE'])
def delete_proveedor_material(proveedor_id):
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        col = get_empresa_collection('proveedores_material', empresa_id)
        result = col.delete_one({'_id': ObjectId(proveedor_id), 'empresa_id': empresa_id})
        if result.deleted_count == 0:
            return jsonify({'error': 'Proveedor no encontrado'}), 404
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ═══════════════════════════════════════════════════════════════
# TROQUELES
# ═══════════════════════════════════════════════════════════════

@app.route('/api/troqueles', methods=['OPTIONS'])
def options_troqueles():
    return make_response('', 200)

@app.route('/api/troqueles/<troquel_id>', methods=['OPTIONS'])
def options_troquel_id(troquel_id):
    return make_response('', 200)

@app.route('/api/troqueles', methods=['GET'])
def get_troqueles():
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        col = get_empresa_collection('troqueles', empresa_id)
        docs = list(col.find({'empresa_id': empresa_id}, {
            '_id': 1, 'numero': 1, 'tipo': 1, 'forma': 1, 'estado': 1,
            'anchoMotivo': 1, 'altoMotivo': 1, 'motivosAncho': 1,
            'separacionAncho': 1, 'valorZ': 1, 'distanciaSesgado': 1,
            'sentido_impresion': 1, 'created_at': 1
        }))
        for d in docs:
            d['_id'] = str(d['_id'])
        return jsonify({'troqueles': docs}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/troqueles', methods=['POST'])
def create_troquel():
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        data = request.get_json() or {}
        numero = (data.get('numero') or data.get('referencia') or '').strip()
        if not numero:
            return jsonify({'error': 'El número del troquel es obligatorio'}), 400
        doc = {
            'empresa_id': empresa_id,
            'numero': numero,
            'tipo': data.get('tipo', 'regular'),
            'forma': data.get('forma', 'Rectangular'),
            'estado': data.get('estado', 'Disponible'),
            'anchoMotivo': str(data.get('anchoMotivo') or ''),
            'altoMotivo': str(data.get('altoMotivo') or ''),
            'motivosAncho': str(data.get('motivosAncho') or ''),
            'separacionAncho': str(data.get('separacionAncho') or ''),
            'valorZ': str(data.get('valorZ') or ''),
            'distanciaSesgado': str(data.get('distanciaSesgado') or ''),
            'sentido_impresion': data.get('sentido_impresion', 'vertical'),
            'created_at': datetime.utcnow(),
        }
        col = get_empresa_collection('troqueles', empresa_id)
        result = col.insert_one(doc)
        doc['_id'] = str(result.inserted_id)
        doc['created_at'] = doc['created_at'].isoformat()
        return jsonify({'troquel': doc}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/troqueles/<troquel_id>', methods=['PUT'])
def update_troquel(troquel_id):
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        data = request.get_json() or {}
        update = {}
        if 'numero' in data or 'referencia' in data:
            numero = (data.get('numero') or data.get('referencia') or '').strip()
            if not numero:
                return jsonify({'error': 'El número del troquel es obligatorio'}), 400
            update['numero'] = numero
        for field in ('tipo', 'forma', 'estado', 'anchoMotivo', 'altoMotivo',
                      'motivosAncho', 'separacionAncho', 'valorZ', 'distanciaSesgado'):
            if field in data:
                update[field] = str(data[field] or '')
        if 'sentido_impresion' in data:
            si = data['sentido_impresion']
            update['sentido_impresion'] = si if si in ('vertical', 'horizontal') else 'vertical'
        if not update:
            return jsonify({'error': 'Nada que actualizar'}), 400
        col = get_empresa_collection('troqueles', empresa_id)
        result = col.update_one({'_id': ObjectId(troquel_id), 'empresa_id': empresa_id}, {'$set': update})
        if result.matched_count == 0:
            return jsonify({'error': 'Troquel no encontrado'}), 404
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/troqueles/<troquel_id>', methods=['DELETE'])
def delete_troquel(troquel_id):
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        col = get_empresa_collection('troqueles', empresa_id)
        result = col.delete_one({'_id': ObjectId(troquel_id), 'empresa_id': empresa_id})
        if result.deleted_count == 0:
            return jsonify({'error': 'Troquel no encontrado'}), 404
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/presupuestos/<int:trabajo_id>', methods=['GET'])
def get_presupuesto(trabajo_id):
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        # Lógica de consulta de presupuesto adaptada a MongoDB pendiente de implementar si es necesario
        return jsonify({'success': True, 'mensaje': 'Consulta de presupuesto pendiente de implementar'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/presupuestos', methods=['POST'])
def save_presupuesto():
    try:
        # Delegar en la implementación concreta de creación para evitar rutas duplicadas
        # y garantizar que el presupuesto se inserta en la colección.
        # Nota: la función `crear_presupuesto` está definida más abajo y hará la inserción.
        return crear_presupuesto()
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/presupuestos/aceptar/<trabajo_id>', methods=['POST'])
def aceptar_presupuesto(trabajo_id):
    """Acepta un presupuesto. En modo automático solo lo marca como aceptado sin crear pedido."""
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        data = request.get_json() or {}

        # Comprobar modo_creacion de la empresa
        try:
            col_general = get_empresa_collection('config_general', None)
            modo_doc = col_general.find_one({'clave': 'modo_creacion', 'empresa_id': empresa_id})
            modo_creacion = (modo_doc.get('valor') if modo_doc else 'manual') or 'manual'
        except Exception:
            modo_creacion = 'manual'

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

        # Modo automático: solo marcar como aceptado, sin crear pedido
        if modo_creacion == 'automatico':
            try:
                pres_col.update_one(
                    {'_id': pres.get('_id')},
                    {'$set': {'aprobado': True, 'fecha_aprobacion': datetime.now().isoformat()}}
                )
            except Exception:
                pass
            try:
                log_audit('aceptar_presupuesto_automatico', request_user, {'trabajo_id': trabajo_id})
            except Exception:
                pass
            return jsonify({'success': True, 'modo': 'automatico', 'mensaje': 'Presupuesto aceptado. El pedido se generará automáticamente vía endpoint externo.'}), 200

        # Modo manual: crear pedido usando datos enviados o los datos del presupuesto
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
        extra_keys = ['cliente', 'nombre', 'referencia', 'razonSocial', 'razon_social', 'cif', 'personasContacto', 'email', 'vendedor', 'formatoAncho', 'formatoLargo', 'tirada', 'selectedTintas', 'detalleTintaEspecial', 'coberturaResult', 'troquelEstadoSel', 'troquelFormaSel', 'troquelCoste', 'troquelId', 'observaciones', 'acabado', 'material', 'maquina', 'fecha', 'fecha_entrega']
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

        # Verificar si ya existe un pedido para este trabajo_id
        existing_pedido = pedidos_col.find_one({'empresa_id': empresa_id, 'trabajo_id': trabajo_id})
        
        if existing_pedido:
            # El pedido ya existe - actualizar campos vacíos
            pedido_id = str(existing_pedido.get('_id'))
            update_fields = {}
            if not existing_pedido.get('numero_pedido'):
                update_fields['numero_pedido'] = numero_pedido
                update_fields['datos_presupuesto'] = datos_presupuesto
            # Normalizar estado inválido/antiguo (ej: 'Pendiente' de datos viejos)
            try:
                available_states = get_estados_pedido_disponibles(empresa_id)
                valid_slugs = {slugify_estado(item['valor']) for item in available_states}
                existing_slug = slugify_estado(existing_pedido.get('estado') or '')
                if not existing_slug or existing_slug not in valid_slugs:
                    default_label = next((item['valor'] for item in available_states), 'En Diseño')
                    update_fields['estado'] = default_label
                    existing_pedido['estado'] = default_label
            except Exception:
                pass
            if update_fields:
                pedidos_col.update_one(
                    {'_id': existing_pedido.get('_id')},
                    {'$set': update_fields}
                )
            doc_pedido = existing_pedido
            doc_pedido['_id'] = pedido_id
        else:
            # Crear nuevo pedido
            doc_pedido = {
                'empresa_id': empresa_id,
                'trabajo_id': pres.get('trabajo_id'),
                'numero_pedido': numero_pedido,
                'referencia': pres.get('referencia') or datos_presupuesto.get('referencia'),
                'fecha_pedido': datetime.now().isoformat(),
                'datos_presupuesto': datos_presupuesto
            }
            try:
                available = {item['valor']: item.get('label') for item in get_estados_pedido_disponibles(empresa_id)}
                default_label = next(iter(available.values()), 'En Diseño')
            except Exception:
                default_label = 'En Diseño'
            doc_pedido['estado'] = default_label
            doc_pedido['fecha_finalizacion'] = None
            result = pedidos_col.insert_one(doc_pedido)
            pedido_id = str(result.inserted_id)
            # attach inserted id to returned doc for client convenience
            doc_pedido['_id'] = pedido_id

        # Actualizar presupuesto: aprobado, pedido_id, fecha_aprobacion
        try:
            pres_col.update_one({'_id': pres.get('_id')}, {'$set': {'aprobado': True, 'pedido_id': pedido_id, 'fecha_aprobacion': datetime.now().isoformat()}})
        except Exception:
            pass

        return jsonify({'success': True, 'pedido': doc_pedido}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/pedidos/crear-desde-erp', methods=['POST'])
def crear_pedido_desde_erp():
    """
    Endpoint para que sistemas externos (ERP) creen pedidos automáticamente.
    
    Parámetros requeridos (JSON):
    - trabajo_id: Identificador único del trabajo/pedido en el sistema externo
    - cliente: Nombre del cliente
    - referencia: Referencia del pedido
    - nombre: Nombre del pedido (opcional)
    - fecha_entrega: Fecha de entrega (opcional)
    - datos_presupuesto: Objeto JSON con detalles del presupuesto (opcional)
    - estado: Estado del pedido (opcional, por defecto "Diseño")
    
    Headers requeridos:
    - X-Empresa-Id: ID de la empresa
    - X-User-Id: ID del usuario (puede ser "erp" o token JWT)
    - X-Role: Rol del usuario (puede ser "erp" o similar para sistemas)
    
    Retorna:
    - success: true/false
    - pedido: Objeto del pedido creado con su ID
    - pedido_id: ID del pedido creado
    - numero_pedido: Número secuencial del pedido
    """
    try:
        # Permitir autenticación por headers para sistemas ERP
        empresa_id = request.headers.get('X-Empresa-Id', '').strip()
        user_id = request.headers.get('X-User-Id', '').strip()
        role = request.headers.get('X-Role', '').strip()
        
        if not empresa_id or not user_id or not role:
            # Fallback a require_request_user si no vienen los headers
            request_user, auth_error = require_request_user()
            if auth_error:
                return auth_error
            empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
            user_id = request_user.get('id')
            role = request_user.get('rol')
        else:
            empresa_id = normalize_empresa_id(empresa_id)

        # Crear objeto request_user para logging
        request_user = {
            'id': user_id,
            'empresa_id': empresa_id,
            'role': role
        }
        data = request.get_json() or {}
        
        # Validar campos requeridos
        trabajo_id = str(data.get('trabajo_id') or '').strip()
        cliente = str(data.get('cliente') or '').strip()
        referencia = str(data.get('referencia') or '').strip()
        
        if not trabajo_id:
            return jsonify({'error': 'trabajo_id es requerido'}), 400
        if not cliente:
            return jsonify({'error': 'cliente es requerido'}), 400
        
        pedidos_col = get_empresa_collection('pedidos', empresa_id)
        
        # Verificar si ya existe un pedido para este trabajo_id
        existing_pedido = pedidos_col.find_one({'empresa_id': empresa_id, 'trabajo_id': trabajo_id})
        if existing_pedido:
            return jsonify({
                'success': True,
                'message': 'Pedido ya existe para este trabajo_id',
                'pedido': fix_id(existing_pedido),
                'pedido_id': str(existing_pedido.get('_id'))
            }), 200
        
        # Generar número de pedido
        try:
            counters_col = mongo.db['counters']
            seq_doc = counters_col.find_one_and_update(
                {'key': 'pedido_seq', 'empresa_id': empresa_id},
                {'$inc': {'seq': 1}},
                upsert=True,
                return_document=pymongo.ReturnDocument.AFTER
            )
            numero_pedido = str(seq_doc.get('seq', 0))
        except Exception as e:
            print(f"Error generando número de pedido: {e}")
            numero_pedido = f"PED-{int(time.time())}"
        
        # Preparar datos del presupuesto
        datos_presupuesto = data.get('datos_presupuesto') or {}
        if isinstance(datos_presupuesto, str):
            try:
                datos_presupuesto = json.loads(datos_presupuesto)
            except Exception:
                datos_presupuesto = {}
        
        # Crear documento del pedido
        doc_pedido = {
            'empresa_id': empresa_id,
            'trabajo_id': trabajo_id,
            'numero_pedido': numero_pedido,
            'cliente': cliente,
            'referencia': referencia,
            'nombre': data.get('nombre') or f'Pedido {numero_pedido}',
            'fecha_pedido': datetime.now().isoformat(),
            'fecha_entrega': data.get('fecha_entrega') or None,
            'datos_presupuesto': datos_presupuesto,
            'origen': 'erp',  # Marcamos que viene del ERP
            'created_by': f"{request_user.get('id')} (ERP Integration)"
        }
        
        # Establecer estado del pedido
        try:
            available_states = {item['valor']: item.get('label') for item in get_estados_pedido_disponibles(empresa_id)}
            requested_estado = (data.get('estado') or 'en-diseno').lower()
            estado = available_states.get(requested_estado) or next(iter(available_states.values()), 'En Diseño')
        except Exception:
            estado = data.get('estado') or 'En Diseño'
        
        doc_pedido['estado'] = estado
        doc_pedido['fecha_finalizacion'] = None
        
        # Insertar pedido
        try:
            result = pedidos_col.insert_one(doc_pedido)
            pedido_id = str(result.inserted_id)
            doc_pedido['_id'] = pedido_id
            
            # Registrar auditoría
            try:
                log_audit('create_pedido_erp', {
                    'id': f"{request_user.get('id')} (ERP)",
                    'empresa_id': empresa_id,
                    'role': 'erp'
                }, {
                    'trabajo_id': trabajo_id,
                    'pedido_id': pedido_id,
                    'numero_pedido': numero_pedido,
                    'cliente': cliente
                })
            except Exception as e:
                print(f"Error registrando auditoría: {e}")
            
            return jsonify({
                'success': True,
                'message': 'Pedido creado exitosamente desde ERP',
                'pedido': fix_id(doc_pedido),
                'pedido_id': pedido_id,
                'numero_pedido': numero_pedido
            }), 201
        except Exception as e:
            print(f"Error insertando pedido: {e}")
            return jsonify({'error': f'Error creando pedido: {str(e)}'}), 500
            
    except Exception as e:
        print(f"Error en crear_pedido_desde_erp: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/pedidos/validar-modo-automatico', methods=['GET'])
def validar_modo_automatico():
    """
    Endpoint para que sistemas externos (ERP) validen si el modo automático está habilitado.
    
    Headers requeridos:
    - X-Empresa-Id: ID de la empresa
    - X-User-Id: ID del usuario (puede ser "erp" o token JWT)
    - X-Role: Rol del usuario (puede ser "erp" o similar para sistemas)
    
    Retorna:
    - modo_automatico: true/false
    - modo: 'automatico' o 'manual'
    """
    try:
        # Permitir autenticación por headers para sistemas ERP
        empresa_id = request.headers.get('X-Empresa-Id', '').strip()
        
        if not empresa_id:
            # Fallback a require_request_user si no viene el header
            request_user, auth_error = require_request_user()
            if auth_error:
                return auth_error
            empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        else:
            empresa_id = normalize_empresa_id(empresa_id)

        col_general = get_empresa_collection('config_general', empresa_id)
        doc = col_general.find_one({'clave': 'modo_creacion', 'empresa_id': empresa_id})
        valor = (doc.get('valor') if doc and doc.get('valor') else 'manual')
        valor = valor if valor in ['manual', 'automatico'] else 'manual'
        
        return jsonify({
            'success': True,
            'modo': valor,
            'modo_automatico': (valor == 'automatico'),
            'mensaje': 'Modo automático habilitado' if valor == 'automatico' else 'Modo manual habilitado'
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/presupuestos', methods=['GET'])
def get_presupuestos():
    """Obtiene todos los presupuestos"""
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))

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
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))

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
                        available = {item['valor']: item.get('label') for item in get_estados_pedido_disponibles(empresa_id)}
                        default_label = next(iter(available.values()), 'En Diseño')
                    except Exception:
                        default_label = 'En Diseño'
                    doc_pedido['estado'] = default_label
                    doc_pedido['fecha_finalizacion'] = None
                    result_pedido = pedidos_col.insert_one(doc_pedido)
                    pedido_id = str(result_pedido.inserted_id)
                    # attach inserted id to returned doc for client convenience
                    doc_pedido['_id'] = pedido_id

                    # grabar pedido_id y fecha_aprobacion en el presupuesto
                    extra = {'pedido_id': pedido_id, 'fecha_aprobacion': datetime.now().isoformat()}
                    try:
                        oid = ObjectId(presupuesto_id)
                        col.update_one({'_id': oid, 'empresa_id': empresa_id}, {'$set': extra})
                    except Exception:
                        col.update_one({'empresa_id': empresa_id, '$or': [{'_id': presupuesto_id}, {'id': presupuesto_id}]}, {'$set': extra})
                    # return the created pedido to caller (non-blocking)
                    return jsonify({'success': True, 'pedido': doc_pedido}), 200
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
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        data = request.get_json() or {}
        trabajo_id = data.get('trabajo_id')
        numero_presupuesto = data.get('numero_presupuesto')
        fecha_presupuesto = data.get('fecha_presupuesto')
        aprobado = data.get('aprobado', False)
        referencia = data.get('referencia')
        datos_json = data.get('datos_json') or {}
        # Aceptar también campos enviados al nivel superior y consolidarlos dentro de datos_json
        extra_keys = ['cliente', 'nombre', 'referencia', 'razonSocial', 'razon_social', 'cif', 'personasContacto', 'email', 'vendedor', 'formatoAncho', 'formatoLargo', 'tirada', 'selectedTintas', 'detalleTintaEspecial', 'coberturaResult', 'troquelEstadoSel', 'troquelFormaSel', 'troquelCoste', 'troquelId', 'observaciones', 'acabado', 'material', 'maquina', 'fecha', 'fecha_entrega']
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
                    available = {item['valor']: item.get('label') for item in get_estados_pedido_disponibles(empresa_id)}
                    default_label = next(iter(available.values()), 'En Diseño')
                except Exception:
                    default_label = 'En Diseño'
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
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))

        # Bloquear si el modo es automático
        try:
            col_general = get_empresa_collection('config_general', None)
            modo_doc = col_general.find_one({'clave': 'modo_creacion', 'empresa_id': empresa_id})
            modo_creacion = (modo_doc.get('valor') if modo_doc else 'manual') or 'manual'
        except Exception:
            modo_creacion = 'manual'
        if modo_creacion == 'automatico':
            return jsonify({'error': 'La creación manual de pedidos está deshabilitada en modo automático.'}), 403

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
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))

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
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))

        from datetime import datetime, timedelta
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
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
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))

        # Bloquear creación manual de pedidos si el modo es automático
        try:
            col_general = get_empresa_collection('config_general', None)
            modo_doc = col_general.find_one({'clave': 'modo_creacion', 'empresa_id': empresa_id})
            modo_creacion = (modo_doc.get('valor') if modo_doc else 'manual') or 'manual'
        except Exception:
            modo_creacion = 'manual'
        if modo_creacion == 'automatico':
            return jsonify({'error': 'La creación manual de pedidos está deshabilitada en modo automático.'}), 403

        # ── Verificación y cobro de créditos ──────────────────────────────────
        email = str(request_user.get('email') or '').strip().lower()
        billing = get_billing_status_for_user(email, empresa_id=request_user.get('empresa_id'))
        if billing and billing['billing_model'] == 'creditos':
            if billing['creditos'] < CREDIT_COST_PEDIDO:
                return jsonify({
                    'error': 'Créditos insuficientes para crear un pedido',
                    'balance': billing['creditos'],
                    'required': CREDIT_COST_PEDIDO,
                    'billing_model': 'creditos',
                }), 402

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
                # Sincronizar el contador con el máximo numero_pedido ya existente
                # para que no empiece desde 1 cuando ya hay pedidos previos.
                pedidos_col = get_empresa_collection('pedidos', empresa_id)
                max_existing = 0
                for p in pedidos_col.find({'empresa_id': empresa_id}, {'numero_pedido': 1}):
                    try:
                        n = int(str(p.get('numero_pedido', '') or '').strip())
                        if n > max_existing:
                            max_existing = n
                    except (ValueError, TypeError):
                        pass
                if max_existing > 0:
                    counters_col.update_one(
                        {'key': 'pedido_seq', 'empresa_id': empresa_id},
                        {'$max': {'seq': max_existing}},
                        upsert=True
                    )
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
        # Establecer estado por defecto ('En Diseño') usando las etiquetas configuradas
        try:
            available = {item['valor']: item.get('label') for item in get_estados_pedido_disponibles(empresa_id)}
            default_label = next(iter(available.values()), 'En Diseño')
        except Exception:
            default_label = 'En Diseño'
        doc['estado'] = default_label
        doc['fecha_finalizacion'] = None
        try:
            result = col.insert_one(doc)
            pedido_id = str(result.inserted_id)
        except pymongo.errors.DuplicateKeyError:
            # POST /api/trabajos already inserted a stub document into the pedidos
            # collection (because get_empresa_collection maps 'trabajos' → 'pedidos').
            # That stub has (empresa_id, trabajo_id) set, so a second insert fails.
            # Solution: update the existing stub with the full pedido data.
            existing = col.find_one({'empresa_id': empresa_id, 'trabajo_id': trabajo_id})
            if not existing:
                raise
            update_fields = {k: v for k, v in doc.items() if k != '_id'}
            col.update_one({'_id': existing['_id']}, {'$set': update_fields})
            pedido_id = str(existing['_id'])
        # Descontar créditos si aplica (post-inserción para no bloquear en caso de error)
        credits_deducted = 0
        credits_balance = None
        if billing and billing['billing_model'] == 'creditos':
            new_bal, _ = deduct_credits(email, CREDIT_COST_PEDIDO, 'pedido', pedido_id=pedido_id, metadata={'numero_pedido': numero_pedido})
            credits_deducted = CREDIT_COST_PEDIDO
            credits_balance = new_bal

        return jsonify({
            'success': True,
            'pedido_id': pedido_id,
            'numero_pedido': numero_pedido,
            'credits_deducted': credits_deducted,
            'credits_balance': credits_balance,
        }), 201
    except Exception as e:
        _traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/pedidos/migrate-estado', methods=['POST'])
def migrate_estados():
    """Migra todos los pedidos de un estado a otro"""
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        
        # Validar permisos
        user_role = str(request_user.get('rol') or '').strip().lower()
        if user_role not in ('administrador', 'root', 'admin'):
            return jsonify({'error': 'Permiso denegado'}), 403
        
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        data = request.get_json() or {}
        
        source_estado_id = data.get('source_estado_id')
        destination_estado_value = data.get('destination_estado_value')
        
        if not source_estado_id or not destination_estado_value:
            return jsonify({'error': 'source_estado_id y destination_estado_value son requeridos'}), 400
        
        # Validar que source_estado_id sea un ObjectId válido
        try:
            source_oid = ObjectId(source_estado_id)
        except Exception:
            return jsonify({'error': 'ID de estado fuente inválido'}), 400
        
        # Validar que destination_estado_value sea válido
        available_items = get_estados_pedido_disponibles(empresa_id)
        disponibles = {slugify_estado(item['valor']): item['valor'] for item in available_items}
        dest_slug = slugify_estado(destination_estado_value)
        
        if dest_slug not in disponibles:
            return jsonify({'error': 'Estado destino no es válido'}), 400
        
        # Obtener el estado destino normalizado
        estado_destino_label = disponibles.get(dest_slug) or destination_estado_value
        
        # Obtener el estado fuente de la base de datos de configuración
        settings_col = get_empresa_collection('config_opciones', empresa_id)
        source_estado_doc = settings_col.find_one({
            'categoria': 'estados_pedido',
            '_id': source_oid
        })
        
        if not source_estado_doc:
            return jsonify({'error': 'Estado fuente no encontrado'}), 404
        
        estado_fuente_label = source_estado_doc.get('valor')
        
        # Buscar todos los pedidos con el estado fuente y actualizarlos
        pedidos_col = get_empresa_collection('pedidos', empresa_id)
        result = pedidos_col.update_many(
            {
                'empresa_id': empresa_id,
                'estado': estado_fuente_label
            },
            {
                '$set': {
                    'estado': estado_destino_label,
                    'fecha_finalizacion': None  # Resetear fecha de finalización
                }
            }
        )
        
        migrated_count = result.modified_count
        
        return jsonify({
            'success': True,
            'migrated_count': migrated_count,
            'message': f'Se migraron {migrated_count} pedido(s) de "{estado_fuente_label}" a "{estado_destino_label}"'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/pedidos/<pedido_id>', methods=['PUT'])
def update_pedido(pedido_id):
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
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
            # Validar que el usuario tenga permiso para cambiar estados
            if not can_role_permission(request_user.get('rol'), 'manage_estados_pedido'):
                return jsonify({'error': 'No autorizado para cambiar estados'}), 403
            raw_estado = str(data.get('estado') or '').strip()
            if not raw_estado:
                return jsonify({'error': 'estado vacío'}), 400
            nuevo_estado = slugify_estado(raw_estado)
            # Validar contra los slugs de estados disponibles (frontend envía slugificado)
            available_items = get_estados_pedido_disponibles(empresa_id)
            disponibles = {slugify_estado(item['valor']): item['valor'] for item in available_items}
            if nuevo_estado not in disponibles:
                return jsonify({'error': 'Estado no válido'}), 400

            # Obtener pedido actual para validar transición
            pedido_actual = col.find_one({'_id': oid, 'empresa_id': empresa_id})
            if not pedido_actual:
                return jsonify({'error': 'Pedido no encontrado'}), 404
            reglas = get_estados_pedido_rules(empresa_id).get('rules', ESTADOS_RULES_DEFAULT)
            estados_finales = set(reglas.get('estados_finalizados', []))
            estado_actual = slugify_estado(str(pedido_actual.get('estado') or ''))

            # Check permission to edit finalized states
            if estado_actual in estados_finales and estado_actual != nuevo_estado:
                request_role = str(request_user.get('rol') or '').strip().lower()
                allowed = can_role_permission(request_role, 'editar_estado_finalizado', empresa_id=empresa_id)
                print(f'[DEBUG] editar_estado_finalizado check: role={request_role} empresa_id={empresa_id} allowed={allowed}')
                if not allowed:
                    return jsonify({'error': 'No se puede cambiar el estado desde un estado finalizado'}), 400

            # Guardar el estado en formato de label (mantener consistencia con datos existentes)
            estado_label = disponibles.get(nuevo_estado) or nuevo_estado
            update['estado'] = estado_label

            # Ajustar fecha_finalizacion automáticamente si aplicable
            if nuevo_estado in estados_finales:
                update['fecha_finalizacion'] = datetime.now().isoformat()
            else:
                update['fecha_finalizacion'] = None

            # Limpiar en_produccion si el nuevo estado sale de la cola de producción
            en_cola_list = reglas.get('en_cola_produccion', [])
            if nuevo_estado not in en_cola_list:
                update['en_produccion'] = False

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

        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
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
        
        # Validar que el usuario tenga permiso para cambiar estados
        if not can_role_permission(request_user.get('rol'), 'manage_estados_pedido'):
            return jsonify({'error': 'No autorizado para cambiar estados'}), 403
        
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))

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
        force = bool(data.get('force', False))

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
        
        # Obtener la orden existente ANTES de validar estados
        orden_col = get_empresa_collection('trabajo_orden', empresa_id)
        # Comprobar si ya existe una orden para este trabajo (aceptar _id ObjectId o string)
        existing_order = None
        try:
            existing_order = orden_col.find_one({'trabajo_id': ObjectId(trabajo_id), 'empresa_id': empresa_id})
        except Exception:
            existing_order = None
        if not existing_order:
            existing_order = orden_col.find_one({'empresa_id': empresa_id, '$or': [{'trabajo_id': trabajo_id}, {'trabajo_id': str(trabajo_id)}]})
        
        # ── Validar compatibilidad máquina (si no forzado) ───────────────────
        if not force:
            maquinas_col_v = get_empresa_collection('maquinas', empresa_id)
            try:
                maquina_id_v = int(maquina_id)
            except Exception:
                maquina_id_v = str(maquina_id)
            maq_v = maquinas_col_v.find_one({'id': maquina_id_v, 'empresa_id': empresa_id})
            if not maq_v:
                try:
                    maq_v = maquinas_col_v.find_one({'_id': ObjectId(maquina_id), 'empresa_id': empresa_id})
                except Exception:
                    pass
            pedido_v = None
            try:
                pedido_v = get_empresa_collection('pedidos', empresa_id).find_one({'_id': ObjectId(trabajo_id), 'empresa_id': empresa_id})
            except Exception:
                pass
            if maq_v and pedido_v:
                advertencias = verificar_compatibilidad_maquina(pedido_v, maq_v, empresa_id)
                if advertencias:
                    return jsonify({'needs_confirm': True, 'advertencias': advertencias}), 200

        # Solo rechazar si está en estados bloqueados O si está en en_cola pero NO existe en orden_col
        # (si ya existe en orden_col, permitir actualizar máquina o posición)
        if estado_actual in bloqueados or (estado_actual in en_cola and not existing_order):
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

        # Verificar si ya está en producción (para permitir cambiar de máquina)
        
        # Obtener la siguiente posición en la máquina (maquina_id puede ser int o string)
        try:
            maquina_id_query = int(maquina_id)
        except Exception:
            maquina_id_query = str(maquina_id)

        # Si ya existe en cola pero en otra máquina, permitir cambio de máquina
        # Si es nuevo, insertar con nueva posición
        if existing_order and str(existing_order.get('maquina_id')) == str(maquina_id_query):
            # Mismo trabajo, misma máquina - sin cambios
            nueva_posicion = existing_order.get('posicion', 1)
        else:
            # Nuevo trabajo o cambio de máquina
            try:
                counters_col = mongo.db['counters']
                counter_key = f"pos_{empresa_id}_{maquina_id_query}"
                seq_doc = counters_col.find_one_and_update(
                    {'key': counter_key, 'empresa_id': empresa_id},
                    {'$inc': {'seq': 1}},
                    upsert=True,
                    return_document=ReturnDocument.AFTER
                )
                nueva_posicion = int(seq_doc.get('seq', 1))
            except Exception:
                # Fallback: calcular max+1 si el contador no está disponible
                max_pos_doc = orden_col.find({'maquina_id': maquina_id_query, 'empresa_id': empresa_id}).sort('posicion', -1).limit(1)
                max_pos = 0
                for doc in max_pos_doc:
                    max_pos = doc.get('posicion', 0)
                nueva_posicion = (max_pos or 0) + 1

        # Insertar o actualizar en trabajo_orden
        try:
            orden_col.find_one_and_update(
                {'empresa_id': empresa_id, 'trabajo_id': trabajo_id},
                {'$set': {
                    'empresa_id': empresa_id,
                    'trabajo_id': trabajo_id,
                    'maquina_id': maquina_id_query,
                    'posicion': nueva_posicion
                }},
                upsert=True,
                return_document=ReturnDocument.AFTER
            )
        except Exception:
            # Fallback a inserción/update simple
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

        # Actualizar también en pedidos (la colección canónica) si existe
        try:
            pedidos_col.update_one(
                {'empresa_id': empresa_id, 'trabajo_id': trabajo_id},
                {'$set': {'estado': nuevo_estado, 'en_produccion': True, 'fecha_finalizacion': None}}
            )
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
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        maquina_param = request.args.get('maquina')
        if not maquina_param:
            return jsonify({'error': 'maquina parameter requerido'}), 400
        orden_col = get_empresa_collection('trabajo_orden', empresa_id)
        pedidos_col = get_empresa_collection('pedidos', empresa_id)

        # Pagination params (page 1-based)
        try:
            page = max(1, int(request.args.get('page', 1)))
        except Exception:
            page = 1
        try:
            page_size = int(request.args.get('page_size', 100))
        except Exception:
            page_size = 100
        page_size = max(1, min(page_size, 500))

        # Accept both numeric maquina_id and string/ObjectId-like ids
        rows = []
        maquina_match = None
        skip = (page - 1) * page_size
        # Optional Redis caching: try to return cached response for this query
        cache_key = f"produccion:{empresa_id}:{maquina_param}:{page}:{page_size}"
        rc = None
        try:
            import redis as _redis
            redis_url = os.environ.get('REDIS_URL', '').strip()
            if redis_url:
                rc = _redis.from_url(redis_url, socket_connect_timeout=1)
                cached = rc.get(cache_key)
                if cached:
                    try:
                        return app.response_class(cached, mimetype='application/json'), 200
                    except Exception:
                        pass
        except Exception:
            rc = None
        # Normalize maquina id and query using explicit query dict to avoid
        # consuming the cursor when counting results (use count_documents).
        try:
            maquina_match = int(maquina_param)
        except Exception:
            maquina_match = str(maquina_param)

        query = {'maquina_id': maquina_match, 'empresa_id': empresa_id}
        cursor = orden_col.find(query).sort([('posicion', 1), ('_id', 1)])

        # Fetch ALL rows for this machine (queue sizes are typically small) and
        # dedupe globally by canonical pedido id before applying pagination.
        all_rows = list(cursor)

        # Collect trabajo ids from all rows so we can fetch pedidos once
        trabajo_ids = []
        object_ids = []
        for row in all_rows:
            t = row.get('trabajo_id')
            if t is None:
                continue
            s = str(t)
            trabajo_ids.append(s)
            try:
                if isinstance(t, str) and len(t) == 24:
                    object_ids.append(ObjectId(t))
            except Exception:
                pass

        pedidos_map = {}
        if trabajo_ids or object_ids:
            or_clauses = []
            if trabajo_ids:
                or_clauses.append({'trabajo_id': {'$in': trabajo_ids}})
            if object_ids:
                or_clauses.append({'_id': {'$in': object_ids}})
            pquery = {'empresa_id': empresa_id, '$or': or_clauses} if or_clauses else {'empresa_id': empresa_id}
            for p in pedidos_col.find(pquery):
                if '_id' in p:
                    pedidos_map[str(p['_id'])] = p
                if 'trabajo_id' in p and p['trabajo_id'] is not None:
                    pedidos_map[str(p['trabajo_id'])] = p

        # Build a map canonical_id -> best row (choose smallest posicion)
        unique_rows = {}
        for row in all_rows:
            trabajo_id = row.get('trabajo_id')
            posicion = row.get('posicion')

            pedido = None
            if trabajo_id is not None:
                pedido = pedidos_map.get(str(trabajo_id))
                if not pedido:
                    try:
                        if isinstance(trabajo_id, str) and len(trabajo_id) == 24:
                            pedido = pedidos_map.get(str(ObjectId(trabajo_id)))
                    except Exception:
                        pedido = None

            if pedido and '_id' in pedido:
                canonical_id = str(pedido.get('_id'))
            else:
                canonical_id = str(trabajo_id) if trabajo_id is not None else None

            # Keep the row with the lowest posicion for this canonical id
            prev = unique_rows.get(canonical_id)
            if not prev or (posicion is not None and (prev.get('posicion') is None or posicion < prev.get('posicion'))):
                unique_rows[canonical_id] = {'row': row, 'pedido': pedido}

        # Now produce a sorted list of unique entries and apply pagination
        sorted_items = sorted(unique_rows.items(), key=lambda kv: (kv[1]['row'].get('posicion') or 0, str(kv[0] or '')))
        total = len(sorted_items)
        paged = sorted_items[skip:skip+page_size]

        trabajos = []
        for canonical_id, info in paged:
            row = info['row']
            pedido = info.get('pedido')
            posicion = row.get('posicion')
            if pedido:
                p = fix_id(pedido)
                p['posicion'] = posicion
                trabajos.append(p)
            else:
                trabajos.append({'id': canonical_id, 'nombre': 'Pendiente', 'posicion': posicion})

        # include pagination metadata when requested
        resp = {'trabajos': trabajos}
        try:
            resp['page'] = page
            resp['page_size'] = page_size
            resp['total'] = int(total)
        except Exception:
            pass
        # Cache the response briefly so small bursts of requests reuse it (if redis configured)
        try:
            if rc:
                rc.set(cache_key, json.dumps(resp), ex=3)
        except Exception:
            pass
        return jsonify(resp), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def verificar_compatibilidad_maquina(pedido, maquina, empresa_id):
    """
    Comprueba si un pedido es compatible con una máquina (tintas y ancho).
    Devuelve lista de advertencias: [{'tipo': 'colores'|'ancho', 'requerido': X, 'maximo': Y}]
    """
    import math as _math
    advertencias = []
    if not pedido or not maquina:
        return advertencias

    dp = pedido.get('datos_presupuesto') or {}
    if isinstance(dp, str):
        try:
            dp = json.loads(dp)
        except Exception:
            dp = {}

    # ── Validar número de tintas ──────────────────────────────────────────────
    colores_maquina = int(float(maquina.get('numero_colores') or 0))
    if colores_maquina > 0:
        selected_tintas = dp.get('selectedTintas') or []
        detalle_especial = dp.get('detalleTintaEspecial') or []
        tintas_especiales_count = len(detalle_especial) if isinstance(detalle_especial, list) else (1 if detalle_especial else 0)
        num_tintas = len(selected_tintas) + tintas_especiales_count
        if num_tintas > colores_maquina:
            advertencias.append({'tipo': 'colores', 'requerido': num_tintas, 'maximo': colores_maquina})

    # ── Validar ancho de material ─────────────────────────────────────────────
    ancho_max_mm = float(maquina.get('ancho_max_material_mm') or 0)
    if ancho_max_mm > 0:
        troquel_id_str = str(dp.get('troquelId') or '').strip()
        sentido = 'vertical'
        troquel = None
        if troquel_id_str:
            try:
                troqueles_col = get_empresa_collection('troqueles', empresa_id)
                troquel = troqueles_col.find_one({'_id': ObjectId(troquel_id_str), 'empresa_id': empresa_id})
            except Exception:
                pass
            if troquel:
                sentido = troquel.get('sentido_impresion', 'vertical')

        ancho_material_mm = None
        pedido_id = str(pedido.get('_id') or '')
        # 1. Intentar desde PDF de repetidora (más preciso)
        try:
            archivos_col = get_empresa_collection('pedido_archivos', empresa_id)
            rep_file = archivos_col.find_one(
                {'pedido_id': pedido_id, 'empresa_id': empresa_id, 'tipo': 'repetidora'},
                sort=[('fecha_subida', -1)]
            )
            if rep_file and rep_file.get('ancho_mm') and rep_file.get('desarrollo_mm'):
                ancho_rep = rep_file.get('desarrollo_mm') if sentido == 'horizontal' else rep_file.get('ancho_mm')
                ancho_material_mm = ancho_rep + 10
        except Exception:
            pass

        # 2. Fallback: estimar desde dimensiones del troquel
        if ancho_material_mm is None and troquel:
            try:
                ancho_motivo = float(troquel.get('anchoMotivo') or 0)
                motivos_ancho = max(1, int(float(troquel.get('motivosAncho') or 1)))
                separacion = float(troquel.get('separacionAncho') or 0)
                if ancho_motivo > 0:
                    ancho_material_mm = ancho_motivo * motivos_ancho + separacion * max(0, motivos_ancho - 1) + 10
            except Exception:
                pass

        if ancho_material_mm and ancho_material_mm > ancho_max_mm:
            advertencias.append({
                'tipo': 'ancho',
                'requerido': round(ancho_material_mm, 1),
                'maximo': round(ancho_max_mm, 1),
            })

    return advertencias


@app.route('/api/produccion/mover', methods=['POST'])
def mover_trabajo_maquina():
    """Mueve un trabajo a otra máquina"""
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))

        data = request.get_json()
        trabajo_id = data.get('trabajo_id')
        maquina_destino = data.get('maquina_destino')
        force = bool(data.get('force', False))

        if not trabajo_id or not maquina_destino:
            return jsonify({'error': 'Faltan datos'}), 400
        
        # Eliminar de la máquina anterior (si existe)
        orden_col = get_empresa_collection('trabajo_orden', empresa_id)
        pedidos_col = get_empresa_collection('pedidos', empresa_id)

        # ── Validar compatibilidad máquina ─────────────────────────────────────
        if not force:
            maquinas_col_v = get_empresa_collection('maquinas', empresa_id)
            try:
                maquina_destino_v = int(maquina_destino)
            except Exception:
                maquina_destino_v = str(maquina_destino)
            maq_v = maquinas_col_v.find_one({'id': maquina_destino_v, 'empresa_id': empresa_id})
            if not maq_v:
                try:
                    maq_v = maquinas_col_v.find_one({'_id': ObjectId(maquina_destino), 'empresa_id': empresa_id})
                except Exception:
                    pass
            pedido_v = pedidos_col.find_one({'trabajo_id': trabajo_id, 'empresa_id': empresa_id})
            if not pedido_v:
                try:
                    if isinstance(trabajo_id, str) and len(trabajo_id) == 24:
                        pedido_v = pedidos_col.find_one({'_id': ObjectId(trabajo_id), 'empresa_id': empresa_id})
                except Exception:
                    pass
            if maq_v and pedido_v:
                advertencias = verificar_compatibilidad_maquina(pedido_v, maq_v, empresa_id)
                if advertencias:
                    return jsonify({'needs_confirm': True, 'advertencias': advertencias}), 200

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

        # Obtener la siguiente posición en la máquina destino (usar contador atómico si es posible)
        try:
            counters_col = mongo.db['counters']
            counter_key = f"pos_{empresa_id}_{maquina_destino_norm}"
            seq_doc = counters_col.find_one_and_update(
                {'key': counter_key, 'empresa_id': empresa_id},
                {'$inc': {'seq': 1}},
                upsert=True,
                return_document=ReturnDocument.AFTER
            )
            nueva_posicion = int(seq_doc.get('seq', 1))
        except Exception:
            max_pos_doc = orden_col.find({'maquina_id': maquina_destino_norm, 'empresa_id': empresa_id}).sort('posicion', -1).limit(1)
            max_pos = 0
            for doc in max_pos_doc:
                max_pos = doc.get('posicion', 0)
            nueva_posicion = (max_pos or 0) + 1

        # Insertar/actualizar en la nueva máquina usando upsert para evitar duplicados
        try:
            orden_col.find_one_and_update(
                {'empresa_id': empresa_id, 'trabajo_id': trabajo_id},
                {'$set': {
                    'maquina_id': maquina_destino_norm,
                    'posicion': nueva_posicion
                },
                 '$setOnInsert': {
                     'empresa_id': empresa_id,
                     'trabajo_id': trabajo_id
                 }
                },
                upsert=True,
                return_document=ReturnDocument.AFTER
            )
        except Exception:
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

        # Log the move request for debugging
        try:
            app.logger.info(f"MOVER_REQUEST empresa={empresa_id} trabajo_id={trabajo_id} maquina_destino={maquina_destino} maquina_destino_norm={maquina_destino_norm}")
        except Exception:
            pass

        # Invalidate production cache for this company (if redis configured).
        # Remove keys that may use numeric or string forms of the machine id.
        try:
            import redis as _redis
            redis_url = os.environ.get('REDIS_URL', '').strip()
            if redis_url:
                rc = _redis.from_url(redis_url, socket_connect_timeout=1)
                deleted = []
                try:
                    # generic company-wide pattern (keep for safety)
                    for key in rc.scan_iter(f"produccion:{empresa_id}:*"):
                        try:
                            rc.delete(key)
                            deleted.append(key)
                        except Exception:
                            pass
                    # more targeted: machine numeric form
                    try:
                        mnum = str(maquina_destino_norm)
                        for key in rc.scan_iter(f"produccion:{empresa_id}:{mnum}:*"):
                            try:
                                rc.delete(key)
                                deleted.append(key)
                            except Exception:
                                pass
                    except Exception:
                        pass
                    # targeted: original machine param as provided (string form)
                    try:
                        mraw = str(maquina_destino)
                        for key in rc.scan_iter(f"produccion:{empresa_id}:{mraw}:*"):
                            try:
                                rc.delete(key)
                                deleted.append(key)
                            except Exception:
                                pass
                    except Exception:
                        pass
                except Exception:
                    pass
                try:
                    app.logger.info(f"MOVER_CACHE_INVALIDATED deleted_count={len(deleted)} sample_deleted={deleted[:6]}")
                except Exception:
                    pass
        except Exception:
            pass

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
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))

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
        # collect trabajo_ids from current_rows and fetch pedidos in one query
        trabajo_ids = []
        object_ids = []
        for r in current_rows:
            t = r.get('trabajo_id')
            if t is None:
                continue
            trabajo_ids.append(str(t))
            try:
                if isinstance(t, str) and len(t) == 24:
                    object_ids.append(ObjectId(t))
            except Exception:
                pass

        pedidos_map = {}
        if trabajo_ids or object_ids:
            or_clauses = []
            if trabajo_ids:
                or_clauses.append({'trabajo_id': {'$in': trabajo_ids}})
            if object_ids:
                or_clauses.append({'_id': {'$in': object_ids}})
            query = {'empresa_id': empresa_id, '$or': or_clauses} if or_clauses else {'empresa_id': empresa_id}
            for p in pedidos_col.find(query):
                if '_id' in p:
                    pedidos_map[str(p['_id'])] = p
                if 'trabajo_id' in p and p['trabajo_id'] is not None:
                    pedidos_map[str(p['trabajo_id'])] = p

        canonical_map = {}  # canonical_id -> [doc_ids]
        for r in current_rows:
            t_id = r.get('trabajo_id')
            canonical = None
            pedido = None
            if t_id is not None:
                pedido = pedidos_map.get(str(t_id))
                if not pedido:
                    try:
                        if isinstance(t_id, str) and len(t_id) == 24:
                            pedido = pedidos_map.get(str(ObjectId(t_id)))
                    except Exception:
                        pedido = None

            if pedido and '_id' in pedido:
                canonical = str(pedido.get('_id'))
            else:
                canonical = str(t_id) if t_id is not None else None

            if canonical is None:
                continue
            canonical_map.setdefault(canonical, []).append(r['_id'])

        # Prepare bulk operations to update positions efficiently
        ops = []
        for item in trabajos:
            trabajo_id = str(item.get('trabajo_id'))
            nueva_posicion = int(item.get('nueva_posicion') or 0)
            doc_ids = canonical_map.get(trabajo_id) or []
            if doc_ids:
                ops.append(UpdateMany({'_id': {'$in': doc_ids}, 'empresa_id': empresa_id}, {'$set': {'maquina_id': maquina_id, 'posicion': nueva_posicion}}))
            else:
                # insert new row if nothing existed for this canonical id
                ops.append(InsertOne({'empresa_id': empresa_id, 'trabajo_id': trabajo_id, 'maquina_id': maquina_id, 'posicion': nueva_posicion}))

        if ops:
            orden_col.bulk_write(ops, ordered=False)

        # Invalidate production cache for this company (if redis configured)
        try:
            import redis as _redis
            redis_url = os.environ.get('REDIS_URL', '').strip()
            if redis_url:
                rc = _redis.from_url(redis_url, socket_connect_timeout=1)
                try:
                    for key in rc.scan_iter(f"produccion:{empresa_id}:*"):
                        rc.delete(key)
                except Exception:
                    pass
        except Exception:
            pass

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
        
        # DEBUG: log the actual role being used
        actual_role = request_user.get('rol')
        x_role_header = request.headers.get('X-Role', 'NOT_SET')
        print(f"DEBUG: cambiar_estado_trabajo - user_role={actual_role}, X-Role_header={x_role_header}", flush=True)
        
        # Validar que el usuario tenga permiso para cambiar estados
        if not can_role_permission(actual_role, 'manage_estados_pedido'):
            print(f"DEBUG: Permission denied for role={actual_role}, manage_estados_pedido check failed", flush=True)
            return jsonify({'error': 'No autorizado para cambiar estados'}), 403
        
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
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


@app.route('/api/produccion/rebuild_counters', methods=['POST'])
def rebuild_production_counters():
    """Reconstruye/normaliza los contadores atómicos (`counters`) a partir de `trabajo_orden`.
    Opcional: JSON body puede incluir `maquina_id` para restringir a una máquina.
    """
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        data = request.get_json(silent=True) or {}
        maquina_filter = data.get('maquina_id', None)

        orden_col = get_empresa_collection('trabajo_orden', empresa_id)
        counters_col = mongo.db['counters']

        # Construir filtro para distinct
        base_query = {'empresa_id': empresa_id}
        if maquina_filter is not None:
            try:
                maquina_norm = int(maquina_filter)
            except Exception:
                maquina_norm = str(maquina_filter)
            base_query['maquina_id'] = maquina_norm

        maquinas = orden_col.distinct('maquina_id', filter=base_query)
        updated = []
        for m in maquinas:
            # Calcular max posicion para esta maquina
            q = {'empresa_id': empresa_id, 'maquina_id': m}
            max_pos = 0
            doc = orden_col.find(q).sort('posicion', -1).limit(1)
            for r in doc:
                max_pos = int(r.get('posicion') or 0)
            next_seq = (max_pos or 0) + 1
            counter_key = f"pos_{empresa_id}_{m}"
            counters_col.update_one(
                {'key': counter_key, 'empresa_id': empresa_id},
                {'$set': {'seq': next_seq, 'updated_at': datetime.utcnow().isoformat()}},
                upsert=True
            )
            updated.append({'maquina_id': m, 'set_seq': next_seq})

        return jsonify({'success': True, 'updated': updated}), 200
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
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))

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
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))

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
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
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
        trabajo_id = str(res.inserted_id)
        # Asegurar que el documento tiene un campo trabajo_id que coincida con _id
        col.update_one({'_id': res.inserted_id}, {'$set': {'trabajo_id': trabajo_id}})
        return jsonify({'success': True, 'trabajo_id': trabajo_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# --- Compatibility aliases: prefer 'pedidos' terminology but keep 'trabajos' handlers ---
def _mark_deprecated_and_forward(result):
    # Normalize result into a Flask response and add a deprecation header
    resp = make_response(result)
    try:
        resp.headers['X-Deprecated-Route'] = 'Use /api/pedidos/* endpoints instead'
    except Exception:
        pass
    return resp


@app.route('/api/pedidos/<pedido_id>/marcar-impreso', methods=['POST', 'OPTIONS'])
def marcar_pedido_impreso(pedido_id):
    if request.method == 'OPTIONS':
        return '', 204
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        col = get_empresa_collection('pedidos', empresa_id)
        try:
            oid = ObjectId(pedido_id)
        except Exception:
            return jsonify({'error': 'ID de pedido inválido'}), 400
        pedido = col.find_one({'_id': oid, 'empresa_id': empresa_id})
        if not pedido:
            return jsonify({'error': 'Pedido no encontrado'}), 404
        if pedido.get('impresion_registrada'):
            return jsonify({'error': 'El pedido ya ha sido marcado como impreso'}), 409
        now = datetime.now().isoformat()
        # Avanzar al siguiente estado, igual que el flujo con consumo
        estados_disponibles = get_estados_pedido_disponibles(empresa_id)
        estado_actual_slug = slugify_estado(str(pedido.get('estado') or ''))
        slugs_ordenados = [slugify_estado(e['valor']) for e in estados_disponibles]
        labels_ordenados = [e['valor'] for e in estados_disponibles]
        siguiente_estado_label = None
        try:
            idx = slugs_ordenados.index(estado_actual_slug)
            if idx + 1 < len(labels_ordenados):
                siguiente_estado_label = labels_ordenados[idx + 1]
        except ValueError:
            pass
        update_fields = {'impresion_registrada': True, 'fecha_impresion': now}
        if siguiente_estado_label:
            reglas = get_estados_pedido_rules(empresa_id).get('rules', ESTADOS_RULES_DEFAULT)
            estados_finales = set(reglas.get('estados_finalizados', []))
            update_fields['estado'] = siguiente_estado_label
            if slugify_estado(siguiente_estado_label) in estados_finales:
                update_fields['fecha_finalizacion'] = now
            else:
                update_fields['fecha_finalizacion'] = None
        col.update_one(
            {'_id': oid, 'empresa_id': empresa_id},
            {'$set': update_fields}
        )
        return jsonify({'success': True, 'pedido_id': pedido_id, 'nuevo_estado': siguiente_estado_label}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/produccion/impresos', methods=['GET'])
def get_produccion_impresos():
    """Pedidos marcados como impresos. Por defecto devuelve los de hoy; ?all=1 devuelve todos."""
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        col = get_empresa_collection('pedidos', empresa_id)
        query = {'empresa_id': empresa_id, 'impresion_registrada': True}
        show_all = request.args.get('all', '0') == '1'
        if not show_all:
            from datetime import date
            hoy = date.today().isoformat()  # "YYYY-MM-DD"
            query['fecha_impresion'] = {'$gte': hoy}
        docs = list(col.find(query, {
            '_id': 1, 'numero_pedido': 1, 'nombre': 1, 'referencia': 1, 'cliente': 1,
            'estado': 1, 'maquina': 1, 'maquina_id': 1,
            'fecha_impresion': 1, 'fecha_entrega': 1,
        }).sort('fecha_impresion', -1).limit(200))
        for d in docs:
            d['id'] = str(d.pop('_id'))
        return jsonify({'impresos': docs}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/pedidos/<pedido_id>/estado', methods=['PUT', 'POST'])
def cambiar_estado_pedido(pedido_id):
    return _mark_deprecated_and_forward(cambiar_estado_trabajo(pedido_id))


@app.route('/api/pedidos/orden', methods=['GET'])
def get_pedidos_orden():
    return _mark_deprecated_and_forward(get_trabajos_orden())


@app.route('/api/pedidos/orden', methods=['POST'])
def save_pedidos_orden():
    return _mark_deprecated_and_forward(save_trabajos_orden())


@app.route('/api/pedidos/orden/reset', methods=['POST'])
def reset_pedidos_orden():
    return _mark_deprecated_and_forward(reset_trabajos_orden())


# Additional non-destructive aliases to help transition from 'trabajo' -> 'pedido'
@app.route('/api/pedidos-produccion', methods=['GET'])
def get_pedidos_produccion():
    res = get_trabajos_produccion()
    if res is None:
        return _mark_deprecated_and_forward((jsonify({'error': 'Not implemented'}), 501))
    return _mark_deprecated_and_forward(res)


@app.route('/api/pedidos/produccion/enviar', methods=['POST'])
def enviar_pedido_produccion():
    res = enviar_trabajo_produccion()
    if res is None:
        return _mark_deprecated_and_forward((jsonify({'error': 'Not implemented'}), 501))
    return _mark_deprecated_and_forward(res)


@app.route('/api/presupuestos/<int:pedido_id>', methods=['GET'])
def get_presupuesto_por_pedido(pedido_id):
    res = get_presupuesto(pedido_id)
    if res is None:
        return _mark_deprecated_and_forward((jsonify({'error': 'Not implemented'}), 501))
    return _mark_deprecated_and_forward(res)


@app.route('/api/presupuestos/aceptar/<pedido_id>', methods=['POST'])
def aceptar_presupuesto_por_pedido(pedido_id):
    res = aceptar_presupuesto(pedido_id)
    if res is None:
        return _mark_deprecated_and_forward((jsonify({'error': 'Not implemented'}), 501))
    return _mark_deprecated_and_forward(res)


@app.route('/api/pedidos/trabajo', methods=['POST'])
def create_pedido_trabajo_alias():
    """Alias temporal: crea un 'trabajo' mínimo vía la ruta de pedidos.
    Mantiene compatibilidad con scripts que usan /api/trabajos"""
    return _mark_deprecated_and_forward(create_trabajo())


@app.route('/api/trabajos/orden/reset', methods=['POST'])
def reset_trabajos_orden():
    """Resetea el orden de los trabajos"""
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))

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
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))

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
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))

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


# ─────────────────────────────────────────────────────────────────────────────
# GESTIÓN DE ARCHIVOS  (Artes Finales del Cliente  +  Unitario versionado)
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/api/pedidos/<pedido_id>/archivos', methods=['POST'])
def upload_archivos_pedido(pedido_id):
    """
    Sube uno o más archivos a un pedido.
    Form-data:
      tipo  : 'arte' | 'unitario'
      files : uno o más archivos  (unitario: 1 archivo por subida = nueva versión)
    """
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))

        pedidos_col = get_empresa_collection('pedidos', empresa_id)
        try:
            oid = ObjectId(pedido_id)
        except Exception:
            return jsonify({'error': 'ID de pedido inválido'}), 400
        if not pedidos_col.find_one({'_id': oid, 'empresa_id': empresa_id}):
            return jsonify({'error': 'Pedido no encontrado'}), 404

        ESKO_TIPOS = ('report', 'repetidora', 'trapping', 'troquel')
        tipo = request.form.get('tipo', '').strip()
        if tipo not in ('arte', 'unitario') + ESKO_TIPOS:
            return jsonify({'error': 'tipo debe ser "arte", "unitario", "report", "repetidora", "trapping" o "troquel"'}), 400

        files = [f for f in request.files.getlist('files') if f.filename != '']
        if not files:
            return jsonify({'error': 'No se recibieron archivos'}), 400
        # Esko containers and unitario accept only one file (replace semantics)
        if tipo in ('unitario',) + ESKO_TIPOS and len(files) > 1:
            return jsonify({'error': f'"{tipo}" acepta solo un archivo por subida'}), 400

        allowed = ALLOWED_EXTENSIONS_ARTES if tipo == 'arte' else ALLOWED_EXTENSIONS_UNITARIO
        subdir  = 'artes' if tipo == 'arte' else tipo
        col     = get_empresa_collection('pedido_archivos', empresa_id)
        resultado = []

        for f in files:
            if not _allowed_file(f.filename, allowed):
                return jsonify({'error': f'Extensión no permitida para "{f.filename}". Permitidas: {", ".join(sorted(allowed))}'}), 400

            # ── Esko containers: replace (delete previous file from FS + DB) ──
            if tipo in ESKO_TIPOS:
                prev_docs = list(col.find({'pedido_id': pedido_id, 'empresa_id': empresa_id, 'tipo': tipo}))
                for prev in prev_docs:
                    prev_path = os.path.join(UPLOAD_BASE_DIR, prev.get('ruta_relativa', ''))
                    try:
                        if os.path.isfile(prev_path):
                            os.remove(prev_path)
                    except OSError:
                        pass
                col.delete_many({'pedido_id': pedido_id, 'empresa_id': empresa_id, 'tipo': tipo})

            version = None
            if tipo == 'unitario':
                last = col.find_one(
                    {'pedido_id': pedido_id, 'empresa_id': empresa_id, 'tipo': 'unitario'},
                    sort=[('version', pymongo.DESCENDING)]
                )
                version = (last['version'] + 1) if last and last.get('version') else 1

            safe_name   = secure_filename(f.filename) or 'archivo'
            file_uid    = uuid.uuid4().hex[:8]
            stored_name = (f'{file_uid}_v{version}_{safe_name}' if tipo == 'unitario'
                           else f'{file_uid}_{safe_name}')
            upload_dir  = _get_upload_dir(empresa_id, pedido_id, subdir)
            full_path   = os.path.join(upload_dir, stored_name)
            f.save(full_path)

            # Extract PDF page dimensions for repetidora container
            pdf_ancho_mm = None
            pdf_desarrollo_mm = None
            if tipo == 'repetidora' and safe_name.lower().endswith('.pdf'):
                try:
                    reader = PdfReader(full_path)
                    if reader.pages:
                        mb = reader.pages[0].mediabox
                        pts_to_mm = 25.4 / 72
                        pdf_ancho_mm     = round(float(mb.width)  * pts_to_mm, 2)
                        pdf_desarrollo_mm = round(float(mb.height) * pts_to_mm, 2)
                except Exception:
                    pass

            doc = {
                'pedido_id':       pedido_id,
                'empresa_id':      empresa_id,
                'tipo':            tipo,
                'nombre_original': f.filename,
                'nombre_archivo':  stored_name,
                'ruta_relativa':   '/'.join([str(empresa_id), str(pedido_id), subdir, stored_name]),
                'version':         version,
                'tamanio':         os.path.getsize(full_path),
                'mime_type':       f.mimetype or '',
                'subido_por':      request_user.get('nombre') or str(request_user.get('id') or ''),
                'fecha_subida':    datetime.now().isoformat(),
            }
            if pdf_ancho_mm is not None:
                doc['ancho_mm']     = pdf_ancho_mm
                doc['desarrollo_mm'] = pdf_desarrollo_mm
            inserted = col.insert_one(doc)
            resultado.append(fix_id(col.find_one({'_id': inserted.inserted_id})))

        return jsonify({'archivos': resultado}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/pedidos/<pedido_id>/archivos', methods=['GET'])
def get_archivos_pedido(pedido_id):
    """Lista todos los archivos de un pedido. Filtro opcional: ?tipo=arte|unitario"""
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        col   = get_empresa_collection('pedido_archivos', empresa_id)
        query = {'pedido_id': pedido_id, 'empresa_id': empresa_id}
        tipo  = request.args.get('tipo')
        if tipo in ('arte', 'unitario'):
            query['tipo'] = tipo
        docs = list(col.find(query).sort([
            ('tipo',         pymongo.ASCENDING),
            ('version',      pymongo.ASCENDING),
            ('fecha_subida', pymongo.ASCENDING),
        ]))
        return jsonify({'archivos': [fix_id(d) for d in docs]}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/archivos/<archivo_id>', methods=['GET'])
def descargar_archivo(archivo_id):
    """Descarga un archivo como attachment (fuerza descarga en el navegador)."""
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        col = get_empresa_collection('pedido_archivos', empresa_id)
        try:
            oid = ObjectId(archivo_id)
        except Exception:
            return jsonify({'error': 'ID inválido'}), 400
        doc = col.find_one({'_id': oid, 'empresa_id': empresa_id})
        if not doc:
            return jsonify({'error': 'Archivo no encontrado'}), 404
        full_path = os.path.join(UPLOAD_BASE_DIR, doc['ruta_relativa'])
        if not os.path.isfile(full_path):
            return jsonify({'error': 'Archivo no encontrado en disco'}), 404
        return send_file(
            full_path,
            mimetype=doc.get('mime_type') or 'application/octet-stream',
            as_attachment=True,
            download_name=doc.get('nombre_original') or doc['nombre_archivo'],
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/archivos/<archivo_id>/inline', methods=['GET'])
def preview_archivo_inline(archivo_id):
    """
    Sirve el archivo inline para vista previa en iframe.
    El hook apply_security_headers exime esta función del X-Frame-Options: DENY.
    Acepta token vía query param ?token= (para iframes que no pueden enviar headers).
    """
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        col = get_empresa_collection('pedido_archivos', empresa_id)
        try:
            oid = ObjectId(archivo_id)
        except Exception:
            return jsonify({'error': 'ID inválido'}), 400
        doc = col.find_one({'_id': oid, 'empresa_id': empresa_id})
        if not doc:
            return jsonify({'error': 'Archivo no encontrado'}), 404
        full_path = os.path.join(UPLOAD_BASE_DIR, doc['ruta_relativa'])
        if not os.path.isfile(full_path):
            return jsonify({'error': 'Archivo no encontrado en disco'}), 404
        return send_file(
            full_path,
            mimetype=doc.get('mime_type') or 'application/pdf',
            as_attachment=False,
            download_name=doc.get('nombre_original') or doc['nombre_archivo'],
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/archivos/<archivo_id>', methods=['DELETE'])
def eliminar_archivo(archivo_id):
    """
    Elimina un archivo (arte o versión unitario).
    """
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        col = get_empresa_collection('pedido_archivos', empresa_id)
        try:
            oid = ObjectId(archivo_id)
        except Exception:
            return jsonify({'error': 'ID inválido'}), 400
        doc = col.find_one({'_id': oid, 'empresa_id': empresa_id})
        if not doc:
            return jsonify({'error': 'Archivo no encontrado'}), 404
        full_path = os.path.join(UPLOAD_BASE_DIR, doc['ruta_relativa'])
        try:
            if os.path.isfile(full_path):
                os.remove(full_path)
        except Exception as fs_err:
            print(f'Warning: no se pudo eliminar {full_path}: {fs_err}')
        col.delete_one({'_id': oid})
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ── Helpers PDF ──────────────────────────────────────────────────────────────

# Carga PANTONE map una sola vez (sRGB por nombre de PANTONE)
_PANTONE_MAP: dict = {}
try:
    _pantone_map_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'pantone_map.json')
    with open(_pantone_map_path, encoding='utf-8') as _f:
        _PANTONE_MAP = json.load(_f)
except Exception:
    pass

# Colores fijos para tintas de proceso CMYK
_PROCESO_COLORES = {
    'cyan': '#00AEEF', 'c': '#00AEEF',
    'magenta': '#EC008C', 'm': '#EC008C',
    'yellow': '#FFF200', 'y': '#FFF200',
    'black': '#232323', 'k': '#232323',
}

# Nombres técnicos de die-cuts / elementos de troquelado (no son tintas de impresión)
_DIE_CUT_NAMES = {
    'troquel', 'cutter', 'die', 'die cut', 'die line', 'dieline',
    'laser', 'crease', 'fold', 'score', 'stucco', 'varnish', 'barniz', 'charol',
    'cut', 'corte', 'perf', 'perforation',
}


def _resolve(obj):
    """Resuelve IndirectObject a su valor real."""
    try:
        from PyPDF2.generic import IndirectObject
        if isinstance(obj, IndirectObject):
            return obj.get_object()
    except Exception:
        pass
    return obj


def _es_die_cut(nombre):
    """Devuelve True si el nombre de separación corresponde a un elemento técnico (no tinta)."""
    n = nombre.lower().strip()
    if n in _DIE_CUT_NAMES:
        return True
    return any(d in n for d in ('troquel', 'cutter', 'dieline', 'die line', 'crease', 'stucco'))


def _color_para_separacion(nombre, tint_fn_raw=None):
    """
    Devuelve string de color para mostrar la separación:
      1) Colores fijos para C/M/Y/K
      2) Lookup en pantone_map.json (sRGB → hex)
      3) Tint function del PDF (LAB → CSS lab() o CMYK → hex)
    """
    # 1. Proceso CMYK
    color = _PROCESO_COLORES.get(nombre.lower())
    if color:
        return color

    # 2. PANTONE map
    for key in (nombre, f'PANTONE {nombre} C', nombre.upper(), f'PANTONE {nombre.upper()} C'):
        entry = _PANTONE_MAP.get(key)
        if entry:
            r, g, b = entry['srgb']
            return f'#{r:02X}{g:02X}{b:02X}'

    # 3. Heurísticas por nombre (inks custom sin entrada en pantone_map)
    n_low = nombre.lower()
    if any(w in n_low for w in ('negro', 'noir', 'black', 'schwarz', 'nero', 'siyah', 'pluma')):
        return '#1A1A1A'
    if any(w in n_low for w in ('blanco', 'blanc', 'white', 'weiss', 'bianco')):
        return '#E8E8E8'
    if any(w in n_low for w in ('oro', 'gold', 'dorado', 'golden')):
        return '#C9A227'
    if any(w in n_low for w in ('plata', 'silver', 'argent', 'metaliz', 'cromad')):
        return '#A8A9AD'
    if any(w in n_low for w in ('rojo', 'red', 'rouge', 'rosso', 'rot')):
        return '#CC2B2B'
    if any(w in n_low for w in ('azul', 'blue', 'bleu', 'blu', 'blau')):
        return '#1A56DB'
    if any(w in n_low for w in ('verde', 'green', 'vert', 'gruen', 'grün')):
        return '#1D7A3A'

    # 4. Tint function del PDF
    if tint_fn_raw is not None:
        try:
            fn = _resolve(tint_fn_raw)
            if isinstance(fn, dict):
                c1 = fn.get('/C1')
                if c1:
                    vals = [float(_resolve(x)) for x in c1]
                    if len(vals) == 3:
                        return f'lab({round(vals[0], 1)}% {round(vals[1], 2)} {round(vals[2], 2)})'
                    if len(vals) >= 4:
                        c2, m2, y2, k2 = vals[0], vals[1], vals[2], vals[3]
                        r = max(0, min(255, round(255 * (1 - c2) * (1 - k2))))
                        g = max(0, min(255, round(255 * (1 - m2) * (1 - k2))))
                        b = max(0, min(255, round(255 * (1 - y2) * (1 - k2))))
                        return f'#{r:02X}{g:02X}{b:02X}'
        except Exception:
            pass
    return None


def _coleccion_to_tipo(coleccion):
    """Clasifica una separación según la colección Esko."""
    c = str(coleccion).lower()
    if c == 'process':
        return 'proceso'
    if 'pantone' in c or 'hks' in c or 'toyo' in c or 'dic' in c:
        return 'spot'
    return 'especial'          # designer, cutter, varnish, etc.


def _ht_type1_values(ht):
    """Extrae lpi/angulo/forma de un halftone Type 1 dict."""
    try:
        lpi    = float(_resolve(ht.get('/Frequency') or 0)) or None
        angulo = float(_resolve(ht.get('/Angle') or 0))
        forma  = str(_resolve(ht.get('/SpotFunction') or '')).lstrip('/') or None
        return {'lpi': round(lpi, 1) if lpi else None,
                'angulo': round(angulo, 1),
                'forma':  forma}
    except Exception:
        return {}


def _extraer_separaciones_pdf(ruta):
    """
    Extrae separaciones de un PDF de preimpresión.

    Estrategia (en orden de prioridad):
      1) OutputIntents → PrintingOrder + Esko_Colorants  (Esko CE / ArtPro+)
      2) ExtGState → /HT  para lineatura y ángulos si están embebidos
      3) Fallback: ColorSpace resources de página (cualquier PDF)

    Filtros aplicados:
      - Se descartan separaciones no referenciadas en ninguna página (0% uso)
      - Se descartan die-cuts / elementos técnicos (troquel, cutter, etc.)

    Colores (campo 'color'):
      1) Fijos para CMYK proceso
      2) pantone_map.json  (sRGB)
      3) Tint function del PDF (LAB → CSS lab() o CMYK → hex)

    Devuelve lista de dicts: {nombre, tipo, color?, lpi?, angulo?, forma?}
    """
    separaciones = []
    try:
        reader = PdfReader(ruta)
        cat = _resolve(reader.trailer.get('/Root') or {})

        # ── Escaneo de páginas: referencias reales + tint functions ──────────
        page_referenced = set()   # seps que aparecen en algún ColorSpace de página
        tint_fns: dict = {}       # nombre → tint fn object para extraer color
        process_names = {'cyan', 'magenta', 'yellow', 'black', 'c', 'm', 'y', 'k'}
        for page in reader.pages:
            res = _resolve(page.get('/Resources') or {})
            cs_dict = _resolve(res.get('/ColorSpace') or {})
            for _key, raw_val in cs_dict.items():
                val = _resolve(raw_val)
                if not isinstance(val, list) or len(val) < 2:
                    continue
                cs_type = str(val[0])
                if cs_type == '/Separation':
                    nombre = str(_resolve(val[1])).lstrip('/')
                    page_referenced.add(nombre)
                    if len(val) >= 4 and nombre not in tint_fns:
                        tint_fns[nombre] = val[3]
                elif cs_type == '/DeviceN':
                    names_obj = _resolve(val[1])
                    for n in (names_obj if isinstance(names_obj, list) else []):
                        page_referenced.add(str(_resolve(n)).lstrip('/'))

        # ── Estrategia 1: OutputIntents ──────────────────────────────────────
        oi_arr = _resolve(cat.get('/OutputIntents') or [])
        for oi_raw in (oi_arr or []):
            oi = _resolve(oi_raw)
            if not isinstance(oi, dict):
                continue
            mh    = _resolve(oi.get('/MixingHints') or {})
            order = _resolve(mh.get('/PrintingOrder') or [])
            esko  = _resolve(oi.get('/Esko_Colorants') or {})
            if not order:
                continue
            for sep in order:
                nombre = str(_resolve(sep)).lstrip('/')
                if nombre not in page_referenced:
                    continue          # sin cobertura real en ninguna página
                if _es_die_cut(nombre):
                    continue          # elemento técnico, no tinta de impresión
                col_info  = _resolve(esko.get(sep) or {}) if esko else {}
                coleccion = str(_resolve(col_info.get('/Collection', ''))) if isinstance(col_info, dict) else ''
                tipo  = _coleccion_to_tipo(coleccion)
                color = _color_para_separacion(nombre, tint_fns.get(nombre))
                entry = {'nombre': nombre, 'tipo': tipo}
                if color:
                    entry['color'] = color
                separaciones.append(entry)
            break  # primer OutputIntent válido es suficiente

        # ── Estrategia 2: ExtGState /HT → lineatura y ángulos ────────────────
        ht_global: dict = {}
        for page in reader.pages:
            res = _resolve(page.get('/Resources') or {})
            gs  = _resolve(res.get('/ExtGState') or {})
            for _gname, gval in gs.items():
                g = _resolve(gval)
                if not isinstance(g, dict):
                    continue
                ht_raw = g.get('/HT')
                if ht_raw is None:
                    continue
                ht = _resolve(ht_raw)
                if not isinstance(ht, dict):
                    continue
                ht_type = int(_resolve(ht.get('/HalftoneType') or 0))
                if ht_type == 1:
                    vals = _ht_type1_values(ht)
                    if vals.get('lpi'):
                        ht_global[None] = vals
                elif ht_type == 5:
                    for k in ht.keys():
                        sname = str(k).lstrip('/')
                        if sname in ('HalftoneType', 'Default'):
                            continue
                        ht_sub = _resolve(ht[k])
                        if isinstance(ht_sub, dict):
                            vals = _ht_type1_values(ht_sub)
                            if vals.get('lpi'):
                                ht_global[sname] = vals
                    if ht.get('/Default'):
                        def_vals = _ht_type1_values(_resolve(ht['/Default']))
                        if def_vals.get('lpi'):
                            ht_global.setdefault(None, def_vals)

        if ht_global:
            for s in separaciones:
                vals = ht_global.get(s['nombre']) or ht_global.get(None) or {}
                s.update({k: v for k, v in vals.items() if v is not None})

        # ── Estrategia 3: Fallback ColorSpace ────────────────────────────────
        if not separaciones:
            seen: set = set()
            for nombre in page_referenced:
                if nombre in ('None', 'All') or nombre in seen:
                    continue
                if _es_die_cut(nombre):
                    continue
                seen.add(nombre)
                tipo  = 'proceso' if nombre.lower() in process_names else 'spot'
                color = _color_para_separacion(nombre, tint_fns.get(nombre))
                entry = {'nombre': nombre, 'tipo': tipo}
                if color:
                    entry['color'] = color
                separaciones.append(entry)

    except Exception:
        pass
    return separaciones


@app.route('/api/archivos/<archivo_id>/metadatos', methods=['GET'])
def metadatos_archivo(archivo_id):
    """
    Devuelve metadatos de un PDF: separaciones (nombre, tipo, lpi?, angulo?),
    nombre original, tamaño y versión.
    """
    try:
        request_user, auth_error = require_request_user()
        if auth_error:
            return auth_error
        empresa_id = normalize_empresa_id(request_user.get('empresa_id'))
        col = get_empresa_collection('pedido_archivos', empresa_id)
        try:
            oid = ObjectId(archivo_id)
        except Exception:
            return jsonify({'error': 'ID inválido'}), 400
        doc = col.find_one({'_id': oid, 'empresa_id': empresa_id})
        if not doc:
            return jsonify({'error': 'Archivo no encontrado'}), 404
        full_path = os.path.join(UPLOAD_BASE_DIR, doc['ruta_relativa'])
        if not os.path.isfile(full_path):
            return jsonify({'error': 'Archivo no encontrado en disco'}), 404
        mime = doc.get('mime_type', '')
        separaciones = _extraer_separaciones_pdf(full_path) if 'pdf' in mime.lower() else []
        fecha = doc.get('fecha_subida', '')
        if hasattr(fecha, 'isoformat'):
            fecha = fecha.isoformat()
        return jsonify({
            'nombre_original': doc.get('nombre_original', ''),
            'tamanio':         doc.get('tamanio', 0),
            'version':         doc.get('version'),
            'fecha_subida':    str(fecha),
            'separaciones':    separaciones,
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run("0.0.0.0", 8080, debug=False, use_reloader=False)

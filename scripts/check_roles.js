const fs = require('fs');
const p = '/tmp/settings_roles.json';
try {
  const raw = fs.readFileSync(p, 'utf8');
  const data = JSON.parse(raw);
  let roles = [];
  if (data && data.settings && Array.isArray(data.settings.roles)) roles = data.settings.roles;
  else if (Array.isArray(data.roles)) roles = data.roles;
  else if (Array.isArray(data.items)) roles = data.items;
  else if (Array.isArray(data)) roles = data;
  const slug = (s) => String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  roles.forEach((r) => {
    const rawVal = (r && r.valor) ? r.valor : (typeof r === 'string' ? r : (r.label || r.key || ''));
    const key = slug(rawVal);
    const internal = !!(r && r.internal);
    console.log(JSON.stringify({ raw: rawVal, key, internal, visible: (!internal && key !== 'root') }));
  });
} catch (e) {
  console.error('ERR', e && e.message);
}

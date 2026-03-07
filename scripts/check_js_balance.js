const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'screens', 'ConfigScreen.js');
const s = fs.readFileSync(file, 'utf8');
const stack = [];
let inSingle = false, inDouble = false, inTpl = false, esc = false;
const pairs = { '{': '}', '(': ')', '[': ']' };
for (let i = 0; i < s.length; i++) {
  const ch = s[i];
  if (esc) { esc = false; continue; }
  if (ch === '\\') { esc = true; continue; }
  if (inSingle) { if (ch === "'") inSingle = false; continue; }
  if (inDouble) { if (ch === '"') inDouble = false; continue; }
  if (inTpl) { if (ch === '`') inTpl = false; continue; }
  if (ch === "'") { inSingle = true; continue; }
  if (ch === '"') { inDouble = true; continue; }
  if (ch === '`') { inTpl = true; continue; }
  if (ch === '{' || ch === '(' || ch === '[') { stack.push({ ch, i }); }
  else if (ch === '}' || ch === ')' || ch === ']') {
    if (stack.length === 0) { console.log('Unmatched closing', ch, 'at', i); process.exit(1); }
    const last = stack.pop();
    const expected = pairs[last.ch];
    if (expected !== ch) { console.log('Mismatched', last.ch, 'opened at', last.i, 'but closed with', ch, 'at', i); process.exit(1); }
  }
}
if (inSingle || inDouble || inTpl) {
  console.log('Unclosed string or template literal', inSingle ? 'single' : inDouble ? 'double' : 'tpl');
}
if (stack.length) {
  console.log('Unclosed tokens at end:', stack.map(x => x.ch + '@' + x.i).join(','));
  // print stack details for debugging
  const s2 = fs.readFileSync(file, 'utf8');
  stack.forEach(it => {
    const idx = it.i;
    const prefix = s2.slice(Math.max(0, idx - 40), idx + 40);
    console.log('STACK ITEM', it.ch, '@', it.i, 'context:\n', prefix);
  });
  process.exit(1);
}
console.log('All tokens balanced');

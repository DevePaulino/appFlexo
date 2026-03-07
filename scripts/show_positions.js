const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'screens', 'ConfigScreen.js');
const s = fs.readFileSync(file, 'utf8');
const positions = [15569, 54212];
const lines = s.split('\n');
let cumulative = 0;
for (const pos of positions) {
  let lineNum = 0; let col = 0; let found = false;
  cumulative = 0;
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (cumulative + ln.length + 1 > pos) {
      lineNum = i + 1;
      col = pos - cumulative + 1;
      found = true;
      const startLine = Math.max(1, lineNum - 4);
      const endLine = Math.min(lines.length, lineNum + 4);
      console.log('\n--- Position ' + pos + ' => line ' + lineNum + ', col ' + col + ' ---');
      for (let j = startLine; j <= endLine; j++) {
        const prefix = (j === lineNum) ? '>>' : '  ';
        console.log(prefix + (' ' + j).slice(-4) + ': ' + lines[j - 1]);
      }
      break;
    }
    cumulative += ln.length + 1;
  }
  if (!found) console.log('Position', pos, 'out of range');
}

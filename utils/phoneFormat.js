// Formats a phone number as the user types.
// Spanish numbers (9 digits, starting with 6/7/8/9) → +34 XXX XXX XXX
// Numbers already prefixed with 34/0034 → +34 XXX XXX XXX
// Other country codes → +CC ... (no grouping applied)

export function formatPhone(input) {
  if (!input && input !== 0) return '';

  // Strip everything except digits
  let digits = String(input).replace(/\D/g, '');

  if (!digits) return '';

  // Normalize 0034 → 34
  if (digits.startsWith('0034')) digits = digits.slice(4);

  // If starts with 34 followed by a Spanish digit (6/7/8/9)
  if (digits.startsWith('34') && digits.length >= 3 && '6789'.includes(digits[2])) {
    return buildSpanish(digits.slice(2));
  }

  // If starts directly with a Spanish local digit
  if ('6789'.includes(digits[0])) {
    return buildSpanish(digits);
  }

  // Fallback: just prepend + and return raw digits (other country codes)
  return '+' + digits;
}

function buildSpanish(local) {
  const d = local.slice(0, 9);
  let result = '+34';
  if (d.length > 0) result += ' ' + d.slice(0, 3);
  if (d.length > 3) result += ' ' + d.slice(3, 6);
  if (d.length > 6) result += ' ' + d.slice(6, 9);
  return result;
}

// Returns true if the string looks like a complete, valid phone number.
export function isValidPhone(value) {
  if (!value) return false;
  const digits = value.replace(/\D/g, '');
  return digits.length >= 9;
}

// Standard email format validation.
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmail(value) {
  return EMAIL_REGEX.test((value || '').trim());
}

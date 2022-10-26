export const PASSWORD_DEFAULTS = {
  minLength: 12,
  minLowercase: 0,
  minUppercase: 0,
  minNumbers: 0,
  minSymbols: 0,
};

export const PASSWORD_LABELS = {
  minLength: (n) => `Must be at least ${plural(n, 'character')}.`,
  minLowercase: (n) =>
    `Must contain at least ${plural(n, 'lowercase character')}.`,
  minUppercase: (n) =>
    `Must contain at least ${plural(n, 'uppercase character')}.`,
  minNumbers: (n) => `Must contain at least ${plural(n, 'number')}.`,
  minSymbols: (n) => `Must contain at least ${plural(n, 'symbol')}.`,
};

function plural(n, str) {
  const s = n === 1 ? '' : 's';
  return `${n} ${str}${s}`;
}

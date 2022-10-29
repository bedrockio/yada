import { getLocalizedTag as l } from './localization';

const LOWER_REG = /[a-z]/g;
const UPPER_REG = /[A-Z]/g;
const NUMBER_REG = /[0-9]/g;
const SYMBOL_REG = /[!@#$%^&*]/g;

export const PASSWORD_DEFAULTS = {
  minLength: 12,
  minLowercase: 0,
  minUppercase: 0,
  minNumbers: 0,
  minSymbols: 0,
};

export function validateLength(expected) {
  return (str = '') => {
    if (str.length < expected) {
      const s = expected === 1 ? '' : 's';
      throw new Error(l`Must be at least ${expected} character${s}.`);
    }
  };
}

export const validateLowercase = validateRegex(
  LOWER_REG,
  (expected, s) => l`Must contain at least ${expected} lowercase character${s}.`
);

export const validateUppercase = validateRegex(
  UPPER_REG,
  (expected, s) => l`Must contain at least ${expected} uppercase character${s}.`
);

export const validateNumbers = validateRegex(
  NUMBER_REG,
  (expected, s) => l`Must contain at least ${expected} number${s}.`
);

export const validateSymbols = validateRegex(
  SYMBOL_REG,
  (expected, s) => l`Must contain at least ${expected} symbol${s}.`
);

function validateRegex(reg, getMessage) {
  return (expected) => {
    return (str = '') => {
      const length = str.match(reg)?.length || 0;
      if (length < expected) {
        const s = expected === 1 ? '' : 's';
        throw new Error(getMessage(expected, s));
      }
    };
  };
}

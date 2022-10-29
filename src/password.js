import { LocalizedError } from './errors';

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
      throw new LocalizedError('Must be at least {length} character{s}.', {
        length: expected,
        s,
      });
    }
  };
}

export const validateLowercase = validateRegex(
  LOWER_REG,
  'Must contain at least {length} lowercase character{s}.'
);

export const validateUppercase = validateRegex(
  UPPER_REG,
  'Must contain at least {length} uppercase character{s}.'
);

export const validateNumbers = validateRegex(
  NUMBER_REG,
  'Must contain at least {length} number{s}.'
);

export const validateSymbols = validateRegex(
  SYMBOL_REG,
  'Must contain at least {length} symbol{s}.'
);

function validateRegex(reg, message) {
  return (expected) => {
    return (str = '') => {
      const length = str.match(reg)?.length || 0;
      if (length < expected) {
        const s = expected === 1 ? '' : 's';
        throw new LocalizedError(message, {
          length: expected,
          s,
        });
      }
    };
  };
}

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
      throw new Error(
        getMessage('{label} must be at least {length} character{s}.', expected)
      );
    }
  };
}

export const validateLowercase = validateRegex(
  LOWER_REG,
  '{label} must contain at least {length} lowercase character{s}.'
);

export const validateUppercase = validateRegex(
  UPPER_REG,
  '{label} must contain at least {length} uppercase character{s}.'
);

export const validateNumbers = validateRegex(
  NUMBER_REG,
  '{label} must contain at least {length} number{s}.'
);

export const validateSymbols = validateRegex(
  SYMBOL_REG,
  '{label} must contain at least {length} symbol{s}.'
);

function validateRegex(reg, msg) {
  return (expected) => {
    return (str = '') => {
      const length = str.match(reg)?.length || 0;
      if (length < expected) {
        throw new Error(getMessage(msg, expected));
      }
    };
  };
}

function getMessage(msg, n) {
  msg = msg.replace(/{length}/, n);
  msg = msg.replace(/{s}/, n === 1 ? '' : 's');
  return msg;
}

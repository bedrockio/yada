import { LocalizedError } from './errors';

const LOWER_REG = /[a-z]/g;
const UPPER_REG = /[A-Z]/g;
const NUMBER_REG = /[0-9]/g;
const SYMBOL_REG = /[!@#$%^&*]/g;

const PASSWORD_DEFAULTS = {
  minLength: 12,
  minLowercase: 0,
  minUppercase: 0,
  minNumbers: 0,
  minSymbols: 0,
};

export function getPasswordOptions(options) {
  options = {
    ...PASSWORD_DEFAULTS,
    ...options,
  };
  return {
    ...options,
    description: generatePasswordDescription(options),
  };
}

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
  'Must contain at least {length} lowercase character{s}.',
);

export const validateUppercase = validateRegex(
  UPPER_REG,
  'Must contain at least {length} uppercase character{s}.',
);

export const validateNumbers = validateRegex(
  NUMBER_REG,
  'Must contain at least {length} number{s}.',
);

export const validateSymbols = validateRegex(
  SYMBOL_REG,
  'Must contain at least {length} symbol{s}.',
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

function generatePasswordDescription(options) {
  const { minLength } = options;
  const contains = generatePasswordContains(options);
  if (minLength) {
    const plural = pluralize(minLength, 'character');
    return `A password of at least ${plural}${contains}.`;
  } else {
    return `A password${contains}.`;
  }
}

function generatePasswordContains(options) {
  const { minLowercase, minUppercase, minNumbers, minSymbols } = options;
  const arr = [];
  if (minLowercase) {
    arr.push(`${minLowercase} lowercase`);
  }
  if (minUppercase) {
    arr.push(`${minUppercase} uppercase`);
  }
  if (minNumbers) {
    arr.push(`${pluralize(minNumbers, 'number')}`);
  }
  if (minSymbols) {
    arr.push(`${pluralize(minSymbols, 'symbol')}`);
  }
  if (arr.length) {
    return ` containing ${and(arr)}`;
  } else {
    return '';
  }
}

function pluralize(n, str) {
  const s = n === 1 ? '' : 's';
  return `${n} ${str}${s}`;
}

function and(arr) {
  if (arr.length <= 2) {
    return arr.join(' and ');
  } else {
    const last = arr.pop();
    const joined = arr.join(', ');
    return `${joined}, and ${last}`;
  }
}

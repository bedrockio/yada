import { isSchemaError } from './errors';
import { localize } from './localization';

export function getFullMessage(error, options) {
  const { delimiter } = options;
  if (error.details) {
    return error.details
      .map((error) => {
        if (isSchemaError(error)) {
          return getFullMessage(error, {
            field: error.field,
            index: error.index,
            ...options,
          });
        } else {
          return error.message;
        }
      })
      .join(delimiter);
  } else {
    return getLabeledMessage(error, options);
  }
}

function getLabeledMessage(error, options) {
  const { field, index } = options;
  const base = getBase(error.message);
  if (field) {
    const msg = `{field} ${downcase(base)}`;
    return localize(msg, {
      field: getFieldLabel(field, options),
    });
  } else if (index != null) {
    const msg = `Element at index "{index}" ${downcase(base)}`;
    return localize(msg, {
      index,
    });
  } else {
    return localize(base);
  }
}

function getFieldLabel(field, options) {
  const { natural } = options;
  if (natural) {
    return naturalize(field);
  } else {
    return `"${field}"`;
  }
}

function getBase(str) {
  if (str === 'Value is required.') {
    return 'is required.';
  } else {
    return str;
  }
}

function naturalize(str) {
  const first = str.slice(0, 1).toUpperCase();
  let rest = str.slice(1);
  rest = rest.replace(/[A-Z]+/, (caps) => {
    return ' ' + caps.toLowerCase();
  });
  rest = rest.replace(/[-_]/g, ' ');
  return first + rest;
}

function downcase(str) {
  return str.slice(0, 1).toLowerCase() + str.slice(1);
}

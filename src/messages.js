import { isSchemaError } from './errors';

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
    const label = getLabel(field, options);
    return `${label} ${base}`;
  } else if (index != null) {
    return `"Element at index ${index}" ${base}`;
  } else {
    return `Value ${base}`;
  }
}

function getLabel(field, options) {
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
    return downcase(str);
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

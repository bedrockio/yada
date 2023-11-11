import { isSchemaError } from './errors';
import { localize } from './localization';

export function getFullMessage(error, options) {
  const { delimiter } = options;
  if (error.details) {
    return error.details
      .map((error) => {
        if (isSchemaError(error)) {
          return getFullMessage(error, {
            ...options,
            path: getInnerPath(error, options),
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

function getInnerPath(error, options) {
  const { type } = error;
  const { path = [] } = options;
  if (type === 'field') {
    return [...path, error.field];
  } else if (type === 'element') {
    return [...path, error.index];
  } else {
    return path;
  }
}

function getLabeledMessage(error, options) {
  const { path = [] } = options;
  const base = getBase(error.message);
  if (path.length) {
    const msg = `{field} ${downcase(base)}`;
    return localize(msg, {
      field: getFieldLabel(options),
    });
  } else {
    return localize(base);
  }
}

function getFieldLabel(options) {
  const { path = [], natural } = options;
  if (natural) {
    return naturalize(path[path.length - 1]);
  } else {
    return `"${path.join('.')}"`;
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

import { localize } from './localization';

export function getFullMessage(error, options) {
  const { delimiter = '\n' } = options;
  if (hasMessage(error)) {
    return getLabeledMessage(error, options);
  } else if (error.details?.length) {
    return error.details
      .map((error) => {
        return getFullMessage(error, {
          ...options,
          path: getInnerPath(error, options),
        });
      })
      .join(delimiter);
  }
}

export function getErrorMessage(error) {
  if (error.getMessage) {
    return error.getMessage();
  } else {
    return error.message;
  }
}

function hasMessage(error) {
  return !!getErrorMessage(error);
}

function getInnerPath(error, options) {
  const { path = [] } = options;
  if (error.field) {
    return [...path, error.field];
  } else if (error.index != null) {
    return [...path, error.index];
  } else {
    return path;
  }
}

function getLabeledMessage(error, options) {
  const { type } = error;
  const { path = [] } = options;
  const base = getBase(error.message);

  let template;
  if (base.includes('{field}')) {
    template = base;
  } else if (canAutoAddField(type, path)) {
    template = `{field} ${downcase(base)}`;
  } else {
    template = error.message;
  }

  if (template) {
    return localize(template, {
      field: getFieldLabel(options),
    });
  } else {
    return localize(base);
  }
}

const DISALLOWED_TYPES = ['field', 'element', 'array', 'custom'];

// Error types that have custom messages should not add the field
// names automatically. Instead the custom messages can include
// the {field} token to allow it to be interpolated if required.
function canAutoAddField(type, path) {
  return type && path.length && !DISALLOWED_TYPES.includes(type);
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

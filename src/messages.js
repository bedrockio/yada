import { localize } from './localization';

export function getFullMessage(error, options) {
  const { delimiter = '\n' } = options;
  if (error.details?.length) {
    return error.details
      .map((error) => {
        return getFullMessage(error, {
          ...options,
          path: getInnerPath(error, options),
        });
      })
      .join(delimiter);
  } else {
    return getLabeledMessage(error, options);
  }
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
  if (type !== 'custom' && path.length) {
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

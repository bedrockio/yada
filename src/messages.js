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
  const { message } = error;
  const { path = [] } = options;

  let template;
  if (message.includes('{field}')) {
    template = message;
  } else if (canAutoAddField(path, message)) {
    if (message === 'Value is required.') {
      template = '{field} is required.';
    } else {
      template = `{field} ${downcase(message)}`;
    }
  } else {
    template = error.message;
  }

  if (template) {
    return localize(template, {
      field: getFieldLabel(options),
    });
  } else {
    return localize(message);
  }
}

const GENERIC_MESSAGE_REG = /^(Must|Value is required\.)/;

// Only "generic" error messages should automatically add the field.
// A custom error message may be "Please verify you are human" which
// is intended to be understood in context and does not benefit from
// the inclusion of the field name.
function canAutoAddField(path, base) {
  return path.length && GENERIC_MESSAGE_REG.test(base);
}

function getFieldLabel(options) {
  const { path = [], natural } = options;
  if (natural) {
    return naturalize(path[path.length - 1]);
  } else {
    return `"${path.join('.')}"`;
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

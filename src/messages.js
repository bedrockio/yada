import { isSchemaError } from './errors';

export function getFullMessage(error, options) {
  const { delimiter } = options;
  if (error.details) {
    return error.details
      .map((error) => {
        return isSchemaError(error)
          ? getFullMessage(error, options)
          : error.message;
      })
      .join(delimiter);
  } else {
    return getLabeledMessage(error);
  }
}

function getLabeledMessage(error) {
  const base = downcase(error.message);
  if (error.type === 'field') {
    return `"${error.field}" ${base}`;
  } else if (error.type === 'element') {
    return `"Element at index ${error.index}" ${base}`;
  } else {
    return `Value ${base}`;
  }
}

function downcase(str) {
  return str.slice(0, 1).toLowerCase() + str.slice(1);
}

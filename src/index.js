import array from './array';
import boolean from './boolean';
import date from './date';
import number from './number';
import object from './object';
import string from './string';

import Schema from './Schema';
import { isSchema, isSchemaError } from './utils';
import { useLocalizer, getLocalizedMessages } from './localization';
import { LocalizedError } from './errors';

function any() {
  return new Schema();
}

function allow(...args) {
  return new Schema().allow(...args);
}

function reject(...args) {
  return new Schema().reject(...args);
}

/**
 * @param {import("./Schema").CustomSignature} args
 */
function custom(...args) {
  return new Schema().custom(...args);
}

export {
  array,
  boolean,
  date,
  number,
  object,
  string,
  any,
  allow,
  reject,
  custom,
  isSchema,
  isSchemaError,
  useLocalizer,
  getLocalizedMessages,
  LocalizedError,
};

export default {
  array,
  boolean,
  date,
  number,
  object,
  string,
  any,
  allow,
  reject,
  custom,
  isSchema,
  isSchemaError,
  useLocalizer,
  getLocalizedMessages,
  LocalizedError,
};

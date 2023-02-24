import string from './string';
import number from './number';
import boolean from './boolean';
import date from './date';
import object from './object';
import array from './array';
import tuple from './tuple';

import Schema from './Schema';
import { isSchema, isSchemaError } from './utils';
import { useLocalizer, getLocalizedMessages } from './localization';
import { LocalizedError } from './errors';

/**
 * Accepts anything.
 */
function any() {
  return new Schema();
}

/**
 * Accept values or schemas. [Link](https://github.com/bedrockio/yada#allow)
 */
function allow(...args) {
  return new Schema().allow(...args);
}

/**
 * Reject values or schemas. [Link](https://github.com/bedrockio/yada#reject)
 */
function reject(...args) {
  return new Schema().reject(...args);
}

/**
 * Validate by a custom function. [Link](https://github.com/bedrockio/yada#custom)
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
  tuple,
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
  tuple,
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

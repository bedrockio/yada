import Schema from './Schema';
import { isSchema } from './Schema';
import array from './array';
import boolean from './boolean';
import date from './date';
import { LocalizedError } from './errors';
import { isSchemaError } from './errors';
import { getLocalizedMessages, useLocalizer } from './localization';
import number from './number';
import object from './object';
import string from './string';
import tuple from './tuple';

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
 * @param {Function} fn
 */
function custom(fn) {
  return new Schema().custom(fn);
}

export {
  LocalizedError,
  allow,
  any,
  array,
  boolean,
  custom,
  date,
  getLocalizedMessages,
  isSchema,
  isSchemaError,
  number,
  object,
  reject,
  string,
  tuple,
  useLocalizer,
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

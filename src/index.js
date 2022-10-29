import array from './array';
import boolean from './boolean';
import date from './date';
import number from './number';
import object from './object';
import string from './string';

import { wrapArgs, wrapAny, isSchema, isSchemaError } from './utils';
import { useLocalizer, getLocalizerTemplates } from './localization';

const allow = wrapArgs('allow');
const reject = wrapArgs('reject');
const custom = wrapArgs('custom');
const any = wrapAny();

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
  getLocalizerTemplates,
};

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
};

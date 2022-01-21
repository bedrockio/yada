import { wrapSchema, wrapArgs } from './utils';
import { isSchema } from './Schema';

import StringSchema from './StringSchema';
import NumberSchema from './NumberSchema';
import BooleanSchema from './BooleanSchema';
import DateSchema from './DateSchema';
import ArraySchema from './ArraySchema';
import ObjectSchema from './ObjectSchema';

export default {
  string: wrapSchema(StringSchema),
  number: wrapSchema(NumberSchema),
  date: wrapSchema(DateSchema),
  array: wrapSchema(ArraySchema),
  object: wrapSchema(ObjectSchema),
  boolean: wrapSchema(BooleanSchema),
  allow: wrapArgs('allow'),
  reject: wrapArgs('reject'),
  custom: wrapArgs('custom'),
  default: wrapArgs('default'),
  isSchema,
};

export { isSchema };

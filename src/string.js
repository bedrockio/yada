import validator from 'validator';

import TypeSchema from './TypeSchema';
import { wrapSchema } from './utils';

class StringSchema extends TypeSchema {
  constructor() {
    super(String);
  }

  min(length) {
    return this.clone().assert('length', (str) => {
      if (str && str.length < length) {
        throw new Error(`{label} must be ${length} characters or more.`);
      }
    });
  }

  max(length) {
    return this.clone().assert('length', (str) => {
      if (str && str.length > length) {
        throw new Error(`{label} must be ${length} characters or less.`);
      }
    });
  }

  matches(reg) {
    if (!(reg instanceof RegExp)) {
      throw new Error('Argument must be a regular expression');
    }
    return this.clone().assert('regex', (str) => {
      if (str && !reg.test(str)) {
        throw new Error(`{label} must match pattern ${reg}.`);
      }
    });
  }

  email() {
    return this.clone().assert('email', (str) => {
      if (!validator.isEmail(str)) {
        throw new Error('{label} has incorrect email format.');
      }
    });
  }

  trim() {
    return this.clone().transform((str) => {
      return str.trim();
    });
  }
}

export default wrapSchema(StringSchema);

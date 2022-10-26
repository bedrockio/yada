import TypeSchema from './TypeSchema';
import { wrapSchema } from './utils';

class NumberSchema extends TypeSchema {
  constructor() {
    super(Number);
  }

  min(min, msg) {
    msg ||= `{label} must be greater than ${min}.`;
    return this.clone().assert('min', (val) => {
      if (val !== undefined && val < min) {
        throw new Error(msg);
      }
    });
  }

  max(max, msg) {
    msg ||= `{label} must be less than ${max}.`;
    return this.clone().assert('max', (val) => {
      if (val !== undefined && val > max) {
        throw new Error(msg);
      }
    });
  }

  negative() {
    return this.max(0, '{label} must be negative.');
  }

  positive() {
    return this.min(0, '{label} must be positive.');
  }

  integer() {
    return this.clone().assert('integer', (arg, { transformed: val }) => {
      if (val !== undefined && !Number.isInteger(val)) {
        throw new Error(`{label} must be an integer.`);
      }
    });
  }

  multiple(mult) {
    return this.clone().assert('multiple', (arg, { transformed: val }) => {
      if (val !== undefined && val % mult !== 0) {
        throw new Error(`{label} must be a multiple of ${mult}.`);
      }
    });
  }
}

export default wrapSchema(NumberSchema);

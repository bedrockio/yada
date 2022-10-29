import TypeSchema from './TypeSchema';
import { wrapSchema } from './utils';

class NumberSchema extends TypeSchema {
  constructor() {
    super(Number);
  }

  min(min, msg) {
    msg ||= `Must be greater than ${min}.`;
    return this.clone().assert('min', (num) => {
      if (num !== undefined && num < min) {
        throw new Error(msg);
      }
    });
  }

  max(max, msg) {
    msg ||= `Must be less than ${max}.`;
    return this.clone().assert('max', (num) => {
      if (num !== undefined && num > max) {
        throw new Error(msg);
      }
    });
  }

  negative() {
    return this.max(0, 'Must be negative.');
  }

  positive() {
    return this.min(0, 'Must be positive.');
  }

  integer() {
    return this.clone().assert('integer', (num) => {
      if (num !== undefined && !Number.isInteger(num)) {
        throw new Error(`Must be an integer.`);
      }
    });
  }

  multiple(mult) {
    return this.clone().assert('multiple', (num) => {
      if (num !== undefined && num % mult !== 0) {
        throw new Error(`Must be a multiple of ${mult}.`);
      }
    });
  }
}

export default wrapSchema(NumberSchema);

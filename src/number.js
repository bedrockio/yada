import TypeSchema from './TypeSchema';
import { LocalizedError } from './errors';
import { wrapSchema } from './utils';

class NumberSchema extends TypeSchema {
  constructor() {
    super(Number);
    this.assert('type', (val, options) => {
      if (typeof val === 'string' && options.cast) {
        val = Number(val);
      }
      if (typeof val !== 'number' || isNaN(val)) {
        throw new LocalizedError('Must be a number.');
      }
      return val;
    });
  }

  min(min, msg) {
    msg ||= 'Must be greater than {min}.';
    return this.clone().assert('min', (num) => {
      if (num < min) {
        throw new LocalizedError(msg, {
          min,
        });
      }
    });
  }

  max(max, msg) {
    msg ||= 'Must be less than {max}.';
    return this.clone().assert('max', (num) => {
      if (num > max) {
        throw new LocalizedError(msg, {
          max,
        });
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
      if (!Number.isInteger(num)) {
        throw new LocalizedError('Must be an integer.');
      }
    });
  }

  multiple(mult) {
    return this.clone().assert('multiple', (num) => {
      if (num % mult !== 0) {
        throw new LocalizedError('Must be a multiple of {mult}.', {
          mult,
        });
      }
    });
  }
}

export default wrapSchema(NumberSchema);

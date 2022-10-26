import validator from 'validator';
import { wrapSchema } from './utils';

import Schema from './Schema';

class DateSchema extends Schema {
  constructor() {
    super();
    this.transform((val) => {
      if (val !== undefined) {
        const date = new Date(val);
        if ((!val && val !== 0) || isNaN(date.getTime())) {
          throw new Error('{label} must be a valid date.');
        } else {
          return date;
        }
      }
    });
  }

  min(min) {
    min = new Date(min);
    return this.clone().assert('min', (date) => {
      if (date !== undefined && date < min) {
        throw new Error(`{label} must be after ${min.toISOString()}.`);
      }
    });
  }

  max(max) {
    max = new Date(max);
    return this.clone().assert('max', (date) => {
      if (date !== undefined && date > max) {
        throw new Error(`{label} must be before ${max.toISOString()}.`);
      }
    });
  }

  past() {
    return this.clone().assert('past', (date) => {
      const now = new Date();
      if (date !== undefined && date > now) {
        throw new Error(`{label} must be in the past.`);
      }
    });
  }

  future() {
    return this.clone().assert('future', (date) => {
      const now = new Date();
      if (date !== undefined && date < now) {
        throw new Error(`{label} must be in the future.`);
      }
    });
  }

  iso() {
    const schema = this.clone();
    schema.assert('type', (val) => {
      if (typeof val !== 'string') {
        throw new Error('{label} must be a string.');
      } else if (!validator.isISO8601(val)) {
        throw new Error('{label} must be in ISO 8601 format.');
      }
    });
    return schema;
  }

  timestamp(type) {
    const isUnix = type === 'unix';
    if (type && !isUnix) {
      throw new Error('Only allows "unix" as an argument.');
    }
    const schema = this.clone();
    const suffix = isUnix ? 'unix timestamp' : 'timestamp';
    schema.assert('timestamp', (date, { original }) => {
      if (typeof original !== 'number') {
        throw new Error(`{label} must be a ${suffix}.`);
      } else if (isUnix) {
        return new Date(original * 1000);
      }
    });
    return schema;
  }

  toString() {
    return 'date';
  }
}

export default wrapSchema(DateSchema);

import validator from 'validator';

import Schema from './Schema';

export default class DateSchema extends Schema {
  constructor() {
    super();
    this.assert('type', (val) => {
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

  toString() {
    return 'date';
  }

  min(min) {
    min = new Date(min);
    return this.clone().assert('min', (arg, { transformed: val }) => {
      if (val !== undefined && val < min) {
        throw new Error(`{label} must be after ${min.toISOString()}.`);
      }
    });
  }

  max(max) {
    max = new Date(max);
    return this.clone().assert('max', (arg, { transformed: val }) => {
      if (val !== undefined && val > max) {
        throw new Error(`{label} must be before ${max.toISOString()}.`);
      }
    });
  }

  past() {
    return this.clone().assert('past', (arg, { transformed: val }) => {
      const now = new Date();
      if (val !== undefined && val > now) {
        throw new Error(`{label} must be in the past.`);
      }
    });
  }

  future() {
    return this.clone().assert('future', (arg, { transformed: val }) => {
      const now = new Date();
      if (val !== undefined && val < now) {
        throw new Error(`{label} must be in the future.`);
      }
    });
  }

  iso() {
    const schema = this.clone();
    schema.assert('iso', (val) => {
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
    schema.assert('timestamp', (val) => {
      if (typeof val !== 'number') {
        throw new Error(`{label} must be a ${suffix}.`);
      } else if (isUnix) {
        return new Date(val * 1000);
      }
    });
    return schema;
  }
}

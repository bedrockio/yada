import validator from 'validator';
import { wrapSchema } from './utils';
import { LocalizedError } from './errors';

import Schema from './Schema';

class DateSchema extends Schema {
  constructor() {
    super();
    this.assert('type', (val) => {
      const date = new Date(val);
      if ((!val && val !== 0) || isNaN(date.getTime())) {
        throw new LocalizedError('Must be a valid date input.');
      } else {
        return date;
      }
    });
  }

  min(min) {
    min = new Date(min);
    return this.clone().assert('min', (date) => {
      if (date < min) {
        throw new LocalizedError('Must be after {date}.', {
          date: min.toISOString(),
        });
      }
    });
  }

  max(max) {
    max = new Date(max);
    return this.clone().assert('max', (date) => {
      if (date > max) {
        throw new LocalizedError('Must be before {date}.', {
          date: max.toISOString(),
        });
      }
    });
  }

  past() {
    return this.clone().assert('past', (date) => {
      const now = new Date();
      if (date > now) {
        throw new LocalizedError('Must be in the past.');
      }
    });
  }

  future() {
    return this.clone().assert('future', (date) => {
      const now = new Date();
      if (date < now) {
        throw new LocalizedError('Must be in the future.');
      }
    });
  }

  iso(format = 'date-time') {
    return this.clone({ format }).assert('format', (val, options) => {
      const { original } = options;
      if (typeof original !== 'string') {
        throw new LocalizedError('Must be a string.');
      } else if (!validator.isISO8601(original)) {
        throw new LocalizedError('Must be in ISO 8601 format.');
      }
    });
  }

  timestamp(type) {
    const isUnix = type === 'unix';
    if (type && !isUnix) {
      throw new LocalizedError('Only allows "unix" as an argument.');
    }
    const format = isUnix ? 'unix timestamp' : 'timestamp';
    const schema = this.clone({ format });
    schema.assert('timestamp', (date, { original }) => {
      if (typeof original !== 'number') {
        throw new LocalizedError('Must be a {format}.', {
          format,
        });
      } else if (isUnix) {
        return new Date(original * 1000);
      }
    });
    return schema;
  }

  toString() {
    return 'date';
  }

  toOpenApi(extra) {
    const { format } = this.meta;
    return {
      type: format.includes('timestamp') ? 'number' : 'string',
      ...super.toOpenApi(extra),
    };
  }
}

export default wrapSchema(DateSchema);

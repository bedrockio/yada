import validator from 'validator';

import Schema from './Schema';
import { LocalizedError } from './errors';

class DateSchema extends Schema {
  constructor() {
    super({ type: 'string', format: 'date-time' });
    this.assert('type', (val) => {
      const date = new Date(val);
      if ((!val && val !== 0) || isNaN(date.getTime())) {
        throw new LocalizedError('Must be a valid date input.');
      } else {
        return date;
      }
    });
  }

  /**
   * @param {string|number|Date} min
   */
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

  /**
   * @param {string|number|Date} max
   */
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

  /**
   * @param {string|number|Date} max
   */
  before(max) {
    max = new Date(max);
    return this.clone().assert('before', (date) => {
      if (date >= max) {
        throw new LocalizedError('Must be before {date}.', {
          date: max.toISOString(),
        });
      }
    });
  }

  /**
   * @param {string|number|Date} min
   */
  after(min) {
    min = new Date(min);
    return this.clone().assert('after', (date) => {
      if (date <= min) {
        throw new LocalizedError('Must be after {date}.', {
          date: min.toISOString(),
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

  iso() {
    return this.clone({ format: 'date-time' }).assert(
      'format',
      (date, options) => {
        const { original } = options;
        if (typeof original !== 'string') {
          if (!options.default) {
            throw new LocalizedError('Must be a string.');
          }
        } else if (!validator.isISO8601(original)) {
          throw new LocalizedError('Must be in ISO-8601 format.');
        }
      },
    );
  }

  timestamp() {
    return this.clone({ format: 'timestamp' }).assert(
      'format',
      (date, options) => {
        const { original } = options;
        if (typeof original !== 'number' && !options.default) {
          throw new LocalizedError('Must be a timestamp in milliseconds.');
        }
      },
    );
  }

  unix() {
    return this.clone({ format: 'unix timestamp' }).assert(
      'format',
      (date, options) => {
        const { original } = options;
        if (typeof original !== 'number') {
          if (!options.default) {
            throw new LocalizedError('Must be a timestamp in seconds.');
          }
        } else {
          return new Date(original * 1000);
        }
      },
    );
  }

  toString() {
    return 'date';
  }

  toOpenApi(extra) {
    const { format } = this.meta;
    return {
      ...super.toOpenApi(extra),
      type: format.includes('timestamp') ? 'number' : 'string',
    };
  }

  getDefault() {
    const { default: defaultValue } = this.meta;
    if (defaultValue === Date.now) {
      return { default: 'now' };
    } else if (typeof defaultValue === 'function') {
      return { default: 'custom' };
    } else {
      return super.getDefault();
    }
  }
}

/**
 * Creates a [date schema](https://github.com/bedrockio/yada#date).
 */
export default function () {
  return new DateSchema();
}

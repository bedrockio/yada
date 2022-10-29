import {
  isSchemaError,
  ValidationError,
  AssertionError,
  LocalizedError,
  ArrayError,
} from './errors';

const INITIAL = ['required', 'type', 'transform'];

export default class Schema {
  constructor(meta = {}) {
    this.assertions = [];
    this.meta = meta;
  }

  // Public

  required() {
    return this.clone({ required: true }).assert('required', (val) => {
      if (val === undefined) {
        throw new LocalizedError('Value is required.');
      }
    });
  }

  default(value) {
    return this.clone({ default: value }).assert('transform', async (val) => {
      if (val === undefined) {
        return value;
      }
    });
  }

  custom(fn) {
    return this.clone().assert('custom', async (val, options) => {
      if (val !== undefined) {
        return await fn(val, options);
      }
    });
  }

  allow(...set) {
    return this.assertEnum(set, true);
  }

  reject(...set) {
    return this.assertEnum(set, false);
  }

  message(message) {
    return this.clone({ message });
  }

  async validate(value, options = {}) {
    let details = [];

    options = {
      root: value,
      original: value,
      ...this.meta,
      ...options,
    };

    for (let assertion of this.assertions) {
      try {
        const result = await this.runAssertion(assertion, value, options);
        if (result !== undefined) {
          value = result;
        }
      } catch (error) {
        if (error instanceof ArrayError) {
          details = [...details, ...error.details];
        } else {
          details.push(error);
        }
        if (assertion.halt) {
          break;
        }
      }
    }

    if (details.length) {
      const { message = 'Input failed validation.' } = this.meta;
      throw new ValidationError(message, details);
    }
    return value;
  }

  // Private

  clone(meta) {
    const clone = Object.create(this.constructor.prototype);
    clone.assertions = [...this.assertions];
    clone.meta = { ...this.meta, ...meta };
    return clone;
  }

  assertEnum(set, allow) {
    if (set.length === 1 && Array.isArray(set[0])) {
      set = set[0];
    }
    const types = set.map((el) => {
      if (!isSchema(el)) {
        el = JSON.stringify(el);
      }
      return el;
    });
    const msg = `${allow ? 'Must' : 'Must not'} be one of [{types}].`;
    return this.clone({ enum: set }).assert('enum', async (val, options) => {
      if (val !== undefined) {
        for (let el of set) {
          if (isSchema(el)) {
            try {
              await el.validate(val, options);
              return;
            } catch (error) {
              continue;
            }
          } else if ((el === val) === allow) {
            return;
          }
        }
        throw new LocalizedError(msg, {
          types: types.join(', '),
        });
      }
    });
  }

  assert(type, fn) {
    this.assertions.push({
      halt: INITIAL.includes(type),
      type,
      fn,
    });
    this.assertions.sort((a, b) => {
      return this.getSortIndex(a.type) - this.getSortIndex(b.type);
    });
    return this;
  }

  transform(fn) {
    this.assert('transform', fn);
    return this;
  }

  getSortIndex(type) {
    const index = INITIAL.indexOf(type);
    return index === -1 ? INITIAL.length : index;
  }

  async runAssertion(assertion, value, options = {}) {
    const { type, fn } = assertion;
    try {
      return await fn(value, options);
    } catch (error) {
      if (isSchemaError(error)) {
        throw error;
      }
      throw new AssertionError(error.message, type);
    }
  }

  toOpenApi() {
    return {
      ...(this.meta.required && {
        required: true,
      }),
      ...(this.meta.default && {
        default: this.meta.default,
      }),
      ...(this.meta.enum && {
        enum: this.meta.enum,
      }),
      ...(this.meta.format && {
        format: this.meta.format,
      }),
    };
  }
}

export function isSchema(arg) {
  return arg instanceof Schema;
}

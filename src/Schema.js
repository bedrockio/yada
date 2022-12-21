import {
  isSchemaError,
  ValidationError,
  AssertionError,
  LocalizedError,
  ArrayError,
} from './errors';

const INITIAL_TYPES = ['default', 'required', 'type', 'transform'];
const REQUIRED_TYPES = ['default', 'required'];

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
    return this.clone({ default: value }).assert('default', (val) => {
      if (val === undefined) {
        return value;
      }
    });
  }

  custom(...args) {
    const type = args.length > 1 ? args[0] : 'custom';
    const fn = args.length > 1 ? args[1] : args[0];
    if (!type) {
      throw new Error('Assertion type required.');
    } else if (!fn) {
      throw new Error('Assertion function required.');
    }
    return this.clone().assert(type, async (val, options) => {
      return await fn(val, options);
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

  options(options) {
    return this.clone({ ...options });
  }

  async validate(value, options = {}) {
    let details = [];

    options = {
      root: value,
      ...this.meta,
      ...options,
      original: value,
    };

    for (let assertion of this.assertions) {
      if (!assertion.required && value === undefined) {
        break;
      }
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

  clone(meta) {
    const clone = Object.create(this.constructor.prototype);
    clone.assertions = [...this.assertions];
    clone.meta = { ...this.meta, ...meta };
    return clone;
  }

  // Private

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
    this.pushAssertion({
      halt: INITIAL_TYPES.includes(type),
      required: REQUIRED_TYPES.includes(type),
      type,
      fn,
    });
    return this;
  }

  pushAssertion(assertion) {
    this.assertions.push(assertion);
    this.assertions.sort((a, b) => {
      return this.getSortIndex(a.type) - this.getSortIndex(b.type);
    });
  }

  transform(fn) {
    this.assert('transform', (val, options) => {
      if (val !== undefined) {
        return fn(val, options);
      }
    });
    return this;
  }

  getSortIndex(type) {
    const index = INITIAL_TYPES.indexOf(type);
    return index === -1 ? INITIAL_TYPES.length : index;
  }

  async runAssertion(assertion, value, options = {}) {
    const { type, fn } = assertion;
    try {
      return await fn(value, options);
    } catch (error) {
      if (isSchemaError(error)) {
        throw error;
      }
      throw new AssertionError(error.message, type, error);
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

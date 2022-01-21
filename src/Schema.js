import { ValidationError, FieldError, AssertionError } from './errors';

const INITIAL_ASSERTIONS = ['required', 'type', 'transform'];

export default class Schema {
  constructor(assertions = [], meta = {}) {
    this.assertions = assertions;
    this.meta = meta;
  }

  // Public

  required() {
    return this.clone().assert('required', (val) => {
      if (val === undefined) {
        throw new Error('{label} is required.');
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

  default(value) {
    return this.clone().assert('transform', async (val) => {
      if (val === undefined) {
        return value;
      }
    });
  }

  allow(...set) {
    return this.assertEnum(set);
  }

  reject(...set) {
    return this.assertEnum(set, true);
  }

  message(message) {
    return this.clone({ message });
  }

  label(label) {
    return this.clone({ label });
  }

  cast() {
    return this.clone({ cast: true });
  }

  async validate(value, options = {}) {
    const details = [];
    const { initial, other } = this.getAssertions();

    options = {
      root: value,
      ...this.meta,
      ...options,
      transformed: value,
    };

    for (let assertion of initial) {
      try {
        await this.runAssertion(assertion, value, options);
      } catch (error) {
        details.push(error);
        break;
      }
    }
    if (!details.length) {
      for (let assertion of other) {
        try {
          await this.runAssertion(assertion, value, options);
        } catch (error) {
          details.push(error);
        }
      }
    }
    if (details.length) {
      const { message } = this.meta;
      if (options.field || options.index) {
        throw new FieldError(message, details, {
          field: options.field,
          index: options.index,
        });
      } else {
        throw new ValidationError(message, details);
      }
    }
    return options.transformed;
  }

  // Private

  clone(meta) {
    return new Schema(this.assertions, { ...meta, ...this.meta });
  }

  assertEnum(set, reject = false) {
    if (set.length === 1 && Array.isArray(set[0])) {
      set = set[0];
    }
    const types = set.map((el) => {
      if (!isSchema(el)) {
        el = JSON.stringify(el);
      }
      return el;
    });
    const not = reject ? ' not ' : ' ';
    const msg = `{label} must${not}be one of [${types.join(', ')}].`;
    return this.clone().assert('enum', async (val, options) => {
      if (val !== undefined) {
        for (let el of set) {
          if (isSchema(el)) {
            try {
              await el.validate(val, options);
              return;
            } catch (error) {
              continue;
            }
          } else if ((el === val) !== reject) {
            return;
          }
        }
        throw new Error(msg);
      }
    });
  }

  assert(type, fn) {
    this.assertions.push({
      type,
      fn,
    });
    return this;
  }

  getAssertions() {
    return {
      initial: this.assertions.filter(({ type }) => {
        return INITIAL_ASSERTIONS.includes(type);
      }),
      other: this.assertions.filter(({ type }) => {
        return !INITIAL_ASSERTIONS.includes(type);
      }),
    };
  }

  async runAssertion(assertion, value, options = {}) {
    const { type, fn } = assertion;
    try {
      const result = await fn(value, options);
      if (result !== undefined) {
        options.transformed = result;
      }
    } catch (error) {
      if (error instanceof FieldError) {
        throw error;
      }
      let { message = error.message, label = options.label } = this.meta;
      message = message.replace(/{label}/g, label || 'Value');
      throw new AssertionError(message, type);
    }
  }
}

export function isSchema(arg) {
  return arg instanceof Schema;
}

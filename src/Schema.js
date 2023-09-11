import {
  isSchemaError,
  ValidationError,
  AssertionError,
  LocalizedError,
  ArrayError,
} from './errors';
import { omit } from './utils';

const INITIAL_TYPES = ['default', 'required', 'type', 'transform'];
const REQUIRED_TYPES = ['default', 'required'];

/**
 * @typedef {[fn: Function] | [type: string, fn: Function]} CustomSignature
 */

export default class Schema {
  constructor(meta = {}) {
    this.assertions = [];
    this.meta = meta;
  }

  // Public

  /**
   * @returns {this}
   */
  required() {
    return this.clone({ required: true }).assert('required', (val) => {
      if (val === undefined) {
        throw new LocalizedError('Value is required.');
      }
    });
  }

  /**
   * Sets the schema default. [Link](https://github.com/bedrockio/yada#default)
   * @returns {this}
   */
  default(arg) {
    const getDefaultValue = typeof arg === 'function' ? arg : () => arg;
    return this.clone({ default: arg }).assert('default', (val) => {
      if (val === undefined) {
        return getDefaultValue();
      }
    });
  }

  /**
   * Validate by a custom function. [Link](https://github.com/bedrockio/yada#custom)
   * @param {CustomSignature} args
   * @returns {this}
   */
  custom(...args) {
    let type, fn;
    if (typeof args[0] === 'function') {
      type = 'custom';
      fn = args[0];
    } else {
      type = args[0];
      fn = args[1];
    }
    if (!type) {
      throw new Error('Assertion type required.');
    } else if (!fn) {
      throw new Error('Assertion function required.');
    }
    return this.clone().assert(type, async (val, options) => {
      return await fn(val, options);
    });
  }

  /**
   * Conditionally exclude fields inside an object schema.
   * [Link](https://github.com/bedrockio/yada#strip)
   * @returns {this}
   */
  strip(strip) {
    return this.clone({ strip });
  }

  /**
   * Accept values or schemas. [Link](https://github.com/bedrockio/yada#allow)
   * @returns {this}
   */
  allow(...set) {
    return this.assertEnum(set, true);
  }

  /**
   * Reject values or schemas. [Link](https://github.com/bedrockio/yada#reject)
   * @returns {this}
   */
  reject(...set) {
    return this.assertEnum(set, false);
  }

  /**
   * @returns {this}
   */
  message(message) {
    return this.clone({ message });
  }

  /**
   * @returns {this}
   */
  tag(tags) {
    return this.clone({
      tags: {
        ...this.meta.tags,
        ...tags,
      },
    });
  }

  /**
   * @returns {this}
   */
  description(description) {
    return this.tag({
      description,
    });
  }

  /**
   * @returns {this}
   */
  options(options) {
    return this.clone({ ...options });
  }

  async validate(value, options = {}) {
    let details = [];

    options = {
      root: value,
      ...options,
      ...this.meta,
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

  /**
   * @returns {this}
   */
  clone(meta) {
    const clone = Object.create(this.constructor.prototype);
    clone.assertions = [...this.assertions];
    clone.meta = { ...this.meta, ...meta };
    return clone;
  }

  /**
   * Appends another schema. [Link](https://github.com/bedrockio/yada#append)
   * @returns {this}
   */
  append(schema) {
    const merged = this.clone(schema.meta);
    merged.assertions = [...this.assertions, ...schema.assertions];
    return merged;
  }

  toOpenApi(extra) {
    const { required, format, tags } = this.meta;
    return {
      required,
      format,
      ...tags,
      ...this.getDefault(),
      ...this.enumToOpenApi(),
      ...this.expandExtra(extra),
    };
  }

  getDefault() {
    const { default: defaultValue } = this.meta;
    if (typeof defaultValue === 'function') {
      return {};
    } else if (defaultValue != null) {
      return {
        default: defaultValue,
      };
    }
  }

  inspect() {
    return JSON.stringify(this.toOpenApi(), null, 2);
  }

  expandExtra(extra = {}) {
    const { tag, ...rest } = extra;
    if (typeof extra?.tag === 'function') {
      Object.assign(rest, extra.tag(this.meta));
    }
    return rest;
  }

  // Private

  /**
   * @returns {this}
   */
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
              // Must not pass cast option down when allowing
              // other schema types as they may be allowed, for
              // example allowing a string or array of strings.
              options = omit(options, 'cast');
              return await el.validate(val, options);
            } catch (error) {
              continue;
            }
          } else if ((el === val) === allow) {
            return;
          }
        }
        throw new LocalizedError(options.message || msg, {
          types: types.join(', '),
        });
      }
    });
  }

  /**
   * @returns {this}
   */
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

  /**
   * @returns {this}
   */
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
      throw new AssertionError(error.message, error.type || type, error);
    }
  }

  enumToOpenApi() {
    const { enum: allowed } = this.meta;
    if (allowed?.length) {
      const type = typeof allowed[0];
      const allowEnum = allowed.every((entry) => {
        const entryType = typeof entry;
        return entryType !== 'object' && entryType === type;
      });
      if (allowEnum) {
        return {
          type,
          enum: allowed,
        };
      } else {
        const oneOf = [];
        for (let entry of allowed) {
          if (isSchema(entry)) {
            oneOf.push(entry.toOpenApi());
          } else {
            const type = typeof entry;
            let forType = oneOf.find((el) => {
              return el.type === type;
            });
            if (!forType) {
              forType = {
                type,
                enum: [],
              };
              oneOf.push(forType);
            }
            forType.enum.push(entry);
          }
        }
        return { oneOf };
      }
    }
  }
}

export function isSchema(arg) {
  return arg instanceof Schema;
}

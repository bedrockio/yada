import { omit, uniqBy } from 'lodash';

import { canAllowEmptyString } from './utils';

import {
  TypeError,
  FormatError,
  AllowedError,
  AssertionError,
  LocalizedError,
  ValidationError,
} from './errors';

const INITIAL_TYPES = ['default', 'required', 'type', 'transform', 'empty'];
const REQUIRED_TYPES = ['default', 'required', 'missing'];

export function isSchema(arg) {
  return arg instanceof Schema;
}

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
   * @param {Function} fn
   * @returns {this}
   */
  custom(fn) {
    if (!fn) {
      throw new Error('Assertion function required.');
    }
    return this.clone().assert('custom', async (val, options) => {
      return await fn(val, options);
    });
  }

  /**
   * Validate by a custom function when no value passed. [Link](https://github.com/bedrockio/yada#missing)
   * @param {Function} fn
   * @returns {this}
   */
  missing(fn) {
    if (!fn) {
      throw new Error('Assertion function required.');
    }
    return this.clone().assert('missing', async (val, options) => {
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
   * Allow null. [Link](https://github.com/bedrockio/yada#nullable)
   * @returns {this}
   */
  nullable() {
    return this.clone({ nullable: true });
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
      ...options,
      ...this.meta,
      original: value,
    };

    for (let assertion of this.assertions) {
      if (this.canSkipAssertion(value, assertion, options)) {
        continue;
      }

      try {
        value = await this.runAssertion(value, assertion, options);
      } catch (error) {
        const { type } = assertion;
        const { message } = error;

        if (type === 'type') {
          details.push(new TypeError(message, this.meta.type));
        } else if (type === 'format') {
          details.push(new FormatError(message, this.meta.format));
        } else if (error instanceof LocalizedError) {
          details.push(new AssertionError(message, type));
        } else {
          details.push(error);
        }
        if (assertion.halt) {
          break;
        }
      }
    }

    if (details.length) {
      throw new ValidationError(this.meta.message, details);
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
   * @returns {Schema}
   */
  append(schema) {
    const merged = this.clone(schema.meta);
    merged.assertions = [...this.assertions, ...schema.assertions];
    return merged;
  }

  /**
   * Exports the schema in [JSON Schema](https://json-schema.org/) format.
   * Note that this may not represent the schema in its enitrety. Specifically,
   * custom (code-based) assertions will not be output.
   * @param {Object} [extra]
   */
  toJSON(extra) {
    const { format, tags } = this.meta;
    return {
      format,
      ...tags,
      ...this.getAnyType(),
      ...this.getDefault(),
      ...this.getNullable(),
      ...this.getEnum(),
      ...this.expandExtra(extra),
    };
  }

  /**
   * Exports the schema in [JSON Schema](https://json-schema.org/) format.
   * @alias toJSON.
   */
  toOpenApi(...extra) {
    return this.toJSON(extra);
  }

  getAnyType() {
    const { type, enum: set } = this.meta;
    if (!type && !set) {
      return {
        type: ['object', 'array', 'string', 'number', 'boolean', 'null'],
      };
    }
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

  getNullable() {
    const { nullable } = this.meta;
    if (nullable) {
      return {
        nullable: true,
      };
    }
  }

  getEnum() {
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
            oneOf.push(entry.toJSON());
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
            if (forType.enum) {
              forType.enum.push(entry);
            }
          }
        }
        return { oneOf };
      }
    }
  }

  expandExtra(extra = {}) {
    const { tag, ...rest } = extra;
    if (typeof extra?.tag === 'function') {
      Object.assign(rest, extra.tag(this.meta));
    }
    return rest;
  }

  inspect() {
    return JSON.stringify(this.toJSON(), null, 2);
  }

  get() {
    const { name } = this.constructor;
    throw new Error(`"get" not implemented by ${name}.`);
  }

  // Private

  /**
   * @returns {this}
   */
  assertEnum(set, allow) {
    if (set.length === 1 && Array.isArray(set[0])) {
      set = set[0];
    }
    return this.clone({ enum: set }).assert('enum', async (val, options) => {
      if (val === '' && canAllowEmptyString(options)) {
        return;
      }
      if (val !== undefined) {
        let captured = [];

        for (let el of set) {
          if (isSchema(el)) {
            try {
              // Must not pass cast option down when allowing
              // other schema types as they may be allowed, for
              // example allowing a string or array of strings.
              options = omit(options, 'cast');
              return await el.validate(val, options);
            } catch (err) {
              captured.push(err.details[0]);
            }
          } else if ((el === val) === allow) {
            return;
          }
        }

        captured = uniqBy(captured, 'message');

        const isTypeErrors = captured.every((error) => {
          return error instanceof TypeError;
        });

        if (captured.length === 1) {
          throw captured[0];
        }

        if (captured.length === 0 || isTypeErrors) {
          assertTypes({
            set,
            allow,
          });
        }

        throw new AllowedError(
          this.meta.message,
          captured.filter((error) => {
            return error instanceof TypeError ? false : true;
          }),
        );
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

  canSkipAssertion(value, assertion, options) {
    if (value === undefined) {
      return !assertion.required;
    } else if (value === null) {
      return options.nullable;
    } else {
      return assertion.type === 'missing';
    }
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

  async runAssertion(value, assertion, options = {}) {
    const { type, fn } = assertion;
    let result;
    if (type === 'missing') {
      result = await fn(options);
    } else {
      result = await fn(value, options);
    }
    if (result !== undefined) {
      return result;
    }
    return value;
  }
}

function assertTypes(options) {
  const { set, allow } = options;
  const types = set.map((el) => {
    if (!isSchema(el)) {
      el = JSON.stringify(el);
    }
    return el;
  });
  const message = `${allow ? 'Must' : 'Must not'} be one of [{types}].`;
  throw new LocalizedError(message, {
    types: types.join(', '),
  });
}

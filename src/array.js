import { omit } from 'lodash';

import TypeSchema from './TypeSchema';
import { ArrayError, ElementError, LocalizedError } from './errors';

class ArraySchema extends TypeSchema {
  constructor(meta) {
    super(Array, meta);
    this.setup();
  }

  setup() {
    const { schema } = this.meta;

    this.assert('type', (val, options) => {
      if (typeof val === 'string' && options.cast) {
        val = val.split(',');
      }
      if (!Array.isArray(val)) {
        throw new LocalizedError('Must be an array.');
      }
      return val;
    });

    if (schema) {
      const { message } = schema.meta;
      this.assert('elements', async (arr, options) => {
        const errors = [];
        const result = [];
        for (let i = 0; i < arr.length; i++) {
          const el = arr[i];
          try {
            // Allow enum message to take
            // precedence over generic array message.
            options = omit(options, 'message');
            result.push(await schema.validate(el, options));
          } catch (error) {
            errors.push(new ElementError(message, i, error.details));
          }
        }
        if (errors.length) {
          throw new ArrayError(message, errors);
        } else {
          return result;
        }
      });
    }
  }

  length(length) {
    return this.clone().assert('length', (arr) => {
      if (arr.length !== length) {
        const s = length === 1 ? '' : 's';
        throw new LocalizedError('Must contain exactly {length} element{s}.', {
          length,
          s,
        });
      }
    });
  }

  min(length) {
    return this.clone().assert('length', (arr) => {
      if (arr.length < length) {
        const s = length === 1 ? '' : 's';
        throw new LocalizedError('Must contain at least {length} element{s}.', {
          length,
          s,
        });
      }
    });
  }

  max(length) {
    return this.clone().assert('length', (arr) => {
      if (arr.length > length) {
        const s = length === 1 ? '' : 's';
        throw new LocalizedError(
          'Cannot contain more than {length} element{s}.',
          {
            length,
            s,
          },
        );
      }
    });
  }

  latlng() {
    return this.clone({ format: 'latlng' }).assert('format', (arr) => {
      if (arr.length !== 2) {
        throw new LocalizedError('Must be an array of length 2.');
      } else {
        const [lat, lng] = arr;
        if (typeof lat !== 'number' || lat < -90 || lat > 90) {
          throw new LocalizedError('Invalid latitude.');
        } else if (typeof lng !== 'number' || lng < -180 || lng > 180) {
          throw new LocalizedError('Invalid longitude.');
        }
      }
    });
  }

  /**
   * Recursively transforms all fields in the array schema.
   * @param {Function} fn - Transform function that accepts an instance
   *   of the schema.
   * @returns {this}
   */
  transform(fn, root = true) {
    const { schema, ...rest } = this.meta;

    const transformed = new ArraySchema({
      ...rest,
      ...(schema && {
        schema: schema.transform(fn, false),
      }),
    });

    if (root) {
      // @ts-ignore
      return transformed;
    } else {
      return super.transform.call(transformed, fn);
    }
  }

  // Private

  toString() {
    return 'array';
  }

  toJsonSchema(options) {
    const { schema } = this.meta;
    return {
      ...super.toJsonSchema(options),
      ...(schema && {
        items: schema?.toJsonSchema(options),
      }),
    };
  }
}

/**
 * Creates an [array schema](https://github.com/bedrockio/yada#array).
 *
 * @param {*} [schema] - The schema to validate elements in
 * the array. If not passed then elements may be of any type.
 */
export default function (schema) {
  if (arguments.length > 1) {
    throw new Error(
      'Arrays may only have a single schema. Use "allow" instead.',
    );
  }
  return new ArraySchema({
    schema,
  });
}

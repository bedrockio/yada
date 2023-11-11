import Schema from './Schema';
import { ArrayError, ElementError, LocalizedError } from './errors';
import { omit } from './utils';

class ArraySchema extends Schema {
  constructor(schemas) {
    super({ message: 'Array failed validation.', schemas });
    this.setup();
  }

  /**
   * @private
   */
  setup() {
    const { schemas, message } = this.meta;
    const schema =
      schemas.length > 1 ? new Schema().allow(schemas) : schemas[0];

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
            errors.push(
              new ElementError(
                'Element failed validation.',
                i,
                error.original,
                error.details
              )
            );
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
          }
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

  toString() {
    return 'array';
  }

  toOpenApi(extra) {
    let other;
    const { schemas } = this.meta;
    if (schemas.length > 1) {
      other = {
        oneOf: schemas.map((schema) => {
          return schema.toOpenApi();
        }),
      };
    } else if (schemas.length === 1) {
      other = {
        items: schemas[0].toOpenApi(),
      };
    }

    return {
      ...super.toOpenApi(extra),
      ...other,
      type: 'array',
    };
  }
}

/**
 * Creates an [array schema](https://github.com/bedrockio/yada#array).
 *
 * @param {...Schema} [schemas] Optional schemas to validate
 * the different types of elements allowed in the array. If
 * no arguments are passed elements may be of any type. Also
 * accepts a single array argument.
 */
export default function (...schemas) {
  if (Array.isArray(schemas[0])) {
    schemas = schemas[0];
  }
  return new ArraySchema(schemas);
}

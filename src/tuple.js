import Schema from './Schema';
import { ArrayError, ElementError, LocalizedError } from './errors';

class TupleSchema extends Schema {
  constructor(schemas) {
    super({ message: 'Tuple failed validation.', schemas });
    this.setup();
  }

  /**
   * @private
   */
  setup() {
    const { schemas } = this.meta;

    this.assert('type', (val, options) => {
      if (typeof val === 'string' && options.cast) {
        val = val.split(',');
      }
      if (!Array.isArray(val)) {
        throw new LocalizedError('Must be an array.');
      }
      return val;
    });

    this.assert('length', (val) => {
      const { length } = schemas;
      if (val.length !== length) {
        throw new LocalizedError('Tuple must be exactly {length} elements.', {
          length: schemas.length,
        });
      }
      return val;
    });

    this.assert('elements', async (arr, options) => {
      const errors = [];
      const result = [];

      for (let i = 0; i < schemas.length; i++) {
        const schema = schemas[i];
        const el = arr[i];
        try {
          result.push(await schema.validate(el, options));
        } catch (error) {
          if (error.details?.length === 1) {
            errors.push(new ElementError(error.details[0].message, i));
          } else {
            errors.push(
              new ElementError('Element failed validation.', i, error.details)
            );
          }
        }
      }
      if (errors.length) {
        throw new ArrayError(this.meta.message, errors);
      } else {
        return result;
      }
    });
  }

  toString() {
    return 'tuple';
  }

  toOpenApi(extra) {
    const { schemas } = this.meta;
    return {
      type: 'array',
      ...super.toOpenApi(extra),
      prefixItems: schemas.map((schema) => {
        return schema.toOpenApi();
      }),
    };
  }
}

/**
 * Creates a [tuple schema](https://github.com/bedrockio/yada#tuple).
 *
 * @param {...Schema} [schemas] Schemas to validate
 * the exact types of elements allowed in the tuple. Also
 * accepts a single array argument.
 */
export default function (...schemas) {
  if (Array.isArray(schemas[0])) {
    schemas = schemas[0];
  }
  return new TupleSchema(schemas);
}

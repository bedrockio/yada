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

    this.assert('length', (arr, options) => {
      const { loose } = options;
      const { length } = schemas;
      if (loose && arr.length === 0) {
        // Empty arrays allowed with loose option so take no action.
      } else if (arr.length !== length) {
        throw new LocalizedError('Tuple must be exactly {length} elements.', {
          length: schemas.length,
        });
      }
      return arr;
    });

    this.assert('elements', async (arr, options) => {
      const errors = [];
      const result = [];
      const min = Math.min(arr.length, schemas.length);

      for (let i = 0; i < min; i++) {
        let el = arr[i];
        const schema = schemas[i];
        try {
          if (el === undefined) {
            // Coerce undefined to null to make sure validation
            // is run but keep the same error message.
            el = null;
          }
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

  loose() {
    return this.clone({ loose: true });
  }

  toString() {
    return 'tuple';
  }

  toOpenApi(extra) {
    const { schemas } = this.meta;
    return {
      ...super.toOpenApi(extra),
      type: 'array',
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

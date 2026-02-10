import { uniqBy } from 'lodash';

import Schema from './Schema';
import array from './array';
import { ArrayError, ElementError, LocalizedError } from './errors';

class TupleSchema extends Schema {
  constructor(schemas) {
    super({ schemas, type: 'array' });
    this.setup();
  }

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
          const { message } = schema.meta;
          errors.push(new ElementError(message, i, error.details));
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

  toArray() {
    const { schemas } = this.meta;
    const unique = uniqBy(schemas, (s) => s.meta.type);
    if (unique.length > 1) {
      return array(new Schema().allow(unique));
    } else {
      return array(unique[0]);
    }
  }

  toString() {
    return 'tuple';
  }

  toJsonSchema(options) {
    const { schemas } = this.meta;
    return {
      ...super.toJsonSchema(options),
      items: false,
      prefixItems: schemas.map((schema) => {
        return schema.toJsonSchema(options);
      }),
    };
  }
}

/**
 * Creates a [tuple schema](https://github.com/bedrockio/yada#tuple).
 *
 * @param {...Schema} schemas Schemas to validate
 * the exact types of elements allowed in the tuple. Also
 * accepts a single array argument.
 */
export default function (...schemas) {
  if (Array.isArray(schemas[0])) {
    schemas = schemas[0];
  }
  return new TupleSchema(schemas);
}

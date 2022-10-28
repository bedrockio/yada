import Schema from './Schema';
import { ArrayError, ElementError } from './errors';
import { wrapSchema } from './utils';

class ArraySchema extends Schema {
  constructor(...schemas) {
    super();

    if (schemas.length === 1 && Array.isArray(schemas[0])) {
      schemas = schemas[0];
    }
    this.schemas = schemas;

    this.assert('type', (val, options) => {
      if (val !== undefined && !Array.isArray(val)) {
        if (options.cast) {
          return String(val).split(',');
        } else {
          throw new Error('{label} must be an array.');
        }
      }
    });
    const schema =
      schemas.length > 1 ? new Schema().allow(schemas) : schemas[0];
    if (schema) {
      this.assert('elements', async (arr, options) => {
        if (arr !== undefined) {
          const errors = [];
          const result = [];
          for (let i = 0; i < arr.length; i++) {
            const el = arr[i];
            try {
              result.push(
                await schema.validate(el, {
                  ...options,
                  label: `Element at index ${i}`,
                })
              );
            } catch (error) {
              if (error.details?.length === 1) {
                errors.push(new ElementError(error.details[0].message, i));
              } else {
                errors.push(
                  new ElementError(
                    'Element failed validation.',
                    i,
                    error.details
                  )
                );
              }
            }
          }
          if (errors.length) {
            throw new ArrayError('Array failed validation.', errors);
          } else {
            return result;
          }
        }
      });
    }
  }

  toString() {
    return 'array';
  }

  toOpenApi() {
    let other;
    if (this.schemas.length > 1) {
      other = {
        oneOf: this.schemas.map((schema) => {
          return schema.toOpenApi();
        }),
      };
    } else if (this.schemas.length === 1) {
      other = {
        items: this.schemas[0].toOpenApi(),
      };
    }

    return {
      type: 'array',
      ...other,
    };
  }
}

export default wrapSchema(ArraySchema);

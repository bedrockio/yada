import Schema from './Schema';
import { FieldError } from './errors';
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
      this.assert('element', async (arr, options) => {
        const { field } = options;
        if (arr !== undefined) {
          let error;
          const result = [];
          for (let [i, el] of Object.entries(arr)) {
            try {
              result.push(
                await schema.validate(el, {
                  ...options,
                  index: i,
                  label: `Element at index ${i}`,
                })
              );
            } catch (err) {
              const details = error?.details || [];
              error = new FieldError('', [...details, ...err.details], {
                field,
                ...options,
              });
            }
          }
          if (error) {
            throw error;
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

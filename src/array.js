import Schema from './Schema';
import { ArrayError, ElementError, LocalizedError } from './errors';
import { wrapSchema } from './utils';

class ArraySchema extends Schema {
  constructor(...args) {
    let schemas, meta;

    if (Array.isArray(args[0])) {
      schemas = args[0];
      meta = args[1];
    } else {
      schemas = args;
    }

    super({ message: 'Array failed validation.', ...meta });

    this.schemas = schemas;

    this.assert('type', (val, options) => {
      if (val !== undefined && !Array.isArray(val)) {
        if (options.cast) {
          return String(val).split(',');
        } else {
          throw new LocalizedError('Must be an array.');
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
              result.push(await schema.validate(el, options));
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
            throw new ArrayError(this.meta.message, errors);
          } else {
            return result;
          }
        }
      });
    }
  }

  clone(meta) {
    return new ArraySchema(this.schemas, { ...this.meta, ...meta });
  }

  min(length) {
    return this.clone().assert('length', (arr) => {
      if (arr && arr.length < length) {
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
      if (arr && arr.length > length) {
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

  cast() {
    return this.clone({ cast: true });
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

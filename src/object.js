import TypeSchema from './TypeSchema';
import { FieldError, LocalizedError } from './errors';
import { wrapSchema } from './utils';
import { isSchema } from './Schema';

class ObjectSchema extends TypeSchema {
  constructor(fields = {}, meta = {}) {
    super(Object, { message: 'Object failed validation.', ...meta });
    this.fields = fields;

    // Note that not passing a schema allows
    // unknown objects with all keys allowed.
    if (Object.keys(fields).length || meta.stripUnknown) {
      this.transform((obj) => {
        const { stripUnknown } = this.meta;
        if (obj) {
          const result = {};
          for (let key of Object.keys(obj)) {
            if (key in fields) {
              result[key] = obj[key];
            } else if (!stripUnknown) {
              throw new LocalizedError('Unknown field "{key}".', {
                key,
              });
            }
          }
          return result;
        }
      });
      for (let [key, schema] of Object.entries(fields)) {
        this.assert('field', async (obj, options) => {
          if (obj) {
            let val;
            try {
              val = await schema.validate(obj[key], options);
            } catch (error) {
              if (error.details?.length === 1) {
                throw new FieldError(error.details[0].message, key);
              } else {
                throw new FieldError(
                  'Field failed validation.',
                  key,
                  error.details
                );
              }
            }
            return {
              ...obj,
              ...(val !== undefined && {
                [key]: val,
              }),
            };
          }
        });
      }
    }
  }

  clone(meta) {
    return new ObjectSchema(this.fields, { ...this.meta, ...meta });
  }

  stripUnknown() {
    return this.clone({
      stripUnknown: true,
    });
  }

  append(arg) {
    const fields = isSchema(arg) ? arg.fields : arg;
    return new ObjectSchema({ ...this.fields, ...fields });
  }

  toString() {
    return 'object';
  }

  toOpenApi() {
    const properties = {};
    for (let [key, schema] of Object.entries(this.fields)) {
      properties[key] = schema.toOpenApi();
    }
    return {
      ...super.toOpenApi(),
      ...(Object.keys(properties).length > 0 && {
        properties,
      }),
    };
  }
}

export default wrapSchema(ObjectSchema);

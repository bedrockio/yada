import TypeSchema from './TypeSchema';
import { FieldError, LocalizedError } from './errors';
import { wrapSchema } from './utils';
import { isSchema } from './Schema';

const BASE_ASSERTIONS = ['type', 'transform', 'field'];

class ObjectSchema extends TypeSchema {
  constructor(fields = {}, meta = {}) {
    super(Object, { message: 'Object failed validation.', ...meta, fields });
    this.setup();
  }

  setup() {
    this.assert('type', (val) => {
      if (val === null || typeof val !== 'object') {
        throw new LocalizedError('Must be an object.');
      }
    });
    this.transform((obj, options) => {
      const { fields, stripUnknown } = options;
      const allowUnknown = Object.keys(fields).length === 0;
      if (obj) {
        const result = {};
        for (let key of Object.keys(obj)) {
          if (key in fields || allowUnknown) {
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
    for (let [key, schema] of Object.entries(this.meta.fields)) {
      this.assert('field', async (obj, options) => {
        if (obj) {
          let val;
          try {
            val = await schema.validate(obj[key], options);
          } catch (error) {
            if (error.details?.length === 1) {
              const { message, original } = error.details[0];
              throw new FieldError(message, key, original);
            } else {
              throw new FieldError(
                'Field failed validation.',
                key,
                error.original,
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

  append(arg) {
    const schema = isSchema(arg) ? arg : new ObjectSchema(arg);

    const fields = {
      ...this.meta.fields,
      ...schema.meta.fields,
    };

    const meta = {
      ...this.meta,
      ...schema.meta,
    };

    const merged = new ObjectSchema(fields, meta);

    const assertions = [...this.assertions, ...schema.assertions];
    for (let assertion of assertions) {
      const { type } = assertion;
      if (!BASE_ASSERTIONS.includes(type)) {
        merged.pushAssertion(assertion);
      }
    }
    return merged;
  }

  toOpenApi() {
    const properties = {};
    for (let [key, schema] of Object.entries(this.meta.fields)) {
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

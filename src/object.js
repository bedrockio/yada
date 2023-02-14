import TypeSchema from './TypeSchema';
import { FieldError, LocalizedError } from './errors';
import { wrapSchema } from './utils';
import { isSchema } from './Schema';

const BASE_ASSERTIONS = ['type', 'transform', 'field'];

class ObjectSchema extends TypeSchema {
  constructor(fields) {
    super(Object, { message: 'Object failed validation.', fields });
    this.setup();
  }

  /**
   * @private
   */
  setup() {
    this.assert('type', (val) => {
      if (val === null || typeof val !== 'object') {
        throw new LocalizedError('Must be an object.');
      }
    });
    this.transform((obj, options) => {
      const { fields, stripUnknown } = options;
      if (obj) {
        const result = {};
        for (let key of Object.keys(obj)) {
          if (!fields || key in fields) {
            result[key] = obj[key];
          } else if (!stripUnknown) {
            throw new LocalizedError('Unknown field "{key}".', {
              key,
              type: 'field',
            });
          }
        }
        return result;
      }
    });
    for (let [key, schema] of Object.entries(this.getFields())) {
      this.assert('field', async (obj, options) => {
        if (obj) {
          const { path = [] } = options;
          const { strip } = schema.meta;
          const val = obj[key];

          options = {
            ...options,
            path: [...path, key],
          };

          if (strip && strip(val, options)) {
            delete obj[key];
            return;
          }
          try {
            const result = await schema.validate(val, options);
            if (result !== undefined) {
              return {
                ...obj,
                [key]: result,
              };
            }
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
        }
      });
    }
  }

  /**
   * @param {object|ObjectSchema} arg
   * @returns Schema
   */
  append(arg) {
    let schema;
    if (arg instanceof ObjectSchema) {
      schema = arg;
    } else if (isSchema(arg)) {
      // If the schema is of a different type then
      // simply append it and don't merge fields.
      return super.append(arg);
    } else {
      schema = new ObjectSchema(arg);
    }

    const fields = {
      ...this.meta.fields,
      ...schema.meta.fields,
    };

    const merged = new ObjectSchema(fields);

    const assertions = [...this.assertions, ...schema.assertions];
    for (let assertion of assertions) {
      const { type } = assertion;
      if (!BASE_ASSERTIONS.includes(type)) {
        merged.pushAssertion(assertion);
      }
    }

    return merged;
  }

  getFields() {
    return this.meta.fields || {};
  }

  toOpenApi(extra) {
    const properties = {};
    for (let [key, schema] of Object.entries(this.getFields())) {
      properties[key] = schema.toOpenApi();
    }
    return {
      ...super.toOpenApi(extra),
      ...(Object.keys(properties).length > 0 && {
        properties,
      }),
    };
  }
}

/**
 * @type {(arg: object) => ObjectSchema}
 */
export default wrapSchema(ObjectSchema);

import TypeSchema from './TypeSchema';
import { wrapSchema } from './utils';
import { isSchema } from './Schema';

class ObjectSchema extends TypeSchema {
  constructor(fields = {}) {
    super(Object);
    this.fields = fields;
    this.transform((obj) => {
      if (obj) {
        const result = {};
        for (let key of Object.keys(obj)) {
          if (key in fields) {
            result[key] = obj[key];
          }
        }
        return result;
      }
    });
    for (let [key, schema] of Object.entries(fields)) {
      this.assert('field', async (obj, options) => {
        if (obj) {
          const val = await schema.validate(obj[key], {
            ...options,
            field: key,
            label: `"${key}"`,
          });
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

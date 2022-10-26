import TypeSchema from './TypeSchema';
import { wrapSchema } from './utils';

class ObjectSchema extends TypeSchema {
  constructor(fields = {}) {
    super(Object);
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

  toString() {
    return 'object';
  }
}

export default wrapSchema(ObjectSchema);

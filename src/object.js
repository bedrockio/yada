import TypeSchema from './TypeSchema';
import { wrapSchema } from './utils';

class ObjectSchema extends TypeSchema {
  constructor(fields) {
    super(Object);
    this.assert('transform', (obj) => {
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
    if (!fields) {
      throw new Error('Object schema must be defined.');
    }
    for (let [key, schema] of Object.entries(fields)) {
      this.assert('field', async (obj, options) => {
        if (obj) {
          const val = await schema.validate(obj[key], {
            ...options,
            field: key,
            label: `"${key}"`,
          });
          return {
            ...options.transformed,
            ...(val !== undefined && {
              [key]: val,
            }),
          };
        }
      });
    }
  }
}

export default wrapSchema(ObjectSchema);

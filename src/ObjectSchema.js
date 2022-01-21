import { pick } from 'lodash-es';

import TypeSchema from './TypeSchema';

export default class ObjectSchema extends TypeSchema {
  constructor(fields) {
    super(Object);
    this.assert('transform', (obj) => {
      if (obj) {
        return pick(obj, Object.keys(fields));
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

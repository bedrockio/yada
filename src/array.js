import Schema from './Schema';
import { FieldError } from './errors';
import { wrapSchema } from './utils';

class ArraySchema extends Schema {
  constructor(...args) {
    super();
    this.assert('type', (val, options) => {
      if (val !== undefined && !Array.isArray(val)) {
        if (options.cast) {
          return String(val).split(',');
        } else {
          throw new Error('{label} must be an array.');
        }
      }
    });
    if (args.length) {
      const arg = args.length === 1 ? args[0] : args;
      const schema = Array.isArray(arg) ? new Schema().allow(arg) : arg;
      this.assert('element', async (arr, options) => {
        const { field, meta } = options;
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
}

export default wrapSchema(ArraySchema);

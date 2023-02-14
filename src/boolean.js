import TypeSchema from './TypeSchema';
import { LocalizedError } from './errors';

class BooleanSchema extends TypeSchema {
  constructor() {
    super(Boolean);
    this.assert('type', (val, options) => {
      if (typeof val === 'string' && options.cast) {
        const str = val.toLowerCase();
        if (str === 'true' || str === '1') {
          val = true;
        } else if (str === 'false' || str === '0') {
          val = false;
        }
      }
      if (typeof val !== 'boolean') {
        throw new LocalizedError('Must be a boolean.');
      }
      return val;
    });
  }
}

/**
 * Creates a [boolean schema](https://github.com/bedrockio/yada#boolean).
 */
export default function () {
  return new BooleanSchema();
}

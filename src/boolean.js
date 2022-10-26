import TypeSchema from './TypeSchema';
import { wrapSchema } from './utils';

class BooleanSchema extends TypeSchema {
  constructor() {
    super(Boolean);
  }
}

export default wrapSchema(BooleanSchema);

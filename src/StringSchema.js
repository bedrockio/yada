import TypeSchema from './TypeSchema';

export default class StringSchema extends TypeSchema {
  constructor() {
    super(String);
  }

  min(length) {
    return this.clone().assert('length', (val) => {
      if (val && val.length < length) {
        throw new Error(`{label} must be ${length} characters or more.`);
      }
    });
  }

  max(length) {
    return this.clone().assert('length', (val) => {
      if (val && val.length > length) {
        throw new Error(`{label} must be ${length} characters or less.`);
      }
    });
  }

  matches(reg) {
    if (!(reg instanceof RegExp)) {
      throw new Error('Argument must be a regular expression');
    }
    return this.clone().assert('regex', (val) => {
      if (val && !reg.test(val)) {
        throw new Error(`{label} must match pattern ${reg}.`);
      }
    });
  }
}

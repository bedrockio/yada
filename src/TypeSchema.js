import Schema from './Schema';

export default class TypeSchema extends Schema {
  constructor(Class) {
    super();
    this.type = Class.name.toLowerCase();
    this.assertType(Class, this.type);
  }

  assertType(Class, type) {
    const n = this.type.match(/^[aeiou]/) ? 'n' : '';
    const msg = `{label} must be a${n} ${type}.`;
    return this.assert('type', (val, options) => {
      if (val !== undefined) {
        if (typeof val !== type) {
          if (options.cast) {
            return Class(val);
          } else {
            throw new Error(msg);
          }
        }
      }
    });
  }

  toString() {
    return this.type;
  }
}

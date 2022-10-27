import Schema from './Schema';

export default class TypeSchema extends Schema {
  constructor(Class) {
    const type = Class.name.toLowerCase();
    super({ type });
    this.assertType(Class, type);
  }

  assertType(Class, type) {
    const n = this.meta.type.match(/^[aeiou]/) ? 'n' : '';
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

  format(name, fn) {
    return this.clone({ format: name }).assert('format', fn);
  }

  toString() {
    return this.meta.type;
  }

  toOpenApi() {
    return {
      type: this.meta.type,
      ...super.toOpenApi(),
    };
  }
}

import Schema from './Schema';

export default class TypeSchema extends Schema {
  constructor(Class, meta) {
    const type = Class.name.toLowerCase();
    super({ ...meta, type });
  }

  format(name, fn) {
    return this.clone({ format: name }).assert('format', fn);
  }

  toString() {
    return this.meta.type;
  }
}

import Schema from './Schema';

export default class TypeSchema extends Schema {
  constructor(Class, meta) {
    const type = Class.name.toLowerCase();
    super({ type, ...meta });
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

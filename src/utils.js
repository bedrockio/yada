import Schema, { isSchema } from './Schema';

export function wrapSchema(Class) {
  return (...args) => {
    return new Class(...args);
  };
}

export function wrapArgs(name) {
  return (...args) => {
    return new Schema()[name](...args);
  };
}

export function wrapAny() {
  return () => {
    return new Schema();
  };
}

export { isSchema };

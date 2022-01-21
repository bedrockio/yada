import Schema from './Schema';

export function wrapArgs(name) {
  return (...args) => {
    return new Schema()[name](...args);
  };
}

export function wrapSchema(Class) {
  return (...args) => {
    return new Class(...args);
  };
}

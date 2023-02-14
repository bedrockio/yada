export function wrapSchema(Class) {
  return (...args) => {
    return new Class(...args);
  };
}

export { isSchema } from './Schema';
export { isSchemaError } from './errors';

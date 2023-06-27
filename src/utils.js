export { isSchema } from './Schema';
export { isSchemaError } from './errors';

export function pick(obj, keys) {
  const result = {};
  for (let key of keys) {
    result[key] = obj[key];
  }
  return result;
}

export function omit(obj, keys) {
  const result = {};
  for (let key of Object.keys(obj || {})) {
    if (!keys.includes(key)) {
      result[key] = obj[key];
    }
  }
  return result;
}

export function canAllowEmptyString(options) {
  const { type, required, allowEmpty } = options;
  return type === 'string' && !required && allowEmpty !== false;
}

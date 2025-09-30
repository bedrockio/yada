export function canAllowEmptyString(options) {
  const { type, required, allowEmpty = true } = options;
  return type === 'string' && !required && allowEmpty;
}

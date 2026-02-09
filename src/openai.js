// Confirmed as of: 2026-02-09
const OPENAI_ALLOWED_FORMATS = [
  'date-time',
  'duration',
  'hostname',
  'date',
  'time',
  'email',
  'ipv4',
  'ipv6',
  'uuid',
];

export function toOpenAi(schema) {
  const { type, required, format } = schema.meta;
  if (type === 'object') {
    return schema.required();
  }

  if (!required) {
    schema = schema.required().nullable();
  }

  if (hasInvalidFormat(format)) {
    schema = schema.clone({
      format: null,
    });
  }

  return schema;
}

function hasInvalidFormat(format) {
  if (!format) {
    return false;
  }
  return !OPENAI_ALLOWED_FORMATS.includes(format);
}

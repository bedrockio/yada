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
  const { type, required, format, tags } = schema.meta;

  if (type === 'object') {
    return schema.required();
  } else if (type === 'array') {
    const { schemas } = schema.meta;
    if (schemas) {
      return schema.toArray().required();
    } else {
      return schema.required();
    }
  }

  // All fields in OpenAI flavor JSON schema must be required,
  // so make fields nullable to allow optional behvior.
  if (!required) {
    schema = schema.required().nullable();
  }

  if (hasInvalidFormat(format)) {
    schema = schema.clone({
      format: null,
    });
  }

  if (tags) {
    schema = schema.clone({
      tags: null,
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

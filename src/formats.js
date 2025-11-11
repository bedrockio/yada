// Confirmed working as of: 2025-11-11
// Tested with gpt-5-nano-2025-08-07
const OPENAI_ALLOWED_FORMATS = [
  'date-time',
  'date',
  'time',
  'email',
  'hostname',
  'ipv4',
  'ipv6',
  'uuid',
];

export function isAllowedFormat(format, options = {}) {
  const { style } = options;
  if (style === 'openai') {
    // OpenAI schema inputs will fail on unknown formats.
    // However these formats also offer useful guides for
    // the LLM so we want to keep them as much as possible.
    return isOpenAiAllowedFormat(format);
  } else if (format) {
    // JSON Schema has pre-defined types but also allows
    // custom formats so by default allow any format.
    return true;
  }
}

export function isOpenAiAllowedFormat(format) {
  return OPENAI_ALLOWED_FORMATS.includes(format);
}

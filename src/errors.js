export class ValidationError extends Error {
  constructor(message, details) {
    super(message);
    this.details = details;
  }

  toJSON() {
    return {
      ...(this.message && {
        message: this.message,
      }),
      details: this.details,
    };
  }
}

export class FieldError extends Error {
  constructor(message, details, meta = {}) {
    super(message || details.map((err) => err.message).join(' '));
    this.details = details;
    this.meta = meta;
  }

  toJSON() {
    const { label, ...rest } = this.meta;
    return {
      ...rest,
      details: this.details,
      message: this.message,
    };
  }
}

export class AssertionError extends Error {
  constructor(message, type) {
    super(message);
    this.type = type;
  }

  toJSON() {
    return {
      type: this.type,
      message: this.message,
    };
  }
}

export function isSchemaError(arg) {
  return arg instanceof ValidationError;
}

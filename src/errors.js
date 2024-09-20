import { getFullMessage } from './messages';
import { localize } from './localization';

export class LocalizedError extends Error {
  constructor(message, values = {}) {
    super(localize(message, values));
  }
}

export class ValidationError extends Error {
  static DEFAULT_MESSAGE = 'Validation failed.';

  constructor(arg, details = []) {
    super(getLocalizedMessage(arg) || ValidationError.DEFAULT_MESSAGE);
    this.type = 'validation';
    this.details = details;
  }

  toJSON() {
    const { details } = this;
    const message = this.getMessage();
    return {
      type: this.type,
      ...(message && {
        message,
      }),
      ...(details.length && {
        details: details.map((error) => {
          return serializeError(error);
        }),
      }),
    };
  }

  getMessage() {
    const { message } = this;
    // @ts-ignore
    const { DEFAULT_MESSAGE } = this.constructor;
    if (message && message !== DEFAULT_MESSAGE) {
      return message;
    }
  }

  getFullMessage(options) {
    return getFullMessage(this, {
      delimiter: ' ',
      ...options,
    });
  }
}

export class AssertionError extends ValidationError {
  constructor(message, type = 'assertion') {
    super(message);
    this.type = type;
  }
}

export class TypeError extends ValidationError {
  constructor(message, kind) {
    super(message);
    this.type = 'type';
    this.kind = kind;
  }

  isPrimitiveKind() {
    return this.kind !== 'array' && this.kind !== 'object';
  }

  toJSON() {
    return {
      ...super.toJSON(),
      kind: this.kind,
    };
  }
}

export class FormatError extends ValidationError {
  constructor(message, format) {
    super(message);
    this.type = 'format';
    this.format = format;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      format: this.format,
    };
  }
}

export class FieldError extends ValidationError {
  constructor(message, field, details) {
    super(message, details);
    this.type = 'field';
    this.field = field;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      field: this.field,
    };
  }
}

export class ElementError extends ValidationError {
  constructor(message, index, details) {
    super(message, details);
    this.type = 'element';
    this.index = index;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      index: this.index,
    };
  }
}

export class ArrayError extends ValidationError {
  constructor(message, details) {
    super(message, details);
    this.type = 'array';
  }
}

export class AllowedError extends ValidationError {
  constructor(message, details) {
    super(message, details);
    this.type = 'allowed';
  }
}

export function isSchemaError(arg) {
  return arg instanceof ValidationError;
}

function getLocalizedMessage(arg) {
  if (arg instanceof LocalizedError) {
    return arg.message;
  } else if (arg instanceof Error) {
    return localize(arg.message);
  } else {
    return localize(arg);
  }
}

function serializeError(error) {
  if (error.toJSON) {
    return error.toJSON();
  } else {
    return {
      ...error,
      message: error.message,
    };
  }
}

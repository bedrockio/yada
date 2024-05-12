import { getFullMessage } from './messages';
import { localize } from './localization';

export class LocalizedError extends Error {
  constructor(message, values = {}) {
    super(localize(message, values));
  }
}

export class ValidationError extends Error {
  constructor(arg, details = []) {
    super(getLocalizedMessage(arg));
    this.type = 'validation';
    this.details = details;
  }

  toJSON() {
    const { message, details } = this;
    return {
      type: this.type,
      ...(message && {
        message,
      }),
      ...(details.length && {
        details: details.map((error) => {
          return error.toJSON();
        }),
      }),
    };
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
    super(message);
    this.type = 'array';
    this.details = details;
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

import { getFullMessage } from './messages';
import { localize } from './localization';

export class LocalizedError extends Error {
  constructor(message, values) {
    super(localize(message, values));
  }
}

export class ValidationError extends Error {
  constructor(message, details = [], type = 'validation') {
    super(localize(message));
    this.details = details;
    this.type = type;
  }

  toJSON() {
    return {
      type: this.type,
      message: this.message,
      details: this.details,
    };
  }

  getFullMessage(options) {
    return getFullMessage(this, {
      delimiter: ' ',
      ...options,
    });
  }
}

export class FieldError extends ValidationError {
  constructor(message, field, original, details) {
    super(message, details, 'field');
    this.field = field;
    this.original = original;
    this.details = details;
  }

  toJSON() {
    return {
      field: this.field,
      ...super.toJSON(),
    };
  }
}

export class ElementError extends ValidationError {
  constructor(message, index, details) {
    super(message, details, 'element');
    this.index = index;
    this.details = details;
  }

  toJSON() {
    return {
      index: this.index,
      ...super.toJSON(),
    };
  }
}

export class AssertionError extends Error {
  constructor(message, type, original) {
    super(message);
    this.type = type;
    this.original = original;
  }

  toJSON() {
    return {
      type: this.type,
      message: this.message,
    };
  }
}

export class ArrayError extends Error {
  constructor(message, details) {
    super(message);
    this.details = details;
  }
}

export function isSchemaError(arg) {
  return (
    arg instanceof ValidationError ||
    arg instanceof AssertionError ||
    arg instanceof ArrayError
  );
}

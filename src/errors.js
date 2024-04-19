import { getFullMessage } from './messages';
import { localize } from './localization';

export class LocalizedError extends Error {
  constructor(message, values) {
    super(localize(message, values));
    this.values = values;
  }

  get type() {
    return this.values?.type;
  }
}

export class ValidationError extends Error {
  constructor(message, details = [], type = 'validation') {
    super(localize(message));
    this.details = details;
    this.type = type;
  }

  toJSON() {
    if (this.canRollup()) {
      const [first] = this.details;
      return {
        ...first.toJSON(),
        type: this.type,
      };
    } else {
      return {
        type: this.type,
        message: this.message,
        details: this.details.map((error) => {
          return error.toJSON();
        }),
      };
    }
  }

  canRollup() {
    const { details } = this;
    if (details.length !== 1) {
      return false;
    }
    const [first] = details;

    // Roll up field types as long as they are not
    // referencing nested fields.
    return this.isFieldType() && !first.isFieldType?.();
  }

  isFieldType() {
    return this.type === 'field' || this.type === 'element';
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
      ...super.toJSON(),
      field: this.field,
    };
  }
}

export class ElementError extends ValidationError {
  constructor(message, index, original, details) {
    super(message, details, 'element');
    this.index = index;
    this.original = original;
    this.details = details;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      index: this.index,
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

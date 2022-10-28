export class ValidationError extends Error {
  constructor(message, details) {
    super(message);
    this.details = details;
  }

  toJSON() {
    return {
      message: this.message,
      details: this.details,
    };
  }
}

export class FieldError extends Error {
  constructor(message, field, details) {
    super(message);
    this.field = field;
    this.details = details;
  }

  toJSON() {
    return {
      message: this.message,
      field: this.field,
      details: this.details,
    };
  }
}

export class ArrayError extends Error {
  constructor(message, details) {
    super(message);
    this.details = details;
  }
}

export class ElementError extends Error {
  constructor(message, index, details) {
    super(message);
    this.index = index;
    this.details = details;
  }

  toJSON() {
    return {
      message: this.message,
      index: this.index,
      details: this.details,
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
  return (
    arg instanceof ValidationError ||
    arg instanceof FieldError ||
    arg instanceof ArrayError ||
    arg instanceof AssertionError
  );
}

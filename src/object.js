import { omit, pick, set } from 'lodash';

import Schema, { isSchema } from './Schema';
import TypeSchema from './TypeSchema';
import { AggregateError, FieldError, LocalizedError } from './errors';

const APPEND_ASSERTION_TYPES = ['required', 'type', 'custom'];

const INTEGER_REG = /^\d+$/;

/**
 * @typedef {{ [key: string]: Schema } | {}} SchemaMap
 */

class ObjectSchema extends TypeSchema {
  constructor(meta) {
    super(Object, meta);
    this.validateInput();
    this.setup();
  }

  validateInput() {
    const { fields } = this.meta;
    for (let [key, value] of Object.entries(fields || {})) {
      if (!isSchema(value)) {
        throw new Error(`Key "${key}" must be a schema.`);
      }
    }
  }

  setup() {
    this.assert('type', (val) => {
      if (val === null || typeof val !== 'object') {
        throw new LocalizedError('Must be an object.');
      }
    });

    this.assert('fields', async (obj, options) => {
      const {
        path = [],
        original,
        stripEmpty,
        stripUnknown,
        allowFlatKeys,
        expandFlatKeys,
      } = options;

      const { fields } = this.meta;

      if (!fields) {
        return;
      }

      let passed = obj;

      if (expandFlatKeys) {
        passed = expandFlatSyntax(passed);
      }

      const keys = new Set([
        ...Object.keys(fields || {}),
        ...Object.keys(passed),
      ]);

      let errors = [];
      const result = {};

      for (let key of keys) {
        let value = passed[key];

        const schema = getSchema(fields, key, options);

        if (!schema) {
          if (stripUnknown) {
            continue;
          }
          throw new LocalizedError('Unknown field "{key}".', {
            type: 'field',
            key,
          });
        }

        if (schema.meta.strip?.(value, options)) {
          continue;
        }

        try {
          let isBaseObject = false;

          if (allowFlatKeys && value === undefined) {
            // When allowing keys like "profile.name", "profile" must still
            // be validated, but will not exist so expand the passed object
            // and take the base value.
            value = expandFlatSyntax(passed)[key];

            // If the flat key did not exist but the expanded key did then
            // we have a "base object". If both keys do not exist then the
            // validation result needs to be set as it could be a default.
            isBaseObject = value !== undefined;
          }

          const transformed = await schema.validate(value, {
            ...options,

            path: [...path, key],
            required: schema.meta.required,

            // The root object may be transformed by defaults
            // or returned values so re-pass it here.
            root: {
              ...obj,
              ...result,
            },

            // The original root represents the root object
            // before it was transformed.
            originalRoot: original,
          });

          if (transformed === '' && stripEmpty) {
            continue;
          } else if (isBaseObject) {
            // We do not want to return the "profile" object in the
            // result when only flat keys are passed, so continue here.
            continue;
          }

          if (transformed !== undefined) {
            result[key] = transformed;
          }
        } catch (error) {
          const { message } = schema.meta;
          errors.push(new FieldError(message, key, error.details));
        }
      }

      if (errors.length) {
        errors = normalizeErrors(errors, options);
        throw new AggregateError(this.meta.message, errors);
      }

      return result;
    });
  }

  /**
   * Gets the schema for the given field. Deep fields accept
   * either a string using dot syntax or an array representing
   * the path.
   *
   * @param {string|Array<string>} [path] The path of the field.
   */
  get(path) {
    const { fields } = this.meta;
    if (!fields) {
      throw new Error('Cannot select field on an open object schema.');
    }

    path = Array.isArray(path) ? path : path.split('.');

    const [name, ...rest] = path;
    const schema = fields[name];

    if (rest.length) {
      return schema?.get(rest);
    } else {
      return schema;
    }
  }

  /**
   * Returns the inner schema of an array field. This only makes
   * sense if the array field holds a single schema, so all other
   * scenarios will throw an error.
   *
   * @param {string|Array<string>} [path] The path of the field.
   */
  unwind(path) {
    path = Array.isArray(path) ? path.join('.') : path;
    const field = this.get(path);
    const { type, schema } = field.meta;

    if (type !== 'array') {
      throw new Error(`Field "${path}" is not an array schema.`);
    } else if (!schema) {
      throw new Error(`Field "${path}" does not have an inner schema.`);
    }

    return schema;
  }

  /**
   * Returns a new schema that only validates the selected fields.
   *
   * @param {...string} [names] Names to include.
   */
  pick(...names) {
    if (Array.isArray(names[0])) {
      names = names[0];
    }
    return new ObjectSchema({
      fields: pick(this.meta.fields, names),
    });
  }

  /**
   * Returns a new schema that omits fields.
   *
   * @param {...string} [names] Names to exclude.
   */
  omit(...names) {
    if (Array.isArray(names[0])) {
      names = names[0];
    }
    return new ObjectSchema({
      fields: omit(this.meta.fields, names),
    });
  }

  /**
   * Augments the object schema to make fields required.
   * Field names may be passed as an array or arguments.
   * Field names may be deep using dot syntax.
   *
   * @param {...string} fields
   * @param {Array<string>} fields
   */
  require(...fields) {
    if (!fields.length) {
      throw new Error('No fields specified.');
    }

    if (Array.isArray(fields[0])) {
      fields = fields[0];
    }

    const update = {};

    for (let field of fields) {
      const schema = this.get(field);
      if (!schema) {
        throw new Error(`Cannot find field "${field}".`);
      }
      set(update, field, schema.required());
    }

    return this.append(update);
  }

  /**
   * Augments the object schema to make all fields required.
   */
  requireAll() {
    const update = {};

    for (let field of Object.keys(this.meta.fields)) {
      set(update, field, this.get(field).required());
    }

    return this.append(update);
  }

  /**
   * Recursively transforms all fields including those in
   * nested schemas.
   * @param {Function} fn - Transform function that accepts an instance
   *   of the schema.
   * @returns {this}
   */
  transform(fn, root = true) {
    const update = {};

    for (let field of Object.keys(this.meta.fields || {})) {
      set(update, field, this.get(field).transform(fn, false));
    }

    const transformed = this.append(update);

    if (root) {
      // @ts-ignore
      return transformed;
    } else {
      return super.transform.call(transformed, fn);
    }
  }

  /**
   * Returns the schema's fields as an object allowing them
   * to be "spread" to create new schemas. Note that doing
   * this will mean that custom and required assertions on
   * the object itself will not be preserved. Compare to
   * {@link append} which preserves all assertions.
   */
  export() {
    return this.meta.fields || {};
  }

  /**
   * Appends another schema and returns a new one. Appended
   * schemas may have nested fields. Note that custom and
   * required assertions on the schemas are preserved. This
   * means that if either object schema is required then the
   * resulting merged schema will also be required. Compare
   * to {@link export} which exports the fields as an object.
   *
   * @param {SchemaMap|Schema} arg Object or schema to append.
   */
  append(arg) {
    let meta;
    let assertions = [...this.assertions];

    if (arg instanceof Schema) {
      meta = arg.meta;
      assertions = [...assertions, ...arg.assertions];
    } else {
      meta = {
        fields: arg,
      };
    }

    const fields = mergeFields(this.meta.fields, meta?.fields);

    const schema = new ObjectSchema({
      ...this.meta,
      ...meta,
      fields,
    });

    for (let assertion of assertions) {
      const { type } = assertion;
      if (APPEND_ASSERTION_TYPES.includes(type)) {
        schema.pushAssertion(assertion);
      }
    }

    return schema;
  }

  // Options

  /**
   * Remove properties that are empty strings.
   */
  stripEmpty() {
    return this.options({
      stripEmpty: true,
    });
  }

  /**
   * Remove properties not in the schema.
   */
  stripUnknown() {
    return this.options({
      stripUnknown: true,
    });
  }

  /**
   * Allow flat keys like `profile.name`.
   */
  allowFlatKeys() {
    return this.options({
      allowFlatKeys: true,
    });
  }

  /**
   * Expand flat keys into nested objects.
   */
  expandFlatKeys() {
    return this.options({
      expandFlatKeys: true,
    });
  }

  /**
   * `stripEmpty` - Removes properties that are empty strings.
   * `stripUnknown` - Removes properties not in the schema.
   * `allowFlatKeys` - Allows "flat" keys like `profile.name`.
   * `expendFlatKeys` - Expands "flat" keys into nested objects.
   *
   * @param {Object} [options]
   * @param {boolean} [options.stripEmpty]
   * @param {boolean} [options.stripUnknown]
   * @param {boolean} [options.allowFlatKeys]
   * @param {boolean} [options.expandFlatKeys]
   */
  options(options) {
    return super.options(options);
  }

  // Private

  toJsonSchema(options) {
    const { stripUnknown = false } = this.meta;

    const required = [];
    const properties = {};
    for (let [key, schema] of Object.entries(this.export())) {
      properties[key] = schema.toJsonSchema(options);
      if (schema.meta.required) {
        required.push(key);
      }
    }
    return {
      ...super.toJsonSchema(options),
      ...(Object.keys(properties).length > 0 && {
        properties,
        required,
        additionalProperties: stripUnknown,
      }),
    };
  }
}

function expandFlatSyntax(obj) {
  const result = { ...obj };
  for (let [key, value] of Object.entries(result)) {
    if (key.includes('.')) {
      delete result[key];
      set(result, key, value);
    }
  }
  return result;
}

function mergeFields(aFields, bFields) {
  if (!aFields || !bFields) {
    return aFields || bFields;
  }
  const result = { ...aFields };
  for (let key of Object.keys(bFields)) {
    const aSchema = aFields[key];
    const bSchema = bFields[key];

    if (aSchema instanceof ObjectSchema) {
      result[key] = aSchema.append(bSchema);
    } else {
      result[key] = bSchema;
    }
  }
  return result;
}

// Gets the schema for a field allowing for flat
// keys which may deeply traverse into the object.
function getSchema(fields, key, options) {
  const { allowFlatKeys } = options;

  let schema = fields[key];

  if (schema) {
    return schema;
  }

  if (!allowFlatKeys || !key.includes('.')) {
    return;
  }

  schema = fields;

  for (let part of key.split('.')) {
    const { type, fields } = schema?.meta || {};

    if (type === 'array') {
      // If the schema is an array schema then take the first
      // subschema, however only allow integers in this case,
      // for example: profiles.0.name.

      if (!INTEGER_REG.test(part)) {
        return;
      }

      schema = schema.meta.schema;
    } else if (fields) {
      schema = fields[part];
    } else {
      schema = schema?.[part];
    }
  }

  return schema;
}

// If flat keys are allowed then filter out errors
// that are the nested duplicates so that they match
// the actual fields that were passed.
function normalizeErrors(errors, options) {
  const { allowFlatKeys } = options;
  if (allowFlatKeys) {
    errors = errors.filter((error) => {
      const { field } = error;
      const flatField = getFlatField(error);

      if (field !== flatField) {
        return !errors.some((error) => {
          return error.field === flatField;
        });
      }

      return true;
    });
  }
  return errors;
}

function getFlatField(error) {
  const { field, details } = error;
  const path = [field];

  if (details.length === 1 && details[0] instanceof FieldError) {
    path.push(getFlatField(details[0]));
  }

  return path.join('.');
}

/**
 * Creates an [object schema](https://github.com/bedrockio/yada#object).
 *
 * @param {SchemaMap} [map] An map of keys to schemas.
 * If not passed any object shape will be allowed. If an
 * empty object is passed then no keys will be allowed.
 */
export default function (map) {
  return new ObjectSchema({
    fields: map,
  });
}

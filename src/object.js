import { set, pick, omit } from 'lodash';

import TypeSchema from './TypeSchema';
import { FieldError, LocalizedError } from './errors';
import Schema, { isSchema } from './Schema';

const APPEND_ASSERTION_TYPES = ['required', 'type', 'custom'];

/**
 * @typedef {{ [key: string]: Schema } | {}} SchemaMap
 */

class ObjectSchema extends TypeSchema {
  constructor(meta) {
    super(Object, meta);
    this.setup();
  }

  setup() {
    this.assert('type', (val) => {
      if (val === null || typeof val !== 'object') {
        throw new LocalizedError('Must be an object.');
      }
    });
    this.transform((obj, options) => {
      const { fields, stripUnknown, stripEmpty, preserveKeys } = options;
      if (obj) {
        const result = {};
        if (!preserveKeys) {
          obj = expandKeys(obj);
        }
        for (let key of Object.keys(obj)) {
          const value = obj[key];
          const isUnknown = !!fields && !(key in fields);

          if ((value === '' && stripEmpty) || (isUnknown && stripUnknown)) {
            continue;
          } else if (isUnknown) {
            throw new LocalizedError('Unknown field "{key}".', {
              key,
              type: 'field',
            });
          } else {
            result[key] = obj[key];
          }
        }
        return result;
      }
    });
    for (let [key, schema] of Object.entries(this.export())) {
      if (!isSchema(schema)) {
        throw new Error(`Key "${key}" must be a schema.`);
      }
      this.assert('field', async (obj, options) => {
        if (obj) {
          const { path = [], original } = options;
          const { strip, required } = schema.meta;
          const val = obj[key];

          options = {
            ...options,
            required,
            path: [...path, key],
          };

          if (strip && strip(val, options)) {
            delete obj[key];
            return;
          }
          try {
            // Do not pass down message into validators
            // to allow custom messages to take precedence.
            options = omit(options, 'message');
            const result = await schema.validate(val, {
              ...options,
              // The root object may have been transformed here
              // by defaults or values returned by custom functions
              // so re-pass it here.
              root: obj,
              // The original root represents the root object
              // before it was transformed.
              originalRoot: original,
            });
            if (result !== undefined) {
              return {
                ...obj,
                [key]: result,
              };
            }
          } catch (error) {
            const { message } = schema.meta;
            throw new FieldError(message, key, error.details);
          }
        }
      });
    }
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

    if (!schema) {
      throw new Error(`Cannot find field "${name}".`);
    }

    if (rest.length) {
      return schema.get(rest);
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
    const { schemas } = field.meta;
    if (!schemas) {
      throw new Error(`Field "${path}" is not an array schema.`);
    } else if (schemas.length !== 1) {
      throw new Error(`Field "${path}" should contain only one schema.`);
    }
    return schemas[0];
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
      set(update, field, this.get(field).required());
    }

    return this.append(update);
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

  /**
   * `stripEmpty` - Removes properties that are empty strings.
   * `stripUnknown` - Removes properties not in the schema.
   * `preserveKeys` - Prevents expansion of "flat" keys using dot syntax.
   *
   * @param {Object} [options]
   * @param {boolean} [options.stripEmpty]
   * @param {boolean} [options.stripUnknown]
   * @param {boolean} [options.preserveKeys]
   */
  options(options) {
    return super.options(options);
  }

  // Private

  toJSON(extra) {
    const { stripUnknown = false } = this.meta;

    const required = [];
    const properties = {};
    for (let [key, schema] of Object.entries(this.export())) {
      properties[key] = schema.toJSON(extra);
      if (schema.meta.required) {
        required.push(key);
      }
    }
    return {
      ...super.toJSON(extra),
      ...(Object.keys(properties).length > 0 && {
        properties,
        required,
        additionalProperties: stripUnknown,
      }),
    };
  }
}

function expandKeys(obj) {
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

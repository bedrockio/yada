import TypeSchema from './TypeSchema';
import { FieldError, LocalizedError } from './errors';
import { pick, omit } from './utils';
import Schema, { isSchema } from './Schema';

const BASE_ASSERTIONS = ['type', 'transform', 'field'];

/**
 * @typedef {{ [key: string]: Schema } | {}} SchemaMap
 */

class ObjectSchema extends TypeSchema {
  constructor(fields, meta) {
    super(Object, { ...meta, fields });
    this.setup();
  }

  /**
   * @private
   */
  setup() {
    this.assert('type', (val) => {
      if (val === null || typeof val !== 'object') {
        throw new LocalizedError('Must be an object.');
      }
    });
    this.transform((obj, options) => {
      const { fields, stripUnknown, stripEmpty, expandDotSyntax } = options;
      if (obj) {
        const result = {};
        if (expandDotSyntax) {
          obj = expandDotProperties(obj);
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
    for (let [key, schema] of Object.entries(this.getFields())) {
      if (!isSchema(schema)) {
        throw new Error(`Key "${key}" must be a schema`);
      }
      this.assert('field', async (obj, options) => {
        if (obj) {
          const { path = [] } = options;
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
            const result = await schema.validate(val, options);
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
   * @private
   */
  getFields() {
    return this.meta.fields || {};
  }

  /**
   * @param {SchemaMap|Schema} arg Object or schema to append.
   */
  // @ts-ignore
  append(arg) {
    let schema;
    if (arg instanceof ObjectSchema) {
      schema = arg;
    } else if (arg instanceof Schema) {
      // If the schema is of a different type then
      // simply append it and don't merge fields.
      return super.append(arg);
    } else {
      schema = new ObjectSchema(arg);
    }

    const fields = {
      ...this.meta.fields,
      ...schema.meta.fields,
    };

    const merged = new ObjectSchema(fields, {
      ...this.meta,
      ...schema.meta,
    });

    const assertions = [...this.assertions, ...schema.assertions];
    for (let assertion of assertions) {
      const { type } = assertion;
      if (!BASE_ASSERTIONS.includes(type)) {
        merged.pushAssertion(assertion);
      }
    }

    return merged;
  }

  /**
   * @param {...string} [names] Names to include.
   */
  pick(...names) {
    if (Array.isArray(names[0])) {
      names = names[0];
    }
    const fields = pick(this.meta.fields, names);

    return new ObjectSchema(fields, {
      ...this.meta,
    });
  }

  /**
   * @param {...string} [names] Names to exclude.
   */
  omit(...names) {
    if (Array.isArray(names[0])) {
      names = names[0];
    }
    const fields = omit(this.meta.fields, names);

    return new ObjectSchema(fields, {
      ...this.meta,
    });
  }

  toOpenApi(extra) {
    const properties = {};
    for (let [key, schema] of Object.entries(this.getFields())) {
      properties[key] = schema.toOpenApi(extra);
    }
    return {
      ...super.toOpenApi(extra),
      ...(Object.keys(properties).length > 0 && {
        properties,
      }),
    };
  }
}

function expandDotProperties(obj) {
  const result = {};
  for (let [key, val] of Object.entries(obj || {})) {
    const split = key.split('.');
    if (split.length > 1) {
      let node = result;
      for (let i = 0; i < split.length; i++) {
        const token = split[i];
        if (i === split.length - 1) {
          node[token] = val;
        } else {
          node[token] = {};
        }
        node = node[token];
      }
    } else {
      result[key] = val;
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
  return new ObjectSchema(map);
}

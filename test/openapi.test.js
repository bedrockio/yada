import yd from '../src';

describe('toOpenApi', () => {
  it('should describe a string schema', async () => {
    expect(yd.string().toOpenApi()).toEqual({
      type: 'string',
    });
    expect(yd.string().required().toOpenApi()).toEqual({
      type: 'string',
      required: true,
    });
    expect(yd.string().default('foo').toOpenApi()).toEqual({
      type: 'string',
      default: 'foo',
    });
    expect(yd.string().allow('foo', 'bar').toOpenApi()).toEqual({
      type: 'string',
      enum: ['foo', 'bar'],
    });
    expect(yd.string().email().toOpenApi()).toEqual({
      type: 'string',
      format: 'email',
    });
  });

  it('should describe an object schema', async () => {
    expect(yd.object().toOpenApi()).toEqual({
      type: 'object',
    });
    expect(yd.object({ foo: yd.string() }).toOpenApi()).toEqual({
      type: 'object',
      properties: {
        foo: {
          type: 'string',
        },
      },
      required: [],
      additionalProperties: false,
    });
  });

  it('should describe an array schema', async () => {
    expect(yd.array().toOpenApi()).toEqual({
      type: 'array',
    });
    expect(yd.array(yd.string()).toOpenApi()).toEqual({
      type: 'array',
      items: {
        type: 'string',
      },
    });
    expect(yd.array(yd.string(), yd.number()).toOpenApi()).toEqual({
      type: 'array',
      oneOf: [
        {
          type: 'string',
        },
        {
          type: 'number',
        },
      ],
    });
  });

  it('should describe a mixed type schema', async () => {
    expect(yd.any().toOpenApi()).toEqual({
      type: ['object', 'array', 'string', 'number', 'boolean', 'null'],
    });
    expect(yd.array(yd.any()).toOpenApi()).toEqual({
      type: 'array',
      items: {
        type: ['object', 'array', 'string', 'number', 'boolean', 'null'],
      },
    });
    expect(
      yd
        .object({
          any: yd.any(),
        })
        .toOpenApi(),
    ).toEqual({
      type: 'object',
      properties: {
        any: {
          type: ['object', 'array', 'string', 'number', 'boolean', 'null'],
        },
      },
      required: [],
      additionalProperties: false,
    });
  });

  it('should describe enum types', async () => {
    const schema = yd.allow(yd.string(), yd.array(yd.string()));
    expect(schema.toOpenApi()).toEqual({
      oneOf: [
        {
          type: 'string',
        },

        {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      ],
    });
  });

  it('should describe string enum types', async () => {
    const schema = yd.string().allow('foo', 'bar');
    expect(schema.toOpenApi()).toEqual({
      type: 'string',
      enum: ['foo', 'bar'],
    });
  });

  it('should describe mixed enum types', async () => {
    const schema = yd.allow(1, 2, yd.string());
    expect(schema.toOpenApi()).toEqual({
      oneOf: [
        {
          type: 'number',
          enum: [1, 2],
        },
        {
          type: 'string',
        },
      ],
    });
  });

  it('should describe mixed enum of same type', async () => {
    const schema = yd.allow(yd.string(), '');
    expect(schema.toOpenApi()).toEqual({
      oneOf: [
        {
          type: 'string',
        },
      ],
    });
  });

  it('should describe date formats', async () => {
    let schema = yd.date().iso();
    expect(schema.toOpenApi()).toEqual({
      type: 'string',
      format: 'date-time',
    });

    schema = yd.date().timestamp();
    expect(schema.toOpenApi()).toEqual({
      type: 'number',
      format: 'timestamp',
    });

    schema = yd.date().unix();
    expect(schema.toOpenApi()).toEqual({
      type: 'number',
      format: 'unix timestamp',
    });
  });

  it('should describe a tuple schema', async () => {
    const schema = yd.tuple(yd.string(), yd.number());
    expect(schema.toOpenApi()).toEqual({
      type: 'array',
      prefixItems: [
        {
          type: 'string',
        },
        { type: 'number' },
      ],
    });
  });

  it('should describe number min/max', async () => {
    let schema = yd.number().min(5).max(50);
    expect(schema.toOpenApi()).toEqual({
      type: 'number',
      minimum: 5,
      maximum: 50,
    });

    schema = yd.number().multiple(5);
    expect(schema.toOpenApi()).toEqual({
      type: 'number',
      multipleOf: 5,
    });
  });

  it('should describe string minLength/maxLength', async () => {
    const schema = yd.string().min(5).max(50);
    expect(schema.toOpenApi()).toEqual({
      type: 'string',
      minLength: 5,
      maxLength: 50,
    });
  });

  it('should describe nullable', async () => {
    const schema = yd.string().nullable();
    expect(schema.toOpenApi()).toEqual({
      type: 'string',
      nullable: true,
    });
  });

  it('should allow tagging a schema', async () => {
    const schema = yd
      .object({
        num: yd.number(),
        str: yd.string(),
      })
      .tag({
        'x-schema': 'my-schema',
      });

    expect(schema.toOpenApi()).toEqual({
      type: 'object',
      properties: {
        num: {
          type: 'number',
        },
        str: {
          type: 'string',
        },
      },
      required: [],
      additionalProperties: false,
      'x-schema': 'my-schema',
    });
  });

  it('should allow a description as a shortcut', async () => {
    const schema = yd
      .object({
        num: yd.number(),
        str: yd.string(),
      })
      .description('My Schema!');

    expect(schema.toOpenApi()).toEqual({
      type: 'object',
      description: 'My Schema!',
      properties: {
        num: {
          type: 'number',
        },
        str: {
          type: 'string',
        },
      },
      required: [],
      additionalProperties: false,
    });
  });

  it('should not override other tags', async () => {
    const schema = yd
      .string()
      .tag({
        'x-schema': 'my-schema',
      })
      .description('My Schema!');

    expect(schema.toOpenApi()).toEqual({
      type: 'string',
      'x-schema': 'my-schema',
      description: 'My Schema!',
    });
  });

  it('should be able to set metadata in the method', async () => {
    const schema = yd.string();
    expect(
      schema.toOpenApi({
        'x-schema': 'my-schema',
        description: 'My Schema!',
      }),
    ).toEqual({
      type: 'string',
      'x-schema': 'my-schema',
      description: 'My Schema!',
    });
  });

  it('should output a description for passwords', async () => {
    const schema = yd.string().password({
      minLength: 12,
      minNumbers: 3,
      minSymbols: 2,
      minLowercase: 1,
      minUppercase: 0,
    });
    expect(schema.toOpenApi()).toEqual({
      type: 'string',
      description:
        'A password of at least 12 characters containing 1 lowercase, 3 numbers, and 2 symbols.',
    });
  });

  it('should not fail on date with no format', async () => {
    expect(yd.date().toOpenApi()).toEqual({
      type: 'string',
      format: 'date-time',
    });
  });

  it('should allow a recursive function to tag inner fields', async () => {
    const schema = yd.object({
      start: yd.date().iso(),
    });

    const result = schema.toOpenApi({
      tag: (meta) => {
        if (meta.format === 'date-time') {
          return {
            'x-schema': 'DateTime',
          };
        }
      },
    });
    expect(result).toEqual({
      type: 'object',
      properties: {
        start: {
          type: 'string',
          format: 'date-time',
          'x-schema': 'DateTime',
        },
      },
      required: [],
      additionalProperties: false,
    });
  });

  it('should make a best effort to describe custom date defaults', async () => {
    expect(yd.date().default(Date.now).toOpenApi()).toEqual({
      type: 'string',
      format: 'date-time',
      default: 'now',
    });

    expect(
      yd
        .date()
        .default(() => {
          return new Date();
        })
        .toOpenApi(),
    ).toEqual({
      type: 'string',
      format: 'date-time',
      default: 'custom',
    });
  });

  it('should have required field on objects', async () => {
    // https://www.learnjsonschema.com/2020-12/validation/required/

    const schema = yd.object({
      name: yd.string().required(),
      age: yd.number(),
    });

    expect(schema.toOpenApi()).toEqual({
      type: 'object',
      properties: {
        name: {
          type: 'string',
          required: true,
        },
        age: {
          type: 'number',
        },
      },
      required: ['name'],
      additionalProperties: false,
    });
  });

  describe('additionalProperties', () => {
    // https://www.learnjsonschema.com/2020-12/applicator/additionalproperties/

    it('should be false by default', async () => {
      const schema = yd.object({
        name: yd.string().required(),
      });

      expect(schema.toOpenApi()).toEqual({
        type: 'object',
        properties: {
          name: {
            type: 'string',
            required: true,
          },
        },
        required: ['name'],
        additionalProperties: false,
      });
    });

    it('should be true when unknown allowed', async () => {
      const schema = yd
        .object({
          name: yd.string().required(),
        })
        .options({
          stripUnknown: true,
        });

      expect(schema.toOpenApi()).toEqual({
        type: 'object',
        properties: {
          name: {
            type: 'string',
            required: true,
          },
        },
        required: ['name'],
        additionalProperties: true,
      });
    });
  });
});

import yd from '../src';

describe('toJsonSchema', () => {
  it('should describe a string schema', async () => {
    expect(yd.string().toJsonSchema()).toEqual({
      type: 'string',
    });
    expect(yd.string().required().toJsonSchema()).toEqual({
      type: 'string',
    });
    expect(yd.string().default('foo').toJsonSchema()).toEqual({
      type: 'string',
      default: 'foo',
    });
    expect(yd.string().allow('foo', 'bar').toJsonSchema()).toEqual({
      type: 'string',
      enum: ['foo', 'bar'],
    });
    expect(yd.string().email().toJsonSchema()).toEqual({
      type: 'string',
      format: 'email',
    });
  });

  it('should describe a number schema', async () => {
    expect(yd.number().toJsonSchema()).toEqual({
      type: 'number',
    });
  });

  it('should describe an integer type', async () => {
    expect(yd.number().integer().toJsonSchema()).toEqual({
      type: 'integer',
    });
  });

  it('should describe an object schema', async () => {
    expect(yd.object().toJsonSchema()).toEqual({
      type: 'object',
    });
    expect(yd.object({ foo: yd.string() }).toJsonSchema()).toEqual({
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
    expect(yd.array().toJsonSchema()).toEqual({
      type: 'array',
    });
    expect(yd.array(yd.string()).toJsonSchema()).toEqual({
      type: 'array',
      items: {
        type: 'string',
      },
    });
    expect(yd.array(yd.allow(yd.string(), yd.number())).toJsonSchema()).toEqual(
      {
        type: 'array',
        items: {
          anyOf: [
            {
              type: 'string',
            },
            {
              type: 'number',
            },
          ],
        },
      },
    );
  });

  it('should describe a mixed type schema', async () => {
    expect(yd.any().toJsonSchema()).toEqual({});
    expect(yd.array(yd.any()).toJsonSchema()).toEqual({
      type: 'array',
      items: {},
    });
    expect(
      yd
        .object({
          any: yd.any(),
        })
        .toJsonSchema(),
    ).toEqual({
      type: 'object',
      properties: {
        any: {},
      },
      required: [],
      additionalProperties: false,
    });
  });

  it('should describe enum types', async () => {
    const schema = yd.allow(yd.string(), yd.array(yd.string()));
    expect(schema.toJsonSchema()).toEqual({
      anyOf: [
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
    expect(schema.toJsonSchema()).toEqual({
      type: 'string',
      enum: ['foo', 'bar'],
    });
  });

  it('should describe mixed enum types', async () => {
    const schema = yd.allow(1, 2, yd.string());
    expect(schema.toJsonSchema()).toEqual({
      anyOf: [
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
    expect(schema.toJsonSchema()).toEqual({
      anyOf: [
        {
          type: 'string',
        },
      ],
    });
  });

  it('should describe date formats', async () => {
    let schema = yd.date().iso();
    expect(schema.toJsonSchema()).toEqual({
      type: 'string',
      format: 'date-time',
    });

    schema = yd.date().timestamp();
    expect(schema.toJsonSchema()).toEqual({
      type: 'integer',
    });

    schema = yd.date().unix();
    expect(schema.toJsonSchema()).toEqual({
      type: 'integer',
    });
  });

  it('should describe a tuple schema', async () => {
    const schema = yd.tuple(yd.string(), yd.number());
    expect(schema.toJsonSchema()).toEqual({
      type: 'array',
      prefixItems: [
        {
          type: 'string',
        },
        {
          type: 'number',
        },
      ],
    });
  });

  it('should describe number min/max', async () => {
    let schema = yd.number().min(5).max(50);
    expect(schema.toJsonSchema()).toEqual({
      type: 'number',
      minimum: 5,
      maximum: 50,
    });

    schema = yd.number().multiple(5);
    expect(schema.toJsonSchema()).toEqual({
      type: 'number',
      multipleOf: 5,
    });
  });

  it('should describe string minLength/maxLength', async () => {
    const schema = yd.string().min(5).max(50);
    expect(schema.toJsonSchema()).toEqual({
      type: 'string',
      minLength: 5,
      maxLength: 50,
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

    expect(schema.toJsonSchema()).toEqual({
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

    expect(schema.toJsonSchema()).toEqual({
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

    expect(schema.toJsonSchema()).toEqual({
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
    expect(schema.toJsonSchema()).toEqual({
      type: 'string',
      description:
        'A password of at least 12 characters containing 1 lowercase, 3 numbers, and 2 symbols.',
    });
  });

  it('should not fail on date with no format', async () => {
    expect(yd.date().toJsonSchema()).toEqual({
      type: 'string',
      format: 'date-time',
    });
  });

  it('should allow a recursive function to tag inner fields', async () => {
    const schema = yd.object({
      start: yd.date().iso(),
    });

    const result = schema.toJsonSchema({
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
    expect(yd.date().default(Date.now).toJsonSchema()).toEqual({
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
        .toJsonSchema(),
    ).toEqual({
      type: 'string',
      format: 'date-time',
      default: 'custom',
    });
  });

  it('should strip custom extensions', async () => {
    const schema = yd.object({
      name: yd.string().tag({
        'x-schema': 'my-schema',
      }),
    });
    const result = schema.toJsonSchema({
      stripExtensions: true,
    });
    expect(result).toEqual({
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
      },
      required: [],
      additionalProperties: false,
    });
  });

  it('should strip custom extensions on alternates', async () => {
    const schema = yd.allow(
      yd.string().tag({ 'x-name': 'string' }),
      yd.number().tag({ 'x-name': 'number' }),
    );
    const result = schema.toJsonSchema({
      stripExtensions: true,
    });
    expect(result).toEqual({
      anyOf: [
        {
          type: 'string',
        },
        {
          type: 'number',
        },
      ],
    });
  });

  describe('nullable', () => {
    it('should describe basic nullable', async () => {
      expect(yd.string().nullable().toJsonSchema()).toEqual({
        type: ['string', 'null'],
      });
      expect(yd.object().nullable().toJsonSchema()).toEqual({
        type: ['object', 'null'],
      });
    });

    it('should describe nullable for alternates', async () => {
      const schema = yd.allow(yd.string().nullable(), yd.number().nullable());
      expect(schema.toJsonSchema()).toEqual({
        anyOf: [
          {
            type: ['string', 'null'],
          },
          {
            type: ['number', 'null'],
          },
        ],
      });
    });

    it('should describe complex nullable object', async () => {
      const schema = yd
        .object({
          array: yd.array().nullable(),
        })
        .nullable();

      expect(schema.toJsonSchema()).toEqual({
        type: ['object', 'null'],
        properties: {
          array: {
            type: ['array', 'null'],
          },
        },
        required: [],
        additionalProperties: false,
      });
    });
  });

  describe('spec', () => {
    describe('required', () => {
      it('should have required field on object root', async () => {
        // https://www.learnjsonschema.com/2020-12/validation/required/

        const schema = yd.object({
          name: yd.string().required(),
          age: yd.number(),
        });

        expect(schema.toJsonSchema()).toEqual({
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            age: {
              type: 'number',
            },
          },
          required: ['name'],
          additionalProperties: false,
        });
      });
    });

    describe('additionalProperties', () => {
      // https://www.learnjsonschema.com/2020-12/applicator/additionalproperties/

      it('should be false by default', async () => {
        const schema = yd.object({
          name: yd.string().required(),
        });

        expect(schema.toJsonSchema()).toEqual({
          type: 'object',
          properties: {
            name: {
              type: 'string',
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

        expect(schema.toJsonSchema()).toEqual({
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
          },
          required: ['name'],
          additionalProperties: true,
        });
      });
    });
  });
});

describe('toOpenApi', () => {
  it('should be an alias for toJsonSchema', async () => {
    const schema = yd.object({
      name: yd.string().required(),
      age: yd.number().required(),
    });

    expect(schema.toOpenApi()).toEqual({
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        age: {
          type: 'number',
        },
      },
      required: ['name', 'age'],
      additionalProperties: false,
    });
  });

  it('should allow conditional tagging of inner fields', async () => {
    const schema = yd.object({
      date: yd.date().iso(),
    });

    const json = schema.toOpenApi({
      tag(meta) {
        if (meta.format === 'date-time') {
          return {
            'x-schema': 'DateTime',
          };
        }
      },
    });

    expect(json).toEqual({
      type: 'object',
      properties: {
        date: {
          type: 'string',
          format: 'date-time',
          'x-schema': 'DateTime',
        },
      },
      required: [],
      additionalProperties: false,
    });
  });
});

describe('requireAll', () => {
  it('should make top level fields required', async () => {
    const schema = yd
      .object({
        text: yd.string(),
        numbers: yd.array(yd.number()),
        next: yd.allow([
          yd.object({
            type: yd.string().allow('text', 'boolean'),
          }),
          yd.object({
            type: yd.string().allow('range'),
            min: yd.number(),
            max: yd.number(),
          }),
        ]),
      })
      .requireAll();

    expect(schema.toJsonSchema()).toEqual({
      type: 'object',
      properties: {
        text: {
          type: 'string',
        },
        numbers: {
          type: 'array',
          items: {
            type: 'number',
          },
        },
        next: {
          anyOf: [
            {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['text', 'boolean'],
                },
              },
              required: [],
              additionalProperties: false,
            },
            {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['range'],
                },
                min: {
                  type: 'number',
                },
                max: {
                  type: 'number',
                },
              },
              required: [],
              additionalProperties: false,
            },
          ],
        },
      },
      required: ['text', 'numbers', 'next'],
      additionalProperties: false,
    });
  });

  it('should work with array fields', async () => {
    const schema = yd
      .object({
        profiles: yd.array(
          yd.object({
            id: yd.string(),
            name: yd.string(),
          }),
        ),
      })
      .requireAll();

    expect(schema.toJsonSchema()).toEqual({
      type: 'object',
      properties: {
        profiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
              name: {
                type: 'string',
              },
            },
            required: [],
            additionalProperties: false,
          },
        },
      },
      required: ['profiles'],
      additionalProperties: false,
    });
  });
});

describe('transform', () => {
  it('should not include object root level', async () => {
    const schema = yd.object().transform((s) => {
      return s.nullable();
    });

    expect(schema.toJsonSchema()).toEqual({
      type: 'object',
    });
  });

  it('should make all nested fields required', async () => {
    const schema = yd
      .object({
        text: yd.string(),
        numbers: yd.array(yd.number()),
        next: yd.allow([
          yd.object({
            type: yd.string().allow('text', 'boolean'),
          }),
          yd.object({
            type: yd.string().allow('range'),
            min: yd.number(),
            max: yd.number(),
          }),
        ]),
      })
      .transform((s) => {
        return s.required();
      });

    expect(schema.toJsonSchema()).toEqual({
      type: 'object',
      properties: {
        text: {
          type: 'string',
        },
        numbers: {
          type: 'array',
          items: {
            type: 'number',
          },
        },
        next: {
          anyOf: [
            {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['text', 'boolean'],
                },
              },
              required: ['type'],
              additionalProperties: false,
            },
            {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['range'],
                },
                min: {
                  type: 'number',
                },
                max: {
                  type: 'number',
                },
              },
              required: ['type', 'min', 'max'],
              additionalProperties: false,
            },
          ],
        },
      },
      required: ['text', 'numbers', 'next'],
      additionalProperties: false,
    });
  });

  it('should work with array fields', async () => {
    const schema = yd
      .object({
        profiles: yd.array(
          yd.object({
            id: yd.string(),
            name: yd.string(),
          }),
        ),
      })
      .transform((s) => {
        return s.required();
      });

    expect(schema.toJsonSchema()).toEqual({
      type: 'object',
      properties: {
        profiles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
              },
              name: {
                type: 'string',
              },
            },
            required: ['id', 'name'],
            additionalProperties: false,
          },
        },
      },
      required: ['profiles'],
      additionalProperties: false,
    });
  });

  it('should not mask array description', async () => {
    const schema = yd
      .object({
        profiles: yd.array(yd.string()).description('An array of strings.'),
      })
      .description('A profile container.')
      .transform((s) => {
        return s.required();
      });

    expect(schema.toJsonSchema()).toEqual({
      type: 'object',
      description: 'A profile container.',
      properties: {
        profiles: {
          type: 'array',
          description: 'An array of strings.',
          items: {
            type: 'string',
          },
        },
      },
      required: ['profiles'],
      additionalProperties: false,
    });
  });

  it('should work on null', async () => {
    const schema = yd
      .object({
        name: yd.allow(null, yd.string()),
      })
      .transform((s) => {
        return s.required();
      });

    expect(schema.toJsonSchema()).toEqual({
      type: 'object',
      properties: {
        name: {
          anyOf: [
            {
              type: 'null',
            },
            {
              type: 'string',
            },
          ],
        },
      },
      required: ['name'],
      additionalProperties: false,
    });
  });

  it('should work for nested arrays', async () => {
    const schema = yd.array(yd.array()).transform((s) => {
      return s.nullable();
    });

    expect(schema.toJsonSchema()).toEqual({
      type: 'array',
      items: {
        type: ['array', 'null'],
      },
    });
  });

  it('should conditionally transform', async () => {
    const schema = yd
      .object({
        name: yd.string(),
        age: yd.number(),
      })
      .transform((s) => {
        if (s.meta.type === 'string') {
          return s.required().nullable();
        }
      });

    expect(schema.toJsonSchema()).toEqual({
      type: 'object',
      properties: {
        name: {
          type: ['string', 'null'],
        },
        age: {
          type: 'number',
        },
      },
      required: ['name'],
      additionalProperties: false,
    });
  });
});

describe('toJSON', () => {
  it('should serialized correctly', async () => {
    const schema = yd.object({
      name: yd.string().required(),
      age: yd.number().required(),
    });

    expect(JSON.parse(JSON.stringify(schema))).toEqual({
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        age: {
          type: 'number',
        },
      },
      required: ['name', 'age'],
      additionalProperties: false,
    });
  });

  it('should serialize correctly when nested', async () => {
    let schema;
    let result;

    schema = yd.allow('foo');
    result = JSON.parse(JSON.stringify({ schema }));
    expect(result).toEqual({
      schema: {
        type: 'string',
        enum: ['foo'],
      },
    });

    schema = yd.object({
      foo: yd.allow('bar').required(),
    });
    result = JSON.parse(JSON.stringify({ schema }));
    expect(result).toEqual({
      schema: {
        type: 'object',
        properties: {
          foo: {
            type: 'string',
            enum: ['bar'],
          },
        },
        required: ['foo'],
        additionalProperties: false,
      },
    });
  });
});

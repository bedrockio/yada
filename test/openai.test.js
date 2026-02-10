import yd from '../src';

describe('toOpenAi', () => {
  it('should force all fields required and allow null', async () => {
    const schema = yd.object({
      name: yd.string(),
      profile: yd.object({
        name: yd.string().required(),
        age: yd.number(),
      }),
    });
    const result = schema.toOpenAi().toJsonSchema();
    expect(result).toEqual({
      type: 'object',
      properties: {
        name: {
          type: ['string', 'null'],
        },
        profile: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            age: {
              type: ['number', 'null'],
            },
          },
          required: ['name', 'age'],
          additionalProperties: false,
        },
      },
      required: ['name', 'profile'],
      additionalProperties: false,
    });
  });

  it('should strip off invalid formats', async () => {
    const schema = yd.object({
      id: yd.string().mongo().required(),
    });
    const result = schema.toOpenAi().toJsonSchema();
    expect(result).toEqual({
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
      },
      required: ['id'],
      additionalProperties: false,
    });
  });

  it('should strip tags', async () => {
    const schema = yd.object({
      id: yd.string().tag({
        'x-my-field': 'foo',
      }),
    });
    const result = schema.toOpenAi().toJsonSchema();
    expect(result).toEqual({
      type: 'object',
      properties: {
        id: {
          type: ['string', 'null'],
        },
      },
      required: ['id'],
      additionalProperties: false,
    });
  });

  it('should not allow null for array fields', async () => {
    const schema = yd.object({
      services: yd.array(yd.string().allow('foo', 'bar')),
    });
    const result = schema.toOpenAi().toJsonSchema();

    expect(result).toEqual({
      type: 'object',
      properties: {
        services: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['foo', 'bar'],
          },
        },
      },
      required: ['services'],
      additionalProperties: false,
    });
  });

  it('should describe a GeoJSON point', async () => {
    const schema = yd.object({
      type: yd.string().allow('Point').required(),
      coordinates: yd.tuple(yd.number(), yd.number()).required(),
    });

    const result = schema.toOpenAi().toJsonSchema();

    expect(result).toEqual({
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['Point'],
        },
        coordinates: {
          type: 'array',
          items: {
            type: 'number',
          },
        },
      },
      required: ['type', 'coordinates'],
      additionalProperties: false,
    });
  });

  it('should use allow for tuples of different types', async () => {
    const schema = yd.object({
      stringOrNumber: yd.tuple([yd.string(), yd.number()]),
    });

    const result = schema.toOpenAi().toJsonSchema();

    expect(result).toEqual({
      type: 'object',
      properties: {
        stringOrNumber: {
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
      },
      required: ['stringOrNumber'],
      additionalProperties: false,
    });
  });
});

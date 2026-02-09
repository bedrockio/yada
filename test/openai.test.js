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
});

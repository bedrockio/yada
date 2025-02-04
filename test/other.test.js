import yd from '../src';
import { assertPass, assertFail, assertErrorMessage } from './utils';
import { isSchema, isSchemaError } from '../src';

describe('default', () => {
  it('should set a default value', async () => {
    const schema = yd.any().default('a');
    expect(await schema.validate()).toBe('a');
    expect(await schema.validate(undefined)).toBe('a');
    expect(await schema.validate(null)).toBe(null);
    expect(await schema.validate('b')).toBe('b');
  });

  it('should set a default value in an object', async () => {
    const schema = yd.object({
      a: yd.any().default('a'),
      b: yd.string(),
    });
    expect(await schema.validate()).toBe(undefined);
    expect(await schema.validate({})).toEqual({ a: 'a' });
    expect(await schema.validate({ a: undefined })).toEqual({ a: 'a' });
    expect(await schema.validate({ a: null })).toEqual({ a: null });
    expect(await schema.validate({ a: 'b' })).toEqual({ a: 'b' });
    expect(await schema.validate({ b: 'b' })).toEqual({ a: 'a', b: 'b' });
  });

  it('should allow passing a function for a default', async () => {
    const schema = yd.any().default(() => {
      return 'a';
    });
    expect(await schema.validate()).toBe('a');
    expect(await schema.validate(undefined)).toBe('a');
    expect(await schema.validate(null)).toBe(null);
    expect(await schema.validate('b')).toBe('b');
  });

  it('should allow passing Date.now', async () => {
    const schema = yd.date().default(Date.now);
    expect(await schema.validate()).toBeInstanceOf(Date);
    expect(await schema.validate(undefined)).toBeInstanceOf(Date);
    expect(await schema.validate('2020-01-01T00:00:00.000Z')).toEqual(
      new Date('2020-01-01T00:00:00.000Z'),
    );
  });
});

describe('append', () => {
  it('should allow appending to a string schema', async () => {
    const custom = yd.custom((str) => {
      if (str === 'fop') {
        throw new Error('You misspelled foo!');
      }
    });

    const schema = yd.string().append(custom);

    await assertPass(schema, 'foo');
    await assertFail(schema, 'fop', 'You misspelled foo!');
  });

  it('should append a custom schema to an object schema', async () => {
    const custom = yd.custom((obj) => {
      if (obj.foo === 'fop') {
        throw new Error('You misspelled foo!');
      }
    });

    const schema = yd
      .object({
        foo: yd.string(),
      })
      .append(custom);

    await assertPass(schema, { foo: 'foo' });
    await assertFail(schema, { foo: 'fop' }, 'You misspelled foo!');
  });

  it('should preserve defaults', async () => {
    const custom = yd.custom((str) => {
      if (str === 'fop') {
        throw new Error('You misspelled foo!');
      }
    });
    const schema = yd.string().required();

    await assertPass(schema.default('foo').append(custom));
    await assertPass(schema.append(custom).default('foo'));
    await assertFail(
      schema.default('fop').append(custom),
      undefined,
      'You misspelled foo!',
    );
    await assertFail(
      schema.append(custom).default('fop'),
      undefined,
      'You misspelled foo!',
    );
  });
});

describe('isSchema', () => {
  it('should correctly identify a schema', () => {
    expect(isSchema(yd.string())).toBe(true);
    expect(isSchema(yd.date())).toBe(true);
    expect(isSchema(yd.object({}))).toBe(true);
    expect(isSchema(yd.custom(() => {}))).toBe(true);
    expect(isSchema(undefined)).toBe(false);
    expect(isSchema(null)).toBe(false);
    expect(isSchema({})).toBe(false);
    expect(isSchema('a')).toBe(false);
  });
});

describe('isSchemaError', () => {
  it('should correctly identify a schema error', async () => {
    let error;
    try {
      await yd.string().validate(1);
    } catch (err) {
      error = err;
    }
    expect(isSchemaError(error)).toBe(true);
    expect(isSchemaError(new Error())).toBe(false);
  });
});

describe('options', () => {
  describe('stripUnknown', () => {
    it('should optionally strip out unknown keys', async () => {
      const schema = yd.object({
        a: yd.string(),
        b: yd.string(),
      });

      const options = {
        stripUnknown: true,
      };

      await assertPass(schema, undefined, undefined, options);
      await assertPass(schema, {}, {}, options);

      await assertPass(
        schema,
        { a: 'a', b: 'b', c: 'c' },
        { a: 'a', b: 'b' },
        options,
      );
    });

    it('should respect preceeding append and custom validations', async () => {
      const schema = yd
        .object({
          a: yd.string(),
          b: yd.string(),
        })
        .append({
          c: yd.string(),
        })
        .custom((val) => {
          if (Object.keys(val).length === 0) {
            throw new Error('Object must not be empty.');
          }
        });

      const options = {
        stripUnknown: true,
      };

      await assertPass(
        schema,
        {
          a: 'a',
          b: 'b',
          c: 'c',
          d: 'd',
        },
        {
          a: 'a',
          b: 'b',
          c: 'c',
        },
        options,
      );
      await assertFail(schema, {}, 'Object must not be empty.');
    });

    it('should respect following append and custom validations', async () => {
      const schema = yd
        .object({
          a: yd.string(),
          b: yd.string(),
        })
        .custom((val) => {
          if (Object.keys(val).length === 0) {
            throw new Error('Object must not be empty.');
          }
        })
        .append({
          c: yd.string(),
        });

      const options = {
        stripUnknown: true,
      };

      await assertPass(
        schema,
        {
          a: 'a',
          b: 'b',
          c: 'c',
          d: 'd',
        },
        {
          a: 'a',
          b: 'b',
          c: 'c',
        },
        options,
      );
      await assertFail(schema, {}, 'Object must not be empty.');
    });
  });

  describe('casting', () => {
    it('should cast a boolean', async () => {
      const schema = yd.boolean();
      const options = {
        cast: true,
      };
      await assertPass(schema, 'true', true, options);
      await assertPass(schema, 'True', true, options);
      await assertPass(schema, 'false', false, options);
      await assertPass(schema, 'False', false, options);
      await assertPass(schema, '0', false, options);
      await assertPass(schema, '1', true, options);
      await assertFail(schema, 'foo', 'Must be a boolean.');
    });

    it('should cast a nested boolean', async () => {
      const schema = yd.object({
        a: yd.boolean(),
      });
      const options = {
        cast: true,
      };
      await assertPass(schema, { a: 'true' }, { a: true }, options);
      await assertPass(schema, { a: 'True' }, { a: true }, options);
      await assertPass(schema, { a: 'false' }, { a: false }, options);
      await assertPass(schema, { a: 'False' }, { a: false }, options);
      await assertFail(schema, { a: 'foo' }, 'Must be a boolean.');
    });

    it('should not cast a boolean without flag', async () => {
      const schema = yd.boolean();
      await assertFail(schema, 'true', 'Must be a boolean.');
    });

    it('should cast a number', async () => {
      const schema = yd.number();
      const options = {
        cast: true,
      };
      await assertPass(schema, '0', 0, options);
      await assertPass(schema, '1', 1, options);
      await assertPass(schema, '1.1', 1.1, options);
      await assertFail(schema, 'foo', 'Must be a number.');
      await assertFail(schema, 'null', 'Must be a number.');
    });

    it('should cast a nested number', async () => {
      const schema = yd.object({
        a: yd.number(),
      });
      const options = {
        cast: true,
      };
      await assertPass(schema, { a: '0' }, { a: 0 }, options);
      await assertPass(schema, { a: '1' }, { a: 1 }, options);
      await assertPass(schema, { a: '1.1' }, { a: 1.1 }, options);
      await assertFail(schema, { a: 'foo' }, 'Must be a number.');
      await assertFail(schema, { a: 'null' }, 'Must be a number.');
    });

    it('should not cast a number without flag', async () => {
      const schema = yd.number();
      await assertFail(schema, '0', 'Must be a number.');
    });

    it('should cast to an array from commas', async () => {
      const schema = yd.object({
        a: yd.array(),
        b: yd.string(),
      });
      const options = {
        cast: true,
      };
      const result = await schema.validate({ a: 'a,b,c', b: 'b' }, options);
      expect(result.a).toEqual(['a', 'b', 'c']);
      expect(result.b).toBe('b');
    });

    it('should cast to an array of specific type', async () => {
      const schema = yd.object({
        a: yd.array(yd.number()),
        b: yd.string(),
      });
      const options = {
        cast: true,
      };
      const result = await schema.validate({ a: '1,2,3', b: 'b' }, options);
      expect(result.a).toEqual([1, 2, 3]);
      expect(result.b).toBe('b');
    });

    it('should not cast to an array without flag', async () => {
      const schema = yd.object({
        a: yd.array(yd.number()),
        b: yd.string(),
      });
      await assertFail(schema, { a: '1,2,3', b: 'b' }, 'Must be an array.');
    });

    it('should cast a string', async () => {
      const schema = yd.string();
      const options = {
        cast: true,
      };
      await assertPass(schema, '1', '1', options);
      await assertPass(schema, 1, '1', options);
    });

    it('should not cast when multiple are allowed', async () => {
      const schema = yd.object({
        include: yd.allow(yd.string(), yd.array(yd.string())),
      });

      const result = await schema.validate(
        {
          include: ['foo', 'bar'],
        },
        {
          cast: true,
        },
      );
      expect(result).toEqual({
        include: ['foo', 'bar'],
      });
    });
  });

  describe('chaining', () => {
    it('should allow options to be burned in with chained method', async () => {
      const schema = yd
        .object({
          a: yd.array(yd.number()),
          b: yd.number(),
        })
        .options({
          cast: true,
          stripUnknown: true,
        });

      await assertPass(
        schema,
        {
          a: '1,2,3',
          b: '4',
          c: '5',
        },
        {
          a: [1, 2, 3],
          b: 4,
        },
      );

      await assertFail(
        schema,
        {
          b: 'b',
        },
        'Must be a number.',
      );
    });
  });

  describe('expandDotSyntax', () => {
    it('should expand dot syntax', async () => {
      const schema = yd.object({
        profile: yd.object({
          name: yd.string(),
        }),
      });

      const options = {
        expandDotSyntax: true,
      };

      await assertPass(
        schema,
        {
          'profile.name': 'foo',
        },
        {
          profile: {
            name: 'foo',
          },
        },
        options,
      );
    });
  });
});

describe('errors', () => {
  it('should have a default error message', async () => {
    const schema = yd.string();
    await assertErrorMessage(schema, 3, 'Validation failed.');
  });

  it('should allow a custom message', async () => {
    const schema = yd.string().message('Needs a string');
    await assertErrorMessage(schema, 3, 'Needs a string');
  });

  it('should have correct error messages for complex nested schema', async () => {
    const schema = yd.object({
      fields: yd.array(
        yd.object({
          images: yd.array(
            yd.object({
              name: yd.string(),
            }),
          ),
        }),
      ),
    });
    try {
      await schema.validate({
        fields: [
          {
            images: {
              name: 'foo',
            },
          },
        ],
      });
    } catch (error) {
      expect(error.getFullMessage()).toBe(
        '"fields.0.images" must be an array.',
      );
      expect(error.toJSON()).toEqual({
        type: 'validation',
        details: [
          {
            type: 'field',
            field: 'fields',
            details: [
              {
                type: 'array',
                details: [
                  {
                    type: 'element',
                    index: 0,
                    details: [
                      {
                        type: 'field',
                        field: 'images',
                        details: [
                          {
                            type: 'type',
                            kind: 'array',
                            message: 'Must be an array.',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });
    }
  });
});

describe('misc', () => {
  it('should have access to root object', async () => {
    const schema = yd.object({
      a: yd.array(yd.number()),
      b: yd.number().custom((num, { root }) => {
        if (!root.a.includes(root.b)) {
          throw new Error('"a" must include "b"');
        }
      }),
    });
    await assertPass(schema, { a: [1, 2, 3], b: 1 });
    await assertFail(schema, { a: [1, 2, 3], b: 4 }, '"a" must include "b"');
  });

  it('should have access to original root object', async () => {
    const schema = yd
      .object({
        profile: yd.object({
          name: yd.string().custom((val, { originalRoot }) => {
            if (originalRoot.id !== 'id') {
              throw new Error('Original root not passed.');
            }
          }),
        }),
      })
      .options({
        stripUnknown: true,
      });
    await assertPass(schema, {
      profile: {
        id: 'id',
        name: 'foo',
      },
    });
  });

  it('should have access to current path', async () => {
    const schema = yd.object({
      a: yd.object({
        b: yd.number().custom((num, { path }) => {
          expect(path).toEqual(['a', 'b']);
        }),
      }),
    });
    await schema.validate({
      a: {
        b: 3,
      },
    });
  });

  it('should correctly validate chained formats', async () => {
    let schema;

    schema = yd.string().lowercase().email();
    await assertPass(schema, undefined, undefined);
    await assertPass(schema, 'bar@foo.com', 'bar@foo.com');
    await assertPass(schema, 'BAR@FOO.COM', 'bar@foo.com');

    schema = yd.string().lowercase().email().default('Foo@bar.com');
    await assertPass(schema, undefined, 'foo@bar.com');
    await assertPass(schema, 'bar@foo.com', 'bar@foo.com');
    await assertPass(schema, 'BAR@foo.com', 'bar@foo.com');

    schema = yd.string().required().email().default('foo@bar.com');
    await assertPass(schema, undefined, 'foo@bar.com');
    await assertPass(schema, 'bar@foo.com', 'bar@foo.com');
    await assertPass(schema, 'BAR@foo.com', 'BAR@foo.com');
  });

  it('should be able to inspect a schema', async () => {
    const schema = yd.object({
      profile: yd.object({
        firstName: yd.string(),
        lastName: yd.string(),
      }),
    });
    const expected = `
{
  "type": "object",
  "properties": {
    "profile": {
      "type": "object",
      "properties": {
        "firstName": {
          "type": "string"
        },
        "lastName": {
          "type": "string"
        }
      }
    }
  }
}
    `;
    expect(schema.inspect()).toBe(expected.trim());
  });

  it('should be able to coerce an object inside allow', async () => {
    const schema = yd.allow(
      yd.string(),
      yd
        .object({
          id: yd.string(),
        })
        .custom((obj) => {
          return obj.id;
        }),
    );
    const result = await schema.validate({
      id: 'fake id',
    });
    expect(result).toBe('fake id');
  });
});

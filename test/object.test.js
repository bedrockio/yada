import yd from '../src';
import { assertFail, assertPass } from './utils';

describe('object', () => {
  it('should validate a basic object', async () => {
    const schema = yd.object({
      name: yd.string(),
    });
    await assertPass(schema, undefined);
    await assertPass(schema, { name: 'a' });
    await assertFail(schema, { name: 1 }, 'Must be a string.');
    await assertFail(schema, 1, 'Must be an object.');
    await assertFail(schema, null, 'Must be an object.');
  });

  it('should validate an object with a required field', async () => {
    const schema = yd.object({
      name: yd.string().required(),
    });
    await assertPass(schema, undefined);
    await assertPass(schema, { name: 'a' });
    await assertFail(schema, {}, 'Value is required.');
    await assertFail(schema, { name: 1 }, 'Must be a string.');
    await assertFail(schema, 1, 'Must be an object.');
    await assertFail(schema, null, 'Must be an object.');
  });

  it('should validate a required object', async () => {
    const schema = yd
      .object({
        name: yd.string(),
      })
      .required();
    await assertPass(schema, { name: 'a' });
    await assertFail(schema, undefined, 'Value is required.');
    await assertFail(schema, { name: 1 }, 'Must be a string.');
    await assertFail(schema, 1, 'Must be an object.');
  });

  it('should validate all fields', async () => {
    const schema = yd
      .object({
        a: yd.string().required(),
        b: yd.string().required(),
      })
      .required();
    await assertFail(schema, {}, ['Value is required.', 'Value is required.']);
  });

  it('should allow a custom validation', async () => {
    const schema = yd
      .object({
        name: yd
          .string()
          .required()
          .custom((val) => {
            if (val.match(/^[A-Z]/)) {
              throw new Error('Must start with lower case letter.');
            }
          })
          .custom((val) => {
            if (val.length < 4) {
              throw new Error('Must be at least 4 characters.');
            }
          }),
      })
      .required();
    await assertPass(schema, { name: 'abcd' });
    await assertFail(schema, { name: 12 }, 'Must be a string.');
    await assertFail(
      schema,
      { name: 'ABCD' },
      'Must start with lower case letter.',
    );
    await assertFail(schema, { name: 'abc' }, 'Must be at least 4 characters.');
    await assertFail(schema, { name: 'Abc' }, [
      'Must start with lower case letter.',
      'Must be at least 4 characters.',
    ]);
  });

  it('should convert date fields', async () => {
    const schema = yd.object({
      start: yd.date().iso(),
    });
    const { start } = await schema.validate({ start: '2020-01-01' });
    expect(start).toBeInstanceOf(Date);
  });

  it('should convert custom fields', async () => {
    const schema = yd.object({
      name: yd.custom(() => {
        return 'hello';
      }),
    });
    const { name } = await schema.validate({ name: '2020-01-01' });
    expect(name).toBe('hello');
  });

  it('should validate xnor as custom validator', async () => {
    const schema = yd
      .object({
        a: yd.string(),
        b: yd.string(),
      })
      .custom((obj) => {
        if (!!obj.a === !!obj.b) {
          throw new Error('Either "a" or "b" must be passed.');
        }
      });
    await assertPass(schema, { a: 'a' });
    await assertPass(schema, { b: 'b' });
    await assertFail(schema, {}, 'Either "a" or "b" must be passed.');
    await assertFail(
      schema,
      { a: 'a', b: 'b' },
      'Either "a" or "b" must be passed.',
    );
  });

  it('should fail on unknown keys by default', async () => {
    const schema = yd.object({
      a: yd.string(),
      b: yd.string(),
    });
    await assertPass(schema, {
      a: 'a',
      b: 'b',
    });
    await assertFail(
      schema,
      {
        a: 'a',
        b: 'b',
        c: 'c',
      },
      'Unknown field "c".',
    );
  });

  it('not fail on unknown keys when no schema is defined', async () => {
    const schema = yd.object();
    const result = await schema.validate({
      foo: 'bar',
    });
    expect(result).toEqual({
      foo: 'bar',
    });
  });

  it('should pass through all options to nested schemas', async () => {
    let foo;
    const schema = yd.object({
      a: yd.custom((val, options) => {
        foo = options.foo;
      }),
    });
    await assertPass(
      schema,
      { a: 'b' },
      { a: 'b' },
      {
        foo: 'bar',
      },
    );
    expect(foo).toBe('bar');
  });

  it('should not allow unknown fields for empty objects', async () => {
    const schema = yd.object({});
    await assertFail(schema, { foo: 'bar' }, 'Unknown field "foo".');
  });

  describe('append', () => {
    it('should allow appending an object schema', async () => {
      const schema1 = yd.object({
        foo: yd.string().required(),
      });
      const schema2 = yd.object({
        bar: yd.string().required(),
      });
      const schema = schema1.append(schema2);
      await assertPass(schema, { foo: 'foo', bar: 'bar' });
      await assertFail(schema, { foo: 'foo' }, 'Value is required.');
      await assertFail(schema, { bar: 'bar' }, 'Value is required.');
    });

    it('should allow appending a plain object', async () => {
      const schema1 = yd.object({
        foo: yd.string().required(),
      });
      const schema2 = {
        bar: yd.string().required(),
      };
      const schema = schema1.append(schema2);
      await assertPass(schema, { foo: 'foo', bar: 'bar' });
      await assertFail(schema, { foo: 'foo' }, 'Value is required.');
      await assertFail(schema, { bar: 'bar' }, 'Value is required.');
    });

    it('should keep options when appending', async () => {
      const schema1 = yd
        .object({
          foo: yd.string().required(),
        })
        .options({
          stripUnknown: true,
        });
      const schema2 = {
        bar: yd.string().required(),
      };
      const schema = schema1.append(schema2);

      await assertPass(schema, {
        foo: 'foo',
        bar: 'bar',
        baz: 'baz',
      });
    });

    it('should append with required', async () => {
      const schema1 = yd.object({
        name: yd.string(),
      });
      const schema2 = yd
        .object({
          name: yd.string(),
        })
        .required();
      const schema = schema1.append(schema2);
      await assertPass(schema, { name: 'Foo' });
      await assertFail(schema, undefined, 'Value is required.');
    });

    it('should override options with incoming', async () => {
      const schema1 = yd
        .object({
          foo: yd.string().required(),
        })
        .options({
          stripUnknown: true,
        });
      const schema2 = yd
        .object({
          bar: yd.string().required(),
        })
        .options({
          stripUnknown: false,
        });
      const schema = schema1.append(schema2);
      await assertFail(
        schema,
        { foo: 'foo', bar: 'bar', baz: 'baz' },
        'Unknown field "baz".',
      );
    });

    it('should override fields already set', async () => {
      const schema1 = yd.object({
        foo: yd.string(),
      });
      const schema2 = yd.object({
        foo: yd.number(),
      });
      const schema = schema1.append(schema2);
      await assertPass(schema, { foo: 3 });
      await assertFail(schema, { foo: 'foo' }, 'Must be a number.');
    });

    it('should append deeply', async () => {
      const schema1 = yd.object({
        profile: yd.object({
          firstName: yd.string(),
        }),
      });
      const schema2 = yd.object({
        profile: yd.object({
          lastName: yd.string(),
        }),
      });
      const schema = schema1.append(schema2);
      await assertPass(schema, {
        profile: {
          firstName: 'Foo',
          lastName: 'Bar',
        },
      });
      await assertPass(schema, { profile: { firstName: 'Foo' } });
      await assertPass(schema, { profile: { lastName: 'Bar' } });
      await assertPass(schema, { profile: {} });
      await assertPass(schema, {});

      await assertFail(
        schema,
        { firstName: 'Foo' },
        'Unknown field "firstName".',
      );
      await assertFail(
        schema,
        { lastName: 'Bar' },
        'Unknown field "lastName".',
      );
      await assertFail(
        schema,
        { profile: { firstName: 3 } },
        'Must be a string.',
      );
    });

    it('should append a deep plain object', async () => {
      const schema1 = yd.object({
        profile: yd.object({
          firstName: yd.string(),
        }),
      });
      const schema2 = {
        profile: {
          lastName: yd.string(),
        },
      };
      const schema = schema1.append(schema2);
      await assertPass(schema, {
        profile: {
          firstName: 'Foo',
          lastName: 'Bar',
        },
      });
      await assertPass(schema, { profile: { firstName: 'Foo' } });
      await assertPass(schema, { profile: { lastName: 'Bar' } });
      await assertPass(schema, { profile: {} });
      await assertPass(schema, {});

      await assertFail(
        schema,
        { firstName: 'Foo' },
        'Unknown field "firstName".',
      );
      await assertFail(
        schema,
        {
          lastName: 'Bar',
        },
        'Unknown field "lastName".',
      );
      await assertFail(
        schema,
        {
          profile: {
            firstName: 3,
          },
        },
        'Must be a string.',
      );
    });

    it('should not merge default values', async () => {
      const schema = yd
        .object({
          a: yd.string(),
        })
        .append(
          yd.object({
            nested: yd
              .object({
                b: yd.string(),
              })
              .default({
                b: 'c',
              }),
          }),
        );
      await assertPass(schema, { a: 'a' });
    });
  });

  describe('export', () => {
    it('should allow a schema to be exported to its fields', async () => {
      const schema = yd
        .object({
          firstName: yd.string(),
          lastName: yd.string(),
        })
        .options({
          stripUnknown: true,
        });

      const newSchema = yd.object({
        ...schema.export(),
      });
      await assertPass(newSchema, { firstName: 'Foo', lastName: 'Bar' });
      await assertFail(newSchema, { foo: 'foo' }, 'Unknown field "foo".');
    });
  });

  describe('get', () => {
    it('should get a field', async () => {
      const schema = yd.object({
        firstName: yd.string(),
        lastName: yd.string().required(),
      });

      const firstName = schema.get('firstName');
      await assertPass(firstName, 'Foo');
      await assertPass(firstName, '');
      await assertPass(firstName, undefined);

      const lastName = schema.get('lastName');
      await assertPass(lastName, 'Foo');
      await assertFail(lastName, '', 'Value is required.');
      await assertFail(lastName, undefined, 'Value is required.');
    });

    it('should deeply get a field by a path', async () => {
      const schema = yd.object({
        user: yd.object({
          profile: yd.object({
            firstName: yd.string(),
            lastName: yd.string().required(),
          }),
        }),
      });

      const firstName = schema.get('user.profile.firstName');
      await assertPass(firstName, 'Foo');
      await assertPass(firstName, '');
      await assertPass(firstName, undefined);

      const lastName = schema.get('user.profile.lastName');
      await assertPass(lastName, 'Foo');
      await assertFail(lastName, '', 'Value is required.');
      await assertFail(lastName, undefined, 'Value is required.');
    });

    it('should deeply get a field by an array path', async () => {
      const schema = yd.object({
        user: yd.object({
          profile: yd.object({
            firstName: yd.string(),
            lastName: yd.string().required(),
          }),
        }),
      });

      const firstName = schema.get(['user', 'profile', 'firstName']);
      await assertPass(firstName, 'Foo');
      await assertPass(firstName, '');
      await assertPass(firstName, undefined);

      const lastName = schema.get(['user', 'profile', 'lastName']);
      await assertPass(lastName, 'Foo');
      await assertFail(lastName, '', 'Value is required.');
      await assertFail(lastName, undefined, 'Value is required.');
    });

    it('should get an intermediary object schema', async () => {
      const schema = yd.object({
        user: yd.object({
          profile: yd.object({
            firstName: yd.string(),
            lastName: yd.string().required(),
          }),
        }),
      });

      const profile = schema.get('user.profile');
      await assertPass(profile, {
        firstName: 'Foo',
        lastName: 'Bar',
      });
      await assertFail(
        profile,
        {
          firstName: 'Foo',
        },
        'Value is required.',
      );
    });

    it('should not error if field is not found', async () => {
      const schema = yd.object({});
      expect(schema.get('bad')).toBeUndefined();
    });

    it('should error if no fields defined', async () => {
      const schema = yd.object();

      expect(() => {
        schema.get('bad');
      }).toThrow('Cannot select field on an open object schema.');
    });

    it('should error if path is too deep', async () => {
      const schema = yd.object({
        firstName: yd.string(),
        lastName: yd.string().required(),
      });

      expect(() => {
        schema.get('firstName.foo');
      }).toThrow('"get" not implemented by StringSchema.');
    });
  });

  describe('unwind', () => {
    it('should unwind an array schema', async () => {
      const schema = yd.object({
        profiles: yd.array(
          yd.object({
            name: yd.string().required(),
          }),
        ),
      });

      const profile = schema.unwind('profiles');
      await assertPass(profile, { name: 'Foo' });
      await assertPass(profile, undefined);

      await assertFail(profile, { bad: 'Foo' }, 'Unknown field "bad".');
      await assertFail(profile, {}, 'Value is required.');
    });

    it('should error if field is not an array', async () => {
      const schema = yd.object({
        profiles: yd.string(),
      });

      expect(() => {
        schema.unwind('profiles');
      }).toThrow('Field "profiles" is not an array schema.');
    });

    it('should error if no inner schemas on array', async () => {
      const schema = yd.object({
        profiles: yd.array(),
      });

      expect(() => {
        schema.unwind('profiles');
      }).toThrow('Field "profiles" does not have an inner schema.');
    });
  });

  describe('require', () => {
    it('should require specific fields', async () => {
      const schema = yd
        .object({
          firstName: yd.string(),
          lastName: yd.string(),
        })
        .require('firstName');

      await assertPass(schema, { firstName: 'Foo' });
      await assertPass(schema, { firstName: 'Foo', lastName: 'Bar' });
      await assertFail(schema, { lastName: 'Bar' }, 'Value is required.');
      await assertFail(schema, {}, 'Value is required.');
    });

    it('should require specific deep fields', async () => {
      const schema = yd
        .object({
          profile: yd.object({
            firstName: yd.string(),
            lastName: yd.string(),
          }),
        })
        .require('profile.firstName');

      await assertPass(schema, { profile: { firstName: 'Foo' } });
      await assertPass(schema, {
        profile: { firstName: 'Foo', lastName: 'Bar' },
      });
      // Note profile object is not required here.
      await assertPass(schema, {});

      await assertFail(
        schema,
        { profile: { lastName: 'Bar' } },
        'Value is required.',
      );
      await assertFail(schema, { profile: {} }, 'Value is required.');
    });

    it('should deeply require a field by an array path', async () => {
      const schema = yd
        .object({
          user: yd.object({
            profile: yd.object({
              firstName: yd.string(),
              lastName: yd.string(),
            }),
          }),
        })
        .require(['user.profile.firstName']);

      await assertPass(schema, {
        user: {
          profile: {
            firstName: 'Foo',
          },
        },
      });
      await assertFail(
        schema,
        {
          user: {
            profile: {
              lastName: 'Bar',
            },
          },
        },
        'Value is required.',
      );
    });

    it('should require an intermediary object schema', async () => {
      const schema = yd
        .object({
          user: yd.object({
            profile: yd.object({
              name: yd.string(),
            }),
          }),
        })
        .require('user.profile');

      await assertPass(schema, {
        user: {
          profile: {
            name: 'Foo',
          },
        },
      });
      await assertPass(schema, {
        user: {
          profile: {},
        },
      });
      await assertFail(
        schema,
        {
          user: {},
        },
        'Value is required.',
      );
    });

    it('should error if field does not exist', async () => {
      const schema = yd.object({});

      expect(() => {
        schema.require('bad');
      }).toThrow('Cannot find field "bad".');
    });

    it('should error if no fields defined', async () => {
      const schema = yd.object();

      expect(() => {
        schema.require('bad');
      }).toThrow('Cannot select field on an open object schema.');
    });

    it('should error if path is too deep', async () => {
      const schema = yd.object({
        firstName: yd.string(),
        lastName: yd.string(),
      });

      expect(() => {
        schema.get('firstName.foo');
      }).toThrow('"get" not implemented by StringSchema.');
    });
  });

  describe('requireAll', () => {
    it('should require all fields', async () => {
      const schema = yd
        .object({
          number: yd.number(),
          profile: yd.object({
            firstName: yd.string(),
            lastName: yd.string(),
          }),
        })
        .requireAll();

      await assertPass(schema, {
        number: 1,
        profile: {},
      });
      await assertPass(schema, {
        number: 1,
        profile: {
          firstName: 'Foo',
          lastName: 'Bar',
        },
      });
      await assertFail(
        schema,
        {
          number: 1,
        },
        ['Value is required.'],
      );
      await assertFail(
        schema,
        {
          profile: {},
        },
        ['Value is required.'],
      );
    });
  });

  describe('transform', () => {
    it('should deeply transform all fields', async () => {
      const schema = yd
        .object({
          name: yd.string(),
          profile: yd.object({
            name: yd.string(),
          }),
          options: yd.allow([
            yd.object({
              name: yd.string(),
            }),
            yd.object({
              age: yd.number(),
            }),
          ]),
        })
        .transform((s) => {
          return s.required().nullable();
        });

      await assertPass(schema, {
        name: 'top',
        profile: {
          name: 'inner',
        },
        options: {
          name: 'inner',
        },
      });

      await assertFail(schema, {}, [
        'Value is required.',
        'Value is required.',
        'Value is required.',
      ]);

      await assertFail(
        schema,
        {
          name: 'top',
          profile: {
            name: 'inner',
          },
        },
        'Value is required.',
      );

      await assertFail(
        schema,
        {
          name: 'top',
          options: {
            name: 'inner',
          },
        },
        'Value is required.',
      );
    });
  });

  describe('pick', () => {
    it('should pick fields with arguments', async () => {
      const schema = yd
        .object({
          firstName: yd.string(),
          lastName: yd.string(),
        })
        .pick('firstName');
      await assertPass(schema, { firstName: 'Foo' });
      await assertFail(
        schema,
        {
          firstName: 'Foo',
          lastName: 'Bar',
        },
        'Unknown field "lastName".',
      );
      await assertFail(
        schema,
        { lastName: 'Bar' },
        'Unknown field "lastName".',
      );
    });

    it('should pick fields with array', async () => {
      const schema = yd
        .object({
          age: yd.number().required(),
          firstName: yd.string().required(),
          lastName: yd.string().required(),
        })
        .pick(['firstName', 'lastName']);
      await assertPass(schema, {
        firstName: 'Foo',
        lastName: 'Bar',
      });
      await assertFail(
        schema,
        {
          age: 25,
        },
        'Unknown field "age".',
      );
      await assertFail(
        schema,
        {
          firstName: 'Foo',
          lastName: 'Bar',
          age: 25,
        },
        'Unknown field "age".',
      );
    });
  });

  describe('omit', () => {
    it('should omit fields with arguments', async () => {
      const schema = yd
        .object({
          firstName: yd.string(),
          lastName: yd.string(),
        })
        .omit('firstName');
      await assertPass(schema, { lastName: 'Bar' });
      await assertFail(
        schema,
        {
          firstName: 'Foo',
          lastName: 'Bar',
        },
        'Unknown field "firstName".',
      );
      await assertFail(
        schema,
        { firstName: 'Bar' },
        'Unknown field "firstName".',
      );
    });

    it('should omit fields with array', async () => {
      const schema = yd
        .object({
          age: yd.number().required(),
          firstName: yd.string().required(),
          lastName: yd.string().required(),
        })
        .omit(['firstName', 'lastName']);
      await assertPass(schema, {
        age: 25,
      });
      await assertFail(
        schema,
        {
          age: 25,
          firstName: 'Foo',
        },
        'Unknown field "firstName".',
      );
      await assertFail(
        schema,
        {
          age: 25,
          firstName: 'Foo',
          lastName: 'Bar',
        },
        'Unknown field "firstName".',
      );
    });
  });

  it('should explicitly fail on keys that are not schemas', async () => {
    expect(() => {
      yd.object({
        name: 'foo',
      });
    }).toThrow('Key "name" must be a schema');
  });

  it('should pass defaults along to custom validators in other fields', async () => {
    const schema = yd.object({
      type: yd.string().default('email'),
      phone: yd.custom((val, { root }) => {
        if (root.type === 'email') {
          throw new Error('Phone cannot be passed when "type" is "email".');
        }
      }),
    });
    await assertPass(schema, {});
    await assertPass(schema, {
      type: 'phone',
      phone: 'phone',
    });
    await assertFail(
      schema,
      { phone: 'phone' },
      'Phone cannot be passed when "type" is "email".',
    );
  });

  describe('strip', () => {
    it('should conditionally strip out fields', async () => {
      const schema = yd.object({
        name: yd.string(),
        age: yd.number().strip((val, { self }) => {
          return !self;
        }),
      });
      const result = await schema.validate(
        {
          name: 'Brett',
          age: 25,
        },
        {
          isPrivate: true,
        },
      );
      expect(result).toEqual({
        name: 'Brett',
      });
    });
  });

  describe('stripUnknown', () => {
    it('should strip out unknown fields', async () => {
      const schema = yd
        .object({
          foo: yd.string(),
        })
        .options({
          stripUnknown: true,
        });

      expect(
        await schema.validate({
          foo: 'foo',
          bar: 'bar',
          baz: 'baz',
        }),
      ).toEqual({
        foo: 'foo',
      });
    });

    it('should provide a shortcut method', async () => {
      const schema = yd
        .object({
          foo: yd.string(),
        })
        .stripUnknown();

      expect(
        await schema.validate({
          foo: 'foo',
          bar: 'bar',
        }),
      ).toEqual({
        foo: 'foo',
      });
    });
  });

  describe('stripEmpty', () => {
    it('should strip out empty fields', async () => {
      const schema = yd
        .object({
          firstName: yd.string(),
          lastName: yd.string(),
        })
        .options({
          stripEmpty: true,
        });

      expect(
        await schema.validate({
          firstName: 'Foo',
          lastName: '',
        }),
      ).toEqual({
        firstName: 'Foo',
      });

      expect(
        await schema.validate({
          firstName: '',
          lastName: 'Bar',
        }),
      ).toEqual({
        lastName: 'Bar',
      });

      expect(
        await schema.validate({
          firstName: '',
          lastName: '',
        }),
      ).toEqual({});
    });

    it('should provide a shortcut method', async () => {
      const schema = yd
        .object({
          name: yd.string(),
        })
        .stripEmpty();

      expect(
        await schema.validate({
          name: '',
        }),
      ).toEqual({});
    });
  });

  describe('allowFlatKeys', () => {
    it('should not allow flat syntax by default', async () => {
      const schema = yd.object({
        foo: yd.string(),
        profile: yd.object({
          name: yd.string(),
        }),
      });

      await assertFail(
        schema,
        {
          foo: 'bar',
          'profile.name': 'foo',
        },
        'Unknown field "profile.name".',
      );

      await assertPass(schema, {
        foo: 'bar',
        profile: {
          name: 'foo',
        },
      });

      const result = await schema.validate({
        foo: 'bar',
        profile: {
          name: 'foo',
        },
      });
      expect(result).toEqual({
        foo: 'bar',
        profile: {
          name: 'foo',
        },
      });
    });

    it('should allow flat syntax by option', async () => {
      const schema = yd
        .object({
          foo: yd.string(),
          profile: yd.object({
            name: yd.string(),
          }),
        })
        .options({
          allowFlatKeys: true,
        });

      await assertPass(schema, {
        foo: 'bar',
        'profile.name': 'foo',
      });

      await assertPass(schema, {
        foo: 'bar',
        profile: {
          name: 'foo',
        },
      });

      await assertFail(
        schema,
        {
          foo: 'bar',
          'profile.baz': 'foo',
        },
        'Unknown field "profile.baz".',
      );

      const result = await schema.validate({
        foo: 'bar',
        'profile.name': 'foo',
      });
      expect(result).toEqual({
        foo: 'bar',
        'profile.name': 'foo',
      });
    });

    it('should allow flat syntax in array schema', async () => {
      const schema = yd
        .object({
          profiles: yd.array(
            yd.object({
              name: yd.string(),
            }),
          ),
        })
        .options({
          allowFlatKeys: true,
        });

      await assertPass(schema, {
        'profiles.0.name': 'foo',
      });

      await assertPass(schema, {
        profiles: [
          {
            name: 'foo',
          },
        ],
      });

      await assertFail(
        schema,
        {
          'profiles.0.baz': 'foo',
        },
        ['Unknown field "profiles.0.baz".'],
      );

      await assertFail(
        schema,
        {
          'profiles.moo.name': 'foo',
        },
        ['Unknown field "profiles.moo.name".'],
      );

      await assertFail(
        schema,
        {
          'profiles.1.4.name': 'foo',
        },
        ['Unknown field "profiles.1.4.name".'],
      );

      await assertFail(
        schema,
        {
          'profiles.1a.name': 'foo',
        },
        ['Unknown field "profiles.1a.name".'],
      );

      await assertFail(
        schema,
        {
          'profiles. 1.name': 'foo',
        },
        ['Unknown field "profiles. 1.name".'],
      );
    });

    it('should not allow flat syntax in non-nested', async () => {
      const schema = yd
        .object({
          profile: yd.string(),
        })
        .options({
          allowFlatKeys: true,
        });

      await assertFail(
        schema,
        {
          'profile.name': 'foo',
        },
        ['Unknown field "profile.name".'],
      );
    });

    it('should allow flat syntax on non-object arrays', async () => {
      const schema = yd
        .object({
          profiles: yd.array(yd.string()),
        })
        .options({
          allowFlatKeys: true,
        });

      await assertPass(schema, {
        'profiles.0': 'foo',
      });

      await assertFail(
        schema,
        {
          'profiles.0.name': 'foo',
        },
        ['Unknown field "profiles.0.name".'],
      );
    });

    it('should fail with fields correct', async () => {
      const schema = yd
        .object({
          profile: yd.object({
            name: yd.string(),
          }),
        })
        .options({
          allowFlatKeys: true,
        });

      try {
        await schema.validate({
          'profile.name': 32,
        });
      } catch (error) {
        expect(error.toJSON()).toEqual({
          type: 'validation',
          details: [
            {
              type: 'field',
              field: 'profile.name',
              details: [
                {
                  type: 'type',
                  kind: 'string',
                  message: 'Must be a string.',
                },
              ],
            },
          ],
        });
      }
    });

    it('should not fail on required parent object', async () => {
      const schema = yd
        .object({
          terms: yd
            .object({
              tos: yd.allow(true).required(),
              privacy: yd.allow(true).required(),
            })
            .required(),
        })
        .options({
          allowFlatKeys: true,
        });

      await assertPass(schema, {
        terms: {
          tos: true,
          privacy: true,
        },
      });

      await assertPass(schema, {
        'terms.tos': true,
        'terms.privacy': true,
      });

      await assertFail(
        schema,
        {
          'terms.tos': true,
        },
        'Value is required.',
      );

      await assertFail(schema, {}, 'Value is required.');
    });

    it('should provide a shortcut method', async () => {
      const schema = yd
        .object({
          profile: yd.object({
            name: yd.string(),
          }),
        })
        .allowFlatKeys();

      await assertPass(schema, {
        'profile.name': 'foo',
      });
    });
  });

  describe('expandFlatKeys', () => {
    it('should not expand flat syntax by default', async () => {
      const schema = yd.object({
        foo: yd.string(),
        profile: yd.object({
          name: yd.string(),
        }),
      });

      await assertFail(
        schema,
        {
          foo: 'bar',
          'profile.name': 'foo',
        },
        'Unknown field "profile.name".',
      );

      await assertPass(schema, {
        foo: 'bar',
        profile: {
          name: 'foo',
        },
      });

      const result = await schema.validate({
        foo: 'bar',
        profile: {
          name: 'foo',
        },
      });
      expect(result).toEqual({
        foo: 'bar',
        profile: {
          name: 'foo',
        },
      });
    });

    it('should expand flat syntax by option', async () => {
      const schema = yd
        .object({
          foo: yd.string(),
          profile: yd.object({
            name: yd.string(),
          }),
        })
        .options({
          expandFlatKeys: true,
        });

      await assertPass(schema, {
        foo: 'bar',
        'profile.name': 'foo',
      });

      await assertPass(schema, {
        foo: 'bar',
        profile: {
          name: 'foo',
        },
      });

      const result = await schema.validate({
        foo: 'bar',
        'profile.name': 'foo',
      });
      expect(result).toEqual({
        foo: 'bar',
        profile: {
          name: 'foo',
        },
      });
    });

    it('should provide a shortcut method', async () => {
      const schema = yd
        .object({
          profile: yd.object({
            name: yd.string(),
          }),
        })
        .expandFlatKeys();

      await assertPass(schema, {
        'profile.name': 'foo',
      });

      const result = await schema.validate({
        'profile.name': 'foo',
      });
      expect(result).toEqual({
        profile: {
          name: 'foo',
        },
      });
    });
  });

  describe('other', () => {
    it('should append options', async () => {
      const schema = yd
        .object({
          profile: yd.object({
            name: yd.string(),
          }),
        })
        .options({
          stripEmpty: true,
        })
        .options({
          stripUnknown: true,
        })
        .options({
          expandFlatKeys: true,
        });

      const result = await schema.validate({
        bar: '',
        foo: 'bar',
        'profile.name': 'foo',
      });

      expect(result).toEqual({
        profile: {
          name: 'foo',
        },
      });
    });

    it('should append options by shortcut', async () => {
      const schema = yd
        .object({
          profile: yd.object({
            name: yd.string(),
          }),
        })
        .stripEmpty()
        .stripUnknown()
        .expandFlatKeys();

      const result = await schema.validate({
        bar: '',
        foo: 'bar',
        'profile.name': 'foo',
      });

      expect(result).toEqual({
        profile: {
          name: 'foo',
        },
      });
    });
  });
});

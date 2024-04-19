import yd from '../src';
import { assertPass, assertFail } from './utils';

describe('object', () => {
  it('should validate a basic object', async () => {
    const schema = yd.object({
      name: yd.string(),
    });
    await assertPass(schema, undefined);
    await assertPass(schema, { name: 'a' });
    await assertFail(schema, { name: 1 }, ['Must be a string.']);
    await assertFail(schema, 1, ['Must be an object.']);
    await assertFail(schema, null, ['Must be an object.']);
  });

  it('should validate an object with a required field', async () => {
    const schema = yd.object({
      name: yd.string().required(),
    });
    await assertPass(schema, undefined);
    await assertPass(schema, { name: 'a' });
    await assertFail(schema, {}, ['Value is required.']);
    await assertFail(schema, { name: 1 }, ['Must be a string.']);
    await assertFail(schema, 1, ['Must be an object.']);
    await assertFail(schema, null, ['Must be an object.']);
  });

  it('should validate a required object', async () => {
    const schema = yd
      .object({
        name: yd.string(),
      })
      .required();
    await assertPass(schema, { name: 'a' });
    await assertFail(schema, undefined, ['Value is required.']);
    await assertFail(schema, { name: 1 }, ['Must be a string.']);
    await assertFail(schema, 1, ['Must be an object.']);
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
    await assertFail(schema, { name: 12 }, ['Must be a string.']);
    await assertFail(schema, { name: 'ABCD' }, [
      'Must start with lower case letter.',
    ]);
    await assertFail(schema, { name: 'abc' }, [
      'Must be at least 4 characters.',
    ]);
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
    await assertFail(schema, {}, ['Either "a" or "b" must be passed.']);
    await assertFail(schema, { a: 'a', b: 'b' }, [
      'Either "a" or "b" must be passed.',
    ]);
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
      ['Unknown field "c".']
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
      }
    );
    expect(foo).toBe('bar');
  });

  it('should have field type on unknown field', async () => {
    const schema = yd.object({
      foo: yd.string().required(),
    });
    try {
      await schema.validate({ bar: 'bar' });
    } catch (error) {
      expect(error.details[0].type).toBe('field');
    }
  });

  it('should not allow unknown fields for empty objects', async () => {
    const schema = yd.object({});
    await assertFail(schema, { foo: 'bar' }, ['Unknown field "foo".']);
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
      await assertFail(schema, { foo: 'foo' }, ['Value is required.']);
      await assertFail(schema, { bar: 'bar' }, ['Value is required.']);
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
      await assertFail(schema, { foo: 'foo' }, ['Value is required.']);
      await assertFail(schema, { bar: 'bar' }, ['Value is required.']);
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
      await assertPass(schema, { foo: 'foo', bar: 'bar', baz: 'baz' });
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
          })
        );
      await assertPass(schema, { a: 'a' });
    });
  });

  describe('pick', () => {
    it('should be able to pick fields with arguments', async () => {
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
        ['Unknown field "lastName".']
      );
      await assertFail(schema, { lastName: 'Bar' }, [
        'Unknown field "lastName".',
      ]);
    });

    it('should be able to pick fields with array', async () => {
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
        ['Unknown field "age".']
      );
      await assertFail(
        schema,
        {
          firstName: 'Foo',
          lastName: 'Bar',
          age: 25,
        },
        ['Unknown field "age".']
      );
    });
  });

  describe('omit', () => {
    it('should be able to omit fields with arguments', async () => {
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
        ['Unknown field "firstName".']
      );
      await assertFail(schema, { firstName: 'Bar' }, [
        'Unknown field "firstName".',
      ]);
    });

    it('should be able to omit fields with array', async () => {
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
        ['Unknown field "firstName".']
      );
      await assertFail(
        schema,
        {
          age: 25,
          firstName: 'Foo',
          lastName: 'Bar',
        },
        ['Unknown field "firstName".']
      );
    });
  });

  it('should explicitly fail keys are not schemas', async () => {
    expect(() => {
      yd.object({
        name: 'foo',
      });
    }).toThrow('Key "name" must be a schema');
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
        }
      );
      expect(result).toEqual({
        name: 'Brett',
      });
    });
  });
});

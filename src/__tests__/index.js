import yd from '../index';

async function assertFail(schema, obj, errors) {
  try {
    await schema.validate(obj);
    throw new Error('Expected failure but passed.');
  } catch (error) {
    if (!error.details) {
      throw error;
    }
    expect(error.details.map((err) => err.message)).toEqual(errors);
  }
}

async function assertPass(schema, obj) {
  try {
    await schema.validate(obj);
    expect(true).toBe(true);
  } catch (error) {
    // eslint-disable-next-line
    console.error(error);
    throw error;
  }
}

describe('string', () => {
  it('should validate an optional string', async () => {
    const schema = yd.string();
    await assertPass(schema, 'a');
    await assertPass(schema, undefined);
    await assertFail(schema, null, ['Value must be a string.']);
    await assertFail(schema, 1, ['Value must be a string.']);
  });

  it('should validate a required string', async () => {
    const schema = yd.string().required();
    await assertPass(schema, 'a');
    await assertFail(schema, undefined, ['Value is required.']);
    await assertFail(schema, 1, ['Value must be a string.']);
  });

  it('should validate a minimum length', async () => {
    const schema = yd.string().min(4);
    await assertPass(schema, 'abcd');
    await assertFail(schema, 'abc', ['Value must be 4 characters or more.']);
  });

  it('should validate a maximum length', async () => {
    const schema = yd.string().max(4);
    await assertPass(schema, 'a');
    await assertFail(schema, 'abcde', ['Value must be 4 characters or less.']);
  });

  it('should validate an email', async () => {
    const schema = yd.string().email();
    await assertPass(schema, 'foo@bar.com');
    await assertFail(schema, 'foo@bar', ['Value has incorrect email format.']);
  });

  it('should validate a regex pattern', async () => {
    expect(() => {
      yd.string().matches();
    }).toThrow('Argument must be a regular expression');
    expect(() => {
      yd.string().matches('foo');
    }).toThrow('Argument must be a regular expression');

    const reg = /^[A-Z]+$/;
    const schema = yd.string().matches(reg);
    await assertPass(schema, 'A');
    await assertFail(schema, 'a', [`Value must match pattern ${reg}.`]);
  });

  it('should be able to trim a string', async () => {
    const schema = yd.string().email().trim();
    expect(await schema.validate('   foo@bar.com   ')).toBe('foo@bar.com');
    expect(await schema.validate('   foo@bar.com')).toBe('foo@bar.com');
    expect(await schema.validate('foo@bar.com   ')).toBe('foo@bar.com');
    expect(await schema.validate('foo@bar.com')).toBe('foo@bar.com');
  });
});

describe('number', () => {
  it('should validate an optional number', async () => {
    const schema = yd.number();
    await assertPass(schema, 1);
    await assertPass(schema, undefined);
    await assertFail(schema, null, ['Value must be a number.']);
    await assertFail(schema, 'a', ['Value must be a number.']);
  });

  it('should validate a required number', async () => {
    const schema = yd.number().required();
    await assertPass(schema, 1);
    await assertFail(schema, undefined, ['Value is required.']);
    await assertFail(schema, 'a', ['Value must be a number.']);
  });

  it('should validate a minimum value', async () => {
    const schema = yd.number().min(4);
    await assertPass(schema, 5);
    await assertFail(schema, 1, ['Value must be greater than 4.']);
  });

  it('should validate a maximum value', async () => {
    const schema = yd.number().max(4);
    await assertPass(schema, 1);
    await assertFail(schema, 5, ['Value must be less than 4.']);
  });

  it('should validate an integer', async () => {
    const schema = yd.number().integer();
    await assertPass(schema, 1);
    await assertFail(schema, 1.1, ['Value must be an integer.']);
  });

  it('should validate a positive number', async () => {
    const schema = yd.number().positive();
    await assertPass(schema, 1);
    await assertFail(schema, -1, ['Value must be positive.']);
  });

  it('should validate a negative number', async () => {
    const schema = yd.number().negative();
    await assertPass(schema, -1);
    await assertFail(schema, 1, ['Value must be negative.']);
  });

  it('should validate a multiple', async () => {
    const schema = yd.number().multiple(3);
    await assertPass(schema, 3);
    await assertPass(schema, 6);
    await assertPass(schema, 9);
    await assertFail(schema, 10, ['Value must be a multiple of 3.']);
  });
});

describe('boolean', () => {
  it('should validate an optional boolean', async () => {
    const schema = yd.boolean();
    await assertPass(schema, true);
    await assertPass(schema, false);
    await assertPass(schema, undefined);
    await assertFail(schema, 1, ['Value must be a boolean.']);
  });

  it('should validate a required boolean', async () => {
    const schema = yd.boolean().required();
    await assertPass(schema, true);
    await assertPass(schema, false);
    await assertFail(schema, undefined, ['Value is required.']);
    await assertFail(schema, 1, ['Value must be a boolean.']);
  });
});

describe('allow', () => {
  it('should validate an enum', async () => {
    const schema = yd.allow('one', 'two');
    await assertPass(schema, 'one');
    await assertPass(schema, 'two');
    await assertFail(schema, 'three', ['Value must be one of ["one", "two"].']);
  });

  it('should be able to pass an array', async () => {
    const schema = yd.allow(['one', 'two']);
    await assertPass(schema, 'one');
    await assertPass(schema, 'two');
    await assertFail(schema, 'three', ['Value must be one of ["one", "two"].']);
  });

  it('should be able to pass other schemas', async () => {
    const schema = yd.allow([yd.string(), yd.number()]);
    await assertPass(schema, 'a');
    await assertPass(schema, 5);
    await assertFail(schema, true, ['Value must be one of [string, number].']);
    await assertFail(schema, null, ['Value must be one of [string, number].']);
  });
});

describe('reject', () => {
  it('should validate an enum', async () => {
    const schema = yd.reject('one');
    await assertPass(schema, 'two');
    await assertFail(schema, 'one', ['Value must not be one of ["one"].']);
  });

  it('should be able to pass an array', async () => {
    const schema = yd.reject(['one']);
    await assertPass(schema, 'two');
    await assertFail(schema, 'one', ['Value must not be one of ["one"].']);
  });
});

describe('object', () => {
  it('should validate a basic object', async () => {
    const schema = yd.object({
      name: yd.string(),
    });
    await assertPass(schema, undefined);
    await assertPass(schema, { name: 'a' });
    await assertFail(schema, { name: 1 }, ['"name" must be a string.']);
    await assertFail(schema, 1, ['Value must be an object.']);
  });

  it('should validate an object with a required field', async () => {
    const schema = yd.object({
      name: yd.string().required(),
    });
    await assertPass(schema, undefined);
    await assertPass(schema, { name: 'a' });
    await assertFail(schema, {}, ['"name" is required.']);
    await assertFail(schema, { name: 1 }, ['"name" must be a string.']);
    await assertFail(schema, 1, ['Value must be an object.']);
  });

  it('should validate a required object', async () => {
    const schema = yd
      .object({
        name: yd.string(),
      })
      .required();
    await assertPass(schema, { name: 'a' });
    await assertFail(schema, undefined, ['Value is required.']);
    await assertFail(schema, { name: 1 }, ['"name" must be a string.']);
    await assertFail(schema, 1, ['Value must be an object.']);
  });

  it('should validate all fields', async () => {
    const schema = yd
      .object({
        a: yd.string().required(),
        b: yd.string().required(),
      })
      .required();
    await assertFail(schema, {}, ['"a" is required.', '"b" is required.']);
  });

  it('should allow a custom validation', async () => {
    const schema = yd
      .object({
        name: yd
          .string()
          .required()
          .custom((val) => {
            if (val.match(/^[A-Z]/)) {
              throw new Error('{label} must start with lower case letter.');
            }
          })
          .custom((val) => {
            if (val.length < 4) {
              throw new Error('{label} must be at least 4 characters.');
            }
          }),
      })
      .required();
    await assertPass(schema, { name: 'abcd' });
    await assertFail(schema, { name: 12 }, ['"name" must be a string.']);
    await assertFail(schema, { name: 'ABCD' }, [
      '"name" must start with lower case letter.',
    ]);
    await assertFail(schema, { name: 'abc' }, [
      '"name" must be at least 4 characters.',
    ]);
    await assertFail(schema, { name: 'Abc' }, [
      '"name" must start with lower case letter. "name" must be at least 4 characters.',
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

  it('should correctly serialize', async () => {
    const schema = yd.object({
      a: yd.string().required(),
    });
    try {
      expect.assertions(1);
      await schema.validate({});
    } catch (error) {
      const data = JSON.parse(JSON.stringify(error));
      expect(data).toEqual({
        details: [
          {
            field: 'a',
            message: '"a" is required.',
            details: [
              {
                type: 'required',
                message: '"a" is required.',
              },
            ],
          },
        ],
      });
    }
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

  it('should strip out unknown keys', async () => {
    const schema = yd.object({
      a: yd.string(),
      b: yd.string(),
    });
    assertPass(schema, undefined);
    assertPass(schema, {});
    let result = await schema.validate({ a: 'a', b: 'b', c: 'c' });
    expect(result.c).toBeUndefined();
  });

  it('should error if schema not defined', async () => {
    expect.assertions(1);
    expect(() => {
      yd.object();
    }).toThrow('Object schema must be defined.');
  });
});

describe('custom', () => {
  it('should allow an optional root validator', async () => {
    const schema = yd.custom((val) => {
      if (val === 'goodbye') {
        throw new Error('{label} must not be goodbye.');
      }
    });
    await assertPass(schema, undefined);
    await assertPass(schema, '');
    await assertPass(schema, 'hello');
    await assertFail(schema, 'goodbye', ['Value must not be goodbye.']);
  });

  it('should allow a required root validator', async () => {
    const schema = yd
      .custom((val) => {
        if (val === 'goodbye') {
          throw new Error('{label} must not be goodbye.');
        }
      })
      .required();
    await assertPass(schema, '');
    await assertPass(schema, 'hello');
    await assertFail(schema, undefined, ['Value is required.']);
    await assertFail(schema, 'goodbye', ['Value must not be goodbye.']);
  });

  it('should convert result', async () => {
    const schema = yd.custom(() => {
      return 'goodbye';
    });
    expect(await schema.validate('hello')).toBe('goodbye');
  });
});

describe('array', () => {
  it('should validate an optional array', async () => {
    const schema = yd.array();
    await assertPass(schema, []);
    await assertPass(schema, ['a']);
    await assertPass(schema, undefined);
    await assertFail(schema, 1, ['Value must be an array.']);
  });

  it('should validate a required array', async () => {
    const schema = yd.array().required();
    await assertPass(schema, []);
    await assertPass(schema, ['a']);
    await assertFail(schema, undefined, ['Value is required.']);
    await assertFail(schema, 1, ['Value must be an array.']);
  });

  it('should validate an array of strings', async () => {
    const schema = yd.array(yd.string());
    await assertPass(schema, []);
    await assertPass(schema, ['a']);
    await assertPass(schema, undefined);
    await assertFail(schema, [1], ['Array contains invalid elements.']);
    await assertFail(schema, 1, ['Value must be an array.']);
  });

  it('should validate all alements', async () => {
    const schema = yd.array(yd.string());
    await assertFail(schema, [1, 2], ['Array contains invalid elements.']);
  });

  it('should contain details of assertion failures', async () => {
    expect.assertions(1);
    const schema = yd.array(yd.string());
    try {
      await schema.validate([1, 2]);
    } catch (error) {
      expect(error.details[0].details).toEqual([
        new Error('Element at index 0 must be a string.'),
        new Error('Element at index 1 must be a string.'),
      ]);
    }
  });

  it('should validate an array of different types', async () => {
    const schema = yd.array(yd.string(), yd.number());
    await assertPass(schema, []);
    await assertPass(schema, ['a']);
    await assertPass(schema, [1]);
    await assertPass(schema, undefined);
    await assertFail(schema, [true], ['Array contains invalid elements.']);
    await assertFail(schema, [null], ['Array contains invalid elements.']);
  });

  it('should validate an array of different types with array', async () => {
    const schema = yd.array([yd.string(), yd.number()]);
    await assertPass(schema, []);
    await assertPass(schema, ['a']);
    await assertPass(schema, [1]);
    await assertPass(schema, undefined);
    await assertFail(schema, [true], ['Array contains invalid elements.']);
    await assertFail(schema, [null], ['Array contains invalid elements.']);
  });
});

describe('date', () => {
  it('should validate an optional date', async () => {
    const schema = yd.date();
    await assertPass(schema, new Date());
    await assertPass(schema, '2020-01-01');
    await assertPass(schema, 1642232606911);
    await assertPass(schema, undefined);
    await assertPass(schema, 0);
    await assertFail(schema, null, ['Value must be a valid date.']);
    await assertFail(schema, false, ['Value must be a valid date.']);
    await assertFail(schema, NaN, ['Value must be a valid date.']);
    await assertFail(schema, 'invalid', ['Value must be a valid date.']);
  });

  it('should validate a required date', async () => {
    const schema = yd.date().required();
    await assertPass(schema, new Date());
    await assertPass(schema, '2020-01-01');
    await assertPass(schema, 1642232606911);
    await assertPass(schema, 0);
    await assertFail(schema, undefined, ['Value is required.']);
    await assertFail(schema, null, ['Value must be a valid date.']);
    await assertFail(schema, false, ['Value must be a valid date.']);
    await assertFail(schema, NaN, ['Value must be a valid date.']);
    await assertFail(schema, 'invalid', ['Value must be a valid date.']);
  });

  it('should validate an iso date', async () => {
    const schema = yd.date().iso().required();
    await assertPass(schema, '2022-01-15T08:27:36.114Z');
    await assertPass(schema, '2022-01-15T08:27:36.114');
    await assertPass(schema, '2022-01-15T08:27:36');
    await assertPass(schema, '2022-01-15T08:27');
    await assertPass(schema, '2022-01-15');
    await assertPass(schema, '2022-01');

    await assertFail(schema, new Date(), ['Value must be a string.']);
    await assertFail(schema, 1642232606911, ['Value must be a string.']);
    await assertFail(schema, undefined, ['Value is required.']);
    await assertFail(schema, null, ['Value must be a string.']);
    await assertFail(schema, false, ['Value must be a string.']);
    await assertFail(schema, NaN, ['Value must be a string.']);
    await assertFail(schema, 'invalid', ['Value must be in ISO 8601 format.']);
    await assertFail(schema, '01 Jan 1970 00:00:00 GMT', [
      'Value must be in ISO 8601 format.',
    ]);
  });

  it('should convert string to date', async () => {
    const schema = yd.date();
    const date = await schema.validate('2020-01-01');
    expect(date).toBeInstanceOf(Date);
  });

  it('should validate a minimum date', async () => {
    const schema = yd.date().min('2020-01-01');
    await assertPass(schema, '2020-12-02');
    await assertFail(schema, '2019-01-01', [
      'Value must be after 2020-01-01T00:00:00.000Z.',
    ]);
  });

  it('should validate a maximum date', async () => {
    const schema = yd.date().max('2020-01-01');
    await assertPass(schema, '2019-01-01');
    await assertFail(schema, '2020-12-02', [
      'Value must be before 2020-01-01T00:00:00.000Z.',
    ]);
  });

  it('should validate a past date', async () => {
    const schema = yd.date().past();
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await assertPass(schema, '2019-01-01');
    await assertFail(schema, future, ['Value must be in the past.']);
  });

  it('should validate a future date', async () => {
    const schema = yd.date().future();
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await assertPass(schema, future);
    await assertFail(schema, '2019-01-01', ['Value must be in the future.']);
  });

  it('should validate a timestamp', async () => {
    const schema = yd.date().timestamp();
    await assertPass(schema, 1642342419713);
    await assertFail(schema, '2019-01-01', ['Value must be a timestamp.']);
    const now = new Date();
    const val = await schema.validate(now.getTime());
    expect(val).toEqual(now);
  });

  it('should validate a unix timestamp', async () => {
    const schema = yd.date().timestamp('unix');
    await assertPass(schema, 1642342419713);
    await assertFail(schema, '2019-01-01', ['Value must be a unix timestamp.']);

    const now = new Date();
    const val = await schema.validate(now.getTime() / 1000);
    expect(val).toEqual(now);
  });
});

describe('isSchema', () => {
  it('should correctly identify a schema', () => {
    expect(yd.isSchema(yd.string())).toBe(true);
    expect(yd.isSchema(yd.date())).toBe(true);
    expect(yd.isSchema(yd.custom())).toBe(true);
    expect(yd.isSchema(yd.object({}))).toBe(true);
    expect(yd.isSchema(undefined)).toBe(false);
    expect(yd.isSchema(null)).toBe(false);
    expect(yd.isSchema({})).toBe(false);
    expect(yd.isSchema('a')).toBe(false);
  });
});

describe('default', () => {
  it('should be able to set a default value', async () => {
    const schema = yd.any().default('a');
    expect(await schema.validate()).toBe('a');
    expect(await schema.validate(undefined)).toBe('a');
    expect(await schema.validate(null)).toBe(null);
    expect(await schema.validate('b')).toBe('b');
  });

  it('should be able to set a default value in an object', async () => {
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
});

describe('other', () => {
  it('should allow a custom message', async () => {
    const schema = yd.string().message('Needs a string');
    await assertFail(schema, 1, ['Needs a string']);
  });

  it('should allow a custom label', async () => {
    const schema = yd.string().label('This field');
    await assertFail(schema, 1, ['This field must be a string.']);
  });

  it('should allow a custom label for an object', async () => {
    const schema = yd.object({
      firstName: yd.string().label('"First Name"'),
    });
    await assertFail(schema, { firstName: 1 }, [
      '"First Name" must be a string.',
    ]);
  });

  it('should have access to root object', async () => {
    const schema = yd.object({
      a: yd.array(yd.number()),
      b: yd.number().custom((arr, { root }) => {
        if (!root.a.includes(root.b)) {
          throw new Error('"a" must include "b"');
        }
      }),
    });
    await assertPass(schema, { a: [1, 2, 3], b: 1 });
    await assertFail(schema, { a: [1, 2, 3], b: 4 }, ['"a" must include "b"']);
  });

  it('should be able to cast to an array from commas', async () => {
    const schema = yd.object({
      a: yd.array().cast(),
      b: yd.string(),
    });
    const result = await schema.validate({ a: '1,2,3', b: 'b' });
    expect(result.a).toEqual(['1', '2', '3']);
    expect(result.b).toBe('b');
  });

  it('should be able to cast to an array of specific type', async () => {
    const schema = yd.object({
      a: yd.array(yd.number()).cast(),
      b: yd.string(),
    });
    const result = await schema.validate({ a: '1,2,3', b: 'b' });
    expect(result.a).toEqual([1, 2, 3]);
    expect(result.b).toBe('b');
  });

  it('should be able to cast values globally', async () => {
    // Useful for query params for example:
    // ?a=1&b=b <- does not know that "a" should be cast to a number
    const schema = yd.object({
      a: yd.number(),
      b: yd.string(),
    });
    const result = await schema.validate({ a: '1', b: 'b' }, { cast: true });
    expect(result.a).toBe(1);
    expect(result.b).toBe('b');
  });
});

import yd from '../src';
import { LocalizedError } from '../src/errors';
import { useLocalizer, getLocalizedMessages } from '../src/localization';
import { isSchema, isSchemaError } from '../src/utils';

async function assertPass(schema, obj, expected, options) {
  try {
    const result = await schema.validate(obj, options);
    if (expected) {
      expect(result).toEqual(expected);
    } else {
      expect(true).toBe(true);
    }
  } catch (error) {
    // eslint-disable-next-line
    console.error(error);
    throw error;
  }
}

async function assertFail(schema, obj, errors) {
  try {
    await schema.validate(obj);
    throw new Error('Expected failure but passed.');
  } catch (error) {
    if (!error.details) {
      throw error;
    }
    expect(mapErrorMessages(error)).toEqual(errors);
  }
}

function mapErrorMessages(error) {
  if (error.details) {
    return error.details.flatMap(mapErrorMessages);
  } else {
    return [error.message];
  }
}

async function assertErrorMessage(schema, obj, message) {
  let error;
  try {
    await schema.validate(obj);
  } catch (err) {
    error = err;
  }
  expect(error.message).toEqual(message);
}

describe('string', () => {
  it('should validate an optional string', async () => {
    const schema = yd.string();
    await assertPass(schema, 'a');
    await assertPass(schema, undefined);
    await assertFail(schema, null, ['Must be a string.']);
    await assertFail(schema, 1, ['Must be a string.']);
  });

  it('should validate a required string', async () => {
    const schema = yd.string().required();
    await assertPass(schema, 'a');
    await assertFail(schema, undefined, ['Value is required.']);
    await assertFail(schema, 1, ['Must be a string.']);
  });

  it('should validate an exact length', async () => {
    const schema = yd.string().length(4);
    await assertPass(schema, 'abcd');
    await assertFail(schema, 'abc', ['Must be exactly 4 characters.']);
    await assertFail(schema, 'abcde', ['Must be exactly 4 characters.']);
  });

  it('should validate a minimum length', async () => {
    const schema = yd.string().min(4);
    await assertPass(schema, 'abcd');
    await assertFail(schema, 'abc', ['Must be 4 characters or more.']);
  });

  it('should validate a maximum length', async () => {
    const schema = yd.string().max(4);
    await assertPass(schema, 'a');
    await assertFail(schema, 'abcde', ['Must be 4 characters or less.']);
  });

  it('should validate an email', async () => {
    const schema = yd.string().email();
    await assertPass(schema, undefined);
    await assertPass(schema, 'foo@bar.com');
    await assertFail(schema, 'foo@bar', ['Must be an email address.']);
  });

  it('should validate an E.164 phone number', async () => {
    const schema = yd.string().phone();
    await assertPass(schema, undefined);
    await assertPass(schema, '+16175551212');
    await assertFail(schema, '6175551212', ['Must be a valid phone number.']);
    await assertFail(schema, '+1', ['Must be a valid phone number.']);
    await assertFail(schema, 'foo', ['Must be a valid phone number.']);
  });

  it('should validate a regex pattern', async () => {
    expect(() => {
      yd.string().match();
    }).toThrow('Argument must be a regular expression');
    expect(() => {
      yd.string().match('foo');
    }).toThrow('Argument must be a regular expression');

    const reg = /^[A-Z]+$/;
    const schema = yd.string().match(reg);
    await assertPass(schema, 'A');
    await assertFail(schema, 'a', [`Must match pattern ${reg}.`]);
  });

  it('should trim a string', async () => {
    const schema = yd.string().email().trim();
    expect(await schema.validate('   foo@bar.com   ')).toBe('foo@bar.com');
    expect(await schema.validate('   foo@bar.com')).toBe('foo@bar.com');
    expect(await schema.validate('foo@bar.com   ')).toBe('foo@bar.com');
    expect(await schema.validate('foo@bar.com')).toBe('foo@bar.com');
  });

  it('should convert to lower case', async () => {
    const schema = yd.string().lowercase();
    expect(await schema.validate('FOO')).toBe('foo');
    expect(await schema.validate('foo')).toBe('foo');
  });

  it('should convert to assert lower case', async () => {
    const schema = yd.string().lowercase(true);
    await assertPass(schema, 'foo');
    await assertFail(schema, 'Foo', ['Must be in lower case.']);
    await assertFail(schema, 'FOO', ['Must be in lower case.']);
  });

  it('should convert to upper case', async () => {
    const schema = yd.string().uppercase();
    expect(await schema.validate('foo')).toBe('FOO');
    expect(await schema.validate('FOO')).toBe('FOO');
  });

  it('should convert to assert upper case', async () => {
    const schema = yd.string().uppercase(true);
    await assertPass(schema, 'FOO');
    await assertFail(schema, 'Foo', ['Must be in upper case.']);
    await assertFail(schema, 'foo', ['Must be in upper case.']);
  });

  it('should validate a hexadecimal string', async () => {
    const schema = yd.string().hex();
    await assertPass(schema, 'abc123456789');
    await assertFail(schema, 'zzz', ['Must be hexadecimal.']);
  });

  it('should validate an MD5 hash', async () => {
    await assertPass(yd.string().md5(), 'bed1e4d90fb9261a80ae92d339949559');
    await assertFail(yd.string().md5(), 'aaaa', [
      'Must be a hash in md5 format.',
    ]);
  });

  it('should validate a SHA1 hash', async () => {
    await assertPass(
      yd.string().sha1(),
      'c9b09f7f254eb6aaeeff30abeb0b92bea732855a'
    );

    await assertFail(yd.string().sha1(), 'bed1e4d90fb9261a80ae92d339949559', [
      'Must be a hash in sha1 format.',
    ]);
  });

  it('should validate an ascii string', async () => {
    const schema = yd.string().ascii();
    await assertPass(schema, 'abc123456789%&#');
    await assertFail(schema, '¥¢£©', ['Must be ASCII.']);
  });

  it('should validate a base64 string', async () => {
    const schema = yd.string().base64();
    await assertPass(schema, 'Zm9vYmFy');
    await assertFail(schema, 'a', ['Must be base64.']);
  });

  it('should validate a credit card', async () => {
    const schema = yd.string().creditCard();
    await assertPass(schema, '4111111111111111');
    await assertFail(schema, '5111111111111111', [
      'Must be a valid credit card number.',
    ]);
    await assertFail(schema, 'foo', ['Must be a valid credit card number.']);
  });

  it('should validate an ip address', async () => {
    const schema = yd.string().ip();
    await assertPass(schema, '192.168.0.0');
    await assertFail(schema, '192.168.0', ['Must be a valid IP address.']);
  });

  it('should validate an ISO 3166-1 alpha-2 country code', async () => {
    const schema = yd.string().country();
    await assertPass(schema, 'jp');
    await assertFail(schema, 'zz', ['Must be a valid country code.']);
  });

  it('should validate a locale code', async () => {
    const schema = yd.string().locale();
    await assertPass(schema, 'ja-JP');
    await assertFail(schema, 'japan', ['Must be a valid locale code.']);
  });

  it('should validate a JWT token', async () => {
    const schema = yd.string().jwt();
    const token =
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoiSm9lIn0.2dDMbovRrOV-rp-6_zl2ZwrckDpodOnBcg8KY7mBjw4';
    await assertPass(schema, token);
    await assertFail(schema, 'token', ['Must be a valid JWT token.']);
  });

  it('should validate a latitude-longitude string', async () => {
    const schema = yd.string().latlng();
    await assertPass(schema, '41.7708727,140.7125196');
    await assertFail(schema, '41.7708727', [
      'Must be a valid lat,lng coordinate.',
    ]);
  });

  it('should validate a postal code', async () => {
    const schema = yd.string().postalCode();
    await assertPass(schema, '80906');
    await assertFail(schema, '80906z', ['Must be a valid postal code.']);
  });

  it('should validate a slug', async () => {
    const schema = yd.string().slug();
    await assertPass(schema, 'foo-bar');
    await assertFail(schema, 'foo#-bar', ['Must be a valid slug.']);
  });

  it('should validate a password', async () => {
    const schema = yd.string().password();
    await assertPass(schema, '123456789abcde');
    await assertFail(schema, '1234', ['Must be at least 12 characters.']);
  });

  it('should validate a password with options', async () => {
    const schema = yd.string().password({
      minLength: 4,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    });
    await assertPass(schema, 'aB1%');
    await assertFail(schema, '123456789abcde', [
      'Must contain at least 1 uppercase character.',
      'Must contain at least 1 symbol.',
    ]);
  });

  it('should validate a URL', async () => {
    const schema = yd.string().url();
    await assertPass(schema, 'http://foo.com');
    await assertFail(schema, 'http://foo', ['Must be a valid URL.']);
  });

  it('should validate a UUID v4', async () => {
    const schema = yd.string().uuid();
    await assertPass(schema, '60648997-e80c-45e2-8467-2084fc207dce');
    await assertFail(schema, '60648997-e80c', ['Must be a valid unique id.']);
  });

  it('should validate a domain', async () => {
    const schema = yd.string().domain();
    await assertPass(schema, 'foo.com');
    await assertFail(schema, 'foo', ['Must be a valid domain.']);
  });

  it('should validate a Bitcoin address', async () => {
    const schema = yd.string().btc();
    await assertPass(schema, '3FZbgi29cpjq2GjdwV8eyHuJJnkLtktZc5');
    await assertFail(schema, 'foo', ['Must be a valid Bitcoin address.']);
  });

  it('should validate a Ethereum address', async () => {
    const schema = yd.string().eth();
    await assertPass(schema, '0xb794f5ea0ba39494ce839613fffba74279579268');
    await assertFail(schema, 'foo', ['Must be a valid Ethereum address.']);
  });

  it('should validate a SWIFT bank code', async () => {
    const schema = yd.string().swift();
    await assertPass(schema, 'AXISINBB250');
    await assertFail(schema, 'foo', ['Must be a valid SWIFT code.']);
  });

  it('should validate a MongoDB ObjectId', async () => {
    const schema = yd.string().mongo();
    await assertPass(schema, '61b8b032cac265007c34ce09');
    await assertFail(schema, 'foo', ['Must be a valid ObjectId.']);
  });
});

describe('number', () => {
  it('should validate an optional number', async () => {
    const schema = yd.number();
    await assertPass(schema, 1);
    await assertPass(schema, undefined);
    await assertFail(schema, null, ['Must be a number.']);
    await assertFail(schema, 'a', ['Must be a number.']);
  });

  it('should validate a required number', async () => {
    const schema = yd.number().required();
    await assertPass(schema, 1);
    await assertFail(schema, undefined, ['Value is required.']);
    await assertFail(schema, 'a', ['Must be a number.']);
  });

  it('should validate a minimum value', async () => {
    const schema = yd.number().min(4);
    await assertPass(schema, 5);
    await assertFail(schema, 1, ['Must be greater than 4.']);
  });

  it('should validate a maximum value', async () => {
    const schema = yd.number().max(4);
    await assertPass(schema, 1);
    await assertFail(schema, 5, ['Must be less than 4.']);
  });

  it('should validate an integer', async () => {
    const schema = yd.number().integer();
    await assertPass(schema, 1);
    await assertFail(schema, 1.1, ['Must be an integer.']);
  });

  it('should validate a positive number', async () => {
    const schema = yd.number().positive();
    await assertPass(schema, 1);
    await assertFail(schema, -1, ['Must be positive.']);
  });

  it('should validate a negative number', async () => {
    const schema = yd.number().negative();
    await assertPass(schema, -1);
    await assertFail(schema, 1, ['Must be negative.']);
  });

  it('should validate a multiple', async () => {
    const schema = yd.number().multiple(3);
    await assertPass(schema, 3);
    await assertPass(schema, 6);
    await assertPass(schema, 9);
    await assertFail(schema, 10, ['Must be a multiple of 3.']);
  });
});

describe('boolean', () => {
  it('should validate an optional boolean', async () => {
    const schema = yd.boolean();
    await assertPass(schema, true);
    await assertPass(schema, false);
    await assertPass(schema, undefined);
    await assertFail(schema, 1, ['Must be a boolean.']);
  });

  it('should validate a required boolean', async () => {
    const schema = yd.boolean().required();
    await assertPass(schema, true);
    await assertPass(schema, false);
    await assertFail(schema, undefined, ['Value is required.']);
    await assertFail(schema, 1, ['Must be a boolean.']);
  });
});

describe('allow', () => {
  it('should validate an enum', async () => {
    const schema = yd.allow('one', 'two');
    await assertPass(schema, 'one');
    await assertPass(schema, 'two');
    await assertFail(schema, 'three', ['Must be one of ["one", "two"].']);
  });

  it('should pass an array', async () => {
    const schema = yd.allow(['one', 'two']);
    await assertPass(schema, 'one');
    await assertPass(schema, 'two');
    await assertFail(schema, 'three', ['Must be one of ["one", "two"].']);
  });

  it('should allow passing other schemas', async () => {
    const schema = yd.allow([yd.string(), yd.number()]);
    await assertPass(schema, 'a');
    await assertPass(schema, 5);
    await assertFail(schema, true, ['Must be one of [string, number].']);
    await assertFail(schema, null, ['Must be one of [string, number].']);
  });
});

describe('reject', () => {
  it('should validate an enum', async () => {
    const schema = yd.reject('one');
    await assertPass(schema, 'two');
    await assertFail(schema, 'one', ['Must not be one of ["one"].']);
  });

  it('should allow passing an array', async () => {
    const schema = yd.reject(['one']);
    await assertPass(schema, 'two');
    await assertFail(schema, 'one', ['Must not be one of ["one"].']);
  });
});

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
});

describe('custom', () => {
  it('should allow an optional root validator', async () => {
    const schema = yd.custom((val) => {
      if (val === 'goodbye') {
        throw new Error('Must not be goodbye.');
      }
    });
    await assertPass(schema, undefined);
    await assertPass(schema, '');
    await assertPass(schema, 'hello');
    await assertFail(schema, 'goodbye', ['Must not be goodbye.']);
  });

  it('should allow a required root validator', async () => {
    const schema = yd
      .custom((val) => {
        if (val === 'goodbye') {
          throw new Error('Must not be goodbye.');
        }
      })
      .required();
    await assertPass(schema, '');
    await assertPass(schema, 'hello');
    await assertFail(schema, undefined, ['Value is required.']);
    await assertFail(schema, 'goodbye', ['Must not be goodbye.']);
  });

  it('should convert result', async () => {
    const schema = yd.custom(() => {
      return 'goodbye';
    });
    expect(await schema.validate('hello')).toBe('goodbye');
  });

  it('should allow a custom assertion type', async () => {
    const schema = yd.custom('permissions', () => {
      throw new Error('Not enough permissions!');
    });
    let error;
    try {
      await schema.validate('foo');
    } catch (err) {
      error = err;
    }
    expect(JSON.parse(JSON.stringify(error))).toEqual({
      type: 'validation',
      message: 'Input failed validation.',
      details: [
        {
          type: 'permissions',
          message: 'Not enough permissions!',
        },
      ],
    });
  });

  it('should pass options on validation to custom assertion', async () => {
    let result;
    const schema = yd.custom((val, { foo }) => {
      result = foo;
    });
    await schema.validate(null, {
      foo: 'bar',
    });
    expect(result).toBe('bar');
  });
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

describe('array', () => {
  it('should validate an optional array', async () => {
    const schema = yd.array();
    await assertPass(schema, []);
    await assertPass(schema, ['a']);
    await assertPass(schema, undefined);
    await assertFail(schema, 1, ['Must be an array.']);
  });

  it('should validate a required array', async () => {
    const schema = yd.array().required();
    await assertPass(schema, []);
    await assertPass(schema, ['a']);
    await assertFail(schema, undefined, ['Value is required.']);
    await assertFail(schema, 1, ['Must be an array.']);
  });

  it('should validate an array of strings', async () => {
    const schema = yd.array(yd.string());
    await assertPass(schema, []);
    await assertPass(schema, ['a']);
    await assertPass(schema, undefined);
    await assertFail(schema, [1], ['Must be a string.']);
    await assertFail(schema, 1, ['Must be an array.']);
  });

  it('should validate all elements', async () => {
    await assertFail(
      yd.array(yd.string()),
      [1, 2],
      ['Must be a string.', 'Must be a string.']
    );
  });

  it('should contain details of assertion failures', async () => {
    expect.assertions(1);
    const schema = yd.array(yd.string());
    try {
      await schema.validate([1, 2]);
    } catch (error) {
      expect(error.details).toEqual([
        new Error('Must be a string.'),
        new Error('Must be a string.'),
      ]);
    }
  });

  it('should validate an array of different types', async () => {
    const schema = yd.array(yd.string(), yd.number());
    await assertPass(schema, []);
    await assertPass(schema, ['a']);
    await assertPass(schema, [1]);
    await assertPass(schema, undefined);
    await assertFail(schema, [true], ['Must be one of [string, number].']);
    await assertFail(schema, [null], ['Must be one of [string, number].']);
  });

  it('should validate an array of different types with array', async () => {
    const schema = yd.array([yd.string(), yd.number()]);
    await assertPass(schema, []);
    await assertPass(schema, ['a']);
    await assertPass(schema, [1]);
    await assertPass(schema, undefined);
    await assertFail(schema, [true], ['Must be one of [string, number].']);
    await assertFail(schema, [null], ['Must be one of [string, number].']);
  });

  it('should validate an array of objects', async () => {
    const schema = yd.array(
      yd.object({
        foo: yd.string().required(),
      })
    );
    await assertPass(schema, [{ foo: 'hi' }]);
    await assertFail(schema, [{ bar: 'hi' }], ['Unknown field "bar".']);
  });

  it('should validate a fixed length', async () => {
    const schema = yd.array().length(2);
    await assertFail(schema, [1], ['Must contain exactly 2 elements.']);
    await assertPass(schema, [1, 2]);
    await assertFail(schema, [1, 2, 3], ['Must contain exactly 2 elements.']);
  });

  it('should validate a minimum length', async () => {
    const schema = yd.array().min(1);
    await assertPass(schema, ['one']);
    await assertFail(schema, [], ['Must contain at least 1 element.']);
  });

  it('should validate a maximum length', async () => {
    const schema = yd.array().max(1);
    await assertPass(schema, []);
    await assertPass(schema, ['one']);
    await assertFail(
      schema,
      ['one', 'two'],
      ['Cannot contain more than 1 element.']
    );
  });

  it('should a lat/lng tuple', async () => {
    const schema = yd.array().latlng();
    await assertPass(schema, [35, 139]);
    await assertFail(schema, [], ['Must be an array of length 2.']);
    await assertFail(schema, [35], ['Must be an array of length 2.']);
    await assertFail(schema, [null, 139], ['Invalid latitude.']);
    await assertFail(schema, [35, null], ['Invalid longitude.']);
    await assertFail(schema, [100, 130], ['Invalid latitude.']);
    await assertFail(schema, [35, 200], ['Invalid longitude.']);
  });
});

describe('tuple', () => {
  it('should validate a tuple of same types', async () => {
    const schema = yd.tuple(yd.number(), yd.number());
    await assertPass(schema, [1, 1]);
    await assertFail(schema, [], ['Tuple must be exactly 2 elements.']);
    await assertFail(schema, [1], ['Tuple must be exactly 2 elements.']);
    await assertFail(schema, [1, 1, 1], ['Tuple must be exactly 2 elements.']);
    await assertFail(schema, [1, '1'], ['Must be a number.']);
    await assertFail(
      schema,
      ['1', '1'],
      ['Must be a number.', 'Must be a number.']
    );
    await assertFail(
      schema,
      [null, null],
      ['Must be a number.', 'Must be a number.']
    );
    await assertFail(
      schema,
      [undefined, undefined],
      ['Must be a number.', 'Must be a number.']
    );
  });

  it('should validate a tuple of different types', async () => {
    const schema = yd.tuple(yd.string(), yd.number());
    await assertPass(schema, ['str', 1]);
    await assertFail(schema, [1, 1], ['Must be a string.']);
    await assertFail(
      schema,
      [1, 'str'],
      ['Must be a string.', 'Must be a number.']
    );
  });

  it('should validate a nested tuple', async () => {
    const schema = yd.object({
      type: yd.string(),
      coordinates: yd.tuple(yd.number(), yd.number()),
    });
    await assertFail(
      schema,
      {
        type: 'Point',
        coordinates: ['35', 140],
      },
      ['Must be a number.']
    );
  });

  it('should allow a loose option to ignore empty arrays', async () => {
    const schema = yd.tuple(yd.number(), yd.number()).loose();
    await assertPass(schema, []);
    await assertPass(schema, [1, 1]);
    await assertFail(schema, [1], ['Tuple must be exactly 2 elements.']);
    await assertFail(schema, [1, 1, 1], ['Tuple must be exactly 2 elements.']);
    await assertFail(schema, [1, '1'], ['Must be a number.']);
    await assertFail(
      schema,
      ['1', '1'],
      ['Must be a number.', 'Must be a number.']
    );
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
    await assertFail(schema, null, ['Must be a valid date input.']);
    await assertFail(schema, false, ['Must be a valid date input.']);
    await assertFail(schema, NaN, ['Must be a valid date input.']);
    await assertFail(schema, 'invalid', ['Must be a valid date input.']);
  });

  it('should validate a required date', async () => {
    const schema = yd.date().required();
    await assertPass(schema, new Date());
    await assertPass(schema, '2020-01-01');
    await assertPass(schema, 1642232606911);
    await assertPass(schema, 0);
    await assertFail(schema, undefined, ['Value is required.']);
    await assertFail(schema, null, ['Must be a valid date input.']);
    await assertFail(schema, false, ['Must be a valid date input.']);
    await assertFail(schema, NaN, ['Must be a valid date input.']);
    await assertFail(schema, 'invalid', ['Must be a valid date input.']);
  });

  it('should validate an iso date', async () => {
    const schema = yd.date().iso().required();
    await assertPass(schema, '2022-01-15T08:27:36.114Z');
    await assertPass(schema, '2022-01-15T08:27:36.114');
    await assertPass(schema, '2022-01-15T08:27:36');
    await assertPass(schema, '2022-01-15T08:27');
    await assertPass(schema, '2022-01-15');
    await assertPass(schema, '2022-01');

    await assertFail(schema, new Date(), ['Must be a string.']);
    await assertFail(schema, 1642232606911, ['Must be a string.']);
    await assertFail(schema, undefined, ['Value is required.']);
    await assertFail(schema, null, ['Must be a valid date input.']);
    await assertFail(schema, false, ['Must be a valid date input.']);
    await assertFail(schema, NaN, ['Must be a valid date input.']);
    await assertFail(schema, 'invalid', ['Must be a valid date input.']);
    await assertFail(schema, '01 Jan 1970 00:00:00 GMT', [
      'Must be in ISO 8601 format.',
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
    await assertPass(schema, '2020-01-01');
    await assertFail(schema, '2019-01-01', [
      'Must be after 2020-01-01T00:00:00.000Z.',
    ]);
  });

  it('should validate a maximum date', async () => {
    const schema = yd.date().max('2020-01-01');
    await assertPass(schema, '2019-01-01');
    await assertPass(schema, '2020-01-01');
    await assertFail(schema, '2020-12-02', [
      'Must be before 2020-01-01T00:00:00.000Z.',
    ]);
  });

  it('should validate a past date', async () => {
    const schema = yd.date().past();
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await assertPass(schema, '2019-01-01');
    await assertFail(schema, future, ['Must be in the past.']);
  });

  it('should validate a future date', async () => {
    const schema = yd.date().future();
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await assertPass(schema, future);
    await assertFail(schema, '2019-01-01', ['Must be in the future.']);
  });

  it('should validate a date before', async () => {
    const schema = yd.date().before('2020-01-01');
    await assertPass(schema, '2019-01-01');
    await assertPass(schema, '2019-12-31');
    await assertFail(schema, '2020-01-01', [
      'Must be before 2020-01-01T00:00:00.000Z.',
    ]);
  });

  it('should validate a date after', async () => {
    const schema = yd.date().after('2020-01-01');
    await assertPass(schema, '2020-01-02');
    await assertPass(schema, '2021-01-01');
    await assertFail(schema, '2020-01-01', [
      'Must be after 2020-01-01T00:00:00.000Z.',
    ]);
  });

  it('should validate a timestamp', async () => {
    const schema = yd.date().timestamp();
    await assertPass(schema, 1642342419713);
    await assertFail(schema, '2019-01-01', [
      'Must be a timestamp in milliseconds.',
    ]);
    const now = new Date();
    const val = await schema.validate(now.getTime());
    expect(val).toEqual(now);
  });

  it('should validate a unix timestamp', async () => {
    const schema = yd.date().unix();
    await assertPass(schema, 1642342419713);
    await assertFail(schema, '2019-01-01', ['Must be a timestamp in seconds.']);

    const now = new Date();
    const val = await schema.validate(now.getTime() / 1000);
    expect(val).toEqual(now);
  });
});

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
    await assertFail(schema, 'fop', ['You misspelled foo!']);
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
    await assertFail(schema, { foo: 'fop' }, ['You misspelled foo!']);
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
    await assertFail(schema.default('fop').append(custom), undefined, [
      'You misspelled foo!',
    ]);
    await assertFail(schema.append(custom).default('fop'), undefined, [
      'You misspelled foo!',
    ]);
  });
});

describe('serialization', () => {
  it('should correctly serialize object error', async () => {
    const schema = yd.object({
      a: yd.string().required(),
      b: yd.string().required(),
    });
    let error;
    try {
      await schema.validate({
        b: 1,
      });
    } catch (err) {
      error = err;
    }
    expect(JSON.parse(JSON.stringify(error))).toEqual({
      type: 'validation',
      message: 'Object failed validation.',
      details: [
        {
          type: 'field',
          field: 'a',
          message: 'Value is required.',
        },
        {
          type: 'field',
          field: 'b',
          message: 'Must be a string.',
        },
      ],
    });
  });

  it('should correctly serialize array error', async () => {
    const schema = yd.array(yd.string());
    let error;
    try {
      await schema.validate([1, 2]);
    } catch (err) {
      error = err;
    }
    expect(JSON.parse(JSON.stringify(error))).toEqual({
      type: 'validation',
      message: 'Array failed validation.',
      details: [
        {
          type: 'element',
          index: 0,
          message: 'Must be a string.',
        },
        {
          type: 'element',
          index: 1,
          message: 'Must be a string.',
        },
      ],
    });
  });

  it('should correctly serialize password error', async () => {
    const schema = yd.string().password({
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    });
    let error;
    try {
      expect.assertions(1);
      await schema.validate('');
    } catch (err) {
      error = err;
    }
    expect(JSON.parse(JSON.stringify(error))).toEqual({
      type: 'validation',
      message: 'Input failed validation.',
      details: [
        {
          type: 'password',
          message: 'Must be at least 6 characters.',
        },
        {
          type: 'password',
          message: 'Must contain at least 1 lowercase character.',
        },
        {
          type: 'password',
          message: 'Must contain at least 1 uppercase character.',
        },
        {
          type: 'password',
          message: 'Must contain at least 1 number.',
        },
        {
          type: 'password',
          message: 'Must contain at least 1 symbol.',
        },
      ],
    });
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

describe('toOpenApi', () => {
  it('should convert a string schema', async () => {
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

  it('should convert an object schema', async () => {
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
    });
  });

  it('should convert an array schema', async () => {
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

  it('should convert enum types', async () => {
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

  it('should convert string enum types', async () => {
    const schema = yd.string().allow('foo', 'bar');
    expect(schema.toOpenApi()).toEqual({
      type: 'string',
      enum: ['foo', 'bar'],
    });
  });

  it('should convert mixed enum types', async () => {
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

  it('should convert date formats', async () => {
    let schema = yd.date().iso();
    expect(schema.toOpenApi()).toEqual({
      type: 'string',
      format: 'date-time',
    });

    schema = yd.date().iso('date');
    expect(schema.toOpenApi()).toEqual({
      type: 'string',
      format: 'date',
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

  it('should convert a tuple schema', async () => {
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

  it('should convert number min/max', async () => {
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

  it('should convert string minLength/maxLength', async () => {
    const schema = yd.string().min(5).max(50);
    expect(schema.toOpenApi()).toEqual({
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
      })
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
    });
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
        options
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
        options
      );
      await assertFail(schema, {}, ['Object must not be empty.']);
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
        options
      );
      await assertFail(schema, {}, ['Object must not be empty.']);
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
      await assertFail(schema, 'foo', ['Must be a boolean.']);
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
      await assertFail(schema, { a: 'foo' }, ['Must be a boolean.']);
    });

    it('should not cast a boolean without flag', async () => {
      const schema = yd.boolean();
      await assertFail(schema, 'true', ['Must be a boolean.']);
    });

    it('should cast a number', async () => {
      const schema = yd.number();
      const options = {
        cast: true,
      };
      await assertPass(schema, '0', 0, options);
      await assertPass(schema, '1', 1, options);
      await assertPass(schema, '1.1', 1.1, options);
      await assertFail(schema, 'foo', ['Must be a number.']);
      await assertFail(schema, 'null', ['Must be a number.']);
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
      await assertFail(schema, { a: 'foo' }, ['Must be a number.']);
      await assertFail(schema, { a: 'null' }, ['Must be a number.']);
    });

    it('should not cast a number without flag', async () => {
      const schema = yd.number();
      await assertFail(schema, '0', ['Must be a number.']);
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
      await assertFail(schema, { a: '1,2,3', b: 'b' }, ['Must be an array.']);
    });

    it('should cast a string', async () => {
      const schema = yd.string();
      const options = {
        cast: true,
      };
      await assertPass(schema, '1', '1', options);
      await assertPass(schema, 1, '1', options);
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
        }
      );

      await assertFail(
        schema,
        {
          b: 'b',
        },
        ['Must be a number.']
      );
    });
  });

  describe('expandDotSyntax', () => {
    it('should blajdfalksj', async () => {
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
        options
      );
    });
  });
});

describe('other', () => {
  it('should provide a default error message', async () => {
    await assertErrorMessage(yd.string(), 3, 'Input failed validation.');
    await assertErrorMessage(yd.object(), 3, 'Object failed validation.');
  });

  it('should allow a custom message', async () => {
    const schema = yd.string().message('Needs a string');
    await assertErrorMessage(schema, 3, 'Needs a string');
  });

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
    await assertFail(schema, { a: [1, 2, 3], b: 4 }, ['"a" must include "b"']);
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

  it('should expose original error', async () => {
    const err = new Error('Bad!');
    const schema = yd.custom(() => {
      throw err;
    });
    try {
      await schema.validate('test');
    } catch (error) {
      expect(error.details[0].original).toBe(err);
      expect(JSON.parse(JSON.stringify(error))).toEqual({
        type: 'validation',
        message: 'Input failed validation.',
        details: [
          {
            message: 'Bad!',
            type: 'custom',
          },
        ],
      });
    }
  });

  it('should expose original error on field', async () => {
    const err = new Error('Bad!');
    const schema = yd.object({
      a: yd.custom(() => {
        throw err;
      }),
    });
    try {
      await schema.validate({
        a: 'test',
      });
    } catch (error) {
      expect(error.details[0].original).toBe(err);
      expect(JSON.parse(JSON.stringify(error))).toEqual({
        type: 'validation',
        message: 'Object failed validation.',
        details: [
          {
            type: 'field',
            field: 'a',
            message: 'Bad!',
          },
        ],
      });
    }
  });
});

describe('getFullMessage', () => {
  it('should get full error message', async () => {
    const schema = yd.object({
      a: yd.string(),
      b: yd.number(),
    });

    let error;
    try {
      await schema.validate({
        a: 1,
        b: 'a',
      });
    } catch (err) {
      error = err;
    }
    expect(error.getFullMessage()).toBe(
      '"a" must be a string. "b" must be a number.'
    );
  });

  it('should get full error message with delimiter', async () => {
    const schema = yd.object({
      a: yd.string(),
      b: yd.number(),
    });

    let error;
    try {
      await schema.validate({
        a: 1,
        b: 'a',
      });
    } catch (err) {
      error = err;
    }
    expect(
      error.getFullMessage({
        delimiter: '\n',
      })
    ).toBe('"a" must be a string.\n"b" must be a number.');
  });

  it('should get full error message for password fields', async () => {
    const schema = yd.object({
      password: yd.string().password({
        minLength: 12,
        minNumbers: 1,
      }),
    });

    let error;
    try {
      await schema.validate({ password: 'a' });
    } catch (err) {
      error = err;
    }
    expect(error.getFullMessage()).toBe(
      '"password" must be at least 12 characters. "password" must contain at least 1 number.'
    );
  });

  it('should get full error message with natural fields', async () => {
    const schema = yd.object({
      authCode: yd.string().required(),
      pass_code: yd.string().required(),
      'my-token': yd.string().required(),
    });

    let error;
    try {
      await schema.validate({});
    } catch (err) {
      error = err;
    }
    expect(
      error.getFullMessage({
        natural: true,
      })
    ).toBe(
      'Auth code is required. Pass code is required. My token is required.'
    );
  });

  it('should not interpolate tokens that do not exist', async () => {
    const schema = yd.custom(() => {
      throw new Error('Must {not} be.');
    });
    try {
      await schema.validate({
        foo: 'bar',
      });
    } catch (error) {
      expect(error.getFullMessage()).toBe('Must {not} be.');
    }
  });
});

describe('localization', () => {
  it('should be able to pass an object to useLocalizer', async () => {
    useLocalizer({
      'Must be a string.': 'Gotta be a string.',
    });
    let error;
    try {
      await yd.string().validate(1);
    } catch (err) {
      error = err;
    }
    expect(error.details[0].message).toBe('Gotta be a string.');
  });

  it('should be able to pass a function to useLocalizer', async () => {
    const strings = {
      'Must be at least {length} character{s}.':
        '{length}文字以上入力して下さい。',
      'Object failed validation.': '不正な入力がありました。',
    };
    useLocalizer((message) => {
      return strings[message];
    });
    const schema = yd.object({
      password: yd.string().password({
        minLength: 6,
        minNumbers: 1,
      }),
    });

    let error;
    try {
      await schema.validate({
        password: 'a',
      });
    } catch (err) {
      error = err;
    }
    expect(error.message).toBe('不正な入力がありました。');
    expect(error.details[0].details[0].message).toBe(
      '6文字以上入力して下さい。'
    );
  });

  it('should be able to pass a function for complex localizations', async () => {
    const strings = {
      'Must be at least {length} character{s}.': ({ length }) => {
        const chars = length === 1 ? 'carattere' : 'caratteri';
        return `Deve contenere almeno ${length} ${chars}.`;
      },
    };
    useLocalizer((message) => {
      return strings[message];
    });
    const schema = yd.object({
      password: yd.string().password({
        minLength: 6,
      }),
    });

    let error;
    try {
      await schema.validate({
        password: 'a',
      });
    } catch (err) {
      error = err;
    }
    expect(error.details[0].message).toBe('Deve contenere almeno 6 caratteri.');
  });

  it('should be able to inspect localization message', async () => {
    useLocalizer({
      'Input failed validation.': '不正な入力がありました。',
    });
    const schema = yd.object({
      password: yd.string().password({
        minLength: 6,
        minNumbers: 1,
      }),
    });
    try {
      await schema.validate({
        password: 'a',
      });
    } catch (err) {
      const localized = getLocalizedMessages();
      expect(localized).toEqual({
        'Must be at least {length} character{s}.':
          'Must be at least {length} character{s}.',
        'Must contain at least {length} number{s}.':
          'Must contain at least {length} number{s}.',
        'Input failed validation.': '不正な入力がありました。',
        'Field failed validation.': 'Field failed validation.',
        'Object failed validation.': 'Object failed validation.',
      });
    }
  });

  it('should localize the full message', async () => {
    useLocalizer({
      '{field} must be a string.': '{field}: 文字列を入力してください。',
      '{field} must be a number.': '{field}: 数字を入力してください。',
    });
    const schema = yd.object({
      name: yd.string(),
      age: yd.number(),
    });
    try {
      await schema.validate({
        name: 1,
        age: '15',
      });
    } catch (err) {
      expect(err.getFullMessage()).toBe(
        '"name": 文字列を入力してください。 "age": 数字を入力してください。'
      );
      expect(getLocalizedMessages()).toMatchObject({
        '{field} must be a number.': '{field}: 数字を入力してください。',
        '{field} must be a string.': '{field}: 文字列を入力してください。',
      });
    }
  });

  it('should allow a custom localized error to be thrown', async () => {
    useLocalizer({
      'Invalid coordinates': '座標に不正な入力がありました。',
    });
    const schema = yd.custom(() => {
      throw new LocalizedError('Invalid coordinates');
    });
    try {
      await schema.validate({
        coords: 'coords',
      });
    } catch (err) {
      expect(JSON.parse(JSON.stringify(err))).toEqual({
        type: 'validation',
        message: 'Input failed validation.',
        details: [
          {
            type: 'custom',
            message: '座標に不正な入力がありました。',
          },
        ],
      });
      expect(err.getFullMessage()).toBe('座標に不正な入力がありました。');
    }
  });
});

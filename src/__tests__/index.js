import yd from '../index';
import { isSchema, isSchemaError } from '../utils';

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
    await assertPass(schema, 'foo@bar.com');
    await assertFail(schema, 'foo@bar', ['Must be an email address.']);
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

  it('should optionally strip out unknown keys', async () => {
    let schema;

    schema = yd
      .object({
        a: yd.string(),
        b: yd.string(),
      })
      .stripUnknown();
    assertPass(schema, undefined);
    assertPass(schema, {});
    let result = await schema.validate({ a: 'a', b: 'b', c: 'c' });
    expect(result.c).toBeUndefined();

    schema = yd.object().stripUnknown();
    expect(await schema.validate({ foo: 'bar' })).toEqual({});
  });

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
});

describe('date', () => {
  it('should validate an optional date', async () => {
    const schema = yd.date();
    await assertPass(schema, new Date());
    await assertPass(schema, '2020-01-01');
    await assertPass(schema, 1642232606911);
    await assertPass(schema, undefined);
    await assertPass(schema, 0);
    await assertFail(schema, null, ['Must be a valid date.']);
    await assertFail(schema, false, ['Must be a valid date.']);
    await assertFail(schema, NaN, ['Must be a valid date.']);
    await assertFail(schema, 'invalid', ['Must be a valid date.']);
  });

  it('should validate a required date', async () => {
    const schema = yd.date().required();
    await assertPass(schema, new Date());
    await assertPass(schema, '2020-01-01');
    await assertPass(schema, 1642232606911);
    await assertPass(schema, 0);
    await assertFail(schema, undefined, ['Value is required.']);
    await assertFail(schema, null, ['Must be a valid date.']);
    await assertFail(schema, false, ['Must be a valid date.']);
    await assertFail(schema, NaN, ['Must be a valid date.']);
    await assertFail(schema, 'invalid', ['Must be a valid date.']);
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
    await assertFail(schema, null, ['Must be a string.']);
    await assertFail(schema, false, ['Must be a string.']);
    await assertFail(schema, NaN, ['Must be a string.']);
    await assertFail(schema, 'invalid', ['Must be in ISO 8601 format.']);
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
    await assertFail(schema, '2019-01-01', [
      'Must be after 2020-01-01T00:00:00.000Z.',
    ]);
  });

  it('should validate a maximum date', async () => {
    const schema = yd.date().max('2020-01-01');
    await assertPass(schema, '2019-01-01');
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

  it('should validate a timestamp', async () => {
    const schema = yd.date().timestamp();
    await assertPass(schema, 1642342419713);
    await assertFail(schema, '2019-01-01', ['Must be a timestamp.']);
    const now = new Date();
    const val = await schema.validate(now.getTime());
    expect(val).toEqual(now);
  });

  it('should validate a unix timestamp', async () => {
    const schema = yd.date().timestamp('unix');
    await assertPass(schema, 1642342419713);
    await assertFail(schema, '2019-01-01', ['Must be a unix timestamp.']);

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
      b: yd.number().custom((arr, { root }) => {
        if (!root.a.includes(root.b)) {
          throw new Error('"a" must include "b"');
        }
      }),
    });
    await assertPass(schema, { a: [1, 2, 3], b: 1 });
    await assertFail(schema, { a: [1, 2, 3], b: 4 }, ['"a" must include "b"']);
  });

  it('should cast to an array from commas', async () => {
    const schema = yd.object({
      a: yd.array().cast(),
      b: yd.string(),
    });
    const result = await schema.validate({ a: '1,2,3', b: 'b' });
    expect(result.a).toEqual(['1', '2', '3']);
    expect(result.b).toBe('b');
  });

  it('should cast to an array of specific type', async () => {
    const schema = yd.object({
      a: yd.array(yd.number()).cast(),
      b: yd.string(),
    });
    const result = await schema.validate({ a: '1,2,3', b: 'b' });
    expect(result.a).toEqual([1, 2, 3]);
    expect(result.b).toBe('b');
  });

  it('should cast values globally', async () => {
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
        b: '2',
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
        b: '2',
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
});

describe('localization', () => {
  it('should be able to pass an object to useLocalizer', async () => {
    yd.useLocalizer({
      'Must be a {type}.': 'Gotta be a {type}.',
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
    yd.useLocalizer((template) => {
      return strings[template];
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
    yd.useLocalizer((template) => {
      return strings[template];
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

  it('should be able to inspect localization templates', async () => {
    yd.useLocalizer({
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
      const templates = yd.getLocalizerTemplates();
      expect(templates).toMatchObject({
        'Input failed validation.': '不正な入力がありました。',
        'Object failed validation.': 'Object failed validation.',
      });
    }
  });
});

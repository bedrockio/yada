import yd from '../src';
import { assertPass, assertFail } from './utils';

describe('string', () => {
  it('should validate an optional string', async () => {
    const schema = yd.string();
    await assertPass(schema, 'a');
    await assertPass(schema, undefined);
    await assertPass(schema, '');
    await assertFail(schema, null, ['Must be a string.']);
    await assertFail(schema, 1, ['Must be a string.']);
  });

  it('should validate a required string', async () => {
    const schema = yd.string().required();
    await assertPass(schema, 'a');
    await assertFail(schema, '', ['String may not be empty.']);
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
    await assertPass(schema, '153-0062');
    await assertFail(schema, '80906z', ['Must be a valid postal code.']);
  });

  it('should validate a zipcode', async () => {
    const schema = yd.string().zipcode();
    await assertPass(schema, '80906');
    await assertFail(schema, '153-0062', ['Must be a valid zipcode.']);
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

  it('should correctly validate an optional nested string', async () => {
    const schema = yd
      .object({
        firstName: yd.string(),
        lastName: yd.string().required(),
      })
      .required();

    await assertPass(schema, {
      firstName: 'Foo',
      lastName: 'Bar',
    });

    await assertPass(schema, {
      firstName: '',
      lastName: 'Bar',
    });

    await assertFail(
      schema,
      {
        firstName: 'Foo',
        lastName: '',
      },
      ['String may not be empty.']
    );
  });

  it('should be able to define an optional string field that may not be empty', async () => {
    const schema = yd
      .object({
        firstName: yd.string(),
        lastName: yd.string().options({
          allowEmpty: false,
        }),
      })
      .required();
    await assertPass(schema, {});
    await assertPass(schema, {
      firstName: 'Foo',
      lastName: 'Bar',
    });
    await assertPass(schema, {
      lastName: 'Bar',
    });
    await assertPass(schema, {
      firstName: '',
      lastName: 'Bar',
    });
    await assertPass(schema, {
      firstName: 'Foo',
    });
    await assertPass(schema, {
      firstName: 'Foo',
    });
    await assertFail(schema, undefined, ['Value is required.']);
    await assertFail(
      schema,
      {
        firstName: 'Foo',
        lastName: '',
      },
      ['String may not be empty.']
    );
  });

  it('should run validations on an empty string when allowed', async () => {
    const schema = yd.string().phone().options({
      allowEmpty: false,
    });
    await assertFail(schema, '', ['String may not be empty.']);
  });
});

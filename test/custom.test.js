import yd from '../src';
import { assertPass, assertFail } from './utils';

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
    expect(error.toJSON()).toEqual({
      type: 'validation',
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

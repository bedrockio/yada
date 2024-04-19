import yd from '../src';
import { assertPass, assertFail } from './utils';

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
      expect(error.toJSON()).toEqual({
        type: 'validation',
        message: 'Array failed validation.',
        details: [
          {
            type: 'element',
            message: 'Must be a string.',
            index: 0,
          },
          {
            type: 'element',
            message: 'Must be a string.',
            index: 1,
          },
        ],
      });
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

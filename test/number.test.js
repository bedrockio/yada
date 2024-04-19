import yd from '../src';
import { assertPass, assertFail } from './utils';

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

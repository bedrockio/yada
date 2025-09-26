import yd from '../src';
import { assertFail, assertPass } from './utils';

describe('tuple', () => {
  it('should validate a tuple of same types', async () => {
    const schema = yd.tuple(yd.number(), yd.number());
    await assertPass(schema, [1, 1]);
    await assertFail(schema, [], 'Tuple must be exactly 2 elements.');
    await assertFail(schema, [1], 'Tuple must be exactly 2 elements.');
    await assertFail(schema, [1, 1, 1], 'Tuple must be exactly 2 elements.');
    await assertFail(schema, [1, '1'], 'Must be a number.');
    await assertFail(
      schema,
      ['1', '1'],
      ['Must be a number.', 'Must be a number.'],
    );
    await assertFail(
      schema,
      [null, null],
      ['Must be a number.', 'Must be a number.'],
    );
    await assertFail(
      schema,
      [undefined, undefined],
      ['Must be a number.', 'Must be a number.'],
    );
  });

  it('should validate a tuple of different types', async () => {
    const schema = yd.tuple(yd.string(), yd.number());
    await assertPass(schema, ['str', 1]);
    await assertFail(schema, [1, 1], 'Must be a string.');
    await assertFail(
      schema,
      [1, 'str'],
      ['Must be a string.', 'Must be a number.'],
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
      'Must be a number.',
    );
  });

  it('should allow a loose option to ignore empty arrays', async () => {
    const schema = yd.tuple(yd.number(), yd.number()).loose();
    await assertPass(schema, []);
    await assertPass(schema, [1, 1]);
    await assertFail(schema, [1], 'Tuple must be exactly 2 elements.');
    await assertFail(schema, [1, 1, 1], 'Tuple must be exactly 2 elements.');
    await assertFail(schema, [1, '1'], 'Must be a number.');
    await assertFail(
      schema,
      ['1', '1'],
      ['Must be a number.', 'Must be a number.'],
    );
  });
});

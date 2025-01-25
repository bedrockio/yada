import yd from '../src';
import { assertPass, assertFail } from './utils';

describe('boolean', () => {
  it('should validate an optional boolean', async () => {
    const schema = yd.boolean();
    await assertPass(schema, true);
    await assertPass(schema, false);
    await assertPass(schema, undefined);
    await assertFail(schema, 1, 'Must be a boolean.');
  });

  it('should validate a required boolean', async () => {
    const schema = yd.boolean().required();
    await assertPass(schema, true);
    await assertPass(schema, false);
    await assertFail(schema, undefined, 'Value is required.');
    await assertFail(schema, 1, 'Must be a boolean.');
  });
});

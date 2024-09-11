import yd from '../src';
import { assertPass } from './utils';

describe('nullable', () => {
  it('should allow a string to be nullable', async () => {
    const schema = yd.string().nullable();
    await assertPass(schema, 'one');
    await assertPass(schema, null);
  });

  it('should allow an object to be nullable', async () => {
    const schema = yd.object().nullable();
    await assertPass(schema, {});
    await assertPass(schema, null);
  });
});

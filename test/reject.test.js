import yd from '../src';
import { assertPass, assertFail } from './utils';

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

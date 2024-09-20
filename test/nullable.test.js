import yd from '../src';
import { assertPass, assertFail } from './utils';

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

  it('should allow a nullable string', async () => {
    const schema = yd.string().nullable();
    await assertPass(schema, '');
    await assertPass(schema, null);
  });

  it('should allow null for a required string', async () => {
    const schema = yd.string().required().nullable();
    await assertFail(schema, '', ['String may not be empty.']);
    await assertPass(schema, null);
  });

  it('should allow a nullable string with options', async () => {
    const schema = yd.string().options({
      nullable: true,
    });
    await assertPass(schema, '');
    await assertPass(schema, null);
  });
});

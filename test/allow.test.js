import yd from '../src';
import { assertPass, assertFail } from './utils';

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

  it('should be able to pass custom message', async () => {
    const schema = yd.allow('one', 'two').message('Must be one or two.');
    await assertFail(schema, 'three', ['Must be one or two.']);
  });

  it('should fail with error message of failed schema', async () => {
    const schema = yd.object({
      shop: yd.allow(
        null,
        yd.object({
          id: yd.string().mongo(),
        })
      ),
    });

    await assertFail(
      schema,
      {
        shop: {
          id: 'bad-id',
        },
      },
      ['Must be a valid ObjectId.']
    );
  });

  it('should fail with custom error message of failed schema', async () => {
    const schema = yd.object({
      shop: yd.allow(
        null,
        yd
          .object({
            id: yd.string().mongo(),
          })
          .message('Custom message')
      ),
    });

    let error;
    try {
      await schema.validate({
        shop: {
          id: 'bad-id',
        },
      });
    } catch (err) {
      error = err;
    }
    expect(error.toJSON()).toEqual({
      type: 'validation',
      message: 'Object failed validation.',
      details: [
        {
          type: 'field',
          field: 'shop',
          message: 'Custom message',
          details: [
            {
              type: 'field',
              field: 'id',
              message: 'Must be a valid ObjectId.',
            },
          ],
        },
      ],
    });
  });

  it('should correctly rollup enum error', async () => {
    const schema = yd.object({
      id: yd.allow(null, yd.string().mongo()),
    });

    let error;
    try {
      await schema.validate({
        id: 'bad-id',
      });
    } catch (err) {
      error = err;
    }
    expect(error.toJSON()).toEqual({
      type: 'validation',
      message: 'Object failed validation.',
      details: [
        {
          type: 'field',
          field: 'id',
          message: 'Input failed validation.',
          details: [
            {
              type: 'format',
              message: 'Must be a valid ObjectId.',
            },
          ],
        },
      ],
    });
  });

  it('should display custom enum message', async () => {
    const schema = yd.object({
      id: yd
        .allow(null, yd.string().mongo())
        .message('Must be an ObjectId or null.'),
    });

    let error;
    try {
      await schema.validate({
        id: 'bad-id',
      });
    } catch (err) {
      error = err;
    }
    expect(error.toJSON()).toEqual({
      type: 'validation',
      message: 'Object failed validation.',
      details: [
        {
          type: 'field',
          field: 'id',
          message: 'Must be an ObjectId or null.',
          details: [
            {
              type: 'format',
              message: 'Must be a valid ObjectId.',
            },
          ],
        },
      ],
    });
  });
});

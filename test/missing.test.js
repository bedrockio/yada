import yd from '../src';
import { assertPass, assertFail } from './utils';

describe('missing', () => {
  it('should not bail on previous validator', async () => {
    const schema = yd.string().missing(() => {
      throw new Error('Bad!');
    });
    await assertFail(schema, undefined, 'Bad!');
  });

  it('should work on optional fields for complex schemas', async () => {
    const schema = yd.object({
      email: yd.string().email(),
      phone: yd
        .string()
        .phone()
        .missing(({ root }) => {
          if (root.email) {
            throw new Error('"phone" is required when "email" is passed.');
          }
        }),
    });
    await assertPass(schema, {});
    await assertPass(schema, { phone: '+15551234567' });
    await assertPass(schema, {
      email: 'foo@bar.com',
      phone: '+15551234567',
    });
    await assertFail(
      schema,
      { email: 'foo@bar.com' },
      '"phone" is required when "email" is passed.',
    );
  });

  it('should pass defaults along to custom validators in other fields', async () => {
    const schema = yd.object({
      type: yd.string().default('email'),
      email: yd
        .string()
        .email()
        .missing(({ root }) => {
          if (root.type === 'email') {
            throw new Error('Email must be passed when "type" is "email".');
          }
        }),
    });
    await assertFail(
      schema,
      {},
      'Email must be passed when "type" is "email".',
    );
    await assertFail(
      schema,
      { type: 'email' },
      'Email must be passed when "type" is "email".',
    );
    await assertPass(schema, { type: 'phone' });
  });
});

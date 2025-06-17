import yd from '../src';
import { assertPass, assertFail } from './utils';

describe('date', () => {
  it('should validate an optional date', async () => {
    const schema = yd.date();
    await assertPass(schema, new Date());
    await assertPass(schema, '2020-01-01');
    await assertPass(schema, 1642232606911);
    await assertPass(schema, undefined);
    await assertPass(schema, 0);
    await assertFail(schema, null, 'Must be a valid date input.');
    await assertFail(schema, false, 'Must be a valid date input.');
    await assertFail(schema, NaN, 'Must be a valid date input.');
    await assertFail(schema, 'invalid', 'Must be a valid date input.');
  });

  it('should validate a required date', async () => {
    const schema = yd.date().required();
    await assertPass(schema, new Date());
    await assertPass(schema, '2020-01-01');
    await assertPass(schema, 1642232606911);
    await assertPass(schema, 0);
    await assertFail(schema, undefined, 'Value is required.');
    await assertFail(schema, null, 'Must be a valid date input.');
    await assertFail(schema, false, 'Must be a valid date input.');
    await assertFail(schema, NaN, 'Must be a valid date input.');
    await assertFail(schema, 'invalid', 'Must be a valid date input.');
  });

  it('should validate an iso date', async () => {
    const schema = yd.date().iso().required();
    await assertPass(schema, '2022-01-15T08:27:36.114Z');
    await assertPass(schema, '2022-01-15T08:27:36.114');
    await assertPass(schema, '2022-01-15T08:27:36');
    await assertPass(schema, '2022-01-15T08:27');

    await assertPass(schema, '2022-01-15');
    await assertPass(schema, '2022-01');

    await assertFail(schema, new Date(), 'Must be a string.');
    await assertFail(schema, 1642232606911, 'Must be a string.');
    await assertFail(schema, undefined, 'Value is required.');
    await assertFail(schema, null, 'Must be a valid date input.');
    await assertFail(schema, false, 'Must be a valid date input.');
    await assertFail(schema, NaN, 'Must be a valid date input.');
    await assertFail(schema, 'invalid', 'Must be a valid date input.');
    await assertFail(
      schema,
      '01 Jan 1970 00:00:00 GMT',
      'Must be in ISO-8601 format.',
    );

    // Hours only is NOT valid under ISO-8601
    await assertFail(schema, '2022-01-15T08', 'Must be a valid date input.');
  });

  it('should convert string to date', async () => {
    const schema = yd.date();
    const date = await schema.validate('2020-01-01');
    expect(date).toBeInstanceOf(Date);
  });

  it('should validate a minimum date', async () => {
    const schema = yd.date().min('2020-01-01');
    await assertPass(schema, '2020-12-02');
    await assertPass(schema, '2020-01-01');
    await assertFail(
      schema,
      '2019-01-01',
      'Must be after 2020-01-01T00:00:00.000Z.',
    );
  });

  it('should validate a maximum date', async () => {
    const schema = yd.date().max('2020-01-01');
    await assertPass(schema, '2019-01-01');
    await assertPass(schema, '2020-01-01');
    await assertFail(
      schema,
      '2020-12-02',
      'Must be before 2020-01-01T00:00:00.000Z.',
    );
  });

  it('should validate a past date', async () => {
    const schema = yd.date().past();
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await assertPass(schema, '2019-01-01');
    await assertFail(schema, future, 'Must be in the past.');
  });

  it('should validate a future date', async () => {
    const schema = yd.date().future();
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await assertPass(schema, future);
    await assertFail(schema, '2019-01-01', 'Must be in the future.');
  });

  it('should validate a date before', async () => {
    const schema = yd.date().before('2020-01-01');
    await assertPass(schema, '2019-01-01');
    await assertPass(schema, '2019-12-31');
    await assertFail(
      schema,
      '2020-01-01',
      'Must be before 2020-01-01T00:00:00.000Z.',
    );
  });

  it('should validate a date after', async () => {
    const schema = yd.date().after('2020-01-01');
    await assertPass(schema, '2020-01-02');
    await assertPass(schema, '2021-01-01');
    await assertFail(
      schema,
      '2020-01-01',
      'Must be after 2020-01-01T00:00:00.000Z.',
    );
  });

  it('should validate a timestamp', async () => {
    const schema = yd.date().timestamp();
    await assertPass(schema, 1642342419713);
    await assertFail(
      schema,
      '2019-01-01',
      'Must be a timestamp in milliseconds.',
    );
    const now = new Date();
    const val = await schema.validate(now.getTime());
    expect(val).toEqual(now);
  });

  it('should validate a unix timestamp', async () => {
    const schema = yd.date().unix();
    await assertPass(schema, 1642342419713);
    await assertFail(schema, '2019-01-01', 'Must be a timestamp in seconds.');

    const now = new Date();
    const val = await schema.validate(now.getTime() / 1000);
    expect(val).toEqual(now);
  });

  it('should not imply formatting constraints on a default value', async () => {
    let schema;

    schema = yd.date().iso().default(Date.now);
    expect(await schema.validate()).toBeInstanceOf(Date);

    schema = yd.date().timestamp().default(Date.now);
    expect(await schema.validate()).toBeInstanceOf(Date);

    schema = yd.date().unix().default(Date.now);
    expect(await schema.validate()).toBeInstanceOf(Date);
  });
});

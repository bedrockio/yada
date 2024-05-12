import yd from '../src';

describe('serialization', () => {
  it('should correctly serialize object error', async () => {
    const schema = yd.object({
      a: yd.string().required(),
      b: yd.string().required(),
    });
    let error;
    try {
      await schema.validate({
        b: 1,
      });
    } catch (err) {
      error = err;
    }
    expect(error.toJSON()).toEqual({
      type: 'validation',
      details: [
        {
          type: 'field',
          field: 'a',
          details: [
            {
              type: 'required',
              message: 'Value is required.',
            },
          ],
        },
        {
          type: 'field',
          field: 'b',
          details: [
            {
              type: 'type',
              kind: 'string',
              message: 'Must be a string.',
            },
          ],
        },
      ],
    });
  });

  it('should correctly serialize array error', async () => {
    const schema = yd.array(yd.string());
    let error;
    try {
      await schema.validate([1, 2]);
    } catch (err) {
      error = err;
    }
    expect(error.toJSON()).toEqual({
      type: 'validation',
      details: [
        {
          type: 'array',
          details: [
            {
              type: 'element',
              index: 0,
              details: [
                {
                  type: 'type',
                  kind: 'string',
                  message: 'Must be a string.',
                },
              ],
            },
            {
              type: 'element',
              index: 1,
              details: [
                {
                  type: 'type',
                  kind: 'string',
                  message: 'Must be a string.',
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it('should correctly serialize password error', async () => {
    const schema = yd.string().password({
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    });
    let error;
    try {
      expect.assertions(1);
      await schema.validate('a');
    } catch (err) {
      error = err;
    }
    expect(error.toJSON()).toEqual({
      type: 'validation',
      details: [
        {
          type: 'password',
          message: 'Must be at least 6 characters.',
        },
        {
          type: 'password',
          message: 'Must contain at least 1 uppercase character.',
        },
        {
          type: 'password',
          message: 'Must contain at least 1 number.',
        },
        {
          type: 'password',
          message: 'Must contain at least 1 symbol.',
        },
      ],
    });
  });

  it('should serialize custom error', async () => {
    const schema = yd.custom(() => {
      throw new Error('Bad!');
    });
    try {
      await schema.validate('test');
    } catch (error) {
      expect(error.toJSON()).toEqual({
        type: 'validation',
        details: [
          {
            message: 'Bad!',
            type: 'custom',
          },
        ],
      });
    }
  });

  it('should serialize custom error on field', async () => {
    const schema = yd.object({
      a: yd.custom(() => {
        throw new Error('Bad!');
      }),
    });
    try {
      await schema.validate({
        a: 'test',
      });
    } catch (error) {
      expect(error.toJSON()).toEqual({
        type: 'validation',
        details: [
          {
            type: 'field',
            field: 'a',
            details: [
              {
                type: 'custom',
                message: 'Bad!',
              },
            ],
          },
        ],
      });
    }
  });
});

describe('getFullMessage', () => {
  it('should get full error message', async () => {
    const schema = yd.object({
      a: yd.string(),
      b: yd.number(),
    });

    let error;
    try {
      await schema.validate({
        a: 1,
        b: 'a',
      });
    } catch (err) {
      error = err;
    }
    expect(error.getFullMessage()).toBe(
      '"a" must be a string. "b" must be a number.'
    );
  });

  it('should get full error message with delimiter', async () => {
    const schema = yd.object({
      a: yd.string(),
      b: yd.number(),
    });

    let error;
    try {
      await schema.validate({
        a: 1,
        b: 'a',
      });
    } catch (err) {
      error = err;
    }
    expect(
      error.getFullMessage({
        delimiter: '\n',
      })
    ).toBe('"a" must be a string.\n"b" must be a number.');
  });

  it('should return correct message for unknown fields', async () => {
    const schema = yd.object({});

    let error;
    try {
      await schema.validate({
        foo: 'bar',
      });
    } catch (err) {
      error = err;
    }
    expect(error.getFullMessage()).toBe('Unknown field "foo".');
  });

  it('should get full error message for password fields', async () => {
    const schema = yd.object({
      password: yd.string().password({
        minLength: 12,
        minNumbers: 1,
      }),
    });

    let error;
    try {
      await schema.validate({ password: 'a' });
    } catch (err) {
      error = err;
    }
    expect(error.getFullMessage()).toBe(
      '"password" must be at least 12 characters. "password" must contain at least 1 number.'
    );
  });

  it('should get full error message with natural fields', async () => {
    const schema = yd.object({
      authCode: yd.string().required(),
      pass_code: yd.string().required(),
      'my-token': yd.string().required(),
    });

    let error;
    try {
      await schema.validate({});
    } catch (err) {
      error = err;
    }
    expect(
      error.getFullMessage({
        natural: true,
      })
    ).toBe(
      'Auth code is required. Pass code is required. My token is required.'
    );
  });

  it('should not interpolate tokens that do not exist', async () => {
    const schema = yd.custom(() => {
      throw new Error('Must {not} be.');
    });
    try {
      await schema.validate({
        foo: 'bar',
      });
    } catch (error) {
      expect(error.getFullMessage()).toBe('Must {not} be.');
    }
  });

  it('should not modify a custom error message', async () => {
    const schema = yd.object({
      email: yd.string().custom(() => {
        throw new Error('Email already exists.');
      }),
    });

    let error;
    try {
      await schema.validate({
        email: 'foo@bar.com',
      });
    } catch (err) {
      error = err;
    }
    expect(error.getFullMessage()).toBe('Email already exists.');
  });
});

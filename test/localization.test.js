import yd from '../src';
import { LocalizedError } from '../src/errors';
import { useLocalizer, getLocalizedMessages } from '../src/localization';

describe('localization', () => {
  it('should be able to pass an object to useLocalizer', async () => {
    useLocalizer({
      'Must be a string.': 'Gotta be a string.',
    });
    let error;
    try {
      await yd.string().validate(1);
    } catch (err) {
      error = err;
    }
    expect(error.details[0].message).toBe('Gotta be a string.');
  });

  it('should be able to pass a function to useLocalizer', async () => {
    const strings = {
      'Must be at least {length} character{s}.':
        '{length}文字以上入力して下さい。',
      'Object failed validation.': '不正な入力がありました。',
    };
    useLocalizer((message) => {
      return strings[message];
    });
    const schema = yd.object({
      password: yd.string().password({
        minLength: 6,
        minNumbers: 1,
      }),
    });

    let error;
    try {
      await schema.validate({
        password: 'a',
      });
    } catch (err) {
      error = err;
    }
    expect(error.message).toBe('不正な入力がありました。');
    expect(error.details[0].details[0].message).toBe(
      '6文字以上入力して下さい。'
    );
  });

  it('should be able to pass a function for complex localizations', async () => {
    const strings = {
      'Must be at least {length} character{s}.': ({ length }) => {
        const chars = length === 1 ? 'carattere' : 'caratteri';
        return `Deve contenere almeno ${length} ${chars}.`;
      },
    };
    useLocalizer((message) => {
      return strings[message];
    });
    const schema = yd.object({
      password: yd.string().password({
        minLength: 6,
      }),
    });

    let error;
    try {
      await schema.validate({
        password: 'a',
      });
    } catch (err) {
      error = err;
    }
    expect(error.details[0].details[0].message).toBe(
      'Deve contenere almeno 6 caratteri.'
    );
  });

  it('should be able to inspect localization message', async () => {
    useLocalizer({
      'Input failed validation.': '不正な入力がありました。',
    });
    const schema = yd.object({
      password: yd.string().password({
        minLength: 6,
        minNumbers: 1,
      }),
    });
    try {
      await schema.validate({
        password: 'a',
      });
    } catch (err) {
      const localized = getLocalizedMessages();
      expect(localized).toEqual({
        'Must be at least {length} character{s}.':
          'Must be at least {length} character{s}.',
        'Must contain at least {length} number{s}.':
          'Must contain at least {length} number{s}.',
        'Input failed validation.': '不正な入力がありました。',
        'Field failed validation.': 'Field failed validation.',
        'Object failed validation.': 'Object failed validation.',
      });
    }
  });

  it('should localize the full message', async () => {
    useLocalizer({
      '{field} must be a string.': '{field}: 文字列を入力してください。',
      '{field} must be a number.': '{field}: 数字を入力してください。',
    });
    const schema = yd.object({
      name: yd.string(),
      age: yd.number(),
    });
    try {
      await schema.validate({
        name: 1,
        age: '15',
      });
    } catch (err) {
      expect(err.getFullMessage()).toBe(
        '"name": 文字列を入力してください。 "age": 数字を入力してください。'
      );
      expect(getLocalizedMessages()).toMatchObject({
        '{field} must be a number.': '{field}: 数字を入力してください。',
        '{field} must be a string.': '{field}: 文字列を入力してください。',
      });
    }
  });

  it('should allow a custom localized error to be thrown', async () => {
    useLocalizer({
      'Invalid coordinates': '座標に不正な入力がありました。',
    });
    const schema = yd.custom(() => {
      throw new LocalizedError('Invalid coordinates');
    });
    try {
      await schema.validate({
        coords: 'coords',
      });
    } catch (err) {
      expect(err.toJSON()).toEqual({
        type: 'validation',
        message: 'Input failed validation.',
        details: [
          {
            type: 'custom',
            message: '座標に不正な入力がありました。',
          },
        ],
      });
      expect(err.getFullMessage()).toBe('座標に不正な入力がありました。');
    }
  });
});

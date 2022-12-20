import validator from 'validator';
import TypeSchema from './TypeSchema';
import { LocalizedError } from './errors';
import { wrapSchema } from './utils';
import {
  PASSWORD_DEFAULTS,
  validateLength,
  validateLowercase,
  validateUppercase,
  validateNumbers,
  validateSymbols,
} from './password';

const SLUG_REG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

class StringSchema extends TypeSchema {
  constructor() {
    super(String);
    this.assert('type', (val) => {
      if (typeof val !== 'string') {
        throw new LocalizedError('Must be a string.');
      }
    });
  }

  min(length) {
    return this.clone().assert('length', (str) => {
      if (str && str.length < length) {
        throw new LocalizedError('Must be {length} characters or more.', {
          length,
        });
      }
    });
  }

  max(length) {
    return this.clone().assert('length', (str) => {
      if (str && str.length > length) {
        throw new LocalizedError('Must be {length} characters or less.', {
          length,
        });
      }
    });
  }

  trim() {
    return this.clone().transform((str) => {
      return str.trim();
    });
  }

  lowercase(assert = false) {
    return this.clone().transform((str) => {
      const lower = str.toLowerCase();
      if (lower !== str) {
        if (assert) {
          throw new LocalizedError('Must be in lower case.');
        }
        return lower;
      }
    });
  }

  uppercase(assert = false) {
    return this.clone().transform((str) => {
      const upper = str.toUpperCase();
      if (upper !== str) {
        if (assert) {
          throw new LocalizedError('Must be in upper case.');
        }
        return upper;
      }
    });
  }

  match(reg) {
    if (!(reg instanceof RegExp)) {
      throw new LocalizedError('Argument must be a regular expression');
    }
    return this.clone().assert('regex', (str) => {
      if (str && !reg.test(str)) {
        throw new LocalizedError('Must match pattern {reg}.', {
          reg,
        });
      }
    });
  }

  email() {
    return this.format('email', (str) => {
      if (!validator.isEmail(str)) {
        throw new LocalizedError('Must be an email address.');
      }
    });
  }

  hex() {
    return this.format('hex', (str) => {
      if (!validator.isHexadecimal(str)) {
        throw new LocalizedError('Must be hexadecimal.');
      }
    });
  }

  md5() {
    return this.format('md5', (str) => {
      if (!validator.isHash(str, 'md5')) {
        throw new LocalizedError('Must be a hash in md5 format.');
      }
    });
  }

  sha1() {
    return this.format('sha1', (str) => {
      if (!validator.isHash(str, 'sha1')) {
        throw new LocalizedError('Must be a hash in sha1 format.');
      }
    });
  }

  ascii() {
    return this.format('ascii', (str) => {
      if (!validator.isAscii(str)) {
        throw new LocalizedError('Must be ASCII.');
      }
    });
  }

  base64(options) {
    return this.format('base64', (str) => {
      if (!validator.isBase64(str, options)) {
        throw new LocalizedError('Must be base64.');
      }
    });
  }

  creditCard() {
    return this.format('credit-card', (str) => {
      if (!validator.isCreditCard(str)) {
        throw new LocalizedError('Must be a valid credit card number.');
      }
    });
  }

  ip() {
    return this.format('ip', (str) => {
      if (!validator.isIP(str)) {
        throw new LocalizedError('Must be a valid IP address.');
      }
    });
  }

  country() {
    return this.format('country', (str) => {
      if (!validator.isISO31661Alpha2(str)) {
        throw new LocalizedError('Must be a valid country code.');
      }
    });
  }

  locale() {
    return this.format('locale', (str) => {
      if (!validator.isLocale(str)) {
        throw new LocalizedError('Must be a valid locale code.');
      }
    });
  }

  jwt() {
    return this.format('jwt', (str) => {
      if (!validator.isJWT(str)) {
        throw new LocalizedError('Must be a valid JWT token.');
      }
    });
  }

  slug() {
    return this.format('slug', (str) => {
      // Validator shows some issues here so use a custom regex.
      if (!SLUG_REG.test(str)) {
        throw new LocalizedError('Must be a valid slug.');
      }
    });
  }

  latlng() {
    return this.format('latlng', (str) => {
      if (!validator.isLatLong(str)) {
        throw new LocalizedError('Must be a valid lat,lng coordinate.');
      }
    });
  }

  postalCode(locale = 'any') {
    return this.format('postal-code', (str) => {
      if (!validator.isPostalCode(str, locale)) {
        throw new LocalizedError('Must be a valid postal code.');
      }
    });
  }

  password(options = {}) {
    const { minLength, minLowercase, minUppercase, minNumbers, minSymbols } = {
      ...PASSWORD_DEFAULTS,
      ...options,
    };

    const schema = this.clone();

    if (minLength) {
      schema.assert('password', validateLength(minLength));
    }
    if (minLowercase) {
      schema.assert('password', validateLowercase(minLowercase));
    }
    if (minUppercase) {
      schema.assert('password', validateUppercase(minUppercase));
    }
    if (minNumbers) {
      schema.assert('password', validateNumbers(minNumbers));
    }
    if (minSymbols) {
      schema.assert('password', validateSymbols(minSymbols));
    }

    return schema;
  }

  url(options) {
    return this.format('url', (str) => {
      if (!validator.isURL(str, options)) {
        throw new LocalizedError('Must be a valid URL.');
      }
    });
  }

  domain(options) {
    return this.format('domain', (str) => {
      if (!validator.isFQDN(str, options)) {
        throw new LocalizedError('Must be a valid domain.');
      }
    });
  }

  uuid(version) {
    return this.format('uuid', (str) => {
      if (!validator.isUUID(str, version)) {
        throw new LocalizedError('Must be a valid unique id.');
      }
    });
  }

  btc() {
    return this.format('bitcoin-address', (str) => {
      if (!validator.isBtcAddress(str)) {
        throw new LocalizedError('Must be a valid Bitcoin address.');
      }
    });
  }

  eth() {
    return this.format('etherium-address', (str) => {
      if (!validator.isEthereumAddress(str)) {
        throw new LocalizedError('Must be a valid Ethereum address.');
      }
    });
  }

  swift() {
    return this.format('swift-code', (str) => {
      if (!validator.isBIC(str)) {
        throw new LocalizedError('Must be a valid SWIFT code.');
      }
    });
  }

  mongo() {
    return this.format('mongo-object-id', (str) => {
      if (!validator.isMongoId(str)) {
        throw new LocalizedError('Must be a valid ObjectId.');
      }
    });
  }
}

export default wrapSchema(StringSchema);

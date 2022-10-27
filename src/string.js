import validator from 'validator';

import TypeSchema from './TypeSchema';
import { wrapSchema } from './utils';
import { FieldError } from './errors';
import { PASSWORD_DEFAULTS, PASSWORD_LABELS } from './password';

const SLUG_REG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

class StringSchema extends TypeSchema {
  constructor() {
    super(String);
  }

  min(length) {
    return this.clone().assert('length', (str) => {
      if (str && str.length < length) {
        throw new Error(`{label} must be ${length} characters or more.`);
      }
    });
  }

  max(length) {
    return this.clone().assert('length', (str) => {
      if (str && str.length > length) {
        throw new Error(`{label} must be ${length} characters or less.`);
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
          throw new Error('{label} must be in lower case.');
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
          throw new Error('{label} must be in upper case.');
        }
        return upper;
      }
    });
  }

  matches(reg) {
    if (!(reg instanceof RegExp)) {
      throw new Error('Argument must be a regular expression');
    }
    return this.clone().assert('regex', (str) => {
      if (str && !reg.test(str)) {
        throw new Error(`{label} must match pattern ${reg}.`);
      }
    });
  }

  email() {
    return this.format('email', (str) => {
      if (!validator.isEmail(str)) {
        throw new Error('{label} has incorrect email format.');
      }
    });
  }

  hex() {
    return this.format('hex', (str) => {
      if (!validator.isHexadecimal(str)) {
        throw new Error('{label} must be hexadecimal.');
      }
    });
  }

  md5() {
    return this.format('md5', (str) => {
      if (!validator.isHash(str, 'md5')) {
        throw new Error('{label} must be a hash in md5 format.');
      }
    });
  }

  sha1() {
    return this.format('sha1', (str) => {
      if (!validator.isHash(str, 'sha1')) {
        throw new Error('{label} must be a hash in sha1 format.');
      }
    });
  }

  ascii() {
    return this.format('ascii', (str) => {
      if (!validator.isAscii(str)) {
        throw new Error('{label} must be ASCII.');
      }
    });
  }

  base64(options) {
    return this.format('base64', (str) => {
      if (!validator.isBase64(str, options)) {
        throw new Error('{label} must be base64.');
      }
    });
  }

  creditCard() {
    return this.format('credit-card', (str) => {
      if (!validator.isCreditCard(str)) {
        throw new Error('{label} must be a valid credit card number.');
      }
    });
  }

  ip() {
    return this.format('ip', (str) => {
      if (!validator.isIP(str)) {
        throw new Error('{label} must be a valid IP address.');
      }
    });
  }

  country() {
    return this.format('country', (str) => {
      if (!validator.isISO31661Alpha2(str)) {
        throw new Error('{label} must be a valid country code.');
      }
    });
  }

  locale() {
    return this.format('locale', (str) => {
      if (!validator.isLocale(str)) {
        throw new Error('{label} must be a valid locale code.');
      }
    });
  }

  jwt() {
    return this.format('jwt', (str) => {
      if (!validator.isJWT(str)) {
        throw new Error('{label} must be a valid JWT token.');
      }
    });
  }

  slug() {
    return this.format('slug', (str) => {
      // Validator shows some issues here so use a custom regex.
      if (!SLUG_REG.test(str)) {
        throw new Error('{label} must be a valid slug.');
      }
    });
  }

  latlng() {
    return this.format('latlng', (str) => {
      if (!validator.isLatLong(str)) {
        throw new Error('{label} must be a valid lat,lng coordinate.');
      }
    });
  }

  postalCode(locale = 'any') {
    return this.format('postal-code', (str) => {
      if (!validator.isPostalCode(str, locale)) {
        throw new Error('{label} must be a valid postal code.');
      }
    });
  }

  password(options = PASSWORD_DEFAULTS) {
    return this.format('password', (str) => {
      if (!validator.isStrongPassword(str, options)) {
        const fields = Object.entries(options)
          .map(([key, val]) => {
            const fn = PASSWORD_LABELS[key];
            if (fn && val > 0) {
              return new Error(fn(val));
            }
          })
          .filter((msg) => msg);
        throw new FieldError('Invalid password.', fields);
      }
    });
  }

  url(options) {
    return this.format('url', (str) => {
      if (!validator.isURL(str, options)) {
        throw new Error('{label} must be a valid URL.');
      }
    });
  }

  domain(options) {
    return this.format('domain', (str) => {
      if (!validator.isFQDN(str, options)) {
        throw new Error('{label} must be a valid domain.');
      }
    });
  }

  uuid(version) {
    return this.format('uuid', (str) => {
      if (!validator.isUUID(str, version)) {
        throw new Error('{label} must be a valid unique id.');
      }
    });
  }

  btc() {
    return this.format('bitcoin-address', (str) => {
      if (!validator.isBtcAddress(str)) {
        throw new Error('{label} must be a valid Bitcoin address.');
      }
    });
  }

  eth() {
    return this.format('etherium-address', (str) => {
      if (!validator.isEthereumAddress(str)) {
        throw new Error('{label} must be a valid Ethereum address.');
      }
    });
  }

  swift() {
    return this.format('swift-code', (str) => {
      if (!validator.isBIC(str)) {
        throw new Error('{label} must be a valid SWIFT code.');
      }
    });
  }

  mongo() {
    return this.format('mongo-object-id', (str) => {
      if (!validator.isMongoId(str)) {
        throw new Error('{label} must be a valid ObjectId.');
      }
    });
  }
}

export default wrapSchema(StringSchema);

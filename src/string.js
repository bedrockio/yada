import validator from 'validator';
import TypeSchema from './TypeSchema';
import { LocalizedError } from './errors';
import {
  validateLength,
  validateLowercase,
  validateUppercase,
  validateNumbers,
  validateSymbols,
  getPasswordOptions,
} from './password';

const SLUG_REG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PHONE_REG = /^\+\d{1,3}\d{3,14}$/;

const PHONE_DESCRIPTION =
  'A phone number in [E.164](https://en.wikipedia.org/wiki/E.164) format.';

class StringSchema extends TypeSchema {
  constructor() {
    super(String);
    this.assert('type', (val, options) => {
      if (typeof val !== 'string' && options.cast) {
        val = String(val);
      }
      if (typeof val !== 'string') {
        throw new LocalizedError('Must be a string.');
      }
      return val;
    });
  }

  /**
   * @returns {this}
   */
  required() {
    return this.clone({ required: true }).assert('required', (val) => {
      if (val == null) {
        throw new LocalizedError('Value is required.');
      } else if (val === '') {
        throw new LocalizedError('String may not be empty.');
      }
    });
  }

  /**
   * @param {number} length
   */
  length(length) {
    return this.clone({ length }).assert('length', (str) => {
      if (str && str.length !== length) {
        throw new LocalizedError('Must be exactly {length} characters.', {
          length,
        });
      }
    });
  }

  /**
   * @param {number} length
   */
  min(length) {
    return this.clone({ min: length }).assert('length', (str) => {
      if (str && str.length < length) {
        throw new LocalizedError('Must be {length} characters or more.', {
          length,
        });
      }
    });
  }

  /**
   * @param {number} length
   */
  max(length) {
    return this.clone({ max: length }).assert('length', (str) => {
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

  /**
   * @param {boolean} [assert] Throws an error if not lowercase. Default: `false`.
   */
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

  /**
   * @param {boolean} [assert] Throws an error if not uppercase. Default: `false`.
   */
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

  /**
   * @param {RegExp} reg
   */
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

  phone() {
    return this.format('phone', (str) => {
      if (!PHONE_REG.test(str)) {
        throw new LocalizedError('Must be a valid phone number.');
      }
    }).description(PHONE_DESCRIPTION);
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

  /**
   * @param {object} [options]
   * @param {boolean} [options.urlSafe]
   */
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

  /**
   * @param {string} locale
   */
  postalCode(locale = 'any') {
    return this.format('postal-code', (str) => {
      if (!validator.isPostalCode(str, locale)) {
        throw new LocalizedError('Must be a valid postal code.');
      }
    });
  }

  zipcode() {
    return this.format('zipcode', (str) => {
      if (!validator.isPostalCode(str, 'US')) {
        throw new LocalizedError('Must be a valid zipcode.');
      }
    });
  }

  /**
   * @param {object} [options]
   * @param {number} [options.minLength]
   * @param {number} [options.minNumbers]
   * @param {number} [options.minSymbols]
   * @param {number} [options.minLowercase]
   * @param {number} [options.minUppercase]
   */
  password(options = {}) {
    const {
      description,
      minLength,
      minNumbers,
      minSymbols,
      minLowercase,
      minUppercase,
    } = getPasswordOptions(options);

    const schema = this.clone().description(description);

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

  /**
   * @param {object} [options]
   * @param {boolean} [options.require_protocol]
   * @param {boolean} [options.require_valid_protocol]
   * @param {boolean} [options.require_host]
   * @param {boolean} [options.require_port]
   * @param {boolean} [options.allow_protocol_relative_urls]
   * @param {boolean} [options.allow_fragments]
   * @param {boolean} [options.allow_query_components]
   * @param {boolean} [options.validate_length]
   * @param {string[]} [options.protocols]
   */
  url(options) {
    return this.format('url', (str) => {
      if (!validator.isURL(str, options)) {
        throw new LocalizedError('Must be a valid URL.');
      }
    });
  }

  /**
   * @param {object} [options]
   * @param {boolean} [options.require_tld=true]
   * @param {boolean} [options.allow_underscores=false]
   * @param {boolean} [options.allow_trailing_dot=false]
   * @param {boolean} [options.allow_numeric_tld=false]
   * @param {boolean} [options.allow_wildcard=false]
   * @param {boolean} [options.ignore_max_length=false]
   */
  domain(options) {
    return this.format('domain', (str) => {
      if (!validator.isFQDN(str, options)) {
        throw new LocalizedError('Must be a valid domain.');
      }
    });
  }

  /**
   * @param {1 | 2 | 3 | 4 | 5} [version] Version of UUID to check.
   */
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

  toOpenApi(extra) {
    const { min, max } = this.meta;
    return {
      ...super.toOpenApi(extra),
      ...(min != null && {
        minLength: min,
      }),
      ...(max != null && {
        maxLength: max,
      }),
    };
  }
}

/**
 * Creates a [string schema](https://github.com/bedrockio/yada#string).
 */
export default function () {
  return new StringSchema();
}

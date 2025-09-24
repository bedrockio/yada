# Yada

Yada is a validation library inspired by [Joi](https://joi.dev/). The name
derives from a
[Japanese slang phrase](https://jisho.org/word/%E3%82%84%E3%81%A0) that
expresses rejection. Its goal is to provide an API for validation that is simple
and composable.

Concepts

- [Installation](#installation)
- [Getting Started](#getting-started)
- [Types](#types)
  - [String](#string)
  - [Number](#number)
  - [Boolean](#boolean)
  - [Array](#array)
  - [Tuple](#tuple)
  - [Object](#object)
  - [Date](#date)
- [Common Methods](#common-methods)
  - [allow](#allow)
  - [reject](#reject)
  - [append](#append)
  - [custom](#custom)
  - [default](#default)
  - [strip](#strip)
  - [nullable](#nullable)
  - [message](#message)
  - [missing](#missing)
- [Validation Options](#validation-options)
- [Error Messages](#error-messages)
- [Localization](#localization)
- [OpenApi](#openapi)
- [Utils](#utils)
- [Differences with Joi](#differences-with-joi)

## Installation

```shell
yarn install @bedrockio/yada
```

## Getting Started

Validations are created by utility methods that build up a schema:\
(Note that the import `yd` is used here and below for brevity.)

```js
import yd from '@bedrockio/yada';

const schema = yd.object({
  name: yd.string().required(),
  email: yd.string().required(),
  age: yd.number(),
});
```

The schema will now validate input with `validate`:

```js
await schema.validate({
  name: 'Jules',
  email: 'jules@gmail.com',
  age: 25,
});
```

Note that the `validate` method is asynchronous so must be awaited with `await`
or `then/catch`. A schema that fails validation will throw an error:

```js
try {
  await schema.validate({
    name: 'Jules',
  });
} catch (error) {
  // Error is thrown as `email` is required.
  console.info(error.details);
  // [
  //   {
  //     field: 'email',
  //     message: '"email" is required.',
  //   },
  // ],
}
```

The thrown error object exposes a `details` property that describes validation
failures. [Type validations](#types) and `required()` will be run first and halt
execution. All other validations will be run sequentially. This means that all
validation issues will be identified up front:

```js
const schema = yd.object({
  password: yd
    .string()
    .custom((val) => {
      if (val.length < 12) {
        throw new Error('Must be 12 characters or more.');
      }
    })
    .custom((val) => {
      if (!val.match(/[0-9]/)) {
        throw new Error('Must contain at least 1 number.');
      }
    }),
});
try {
  await schema.validate({
    password: 'password',
  });
} catch (error) {
  // error.details: [
  //   {
  //     ...
  //     field: 'password',
  //     details: [
  //       {
  //         type: 'custom',
  //         message: 'Must be 12 characters or more.',
  //       },
  //       {
  //         type: 'custom',
  //         message: 'Must contain at least 1 number.',
  //       }
  //     [
  //   },
  // ],
}
```

A validation that passes will return either the initial input or any
transformations that may apply to the schema:

```js
const schema = yd.date();
const date = await schema.validate('2020-01-01');
console.log(date instanceof Date); // true
```

Custom validations can transform data simply by returning a value that is not
`undefined` in the validation function:

```js
const schema = yd.string().custom((val) => {
  return val.split(',');
});
const arr = await schema.validate('a,b,c');
console.log(arr); // ['a','b','c']
console.log(Array.isArray(arr)); // true
```

## Types

The core validation types are:

- [String](#string)
- [Number](#number)
- [Boolean](#boolean)
- [Array](#array)
- [Object](#object)
- [Date](#date)

These perform an initial type check on validation and will halt execution of any
further validations (except `required` which is run up front). The above types
are all "basic" types as they can be serialized as JSON with the exception of
[dates](#date).

### String

Strings are the most basic validation type. They are simple but come in many
different formats that can be validated against. Most string validations use
[validator](https://www.npmjs.com/package/validator) under the hood. Validations
that allow options will be passed through to that library.

#### Methods:

- `ascii` - Must be ASCII characters.
- `base64` - Must be base64 encoded. Allows options.
- `btc` - Must be a valid BTC address.
- `country` - Must be a valid
  [ISO 3166-1 alpha 2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2) code.
- `creditCard` - Must be a valid credit card number.
- `domain` - Must be a fully qualified domain name. Allows options.
- `email` - Must be a valid email address.
- `eth` - Must be a valid ETH address. Does not validate checksums.
- `hex` - Must be valid hexadecimal input.
- `ip` - Must be a valid IP address. Allows v4 or v6.
- `jwt` - Must be a valid JWT token.
- `latlng` - Must be a valid string representation of a lat/lng coordinate (ie.
  `"35.686648,139.6975552"`).
- `locale` - Must be a valid locale code.
- `match` - Must match the regex pattern passed as an argument.
- `max` - Length must be less than equal to `n` characters, passed as an
  argument.
- `md5` - Must be an MD5 hash.
- `min` - Length must be more than or equal to `n` characters, passed as an
  argument.
- `mongo` - Must be a valid hexadecimal representation of a
  [Mongo ObjectId](https://www.mongodb.com/docs/manual/reference/bson-types/#std-label-objectid).
- `password` - Must be a valid password as defined by the options object passed
  as an argument:
  - `minLength`
  - `minLowercase`
  - `minUppercase`
  - `minNumbers`
  - `minSymbols`
- `postalCode` - Must be a valid postal code. Accepts a `locale`.
- `sha1` - Must be a SHA1 hash.
- `slug` - Must be a URL slug, ie. a-z, numbers, or hyphen.
- `swift` - Must be a valid SWIFT (Bank Identification) code.
- `url` - Must be a valid URL. Allows options.
- `uuid` - Must be a valid UUID. Allows a `version` string.

There are also transform methods that will transform input:

- `trim` - Trims input with `String#trim`.
- `lowercase` - Transforms input into lower case. Passing `true` as the first
  argument will instead error if input is not lower case.
- `uppercase` - Transforms input into upper case. Passing `true` as the first
  argument will instead error if input is not upper case.

Note that empty strings are allowed by default unless `required`. If you need an
optional string field that may not be empty, then use `options`:

```js
const schema = yd.string().options({
  allowEmpty: false,
});
```

### Number

Numbers have a handful of useful valiadtions:

#### Methods:

- `integer` - Must be an integer.
- `max` - Must be less than or equal to `n`, passed as an argument.
- `min` - Must be greater than or equal to `n`, passed as an argument.
- `multiple` - Must be a multiple of `n`, passed as an argument.
- `negative` - Must be a negative number.
- `positive` - Must be a positive number.

### Boolean

`.boolean()` simply validates that input is a boolean value. There are no
further validation methods. Note that when `.required()` is used the input must
be a boolean, either `true` or `false`.

### Array

Array schemas validate that input is an array. By default elements may be of any
type, however however other schemas may be passed in as arguments:

```js
// Allows arrays containing either strings or numbers.
const schema = yd.array(yd.string(), yd.number());
```

A single array may also be passed in place of enumerated arguments:

```js
// Allows arrays containing either strings or numbers.
const schema = yd.array([schemas]);
```

#### Methods:

- `max` - Length must be less than equal to `n` elements.
- `min` - Length must be more than or equal to `n` elements.
- `length` - Length must be exactly `n` elements.
- `latlng` - Must be a 2 element array of numbers that represent latitude (`-90`
  to `90`) and longitude(`-180` to `180`) coordinates.

### Tuple

Tuple schemas are similar to arrays, however they validate the exact length as
well as types for a given position. Compare the following:

```js
// Accepts any length of either strings or numbers.
const schema1 = yd.array(yd.string(), yd.number());
// Accepts exactly 2 elements. The first MUST be a
// string and the second MUST be a number.
const schema2 = yd.tuple(yd.string(), yd.number());
```

Tuples are appropriate for strictly structured arrays, for example an array of
coordinates as latitude and longitude.

## Object

Object schemas validate that input is an object and further validate individual
fields:

```js
const schema = yd.object({
  name: yd.string().required(),
  dob: yd.date(),
});
```

Note that schema fields will only be validated if input exists:

```js
// No object passed so no error thrown.
await schema.validate();

// Object passed but required field did
// not pass validation so error is thrown.
await schema.validate({
  dob: '2020-01-01',
});

// Passes
await schema.validate({
  name: 'Jules',
  dob: '2020-01-01',
});
```

To ensure that the object exists, simply use `.required()`.

```js
const schema = yd
  .object({
    // ...
  })
  .required();
```

### Selecting Fields

Object schemas also have a `pick` and `omit` method that allows custom field
selection. These methods accept an array of field names or enumerated arguments:

```js
const schema = yd.object({
  firstName: yd.string().required(),
  lastName: yd.string().required(),
  dob: yd.date(),
});

// Includes "firstName" and "lastName" but omits "dob".
schema.pick(['firstName', 'lastName']);

// Excludes "firstName" and "lastName" but keeps "dob".
schema.omit('firstName', 'lastName');
```

To get a single field use the `get` method:

```js
const schema = yd.object({
  profile: yd.object({
    firstName: yd.string().required(),
    lastName: yd.string().required(),
  }),
});

// Gets the inner "profile" schema.
schema.get('profile');

// Gets just the "firstName" schema.
schema.get('profile.firstName');

// May also pass an array of path segments.
schema.get(['profile', 'firstName']);
```

To get a nested array field use the `unwind` method:

```js
const schema = yd.object({
  paymentMethods: yd.array(
    yd.object({
      brand: yd.string().allow('visa', 'mastercard'),
      last4: yd.string().length(4),
      expMonth: yd.number(),
      expYear: yd.number(),
    }),
  ),
});

// Gets the inner "paymentMethods" object schema.
// Will accept a single paymentMethod.
schema.unwind('paymentMethods');
```

Compare `unwind` to `get` which would validate against an array instead of an
object. Note that `unwind` only makes sense when there is exactly one inner
schema and will error otherwise.

### Augmenting Fields

The `require` method allows augmentation of the schema to enforce specific
fields:

```js
const schema = yd.object({
  email: yd.string().email().required(),
  phone: yd.string().phone(),
  dob: yd.date(),
});

// For example a schema for a signup flow that
// requires more fields for normal users than admins.
const signupSchema = schema.require('phone', 'dob');

// Also accepts an array.
schema.require(['phone', 'dob']);
```

Note that there is no way to "unrequire" a field. The idea is to start with the
minimal schema as a base and lock down more from there.

### Merging Fields

The [append](#append) method merges object schemas together, however it
preserves custom and required assertions on the object itself which is not
always desired. It also lacks the elegance of the spread operator. For this the
`export` method is provided which will simply export the schema's fields as an
object:

```js
const newSchema = yd.object({
  ...schema1.export(),
  ...schema2.export(),
});
```

## Date

Dates are similar to the basic types with the exception that in addition to date
objects they will also accept input that can resolve into a date. By default
this will include any string input or a number representing a timestamp in
milliseconds.

#### Methods:

- `after` - Input must resolve to a date after the supplied argument. Compare to
  `min` which allows the date to be the same moment.
- `before` - Input must resolve to a date before the supplied argument. Compare
  to `max` which allows the date to be the same moment.
- `future` - Input must resolve to a date in the future.
- `iso` - Input must be a string in
  [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) format which will resolve
  into a date. Note that this format can reprsent both a date (`2020-01-01`) as
  well as a datetime (`2020-01-01T00:00:00.000Z`).
- `max` - Input must resolve to a date before or equal to the supplied argument.
  Compare to `before` which does not allow the input to be the same moment.
- `min` - Input must resolve to a date after or equal to the supplied argument.
  Compare to `after` which does not allow the input to be the same moment.
- `past` - Input must resolve to a date in the past.
- `timestamp` - Input must be a number in milliseconds which will resolve into a
  date.
- `unix - Input must be a number in seconds which will resolve into a date.

## Common Methods

The following methods are common to all schemas.

### Allow

Alternates are validated with the `allow` schema. This may be used to validate
literals as enums:

```js
const schema = yd.string().allow('foo', 'bar');
```

Or to allow alternates matching different schemas:

```js
const schema = yd.allow(yd.string(), yd.number());
```

An array may also be passed here as the first argument:

```js
const schema = yd.object({
  countries: yd.string.allow(countries),
});
```

### Reject

The `reject` schema is simply an inverse of `allow`. Anything that does not
match will be allowed through:

```js
const schema = yd.string().reject('foo', 'bar');
await schema.validate('baz'); // pass
await schema.validate('foo'); // error!
```

```js
const schema = yd.reject(yd.string(), yd.number());
await schema.validate(true); // pass
await schema.validate('true'); // error!
```

### Append

Appends another schema:

```js
const schema1 = yd.string();
const schema2 = yd.custom((str) => {
  if (str === 'foo') {
    throw new Error('Cannot be foo!');
  }
});
const schema = schema1.append(schema2);
```

Note that when applied to an object schema the fields will be merged. In this
case a plain object is also accepted:

```js
const schema1 = yd.object({
  foo: yd.string(),
});
const schema2 = yd.object({
  bar: yd.string(),
});
const schema = schema1.append(schema2);
```

Note however that this preserves custom and required assertions on the object
itself. To simply merge fields as an object use the [export](#merging-fields)
method instead.

### Custom

The `custom` schema allows for custom validations expressed in code. A custom
schema may either throw an error or transform the input by returning a value
that is not `undefined`.

> [!WARNING] Note that `custom` will only be run if a value is passed other than
> `undefined`. To run more complex validations on optional fields, use the
> [`missing`](#missing) method.

```js
const schema = yd.custom((val) => {
  if (val === 'foo') {
    throw new Error('"foo" is not allowed!');
  } else if (val.startsWith('f')) {
    return 'b' + val.slice(1);
  }
});
console.info(await schema.validate('fad')); // "bad"
console.info(await schema.validate('far')); // "bar"
console.info(await schema.validate('foo')); // error thrown: "foo" is not allowed!
```

#### Arguments

Custom validators are passed two arguments: the initial `value` and an `options`
object that contains meta information that can be helpful:

- `root`: The root value passed into the validation. This is helpful to create
  complex validations that depend on other fields, etc.
- `original`: The original input passed in before transformation.
- `...rest`: Other fields specific to the schema as well as any options passed
  into the schema when validating.

#### Examples

Validating input that depends on another field in an object schema:

```js
const schema = yd.object({
  age: yd.number(),
  parentConsent: yd.boolean().custom((val, { root }) => {
    if (!val && root.age < 13) {
      throw new Error('Parent consent must be given if you are under 13.');
    }
  }),
});
```

Validating input that depends on options passed in at runtime:

```js
const schema = yd.custom((val, options) => {
  if (options.foo) {
    // Do something
  } else {
    // Do soemthing else
  }
}));

await schema.validate('test', {
  foo: 'bar'
})
```

Asynchronous validation from an external service:

```js
const schema = yd.object({
  numbers: yd.string().custom(async (val, { root }) => {
    try {
      const info = await validateCreditCard({
        number: val,
        cvc: root.cvc,
      });
      // Return a transformed object that represents the credit card.
      return info;
    } catch (error) {
      throw new Error('Could not validate credit card number');
    }
  }),
  cvc: yd.string().required(),
});
```

### Default

The `default` method will return a default value if one is not passed:

```js
const schema = yd.string().default('hi!');
console.log(await schema.validate()); // "hi!"
console.log(await schema.validate('hello!')); // "hello!"
```

Note that the argument passed to default may also be a function:

```js
const schema = yd.string().default(Date.now);
console.log(await schema.validate()); // Returns current timestamp
```

### Strip

The `strip` method serves as a way to conditionally exclude fields when the
schema is used inside an object schema:

```js
const schema = yd.object({
  name: yd.string(),
  age: yd.number().strip((val, { self }) => {
    // That's private!
    return !self;
  }),
});
```

Arguments are identical to those passed to [custom](#custom). The field will be
stripped out if the function returns a truthy value.

### Nullable

The `nullable` field allows `null` to be passed for any value:

```js
const schema = yd.string().nullable();
await schema.validate(null); // Allowed
```

This is the equivalent of:

```js
schema = yd.allow(schema, null);
```

However it has two advantages. First it will correctly describe its
[OpenApi](#openapi) schema as `nullable`. It will also return the same type
schema, allowing chaining:

```js
const schema = yd.string().nullable().trim();
```

### Message

The `message` method allows adding a custom message to schema or field. Note
that when using with [`getFullMessage`](#error-messages) the custom message will
not include the nested field name by default:

```js
const schema = yd.object({
  name: yd.string().required().message('Please provide your full name.'),
});
try {
  await schema.validate({});
} catch (error) {
  console.log(error.getFullMessage());
  // -> Please provide your full name.
}
```

To include the field name, the `{field}` token may be used in the message:

```js
const schema = yd.object({
  name: yd
    .string()
    .match(/^[A-Z]/)
    .message('{field} must start with an uppercase letter.'),
});
try {
  await schema.validate({
    name: 'frank',
  });
} catch (error) {
  console.log(error.getFullMessage());
  // -> "name" must start with an uppercase letter.
}
```

The `{field}` token may also be used when throwing custom errors:

```js
const schema = yd.object({
  profile: yd.object({
    name: yd.custom((value) => {
      if (value !== 'Frank') {
        throw new Error('{field} must be "Frank".');
      }
    }),
  }),
});
try {
  await schema.validate({
    name: 'Bob',
  });
} catch (error) {
  console.log(error.getFullMessage());
  // -> "name" must be "Frank".
}
```

### Missing

Allows custom validations when no value is passed:

```js
const schema = yd.object({
  type: yd.string().allow('email', 'phone'),
  email: yd.string.email(),
  phone: yd
    .string()
    .phone()
    .missing(({ root }) => {
      // Run this assertion when "phone" is undefined.
      // Contrast this with "custom" which will never be run
      // here as it is part of the valiation chain and bails
      // after the string validation cannot be fulfilled.
      if (root.type === 'phone') {
        throw new Error('"phone" must be passed when "type" is "phone"');
      }
    }),
});
```

## Validation Options

Validation options in Yada can be passed at runtime on validation or baked into
the schema with the `options` method. The following can be considered
equivalent:

```js
await schema.validate(input, {
  stripUnknown: true,
});
await schema
  .options({
    stripUnknown: true,
  })
  .validate(input);
```

#### Options:

- `stripUnknown` - Strips unknown fields on object schemas which otherwise would
  throw an error.
- `cast` - Casts input to its associated type. For strings and numbers this
  performs a simple type coercion. For booleans `"true"` or `"1"` will be
  considered `true` and `"false"` or `"0"` will be considered `false`. This
  option is useful to convert query strings.

## Error Messages

Error objects thrown on validation expose details about the validations and
fields which have errored. The `getFullMessage` method aggregates these as a
single message separated by a space:

```js
const schema = yd.object({
  email: yd.string().required(),
  firstName: yd.string().required(),
  lastName: yd.string().required(),
});
try {
  await schema.validate({
    firstName: 'Jules',
  });
} catch (error) {
  console.info(error.getFullMessage());
  // "email" is required "lastName" is required
}
```

The delimiter can be customized with the `delimiter` option:

```js
console.info(
  error.getFullMessage({
    delimiter: '\n',
  }),
);
// "email" is required
// "lastName" is required
```

Further the `natural` option will capitalize field names to correspond with form
labels:

```js
console.info(
  error.getFullMessage({
    natural: true,
  }),
);
// "Email" is required
// "Last Name" is required
```

## Localization

Any error message can be localized with the `useLocalizer` method. This method
accepts either a map of error messages to their localized strings or a function
which returns that map:

```js
yd.useLocalizer({
  'Must be at least {length} character{s}.': '{length}文字以上入力して下さい。',
});
```

or

```js
yd.useLocalizer((template) => {
  // Where "getMessages" could be a function
  // that returns messages for a specific locale.
  return getMessages()[template];
});
```

Any validation message matching the keys passed to the map will result in the
localized message instead. The curly braces allow for variable substitution.

A special method `getLocalizedMessages` will aggregte used error messages to
allow quick discovery of strings that have not yet been localized:

```js
yd.useLocalizer({
  'Must be at least {length} character{s}.': '{length}文字以上入力して下さい。',
});
// Error validation occuring here
yd.getLocalizedMessages();
// {
//   'Must be at least {length} character{s}.': '{length}文字以上入力して下さい。',
//   'Value must be a string.': 'Value must be a string.',
//   ...etc
// }
```

Finally an exported error object `LocalizedError` allows you to throw custom
localized error messages. Template substitution can be used here as well:

```js
import { default as yd, LocalizedError } from '@bedrockio/yada';

const max = 5;
const schema = yd.custom((val) => {
  if (val > chars) {
    throw new LocalizedError('Cannot be greater than {max}.', {
      max,
    });
  }
});
```

## JSON Schema

One of the benefits of Yada is built-in [JSON Schema](https://json-schema.org/)
integration. Any schema can describe itself in JSON Schema format including
complex nested schemas.

```js
yd.string().allow('foo', 'bar').toJSON();
// {
//   type: 'string',
//   enum: ['foo', 'bar'],
// }
```

This also means schemas work with JSON helpers:

```js
const schema = yd.string().allow('foo', 'bar');
JSON.stringify(schema, null, 2);
// {
//   type: 'string',
//   enum: ['foo', 'bar'],
// }
```

The `tag` method allows tagging custom fields:

```js
yd.string().tag({
  description: 'my description!',
  x-field: 'my custom field!',
}).toJSON();
// {
//   type: 'string',
//   description: 'my description!',
//   x-field: 'my custom field!!',
// }
```

The `description` method is a shortcut:

```js
yd.string().description('my description!').toJSON();
// {
//   type: 'string',
//   description: 'my description!',
// }
```

The method `toOpenApi` is provided as an alias:

```js
yd.string().toOpenApi();
// {
//   type: 'string',
// }
```

## Utils

Basic utility methods:

- `isSchema`: returns `true` if the object passed is a schema.
- `isSchemaError`: returns `true` if the error object is a schema error.
- `useLocalizer`: Allows [localization](#localization) of error messages.
- `getLocalizedMessages`: Allows discovery of messages for
  [localization](#localization).
- `LocalizedError`: An error object that can be thrown in custom validations to
  allow [localization](#localization).

## Differences with Joi

Yada is intentionally kept extremely simple. Complex validations are expressed
in code rather than requiring complex API knowledge. For example (from the Joi
docs):

```js
// Joi schema
const schema = Joi.object({
  a: Joi.any()
    .valid('x')
    .when('b', {
      is: Joi.exist(),
      then: Joi.valid('y'),
      otherwise: Joi.valid('z'),
    })
    .when('c', { is: Joi.number().min(10), then: Joi.forbidden() }),
  b: Joi.any(),
  c: Joi.number(),
});
```

```js
// equivalent yada schema
const schema = yd.object({
  a: yd
    .custom((val, { root }) => {
      if (root.b && val !== 'y') {
        throw new Error('x must be y when b is passed');
      } else if (val !== 'z') {
        throw new Error('x must be z when b is not passed');
      }
    })
    .custom((val, { root }) => {
      if (typeof root.c > 10 && val) {
        throw new Error('x may not be passed when c is more than 10');
      }
    }),
  b: yd.string(),
  c: yd.number(),
});
```

Note: yada has no "any" equivalent. schemas must either define their types or
use "allow" for alternate types.

For a few more lines of code the same schema can be defined simply as readable
Javascript, complete with custom error messages.

Additionally, schemas may be validated inside other custom schemas, as they are
simply functions that throw an error or (optionally) return a transformed value.
This makes even custom schema composition simple:

```js
// Joi schema
const states = Joi.valid(UsStates);
const provinces = Joi.valid(JapanProvinces);
const schema = Joi.object({
  region: Joi.string().when('country', {
    is: 'japan',
    then: provinces,
    otherwise: states,
  }),
});
```

```js
// equivalent yada schema
const states = yd.allow(UsStates);
const provinces = yd.allow(JapanProvinces);
const schema = yd.object({
  region: yd.string().custom(async (val, { root }) => {
    const schema = root.country === 'japan' ? provinces : states;
    await schema.validate(val);
  }),
});
```

Since all custom validators are simply functions that throw errors, the above
can also use a simple `try/catch` to throw custom error messages:

```js
// equivalent yada schema
const states = yd.allow(UsStates);
const provinces = yd.allow(JapanProvinces);
const schema = yd.object({
  region: yd.string().custom(async (val, { root }) => {
    const schema = root.country === 'japan' ? provinces : states;
    try {
      await schema.validate(val);
    } catch {
      throw new Error('"region" is invalid.');
    }
  }),
});
```

This can be useful either to add context or to strip it away, for example to
hide allowed values if they are private.

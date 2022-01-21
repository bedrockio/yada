# Yada

Yada is a validation library inspired by [Joi](https://joi.dev/). The name derives from a [Japanese slang phrase](https://jisho.org/word/%E3%82%84%E3%81%A0) that expresses rejection. Its goal is to provide an API for validation that is simple and composable.

Concepts

- [Installation](#installation)
- [Getting Started](#getting-started)
- [Types](#types)
- [Allow](#allow)
- [Reject](#reject)
- [Custom](#custom)
- [Default](#default)
- [Utils](#utils)

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
  email: 'jules@gmail.com
  age: 25,
})
```

Note that the `validate` method is asynchronous so must be awaited with `await` or `then/catch`. A schema that fails validation will throw an error:

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

The thrown error object exposes a `details` property that describes validation failures. [Type validations](#types) and `required()` will be run first and halt execution. All other validations will be run sequentially. This means that all validation issues will be identified up front:

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

A validation that passes will return either the initial input or any transformations that may apply to the schema:

```js
const schema = yd.date();
const date = await schema.validate('2020-01-01');
console.log(date instanceof Date); // true
```

Custom validations can transform data simply by returning a value that is not `undefined` in the validation function:

```js
const schema = yd.string().custom((val) => {
  return val.split(',');
});
const arr = await schema.validate('a,b,c');
console.log(arr); // ['a','b','c']
console.log(Array.isArray(arr)); // true
```

## Types

Basic validation types are:

- string
- number
- boolean
- object
- array
- date

These perform an initial type check on validation and will halt execution of any further validations (except `required` which is run up front).

## Allow

Alternates are validated with the `allow` schema. This may be used to validate literals as enums:

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

## Reject

The `reject` schema is simply an inverse of `allow`. Anything that does not match will be allowed through:

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

## Custom

The `custom` schema allows for custom validations expressed in code. A custom schema may either throw an error or transform the input by returning a value that is not `undefined`.

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

### Arguments

Custom validators are passed two arguments: the initial `value` and an `options` object that contains meta information that can be helpful:

- `root`: The root value passed into the validation. This is helpful to create complex validations that depend on other fields, etc.
- TODO: more?

### Examples

Validating input that depends on another field in an object schema:

```js
const schema = yd.object({
  age: yd.number(),
  parentConsent: yd.string().custom((val, { root }) => {
    if (!val && root.age < 13) {
      throw new Error('Parent consent must be given if you are under 13.');
    }
  }),
});
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

## Default

The `default` method will return a default value if one is not passed:

```js
const schema = yd.string().default('hi!');
console.log(await schema.validate()); // "hi!"
console.log(await schema.validate('hello!')); // "hello!"
```

## Utils

Basic utility methods:

- `isSchema`: returns `true` if the object passed is a schema.

## Next

- Added `style` option to `toJsonSchema` to control disallowed formats for
  OpenAI.
- Now using `integer` as the type for integers in JSON schema.
- Allow stripping out JSON schema extensions by option.

## 1.9.0

- Added ISO-8601 `time` format on a string.

## 1.8.3

- Fixed issue with incorrect JSON schema when nested.

## 1.8.2

- Fixed array schemas not passing through `requireAllWithin`.

## 1.8.1

- Fixed bug with tagging in `toOpenApi`.

## 1.8.0

- Removed undefined `format` field.
- Changed JSON schema `oneOf` to `anyOf`.
- Added `requireAll` and `requireAllWithin`.

## 1.7.0

- Partial revert of 1.6.0. Dot syntax expanding no longer default but enabled.
- Expanding flat syntax is now `expandFlatKeys`.
- Flat syntax can also now be allowed without being expanded with
  `allowFlatKeys`.
- Checks on flat key syntax (array, object presence, etc).

## 1.6.1

- Fixed empty string not allowed when enum provided.
- Some development version bumps.

## 1.6.0

- Make `expandDotSyntax` option default and rename inverse option to
  `preserveKeys`.

## 1.5.2

- Removed boolean requried fields for further schema adherence.
- Added `toJSON` as main serialization method and moved `toOpenApi` to an alias.

## 1.5.1

- Require more strict adherence to JSON Schema.

## 1.5.0

- Calendar date validator moved to string as it cannot work when coerced to a
  date object.

## 1.4.3

- Fixed date not allowing calendar date format without time.

## 1.4.2

- Improved enum type assertion errors.

## 1.4.1

- Removed lodash-es in favor of lodash.

## 1.4.0

- Added object schema "require".
- Added object schema "unwind" to get an inner array schema.
- Added object schema "export" to allow object spreading.
- "append" now handles handle deep fields.

## 1.3.0

- Added object schema "get".

## 1.2.9

- Fixed field missing on empty strings.

## 1.2.8

- Added "missing" which runs a custom validator on undefined.

## 1.2.7

- Removed private fields due to typescript bug

## 1.2.6

- Changed types config

## 1.2.5 bumped node version

# Differences with Zod

This document compares Yada with [Zod 4](https://zod.dev/api). The two libraries
come from different lineages, which explains most of the differences below. Yada
is **Joi-inspired, JS-first, async-only, and throws**. Zod is
**TypeScript-first, sync-by-default, and inference-driven**.

## Contents

- [Features in Yada that Zod lacks](#features-in-yada-that-zod-lacks)
  - [Built-in string formats](#built-in-string-formats)
  - [Structural operations on object schemas](#structural-operations-on-object-schemas)
  - [Validation-flow features](#validation-flow-features)
  - [Tooling and introspection](#tooling-and-introspection)
  - [Areas where Zod 4 has closed historical gaps](#areas-where-zod-4-has-closed-historical-gaps)
- [Major syntax differences](#major-syntax-differences)

## Features in Yada that Zod lacks

### Built-in string formats

Yada leans on [validator.js](https://www.npmjs.com/package/validator), so it
ships many real-world "business data" formats that Zod has no native equivalent
for. In Zod these would need to be hand-rolled with `.regex()` / `.refine()` or
pulled in from a third-party package.

| Yada                                                                              | Zod 4 equivalent             |
| --------------------------------------------------------------------------------- | ---------------------------- |
| `.mongo()` (ObjectId)                                                             | none                         |
| `.creditCard()`                                                                   | none                         |
| `.phone()` / `.phone('US')` (E.164 **and** NANP)                                  | only `z.e164()` (E.164 only) |
| `.country()` (ISO 3166-1 alpha 2)                                                 | none                         |
| `.locale()`                                                                       | none                         |
| `.postalCode(locale)` / `.zipcode()`                                              | none                         |
| `.slug()`                                                                         | none                         |
| `.password({ minLength, minLowercase, minUppercase, minNumbers, minSymbols })`    | none (compose by hand)       |
| `.btc()` / `.eth()` / `.swift()`                                                  | none                         |
| `.latlng()` (string form)                                                         | none                         |

The gap runs both ways. Zod has formats Yada does not (`nanoid`, `cuid` /
`cuid2`, `ulid`, `emoji`, `mac`, `cidrv4` / `cidrv6`, `base64url`, `hash`). But
Yada's set is clearly tilted toward app/business data, and `.mongo()` in
particular matters for the Bedrock/Mongo stack.

### Structural operations on object schemas

- **`.unwind('paymentMethods')`** — pull the element schema out of an array
  field so you can validate a single item. No Zod equivalent.
- **`.set(path, fn)`** / **`.get(path)`** / **`.require(...)`** with **deep
  dot-paths** (`'profile.firstName'`). Zod's `.shape.x`, `.required({...})` mask,
  etc. only operate one level deep — there's no deep-path transform/get/require.
- **`.export()`** to spread fields into a new object literal — Zod approximates
  this with `...schema.shape` / `.extend()`.
- **Array `.latlng()`** — validates a `[lat, lng]` numeric pair with range
  checks. No Zod equivalent.

### Validation-flow features

- **`.missing(fn)`** — run a validator _only when the value is `undefined`_. This
  is the inverse of how nearly every validator (Zod included) short-circuits on
  absent values, and it's the clean way to express conditional-required
  cross-field logic. Zod can only approximate this with an object-level
  `.refine` / `.superRefine`.
- **Flat / dot-key handling** — `.allowFlatKeys()` / `.expandFlatKeys()` accept
  `{ 'profile.name': 'x' }` and expand to nested objects. Zod has nothing like
  this; it's very handy for form posts / query strings.
- **Runtime `cast` option** — `schema.validate(input, { cast: true })` coerces
  the whole tree at call time (string→number, `"true"`→bool, comma-string→array).
  Zod's coercion is _baked into the schema_ (`z.coerce.number()`), so "same
  schema, coerce only sometimes" is awkward in Zod.
- **`.reject(...)`** — a first-class negative enum ("must NOT be one of"). In Zod
  that's a manual `.refine`.
- **`root` / `original` in _every_ custom validator** — any nested
  `.custom((val, { root, original }))` can reach the top-level input and the
  pre-transform value. In Zod, cross-field access only exists at the level where
  you call `.refine` / `.superRefine`; a deeply nested field can't easily see the
  root.

### Tooling and introspection

- **`.toOpenAi()`** — emits the OpenAI structured-output strict flavor
  (all-required + nullable trick, stripped formats/tags). Zod's
  `z.toJSONSchema({ target: 'openapi-3.0' })` is generic JSON Schema, not the
  OpenAI strict dialect.
- **`getLocalizedMessages()`** — returns every message template actually
  encountered, so you can discover untranslated strings. No Zod equivalent.
- **`getFullMessage({ natural: true })`** — humanizes field labels into
  form-style labels ("Last Name"). Zod's `z.prettifyError` doesn't do label
  humanization.

### Areas where Zod 4 has closed historical gaps

These used to be Yada advantages but are no longer:

- **JSON Schema export** — Zod 4 now ships `z.toJSONSchema()` (with `target` for
  draft-07 / 2020-12 / openapi-3.0, `$ref` / `$defs`, cycle handling). Yada's
  `toJsonSchema` is simpler but no longer unique.
- **Localization** — Yada has a localizer _mechanism_ but ships **zero** locale
  data. Zod 4 ships **54 built-in locales** via `z.config(z.locales.xx())`. So
  for out-of-the-box i18n, Zod is actually ahead; Yada's edge is only the
  `getLocalizedMessages` discovery helper and inline `LocalizedError`.

## Major syntax differences

| Dimension                | Yada                                                                              | Zod 4                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Sync vs async**        | `validate()` is **always async** — must `await` everywhere                        | `.parse()` / `.safeParse()` are **sync**; async only with async refinements (`.parseAsync`) |
| **Failure handling**     | **Throws only**; you `try/catch` and read `error.details`                         | `.parse()` throws, `.safeParse()` returns `{ success, data, error }`                         |
| **Entry method**         | `schema.validate(value, options)` — runtime options as 2nd arg                    | `schema.parse(value)` — options baked into schema                                           |
| **Optional vs required** | Fields **optional by default**; opt in with `.required()`                         | Fields **required by default**; opt out with `.optional()`                                  |
| **Object unknown keys**  | **Rejected by default** (unless `.stripUnknown()`)                                | **Stripped by default** (`z.strictObject` to reject, `z.looseObject` to pass through)       |
| **Validate vs transform**| One mechanism: `.custom(fn)` — `throw` to fail, `return` a value to transform     | Split: `.refine` / `.superRefine` validate; `.transform` transforms; chain with `.pipe`     |
| **Unions/enums/literals**| One method: `.allow('a','b')` (enum), `yd.allow(a, b)` (union), `yd.allow(val)` (literal) | Separate constructors: `z.enum`, `z.literal`, `z.union` / `.or`, `z.discriminatedUnion`     |
| **Coercion**             | Runtime `{ cast: true }` flag                                                     | Per-schema `z.coerce.number()`                                                              |
| **Dates**                | `yd.date()` **coerces** strings/timestamps → `Date` by default                    | `z.date()` requires a real `Date`; use `z.coerce.date()` / `z.iso.datetime()` for strings  |
| **Type inference**       | None — JS-first, JSDoc / `.d.ts` only                                             | Core feature — `z.infer<typeof schema>` derives the static type                            |
| **Error structure**      | `error.details` (nested `FieldError` / `ElementError` / …), `error.getFullMessage()` | `error.issues` (flat, with `path[]`), `z.treeifyError` / `z.prettifyError` / `.flatten()` / `.format()` |
| **Import**               | `import yd from '@bedrockio/yada'` (default object)                               | `import * as z from 'zod'`                                                                  |

### The two that matter most in practice

1. **Type inference.** This is the defining reason people pick Zod — the schema
   _is_ the source of truth for TS types. Yada has no `z.infer` equivalent, so in
   a TS codebase you maintain types separately. Schema→type inference is the
   single highest-leverage thing Yada lacks.
2. **Async-only + throw-only.** Yada makes every validation a `try { await }`.
   Zod's sync `safeParse` returning a discriminated union is a very different
   ergonomic that a lot of code is written around. Neither is "better," but
   porting code in either direction trips on this first.

Two smaller ones worth calling out: Yada's **validate-and-transform-in-one**
`.custom()` (vs Zod's deliberate refine/transform split) and Yada's
**reject-unknown-keys-by-default** objects (vs Zod's strip-by-default) are the
differences most likely to surprise someone moving between the two.

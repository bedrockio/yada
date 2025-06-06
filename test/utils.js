export async function assertPass(schema, obj, expected, options) {
  try {
    const result = await schema.validate(obj, options);
    if (expected) {
      expect(result).toEqual(expected);
    } else {
      expect(true).toBe(true);
    }
  } catch (error) {
    // eslint-disable-next-line
    console.error(JSON.stringify(error, null, 2));
    throw error;
  }
}

export async function assertFail(schema, obj, errors) {
  errors = Array.isArray(errors) ? errors : [errors];
  try {
    await schema.validate(obj);
    throw new Error('Expected failure but passed.');
  } catch (error) {
    if (!error.details) {
      throw error;
    }
    expect(mapErrorMessages(error)).toEqual(errors);
  }
}

function mapErrorMessages(error) {
  if (error.toJSON) {
    error = error.toJSON();
  }
  const { message, details = [] } = error;
  return [message, ...details.flatMap(mapErrorMessages)].filter(Boolean);
}

export async function assertErrorMessage(schema, obj, message) {
  let error;
  try {
    await schema.validate(obj);
  } catch (err) {
    error = err;
  }
  expect(error.message).toEqual(message);
}

export function dump(error) {
  // eslint-disable-next-line
  console.info(JSON.stringify(toObject(error), null, 2));
}

function toObject(error) {
  const { details = [], ...rest } = error;
  return {
    ...rest,
    message: error.message,
    details: details.map((error) => {
      return toObject(error);
    }),
  };
}

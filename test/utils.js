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

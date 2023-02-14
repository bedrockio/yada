const TOKEN_REG = /{(.+?)}/g;

let localizer;

/**
 * @type {{ [key: string]: string }}
 */
let messages = {};

/**
 * @param {{ [key: string]: string } | ((key: string) => string)} arg
 * An object that maps messages to localized strings or a function that
 * accepts a message and returns a localized string. Use "getLocalizedMessages"
 * to see the messages that exist.
 */
export function useLocalizer(arg) {
  const fn = typeof arg === 'function' ? arg : (message) => arg[message];
  localizer = fn;
  messages = {};
}

export function getLocalized(message) {
  if (localizer) {
    return localizer(message);
  }
}

export function localize(message, values = {}) {
  let str = message;
  if (str) {
    let localized = getLocalized(message);
    if (typeof localized === 'function') {
      localized = localized(values);
    }
    if (localized) {
      str = localized;
    }
  }
  messages[message] = str;

  return str.replace(TOKEN_REG, (match, token) => {
    return token in values ? values[token] : match;
  });
}

/**
 * Returns an object containing all encountered messages
 * mapped to their localizations.
 */
export function getLocalizedMessages() {
  return messages;
}

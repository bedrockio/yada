const TOKEN_REG = /{(.+?)}/g;

let localizer;
let templates = {};

export function useLocalizer(arg) {
  const fn = typeof arg === 'function' ? arg : (template) => arg[template];
  localizer = fn;
  templates = {};
}

export function getLocalized(template) {
  if (localizer) {
    return localizer(template);
  }
}

export function localize(template, values = {}) {
  let message = template;
  if (localizer) {
    let localized = getLocalized(template);
    if (typeof localized === 'function') {
      localized = localized(values);
    }
    if (localized) {
      message = localized;
    }
  }
  templates[template] = message;

  return message.replace(TOKEN_REG, (match, token) => {
    return token in values ? values[token] : match;
  });
}

export function getLocalizerTemplates() {
  return templates;
}

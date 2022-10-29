const TOKEN_REG = /{(.+?)}/g;

let localizer;
let templates = {};

export function useLocalizer(arg) {
  const fn = typeof arg === 'function' ? arg : (template) => arg[template];
  localizer = fn;
  templates = {};
}

export function getLocalized(template, values) {
  templates[template] ||= template;

  if (localizer) {
    let localized = localizer(template);
    if (typeof localized === 'function') {
      localized = localized(values);
    }
    if (localized) {
      templates[template] = localized;
      template = localized;
    }
  }

  return template.replace(TOKEN_REG, (match, token) => {
    return values[token];
  });
}

export function getLocalizerTemplates() {
  return templates;
}

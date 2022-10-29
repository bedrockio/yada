let localizer;

let templates = new Set();

export function useLocalizer(fn) {
  localizer = fn;
}

export function getLocalizedTag(strings, ...args) {
  let template = strings
    .map((part, i) => {
      if (i < strings.length - 1) {
        part += `{${i}}`;
      }
      return part;
    })
    .join('');

  templates.add(template);

  if (localizer) {
    let localized = localizer(template);
    if (typeof localized === 'function') {
      localized = localized(...args);
    }
    if (localized) {
      template = localized;
    }
  }
  const str = template.replace(/{(\d+)}/g, (match, index) => {
    return args[index];
  });
  return str;
}

export function getLocalizerTemplates() {
  return Array.from(templates);
}

// For testing
getLocalizerTemplates.clear = () => {
  templates = new Set();
};

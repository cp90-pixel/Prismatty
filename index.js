'use strict';

const ESC = '\u001B[';
const RESET = `${ESC}0m`;
const ANSI_PATTERN = /\u001B\[[0-9;]*m/g;
const IS_NORMALIZED = Symbol.for('prismatty.normalized');

function normalizeKey(name) {
  if (typeof name === 'object' && name && typeof name.name === 'string') {
    name = name.name;
  }

  if (typeof name !== 'string') {
    name = String(name);
  }

  return name.trim().toLowerCase().replace(/[\s_-]+/g, '');
}

function createLookup(canonical, aliases = {}) {
  const entries = [];
  const lookup = new Map();

  for (const [name, code] of Object.entries(canonical)) {
    const entry = Object.freeze({ name, code });
    entries.push(entry);
    lookup.set(normalizeKey(name), entry);
  }

  for (const [alias, target] of Object.entries(aliases)) {
    const key = normalizeKey(alias);
    const targetKey = normalizeKey(target);
    const entry = lookup.get(targetKey);

    if (!entry) {
      throw new Error(`Unknown alias target: ${target}`);
    }

    lookup.set(key, entry);
  }

  return { entries: Object.freeze(entries.slice()), lookup };
}

const FOREGROUND = createLookup(
  {
    black: 30,
    red: 31,
    green: 32,
    yellow: 33,
    blue: 34,
    magenta: 35,
    cyan: 36,
    white: 37,
    gray: 90,
    brightBlack: 90,
    brightRed: 91,
    brightGreen: 92,
    brightYellow: 93,
    brightBlue: 94,
    brightMagenta: 95,
    brightCyan: 96,
    brightWhite: 97
  },
  {
    grey: 'gray'
  }
);

const BACKGROUND = createLookup(
  {
    black: 40,
    red: 41,
    green: 42,
    yellow: 43,
    blue: 44,
    magenta: 45,
    cyan: 46,
    white: 47,
    gray: 100,
    brightBlack: 100,
    brightRed: 101,
    brightGreen: 102,
    brightYellow: 103,
    brightBlue: 104,
    brightMagenta: 105,
    brightCyan: 106,
    brightWhite: 107
  },
  {
    grey: 'gray'
  }
);

const MODIFIER = createLookup(
  {
    reset: 0,
    bold: 1,
    dim: 2,
    italic: 3,
    underline: 4,
    blink: 5,
    inverse: 7,
    hidden: 8,
    strikethrough: 9
  },
  {
    faint: 'dim',
    conceal: 'hidden',
    strike: 'strikethrough',
    strikethru: 'strikethrough'
  }
);

function resolveEntry(value, table, typeName) {
  if (value && typeof value === 'object' && typeof value.name === 'string' && typeof value.code === 'number') {
    const entry = table.get(normalizeKey(value.name));
    if (entry && entry.code === value.code) {
      return entry;
    }
  }

  const key = normalizeKey(value);

  if (!key) {
    throw new Error(`Unknown ${typeName}: ${value}`);
  }

  const entry = table.get(key);

  if (!entry) {
    throw new Error(`Unknown ${typeName}: ${value}`);
  }

  return entry;
}

function resolveForeground(value) {
  return resolveEntry(value, FOREGROUND.lookup, 'color');
}

function resolveBackground(value) {
  return resolveEntry(value, BACKGROUND.lookup, 'background color');
}

function resolveModifier(value) {
  return resolveEntry(value, MODIFIER.lookup, 'modifier');
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value !== 'string' && typeof value[Symbol.iterator] === 'function') {
    return Array.from(value);
  }

  return [value];
}

function flattenStyles(styles) {
  const stack = Array.isArray(styles) ? styles.slice().reverse() : [styles];
  const flattened = [];

  while (stack.length) {
    const item = stack.pop();

    if (item === null || item === undefined || item === false) {
      continue;
    }

    if (Array.isArray(item)) {
      for (let i = item.length - 1; i >= 0; i -= 1) {
        stack.push(item[i]);
      }
      continue;
    }

    flattened.push(item);
  }

  return flattened;
}

function parseStyleEntry(entry) {
  if (entry === null || entry === undefined || entry === false) {
    return null;
  }

  if (entry && entry[IS_NORMALIZED]) {
    return entry;
  }

  if (typeof entry === 'string') {
    if (!entry.trim()) {
      return null;
    }

    const key = normalizeKey(entry);

    const modifier = MODIFIER.lookup.get(key);
    if (modifier) {
      return { color: null, background: null, modifiers: [modifier] };
    }

    const foreground = FOREGROUND.lookup.get(key);
    if (foreground) {
      return { color: foreground, background: null, modifiers: [] };
    }

    const background = BACKGROUND.lookup.get(key);
    if (background) {
      return { color: null, background, modifiers: [] };
    }

    throw new Error(`Unknown style: ${entry}`);
  }

  if (typeof entry === 'object') {
    const result = { color: null, background: null, modifiers: [] };

    const colorValue = entry.color ?? entry.foreground ?? entry.fg;
    if (colorValue !== undefined && colorValue !== null) {
      result.color = resolveForeground(colorValue);
    }

    const backgroundValue = entry.background ?? entry.bg ?? entry.backgroundColor ?? entry.bgColor;
    if (backgroundValue !== undefined && backgroundValue !== null) {
      result.background = resolveBackground(backgroundValue);
    }

    const modifiersValue =
      entry.modifiers ?? entry.modifier ?? entry.effects ?? entry.effect ?? entry.styles ?? entry.style;

    if (modifiersValue !== undefined && modifiersValue !== null) {
      for (const modifierValue of toArray(modifiersValue)) {
        result.modifiers.push(resolveModifier(modifierValue));
      }
    }

    return result;
  }

  throw new Error(`Unsupported style type: ${typeof entry}`);
}

function finalizeNormalized(base) {
  const normalized = {
    color: base.color || null,
    background: base.background || null,
    modifiers: Object.freeze(Array.from(base.modifiers.values()))
  };

  return Object.freeze(
    Object.defineProperty(normalized, IS_NORMALIZED, {
      value: true,
      enumerable: false,
      configurable: false,
      writable: false
    })
  );
}

function normalizeStyles(styles) {
  const flattened = flattenStyles(styles || []);
  const base = {
    color: null,
    background: null,
    modifiers: new Map()
  };

  for (const entry of flattened) {
    const parsed = parseStyleEntry(entry);

    if (!parsed) {
      continue;
    }

    if (parsed.color !== null && parsed.color !== undefined) {
      base.color = parsed.color;
    }

    if (parsed.background !== null && parsed.background !== undefined) {
      base.background = parsed.background;
    }

    if (parsed.modifiers && parsed.modifiers.length) {
      for (const modifier of parsed.modifiers) {
        base.modifiers.set(modifier.name, modifier);
      }
    }
  }

  return finalizeNormalized(base);
}

function formatInput(args) {
  if (args.length === 0) {
    return '';
  }

  const [first, ...rest] = args;

  if (Array.isArray(first) && Object.prototype.hasOwnProperty.call(first, 'raw')) {
    let result = '';

    for (let i = 0; i < first.length; i += 1) {
      result += first[i];
      if (i < rest.length) {
        result += String(rest[i]);
      }
    }

    return result;
  }

  return [first, ...rest].map((value) => String(value)).join(' ');
}

function applyNormalizedStyle(value, normalized) {
  const text = String(value);
  const codes = [];

  if (normalized.modifiers.length) {
    for (const modifier of normalized.modifiers) {
      codes.push(modifier.code);
    }
  }

  if (normalized.color) {
    codes.push(normalized.color.code);
  }

  if (normalized.background) {
    codes.push(normalized.background.code);
  }

  if (!codes.length) {
    return text;
  }

  return `${ESC}${codes.join(';')}m${text}${RESET}`;
}

function colorize(value, ...styles) {
  const normalized = normalizeStyles(styles);
  return applyNormalizedStyle(value, normalized);
}

function createFormatterFromNormalized(normalized) {
  const formatter = (...args) => applyNormalizedStyle(formatInput(args), normalized);

  Object.defineProperty(formatter, 'style', {
    value: normalized,
    enumerable: true,
    configurable: false,
    writable: false
  });

  formatter.compose = (...styles) => createFormatterFromNormalized(normalizeStyles([normalized, ...styles]));
  formatter.with = formatter.compose;

  return formatter;
}

function compose(...styles) {
  const normalized = normalizeStyles(styles);
  return createFormatterFromNormalized(normalized);
}

function normalizedFromEntry(type, entry) {
  const base = {
    color: null,
    background: null,
    modifiers: new Map()
  };

  if (type === 'color') {
    base.color = entry;
  } else if (type === 'background') {
    base.background = entry;
  } else if (type === 'modifier') {
    base.modifiers.set(entry.name, entry);
  }

  return finalizeNormalized(base);
}

function createFormatterMap(entries, type) {
  const map = {};

  for (const entry of entries) {
    map[entry.name] = createFormatterFromNormalized(normalizedFromEntry(type, entry));
  }

  return map;
}

const colors = createFormatterMap(FOREGROUND.entries, 'color');

if (colors.gray && !colors.grey) {
  Object.defineProperty(colors, 'grey', {
    value: colors.gray,
    enumerable: true,
    configurable: false,
    writable: false
  });
}

const backgrounds = createFormatterMap(BACKGROUND.entries, 'background');

if (backgrounds.gray && !backgrounds.grey) {
  Object.defineProperty(backgrounds, 'grey', {
    value: backgrounds.gray,
    enumerable: true,
    configurable: false,
    writable: false
  });
}

const modifiers = createFormatterMap(
  MODIFIER.entries.filter((entry) => entry.name !== 'reset'),
  'modifier'
);

Object.freeze(colors);
Object.freeze(backgrounds);
Object.freeze(modifiers);

const available = Object.freeze({
  colors: Object.freeze(FOREGROUND.entries.map((entry) => entry.name)),
  backgrounds: Object.freeze(BACKGROUND.entries.map((entry) => entry.name)),
  modifiers: Object.freeze(MODIFIER.entries.filter((entry) => entry.name !== 'reset').map((entry) => entry.name))
});

function strip(value) {
  return String(value).replace(ANSI_PATTERN, '');
}

const prism = function prism(value, ...styles) {
  return colorize(value, ...styles);
};

Object.defineProperties(prism, {
  colorize: {
    value: colorize,
    enumerable: true
  },
  compose: {
    value: compose,
    enumerable: true
  },
  with: {
    value: compose,
    enumerable: true
  },
  strip: {
    value: strip,
    enumerable: true
  },
  colors: {
    value: colors,
    enumerable: true
  },
  backgrounds: {
    value: backgrounds,
    enumerable: true
  },
  modifiers: {
    value: modifiers,
    enumerable: true
  },
  available: {
    value: available,
    enumerable: true
  }
});

module.exports = prism;
module.exports.default = prism;

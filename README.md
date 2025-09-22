# Prismatty

Prismatty is a tiny ANSI color helper that makes it easy to add rich styles to Node.js console output without pulling in a large dependency. It provides composable helpers, pre-built palettes for foreground and background colors, and first-class TypeScript definitions.

## Installation

```bash
npm install prismatty
```

## Quick start

```js
const prism = require('prismatty');

console.log(prism('Hello, world!', 'green'));
console.log(prism.colorize('Something went wrong', { color: 'white', background: 'red', modifiers: 'bold' }));

const warn = prism.compose('yellow', 'bold');
console.log(warn('Caution!'));

const highlight = prism.compose('cyan').with('underline');
console.log(highlight`Value: ${42}`);

console.log(prism.strip(prism.colors.magenta('plain text')));
```

## API

### `prism(value, ...styles)` / `prism.colorize(value, ...styles)`

Formats any value by applying one or more styles. Styles can be:

- A color name (foreground or background).
- A modifier name such as `bold` or `underline`.
- An options object: `{ color, background, modifiers }`.
- Nested arrays that combine any of the above.

Later style arguments override earlier ones for foreground/background colors, while modifiers accumulate uniquely.

```js
prism('Server ready', 'green', 'bold');
prism.colorize('Error', { color: 'white', background: 'red', modifiers: ['bold', 'underline'] });
```

### `prism.compose(...styles)` / `prism.with(...styles)`

Returns a reusable formatter function. Formatters can be called like a normal function or used as template literal tags, and support further composition via `.compose()` / `.with()`.

```js
const success = prism.compose('green', 'bold');
console.log(success('OK'));

const loud = success.compose({ modifiers: ['underline'] });
console.log(loud('Look at me!'));
```

### `prism.colors`, `prism.backgrounds`, `prism.modifiers`

Pre-built formatter maps for every supported foreground color, background color, and modifier. Aliases are provided where appropriate (e.g. both `gray` and `grey`).

```js
console.log(prism.colors.brightBlue('Info message'));
console.log(prism.backgrounds.gray('On gray background'));
console.log(prism.modifiers.underline('Important'));  
```

### `prism.strip(value)`

Removes ANSI escape sequences from a string.

```js
const styled = prism.colors.red('alert');
console.log(prism.strip(styled)); // "alert"
```

### `prism.available`

Lists the canonical foreground colors, background colors, and modifiers bundled with Prismatty.

```js
console.log(prism.available.colors);
```

## Supported styles

**Foreground colors**: `black`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white`, `gray`, `brightBlack`, `brightRed`, `brightGreen`, `brightYellow`, `brightBlue`, `brightMagenta`, `brightCyan`, `brightWhite` (alias: `grey`).

**Background colors**: same set as foreground colors (also with `grey` alias).

**Modifiers**: `bold`, `dim`, `italic`, `underline`, `blink`, `inverse`, `hidden`, `strikethrough` (aliases: `faint`, `conceal`, `strike`, `strikethru`).

You can also use the literal style names (including aliases) as plain strings inside `prism()` or `prism.compose()` calls.

## TypeScript support

`index.d.ts` ships with exhaustive type information, including unions for style names, reusable formatter types, and the normalized style descriptor shape. Merge-friendly namespaces mean you can leverage `prism.StyleInput`, `prism.PrismFormatter`, and other helper types in strongly typed codebases.

## Testing

Run the built-in test suite with:

```bash
npm test
```

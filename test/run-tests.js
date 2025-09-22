'use strict';

const assert = require('assert');
const prism = require('..');

const results = [];

function test(name, fn) {
  results.push({ name, fn });
}

test('colorize applies foreground color', () => {
  const actual = prism('hello', 'red');
  assert.strictEqual(actual, '\u001B[31mhello\u001B[0m');
});

test('colorize combines modifiers and colors', () => {
  const actual = prism.colorize('hi', 'bold', 'green');
  assert.strictEqual(actual, '\u001B[1;32mhi\u001B[0m');
});

test('colorize accepts option objects and arrays', () => {
  const actual = prism(
    'alert',
    { color: 'white', background: 'red', modifiers: ['bold', 'underline'] },
    ['blink']
  );
  assert.strictEqual(actual, '\u001B[1;4;5;37;41malert\u001B[0m');
});

test('compose produces reusable formatter', () => {
  const warn = prism.compose('yellow', 'bold');
  assert.strictEqual(warn('Careful!'), '\u001B[1;33mCareful!\u001B[0m');
});

test('compose supports chaining with with()', () => {
  const base = prism.compose('magenta');
  const loud = base.with('bold');
  assert.strictEqual(loud('Notice'), '\u001B[1;35mNotice\u001B[0m');
});

test('compose works with normalized style reuse', () => {
  const base = prism.compose('cyan');
  const extra = base.compose(base.style, 'underline');
  assert.strictEqual(extra('Value'), '\u001B[4;36mValue\u001B[0m');
});

test('formatter joins multiple arguments with spaces', () => {
  const formatted = prism.colors.green('value', 42, true);
  assert.strictEqual(formatted, '\u001B[32mvalue 42 true\u001B[0m');
});

test('template literal usage', () => {
  const highlight = prism.compose('cyan', 'underline');
  assert.strictEqual(highlight`Answer: ${42}`, '\u001B[4;36mAnswer: 42\u001B[0m');
});

test('prebuilt formatters work for colors, backgrounds, and modifiers', () => {
  assert.strictEqual(prism.colors.brightBlue('info'), '\u001B[94minfo\u001B[0m');
  assert.strictEqual(prism.colors.grey('tone'), '\u001B[90mtone\u001B[0m');
  assert.strictEqual(prism.backgrounds.brightYellow('bg'), '\u001B[103mbg\u001B[0m');
  assert.strictEqual(prism.backgrounds.grey('bg'), '\u001B[100mbg\u001B[0m');
  assert.strictEqual(prism.modifiers.underline('text'), '\u001B[4mtext\u001B[0m');
});

test('strip removes ANSI codes', () => {
  const styled = prism.colors.red('danger');
  assert.strictEqual(prism.strip(styled), 'danger');
});

test('available metadata lists canonical styles', () => {
  assert.ok(prism.available.colors.includes('brightBlue'));
  assert.ok(prism.available.backgrounds.includes('brightYellow'));
  assert.ok(prism.available.modifiers.includes('italic'));
});

test('aliases resolve correctly', () => {
  assert.strictEqual(prism('tone', 'grey'), '\u001B[90mtone\u001B[0m');
  assert.strictEqual(prism('whisper', 'faint'), '\u001B[2mwhisper\u001B[0m');
});

test('null and undefined styles are ignored', () => {
  assert.strictEqual(prism('plain', null, undefined), 'plain');
});

test('compose with no styles returns identity formatter', () => {
  const identity = prism.compose();
  assert.strictEqual(identity('value'), 'value');
});

test('invalid style names throw helpful errors', () => {
  assert.throws(() => prism('oops', 'unknown-style'), /Unknown style/);
});

test('background options accept shorthand keys', () => {
  const formatted = prism('note', { bg: 'blue', modifiers: 'italic' });
  assert.strictEqual(formatted, '\u001B[3;44mnote\u001B[0m');
});

test('modifiers accumulate uniquely', () => {
  const formatted = prism('unique', 'bold', ['bold', 'underline']);
  assert.strictEqual(formatted, '\u001B[1;4munique\u001B[0m');
});

(async () => {
  let passed = 0;
  for (const { name, fn } of results) {
    try {
      await fn();
      console.log(`✅ ${name}`);
      passed += 1;
    } catch (error) {
      console.error(`❌ ${name}`);
      console.error(error);
      process.exitCode = 1;
      break;
    }
  }

  if (process.exitCode) {
    console.error(`\n${passed}/${results.length} tests passed`);
  } else {
    console.log(`\n${passed}/${results.length} tests passed`);
  }
})();

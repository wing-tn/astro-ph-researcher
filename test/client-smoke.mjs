// astro-ph-researcher :: client bundle registration smoke test (no DOM render)
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const registrations = [];
let exportsObj = null;

const fakeReact = {
  createElement() {
    return { type: 'node' };
  },
  useState(value) {
    return [value, () => {}];
  },
  useEffect() {},
  useMemo(fn) {
    return fn();
  },
  useRef(value) {
    return { current: value };
  },
  useSyncExternalStore() {
    return {};
  },
};

globalThis.document = {
  _styles: new Map(),
  head: { appendChild() {} },
  getElementById(id) {
    return this._styles.get(id) ?? null;
  },
  createElement() {
    const element = {
      id: '',
      textContent: '',
      remove() {
        globalThis.document._styles.delete(element.id);
      },
    };
    const append = element;
    globalThis.document.head.appendChild = (node) => {
      if (node.id) globalThis.document._styles.set(node.id, node);
    };
    return append;
  },
};

globalThis.window = {
  __ModuleLoader__: {
    load({ id, factory }) {
      assert.equal(id, 'astro-ph-researcher');
      exportsObj = factory((specifier) => {
        assert.equal(specifier, 'react');
        return fakeReact;
      });
    },
  },
};

const code = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8');
// The bundle is a browser script; evaluating it with a fake window + React is
// enough to verify the factory contract and slot registration wiring.
new Function('window', code)(globalThis.window);

assert.ok(exportsObj, 'factory should export module');
assert.deepEqual(exportsObj.inject, ['slots']);
assert.equal(typeof exportsObj.apply, 'function');

const slots = {
  register(definition, component) {
    registrations.push({ slotName: definition.name, definition, component });
    return () => {};
  },
  inject(slotName, callback) {
    callback();
    return () => {};
  },
};

const ctx = {
  effect(fn) {
    fn();
  },
  slots,
};

exportsObj.apply(ctx);
assert.equal(registrations.length, 4);
assert.equal(registrations[0].slotName, 'sidebar.footer.action');
assert.equal(registrations[0].definition.id, 'astro-ph-researcher');
assert.equal(typeof registrations[0].component, 'function');
assert.equal(registrations[1].slotName, 'shell.overlay');
assert.equal(typeof registrations[1].component, 'function');
assert.equal(registrations[2].slotName, 'conversation.input.left');
assert.equal(registrations[3].slotName, 'conversation.composer.dock');

console.log('client registration smoke ok', registrations.map((item) => item.slotName));

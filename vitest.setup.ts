import "@testing-library/jest-dom";
import "fake-indexeddb/auto";

// Node 25 ships a native `localStorage` that has no backing store unless
// --localstorage-file is provided. Zustand's persist middleware captures
// `window.localStorage` at module-load time, so it ends up with this broken
// native object instead of jsdom's working implementation.
// Replace it with a simple in-memory stub so persist-backed stores work in tests.
const _localStorageStore: Record<string, string> = {};
const _localStorageStub: Storage = {
  getItem: (key: string) => _localStorageStore[key] ?? null,
  setItem: (key: string, value: string) => { _localStorageStore[key] = value; },
  removeItem: (key: string) => { delete _localStorageStore[key]; },
  clear: () => { Object.keys(_localStorageStore).forEach((k) => delete _localStorageStore[k]); },
  get length() { return Object.keys(_localStorageStore).length; },
  key: (i: number) => Object.keys(_localStorageStore)[i] ?? null,
};
Object.defineProperty(globalThis, "localStorage", {
  value: _localStorageStub,
  writable: true,
  configurable: true,
});

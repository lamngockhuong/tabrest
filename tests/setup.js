import { beforeEach, vi } from "vitest";

const createStorageMock = () => ({
  get: vi.fn((_keys, cb) => {
    if (cb) cb({});
    return Promise.resolve({});
  }),
  set: vi.fn((_items, cb) => {
    if (cb) cb();
    return Promise.resolve();
  }),
  remove: vi.fn((_keys, cb) => {
    if (cb) cb();
    return Promise.resolve();
  }),
});

// Mock chrome APIs
global.chrome = {
  storage: {
    sync: createStorageMock(),
    local: createStorageMock(),
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  runtime: {
    lastError: null,
    sendMessage: vi.fn(),
    getURL: vi.fn((path) => `chrome-extension://test/${path}`),
    getManifest: vi.fn(() => ({ version: "0.0.4" })),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  tabs: {
    query: vi.fn(() => Promise.resolve([])),
    get: vi.fn(),
    create: vi.fn(() => Promise.resolve({ id: 999 })),
    remove: vi.fn(() => Promise.resolve()),
    discard: vi.fn(),
    update: vi.fn(),
    sendMessage: vi.fn(() => Promise.resolve({})),
    onActivated: { addListener: vi.fn() },
    onUpdated: { addListener: vi.fn() },
    onRemoved: { addListener: vi.fn() },
  },
  alarms: {
    create: vi.fn(),
    clear: vi.fn(() => Promise.resolve(true)),
    get: vi.fn(),
    onAlarm: { addListener: vi.fn() },
  },
  system: {
    memory: {
      getInfo: vi.fn(() => Promise.resolve({ capacity: 8589934592 })),
    },
  },
  permissions: {
    contains: vi.fn(() => Promise.resolve(true)),
    request: vi.fn(() => Promise.resolve(true)),
    remove: vi.fn(() => Promise.resolve(true)),
    onAdded: { addListener: vi.fn(), removeListener: vi.fn() },
    onRemoved: { addListener: vi.fn(), removeListener: vi.fn() },
  },
  scripting: {
    executeScript: vi.fn(() => Promise.resolve([])),
  },
  action: {
    getUserSettings: vi.fn(() => Promise.resolve({ isOnToolbar: false })),
  },
  notifications: {
    create: vi.fn((id, _opts, cb) => {
      if (cb) cb(id);
    }),
  },
  i18n: {
    getMessage: vi.fn((_key, _subs) => ""),
    getUILanguage: vi.fn(() => "en"),
  },
  idle: {
    queryState: vi.fn(() => Promise.resolve("active")),
  },
};

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

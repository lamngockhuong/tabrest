import { vi, beforeEach } from "vitest";

const createStorageMock = () => ({
  get: vi.fn((keys, cb) => {
    if (cb) cb({});
    return Promise.resolve({});
  }),
  set: vi.fn((items, cb) => {
    if (cb) cb();
    return Promise.resolve();
  }),
  remove: vi.fn((keys, cb) => {
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
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  tabs: {
    query: vi.fn(() => Promise.resolve([])),
    get: vi.fn(),
    discard: vi.fn(),
    update: vi.fn(),
    onActivated: { addListener: vi.fn() },
    onUpdated: { addListener: vi.fn() },
    onRemoved: { addListener: vi.fn() },
  },
  alarms: {
    create: vi.fn(),
    clear: vi.fn(),
    get: vi.fn(),
    onAlarm: { addListener: vi.fn() },
  },
  system: {
    memory: {
      getInfo: vi.fn(() => Promise.resolve({ capacity: 8589934592 })),
    },
  },
};

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

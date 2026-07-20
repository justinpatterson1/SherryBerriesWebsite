// Stub used by vitest to satisfy `import "server-only"` / `import "client-only"`
// when server modules are imported into the Node test environment. These guard
// packages throw outside their intended runtime; unit tests don't need them.
export {};

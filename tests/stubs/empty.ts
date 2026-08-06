// Stands in for `server-only` / `client-only` under Vitest.
// Those packages throw on import outside their intended environment, which
// would make any module in src/server untestable.
export {}

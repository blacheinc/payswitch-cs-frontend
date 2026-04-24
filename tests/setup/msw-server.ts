import { setupServer } from "msw/node";
import { defaultHandlers } from "./msw-handlers";

/**
 * Shared MSW server for all unit tests. Default handlers cover the happy path
 * for each backend domain; individual tests can override with `server.use(...)`.
 */
export const server = setupServer(...defaultHandlers);

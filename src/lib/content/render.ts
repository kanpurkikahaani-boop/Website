import "server-only";

/** Server-only entry point; the logic lives in render-core.ts so scripts and tests can use it. */
export { renderPostContent } from "./render-core";

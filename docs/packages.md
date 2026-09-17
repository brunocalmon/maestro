[← Back to Root Homepage](../README.md) | [Portal Index](README.md)

---

# Packages and Libraries of Maestro (`@brunocalmon/maestro`)

## Architectural Summary of Production Dependencies

The `@brunocalmon/maestro` package minimizes third-party dependencies to maintain a lightweight, fast, and predictable runtime. Production dependencies strictly support core system pillars:

1. **`@modelcontextprotocol/sdk` (v1.30.0)**:
   - **Role**: Native implementation of the Model Context Protocol (MCP).
   - **Usage**: Powers the `maestro-mcp` binary via STDIO JSON-RPC 2.0 communication.
2. **`@promovaweb/specsfy` (v0.22.2)**:
   - **Role**: CLI and TUI for the Specsfy specification engineering framework.
   - **Usage**: Installation and synchronization of project specifications, rules, and stack metadata.
3. **`context-mode` (v1.0.169)**:
   - **Role**: MCP plugin for context window optimization and token savings.
   - **Usage**: Injected as a guardian hook into `.claude/settings.json`.
4. **`skills` (v1.5.23)**:
   - **Role**: Official agent skills ecosystem management library from Vercel Labs.
   - **Usage**: Enables idempotent delivery of skill sets to `.claude/skills/` and `.agents/skills/`.
5. **`yaml` (v2.9.0)**:
   - **Role**: High-performance JavaScript/TypeScript YAML parser and stringifier.
   - **Usage**: Reading, resilient manipulation, and backfilling of `.maestro/config.yaml`.
6. **`zod` (v3.25.76)**:
   - **Role**: TypeScript-first schema declaration and runtime validation library with static type inference.
   - **Usage**: Strict validation of subagent profile configurations, projects, systems, and approval schemas.

---

<!-- specsfy:documentator:start -->
## Inventário

| Categoria | Escopo | Pacote | Versão | Finalidade | Fonte | GitHub |
| --- | --- | --- | --- | --- | --- | --- |
| Terceiro | produção | @modelcontextprotocol/sdk | 1.30.0 | Model Context Protocol implementation for TypeScript | https://github.com/modelcontextprotocol/typescript-sdk | https://github.com/modelcontextprotocol/typescript-sdk |
| Terceiro | produção | @promovaweb/specsfy | 0.23.0 | CLI e TUI do Specsfy para instalar skills e acompanhar especificações. | https://github.com/promovaweb/specsfy | https://github.com/promovaweb/specsfy |
| Terceiro | produção | context-mode | 1.0.169 | MCP plugin that saves 98% of your context window. Works with Claude Code, Gemini CLI, VS Code Copilot, OpenCode, and Codex CLI. Sandboxed code execution, FTS5 knowledge base, and intent-driven search. | https://github.com/mksglu/context-mode | https://github.com/mksglu/context-mode |
| Terceiro | produção | skills | 1.5.26 | The open agent skills ecosystem | https://github.com/vercel-labs/skills | https://github.com/vercel-labs/skills |
| Terceiro | produção | yaml | 2.9.1 | JavaScript parser and stringifier for YAML | github:eemeli/yaml | — |
| Terceiro | produção | zod | 4.6.5 | TypeScript-first schema declaration and validation library with static type inference | https://github.com/colinhacks/zod | https://github.com/colinhacks/zod |
| Terceiro | desenvolvimento | @types/node | 26.3.0 | TypeScript definitions for node | https://github.com/DefinitelyTyped/DefinitelyTyped | https://github.com/DefinitelyTyped/DefinitelyTyped |
| Terceiro | desenvolvimento | @vitest/coverage-v8 | 5.0.1 | V8 coverage provider for Vitest | https://github.com/vitest-dev/vitest | https://github.com/vitest-dev/vitest |
| Terceiro | desenvolvimento | typescript | 7.0.2 | TypeScript is a language for application scale JavaScript development | https://github.com/microsoft/TypeScript | https://github.com/microsoft/TypeScript |
| Terceiro | desenvolvimento | vitest | 5.0.1 | Next generation testing framework powered by Vite | https://github.com/vitest-dev/vitest | https://github.com/vitest-dev/vitest |
| Terceiro | transitiva | @babel/helper-string-parser | 7.29.7 | A utility package to parse strings | https://github.com/babel/babel | https://github.com/babel/babel |
| Terceiro | transitiva | @babel/helper-validator-identifier | 7.29.7 | Validate identifier/keywords name | https://github.com/babel/babel | https://github.com/babel/babel |
| Terceiro | transitiva | @babel/parser | 7.29.8 | A JavaScript parser | https://github.com/babel/babel | https://github.com/babel/babel |
| Terceiro | transitiva | @babel/types | 7.29.8 | Babel Types is a Lodash-esque utility library for AST nodes | https://github.com/babel/babel | https://github.com/babel/babel |
| Terceiro | transitiva | @bcoe/v8-coverage | 1.0.2 | Helper functions for V8 coverage files. | git://github.com/bcoe/v8-coverage | git://github.com/bcoe/v8-coverage |
| Terceiro | transitiva | @clack/core | 1.4.3 | Finalidade não descrita nos metadados locais. | https://github.com/bombshell-dev/clack | https://github.com/bombshell-dev/clack |
| Terceiro | transitiva | @clack/prompts | 1.7.0 | Finalidade não descrita nos metadados locais. | https://github.com/bombshell-dev/clack | https://github.com/bombshell-dev/clack |
| Terceiro | transitiva | @colors/colors | 1.5.0 | get colors in your node.js console | http://github.com/DABH/colors.js | http://github.com/DABH/colors.js |
| Terceiro | transitiva | @hono/node-server | 2.1.1 | Node.js Adapter for Hono | https://github.com/honojs/node-server | https://github.com/honojs/node-server |
| Terceiro | transitiva | @isaacs/fs-minipass | 4.0.1 | fs read and write streams based on minipass | https://github.com/npm/fs-minipass | https://github.com/npm/fs-minipass |
| Terceiro | transitiva | @jridgewell/resolve-uri | 3.1.2 | Resolve a URI relative to an optional base URI | https://github.com/jridgewell/resolve-uri | https://github.com/jridgewell/resolve-uri |
| Terceiro | transitiva | @jridgewell/sourcemap-codec | 1.6.0 | Encode/decode sourcemap mappings | https://github.com/jridgewell/sourcemaps | https://github.com/jridgewell/sourcemaps |
| Terceiro | transitiva | @jridgewell/trace-mapping | 0.3.31 | Trace the original position through a source map | https://github.com/jridgewell/sourcemaps | https://github.com/jridgewell/sourcemaps |
| Terceiro | transitiva | @mixmark-io/domino | 2.2.0 | Server-side DOM implementation based on Mozilla's dom.js | https://github.com/mixmark-io/domino | https://github.com/mixmark-io/domino |
| Terceiro | transitiva | @modelcontextprotocol/sdk | 1.30.0 | Model Context Protocol implementation for TypeScript | https://github.com/modelcontextprotocol/typescript-sdk | https://github.com/modelcontextprotocol/typescript-sdk |
| Terceiro | transitiva | @oxc-project/types | 0.149.0 | Types for Oxc AST nodes | https://github.com/oxc-project/oxc | https://github.com/oxc-project/oxc |
| Terceiro | transitiva | @promovaweb/specsfy | 0.23.0 | CLI e TUI do Specsfy para instalar skills e acompanhar especificações. | https://github.com/promovaweb/specsfy | https://github.com/promovaweb/specsfy |
| Terceiro | transitiva | @rolldown/binding-android-arm-eabi | 1.2.8 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | @rolldown/binding-android-arm64 | 1.2.8 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | @rolldown/binding-darwin-arm64 | 1.2.8 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | @rolldown/binding-darwin-x64 | 1.2.8 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | @rolldown/binding-freebsd-x64 | 1.2.8 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | @rolldown/binding-linux-arm-gnueabihf | 1.2.8 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | @rolldown/binding-linux-arm64-gnu | 1.2.8 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | @rolldown/binding-linux-arm64-musl | 1.2.8 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | @rolldown/binding-linux-ppc64-gnu | 1.2.8 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | @rolldown/binding-linux-s390x-gnu | 1.2.8 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | @rolldown/binding-linux-x64-gnu | 1.2.8 | Fast JavaScript/TypeScript bundler in Rust with Rollup-compatible API. | https://github.com/rolldown/rolldown | https://github.com/rolldown/rolldown |
| Terceiro | transitiva | @rolldown/binding-linux-x64-musl | 1.2.8 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | @rolldown/binding-openharmony-arm64 | 1.2.8 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | @rolldown/binding-win32-arm64-msvc | 1.2.8 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | @rolldown/binding-win32-x64-msvc | 1.2.8 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | @rolldown/pluginutils | 1.0.1 | Plugin utilities for Rolldown | https://github.com/rolldown/plugins | https://github.com/rolldown/plugins |
| Terceiro | transitiva | @sindresorhus/is | 4.6.0 | Type check values | sindresorhus/is | — |
| Terceiro | transitiva | @types/chai | 5.2.3 | TypeScript definitions for chai | https://github.com/DefinitelyTyped/DefinitelyTyped | https://github.com/DefinitelyTyped/DefinitelyTyped |
| Terceiro | transitiva | @types/deep-eql | 4.0.2 | TypeScript definitions for deep-eql | https://github.com/DefinitelyTyped/DefinitelyTyped | https://github.com/DefinitelyTyped/DefinitelyTyped |
| Terceiro | transitiva | @types/estree | 1.0.9 | TypeScript definitions for estree | https://github.com/DefinitelyTyped/DefinitelyTyped | https://github.com/DefinitelyTyped/DefinitelyTyped |
| Terceiro | transitiva | @types/node | 26.3.0 | TypeScript definitions for node | https://github.com/DefinitelyTyped/DefinitelyTyped | https://github.com/DefinitelyTyped/DefinitelyTyped |
| Terceiro | transitiva | @typescript/typescript-aix-ppc64 | 7.0.2 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | @typescript/typescript-darwin-arm64 | 7.0.2 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | @typescript/typescript-darwin-x64 | 7.0.2 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | @typescript/typescript-freebsd-arm64 | 7.0.2 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | @typescript/typescript-freebsd-x64 | 7.0.2 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | @typescript/typescript-linux-arm | 7.0.2 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | @typescript/typescript-linux-arm64 | 7.0.2 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | @typescript/typescript-linux-loong64 | 7.0.2 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | @typescript/typescript-linux-mips64el | 7.0.2 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | @typescript/typescript-linux-ppc64 | 7.0.2 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | @typescript/typescript-linux-riscv64 | 7.0.2 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | @typescript/typescript-linux-s390x | 7.0.2 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | @typescript/typescript-linux-x64 | 7.0.2 | TypeScript is a language for application scale JavaScript development | https://github.com/microsoft/TypeScript | https://github.com/microsoft/TypeScript |
| Terceiro | transitiva | @typescript/typescript-netbsd-arm64 | 7.0.2 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | @typescript/typescript-netbsd-x64 | 7.0.2 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | @typescript/typescript-openbsd-arm64 | 7.0.2 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | @typescript/typescript-openbsd-x64 | 7.0.2 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | @typescript/typescript-sunos-x64 | 7.0.2 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | @typescript/typescript-win32-arm64 | 7.0.2 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | @typescript/typescript-win32-x64 | 7.0.2 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | @vitest/coverage-v8 | 5.0.1 | V8 coverage provider for Vitest | https://github.com/vitest-dev/vitest | https://github.com/vitest-dev/vitest |
| Terceiro | transitiva | @vitest/istanbul-lib-coverage | 1.0.1 | Data library for istanbul coverage objects | https://github.com/vitest-dev/istanbuljs | https://github.com/vitest-dev/istanbuljs |
| Terceiro | transitiva | @vitest/istanbul-lib-report | 1.0.1 | Base reporting library and report generators for istanbul | https://github.com/vitest-dev/istanbuljs | https://github.com/vitest-dev/istanbuljs |
| Terceiro | transitiva | @vitest/mocker | 5.0.1 | Vitest module mocker implementation | https://github.com/vitest-dev/vitest | https://github.com/vitest-dev/vitest |
| Terceiro | transitiva | @vitest/spy | 5.0.1 | Lightweight Jest compatible spy implementation | https://github.com/vitest-dev/vitest | https://github.com/vitest-dev/vitest |
| Terceiro | transitiva | accepts | 2.0.0 | Higher-level content negotiation | jshttp/accepts | — |
| Terceiro | transitiva | ajv | 8.20.0 | Another JSON Schema Validator | ajv-validator/ajv | — |
| Terceiro | transitiva | ajv-formats | 3.0.1 | Format validation for Ajv v7+ | https://github.com/ajv-validator/ajv-formats | https://github.com/ajv-validator/ajv-formats |
| Terceiro | transitiva | ansi-escapes | 7.3.0 | ANSI escape codes for manipulating the terminal | sindresorhus/ansi-escapes | — |
| Terceiro | transitiva | ansi-regex | 6.3.0 | Regular expression for matching ANSI escape codes | chalk/ansi-regex | — |
| Terceiro | transitiva | ansi-styles | 4.3.0 | ANSI escape codes for styling strings in the terminal | chalk/ansi-styles | — |
| Terceiro | transitiva | any-promise | 1.3.0 | Resolve any installed ES6 compatible promise | https://github.com/kevinbeaty/any-promise | https://github.com/kevinbeaty/any-promise |
| Terceiro | transitiva | assertion-error | 2.0.1 | Error constructor for test and validation frameworks that implements standardized AssertionError specification. | git@github.com:chaijs/assertion-error | git@github.com:chaijs/assertion-error |
| Terceiro | transitiva | ast-v8-to-istanbul | 1.0.5 | AST-aware v8-to-istanbul | https://github.com/AriPerkkio/ast-v8-to-istanbul | https://github.com/AriPerkkio/ast-v8-to-istanbul |
| Terceiro | transitiva | base64-js | 1.5.1 | Base64 encoding/decoding in pure JS | git://github.com/beatgammit/base64-js | git://github.com/beatgammit/base64-js |
| Terceiro | transitiva | better-sqlite3 | 12.11.1 | The fastest and simplest library for SQLite in Node.js. | git://github.com/WiseLibs/better-sqlite3 | git://github.com/WiseLibs/better-sqlite3 |
| Terceiro | transitiva | bindings | 1.5.0 | Helper module for loading your native module's .node file | git://github.com/TooTallNate/node-bindings | git://github.com/TooTallNate/node-bindings |
| Terceiro | transitiva | bl | 4.1.0 | Buffer List: collect buffers and access with a standard readable Buffer interface, streamable too! | https://github.com/rvagg/bl | https://github.com/rvagg/bl |
| Terceiro | transitiva | body-parser | 2.3.0 | Node.js body parsing middleware | expressjs/body-parser | — |
| Terceiro | transitiva | content-type | 2.1.0 | Create and parse HTTP Content-Type header | jshttp/content-type | — |
| Terceiro | transitiva | buffer | 5.7.1 | Node.js Buffer API, for the browser | git://github.com/feross/buffer | git://github.com/feross/buffer |
| Terceiro | transitiva | bytes | 3.1.2 | Utility to parse a string bytes to bytes and vice-versa | visionmedia/bytes.js | — |
| Terceiro | transitiva | call-bind-apply-helpers | 1.0.2 | Helper functions around Function call/apply/bind, for use in `call-bind` | https://github.com/ljharb/call-bind-apply-helpers | https://github.com/ljharb/call-bind-apply-helpers |
| Terceiro | transitiva | call-bound | 1.0.4 | Robust call-bound JavaScript intrinsics, using `call-bind` and `get-intrinsic`. | https://github.com/ljharb/call-bound | https://github.com/ljharb/call-bound |
| Terceiro | transitiva | chai | 6.2.2 | BDD/TDD assertion library for node.js and the browser. Test framework agnostic. | https://github.com/chaijs/chai | https://github.com/chaijs/chai |
| Terceiro | transitiva | chalk | 5.6.2 | Terminal string styling done right | chalk/chalk | — |
| Terceiro | transitiva | char-regex | 1.0.2 | A regex to match any full character, considering weird character ranges. | https://github.com/Richienb/char-regex | https://github.com/Richienb/char-regex |
| Terceiro | transitiva | chownr | 3.0.0 | like `chown -R` | git://github.com/isaacs/chownr | git://github.com/isaacs/chownr |
| Terceiro | transitiva | cli-highlight | 2.1.11 | Syntax highlighting in your terminal | https://github.com/felixfbecker/cli-highlight | https://github.com/felixfbecker/cli-highlight |
| Terceiro | transitiva | chalk | 4.1.2 | Terminal string styling done right | chalk/chalk | — |
| Terceiro | transitiva | cli-table3 | 0.6.5 | Pretty unicode tables for the command line. Based on the original cli-table. | https://github.com/cli-table/cli-table3 | https://github.com/cli-table/cli-table3 |
| Terceiro | transitiva | cliui | 7.0.4 | easily create complex multi-column command-line-interfaces | yargs/cliui | — |
| Terceiro | transitiva | color-convert | 2.0.1 | Plain color conversion functions | Qix-/color-convert | — |
| Terceiro | transitiva | color-name | 1.1.4 | A list of color names and its values | git@github.com:colorjs/color-name | git@github.com:colorjs/color-name |
| Terceiro | transitiva | commander | 15.0.0 | the complete solution for node.js command-line programs | https://github.com/tj/commander.js | https://github.com/tj/commander.js |
| Terceiro | transitiva | content-disposition | 1.1.0 | Create and parse Content-Disposition header | jshttp/content-disposition | — |
| Terceiro | transitiva | content-type | 1.0.5 | Create and parse HTTP Content-Type header | jshttp/content-type | — |
| Terceiro | transitiva | context-mode | 1.0.169 | MCP plugin that saves 98% of your context window. Works with Claude Code, Gemini CLI, VS Code Copilot, OpenCode, and Codex CLI. Sandboxed code execution, FTS5 knowledge base, and intent-driven search. | https://github.com/mksglu/context-mode | https://github.com/mksglu/context-mode |
| Terceiro | transitiva | zod | 3.25.76 | TypeScript-first schema declaration and validation library with static type inference | https://github.com/colinhacks/zod | https://github.com/colinhacks/zod |
| Terceiro | transitiva | cookie | 0.7.2 | HTTP server cookie parsing and serialization | jshttp/cookie | — |
| Terceiro | transitiva | cookie-signature | 1.2.2 | Sign and unsign cookies | https://github.com/visionmedia/node-cookie-signature | https://github.com/visionmedia/node-cookie-signature |
| Terceiro | transitiva | cors | 2.8.6 | Node.js CORS middleware | expressjs/cors | — |
| Terceiro | transitiva | cross-spawn | 7.0.6 | Cross platform child_process#spawn and child_process#spawnSync | git@github.com:moxystudio/node-cross-spawn | git@github.com:moxystudio/node-cross-spawn |
| Terceiro | transitiva | debug | 4.4.3 | Lightweight debugging utility for Node.js and the browser | git://github.com/debug-js/debug | git://github.com/debug-js/debug |
| Terceiro | transitiva | decompress-response | 6.0.0 | Decompress a HTTP response if needed | sindresorhus/decompress-response | — |
| Terceiro | transitiva | deep-extend | 0.6.0 | Recursive object extending | git://github.com/unclechu/node-deep-extend | git://github.com/unclechu/node-deep-extend |
| Terceiro | transitiva | depd | 2.0.0 | Deprecate all the things | dougwilson/nodejs-depd | — |
| Terceiro | transitiva | detect-libc | 2.1.2 | Node.js module to detect the C standard library (libc) implementation family and version | git://github.com/lovell/detect-libc | git://github.com/lovell/detect-libc |
| Terceiro | transitiva | dunder-proto | 1.0.1 | If available, the `Object.prototype.__proto__` accessor and mutator, call-bound | https://github.com/es-shims/dunder-proto | https://github.com/es-shims/dunder-proto |
| Terceiro | transitiva | ee-first | 1.1.1 | return the first event in a set of ee/event pairs | jonathanong/ee-first | — |
| Terceiro | transitiva | emoji-regex | 8.0.0 | A regular expression to match all Emoji-only symbols as per the Unicode Standard. | https://github.com/mathiasbynens/emoji-regex | https://github.com/mathiasbynens/emoji-regex |
| Terceiro | transitiva | emojilib | 2.4.0 | Emoji keyword library. | https://github.com/muan/emojilib | https://github.com/muan/emojilib |
| Terceiro | transitiva | encodeurl | 2.0.0 | Encode a URL to a percent-encoded form, excluding already-encoded sequences | pillarjs/encodeurl | — |
| Terceiro | transitiva | end-of-stream | 1.4.5 | Call a callback when a readable/writable/duplex stream has completed or failed. | git://github.com/mafintosh/end-of-stream | git://github.com/mafintosh/end-of-stream |
| Terceiro | transitiva | environment | 1.1.0 | Check which JavaScript environment your code is running in at runtime: browser, Node.js, Bun, etc | sindresorhus/environment | — |
| Terceiro | transitiva | es-define-property | 1.0.1 | `Object.defineProperty`, but not IE 8's broken one. | https://github.com/ljharb/es-define-property | https://github.com/ljharb/es-define-property |
| Terceiro | transitiva | es-errors | 1.3.0 | A simple cache for a few of the JS Error constructors. | https://github.com/ljharb/es-errors | https://github.com/ljharb/es-errors |
| Terceiro | transitiva | es-module-lexer | 2.3.2 | Lexes ES modules returning their import/export metadata | https://github.com/guybedford/es-module-lexer | https://github.com/guybedford/es-module-lexer |
| Terceiro | transitiva | es-object-atoms | 1.1.2 | ES Object-related atoms: Object, ToObject, RequireObjectCoercible | https://github.com/ljharb/es-object-atoms | https://github.com/ljharb/es-object-atoms |
| Terceiro | transitiva | escalade | 3.2.0 | A tiny (183B to 210B) and fast utility to ascend parent directories | lukeed/escalade | — |
| Terceiro | transitiva | escape-html | 1.0.3 | Escape string for use in HTML | component/escape-html | — |
| Terceiro | transitiva | estree-walker | 3.0.3 | Traverse an ESTree-compliant AST | https://github.com/Rich-Harris/estree-walker | https://github.com/Rich-Harris/estree-walker |
| Terceiro | transitiva | etag | 1.8.1 | Create simple HTTP ETags | jshttp/etag | — |
| Terceiro | transitiva | eventsource | 3.0.7 | WhatWG/W3C compliant EventSource client for Node.js and browsers | git://git@github.com/EventSource/eventsource | git://git@github.com/EventSource/eventsource |
| Terceiro | transitiva | eventsource-parser | 3.1.1 | Streaming, source-agnostic EventSource/Server-Sent Events parser | ssh://git@github.com/rexxars/eventsource-parser | ssh://git@github.com/rexxars/eventsource-parser |
| Terceiro | transitiva | expand-template | 2.0.3 | Expand placeholders in a template string | https://github.com/ralphtheninja/expand-template | https://github.com/ralphtheninja/expand-template |
| Terceiro | transitiva | expect-type | 1.4.0 | Finalidade não descrita nos metadados locais. | https://github.com/mmkal/expect-type | https://github.com/mmkal/expect-type |
| Terceiro | transitiva | express | 5.2.1 | Fast, unopinionated, minimalist web framework | expressjs/express | — |
| Terceiro | transitiva | express-rate-limit | 8.6.2 | Basic IP rate-limiting middleware for Express. Use to limit repeated requests to public APIs and/or endpoints such as password reset. | https://github.com/express-rate-limit/express-rate-limit | https://github.com/express-rate-limit/express-rate-limit |
| Terceiro | transitiva | fast-deep-equal | 3.1.3 | Fast deep equal | https://github.com/epoberezkin/fast-deep-equal | https://github.com/epoberezkin/fast-deep-equal |
| Terceiro | transitiva | fast-string-truncated-width | 3.0.3 | A fast function for calculating where a string should be truncated, given an optional width limit and an ellipsis string. | github:fabiospampinato/fast-string-truncated-width | — |
| Terceiro | transitiva | fast-string-width | 3.0.2 | A fast function for calculating the visual width of a string once printed to the terminal. | github:fabiospampinato/fast-string-width | — |
| Terceiro | transitiva | fast-uri | 3.1.6 | Dependency-free RFC 3986 URI toolbox | https://github.com/fastify/fast-uri | https://github.com/fastify/fast-uri |
| Terceiro | transitiva | fast-wrap-ansi | 0.2.2 | A tiny and fast text wrap library which takes ANSI escapes into account. | https://github.com/43081j/fast-wrap-ansi | https://github.com/43081j/fast-wrap-ansi |
| Terceiro | transitiva | fdir | 6.5.0 | The fastest directory crawler & globbing alternative to glob, fast-glob, & tiny-glob. Crawls 1m files in < 1s | https://github.com/thecodrr/fdir | https://github.com/thecodrr/fdir |
| Terceiro | transitiva | file-uri-to-path | 1.0.0 | Convert a file: URI to a file path | git://github.com/TooTallNate/file-uri-to-path | git://github.com/TooTallNate/file-uri-to-path |
| Terceiro | transitiva | finalhandler | 2.1.1 | Node.js final http responder | pillarjs/finalhandler | — |
| Terceiro | transitiva | forwarded | 0.2.0 | Parse HTTP X-Forwarded-For header | jshttp/forwarded | — |
| Terceiro | transitiva | fresh | 2.0.0 | HTTP response freshness testing | jshttp/fresh | — |
| Terceiro | transitiva | fs-constants | 1.0.0 | Require constants across node and the browser | https://github.com/mafintosh/fs-constants | https://github.com/mafintosh/fs-constants |
| Terceiro | transitiva | fsevents | 2.3.3 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | function-bind | 1.1.2 | Implementation of Function.prototype.bind | https://github.com/Raynos/function-bind | https://github.com/Raynos/function-bind |
| Terceiro | transitiva | get-caller-file | 2.0.5 | Finalidade não descrita nos metadados locais. | https://github.com/stefanpenner/get-caller-file | https://github.com/stefanpenner/get-caller-file |
| Terceiro | transitiva | get-intrinsic | 1.3.0 | Get and robustly cache all JS language-level intrinsics at first require time | https://github.com/ljharb/get-intrinsic | https://github.com/ljharb/get-intrinsic |
| Terceiro | transitiva | get-proto | 1.0.1 | Robustly get the [[Prototype]] of an object | https://github.com/ljharb/get-proto | https://github.com/ljharb/get-proto |
| Terceiro | transitiva | github-from-package | 0.0.0 | return the github url from a package.json file | git://github.com/substack/github-from-package | git://github.com/substack/github-from-package |
| Terceiro | transitiva | gopd | 1.2.0 | `Object.getOwnPropertyDescriptor`, but accounts for IE's broken implementation. | https://github.com/ljharb/gopd | https://github.com/ljharb/gopd |
| Terceiro | transitiva | has-flag | 4.0.0 | Check if argv has a specific flag | sindresorhus/has-flag | — |
| Terceiro | transitiva | has-symbols | 1.1.0 | Determine if the JS environment has Symbol support. Supports spec, or shams. | git://github.com/inspect-js/has-symbols | git://github.com/inspect-js/has-symbols |
| Terceiro | transitiva | hasown | 2.0.4 | A robust, ES3 compatible, "has own property" predicate. | https://github.com/inspect-js/hasOwn | https://github.com/inspect-js/hasOwn |
| Terceiro | transitiva | highlight.js | 10.7.3 | Syntax highlighting with language autodetection. | git://github.com/highlightjs/highlight.js | git://github.com/highlightjs/highlight.js |
| Terceiro | transitiva | hono | 4.13.4 | Web framework built on Web Standards | https://github.com/honojs/hono | https://github.com/honojs/hono |
| Terceiro | transitiva | http-errors | 2.0.1 | Create HTTP error objects | jshttp/http-errors | — |
| Terceiro | transitiva | iconv-lite | 0.7.3 | Convert character encodings in pure javascript. | https://github.com/pillarjs/iconv-lite | https://github.com/pillarjs/iconv-lite |
| Terceiro | transitiva | ieee754 | 1.2.1 | Read/write IEEE754 floating point numbers from/to a Buffer or array-like object | git://github.com/feross/ieee754 | git://github.com/feross/ieee754 |
| Terceiro | transitiva | inherits | 2.0.4 | Browser-friendly inheritance fully compatible with standard node.js inherits() | git://github.com/isaacs/inherits | git://github.com/isaacs/inherits |
| Terceiro | transitiva | ini | 1.3.8 | An ini encoder/decoder for node | git://github.com/isaacs/ini | git://github.com/isaacs/ini |
| Terceiro | transitiva | ip-address | 10.5.0 | A library for parsing IPv4 and IPv6 IP addresses in node and the browser. | https://github.com/beaugunderson/ip-address | https://github.com/beaugunderson/ip-address |
| Terceiro | transitiva | ipaddr.js | 1.9.1 | A library for manipulating IPv4 and IPv6 addresses in JavaScript. | git://github.com/whitequark/ipaddr.js | git://github.com/whitequark/ipaddr.js |
| Terceiro | transitiva | is-fullwidth-code-point | 3.0.0 | Check if the character represented by a given Unicode code point is fullwidth | sindresorhus/is-fullwidth-code-point | — |
| Terceiro | transitiva | is-promise | 4.0.0 | Test whether an object looks like a promises-a+ promise | https://github.com/then/is-promise | https://github.com/then/is-promise |
| Terceiro | transitiva | isexe | 2.0.0 | Minimal module to check if a file is executable. | https://github.com/isaacs/isexe | https://github.com/isaacs/isexe |
| Terceiro | transitiva | jose | 6.2.10 | JWA, JWS, JWE, JWT, JWK, JWKS for Node.js, Browser, Cloudflare Workers, Deno, Bun, and other Web-interoperable runtimes | panva/jose | — |
| Terceiro | transitiva | js-tokens | 10.0.0 | Tiny JavaScript tokenizer. | lydell/js-tokens | — |
| Terceiro | transitiva | json-schema-traverse | 1.0.0 | Traverse JSON Schema passing each schema object to callback | https://github.com/epoberezkin/json-schema-traverse | https://github.com/epoberezkin/json-schema-traverse |
| Terceiro | transitiva | json-schema-typed | 8.0.2 | JSON Schema TypeScript definitions with complete inline documentation. | https://github.com/RemyRylan/json-schema-typed | https://github.com/RemyRylan/json-schema-typed |
| Terceiro | transitiva | lightningcss | 1.33.0 | A CSS parser, transformer, and minifier written in Rust | https://github.com/parcel-bundler/lightningcss | https://github.com/parcel-bundler/lightningcss |
| Terceiro | transitiva | lightningcss-android-arm64 | 1.33.0 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | lightningcss-darwin-arm64 | 1.33.0 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | lightningcss-darwin-x64 | 1.33.0 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | lightningcss-freebsd-x64 | 1.33.0 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | lightningcss-linux-arm-gnueabihf | 1.33.0 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | lightningcss-linux-arm64-gnu | 1.33.0 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | lightningcss-linux-arm64-musl | 1.33.0 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | lightningcss-linux-x64-gnu | 1.33.0 | A CSS parser, transformer, and minifier written in Rust | https://github.com/parcel-bundler/lightningcss | https://github.com/parcel-bundler/lightningcss |
| Terceiro | transitiva | lightningcss-linux-x64-musl | 1.33.0 | A CSS parser, transformer, and minifier written in Rust | https://github.com/parcel-bundler/lightningcss | https://github.com/parcel-bundler/lightningcss |
| Terceiro | transitiva | lightningcss-win32-arm64-msvc | 1.33.0 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | lightningcss-win32-x64-msvc | 1.33.0 | Finalidade não descrita nos metadados locais. |  | — |
| Terceiro | transitiva | magic-string | 1.4.1 | Modify strings, generate sourcemaps | https://github.com/Rich-Harris/magic-string | https://github.com/Rich-Harris/magic-string |
| Terceiro | transitiva | magicast | 0.5.4 | Modify a JS/TS file and write back magically just like JSON! | unjs/magicast | — |
| Terceiro | transitiva | marked | 15.0.12 | A markdown parser built for speed | git://github.com/markedjs/marked | git://github.com/markedjs/marked |
| Terceiro | transitiva | marked-terminal | 7.3.0 | A custom render for marked to output to the Terminal | https://github.com/mikaelbr/marked-terminal | https://github.com/mikaelbr/marked-terminal |
| Terceiro | transitiva | math-intrinsics | 1.1.0 | ES Math-related intrinsics and helpers, robustly cached. | https://github.com/es-shims/math-intrinsics | https://github.com/es-shims/math-intrinsics |
| Terceiro | transitiva | media-typer | 1.1.1 | Simple RFC 6838 media type parser and formatter | jshttp/media-typer | — |
| Terceiro | transitiva | merge-descriptors | 2.0.0 | Merge objects using their property descriptors | sindresorhus/merge-descriptors | — |
| Terceiro | transitiva | mime-db | 1.54.0 | Media Type Database | jshttp/mime-db | — |
| Terceiro | transitiva | mime-types | 3.0.2 | The ultimate javascript content-type utility. | jshttp/mime-types | — |
| Terceiro | transitiva | mimic-response | 3.1.0 | Mimic a Node.js HTTP response stream | sindresorhus/mimic-response | — |
| Terceiro | transitiva | minimist | 1.2.8 | parse argument options | git://github.com/minimistjs/minimist | git://github.com/minimistjs/minimist |
| Terceiro | transitiva | minipass | 7.1.3 | minimal implementation of a PassThrough stream | https://github.com/isaacs/minipass | https://github.com/isaacs/minipass |
| Terceiro | transitiva | minizlib | 3.1.0 | A small fast zlib stream built on [minipass](http://npm.im/minipass) and Node.js's zlib binding. | https://github.com/isaacs/minizlib | https://github.com/isaacs/minizlib |
| Terceiro | transitiva | mkdirp-classic | 0.5.3 | Mirror of mkdirp 0.5.2 | https://github.com/mafintosh/mkdirp-classic | https://github.com/mafintosh/mkdirp-classic |
| Terceiro | transitiva | ms | 2.1.3 | Tiny millisecond conversion utility | vercel/ms | — |
| Terceiro | transitiva | mz | 2.7.0 | modernize node.js to current ECMAScript standards | normalize/mz | — |
| Terceiro | transitiva | nanoid | 3.3.19 | A tiny (116 bytes), secure URL-friendly unique string ID generator | ai/nanoid | — |
| Terceiro | transitiva | napi-build-utils | 2.0.0 | A set of utilities to assist developers of tools that build N-API native add-ons | https://github.com/inspiredware/napi-build-utils | https://github.com/inspiredware/napi-build-utils |
| Terceiro | transitiva | negotiator | 1.1.0 | HTTP content negotiation | jshttp/negotiator | — |
| Terceiro | transitiva | neo-blessed | 0.2.0 | A high-level terminal interface library for node.js. | git://github.com/embark-framework/neo-blessed | git://github.com/embark-framework/neo-blessed |
| Terceiro | transitiva | node-abi | 3.95.0 | Get the Node ABI for a given target and runtime, and vice versa. | https://github.com/electron/node-abi | https://github.com/electron/node-abi |
| Terceiro | transitiva | node-emoji | 2.2.0 | Friendly emoji lookups and parsing utilities for Node.js. 💖 | https://github.com/omnidan/node-emoji | https://github.com/omnidan/node-emoji |
| Terceiro | transitiva | object-assign | 4.1.1 | ES2015 `Object.assign()` ponyfill | sindresorhus/object-assign | — |
| Terceiro | transitiva | object-inspect | 1.13.4 | string representations of objects in node and the browser | git://github.com/inspect-js/object-inspect | git://github.com/inspect-js/object-inspect |
| Terceiro | transitiva | obug | 2.2.1 | A lightweight JavaScript debugging utility, forked from debug, featuring TypeScript and ESM support. | https://github.com/sxzz/obug | https://github.com/sxzz/obug |
| Terceiro | transitiva | on-finished | 2.4.1 | Execute a callback when a request closes, finishes, or errors | jshttp/on-finished | — |
| Terceiro | transitiva | once | 1.4.0 | Run a function exactly one time | git://github.com/isaacs/once | git://github.com/isaacs/once |
| Terceiro | transitiva | parse5 | 5.1.1 | HTML parser and serializer. | git://github.com/inikulin/parse5 | git://github.com/inikulin/parse5 |
| Terceiro | transitiva | parse5-htmlparser2-tree-adapter | 6.0.1 | htmlparser2 tree adapter for parse5. | git://github.com/inikulin/parse5 | git://github.com/inikulin/parse5 |
| Terceiro | transitiva | parse5 | 6.0.1 | HTML parser and serializer. | git://github.com/inikulin/parse5 | git://github.com/inikulin/parse5 |
| Terceiro | transitiva | parseurl | 1.3.3 | parse a url with memoization | pillarjs/parseurl | — |
| Terceiro | transitiva | path-key | 3.1.1 | Get the PATH environment variable key cross-platform | sindresorhus/path-key | — |
| Terceiro | transitiva | path-to-regexp | 8.4.2 | Express style path to RegExp utility | https://github.com/pillarjs/path-to-regexp | https://github.com/pillarjs/path-to-regexp |
| Terceiro | transitiva | picocolors | 1.1.1 | The tiniest and the fastest library for terminal output formatting with ANSI colors | alexeyraspopov/picocolors | — |
| Terceiro | transitiva | picomatch | 4.0.7 | Blazing fast and accurate glob matcher written in JavaScript, with no dependencies and full support for standard and extended Bash glob features, including braces, extglobs, POSIX brackets, and regular expressions. | micromatch/picomatch | — |
| Terceiro | transitiva | pkce-challenge | 5.0.1 | Generate or verify a Proof Key for Code Exchange (PKCE) challenge pair | https://github.com/crouchcd/pkce-challenge | https://github.com/crouchcd/pkce-challenge |
| Terceiro | transitiva | postcss | 8.5.28 | Tool for transforming styles with JS plugins | postcss/postcss | — |
| Terceiro | transitiva | prebuild-install | 7.1.3 | A command line tool to easily install prebuilt binaries for multiple version of node/iojs on a specific platform | https://github.com/prebuild/prebuild-install | https://github.com/prebuild/prebuild-install |
| Terceiro | transitiva | proxy-addr | 2.0.7 | Determine address of proxied request | jshttp/proxy-addr | — |
| Terceiro | transitiva | pump | 3.0.4 | pipe streams together and close all of them if one of them closes | git://github.com/mafintosh/pump | git://github.com/mafintosh/pump |
| Terceiro | transitiva | qs | 6.15.3 | A querystring parser that supports nesting and arrays, with a depth limit | https://github.com/ljharb/qs | https://github.com/ljharb/qs |
| Terceiro | transitiva | range-parser | 1.3.0 | Range header field string parser | jshttp/range-parser | — |
| Terceiro | transitiva | raw-body | 3.0.2 | Get and validate the raw body of a readable stream. | stream-utils/raw-body | — |
| Terceiro | transitiva | rc | 1.2.8 | hardwired configuration loader | https://github.com/dominictarr/rc | https://github.com/dominictarr/rc |
| Terceiro | transitiva | readable-stream | 3.6.2 | Streams3, a user-land copy of the stream library from Node.js | git://github.com/nodejs/readable-stream | git://github.com/nodejs/readable-stream |
| Terceiro | transitiva | require-directory | 2.1.1 | Recursively iterates over specified directory, require()'ing each file, and returning a nested hash structure containing those modules. | git://github.com/troygoode/node-require-directory | git://github.com/troygoode/node-require-directory |
| Terceiro | transitiva | require-from-string | 2.0.2 | Require module from string | floatdrop/require-from-string | — |
| Terceiro | transitiva | rolldown | 1.2.8 | Fast JavaScript/TypeScript bundler in Rust with Rollup-compatible API. | https://github.com/rolldown/rolldown | https://github.com/rolldown/rolldown |
| Terceiro | transitiva | router | 2.2.0 | Simple middleware-style router | pillarjs/router | — |
| Terceiro | transitiva | safe-buffer | 5.2.1 | Safer Node.js Buffer API | git://github.com/feross/safe-buffer | git://github.com/feross/safe-buffer |
| Terceiro | transitiva | safer-buffer | 2.1.2 | Modern Buffer API polyfill without footguns | https://github.com/ChALkeR/safer-buffer | https://github.com/ChALkeR/safer-buffer |
| Terceiro | transitiva | semver | 7.8.5 | The semantic version parser used by npm. | https://github.com/npm/node-semver | https://github.com/npm/node-semver |
| Terceiro | transitiva | send | 1.2.1 | Better streaming static file server with Range and conditional-GET support | pillarjs/send | — |
| Terceiro | transitiva | serve-static | 2.2.1 | Serve static files | expressjs/serve-static | — |
| Terceiro | transitiva | setprototypeof | 1.2.0 | A small polyfill for Object.setprototypeof | https://github.com/wesleytodd/setprototypeof | https://github.com/wesleytodd/setprototypeof |
| Terceiro | transitiva | shebang-command | 2.0.0 | Get the command from a shebang | kevva/shebang-command | — |
| Terceiro | transitiva | shebang-regex | 3.0.0 | Regular expression for matching a shebang line | sindresorhus/shebang-regex | — |
| Terceiro | transitiva | side-channel | 1.1.1 | Store information about any JS value in a side channel. Uses WeakMap if available. | https://github.com/ljharb/side-channel | https://github.com/ljharb/side-channel |
| Terceiro | transitiva | side-channel-list | 1.0.1 | Store information about any JS value in a side channel, using a linked list | https://github.com/ljharb/side-channel-list | https://github.com/ljharb/side-channel-list |
| Terceiro | transitiva | side-channel-map | 1.0.1 | Store information about any JS value in a side channel, using a Map | https://github.com/ljharb/side-channel-map | https://github.com/ljharb/side-channel-map |
| Terceiro | transitiva | side-channel-weakmap | 1.0.2 | Store information about any JS value in a side channel. Uses WeakMap if available. | https://github.com/ljharb/side-channel-weakmap | https://github.com/ljharb/side-channel-weakmap |
| Terceiro | transitiva | siginfo | 2.0.0 | Utility module to print pretty messages on SIGINFO/SIGUSR1 | https://github.com/emilbayes/siginfo | https://github.com/emilbayes/siginfo |
| Terceiro | transitiva | simple-concat | 1.0.1 | Super-minimalist version of `concat-stream`. Less than 15 lines! | git://github.com/feross/simple-concat | git://github.com/feross/simple-concat |
| Terceiro | transitiva | simple-get | 4.0.1 | Simplest way to make http get requests. Supports HTTPS, redirects, gzip/deflate, streams in < 100 lines. | git://github.com/feross/simple-get | git://github.com/feross/simple-get |
| Terceiro | transitiva | sisteransi | 1.0.5 | ANSI escape codes for some terminal swag | https://github.com/terkelg/sisteransi | https://github.com/terkelg/sisteransi |
| Terceiro | transitiva | skills | 1.5.26 | The open agent skills ecosystem | https://github.com/vercel-labs/skills | https://github.com/vercel-labs/skills |
| Terceiro | transitiva | skin-tone | 2.0.0 | Change the skin tone of an emoji 👌👌🏻👌🏼👌🏽👌🏾👌🏿 | sindresorhus/skin-tone | — |
| Terceiro | transitiva | source-map-js | 1.2.1 | Generates and consumes source maps | 7rulnik/source-map-js | — |
| Terceiro | transitiva | stackback | 0.0.2 | return list of CallSite objects from a captured stacktrace | git://github.com/shtylman/node-stackback | git://github.com/shtylman/node-stackback |
| Terceiro | transitiva | statuses | 2.0.2 | HTTP status utility | jshttp/statuses | — |
| Terceiro | transitiva | std-env | 4.2.0 | Runtime agnostic JS utils | unjs/std-env | — |
| Terceiro | transitiva | string_decoder | 1.3.0 | The string_decoder module from Node core | git://github.com/nodejs/string_decoder | git://github.com/nodejs/string_decoder |
| Terceiro | transitiva | string-width | 4.2.3 | Get the visual width of a string - the number of columns required to display it | sindresorhus/string-width | — |
| Terceiro | transitiva | strip-ansi | 6.0.1 | Strip ANSI escape codes from a string | chalk/strip-ansi | — |
| Terceiro | transitiva | ansi-regex | 5.0.1 | Regular expression for matching ANSI escape codes | chalk/ansi-regex | — |
| Terceiro | transitiva | strip-json-comments | 2.0.1 | Strip comments from JSON. Lets you use comments in your JSON files! | sindresorhus/strip-json-comments | — |
| Terceiro | transitiva | supports-color | 7.2.0 | Detect whether a terminal supports color | chalk/supports-color | — |
| Terceiro | transitiva | supports-hyperlinks | 3.2.0 | Detect whether a terminal supports hyperlinks | chalk/supports-hyperlinks | — |
| Terceiro | transitiva | tar | 7.5.22 | tar for node | https://github.com/isaacs/node-tar | https://github.com/isaacs/node-tar |
| Terceiro | transitiva | tar-fs | 2.1.5 | filesystem bindings for tar-stream | https://github.com/mafintosh/tar-fs | https://github.com/mafintosh/tar-fs |
| Terceiro | transitiva | chownr | 1.1.4 | like `chown -R` | git://github.com/isaacs/chownr | git://github.com/isaacs/chownr |
| Terceiro | transitiva | tar-stream | 2.2.0 | tar-stream is a streaming tar parser and generator and nothing else. It is streams2 and operates purely using streams which means you can easily extract/parse tarballs without ever hitting the file system. | https://github.com/mafintosh/tar-stream | https://github.com/mafintosh/tar-stream |
| Terceiro | transitiva | thenify | 3.3.1 | Promisify a callback-based function | thenables/thenify | — |
| Terceiro | transitiva | thenify-all | 1.6.0 | Promisifies all the selected functions in an object | thenables/thenify-all | — |
| Terceiro | transitiva | tinybench | 6.1.4 | 🔎 A simple, tiny and lightweight benchmarking library! | tinylibs/tinybench | — |
| Terceiro | transitiva | tinyexec | 1.3.0 | A minimal library for executing processes in Node | https://github.com/tinylibs/tinyexec | https://github.com/tinylibs/tinyexec |
| Terceiro | transitiva | tinyglobby | 0.2.17 | A fast and minimal alternative to globby and fast-glob | https://github.com/SuperchupuDev/tinyglobby | https://github.com/SuperchupuDev/tinyglobby |
| Terceiro | transitiva | tinyrainbow | 3.1.1 | A small library to print colourful messages. | https://github.com/tinylibs/tinyrainbow | https://github.com/tinylibs/tinyrainbow |
| Terceiro | transitiva | toidentifier | 1.0.1 | Convert a string of words to a JavaScript identifier | component/toidentifier | — |
| Terceiro | transitiva | tunnel-agent | 0.6.0 | HTTP proxy tunneling agent. Formerly part of mikeal/request, now a standalone module. | https://github.com/mikeal/tunnel-agent | https://github.com/mikeal/tunnel-agent |
| Terceiro | transitiva | turndown | 7.2.4 | A library that converts HTML to Markdown | https://github.com/mixmark-io/turndown | https://github.com/mixmark-io/turndown |
| Terceiro | transitiva | turndown-plugin-gfm | 1.0.2 | Turndown plugin to add GitHub Flavored Markdown extensions. | https://github.com/domchristie/turndown-plugin-gfm | https://github.com/domchristie/turndown-plugin-gfm |
| Terceiro | transitiva | type-is | 2.1.0 | Infer the content-type of a request. | jshttp/type-is | — |
| Terceiro | transitiva | typescript | 7.0.2 | TypeScript is a language for application scale JavaScript development | https://github.com/microsoft/TypeScript | https://github.com/microsoft/TypeScript |
| Terceiro | transitiva | undici-types | 8.3.0 | A stand-alone types package for Undici | https://github.com/nodejs/undici | https://github.com/nodejs/undici |
| Terceiro | transitiva | unicode-emoji-modifier-base | 1.0.0 | The set of Unicode symbols that can serve as a base for emoji modifiers, i.e. those with the `Emoji_Modifier_Base` property set to `Yes`. | https://github.com/mathiasbynens/unicode-emoji-modifier-base | https://github.com/mathiasbynens/unicode-emoji-modifier-base |
| Terceiro | transitiva | unpipe | 1.0.0 | Unpipe a stream from all destinations | stream-utils/unpipe | — |
| Terceiro | transitiva | util-deprecate | 1.0.2 | The Node.js `util.deprecate()` function with browser support | git://github.com/TooTallNate/util-deprecate | git://github.com/TooTallNate/util-deprecate |
| Terceiro | transitiva | vary | 1.1.2 | Manipulate the HTTP Vary header | jshttp/vary | — |
| Terceiro | transitiva | vite | 8.3.0 | Native-ESM powered web dev build tool | https://github.com/vitejs/vite | https://github.com/vitejs/vite |
| Terceiro | transitiva | vitest | 5.0.1 | Next generation testing framework powered by Vite | https://github.com/vitest-dev/vitest | https://github.com/vitest-dev/vitest |
| Terceiro | transitiva | which | 2.0.2 | Like which(1) unix command. Find the first instance of an executable in the PATH. | git://github.com/isaacs/node-which | git://github.com/isaacs/node-which |
| Terceiro | transitiva | why-is-node-running | 2.3.0 | Node is running but you don't know why? why-is-node-running is here to help you. | https://github.com/mafintosh/why-is-node-running | https://github.com/mafintosh/why-is-node-running |
| Terceiro | transitiva | wrap-ansi | 7.0.0 | Wordwrap a string with ANSI escape codes | chalk/wrap-ansi | — |
| Terceiro | transitiva | wrappy | 1.0.2 | Callback wrapping utility | https://github.com/npm/wrappy | https://github.com/npm/wrappy |
| Terceiro | transitiva | y18n | 5.0.8 | the bare-bones internationalization library used by yargs | yargs/y18n | — |
| Terceiro | transitiva | yallist | 5.0.0 | Yet Another Linked List | https://github.com/isaacs/yallist | https://github.com/isaacs/yallist |
| Terceiro | transitiva | yaml | 2.9.1 | JavaScript parser and stringifier for YAML | github:eemeli/yaml | — |
| Terceiro | transitiva | yargs | 16.2.2 | yargs the modern, pirate-themed, successor to optimist. | https://github.com/yargs/yargs | https://github.com/yargs/yargs |
| Terceiro | transitiva | yargs-parser | 20.2.9 | the mighty option parser used by yargs | https://github.com/yargs/yargs-parser | https://github.com/yargs/yargs-parser |
| Terceiro | transitiva | zod | 4.6.5 | TypeScript-first schema declaration and validation library with static type inference | https://github.com/colinhacks/zod | https://github.com/colinhacks/zod |
| Terceiro | transitiva | zod-to-json-schema | 3.25.2 | Converts Zod schemas to Json Schemas | https://github.com/StefanTerdell/zod-to-json-schema | https://github.com/StefanTerdell/zod-to-json-schema |
<!-- specsfy:documentator:end -->

<!-- O bloco specsfy:documentator acima é o inventário mecânico gerado pelo Specsfy e é reescrito a cada build (findings/external/FIND-EXT-001). A documentação do projeto vive fora dele, a partir daqui. -->

## Complete Package Inventory (Direct and Transitive)

| Category | Scope | Package | Version | Purpose | Source | GitHub |
| --- | --- | --- | --- | --- | --- | --- |
| Third-party | production | @modelcontextprotocol/sdk | 1.30.0 | Model Context Protocol implementation for TypeScript | https://github.com/modelcontextprotocol/typescript-sdk | https://github.com/modelcontextprotocol/typescript-sdk |
| Third-party | production | @promovaweb/specsfy | 0.22.2 | Specsfy CLI & TUI to install skills and track specifications. | https://github.com/promovaweb/specsfy | https://github.com/promovaweb/specsfy |
| Third-party | production | context-mode | 1.0.169 | MCP plugin that saves 98% of your context window. Works with Claude Code, Gemini CLI, VS Code Copilot, OpenCode, and Codex CLI. Sandboxed code execution, FTS5 knowledge base, and intent-driven search. | https://github.com/mksglu/context-mode | https://github.com/mksglu/context-mode |
| Third-party | production | skills | 1.5.23 | The open agent skills ecosystem | https://github.com/vercel-labs/skills | https://github.com/vercel-labs/skills |
| Third-party | production | yaml | 2.9.0 | JavaScript parser and stringifier for YAML | github:eemeli/yaml | — |
| Third-party | production | zod | 3.25.76 | TypeScript-first schema declaration and validation library with static type inference | https://github.com/colinhacks/zod | https://github.com/colinhacks/zod |
| Third-party | development | @types/node | 26.3.0 | TypeScript definitions for node | https://github.com/DefinitelyTyped/DefinitelyTyped | https://github.com/DefinitelyTyped/DefinitelyTyped |
| Third-party | development | @vitest/coverage-v8 | 4.1.11 | V8 coverage provider for Vitest | https://github.com/vitest-dev/vitest | https://github.com/vitest-dev/vitest |
| Third-party | development | typescript | 7.0.2 | TypeScript is a language for application scale JavaScript development | https://github.com/microsoft/TypeScript | https://github.com/microsoft/TypeScript |
| Third-party | development | vitest | 4.1.11 | Next generation testing framework powered by Vite | https://github.com/vitest-dev/vitest | https://github.com/vitest-dev/vitest |

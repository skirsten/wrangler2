# Wrangler 1.0 and 2.0 comparison table

## Commands
| Command | 1.x | 2.0 | Notes |
|-|-|-|-|
| `publish` | ✅  | ✅  |
| `dev` | ✅  | ✅  |
| `preview` | ✅  | ❌  | Removed, use `dev` instead. |
| `init` | ✅ | ✅ |
| `generate` | ✅ | ❌ | Removed, use `git clone` instead. |
| `build` | ✅  | ❌ | Removed, invoke your own build script instead. |
| `secret` | ✅  | ✅  |
| `route` | ✅  | ❌  | Removed, use `publish` instead. |
| `tail` | ✅  | ✅  |
| `kv` | ✅  | ✅  |
| `r2` | 🚧  | ✅  | Introduced in wrangler 1.19.8.
| `pages` | ❌ | ✅ | 
| `config` | ✅  | ❔ |
| `login` | ✅  | ✅  |
| `logout` | ✅  | ✅  |
| `whoami` | ✅  | ✅  |
| `subdomain` | ✅  | ❔ |
| `report` | ✅  | ❌  | Removed, error reports are made interactively. |

## Configuration
| Property | 1.x | 2.0 | Notes |
|-|-|-|-|
| `type = "webpack"` | ✅ | ❌ | Removed, look at this guide to migrate.  |
| `type = "rust"` | ✅ | ❌ | Removed, use [`workers-rs`](https://github.com/cloudflare/workers-rs) instead. |
| `type = "javascript"` | ✅ | 🚧  | No longer required, can be omitted. |

## Features
| Feature | 1.x | 2.0 | Notes |
|-|-|-|-|
| TypeScript | ❌ | ✅ | You can give wrangler a TypeScript file, and it will automatically transpile it to JavaScript using [`esbuild`](https://github.com/evanw/esbuild) under-the-hood. |
| Local mode | ❌ | ✅ | `wrangler dev --local` will run your Worker on your local machine instead of on our network. This is powered by [Miniflare](https://github.com/cloudflare/miniflare).
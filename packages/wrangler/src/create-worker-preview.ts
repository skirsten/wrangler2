import { URL } from "node:url";
import { fetch } from "undici";
import { fetchResult } from "./cfetch";
import { createWorkerUploadForm } from "./create-worker-upload-form";
import type { CfAccount, CfWorkerContext, CfWorkerInit } from "./worker";

/**
 * A preview mode.
 *
 * * If true, then using a `workers.dev` subdomain.
 * * Otherwise, a list of routes under a single zone.
 */
type CfPreviewMode = { workers_dev: boolean } | { routes: string[] };

/**
 * A preview token.
 */
export interface CfPreviewToken {
  /**
   * The header value required to trigger a preview.
   *
   * @example
   * const headers = { 'cf-workers-preview-token': value }
   * const response = await fetch('https://' + host, { headers })
   */
  value: string;
  /**
   * The host where the preview is available.
   */
  host: string;
  /**
   * A websocket url to a DevTools inspector.
   *
   * Workers does not have a fully-featured implementation
   * of the Chrome DevTools protocol, but supports the following:
   *  * `console.log()` output.
   *  * `Error` stack traces.
   *  * `fetch()` events.
   *
   * There is no support for breakpoints, but we want to implement
   * this eventually.
   *
   * @link https://chromedevtools.github.io/devtools-protocol/
   */
  inspectorUrl: URL;
  /**
   * A url to prewarm the preview session.
   *
   * @example
   * fetch(prewarmUrl, { method: 'POST' })
   */
  prewarmUrl: URL;
}

/**
 * Generates a preview session token.
 */
async function sessionToken(
  account: CfAccount,
  ctx: CfWorkerContext
): Promise<CfPreviewToken> {
  const { accountId } = account;
  const initUrl = ctx.zone
    ? `/zones/${ctx.zone.id}/workers/edge-preview`
    : `/accounts/${accountId}/workers/subdomain/edge-preview`;

  const { exchange_url } = await fetchResult<{ exchange_url: string }>(initUrl);
  const { inspector_websocket, token } = (await (
    await fetch(exchange_url)
  ).json()) as { inspector_websocket: string; token: string };
  const { host } = new URL(inspector_websocket);
  const query = `cf_workers_preview_token=${token}`;

  return {
    value: token,
    host,
    inspectorUrl: new URL(`${inspector_websocket}?${query}`),
    prewarmUrl: new URL(
      `https://${host}/cdn-cgi/workers/preview/prewarm?${query}`
    ),
  };
}

// Credit: https://stackoverflow.com/a/2117523
function randomId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Creates a preview token.
 */
async function createPreviewToken(
  account: CfAccount,
  worker: CfWorkerInit,
  ctx: CfWorkerContext
): Promise<CfPreviewToken> {
  const { value, host, inspectorUrl, prewarmUrl } = await sessionToken(
    account,
    ctx
  );

  const { accountId } = account;
  const scriptId = ctx.zone ? randomId() : worker.name || host.split(".")[0];
  const url =
    ctx.env && !ctx.legacyEnv
      ? `/accounts/${accountId}/workers/services/${scriptId}/environments/${ctx.env}/edge-preview`
      : `/accounts/${accountId}/workers/scripts/${scriptId}/edge-preview`;

  const mode: CfPreviewMode = ctx.zone
    ? { routes: ["*/*"] } // TODO: should we support routes here? how?
    : { workers_dev: true };

  const formData = createWorkerUploadForm(worker);
  formData.set("wrangler-session-config", JSON.stringify(mode));

  const { preview_token } = await fetchResult<{ preview_token: string }>(url, {
    method: "POST",
    body: formData,
    headers: {
      "cf-preview-upload-config-token": value,
    },
  });

  return {
    value: preview_token,
    host: ctx.zone
      ? ctx.zone.host
      : worker.name
      ? `${
          worker.name
          // TODO: this should also probably have the env prefix
          // but it doesn't appear to work yet, instead giving us the
          // "There is nothing here yet" screen
          // ctx.env && !ctx.legacyEnv
          //   ? `${ctx.env}.${worker.name}`
          //   : worker.name
        }.${host.split(".").slice(1).join(".")}`
      : host,

    inspectorUrl,
    prewarmUrl,
  };
}

/**
 * A stub to create a Cloudflare Worker preview.
 *
 * @example
 * const {value, host} = await createWorker(init, acct);
 */
export async function createWorkerPreview(
  init: CfWorkerInit,
  account: CfAccount,
  ctx: CfWorkerContext
): Promise<CfPreviewToken> {
  const token = await createPreviewToken(account, init, ctx);
  const response = await fetch(token.prewarmUrl.href, { method: "POST" });
  if (!response.ok) {
    // console.error("worker failed to prewarm: ", response.statusText);
  }
  return token;
}

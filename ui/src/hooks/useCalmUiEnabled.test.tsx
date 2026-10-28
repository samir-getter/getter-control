// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot, type Root } from "react-dom/client";
import { flushSync } from "react-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { queryKeys } from "@/lib/queryKeys";
import { resolveCalmUiEnabled, useCalmUiEnabled } from "./useCalmUiEnabled";

const api = vi.hoisted(() => ({ getExperimental: vi.fn() }));
vi.mock("@/api/instanceSettings", () => ({ instanceSettingsApi: api }));

function Probe() {
  const state = useCalmUiEnabled();
  return <output>{`${state.enabled}:${state.loaded}`}</output>;
}

async function flushReact() {
  for (let index = 0; index < 5; index += 1) {
    await Promise.resolve();
    await new Promise((resolve) => window.setTimeout(resolve, 0));
  }
  flushSync(() => {});
}

describe("useCalmUiEnabled", () => {
  let host: HTMLDivElement;
  let root: Root;
  let client: QueryClient;

  beforeEach(() => {
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });
  afterEach(() => {
    flushSync(() => root.unmount());
    client.clear();
    host.remove();
    vi.resetAllMocks();
  });
  function render() {
    flushSync(() => root.render(<QueryClientProvider client={client}><Probe /></QueryClientProvider>));
  }

  it("requires an explicit boolean true", () => {
    for (const settings of [undefined, null, {}, { enableCalmUi: false }]) {
      expect(resolveCalmUiEnabled(settings)).toBe(false);
    }
    expect(resolveCalmUiEnabled({ enableCalmUi: true })).toBe(true);
  });

  it("keeps CALM off while settings initially load", () => {
    api.getExperimental.mockImplementation(() => new Promise(() => {}));
    render();
    expect(host.textContent).toBe("false:false");
  });

  it("keeps CALM off when settings cannot be read", async () => {
    api.getExperimental.mockRejectedValue(new Error("Settings unavailable"));
    render();
    await flushReact();
    expect(host.textContent).toBe("false:true");
  });

  it("uses the existing settings cache for immediate opt-in and rollback", async () => {
    api.getExperimental.mockResolvedValue({ enableCalmUi: false });
    render();
    await flushReact();
    expect(host.textContent).toBe("false:true");
    client.setQueryData(queryKeys.instance.experimentalSettings, { enableCalmUi: true });
    await flushReact();
    expect(host.textContent).toBe("true:true");
    client.setQueryData(queryKeys.instance.experimentalSettings, { enableCalmUi: false });
    await flushReact();
    expect(host.textContent).toBe("false:true");
    expect(api.getExperimental).toHaveBeenCalledTimes(1);
  });

  it("keeps standalone harnesses off without requesting settings", () => {
    flushSync(() => root.render(<Probe />));
    expect(host.textContent).toBe("false:true");
    expect(api.getExperimental).not.toHaveBeenCalled();
  });
});

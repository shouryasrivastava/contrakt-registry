"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CircleAlert, Copy, LoaderCircle, Plus, Save, TestTube2, Trash2 } from "lucide-react";
import { normalizeDeploymentUrl } from "@/lib/deployment-url";

type Webhook = {
  id: string;
  url: string;
  enabled: boolean;
  createdAt: Date | string;
};

type Feedback = { tone: "success" | "error" | "info"; message: string } | null;

function CopyControl({ value }: { value: string }) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("error");
    }
    window.setTimeout(() => setState("idle"), 1800);
  }
  return (
    <button type="button" onClick={copy} aria-label="Copy" title={state === "error" ? "Copy failed" : "Copy"} className="text-white/70 hover:text-white">
      {state === "copied" ? <Check className="h-4 w-4 text-green-400" /> : state === "error" ? <CircleAlert className="h-4 w-4 text-red-300" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

function FeedbackLine({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null;
  const colors =
    feedback.tone === "success"
      ? "border-green-200 bg-green-50 text-green-800"
      : feedback.tone === "error"
        ? "border-red-200 bg-red-50 text-red-800"
        : "border-blue-200 bg-blue-50 text-blue-800";
  return <p role="status" className={`mt-3 rounded-[9px] border px-3 py-2 text-[11px] ${colors}`}>{feedback.message}</p>;
}

export default function IntegrationSettings({
  slug,
  initialBaseUrl,
  initialWebhooks,
  publicUrl,
  mcpUrl,
  rawUrl,
  badgeMarkdown,
  watchCommand,
}: {
  slug: string;
  initialBaseUrl: string;
  initialWebhooks: Webhook[];
  publicUrl: string;
  mcpUrl: string;
  rawUrl: string;
  badgeMarkdown: string;
  watchCommand: string;
}) {
  const router = useRouter();
  const [baseUrl, setBaseUrl] = useState(initialBaseUrl);
  const [savedBaseUrl, setSavedBaseUrl] = useState(initialBaseUrl);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhooks, setWebhooks] = useState(initialWebhooks);
  const [deploymentFeedback, setDeploymentFeedback] = useState<Feedback>(null);
  const [webhookFeedback, setWebhookFeedback] = useState<Feedback>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [addingWebhook, setAddingWebhook] = useState(false);
  const [removingWebhook, setRemovingWebhook] = useState<string | null>(null);

  const validation = useMemo(
    () => normalizeDeploymentUrl(baseUrl, { allowLocalhost: process.env.NODE_ENV !== "production" }),
    [baseUrl],
  );
  const unchanged = validation.ok && validation.url === savedBaseUrl;

  async function saveBaseUrl() {
    if (!validation.ok) {
      setDeploymentFeedback({ tone: "error", message: validation.error });
      return;
    }
    setSaving(true);
    setDeploymentFeedback({ tone: "info", message: "Saving deployment URL..." });
    try {
      const response = await fetch(`/api/registry/contracts/${slug}/owner`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl: validation.url }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? `Save failed with HTTP ${response.status}.`);
      setBaseUrl(payload.contract?.baseUrl ?? validation.url);
      setSavedBaseUrl(payload.contract?.baseUrl ?? validation.url);
      setDeploymentFeedback({ tone: "success", message: "Deployment URL saved. Public pages and MCP configuration are now updated." });
      router.refresh();
    } catch (error) {
      setDeploymentFeedback({ tone: "error", message: error instanceof Error ? error.message : "Could not save the deployment URL." });
    } finally {
      setSaving(false);
    }
  }

  async function testConnection() {
    if (!validation.ok) {
      setDeploymentFeedback({ tone: "error", message: validation.error });
      return;
    }
    setTesting(true);
    setDeploymentFeedback({ tone: "info", message: "Testing the deployment from Contrakt..." });
    try {
      const response = await fetch(`/api/registry/contracts/${slug}/test-deployment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl: validation.url }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message ?? payload.error ?? `Connection test failed with HTTP ${response.status}.`);
      setDeploymentFeedback({
        tone: payload.reachable ? "success" : "error",
        message: `${payload.message}${payload.latencyMs ? ` (${payload.latencyMs} ms)` : ""}`,
      });
    } catch (error) {
      setDeploymentFeedback({ tone: "error", message: error instanceof Error ? error.message : "The connection test failed." });
    } finally {
      setTesting(false);
    }
  }

  async function addWebhook() {
    if (!webhookUrl.trim()) {
      setWebhookFeedback({ tone: "error", message: "Enter a webhook URL." });
      return;
    }
    setAddingWebhook(true);
    setWebhookFeedback({ tone: "info", message: "Adding webhook..." });
    try {
      const response = await fetch(`/api/registry/contracts/${slug}/webhooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl.trim() }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? `Webhook creation failed with HTTP ${response.status}.`);
      setWebhooks((current) => [...current, payload.webhook]);
      setWebhookUrl("");
      setWebhookFeedback({ tone: "success", message: "Webhook added." });
    } catch (error) {
      setWebhookFeedback({ tone: "error", message: error instanceof Error ? error.message : "Could not add the webhook." });
    } finally {
      setAddingWebhook(false);
    }
  }

  async function removeWebhook(id: string) {
    setRemovingWebhook(id);
    setWebhookFeedback(null);
    try {
      const response = await fetch(`/api/registry/contracts/${slug}/webhooks?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? `Webhook removal failed with HTTP ${response.status}.`);
      setWebhooks((current) => current.filter((webhook) => webhook.id !== id));
      setWebhookFeedback({ tone: "success", message: "Webhook removed." });
    } catch (error) {
      setWebhookFeedback({ tone: "error", message: error instanceof Error ? error.message : "Could not remove the webhook." });
    } finally {
      setRemovingWebhook(null);
    }
  }

  const snippets = [
    { label: "MCP configuration", value: mcpUrl },
    { label: "Watch for contract changes", value: watchCommand },
    { label: "README badge", value: badgeMarkdown },
    { label: "Raw contract JSON", value: rawUrl },
  ];

  return (
    <div className="space-y-5">
      <section id="deployment" className="rounded-[12px] border border-border bg-white p-5">
        <h2 className="text-[20px] text-ink">Production deployment</h2>
        <p className="mt-1 text-[11px] text-muted">MCP tools call this URL unless a consumer overrides it.</p>
        <label htmlFor="deployment-url" className="mt-4 block font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
          Base URL
        </label>
        <div className="mt-2 flex flex-col gap-3 lg:flex-row">
          <div className="min-w-0 flex-1">
            <input
              id="deployment-url"
              value={baseUrl}
              onChange={(event) => {
                setBaseUrl(event.target.value);
                setDeploymentFeedback(null);
              }}
              placeholder="https://api.example.com"
              aria-invalid={!validation.ok && Boolean(baseUrl)}
              className={`w-full rounded-[9px] border bg-[#fafafa] px-3.5 py-3 font-mono text-[12px] outline-none ${!validation.ok && baseUrl ? "border-red-300 focus:border-red-500" : "border-border focus:border-[#999]"}`}
            />
            {!validation.ok && baseUrl ? <p className="mt-2 text-[11px] text-red-700">{validation.error}</p> : null}
            <p className="mt-2 text-[10px] text-faint">Use HTTPS, for example https://api.example.com. Localhost is accepted only in development.</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={testConnection}
              disabled={testing || saving || !validation.ok}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-ink px-4 py-2.5 text-[12px] font-medium text-ink disabled:cursor-not-allowed disabled:opacity-45"
            >
              {testing ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <TestTube2 className="h-3.5 w-3.5" />}
              Test connection
            </button>
            <button
              type="button"
              onClick={saveBaseUrl}
              disabled={saving || testing || !validation.ok || unchanged}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[12px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-45"
            >
              {saving ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save URL
            </button>
          </div>
        </div>
        <FeedbackLine feedback={deploymentFeedback} />
      </section>

      <section className="overflow-hidden rounded-[12px] border border-border bg-white">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-[20px] text-ink">Agent integrations</h2>
          <p className="mt-1 text-[11px] text-muted">Copy these stable URLs into clients, documentation, and CI.</p>
        </div>
        <div className="divide-y divide-border">
          {snippets.map((snippet) => (
            <div key={snippet.label} className="px-5 py-4">
              <p className="mb-2 text-[11px] font-medium text-ink">{snippet.label}</p>
              <div className="flex items-center gap-3 rounded-[9px] bg-[#171717] px-4 py-3 text-white">
                <code className="min-w-0 flex-1 truncate text-[11px]">{snippet.value}</code>
                <CopyControl value={snippet.value} />
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-border px-5 py-4">
          <a href={publicUrl} className="text-[12px] font-medium text-ink underline">Open public contract page</a>
        </div>
      </section>

      <section className="overflow-hidden rounded-[12px] border border-border bg-white">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-[20px] text-ink">Change webhooks</h2>
          <p className="mt-1 text-[11px] text-muted">Receive a POST with the new version and change summary after each publish.</p>
        </div>
        <div className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={webhookUrl}
              onChange={(event) => {
                setWebhookUrl(event.target.value);
                setWebhookFeedback(null);
              }}
              placeholder="https://example.com/hooks/contrakt"
              className="min-w-0 flex-1 rounded-[9px] border border-border bg-[#fafafa] px-3.5 py-3 font-mono text-[12px] outline-none focus:border-[#999]"
            />
            <button
              type="button"
              onClick={addWebhook}
              disabled={addingWebhook}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-ink px-5 py-2.5 text-[12px] font-medium text-ink disabled:opacity-50"
            >
              {addingWebhook ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Add webhook
            </button>
          </div>
          <FeedbackLine feedback={webhookFeedback} />
          <div className="mt-4 divide-y divide-border border-y border-border">
            {webhooks.length ? webhooks.map((webhook) => (
              <div key={webhook.id} className="flex items-center gap-3 py-3">
                <span className={`h-2 w-2 rounded-full ${webhook.enabled ? "bg-green-500" : "bg-faint"}`} />
                <code className="min-w-0 flex-1 truncate text-[11px] text-ink">{webhook.url}</code>
                <button type="button" disabled={removingWebhook === webhook.id} onClick={() => removeWebhook(webhook.id)} aria-label="Remove webhook">
                  {removingWebhook === webhook.id ? <LoaderCircle className="h-4 w-4 animate-spin text-muted" /> : <Trash2 className="h-4 w-4 text-muted hover:text-red-600" />}
                </button>
              </div>
            )) : <p className="py-5 text-center text-[12px] text-muted">No webhooks configured.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}

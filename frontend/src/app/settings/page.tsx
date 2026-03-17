"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { IoSettingsOutline, IoTrashOutline, IoCheckmarkCircle } from "react-icons/io5";
import { useAuth } from "@/lib/auth-context";
import {
  getLLMSettings,
  updateLLMSettings,
  clearLLMCache,
  type LLMSettings,
  type LLMSettingsUpdate,
} from "@/lib/api";

const FIELD_HELP: Record<string, string> = {
  provider:
    "Choose Ollama (local), Claude (Anthropic), or Gemini (Google). For cloud APIs, set the corresponding API key in the backend .env.",
  llm_url:
    "Address of your Ollama server. Default is http://localhost:11434/api/generate. Only used when provider is Ollama.",
  llm_model:
    "Ollama model name (e.g. phi3:mini, llama3.2). Run ollama list to see installed models. Only used when provider is Ollama.",
  anthropic_model:
    "Claude model ID (e.g. claude-3-5-haiku-20241022, claude-3-sonnet-20240229). See Anthropic docs for available models.",
  anthropic_max_tokens:
    "Maximum tokens for Claude responses. Higher values allow longer explanations.",
  anthropic_api_key:
    "Optional: paste your Claude API key here to use instead of .env. Stored in memory only; leave blank to use ANTHROPIC_API_KEY from .env.",
  gemini_api_key:
    "Optional: paste your Gemini API key here to use instead of .env. Stored in memory only; leave blank to use GEMINI_API_KEY from .env.",
  gemini_model:
    "Gemini model ID (e.g. gemini-1.5-flash, gemini-1.5-pro). See Google AI Studio for available models.",
  gemini_max_tokens:
    "Maximum tokens for Gemini responses. Higher values allow longer explanations.",
  num_predict:
    "Maximum tokens for Ollama responses. Only used when provider is Ollama.",
  temperature:
    "Controls randomness: 0 = very deterministic, 1 = more creative. 0.2–0.4 works well for explanations.",
  cache_ttl:
    "How long (in seconds) to reuse the same explanation for identical requests. 86400 = 24 hours. Set to 0 to disable.",
  cache_max_size:
    "Maximum number of prompt/response pairs to keep in memory. When full, oldest entries are evicted.",
};

export default function SettingsPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<LLMSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState<
    LLMSettingsUpdate & {
      llm_url?: string;
      llm_model?: string;
      provider?: "ollama" | "anthropic" | "gemini";
      anthropic_model?: string;
      anthropic_max_tokens?: number;
      anthropic_api_key?: string;
      gemini_model?: string;
      gemini_max_tokens?: number;
      gemini_api_key?: string;
    }
  >({
    provider: "ollama",
    llm_url: "",
    llm_model: "",
    num_predict: undefined,
    temperature: undefined,
    cache_ttl: undefined,
    cache_max_size: undefined,
    anthropic_model: "",
    anthropic_max_tokens: undefined,
    anthropic_api_key: "",
    gemini_model: "",
    gemini_max_tokens: undefined,
    gemini_api_key: "",
  });

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!token) return;
    getLLMSettings(token)
      .then((data) => {
        setSettings(data);
        setForm({
          provider: data.provider,
          llm_url: data.llm_url,
          llm_model: data.llm_model,
          num_predict: data.num_predict,
          temperature: data.temperature,
          cache_ttl: data.cache_ttl,
          cache_max_size: data.cache_max_size,
          anthropic_model: data.anthropic_model,
          anthropic_max_tokens: data.anthropic_max_tokens,
          gemini_model: data.gemini_model,
          gemini_max_tokens: data.gemini_max_tokens,
        });
      })
      .catch(() => setMessage({ type: "error", text: "Failed to load settings" }))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    setMessage(null);
    const payload: LLMSettingsUpdate = {};
    if (form.provider !== undefined && form.provider !== settings?.provider) payload.provider = form.provider;
    if (form.llm_url !== undefined && form.llm_url !== settings?.llm_url) payload.llm_url = form.llm_url;
    if (form.llm_model !== undefined && form.llm_model !== settings?.llm_model) payload.llm_model = form.llm_model;
    if (form.num_predict !== undefined && form.num_predict !== settings?.num_predict) payload.num_predict = form.num_predict;
    if (form.temperature !== undefined && form.temperature !== settings?.temperature) payload.temperature = form.temperature;
    if (form.cache_ttl !== undefined && form.cache_ttl !== settings?.cache_ttl) payload.cache_ttl = form.cache_ttl;
    if (form.cache_max_size !== undefined && form.cache_max_size !== settings?.cache_max_size) payload.cache_max_size = form.cache_max_size;
    if (form.anthropic_model !== undefined && form.anthropic_model !== settings?.anthropic_model) payload.anthropic_model = form.anthropic_model;
    if (form.anthropic_max_tokens !== undefined && form.anthropic_max_tokens !== settings?.anthropic_max_tokens) payload.anthropic_max_tokens = form.anthropic_max_tokens;
    if (form.gemini_model !== undefined && form.gemini_model !== settings?.gemini_model) payload.gemini_model = form.gemini_model;
    if (form.gemini_max_tokens !== undefined && form.gemini_max_tokens !== settings?.gemini_max_tokens) payload.gemini_max_tokens = form.gemini_max_tokens;
    if (form.anthropic_api_key !== undefined && String(form.anthropic_api_key).trim())
      payload.anthropic_api_key = String(form.anthropic_api_key).trim();
    if (form.gemini_api_key !== undefined && String(form.gemini_api_key).trim())
      payload.gemini_api_key = String(form.gemini_api_key).trim();
    try {
      const updated = await updateLLMSettings(token, payload);
      setSettings(updated);
      setForm({
        provider: updated.provider,
        llm_url: updated.llm_url,
        llm_model: updated.llm_model,
        num_predict: updated.num_predict,
        temperature: updated.temperature,
        cache_ttl: updated.cache_ttl,
        cache_max_size: updated.cache_max_size,
        anthropic_model: updated.anthropic_model,
        anthropic_max_tokens: updated.anthropic_max_tokens,
        gemini_model: updated.gemini_model,
        gemini_max_tokens: updated.gemini_max_tokens,
        anthropic_api_key: "", // Never re-fill keys after save
        gemini_api_key: "",
      });
      setMessage({ type: "success", text: "Settings saved. New recommendations will use these values." });
    } catch {
      setMessage({ type: "error", text: "Failed to update settings" });
    } finally {
      setSaving(false);
    }
  };

  const handleClearCache = async () => {
    if (!token) return;
    setClearing(true);
    setMessage(null);
    try {
      const data = await clearLLMCache(token);
      setMessage({
        type: "success",
        text: `Cache cleared (${data.entries_removed} entries removed).`,
      });
      if (settings) setSettings({ ...settings, cache_size: 0 });
    } catch {
      setMessage({ type: "error", text: "Failed to clear cache" });
    } finally {
      setClearing(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-10 w-10 rounded-full border-2 border-violet-500 border-t-transparent"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] pb-24">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-4xl px-6 pt-14 pb-10"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center">
            <IoSettingsOutline className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">LLM Settings</h1>
            <p className="text-sm text-gray-500">
              Configure how the AI explains your recommendations (Ollama, Claude, or Gemini).
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-8 w-8 rounded-full border-2 border-violet-500 border-t-transparent"
            />
          </div>
        ) : (
          <div className="space-y-6">
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl border px-4 py-3 flex items-center gap-2 ${
                  message.type === "success"
                    ? "border-emerald-500/30 bg-emerald-950/30 text-emerald-300"
                    : "border-red-500/30 bg-red-950/30 text-red-300"
                }`}
              >
                {message.type === "success" && <IoCheckmarkCircle className="w-5 h-5 shrink-0" />}
                <span className="text-sm">{message.text}</span>
              </motion.div>
            )}

            <SettingRow
              label="LLM Provider"
              help={FIELD_HELP.provider}
              value={form.provider ?? "ollama"}
              onChange={(v) => setForm((f) => ({ ...f, provider: v as "ollama" | "anthropic" | "gemini" }))}
              type="select"
              options={[
                { value: "ollama", label: "Ollama (local)" },
                { value: "anthropic", label: "Claude (Anthropic API)" },
                { value: "gemini", label: "Gemini (Google AI)" },
              ]}
            />

            {/* Optional API keys: set here or in .env to enable Claude / Gemini */}
            <div className="space-y-4">
              <p className="text-sm font-medium text-white">API keys (optional)</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Paste keys here to use instead of .env. Stored in memory only; leave blank to use .env. Set at least one to switch between Claude and Gemini.
              </p>
              <SettingRow
                label="Claude API key"
                help={FIELD_HELP.anthropic_api_key}
                value={form.anthropic_api_key ?? ""}
                onChange={(v) => setForm((f) => ({ ...f, anthropic_api_key: String(v) }))}
                type="password"
                placeholder={settings?.anthropic_configured ? "•••••••• (already set)" : "Leave blank to use .env"}
              />
              <SettingRow
                label="Gemini API key"
                help={FIELD_HELP.gemini_api_key}
                value={form.gemini_api_key ?? ""}
                onChange={(v) => setForm((f) => ({ ...f, gemini_api_key: String(v) }))}
                type="password"
                placeholder={settings?.gemini_configured ? "•••••••• (already set)" : "Leave blank to use .env"}
              />
            </div>

            {/* All provider options always visible so every .env value can be overridden */}
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mt-6 mb-2">When using Ollama</p>
            <SettingRow
              label="Ollama URL"
              help={FIELD_HELP.llm_url}
              value={form.llm_url ?? ""}
              onChange={(v) => setForm((f) => ({ ...f, llm_url: v }))}
              type="text"
              placeholder="http://localhost:11434/api/generate"
            />
            <SettingRow
              label="Ollama model"
              help={FIELD_HELP.llm_model}
              value={form.llm_model ?? ""}
              onChange={(v) => setForm((f) => ({ ...f, llm_model: v }))}
              type="text"
              placeholder="phi3:mini"
            />
            <SettingRow
              label="Ollama max tokens (num_predict)"
              help={FIELD_HELP.num_predict}
              value={form.num_predict ?? 256}
              onChange={(v) => setForm((f) => ({ ...f, num_predict: v }))}
              type="number"
              min={64}
              max={2048}
              step={64}
            />

            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mt-6 mb-2">When using Claude</p>
            {!settings?.anthropic_configured && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-3 text-sm text-amber-200 mb-4">
                Set <code className="bg-black/30 px-1 rounded">ANTHROPIC_API_KEY</code> in .env or enter your Claude API key above, then save.
              </div>
            )}
            <SettingRow
              label="Claude model"
              help={FIELD_HELP.anthropic_model}
              value={form.anthropic_model ?? ""}
              onChange={(v) => setForm((f) => ({ ...f, anthropic_model: v }))}
              type="text"
              placeholder="claude-3-5-haiku-20241022"
            />
            <SettingRow
              label="Claude max tokens"
              help={FIELD_HELP.anthropic_max_tokens}
              value={form.anthropic_max_tokens ?? 512}
              onChange={(v) => setForm((f) => ({ ...f, anthropic_max_tokens: v }))}
              type="number"
              min={64}
              max={8192}
              step={64}
            />

            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mt-6 mb-2">When using Gemini</p>
            {!settings?.gemini_configured && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-3 text-sm text-amber-200 mb-4">
                Set <code className="bg-black/30 px-1 rounded">GEMINI_API_KEY</code> in .env or enter your Gemini API key above, then save.
              </div>
            )}
            <SettingRow
              label="Gemini model"
              help={FIELD_HELP.gemini_model}
              value={form.gemini_model ?? ""}
              onChange={(v) => setForm((f) => ({ ...f, gemini_model: v }))}
              type="text"
              placeholder="gemini-1.5-flash"
            />
            <SettingRow
              label="Gemini max tokens"
              help={FIELD_HELP.gemini_max_tokens}
              value={form.gemini_max_tokens ?? 512}
              onChange={(v) => setForm((f) => ({ ...f, gemini_max_tokens: v }))}
              type="number"
              min={64}
              max={8192}
              step={64}
            />
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mt-6 mb-2">Shared (all providers)</p>
            <SettingRow
              label="Temperature"
              help={FIELD_HELP.temperature}
              value={form.temperature ?? 0.3}
              onChange={(v) => setForm((f) => ({ ...f, temperature: v }))}
              type="number"
              min={0}
              max={1}
              step={0.1}
            />
            <SettingRow
              label="Cache TTL (seconds)"
              help={FIELD_HELP.cache_ttl}
              value={form.cache_ttl ?? 86400}
              onChange={(v) => setForm((f) => ({ ...f, cache_ttl: v }))}
              type="number"
              min={0}
              step={3600}
            />
            <SettingRow
              label="Cache max size"
              help={FIELD_HELP.cache_max_size}
              value={form.cache_max_size ?? 200}
              onChange={(v) => setForm((f) => ({ ...f, cache_max_size: v }))}
              type="number"
              min={0}
              max={1000}
            />

            {settings?.cache_size != null && (
              <p className="text-xs text-gray-500">
                Current cache size: <span className="text-gray-400 font-medium">{settings.cache_size}</span> entries
              </p>
            )}

            <div className="flex flex-wrap gap-3 pt-4">
              <motion.button
                type="button"
                onClick={handleSave}
                disabled={saving}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 transition disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save settings"}
              </motion.button>
              <motion.button
                type="button"
                onClick={handleClearCache}
                disabled={clearing || (settings?.cache_size ?? 0) === 0}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/10 transition disabled:opacity-40 flex items-center gap-2"
              >
                <IoTrashOutline className="w-4 h-4" />
                {clearing ? "Clearing…" : "Clear cache"}
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function SettingRow({
  label,
  help,
  value,
  onChange,
  type,
  placeholder,
  min,
  max,
  step,
  options,
}: {
  label: string;
  help: string;
  value: string | number;
  onChange: (v: string | number) => void;
  type: "text" | "number" | "select" | "password";
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
}) {
  const isNum = type === "number";
  const numVal = isNum ? Number(value) : 0;
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
      <label className="block text-sm font-medium text-white">{label}</label>
      <p className="text-xs text-gray-500 leading-relaxed">{help}</p>
      {type === "select" && options ? (
        <select
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-zinc-900 text-white">
              {o.label}
            </option>
          ))}
        </select>
      ) : type === "text" || type === "password" ? (
        <input
          type={type}
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
      ) : (
        <div className="flex items-center gap-3">
          <input
            type="number"
            value={numVal}
            onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
            min={min}
            max={max}
            step={step}
            className="w-32 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          {min != null && max != null && (
            <input
              type="range"
              min={min}
              max={max}
              step={step ?? 1}
              value={numVal}
              onChange={(e) => onChange(Number(e.target.value))}
              className="flex-1 h-2 rounded-full appearance-none bg-white/10 accent-violet-500"
            />
          )}
        </div>
      )}
    </div>
  );
}

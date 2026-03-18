/**
 * API client for CineMatch backend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

/** Called when any auth request returns 401 (e.g. expired token). Set by AuthProvider. */
let onUnauthorized: (() => void) | null = null;
export function setOnUnauthorized(fn: (() => void) | null) {
  onUnauthorized = fn;
}

function checkUnauthorized(res: Response): void {
  if (res.status === 401) {
    onUnauthorized?.();
  }
}

export interface User {
  id: string;
  username: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface MovieListItem {
  film_id: number;
  title: string;
  mood: string;
  theme: string;
  narrative_style: string;
  emotional_tone: string;
  poster_url: string | null;
  vote_average: number | null;
}

export interface MovieDetail extends MovieListItem {
  description: string;
  overview: string;
  release_date: string | null;
}

export interface MovieListResponse {
  items: MovieListItem[];
  total: number;
  skip: number;
  limit: number;
}

export interface MovieRecommendationItem {
  film_id: number;
  title: string;
  poster_url: string | null;
  coverage_score: number;
  mood_score: number;
  theme_score: number;
  style_score: number;
  desc_score: number;
  raw_mood_similarity?: number;
  raw_theme_similarity?: number;
  raw_style_similarity?: number;
  raw_desc_similarity?: number;
}

export interface RecommendationResponse {
  recommendations: MovieRecommendationItem[];
  explanation: string;
  cinephile_profile?: string;
  description_enriched?: boolean;
  cached?: boolean;
  preset_id?: string;
  llm_provider?: "ollama" | "anthropic" | "gemini";
  score_weights: {
    mood: number;
    theme: number;
    style: number;
    description: number;
    recency: number;
  };
}

export interface PresetQueryItem {
  id: string;
  label: string;
  description: string;
  preferred_mood: string;
  preferred_genre: string;
  preferred_style: string;
  mood_intensity: number;
  theme_interest: number;
  style_interest: number;
}

export interface CatalogOptions {
  moods: string[];
  genres: string[];
  styles: string[];
}

export type LLMProvider = "ollama" | "anthropic" | "gemini";

export interface LLMSettings {
  provider: LLMProvider;
  llm_url: string;
  llm_model: string;
  num_predict: number;
  temperature: number;
  cache_ttl: number;
  cache_max_size: number;
  cache_size?: number;
  anthropic_model: string;
  anthropic_max_tokens: number;
  anthropic_configured: boolean;
  gemini_model: string;
  gemini_max_tokens: number;
  gemini_configured: boolean;
}

export interface LLMSettingsUpdate {
  provider?: LLMProvider;
  llm_url?: string;
  llm_model?: string;
  num_predict?: number;
  temperature?: number;
  cache_ttl?: number;
  cache_max_size?: number;
  anthropic_model?: string;
  anthropic_max_tokens?: number;
  anthropic_api_key?: string;
  gemini_model?: string;
  gemini_max_tokens?: number;
  gemini_api_key?: string;
}

// Auth
export async function login(username: string, password: string): Promise<TokenPair> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Login failed");
  }
  return res.json();
}

export async function getMe(token: string): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  checkUnauthorized(res);
  if (!res.ok) throw new Error("Unauthorized");
  const data = await res.json();
  return data;
}

export async function refreshTokens(refreshToken: string): Promise<TokenPair> {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  checkUnauthorized(res);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Refresh failed");
  }
  return res.json();
}

// Movies
export async function listMovies(params?: {
  skip?: number;
  limit?: number;
  search?: string;
  mood?: string;
  genre?: string;
}): Promise<MovieListResponse> {
  const q = new URLSearchParams();
  if (params?.skip != null) q.set("skip", String(params.skip));
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.search) q.set("search", params.search);
  if (params?.mood) q.set("mood", params.mood);
  if (params?.genre) q.set("genre", params.genre);
  const url = `${API_BASE}/movies${q.toString() ? `?${q}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch movies");
  const json = await res.json();
  return json.data;
}

export async function getMovie(filmId: number): Promise<MovieDetail> {
  const res = await fetch(`${API_BASE}/movies/${filmId}`);
  if (!res.ok) throw new Error("Movie not found");
  const json = await res.json();
  return json.data;
}

// Recommendations (requires auth)
export async function getRecommendations(
  token: string,
  body: {
    description: string;
    preferred_mood: string;
    preferred_genre: string;
    preferred_style: string;
    preferred_era?: string;
    preferred_director?: string;
    mood_intensity: number;
    theme_interest: number;
    style_interest: number;
  }
): Promise<RecommendationResponse> {
  const res = await fetch(`${API_BASE}/recommendations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  checkUnauthorized(res);
  if (!res.ok) throw new Error("Failed to get recommendations");
  const json = await res.json();
  return json.data;
}

// Preset queries (list is public; generate requires auth)
export async function getPresets(): Promise<PresetQueryItem[]> {
  const res = await fetch(`${API_BASE}/recommendations/presets`);
  if (!res.ok) throw new Error("Failed to fetch presets");
  const json = await res.json();
  return json.data ?? [];
}

export async function getPresetRecommendations(
  token: string,
  presetId: string
): Promise<RecommendationResponse> {
  const res = await fetch(`${API_BASE}/recommendations/presets/${encodeURIComponent(presetId)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  checkUnauthorized(res);
  if (!res.ok) throw new Error("Failed to get preset recommendations");
  const json = await res.json();
  return json.data;
}

// Recommendation history (requires auth)
export interface HistoryEntrySummary {
  id: number;
  created_at: string;
  summary: string;
}

export interface HistoryEntryDetail {
  id: number;
  user_id: string;
  created_at: string;
  request: Record<string, unknown>;
  response: RecommendationResponse;
}

export async function getRecommendationHistory(
  token: string,
  limit?: number
): Promise<HistoryEntrySummary[]> {
  const q = limit != null ? `?limit=${limit}` : "";
  const res = await fetch(`${API_BASE}/recommendations/history${q}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  checkUnauthorized(res);
  if (!res.ok) throw new Error("Failed to fetch recommendation history");
  const json = await res.json();
  return json.data ?? [];
}

export async function getRecommendationHistoryEntry(
  token: string,
  historyId: number
): Promise<HistoryEntryDetail> {
  const res = await fetch(`${API_BASE}/recommendations/history/${historyId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  checkUnauthorized(res);
  if (!res.ok) throw new Error("Failed to fetch history entry");
  const json = await res.json();
  return json.data;
}

// Catalog options
export async function getCatalogOptions(): Promise<CatalogOptions> {
  const res = await fetch(`${API_BASE}/catalog/options`);
  if (!res.ok) throw new Error("Failed to fetch catalog options");
  const json = await res.json();
  return json.data;
}

// LLM Settings (requires auth)
export async function getLLMSettings(token: string): Promise<LLMSettings> {
  const res = await fetch(`${API_BASE}/settings/llm`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  checkUnauthorized(res);
  if (!res.ok) throw new Error("Failed to fetch LLM settings");
  const json = await res.json();
  return json.data;
}

export async function updateLLMSettings(
  token: string,
  body: LLMSettingsUpdate
): Promise<LLMSettings> {
  const res = await fetch(`${API_BASE}/settings/llm`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  checkUnauthorized(res);
  if (!res.ok) throw new Error("Failed to update LLM settings");
  const json = await res.json();
  return json.data;
}

export async function clearLLMCache(token: string): Promise<{ cleared: boolean; entries_removed: number }> {
  const res = await fetch(`${API_BASE}/settings/llm/clear-cache`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  checkUnauthorized(res);
  if (!res.ok) throw new Error("Failed to clear cache");
  const json = await res.json();
  return json.data;
}

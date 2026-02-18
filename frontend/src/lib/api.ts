/**
 * API client for AISCA Movie Recommender backend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

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
}

export interface RecommendationResponse {
  recommendations: MovieRecommendationItem[];
  explanation: string;
}

export interface CatalogOptions {
  moods: string[];
  genres: string[];
  styles: string[];
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
  if (!res.ok) throw new Error("Unauthorized");
  const data = await res.json();
  return data;
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
  if (!res.ok) throw new Error("Failed to get recommendations");
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

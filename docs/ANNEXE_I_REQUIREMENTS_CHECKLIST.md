# Annexe I — Requirements Checklist (Thématiques alternatives acceptées)

**Source:** *Projet IA Générative — Agent Intelligent Sémantique et Génératif — Annexe I - Thématiques alternatives acceptées VFinale*  
**Context:** EFREI Data Engineering & AI 2025-26 — RNCP40875 Bloc 2 (Expert en ingénierie de données)

This document breaks down all requirements from Annexe I into **Required**, **Recommended**, and **Optional** checkpoints for the AISCA project (including the *Recommandation de films* theme).

---

## Document role

- Annexe I **does not replace** the main AISCA subject.
- It describes **accepted alternative themes** (cinema, music, health, books, wine, perfumes, etc.) and how to **transpose** the same methodology to another domain.
- **All technical, pedagogical, and evaluation criteria** remain defined in the **main AISCA document**; the annex only clarifies thematic variants and transposition.

---

## Legend: Required vs Recommended vs Optional

| Level | Meaning | In annex wording |
|-------|--------|------------------|
| **Required** | Mandatory for validation | "doit", "obligatoire", "impérativement", "strictement", "au minimum" |
| **Recommended** | Expected for a complete, professional solution | "recommandé", "doit permettre", "peut notamment", "idéalement" |
| **Optional** | Nice-to-have, explicitly facultative | "optionnel", "facultatif", "éventuellement", "peut compléter" |

---

## 1. General cahier des charges (all themes)

### 1.1 Analysis & semantics

| # | Checkpoint | Level | Notes |
|---|------------|--------|--------|
| 1.1.1 | Analysis is **contextual and semantic**, not purely numerical | **Required** | Scores must reflect meaning, not only counts or ratings. |
| 1.1.2 | User inputs mapped to "blocs" via **word or contextual embeddings** (e.g. Word2Vec, GloVe, fastText, BERT, **SBERT**) | **Required** | SBERT (contextual) is the expected choice in AISCA. |
| 1.1.3 | Use **similarity measures** (cosine similarity, semantic clustering) | **Required** | Cosine similarity with embeddings is the baseline. |
| 1.1.4 | **Coverage score** computed from several blocks (weights, thresholds, or aggregation rules) | **Required** | Single scalar or composite score combining multiple dimensions. |
| 1.1.5 | System produces a **user profile** and **suggests ordered recommendations** (e.g. top 3) | **Required** | Profile = encoded preferences; output = ranked list. |

### 1.2 Questionnaire & user inputs

| # | Checkpoint | Level | Notes |
|---|------------|--------|--------|
| 1.2.1 | **Hybrid questionnaire**: free text + auto-declaration (e.g. Likert) + guided questions | **Required** | Not only multiple choice; must include free text and scales. |
| 1.2.2 | Answers stored in a **structured format** usable by the semantic engine | **Required** | Consistent schema (e.g. JSON, CSV, DB). |
| 1.2.3 | User expresses preferences in **natural language** and completes profile progressively | **Recommended** | Improves UX and alignment with "système expert en langage naturel". |

### 1.3 Referential & data

| # | Checkpoint | Level | Notes |
|---|------------|--------|--------|
| 1.3.1 | **Structured referential** with categories and **rich text descriptions** for semantic analysis | **Required** | E.g. FilmID, blocks, categories, narrative description, keywords. |
| 1.3.2 | Data organized so that **semantic similarity** can be computed between user and referential items | **Required** | Same embedding space for user and referential. |
| 1.3.3 | Referential built and **versioned** (e.g. via Git) | **Recommended** | Reproducibility and traceability. |

### 1.4 Scoring & recommendation

| # | Checkpoint | Level | Notes |
|---|------------|--------|--------|
| 1.4.1 | **Global proximity / affinity score** between user inputs and referential elements | **Required** | Single or composite score. |
| 1.4.2 | **Ranking by relevance** (e.g. top 3 recommendations) | **Required** | Ordered list, not unordered set. |
| 1.4.3 | Scoring logic allows **reproducible** ordering (weights, thresholds, or explicit rules) | **Recommended** | Documented formula (e.g. weighted sum of block scores). |

### 1.5 Generative AI (GenAI)

| # | Checkpoint | Level | Notes |
|---|------------|--------|--------|
| 1.5.1 | **GenAI integration is mandatory** | **Required** | At least one controlled use of an LLM/GenAI API. |
| 1.5.2 | GenAI use **limited and targeted** (e.g. enrich short inputs, explain recommendation, summarize profile) | **Required** | Not open-ended generation; defined use cases. |
| 1.5.3 | **Responsible and cost-aware** use (e.g. local model, caching, limited calls) | **Required** | Aligns with "sécurisation et gestion responsable". |
| 1.5.4 | GenAI can **enrich short user descriptions** | **Recommended** | Improves robustness for minimal input. |
| 1.5.5 | GenAI used to **explain or justify** the recommendation | **Recommended** | Natural-language explanation of why items were chosen. |
| 1.5.6 | GenAI used to **synthesize user profile** (e.g. "profil cinéphile") | **Optional** | Nice-to-have for presentation. |

### 1.6 Application & delivery

| # | Checkpoint | Level | Notes |
|---|------------|--------|--------|
| 1.6.1 | **Web interface** (e.g. Streamlit or equivalent) or API consumable by a front-end | **Required** | "Interface web" — at least one way for a user to interact. |
| 1.6.2 | **Pipeline** from data → preprocessing → embeddings → scoring → recommendation → GenAI | **Required** | End-to-end pipeline, not isolated scripts. |
| 1.6.3 | **Documentation** of the solution (technical report, README, or similar) | **Required** | For RNCP and grading. |
| 1.6.4 | **Submission** on Moodle + Git/GitHub within deadline | **Required** | Per annex instructions. |
| 1.6.5 | **Team of two** (binôme) | **Required** | Stated in the annex. |

---

## 2. RNCP40875 Bloc 2 — Competencies (mobilized in the project)

These are **evaluated in the main subject**; the annex recalls that the project contributes to Bloc 2.

| # | Competency | Level | Checkpoint |
|---|------------|--------|------------|
| 2.1 | Collect, analyze, and prepare **structured and unstructured data** | **Required** | Data pipeline (raw → referential → embeddings). |
| 2.2 | Design and implement **Data Science / NLP / AI** models | **Required** | Embeddings, similarity, scoring, recommendation logic. |
| 2.3 | **Evaluate and optimize** models | **Recommended** | E.g. choice of weights, model, or metrics. |
| 2.4 | **Prototype** IA solution (API, NLP, RAG, embeddings, GenAI) | **Required** | Working prototype with all components. |
| 2.5 | Develop **end-to-end data pipelines** | **Required** | From raw data to recommendation and explanation. |
| 2.6 | **Industrialize** (architecture, performance, cost constraints) | **Recommended** | Design for clarity, performance, cost. |
| 2.7 | **Document and present** a complete technical solution | **Required** | Report + oral presentation. |
| 2.8 | **Teamwork** | **Required** | Binôme. |
| 2.9 | **Securing and responsible use** of generative AI | **Required** | Limited, controlled GenAI as per annex. |

---

## 3. Theme-specific: Recommandation de films (cinema)

### 3.1 User inputs (movie theme)

| # | Checkpoint | Level | Notes |
|---|------------|--------|--------|
| 3.1.1 | **Free text**: desired film, ambiance, style, emotions | **Required** | At least one free-text field. |
| 3.1.2 | **Auto-declaration** of preferences by genre (e.g. Likert scale) | **Required** | Intensity or preference levels. |
| 3.1.3 | **Guided questions**: e.g. directors, period, mood | **Recommended** | Structured optional questions. |

### 3.2 Referential (movie theme)

| # | Checkpoint | Level | Notes |
|---|------------|--------|--------|
| 3.2.1 | **Minimum 50 films** in the referential | **Required** | Hard minimum for cinema theme. |
| 3.2.2 | Referential includes: **genres**, **styles**, **moods**, **themes**, **synopses**, **keywords** | **Required** | Rich enough for semantic matching. |
| 3.2.3 | Structure in the spirit of: `FilmID \| BlockID \| Catégorie \| Film \| Description narrative \| Keywords` | **Recommended** | Equivalent structure (e.g. Mood/Theme/Style as blocks) is acceptable. |

### 3.3 Semantic analysis & scoring (movie theme)

| # | Checkpoint | Level | Notes |
|---|------------|--------|--------|
| 3.3.1 | **SBERT embeddings** for user and referential | **Required** | Contextual embeddings. |
| 3.3.2 | **Cosine similarity** (or equivalent) for affinity | **Required** | Standard choice. |
| 3.3.3 | **Affinity / coverage score** and **ranking** of recommendations | **Required** | Top N (e.g. top 3). |

### 3.4 GenAI (movie theme)

| # | Checkpoint | Level | Notes |
|---|------------|--------|--------|
| 3.4.1 | **Enrich short descriptions** (optional use) | **Recommended** | When user input is too brief. |
| 3.4.2 | **Write justification** of the recommendation | **Recommended** | Main expected GenAI output. |
| 3.4.3 | **Short “cinéphile” profile** (synthesis) | **Optional** | Extra if time permits. |

---

## 4. Other themes (brief reference)

The annex also describes: **medical orientation** (symptoms → specialty), **book recommendation**, **music/playlists**, **wine (énologie)**, **perfumes**. For those themes, the same **Required / Recommended / Optional** logic applies, with theme-specific minima (e.g. 40+ symptoms, 15+ specialties for medical; 60+ books; 70+ entries for music; wine/perfume referential structure). **Optional:** e.g. conversational chatbot for perfumes.

---

## 5. Self-assessment checklist (Recommandation de films)

Use this to verify coverage before submission.

### Required (must have)

- [ ] Semantic analysis (SBERT or equivalent), not only numerical scores.
- [ ] Cosine similarity (or equivalent) between user and referential embeddings.
- [ ] Coverage / affinity score combining several blocks (e.g. mood, theme, style, description).
- [ ] At least **50 films** in the referential with rich text (synopsis, keywords, etc.).
- [ ] **Hybrid questionnaire**: free text + Likert-style (or similar) + at least some guided questions.
- [ ] User answers in a **structured format** used by the engine.
- [ ] **Top N** ordered recommendations (e.g. top 3).
- [ ] **GenAI** integrated in a **limited, defined** way (e.g. explanation only).
- [ ] **Web interface** or API usable by a front-end.
- [ ] **End-to-end pipeline** (data → referential → embeddings → scoring → recommendation → GenAI).
- [ ] **Documentation** (e.g. README + technical report).
- [ ] **Moodle + Git/GitHub** submission, **binôme**, deadline respected.

### Recommended (should have)

- [ ] Clear **weighting** (or rules) for the coverage score, documented.
- [ ] GenAI used to **justify** recommendations.
- [ ] Referential structure **equivalent** to FilmID + blocks + categories + description + keywords.
- [ ] **Guided questions** (e.g. director, period, mood) in addition to free text and scales.
- [ ] **Responsible** GenAI use (e.g. local model, few calls).

### Optional (nice to have)

- [ ] GenAI to **enrich** very short user descriptions.
- [ ] GenAI to produce a **short cinéphile profile**.
- [ ] Extra UI/UX polish or optional modules (e.g. filters, history).

---

## 6. References

- **Main subject:** *Analyse Sémantique pour la Cartographie des Compétences et la Recommandation de Métiers / AISCA : Agent Intelligent Sémantique et Génératif pour la Cartographie des Compétences* (full requirements and grading).
- **Annexe I:** *Projet IA Générative — Agent Intelligent Sémantique et Génératif — Annexe I - Thématiques alternatives acceptées VFinale* (this checklist’s source).
- **RNCP40875** — Bloc 2: *Piloter et implémenter des solutions d’IA en s’aidant notamment de l’IA générative.*

---

*Document generated for the AISCA movie recommender project. Complete grading criteria and detailed expectations remain in the main AISCA subject.*

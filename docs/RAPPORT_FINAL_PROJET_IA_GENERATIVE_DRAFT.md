# Rapport Final - Projet IA Generative

## 1. Page de garde

**Informations completees pour votre page de garde**

- Etablissement: **EFREI PARIS**
- Formation: Mastère Data Engineering et IA
- Annee universitaire: 2025-2026
- Projet (titre): **AISCA Movie Recommender - Agent de recommandation semantique et generatif**
- Etudiants (binome): **CHUEMBOU MBAH ADRIEN DUVAL** & **QUAND DAT LE**
- Tuteur/Tutrice (selon le guide): **Sarah Malaeb**
- Date: [JJ/MM/AAAA]
- Mention obligatoire: **Projet certifiant RNCP40875 Expert en Ingenierie de Donnees - Bloc 2 : Pilotage et implementation de solutions IA**

**Description d'image a inserer (Page de garde):**
"Mise en page sobre avec le logo EFREI en haut de page (fichier: `C:\\Users\\Adrien Duval\\Downloads\\Efrei-logo-couleur.svg`), puis titre du projet, noms des auteurs, formation, tuteur/tutrice et annee."

---

## 2. Resume executif (1 page)

Ce projet propose un moteur de recommandation de films base sur une approche hybride entre **NLP semantique** (SBERT + similarite cosinus + score multicritere) et **IA generative** (LLM via Ollama / Claude / Gemini).

L'objectif principal est de convertir un besoin utilisateur formule en langage naturel en recommandations films pertinentes, explicables et classables (Top-3), tout en respectant des contraintes de cout et de gouvernance.

La solution implementee comprend:

1. Un pipeline offline de preparation des donnees et de calcul d'embeddings.
2. Un pipeline online de profilage utilisateur, scoring semantique et ranking.
3. Une couche GenAI pour enrichissement de requetes courtes et justification textuelle.
4. Une API FastAPI complete (auth JWT, recommandations, presets, historique, settings runtime LLM).
5. Une interface web (Next.js) permettant une demonstration fonctionnelle de bout en bout.

Resultats principaux:

- Recommandations personnalisees basees sur 4 axes semantiques (Mood, Theme, Style, Description).
- Score global AISCA pondere et interpretable.
- Generation d'une explication et d'un profil cinephile.
- Systeme de cache LLM (TTL + taille max) pour reduire latence/cout.
- Ajout d'une logique de presets et historique utilisateur pour la soutenance et la reproductibilite.

Technologies majeures:

- **Sentence-BERT** (`all-MiniLM-L6-v2`) pour embeddings
- **Scikit-learn** pour similarite cosinus
- **FastAPI** pour l'API
- **Next.js/React** pour le front
- **LLM runtime switchable**: Ollama, Anthropic Claude, Gemini

---

## 3. Introduction et contexte

### 3.1 Problematique

Le besoin metier est de recommander rapidement des films adaptes aux gouts d'un utilisateur, meme lorsque sa demande est floue ou partielle. Une approche par mots-cles simples ou filtrage classique est insuffisante pour capturer:

- la nuance emotionnelle (mood),
- la composante thematique,
- le rythme narratif (style),
- et la description libre utilisateur.

### 3.2 Cadre theorique

Le projet s'inscrit dans une architecture de recommandation semantique:

- Representation vectorielle du texte (embeddings SBERT).
- Mesure de proximite via cosinus.
- Aggregation ponderee multicritere.
- Couche generative pour explicabilite et enrichissement.

### 3.3 Pourquoi ces choix IA

- **SBERT**: compromis qualite/performance pour du texte court-moyen et des environnements non-GPU.
- **Cosinus**: metrique standard, interpretable, stable pour espaces d'embeddings denses.
- **GenAI controlee**: usage limite (enrichissement + justification), pour eviter surcout API et maintenir la maitrise.
- **RAG-like grounding**: les sorties generatives sont contraints par le Top-N calcule.

### 3.4 Positionnement pedagogique

Le projet illustre les competences attendues d'un pipeline IA complet:

- data preparation,
- modelisation semantique,
- service API industrialisable,
- evaluation qualitative,
- gestion du cout et gouvernance.

---

## 4. Analyse du besoin utilisateur

### 4.1 Persona cible

Utilisateur final type:

- cherche une recommandation film rapide,
- n'a pas necessairement de titre en tete,
- exprime des preferences via texte + choix guides.

### 4.2 Objectifs utilisateur

1. Trouver 3 films pertinents rapidement.
2. Comprendre **pourquoi** ces films sont proposes.
3. Ajuster ses preferences en iteratif.

### 4.3 Scenarios d'usage

- **Scenario A (demande detaillee):**
  "Je veux un thriller SF sombre avec dilemmes moraux IA."
  -> Le systeme privilegie theme+description+style.

- **Scenario B (demande courte):**
  "film triste"
  -> Enrichissement GenAI puis scoring.

- **Scenario C (demo preset):**
  L'utilisateur clique un preset (ex: `dark-crime-thriller`) pour demonstration immediate.

### 4.4 Contraintes et hypotheses

- Dataset statique local (pas d'ingestion temps reel).
- Pas de fine-tuning supervise SBERT dans cette version.
- Auth simplifiee (user demo JWT).
- API LLM cloud potentiellement indisponible -> fallback local Ollama.

---

## 5. Methodologie de travail et gestion de projet

### 5.1 Approche

Approche hybride proche Kanban/Agile:

- increments fonctionnels courts (pipeline, API, UI, settings),
- validations frequentes via tests manuels API + front,
- documentation continue.

### 5.2 Decoupage macro des lots

1. Nettoyage/structuration donnees.
2. Pipeline embeddings.
3. Scoring AISCA.
4. API et schemas.
5. Frontend de demonstration.
6. Couche GenAI et cache.
7. Historique + settings runtime.
8. Documentation soutenance.

### 5.3 Outils de collaboration

- Git/GitHub pour versionning
- Issues/branches (selon pratique d'equipe)
- Documentation technique dans `PROJECT_DOCUMENTATION.md`

### 5.4 Gestion des risques

- Risque latence LLM -> cache + provider switch.
- Risque bruit semantique -> blocage en 4 dimensions + pondération.
- Risque indisponibilite cloud -> fallback Ollama local.
- Risque comprehension utilisateur -> explication GenAI + radar charts.

**Description d'image a inserer:**
"Capture du board de suivi (Kanban/Trello/Notion) avec colonnes To Do / In Progress / Done."

---

## 6. Referentiel de donnees

### 6.1 Sources

- `data/raw/Database.csv`
- `data/raw/Database_Cleaned.csv`

### 6.2 Donnees cibles

Le referentiel final (`data/processed/movies_referential.csv`) contient:

- `FilmID`
- `Title`
- `Mood`
- `Theme`
- `NarrativeStyle`
- `EmotionalTone`
- `Description`
- `release_year`

### 6.3 Construction du referentiel

Le fichier `src/preprocessing/block_builder.py` extrait les blocs semantiques a partir d'une taxonomie:

```python
def extract_block(text, taxonomy):
    text = clean_text(text)
    detected = []
    for label, keywords in taxonomy.items():
        for word in keywords:
            if re.search(rf"\b{word}\b", text):
                detected.append(label)
                break
    return ", ".join(detected) if detected else "neutral"
```

Puis:

```python
df["Mood"] = df["Overview"].apply(lambda x: extract_block(x, MOOD_KEYWORDS))
df["Theme"] = df["Overview"].apply(lambda x: extract_block(x, THEME_KEYWORDS))
df["NarrativeStyle"] = df["Overview"].apply(lambda x: extract_block(x, STYLE_KEYWORDS))
df["Description"] = df["Overview"] + " Genre: " + df["Genre"]
```

### 6.4 Formats

- Input: CSV
- Sortie pipeline offline: CSV + NPY
- Echanges API: JSON
- Historique utilisateur: SQLite (`data/recommendation_history.db`)

**Description d'image a inserer:**
"Schema de donnees montrant la transformation Database_Cleaned.csv -> movies_referential.csv avec colonnes produites."

---

## 7. Pipeline IA et architecture (obligatoire)

### 7.1 Vue bout en bout

1. Collecte input utilisateur (questionnaire hybride)
2. Pre-traitement texte + structuration en 4 blocs
3. Encodage SBERT des films (offline) et de l'utilisateur (online)
4. Similarite cosinus bloc a bloc
5. Aggregation ponderee + recency
6. Ranking Top-N (Top 3)
7. Justification GenAI controlee

### 7.2 Pipeline offline

- Referential builder
- Embedding builder
- Sauvegarde `mood/theme/style/desc_embeddings.npy`

Code cle (`src/embedding/embedding_builder.py`):

```python
mood_embeddings = model.encode(df["Mood"].tolist(), convert_to_numpy=True)
theme_embeddings = model.encode(df["Theme"].tolist(), convert_to_numpy=True)
style_embeddings = model.encode(df["NarrativeStyle"].tolist(), convert_to_numpy=True)
desc_embeddings = model.encode(df["Description"].tolist(), convert_to_numpy=True)
```

### 7.3 Pipeline online

Encodage du profil utilisateur (`src/user_profile/profile_encoder.py`):

```python
mood_block = f"The user wants a {questionnaire.preferred_mood} mood with intensity level {questionnaire.mood_intensity}"
theme_block = f"The user prefers {questionnaire.preferred_genre} themes with interest level {questionnaire.theme_interest}"
style_block = f"The user enjoys {questionnaire.preferred_style} narrative pacing with interest level {questionnaire.style_interest}"
```

Scoring (`src/scoring/coverage_scorer.py`):

```python
final_score = (
    0.35 * mood_sim +
    0.25 * theme_sim +
    0.20 * style_sim +
    0.15 * desc_sim +
    0.05 * recency_score
)
```

### 7.4 Couche GenAI controlee

Dans `src/api/routers/recommendations.py`:

- enrichissement si description < 5 mots,
- generation explication + `CINEPHILE_PROFILE`,
- gestion erreurs/fallback,
- indicateur `cached`.

### 7.5 Modules additionnels

- Presets (`src/genAi/preset_queries.py`)
- Historique recommandations (`src/core/recommendation_history.py`)
- Settings runtime LLM (`src/core/llm_runtime_config.py` + router settings)

**Description d'image a inserer (pipeline principal):**
"Diagramme horizontal en 7 etapes: Questionnaire -> Preprocessing -> SBERT -> Cosine -> Scoring -> Top-3 -> GenAI justification."

**Description d'image a inserer (offline/online):**
"Deux colonnes: Offline (referential + embeddings) et Online (profilage + scoring + explication)."

---

## 8. Implementation technique (detaillee)

### 8.1 Architecture globale

- **Backend**: FastAPI (`src/api`)
- **Core IA**: preprocessing, embedding, scoring, recommendation
- **GenAI**: client multi-provider + prompts
- **Frontend**: Next.js (`frontend`)
- **Stockage**:
  - CSV/NPY pour la partie IA
  - SQLite pour historique

### 8.2 Technologies utilisees et justification

| Technologie | Role | Pourquoi ce choix |
| --- | --- | --- |
| Python | IA + API | Ecosysteme NLP/ML mature, lisible |
| sentence-transformers | Embeddings SBERT | Rapide a integrer, modeles pre-entraines fiables |
| scikit-learn | Similarite cosinus | Standard, stable, performant |
| pandas/numpy | Manipulation et calcul | Simplicite et efficacite |
| FastAPI | API REST | Typage, OpenAPI, productivite |
| Next.js + React | UI prototype | Experience moderne, composable |
| Ollama/Claude/Gemini | Generation | Flexibilite cout/qualite/disponibilite |
| SQLite | Historique | Leger, local, sans infra additionnelle |

### 8.3 Choix SBERT

Modele retenu: `sentence-transformers/all-MiniLM-L6-v2`

Arguments:

- bonne qualite semantique generaliste,
- vecteurs de taille moderee (384) -> rapidite/memoire,
- inference locale realiste sur machine etudiante.

Chargement (`src/embedding/sbert_loader.py`):

```python
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
```

### 8.4 Similarites et matrices

Pour chaque axe semantique:

```python
mood_sim = cosine_similarity([user_profile["mood"]], self.mood_emb)[0]
```

Puis normalisation min-max:

```python
def normalize(self, sim):
    return (sim - sim.min()) / (sim.max() - sim.min() + 1e-8)
```

### 8.5 Systeme de score et ponderations

Le score combine:

- pertinence semantique (95%)
- recence (5%) comme tie-breaker

Recence:

```python
recency_score = np.exp(-(self.current_year - year) / 10)
```

### 8.6 Logique metier de ranking

`src/recommendation/recommender.py`:

```python
ranked = self.df.sort_values(by="CoverageScore", ascending=False)
top3 = ranked.head(3)
```

Chaque recommandation expose les sous-scores pour l'explicabilite:

- `MoodScore`
- `ThemeScore`
- `StyleScore`
- `DescScore`
- `CoverageScore`

### 8.7 API GenAI et limitation des appels

`src/genAi/llm_client.py` implemente:

- cache en memoire SHA-256 sur prompt,
- TTL configurable,
- max size configurable avec eviction,
- support multi-provider.

Cache (extrait):

```python
if len(self._store) >= self.max_size and key not in self._store:
    oldest_key = min(self._store, key=lambda k: self._store[k][1])
    del self._store[oldest_key]
```

Usage controle:

- enrichissement uniquement si texte court,
- 1 appel principal pour explication+profil,
- endpoint de purge cache.

### 8.8 Interface utilisateur

Pages cles:

- `/recommend`: questionnaire + resultats + presets + historique
- `/settings`: choix provider, modeles, temperature, cache
- `/how-it-works`: visualisation pedagogique du pipeline

### 8.9 Depot Git et structure

Le projet est modulaire:

- `src/api` pour service web
- `src/preprocessing`, `src/embedding`, `src/scoring` pour IA
- `src/genAi` pour prompting et LLM
- `frontend` pour prototype utilisateur

Fichiers de config:

- `requirement.txt`
- `.env` / `.env.example`

### 8.10 Gouvernance et responsabilisation

Points implementes:

- Cache et limitation appels GenAI (cout/latence)
- Auth JWT sur endpoints sensibles
- Historisation des generations (traceabilite)
- Runtime switch provider (resilience)
- Separation nette data/logic/service/UI

Points a renforcer:

- Journalisation securite plus fine
- Evaluation biais sur recommandations
- politique RGPD formalisee si produit deploye

---

## 9. Interface utilisateur / prototype

### 9.1 Parcours principal

1. Login
2. Saisie des preferences
3. Lancement recommandation
4. Lecture Top-3 + explication + profil cinephile
5. Analyse radar scores

### 9.2 Elements visuels a presenter

- Questionnaire hybride (texte + chips + sliders)
- Liste Top-3 avec affiches
- Radar chart par film
- Panneau "How we score"
- Historique des recommandations
- Settings LLM (provider/cache)

**Descriptions d'images a inserer:**

1. "Capture de l'ecran questionnaire avec champs description, mood, genre, style et sliders."
2. "Capture des resultats Top-3 avec CoverageScore et sous-scores."
3. "Capture du radar chart comparant Mood/Theme/Style/Description."
4. "Capture de la page Settings montrant selection Ollama/Claude/Gemini."
5. "Capture de la section historique avec liste des generations precedentes."

---

## 10. Resultats et tests (demonstrations)

### 10.1 Protocole de test

Tests realises sur plusieurs types de profils:

- Profil noir/psychologique
- Profil aventure familial
- Profil science-fiction cerebral
- Profil fantasy epique

Les presets facilitent cette demonstration de maniere reproductible.

### 10.2 Exemples de cas

#### Cas A - Demande detaillee

- Input riche (> 5 mots)
- Pas d'enrichissement
- Explication orientee score semantique

#### Cas B - Demande courte

- Input court (< 5 mots)
- Enrichissement GenAI active
- Recalcul embeddings + ranking

#### Cas C - Preset

- Input predefini
- Reponse potentiellement servie depuis cache
- Latence reduite

### 10.3 Verification technique

- API health et docs OK
- Endpoints auth/recommend/settings/history operationnels
- Recommandations coherentes avec preferences
- Historique persiste par utilisateur
- Switch provider LLM sans redemarrage API

### 10.4 Traces et indicateurs utiles pour soutenance

- `description_enriched`
- `cached`
- `llm_provider`
- sous-scores par axe

**Description d'image a inserer (tableau tests):**
"Tableau comparatif 4 profils utilisateurs x Top-3 films x CoverageScore x bool enriched/cached."

**Description d'image a inserer (latence):**
"Bar chart comparant latence requetes avec cache hit vs cache miss."

---

## 11. Limites et pistes d'amelioration

### 11.1 Limites actuelles

1. **Taxonomie basee mots-cles**:
   sensible a la couverture lexicale et au vocabulaire.
2. **Pas de fine-tuning SBERT**:
   modele generaliste, non specialise cinema.
3. **Dataset local limite**:
   diversite potentiellement insuffisante.
4. **Dependance GenAI externe**:
   qualite variable, latence, cout cloud.
5. **Evaluation majoritairement qualitative**:
   peu de metriques supervisees (precision@k, NDCG, etc.).

### 11.2 Ameliorations IA/Data Science

- Vector DB (FAISS / Qdrant / Milvus) pour passage a l'echelle.
- Re-ranking cross-encoder pour meilleure precision finale.
- Fine-tuning SBERT sur corpus cinema annote.
- Evaluation offline formelle (precision@k, recall@k, MRR, NDCG).
- Calibration dynamique des poids selon type d'utilisateur.
- Detecteur de drift semantique et monitoring.

### 11.3 Ameliorations produit/ingenierie

- MLOps lightweight (versionnage modele/data + pipeline CI)
- tests automatises API + integration
- dashboard monitoring (latence, cache ratio, erreurs provider)
- durcissement securite et compliance.

---

## 12. Conclusion

Le projet realise un pipeline IA complet, de la donnee brute jusqu'a la recommandation expliquee:

- Construction d'un referentiel semantique,
- Embeddings SBERT multicritere,
- Scoring interpretable et robuste,
- Couche generative controlee pour explicabilite,
- API et interface utilisateur demonstrables.

Au-dela du prototype, le travail montre une maitrise combinee:

- **NLP applique** (embeddings, similarite, prompt grounding),
- **ingenierie data/ML** (offline/online split, persistence, cache),
- **software engineering** (API typed, auth, modularite),
- **vision produit** (UX explicative, settings, historique, demo-ready).

Ce projet illustre directement les competences cibles RNCP Bloc 2:
pilotage et implementation d'une solution IA exploitable, argumentee, et evolutive.

---

## 13. Annexes (optionnel)

### Annexe A - Arborescence projet

Utiliser la structure detaillee de `PROJECT_DOCUMENTATION.md` section "Project Structure".

### Annexe B - Extraits JSON API

- Exemple requete `POST /api/v1/recommendations`
- Exemple reponse avec `cached`, `llm_provider`, `cinephile_profile`

### Annexe C - Prompts GenAI utilises

1. Prompt d'enrichissement (`build_enrichment_prompt`)
2. Prompt de justification (`build_aisca_prompt`)

### Annexe D - Variables d'environnement

- JWT: `SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES`
- LLM: `LLM_PROVIDER`, `LLM_URL`, `LLM_MODEL`, `LLM_NUM_PREDICT`, `LLM_TEMPERATURE`
- Cloud: `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`
- Cache: `LLM_CACHE_TTL`, `LLM_CACHE_MAX_SIZE`

---

## Conseils de finalisation avant rendu

1. Ajouter les noms, tuteur, date sur la page de garde.
2. Remplacer chaque "Description d'image a inserer" par la capture reelle.
3. Ajouter 2-3 tableaux de resultats quantifies (scores, latence, cas d'usage).
4. Uniformiser la langue (100% francais ou 100% anglais) selon consigne enseignant.
5. Exporter PDF en style sobre (20-30 pages hors annexes).

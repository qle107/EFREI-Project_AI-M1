# Presentation 10 Minutes - CineWatch Movie Recommender

## Objectif de ce document

Ce document est un guide simple pour presenter le projet **CineWatch Movie Recommender** en **10 minutes**, en **francais simple**, tout en gardant les **termes techniques importants**.  
L'idee n'est pas de tout dire, mais de montrer:

- le probleme,
- la solution,
- les choix techniques,
- la demonstration,
- et la valeur du projet.

Conseil general: parle lentement, fais des phrases courtes, et annonce toujours ce que tu vas dire.  
Exemple: "D'abord, je vais presenter le besoin. Ensuite, je vais montrer l'architecture. Puis je terminerai par une demo et une conclusion."

---

## Structure conseillee pour 10 minutes

## 1. Introduction - 1 minute

### Ce que tu peux dire

"Bonjour, aujourd'hui je vais vous presenter notre projet **CineWatch Movie Recommender**, un systeme de recommandation de films base sur l'**IA semantique** et l'**IA generative**.  
Le but du projet est de recommander des films a partir d'une demande utilisateur exprimee en langage naturel, par exemple: *je veux un thriller de science-fiction sombre avec une atmosphere tendue*.  
Notre systeme transforme cette demande en profil utilisateur, compare ce profil avec une base de films, puis retourne les **3 meilleures recommandations** avec une **explication generee par IA**."

### Message cle

Tu dois poser tres vite les 3 idees suivantes:

- on part d'un texte libre utilisateur,
- on calcule une similarite semantique,
- on explique le resultat avec une couche generative.

---

## 2. Probleme et besoin - 1 minute

### Ce que tu peux dire

"Le probleme de depart est simple: les systemes classiques de recommandation utilisent souvent des filtres, des mots-cles, ou l'historique utilisateur. Mais ici, nous voulions comprendre une demande plus riche et plus nuancee.  
Par exemple, deux utilisateurs peuvent demander un film *de science-fiction*, mais l'un veut quelque chose de **sombre et lent**, et l'autre quelque chose de **dynamique et spectaculaire**.  
Donc un simple filtre par genre ne suffit pas. Il faut comprendre le **sens** de la demande."

### Phrase simple pour conclure cette partie

"Notre objectif etait donc de construire un moteur de recommandation plus intelligent, plus explicable, et plus proche du langage naturel."

---

## 3. Solution globale - 1 minute 30

### Ce que tu peux dire

"Notre solution repose sur une architecture en deux parties.  
Premiere partie: une couche de **recommandation semantique**.  
Deuxieme partie: une couche **generative** pour enrichir une demande courte et produire une explication lisible."

"Concretement, l'utilisateur remplit une interface web en plusieurs etapes: description libre, humeur, genre, style, et niveau d'importance de certains criteres.  
Ensuite, le backend transforme ces informations en representations vectorielles, calcule des scores de similarite avec les films de la base, puis classe les resultats.  
Enfin, un LLM genere une explication du type: *pourquoi ces films correspondent a votre profil*."

### Mots a prononcer absolument

- `frontend Next.js`
- `backend FastAPI`
- `SBERT`
- `cosine similarity`
- `score pondere`
- `LLM`

### Transition

"Je vais maintenant expliquer rapidement comment fonctionne le coeur technique."

---

## 4. Fonctionnement technique - 2 minutes 30

### Version simple a dire

"Le coeur du systeme repose sur **SBERT**, c'est-a-dire un modele de type Sentence-BERT.  
Ce modele transforme du texte en **vecteurs numeriques**, qu'on appelle aussi des **embeddings**.  
Le principe est que deux textes proches en sens auront des vecteurs proches dans l'espace mathematique."

"Dans notre projet, nous ne regardons pas seulement un seul critere. Nous avons travaille sur **4 axes semantiques**:

- le **mood**,
- le **theme**,
- le **style**,
- et la **description libre**.
"

"Pour chaque axe, nous comparons le profil utilisateur avec les embeddings des films grace a la **cosine similarity**.  
Ensuite, nous combinons les scores avec une formule ponderee pour obtenir un **score final de couverture**, que nous appelons le `coverage score`."

"Le classement final prend en compte principalement la composante semantique, et ajoute aussi un petit critere de **recency**, c'est-a-dire la fraicheur ou la date de sortie du film."

### Tu peux citer la logique des poids

"Dans notre version actuelle, le score combine plusieurs dimensions comme le mood, le theme, le style, la description, et un petit poids de recency.  
L'idee est d'avoir un systeme interpretable: on peut comprendre pourquoi un film est bien classe."

### Si on te demande "Pourquoi ce choix ?"

Tu peux repondre:

"Nous avons choisi cette approche parce qu'elle est a la fois **performante**, **interpretable** et **adaptée a du texte naturel**.  
SBERT permet de capturer le sens, la similarite cosinus est une mesure simple et robuste, et le score pondere permet d'ajuster l'importance des criteres utilisateur."

---

## 5. Couche generative et valeur ajoutee - 1 minute

### Ce que tu peux dire

"Nous avons aussi ajoute une couche d'**IA generative**.  
Elle ne sert pas a choisir les films a la place du moteur de recommandation.  
Elle sert surtout a deux choses:

- enrichir une demande trop courte,
- generer une explication naturelle pour l'utilisateur.
"

"Par exemple, si un utilisateur ecrit seulement *film triste*, le LLM peut enrichir la demande pour produire un profil plus exploitable.  
Ensuite, apres le ranking, le LLM explique pourquoi les films proposes correspondent au profil."

### Phrase importante

"Donc, l'IA generative est ici une **couche d'explicabilite et d'assistance**, pas le coeur du calcul de recommandation."

### Tu peux mentionner les providers

"Le projet permet de changer de provider LLM entre **Ollama**, **Claude** et **Gemini**, ce qui donne plus de flexibilite en termes de cout, de disponibilite et de demonstration."

---

## 6. Demo - 2 minutes

## Ce que tu dois montrer

Montre seulement un parcours simple. Ne montre pas tout.

### Demo conseillee

1. Montrer l'interface de recommandation.
2. Entrer une demande simple mais parlante.
3. Choisir `mood`, `genre`, `style`.
4. Lancer la recommandation.
5. Montrer les 3 films retournes.
6. Montrer rapidement les scores et l'explication IA.

### Exemple de phrase a dire pendant la demo

"Ici, l'utilisateur decrit ce qu'il veut regarder.  
Ensuite, il peut affiner avec des criteres guides comme l'humeur, le genre et le style narratif.  
Quand je lance la recommandation, le backend calcule les similarites semantiques et retourne un Top 3 avec une explication."

### Exemple de prompt demo

"I want a dark science-fiction thriller with mystery, moral dilemmas about AI, and a tense atmosphere."

Si tu veux parler en francais:

"Je veux un film de science-fiction sombre, avec du mystere, une atmosphere tendue, et des dilemmes moraux autour de l'intelligence artificielle."

### Si la demo bug

Dis calmement:

"La demonstration depend du serveur local, mais l'architecture et le pipeline restent les memes.  
Le principe est: saisie utilisateur, generation du profil, scoring semantique, puis explication par LLM."

---

## 7. Conclusion - 1 minute

### Ce que tu peux dire

"Pour conclure, ce projet montre qu'il est possible de construire un systeme de recommandation plus riche qu'un simple filtrage par mots-cles.  
Nous combinons ici une approche **semantique**, avec SBERT et similarite cosinus, et une approche **generative** pour enrichir et expliquer les resultats."

"Les points forts du projet sont:

- la personnalisation,
- l'explicabilite,
- l'architecture complete de bout en bout,
- et l'interface de demonstration."

"Comme perspectives, on pourrait ajouter une evaluation plus poussee, plus d'utilisateurs, un vrai historique de preferences, ou un modele encore plus specialise pour le domaine cinema."

### Derniere phrase simple

"Merci pour votre attention. Je peux maintenant repondre a vos questions."

---

## Gestion du temps conseillee

Voici un decoupage simple a respecter:

1. `0:00 - 1:00` Introduction
2. `1:00 - 2:00` Probleme et besoin
3. `2:00 - 3:30` Solution globale
4. `3:30 - 6:00` Fonctionnement technique
5. `6:00 - 7:00` Couche generative
6. `7:00 - 9:00` Demo
7. `9:00 - 10:00` Conclusion

### Regle importante

Si tu vois que tu parles trop, coupe les details mathematiques.  
Le jury doit surtout comprendre:

- quel est le besoin,
- comment fonctionne la solution,
- pourquoi c'est pertinent,
- et ce que vous avez effectivement implemente.

---

## Version tres simple si ton francais bloque

Tu peux utiliser ce script court presque mot pour mot.

### Script court

"Bonjour, je vais presenter notre projet CineWatch Movie Recommender.  
C'est un systeme de recommandation de films base sur l'IA semantique et l'IA generative.

Le probleme est que les recommandations classiques ne comprennent pas bien les demandes naturelles et nuancees des utilisateurs.  
Par exemple, deux personnes peuvent chercher un film de science-fiction, mais avec une ambiance differente.

Notre solution utilise SBERT pour transformer le texte en embeddings, puis nous comparons le profil utilisateur avec les films grace a la cosine similarity.  
Ensuite, nous calculons un score pondere selon plusieurs dimensions: mood, theme, style et description.

Nous avons aussi ajoute un LLM pour enrichir les demandes trop courtes et pour generer une explication lisible des recommandations.

Techniquement, nous avons un frontend en Next.js, un backend en FastAPI, et un moteur de scoring semantique.  
Le systeme retourne les 3 meilleurs films avec leurs scores et une justification.

Ce projet montre comment combiner NLP, recommandation semantique et IA generative dans une application complete et demonstrable.

Merci pour votre attention."

---

## Termes techniques expliques simplement

## SBERT

**SBERT** signifie **Sentence-BERT**.  
C'est un modele de traitement du langage qui transforme une phrase en vecteur numerique.  
L'avantage est qu'on ne compare plus seulement des mots exacts, mais le **sens global** d'une phrase.  
Dans notre projet, SBERT permet de representer les preferences utilisateur et les descriptions de films dans le meme espace semantique.

## Embedding

Un **embedding** est une representation numerique d'un texte.  
On peut imaginer cela comme une traduction du langage humain en coordonnees mathematiques.  
Deux phrases proches en sens auront des embeddings proches.  
C'est ce qui permet ensuite de mesurer la similarite entre une demande utilisateur et un film.

## Cosine Similarity

La **cosine similarity** est une mesure qui compare l'orientation de deux vecteurs.  
Plus la valeur est elevee, plus les deux textes sont proches semantiquement.  
Dans notre projet, on utilise cette mesure pour comparer le profil utilisateur avec les films sur plusieurs dimensions.

## Scoring pondere

Le **scoring pondere** consiste a combiner plusieurs scores avec des poids differents.  
Par exemple, si le mood est plus important que le style, il peut avoir un poids plus fort dans le calcul final.  
Cela permet de construire un systeme plus flexible et plus interpretable.

## NLP semantique

Le **NLP semantique** signifie que l'on cherche a comprendre le **sens** du texte, et pas seulement sa forme.  
Dans ce projet, cela permet de gerer des demandes comme "film sombre avec tension psychologique" sans avoir besoin d'une correspondance exacte mot a mot.

## LLM

Un **LLM**, ou **Large Language Model**, est un modele generatif capable de produire du texte naturel.  
Dans notre projet, il sert a enrichir des requetes courtes et a generer une explication lisible pour l'utilisateur.  
Il n'effectue pas le classement principal des films: il vient en support du moteur de recommandation.

## FastAPI

**FastAPI** est un framework Python pour construire des API rapidement et proprement.  
Dans notre projet, il gere les endpoints de login, de recommandations, d'historique et de parametres LLM.  
Il fait le lien entre le frontend et le moteur de recommandation.

## Next.js

**Next.js** est un framework frontend base sur React.  
Il nous permet de construire une interface web moderne pour guider l'utilisateur dans sa demande et afficher les recommandations.  
C'est la partie visible de l'application.

## API

Une **API** est une interface de communication entre deux parties du systeme.  
Ici, le frontend envoie une requete au backend, et le backend renvoie les recommandations et les explications.  
L'API permet donc de separer clairement l'interface utilisateur et la logique metier.

---

## Questions possibles du jury et reponses simples

## Pourquoi avoir choisi SBERT ?

"Parce que SBERT est bien adapte a la comparaison semantique de phrases. Il est plus pertinent qu'une simple recherche par mots-cles, et il reste raisonnable en cout de calcul."

## Pourquoi utiliser un LLM si vous avez deja un moteur de recommandation ?

"Le LLM ne remplace pas le moteur de recommandation. Il sert surtout a enrichir les requetes trop courtes et a rendre le resultat plus explicable pour l'utilisateur."

## Pourquoi avoir plusieurs dimensions comme mood, theme et style ?

"Parce qu'un film ne se resume pas a un seul genre. Deux films peuvent etre du meme genre mais avoir une ambiance ou un rythme tres differents."

## Comment calculez-vous le classement final ?

"Nous calculons des similarites semantiques sur plusieurs axes, puis nous combinons ces scores avec des poids pour produire un score final."

## Quelle est la valeur ajoutee de votre projet ?

"La valeur ajoutee est la combinaison entre personnalisation, explicabilite et interface demonstrable. Le systeme comprend mieux les demandes naturelles et explique ses recommandations."

---

## Conseils pratiques juste avant de passer

- Respire avant de commencer.
- Parle lentement.
- Fais des phrases courtes.
- Si tu bloques sur un mot, remplace-le par une phrase plus simple.
- N'essaie pas de tout memoriser: memorise surtout les transitions.
- Pendant la demo, explique ce que tu fais au lieu de rester silencieux.

### Transitions utiles

"Maintenant, je vais expliquer la partie technique."  
"Ensuite, je vais montrer rapidement la demonstration."  
"Enfin, je terminerai par les points forts et les perspectives."

---

## Phrase finale ultra simple

"Notre projet combine recommandation semantique et IA generative pour proposer des films de maniere plus intelligente, plus personnalisee et plus explicable."

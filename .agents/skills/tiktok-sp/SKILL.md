---
name: tiktok-sp
description: Montage des vidéos TikTok santé publique d'Aymeric (1-3 min, 9:16, sous-titres FR) à partir d'un rush déposé dans C:\Vidéo Tiktok SP\Montages\<AAAA-MM Sujet>\. Utiliser pour tout montage, retouche ou nouvelle version d'une de ces vidéos ; s'appuie sur short-form-edit, cut-silences et cut-mistakes en y ajoutant la charte et les étapes de validation.
---

# Montage TikTok santé publique (fork SP)

Surcouche de `short-form-edit`. Quand une règle ici contredit le playbook de Nate,
**cette skill gagne**. Tout se fait en français ; les messages à Aymeric sont
courts, structurés, et se terminent par ce qu'il doit valider.

## Sources de vérité

| Quoi | Où |
| --- | --- |
| Charte visuelle | `C:\Vidéo Tiktok SP\Charte\DESIGN.md` (lire en entier avant tout travail visuel) |
| Logo, polices | `Charte\logo\`, `Charte\polices\` |
| Scripts | `Script\<Sujet>.docx` |
| Projet d'une vidéo | `Montages\<AAAA-MM Sujet>\` : rush, versions, `visuels\`, `dispositions\` |
| Sources des visuels | `Montages\<sujet>\visuels\sources.csv` — `fichier;moment;source affichée;lien;droits` |
| Suivi | `Suivi vidéos.xlsx` |

Le dossier de la vidéo est le dossier de travail de référence. Si le kit tourne
ailleurs (cloud), copier le rush dans `video-projects/<slug>/` puis **rapporter
dans `Montages\<sujet>\`** chaque livrable : versions `.mp4`, transcription,
liste des coupes, `VERIFY.md`. Ne jamais commiter de média, transcript ou rendu
dans ce dépôt (il est public).

## Processus et validations

Ne pas enchaîner deux étapes marquées ✋ sans réponse d'Aymeric.

| # | Étape | Sortie | ✋ |
| --- | --- | --- | --- |
| 0 | Script : vérifier le fond (définitions exactes, chiffres sourcés avec année et champ, objections prévisibles), proposer 2-3 accroches | Notes de fond + accroches | ✋ script et accroche |
| 1 | Tournage — rappeler la check-list : 1 s de silence avant une reprise, espace au-dessus de la tête, lumière de face | — | |
| 2 | Probe du rush (durée, résolution, orientation, fps, audio) | — | |
| 3 | Transcription locale : `python scripts/transcribe-whisper-local.py <rush> --language fr` | `<rush>.json` | |
| 4 | Silences : `cut-silences` **avec `--video`** (affinage au volume réel, actif par défaut) | `.silenced.mp4` + transcript retimé | |
| 5 | Erreurs : `cut-mistakes` sur le transcript retimé ; relire tout le texte, signaler aussi les **erreurs de fond** dites à l'oral | Liste des coupes (timecodes source + raison) | ✋ liste des coupes |
| 6 | Plan éditorial : accroche → problème → explication → chute ; moments graphiques (1-2 max) ; visuels avec source | `PLAN.md` | ✋ plan |
| 7 | Visuels : télécharger l'original officiel, remplir `sources.csv` | `visuels\` | |
| 8 | Sous-titres selon la charte | Blocs de sous-titres | ✋ blocs |
| 9 | Son : niveaux homogènes, pas de musique par défaut | — | |
| 10 | Brouillon (`--quality draft`), contrôle (`VERIFY.md` : visages, zones de sécurité, flashs noirs, sync, raccords audio), puis rendu final | `<Sujet> - brouillon vN.mp4` puis `- vN.mp4` | ✋ brouillon |
| 11 | Ligne dans `Suivi vidéos.xlsx` ; chaque remarque d'Aymeric devient une règle (ci-dessous ou dans DESIGN.md) | — | |

Nommage des versions : `<Sujet> - montage vN.mp4`. Ne jamais écraser une version.

## Règles de charte validées (résumé — DESIGN.md fait foi)

- **Format** : 1080×1920, 30 i/s ; zones de sécurité TikTok (haut 150 px, droite 150 px sur la moitié basse, bas 330 px).
- **Graphiques = disposition D** : plein écran 3-4 s, 1-2 fois par vidéo. Entrée : zoom rapide sur le visage + léger flash blanc. Sortie : coupe franche + léger zoom arrière 0,5 s.
- **Image officielle intacte** (Insee, SPF…) : pas de redessin, pas de zoom sur le graphique, carte blanche à coins arrondis. Animation : points qui parcourent les courbes jusqu'à la dernière année, puis étiquettes des valeurs au bout des courbes dans leur couleur (ex. « 85,9 ans ♀ »).
- **Source toujours affichée** sous le graphique : « Source : organisme, indicateur, champ, période ».
- Dispositions écartées : écran partagé (B) et pastille (C) — on ne voit pas assez Aymeric.
- Sous-titres, rythme, accroche : réglages de DESIGN.md encore « à confirmer » — les appliquer, et demander confirmation au premier brouillon.

## Rigueur du fond (santé publique)

- Tout chiffre affiché : organisme, année, champ (France entière / métropole), statut (provisoire / définitif).
- Si l'oral contient une erreur de définition ou un chiffre faux, le signaler à l'étape 5 avec la correction et proposer : retournage du passage, coupe, ou correction par sous-titre/encart.
- Ne pas inventer de visuel « officiel » : seulement des images téléchargées depuis la source, avec lien dans `sources.csv`.

## Outils propres au fork

- `scripts/transcribe-whisper-local.py` — Whisper en local (pas de clé API).
- `scripts/lib/media-compat.mjs` — affinage des coupes sur le volume réel (`--no-audio-refine` pour désactiver) et compatibilité ffmpeg 6/7, utilisés par `cut-silences` et `cut-mistakes`.

## Journal des règles issues des retours

Ajouter ici chaque retour d'Aymeric transformé en règle, daté.

- 2026-10-19 — Les coupes de silence calées sur les horodatages du transcript coupaient des mots → coupes recalculées sur le volume réel du son.
- 2026-10-19 — Graphiques : disposition D retenue ; B et C écartées.

#!/usr/bin/env python3
"""
Correctif affichage mobile — à lancer à la racine du dépôt : python3 correctif-mobile.py
Chaque correction cherche un texte précis dans le fichier ; si le texte n'est pas trouvé
(fichier déjà modifié), elle est ignorée et signalée, sans toucher au reste.
"""
import re, sys, os

done, skipped = 0, 0

def edit(path, old, new, label, count=1, regex=False):
    global done, skipped
    if not os.path.exists(path):
        print(f"  ⚠️  {label} : {path} introuvable"); skipped += 1; return
    t = open(path, encoding="utf-8").read()
    if new in t and not regex:
        print(f"  ·  {label} : déjà appliqué"); return
    if regex:
        t2, n = re.subn(old, new, t, count=count, flags=re.M)
        ok = n > 0
    else:
        ok = old in t
        t2 = t.replace(old, new, count) if ok else t
    if not ok:
        print(f"  ⚠️  {label} : texte à modifier introuvable dans {path}"); skipped += 1; return
    open(path, "w", encoding="utf-8").write(t2); done += 1
    print(f"  ✓  {label}")

print("1. Balise viewport")
edit("src/layouts/Layout.astro",
     '<meta name="viewport" content="width=device-width" />',
     '<meta name="viewport" content="width=device-width, initial-scale=1" />',
     "viewport avec initial-scale=1")

print("2. Lien « ← Changer de niveau » (16 px de haut en portrait)")
edit("src/layouts/Layout.astro",
     "  .back-link {\n    display: inline-block;\n    margin-top: 0.5rem;",
     "  .back-link {\n    display: inline-flex;\n    align-items: center;\n    min-height: 40px;\n    padding: 0 0.5rem;\n    margin-top: 0.5rem;",
     "zone tactile du lien de retour (40 px)")

print("3. Menus déroulants qui dépassent de la carte (quiz Timbre, Plans sonores…)")
for f in ("FuzeauQuiz", "PlansSonoresQuiz"):
    p = f"src/components/{f}.astro"
    edit(p, "  .fuzeau-card .filter-group {\n    display: flex;\n    align-items: center;\n    gap: 0.5rem;\n  }",
         "  .fuzeau-card .filter-group {\n    display: flex;\n    align-items: center;\n    gap: 0.5rem;\n    min-width: 0;\n    max-width: 100%;\n  }",
         f"{f} : groupe de filtre")
    edit(p, "    border-radius: 6px;\n    font-size: 0.85rem;\n  }\n\n  /* --- Progression --- */",
         "    border-radius: 6px;\n    font-size: 0.85rem;\n    min-width: 0;\n    max-width: 100%;\n    text-overflow: ellipsis;\n  }\n\n  /* --- Progression --- */",
         f"{f} : menu déroulant limité à la carte")

print("4. Séquenceur Rap : barre de commandes qui déborde sous 720 px")
edit("src/components/RapCourse.astro",
     "  .bpm-control input[type=\"range\"] {",
     "  @media (max-width: 720px) {\n    .seq-top-controls {\n      flex-wrap: wrap;\n      justify-content: center;\n    }\n    .bpm-control {\n      flex-wrap: wrap;\n      justify-content: center;\n      white-space: normal;\n    }\n    .bpm-control input[type=\"range\"] {\n      width: min(220px, 100%);\n    }\n  }\n\n  .bpm-control input[type=\"range\"] {",
     "RapCourse : retour à la ligne des commandes")

print("5. Boutons principaux trop plats")
edit("src/components/HymneVideoAnalyzer.astro",
     "  .fuzeau-card .btn-validate-full {\n    width: 100%;",
     "  .fuzeau-card .btn-validate-full {\n    min-height: 44px;\n    width: 100%;",
     "Hymnes : « Valider mon analyse » (18 px → 44 px)")
edit("src/components/QuizOpera.astro",
     "  #operaQuiz .qo-btn-quit {\n    padding: 0.35rem 0.7rem;",
     "  #operaQuiz .qo-btn-quit {\n    min-height: 36px;\n    padding: 0.35rem 0.7rem;",
     "Opéra : « Recommencer »")
edit("src/components/RapCourse.astro", "  .preset-btn {\n", "  .preset-btn {\n    min-height: 38px;\n", "Rap : boutons de styles")
edit("src/components/DualAudioPlayer.astro", "  .dual-ghost {\n", "  .dual-ghost {\n    min-height: 36px;\n", "Lecteur double : Reset")
edit("src/components/RockStageBuilder.astro", "  .stage-reset {\n", "  .stage-reset {\n    min-height: 36px;\n", "Rock : retirer les éléments")
edit("src/components/RockStageBuilder.astro", "  .gallery-reset {\n", "  .gallery-reset {\n    min-height: 36px;\n", "Rock : reset des styles")
edit("src/components/MoyenAgeCourse.astro", "  .score-open {\n", "  .score-open {\n    min-height: 38px;\n", "Moyen Âge : voir la partition")
edit("src/components/PulseVsRythme.astro", "  .pulse-rhythm-tool .action-sub-btn {\n", "  .pulse-rhythm-tool .action-sub-btn {\n    min-height: 36px;\n",
     "Pulsation/Rythme : mélanger")

print("6. Hauteur d'écran mobile (barre d'adresse) — fenêtres Moyen Âge")
edit("src/components/MoyenAgeCourse.astro", "    max-height: calc(100vh - 2rem);\n",
     "    max-height: calc(100vh - 2rem);\n    max-height: calc(100dvh - 2rem);\n", "Moyen Âge : fenêtre partition (dvh)")
edit("src/components/MoyenAgeCourse.astro", "    max-height: calc(100vh - 13rem);\n",
     "    max-height: calc(100vh - 13rem);\n    max-height: calc(100dvh - 13rem);\n", "Moyen Âge : liste (dvh)")


print("7. Séquenceur Rap : rendre le défilement horizontal évident (indice + noms de pistes fixes)")
RAP = "src/components/RapCourse.astro"
edit(RAP,
     '            <!-- Grille du Séquenceur -->\n            <div class="sequencer-grid">',
     '            <!-- Grille du Séquenceur -->\n            <p class="seq-scroll-hint" id="seq-scroll-hint" hidden aria-hidden="true">↔ Fais glisser la grille pour voir les 16 temps</p>\n            <div class="sequencer-grid" id="sequencer-grid">',
     "Rap : phrase d'indice (visible seulement si la grille déborde)")
edit(RAP,
     "  .sequencer-grid {\n    display: flex;\n    flex-direction: column;\n    gap: 0.5rem;\n    overflow-x: auto;\n  }\n",
     """  .sequencer-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* Fondu sur le bord droit tant qu'il reste des temps à découvrir (géré par le script) */
  .sequencer-grid[data-fade~="right"] {
    -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 36px), transparent);
    mask-image: linear-gradient(to right, #000 calc(100% - 36px), transparent);
  }

  .seq-scroll-hint {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 600;
    color: #38bdf8;
    text-align: center;
  }
  .seq-scroll-hint[hidden] { display: none; }

  /* Les noms de pistes restent visibles quand on fait défiler la grille */
  .grid-header,
  .seq-row {
    width: max-content;
    min-width: 100%;
  }
  .track-label,
  .track-label-empty {
    position: sticky;
    left: 0;
    z-index: 2;
    background: #1e293b;
    padding-right: 0.4rem;
    box-shadow: 6px 0 6px -2px #1e293b;
  }
""",
     "Rap : fondu, indice et noms de pistes fixes (CSS)")
edit(RAP,
     "\n</style>",
     """
  /* Petits écrans : colonne des noms plus étroite pour montrer plus de temps */
  @media (max-width: 640px) {
    .grid-header,
    .seq-row {
      grid-template-columns: 96px repeat(16, minmax(26px, 1fr));
    }
    .track-label {
      white-space: normal;
      font-size: 0.75rem;
      line-height: 1.2;
    }
  }
</style>""",
     "Rap : colonne des noms plus étroite sur petit écran")
edit(RAP,
     "      stepBtns.forEach((btn) => btn.classList.remove('active'));\n    });\n  }\n</script>",
     """      stepBtns.forEach((btn) => btn.classList.remove('active'));
    });
  }

  // Indice de défilement : fondu à droite tant qu'il reste des temps, phrase jusqu'au premier glissement
  (function () {
    const grid = document.getElementById('sequencer-grid');
    const hint = document.getElementById('seq-scroll-hint');
    if (!grid) return;
    let swiped = false;
    const update = () => {
      const max = grid.scrollWidth - grid.clientWidth;
      const atEnd = grid.scrollLeft >= max - 4;
      if (max > 4 && !atEnd) grid.dataset.fade = 'right';
      else delete grid.dataset.fade;
      if (hint) hint.hidden = !(max > 4) || swiped;
    };
    grid.addEventListener('scroll', () => {
      if (grid.scrollLeft > 8) swiped = true;
      update();
    }, { passive: true });
    window.addEventListener('resize', update);
    if ('ResizeObserver' in window) new ResizeObserver(update).observe(grid);
    update();
  })();
</script>""",
     "Rap : script de l'indice de défilement")

print(f"\n{done} correction(s) appliquée(s), {skipped} ignorée(s).")
print("Suite : npx astro check && npm run build, puis git diff pour relire.")
sys.exit(0)

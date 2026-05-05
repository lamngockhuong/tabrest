🇬🇧 [English](README.md) • 🇻🇳 [Tiếng Việt](README.vi.md) • 🇪🇸 [Español](README.es.md) • 🇧🇷 [Português](README.pt-BR.md) • 🇯🇵 [日本語](README.ja.md) • 🇨🇳 [简体中文](README.zh-CN.md) <br>
🇰🇷 [한국어](README.ko.md) • 🇩🇪 [Deutsch](README.de.md) • 🇫🇷 **Français** • 🇷🇺 [Русский](README.ru.md) • 🇮🇩 [Bahasa Indonesia](README.id.md)

<p align="center">
  <img src="icons/icon-128.png" alt="TabRest Logo" width="128" height="128">
</p>

<h1 align="center">TabRest</h1>

<p align="center">
  Reposez vos onglets, libérez votre mémoire - une extension Chrome qui décharge automatiquement les onglets inactifs.
</p>

<p align="center">
  <a href="https://chromewebstore.google.com/detail/tabrest-rest-your-tabs-fr/agajndkecodedlklmpnjgikglkpeopib">
    <img src="https://img.shields.io/chrome-web-store/v/agajndkecodedlklmpnjgikglkpeopib?label=chrome&style=flat-square&logo=googlechrome&logoColor=white&color=4285F4" alt="Chrome Web Store Version">
  </a>
  <a href="https://chromewebstore.google.com/detail/tabrest-rest-your-tabs-fr/agajndkecodedlklmpnjgikglkpeopib">
    <img src="https://img.shields.io/chrome-web-store/users/agajndkecodedlklmpnjgikglkpeopib?style=flat-square&color=6ee7b7" alt="Chrome Web Store Users">
  </a>
  <a href="https://chromewebstore.google.com/detail/tabrest-rest-your-tabs-fr/agajndkecodedlklmpnjgikglkpeopib">
    <img src="https://img.shields.io/chrome-web-store/rating/agajndkecodedlklmpnjgikglkpeopib?style=flat-square&color=facc15" alt="Chrome Web Store Rating">
  </a>
  <a href="https://github.com/lamngockhuong/tabrest/actions/workflows/ci.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/lamngockhuong/tabrest/ci.yml?style=flat-square&label=CI&color=22c55e" alt="CI">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/github/license/lamngockhuong/tabrest?style=flat-square&color=60a5fa" alt="MIT License">
  </a>
  <a href="https://github.com/lamngockhuong/tabrest/stargazers">
    <img src="https://img.shields.io/github/stars/lamngockhuong/tabrest?style=flat-square&color=f59e0b" alt="GitHub Stars">
  </a>
</p>

<p align="center">
  <a href="https://chromewebstore.google.com/detail/tabrest-rest-your-tabs-fr/agajndkecodedlklmpnjgikglkpeopib">
    <img src="https://img.shields.io/badge/Install_from-Chrome_Web_Store-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Install from Chrome Web Store">
  </a>
  <a href="https://tabrest.ohnice.app">
    <img src="https://img.shields.io/badge/Visit-Website-8957e5?style=for-the-badge&logo=astro&logoColor=white" alt="Website">
  </a>
</p>

<p align="center">
  <a href="https://unikorn.vn/p/tabrest?ref=embed-tabrest" target="_blank"><img src="https://unikorn.vn/api/widgets/badge/tabrest?theme=light" alt="TabRest on Unikorn.vn" width="200" height="50" /></a>
  &nbsp;
  <a href="https://launch.j2team.dev/products/tabrest?utm_source=badge-launched&utm_medium=badge&utm_campaign=badge-tabrest" target="_blank" rel="noopener noreferrer"><img src="https://launch.j2team.dev/badge/tabrest/neutral" alt="TabRest - Launched on J2TEAM Launch" width="200" height="43" /></a>
</p>

## Fonctionnalités

- **Déchargement automatique des onglets inactifs** - Minuteur configurable (5 min à 4 h)
- **Seuil de mémoire** - Décharge les onglets lorsque la RAM dépasse 60-95 %
- **Limite mémoire par onglet** - Décharge les onglets utilisant plus de 100 Mo à 1 Go de JS heap
- **Déchargement au démarrage** - Libère la mémoire à l'ouverture du navigateur
- **Contrôles manuels** - Décharger l'onglet actuel, les onglets à gauche, à droite ou les autres
- **Fermer les onglets en double** - Dédoublonnage en un clic dans la fenêtre actuelle
- **Recherche d'onglets** - Filtrage en direct de la liste des onglets par titre ou URL
- **Groupes d'onglets** - Décharger des groupes d'onglets entiers
- **Mode panneau latéral** - Ouvrir TabRest dans le panneau latéral de Chrome (optionnel)
- **Reporter des onglets/sites** - Protéger temporairement des onglets ou des domaines (30 min à 2 h)
- **Notification d'avertissement** - Message d'avertissement de 3 s sur la page avant l'ignorement automatique
- **Indicateur visuel** - Préfixe personnalisable (💤) sur les titres des onglets déchargés
- **Liste blanche** - Protéger des sites du déchargement automatique (prend en charge localhost et IP)
- **Import/Export** - Sauvegarder les listes blanches, listes noires et sessions en JSON
- **Sessions** - Enregistrer et restaurer des ensembles d'onglets
- **Restauration du défilement** - Restaurer la position de défilement lors du rechargement des onglets
- **Horodatage YouTube** - Reprendre les vidéos à la dernière position après rechargement
- **Ignorer hors ligne** - Ne pas ignorer les onglets lorsque le réseau est indisponible
- **Mode inactif uniquement** - Déchargement automatique uniquement lorsque l'ordinateur est inactif
- **Mode d'alimentation** - Profils économie de batterie, normal ou performance
- **Notifications de déchargement automatique** - Recevoir une notification lorsque des onglets sont déchargés
- **Info-bulle mémoire** - Survoler les statistiques pour voir la RAM estimée économisée par onglet
- **Assistant de configuration** - Configuration interactive multi-étapes au premier lancement
- **Rapport d'erreur optionnel** - Rapports de plantage anonymes via Sentry (désactivé par défaut) et soumission manuelle de rapport de bug
- **Ouverture automatique du journal des modifications** - Ouvre les notes de version lors des mises à jour mineures/majeures
- **Permissions hôte optionnelles** - La protection des formulaires ne demande l'accès que si elle est activée
- **Affichage de l'utilisation RAM** - Pourcentage RAM en direct dans l'en-tête du popup
- **Statistiques** - Suivre le nombre d'onglets déchargés et la mémoire économisée
- **Multilingue** - 11 langues prises en charge

## Raccourcis clavier

| Raccourci     | Action                         |
| ------------- | ------------------------------ |
| `Alt+Shift+D` | Décharger l'onglet actuel      |
| `Alt+Shift+O` | Décharger les autres onglets   |
| `Alt+Shift+→` | Décharger les onglets à droite |
| `Alt+Shift+←` | Décharger les onglets à gauche |

## Installation

### Depuis les sources

1. Cloner ce dépôt
2. Ouvrir `chrome://extensions` dans Chrome
3. Activer le "Mode développeur" (en haut à droite)
4. Cliquer sur "Charger l'extension non empaquetée"
5. Sélectionner le dossier du projet

### Depuis le Chrome Web Store

[Installer TabRest depuis le Chrome Web Store](https://chromewebstore.google.com/detail/tabrest-rest-your-tabs-fr/agajndkecodedlklmpnjgikglkpeopib).

## Fonctionnement

TabRest utilise l'API native `chrome.tabs.discard()` de Chrome pour décharger les onglets. Les onglets ignorés :

- Restent visibles dans la barre d'onglets
- Conservent leur position de défilement et les données de formulaire
- Se rechargent instantanément au clic
- Libèrent de la mémoire lorsqu'ils sont inactifs

## Structure du projet

```text
tabrest/
├── manifest.json           # Configuration de l'extension (MV3)
├── _locales/               # Traductions i18n (en, vi)
├── src/
│   ├── background/         # Modules du service worker
│   ├── content/            # Form checker, YouTube tracker
│   ├── popup/              # Interface popup / panneau latéral
│   ├── options/            # Page des paramètres
│   ├── pages/              # Onboarding, changelog
│   └── shared/             # Utilitaires partagés
├── icons/                  # Icônes de l'extension
├── website/                # Site de documentation Astro (tabrest.ohnice.app)
└── docs/                   # Documentation du projet
```

## Développement

```bash
pnpm install          # Installer les dépendances
pnpm run lint         # Vérifier le code avec Biome
pnpm run lint:fix     # Corriger automatiquement les problèmes de lint
pnpm run format       # Formater le code
pnpm run ci           # Exécuter l'intégration continue complète (validate + lint)
```

## Ressources promotionnelles

Les images promotionnelles du Chrome Web Store se trouvent dans `assets/` en tant que sources SVG.

```bash
./scripts/generate-promo-images.sh   # Générer les fichiers PNG
```

## Confidentialité

- Aucune collecte de données
- Aucun serveur externe
- Tous les paramètres sont stockés localement
- Voir la [Politique de confidentialité](docs/privacy-policy.md)

## Soutenir le projet

Si vous trouvez cette extension utile, envisagez de soutenir son développement :

[![GitHub Sponsors](https://img.shields.io/badge/GitHub_Sponsors-Soutenir-ea4aaa?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/lamngockhuong)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy_Me_A_Coffee-Soutenir-FFDD00?logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/lamngockhuong)
[![MoMo](https://img.shields.io/badge/MoMo-Soutenir-ae2070)](https://me.momo.vn/khuong)

## Autres projets

- [GitHub Flex](https://github.com/lamngockhuong/github-flex) - Extension multi-navigateur qui améliore l'interface de GitHub avec des fonctionnalités de productivité
- [Termote](https://github.com/lamngockhuong/termote) - Outils CLI de contrôle à distance (Claude Code, GitHub Copilot, n'importe quel terminal) depuis mobile/bureau via PWA

## Licence

MIT

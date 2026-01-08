# Dashboard App — Mémo • Météo • Calendrier

Prototype d'une application bureautique de type dashboard (desktop) créée d'après une maquette.

Fonctionnalités incluses:
- Mémo local (sauvegardé dans localStorage)
- Météo (requiert clé OpenWeatherMap; sinon affichage mock)
- Calendrier (affiche mois, navigation prev/next, met en évidence le jour actuel)

## Prérequis
- Node.js (version 16+ recommandée)
- npm
- Windows PowerShell (instructions fournies ci-dessous)

## Installation et exécution (PowerShell)
Ouvrez PowerShell à l'emplacement du dossier `dashboard-app` et exécutez:

```powershell
npm install
# Définir la clé API OpenWeather (optionnel mais recommanded pour la météo réelle)
# $env:OPENWEATHER_API_KEY = "votre_cle_api"
npm start
```

Si vous ne fournissez pas de clé OpenWeather, l'app utilisera des données de démonstration.

## Configuration
- Clé API: utilisez une clé OpenWeatherMap (https://openweathermap.org/) et exportez-la comme variable d'environnement `OPENWEATHER_API_KEY` avant de lancer l'app.

## Structure des fichiers
- `main.js` - processus principal Electron
- `index.html` - UI
- `renderer.js` - logique frontend (mémo, météo, calendrier)
- `style.css` - styles

## Notes
- Pour une utilisation en production, sécurisez l'accès à la clé (ne pas utiliser `nodeIntegration: true`), et utilisez un preload script ou processus backend pour appeler l'API.
- Améliorations possibles: synchronisation cloud, événements dans le calendrier, notifications, thèmes.


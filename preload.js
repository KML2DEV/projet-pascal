const { contextBridge } = require('electron');

// Météo supprimée — conserver un objet `api` vide pour compatibilité.
contextBridge.exposeInMainWorld('api', {});

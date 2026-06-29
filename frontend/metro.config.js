const { getDefaultConfig } = require("expo/metro-config");
const os = require("os");
const path = require("path");
const { FileStore } = require("metro-cache");

const config = getDefaultConfig(__dirname);

const root = process.env.METRO_CACHE_ROOT || path.join(__dirname, ".metro-cache");
config.cacheStores = [new FileStore({ root: path.join(root, "cache") })];

// FIX Bug 3: maxWorkers: 2 limitaba el bundler a 2 hilos sin importar
// cuantos nucleos tenga la maquina. Usamos la mitad de los nucleos disponibles
// (minimo 2, maximo 6) para no saturar maquinas pequenas ni desperdiciar
// CPU en maquinas grandes.
const cpuCount = os.cpus()?.length || 4;
config.maxWorkers = Math.max(2, Math.min(6, Math.floor(cpuCount / 2)));

// Reduce el trabajo de watcher ignorando carpetas pesadas que no afectan al bundle.
config.resolver.blockList = [
  /android\/build\/.*/,
  /ios\/build\/.*/,
  /\.git\/.*/,
];

module.exports = config;

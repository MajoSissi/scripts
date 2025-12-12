import { injectGlobalStyles, SVG_ICONS, createNotifier } from './src/ui/index.js';
import { createSettingsButton, createSettingsModal } from './src/settings/index.js';

import {
  createProxyApi,
  loadProxyList,
  saveProxyList,
  loadProxyTimeout,
  saveProxyTimeout
} from './src/proxy/index.js';

import {
  ensureDefaultPlayersInitialized,
  loadPlayers,
  savePlayers,
  getExternalPlayer,
  setExternalPlayer,
  resetToDefaultPlayers
} from './src/players/index.js';

import { loadButtonSettings, saveButtonSettings } from './src/stores/index.js';

import { createVideoApi } from './src/features/video/index.js';
import { createButtonsFeature } from './src/features/buttons/index.js';
import { initApp } from './src/app/index.js';

function isVideoPage() {
  return /^\/video\//.test(location.pathname);
}

function isVideoListPage() {
  return document.querySelectorAll('.videoTeaser').length > 0;
}

function logInit() {
  console.log('[Iwara Player] 脚本已启动');
}

injectGlobalStyles();

let proxyList = loadProxyList();
let proxyTimeout = loadProxyTimeout();
let buttonSettings = loadButtonSettings();

const playersInit = ensureDefaultPlayersInitialized();
let players = Array.isArray(playersInit) && playersInit.length ? playersInit : loadPlayers();
let externalPlayer = getExternalPlayer();

const notify = createNotifier(() => proxyList);
const proxyApi = createProxyApi({ getProxyList: () => proxyList });

const videoApi = createVideoApi({
  pickProxyPrefix: proxyApi.pickProxyPrefix,
  proxifyWithPrefix: proxyApi.proxifyWithPrefix,
  getProxiedUrl: proxyApi.getProxiedUrl,
  getExternalPlayer: () => externalPlayer,
  getPlayers: () => players,
  getVideoQuality: () => 'Source',
  notify,
  svgIcons: SVG_ICONS
});

const buttons = createButtonsFeature({
  videoApi,
  getButtonSettings: () => buttonSettings,
  getProxiedUrl: proxyApi.getProxiedUrl,
  isVideoPage,
  isVideoListPage
});

const openSettingsModal = createSettingsModal({
  getPlayers: () => players,
  setPlayers: (nextPlayers) => {
    players = Array.isArray(nextPlayers) ? nextPlayers : [];
    savePlayers(players);
  },

  getExternalPlayer: () => externalPlayer,
  setExternalPlayer: (name) => {
    externalPlayer = name || 'MPV';
    setExternalPlayer(externalPlayer);
  },

  getProxyList: () => proxyList,
  setProxyList: (list) => {
    proxyList = Array.isArray(list) ? list : [];
    saveProxyList(proxyList);
  },

  getProxyTimeout: () => proxyTimeout,
  setProxyTimeout: (ms) => {
    const n = Number(ms);
    proxyTimeout = Number.isFinite(n) ? n : 10000;
    saveProxyTimeout(proxyTimeout);
  },

  getButtonSettings: () => buttonSettings,
  setButtonSettings: (s) => {
    buttonSettings = s || buttonSettings;
    saveButtonSettings(buttonSettings);
  },

  resetToDefaultPlayers: () =>
    resetToDefaultPlayers({
      confirmFn: (msg) => confirm(msg),
      notify,
      reloadFn: () => location.reload()
    }),

  normalizeProxyUrl: proxyApi.normalizeProxyUrl,
  notify,
  refreshAllButtons: buttons.refreshAllButtons
});

if (typeof GM_registerMenuCommand === 'function') {
  GM_registerMenuCommand('播放器设置', openSettingsModal);
}

initApp({
  logInit,
  createSettingsButton: () => createSettingsButton({ onClick: openSettingsModal }),
  isVideoPage,
  isVideoListPage,
  getVideoUrl: () => videoApi.getVideoUrl(),
  buttons
});

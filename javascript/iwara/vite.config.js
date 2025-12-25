import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
  plugins: [
    monkey({
      entry: 'main.js',
      userscript: {
        name: 'Iwara 外部播放器',
        namespace: 'none',
        version: '1.6.1',
        description: '支持外部播放器和视频播放链接代理(需自建服务)',
        author: 'EvilSissi',
        match: ['*://*.iwara.tv/*'],
        include: ['*://*/*iwara.tv/*'],
        icon: 'https://www.google.com/s2/favicons?sz=64&domain=iwara.tv',
        grant: [
          'GM_registerMenuCommand',
          'GM_getValue',
          'GM_setValue',
          'GM_setClipboard',
          'GM_addStyle',
          'GM_xmlhttpRequest'
        ],
        connect: ['*']
      }
    })
  ],
  build: {
    target: 'es2020'
  }
});

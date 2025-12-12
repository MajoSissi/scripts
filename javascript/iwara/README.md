# Iwara 外部播放器（油猴脚本）

本项目使用 `vite-plugin-monkey` 管理/构建油猴脚本。

入口文件：`main.js`（保留了原脚本的设置/代理/播放器管理逻辑），其余功能拆分在 `src/`：
- `src/notifications.js`：通知堆叠与代理提示
- `src/styles.js`：全局样式注入（原 `GM_addStyle`）
- `src/icons.js`：按钮 SVG 图标常量
- `src/video.js`：Iwara API 获取直链/调用外部播放器
- `src/buttons.js`：详情页固定按钮 + 列表页悬停按钮
- `src/init.js`：SPA 路由监听与初始化
- `src/settingsButton.js`：右下角设置 FAB

## 开发

```bash
pnpm install
pnpm dev
```

浏览器安装 Tampermonkey 后，打开终端输出的脚本安装链接（`vite-plugin-monkey` 会打印）。

## 构建

```bash
pnpm build
```

产物在 `dist/iwara-external-player.user.js`，把它导入到油猴即可。

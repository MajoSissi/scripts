// ==UserScript==
// @name         Iwara 外部播放器
// @namespace    http://tampermonkey.net/
// @version      3.0:/
// @description  支持视频页面和列表页面悬停:放，使用外部播放器
// @author       MajoSissi
// @match        https://www.iwara.tv/*
// @match        https://iwara.tv/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=iwara.tv
// @require      https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-y/pako/2.0.4/pako.min.js
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @connect      api.iwara.tv
// @connect      files.iwara.tv
// ==/UserScript==

(function() {
    'use strict';

    console.log('[Iwara Player] 脚本已启动');

    // 常量定义
    const CONSTANTS = {
        SELECTORS: {
            VIDEO_TITLE: 'h1.text-xl, h1[class*="title"], .page-video__details h1, h1',
            VIDEO_TEASER: '.videoTeaser',
            VIDEO_ELEMENT: '#vjs_video_3_html5_api, [id^="vjs_video_"][id$="_html5_api"], video.vjs-tech, video[src]'
        },
        DEFAULT_ICON: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxMiIgZmlsbD0iIzY2N2VlYSIvPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik0xMyAxMWw4IDUtOCA1eiIvPjwvc3ZnPg==",
        Z_INDEX: {
            SETTINGS: '999999',
            BUTTONS: '999998',
            MODALS: '9999999'
        }
    };

    // 注入全局样式
    GM_addStyle(`
        /* ========== 浮动按钮样式 ========== */
        .iwara-mpv-fab {
            position: fixed;
            right: 30px;
            z-index: 999998;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(10px);
            user-select: none;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .iwara-mpv-fab:hover {
            background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
            transform: translateY(-2px) scale(1.05);
        }
        .iwara-mpv-fab:active {
            transform: translateY(0) scale(0.98);
        }
        #iwara-mpv-settings-fab {
            bottom: 30px;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            font-size: 24px;
        }
        #iwara-mpv-settings-fab:hover {
            transform: translateY(-2px) scale(1.1) rotate(90deg);
        }
        #iwara-mpv-button {
            bottom: 100px;
            width: 56px;
            height: 56px;
            border-radius: 50px;
            font-size: 16px;
            font-weight: 600;
            gap: 10px;
        }
        #iwara-mpv-button svg {
            width: 24px;
            height: 24px;
        }

        /* 视频播放页按钮组 - 1x4 垂直布局 */
        #iwara-mpv-button-group-detail {
            position: fixed;
            right: 30px;
            bottom: 100px;
            z-index: 999998;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        #iwara-mpv-button-group-detail button {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 2px solid;
            backdrop-filter: blur(10px);
        }
        #iwara-mpv-button-group-detail button:hover {
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
            transform: translateY(-2px) scale(1.05);
        }
        #iwara-mpv-button-group-detail button:active {
            transform: translateY(0) scale(0.98);
        }
        #iwara-mpv-button-group-detail button svg {
            width: 24px;
            height: 24px;
        }
        #iwara-mpv-button-group-detail .copy-btn {
            background: rgba(255, 255, 255, 0.95);
            color: #667eea;
            border-color: #667eea;
        }
        #iwara-mpv-button-group-detail .copy-btn:hover {
            background: #667eea;
            color: #fff;
        }
        #iwara-mpv-button-group-detail .new-tab-btn {
            background: rgba(255, 255, 255, 0.95);
            color: #51cf66;
            border-color: #51cf66;
        }
        #iwara-mpv-button-group-detail .new-tab-btn:hover {
            background: #51cf66;
            color: #fff;
        }
        #iwara-mpv-button-group-detail .quality-btn {
            background: rgba(255, 255, 255, 0.95);
            color: #ffa500;
            border-color: #ffa500;
            font-size: 14px;
            font-weight: bold;
        }
        #iwara-mpv-button-group-detail .quality-btn:hover {
            background: #ffa500;
            color: #fff;
        }
        #iwara-mpv-button-group-detail .play-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
            border-color: #667eea;
        }
        #iwara-mpv-button-group-detail .play-btn:hover {
            box-shadow: 0 6px 16px rgba(102, 126, 234, 0.7);
        }

        /* 悬停按钮容器 - 2x2 网格布局 */
        .iwara-mpv-button-group {
            position: absolute;
            right: 10px;
            bottom: 10px;
            z-index: 100;
            display: none;
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: repeat(2, 1fr);
            gap: 8px;
            opacity: 0;
            transition: opacity 0.2s ease;
        }
        .iwara-mpv-button-group.visible {
            opacity: 1;
        }

        /* 按钮组内所有按钮的统一基础样式 */
        .iwara-mpv-button-group button {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            transition: all 0.2s ease;
            opacity: 0;
            transform: scale(0.8);
            border: 2px solid;
        }
        .iwara-mpv-button-group button:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        }
        .iwara-mpv-button-group button svg {
            width: 18px;
            height: 18px;
        }

        /* 复制按钮 */
        .iwara-mpv-action-btn.copy {
            background: rgba(255, 255, 255, 0.95);
            color: #667eea;
            border-color: #667eea;
        }
        .iwara-mpv-action-btn.copy:hover {
            background: #667eea;
            color: #fff;
        }

        /* 新标签页播放按钮 */
        .iwara-mpv-action-btn.new-tab {
            background: rgba(255, 255, 255, 0.95);
            color: #51cf66;
            border-color: #51cf66;
        }
        .iwara-mpv-action-btn.new-tab:hover {
            background: #51cf66;
            color: #fff;
        }

        /* 画质切换按钮 */
        .iwara-mpv-action-btn.quality {
            background: rgba(255, 255, 255, 0.95);
            color: #ffa500;
            border-color: #ffa500;
            font-size: 14px;
            font-weight: bold;
        }
        .iwara-mpv-action-btn.quality:hover {
            background: #ffa500;
            color: #fff;
        }

        /* 播放按钮 */
        .iwara-mpv-button-group .iwara-mpv-hover-button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
            border-color: #667eea;
        }
        .iwara-mpv-button-group .iwara-mpv-hover-button:hover {
            box-shadow: 0 6px 16px rgba(102, 126, 234, 0.7);
        }
        .iwara-mpv-button-group .iwara-mpv-hover-button svg {
            width: 20px;
            height: 20px;
        }

        /* ========== 统一表单输入框样式 ========== */
        .iwara-form-input,
        .iwara-form-textarea {
            width: 100%;
            padding: 12px 16px;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            color: #e0e0e0;
            font-size: 14px;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            transition: all 0.2s;
            box-sizing: border-box;
        }
        .iwara-form-input:focus,
        .iwara-form-textarea:focus {
            outline: none;
            border-color: #667eea;
            background: rgba(255, 255, 255, 0.08);
        }
        .iwara-form-input::placeholder,
        .iwara-form-textarea::placeholder {
            color: #666;
        }
        .iwara-form-textarea {
            resize: vertical;
            min-height: 80px;
            line-height: 1.5;
        }

        /* ========== 模态框通用样式 ========== */
        .iwara-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .iwara-modal-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .iwara-modal-content {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border-radius: 16px;
            width: 90%;
            max-width: 500px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            animation: slideUp 0.3s ease;
            overflow: hidden;
        }
        @keyframes slideUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        .iwara-modal-header {
            padding: 24px 28px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .iwara-modal-header h2 {
            margin: 0;
            color: #fff;
            font-size: 20px;
            font-weight: 600;
        }
        .iwara-modal-close {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: #fff;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }
        .iwara-modal-close:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: rotate(90deg);
        }
        .iwara-modal-body {
            padding: 28px;
            max-height: 70vh;
            overflow-y: auto;
        }
        .iwara-modal-footer {
            padding: 20px 28px;
            background: rgba(0, 0, 0, 0.2);
            display: flex;
            justify-content: flex-end;
            gap: 12px;
        }
        .iwara-btn {
            padding: 10px 24px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        .iwara-btn-cancel {
            background: rgba(255, 255, 255, 0.1);
            color: #e0e0e0;
        }
        .iwara-btn-cancel:hover {
            background: rgba(255, 255, 255, 0.15);
        }
        .iwara-btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
        }
        .iwara-btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        .iwara-btn-small {
            padding: 6px 14px;
            background: rgba(102, 126, 234, 0.2);
            border: 1px solid rgba(102, 126, 234, 0.4);
            border-radius: 6px;
            color: #667eea;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        .iwara-btn-small:hover {
            background: rgba(102, 126, 234, 0.3);
            border-color: #667eea;
        }

        /* ========== 设置页面专用样式 ========== */
        .iwara-settings-section {
            margin-bottom: 28px;
        }
        .iwara-settings-section:last-child {
            margin-bottom: 0;
        }
        .iwara-settings-section h3 {
            margin: 0 0 16px 0;
            color: #e0e0e0;
            font-size: 16px;
            font-weight: 600;
        }
        .iwara-hint {
            margin: 8px 0 0 0;
            color: #999;
            font-size: 12px;
        }

        /* 播放器选项 */
        .iwara-player-options {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .iwara-player-option {
            position: relative;
            display: flex;
            align-items: center;
            padding: 16px;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .iwara-player-option:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(102, 126, 234, 0.5);
        }
        .iwara-player-option.active {
            background: rgba(102, 126, 234, 0.15);
            border-color: #667eea;
        }
        .iwara-player-option input[type="radio"] {
            margin-right: 12px;
            cursor: pointer;
        }
        .iwara-option-icon {
            font-size: 24px;
            margin-right: 12px;
        }
        .iwara-option-text {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        .iwara-option-text strong {
            color: #e0e0e0;
            font-size: 14px;
        }
        .iwara-option-text small {
            color: #999;
            font-size: 12px;
        }
        .iwara-player-actions {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            display: flex;
            gap: 8px;
            z-index: 10;
        }
        .iwara-edit-btn,
        .iwara-delete-btn {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            padding: 4px 8px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
            opacity: 0.8;
        }
        .iwara-edit-btn:hover {
            background: rgba(102, 126, 234, 0.3);
            border-color: rgba(102, 126, 234, 0.6);
            opacity: 1;
            transform: scale(1.1);
        }
        .iwara-delete-btn {
            background: rgba(255, 59, 48, 0.15);
            border-color: rgba(255, 59, 48, 0.4);
        }
        .iwara-delete-btn:hover {
            background: rgba(255, 59, 48, 0.3);
            border-color: rgba(255, 59, 48, 0.6);
            opacity: 1;
            transform: scale(1.1);
        }

        /* 画质选项 */
        .iwara-quality-options {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .iwara-quality-option {
            display: flex;
            align-items: center;
            padding: 12px 16px;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .iwara-quality-option:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(102, 126, 234, 0.5);
        }
        .iwara-quality-option.active {
            background: rgba(102, 126, 234, 0.15);
            border-color: #667eea;
        }
        .iwara-quality-option input[type="radio"] {
            margin-right: 12px;
            cursor: pointer;
        }

        /* 代理列表 */
        .iwara-proxy-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            max-height: 200px;
            overflow-y: auto;
            padding: 4px;
        }
        .iwara-proxy-list::-webkit-scrollbar {
            width: 6px;
        }
        .iwara-proxy-list::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 3px;
        }
        .iwara-proxy-list::-webkit-scrollbar-thumb {
            background: rgba(102, 126, 234, 0.5);
            border-radius: 3px;
        }
        .iwara-proxy-list::-webkit-scrollbar-thumb:hover {
            background: rgba(102, 126, 234, 0.7);
        }
        .iwara-proxy-item {
            display: flex;
            align-items: center;
            padding: 10px 14px;
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            transition: all 0.2s;
            gap: 10px;
        }
        .iwara-proxy-item:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(102, 126, 234, 0.3);
        }
        .iwara-proxy-item.disabled {
            opacity: 0.5;
        }
        .iwara-proxy-item .proxy-url {
            flex: 1;
            color: #e0e0e0;
            font-size: 13px;
            font-family: 'Consolas', 'Monaco', monospace;
            word-break: break-all;
        }
        .iwara-proxy-item.disabled .proxy-url {
            color: #999;
            text-decoration: line-through;
        }
        .iwara-proxy-toggle {
            padding: 4px 12px;
            background: rgba(81, 207, 102, 0.2);
            border: 1px solid rgba(81, 207, 102, 0.4);
            border-radius: 6px;
            color: #51cf66;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            white-space: nowrap;
        }
        .iwara-proxy-toggle:hover {
            background: rgba(81, 207, 102, 0.3);
            border-color: #51cf66;
            transform: scale(1.05);
        }
        .iwara-proxy-toggle.disabled {
            background: rgba(255, 107, 107, 0.2);
            border-color: rgba(255, 107, 107, 0.4);
            color: #ff6b6b;
        }
        .iwara-proxy-toggle.disabled:hover {
            background: rgba(255, 107, 107, 0.3);
            border-color: #ff6b6b;
        }
        .iwara-proxy-delete {
            padding: 4px 8px;
            background: rgba(255, 59, 48, 0.15);
            border: 1px solid rgba(255, 59, 48, 0.4);
            border-radius: 6px;
            color: #ff3b30;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
            line-height: 1;
        }
        .iwara-proxy-delete:hover {
            background: rgba(255, 59, 48, 0.3);
            border-color: #ff3b30;
            transform: scale(1.1);
        }

        /* Select 下拉框样式 */
        select.iwara-form-input {
            cursor: pointer;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23667eea' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 12px center;
            padding-right: 36px;
            appearance: none;
            -webkit-appearance: none;
            -moz-appearance: none;
        }
        select.iwara-form-input:hover {
            border-color: rgba(102, 126, 234, 0.5);
        }
        select.iwara-form-input option {
            background: #1a1a2e;
            color: #e0e0e0;
            padding: 10px;
        }
        select.iwara-form-input option:hover {
            background: #667eea;
        }
    `);

    // 代理列表（数组格式：[{url: '', enabled: true}, ...]）
    let proxyList = GM_getValue('proxyList', []);

    // 外部播放器名称
    let externalPlayer = GM_getValue('externalPlayer', 'MPV');

    // 视频画质设置 - 固定为 Source
    const videoQuality = 'Source';

    // 数据迁移：将旧的 id 格式转换为 name 格式
    function migrateExternalPlayerFromIdToName() {
        const storedPlayers = GM_getValue('customPlayers', []);
        const storedExternalPlayer = GM_getValue('externalPlayer', 'MPV');

        // 检查是否是旧的 id 格式（通常是 custom_xxx 或其他非标准名称）
        if (storedExternalPlayer && storedExternalPlayer.startsWith('custom_')) {
            const player = storedPlayers.find(p => p.id === storedExternalPlayer);
            if (player && player.name) {
                // 迁移到 name
                externalPlayer = player.name;
                GM_setValue('externalPlayer', player.name);
                console.log(`[Iwara Player] 已迁移播放器ID "${storedExternalPlayer}" 到名称 "${player.name}"`);
            } else {
                // 如果找不到对应的播放器，重置为 MPV
                externalPlayer = 'MPV';
                GM_setValue('externalPlayer', 'MPV');
            }
        }

        // 清理所有播放器配置中的 id 字段
        if (storedPlayers.length > 0) {
            const cleanedPlayers = storedPlayers.map(p => {
                const { id, ...rest } = p; // 移除 id 字段
                return rest;
            });
            GM_setValue('customPlayers', cleanedPlayers);
        }
    }

    // 执行数据迁移
    migrateExternalPlayerFromIdToName();

    // 默认播放器列表
    const defaultPlayers = [
        {
            name: "MPV",
            icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAALiIAAC4iAari3ZIAAAAZdEVYdFNvZnR3YXJlAHd3dy5pbmtzY2FwZS5vcmeb7jwaAAAfTUlEQVR42syZA3gdTxfGa5uxzXtjW3Vww6tYN6mFv23bNprUtq2waWzXfr8z822w+Szs87yLtsnO77znnJmdDhn07zsG+/v7D5s7d+4YR0fHSfQ8k2RMktja2obJ4mXKRx9dt/y9D9557vufv39309YNX23ftf2HnXu2/7Bp26avfvztx3c/+vSD5x5/+vHlScp4Jf2OMPpZKcmENNPe3n6ys7PzGPYO9i7S/80xxMzMbGRISMhEutcmWUycODEgOyM757vvvvnw/KXzB1s6W2pu3b15+8GD+7h35x6utl9Dc3UrakvqUXWxBpUXq1FD942VTWisbURDQ8Pt6trqmvNF5w7+sv6XjxcuWZg3c+bMQPa7x4wZo83exd7J3v2/BB8cGxs7ghxhbuuRHCMiIuRfffXVB+UV5RfuPrhzGwDu3riHoiOlKPxgC95Z8jGeiH8By8LWIddnObI8liLTbTFXNt3n+a7AqrlP4Pnk1/H5E99h708HUXamAjXVNXdLK0ouUpZ8PC9ynoK9i6Tn4+MzmY3hv5wR/GXD5s+fP37q1Kk6dO9Ag0jdunXr+vbO9naw4yFwcscZfLj6CywPfxRpknyobXOQbK9BmjQfGS6LGLRIGa6LkO6yEKnSPKjtc6CwzoTcKgNpzvl4VPYsfnmzACUny1BdV92++8DugkR5YjoLBBsDGwvd/zdKg9f5KIr8dJaObm5usoKCgp+6uju7AeBG101s+Hgr1kY+gxQHDZLtNMh0WYwcz2XI9VqOHK9lTPw523Mpub4EWSJRMNx7tAgZbgt5AFT22UgwT0OKNBcvZ72NEztOo6q66uqmHZt+9vT0jGVjYWNiY/tPlsVQcnrclClTWLq7P//888/V1tbWgB0PgM2f78Aycltlk4N0p4XIJVCN93K6kjg0iaC5vHhA6O9XMAn/jksI0FIekAwKQjoFId2VKR8pThokWqaT0vCs+lWc2X8elysv1738+ovPszHp6urqsTGysf67XR9Gv5g1OSNqPvN27ty56T41NHZcOlqCJxNfhJrAM5wXcaBcMXhvBuT5rCKt5HDJTjlItE9BjLUCkRYJiDSPR5RFImT0nGCXApU0C2kEzbIiizKCBSLNJY8rxVmDBItUJFmn4+NHv0RFWQV2H9y12cbGZj6bedhY/12zxeDMzMzhc+bMmUz35tHR0WklJSVFPXX+69uFDJrSPY9Bi8EF+DwKSD6BZ7gtQpytCiEGc+Ex3Q+SiW5wGO8M+3HOcCA5jneFdLw7pBM84DrJG55T/RGgFY7ZRlGIs1bxgFFJ8KCkOmtIuVBLsiEzVmFRyCqc2nsGF0rOl8TExmSwkmBjZmP/V4IwmObd4WFhYVPo3kqj0SxtampqBoDutqt4I+99qKyzkeW2hLs+MIU1AngyDTTCeAFcpnjDbpwUtmMldHUieBdIJrjBaaIHnCd5wmWyF9wm+5B84U7ymOIPrsn+8JoSiECtCMw3jYPCMYOCkMeDQEHhSrBMoWxIw4bPtqC8sqw5f7FmORtzcHDwVGL454LAUkhw3mrp0qWr29vbOwGgubYVTyS8SLWeLUAPSHe65vtyxxk4d9pmjCOHdpzgKsgN0onu/eC94UrwHJyc9yRwr6mB8JkWBN9pIfCbHkoK4fdBM2dhgWk8VJIspLpooJZmQ+2UDbl9BqKNFPjyue9QUVXRtXTV4rU0dmvGwFj+IXiqoaFCzZvn5+cv7ejo6AKAxupmrKMOr7LNYeku6uzZvLkt567H26q549YEbk9pTtAiSSeI4d36w08NgPcAeP8ZYQiYEY6gGbO4AknhuvMRb5NMGZbDgsB7hsIhA5EGifjo0S9QUVnepfljJliwtQpj+rtXdkInNWI1T2nfAgAdzR14LPY5Pp8LXVtwfCmHzxXKYJZxFKW5tM9xsfqlvRdcRc77ieGnC/DTwxBI8IHkfLDWbIRozUWY1jyEsqv2fESbyRk8l1KSCYV9OhboJ+KLZ79FUdmlVpksKl1ojOMY2981z9NUp8u6fVlZWTEA3LpxGy9nvg2ldZbgvHg+J3C+kgvUjeCuU33/RXhpj/M8AAOdDxLgg3vhA2aGc8eDZzL4Ob3gEToLMEsnEhHakYgySYDSMZMFgK4ZSLJL45lQ8OkmnL5wsoTNDnp6erqMjTH+1bqXSCTT2Zy6a9euLRCOb1/8GQrLTNFCJkdYyHB4uvfXCYf1aIe/AC6ueeryQtr7DUj74F7nA6Yz1yOo5vvDz+sHH4XZOtGYo0uia7RJEpVAOmuS/BpvnYx4SzWO7TqBjdsKtzImxvbX+sFgWstPYDXDFjl37tzh8Me3n0Kyg4a6/eI+cAG+x/1g/dnM+b8OP4mnPVx64KcQPG92BE+uE7w47QfCa89DOIPXFuAZuF4M5urJMF8vDvN1YxFrquABkNunQe6QRkGRIy9kGS5euITnnn+GLZYsBcbBf/bDRl9fX4ctb+vq6uoBoLOlEyvnPI4Ux7yeRidawuZ5r8Q8s1jwtJ/g8lfhecr/WXhynqc8h2fN7s/Ch/XA60YKzsdgHoePpZqPR6R+AqKo9uMt1EiiDEiiICTZpWKubhzeX/cJzpw/3UDLZhlj/HMfUEMWLFgwia4OhYWFP0M4vn/lF8gtM8TgXIuhIefl9CJW7+JOPzDtOTzr9vTsCbvRTrAYagfzQTYkW1gMtoPtcCmcxnrSfB8E3u21ODyrd7Hzusz5/vBx4PAGBE81H22QhBhDBRJsUmiVmYpECkCclRoycyWO7DqGH3/98RfGyGYFUUNkERk9erSuTCZLoynvGgBUl9Vy1+kLTQzvvli4XwyvmYGs4/9FeKp37r71KAn0BpnAeLgF3I18EOUvQ1p0JnIT85ERk424oET4W4TAjhZJlkPs4TrOm093YSL4SDG8vgCv3wcvM1JARgGIN1UTfApXAmk+/bvHlc/i3Pkz12VxsnRi1aNSGNmb/sJmhuO2bdsKIBxfPPUd5FaZBN8D3vu1Ru6vQKRlImzHSP5ip3cieJvREmgPMoCTrhtW5azBtg3bUXmlEt3dXbh56xZu3LyBa9evobW1FaUl5fzvn1z+LEKsaTYZ6gjPCQEIFxoea3ZzCX7uQHhDDs/BY42UiDNSIcE4ma8O4+3oaptMWaBCpHEi9m7cj18Lfi5krEIWDOadf9q0adq0YpLTnN8FAPWVDXxzIs0pn8NncnAu9sw/TNyn+bGl7Z+b47nrhoPMYT7eBk+tegZXLleCHQ8ePsCN6zfQSYvK1pZWNNPKuqmhCY0kdk+rTXR2daK0uAxvPPMWvA0CIBnhxrKAwJnzsT3wvN6jDZnk/eDViDcm941paWyWyhZKJDXXXPrZp9NfwKmzp7oiZkcoGDOfEdgeHuv8X3/99UcQjsKPt/Daz2LA4u9zPhNEW8vZmv7PwtOVXDdEiDQcJ46cADvu3LmLrs4utLe2E3gbWppaOHhDfSPqa+tRW1OL6spqVFZUoqL8CmoqaygrWnD04DEoI1JgP8KFB2G+gch5MbyxCvHMeROCN0mFwiSdZ0GcjYqkRoy5nF+P7juGDz754GPGzNkNDAwm065KYFFR0SUAuHnzJp6U01rfLnvA5gQXLwV/7dCBtc9qnktrkD4SZiWhpZkvICndu9HZ0YmO9h74VjQ1NveDr0MNh6+iTLmCy2UVKKMMKLlUwoNyubwCS9Qr4DjSlUohmjU8AqdmJ4JXc/hEBm+aCjnBK00zIbdI51+SsVxKzNaOwRcvf4O9h/Zcor2DQLbRynqAVnZ2tqarq+suAJSeLaPGx3di+sCFTQnKBvYRQinuzru/uOY9oDvICNHBseju6gZtgDLXCb4LHW0daGvlzqO5kVK+voHD11QTfFUffDnBlxeXE3wpii4U4+K5S1QOpSinIOQnLYHzKE+WAQK8UgxvzOBp/jdNh8I0AyqzTKjNssFnASv6t6R5+rFYFrkGx08cv5uenq6hDVYtFgDjb7/9tjf9N362FUmW6QK4AM8DkM+7f5RVEnVrJ3G3n+wJs6E2cDPx4q49fPhQDN/SLnKeLTNqq4W0v0Lw5ZT6pYLzRaUovliCS+eLcOHsRZw9dY4H49zp84j1ToTP+GDe7anZcfiEXvhUMbx5NlLMc3kZxFjJKQgKRJkm8pI4vO8I3v3o3Y+FLfdB0lOnTh3kO7gP7uKtJR/wzcg+cA7PxBtgqOE8nv6SiX1TnYQ2M3SHGOG3H9YDwADnCb6ZwVOjowA0N7cQfB2Hr+LOV/K0L6dZoFQMz6HPnjyHU8dOo/hSMdb/VAgfrSDMoVSO7w9vwuGhJHilAJ9snoNUcw0Ulhk8ADGWJAs5n0Z/+7wAm3dsPjR8+HDpIPafFtXV1TUAeK2uXvAkVPZZBM+hkdYjl3weDF+tEP6lJ8CT+14wGGQGxVw17t+/h+vXrqNDqHlKew5P4CwA5PIVFJ0pRktbC6V+DW94l0svo4zgS4rKUCTAU+r3wp85fhYnj53CcWqoRRSEFamr4TU2iLnPa17sfBZU5lkMnrufZpkHtWUOwfcFIEIrEm+tfQ+Hjx+qdXJyCh9Eix8lTT98D7+ypBLZ3kuRIskVwPkeHFJJLAApTrm0neVP9e/a+y0vpTIwHGaGrRu2AQCBE3wbwVPDaxbgG+sa+Fx/+vBZLAlbjR/f/pVnQH19PTnPa15w/pLI+dPHzzB4mk1O8hnhzMmzKPx5AwL1whGplwB5T82bMeez+jtP8BpkWOazK4ePtkhi4muK1YmP4ejxo3eiZH8gyxqAJUmC6Ktqjta2bTN0RvBshs62wjhbCp0ZurDOtm1p7Kqurc7qnJmN/R1ZmO6uzPfyZX4deXL6X52puVwuMjCo/ldDu96G8AQAwBgaB6ZNgkRreEJCCIH0arXaWLJ6Mbbu2oJmswmkzyQGiTEw6Zr3SQLPl6iXm3jxzpfw6NWP4dsPvkdciOGHPhLtnjNk9DwZr40B2tbX9DnTsWDNPDRaDQACkk0gnekChS/JpPAAA4oDAIQUqPxTTe+Ec+bOnOpPmzZtQhzHsO4sAXUopeAFIaPHgAMBJImmJYMXANqqjc27N2HcuHGwJYQkQRaw4ZmIk+naWhgHMCaH7z76ET98/hPW7bcau4/YgQnTx6FVa0NpNXyXySPTRFKUi7B4zUJ8+9oPMDAOIBEg4CiAXduZP0tXhhNqIKS0flqABqZOmjxB2sDHpoAMTJp9cgyA9qAsurXhA5w7ugxATlasWU7Baq1doCnodKYsagLu1nQknRPkAyLm5edfx70XP4RXX3wDELCKiDLVEPh9zuj3+pg2dzr8nEdqFEKSAQw608RgduAZRbrttLvQKkG+WBwrC4VCiR/od/skOZb/kAQyOswybk2QA5NlZMbs6ej1+k7ChgM2MAxiKOWUGMqytgZhEBcj/P93GU/e9BweuOpRfPvx98gVYvKltQPtCHVK6PcUxowvIcyHSDTHZA1uFmxwMyBI3YYrGYBWGrqvEUVRSfq+H7E8Rg0YZj+7T+z6nj9wAoDqtzSmBNVXBN4FyjYKgNYEXO1lfchAWkX4+OKdr3Db+XfjsRufQqfThZRZOTGBxr1vY0aYC2gv+BoCZ/lTvIDDwxcA7k3pOaFMHTBAL/QAgSEJNLMl5CDwA2DINpUCgIFszVAFThE6M7pHZeKAq8xo7+ae6sGPfBTHFkmqerQMTMKKorWTOvYCz6XJCvUgkcBAQ8OJ2b3reRJSCjpX2iC6rukYxPmYuqQDP8w+rTIFREFEkF19eSTDZqPhDtfWjOZAOWtEBjsn+SsNlWjXM6w1G000qg2s3rEC5996Fg47/SBACFIVnaFHyTXUB1RPw3Nq5Lp3XUCOKEFKKNMnvxkUOsOPAlJuv9/vyVarVecbpfFFYmcomX1LIw5yxC6pwfOgugp//va36wnGBam5/tlcVycglPFEEXDrH+X/KhgzsYgTLj0ap19/MqbOmYxauU4kOQIHSqKmCQEiS7WV9R848GJECayDbN1LuiMlbYj0KB9R72q2mnW/XC5XLROUpdLEEt3strvwpJepgL8og2njgG8dC4D6gekbfPvFdwD4W9do89PDPVvWAFuNDgHacfhWHHzi/pg4fSIBc72Ey8hattZOYSTdv3/9B0nHIMgFEFwKmewlsjn7ztbRbQCMw6mpNKFIfaderVel/SPI/+1Wm74tjJ1UstkoUYcctE0uh6zOQz9EHMaAAZVAHObx0VsfpzKmIBLNdcqZ5wZIyqDmVv2viilzp+DMG062mT/GBlRC7f8a9QTjiBzK3s6ae4hxCvr5y18Qisg15KwcGTSyzHvCQ8900bEmjOBv6XTu5JkTsad5a4BupeuiO1b52Ndn+7Nt27Zt27Zt23b7LLVPqJSkSRWj+fc9Se/K/M1vzqxZc1fXNOse7bPPmTNJgi/ZatC8fv16byQaiauHPKUeVHBjSWWFPCbIU4MITHzO6dEsrIRZdM3itahdthIOEqq0wdoZLYRy50Q8IVbf8/jdcNGD52Cj7WcgTFISi8R0+PT2S51q42mwvpbw7PB3oHFFC4pdJbDwNIKg7Emn61AqJGlXpNBEyIRh44aSC8QSnEXymmtra72hUMjHlCBUdfS0kVkylEeA8gBRLOF0umEXtgg47A4ke1L48r1vYLYIgIrA1HSfG2vgcjG8zrz9ZBx23kGC9t2dPRIOghsaMEXgPtzQ2YQhIOC1Yk4NEoEE3E6PJj45HqBJkZnhm8yk0J3skmfy499Z5MSIScPpsRFfXV2d17pixQq/1+ttHDNmzMgILTRhk3HCxviwaEsfAoyQy0Lw87g8YENTND2wbCB++fgX7HP4nsIKOTGjHjfw+TRTnKfMwzArodXD/H2NDznQzIGccvl83MhI3ApqB7ztWPLDUpS7BwgAmgynWVNfK09/0otEOi77y4IghOgNGzsEFaOGoLa2pnHt2rU+M4DOdevWreCG1APUTiUqx1UgzljVgqtLp8PsZl0u8QJF5uByeJCJmPD8vS9JwcI6u0Axo5RA8AvH8mqFTJ6waYMysilVPEnJJN7160d/INmeYdiVKnE18In9zTnhTVaJ/UC8HbkKQIdzmqE9ngZW4NnQ0LCCGbBLKSD6xx9/LGFJnFTu5C5xY6Mdp0t6046v0yE06TGpZ90erf/B5dRq9So8d/+LLHjsdEOzBrLevvRIofIosmZ4OtbVJRZP6/THQzxy1rezsfb3DRhaViFCCt5pJZh0OKjLF2tDkukPXMue89x/2rZTwCZNcunS5YvZEouY2RSNf/755zWtra1rVFWYZBhsuttGgszk3drqkFU+TWZGcDgE+EwwSWqsGDAc3772A1566BVSVTvsdpuAkAjfZ3URLN/10+L62RjNGCpJCiPCz/1hHqrfnYehJcPgsrm05fM4v2CAzWRDMBGUS/FA5PGZeCSOMdNHYdz00fC1etdWVVXVjB8/Pm7daKON4l988UXzwoULq6ZOnTotGWMYTKzExjtNx28fV6OorChXCOXXxtCKcLpdQM5lXQTEirJKfPbcV0JwTrzweNYJRcy3IQOnT+t1H+jpu3gNV0qxQpR+/PBnLPxsKYa4KlDsLMmxPn3qtGc12wX1W6NNKiw1peeh97/ZXpswlCxYu2ZtFbtgzWyLx2UCjEA4eIstttjtsccee4IvDMpoE2xYXocHz35cSliL1QItuO6U6LQogiSiCSAt9bbkWF/Qi8qpFTj09AOx0dYbKeCUdJcgzqSzNFgrAOIZ2U1abBZRUN2qOlSxRPYub0dFaSU8jiJpxADa5fXdZrYL4dkQWifMjxwgf59S5o/deAzOvu9UBAPBrsceeuyCmlU1P44dO9ZvoSYy2223nfm7775L7LbbbmOn8CBDEkra3tqB1QvWkDbajYIb1rybIZpFr2xPELqYQNXd1o3ZP80lU1wjNYCryCWlro2hYbMRq9Vlt8Cs6DfPUHcIa2vWCdjN+XAeev3M2eWVpN9ug/BmTXzMWvi68HoKL6hv2GcWTzI48Nx9MGbqaCyct/D7x598/J0tt9zS//PPP8dMbImBh4P9ucH77rvv3vfee+8jbJIUpXqT6PB14d7THgGnwrJKyOPGWnxZ5K0TtGSvjlGkmP46Q12IE5lLhxRh6JghZGKDUFxWrBQg7C/UGUKQyg40BRH2ReGACwOKyxlSLphhNVR7vIkCqBBeVsn1jZF6sKMtljcYyASEO8PYfO9NcMK1R8PvbQ8/88wzF//+++/fcgrGDyDel+jNDIWSX3/9ddRbb711w4EHHnhkIBBk/Lvx24fVeOnmN6R3Rx6uBde60JgAvUaSVLTXkrVaFq0F/OIJUtN4TBVDEu8wS7uKVrSyzHbATYFdDjfX9mzfEQag0/GvsoAKdH/Mh7ZomxAnWt64N1MW+EoHluCMe0/EiHEj8ON3P354xRVX3EZZGyhrt3IQU96AhG327NmDKisrt33++ecf40xNZVd3l7jsy7e8iV8/rGK1WCyS5gtuLJs18IgXWHut4Km9QV08RAi9EkuKO+vczqug8BRcng+nekTwEK1PweUZo3dmsiU3s9jR1xyObffbChtWb2i97777LuLwR/U222zT/v777yeR1ZM+zJy69nBAYtitt956Cl8dXUPkViaSHtpjFz2LtYvX0ys82XwNFABGvQGtGGuG1oWdlzW3WS1UP2GlrsvdJdLNOeXAku1ZMtaDiQA6kx0CoBLvBUKR+5bG554n7Yr9Tt+LIBjDJ598cs/DDz/8MucC2jjZ3tO3bZUFkHdY+TKzfPHixWM/+OCDWzk3sA8JEhzMxb4GvyjB2+CDp8QtljZqXS9gXPeKpS087Rm7gBYtqS7N4w3VHMTa+jdTvQlEUhF0p7oRSYc1PwBM+YLrmKdxpKzeat/NcdglBwllr/qj6turr776Zk6Nrmc26gCQ0sMRBcbkHKTGA9ks3ezll1++T2WF9vZ2tqk82LCiHk9f8SICrUG4s0rQPXNNkLIb65cx+k7GvFjOxpMgJn0Hnjo8srV/GgkKnuSl7qlMypD7M1rwTL7swjhDnWEhckdcdjDKysvA942r7rzrzqvY91hA4hNg7MflHwsrQAOimw8OJlHY/Y477ribr5IH9YFifU0jnrv2FbRsaEOxCocM+rm+cc1Vv4JKihyD+2qF5Qln0l0/Q+bp72UmSJ0R7Y5ii703xcEX7C/CNzU0BYj611RXV//ImWc/4z6i9PTn02EocFiosSKOxQ897bTTDrr88stv4AxBKf8GT6kb/N4Hr972NlbOWyWeQLfSBZOpUAmd0X/XAmjP6I8jBoUZBS+wNmWEhKUIerscsb3EvdvjQcAX6H7jzTduf+ONNz5jKHvLy8tDANL9BEXhI8MeQXrGjBmp9957r4XCBThMsAVzp7Mr2M3UUozNdt2YaSbBPn6daJ8MrgAG6FVhzlBYWONaP9tfCWSRAnYe0vVDzt8fOx25HZwOF/hStovWvu/VV1/9TFk+kUho4f9eBYADU5mSkpIUBU+9++67jfF4vJVwsAlfpXlUI8NKgTfaeYYQm6bVzQi0BOkJdFeL2ZAO/zpnKGzl7Oqv/18sHEcykcD0bafiqCsPxZQtJwrA8i20/9333r37lVde+ZTj8n56bc+sWbNE+H9EAXKwRsjwR1IUOqmUwBbSusmTJ0/ksOFg1duLR2MYww7SxjvPFIU0r29DDzu6MEHaV1oAIyYYFFTQ6oW5hiB8PJoQgjNs7FDsd+Ze4vKlg0olq7C9t+qll166gxnsOw59+UaPHt3DQk9K2n9GAXIQDDMkR0lOkCa//vrrNtLIpewelfJvE9kUUZWedJJnbDdVam3SW6G18qI1mcrleui01d/4fz3OiezSTotF4uLylRMqsPuxO2N/Cq/KW7vFLl3sJUuWfPPQQw/ds2zZslnkM+20fOijjz5K/zXhZVf/4EdTLrpTKdnUiOuuu+4QavkEesOIaDQKXurNr1SOvqZ2LK+qwfLqGjSsahY+LvnbYlaeIXcUaLfppmg6rZiclMYWKrRscAnGso6fvuNUjJs5Bu5ilyKxkkLZx2hmUfPGs88++wkxqomFXSfjP2qI+X+PAvRAtZ2t9BKSpXJ6xUb8LudITmHvwzK6JBaLKUUIINocNrGMj8SprrYRjbVNaOO6kwVWJBRRriwCQmcPyP/Rm0TA8opy6d+NmDwcw8cPU71EKbVNvZA3QiRoPfx+6RuG5vs0yhJ+NtfBbNRjyPP/AQWgb6/UtIufzRXzGsQ54y0PPfTQA4kPOzJdDgAgimAJLB5BwXLxG0e4K4weVn/RUExiOanCJPuSVSpOZ7GTTNMjnSDiioRJRnmC2Sq/EeQQAonaHyzfPydtn0sP9G+66aY9XIvVtfD/OQXow0xvsFFQ19y5c4t4H8iUM2PvvffeiR8obMeSehIvOzGAQiaRTCWzFjcL3RdsyAh962taSis+1yCBLoDU/7AoS3GGeTUFr/7pp59+o5WXFRcX+5mhwpxuiZLbJw0E5z+ugP4fT9sIjE6GhZu0uZjMsXLXXXedziGkjVlVTicJGcV+42BH9hDh8t43anqregMqjOI8qFA/ZxcbiDe1dPWlBN/lRPkmhloPQy7Cnn6MbW0t+P/BUfjzeTWKxr7j3gyRk84777wrb7jhhrt5PMXK7HW24N5V1yOPPPKa+tu11157DzHlSqL4SWqCi13bvs/nK/5Tn8//CcJ8Y7dxmwudAAAAAElFTkSuQmCC",
            description: "MPV + ush",
            type: "ush",
            appName: "MPV",
            args: ["{url}", "--force-media-title={title}", "--ontop"]
        },
        {
            name: "PotPlayer",
            icon: "data:image/png;base64,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",
            description: "PotPlayer 标准协议",
            type: "protocol",
            protocol: "potplayer://${url}"
        },
        {
            name: "VLC",
            icon: "data:image/png;base64,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",
            description: "VLC 标准协议",
            type: "protocol",
            protocol: "vlc://${url}"
        }
    ];

    // 自定义播放器列表
    let customPlayers = GM_getValue('customPlayers', []);

    // 标记是否已初始化过默认播放器
    const hasInitializedDefaults = GM_getValue('hasInitializedDefaults', false);

    // 仅在首次安装时添加默认播放器
    if (!hasInitializedDefaults && customPlayers.length === 0) {
        customPlayers = [...defaultPlayers];
        GM_setValue('customPlayers', customPlayers);
        GM_setValue('hasInitializedDefaults', true);
    }

    // 恢复默认播放器列表的函数
    function resetToDefaultPlayers() {
        if (confirm('确定要恢复默认播放器列表吗？\n这将清除所有自定义播放器并恢复为 MPV、PotPlayer、VLC。')) {
            customPlayers = [...defaultPlayers];
            GM_setValue('customPlayers', customPlayers);
            externalPlayer = 'MPV';
            GM_setValue('externalPlayer', externalPlayer);
            showNotification('✅ 已恢复默认播放器列表', 'success');
            setTimeout(() => location.reload(), 1500);
        }
    }

    // 代理地址补全和验证
    function normalizeProxyUrl(url) {
        if (!url || url.trim() === '') {
            return '';
        }

        url = url.trim();

        // 检查是否包含协议
        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
        }

        // 检查是否以 / 结尾
        if (!url.endsWith('/')) {
            url = url + '/';
        }

        // 验证URL格式
        try {
            new URL(url);
            return url;
        } catch (e) {
            return null;
        }
    }

    // 从启用的代理中随机选择一个并应用到视频URL
    function getProxiedUrl(videoUrl) {
        const enabledProxies = proxyList.filter(p => p.enabled);

        if (enabledProxies.length === 0) {
            return videoUrl;
        }

        const randomIndex = Math.floor(Math.random() * enabledProxies.length);
        const selectedProxy = enabledProxies[randomIndex];
        const proxiedUrl = selectedProxy.url + videoUrl;

        console.log(`%c[Iwara Player] 代理信息`, 'color: #ffa500; font-weight: bold;',
            `\n已选择代理: (${randomIndex + 1}/${enabledProxies.length})`,
            '\n代理地址:', selectedProxy.url,
            '\n代理后URL:', proxiedUrl);

        return proxiedUrl;
    }



    // 获取所有可用播放器
    function getAllPlayers() {
        return customPlayers;
    }

    // 根据名称查找播放器
    function getPlayerByName(playerName) {
        return customPlayers.find(p => p.name === playerName);
    }

    // 刷新设置弹窗中的播放器列表
    function refreshPlayerList() {
        const settingsModal = document.getElementById('iwara-mpv-settings-modal');
        if (!settingsModal) return;

        const playerOptionsContainer = settingsModal.querySelector('.iwara-player-options');
        if (!playerOptionsContainer) return;

        const allPlayers = getAllPlayers();
        const playerOptionsHtml = [];

        allPlayers.forEach(player => {
            const isActive = externalPlayer === player.name ? 'active' : '';
            const isChecked = externalPlayer === player.name ? 'checked' : '';
            const deleteBtn = `<button class="iwara-delete-btn" data-player-name="${player.name}" title="删除此播放器" onclick="event.preventDefault(); event.stopPropagation();">❌</button>`;
            const editBtn = `<button class="iwara-edit-btn" data-player-name="${player.name}" title="编辑此播放器" onclick="event.preventDefault(); event.stopPropagation();">✏️</button>`;

            const iconHtml = player.icon && player.icon.startsWith('data:image')
                ? `<img src="${player.icon}" alt="${player.name}" style="width: 24px; height: 24px; object-fit: contain;">`
                : (player.icon || '🎮');

            playerOptionsHtml.push(`
                <label class="iwara-player-option ${isActive}">
                    <input type="radio" name="player" value="${player.name}" ${isChecked}>
                    <span class="iwara-option-icon">${iconHtml}</span>
                    <span class="iwara-option-text">
                        <strong>${player.name}</strong>
                        <small>${player.description || '自定义播放器'}</small>
                    </span>
                    <div class="iwara-player-actions">
                        ${editBtn}
                        ${deleteBtn}
                    </div>
                </label>
            `);
        });

        playerOptionsContainer.innerHTML = playerOptionsHtml.join('');

        // 重新绑定删除和编辑按钮事件
        bindPlayerActionEvents(settingsModal);
    }

    // 绑定播放器操作按钮事件（删除、编辑）
    function bindPlayerActionEvents(modal) {
        // 删除按钮
        modal.querySelectorAll('.iwara-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const playerName = btn.dataset.playerName;
                const player = getPlayerByName(playerName);

                let confirmMessage = `确定要删除播放器"${player.name}"吗？`;
                const isDefaultPlayer = defaultPlayers.some(dp => dp.name === playerName);
                if (isDefaultPlayer) {
                    confirmMessage += '\n\n⚠️ 这是预设播放器，删除后可点击 🔄 恢复';
                }

                if (confirm(confirmMessage)) {
                    // 过滤掉要删除的播放器
                    customPlayers = customPlayers.filter(p => p.name !== playerName);
                    GM_setValue('customPlayers', customPlayers);

                    // 如果删除的是当前选中的播放器
                    if (externalPlayer === playerName) {
                        // 切换到第一个可用播放器
                        if (customPlayers.length > 0) {
                            externalPlayer = customPlayers[0].name;
                            GM_setValue('externalPlayer', externalPlayer);
                        } else {
                            // 如果没有播放器了，使用默认MPV
                            externalPlayer = 'MPV';
                            GM_setValue('externalPlayer', externalPlayer);
                        }
                    }

                    showNotification(`✅ 已删除播放器"${player.name}"`, 'success');
                    refreshPlayerList();
                }
            });
        });

        // 编辑按钮
        modal.querySelectorAll('.iwara-edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const playerName = btn.dataset.playerName;
                const player = getPlayerByName(playerName);
                if (player) {
                    createEditPlayerModal(player);
                }
            });
        });
    }

    // 创建设置弹窗
    function createSettingsModal() {
        // 移除已存在的弹窗
        const existingModal = document.getElementById('iwara-mpv-settings-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const currentProxy = proxyList.map(p => {
            const prefix = p.enabled ? '' : '#';
            return `${prefix}${p.url}`;
        }).join('\n');
        const allPlayers = getAllPlayers();

        // 生成播放器选项HTML
        const playerOptionsHtml = [];

        allPlayers.forEach(player => {
            const isActive = externalPlayer === player.name ? 'active' : '';
            const isChecked = externalPlayer === player.name ? 'checked' : '';
            const deleteBtn = `<button class="iwara-delete-btn" data-player-name="${player.name}" title="删除此播放器" onclick="event.preventDefault(); event.stopPropagation();">❌</button>`;
            const editBtn = `<button class="iwara-edit-btn" data-player-name="${player.name}" title="编辑此播放器" onclick="event.preventDefault(); event.stopPropagation();">✏️</button>`;

            const iconHtml = player.icon && player.icon.startsWith('data:image')
                ? `<img src="${player.icon}" alt="${player.name}" style="width: 24px; height: 24px; object-fit: contain;">`
                : (player.icon || '🎮');

            playerOptionsHtml.push(`
                <label class="iwara-player-option ${isActive}">
                    <input type="radio" name="player" value="${player.name}" ${isChecked}>
                    <span class="iwara-option-icon">${iconHtml}</span>
                    <span class="iwara-option-text">
                        <strong>${player.name}</strong>
                        <small>${player.description || '自定义播放器'}</small>
                    </span>
                    <div class="iwara-player-actions">
                        ${editBtn}
                        ${deleteBtn}
                    </div>
                </label>
            `);
        });

        // 创建弹窗容器
        const modal = document.createElement('div');
        modal.id = 'iwara-mpv-settings-modal';
        modal.className = 'iwara-modal';
        modal.innerHTML = `
            <div class="iwara-modal-overlay">
                <div class="iwara-modal-content">
                    <div class="iwara-modal-header">
                        <h2>⚙️ 播放器设置</h2>
                        <button class="iwara-modal-close">✕</button>
                    </div>

                    <div class="iwara-modal-body">
                        <div class="iwara-settings-section">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                                <h3 style="margin: 0;">🎬 播放方式</h3>
                                <div style="display: flex; gap: 8px;">
                                    <button class="iwara-btn-small reset-players-btn" title="恢复默认播放器">🔄</button>
                                    <button class="iwara-btn-small add-player-btn">➕ 添加播放器</button>
                                </div>
                            </div>
                            <div class="iwara-player-options">
                                ${playerOptionsHtml.join('')}
                            </div>
                            <p class="iwara-hint" style="margin-top: 12px;">💡 提示: 播放器右侧有 ✏️ 编辑和 ❌ 删除按钮，点击 🔄 可恢复默认</p>
                        </div>

                        <div class="iwara-settings-section">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                                <h3 style="margin: 0;">🔗 代理设置</h3>
                                <button class="iwara-btn-small toggle-edit-mode-btn" title="切换编辑模式">📝 多行编辑</button>
                            </div>

                            <div id="single-add-mode" style="display: block;">
                                <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                                    <input type="text" id="new-proxy-input" placeholder="代理地址: proxy.example.com" class="iwara-form-input" style="flex: 1;">
                                    <button class="iwara-btn-small add-proxy-btn" title="添加代理">➕ 添加</button>
                                </div>
                                <div id="proxy-list-container" class="iwara-proxy-list"></div>
                            </div>

                            <div id="multi-edit-mode" style="display: none;">
                                <textarea id="proxy-input" class="iwara-form-textarea" placeholder="每行一个代理，以#开头表示禁用:\nproxy1.example.com\n#proxy2.example.com (禁用)\nhttps://proxy3.example.com/">${currentProxy}</textarea>
                                <p class="iwara-hint">💡 每行一个代理地址，以 # 开头的代理将被禁用</p>
                            </div>
                            <p class="iwara-hint">🔗 多个代理将会随机选取其中一个代理</p>
                            <p class="iwara-hint"><a href="https://github.com/1234567Yang/cf-proxy-ex" target="_blank" style="color: #667eea;">⭐ 万能代理 - 1234567Yang/cf-proxy-ex</a></p>
                        </div>
                    </div>

                    <div class="iwara-modal-footer">
                        <button class="iwara-btn iwara-btn-cancel">取消</button>
                        <button class="iwara-btn iwara-btn-primary">保存设置</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 绑定事件
        const closeModal = () => modal.remove();

        modal.querySelector('.iwara-modal-close').addEventListener('click', closeModal);
        modal.querySelector('.iwara-btn-cancel').addEventListener('click', closeModal);
        modal.querySelector('.iwara-modal-overlay').addEventListener('click', (e) => {
            if (e.target.classList.contains('iwara-modal-overlay')) {
                closeModal();
            }
        });

        // 渲染代理列表（单行添加模式）
        function renderProxyList() {
            const container = modal.querySelector('#proxy-list-container');
            container.innerHTML = '';

            if (proxyList.length === 0) {
                container.innerHTML = '<p class="iwara-hint" style="margin: 0;">暂无代理，请使用上方输入框添加</p>';
                return;
            }

            proxyList.forEach((proxy, index) => {
                const item = document.createElement('div');
                item.className = 'iwara-proxy-item' + (proxy.enabled ? '' : ' disabled');

                const urlSpan = document.createElement('span');
                urlSpan.className = 'proxy-url';
                urlSpan.textContent = proxy.url;

                const toggleBtn = document.createElement('button');
                toggleBtn.className = 'iwara-proxy-toggle' + (proxy.enabled ? '' : ' disabled');
                toggleBtn.textContent = proxy.enabled ? '✓ 启用' : '✕ 禁用';
                toggleBtn.title = proxy.enabled ? '点击禁用' : '点击启用';
                toggleBtn.addEventListener('click', () => {
                    proxy.enabled = !proxy.enabled;
                    renderProxyList();
                });

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'iwara-proxy-delete';
                deleteBtn.textContent = '🗑️';
                deleteBtn.title = '删除此代理';
                deleteBtn.addEventListener('click', () => {
                    if (confirm(`确定要删除代理 "${proxy.url}" 吗？`)) {
                        proxyList.splice(index, 1);
                        renderProxyList();
                    }
                });

                item.appendChild(urlSpan);
                item.appendChild(toggleBtn);
                item.appendChild(deleteBtn);
                container.appendChild(item);
            });
        }

        // 从多行文本同步到proxyList
        function syncFromMultiLineText() {
            const textarea = modal.querySelector('#proxy-input');
            const lines = textarea.value.split('\n');

            proxyList = [];
            lines.forEach(line => {
                line = line.trim();
                if (line === '') return;

                let enabled = true;
                let url = line;

                // 检查是否以 # 开头（禁用标记）
                if (line.startsWith('#')) {
                    enabled = false;
                    url = line.substring(1).trim();
                }

                if (url !== '') {
                    proxyList.push({ url, enabled });
                }
            });
        }

        // 从proxyList同步到多行文本
        function syncToMultiLineText() {
            const textarea = modal.querySelector('#proxy-input');
            const lines = proxyList.map(p => {
                const prefix = p.enabled ? '' : '#';
                return `${prefix}${p.url}`;
            });
            textarea.value = lines.join('\n');
        }

        // 切换编辑模式
        let isMultiEditMode = false;
        const toggleModeBtn = modal.querySelector('.toggle-edit-mode-btn');
        const singleAddMode = modal.querySelector('#single-add-mode');
        const multiEditMode = modal.querySelector('#multi-edit-mode');

        toggleModeBtn.addEventListener('click', () => {
            isMultiEditMode = !isMultiEditMode;

            if (isMultiEditMode) {
                // 切换到多行编辑模式
                syncToMultiLineText();
                singleAddMode.style.display = 'none';
                multiEditMode.style.display = 'block';
                toggleModeBtn.textContent = '📋 列表编辑';
                toggleModeBtn.title = '切换到列表编辑模式';
            } else {
                // 切换到单行添加模式
                syncFromMultiLineText();
                multiEditMode.style.display = 'none';
                singleAddMode.style.display = 'block';
                toggleModeBtn.textContent = '📝 多行编辑';
                toggleModeBtn.title = '切换到多行编辑模式';
                renderProxyList();
            }
        });

        // 添加代理按钮
        const addProxyBtn = modal.querySelector('.add-proxy-btn');
        const newProxyInput = modal.querySelector('#new-proxy-input');

        addProxyBtn.addEventListener('click', () => {
            const url = newProxyInput.value.trim();

            if (!url) {
                showNotification('❌ 请输入代理地址', 'error');
                return;
            }

            const normalized = normalizeProxyUrl(url);
            if (normalized === null) {
                showNotification(`❌ 代理地址格式错误: ${url}`, 'error');
                return;
            }

            // 检查是否已存在相同的代理
            if (proxyList.some(p => p.url === normalized)) {
                showNotification('❌ 该代理已存在', 'error');
                return;
            }

            proxyList.push({ url: normalized, enabled: true });
            newProxyInput.value = '';
            renderProxyList();
            showNotification('✅ 代理已添加', 'success');
        });

        // 回车快捷添加
        newProxyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addProxyBtn.click();
            }
        });

        // 初始化代理列表显示
        renderProxyList();

        // 单选框切换样式
        modal.querySelectorAll('.iwara-player-option input').forEach(radio => {
            radio.addEventListener('change', () => {
                modal.querySelectorAll('.iwara-player-option').forEach(opt => opt.classList.remove('active'));
                radio.closest('.iwara-player-option').classList.add('active');
            });
        });

        // 恢复默认播放器按钮
        modal.querySelector('.reset-players-btn').addEventListener('click', () => {
            closeModal();
            resetToDefaultPlayers();
        });

        // 添加播放器按钮
        modal.querySelector('.add-player-btn').addEventListener('click', () => {
            createAddPlayerModal();
        });

        // 绑定删除和编辑按钮事件
        bindPlayerActionEvents(modal);

        // 保存设置
        modal.querySelector('.iwara-btn-primary').addEventListener('click', () => {
            const selectedPlayer = modal.querySelector('input[name="player"]:checked').value;
            const proxyInput = modal.querySelector('#proxy-input').value;

            let hasChanges = false;

            // 处理播放器设置
            if (externalPlayer !== selectedPlayer) {
                externalPlayer = selectedPlayer;
                GM_setValue('externalPlayer', externalPlayer);
                hasChanges = true;
            }

            // 画质已固定为 Source，无需保存设置

            // 处理代理设置
            if (isMultiEditMode) {
                syncFromMultiLineText();
            }

            // 验证所有代理地址
            const validatedProxyList = [];
            for (const proxy of proxyList) {
                const normalized = normalizeProxyUrl(proxy.url);
                if (normalized === null) {
                    showNotification(`❌ 代理地址格式错误: ${proxy.url}`, 'error');
                    return;
                }
                validatedProxyList.push({
                    url: normalized,
                    enabled: proxy.enabled
                });
            }

            // 比较新旧代理列表
            const oldListStr = JSON.stringify(GM_getValue('proxyList', []));
            const newListStr = JSON.stringify(validatedProxyList);

            if (oldListStr !== newListStr) {
                proxyList = validatedProxyList;
                GM_setValue('proxyList', proxyList);
                hasChanges = true;
            }

            closeModal();

            if (hasChanges) {
                showNotification('✅ 设置已保存，刷新页面生效', 'success');
                setTimeout(() => location.reload(), 1500);
            } else {
                showNotification('ℹ️ 没有修改任何设置', 'info');
            }
        });
    }

    // 创建编辑播放器弹窗
    function createEditPlayerModal(playerData) {
        const editModal = document.createElement('div');
        editModal.id = 'iwara-edit-player-modal';
        editModal.style.zIndex = '9999999'; // 确保在设置弹窗之上

        // 根据播放器类型显示不同的输入框
        const isProtocolType = playerData.type === 'protocol';
        const protocolDisplay = isProtocolType ? 'block' : 'none';
        const ushDisplay = isProtocolType ? 'none' : 'block';

        editModal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content" style="max-width: 450px;">
                    <div class="modal-header">
                        <h2>✏️ 编辑播放器</h2>
                        <button class="close-btn">✕</button>
                    </div>

                    <div class="modal-body">
                        <div class="form-group">
                            <label>播放器名称</label>
                            <input type="text" id="edit-player-name-input" placeholder="例如: PotPlayer" class="form-input" value="${playerData.name}">
                        </div>

                        <div class="form-group">
                            <label>协议类型</label>
                            <select id="edit-protocol-type-select" class="form-input">
                                <option value="protocol" ${isProtocolType ? 'selected' : ''}>标准协议</option>
                                <option value="ush" ${!isProtocolType ? 'selected' : ''}>USH协议</option>
                            </select>
                        </div>

                        <div class="form-group" id="edit-protocol-input-group" style="display: ${protocolDisplay};">
                            <label>协议链接参数</label>
                            <input type="text" id="edit-protocol-input" placeholder="例如: potplayer://\${url}" class="form-input" value="${playerData.protocol || ''}">
                            <p class="hint">使用 \${url} 代表视频URL，例如: potplayer://\${url}/referer=xxx</p>
                        </div>

                        <div class="form-group" id="edit-ush-app-input-group" style="display: ${ushDisplay};">
                            <label>应用名称</label>
                            <input type="text" id="edit-ush-app-input" placeholder="例如: MPV (和ush配置的名称要完全一致)" class="form-input" value="${playerData.appName || ''}">
                            <p class="hint">USH格式: ush://应用名称?参数</p>
                            <p class="iwara-hint"><a href="https://github.com/LuckyPuppy514/url-scheme-handler" target="_blank" style="color: #667eea;">⭐ ush工具 - LuckyPuppy514/url-scheme-handler</a></p>
                        </div>

                        <div class="form-group" id="edit-ush-args-input-group" style="display: ${ushDisplay};">
                            <label>启动参数 (可选)</label>
                            <textarea id="edit-ush-args-input" placeholder="每行一个参数，例如:\n--ontop\n--fullscreen" class="form-textarea" rows="3">${playerData.args ? playerData.args.join('\n') : ''}</textarea>
                            <p class="hint">使用 {url} 代表视频URL，{title} 代表标题</p>
                        </div>

                        <div class="form-group">
                            <label>图标 (Base64 Data URL)</label>
                            <textarea id="edit-player-icon-input" placeholder="data:image/png;base64,iVBORw0KGgoAAAANS..." class="form-textarea" rows="3">${playerData.icon || ''}</textarea>
                            <p class="hint">支持 data:image/png、data:image/svg+xml 等格式</p>
                        </div>

                        <div class="form-group">
                            <label>描述 (可选)</label>
                            <input type="text" id="edit-player-desc-input" placeholder="例如: 需要安装 PotPlayer" class="form-input" value="${playerData.description || ''}">
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button class="btn-cancel">取消</button>
                        <button class="btn-save">保存修改</button>
                    </div>
                </div>
            </div>
        `;

        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            #iwara-edit-player-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 9999999 !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            }

            #iwara-edit-player-modal .modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(20, 20, 30, 0.75);
                backdrop-filter: blur(12px);
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.2s ease;
            }

            #iwara-edit-player-modal .modal-content {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border-radius: 16px;
                width: 90%;
                max-width: 450px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                animation: slideUp 0.3s ease;
                overflow: hidden;
            }

            #iwara-edit-player-modal .modal-header {
                padding: 24px 28px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            #iwara-edit-player-modal .modal-header h2 {
                margin: 0;
                color: white;
                font-size: 20px;
                font-weight: 600;
            }

            #iwara-edit-player-modal .close-btn {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }

            #iwara-edit-player-modal .close-btn:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: rotate(90deg);
            }

            #iwara-edit-player-modal .modal-body {
                padding: 28px;
                max-height: 70vh;
                overflow-y: auto;
            }

            #iwara-edit-player-modal .form-group {
                margin-bottom: 20px;
            }

            #iwara-edit-player-modal .form-group label {
                display: block;
                color: #e0e0e0;
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 8px;
            }

            #iwara-edit-player-modal .form-input,
            #iwara-edit-player-modal .form-textarea {
                width: 100%;
                padding: 10px 14px;
                background: rgba(255, 255, 255, 0.05);
                border: 2px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                color: #e0e0e0;
                font-size: 14px;
                transition: all 0.2s;
                box-sizing: border-box;
                font-family: inherit;
            }

            #iwara-edit-player-modal .form-input:focus,
            #iwara-edit-player-modal .form-textarea:focus {
                outline: none;
                border-color: #667eea;
                background: rgba(255, 255, 255, 0.08);
            }

            #iwara-edit-player-modal .form-input::placeholder,
            #iwara-edit-player-modal .form-textarea::placeholder {
                color: #666;
            }

            #iwara-edit-player-modal .form-textarea {
                resize: vertical;
                min-height: 60px;
            }

            #iwara-edit-player-modal select.form-input {
                cursor: pointer;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23667eea' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: right 12px center;
                padding-right: 36px;
                appearance: none;
                -webkit-appearance: none;
                -moz-appearance: none;
            }

            #iwara-edit-player-modal select.form-input:hover {
                border-color: rgba(102, 126, 234, 0.5);
            }

            #iwara-edit-player-modal select.form-input option {
                background: #1a1a2e;
                color: #e0e0e0;
                padding: 10px;
            }

            #iwara-edit-player-modal select.form-input option:hover {
                background: #667eea;
            }

            #iwara-edit-player-modal .hint {
                margin: 8px 0 0 0;
                color: #999;
                font-size: 12px;
            }

            #iwara-edit-player-modal .modal-footer {
                padding: 20px 28px;
                background: rgba(0, 0, 0, 0.2);
                display: flex;
                justify-content: flex-end;
                gap: 12px;
            }

            #iwara-edit-player-modal .modal-footer button {
                padding: 10px 24px;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }

            #iwara-edit-player-modal .btn-cancel {
                background: rgba(255, 255, 255, 0.1);
                color: #e0e0e0;
            }

            #iwara-edit-player-modal .btn-cancel:hover {
                background: rgba(255, 255, 255, 0.15);
            }

            #iwara-edit-player-modal .btn-save {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }

            #iwara-edit-player-modal .btn-save:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            }
        `;

        editModal.appendChild(style);
        document.body.appendChild(editModal);

        const originalName = playerData.name; // 保存原始名称用于更新

        // 绑定事件
        const closeEditModal = () => editModal.remove();

        editModal.querySelector('.close-btn').addEventListener('click', closeEditModal);
        editModal.querySelector('.btn-cancel').addEventListener('click', closeEditModal);
        editModal.querySelector('.modal-overlay').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                closeEditModal();
            }
        });

        // 协议类型切换
        const protocolTypeSelect = editModal.querySelector('#edit-protocol-type-select');
        const protocolInputGroup = editModal.querySelector('#edit-protocol-input-group');
        const ushAppInputGroup = editModal.querySelector('#edit-ush-app-input-group');
        const ushArgsInputGroup = editModal.querySelector('#edit-ush-args-input-group');

        protocolTypeSelect.addEventListener('change', () => {
            if (protocolTypeSelect.value === 'protocol') {
                protocolInputGroup.style.display = 'block';
                ushAppInputGroup.style.display = 'none';
                ushArgsInputGroup.style.display = 'none';
            } else {
                protocolInputGroup.style.display = 'none';
                ushAppInputGroup.style.display = 'block';
                ushArgsInputGroup.style.display = 'block';
            }
        });

        // 保存修改
        editModal.querySelector('.btn-save').addEventListener('click', () => {
            const name = editModal.querySelector('#edit-player-name-input').value.trim();
            const icon = editModal.querySelector('#edit-player-icon-input').value.trim();
            const description = editModal.querySelector('#edit-player-desc-input').value.trim();
            const protocolType = protocolTypeSelect.value;

            if (!name) {
                showNotification('❌ 请输入播放器名称', 'error');
                return;
            }

            // 检查名称是否与其他播放器冲突（除了自己）
            const existingPlayer = customPlayers.find(p => p.name === name && p.name !== originalName);
            if (existingPlayer) {
                showNotification('❌ 播放器名称已存在，请使用其他名称', 'error');
                return;
            }

            // 验证 icon 格式
            let validIcon = icon;
            if (icon && !icon.startsWith('data:image')) {
                showNotification('❌ 图标必须是 data:image 格式的 Base64 数据', 'error');
                return;
            }
            if (!icon) {
                // 默认图标
                validIcon = CONSTANTS.DEFAULT_ICON;
            }

            const updatedPlayerConfig = {
                name: name,
                icon: validIcon,
                description: description || '自定义播放器'
            };

            if (protocolType === 'protocol') {
                const protocol = editModal.querySelector('#edit-protocol-input').value.trim();
                if (!protocol) {
                    showNotification('❌ 请输入协议链接参数', 'error');
                    return;
                }
                if (!protocol.includes('${url}')) {
                    showNotification('❌ 协议链接参数必须包含 ${url} 占位符', 'error');
                    return;
                }
                updatedPlayerConfig.type = 'protocol';
                updatedPlayerConfig.protocol = protocol;
            } else {
                const appName = editModal.querySelector('#edit-ush-app-input').value.trim();
                if (!appName) {
                    showNotification('❌ 请输入应用名称', 'error');
                    return;
                }
                const args = editModal.querySelector('#edit-ush-args-input').value.trim();
                updatedPlayerConfig.type = 'ush';
                updatedPlayerConfig.appName = appName;
                updatedPlayerConfig.args = args ? args.split('\n').map(a => a.trim()).filter(a => a) : ['{url}'];
            }

            // 找到播放器在数组中的索引并更新
            const playerIndex = customPlayers.findIndex(p => p.name === originalName);
            if (playerIndex !== -1) {
                customPlayers[playerIndex] = updatedPlayerConfig;
                GM_setValue('customPlayers', customPlayers);

                // 如果修改的是当前选中的播放器，更新选中状态
                if (externalPlayer === originalName && name !== originalName) {
                    externalPlayer = name;
                    GM_setValue('externalPlayer', externalPlayer);
                }

                closeEditModal();
                showNotification('✅ 播放器已更新', 'success');

                // 刷新设置弹窗中的播放器列表
                refreshPlayerList();
            } else {
                showNotification('❌ 播放器更新失败', 'error');
            }
        });
    }

    // 创建添加播放器弹窗
    function createAddPlayerModal() {
        const addModal = document.createElement('div');
        addModal.id = 'iwara-add-player-modal';
        addModal.style.zIndex = '9999999'; // 确保在设置弹窗之上
        addModal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content" style="max-width: 450px;">
                    <div class="modal-header">
                        <h2>➕ 添加播放器</h2>
                        <button class="close-btn">✕</button>
                    </div>

                    <div class="modal-body">
                        <div class="form-group">
                            <label>播放器名称</label>
                            <input type="text" id="player-name-input" placeholder="例如: PotPlayer" class="form-input">
                        </div>

                        <div class="form-group">
                            <label>协议类型</label>
                            <select id="protocol-type-select" class="form-input">
                                <option value="protocol">标准协议</option>
                                <option value="ush">USH协议</option>
                            </select>
                        </div>

                        <div class="form-group" id="protocol-input-group">
                            <label>协议链接参数</label>
                            <input type="text" id="protocol-input" placeholder="例如: potplayer://\${url}" class="form-input">
                            <p class="hint">使用 \${url} 代表视频URL，例如: potplayer://\${url}/referer=xxx</p>
                        </div>

                        <div class="form-group" id="ush-app-input-group" style="display: none;">
                            <label>应用名称</label>
                            <input type="text" id="ush-app-input" placeholder="例如: PotPlayer" class="form-input">
                            <p class="hint">USH格式: ush://应用名称?参数</p>
                        </div>

                        <div class="form-group" id="ush-args-input-group" style="display: none;">
                            <label>启动参数 (可选)</label>
                            <textarea id="ush-args-input" placeholder="每行一个参数，例如:\n--ontop\n--fullscreen" class="form-textarea" rows="3"></textarea>
                            <p class="hint">使用 {url} 代表视频URL，{title} 代表标题</p>
                        </div>

                        <div class="form-group">
                            <label>图标 (Base64 Data URL)</label>
                            <textarea id="player-icon-input" placeholder="data:image/png;base64,iVBORw0KGgoAAAANS..." class="form-textarea" rows="3"></textarea>
                            <p class="hint">支持 data:image/png、data:image/svg+xml 等格式</p>
                        </div>

                        <div class="form-group">
                            <label>描述 (可选)</label>
                            <input type="text" id="player-desc-input" placeholder="例如: 需要安装 PotPlayer" class="form-input">
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button class="btn-cancel">取消</button>
                        <button class="btn-save">添加</button>
                    </div>
                </div>
            </div>
        `;

        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            #iwara-add-player-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 9999999 !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            }

            #iwara-add-player-modal .modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(20, 20, 30, 0.75);
                backdrop-filter: blur(12px);
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.2s ease;
            }

            #iwara-add-player-modal .modal-content {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border-radius: 16px;
                width: 90%;
                max-width: 450px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                animation: slideUp 0.3s ease;
                overflow: hidden;
            }

            #iwara-add-player-modal .modal-header {
                padding: 24px 28px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            #iwara-add-player-modal .modal-header h2 {
                margin: 0;
                color: white;
                font-size: 20px;
                font-weight: 600;
            }

            #iwara-add-player-modal .close-btn {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }

            #iwara-add-player-modal .close-btn:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: rotate(90deg);
            }

            #iwara-add-player-modal .modal-body {
                padding: 28px;
                max-height: 70vh;
                overflow-y: auto;
            }

            #iwara-add-player-modal .form-group {
                margin-bottom: 20px;
            }

            #iwara-add-player-modal .form-group label {
                display: block;
                color: #e0e0e0;
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 8px;
            }

            #iwara-add-player-modal .form-input,
            #iwara-add-player-modal .form-textarea {
                width: 100%;
                padding: 10px 14px;
                background: rgba(255, 255, 255, 0.05);
                border: 2px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                color: #e0e0e0;
                font-size: 14px;
                transition: all 0.2s;
                box-sizing: border-box;
                font-family: inherit;
            }

            #iwara-add-player-modal .form-input:focus,
            #iwara-add-player-modal .form-textarea:focus {
                outline: none;
                border-color: #667eea;
                background: rgba(255, 255, 255, 0.08);
            }

            #iwara-add-player-modal .form-input::placeholder,
            #iwara-add-player-modal .form-textarea::placeholder {
                color: #666;
            }

            #iwara-add-player-modal .form-textarea {
                resize: vertical;
                min-height: 60px;
            }

            #iwara-add-player-modal select.form-input {
                cursor: pointer;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23667eea' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: right 12px center;
                padding-right: 36px;
                appearance: none;
                -webkit-appearance: none;
                -moz-appearance: none;
            }

            #iwara-add-player-modal select.form-input:hover {
                border-color: rgba(102, 126, 234, 0.5);
            }

            #iwara-add-player-modal select.form-input option {
                background: #1a1a2e;
                color: #e0e0e0;
                padding: 10px;
            }

            #iwara-add-player-modal select.form-input option:hover {
                background: #667eea;
            }

            #iwara-add-player-modal .hint {
                margin: 8px 0 0 0;
                color: #999;
                font-size: 12px;
            }

            #iwara-add-player-modal .modal-footer {
                padding: 20px 28px;
                background: rgba(0, 0, 0, 0.2);
                display: flex;
                justify-content: flex-end;
                gap: 12px;
            }

            #iwara-add-player-modal .modal-footer button {
                padding: 10px 24px;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }

            #iwara-add-player-modal .btn-cancel {
                background: rgba(255, 255, 255, 0.1);
                color: #e0e0e0;
            }

            #iwara-add-player-modal .btn-cancel:hover {
                background: rgba(255, 255, 255, 0.15);
            }

            #iwara-add-player-modal .btn-save {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }

            #iwara-add-player-modal .btn-save:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            }
        `;

        addModal.appendChild(style);
        document.body.appendChild(addModal);

        // 绑定事件
        const closeAddModal = () => addModal.remove();

        addModal.querySelector('.close-btn').addEventListener('click', closeAddModal);
        addModal.querySelector('.btn-cancel').addEventListener('click', closeAddModal);
        addModal.querySelector('.modal-overlay').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                closeAddModal();
            }
        });

        // 协议类型切换
        const protocolTypeSelect = addModal.querySelector('#protocol-type-select');
        const protocolInputGroup = addModal.querySelector('#protocol-input-group');
        const ushAppInputGroup = addModal.querySelector('#ush-app-input-group');
        const ushArgsInputGroup = addModal.querySelector('#ush-args-input-group');

        protocolTypeSelect.addEventListener('change', () => {
            if (protocolTypeSelect.value === 'protocol') {
                protocolInputGroup.style.display = 'block';
                ushAppInputGroup.style.display = 'none';
                ushArgsInputGroup.style.display = 'none';
            } else {
                protocolInputGroup.style.display = 'none';
                ushAppInputGroup.style.display = 'block';
                ushArgsInputGroup.style.display = 'block';
            }
        });

        // 保存播放器
        addModal.querySelector('.btn-save').addEventListener('click', () => {
            const name = addModal.querySelector('#player-name-input').value.trim();
            const icon = addModal.querySelector('#player-icon-input').value.trim();
            const description = addModal.querySelector('#player-desc-input').value.trim();
            const protocolType = protocolTypeSelect.value;

            if (!name) {
                showNotification('❌ 请输入播放器名称', 'error');
                return;
            }

            // 检查名称是否已存在（去除旧数据中的id字段干扰）
            const existingPlayer = customPlayers.find(p => p.name === name);
            if (existingPlayer) {
                showNotification('❌ 播放器名称已存在，请使用其他名称', 'error');
                return;
            }

            // 验证 icon 格式
            let validIcon = icon;
            if (icon && !icon.startsWith('data:image')) {
                showNotification('❌ 图标必须是 data:image 格式的 Base64 数据', 'error');
                return;
            }
            if (!icon) {
                // 默认图标
                validIcon = CONSTANTS.DEFAULT_ICON;
            }

            const playerConfig = {
                name: name,
                icon: validIcon,
                description: description || '自定义播放器'
            };

            if (protocolType === 'protocol') {
                const protocol = addModal.querySelector('#protocol-input').value.trim();
                if (!protocol) {
                    showNotification('❌ 请输入协议链接参数', 'error');
                    return;
                }
                if (!protocol.includes('${url}')) {
                    showNotification('❌ 协议链接参数必须包含 ${url} 占位符', 'error');
                    return;
                }
                playerConfig.type = 'protocol';
                playerConfig.protocol = protocol;
            } else {
                const appName = addModal.querySelector('#ush-app-input').value.trim();
                if (!appName) {
                    showNotification('❌ 请输入应用名称', 'error');
                    return;
                }
                const args = addModal.querySelector('#ush-args-input').value.trim();
                playerConfig.type = 'ush';
                playerConfig.appName = appName;
                playerConfig.args = args ? args.split('\n').map(a => a.trim()).filter(a => a) : ['{url}'];
            }

            customPlayers.push(playerConfig);
            GM_setValue('customPlayers', customPlayers);

            closeAddModal();
            showNotification('✅ 播放器已添加', 'success');

            // 重新打开设置弹窗
            const settingsModal = document.getElementById('iwara-mpv-settings-modal');
            if (settingsModal) {
                settingsModal.remove();
            }
            setTimeout(() => createSettingsModal(), 500);
        });
    }

    // 显示通知（带高亮效果）
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999999;
            padding: 16px 24px;
            background: ${type === 'error' ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)' :
                         type === 'success' ? 'linear-gradient(135deg, #51cf66 0%, #37b24d 100%)' :
                         'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
            color: white;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 0 20px ${type === 'error' ? 'rgba(255, 107, 107, 0.5)' :
                         type === 'success' ? 'rgba(81, 207, 102, 0.5)' :
                         'rgba(102, 126, 234, 0.5)'};
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 14px;
            font-weight: 600;
            border: 2px solid ${type === 'error' ? 'rgba(255, 255, 255, 0.3)' :
                         type === 'success' ? 'rgba(255, 255, 255, 0.3)' :
                         'rgba(255, 255, 255, 0.3)'};
            animation: slideInRight 0.3s ease, pulse 1.5s ease-in-out infinite;
            white-space: pre-line;
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes pulse {
                0%, 100% { box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 0 20px ${type === 'error' ? 'rgba(255, 107, 107, 0.5)' :
                         type === 'success' ? 'rgba(81, 207, 102, 0.5)' :
                         'rgba(102, 126, 234, 0.5)'}; }
                50% { box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 0 30px ${type === 'error' ? 'rgba(255, 107, 107, 0.8)' :
                         type === 'success' ? 'rgba(81, 207, 102, 0.8)' :
                         'rgba(102, 126, 234, 0.8)'}, 0 0 10px rgba(255, 255, 255, 0.5); }
            }
        `;
        notification.appendChild(styleSheet);

        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // 统一设置菜单
    GM_registerMenuCommand('⚙️ 播放器设置', createSettingsModal);

    // 创建右下角设置按钮
    function createSettingsButton() {
        // 防止重复创建
        if (document.getElementById('iwara-mpv-settings-fab')) {
            return;
        }

        const settingsButton = document.createElement('button');
        settingsButton.id = 'iwara-mpv-settings-fab';
        settingsButton.className = 'iwara-mpv-fab';
        settingsButton.innerHTML = '⚙️';
        settingsButton.title = '播放器设置';

        // 点击打开设置
        settingsButton.addEventListener('click', createSettingsModal);

        document.body.appendChild(settingsButton);
    }

    // 压缩参数
    function compress(str) {
        return btoa(String.fromCharCode(...pako.gzip(str)));
    }

    // ========== 视频链接获取逻辑 (来自 getvideo.js) ==========

    // SHA-1 哈希 (使用Web Crypto API)
    async function hashStringSHA1(input) {
        const encoder = new TextEncoder();
        const data = encoder.encode(input);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // 通过视频ID获取视频链接
    async function getVideoLinkById(videoId, quality = null) {
        try {
            // 获取本地存储的访问令牌
            const token = localStorage.getItem('token');
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // 步骤1: 获取视频信息
            const infoResponse = await fetch(`https://api.iwara.tv/video/${videoId}`, {
                headers: headers
            });
            if (!infoResponse.ok) throw new Error('获取视频信息失败');
            const info = await infoResponse.json();

            if (!info.file) throw new Error('视频文件不存在');

            const fileUrl = new URL(info.fileUrl);
            const fileId = info.file.id;
            const expires = fileUrl.searchParams.get('expires');
            const hash = fileUrl.searchParams.get('hash');

            // 步骤2: 生成验证令牌
            const xVersion = await hashStringSHA1(`${fileId}_${expires}_5nFp9kmbNnHdAFhaqMvt`);

            // 步骤3: 获取视频资源
            const resourceUrl = `https://files.iwara.tv${fileUrl.pathname}?expires=${expires}&hash=${hash}`;
            const resourceHeaders = { 'X-Version': xVersion };
            if (token) {
                resourceHeaders['Authorization'] = `Bearer ${token}`;
            }

            const resourceResponse = await fetch(resourceUrl, {
                headers: resourceHeaders
            });

            if (!resourceResponse.ok) throw new Error('获取视频资源失败');
            const resources = await resourceResponse.json();

            // 步骤4: 提取链接 - 优先使用指定画质，否则使用设置的画质
            const targetQuality = quality || videoQuality;
            const video = resources.find(v => v.name === targetQuality) || resources.find(v => v.name === 'Source') || resources[0];
            const finalUrl = 'https:' + video.src.view;

            return { url: finalUrl, title: info.title, quality: video.name };
        } catch (error) {
            console.error('[Iwara Player] 获取视频链接失败:', error);
            throw error;
        }
    }

    // 动态获取视频URL（支持页面变动后重新获取）
    function getVideoUrl() {
        const videoElement = document.querySelector(CONSTANTS.SELECTORS.VIDEO_ELEMENT);
        if (videoElement && videoElement.src) {
            return videoElement.src;
        }

        console.warn('%c[Iwara Player] 未找到视频源', 'color: #ff6b6b; font-weight: bold;');
        return null;
    }

    // 生成播放器协议链接
    function getPlayerProtocolUrl(playerName, videoUrl, videoTitle) {
        // 查找播放器
        const player = customPlayers.find(p => p.name === playerName);
        if (!player) {
            // 默认使用 MPV
            const defaultArgs = [`"${videoUrl}"`, `--force-media-title="${videoTitle}"`, '--ontop'];
            return `ush://MPV?${compress(defaultArgs.join(' '))}`;
        }

        if (player.type === 'protocol') {
            // 标准协议: 支持参数模板，使用 ${url} 占位符
            const protocolTemplate = player.protocol || '';
            // 替换 ${url} 占位符
            return protocolTemplate.replace(/\$\{url\}/g, videoUrl);
        } else if (player.type === 'ush') {
            // USH协议: ush://AppName?args
            let args = player.args || ['{url}'];
            // 替换占位符
            args = args.map(arg =>
                arg.replace('{url}', `"${videoUrl}"`).replace('{title}', `"${videoTitle}"`)
            );
            return `ush://${player.appName}?${compress(args.join(' '))}`;
        }

        // 兜底
        const defaultArgs = [`"${videoUrl}"`, `--force-media-title="${videoTitle}"`, '--ontop'];
        return `ush://MPV?${compress(defaultArgs.join(' '))}`;
    }

    // 获取视频标题的公共函数
    function getVideoTitle() {
        const titleElement = document.querySelector(CONSTANTS.SELECTORS.VIDEO_TITLE);
        return titleElement ? titleElement.innerText.trim() : document.title;
    }

    // 创建SVG图标的公共函数
    function createSVGIcon(pathData, viewBox = "0 0 24 24") {
        return `<svg viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="2">${pathData}</svg>`;
    }

    // 从当前页面 URL 提取视频 ID
    function getVideoIdFromUrl() {
        const match = window.location.pathname.match(/\/video\/([^\/]+)/);
        return match ? match[1] : null;
    }

    // 使用外部播放器播放 (视频详情页)
    function playWithExternalPlayer() {
        const videoUrl = getVideoUrl();

        if (!videoUrl) {
            showNotification('❌ 未找到视频源\n请确保视频已加载', 'error');
            return;
        }

        // 应用代理到视频URL
        const finalUrl = getProxiedUrl(videoUrl);

        // 获取视频标题
        const videoTitle = getVideoTitle();

        // 使用外部播放器播放
        const protocolUrl = getPlayerProtocolUrl(externalPlayer, finalUrl, videoTitle);

        try {
            // 合并输出信息
            console.log(`%c[Iwara Player] 播放信息`, 'color: #667eea; font-weight: bold;',
                '\n标题:', videoTitle,
                '\n播放器:', externalPlayer,
                '\n画质: 当前网页画质',
                '\nURL:', finalUrl);

            showNotification(`🎬 调用 ${externalPlayer} 播放器\n画质: 当前网页画质`, 'info');
            window.open(protocolUrl, '_self');
        } catch (error) {
            console.error('[Iwara Player] 调用失败:', error);
            showNotification(`❌ 启动 ${externalPlayer} 失败\n请确保已安装并正确配置协议`, 'error');
        }
    }

    // 播放视频 (通过视频ID)
    async function playVideoById(videoId, videoTitle, quality = null) {
        try {
            showNotification('🔄 正在获取视频链接...', 'info');
            
            const { url, title, quality: actualQuality } = await getVideoLinkById(videoId, quality);
            const finalUrl = getProxiedUrl(url);
            const finalTitle = videoTitle || title;

            // 合并输出信息
            console.log(`%c[Iwara Player] 播放信息`, 'color: #667eea; font-weight: bold;',
                '\n视频ID:', videoId,
                '\n标题:', finalTitle,
                '\n播放器:', externalPlayer,
                '\n画质:', actualQuality,
                '\nURL:', finalUrl);

            // 使用外部播放器播放
            showNotification(`🎬 调用 ${externalPlayer} 播放器\n画质: ${actualQuality}`, 'info');
            const protocolUrl = getPlayerProtocolUrl(externalPlayer, finalUrl, finalTitle);
            window.open(protocolUrl, '_self');
        } catch (error) {
            console.error('[Iwara Player] 播放失败:', error);
            showNotification(`❌ 获取视频链接失败\n${error.message}`, 'error');
        }
    }

    // 创建固定按钮组 (视频详情页)
    function createButton() {
        // 防止重复创建
        if (document.getElementById('iwara-mpv-button-group-detail')) {
            return;
        }

        // 获取当前视频URL
        const videoUrl = getVideoUrl();
        if (!videoUrl) {
            console.warn('[Iwara Player] 视频URL未找到，无法创建按钮');
            return;
        }

        // 获取视频标题
        const videoTitle = getVideoTitle();

        // 创建按钮组容器
        const buttonGroup = document.createElement('div');
        buttonGroup.id = 'iwara-mpv-button-group-detail';

        // 复制按钮
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-btn';
        copyButton.title = '复制视频链接';
        copyButton.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
        `;
        copyButton.addEventListener('click', async () => {
            try {
                const finalUrl = getProxiedUrl(videoUrl);
                await navigator.clipboard.writeText(finalUrl);
                showNotification('✅ 链接已复制到剪贴板', 'success');
            } catch (error) {
                console.error('[Iwara Player] 复制失败:', error);
                showNotification('❌ 复制失败: ' + error.message, 'error');
            }
        });

        // 新标签页播放按钮
        const downloadButton = document.createElement('button');
        downloadButton.className = 'new-tab-btn';
        downloadButton.title = '在新标签页播放';
        downloadButton.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
        `;
        downloadButton.addEventListener('click', () => {
            try {
                const finalUrl = getProxiedUrl(videoUrl);
                window.open(finalUrl, '_blank');
                showNotification('✅ 已在新标签页打开', 'success');
            } catch (error) {
                console.error('[Iwara Player] 打开失败:', error);
                showNotification('❌ 打开失败: ' + error.message, 'error');
            }
        });

        // 画质切换按钮 - 固定为 540
        const qualityButton = document.createElement('button');
        qualityButton.className = 'quality-btn';
        qualityButton.title = '使用 540 画质播放';
        qualityButton.textContent = '540';
        qualityButton.addEventListener('click', async () => {
            // 从 URL 中提取视频 ID
            const videoId = getVideoIdFromUrl();
            if (!videoId) {
                showNotification('❌ 无法获取视频 ID', 'error');
                return;
            }
            // 使用 540 画质播放
            playVideoById(videoId, videoTitle, '540');
        });

        // 播放按钮 - 固定为 Source 画质
        const playButton = document.createElement('button');
        playButton.className = 'play-btn';
        playButton.title = '使用外部播放器播放 (Source)';
        playButton.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
        `;
        playButton.addEventListener('click', playWithExternalPlayer);

        // 2x2 网格布局添加按钮
        buttonGroup.appendChild(copyButton);
        buttonGroup.appendChild(downloadButton);
        buttonGroup.appendChild(qualityButton);
        buttonGroup.appendChild(playButton);

        document.body.appendChild(buttonGroup);
    }

    // 创建悬停按钮 (视频列表页)
    function createHoverButton(videoTeaser, videoId, videoName) {
        // 防止重复创建
        if (videoTeaser.querySelector('.iwara-mpv-button-group')) {
            return;
        }

        // 创建按钮组容器
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'iwara-mpv-button-group';

        // 复制按钮
        const copyButton = document.createElement('button');
        copyButton.className = 'iwara-mpv-action-btn copy';
        copyButton.title = '复制视频链接';
        copyButton.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
        `;
        copyButton.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            try {
                showNotification('🔄 正在获取视频链接...', 'info');
                const { url } = await getVideoLinkById(videoId);
                const finalUrl = getProxiedUrl(url);
                await navigator.clipboard.writeText(finalUrl);
                showNotification('✅ 链接已复制到剪贴板', 'success');
            } catch (error) {
                console.error('[Iwara Player] 复制失败:', error);
                showNotification('❌ 复制失败: ' + error.message, 'error');
            }
        });

        // 新标签页播放按钮
        const newTabButton = document.createElement('button');
        newTabButton.className = 'iwara-mpv-action-btn new-tab';
        newTabButton.title = '在新标签页播放';
        newTabButton.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
        `;
        newTabButton.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            try {
                showNotification('🔄 正在获取视频链接...', 'info');
                const { url } = await getVideoLinkById(videoId);
                const finalUrl = getProxiedUrl(url);
                window.open(finalUrl, '_blank');
                showNotification('✅ 已在新标签页打开', 'success');
            } catch (error) {
                console.error('[Iwara Player] 打开失败:', error);
                showNotification('❌ 打开失败: ' + error.message, 'error');
            }
        });

        // 画质切换播放按钮 - 固定为 540
        const qualityButton = document.createElement('button');
        qualityButton.className = 'iwara-mpv-action-btn quality';
        qualityButton.title = '使用 540 画质播放';
        qualityButton.textContent = '540';
        qualityButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            playVideoById(videoId, videoName, '540');
        });

        // 播放按钮 - 固定为 Source 画质
        const playButton = document.createElement('button');
        playButton.className = 'iwara-mpv-hover-button';
        playButton.title = '使用外部播放器播放 (Source)';
        playButton.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
        `;
        playButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            playVideoById(videoId, videoName);
        });

        // 2x2 网格布局添加按钮
        // 第一行: 复制, 新标签页播放
        buttonGroup.appendChild(copyButton);
        buttonGroup.appendChild(newTabButton);
        // 第二行: 画质切换, 播放
        buttonGroup.appendChild(qualityButton);
        buttonGroup.appendChild(playButton);

        videoTeaser.appendChild(buttonGroup);
        return buttonGroup;
    }

    // 处理视频列表项悬停
    function handleVideoTeaserHover() {
        const videoTeasers = document.querySelectorAll('.videoTeaser');

        videoTeasers.forEach((teaser, index) => {
            // 如果已经处理过，跳过
            if (teaser.dataset.mpvProcessed) {
                return;
            }
            teaser.dataset.mpvProcessed = 'true';

            // 从 a.videoTeaser__thumbnail 的 href 获取视频ID
            const thumbnailLink = teaser.querySelector('a.videoTeaser__thumbnail');
            if (!thumbnailLink) {
                return;
            }

            const href = thumbnailLink.getAttribute('href');
            if (!href) {
                return;
            }

            // 从 href 中提取视频ID: /video/{videoId}/{title}
            const videoIdMatch = href.match(/\/video\/([^\/]+)/);
            if (!videoIdMatch) {
                return;
            }

            const videoId = videoIdMatch[1];

            // 尝试从标题元素获取视频名称
            const titleElement = teaser.querySelector('.videoTeaser__title, a[title]');
            const videoName = titleElement ? (titleElement.getAttribute('title') || titleElement.textContent.trim()) : 'Video';

            if (!videoId) {
                return;
            }

            // 创建按钮组
            const buttonGroup = createHoverButton(teaser, videoId, videoName);

            // 鼠标进入显示按钮组
            teaser.addEventListener('mouseenter', () => {
                if (buttonGroup) {
                    buttonGroup.style.display = 'grid';
                    setTimeout(() => {
                        buttonGroup.classList.add('visible');
                        // 为每个按钮添加动画效果
                        const buttons = buttonGroup.querySelectorAll('button');
                        buttons.forEach((btn, index) => {
                            setTimeout(() => {
                                btn.style.transform = btn.classList.contains('iwara-mpv-hover-button') ? 'scale(1)' : 'scale(1)';
                                btn.style.opacity = '1';
                            }, index * 50);
                        });
                    }, 10);
                }
            });

            // 鼠标离开隐藏按钮组
            teaser.addEventListener('mouseleave', () => {
                if (buttonGroup) {
                    buttonGroup.classList.remove('visible');
                    const buttons = buttonGroup.querySelectorAll('button');
                    buttons.forEach(btn => {
                        btn.style.opacity = '0';
                        btn.style.transform = btn.classList.contains('iwara-mpv-hover-button') ? 'scale(0.9)' : 'scale(0.8)';
                    });
                    setTimeout(() => {
                        buttonGroup.style.display = 'none';
                    }, 200);
                }
            });
        });
    }

    // 移除旧按钮组（页面变化时）
    function removeButton() {
        const oldButtonGroup = document.getElementById('iwara-mpv-button-group-detail');
        if (oldButtonGroup) {
            oldButtonGroup.remove();
        }
        // 兼容旧版本的单个按钮
        const oldButton = document.getElementById('iwara-mpv-button');
        if (oldButton) {
            oldButton.remove();
        }
    }

    // 检查是否在视频页面
    function isVideoPage() {
        return /\/video\/[a-zA-Z0-9]+/.test(window.location.pathname);
    }

    // 检查是否在视频列表页面
    function isVideoListPage() {
        return /\/(videos|subscriptions|playlist|search|profile)/.test(window.location.pathname) ||
               window.location.pathname === '/';
    }

    // 初始化
    function init() {
        console.log(`%c[Iwara Player] 脚本初始化完成`, 'color: #51cf66; font-weight: bold; font-size: 14px;',
            '\n当前播放器:', externalPlayer,
            '\n默认画质: Source (固定)',
            '\n反向画质: 540 (固定)');

        // 创建右下角设置按钮
        createSettingsButton();

        // 监听URL变化（SPA路由）
        let lastUrl = location.href;
        new MutationObserver(() => {
            const currentUrl = location.href;
            if (currentUrl !== lastUrl) {
                lastUrl = currentUrl;
                removeButton();

                // 视频详情页
                if (isVideoPage()) {
                    setTimeout(() => {
                        if (getVideoUrl()) {
                            createButton();
                        }
                    }, 1000);
                }

                // 视频列表页
                if (isVideoListPage()) {
                    setTimeout(handleVideoTeaserHover, 500);
                }
            }
        }).observe(document, { subtree: true, childList: true });

        // 监听视频元素出现（详情页）
        const videoObserver = new MutationObserver(() => {
            if (isVideoPage() && getVideoUrl() && !document.getElementById('iwara-mpv-button-group-detail')) {
                createButton();
            }
        });

        videoObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

        // 监听列表页视频项出现
        const listObserver = new MutationObserver(() => {
            if (isVideoListPage()) {
                handleVideoTeaserHover();
            }
        });

        listObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

        // 初次检查
        if (isVideoPage() && getVideoUrl()) {
            createButton();
        }

        if (isVideoListPage()) {
            setTimeout(() => {
                handleVideoTeaserHover();
            }, 1000);
        }
    }

    // 启动
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

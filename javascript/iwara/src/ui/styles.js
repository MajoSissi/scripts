export function injectGlobalStyles() {
	GM_addStyle(`
		:root {
			--iwara-bg: #282c34;
			--iwara-bg-2: #21252b;
			--iwara-panel: #1f2329;
			--iwara-border: rgba(171, 178, 191, 0.14);
			--iwara-border-strong: rgba(171, 178, 191, 0.22);
			--iwara-text: #abb2bf;
			--iwara-text-strong: #dcdfe4;
			--iwara-muted: #5c6370;
			--iwara-subtle: #7f848e;
			--iwara-accent: #61afef;
			--iwara-cyan: #56b6c2;
			--iwara-green: #98c379;
			--iwara-orange: #d19a66;
			--iwara-yellow: #e5c07b;
			--iwara-red: #e06c75;
		}

        /* ========== 浮动按钮样式 ========== */
        .iwara-mpv-fab {
            position: fixed;
            right: 30px;
            z-index: 999998;
            background: linear-gradient(135deg, var(--iwara-accent) 0%, var(--iwara-cyan) 100%);
            color: #fff;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 16px rgba(97, 175, 239, 0.35);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(10px);
            user-select: none;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .iwara-mpv-fab:hover {
            background: linear-gradient(135deg, var(--iwara-cyan) 0%, var(--iwara-accent) 100%);
            box-shadow: 0 6px 20px rgba(97, 175, 239, 0.5);
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
        #iwara-mpv-settings-fab svg {
            width: 28px;
            height: 28px;
            fill: #ffffff;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: block;
        }
        #iwara-mpv-settings-fab:hover {
            box-shadow: 0 8px 24px rgba(97, 175, 239, 0.6);
        }
        #iwara-mpv-settings-fab:hover svg {
            transform: rotate(90deg);
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
            box-shadow: 0 4px 16px rgba(97, 175, 239, 0.22);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 2px solid;
            backdrop-filter: blur(10px);
        }
        #iwara-mpv-button-group-detail button:hover {
            box-shadow: 0 6px 20px rgba(97, 175, 239, 0.3);
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
            color: var(--iwara-accent);
            border-color: var(--iwara-accent);
        }
        #iwara-mpv-button-group-detail .copy-btn:hover {
            background: var(--iwara-accent);
            color: #fff;
        }
        #iwara-mpv-button-group-detail .new-tab-btn {
            background: rgba(255, 255, 255, 0.95);
            color: var(--iwara-green);
            border-color: var(--iwara-green);
        }
        #iwara-mpv-button-group-detail .new-tab-btn:hover {
            background: var(--iwara-green);
            color: #fff;
        }
        #iwara-mpv-button-group-detail .quality-btn {
            background: rgba(255, 255, 255, 0.95);
            color: var(--iwara-orange);
            border-color: var(--iwara-orange);
            font-size: 14px;
            font-weight: bold;
        }
        #iwara-mpv-button-group-detail .quality-btn:hover {
            background: var(--iwara-orange);
            color: #fff;
        }
        #iwara-mpv-button-group-detail .play-btn {
            background: linear-gradient(135deg, var(--iwara-accent) 0%, var(--iwara-cyan) 100%);
            color: #fff;
            border-color: var(--iwara-accent);
        }
        #iwara-mpv-button-group-detail .play-btn:hover {
            box-shadow: 0 6px 16px rgba(97, 175, 239, 0.45);
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
        /* 当按钮少于4个时，改为单列布局 */
        .iwara-mpv-button-group.single-column {
            grid-template-columns: 1fr;
            grid-template-rows: auto;
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
            color: var(--iwara-accent);
            border-color: var(--iwara-accent);
        }
        .iwara-mpv-action-btn.copy:hover {
            background: var(--iwara-accent);
            color: #fff;
        }

        /* 新标签页播放按钮 */
        .iwara-mpv-action-btn.new-tab {
            background: rgba(255, 255, 255, 0.95);
            color: var(--iwara-green);
            border-color: var(--iwara-green);
        }
        .iwara-mpv-action-btn.new-tab:hover {
            background: var(--iwara-green);
            color: #fff;
        }

        /* 画质按钮 */
        .iwara-mpv-action-btn.quality {
            background: rgba(255, 255, 255, 0.95);
            color: var(--iwara-orange);
            border-color: var(--iwara-orange);
            font-size: 14px;
            font-weight: bold;
        }
        .iwara-mpv-action-btn.quality:hover {
            background: var(--iwara-orange);
            color: #fff;
        }

        /* 播放按钮 */
        .iwara-mpv-button-group .iwara-mpv-hover-button {
            background: linear-gradient(135deg, var(--iwara-accent) 0%, var(--iwara-cyan) 100%);
            color: #fff;
            border-color: var(--iwara-accent);
        }
        .iwara-mpv-button-group .iwara-mpv-hover-button:hover {
            box-shadow: 0 6px 16px rgba(97, 175, 239, 0.45);
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
            color: var(--iwara-text);
            font-size: 14px;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            transition: all 0.2s;
            box-sizing: border-box;
        }
        .iwara-form-input:focus,
        .iwara-form-textarea:focus {
            outline: none;
            border-color: var(--iwara-accent);
            background: rgba(255, 255, 255, 0.08);
        }
        .iwara-form-input::placeholder,
        .iwara-form-textarea::placeholder {
            color: var(--iwara-muted);
        }
        .iwara-form-textarea {
            resize: vertical;
            min-height: 80px;
            line-height: 1.5;
        }

        /* ========== 按钮设置复选框样式 ========== */
        .iwara-button-settings-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
        }
        .iwara-checkbox-label {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 16px;
            background: rgba(255, 255, 255, 0.03);
            border: 2px solid rgba(255, 255, 255, 0.08);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            user-select: none;
        }
        .iwara-checkbox-label:hover {
            background: rgba(97, 175, 239, 0.10);
            border-color: rgba(97, 175, 239, 0.28);
        }
        .iwara-checkbox-label input[type="checkbox"] {
            appearance: none;
            -webkit-appearance: none;
            width: 18px;
            height: 18px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 4px;
            background: rgba(0, 0, 0, 0.3);
            cursor: pointer;
            position: relative;
            transition: all 0.2s;
            flex-shrink: 0;
        }
        .iwara-checkbox-label input[type="checkbox"]:hover {
            border-color: var(--iwara-accent);
        }
        .iwara-checkbox-label input[type="checkbox"]:checked {
            background: linear-gradient(135deg, var(--iwara-accent) 0%, var(--iwara-cyan) 100%);
            border-color: var(--iwara-accent);
        }
        .iwara-checkbox-label input[type="checkbox"]:checked::after {
            content: '✓';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 12px;
            font-weight: bold;
        }
        .iwara-checkbox-label span {
            color: var(--iwara-text);
            font-size: 13px;
            font-weight: 500;
            transition: color 0.2s;
        }
        .iwara-checkbox-label:hover span {
            color: var(--iwara-text-strong);
        }
        .iwara-checkbox-label input[type="checkbox"]:checked + span {
            color: var(--iwara-text-strong);
        }
        .iwara-settings-subsection {
            margin-bottom: 16px;
            padding-bottom: 16px;
            border-bottom: 1px dashed rgba(255, 255, 255, 0.04);
        }
        .iwara-settings-subsection:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
        }
        .iwara-settings-subsection h5 {
            color: var(--iwara-text-strong);
            margin: 0 0 10px 0;
            font-size: 14px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .iwara-settings-section-title {
            color: var(--iwara-text-strong);
            margin: 0 0 20px 0;
            font-size: 17px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 10px;
            padding-bottom: 0;
            border-bottom: none;
            position: relative;
            padding-left: 16px;
            letter-spacing: 0.3px;
        }
        .iwara-settings-section-title::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 4px;
            height: 20px;
            background: linear-gradient(to bottom, var(--iwara-accent), var(--iwara-cyan));
            border-radius: 2px;
        }
        .iwara-settings-section-title.no-indicator {
            padding-left: 0;
        }
        .iwara-settings-section-title.no-indicator::before {
            display: none;
        }
        .iwara-settings-section {
            padding: 24px 0;
            margin-bottom: 0;
            background: transparent;
            border-radius: 0;
            border: none;
            border-bottom: 1px solid var(--iwara-border);
            position: relative;
        }
        .iwara-settings-section::before {
            content: '';
            position: absolute;
            left: 0;
            right: 0;
            bottom: -1px;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(97, 175, 239, 0.28), transparent);
            opacity: 0;
            transition: opacity 0.3s;
        }
        .iwara-settings-section:hover::before {
            opacity: 1;
        }
        .iwara-settings-section:last-child {
            margin-bottom: 0;
            border-bottom: none;
        }
        .iwara-settings-section:last-child::before {
            display: none;
        }
        .iwara-settings-section:first-child {
            padding-top: 0;
        }
        .iwara-settings-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: -4px 0 14px 0;
        }
        .iwara-settings-header h4 {
            color: var(--iwara-text-strong);
            margin: 0;
            font-size: 16px;
            font-weight: 600;
        }

        /* ========== 新设计的模态框样式 ========== */
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
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(12px);
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        /* 新设计：左右分栏容器 */
        .iwara-modal-content {
            background: var(--iwara-panel);
            border-radius: 10px;
            width: 900px;
            max-width: 1100px;
            height: 85vh;
            max-height: 750px;
            box-shadow: 0 25px 80px rgba(0, 0, 0, 0.7);
            animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            position: relative;
        }
        @keyframes slideUp {
            from { transform: translateY(40px) scale(0.95); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
        }



        /* 主容器 */
        .iwara-modal-main {
            display: flex;
            flex: 1;
            overflow: hidden;
        }

        /* 左侧边栏 */
        .iwara-modal-sidebar {
            width: 200px;
            background: var(--iwara-bg-2);
            border-right: 1px solid var(--iwara-border);
            display: flex;
            flex-direction: column;
            overflow-y: auto;
        }


        /* 播放器列表 */
        .iwara-sidebar-players {
            flex: 1;
            padding: 16px 12px;
            overflow-y: auto;
        }
        .iwara-sidebar-player-item {
            display: flex;
            align-items: center;
            padding: 12px 14px;
            margin-bottom: 8px;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid transparent;
            position: relative;
            overflow: hidden;
        }
        .iwara-sidebar-player-item::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 3px;
            background: linear-gradient(to bottom, var(--iwara-accent), var(--iwara-cyan));
            transform: scaleY(0);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            border-radius: 0 2px 2px 0;
        }
        .iwara-sidebar-player-item::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(97, 175, 239, 0.10), rgba(86, 182, 194, 0.08));
            opacity: 0;
            transition: opacity 0.3s;
            border-radius: 12px;
        }
        .iwara-sidebar-player-item:hover {
            border-color: rgba(97, 175, 239, 0.22);
            transform: translateX(4px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
        }
        .iwara-sidebar-player-item:hover::before {
            transform: scaleY(1);
        }
        .iwara-sidebar-player-item:hover::after {
            opacity: 1;
        }
        .iwara-sidebar-player-item.active {
            background: linear-gradient(135deg, rgba(97, 175, 239, 0.16), rgba(86, 182, 194, 0.10));
            border-color: rgba(97, 175, 239, 0.45);
            box-shadow: 0 4px 16px rgba(97, 175, 239, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.1);
            transform: translateX(4px);
        }
        .iwara-sidebar-player-item.active::before {
            transform: scaleY(1);
        }
        .iwara-sidebar-player-item.active::after {
            opacity: 0;
        }
        .iwara-sidebar-player-icon {
            width: 42px;
            height: 42px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;
            font-size: 22px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 11px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            z-index: 1;
            box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
        }
        .iwara-sidebar-player-item:hover .iwara-sidebar-player-icon {
            background: linear-gradient(135deg, rgba(97, 175, 239, 0.14), rgba(86, 182, 194, 0.10));
            transform: scale(1.08) rotate(-5deg);
            box-shadow: 0 4px 12px rgba(97, 175, 239, 0.18), inset 0 1px 2px rgba(255, 255, 255, 0.1);
        }
        .iwara-sidebar-player-item.active .iwara-sidebar-player-icon {
            background: linear-gradient(135deg, rgba(97, 175, 239, 0.22), rgba(86, 182, 194, 0.14));
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(97, 175, 239, 0.24), inset 0 1px 2px rgba(255, 255, 255, 0.15);
        }
        .iwara-sidebar-player-icon img {
            width: 30px;
            height: 30px;
            object-fit: contain;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .iwara-sidebar-player-item:hover .iwara-sidebar-player-icon img {
            transform: scale(1.1);
        }
        .iwara-sidebar-player-info {
            flex: 1;
            min-width: 0;
            position: relative;
            z-index: 1;
        }
        .iwara-sidebar-player-name {
            font-size: 14px;
            font-weight: 600;
            color: var(--iwara-text);
            margin: 0 0 3px 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            transition: all 0.3s;
            letter-spacing: 0.2px;
        }
        .iwara-sidebar-player-item:hover .iwara-sidebar-player-name {
            color: var(--iwara-text-strong);
            transform: translateX(2px);
        }
        .iwara-sidebar-player-item.active .iwara-sidebar-player-name {
            color: var(--iwara-text-strong);
            font-weight: 700;
        }
        .iwara-sidebar-player-desc {
            font-size: 11px;
            color: var(--iwara-muted);
            margin: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            transition: all 0.3s;
        }
        .iwara-sidebar-player-item:hover .iwara-sidebar-player-desc {
            color: var(--iwara-text);
            transform: translateX(2px);
        }
        .iwara-sidebar-player-item.active .iwara-sidebar-player-desc {
            color: var(--iwara-cyan);
            font-weight: 500;
        }

        /* 左侧底部 - 设置 */
        .iwara-sidebar-footer {
            padding: 16px;
            border-top: 1px solid var(--iwara-border);
            background: linear-gradient(to top, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.15));
            height: 86px;
            box-sizing: border-box;
            display: flex;
            align-items: center;
            position: relative;
        }
        .iwara-sidebar-footer::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(97, 175, 239, 0.28), transparent);
        }
        .iwara-sidebar-main-settings {
            display: flex;
            align-items: center;
            width: 100%;
            padding: 14px 16px;
            background: transparent;
            border: 1px solid transparent;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }
        .iwara-sidebar-main-settings::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(97, 175, 239, 0.10), rgba(86, 182, 194, 0.08));
            opacity: 0;
            transition: opacity 0.3s;
            border-radius: 12px;
        }
        .iwara-sidebar-main-settings:hover::before {
            opacity: 1;
        }
        .iwara-sidebar-main-settings:hover {
            border-color: rgba(97, 175, 239, 0.22);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(97, 175, 239, 0.14);
        }
        .iwara-sidebar-main-settings.active {
            background: linear-gradient(135deg, rgba(97, 175, 239, 0.16), rgba(86, 182, 194, 0.10));
            border-color: rgba(97, 175, 239, 0.45);
            box-shadow: 0 4px 16px rgba(97, 175, 239, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
        .iwara-sidebar-main-settings.active::before {
            opacity: 0;
        }
        .iwara-sidebar-main-icon {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;
            font-size: 20px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            color: var(--iwara-muted);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            z-index: 1;
            box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
        }
        .iwara-sidebar-main-settings:hover .iwara-sidebar-main-icon {
            background: linear-gradient(135deg, rgba(97, 175, 239, 0.18), rgba(86, 182, 194, 0.12));
            color: var(--iwara-cyan);
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(97, 175, 239, 0.20), inset 0 1px 2px rgba(255, 255, 255, 0.1);
        }
        .iwara-sidebar-main-settings.active .iwara-sidebar-main-icon {
            background: linear-gradient(135deg, rgba(97, 175, 239, 0.24), rgba(86, 182, 194, 0.16));
            color: var(--iwara-text-strong);
            box-shadow: 0 4px 12px rgba(97, 175, 239, 0.26), inset 0 1px 2px rgba(255, 255, 255, 0.15);
        }
        .iwara-sidebar-main-text {
            font-size: 14px;
            font-weight: 600;
            color: var(--iwara-muted);
            transition: all 0.3s;
            position: relative;
            z-index: 1;
            letter-spacing: 0.3px;
        }
        .iwara-sidebar-main-settings:hover .iwara-sidebar-main-text {
            color: var(--iwara-text-strong);
        }
        .iwara-sidebar-main-settings.active .iwara-sidebar-main-text {
            color: var(--iwara-text-strong);
        }

        /* 右侧内容区 */
        .iwara-modal-content-area {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        /* 内容顶部标题栏 */
        .iwara-content-header {
            padding: 20px 32px;
            border-bottom: 1px solid var(--iwara-border);
            background: rgba(0, 0, 0, 0.2);
            display: flex;
            justify-content: space-between;
            align-items: center;
            min-height: 70px;
        }
        .iwara-content-title {
            font-size: 18px;
            font-weight: 600;
            color: var(--iwara-text-strong);
            margin: 0;
            line-height: 1.4;
        }
        #header-action-buttons {
            display: flex;
            gap: 12px;
            align-items: center;
        }
        .iwara-btn-delete-player {
            padding: 8px 18px;
            background: rgba(224, 108, 117, 0.16);
            border: 1px solid rgba(224, 108, 117, 0.45);
            border-radius: 8px;
            color: var(--iwara-red);
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            height: 38px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
        }
        .iwara-btn-delete-player:hover {
            background: rgba(224, 108, 117, 0.26);
            border-color: rgba(224, 108, 117, 0.65);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(224, 108, 117, 0.28);
        }
        .iwara-btn-create-player {
            padding: 8px 18px;
            background: linear-gradient(135deg, var(--iwara-accent) 0%, var(--iwara-cyan) 100%);
            border: none;
            border-radius: 8px;
            color: #fff;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            height: 38px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
        }
        .iwara-btn-create-player:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(97, 175, 239, 0.28);
        }

        /* 内容主体 */
        .iwara-content-body {
            flex: 1;
            padding: 24px 28px;
            overflow-y: auto;
        }

        /* 内容底部 - 按钮区 */
        .iwara-content-footer {
            padding: 16px 32px;
            border-top: 1px solid var(--iwara-border);
            background: rgba(0, 0, 0, 0.2);
            height: 86px;
            box-sizing: border-box;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .iwara-footer-hint {
            flex: 1;
            display: flex;
            align-items: center;
        }
        .iwara-footer-buttons {
            display: flex;
            gap: 12px;
            align-items: center;
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
            background: rgba(255, 255, 255, 0.08);
            color: var(--iwara-text);
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }
        .iwara-btn-cancel::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(224, 108, 117, 0.16), rgba(190, 80, 70, 0.10));
            opacity: 0;
            transition: opacity 0.3s;
        }
        .iwara-btn-cancel:hover {
            background: rgba(224, 108, 117, 0.16);
            border-color: rgba(224, 108, 117, 0.45);
            color: var(--iwara-text-strong);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(224, 108, 117, 0.22);
        }
        .iwara-btn-cancel:hover::before {
            opacity: 1;
        }
        .iwara-btn-cancel:active {
            transform: translateY(0);
        }
        .iwara-btn-secondary {
            background: rgba(97, 175, 239, 0.18);
            border: 2px solid rgba(97, 175, 239, 0.45);
            color: var(--iwara-accent);
        }
        .iwara-btn-secondary:hover {
            background: rgba(97, 175, 239, 0.26);
            border-color: rgba(97, 175, 239, 0.65);
            transform: translateY(-2px);
        }
        .iwara-btn-primary {
            background: linear-gradient(135deg, var(--iwara-accent) 0%, var(--iwara-cyan) 100%);
            color: #fff;
        }
        .iwara-btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(97, 175, 239, 0.28);
        }
        .iwara-btn-small {
            padding: 6px 14px;
            background: rgba(97, 175, 239, 0.18);
            border: 1px solid rgba(97, 175, 239, 0.35);
            border-radius: 6px;
            color: var(--iwara-accent);
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        .iwara-btn-small:hover {
            background: rgba(97, 175, 239, 0.26);
            border-color: rgba(97, 175, 239, 0.55);
        }

        /* ========== 设置页面专用样式 ========== */
        .iwara-settings-section {
            margin-bottom: 28px;
        }
        .iwara-settings-section:last-child {
            margin-bottom: 0;
        }
        .iwara-settings-section h3 {
            margin: 0 0 20px 0;
            color: var(--iwara-text-strong);
            font-size: 17px;
            font-weight: 700;
            position: relative;
            padding-left: 16px;
            letter-spacing: 0.3px;
        }
        .iwara-settings-section h3::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 4px;
            height: 20px;
            background: linear-gradient(to bottom, var(--iwara-accent), var(--iwara-cyan));
            border-radius: 2px;
        }
        .iwara-hint {
            margin: 8px 0 0 0;
            color: var(--iwara-subtle);
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
            border-color: rgba(97, 175, 239, 0.45);
        }
        .iwara-player-option.active {
            background: rgba(97, 175, 239, 0.14);
            border-color: rgba(97, 175, 239, 0.65);
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
            color: var(--iwara-text-strong);
            font-size: 14px;
        }
        .iwara-option-text small {
            color: var(--iwara-subtle);
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
            background: rgba(97, 175, 239, 0.22);
            border-color: rgba(97, 175, 239, 0.55);
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
            border-color: rgba(97, 175, 239, 0.45);
        }
        .iwara-quality-option.active {
            background: rgba(97, 175, 239, 0.14);
            border-color: rgba(97, 175, 239, 0.65);
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
            background: rgba(97, 175, 239, 0.45);
            border-radius: 3px;
        }
        .iwara-proxy-list::-webkit-scrollbar-thumb:hover {
            background: rgba(97, 175, 239, 0.62);
        }

        /* ========== 统一滚动条样式 ========== */
        .iwara-modal-sidebar::-webkit-scrollbar,
        .iwara-sidebar-players::-webkit-scrollbar,
        .iwara-content-body::-webkit-scrollbar {
            width: 8px;
        }
        .iwara-modal-sidebar::-webkit-scrollbar-track,
        .iwara-sidebar-players::-webkit-scrollbar-track,
        .iwara-content-body::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.03);
            border-radius: 4px;
            margin: 4px 0;
        }
        .iwara-modal-sidebar::-webkit-scrollbar-thumb,
        .iwara-sidebar-players::-webkit-scrollbar-thumb,
        .iwara-content-body::-webkit-scrollbar-thumb {
            background: rgba(97, 175, 239, 0.32);
            border-radius: 4px;
            border: 2px solid transparent;
            background-clip: padding-box;
            transition: background 0.2s;
        }
        .iwara-modal-sidebar::-webkit-scrollbar-thumb:hover,
        .iwara-sidebar-players::-webkit-scrollbar-thumb:hover,
        .iwara-content-body::-webkit-scrollbar-thumb:hover {
            background: rgba(97, 175, 239, 0.48);
            background-clip: padding-box;
        }
        .iwara-modal-sidebar::-webkit-scrollbar-thumb:active,
        .iwara-sidebar-players::-webkit-scrollbar-thumb:active,
        .iwara-content-body::-webkit-scrollbar-thumb:active {
            background: rgba(97, 175, 239, 0.62);
            background-clip: padding-box;
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
            border-color: rgba(97, 175, 239, 0.30);
        }
        .iwara-proxy-item.disabled {
            opacity: 0.5;
        }
        .iwara-proxy-item .proxy-url {
            flex: 1;
            color: var(--iwara-text);
            font-size: 13px;
            font-family: 'Consolas', 'Monaco', monospace;
            word-break: break-all;
        }
        .iwara-proxy-item.disabled .proxy-url {
            color: var(--iwara-subtle);
            text-decoration: line-through;
        }
        .iwara-proxy-status {
            padding: 4px 10px;
            border: 1px solid;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            white-space: nowrap;
            min-width: 70px;
            text-align: center;
        }
        .iwara-proxy-status.checking {
            background: rgba(97, 175, 239, 0.16);
            border-color: rgba(97, 175, 239, 0.40);
            color: var(--iwara-accent);
        }
        .iwara-proxy-status.success {
            background: rgba(152, 195, 121, 0.16);
            border-color: rgba(152, 195, 121, 0.40);
            color: var(--iwara-green);
        }
        .iwara-proxy-status.failed {
            background: rgba(224, 108, 117, 0.16);
            border-color: rgba(224, 108, 117, 0.40);
            color: var(--iwara-red);
        }
        .iwara-proxy-status.slow {
            background: rgba(209, 154, 102, 0.16);
            border-color: rgba(209, 154, 102, 0.40);
            color: var(--iwara-orange);
        }
        .iwara-proxy-toggle {
            padding: 4px 12px;
            background: rgba(152, 195, 121, 0.16);
            border: 1px solid rgba(152, 195, 121, 0.40);
            border-radius: 6px;
            color: var(--iwara-green);
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            white-space: nowrap;
        }
        .iwara-proxy-toggle:hover {
            background: rgba(152, 195, 121, 0.26);
            border-color: rgba(152, 195, 121, 0.65);
            transform: scale(1.05);
        }
        .iwara-proxy-toggle.disabled {
            background: rgba(224, 108, 117, 0.16);
            border-color: rgba(224, 108, 117, 0.40);
            color: var(--iwara-red);
        }
        .iwara-proxy-toggle.disabled:hover {
            background: rgba(224, 108, 117, 0.26);
            border-color: rgba(224, 108, 117, 0.65);
        }
        .iwara-proxy-delete {
            padding: 4px 8px;
            background: rgba(224, 108, 117, 0.16);
            border: 1px solid rgba(224, 108, 117, 0.45);
            border-radius: 6px;
            color: var(--iwara-red);
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
            line-height: 1;
        }
        .iwara-proxy-delete:hover {
            background: rgba(224, 108, 117, 0.26);
            border-color: rgba(224, 108, 117, 0.65);
            transform: scale(1.1);
        }

        /* Select 下拉框样式 */
        select.iwara-form-input {
            cursor: pointer;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2361afef' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 12px center;
            padding-right: 36px;
            appearance: none;
            -webkit-appearance: none;
            -moz-appearance: none;
        }
        select.iwara-form-input:hover {
            border-color: rgba(97, 175, 239, 0.45);
        }
        select.iwara-form-input option {
            background: var(--iwara-bg-2);
            color: var(--iwara-text);
            padding: 10px;
        }
        select.iwara-form-input option:hover {
            background: var(--iwara-accent);
        }
    `);
}

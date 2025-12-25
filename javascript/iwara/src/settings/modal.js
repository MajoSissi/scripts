/**
 * Settings modal (players / buttons / proxy)
 *
 * @param {{
 *  getPlayers: () => any[],
 *  setPlayers: (players: any[]) => void,
 *  getExternalPlayer: () => string,
 *  setExternalPlayer: (name: string) => void,
 *  getProxyList: () => Array<{url: string, enabled: boolean}>,
 *  setProxyList: (list: Array<{url: string, enabled: boolean}>) => void,
 *  getProxyTimeout: () => number,
 *  setProxyTimeout: (ms: number) => void,
 *  getButtonSettings: () => any,
 *  setButtonSettings: (s: any) => void,
 *  resetToDefaultPlayers: () => void,
 *  normalizeProxyUrl: (url: string) => string|null,
 *  notify: (msg: string, type?: 'info'|'success'|'error') => void,
 *  refreshAllButtons: () => void
 * }} deps
 */
export function createSettingsModal(deps) {
  const {
    getPlayers,
    setPlayers,
    getExternalPlayer,
    setExternalPlayer,
    getProxyList,
    setProxyList,
    getProxyTimeout,
    setProxyTimeout,
    getButtonSettings,
    setButtonSettings,
    resetToDefaultPlayers,
    normalizeProxyUrl,
    notify,
    refreshAllButtons
  } = deps;

  const showNotification = notify || (() => {});

  return function openSettingsModal() {
    const existingModal = document.getElementById('iwara-mpv-settings-modal');
    if (existingModal) existingModal.remove();

    let tempPlayers = JSON.parse(JSON.stringify(getPlayers() || []));
    let currentView = 'main-settings';
    let currentDefaultPlayer = getExternalPlayer();
    let tempProxyList = JSON.parse(JSON.stringify(getProxyList() || []));
    let tempButtonSettings = JSON.parse(JSON.stringify(getButtonSettings() || {}));
    let tempProxyTimeout = getProxyTimeout();
    let editingPlayer = null;

    const modal = document.createElement('div');
    modal.id = 'iwara-mpv-settings-modal';
    modal.className = 'iwara-modal';

    modal.innerHTML = `
      <div class="iwara-modal-overlay">
        <div class="iwara-modal-content">
          <div class="iwara-modal-main">
            <div class="iwara-modal-sidebar">
              <div class="iwara-sidebar-players" id="player-list"></div>
              <div class="iwara-sidebar-footer">
                <div class="iwara-sidebar-main-settings" data-view="main-settings">
                  <div class="iwara-sidebar-main-icon">🎛️</div>
                  <div class="iwara-sidebar-main-text">设置</div>
                </div>
              </div>
            </div>

            <div class="iwara-modal-content-area">
              <div class="iwara-content-header" id="content-header" style="display: none;">
                <h3 class="iwara-content-title" id="content-title"></h3>
                <div id="header-action-buttons">
                  <button class="iwara-btn-create-player" id="btn-create-player" style="display: none;">✓ 创建</button>
                  <button class="iwara-btn-delete-player" id="btn-delete-player" style="display: none;">🗑️ 删除</button>
                </div>
              </div>

              <div class="iwara-content-body" id="content-body">
                <p style="color: #64748b; text-align: center; margin-top: 100px;">👈 请从左侧选择一个播放器或设置</p>
              </div>

              <div class="iwara-content-footer">
                <div class="iwara-footer-hint">
                  <span style="color: #94a3b8; font-size: 13px;">💡 提示：若保存设置未生效，请手动刷新页面</span>
                </div>
                <div class="iwara-footer-buttons">
                  <button class="iwara-btn iwara-btn-cancel" id="btn-close">✕ 关闭</button>
                  <button class="iwara-btn iwara-btn-primary" id="btn-save">💾 保存</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    function renderPlayerList() {
      const playerListContainer = modal.querySelector('#player-list');
      playerListContainer.innerHTML = '';

      tempPlayers.forEach((player) => {
        const item = document.createElement('div');
        item.className = 'iwara-sidebar-player-item';
        item.dataset.playerName = player.name;
        if (currentView === player.name) item.classList.add('active');

        const iconHtml = player.icon && player.icon.startsWith('data:image')
          ? `<img src="${player.icon}" alt="${player.name}">`
          : (player.icon || '🎮');

        item.innerHTML = `
          <div class="iwara-sidebar-player-icon">${iconHtml}</div>
          <div class="iwara-sidebar-player-info">
            <p class="iwara-sidebar-player-name">${player.name}</p>
          </div>
        `;

        item.addEventListener('click', () => {
          currentView = player.name;
          editingPlayer = player.name;
          updateView();
        });

        playerListContainer.appendChild(item);
      });

      const addPlayerItem = document.createElement('div');
      addPlayerItem.className = 'iwara-sidebar-player-item iwara-sidebar-add-player';
      if (currentView === 'add-player') addPlayerItem.classList.add('active');
      addPlayerItem.innerHTML = `
        <div class="iwara-sidebar-player-icon"><img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48cmVjdCB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIGZpbGw9IiM2NjdlZWEiIHJ4PSI0Ii8+PHBhdGggZmlsbD0iI2ZmZiIgZD0iTTE2IDhWMjRNOCAxNkgyNCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg==" alt="添加"></div>
        <div class="iwara-sidebar-player-info">
          <p class="iwara-sidebar-player-name">添加</p>
        </div>
      `;
      addPlayerItem.addEventListener('click', () => {
        currentView = 'add-player';
        editingPlayer = null;
        updateView();
      });
      playerListContainer.appendChild(addPlayerItem);
    }

    function updateView() {
      modal.querySelectorAll('.iwara-sidebar-player-item').forEach((item) => {
        if (item.classList.contains('iwara-sidebar-add-player')) {
          item.classList.toggle('active', currentView === 'add-player');
        } else {
          item.classList.toggle('active', item.dataset.playerName === currentView);
        }
      });
      modal
        .querySelector('.iwara-sidebar-main-settings')
        .classList.toggle('active', currentView === 'main-settings');

      const contentHeader = modal.querySelector('#content-header');
      const contentTitle = modal.querySelector('#content-title');
      const deleteButton = modal.querySelector('#btn-delete-player');
      const createButton = modal.querySelector('#btn-create-player');

      if (currentView === 'main-settings') {
        contentHeader.style.display = 'none';
        renderMainSettings();
        return;
      }

      if (currentView === 'add-player') {
        contentHeader.style.display = 'flex';
        contentTitle.textContent = '➕ 添加';
        deleteButton.style.display = 'none';
        createButton.style.display = 'block';
        renderAddPlayerForm();
        return;
      }

      const player = tempPlayers.find((p) => p.name === currentView);
      if (player) {
        contentHeader.style.display = 'flex';
        contentTitle.textContent = `✏️ 编辑`;
        deleteButton.style.display = 'block';
        createButton.style.display = 'none';
        renderPlayerEditForm(player);
      }
    }

    function renderPlayerForm(isEditMode, player = null) {
      const isProtocol = player ? player.type === 'protocol' : true;
      const protocolDisplay = isProtocol ? 'block' : 'none';
      const ushDisplay = isProtocol ? 'none' : 'block';
      const prefix = isEditMode ? 'edit' : 'new';

      return `
        <div style="margin-bottom: 20px;">
          <label style="display: block; color: #94a3b8; font-size: 13px; margin-bottom: 8px;">播放器名称</label>
          <input type="text" id="${prefix}-player-name" value="${player ? player.name : ''}" class="iwara-form-input" placeholder="例如: PotPlayer">
        </div>

        <div style="margin-bottom: 20px;">
          <label style="display: block; color: #94a3b8; font-size: 13px; margin-bottom: 8px;">协议类型</label>
          <select id="${prefix}-protocol-type" class="iwara-form-input">
            <option value="protocol" ${isProtocol ? 'selected' : ''}>标准协议</option>
            <option value="ush" ${!isProtocol ? 'selected' : ''}>USH协议</option>
          </select>
        </div>

        <div id="${prefix}-protocol-group" style="margin-bottom: 20px; display: ${protocolDisplay};">
          <label style="display: block; color: #94a3b8; font-size: 13px; margin-bottom: 8px;">协议链接参数</label>
          <input type="text" id="${prefix}-protocol" value="${player && player.protocol ? player.protocol : ''}" class="iwara-form-input" placeholder="例如: potplayer://\${url}">
          <p style="color: #64748b; font-size: 12px; margin: 6px 0 0 0;">可用参数: \${title} 标题 | \${url} 原始链接 | \${url:base64} base64编码 | \${url:encode} url编码</p>
        </div>

        <div id="${prefix}-ush-group" style="display: ${ushDisplay};">
          <div style="margin-bottom: 20px;">
            <label style="display: block; color: #94a3b8; font-size: 13px; margin-bottom: 8px;">应用名称</label>
            <input type="text" id="${prefix}-ush-app" value="${player && player.appName ? player.appName : ''}" class="iwara-form-input" placeholder="例如: MPV (和ush工具配置的名称要完全一致)">
            <p class="iwara-hint"><a href="https://github.com/LuckyPuppy514/url-scheme-handler" target="_blank" style="color: #667eea;">⭐ ush工具 - LuckyPuppy514/url-scheme-handler</a></p>
          </div>
          <div style="margin-bottom: 20px;">
            <label style="display: block; color: #94a3b8; font-size: 13px; margin-bottom: 8px;">启动参数 (可选)</label>
            <textarea id="${prefix}-ush-args" class="iwara-form-textarea" rows="4" placeholder="每行一个参数，例如:\n--ontop\n--fullscreen">${player && player.args ? player.args.join('\n') : ''}</textarea>
            <p style="color: #64748b; font-size: 12px; margin: 6px 0 0 0;">可用参数: \${title} 标题 | \${url} 原始链接 | \${url:base64} base64编码 | \${url:encode} url编码</p>
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <label style="display: block; color: #94a3b8; font-size: 13px; margin-bottom: 8px;">图标 (Base64 Data URL)</label>
          <textarea id="${prefix}-player-icon" class="iwara-form-textarea" rows="3" placeholder="data:image/png;base64,iVBORw0KGgoAAAANS...">${player && player.icon ? player.icon : ''}</textarea>
          <p style="color: #64748b; font-size: 12px; margin: 6px 0 0 0;">支持 data:image/png、data:image/svg+xml 等格式</p>
        </div>
      `;
    }

    function setupProtocolTypeToggle(prefix) {
      const contentBody = modal.querySelector('#content-body');
      const protocolTypeSelect = contentBody.querySelector(`#${prefix}-protocol-type`);
      const protocolGroup = contentBody.querySelector(`#${prefix}-protocol-group`);
      const ushGroup = contentBody.querySelector(`#${prefix}-ush-group`);

      if (!protocolTypeSelect) return;
      protocolTypeSelect.addEventListener('change', () => {
        if (protocolTypeSelect.value === 'protocol') {
          protocolGroup.style.display = 'block';
          ushGroup.style.display = 'none';
        } else {
          protocolGroup.style.display = 'none';
          ushGroup.style.display = 'block';
        }
      });
    }

    function renderPlayerEditForm(player) {
      const contentBody = modal.querySelector('#content-body');
      const originalName = player.name;

      contentBody.innerHTML = renderPlayerForm(true, player);
      setupProtocolTypeToggle('edit');

      const inputs = [
        contentBody.querySelector('#edit-player-name'),
        contentBody.querySelector('#edit-protocol-type'),
        contentBody.querySelector('#edit-protocol'),
        contentBody.querySelector('#edit-ush-app'),
        contentBody.querySelector('#edit-ush-args'),
        contentBody.querySelector('#edit-player-icon')
      ];

      inputs.forEach((input) => {
        if (!input) return;
        input.addEventListener('input', () => {
          const name = contentBody.querySelector('#edit-player-name').value.trim();
          const type = contentBody.querySelector('#edit-protocol-type').value;
          const icon = contentBody.querySelector('#edit-player-icon').value.trim();

          const playerIndex = tempPlayers.findIndex((p) => p.name === originalName);
          if (playerIndex !== -1) {
            tempPlayers[playerIndex].name = name;
            tempPlayers[playerIndex].type = type;
            tempPlayers[playerIndex].icon = icon;

            if (type === 'protocol') {
              tempPlayers[playerIndex].protocol = contentBody.querySelector('#edit-protocol').value.trim();
              delete tempPlayers[playerIndex].appName;
              delete tempPlayers[playerIndex].args;
            } else {
              tempPlayers[playerIndex].appName = contentBody.querySelector('#edit-ush-app').value.trim();
              const args = contentBody.querySelector('#edit-ush-args').value.trim();
              tempPlayers[playerIndex].args = args
                ? args.split('\n').map((a) => a.trim()).filter((a) => a)
                : ['{url}'];
              delete tempPlayers[playerIndex].protocol;
            }
          }

          const contentTitle = modal.querySelector('#content-title');
          if (contentTitle && name) contentTitle.textContent = `✏️ 编辑播放器: ${name}`;
        });
      });

      const deleteButton = modal.querySelector('#btn-delete-player');
      const newDeleteButton = deleteButton.cloneNode(true);
      deleteButton.parentNode.replaceChild(newDeleteButton, deleteButton);

      newDeleteButton.addEventListener('click', () => {
        if (!confirm(`确定要删除"${player.name}"吗？`)) return;

        const index = tempPlayers.findIndex((p) => p.name === originalName);
        if (index !== -1) tempPlayers.splice(index, 1);

        if (currentDefaultPlayer === originalName) {
          currentDefaultPlayer = tempPlayers.length > 0 ? tempPlayers[0].name : 'MPV';
        }

        currentView = 'main-settings';
        renderPlayerList();
        updateView();
        showNotification(`✅ 已删除"${player.name}"`, 'success');
      });
    }

    function renderAddPlayerForm() {
      const contentBody = modal.querySelector('#content-body');
      contentBody.innerHTML = renderPlayerForm(false);
      setupProtocolTypeToggle('new');

      const createButton = modal.querySelector('#btn-create-player');
      const newCreateButton = createButton.cloneNode(true);
      createButton.parentNode.replaceChild(newCreateButton, createButton);

      newCreateButton.addEventListener('click', () => {
        const name = contentBody.querySelector('#new-player-name').value.trim();
        const type = contentBody.querySelector('#new-protocol-type').value;
        const icon = contentBody.querySelector('#new-player-icon').value.trim();

        if (!name) {
          showNotification('❌ 请输入播放器名称', 'error');
          return;
        }

        if (tempPlayers.some((p) => p.name === name)) {
          showNotification('❌ 播放器名称已存在', 'error');
          return;
        }

        const playerConfig = {
          name,
          type,
          icon:
            icon ||
            'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxMiIgZmlsbD0iIzY2N2VlYSIvPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik0xMyAxMWw4IDUtOCA1eiIvPjwvc3ZnPg=='
        };

        if (type === 'protocol') {
          const protocol = contentBody.querySelector('#new-protocol').value.trim();
          if (!protocol) {
            showNotification('❌ 请输入协议链接参数', 'error');
            return;
          }
          if (!protocol.includes('${url}')) {
            showNotification('❌ 协议链接必须包含 ${url} 占位符', 'error');
            return;
          }
          playerConfig.protocol = protocol;
        } else {
          const appName = contentBody.querySelector('#new-ush-app').value.trim();
          if (!appName) {
            showNotification('❌ 请输入应用名称', 'error');
            return;
          }
          const args = contentBody.querySelector('#new-ush-args').value.trim();
          playerConfig.appName = appName;
          playerConfig.args = args
            ? args.split('\n').map((a) => a.trim()).filter((a) => a)
            : ['{url}'];
        }

        tempPlayers.push(playerConfig);
        currentView = name;
        renderPlayerList();
        updateView();
        showNotification(`✅ 已添加"${name}"`, 'success');
      });
    }

    function renderMainSettings() {
      const contentBody = modal.querySelector('#content-body');

      const currentProxy = tempProxyList
        .map((p) => {
          const prefix = p.enabled ? '' : '#';
          return `${prefix}${p.url}`;
        })
        .join('\n');

      contentBody.innerHTML = `
        <div class="iwara-settings-section">
          <div class="iwara-settings-header">
            <h4>🎬 默认播放器</h4>
            <button class="iwara-btn-small" id="reset-players">🔄 重置</button>
          </div>
          <select id="default-player-select" class="iwara-form-input">
            ${tempPlayers
              .map((p) => `<option value="${p.name}" ${p.name === currentDefaultPlayer ? 'selected' : ''}>${p.name}</option>`)
              .join('')}
          </select>
        </div>

        <div class="iwara-settings-section">
          <h4 class="iwara-settings-section-title no-indicator">⚪ 按钮显示设置</h4>

          <div class="iwara-settings-subsection">
            <h5>📄 详情页</h5>
            <div class="iwara-button-settings-grid">
              <label class="iwara-checkbox-label">
                <input type="checkbox" id="detail-copy" ${tempButtonSettings.detailPage.copy ? 'checked' : ''}>
                <span>复制链接</span>
              </label>
              <label class="iwara-checkbox-label">
                <input type="checkbox" id="detail-newtab" ${tempButtonSettings.detailPage.newTab ? 'checked' : ''}>
                <span>新标签页播放</span>
              </label>
              <label class="iwara-checkbox-label">
                <input type="checkbox" id="detail-quality" ${tempButtonSettings.detailPage.quality ? 'checked' : ''}>
                <span>540画质播放</span>
              </label>
              <label class="iwara-checkbox-label">
                <input type="checkbox" id="detail-play" ${tempButtonSettings.detailPage.play ? 'checked' : ''}>
                <span>Source画质播放</span>
              </label>
            </div>
          </div>

          <div class="iwara-settings-subsection">
            <h5>📋 列表页</h5>
            <div class="iwara-button-settings-grid">
              <label class="iwara-checkbox-label">
                <input type="checkbox" id="list-copy" ${tempButtonSettings.listPage.copy ? 'checked' : ''}>
                <span>复制链接</span>
              </label>
              <label class="iwara-checkbox-label">
                <input type="checkbox" id="list-newtab" ${tempButtonSettings.listPage.newTab ? 'checked' : ''}>
                <span>新标签页播放</span>
              </label>
              <label class="iwara-checkbox-label">
                <input type="checkbox" id="list-quality" ${tempButtonSettings.listPage.quality ? 'checked' : ''}>
                <span>540画质播放</span>
              </label>
              <label class="iwara-checkbox-label">
                <input type="checkbox" id="list-play" ${tempButtonSettings.listPage.play ? 'checked' : ''}>
                <span>Source画质播放</span>
              </label>
            </div>
          </div>
        </div>

        <div class="iwara-settings-section">
          <div class="iwara-settings-header">
            <h4>🔗 代理服务 (可选)</h4>
            <div style="display: flex; gap: 8px;">
              <button class="iwara-btn-small" id="save-multi-edit" style="display: none;">💾 保存</button>
              <button class="iwara-btn-small" id="toggle-edit-mode">📝 手动编辑</button>
            </div>
          </div>

          <div id="single-add-mode" style="display: block;">
            <div style="display: flex; gap: 8px; margin-bottom: 12px;">
              <input type="text" id="new-proxy-input" placeholder="多个将会随机选取, 代理地址 例: proxy.example.com 或 https://proxy.example.com/" class="iwara-form-input" style="flex: 1;">
              <button class="iwara-btn-small" id="add-proxy">➕ 添加</button>
            </div>
            <div style="display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; align-items: center;">
              <div style="display: flex; align-items: center; gap: 4px;">
                <label style="color: var(--iwara-muted); font-size: 13px; white-space: nowrap;">超时</label>
                <input type="number" id="proxy-timeout" value="${tempProxyTimeout}" min="1" max="100000" step="100" class="iwara-form-input" style="width: 80px; padding: 4px 8px; font-size: 13px;">
                <span style="color: var(--iwara-muted); font-size: 13px;">ms</span>
              </div>
            </div>
            <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; align-items: center;">
              <button class="iwara-btn-small" id="check-all-proxies">🔍 检测延迟</button>
              <button class="iwara-btn-small" id="enable-all-proxies" style="background: rgba(152, 195, 121, 0.18); border-color: rgba(152, 195, 121, 0.38); color: #98c379;">✓ 启用全部</button>
              <button class="iwara-btn-small" id="disable-all-proxies" style="background: rgba(92, 99, 112, 0.18); border-color: rgba(92, 99, 112, 0.38); color: #abb2bf;">✕ 禁用全部</button>
              <button class="iwara-btn-small" id="disable-failed-proxies" style="background: rgba(229, 192, 123, 0.16); border-color: rgba(229, 192, 123, 0.36); color: #e5c07b;">⚠️ 禁用超时</button>
              <button class="iwara-btn-small" id="delete-failed-proxies" style="background: rgba(224, 108, 117, 0.18); border-color: rgba(224, 108, 117, 0.38); color: #e06c75;">🗑️ 删除超时</button>
            </div>
            <div id="proxy-list-container" class="iwara-proxy-list" style="max-height: 200px;"></div>
          </div>

          <div id="multi-edit-mode" style="display: none;">
            <textarea id="proxy-input" class="iwara-form-textarea" style="min-height: 160px;" placeholder="每行一个代理，以#开头表示禁用:\nproxy1.example.com\n#proxy2.example.com (禁用)\nhttps://proxy3.example.com/\n&#10;💡 不指定协议会自动添加 https://">${currentProxy}</textarea>
            <p style="color: #64748b; font-size: 12px; margin: 8px 0 0 0;">💡 每行一个代理地址，以 # 开头的代理将被禁用。未指定协议的地址将自动补全为 https://</p>
          </div>

          <p style="color: var(--iwara-subtle); font-size: 12px; margin: 8px 0 0 0;">
            <a href="https://github.com/1234567Yang/cf-proxy-ex" target="_blank" style="color: var(--iwara-accent); text-decoration: none;">⭐ 代理项目(需自行部署): cf-proxy-ex</a>
          </p>
          <p style="color: var(--iwara-subtle); font-size: 12px; margin: 8px 0 0 0;">⏩ 获取视频链接与播放链接会使用同一代理</p>
        </div>
      `;

      contentBody.querySelector('#default-player-select').addEventListener('change', (e) => {
        currentDefaultPlayer = e.target.value;
      });

      contentBody.querySelector('#detail-copy').addEventListener('change', (e) => {
        tempButtonSettings.detailPage.copy = e.target.checked;
      });
      contentBody.querySelector('#detail-newtab').addEventListener('change', (e) => {
        tempButtonSettings.detailPage.newTab = e.target.checked;
      });
      contentBody.querySelector('#detail-quality').addEventListener('change', (e) => {
        tempButtonSettings.detailPage.quality = e.target.checked;
      });
      contentBody.querySelector('#detail-play').addEventListener('change', (e) => {
        tempButtonSettings.detailPage.play = e.target.checked;
      });

      contentBody.querySelector('#list-copy').addEventListener('change', (e) => {
        tempButtonSettings.listPage.copy = e.target.checked;
      });
      contentBody.querySelector('#list-newtab').addEventListener('change', (e) => {
        tempButtonSettings.listPage.newTab = e.target.checked;
      });
      contentBody.querySelector('#list-quality').addEventListener('change', (e) => {
        tempButtonSettings.listPage.quality = e.target.checked;
      });
      contentBody.querySelector('#list-play').addEventListener('change', (e) => {
        tempButtonSettings.listPage.play = e.target.checked;
      });

      contentBody.querySelector('#reset-players').addEventListener('click', () => {
        if (confirm('确定要恢复到默认播放器列表吗？\n\n这将删除所有自定义播放器。')) {
          modal.remove();
          resetToDefaultPlayers();
        }
      });

      renderProxyList();
      setupProxyEditMode();
    }

    function renderProxyList() {
      const container = modal.querySelector('#proxy-list-container');
      if (!container) return;

      container.innerHTML = '';

      if (tempProxyList.length === 0) {
        container.innerHTML =
          '<p style="color: #64748b; text-align: center; padding: 20px 0; margin: 0;">暂无代理，请使用上方输入框添加</p>';
        return;
      }

      tempProxyList.forEach((proxy, index) => {
        const item = document.createElement('div');
        item.className = 'iwara-proxy-item' + (proxy.enabled ? '' : ' disabled');
        item.dataset.index = index;

        const urlSpan = document.createElement('span');
        urlSpan.className = 'proxy-url';
        urlSpan.textContent = proxy.url;

        const statusSpan = document.createElement('span');
        statusSpan.className = 'iwara-proxy-status';
        statusSpan.style.display = 'none';
        statusSpan.textContent = '-';

        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'iwara-proxy-toggle' + (proxy.enabled ? '' : ' disabled');
        toggleBtn.textContent = proxy.enabled ? '✓ 启用' : '✕ 禁用';
        toggleBtn.addEventListener('click', () => {
          proxy.enabled = !proxy.enabled;
          renderProxyList();
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'iwara-proxy-delete';
        deleteBtn.textContent = '🗑️';
        deleteBtn.addEventListener('click', () => {
          if (confirm(`确定要删除代理 "${proxy.url}" 吗？`)) {
            tempProxyList.splice(index, 1);
            renderProxyList();
          }
        });

        item.appendChild(urlSpan);
        item.appendChild(statusSpan);
        item.appendChild(toggleBtn);
        item.appendChild(deleteBtn);
        container.appendChild(item);
      });
    }

    async function checkSingleProxy(proxyUrl, timeoutMs) {
      const startTime = performance.now();

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve({ success: false, latency: -1, error: 'timeout' });
        }, timeoutMs);

        GM_xmlhttpRequest({
          method: 'GET',
          url: proxyUrl,
          timeout: timeoutMs,
          onload: function (response) {
            clearTimeout(timeout);
            const endTime = performance.now();
            const latency = Math.round(endTime - startTime);
            resolve({ success: true, latency, status: response.status });
          },
          onerror: function () {
            clearTimeout(timeout);
            resolve({ success: false, latency: -1, error: 'network' });
          },
          ontimeout: function () {
            clearTimeout(timeout);
            resolve({ success: false, latency: -1, error: 'timeout' });
          }
        });
      });
    }

    async function checkAllProxies() {
      const container = modal.querySelector('#proxy-list-container');
      if (!container || tempProxyList.length === 0) {
        showNotification('❌ 没有可检测的代理', 'error');
        return;
      }

      const timeoutInput = modal.querySelector('#proxy-timeout');
      let timeoutMs = parseInt(timeoutInput.value) || 10000;

      if (timeoutMs < 100) timeoutMs = 100;
      if (timeoutMs > 100000) timeoutMs = 100000;
      timeoutInput.value = timeoutMs;

      const checkBtn = modal.querySelector('#check-all-proxies');
      const originalText = checkBtn.textContent;
      checkBtn.disabled = true;
      checkBtn.textContent = '🔍 检测中...';

      const items = container.querySelectorAll('.iwara-proxy-item');
      items.forEach((item) => {
        const statusSpan = item.querySelector('.iwara-proxy-status');
        if (statusSpan) {
          statusSpan.style.display = 'inline-block';
          statusSpan.className = 'iwara-proxy-status checking';
          statusSpan.textContent = '检测中...';
        }
        const proxy = tempProxyList[item.dataset.index];
        if (proxy) delete proxy.checkResult;
      });

      const results = new Array(tempProxyList.length);
      const BATCH_SIZE = 5;

      const applyResultToUI = (result, index) => {
        const item = container.querySelector(`[data-index="${index}"]`);
        if (!item) return;

        const statusSpan = item.querySelector('.iwara-proxy-status');
        if (!statusSpan) return;

        tempProxyList[index].checkResult = result;

        if (result.success) {
          const latency = result.latency;
          statusSpan.textContent = `${latency}ms`;

          if (latency < 200) {
            statusSpan.className = 'iwara-proxy-status success';
          } else if (latency < 1000) {
            statusSpan.className = 'iwara-proxy-status slow';
          } else {
            statusSpan.className = 'iwara-proxy-status slow';
          }
        } else {
          statusSpan.className = 'iwara-proxy-status failed';
          statusSpan.textContent = result.error === 'timeout' ? '超时' : '失败';
        }
      };

      for (let start = 0; start < tempProxyList.length; start += BATCH_SIZE) {
        const batch = tempProxyList.slice(start, start + BATCH_SIZE);
        const batchResults = await Promise.all(batch.map((proxy) => checkSingleProxy(proxy.url, timeoutMs)));

        batchResults.forEach((result, offset) => {
          const index = start + offset;
          results[index] = result;
          applyResultToUI(result, index);
        });
      }

      checkBtn.disabled = false;
      checkBtn.textContent = originalText;

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.length - successCount;
      showNotification(`✅ 检测完成: ${successCount} 个可用, ${failCount} 个失败`, 'success');
    }

    function enableAllProxies() {
      if (tempProxyList.length === 0) {
        showNotification('ℹ️ 没有可启用的代理', 'info');
        return;
      }

      const disabledCount = tempProxyList.filter((p) => !p.enabled).length;

      if (disabledCount === 0) {
        showNotification('ℹ️ 所有代理都已启用', 'info');
        return;
      }

      tempProxyList.forEach((proxy) => {
        proxy.enabled = true;
      });
      renderProxyList();
      showNotification(`✅ 已启用全部代理 (${disabledCount} 个)`, 'success');
    }

    function disableAllProxies() {
      if (tempProxyList.length === 0) {
        showNotification('ℹ️ 没有可禁用的代理', 'info');
        return;
      }

      const enabledCount = tempProxyList.filter((p) => p.enabled).length;

      if (enabledCount === 0) {
        showNotification('ℹ️ 所有代理都已禁用', 'info');
        return;
      }

      tempProxyList.forEach((proxy) => {
        proxy.enabled = false;
      });
      renderProxyList();
      showNotification(`✅ 已禁用全部代理 (${enabledCount} 个)`, 'success');
    }

    function disableFailedProxies() {
      const failedCount = tempProxyList.filter((p) => p.checkResult && !p.checkResult.success).length;

      if (failedCount === 0) {
        showNotification('ℹ️ 没有检测到超时的代理', 'info');
        return;
      }

      if (confirm(`确定要禁用 ${failedCount} 个失败的代理吗？`)) {
        tempProxyList.forEach((proxy) => {
          if (proxy.checkResult && !proxy.checkResult.success) proxy.enabled = false;
        });
        renderProxyList();
        showNotification(`✅ 已禁用 ${failedCount} 个失败的代理`, 'success');
      }
    }

    function deleteFailedProxies() {
      const failedCount = tempProxyList.filter((p) => p.checkResult && !p.checkResult.success).length;

      if (failedCount === 0) {
        showNotification('ℹ️ 没有检测到超时的代理', 'info');
        return;
      }

      if (confirm(`确定要删除 ${failedCount} 个失败的代理吗？\n\n此操作不可恢复！`)) {
        tempProxyList = tempProxyList.filter((p) => !p.checkResult || p.checkResult.success);
        renderProxyList();
        showNotification(`✅ 已删除 ${failedCount} 个失败的代理`, 'success');
      }
    }

    function setupProxyEditMode() {
      let isMultiEditMode = false;
      const toggleModeBtn = modal.querySelector('#toggle-edit-mode');
      const singleAddMode = modal.querySelector('#single-add-mode');
      const multiEditMode = modal.querySelector('#multi-edit-mode');
      const addProxyBtn = modal.querySelector('#add-proxy');
      const newProxyInput = modal.querySelector('#new-proxy-input');

      if (!toggleModeBtn) return;

      const saveMultiEditBtn = modal.querySelector('#save-multi-edit');

      toggleModeBtn.addEventListener('click', () => {
        if (isMultiEditMode) {
          const textarea = modal.querySelector('#proxy-input');
          const lines = textarea.value.split('\n');

          tempProxyList = [];
          const urlSet = new Set();
          let duplicateCount = 0;
          let invalidCount = 0;

          lines.forEach((line) => {
            line = line.trim();
            if (line === '') return;

            let enabled = true;
            let url = line;

            if (line.startsWith('#')) {
              enabled = false;
              url = line.substring(1).trim();
            }

            if (url !== '') {
              const normalized = normalizeProxyUrl(url);
              if (normalized && !urlSet.has(normalized)) {
                urlSet.add(normalized);
                tempProxyList.push({ url: normalized, enabled });
              } else if (normalized && urlSet.has(normalized)) {
                duplicateCount++;
              } else if (!normalized) {
                invalidCount++;
              }
            }
          });

          isMultiEditMode = false;
          multiEditMode.style.display = 'none';
          singleAddMode.style.display = 'block';
          saveMultiEditBtn.style.display = 'none';
          toggleModeBtn.textContent = '📝 手动编辑';
          renderProxyList();

          const messages = [];
          if (duplicateCount > 0) messages.push(`已去重 ${duplicateCount} 个重复项`);
          if (invalidCount > 0) messages.push(`已忽略 ${invalidCount} 个无效项`);

          if (messages.length > 0) {
            showNotification(`✅ 已保存并切换到列表编辑（${messages.join('，')}）`, 'success');
          } else {
            showNotification('✅ 已保存并切换到列表编辑', 'success');
          }
        } else {
          isMultiEditMode = true;
          const textarea = modal.querySelector('#proxy-input');
          const lines = tempProxyList.map((p) => {
            const prefix = p.enabled ? '' : '#';
            return `${prefix}${p.url}`;
          });
          textarea.value = lines.join('\n');

          singleAddMode.style.display = 'none';
          multiEditMode.style.display = 'block';
          saveMultiEditBtn.style.display = 'block';
          toggleModeBtn.textContent = '📋 列表编辑';
        }
      });

      if (saveMultiEditBtn) {
        saveMultiEditBtn.addEventListener('click', () => {
          const textarea = modal.querySelector('#proxy-input');
          const lines = textarea.value.split('\n');

          tempProxyList = [];
          const urlSet = new Set();
          let duplicateCount = 0;
          let invalidCount = 0;

          lines.forEach((line) => {
            line = line.trim();
            if (line === '') return;

            let enabled = true;
            let url = line;

            if (line.startsWith('#')) {
              enabled = false;
              url = line.substring(1).trim();
            }

            if (url !== '') {
              const normalized = normalizeProxyUrl(url);
              if (normalized && !urlSet.has(normalized)) {
                urlSet.add(normalized);
                tempProxyList.push({ url: normalized, enabled });
              } else if (normalized && urlSet.has(normalized)) {
                duplicateCount++;
              } else if (!normalized) {
                invalidCount++;
              }
            }
          });

          isMultiEditMode = false;
          multiEditMode.style.display = 'none';
          singleAddMode.style.display = 'block';
          saveMultiEditBtn.style.display = 'none';
          toggleModeBtn.textContent = '📝 手动编辑';
          renderProxyList();

          const messages = [];
          if (duplicateCount > 0) messages.push(`已去重 ${duplicateCount} 个重复项`);
          if (invalidCount > 0) messages.push(`已忽略 ${invalidCount} 个无效项`);

          if (messages.length > 0) {
            showNotification(`✅ 已保存并切换到列表编辑（${messages.join('，')}）`, 'success');
          } else {
            showNotification('✅ 已保存并切换到列表编辑', 'success');
          }
        });
      }

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

        if (tempProxyList.some((p) => p.url === normalized)) {
          showNotification('❌ 该代理已存在', 'error');
          return;
        }

        tempProxyList.push({ url: normalized, enabled: true });
        newProxyInput.value = '';
        renderProxyList();
        showNotification('✅ 代理已添加', 'success');
      });

      newProxyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addProxyBtn.click();
      });

      const timeoutInput = modal.querySelector('#proxy-timeout');
      if (timeoutInput) {
        timeoutInput.addEventListener('change', () => {
          let value = parseInt(timeoutInput.value) || 10000;
          if (value < 100) value = 100;
          if (value > 100000) value = 100000;
          timeoutInput.value = value;
          tempProxyTimeout = value;
        });
      }

      const checkAllBtn = modal.querySelector('#check-all-proxies');
      if (checkAllBtn) checkAllBtn.addEventListener('click', checkAllProxies);

      const enableAllBtn = modal.querySelector('#enable-all-proxies');
      if (enableAllBtn) enableAllBtn.addEventListener('click', enableAllProxies);

      const disableAllBtn = modal.querySelector('#disable-all-proxies');
      if (disableAllBtn) disableAllBtn.addEventListener('click', disableAllProxies);

      const disableFailedBtn = modal.querySelector('#disable-failed-proxies');
      if (disableFailedBtn) disableFailedBtn.addEventListener('click', disableFailedProxies);

      const deleteFailedBtn = modal.querySelector('#delete-failed-proxies');
      if (deleteFailedBtn) deleteFailedBtn.addEventListener('click', deleteFailedProxies);
    }

    renderPlayerList();
    updateView();

    modal.querySelector('[data-view="main-settings"]').addEventListener('click', () => {
      currentView = 'main-settings';
      updateView();
    });

    const closeModal = () => modal.remove();
    modal.querySelector('#btn-close').addEventListener('click', closeModal);

    function saveSettings(shouldReload = false) {
      let hasChanges = false;

      if (getExternalPlayer() !== currentDefaultPlayer) {
        setExternalPlayer(currentDefaultPlayer);
        hasChanges = true;
      }

      const oldPlayersStr = JSON.stringify(getPlayers() || []);
      const newPlayersStr = JSON.stringify(tempPlayers);
      if (oldPlayersStr !== newPlayersStr) {
        setPlayers(tempPlayers);
        hasChanges = true;
      }

      const oldButtonSettingsStr = JSON.stringify(getButtonSettings() || {});
      const newButtonSettingsStr = JSON.stringify(tempButtonSettings);
      if (oldButtonSettingsStr !== newButtonSettingsStr) {
        setButtonSettings(tempButtonSettings);
        hasChanges = true;
      }

      const validatedProxyList = [];
      for (const proxy of tempProxyList) {
        const normalized = normalizeProxyUrl(proxy.url);
        if (normalized === null) {
          showNotification(`❌ 代理地址格式错误: ${proxy.url}`, 'error');
          return;
        }
        validatedProxyList.push({ url: normalized, enabled: proxy.enabled });
      }

      const oldListStr = JSON.stringify(getProxyList() || []);
      const newListStr = JSON.stringify(validatedProxyList);
      if (oldListStr !== newListStr) {
        setProxyList(validatedProxyList);
        hasChanges = true;
      }

      if (getProxyTimeout() !== tempProxyTimeout) {
        setProxyTimeout(tempProxyTimeout);
        hasChanges = true;
      }

      closeModal();

      if (hasChanges) {
        if (shouldReload) {
          showNotification('✅ 设置已保存，正在刷新页面...', 'success');
          setTimeout(() => location.reload(), 800);
        } else {
          showNotification('✅ 设置已保存，正在应用更改...', 'success');
          setTimeout(() => {
            refreshAllButtons?.();
            showNotification('✅ 设置已生效', 'success');
          }, 500);
        }
      } else {
        showNotification('ℹ️ 没有修改任何设置', 'info');
      }
    }

    modal.querySelector('#btn-save').addEventListener('click', () => saveSettings(false));
  };
}

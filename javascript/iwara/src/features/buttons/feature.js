/**
 * @param {{
 *  videoApi: any,
 *  getButtonSettings: () => any,
 *  getProxiedUrl: (url: string) => string,
 *  isVideoPage: () => boolean,
 *  isVideoListPage: () => boolean
 * }} deps
 */
export function createButtonsFeature(deps) {
  const { videoApi, getButtonSettings, getProxiedUrl, isVideoPage, isVideoListPage } = deps;

  function createDetailButtonGroup() {
    if (document.getElementById('iwara-mpv-button-group-detail')) return;

    const videoUrl = videoApi.getVideoUrl();
    if (!videoUrl) {
      console.warn('[Iwara Player] 视频URL未找到，无法创建按钮');
      return;
    }

    const buttonSettings = getButtonSettings();
    const videoTitle = videoApi.getVideoTitle();

    const buttonGroup = document.createElement('div');
    buttonGroup.id = 'iwara-mpv-button-group-detail';

    if (buttonSettings?.detailPage?.copy) {
      const copyButton = videoApi.createButton('copy-btn', '复制视频链接', 'COPY', async () => {
        try {
          const videoId = videoApi.getVideoIdFromUrl();
          if (!videoId) {
            videoApi.notify?.('❌ 无法获取视频 ID', 'error');
            return;
          }
          const proxyPrefix = videoApi.pickProxyPrefix?.() || '';
          videoApi.notify?.('🔄 正在获取视频链接...', 'info', {
            proxyPrefix
          });
          const { proxiedUrl, url } = await videoApi.getVideoLinkById(videoId, null, { proxyPrefix });
          const finalUrl = proxiedUrl || (proxyPrefix ? proxyPrefix + url : url);
          await videoApi.copyToClipboard(finalUrl);
          videoApi.notify?.('✅ 链接已复制到剪贴板', 'success', { proxyPrefix });
        } catch (error) {
          console.error('[Iwara Player] 复制失败:', error);
          videoApi.notify?.('❌ 复制失败: ' + (error?.message || error), 'error');
        }
      });
      buttonGroup.appendChild(copyButton);
    }

    if (buttonSettings?.detailPage?.newTab) {
      const downloadButton = videoApi.createButton('new-tab-btn', '在新标签页播放', 'NEW_TAB', async () => {
        try {
          const videoId = videoApi.getVideoIdFromUrl();
          if (!videoId) {
            videoApi.notify?.('❌ 无法获取视频 ID', 'error');
            return;
          }
          const proxyPrefix = videoApi.pickProxyPrefix?.() || '';
          videoApi.notify?.('🔄 正在获取视频链接...', 'info', {
            proxyPrefix
          });
          const { proxiedUrl, url } = await videoApi.getVideoLinkById(videoId, null, { proxyPrefix });
          const finalUrl = proxiedUrl || (proxyPrefix ? proxyPrefix + url : url);
          const opened = window.open(finalUrl, '_blank', 'noopener,noreferrer');
          if (!opened) {
            videoApi.notify?.('❌ 打开失败: 浏览器拦截了新标签页/弹窗，请允许后重试', 'error', { proxyPrefix });
            return;
          }
          videoApi.notify?.('✅ 已在新标签页打开', 'success', { proxyPrefix });
        } catch (error) {
          console.error('[Iwara Player] 打开失败:', error);
          videoApi.notify?.('❌ 打开失败: ' + (error?.message || error), 'error');
        }
      });
      buttonGroup.appendChild(downloadButton);
    }

    if (buttonSettings?.detailPage?.quality) {
      const qualityButton = videoApi.createButton('quality-btn', '540 画质', '540', async () => {
        const videoId = videoApi.getVideoIdFromUrl();
        if (!videoId) {
          videoApi.notify?.('❌ 无法获取视频 ID', 'error');
          return;
        }
        videoApi.playVideoById(videoId, videoTitle, '540');
      });
      buttonGroup.appendChild(qualityButton);
    }

    if (buttonSettings?.detailPage?.play) {
      const playButton = videoApi.createButton('play-btn', 'Source 画质', 'PLAY', videoApi.playWithExternalPlayer);
      buttonGroup.appendChild(playButton);
    }

    if (buttonGroup.children.length > 0) document.body.appendChild(buttonGroup);
  }

  function createHoverButton(videoTeaser, videoId, videoName) {
    if (videoTeaser.querySelector('.iwara-mpv-button-group')) return null;

    const buttonSettings = getButtonSettings();
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'iwara-mpv-button-group';

    if (buttonSettings?.listPage?.copy) {
      const copyButton = videoApi.createButton('iwara-mpv-action-btn copy', '复制视频链接', 'COPY', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          const proxyPrefix = videoApi.pickProxyPrefix?.() || '';
          videoApi.notify?.('🔄 正在获取视频链接...', 'info', {
            proxyPrefix
          });
          const { proxiedUrl, url } = await videoApi.getVideoLinkById(videoId, null, { proxyPrefix });
          const finalUrl = proxiedUrl || (proxyPrefix ? proxyPrefix + url : url);
          await videoApi.copyToClipboard(finalUrl);
          videoApi.notify?.('✅ 链接已复制到剪贴板', 'success', { proxyPrefix });
        } catch (error) {
          console.error('[Iwara Player] 复制失败:', error);
          videoApi.notify?.('❌ 复制失败: ' + (error?.message || error), 'error');
        }
      });
      buttonGroup.appendChild(copyButton);
    }

    if (buttonSettings?.listPage?.newTab) {
      const newTabButton = videoApi.createButton('iwara-mpv-action-btn new-tab', '在新标签页播放', 'NEW_TAB', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          const proxyPrefix = videoApi.pickProxyPrefix?.() || '';
          videoApi.notify?.('🔄 正在获取视频链接...', 'info', {
            proxyPrefix
          });
          const { proxiedUrl, url } = await videoApi.getVideoLinkById(videoId, null, { proxyPrefix });
          const finalUrl = proxiedUrl || (proxyPrefix ? proxyPrefix + url : url);
          const opened = window.open(finalUrl, '_blank', 'noopener,noreferrer');
          if (!opened) {
            videoApi.notify?.('❌ 打开失败: 浏览器拦截了新标签页/弹窗，请允许后重试', 'error', { proxyPrefix });
            return;
          }
          videoApi.notify?.('✅ 已在新标签页打开', 'success', { proxyPrefix });
        } catch (error) {
          console.error('[Iwara Player] 打开失败:', error);
          videoApi.notify?.('❌ 打开失败: ' + (error?.message || error), 'error');
        }
      });
      buttonGroup.appendChild(newTabButton);
    }

    if (buttonSettings?.listPage?.quality) {
      const qualityButton = videoApi.createButton('iwara-mpv-action-btn quality', '540 画质', '540', (e) => {
        e.preventDefault();
        e.stopPropagation();
        videoApi.playVideoById(videoId, videoName, '540');
      });
      buttonGroup.appendChild(qualityButton);
    }

    if (buttonSettings?.listPage?.play) {
      const playButton = videoApi.createButton('iwara-mpv-hover-button', 'Source 画质', 'PLAY', (e) => {
        e.preventDefault();
        e.stopPropagation();
        videoApi.playVideoById(videoId, videoName);
      });
      buttonGroup.appendChild(playButton);
    }

    if (buttonGroup.children.length > 0) {
      if (buttonGroup.children.length < 4) buttonGroup.classList.add('single-column');
      videoTeaser.appendChild(buttonGroup);
      return buttonGroup;
    }

    return null;
  }

  function handleVideoTeaserHover() {
    const videoTeasers = document.querySelectorAll('.videoTeaser');

    videoTeasers.forEach((teaser) => {
      if (teaser.dataset.mpvProcessed) return;
      teaser.dataset.mpvProcessed = 'true';

      const thumbnailLink = teaser.querySelector('a.videoTeaser__thumbnail');
      if (!thumbnailLink) return;

      const href = thumbnailLink.getAttribute('href');
      if (!href) return;

      const videoIdMatch = href.match(/\/video\/([^\/]+)/);
      if (!videoIdMatch) return;

      const videoId = videoIdMatch[1];

      const titleElement = teaser.querySelector('.videoTeaser__title, a[title]');
      const videoName = titleElement
        ? titleElement.getAttribute('title') || titleElement.textContent.trim()
        : 'Video';

      if (!videoId) return;

      const buttonGroup = createHoverButton(teaser, videoId, videoName);

      teaser.addEventListener('mouseenter', () => {
        if (!buttonGroup) return;
        buttonGroup.style.display = 'grid';
        setTimeout(() => {
          buttonGroup.classList.add('visible');
          buttonGroup.querySelectorAll('button').forEach((btn, index) => {
            setTimeout(() => {
              btn.style.transform = 'scale(1)';
              btn.style.opacity = '1';
            }, index * 50);
          });
        }, 10);
      });

      teaser.addEventListener('mouseleave', () => {
        if (!buttonGroup) return;
        buttonGroup.classList.remove('visible');
        buttonGroup.querySelectorAll('button').forEach((btn) => {
          btn.style.opacity = '0';
          btn.style.transform = btn.classList.contains('iwara-mpv-hover-button') ? 'scale(0.9)' : 'scale(0.8)';
        });
        setTimeout(() => (buttonGroup.style.display = 'none'), 200);
      });
    });
  }

  function removeDetailButtonGroup() {
    document.getElementById('iwara-mpv-button-group-detail')?.remove();
  }

  function refreshAllButtons() {
    removeDetailButtonGroup();
    if (isVideoPage()) createDetailButtonGroup();

    if (isVideoListPage()) {
      document.querySelectorAll('.iwara-mpv-button-group').forEach((group) => group.remove());
      document.querySelectorAll('.videoTeaser').forEach((teaser) => (teaser.dataset.mpvProcessed = ''));
      handleVideoTeaserHover();
    }
  }

  return {
    createDetailButtonGroup,
    handleVideoTeaserHover,
    removeDetailButtonGroup,
    refreshAllButtons
  };
}

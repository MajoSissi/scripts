export function normalizeProxyUrl(url) {
  if (!url || url.trim() === '') return '';

  url = url.trim();

  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    if (!/^[a-z0-9.-]+$/i.test(hostname)) {
      console.warn(`[Iwara Player] 无效的代理域名（包含非法字符）: ${hostname}`);
      return null;
    }

    if (!hostname.includes('.')) {
      console.warn(`[Iwara Player] 无效的代理域名（缺少顶级域名）: ${hostname}`);
      return null;
    }

    const parts = hostname.split('.');
    if (parts.some((part) => part === '')) {
      console.warn(`[Iwara Player] 无效的代理域名格式: ${hostname}`);
      return null;
    }

    const tld = parts[parts.length - 1];
    if (tld.length < 2) {
      console.warn(`[Iwara Player] 无效的顶级域名: ${tld}`);
      return null;
    }

    const protocol = urlObj.protocol.toLowerCase();
    const lowercaseHostname = hostname.toLowerCase();
    const port = urlObj.port ? `:${urlObj.port}` : '';
    const pathname = urlObj.pathname;
    const search = urlObj.search;
    const hash = urlObj.hash;

    let normalizedUrl = `${protocol}//${lowercaseHostname}${port}${pathname}${search}${hash}`;

    if (!search && !hash && !normalizedUrl.endsWith('/')) {
      normalizedUrl += '/';
    }

    return normalizedUrl;
  } catch (e) {
    console.warn(`[Iwara Player] URL格式错误: ${url}`, e);
    return null;
  }
}

export function getCurrentProxyPrefix() {
  const currentHostname = window.location.hostname;
  const isIwaraDomain = currentHostname.endsWith('.iwara.tv');

  if (isIwaraDomain) return '';

  const currentUrl = window.location.href;
  const match = currentUrl.match(/^(https?:\/\/[^\/]+)\//);

  if (match) {
    const pureProxy = match[1] + '/';

    console.log(
      `%c[Iwara Player] API 代理`,
      'color: #ffa500; font-weight: bold;',
      `\n当前域名: ${currentHostname}`,
      `\n检测到代理访问，API 请求将使用代理: ${pureProxy}`
    );

    return pureProxy;
  }

  console.warn(
    `%c[Iwara Player] API 代理`,
    'color: #ff6b6b; font-weight: bold;',
    `\n当前域名: ${currentHostname}`,
    '\n无法检测代理前缀，API 请求可能失败'
  );

  return '';
}

export function createProxyApi({ getProxyList }) {
  function pickProxyPrefix() {
    const currentHostname = window.location.hostname;
    const isIwaraDomain =
      currentHostname === 'iwara.tv' ||
      currentHostname === 'www.iwara.tv' ||
      currentHostname.endsWith('.iwara.tv');

    if (!isIwaraDomain) return getCurrentProxyPrefix() || '';

    const proxyList = (typeof getProxyList === 'function' ? getProxyList() : []) || [];
    const enabledProxies = proxyList.filter((p) => p?.enabled);
    if (enabledProxies.length === 0) return '';

    const randomIndex = Math.floor(Math.random() * enabledProxies.length);
    const selectedProxy = enabledProxies[randomIndex];
    return selectedProxy?.url || '';
  }

  function proxifyWithPrefix(prefix, url) {
    if (!prefix) return url;
    return prefix + url;
  }

  function getProxiedUrl(videoUrl) {
    const currentHostname = window.location.hostname;
    const isIwaraDomain =
      currentHostname === 'iwara.tv' ||
      currentHostname === 'www.iwara.tv' ||
      currentHostname.endsWith('.iwara.tv');

    if (!isIwaraDomain) {
      const currentProxy = getCurrentProxyPrefix();
      if (currentProxy) {
        const proxiedUrl = currentProxy + videoUrl;
        console.log(
          `%c[Iwara Player] 代理信息`,
          'color: #ffa500; font-weight: bold;',
          `\n当前域名: ${currentHostname}`,
          '\n使用当前代理前缀:',
          '\n代理地址:',
          currentProxy,
          '\n代理后URL:',
          proxiedUrl
        );
        return proxiedUrl;
      }

      console.log(
        `%c[Iwara Player] 代理信息`,
        'color: #ffa500; font-weight: bold;',
        `\n当前域名: ${currentHostname}`,
        '\n非 iwara.tv 域名且无法检测代理，返回原始URL'
      );
      return videoUrl;
    }

    const proxyList = (typeof getProxyList === 'function' ? getProxyList() : []) || [];
    const enabledProxies = proxyList.filter((p) => p?.enabled);

    if (enabledProxies.length === 0) return videoUrl;

    const randomIndex = Math.floor(Math.random() * enabledProxies.length);
    const selectedProxy = enabledProxies[randomIndex];
    const proxiedUrl = selectedProxy.url + videoUrl;

    console.log(
      `%c[Iwara Player] 代理信息`,
      'color: #ffa500; font-weight: bold;',
      `\n当前域名: ${currentHostname}`,
      `\n已选择代理: (${randomIndex + 1}/${enabledProxies.length})`,
      '\n代理地址:',
      selectedProxy.url,
      '\n代理后URL:',
      proxiedUrl
    );

    return proxiedUrl;
  }

  return {
    normalizeProxyUrl,
    getCurrentProxyPrefix,
    pickProxyPrefix,
    proxifyWithPrefix,
    getProxiedUrl
  };
}

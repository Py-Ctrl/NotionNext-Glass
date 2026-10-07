/* eslint-disable */
// 不蒜子统计脚本注入器
//
// 历史：原默认端点为 //busuanzi.ibruce.info/busuanzi，但该官方服务自 2024 年起
// 频繁出现 502/不可达，影响大量 fork 站点的 PV/UV 显示。
// 社区维护的兼容实现 Vercount(https://github.com/EvanNotFound/vercount) 提供
// HTTPS API（POST /api/v2/log），与 busuanzi_value_* span 完全兼容，但要求
// DOM 元素同时带 id="busuanzi_value_*" 才能由 Vercount 自带的 /js 脚本回填。
//
// 因为 NotionNext 的 Footer / AnalyticsCard / ArticleInfo 一直用 class 名渲染
// span 而非 id 名，直接注入 Vercount /js 不会回填我们的 DOM（POST 成功但找不到
// 元素）。所以本插件对非 JSONP 端点改为：自己 POST 到 Vercount API，拿到数据
// 后用 bszTag.texts()（class 名版本）回填。JSONP 端点（自托管不蒜子等）仍走
// 原回调流程。
//
// 可通过 NEXT_PUBLIC_BUSUANZI_SCRIPT_URL 覆盖默认端点：
//   * JSONP：//busuanzi.ibruce.info/busuanzi?jsonpCallback=BusuanziCallback
//   * Vercount 官方：https://events.vercount.one/js
//   * 自托管 Vercount：https://vercount.your-domain.com/js
//
// 重要：本模块 export 的 fetch 函数会遮蔽全局 fetch API。fetchVercountApi
// 内部已显式取 window.fetch，避免误调到自己。
let bszCaller, bszTag, scriptTag, ready

let intervalId;
let executeCallbacks;
let onReady;
let isReady = false;
let callbacks = [];

const DEFAULT_BUSUANZI_URL = 'https://events.vercount.one/js'
const BUSUANZI_URL =
  (typeof process !== 'undefined' && process?.env?.NEXT_PUBLIC_BUSUANZI_SCRIPT_URL) ||
  DEFAULT_BUSUANZI_URL
const isJsonpStyle = /jsonpCallback=/.test(BUSUANZI_URL)

// 修复Node同构代码的问题
if (typeof document !== 'undefined') {
  ready = function (callback) {
    if (isReady || document.readyState === 'interactive' || document.readyState === 'complete') {
      callback.call(document);
    } else {
      callbacks.push(function () {
        return callback.call(this);
      });
    }
    return this;
  };

  executeCallbacks = function () {
    for (let i = 0, len = callbacks.length; i < len; i++) {
      callbacks[i].apply(document);
    }
    callbacks = [];
  };

  onReady = function () {
    if (!isReady) {
      isReady = true;
      executeCallbacks.call(window);
      if (document.removeEventListener) {
        document.removeEventListener('DOMContentLoaded', onReady, false);
      } else if (document.attachEvent) {
        document.detachEvent('onreadystatechange', onReady);
        if (window == window.top) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }
    }
  };

  if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', onReady, false);
  } else if (document.attachEvent) {
    document.attachEvent('onreadystatechange', function () {
      if (/loaded|complete/.test(document.readyState)) {
        onReady();
      }
    });
    if (window == window.top) {
      intervalId = setInterval(function () {
        try {
          if (!isReady) {
            document.documentElement.doScroll('left');
          }
        } catch (e) {
          return;
        }
        onReady();
      }, 5);
    }
  }
}

bszCaller = {
  fetch: function (url, callback) {
    const callbackName = 'BusuanziCallback_' + Math.floor(1099511627776 * Math.random())
    url = url.replace('=BusuanziCallback', '=' + callbackName)
    scriptTag = document.createElement('SCRIPT');
    scriptTag.type = 'text/javascript';
    scriptTag.defer = true;
    scriptTag.src = url;
    scriptTag.referrerPolicy = 'no-referrer-when-downgrade';
    // 请求失败时也恢复显示，避免容器一直隐藏（本仓库扩展）
    scriptTag.onerror = function () {
      ready(function () {
        try {
          bszTag.shows();
          removeCurrentScript();
        } catch (e) {}
      })
    };
    document.getElementsByTagName('HEAD')[0].appendChild(scriptTag);
    window[callbackName] = this.evalCall(callback)
  },
  evalCall: function (callback) {
    return function (data) {
      ready(function () {
        try {
          callback(data);
          if (scriptTag && scriptTag.parentElement && scriptTag.parentElement.contains(scriptTag)) {
            scriptTag.parentElement.removeChild(scriptTag);
          }
        } catch (e) {
          // console.log(e);
          // bszTag.hides();
        }
      })
    }
  }
}

const removeCurrentScript = () => {
  if (scriptTag && scriptTag.parentElement && scriptTag.parentElement.contains(scriptTag)) {
    scriptTag.parentElement.removeChild(scriptTag);
  }
  scriptTag = null;
}

// Vercount 用 cookie 标记是否首次访问：vercount_uv_<sanitized-host>=1
const vercountCookieName = () => {
  const host = (typeof window !== 'undefined' && window.location && window.location.host) || 'unknown-host'
  const safe = host.replace(/[^a-zA-Z0-9_-]/g, '_')
  return `vercount_uv_${safe}`
}

const isVercountReturningVisitor = () => {
  try {
    return document.cookie.split('; ').some(c => c === `${vercountCookieName()}=1`)
  } catch (e) {
    return false
  }
}

const markVercountVisited = () => {
  try {
    document.cookie = `${vercountCookieName()}=1; path=/; max-age=31536000; samesite=lax`
  } catch (e) { /* ignore */ }
}

// 把 script URL 推断成 API base：https://events.vercount.one/js -> https://events.vercount.one
const apiBaseFromScriptUrl = (scriptUrl) => {
  try {
    const u = new URL(scriptUrl, typeof window !== 'undefined' ? window.location.href : 'http://localhost')
    // 去掉末尾的 /js 或 /js?xxx
    if (u.pathname.replace(/\?.*$/, '') === '/js') {
      u.pathname = '/'
    }
    return u.origin + u.pathname.replace(/\/$/, '')
  } catch (e) {
    return scriptUrl
  }
}

// POST 到 Vercount /api/v2/log 拿数据，再走 bszTag.texts()（class 名版本）回填
const fetchVercountApi = async () => {
  // 必须显式走 window.fetch：本模块顶部 const fetch = () => {...} 会遮蔽全局 fetch。
  const browserFetch = (typeof window !== 'undefined' && window.fetch) || (typeof fetch !== 'undefined' ? fetch : null)
  if (!browserFetch) return // 老浏览器兜底跳过
  const apiBase = apiBaseFromScriptUrl(BUSUANZI_URL)
  const isNewUv = !isVercountReturningVisitor()
  const url = location.href
  try {
    const res = await browserFetch(`${apiBase}/api/v2/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, isNewUv }),
      referrerPolicy: 'no-referrer-when-downgrade',
      credentials: 'omit',
      cache: 'no-store'
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const payload = await res.json()
    // Vercount 返回 { status, message, data: { site_pv, site_uv, page_pv } }
    const stats = (payload && payload.data) || payload || {}
    bszTag.texts(stats)
    notify(stats)
    if (isNewUv) markVercountVisited()
  } catch (e) {
    // 静默失败，仍显示容器，避免页面残留 hidden 占位
    // console.warn('vercount fetch failed:', e)
  } finally {
    if (typeof bszTag !== 'undefined') bszTag.shows()
  }
}

/* 缓存最近一次数据并广播给订阅者：SPA 路由切换后新挂载的组件也能拿到值，
   无需再次请求（重复请求会让 site_pv 虚高）。
   注意：subscribe 是本仓库对上游的扩展，Glass 主题的 SiteStatsText 依赖它。 */
let lastData = null
const subscribers = new Set()

function notify (data) {
  lastData = data
  subscribers.forEach(cb => {
    try {
      cb(data)
    } catch (e) {}
  })
}

const fetch = () => {
  // 路由切换/主题切换时清掉旧脚本，避免并发请求导致计数翻倍
  removeCurrentScript();

  if (isJsonpStyle) {
    // 官方不蒜子 JSONP 协议：脚本回填后由回调更新 DOM
    bszCaller.fetch(BUSUANZI_URL, function (data) {
      // console.log('不蒜子', data)
      bszTag.texts(data);
      bszTag.shows();
      notify(data)
    });
    return;
  }

  // 非 JSONP 端点（如 Vercount /js）：插件自己 POST 到 Vercount API，
  // 拿到数据后用 class 名版本的 bszTag.texts() 回填 span。
  // 不注入 Vercount 自带的 /js 脚本——它用 id 选择器，跟我们的 class 名不匹配。
  fetchVercountApi();
}

bszTag = {
  bszs: ['site_pv', 'page_pv', 'site_uv'],
  texts: function (data) {
    this.bszs.map(function (key) {
      const elements = document.getElementsByClassName('busuanzi_value_' + key)
      if (elements) {
        for (var element of elements) {
          const v = data && (data[key] != null) ? data[key] : 0
          element.innerHTML = v
        }
      }
    })
  },
  hides: function () {
    this.bszs.map(function (key) {
      const elements = document.getElementsByClassName('busuanzi_container_' + key)
      if (elements) {
        for (var element of elements) {
          element.style.display = 'none';
        }
      }
    })
  },
  shows: function () {
    this.bszs.map(function (key) {
      const elements = document.getElementsByClassName('busuanzi_container_' + key)
      if (elements) {
        for (var element of elements) {
          element.style.display = 'inline';
        }
      }
    })
  }
}

module.exports = {
  fetch,
  // 订阅统计结果（本仓库扩展）：立即回放缓存值，之后每次 fetch 成功都会推送
  subscribe: function (cb) {
    subscribers.add(cb)
    if (lastData) {
      cb(lastData)
    }
    return () => {
      subscribers.delete(cb)
    }
  }
}

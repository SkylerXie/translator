import { createApp } from 'vue';
import ContentApp from './content-ui/ContentApp.vue';

// 翻译状态
let isTranslationActive = false;
// 已翻译的节点
const translatedElements = new WeakSet<HTMLElement>();
// 存储原文到元素列表的映射
const textToElementsMap = new Map<string, HTMLElement[]>();
// 存储已翻译的文本缓存
const translationCache = new Map<string, string>();

//预加载距离
const PRELOAD_DISTANCE = 4000;

// DOM监听器
let mutationObserver: MutationObserver | null = null;
let scrollTimeout: number | null = null;

// 检查元素是否在视窗内
function isElementInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight + PRELOAD_DISTANCE || document.documentElement.clientHeight + PRELOAD_DISTANCE) &&
    rect.right <= (window.innerWidth + PRELOAD_DISTANCE || document.documentElement.clientWidth + PRELOAD_DISTANCE) &&
    rect.width > 0 &&
    rect.height > 0
  );
}

// 检查元素是否应该被翻译
function shouldTranslateElement(element: HTMLElement): boolean {
  // 跳过已翻译的元素
  if (translatedElements.has(element)) {
    return false;
  }

  // 跳过翻译结果元素
  if (element.classList.contains('translation-result')) {
    return false;
  }

  // 跳过脚本、样式等元素
  const tagName = element.tagName.toLowerCase();
  if (['script', 'style', 'noscript', 'meta', 'link', 'title'].includes(tagName)) {
    return false;
  }

  // ===== 新增：代码相关元素检测 =====

  // 1. 跳过代码标签
  if (['code', 'pre', 'kbd', 'samp', 'var'].includes(tagName)) {
    return false;
  }

  // 2. 检查是否在代码块容器内
  if (element.closest('pre, code, .highlight, .code-block, .language-, [class*="code"], [class*="highlight"]')) {
    return false;
  }

  // 3. 检查类名是否包含代码相关关键词
  const className = element.className.toLowerCase();
  const codeClassPatterns = [
    'code', 'highlight', 'syntax', 'language-', 'hljs', 'prism',
    'codehilite', 'sourceCode', 'code-block', 'code-snippet',
    'terminal', 'console', 'shell', 'bash', 'cmd'
  ];

  if (codeClassPatterns.some(pattern => className.includes(pattern))) {
    return false;
  }

  // 4. 检查父元素是否有代码相关的类名或属性
  let parent = element.parentElement;
  while (parent && parent !== document.body) {
    const parentClass = parent.className.toLowerCase();
    const parentTag = parent.tagName.toLowerCase();

    if (['pre', 'code'].includes(parentTag) ||
      codeClassPatterns.some(pattern => parentClass.includes(pattern))) {
      return false;
    }
    parent = parent.parentElement;
  }

  // ===== 原有逻辑 =====

  // 跳过隐藏元素
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }

  return true;
}

// 获取元素的文本内容
function getElementText(element: HTMLElement): string {
  // 只获取直接文本内容，不包括子元素的文本
  let text = '';
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent || '';
    }
  }
  return text.trim();
}

// 扫描可见文本元素并建立映射
function scanAndMapTextElements() {
  // 选择可能包含文本的元素
  const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, li, td, th, a, label, button, blockquote, pre, code');

  for (const element of textElements) {
    const htmlElement = element as HTMLElement;

    // 检查是否应该翻译
    if (!shouldTranslateElement(htmlElement)) {
      continue;
    }

    // 检查是否在视窗内（包括预加载距离）
    if (!isElementInViewport(htmlElement)) {
      continue;
    }

    // 获取文本内容
    const text = getElementText(htmlElement);
    if (!text || text.length < 2) {
      continue;
    }

    // 跳过纯数字或特殊字符
    if (/^[\d\s\-_.,;:!?()[\]{}'"]*$/.test(text)) {
      continue;
    }

    // 添加到文本-元素映射中
    if (!textToElementsMap.has(text)) {
      textToElementsMap.set(text, []);
    }

    const elements = textToElementsMap.get(text)!;
    // 避免重复添加同一个元素
    if (!elements.includes(htmlElement)) {
      elements.push(htmlElement);
    }
  }
}

// 处理翻译请求
function processTranslation() {
  if (!isTranslationActive || textToElementsMap.size === 0) {
    return;
  }

  // 分离需要翻译的文本和已缓存的文本
  const textsToTranslate: string[] = [];
  const cachedTexts: string[] = [];

  for (const [text] of textToElementsMap) {
    if (translationCache.has(text)) {
      cachedTexts.push(text);
    } else {
      textsToTranslate.push(text);
    }
  }

  console.log(`总文本数: ${textToElementsMap.size}, 需要翻译: ${textsToTranslate.length}, 已缓存: ${cachedTexts.length}`);

  // 先处理已缓存的翻译
  for (const text of cachedTexts) {
    const translatedText = translationCache.get(text)!;
    insertTranslationForAllElements(text, translatedText);
  }

  // 发送需要翻译的文本到后台脚本
  if (textsToTranslate.length > 0) {
    browser.runtime.sendMessage({
      action: 'translateTexts',
      texts: textsToTranslate
    }).catch(error => {
      console.error('发送翻译请求失败:', error);
    });
  }
}

// 检查是否为不可见字符
function isInvisibleText(text: string): boolean {
  if (!text || text.trim() === '') {
    return true;
  }

  // 检查是否只包含不可见字符（空白字符、控制字符等）
  const invisiblePattern = /^[\s\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]*$/;
  return invisiblePattern.test(text);
}

// 为映射中的所有元素插入翻译
function insertTranslationForAllElements(originalText: string, translatedText: string) {
  try {
    // 检查译文是否为不可见字符，如果是则不插入
    if (isInvisibleText(translatedText)) {
      console.log('跳过不可见字符译文:', { originalText, translatedText });
      return;
    }

    // 缓存翻译结果
    translationCache.set(originalText, translatedText);

    // 获取该文本对应的所有元素
    const elements = textToElementsMap.get(originalText);
    if (!elements || elements.length === 0) {
      console.warn('无法找到元素列表:', originalText);
      return;
    }

    // 为每个元素插入翻译
    for (const element of elements) {
      // 检查元素是否还在DOM中
      if (!document.contains(element)) {
        console.warn('元素已从DOM中移除，跳过:', originalText);
        continue;
      }

      insertTranslationToElement(element, translatedText);
    }

    console.log(`翻译已插入到 ${elements.length} 个元素:`, { originalText, translatedText });
  } catch (error) {
    console.error('插入翻译失败:', error);
  }
}

// 为单个元素插入翻译
function insertTranslationToElement(element: HTMLElement, translatedText: string) {
  // 标记为已翻译
  translatedElements.add(element);

  // 检查是否已有翻译结果
  let translationDiv = element.querySelector('.translation-result');
  if (translationDiv) {
    // 更新现有翻译
    translationDiv.textContent = translatedText;
    return;
  }

  // 创建翻译结果元素
  if (element.tagName.toLowerCase() === 'a') {
    translationDiv = document.createElement('a');
    const anchorElement = element as HTMLAnchorElement;
    const translationAnchor = translationDiv as HTMLAnchorElement;

    if (anchorElement.href) {
      translationAnchor.href = anchorElement.href;
    }
    if (anchorElement.target) {
      translationAnchor.target = anchorElement.target;
    }
    if (anchorElement.rel) {
      translationAnchor.rel = anchorElement.rel;
    }
  } else {
    translationDiv = document.createElement('div');
  }

  translationDiv.className = 'translation-result';
  translationDiv.textContent = translatedText;

  // 应用样式
  const originalStyle = window.getComputedStyle(element);
  translationDiv.style.cssText = `
    font-family: ${originalStyle.fontFamily};
    font-size: ${Math.max(12, parseFloat(originalStyle.fontSize) * 0.9)}px;
    line-height: ${originalStyle.lineHeight};
    color: #666;
    margin-top: 4px;
    display: block;
  `;

  // 插入翻译结果到原文元素内部
  // element.appendChild(translationDiv);
  element.textContent = translatedText
}

// 设置DOM变化监听
function setupMutationObserver() {
  if (mutationObserver) {
    mutationObserver.disconnect();
  }

  mutationObserver = new MutationObserver((mutations) => {
    if (!isTranslationActive) return;

    let hasNewElements = false;

    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            // 跳过翻译结果元素
            if (element.classList.contains('translation-result')) {
              return;
            }
            hasNewElements = true;
          }
        });
      }
    });

    if (hasNewElements) {
      // 延迟扫描新内容
      setTimeout(() => {
        scanAndMapTextElements();
        processTranslation();
      }, 300);
    }
  });

  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// 滚动事件处理
function handleScroll() {
  if (!isTranslationActive) return;

  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }

  scrollTimeout = window.setTimeout(() => {
    scanAndMapTextElements();
    processTranslation();
  }, 300);
}

// 激活翻译功能
function activateTranslation() {
  if (isTranslationActive) {
    // 停用翻译
    deactivateTranslation();
    return;
  }

  isTranslationActive = true;
  console.log('翻译功能已激活');

  // 设置监听器
  setupMutationObserver();
  window.addEventListener('scroll', handleScroll, { passive: true });

  // 立即扫描当前可见内容
  scanAndMapTextElements();
  processTranslation();
}

// 停用翻译功能
function deactivateTranslation() {
  isTranslationActive = false;
  console.log('翻译功能已停用');

  // 清理监听器
  if (mutationObserver) {
    mutationObserver.disconnect();
    mutationObserver = null;
  }

  window.removeEventListener('scroll', handleScroll);

  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
    scrollTimeout = null;
  }

  // 清空映射和缓存
  textToElementsMap.clear();
}

// 监听后台消息
function setupMessageListener() {
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'insertTranslation') {
      const { originalText, translatedText } = message;
      insertTranslationForAllElements(originalText, translatedText);
      sendResponse({ success: true });
    }
    return true;
  });
}

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    // 创建容器
    const container = document.createElement('div');
    container.id = 'translator-extension-container';
    document.body.appendChild(container);

    // 创建Vue应用
    const app = createApp(ContentApp);
    app.provide('activateTranslation', activateTranslation);

    // 设置消息监听
    setupMessageListener();

    app.mount('#translator-extension-container');

    // 返回清理函数
    return () => {
      deactivateTranslation();
      app.unmount();
      container.remove();
    };
  },
});
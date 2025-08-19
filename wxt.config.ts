import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    name: 'TranslationBuddy',
    web_accessible_resources: [
      {
        resources: ['icon/*'],
        matches: ['<all_urls>']
      }
    ],
    permissions: [
      'tabs',
      'scripting',
      'storage'  // 添加存储权限
    ],
  }
});

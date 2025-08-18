<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';

defineProps({
  msg: String,
});

// 翻译引擎选项
const translationEngines = [
  { id: 'google', name: '谷歌翻译' },
  { id: 'llm', name: '大模型翻译' }
];

// 语言选项
const languages = [
  { code: 'auto', name: '自动检测' },
  { code: 'zh', name: '中文' },
  { code: 'en', name: '英文' },
  { code: 'ja', name: '日文' },
  { code: 'ko', name: '韩文' },
  { code: 'fr', name: '法文' },
  { code: 'de', name: '德文' },
  { code: 'es', name: '西班牙文' },
  { code: 'ru', name: '俄文' },
  { code: 'it', name: '意大利文' },
];

// 设置状态
const settings = reactive({
  engine: 'google',
  sourceLanguage: 'auto',
  targetLanguage: 'zh',
  autoTranslate: false,
  llmSettings: {
    baseUrl: '',
    apiKey: '',
    modelName: 'gpt-3.5-turbo'
  }
});

// 显示API密钥
const showApiKey = ref(false);

// 加载设置
async function loadSettings() {
  try {
    const result = await browser.storage.local.get([
      'translator-engine',
      'translator-source-lang',
      'translator-target-lang',
      'translator-auto-translate',
      'translator-llm-baseurl',
      'translator-llm-apikey',
      'translator-llm-model'
    ]);

    settings.engine = result['translator-engine'] || 'google';
    settings.sourceLanguage = result['translator-source-lang'] || 'auto';
    settings.targetLanguage = result['translator-target-lang'] || 'zh';
    settings.autoTranslate = result['translator-auto-translate'] === true;
    settings.llmSettings.baseUrl = result['translator-llm-baseurl'] || '';
    settings.llmSettings.apiKey = result['translator-llm-apikey'] || '';
    settings.llmSettings.modelName = result['translator-llm-model'] || 'gpt-3.5-turbo';
  } catch (error) {
    console.error('加载设置失败:', error);
  }
}

// 保存设置
async function saveSettings() {
  try {
    await browser.storage.local.set({
      'translator-engine': settings.engine,
      'translator-source-lang': settings.sourceLanguage,
      'translator-target-lang': settings.targetLanguage,
      'translator-auto-translate': settings.autoTranslate,
      'translator-llm-baseurl': settings.llmSettings.baseUrl,
      'translator-llm-apikey': settings.llmSettings.apiKey,
      'translator-llm-model': settings.llmSettings.modelName
    });
    
    alert('设置已保存');
  } catch (error) {
    console.error('保存设置失败:', error);
    alert('保存设置失败，请重试');
  }
}

// 重置设置
async function resetSettings() {
  if (confirm('确定要重置所有设置吗？')) {
    settings.engine = 'google';
    settings.sourceLanguage = 'auto';
    settings.targetLanguage = 'zh';
    settings.autoTranslate = false;
    settings.llmSettings.baseUrl = '';
    settings.llmSettings.apiKey = '';
    settings.llmSettings.modelName = 'gpt-3.5-turbo';
    await saveSettings();
  }
}

// 组件挂载时加载设置
onMounted(() => {
  loadSettings();
});
</script>

<template>
  <div class="settings-container">
    <div class="settings-section basic-settings">
      <h2>基本设置</h2>
      
      <div class="setting-item">
        <label>翻译引擎</label>
        <div class="select-wrapper">
          <select v-model="settings.engine">
            <option v-for="engine in translationEngines" :key="engine.id" :value="engine.id">
              {{ engine.name }}
            </option>
          </select>
        </div>
      </div>
      
      <div class="setting-item">
        <label>源语言</label>
        <div class="select-wrapper">
          <select v-model="settings.sourceLanguage">
            <option v-for="lang in languages" :key="lang.code" :value="lang.code">
              {{ lang.name }}
            </option>
          </select>
        </div>
      </div>
      
      <div class="setting-item">
        <label>目标语言</label>
        <div class="select-wrapper">
          <select v-model="settings.targetLanguage">
            <option v-for="lang in languages.filter(l => l.code !== 'auto')" :key="lang.code" :value="lang.code">
              {{ lang.name }}
            </option>
          </select>
        </div>
      </div>
      
      <div class="setting-item toggle-switch">
        <label for="auto-translate">自动翻译</label>
        <div class="toggle">
          <input type="checkbox" id="auto-translate" v-model="settings.autoTranslate">
          <label for="auto-translate" class="toggle-label"></label>
        </div>
      </div>
    </div>
    
    <transition name="fade">
      <div class="settings-section llm-settings" v-if="settings.engine === 'llm'">
        <h2>大模型设置</h2>
        
        <div class="setting-item">
          <label>API 基础 URL</label>
          <input type="text" v-model="settings.llmSettings.baseUrl" placeholder="例如：https://api.openai.com/v1">
        </div>
        
        <div class="setting-item">
          <label>API 密钥</label>
          <div class="api-key-input">
            <input :type="showApiKey ? 'text' : 'password'" v-model="settings.llmSettings.apiKey" placeholder="输入您的 API 密钥">
            <button class="toggle-btn" @click="showApiKey = !showApiKey">
              {{ showApiKey ? '隐藏' : '显示' }}
            </button>
          </div>
        </div>
        
        <div class="setting-item">
          <label>模型名称</label>
          <input type="text" v-model="settings.llmSettings.modelName" placeholder="例如：gpt-3.5-turbo">
        </div>
      </div>
    </transition>
    
    <div class="settings-actions">
      <button class="save-btn" @click="saveSettings">保存</button>
      <button class="reset-btn" @click="resetSettings">重置</button>
    </div>
  </div>
</template>

<style scoped>
.settings-container {
  max-width: 450px;
  margin: 0 auto;
  padding: 0;
  font-family: inherit;
  color: var(--text-primary);
  animation: fadeIn 0.4s ease-out;
}

.settings-section {
  background: var(--background-primary);
  border-radius: var(--border-radius-large);
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: var(--shadow-medium);
  transition: var(--transition);
  border: 1px solid transparent;
  position: relative;
  overflow: hidden;
}

.settings-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color), var(--accent-color));
  opacity: 0;
  transition: var(--transition);
}

.settings-section:hover {
  box-shadow: var(--shadow-heavy);
  transform: translateY(-3px);
  border-color: var(--border-hover);
}

.settings-section:hover::before {
  opacity: 1;
}

.basic-settings {
  background: linear-gradient(135deg, rgba(26, 115, 232, 0.02) 0%, rgba(52, 168, 83, 0.02) 100%);
}

.llm-settings {
  background: linear-gradient(135deg, rgba(251, 188, 4, 0.02) 0%, rgba(234, 67, 53, 0.02) 100%);
  border-left: 4px solid var(--accent-color);
}

h2 {
  color: var(--primary-color);
  margin: 0 0 20px 0;
  font-size: 1.2rem;
  font-weight: 600;
  position: relative;
  padding-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

h2::before {
  content: '⚙️';
  font-size: 1.1rem;
}

.llm-settings h2::before {
  content: '🤖';
}

h2::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 50px;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  border-radius: 3px;
  animation: slideIn 0.6s ease-out 0.2s both;
}

@keyframes slideIn {
  from {
    width: 0;
    opacity: 0;
  }
  to {
    width: 50px;
    opacity: 1;
  }
}

.setting-item {
  margin-bottom: 18px;
  display: flex;
  flex-direction: column;
  position: relative;
}

.setting-item label {
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-secondary);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: var(--transition);
}

.setting-item:hover label {
  color: var(--text-primary);
}

.select-wrapper {
  position: relative;
  width: 100%;
}

.select-wrapper::after {
  content: '▼';
  font-size: 0.7rem;
  color: var(--text-secondary);
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  transition: var(--transition);
}

.select-wrapper:hover::after {
  color: var(--primary-color);
  transform: translateY(-50%) scale(1.1);
}

.setting-item select {
  width: 100%;
  padding: 12px 14px;
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 14px;
  appearance: none;
  background-color: var(--background-secondary);
  color: var(--text-primary);
  transition: var(--transition);
  cursor: pointer;
}

.setting-item select:hover {
  border-color: var(--border-hover);
  background-color: var(--background-primary);
}

.setting-item select:focus,
.setting-item input[type="text"]:focus,
.setting-item input[type="password"]:focus {
  outline: none;
  border-color: var(--border-hover);
  box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.15);
  background-color: var(--background-primary);
}

.setting-item input[type="text"],
.setting-item input[type="password"] {
  width: 100%;
  padding: 12px 14px;
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: 14px;
  background-color: var(--background-secondary);
  color: var(--text-primary);
  transition: var(--transition);
}

.setting-item input[type="text"]:hover,
.setting-item input[type="password"]:hover {
  border-color: var(--border-hover);
  background-color: var(--background-primary);
}

.setting-item input[type="text"]::placeholder,
.setting-item input[type="password"]::placeholder {
  color: var(--text-muted);
}

/* 切换开关样式 */
.toggle-switch {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--background-secondary);
  border-radius: var(--border-radius);
  border: 2px solid var(--border-color);
  transition: var(--transition);
}

.toggle-switch:hover {
  border-color: var(--border-hover);
  background-color: var(--background-primary);
}

.toggle {
  position: relative;
  display: inline-block;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-label {
  display: block;
  width: 52px;
  height: 28px;
  border-radius: 14px;
  background-color: var(--border-color);
  cursor: pointer;
  transition: var(--transition);
  position: relative;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toggle-label::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background-color: white;
  transition: var(--transition);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

input:checked + .toggle-label {
  background-color: var(--primary-color);
  box-shadow: inset 0 2px 4px rgba(26, 115, 232, 0.3);
}

input:checked + .toggle-label::after {
  transform: translateX(24px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.api-key-input {
  display: flex;
  width: 100%;
  border-radius: var(--border-radius);
  overflow: hidden;
  border: 2px solid var(--border-color);
  transition: var(--transition);
}

.api-key-input:hover {
  border-color: var(--border-hover);
}

.api-key-input:focus-within {
  border-color: var(--border-hover);
  box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.15);
}

.api-key-input input {
  flex: 1;
  border: none;
  border-radius: 0;
  background-color: var(--background-secondary);
}

.api-key-input input:focus {
  box-shadow: none;
  border: none;
}

.toggle-btn {
  padding: 0 16px;
  background-color: var(--background-tertiary);
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-secondary);
  transition: var(--transition);
  min-width: 60px;
}

.toggle-btn:hover {
  background-color: var(--primary-color);
  color: white;
}

.settings-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

.save-btn,
.reset-btn {
  padding: 10px 20px;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: var(--transition);
  position: relative;
  overflow: hidden;
  min-width: 80px;
}

.save-btn {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
  color: white;
  box-shadow: var(--shadow-light);
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
}

.save-btn:active {
  transform: translateY(0);
}

.reset-btn {
  background-color: var(--background-primary);
  color: var(--text-secondary);
  border: 2px solid var(--border-color);
}

.reset-btn:hover {
  background-color: var(--background-tertiary);
  color: var(--text-primary);
  border-color: var(--border-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-light);
}

/* 动画效果 */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

/* 成功提示动画 */
@keyframes success {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.save-btn.success {
  animation: success 0.3s ease-out;
}

/* 响应式调整 */
@media (max-width: 480px) {
  .settings-container {
    padding: 8px;
  }
  
  .settings-section {
    padding: 16px;
    margin-bottom: 12px;
  }
  
  .setting-item {
    margin-bottom: 16px;
  }
  
  .setting-item label {
    font-size: 0.85rem;
  }
  
  .setting-item select,
  .setting-item input[type="text"],
  .setting-item input[type="password"] {
    padding: 10px 12px;
    font-size: 13px;
  }
  
  .save-btn,
  .reset-btn {
    padding: 8px 16px;
    font-size: 0.85rem;
    min-width: 70px;
  }
  
  .settings-actions {
    gap: 8px;
  }
  
  h2 {
    font-size: 1.1rem;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .settings-section {
    border: 2px solid var(--text-primary);
  }
  
  .setting-item select,
  .setting-item input[type="text"],
  .setting-item input[type="password"] {
    border-width: 2px;
  }
}

/* 减少动画 */
@media (prefers-reduced-motion: reduce) {
  .settings-section,
  .setting-item select,
  .setting-item input,
  .save-btn,
  .reset-btn,
  .toggle-label {
    transition: none;
  }
  
  .settings-container {
    animation: none;
  }
  
  h2::after {
    animation: none;
  }
}
</style>

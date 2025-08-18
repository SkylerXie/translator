<script lang="ts" setup>
import TranslatorSettings from '@/components/TranslatorSettings.vue';
</script>

<template>
  <div class="app-container">
    <div class="header">
      <img src="/icon/translate.svg" class="logo" alt="Translator logo" />
      <h1>翻译助手</h1>
    </div>
    <TranslatorSettings />
  </div>
</template>

<style scoped>
.app-container {
  width: 420px;
  min-height: 500px;
  padding: 0;
  background: linear-gradient(135deg, var(--background-secondary) 0%, rgba(232, 240, 254, 0.8) 100%);
  border-radius: 0;
  box-shadow: none;
  overflow: hidden;
  font-family: inherit;
  position: relative;
}

/* 深色模式下的容器背景 */
@media (prefers-color-scheme: dark) {
  .app-container {
    background: linear-gradient(135deg, var(--background-primary) 0%, var(--background-secondary) 100%);
  }
}

.header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0;
  padding: 20px 20px 16px 20px;
  position: relative;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 249, 250, 0.9) 100%);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-color);
}

/* 深色模式下的头部背景 */
@media (prefers-color-scheme: dark) {
  .header {
    background: linear-gradient(135deg, rgba(32, 33, 36, 0.95) 0%, rgba(48, 49, 52, 0.9) 100%);
  }
}

.header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color), var(--accent-color), var(--danger-color));
  animation: shimmer 3s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% {
    opacity: 0.8;
    transform: translateX(-100%);
  }
  50% {
    opacity: 1;
    transform: translateX(100%);
  }
}

.header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  border-radius: 3px;
  animation: expandWidth 0.8s ease-out 0.3s both;
}

@keyframes expandWidth {
  from {
    width: 0;
    opacity: 0;
  }
  to {
    width: 80px;
    opacity: 1;
  }
}

.logo {
  height: 2.2em;
  margin-right: 10px;
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.15));
  animation: logoFloat 3s ease-in-out infinite;
  transition: var(--transition);
}

.logo:hover {
  transform: scale(1.1) rotate(5deg);
  filter: drop-shadow(0 4px 8px rgba(26, 115, 232, 0.3));
}

@keyframes logoFloat {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  25% {
    transform: translateY(-2px) rotate(1deg);
  }
  50% {
    transform: translateY(0px) rotate(0deg);
  }
  75% {
    transform: translateY(-1px) rotate(-1deg);
  }
}

.header h1 {
  margin: 0;
  font-size: 1.6rem;
  color: var(--primary-color);
  font-weight: 700;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  position: relative;
  animation: titleSlide 0.6s ease-out 0.1s both;
}

@keyframes titleSlide {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.header h1::before {
  content: '';
  position: absolute;
  top: 50%;
  left: -15px;
  width: 8px;
  height: 8px;
  background: var(--accent-color);
  border-radius: 50%;
  transform: translateY(-50%);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: translateY(-50%) scale(1);
    opacity: 0.7;
  }
  50% {
    transform: translateY(-50%) scale(1.2);
    opacity: 1;
  }
}

/* 添加内容区域的样式 */
.app-container > :not(.header) {
  padding: 0 20px 20px 20px;
  animation: contentFadeIn 0.8s ease-out 0.4s both;
}

@keyframes contentFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式调整 */
@media (max-width: 450px) {
  .app-container {
    width: 380px;
    min-height: 480px;
  }
  
  .header {
    padding: 16px 16px 12px 16px;
  }
  
  .header h1 {
    font-size: 1.4rem;
  }
  
  .logo {
    height: 2em;
    margin-right: 8px;
  }
  
  .app-container > :not(.header) {
    padding: 0 16px 16px 16px;
  }
}

@media (max-width: 400px) {
  .app-container {
    width: 350px;
    min-height: 450px;
  }
  
  .header {
    padding: 14px 14px 10px 14px;
  }
  
  .header h1 {
    font-size: 1.3rem;
  }
  
  .logo {
    height: 1.8em;
  }
  
  .app-container > :not(.header) {
    padding: 0 14px 14px 14px;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .header {
    border-bottom: 2px solid var(--text-primary);
  }
  
  .header h1 {
    text-shadow: none;
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .logo,
  .header h1,
  .header::before,
  .header::after,
  .app-container > :not(.header) {
    animation: none;
  }
  
  .logo:hover {
    transform: none;
  }
}
</style>

<script lang="ts" setup>
import { inject, ref } from 'vue';
import DraggableButton from '@/components/DraggableButton.vue';

// 注入翻译激活函数
const activateTranslation = inject('activateTranslation') as () => void;
const isTranslating = ref(false);

// 处理翻译按钮点击事件
const handleTranslate = () => {
  console.log('ContentApp: 收到翻译事件');
  isTranslating.value = !isTranslating.value;
  
  if (isTranslating.value) {
    console.log('开始翻译页面');
    if (activateTranslation) {
      activateTranslation();
    }
  } else {
    console.log('停止翻译页面');
    // 这里可以添加停止翻译的逻辑，如果需要的话
  }
};
</script>

<template>
  <DraggableButton @translate="handleTranslate" />
</template>

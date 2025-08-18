<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';

// 定义事件
const emit = defineEmits(['translate']);

// 点击状态
const isClicked = ref(false);

// 按钮位置状态
const top = ref('400px');
const right = ref('0px');
let lastDragTime = 0;

// 拖动状态
let isDragging = false;
let startY = 0;
let startX = 0;
let startTop = 0;
let startRight = 0;

// 按钮引用
const btnRef = ref<HTMLImageElement | null>(null);

// 点击事件处理
function handleClick() {

  
  // 防止拖动时触发点击
  // if (isDragging || (Date.now() - lastDragTime) < 300) return;
  if (isDragging) return;
  
  console.log('按钮被点击，触发翻译事件');
  
  // 触发点击动画
  isClicked.value = true;
  
  // 发送翻译事件到父组件
  emit('translate');
  
  // 动画结束后重置状态
  setTimeout(() => {
    isClicked.value = false;
  }, 300);
}

// 鼠标按下事件处理
function handleMouseDown(e: MouseEvent) {
  if (!btnRef.value) return;
  
  isDragging = true;
  startY = e.clientY;
  startX = e.clientX;
  startTop = parseInt(top.value);
  startRight = parseInt(right.value);
  document.body.style.userSelect = 'none';
  
  // 阻止默认行为，防止拖动图片
  e.preventDefault();
}

// 鼠标松开事件处理
function handleMouseUp() {
  console.log("鼠标松开了");
  
  if (isDragging) {
    isDragging = false;
    document.body.style.userSelect = '';
  
    // 记录拖动结束的时间
    lastDragTime = Date.now();
    
    // 确保按钮只在左右两边
    snapToEdge();
    
    // 保存位置
    savePosition();
  }
}

// 鼠标离开事件处理
function handleMouseLeave() {
  // 鼠标离开按钮区域时不停止拖动，允许继续拖动
}

// 鼠标移动事件处理
function handleMouseMove(e: MouseEvent) {
  if (!isDragging || !btnRef.value) return;
  
  const dy = e.clientY - startY;
  const dx = startX - e.clientX; // 右边定位，向左为正
  let newTop = startTop + dy;
  let newRight = startRight + dx;
  
  // 限制在窗口范围内
  newTop = Math.max(0, Math.min(window.innerHeight - 40, newTop));
  
  // 限制右侧位置不超出窗口
  newRight = Math.max(0, Math.min(window.innerWidth - 40, newRight));
  
  // 在拖动过程中，按钮跟随鼠标移动，不强制吸附到边缘
  top.value = newTop + 'px';
  right.value = newRight + 'px';
}

// 文档鼠标松开事件处理
function handleDocumentMouseUp() {
  if (isDragging) {
    isDragging = false;
    document.body.style.userSelect = '';

    // 记录拖动结束的时间
    lastDragTime = Date.now();
    console.log("文档鼠标松开 记录",lastDragTime);
    
    // 确保按钮只在左右两边
    snapToEdge();
    
    // 保存位置
    savePosition();
  }
}

// 辅助函数：吸附到边缘
function snapToEdge() {
  if (!btnRef.value) return;
  
  const rightValue = parseInt(right.value);
  const btnWidth = 40; // 按钮宽度为40px
  
  // 如果按钮在窗口左半边，则吸附到左边
  if (window.innerWidth - rightValue - btnWidth/2 < window.innerWidth / 2) {
    right.value = (window.innerWidth - btnWidth) + 'px'; // 放在左边
  } else {
    right.value = '0px'; // 放在右边
  }
}

// 辅助函数：保存位置
async function savePosition() {
  try {
    await browser.storage.local.set({
      'draggable-btn-pos': {
        top: top.value,
        right: right.value,
      }
    });
  } catch (error) {
    console.error('保存按钮位置失败:', error);
  }
}

// 加载按钮位置
async function loadPosition() {
  try {
    const result = await browser.storage.local.get(['draggable-btn-pos']);
    const savedPos = result['draggable-btn-pos'];
    
    if (savedPos) {
      const { top: savedTop, right: savedRight } = savedPos;
      top.value = savedTop;
      
      // 确保按钮只在左右两边
      const rightValue = parseInt(savedRight);
      const btnWidth = 40; // 按钮宽度为40px
      
      if (rightValue > 0 && rightValue < window.innerWidth - btnWidth) {
        // 如果不在边缘，则根据位置决定放在哪一边
        if (rightValue < window.innerWidth / 2) {
          right.value = '0px'; // 放在右边
        } else {
          right.value = (window.innerWidth - btnWidth) + 'px'; // 放在左边
        }
      } else {
        right.value = savedRight;
      }
    }
  } catch (error) {
    console.error('加载按钮位置失败:', error);
  }
}

// 初始化按钮位置
onMounted(async () => {
  if (!btnRef.value) return;
  
  const btn = btnRef.value;
  
  // 加载保存的位置
  await loadPosition();
  
  // 设置事件监听器
  btn.addEventListener('click', handleClick);
  btn.addEventListener('mousedown', handleMouseDown);
  btn.addEventListener('mouseup', handleMouseUp);
  btn.addEventListener('mouseleave', handleMouseLeave);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleDocumentMouseUp);
  
  console.log('DraggableButton 组件已挂载');
});

// 清理事件监听器
onUnmounted(() => {
  if (!btnRef.value) return;
  
  const btn = btnRef.value;
  btn.removeEventListener('click', handleClick);
  btn.removeEventListener('mousedown', handleMouseDown);
  btn.removeEventListener('mouseup', handleMouseUp);
  btn.removeEventListener('mouseleave', handleMouseLeave);
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleDocumentMouseUp);
});


</script>

<template>
  <div>
    <img 
      ref="btnRef"
      :src="browser.runtime.getURL('/icon/translate.svg')"
      alt="翻译按钮"
      :style="{
        position: 'fixed',
        top: top,
        right: right,
        zIndex: 9999,
        width: '60px',
        height: '60px',
        cursor: isDragging ? 'move' : 'pointer',
        border: 'none',
        padding: '8px',
        userSelect: 'none',
        transform: isClicked ? 'scale(0.85)' : 'scale(1)',
        transition: 'transform 0.15s ease-in-out, box-shadow 0.2s ease',
        filter: 'brightness(1) drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
      }"
    />
  </div>
</template>

<style scoped>
/* 按钮动画效果 */
@keyframes pulse {
  0% {
    transform: scale(1);
    filter: brightness(1);
  }
  50% {
    transform: scale(1.05);
    filter: brightness(1.1);
  }
  100% {
    transform: scale(1);
    filter: brightness(1);
  }
}

.button-active {
  animation: pulse 0.3s ease-in-out;
}
</style>
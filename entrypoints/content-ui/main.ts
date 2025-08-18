import { createApp } from 'vue';
import ContentApp from './ContentApp.vue';

// 创建一个容器元素
const container = document.createElement('div');
container.id = 'translator-extension-container';
document.body.appendChild(container);

// 创建Vue应用并挂载到容器元素
const app = createApp(ContentApp);
app.mount('#translator-extension-container');
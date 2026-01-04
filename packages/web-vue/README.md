
---

# Yc Design Vue

`Yc Design Vue` 是一个基于 Vue 3 和 TypeScript 构建的现代化企业级 UI 组件库。它旨在提供一套开箱即用、功能丰富且高度可定制的界面解决方案，帮助开发者快速构建高质量、一致性强的 Web 应用。

## ✨ 特性

*   **组件丰富**：提供覆盖各类常见业务场景的高质量组件。
*   **基于 Vue 3**：充分利用 Vue 3 的新特性，如 Composition API，性能更优。
*   **TypeScript 支持**：提供完整的类型定义，带来更好的开发体验和代码健壮性。
*   **开箱即用**：引入方式简单，学习成本低，可以快速上手。
*   **主题定制**：支持灵活的样式覆盖和主题定制，轻松匹配您的品牌视觉。

## 💡 说明
`Yc Design Vue` 的是对 [Arco Design Vue](https://arco.design/vue/docs/start) 的升级，组件api可以参考 [Arco Design Vue](https://arco.design/vue/docs/start) 的文档。

## 📦 安装

推荐使用 `npm` 或 `yarn` 进行安装。

```bash
# 使用 npm
npm install yc-design-vue --save

# 使用 yarn
yarn add yc-design-vue
```

## 🚀 快速上手

我们推荐使用全局引入的方式，这可以让您在项目中的任何地方直接使用 `yc-design-vue` 的所有组件。

### 全局完整引入

在您的项目入口文件（通常是 `main.js` 或 `main.ts`）中，引入组件库和其配套的样式文件，并通过 `app.use()` 来注册。

```javascript
// main.js 或 main.ts

import { createApp } from 'vue'
import App from './App.vue'

// 1. 完整引入 yc-design-vue 组件库
import YcUi from 'yc-design-vue'

// 2. 引入组件库的全局样式
import 'yc-design-vue/es/style.css'

const app = createApp(App)

// 3. 注册组件库插件
app.use(YcUi)

app.mount('#app')
```

完成以上配置后，您就可以在项目中的任意 `.vue` 文件里直接使用 `yc-design-vue` 的组件了。

**示例：**
在您的 Vue 组件中使用 `yc-button` 和 `yc-input`。

```html
<template>
  <div>
    <yc-button type="primary">主要按钮</yc-button>
    <yc-button>默认按钮</yc-button>
  </div>
  <div style="margin-top: 20px;">
    <yc-input v-model="text" placeholder="请输入内容..."></yc-input>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const text = ref('')
</script>
```

## 🤝 贡献

欢迎任何形式的贡献！如果您在使用过程中发现任何问题，或者有功能建议，欢迎在项目的代码仓库中提交 Issue 或 Pull Request。

## 📄 许可证

本项目基于 [MIT](https://opensource.org/licenses/MIT) 许可证。
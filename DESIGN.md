# Cocos Inspector 技术设计文档

本项目旨在为 Cocos Creator 开发者提供一个功能丰富、性能高效且体验一致的 Chrome 开发者工具扩展。

## 1. 核心架构

本项目采用 **Chrome DevTools Extension** 架构，主要分为以下几个部分：

### 1.1 Bridge 脚本 (`src/bridge/cocos.js`)
这是核心的数据访问层，负责直接在被检查页面的 JS 上下文中运行。
- **作用**: 访问引擎全局对象 `cc` 或 `window.internal.cc`。
- **序列化**: 负责将 Cocos 私有的节点树 (`cc.Node`)、组件 (`cc.Component`) 和属性转换为简单的 JSON 对象，以便通过 `eval` 传回面板表面。
- **组件检测**: 使用 `getComponent` 及构造函数名称识别节点类型（Sprite, Label, Button 等）。
- **属性更新**: 处理嵌套路径属性（如 `position.x`）的同步更新，支持 2.x 和 3.x 版本的属性映射。

### 1.2 Panel 逻辑 (`panel/panel.js`)
这是 UI 的核心控制器。
- **状态管理**: 维护当前节点树、选中的 UUID、展开的 UUID 集合等状态。
- **轮询同步**: 每秒自动从 Bridge 获取最新状态，保持实时性。
- **渲染引擎**: 
  - **Node Tree**: 基于 `Fragment` 的异步渲染，包含类型图标和状态标识（眼睛图标）。
  - **Property Panel**: 模仿原生 Cocos Creator Inspector，按组件分组，根据属性类型（Vec2, Vec3, Color, Node Ref）自动匹配 UI 控件。

### 1.3 通信机制
使用 `chrome.devtools.inspectedWindow.eval` 进行双向通信。
- **拉取**: 面板定期 eval `window.__COCOS_INSPECTOR__.getNodeTree()`。
- **推送**: 用户修改属性时，执行 `updateComponentProperty` 指令。

## 2. 设计规范

### 2.1 视觉风格
- **配色方案**: 统一采用 Cocos 原生深色主题（如背景 `#232323`, 选中色 `#fd942b`）。
- **图标系统**: 使用内联轻量化 SVG，确保加载速度和在高分屏下的清晰度。
- **排版**: 紧凑的属性行和清晰的组件标题背景块，确保在有限的 DevTools 面板空间内容纳更多信息。

### 2.2 性能优化
- **局部刷新**: 在重新渲染属性面板时，尽可能通过 `diff` 逻辑及焦点状态保存，防止用户输入时因刷新而丢失焦点。
- **状态过滤**: 序列化时过滤掉 `_` 或 `$` 开头的内部私有变量，减少传输数据量。

## 3. 关键功能实现细节

### 3.1 节点类型识别
通过 `node.getComponent` 优先匹配常用功能性组件，将节点分类为：
- `Canvas`, `Camera`, `Sprite`, `Label`, `Button`, `RichText`, `Particle`, `EditBox`, `ProgressBar`, `ScrollView`, `Toggle`, `Widget`, `Layout` 等。

### 3.2 属性编辑器适配
对于复杂数值类型，面板会将其拆解为多个子输入框，并支持实时步进：
- **Vec2 / Vec3 / Size**: 拆解为 x, y, z 或 w, h 标签形式。
- **Color**: 集成原生 `<input type="color">`。
- **Node Ref**: 将节点 UUID 映射为可读名称，并添加标识图标。

## 4. 未来扩展
- **多选支持**: 同时修改多个节点的相同属性。
- **资源预览**: 直接在面板中预览 SpriteFrame 等资源。
- **性能监控**: 集成 DrawCall 和内存占用等实时曲线图。

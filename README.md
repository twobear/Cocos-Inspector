# Cocos Creator DevTools Inspector

A modern, high-performance Chrome DevTools extension for inspecting and debugging Cocos Creator game nodes and components.

![Cocos Inspector](icons/icon128.png)

## 🚀 Features

- **Improved Node Tree**:
  - **Type-specific Icons**: Automatically identifies `Sprite`, `Label`, `Button`, `Camera`, `Canvas`, etc., and displays matching icons.
  - **Visibility Toggle**: An "Eye" icon in the tree allows for quick `active` property toggling.
  - **State Preservation**: Remembers expanded/selected nodes during real-time updates.
  - **Search**: Fast, real-time node filtering by name.

- **Advanced Property Panel**:
  - **Grouped by Component**: Mimics the Cocos Creator inspector, showing properties grouped by `cc.Node` and attached components.
  - **Custom Scripts**: Supports inspecting and editing properties of user-defined scripts.
  - **Complex Types**: In-place editing for `Vec2`, `Vec3`, `Size`, `Color`, and `Node` references.
  - **Smart Mapping**: Automatically handles engine-specific property name differences (e.g., `scaleX` vs `scale.x`).

- **Developer Productivity**:
  - **Context Menu**: Right-click nodes to copy names, paths, or log to the console (`$node`).
  - **Real-time Sync**: Bi-directional updates between the game engine and the inspector UI.
  - **Log-on-Demand**: One-click logging of node details to the Chrome Console.

- **Aesthetics**:
  - **Modern Dark Theme**: Professional dark-mode UI with high-contrast property labels and interactive hover states.
  - **Glassmorphism**: Sleek header and panel designs for a premium experience.

## 📦 Installation

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top right corner.
4. Click **Load unpacked** and select the project root directory.

## 🛠 Usage

1. Open any Cocos Creator H5 game or editor preview.
2. Press `F12` to open DevTools.
3. Select the **Cocos** panel.
4. If the game is detected, the node tree will automatically populate.

## 🔧 Technical Overview

- **Architecture**: Chrome Extension with a bridge script injected into the webpage's JavaScript context.
- **Bridge Script**: Directly accesses the `cc` (or `window.internal.cc`) global to interact with the engine's internal state.
- **Efficient Communication**: Uses `chrome.devtools.inspectedWindow.eval` for fast, asynchronous data polling and property updates.
- **UI Stack**: Pure Vanilla JS & CSS for maximum performance and zero external dependencies.

## 📄 License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

---
Built with ❤️ for Cocos Creator developers.

# Desktop Pet 桌面宠物

一个基于 Electron Forge + React/Vite + TypeScript 的桌面宠物小程序基础工程。

## 环境要求

- Node.js 20 或更高版本
- npm 10 或更高版本

## 安装依赖

```bash
npm install
```

## 开发启动

```bash
npm run dev
```

开发模式会启动 Vite dev server，并打开 Electron 桌面窗口。

当前 renderer 开发地址固定为：

```text
http://127.0.0.1:3099/
```

这个地址只用于开发期预览 React 页面。真正的桌面宠物运行在 Electron 窗口里。

## 关闭开发应用

在运行 `npm run dev` 的终端里按：

```bash
Ctrl + C
```

当前窗口是无边框透明桌宠窗口，还没有实现托盘菜单、右键菜单或关闭按钮。后续可以补充“右键退出”“托盘显示/隐藏/退出”等能力。

## 打包

生成当前平台的可运行应用目录：

```bash
npm run package
```

生成当前平台的分发制品：

```bash
npm run make
```

macOS 上当前会生成 zip 制品，例如：

```text
out/make/zip/darwin/arm64/Desktop Pet-darwin-arm64-0.1.0.zip
```

运行类型检查并打包：

```bash
npm run build
```

仅运行类型检查：

```bash
npm run typecheck
```

## Windows 说明

开发模式下，Windows 也会使用类似 `http://127.0.0.1:3099/` 的本地 Vite dev server 给 Electron 窗口加载页面。

打包后的 Windows 应用不会依赖这个地址，也不会要求用户启动本地服务器。生产包会加载构建后的本地页面文件。

Windows 安装包建议在 Windows 机器或 CI 环境中执行：

```bash
npm run make
```

项目已配置 Electron Forge 的 `maker-squirrel`，用于生成 Windows 分发制品。

## 常用命令

```bash
npm run dev        # 开发启动
npm run start      # 同 dev
npm run package    # 打包成本机应用目录
npm run make       # 生成分发制品
npm run build      # typecheck + package
npm run typecheck  # 仅类型检查
```

## 项目目录

```text
src/
  main/       Electron 主进程，负责窗口和应用生命周期
  preload/    Electron preload，负责安全暴露 IPC 能力
  renderer/   React/Vite 渲染层，负责桌宠 UI
```

## 关键配置

```text
forge.config.js           Electron Forge 配置
vite.main.config.ts       主进程 Vite 配置
vite.preload.config.ts    preload Vite 配置
vite.renderer.config.ts   renderer Vite 配置
```

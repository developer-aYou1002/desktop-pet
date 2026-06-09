import { join } from "node:path";
import {
  BrowserWindow,
  Menu,
  Tray,
  app,
  ipcMain,
  nativeImage,
  screen,
} from "electron";

const DEFAULT_WINDOW_WIDTH = 320;
const DEFAULT_WINDOW_HEIGHT = 360;
const TRAY_TITLE = "宠";
const TRAY_ICON_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAUUlEQVR4nGNgoBAwUqifYdQABob/JwYGBgYGJgYGRkYGRiZGhgYGJkYGEwMDAwMjEwODw3+oGgMDAwOjgYEhA6l6YwQDA8OAAaQ7GJwAAK6KEUf6Ao2VAAAAAElFTkSuQmCC";

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

type WindowDragPoint = {
  screenX: number;
  screenY: number;
};

type WindowDragState = {
  startPointer: WindowDragPoint;
  startWindowPosition: [number, number];
};

const windowDragStates = new Map<number, WindowDragState>();
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

const isWindowDragPoint = (value: unknown): value is WindowDragPoint => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const point = value as WindowDragPoint;

  return Number.isFinite(point.screenX) && Number.isFinite(point.screenY);
};

const showMainWindow = () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    mainWindow = createMainWindow();
    updateTrayMenu();
    return;
  }

  mainWindow.show();
  mainWindow.focus();
  updateTrayMenu();
};

const hideMainWindow = () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  mainWindow.hide();
  updateTrayMenu();
};

const quitApp = () => {
  app.quit();
};

const buildPetMenu = () => {
  const isWindowVisible =
    Boolean(mainWindow) && !mainWindow?.isDestroyed() && mainWindow.isVisible();

  return Menu.buildFromTemplate([
    {
      label: "显示",
      enabled: !isWindowVisible,
      click: showMainWindow,
    },
    {
      label: "隐藏",
      enabled: isWindowVisible,
      click: hideMainWindow,
    },
    {
      type: "separator",
    },
    {
      label: "退出",
      click: quitApp,
    },
  ]);
};

const showPetContextMenu = (sourceWindow?: BrowserWindow | null) => {
  buildPetMenu().popup({
    window: sourceWindow ?? undefined,
  });
};

const updateTrayMenu = () => {
  tray?.setContextMenu(buildPetMenu());
};

const createTray = () => {
  if (tray) {
    return;
  }

  const trayIcon = nativeImage.createFromDataURL(TRAY_ICON_DATA_URL);

  trayIcon.setTemplateImage(true);
  tray = new Tray(trayIcon);
  tray.setContextMenu(buildPetMenu());
  tray.setToolTip("Desktop Pet");

  // macOS 菜单栏小图标容易被忽略，标题能给隐藏后的恢复入口一个明确锚点。
  if (process.platform === "darwin") {
    tray.setTitle(TRAY_TITLE);
  }

  // 托盘菜单复用窗口右键菜单，避免隐藏窗口后没有入口可以重新显示。
  tray.on("click", showMainWindow);
  tray.on("right-click", () => {
    tray?.popUpContextMenu(buildPetMenu());
  });
};

const createMainWindow = () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const createdWindow = new BrowserWindow({
    width: DEFAULT_WINDOW_WIDTH,
    height: DEFAULT_WINDOW_HEIGHT,
    x: width - DEFAULT_WINDOW_WIDTH - 32,
    y: height - DEFAULT_WINDOW_HEIGHT - 32,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  createdWindow.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true,
  });
  createdWindow.setAlwaysOnTop(true, "screen-saver");

  // 无边框透明窗口没有系统标题栏，右键菜单提供基础窗口控制入口。
  createdWindow.webContents.on("context-menu", () => {
    showPetContextMenu(createdWindow);
  });

  createdWindow.on("closed", () => {
    if (mainWindow === createdWindow) {
      mainWindow = null;
    }
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    createdWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    createdWindow.loadFile(
      join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  if (!app.isPackaged) {
    createdWindow.webContents.openDevTools({ mode: "detach" });
  }

  return createdWindow;
};

app.whenReady().then(() => {
  app.setAppUserModelId("dev.xiejinjian.desktop-pet");
  app.dock?.show();

  ipcMain.handle("pet:get-app-version", () => {
    return app.getVersion();
  });

  ipcMain.on("pet:window-drag-start", (event, point: unknown) => {
    if (!isWindowDragPoint(point)) {
      return;
    }

    const sourceWindow = BrowserWindow.fromWebContents(event.sender);

    if (!sourceWindow) {
      return;
    }

    windowDragStates.set(event.sender.id, {
      startPointer: point,
      startWindowPosition: sourceWindow.getPosition(),
    });
  });

  ipcMain.on("pet:window-drag-move", (event, point: unknown) => {
    if (!isWindowDragPoint(point)) {
      return;
    }

    const dragState = windowDragStates.get(event.sender.id);
    const sourceWindow = BrowserWindow.fromWebContents(event.sender);

    if (!dragState || !sourceWindow) {
      return;
    }

    const deltaX = point.screenX - dragState.startPointer.screenX;
    const deltaY = point.screenY - dragState.startPointer.screenY;
    const [startWindowX, startWindowY] = dragState.startWindowPosition;

    sourceWindow.setPosition(
      Math.round(startWindowX + deltaX),
      Math.round(startWindowY + deltaY),
    );
  });

  ipcMain.on("pet:window-drag-end", (event) => {
    windowDragStates.delete(event.sender.id);
  });

  mainWindow = createMainWindow();
  createTray();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
      return;
    }

    showMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

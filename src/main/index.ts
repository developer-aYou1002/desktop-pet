import { join } from "node:path";
import { BrowserWindow, app, ipcMain, screen } from "electron";

const DEFAULT_WINDOW_WIDTH = 320;
const DEFAULT_WINDOW_HEIGHT = 360;

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

const isWindowDragPoint = (value: unknown): value is WindowDragPoint => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const point = value as WindowDragPoint;

  return Number.isFinite(point.screenX) && Number.isFinite(point.screenY);
};

const createMainWindow = () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const mainWindow = new BrowserWindow({
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

  mainWindow.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true,
  });
  mainWindow.setAlwaysOnTop(true, "screen-saver");

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  return mainWindow;
};

app.whenReady().then(() => {
  app.setAppUserModelId("dev.xiejinjian.desktop-pet");

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

  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

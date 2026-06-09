import { contextBridge, ipcRenderer } from 'electron';

type WindowDragPoint = {
  screenX: number;
  screenY: number;
};

const desktopPetApi = {
  getAppVersion: () => ipcRenderer.invoke('pet:get-app-version') as Promise<string>,
  startWindowDrag: (point: WindowDragPoint) => {
    ipcRenderer.send('pet:window-drag-start', point);
  },
  moveWindowDrag: (point: WindowDragPoint) => {
    ipcRenderer.send('pet:window-drag-move', point);
  },
  endWindowDrag: () => {
    ipcRenderer.send('pet:window-drag-end');
  }
};

contextBridge.exposeInMainWorld('desktopPet', desktopPetApi);

export type DesktopPetApi = typeof desktopPetApi;

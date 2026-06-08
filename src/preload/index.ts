import { contextBridge, ipcRenderer } from 'electron';

const desktopPetApi = {
  getAppVersion: () => ipcRenderer.invoke('pet:get-app-version') as Promise<string>
};

contextBridge.exposeInMainWorld('desktopPet', desktopPetApi);

export type DesktopPetApi = typeof desktopPetApi;

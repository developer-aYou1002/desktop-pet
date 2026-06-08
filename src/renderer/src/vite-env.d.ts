/// <reference types="vite/client" />

import type { DesktopPetApi } from '../../preload';

declare global {
  interface Window {
    desktopPet: DesktopPetApi;
  }
}

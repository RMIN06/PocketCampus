import { registerPlugin } from "@capacitor/core";

export interface AppUpdaterPlugin {
  checkLatest(): Promise<{ tag: string; downloadUrl: string; updateAvailable: boolean }>;
  downloadLatest(options: { downloadUrl: string }): Promise<{ started: boolean }>;
}

export const AppUpdater = registerPlugin<AppUpdaterPlugin>("AppUpdater");

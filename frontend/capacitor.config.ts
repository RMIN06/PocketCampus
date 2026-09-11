import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.pocketcampus.app",
  appName: "PocketCampus",
  webDir: "out",
  server: {
    androidScheme: "https",
    // Keep the native WebView origin aligned with the production Google OAuth origin.
    hostname: "pocket-campus-bice.vercel.app",
  },
  ios: {
    contentInset: "automatic",
  },
};

export default config;

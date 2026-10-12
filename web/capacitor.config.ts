import type { CapacitorConfig } from '@capacitor/cli';

// Server-driven build: the native shell loads the live EduFarm site
// (same architecture as the Android TWA). No static export needed —
// dynamic routes and API calls run on the server as usual.
const config: CapacitorConfig = {
  appId: 'com.edufarm.app',
  appName: 'EduFarm',
  webDir: 'public',
  server: {
    url: 'https://edufarm-app.netlify.app',
    cleartext: false,
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: '#0B4D2E',
      showSpinner: false,
    },
  },
};

export default config;

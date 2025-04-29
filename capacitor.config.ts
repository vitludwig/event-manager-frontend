import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cz.rzbit.eventApp',
  appName: 'event-program',
  webDir: 'dist/event-program',
  android: {
    adjustMarginsForEdgeToEdge: 'force',
    allowMixedContent: true,
  },
  server: {
    // **Use with extreme caution - less secure**
    allowNavigation: ['http://34.107.114.8'] // Might not be enough for cert errors
    // Consider Android-specific config below instead
  },
};

export default config;

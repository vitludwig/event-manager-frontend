import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cz.rzbit.eventApp',
  appName: 'event-program',
  webDir: 'dist/event-program',
  android: {
    adjustMarginsForEdgeToEdge: 'force',
    allowMixedContent: true,
  },
  ios: {
    handleApplicationNotifications: false,
  },
  server: {
    // **Use with extreme caution - less secure**
    allowNavigation: ['http://34.107.114.8'] // Might not be enough for cert errors
    // Consider Android-specific config below instead
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
    },
  },
};

export default config;

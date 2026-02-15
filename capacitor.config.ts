import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cz.rzbit.eventApp',
  appName: 'RZB Festival',
  webDir: 'dist/event-program/browser',
  android: {
    adjustMarginsForEdgeToEdge: 'force',
    allowMixedContent: false,
  },
  ios: {
    handleApplicationNotifications: false,
  },
  server: {
    hostname: 'localhost',
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#fecc00",
    },
  }
};

export default config;

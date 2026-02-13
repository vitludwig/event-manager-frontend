import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cz.rzbit.eventApp',
  appName: 'RZB Festival App',
  webDir: 'dist/event-program/browser',
  android: {
    adjustMarginsForEdgeToEdge: 'force',
    allowMixedContent: true,
  },
  ios: {
    handleApplicationNotifications: false,
  },
  server: {
    // **Use with extreme caution - less secure**
    androidScheme: 'http', // nebo 'http' -> musí odpovídat povolenému Originu v .NET
    hostname: 'localhost',
    allowNavigation: ['http://34.107.114.8'] // Might not be enough for cert errors
    // Consider Android-specific config below instead
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
    },
  }
};

export default config;

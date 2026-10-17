import type { CapacitorConfig } from "@capacitor/cli";

// Мобильные приложения открывают веб-версию с сервера: обновления без выпуска новой версии в сторах.
// Адрес сервера задаётся при сборке: LOGOAPP_URL=https://app.example.ru npx cap sync
const config: CapacitorConfig = {
  appId: "ru.logoapp.app",
  appName: "LogoApp",
  webDir: "mobile/www",
  server: {
    url: process.env.LOGOAPP_URL ?? "http://localhost:3000",
    cleartext: !process.env.LOGOAPP_URL,
  },
  ios: { contentInset: "always" },
};

export default config;

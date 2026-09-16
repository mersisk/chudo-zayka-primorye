// Здесь только публичные настройки. Никогда не вставляй Supabase secret key, legacy service_role, API secret или пароль.
window.AIRC_RUNTIME = {
  // Для отдельного хоста можно указать публичный origin, например http://135.106.210.15.
  // Это не секрет и не влияет на режим хранения данных.
  siteUrl: "",
  dataMode: "local", // "local" или "supabase"
  workspaceId: "airc-demo",
  supabase: {
    url: "",
    publishableKey: "",
  },
};

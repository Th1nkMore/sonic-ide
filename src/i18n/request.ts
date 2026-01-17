import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (!(locale && routing.locales.includes(locale as any))) {
    locale = routing.defaultLocale;
  }

  // Use explicit imports for each locale to avoid dynamic import issues
  let messages;
  switch (locale) {
    case "zh":
      messages = (await import("../messages/zh.json")).default;
      break;
    case "ja":
      messages = (await import("../messages/ja.json")).default;
      break;
    case "de":
      messages = (await import("../messages/de.json")).default;
      break;
    case "en":
    default:
      messages = (await import("../messages/en.json")).default;
      break;
  }

  return {
    locale,
    messages,
  };
});

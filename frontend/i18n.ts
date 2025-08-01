import {getRequestConfig} from 'next-intl/server';
import {routing} from './i18n/routing';

export default getRequestConfig(async ({requestLocale}) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  if (locale?.startsWith('zh')) {
    locale = 'zh';
  } else if (locale?.startsWith('ja')) {
    locale = 'ja';
  } else {
    locale = 'en';
  }

  // Ensure that a valid locale is used
  if (!locale || !routing.locales.includes(locale as any)) {
    return {
      locale: routing.defaultLocale,
      messages: (await import(`./i18n/messages/${routing.defaultLocale}.json`)).default
    };
  }

  return {
    locale,
    messages: (await import(`./i18n/messages/${locale}.json`)).default
  };
});
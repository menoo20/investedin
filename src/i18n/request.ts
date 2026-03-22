import {getRequestConfig} from 'next-intl/server';
import {locales} from '../i18n.config';

export default getRequestConfig(async ({locale}) => {
  const finalLocale = locale || 'en';
  return {
    locale: finalLocale,
    messages: (await import(`../../messages/${finalLocale}.json`)).default
  };
});

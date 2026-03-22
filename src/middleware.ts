import createMiddleware from 'next-intl/middleware';
import {locales, defaultLocale} from './i18n.config';

export default createMiddleware({
  // A list of all locales that are supported
  locales,
 
  // Used when no locale matches
  defaultLocale,
  
  // Always use a prefix
  localePrefix: 'always'
});
 
export const config = {
  // Match all pathnames except for
  // - … if they contain a dot, e.g. `favicon.ico`
  // - api routes
  // - _next (internal footprints)
  // - static files
  matcher: ['/((?!api|_next|.*\\..*).*)']
};

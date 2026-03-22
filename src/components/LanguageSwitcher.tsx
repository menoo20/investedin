'use client';

import {useLocale} from 'next-intl';
import {usePathname, useRouter} from '../navigation';
import {Languages} from 'lucide-react';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLocale = () => {
    const nextLocale = locale === 'en' ? 'ar' : 'en';
    router.replace(pathname, {locale: nextLocale});
  };

  return (
    <button
      onClick={toggleLocale}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-medium text-neutral-400 hover:text-white"
    >
      <Languages className="w-4 h-4" />
      <span>{locale === 'en' ? 'العربية' : 'English'}</span>
    </button>
  );
}

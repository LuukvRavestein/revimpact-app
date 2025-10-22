"use client"

import { useLanguage } from '@/contexts/LanguageContext'
import { Language } from '@/lib/translations'

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  const toggleLanguage = () => {
    setLanguage(language === 'nl' ? 'en' : 'nl')
  }

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
      title={`Switch to ${language === 'nl' ? 'English' : 'Nederlands'}`}
    >
      <span className="text-lg">
        {language === 'nl' ? '🇳🇱' : '🇬🇧'}
      </span>
      <span className="hidden sm:inline">
        {language === 'nl' ? 'NL' : 'EN'}
      </span>
    </button>
  )
}

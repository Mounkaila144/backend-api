'use client';

import React from 'react';

import { useLanguage } from '../lib/language-context';

/**
 * Language Switcher Component
 * Simple dropdown to change application language
 */
export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const languages = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value);

    // Note: No reload needed - translations update automatically via React Context
  };

  return (
    <div style={{
      padding: '12px 16px',
      borderTop: '1px solid rgba(226, 232, 240, 0.6)',
    }}>
      <select
        value={language}
        onChange={handleChange}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          backgroundColor: 'white',
          fontSize: '14px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          outline: 'none',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#667eea';
          e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'rgba(226, 232, 240, 0.8)';
          e.target.style.boxShadow = 'none';
        }}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
};

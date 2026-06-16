'use client';

import React, { useState } from 'react';

import { useLanguage } from '../lib/language-context';
import { useAuth } from '@/modules/UsersGuard';

/**
 * Navbar Component
 * Top navigation bar with user menu and language selector
 */
export const Navbar: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const languages = [
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  ];

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode);
    setShowLangMenu(false);

    // Reload to fetch menus with new language
    window.location.reload();
  };

  return (
    <nav
      style={{
        height: '64px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      }}
    >
      {/* Left side - Page title can be added here */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <h1 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#1e293b',
          margin: 0,
        }}>
          {/* Dynamic page title can go here */}
        </h1>
      </div>

      {/* Right side - Language selector and user menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Language Selector */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            onBlur={() => setTimeout(() => setShowLangMenu(false), 200)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: '10px',
              border: 'none',
              background: showLangMenu
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'rgba(102, 126, 234, 0.1)',
              color: showLangMenu ? '#ffffff' : '#667eea',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.3s ease',
              boxShadow: showLangMenu ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none',
            }}
          >
            <span style={{ fontSize: '20px' }}>{currentLang.flag}</span>
            <span>{currentLang.code.toUpperCase()}</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              style={{
                transition: 'transform 0.3s ease',
                transform: showLangMenu ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              <path
                d="M2 4L6 8L10 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Language Dropdown */}
          {showLangMenu && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                minWidth: '180px',
                overflow: 'hidden',
                animation: 'slideDown 0.3s ease',
              }}
            >
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    border: 'none',
                    background:
                      language === lang.code
                        ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                        : 'transparent',
                    color: language === lang.code ? '#667eea' : '#4a5568',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: language === lang.code ? '600' : '400',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (language !== lang.code) {
                      e.currentTarget.style.background = 'rgba(248, 250, 252, 1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (language !== lang.code) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <span style={{ fontSize: '24px' }}>{lang.flag}</span>
                  <span style={{ flex: 1 }}>{lang.label}</span>
                  {language === lang.code && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M13.3334 4L6.00002 11.3333L2.66669 8"
                        stroke="#667eea"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            onBlur={() => setTimeout(() => setShowUserMenu(false), 200)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 12px 6px 6px',
              borderRadius: '50px',
              border: 'none',
              background: showUserMenu ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              {user?.firstname?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                {user?.firstname && user?.lastname ? `${user.firstname} ${user.lastname}` : user?.username || 'User'}
              </span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                {user?.email || 'user@example.com'}
              </span>
            </div>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              style={{
                transition: 'transform 0.3s ease',
                transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              <path
                d="M2 4L6 8L10 4"
                stroke="#64748b"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* User Dropdown */}
          {showUserMenu && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                minWidth: '220px',
                overflow: 'hidden',
                animation: 'slideDown 0.3s ease',
              }}
            >
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(226, 232, 240, 0.6)' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                  {user?.firstname && user?.lastname ? `${user.firstname} ${user.lastname}` : user?.username}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  {user?.email}
                </div>
              </div>
              <button
                onClick={() => {
                  logout();
                  setShowUserMenu(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  border: 'none',
                  background: 'transparent',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path
                    d="M6.75 15.75H3.75C3.35218 15.75 2.97064 15.592 2.68934 15.3107C2.40804 15.0294 2.25 14.6478 2.25 14.25V3.75C2.25 3.35218 2.40804 2.97064 2.68934 2.68934C2.97064 2.40804 3.35218 2.25 3.75 2.25H6.75M12 12.75L15.75 9M15.75 9L12 5.25M15.75 9H6.75"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

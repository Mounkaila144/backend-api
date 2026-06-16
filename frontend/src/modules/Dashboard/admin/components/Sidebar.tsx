'use client';

import React, { useState } from 'react';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

import { useConfigMenus } from '@/shared/hooks/useConfigMenus';
import { useSidebar } from '@/shared/lib/sidebar-context';
import type { MenuConfig } from '@/shared/types/menu-config.types';

const FALLBACK_ICONS: React.ReactElement[] = [
  (
    <svg key="icon-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
      <path d="M4 19h16" />
      <path d="M5 15l4-4 3 3 5-5 2 2" />
    </svg>
  ),
  (
    <svg key="icon-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
      <path d="M7 13h4" />
    </svg>
  ),
  (
    <svg key="icon-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
      <path d="M4 12h16" />
      <path d="M12 4v16" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
  (
    <svg key="icon-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
      <path d="M12 2v4" />
      <path d="M12 18v4" />
      <path d="M4.93 4.93l2.83 2.83" />
      <path d="M16.24 16.24l2.83 2.83" />
      <path d="M2 12h4" />
      <path d="M18 12h4" />
      <path d="M4.93 19.07l2.83-2.83" />
      <path d="M16.24 7.76l2.83-2.83" />
    </svg>
  ),
  (
    <svg key="icon-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
      <path d="M4 4h6l2 3h8a2 2 0 0 1 2 2v6" />
      <path d="M3 13h2" />
      <path d="M12 22a5 5 0 0 0 5-5v-1H7v1a5 5 0 0 0 5 5z" />
    </svg>
  ),
  (
    <svg key="icon-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
      <circle cx="12" cy="12" r="8" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  (
    <svg key="icon-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
      <path d="M5 3v18" />
      <path d="M19 3v18" />
      <rect x="9" y="7" width="6" height="10" rx="1" />
    </svg>
  ),
  (
    <svg key="icon-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: '100%', height: '100%' }}>
      <path d="M12 6v6l4 2" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
];

/**
 * Sanitize SVG string to prevent XSS attacks.
 * Strips event handlers (onload, onclick, etc.), script tags, and javascript: URIs.
 */
const sanitizeSvg = (svg: string): string => {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\bon\w+\s*=\s*[^\s>]*/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/data\s*:\s*text\/html/gi, '')
};

const hashString = (value: string): number => {
  let hash = 0;

  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  
return Math.abs(hash);
};

/**
 * Sidebar Component
 * Elegant CRM navigation sidebar with polished styling
 */
export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { menus, isLoading } = useConfigMenus({ visibleOnly: true });
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);

  // Auto-expand the second menu by default when menus are loaded
  React.useEffect(() => {
    if (menus.length > 1 && menus[1].children && menus[1].children.length > 0 && expandedMenus.size === 0) {
      setExpandedMenus(new Set([menus[1].id]));
    }
  }, [menus.length]);

  const palette = React.useMemo(() => ({
    accentGradient: '#2563eb',
    accentHover: 'rgba(37, 99, 235, 0.08)',
    accentSoft: 'rgba(37, 99, 235, 0.06)',
    accentStrong: '#1e40af',
    neutralBorder: 'rgba(226, 232, 240, 0.8)',
    textPrimary: '#1e293b',
    textMuted: '#64748b',
    navBackground: '#ffffff',
    navShadow: '0 4px 20px rgba(0, 0, 0, 0.06), 0 0 1px rgba(0, 0, 0, 0.05)',
  }), []);

  const getFallbackIcon = React.useCallback((menu: MenuConfig): React.ReactElement => {
    const seed = `${menu.id}|${menu.route ?? ''}|${menu.label}|${menu.icon?.value ?? ''}`;
    const index = hashString(seed) % FALLBACK_ICONS.length;
    const template = FALLBACK_ICONS[index];

    
return React.cloneElement(template, { key: `${menu.id}-${index}` });
  }, []);

  const toggleExpand = React.useCallback((menuId: string) => {
    setExpandedMenus((prev) => {
      const next = new Set(prev);

      if (next.has(menuId)) {
        next.delete(menuId);
      } else {
        next.add(menuId);
      }

      
return next;
    });
  }, []);

  const isActive = (menu: MenuConfig): boolean => {
    if (menu.route === pathname) {
      return true;
    }

    if (menu.children) {
      return menu.children.some((child) => isActive(child));
    }

    
return false;
  };

  // Calculate menus to render - MUST be before early returns to maintain Hook order
  const menusToRender = React.useMemo(() => {
    if (menus.length === 0) return [];

    // Display all menus from configuration (already filtered by visibleOnly)
    return isCollapsed
      ? menus.flatMap((menu) => {
          if (menu.children && menu.children.length > 0) {
            return [menu, ...menu.children];
          }

          
return [menu];
        })
      : menus;
  }, [menus, isCollapsed]);

  const renderMenuItem = (menu: MenuConfig, level: number = 0): React.ReactNode => {
    // Menus are already filtered by visibleOnly in useConfigMenus
    if (menu.isVisible === false || menu.isActive === false) {
      return null;
    }

    // En mode réduit, ne pas afficher les sous-menus (level > 0)
    if (isCollapsed && level > 0) {
      return null;
    }

    const hasChildren = menu.children && menu.children.length > 0;
    const isExpanded = expandedMenus.has(menu.id);
    const active = isActive(menu);
    const isHovered = hoveredMenu === menu.id;

    const badgeVariant = menu.badge?.variant ?? 'primary';

    const badgeColors: Record<string, { background: string; color: string; border: string }> = {
      primary: {
        background: 'rgba(37, 99, 235, 0.18)',
        color: '#dbeafe',
        border: 'rgba(37, 99, 235, 0.35)',
      },
      success: {
        background: 'rgba(16, 185, 129, 0.16)',
        color: '#bbf7d0',
        border: 'rgba(16, 185, 129, 0.35)',
      },
      warning: {
        background: 'rgba(245, 158, 11, 0.16)',
        color: '#fde68a',
        border: 'rgba(245, 158, 11, 0.3)',
      },
      danger: {
        background: 'rgba(220, 38, 38, 0.18)',
        color: '#fecaca',
        border: 'rgba(220, 38, 38, 0.35)',
      },
    };

    const resolvedBadgeColors = badgeColors[badgeVariant] ?? badgeColors.primary;

    const styles = {
      item: {
        marginBottom: level === 0 ? '4px' : '2px',
        transition: 'transform 0.18s ease',
      },
      button: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
        padding: isCollapsed && level === 0 ? '6px' : level === 0 ? '8px 10px' : `${6 + level * 2}px 10px`,
        background: active
          ? palette.accentGradient
          : isHovered
          ? palette.accentHover
          : 'transparent',
        color: active ? '#ffffff' : palette.textPrimary,
        border: active ? '1px solid rgba(37, 99, 235, 0.3)' : `1px solid transparent`,
        borderRadius: level === 0 ? '8px' : '6px',
        cursor: hasChildren || menu.route ? 'pointer' : 'default',
        fontSize: level === 0 ? '13px' : '12px',
        fontWeight: active ? '600' : '500',
        textDecoration: 'none',
        transition: 'all 0.22s ease',
        position: 'relative' as const,
        overflow: 'hidden' as const,
        boxShadow: active
          ? '0 4px 8px rgba(37, 99, 235, 0.15)'
          : isHovered
          ? '0 2px 4px rgba(0, 0, 0, 0.04)'
          : 'none',
        transform: isHovered && !active ? 'translateX(2px)' : 'translateX(0)',
        justifyContent: isCollapsed && level === 0 ? 'center' : 'flex-start',
      },
      icon: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: level === 0 ? '28px' : '24px',
        height: level === 0 ? '28px' : '24px',
        borderRadius: '6px',
        backgroundColor: active ? 'rgba(255, 255, 255, 0.25)' : palette.accentSoft,
        color: active ? '#ffffff' : palette.accentStrong,
        fontSize: level === 0 ? '14px' : '13px',
        fontWeight: 600,
        flexShrink: 0 as const,
        transition: 'all 0.2s ease',
      },
      label: {
        flex: 1,
        textAlign: 'left' as const,
        letterSpacing: '0.01em',
        color: active ? '#ffffff' : palette.textPrimary,
      },
      meta: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginLeft: 'auto',
      },
      badgePill: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2px 6px',
        fontSize: '9px',
        fontWeight: 600,
        borderRadius: '999px',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        background: active ? 'rgba(255, 255, 255, 0.25)' : resolvedBadgeColors.background,
        border: active ? '1px solid rgba(255, 255, 255, 0.3)' : `1px solid ${resolvedBadgeColors.border}`,
        color: active ? '#ffffff' : resolvedBadgeColors.color,
      },
      arrow: {
        fontSize: '10px',
        color: active ? '#ffffff' : palette.textMuted,
        transition: 'transform 0.22s ease',
      },
      children: {
        marginTop: '4px',
        marginLeft: level === 0 ? '8px' : '4px',
        paddingLeft: '12px',
        borderLeft: `1px solid ${palette.neutralBorder}`,
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '2px',
        animation: 'slideDown 0.22s ease',
      },
    };

    const renderIconContent = (): React.ReactNode => {
      if (!menu.icon) {
        return getFallbackIcon(menu);
      }

      switch (menu.icon.type) {
        case 'emoji':
          return menu.icon.value;
        case 'icon-class':
          return <i className={menu.icon.value} aria-hidden />;
        case 'svg':
          return (
            <span
              aria-hidden
              style={{ display: 'inline-flex', width: '100%', height: '100%' }}
              dangerouslySetInnerHTML={{ __html: sanitizeSvg(menu.icon.value) }}
            />
          );
        case 'lucide':
        default:
          return getFallbackIcon(menu);
      }
    };

    const hasMeta = Boolean(menu.badge || hasChildren);

    const content = (
      <>
        <span style={styles.icon} aria-hidden>
          {renderIconContent()}
        </span>
        {(!isCollapsed || level > 0) && (
          <>
            <span style={styles.label}>{menu.label}</span>
            {hasMeta && (
              <span style={styles.meta}>
                {menu.badge && (
                  <span style={styles.badgePill}>{menu.badge.value}</span>
                )}
                {hasChildren && (
                  <span style={styles.arrow} aria-hidden>
                    {isExpanded ? 'v' : '>'}
                  </span>
                )}
              </span>
            )}
          </>
        )}
      </>
    );

    const wrapper = (node: React.ReactNode) => (
      <div
        key={menu.id}
        style={styles.item}
        onMouseEnter={() => setHoveredMenu(menu.id)}
        onMouseLeave={() => setHoveredMenu(null)}
      >
        {node}
        {hasChildren && isExpanded && !isCollapsed && (
          <div style={styles.children}>
            {menu.children!.map((child) => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );

    if (hasChildren) {
      return wrapper(
        <button
          type="button"
          aria-expanded={isExpanded}
          onClick={() => toggleExpand(menu.id)}
          style={styles.button}
        >
          {content}
        </button>,
      );
    }

    if (menu.route) {
      return wrapper(
        <Link href={menu.route} style={styles.button}>
          {content}
        </Link>,
      );
    }

    return wrapper(
      <div style={{ ...styles.button, cursor: 'default', opacity: 0.6 }}>
        {content}
      </div>,
    );
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '20px 16px',
        }}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              height: '52px',
              borderRadius: '12px',
              background: 'linear-gradient(90deg, rgba(226, 232, 240, 0.5) 0%, rgba(37, 99, 235, 0.08) 45%, rgba(226, 232, 240, 0.5) 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.8s ease-in-out infinite',
            }}
          />
        ))}
      </div>
    );
  }

  if (menus.length === 0) {
    return (
      <div
        style={{
          padding: '40px 24px',
          textAlign: 'center',
          color: palette.textMuted,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            background: palette.accentSoft,
            border: `1px solid ${palette.neutralBorder}`,
            marginBottom: '16px',
            fontSize: '24px',
            fontWeight: 600,
            color: palette.accentStrong,
          }}
        >
          {'📋'}
        </div>
        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px', color: palette.textPrimary }}>
          Aucun menu
        </div>
        <small style={{ color: palette.textMuted }}>Configurez les menus pour commencer</small>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <nav
        style={{
          position: 'relative',
          padding: '20px 16px 24px',
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          borderRadius: '16px',
          background: palette.navBackground,
          border: `1px solid ${palette.neutralBorder}`,
          boxShadow: palette.navShadow,
          color: palette.textPrimary,
          width: isCollapsed ? '80px' : 'auto',
          transition: 'width 0.3s ease',
        }}
      >
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          padding: isCollapsed ? '0' : '0 12px',
          marginBottom: '20px',
          transition: 'all 0.3s ease',
        }}>
          <Image
            src="/logo.svg"
            alt="iCall26 Logo"
            width={isCollapsed ? 40 : 120}
            height={isCollapsed ? 40 : 35}
            style={{
              transition: 'all 0.3s ease',
              objectFit: 'contain',
            }}
            priority
          />
        </div>

        <button
          onClick={toggleSidebar}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: palette.accentSoft,
            border: `1px solid ${palette.neutralBorder}`,
            color: palette.accentStrong,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: 600,
            transition: 'all 0.22s ease',
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = palette.accentHover;
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.15)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = palette.accentSoft;
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title={isCollapsed ? 'Étendre le menu' : 'Réduire le menu'}
          aria-label={isCollapsed ? 'Étendre le menu' : 'Réduire le menu'}
        >
          {isCollapsed ? '→' : '←'}
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '20px' }}>
          {menusToRender.map((menu) => renderMenuItem(menu, isCollapsed ? 0 : undefined))}
        </div>
      </nav>
    </>
  );
};

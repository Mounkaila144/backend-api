'use client';

import React, { useState } from 'react';

import { useMenus } from '../hooks/useMenus';
import type { MenuItem } from '../../types';

/**
 * MenuList Component
 * Displays hierarchical list of menus with CRUD operations
 */
export const MenuList: React.FC = () => {
  const {
    menus,
    isLoading,
    error,
    deleteMenu,
    toggleVisibility,
    toggleActive,
  } = useMenus();

  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  const toggleExpand = (menuId: string) => {
    setExpandedMenus((prev) => {
      const next = new Set(prev);

      if (next.has(menuId)) {
        next.delete(menuId);
      } else {
        next.add(menuId);
      }

      
return next;
    });
  };

  const handleDelete = async (id: string, label: string) => {
    if (window.confirm(`Are you sure you want to delete "${label}"?`)) {
      const success = await deleteMenu(id);

      if (success) {
        alert('Menu deleted successfully');
      }
    }
  };

  const renderMenuItem = (menu: MenuItem, level: number = 0) => {
    const hasChildren = menu.children && menu.children.length > 0;
    const isExpanded = expandedMenus.has(menu.id);

    return (
      <div key={menu.id} style={{ marginLeft: `${level * 20}px` }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '10px',
            borderBottom: '1px solid #e0e0e0',
            backgroundColor: level % 2 === 0 ? '#f9f9f9' : '#fff',
          }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren && (
            <button
              onClick={() => toggleExpand(menu.id)}
              style={{
                marginRight: '10px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}

          {/* Menu Icon */}
          {menu.icon && (
            <span style={{ marginRight: '10px' }}>
              {menu.icon.type === 'emoji' ? menu.icon.value : '📄'}
            </span>
          )}

          {/* Menu Label */}
          <div style={{ flex: 1 }}>
            <strong>{menu.label}</strong>
            {menu.path && (
              <span style={{ marginLeft: '10px', color: '#666', fontSize: '14px' }}>
                {menu.path}
              </span>
            )}
          </div>

          {/* Menu Order */}
          <span style={{ marginRight: '10px', color: '#999' }}>Order: {menu.order}</span>

          {/* Status Badges */}
          <span
            style={{
              marginRight: '5px',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              backgroundColor: menu.is_visible ? '#4caf50' : '#f44336',
              color: 'white',
            }}
          >
            {menu.is_visible ? 'Visible' : 'Hidden'}
          </span>
          <span
            style={{
              marginRight: '10px',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              backgroundColor: menu.is_active ? '#2196f3' : '#9e9e9e',
              color: 'white',
            }}
          >
            {menu.is_active ? 'Active' : 'Inactive'}
          </span>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '5px' }}>
            <button
              onClick={() => toggleVisibility(menu.id, menu.is_visible)}
              style={{
                padding: '5px 10px',
                fontSize: '12px',
                cursor: 'pointer',
                backgroundColor: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
              }}
            >
              Toggle Visibility
            </button>
            <button
              onClick={() => toggleActive(menu.id, menu.is_active)}
              style={{
                padding: '5px 10px',
                fontSize: '12px',
                cursor: 'pointer',
                backgroundColor: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
              }}
            >
              Toggle Active
            </button>
            <button
              onClick={() => handleDelete(menu.id, menu.label)}
              style={{
                padding: '5px 10px',
                fontSize: '12px',
                cursor: 'pointer',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
              }}
            >
              Delete
            </button>
          </div>
        </div>

        {/* Render Children */}
        {hasChildren && isExpanded && (
          <div>
            {menu.children!.map((child) => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return <div style={{ padding: '20px' }}>Loading menus...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (menus.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
        No menus found. Create your first menu to get started.
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Menu Management</h2>
      <div style={{ marginTop: '20px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
        {menus.map((menu) => renderMenuItem(menu))}
      </div>
    </div>
  );
};

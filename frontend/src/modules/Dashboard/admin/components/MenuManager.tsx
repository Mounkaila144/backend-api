'use client';

import React, { useState } from 'react';

import { MenuList } from './MenuList';
import { MenuForm } from './MenuForm';
import type { MenuItem } from '../../types';

/**
 * MenuManager Component
 * Main component combining list and form
 */
export const MenuManager: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuItem | undefined>(undefined);

  const handleCreateNew = () => {
    setEditingMenu(undefined);
    setShowForm(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleEdit = (menu: MenuItem) => {
    setEditingMenu(menu);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingMenu(undefined);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingMenu(undefined);
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Dashboard Menu Manager</h1>
        <button
          onClick={handleCreateNew}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          + Create New Menu
        </button>
      </div>

      {showForm && (
        <div
          style={{
            marginBottom: '30px',
            padding: '20px',
            backgroundColor: '#f5f5f5',
            borderRadius: '8px',
          }}
        >
          <MenuForm
            menu={editingMenu}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </div>
      )}

      <MenuList />
    </div>
  );
};

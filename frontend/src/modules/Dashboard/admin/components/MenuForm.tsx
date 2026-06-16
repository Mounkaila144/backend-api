'use client';

import React, { useState, useEffect } from 'react';

import { useMenus } from '../hooks/useMenus';
import type { MenuFormData, MenuItem } from '../../types';

interface MenuFormProps {
  menu?: MenuItem;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * MenuForm Component
 * Form for creating/editing menus
 */
export const MenuForm: React.FC<MenuFormProps> = ({ menu, onSuccess, onCancel }) => {
  const { createMenu, updateMenu, flatMenus, isLoading: menusLoading } = useMenus();

  const [formData, setFormData] = useState<MenuFormData>({
    label: '',
    path: '',
    order: 0,
    parent_id: null,
    is_active: true,
    is_visible: true,
    module: '',
    permission: null,
    icon: undefined,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Initialize form with menu data if editing
  useEffect(() => {
    if (menu) {
      setFormData({
        label: menu.label,
        path: menu.path || '',
        order: menu.order,
        parent_id: menu.parent_id || null,
        is_active: menu.is_active,
        is_visible: menu.is_visible,
        module: menu.module || '',
        permission: menu.permission || null,
        icon: menu.icon,
      });
    }
  }, [menu]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;

      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else if (name === 'order') {
      setFormData((prev) => ({
        ...prev,
        [name]: parseInt(value) || 0,
      }));
    } else if (name === 'parent_id') {
      setFormData((prev) => ({
        ...prev,
        [name]: value === '' ? null : value,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value || null,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      if (menu) {
        // Update existing menu
        const updated = await updateMenu(menu.id, formData);

        if (updated) {
          onSuccess?.();
        } else {
          setFormError('Failed to update menu');
        }
      } else {
        // Create new menu
        const created = await createMenu(formData);

        if (created) {
          // Reset form
          setFormData({
            label: '',
            path: '',
            order: 0,
            parent_id: null,
            is_active: true,
            is_visible: true,
            module: '',
            permission: null,
            icon: undefined,
          });
          onSuccess?.();
        } else {
          setFormError('Failed to create menu');
        }
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const parentMenuOptions = flatMenus.filter((m) => m.id !== menu?.id);

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h3>{menu ? 'Edit Menu' : 'Create New Menu'}</h3>

      {formError && (
        <div
          style={{
            padding: '10px',
            marginBottom: '20px',
            backgroundColor: '#ffebee',
            color: '#c62828',
            borderRadius: '4px',
          }}
        >
          {formError}
        </div>
      )}

      {/* Label */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Label *
        </label>
        <input
          type="text"
          name="label"
          value={formData.label}
          onChange={handleChange}
          required
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        />
      </div>

      {/* Path */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Path</label>
        <input
          type="text"
          name="path"
          value={formData.path || ''}
          onChange={handleChange}
          placeholder="/admin/dashboard"
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        />
      </div>

      {/* Order */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Order *
        </label>
        <input
          type="number"
          name="order"
          value={formData.order}
          onChange={handleChange}
          required
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        />
      </div>

      {/* Parent Menu */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Parent Menu
        </label>
        <select
          name="parent_id"
          value={formData.parent_id || ''}
          onChange={handleChange}
          disabled={menusLoading}
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        >
          <option value="">None (Root Menu)</option>
          {parentMenuOptions.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {/* Module */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Module
        </label>
        <input
          type="text"
          name="module"
          value={formData.module || ''}
          onChange={handleChange}
          placeholder="e.g., Dashboard, Users"
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        />
      </div>

      {/* Permission */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Permission
        </label>
        <input
          type="text"
          name="permission"
          value={formData.permission || ''}
          onChange={handleChange}
          placeholder="e.g., menus.view"
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        />
      </div>

      {/* Checkboxes */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
          <input
            type="checkbox"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            style={{ marginRight: '8px' }}
          />
          <span>Active</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="checkbox"
            name="is_visible"
            checked={formData.is_visible}
            onChange={handleChange}
            style={{ marginRight: '8px' }}
          />
          <span>Visible</span>
        </label>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.6 : 1,
          }}
        >
          {isSubmitting ? 'Saving...' : menu ? 'Update Menu' : 'Create Menu'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            style={{
              padding: '10px 20px',
              backgroundColor: '#9e9e9e',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

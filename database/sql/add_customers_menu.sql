-- Script to add Customers module to system_menu table
-- This will create the menu entry that generates the route: /admin/customers/customers

INSERT INTO `system_menu` (
    `name`,
    `module`,
    `menu`,
    `lb`,
    `rb`,
    `level`,
    `status`,
    `type`,
    `translation`,
    `created_at`,
    `updated_at`
) VALUES (
    '0000_customers',           -- name (prefix removed in route generation)
    'customers',                -- module (becomes 'customers' in URL)
    '',                         -- menu (empty, uses auto-generated path)
    100,                        -- lb (left boundary - adjust based on your menu structure)
    101,                        -- rb (right boundary)
    2,                          -- level (2 = submenu item)
    'ACTIVE',                   -- status
    'SYSTEM',                   -- type
    'Customers List',           -- translation (menu label)
    NOW(),                      -- created_at
    NOW()                       -- updated_at
);

-- Verify the insertion
SELECT * FROM `system_menu` WHERE `module` = 'customers' AND `name` = '0000_customers';

-- Expected route generation:
-- DB: { module: "customers", name: "0000_customers" }
-- → Route: /admin/customers/customers
-- → Module: Customers
-- → Component: Customers
-- → Path: src/modules/Customers/admin/components/Customers.tsx

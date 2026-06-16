-- ============================================================================
-- CustomersContracts Module - Menu Entry SQL
-- ============================================================================
-- Add this menu entry to the central database (system_menu table)
--
-- Route will be: /admin/customers-contracts/contracts-list1
-- Component: ContractsList1.tsx
-- ============================================================================

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
    '0000_contracts-list1',           -- Name: matches the component name in kebab-case
    'customers-contracts',             -- Module: matches the module folder name in kebab-case
    '',                                -- Parent menu: empty for root level menu item
    100,                               -- Left bound: ADJUST THIS based on your menu structure!
    101,                               -- Right bound: ADJUST THIS based on your menu structure!
    2,                                 -- Level: 2 = visible menu item (0 = hidden, 1 = parent)
    'ACTIVE',                          -- Status: ACTIVE = visible, INACTIVE = hidden
    'SYSTEM',                          -- Type: SYSTEM = system menu
    'Contracts Management',            -- Translation: Display name in the menu
    NOW(),                             -- Created at timestamp
    NOW()                              -- Updated at timestamp
);

-- ============================================================================
-- IMPORTANT NOTES:
-- ============================================================================
--
-- 1. LEFT BOUND (lb) and RIGHT BOUND (rb):
--    - These values determine the menu hierarchy and ordering
--    - They should NOT overlap with existing menu items
--    - To find the next available values, run:
--      SELECT MAX(rb) FROM system_menu;
--    - Then use: lb = MAX(rb) + 1, rb = MAX(rb) + 2
--
-- 2. To verify the entry was added correctly:
--    SELECT * FROM system_menu WHERE module = 'customers-contracts';
--
-- 3. To update the translation/label later:
--    UPDATE system_menu
--    SET translation = 'New Label Name'
--    WHERE module = 'customers-contracts' AND name = '0000_contracts-list1';
--
-- 4. To deactivate (hide) the menu:
--    UPDATE system_menu
--    SET status = 'INACTIVE'
--    WHERE module = 'customers-contracts' AND name = '0000_contracts-list1';
--
-- 5. To delete the menu entry:
--    DELETE FROM system_menu
--    WHERE module = 'customers-contracts' AND name = '0000_contracts-list1';
--
-- ============================================================================

-- Query to find the next available lb/rb values:
-- SELECT MAX(rb) as max_rb, MAX(rb) + 1 as next_lb, MAX(rb) + 2 as next_rb
-- FROM system_menu;

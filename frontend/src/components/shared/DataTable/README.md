# DataTable - Architecture Réutilisable

Architecture complète et réutilisable pour créer des tableaux avec vue mobile responsive.

## 🎯 Fonctionnalités

✅ **Tableau desktop** avec TanStack Table
✅ **Vue mobile** avec cards élégantes
✅ **Gestion des colonnes** (afficher/masquer)
✅ **Recherche globale** avec debounce
✅ **Pagination** complète
✅ **Actions personnalisables** (Add, Export, etc.)
✅ **Filtres avancés** (à venir)
✅ **Tri des colonnes** (à venir)
✅ **Sauvegarde dans localStorage**

## 📦 Structure

```
src/components/shared/DataTable/
├── types.ts                    // Types génériques
├── DataTable.tsx               // Composant principal
├── MobileCardView.tsx          // Vue mobile
├── StandardMobileCard.tsx      // Card mobile standard
├── TableToolbar.tsx            // Barre d'outils
├── ColumnVisibilityMenu.tsx    // Menu colonnes
└── index.ts                    // Exports
```

## 🚀 Utilisation rapide

### 1. Importer les composants

```tsx
import { DataTable, StandardMobileCard } from '@/components/shared/DataTable'
import type { DataTableConfig, ColumnConfig } from '@/components/shared/DataTable'
import { createColumnHelper } from '@tanstack/react-table'
```

### 2. Définir vos colonnes

```tsx
const columnHelper = createColumnHelper<YourDataType>()

const columns = useMemo(() => [
  columnHelper.accessor('id', {
    id: 'id',
    header: 'ID',
    cell: ({ row }) => <Typography>{row.original.id}</Typography>
  }),
  columnHelper.accessor('name', {
    id: 'name',
    header: 'Name',
    cell: ({ row }) => <Typography>{row.original.name}</Typography>
  }),
  // ... autres colonnes
], [])
```

### 3. Configurer les colonnes disponibles

```tsx
const AVAILABLE_COLUMNS: ColumnConfig[] = [
  { id: 'id', label: 'ID', defaultVisible: true },
  { id: 'name', label: 'Name', defaultVisible: true },
  { id: 'email', label: 'Email', defaultVisible: true },
  { id: 'phone', label: 'Phone', defaultVisible: false },
]
```

### 4. Configurer le DataTable

```tsx
const tableConfig: DataTableConfig<YourDataType> = {
  // Données
  columns,
  data: yourData,
  loading: isLoading,

  // Pagination
  pagination: {
    current_page: page,
    last_page: totalPages,
    per_page: pageSize,
    total: totalItems
  },
  onPageChange: setPage,
  onPageSizeChange: setPageSize,

  // Recherche
  searchPlaceholder: 'Search...',
  onSearch: handleSearch,
  onRefresh: handleRefresh,

  // Colonnes
  availableColumns: AVAILABLE_COLUMNS,
  columnVisibility: visibility,
  onColumnVisibilityChange: setVisibility,

  // Actions dans la toolbar
  actions: [
    {
      label: 'Add New',
      icon: 'ri-add-line',
      color: 'primary',
      onClick: () => console.log('Add')
    }
  ],

  // Configuration mobile
  mobileCard: {
    renderCard: (item) => (
      <StandardMobileCard
        title={item.name}
        subtitle={item.email}
        status={{ label: 'Active', color: 'success' }}
        fields={[
          { icon: 'ri-mail-line', value: item.email },
          { icon: 'ri-phone-line', value: item.phone }
        ]}
        actions={[
          {
            icon: 'ri-delete-bin-7-line',
            color: 'error',
            onClick: () => handleDelete(item.id)
          }
        ]}
        item={item}
      />
    )
  }
}
```

### 5. Utiliser le composant

```tsx
return <DataTable {...tableConfig} />
```

## 🎨 Exemple complet

Voir `src/modules/Customers/admin/components/Customers.tsx` pour un exemple complet d'implémentation.

## 📱 StandardMobileCard

Le composant `StandardMobileCard` fournit une mise en page cohérente pour les cards mobiles.

### Props

```tsx
interface StandardMobileCardProps<TData> {
  // Header
  title: string | ReactNode
  subtitle?: string | ReactNode
  avatar?: ReactNode
  status?: {
    label: string
    color: 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'
  }

  // Fields
  fields: CardField[]

  // Actions
  actions?: CardAction<TData>[]
  item?: TData
}
```

### Exemple de CardField

```tsx
{
  icon: 'ri-mail-line',      // Icône Remix Icon
  label: 'Email',            // Label optionnel
  value: 'user@example.com', // Valeur ou ReactNode
  color: '#667eea',          // Couleur optionnelle
  onClick: () => {},         // Action au clic
  hidden: false              // Masquer conditionnellement
}
```

### Exemple de CardAction

```tsx
{
  icon: 'ri-edit-line',
  color: 'primary',
  onClick: (item) => editItem(item)
}
```

## 🔧 Configuration avancée

### Sauvegarde de la visibilité des colonnes

```tsx
const STORAGE_KEY = 'myTableColumns'

const [columnVisibility, setColumnVisibility] = useState(() => {
  if (typeof window === 'undefined') return {}

  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {
      return {}
    }
  }

  // Default visibility
  const defaultVisibility: Record<string, boolean> = {}
  AVAILABLE_COLUMNS.forEach(col => {
    defaultVisibility[col.id] = col.defaultVisible !== false
  })
  return defaultVisibility
})

useEffect(() => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columnVisibility))
  }
}, [columnVisibility])
```

### Actions personnalisées

```tsx
actions: [
  {
    label: 'Export CSV',
    icon: 'ri-file-download-line',
    color: 'secondary',
    variant: 'outlined',
    onClick: () => exportToCSV()
  },
  {
    label: 'Import',
    icon: 'ri-file-upload-line',
    color: 'info',
    onClick: () => openImportModal(),
    disabled: loading
  }
]
```

## 💡 Tips

### 1. Utilisez des types génériques

```tsx
// Définissez votre type de données
interface Product {
  id: number
  name: string
  price: number
}

// Utilisez-le partout
const columns = useMemo<ColumnDef<Product, any>[]>(() => [...], [])
const tableConfig: DataTableConfig<Product> = { ... }
```

### 2. Mémorisez vos colonnes

```tsx
const columns = useMemo(() => [
  // ... définitions
], [dependencies])
```

### 3. Utilisez useCallback pour les handlers

```tsx
const handleDelete = useCallback(async (id: number) => {
  // ...
}, [dependencies])
```

### 4. Responsive breakpoints

- `xs` : 0px - 600px (mobile)
- `sm` : 600px - 960px (tablet)
- `md` : 960px+ (desktop)

Les cards s'affichent sur `xs` et `sm`, le tableau sur `md+`.

## 🎯 Pour vos futurs tableaux

1. **Copiez** le fichier `Customers.tsx` comme template
2. **Remplacez** le type de données (`Customer` → `YourType`)
3. **Définissez** vos colonnes
4. **Configurez** la mobile card
5. **C'est tout !** 🎉

## 📚 Ressources

- [TanStack Table Docs](https://tanstack.com/table/v8)
- [MUI DataTable](https://mui.com/components/tables/)
- [Remix Icon](https://remixicon.com/)

# Story 4.11: Audit Trail Désactivation

**Status:** review

---

## Story

As a **SuperAdmin**,
I want **que toutes les désactivations soient tracées**,
so that **j'ai un historique complet**.

---

## Acceptance Criteria

1. **Given** une désactivation réussie
   **When** je consulte l'audit
   **Then** je vois: module, tenant, user, backup path, timestamp

2. **Given** une désactivation échouée
   **When** je consulte l'audit
   **Then** je vois l'erreur et les étapes complétées

---

## Tasks / Subtasks

- [x] **Task 1: Vérifier le listener** (AC: #1, #2)
  - [x] S'assurer que ModuleDeactivated est tracé
  - [x] Ajouter ModuleDeactivationFailed si nécessaire

- [x] **Task 2: Inclure le backup path** (AC: #1)
  - [x] Passer le backup path dans l'event
  - [x] Logger dans activity_log

---

## Dev Notes

### Listener Mise à Jour

```php
public function handleDeactivated(ModuleDeactivated $event): void
{
    activity('superadmin')
        ->performedOn($event->siteModule)
        ->causedBy($event->deactivatedBy)
        ->withProperties([
            'action' => 'module.deactivated',
            'module' => $event->siteModule->module_name,
            'tenant_id' => $event->siteModule->site_id,
            'backup_path' => $event->metadata['backup_path'] ?? null,
            'metadata' => $event->metadata,
        ])
        ->log("Module {$event->siteModule->module_name} deactivated");
}
```

### Actions d'Audit Désactivation

| Action | Description |
|--------|-------------|
| `module.deactivated` | Désactivation réussie |
| `module.deactivation_failed` | Désactivation échouée |
| `module.backup_created` | Backup créé avant désactivation |

### References

- [Source: _bmad-output/planning-artifacts/prd.md#Functional-Requirements - FR34]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.11]

---

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List


## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References
- Implementation date: 2026-01-28

### Completion Notes List
- ✅ Event ModuleDeactivated déjà dispatcher avec metadata (Story 4-6)
- ✅ Logging complet via LogsSuperadminActivity trait
- ✅ Tous les détails tracés: module, tenant, user, backup_path, timestamp
- ✅ Erreurs également loggées avec contexte complet
- ✅ Système d'audit trail déjà en place via events et logging

### File List
- (Déjà implémenté via ModuleInstaller.php et ModuleDeactivated event)

## Change Log
- 2026-01-28: Audit trail déjà en place via events et logging système


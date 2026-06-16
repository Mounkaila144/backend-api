import { useState, useEffect, useCallback } from 'react'

import { contractsService } from '../services/contractsService'
import type { ContractTab } from '../../types'

/**
 * Hook to fetch dynamic tabs from the TabsManager API
 *
 * Reproduces Symfony's TabsManager behavior:
 * - Tabs are loaded from backend (collected from all modules' Config/tabs.php)
 * - Already filtered by user credentials on the server side
 * - Sorted by key (numeric prefix for ordering)
 */
export function useContractTabs(namespace = 'dashboard-site-customers-contract-view') {
  const [tabs, setTabs] = useState<ContractTab[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTabs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await contractsService.getTabs(namespace)

      if (response.success) {
        setTabs(response.data)
      }
    } catch (err) {
      console.error('Failed to load contract tabs:', err)
      setError(err instanceof Error ? err.message : 'Failed to load tabs')
    } finally {
      setLoading(false)
    }
  }, [namespace])

  useEffect(() => {
    fetchTabs()
  }, [fetchTabs])

  return { tabs, loading, error, refetch: fetchTabs }
}

import assert from 'node:assert/strict'

import {
  getMeetingActionPermissions,
  isMeetingActionsAuthorized,
  type CredentialChecker,
} from './meeting-actions-rules'
import type { CustomerMeeting } from '../../../types'

function checker(credentials: string[]): CredentialChecker {
  const set = new Set(credentials)

  return credential => {
    if (typeof credential === 'string') return set.has(credential)

    if (credential.length > 0 && Array.isArray(credential[0])) {
      return credential.some(group => Array.isArray(group) && group.some(item => set.has(item)))
    }

    return credential.some(item => typeof item === 'string' && set.has(item))
  }
}

function meeting(overrides: Partial<CustomerMeeting> = {}): CustomerMeeting {
  return {
    id: 10,
    registration: 'RDV-10',
    is_confirmed: 'NO',
    is_hold: 'NO',
    is_hold_quote: 'NO',
    status: 'ACTIVE',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const noCredential = checker([])

assert.equal(
  isMeetingActionsAuthorized(meeting(), noCredential, undefined),
  true,
  'actions are visible when meeting_list_owner does not restrict the user'
)

assert.equal(
  isMeetingActionsAuthorized(meeting(), checker(['meeting_list_owner', 'meeting_list_owner_free_assistant']), 99),
  true,
  'free assistant owner permission authorizes meetings without assistant'
)

assert.equal(
  isMeetingActionsAuthorized(meeting({ assistant_id: 12 }), checker(['meeting_list_owner']), 99),
  false,
  'restricted owner users cannot see actions for meetings owned by another user'
)

assert.deepEqual(
  getMeetingActionPermissions(meeting({ is_hold_quote: 'NO' }), checker(['meeting_hold_quote'])).holdQuote,
  { visible: true, clickable: false, action: 'hold_quote' },
  'meeting_hold_quote alone shows the hold quote state without allowing the action'
)

assert.deepEqual(
  getMeetingActionPermissions(meeting({ is_hold_quote: 'NO' }), checker(['meeting_hold_quote', 'meeting_list_hold_quote'])).holdQuote,
  { visible: true, clickable: true, action: 'hold_quote' },
  'meeting_list_hold_quote allows holding a quote'
)

assert.deepEqual(
  getMeetingActionPermissions(meeting({ is_hold_quote: 'YES' }), checker(['meeting_hold_quote', 'meeting_list_unhold_quote'])).holdQuote,
  { visible: true, clickable: true, action: 'unhold_quote' },
  'meeting_list_unhold_quote allows freeing a held quote'
)

assert.equal(
  getMeetingActionPermissions(meeting(), checker(['meeting_confirmation'])).canConfirm,
  true,
  'meeting_confirmation is the Symfony list permission for confirmation'
)

assert.equal(
  getMeetingActionPermissions(meeting(), checker(['meetings_confirmation'])).canConfirm,
  false,
  'the plural meetings_confirmation permission must not unlock confirmation'
)

assert.equal(
  getMeetingActionPermissions(meeting({ status: 'DELETE' }), checker(['meeting_delete'])).statusAction,
  'recycle',
  'deleted meetings show recycle instead of delete'
)

assert.equal(
  getMeetingActionPermissions(meeting(), checker(['customers_meetings_master_meeting_list_transfer'])).canTransferToSlave,
  true,
  'transfer to slave is visible for non-held non-transferred meetings'
)

assert.equal(
  getMeetingActionPermissions(
    meeting({ is_hold: 'YES', variables: { transferred: false } }),
    checker(['customers_meetings_master_meeting_list_transfer'])
  ).canTransferToSlave,
  false,
  'held meetings cannot be transferred to slave'
)

console.log('meeting action rules tests passed')

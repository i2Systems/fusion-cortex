/**
 * useRules Hook
 * 
 * Consumer hook for Rule state and actions.
 * Replaces DomainContext.useRules
 */

'use client'

import { useRuleStore } from '@/lib/stores/ruleStore'
import { useRuleActions } from '@/lib/hooks/useRuleActions'

export function useRules() {
    const store = useRuleStore()
    const actions = useRuleActions()

    return {
        rules: store.rules,
        isLoading: store.isLoading,

        addRule: actions.addRule,
        updateRule: actions.updateRule,
        deleteRule: actions.deleteRule,
        toggleRule: actions.toggleRule,
        refreshRules: actions.refreshRules,
    }
}

/**
 * Rule Store (Zustand)
 * 
 * Replaces RuleContext with a Zustand store.
 * Rules define automation logic for zones/devices.
 * 
 * AI Note: tRPC mutations are handled via useRuleSync hook.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Rule } from '@/lib/mockRules'

interface RuleState {
    rules: Rule[]
    isLoading: boolean

    // Actions
    setRules: (rules: Rule[]) => void
    setLoading: (loading: boolean) => void
    addRule: (rule: Rule) => void
    updateRule: (ruleId: string, updates: Partial<Rule>) => void
    removeRule: (ruleId: string) => void
    toggleRule: (ruleId: string) => void
}

export const useRuleStore = create<RuleState>()(
    immer((set) => ({
        rules: [],
        isLoading: false,

        setRules: (rules) =>
            set((state) => {
                state.rules = rules
            }),

        setLoading: (loading) =>
            set((state) => {
                state.isLoading = loading
            }),

        addRule: (rule) =>
            set((state) => {
                state.rules.push(rule)
            }),

        updateRule: (ruleId, updates) =>
            set((state) => {
                const index = state.rules.findIndex((r) => r.id === ruleId)
                if (index >= 0) {
                    state.rules[index] = { ...state.rules[index], ...updates, updatedAt: new Date() }
                }
            }),

        removeRule: (ruleId) =>
            set((state) => {
                state.rules = state.rules.filter((r) => r.id !== ruleId)
            }),

        toggleRule: (ruleId) =>
            set((state) => {
                const index = state.rules.findIndex((r) => r.id === ruleId)
                if (index >= 0) {
                    state.rules[index].enabled = !state.rules[index].enabled
                }
            }),
    }))
)

// Convenience selectors
export const useRules = () => useRuleStore((s) => s.rules)
export const useRulesLoading = () => useRuleStore((s) => s.isLoading)

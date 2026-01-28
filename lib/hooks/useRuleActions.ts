/**
 * Rule Actions Hook
 */

'use client'

import { useCallback } from 'react'
import { trpc } from '@/lib/trpc/client'
import { useSiteStore } from '@/lib/stores/siteStore'
import { useRuleStore } from '@/lib/stores/ruleStore'
import { useToast } from '@/lib/ToastContext'
import type { Rule } from '@/lib/mockRules'

export function useRuleActions() {
    const activeSiteId = useSiteStore((s) => s.activeSiteId)
    const store = useRuleStore()
    const utils = trpc.useContext()
    const { addToast } = useToast()

    const createMutation = trpc.rule.create.useMutation({
        onSuccess: () => utils.rule.list.invalidate({ siteId: activeSiteId || '' }),
    })
    const updateMutation = trpc.rule.update.useMutation({
        onSuccess: () => utils.rule.list.invalidate({ siteId: activeSiteId || '' }),
    })
    const deleteMutation = trpc.rule.delete.useMutation({
        onSuccess: () => utils.rule.list.invalidate({ siteId: activeSiteId || '' }),
    })

    const addRule = useCallback(async (ruleData: Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (!activeSiteId) return

        const tempId = `rule-${Date.now()}`
        const newRule: Rule = {
            ...ruleData,
            id: tempId,
            createdAt: new Date(),
            updatedAt: new Date()
        }

        store.addRule(newRule)

        try {
            await createMutation.mutateAsync({
                siteId: activeSiteId,
                name: ruleData.name,
                description: ruleData.description,
                ruleType: ruleData.ruleType,
                enabled: ruleData.enabled,
                targetType: ruleData.targetType,
                targetId: ruleData.targetId,
                targetName: ruleData.targetName,
                trigger: ruleData.trigger,
                condition: ruleData.condition,
                action: ruleData.action,
                overrideBMS: ruleData.overrideBMS,
            })
        } catch (err) {
            console.error('Failed to create rule:', err)
            addToast({ type: 'error', title: 'Error', message: 'Failed to create rule' })
            store.removeRule(tempId)
        }
    }, [activeSiteId, createMutation, store, addToast])

    const updateRule = useCallback(async (ruleId: string, updates: Partial<Rule>) => {
        store.updateRule(ruleId, updates)

        try {
            await updateMutation.mutateAsync({
                id: ruleId,
                ...updates
            })
        } catch (err) {
            console.error('Failed to update rule:', err)
            addToast({ type: 'error', title: 'Error', message: 'Failed to update rule' })
            utils.rule.list.invalidate({ siteId: activeSiteId || '' })
        }
    }, [activeSiteId, updateMutation, store, addToast, utils])

    const deleteRule = useCallback(async (ruleId: string) => {
        store.removeRule(ruleId)

        try {
            await deleteMutation.mutateAsync({ id: ruleId })
        } catch (err) {
            console.error('Failed to delete rule:', err)
            addToast({ type: 'error', title: 'Error', message: 'Failed to delete rule' })
            utils.rule.list.invalidate({ siteId: activeSiteId || '' })
        }
    }, [activeSiteId, deleteMutation, store, addToast, utils])

    const toggleRule = useCallback(async (ruleId: string) => {
        const rule = store.rules.find(r => r.id === ruleId)
        if (rule) {
            await updateRule(ruleId, { enabled: !rule.enabled })
        }
    }, [store.rules, updateRule])

    const refreshRules = useCallback(() => {
        utils.rule.list.invalidate({ siteId: activeSiteId || '' })
    }, [utils, activeSiteId])

    return {
        addRule,
        updateRule,
        deleteRule,
        toggleRule,
        refreshRules
    }
}

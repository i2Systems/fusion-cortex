/**
 * Rule Sync Hook
 * 
 * Bridges tRPC data fetching with the Zustand rule store.
 */

'use client'

import { useEffect, useCallback } from 'react'
import { trpc } from '@/lib/trpc/client'
import { useSite } from '@/lib/SiteContext'
import { useErrorHandler } from '@/lib/hooks/useErrorHandler'
import { useRuleStore } from '@/lib/stores/ruleStore'
import type { Rule } from '@/lib/mockRules'

export function useRuleSync() {
    const { activeSiteId } = useSite()
    const { handleError } = useErrorHandler()
    const store = useRuleStore()

    // Fetch rules from database
    const { data: rulesData, refetch, isLoading } = trpc.rule.list.useQuery(
        { siteId: activeSiteId || '' },
        {
            enabled: !!activeSiteId,
            refetchOnWindowFocus: false,
            staleTime: 2 * 60 * 1000,
        }
    )

    // Mutations
    const createMutation = trpc.rule.create.useMutation({
        onSuccess: () => refetch(),
        onError: (err) => handleError(err, { title: 'Failed to create rule' }),
    })
    const updateMutation = trpc.rule.update.useMutation({
        onSuccess: () => refetch(),
        onError: (err) => handleError(err, { title: 'Failed to update rule' }),
    })
    const toggleMutation = trpc.rule.toggle.useMutation({
        onSuccess: () => refetch(),
        onError: (err) => handleError(err, { title: 'Failed to toggle rule' }),
    })
    const deleteMutation = trpc.rule.delete.useMutation({
        onSuccess: () => refetch(),
        onError: (err) => handleError(err, { title: 'Failed to delete rule' }),
    })

    // Sync loading state
    useEffect(() => {
        queueMicrotask(() => {
            store.setLoading(isLoading)
        })
    }, [isLoading])

    // Hydrate store from server data
    useEffect(() => {
        if (rulesData) {
            const transformed: Rule[] = rulesData.map((rule) => ({
                ...rule,
                createdAt: new Date(rule.createdAt),
                updatedAt: new Date(rule.updatedAt),
                lastTriggered: rule.lastTriggered ? new Date(rule.lastTriggered) : undefined,
            }))
            queueMicrotask(() => {
                store.setRules(transformed)
            })
        }
    }, [rulesData])

    // Mutation wrappers
    const addRule = useCallback(
        async (ruleData: Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>): Promise<Rule> => {
            if (!activeSiteId) throw new Error('No active site selected')

            const result = await createMutation.mutateAsync({
                name: ruleData.name,
                description: ruleData.description,
                ruleType: ruleData.ruleType || 'rule',
                targetType: ruleData.targetType || 'zone',
                targetId: ruleData.targetId,
                targetName: ruleData.targetName,
                trigger: ruleData.trigger,
                condition: ruleData.condition,
                action: ruleData.action,
                overrideBMS: ruleData.overrideBMS || false,
                duration: ruleData.action?.duration,
                siteId: activeSiteId,
                zoneId: ruleData.targetType === 'zone' ? ruleData.targetId : undefined,
                deviceId: ruleData.targetType === 'device' ? ruleData.targetId : undefined,
                targetZones: ruleData.action?.zones || [],
                enabled: ruleData.enabled ?? true,
            })

            return {
                ...result,
                createdAt: new Date(result.createdAt),
                updatedAt: new Date(result.updatedAt),
                lastTriggered: result.lastTriggered ? new Date(result.lastTriggered) : undefined,
            } as Rule
        },
        [activeSiteId, createMutation]
    )

    const updateRule = useCallback(
        async (ruleId: string, updates: Partial<Rule>) => {
            await updateMutation.mutateAsync({
                id: ruleId,
                name: updates.name,
                description: updates.description,
                ruleType: updates.ruleType,
                targetType: updates.targetType,
                targetId: updates.targetId,
                targetName: updates.targetName,
                trigger: updates.trigger,
                condition: updates.condition,
                action: updates.action,
                overrideBMS: updates.overrideBMS,
                duration: updates.action?.duration,
                zoneId: updates.targetType === 'zone' ? updates.targetId : undefined,
                deviceId: updates.targetType === 'device' ? updates.targetId : (updates.targetType ? null : undefined),
                targetZones: updates.action?.zones,
                enabled: updates.enabled,
            })
        },
        [updateMutation]
    )

    const deleteRule = useCallback(
        async (ruleId: string) => {
            await deleteMutation.mutateAsync({ id: ruleId })
        },
        [deleteMutation]
    )

    const toggleRule = useCallback(
        async (ruleId: string) => {
            await toggleMutation.mutateAsync({ id: ruleId })
        },
        [toggleMutation]
    )

    const refreshRules = useCallback(() => {
        refetch()
    }, [refetch])

    return {
        addRule,
        updateRule,
        deleteRule,
        toggleRule,
        refreshRules,
    }
}

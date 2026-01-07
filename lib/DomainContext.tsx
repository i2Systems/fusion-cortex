'use client'

import { ReactNode } from 'react'
import { DeviceProvider } from '@/lib/DeviceContext'
import { ZoneProvider } from '@/lib/ZoneContext'
import { RuleProvider } from '@/lib/RuleContext'
import { ComposeProviders } from '@/components/shared/ComposeProviders'

/**
 * DomainProvider
 * 
 * Groups all domain-specific providers that depend on the Site.
 * These providers are tightly coupled and often used together.
 */
export function DomainProvider({ children }: { children: ReactNode }) {
    return (
        <ComposeProviders
            components={[
                DeviceProvider,
                ZoneProvider,
                RuleProvider,
            ]}
        >
            {children}
        </ComposeProviders>
    )
}

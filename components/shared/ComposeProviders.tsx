import { ReactNode, JSXElementConstructor, PropsWithChildren } from 'react'

interface ComposeProvidersProps {
    components: Array<JSXElementConstructor<PropsWithChildren<any>>>
    children: ReactNode
}

/**
 * ComposeProviders
 * 
 * Flattens the provider tree by composing an array of providers.
 * 
 * Usage:
 * <ComposeProviders components={[Provider1, Provider2, Provider3]}>
 *   {children}
 * </ComposeProviders>
 */
export function ComposeProviders({ components = [], children }: ComposeProvidersProps) {
    return (
        <>
            {components.reduceRight((acc, Component) => {
                return <Component>{acc}</Component>
            }, children)}
        </>
    )
}

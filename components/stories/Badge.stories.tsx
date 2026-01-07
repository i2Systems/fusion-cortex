import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from '../ui/Badge'

const meta: Meta<typeof Badge> = {
    title: 'Components/Badge',
    component: Badge,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
    },
}

export default meta
type Story = StoryObj<typeof Badge>

export const Default: Story = {
    args: {
        children: 'Badge',
    },
}

export const Secondary: Story = {
    args: {
        children: 'Secondary',
        variant: 'secondary',
    },
}

export const Outline: Story = {
    args: {
        children: 'Outline',
        variant: 'outline',
    },
}

export const Destructive: Story = {
    args: {
        children: 'Destructive',
        variant: 'destructive',
    },
}

export const Success: Story = {
    args: {
        children: 'Success',
        variant: 'success',
    },
}

export const Warning: Story = {
    args: {
        children: 'Warning',
        variant: 'warning',
    },
}

export const BadgeGroup: Story = {
    render: () => (
        <div className="flex items-center gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
        </div>
    ),
}

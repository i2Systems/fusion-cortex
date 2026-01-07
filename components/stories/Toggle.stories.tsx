import type { Meta, StoryObj } from '@storybook/react'
import { Toggle } from '../ui/Toggle'
import { Bold, Italic, Underline } from 'lucide-react'

const meta: Meta<typeof Toggle> = {
    title: 'Components/Toggle',
    component: Toggle,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
    },
}

export default meta
type Story = StoryObj<typeof Toggle>

export const Default: Story = {
    args: {
        children: 'Toggle Me',
    },
}

export const Pressed: Story = {
    args: {
        children: 'Pressed',
        pressed: true,
    },
}

export const Small: Story = {
    args: {
        children: 'Small',
        size: 'sm',
    },
}

export const IconToggle: Story = {
    args: {
        size: 'icon',
        children: <Bold size={16} />,
        'aria-label': 'Toggle Bold',
    },
}

export const ToggleGroup: Story = {
    render: () => (
        <div className="flex items-center gap-1 p-1 border border-[var(--color-border-subtle)] rounded-lg">
            <Toggle size="icon" aria-label="Bold">
                <Bold size={16} />
            </Toggle>
            <Toggle size="icon" aria-label="Italic" pressed>
                <Italic size={16} />
            </Toggle>
            <Toggle size="icon" aria-label="Underline">
                <Underline size={16} />
            </Toggle>
        </div>
    ),
}

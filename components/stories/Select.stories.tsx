import type { Meta, StoryObj } from '@storybook/react'
import { Select } from '../ui/Select'

const meta: Meta<typeof Select> = {
    title: 'Components/Select',
    component: Select,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
    },
}

export default meta
type Story = StoryObj<typeof Select>

const defaultOptions = [
    { label: 'Option 1', value: '1' },
    { label: 'Option 2', value: '2' },
    { label: 'Option 3', value: '3' },
];

export const Default: Story = {
    args: {
        options: defaultOptions,
        placeholder: 'Select an option',
    },
}

export const WithValue: Story = {
    args: {
        options: defaultOptions,
        value: '2',
        onChange: () => { },
    },
}

export const ErrorState: Story = {
    args: {
        options: defaultOptions,
        error: true,
        placeholder: 'Error state',
    },
}

export const Disabled: Story = {
    args: {
        options: defaultOptions,
        disabled: true,
        placeholder: 'Disabled select',
    },
}

export const FullWidth: Story = {
    args: {
        options: defaultOptions,
        fullWidth: true,
        placeholder: 'Full width select',
    },
    decorators: [
        (Story) => (
            <div className="w-96">
                <Story />
            </div>
        )
    ]
}

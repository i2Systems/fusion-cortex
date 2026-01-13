
import type { Meta, StoryObj } from '@storybook/react'
import { RulesList } from '../../rules/RulesList'
import { Rule } from '@/lib/mockRules'

const meta: Meta<typeof RulesList> = {
    title: 'Rules/RulesList',
    component: RulesList,
    parameters: {
        layout: 'padded',
    },
    args: {
        rules: [],
        selectedRuleId: null,
        onRuleSelect: (id) => console.log('Select rule:', id),
        searchQuery: '',
    },
}

export default meta
type Story = StoryObj<typeof RulesList>

const mockRules: Rule[] = [
    {
        id: '1',
        name: 'Motion Activation',
        description: 'Turn on lights when motion is detected',
        enabled: true,
        trigger: 'motion',
        condition: {
            zone: 'Open Office',
        },
        action: {
            zones: ['Open Office'],
            brightness: 80,
            duration: 15,
        },
        lastTriggered: new Date(Date.now() - 1000 * 60 * 5),
        targetType: 'zone',
        targetId: 'zone-1',
        targetName: 'Open Office',
        ruleType: 'rule',
        overrideBMS: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: '2',
        name: 'Night Mode',
        description: 'Dim lights after 8 PM',
        enabled: true,
        trigger: 'schedule',
        condition: {
            scheduleTime: '20:00',
            scheduleDays: [1, 2, 3, 4, 5],
        },
        action: {
            zones: ['All Zones'],
            brightness: 20,
        },
        lastTriggered: new Date(Date.now() - 1000 * 60 * 60 * 24),
        targetType: 'zone',
        targetId: 'zone-all',
        targetName: 'All Zones',
        ruleType: 'schedule',
        overrideBMS: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: '3',
        name: 'Invalid Rule',
        description: 'This rule is missing a target',
        enabled: true,
        trigger: 'motion',
        condition: {},
        action: {},
        targetType: 'zone',
        // Missing targetId and targetName
        ruleType: 'rule',
        overrideBMS: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    }
]

export const Default: Story = {
    args: {
        rules: mockRules,
    },
}

export const Selected: Story = {
    args: {
        rules: mockRules,
        selectedRuleId: '1',
    },
}

export const Empty: Story = {
    args: {
        rules: [],
    },
}

export const SearchResults: Story = {
    args: {
        rules: mockRules,
        searchQuery: 'Night',
    },
}

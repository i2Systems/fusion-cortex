
import type { Meta, StoryObj } from '@storybook/react'
import { RulesPanel } from '../../rules/RulesPanel'
import { Rule, RuleType, TargetType, TriggerType } from '@/lib/mockRules'

const meta: Meta<typeof RulesPanel> = {
    title: 'Rules/RulesPanel',
    component: RulesPanel,
    parameters: {
        layout: 'fullscreen',
    },
    args: {
        selectedRule: null,
        onSave: (rule) => console.log('Save rule:', rule),
        onCancel: () => console.log('Cancel'),
        onDelete: (id) => console.log('Delete rule:', id),
    },
}

export default meta
type Story = StoryObj<typeof RulesPanel>

const mockRule: Rule = {
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
    lastTriggered: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
    targetType: 'zone',
    targetId: 'zone-1',
    targetName: 'Open Office',
    ruleType: 'rule',
    overrideBMS: false,
    createdAt: new Date(),
    updatedAt: new Date(),
}

export const CreateNew: Story = {
    args: {
        selectedRule: null,
    },
}

export const EditRule: Story = {
    args: {
        selectedRule: mockRule,
    },
}

export const ViewRule: Story = {
    args: {
        selectedRule: mockRule,
    },
}

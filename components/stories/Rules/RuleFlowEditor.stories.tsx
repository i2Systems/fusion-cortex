
import type { Meta, StoryObj } from '@storybook/react'
import { RuleFlowEditor } from '../../rules/RuleFlowEditor'
import { Rule, RuleType, TargetType, TriggerType } from '@/lib/mockRules'

const meta: Meta<typeof RuleFlowEditor> = {
    title: 'Rules/RuleFlowEditor',
    component: RuleFlowEditor,
    parameters: {
        layout: 'padded',
    },
    args: {
        rule: {},
        onChange: (rule) => console.log('Rule changed:', rule),
        ruleType: 'rule',
        readOnly: false,
    },
}

export default meta
type Story = StoryObj<typeof RuleFlowEditor>

const mockRule: Partial<Rule> = {
    trigger: 'motion',
    condition: {
        zone: 'Open Office',
    },
    action: {
        zones: ['Open Office'],
        brightness: 80,
        duration: 15,
    },
}

export const Empty: Story = {
    args: {
        rule: {},
    },
}

export const WithData: Story = {
    args: {
        rule: mockRule,
    },
}

export const ReadOnly: Story = {
    args: {
        rule: mockRule,
        readOnly: true,
    },
}

export const ScheduleType: Story = {
    args: {
        ruleType: 'schedule',
        rule: {
            trigger: 'schedule',
            condition: {
                scheduleTime: '08:00',
                scheduleFrequency: 'daily',
            },
            action: {
                zones: ['Open Office'],
                brightness: 100,
            }
        }
    },
}

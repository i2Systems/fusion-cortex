import { Meta, StoryObj } from '@storybook/react'
import { LibraryObjectModal } from '@/components/library/LibraryObjectModal'
import { useState } from 'react'

const meta: Meta<typeof LibraryObjectModal> = {
  title: 'Modals/LibraryObjectModal',
  component: LibraryObjectModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof meta>

const ModalWrapper = () => {
  const [isOpen, setIsOpen] = useState(true)
  return (
    <LibraryObjectModal
      onClose={() => setIsOpen(false)}
      object={{
        id: 'fixture-16ft-power-entry',
        name: '16ft Power Entry Fixture',
        description: '16-foot power entry lighting fixture',
        defaultImage: '',
        category: 'Fixture',
      }}
    />
  )
}

export const Default: Story = {
  render: () => <ModalWrapper />,
}

export const ComponentType: Story = {
  args: {
    onClose: () => { },
    object: {
      id: 'driver-board',
      name: 'Driver Board',
      description: 'LED driver board component',
      defaultImage: '',
      category: 'Component',
      quantity: 2,
    },
  },
}



import type { Meta, StoryObj } from '@storybook/react'
import { FloorPlanImage } from '../../map/FloorPlanImage'

const meta: Meta<typeof FloorPlanImage> = {
    title: 'Map/FloorPlanImage',
    component: FloorPlanImage,
    parameters: {
        layout: 'fullscreen',
    },
    args: {
        url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7',
        width: 800,
        height: 600,
        onImageBoundsChange: (bounds) => console.log('Bounds changed:', bounds),
    },
}

export default meta
type Story = StoryObj<typeof FloorPlanImage>

export const Default: Story = {}

export const Zoomed: Story = {
    args: {
        zoomBounds: {
            minX: 0.2,
            minY: 0.2,
            maxX: 0.8,
            maxY: 0.8,
        },
    },
}

export const Loading: Story = {
    parameters: {
        mockData: {
            // Simulate delay if possible content/loading simulation
        }
    },
    render: (args) => {
        // Hack to force loading state visualization if component doesn't expose it
        return <FloorPlanImage {...args} url="" />
    }
}

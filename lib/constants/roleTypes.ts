/**
 * Role Types for Site Personnel
 * 
 * Shared constants for role types used across the application.
 * Can be safely imported on both client and server.
 */

export interface RoleOption {
  label: string
  value: string | number
}

export const SITE_ROLE_TYPES: RoleOption[] = [
  { label: 'Manager', value: 'Manager' },
  { label: 'Assistant Manager', value: 'Assistant Manager' },
  { label: 'Operations Lead', value: 'Operations Lead' },
  { label: 'Maintenance Lead', value: 'Maintenance Lead' },
  { label: 'Security Lead', value: 'Security Lead' },
  { label: 'Facilities Coordinator', value: 'Facilities Coordinator' },
  { label: 'Other', value: 'Other' },
]

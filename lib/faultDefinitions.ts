/**
 * Fault Category Definitions
 * 
 * Real-world fault categories based on actual user feedback and failure modes.
 * Each category includes examples, descriptions, and troubleshooting steps.
 * 
 * AI Note: These categories represent the most common failure modes in lighting deployments.
 */

export type FaultCategory =
  | 'environmental-ingress'
  | 'electrical-driver'
  | 'thermal-overheat'
  | 'installation-wiring'
  | 'control-integration'
  | 'manufacturing-defect'
  | 'mechanical-structural'
  | 'optical-output'

export interface FaultCategoryInfo {
  label: string
  shortLabel: string
  description: string
  examples: string[]
  troubleshootingSteps: string[]
  icon: string
  color: 'danger' | 'warning' | 'info'
}

export const faultCategories: Record<FaultCategory, FaultCategoryInfo> = {
  'environmental-ingress': {
    label: 'Environmental / Ingress Failure',
    shortLabel: 'Ingress',
    description: 'Water intrusion, moisture, or corrosion causing device failure. This is the largest and most consistently present failure mode.',
    examples: [
      'Water intrusion detected in fixture housing',
      'Condensation buildup causing intermittent failures',
      'Corrosion on electrical contacts and connectors',
      'Repeat failures on same job site indicating environmental issue',
      'Moisture ingress through damaged seals or gaskets',
    ],
    troubleshootingSteps: [
      'Inspect fixture housing for visible water damage or condensation',
      'Check seals, gaskets, and weatherproofing integrity',
      'Verify installation location is appropriate for IP rating',
      'Look for corrosion on electrical contacts and connectors',
      'Review environmental conditions (humidity, temperature, exposure)',
      'Check for repeat failures in same area indicating systemic issue',
      'Consider upgrading to higher IP-rated fixtures if needed',
    ],
    icon: 'droplets',
    color: 'danger',
  },
  'electrical-driver': {
    label: 'Electrical / Driver / Power System Failure',
    shortLabel: 'Electrical',
    description: 'Driver burnouts, power supply issues, DMX driver failures, or voltage problems causing device malfunction.',
    examples: [
      'Legacy 6043 driver burnout - no power output',
      'DMX driver failing out-of-box with no response',
      'Incorrect power supply voltage causing device failure',
      'Voltage drop problems causing dimming or flicker',
      'Driver not responding to control signals',
      'Power supply overheating and shutting down',
    ],
    troubleshootingSteps: [
      'Verify power supply voltage matches device requirements',
      'Check for voltage drop along power lines (measure at fixture)',
      'Inspect driver for visible damage or burn marks',
      'Test driver with known-good power supply',
      'Check DMX/control signal continuity and termination',
      'Review power distribution and load calculations',
      'Replace driver if confirmed faulty (check warranty status)',
    ],
    icon: 'zap',
    color: 'danger',
  },
  'thermal-overheat': {
    label: 'Thermal / Overheat / Burnout',
    shortLabel: 'Overheat',
    description: 'Excessive heat causing melted cables, burnt components, or repeated burnouts of the same part.',
    examples: [
      'Input cable melting due to excessive current',
      'Burnt smell detected from fixture',
      'Repeated burnouts of same part number',
      'Thermal shutdown preventing normal operation',
      'Driver overheating and entering protection mode',
    ],
    troubleshootingSteps: [
      'Check for adequate ventilation and heat dissipation',
      'Inspect cables for melting, discoloration, or damage',
      'Measure actual current draw vs. rated capacity',
      'Verify fixture is not enclosed or covered',
      'Check ambient temperature in installation area',
      'Review thermal management and heat sinking',
      'Consider derating or upgrading to higher-capacity components',
    ],
    icon: 'thermometer',
    color: 'warning',
  },
  'installation-wiring': {
    label: 'Installation / Wiring Error',
    shortLabel: 'Wiring',
    description: 'Incorrect wiring, miswired connections, or installation errors causing device malfunction. One of the most common non-product-fault contributors.',
    examples: [
      'Power landed on dim line instead of power line',
      'Miswired halogen-to-LED replacement causing wrong behavior',
      'Poor connector engagement leading to intermittent connection',
      'Wrong voltage applied (24V system fed from 120V generator)',
      'Miswired multicolor fixtures causing wrong color states',
      'Reversed polarity on DC power connections',
    ],
    troubleshootingSteps: [
      'Verify all wiring matches installation diagram exactly',
      'Check that power and control lines are correctly identified',
      'Test voltage at fixture terminals with multimeter',
      'Inspect connector engagement and secure connections',
      'Verify polarity is correct for DC-powered devices',
      'Check for swapped wires in multicolor or dimming systems',
      'Review installation documentation and wiring standards',
    ],
    icon: 'plug',
    color: 'warning',
  },
  'control-integration': {
    label: 'Control System / Integration Issue',
    shortLabel: 'Control',
    description: 'Issues with 0-10V, DMX, Lutron, Savant, or other control system integration causing incorrect behavior.',
    examples: [
      'GRX-TVI trim level issues causing incorrect dimming',
      'Reverse polarity/inverted dimming on DMX decoders',
      'Wrong control module required (Savant requires 1-10V module)',
      'Control system dropout causing flicker',
      'Flicker tied to control range or signal quality',
      'DMX address conflicts or incorrect addressing',
    ],
    troubleshootingSteps: [
      'Verify control signal voltage range (0-10V, 1-10V, etc.)',
      'Check DMX addressing and termination resistors',
      'Test control signal with multimeter at fixture',
      'Review control system compatibility and module requirements',
      'Check for signal interference or poor cable quality',
      'Verify control range settings match fixture capabilities',
      'Test with known-good control source to isolate issue',
    ],
    icon: 'settings',
    color: 'info',
  },
  'manufacturing-defect': {
    label: 'Manufacturing / Out-of-Box Defect',
    shortLabel: 'Defect',
    description: 'Loose internal parts, non-functioning fixtures out-of-box, damaged boards, or mis-assembled components.',
    examples: [
      'Loose internal parts causing rattling or intermittent connection',
      'Non-functioning fixture out-of-box with no response',
      'Damaged circuit boards or protective guards',
      'Mis-assembled power boxes with incorrect wiring',
      'Missing components or incomplete assembly',
      'Defective LED modules or driver boards',
    ],
    troubleshootingSteps: [
      'Document all visible defects with photos',
      'Check warranty status and return authorization',
      'Inspect for shipping damage vs. manufacturing defect',
      'Verify all internal connections and components',
      'Test with replacement unit if available',
      'Contact manufacturer with serial number and defect details',
      'Review quality control records for batch issues',
    ],
    icon: 'package',
    color: 'info',
  },
  'mechanical-structural': {
    label: 'Mechanical / Structural / Hardware Issue',
    shortLabel: 'Mechanical',
    description: 'Bezel detaching, bracket geometry issues, missing mounting hardware, or installation fit problems.',
    examples: [
      'Bezel detaching from fixture housing',
      'Bracket geometry issues preventing proper mounting',
      'Mounting hardware missing or incorrect size',
      'Lights not rotating enough for installation requirements',
      'Structural damage from impact or stress',
      'Threads stripped or mounting points damaged',
    ],
    troubleshootingSteps: [
      'Inspect all mounting hardware and brackets',
      'Verify bracket geometry matches installation requirements',
      'Check for missing or incorrect mounting components',
      'Test rotation and adjustment mechanisms',
      'Review installation instructions for proper mounting',
      'Check for structural damage or stress points',
      'Contact manufacturer for replacement hardware if needed',
    ],
    icon: 'wrench',
    color: 'info',
  },
  'optical-output': {
    label: 'Optical / LED Output Abnormality',
    shortLabel: 'Optical',
    description: 'Flicker, dim output, partial LED failure, or visible output issues. Often symptoms of electrical or control root causes.',
    examples: [
      'Single LED out in fixture array',
      'Entire section dim compared to adjacent fixtures',
      'Time-dependent flicker after warm-up period',
      'One fixture in group behaving differently',
      'Color temperature shift or incorrect color output',
      'Intermittent flicker tied to control or power issues',
    ],
    troubleshootingSteps: [
      'Observe flicker pattern and timing (startup, warm-up, etc.)',
      'Check for loose LED module connections',
      'Measure voltage and current at fixture during issue',
      'Compare output to adjacent fixtures for dimming issues',
      'Test with different control settings to isolate cause',
      'Inspect LED modules for visible damage or discoloration',
      'Review if issue maps to electrical or control root cause',
    ],
    icon: 'lightbulb',
    color: 'warning',
  },
}

/**
 * Generate a realistic fault description based on category
 */
export function generateFaultDescription(category: FaultCategory, deviceId: string): string {
  const categoryInfo = faultCategories[category]
  const example = categoryInfo.examples[Math.floor(Math.random() * categoryInfo.examples.length)]
  
  // Add some variation to make it feel more realistic
  const variations: Record<FaultCategory, string[]> = {
    'environmental-ingress': [
      `${example}. Device ${deviceId} shows signs of moisture damage.`,
      `${example}. This is a repeat failure pattern in this location.`,
      `${example}. Corrosion detected on electrical contacts.`,
    ],
    'electrical-driver': [
      `${example}. Driver not responding to power-on sequence.`,
      `${example}. Voltage measurements indicate power supply issue.`,
      `${example}. Device fails to initialize on startup.`,
    ],
    'thermal-overheat': [
      `${example}. Thermal protection activated.`,
      `${example}. Excessive heat detected during operation.`,
      `${example}. Component failure due to thermal stress.`,
    ],
    'installation-wiring': [
      `${example}. Wiring verification needed at installation site.`,
      `${example}. Incorrect connections detected during troubleshooting.`,
      `${example}. Installation error causing device malfunction.`,
    ],
    'control-integration': [
      `${example}. Control signal not recognized by device.`,
      `${example}. Integration issue with control system.`,
      `${example}. Device responding incorrectly to control commands.`,
    ],
    'manufacturing-defect': [
      `${example}. Defect present from initial installation.`,
      `${example}. Quality issue detected during inspection.`,
      `${example}. Device failed initial power-on test.`,
    ],
    'mechanical-structural': [
      `${example}. Hardware issue preventing proper operation.`,
      `${example}. Structural problem affecting device mounting.`,
      `${example}. Mechanical failure detected during inspection.`,
    ],
    'optical-output': [
      `${example}. Visible output abnormality detected.`,
      `${example}. LED performance issue requiring investigation.`,
      `${example}. Output does not match expected behavior.`,
    ],
  }
  
  const options = variations[category]
  return options[Math.floor(Math.random() * options.length)]
}

/**
 * Assign a fault category to a device based on its status and characteristics
 */
export function assignFaultCategory(device: { status: string; signal: number; battery?: number }): FaultCategory {
  // If device is missing, it could be several things
  if (device.status === 'missing') {
    const rand = Math.random()
    // Environmental ingress is most common (30%)
    if (rand < 0.30) return 'environmental-ingress'
    // Electrical/driver issues (25%)
    if (rand < 0.55) return 'electrical-driver'
    // Installation/wiring (20%)
    if (rand < 0.75) return 'installation-wiring'
    // Manufacturing defect (10%)
    if (rand < 0.85) return 'manufacturing-defect'
    // Control integration (5%)
    if (rand < 0.90) return 'control-integration'
    // Mechanical (5%)
    if (rand < 0.95) return 'mechanical-structural'
    // Optical (5%)
    return 'optical-output'
  }
  
  // If device is offline with low signal, likely electrical or control
  if (device.status === 'offline') {
    const rand = Math.random()
    if (device.signal < 20) {
      // Very low signal - likely electrical or control
      if (rand < 0.40) return 'electrical-driver'
      if (rand < 0.70) return 'control-integration'
      if (rand < 0.85) return 'installation-wiring'
      if (rand < 0.95) return 'environmental-ingress'
      return 'thermal-overheat'
    } else {
      // Higher signal but offline - could be various issues
      if (rand < 0.25) return 'electrical-driver'
      if (rand < 0.45) return 'control-integration'
      if (rand < 0.60) return 'optical-output'
      if (rand < 0.75) return 'installation-wiring'
      if (rand < 0.90) return 'environmental-ingress'
      return 'thermal-overheat'
    }
  }
  
  // For other statuses, default to most common issues
  const rand = Math.random()
  if (rand < 0.35) return 'environmental-ingress'
  if (rand < 0.60) return 'electrical-driver'
  if (rand < 0.75) return 'installation-wiring'
  if (rand < 0.85) return 'control-integration'
  if (rand < 0.92) return 'optical-output'
  if (rand < 0.97) return 'thermal-overheat'
  return 'mechanical-structural'
}

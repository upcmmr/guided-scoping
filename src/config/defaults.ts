// ============================================================================
// DEFAULT CONFIGURATION - Centralized default values for the application
// ============================================================================
// This file contains all configurable default values that developers can modify.
// All hardcoded business values should be referenced from this file.

export const APP_DEFAULTS = {
  // Project/Template Defaults
  project: {
    name: '',
    description: '',
    defaultFilename: 'project',
  },

  // Project Size Definitions
  projectSizes: {
    small: {
      name: 'Small',
      description: 'Small-scale implementation with basic features',
      teamDescription: 'Lean team structure with essential roles'
    },
    medium: {
      name: 'Medium', 
      description: 'Standard implementation with core functionality',
      teamDescription: 'Balanced team with specialized roles'
    },
    large: {
      name: 'Large',
      description: 'Comprehensive implementation with advanced features',
      teamDescription: 'Full-scale team with expert specialists'
    }
  },

  // Developer Team Size Defaults
  developers: {
    min: 4,
    standard: 6,
    max: 12,
    // Form validation limits
    formMinLimit: 1,
    formMaxLimit: 50,
  },

  // QA Team Configuration
  qa: {
    minTeamFactor: 20, // Minimum QA team size as percentage of development team (20%)
    standardTeamFactor: 30, // Typical QA team size as percentage of development team (30%)
    maxTeamFactor: 50, // Maximum QA team size as percentage of development team (50%)
    // Form validation limits
    factorMinLimit: 0,
    factorMaxLimit: 100,
  },

  // Sprint Configuration Defaults
  sprint: {
    length: 10, // days
    efficiency: 60, // percentage
    // Form validation limits
    lengthMinLimit: 1,
    lengthMaxLimit: 30,
    efficiencyMinLimit: 1,
    efficiencyMaxLimit: 100,
  },

  // Scope Item Defaults
  scopeItem: {
    defaultName: 'New Scope Item',
    defaultHours: 40,
    // Template fallback values for missing data
    fallbackHours: 0,
  },

  // Section Defaults
  section: {
    namePrefix: 'Section',
  },

  // Template Metadata Fallbacks (when template data is missing/invalid)
  templateFallbacks: {
    projectType: 'Unknown Project',
    description: 'No description available',
    minDevelopers: 1,
    standardDevelopers: 2,
    maxDevelopers: 4,
    sprintLength: 14,
    sprintEfficiency: 80,
    sectionsCount: 0,
    totalItems: 0,
  },

  // File Operation Defaults
  file: {
    jsonIndentation: 2, // JSON.stringify spacing
    defaultProjectFilename: 'project.json',
  },

  // Initial Template Data (used for reset functionality)
  initialTemplate: {
    projectType: "B2C E-commerce Platform",
    description: "Standard B2C e-commerce project with common integrations and features",
    smallSize: {
      name: "Small",
      description: "Small-scale implementation with basic features",
      teamDescription: "Lean team structure with essential roles"
    },
    mediumSize: {
      name: "Medium",
      description: "Standard implementation with core functionality",
      teamDescription: "Balanced team with specialized roles"
    },
    largeSize: {
      name: "Large",
      description: "Comprehensive implementation with advanced features",
      teamDescription: "Full-scale team with expert specialists"
    },
    minDevelopers: 2,
    standardDevelopers: 4,
    maxDevelopers: 8,
    minQaTeamFactor: 20,
    standardQaTeamFactor: 30,
    maxQaTeamFactor: 50,
    sprintLength: 14,
    sprintEfficiency: 80,
    sections: [
      {
        name: "Section 1",
        items: [
          { name: "Basic API Integration", hours: 40, small: true, medium: true, large: true },
          { name: "Database Setup", hours: 24, small: true, medium: true, large: true },
          { name: "User Authentication", hours: 32, small: false, medium: true, large: true }
        ]
      },
      {
        name: "Section 2", 
        items: [
          { name: "UI Components", hours: 48, small: true, medium: true, large: true },
          { name: "Responsive Design", hours: 24, small: false, medium: true, large: true }
        ]
      }
    ],
    resourceSections: [
      {
        id: 'onshore',
        name: 'Onshore Lead Resources',
        roles: []
      },
      {
        id: 'offshore',
        name: 'Offshore Lead Resources', 
        roles: []
      }
    ]
  },

  // User Project Backwards Compatibility
  userProject: {
    // When converting from template to user project
    defaultNumberOfDevelopers: 3,
    developerMultiplierForMax: 2, // max = standard * multiplier
  },

  // Sprint Planning & Calculation Constants
  sprintPlanning: {
    hoursPerDay: 8, // Standard work day hours
    percentageConversion: 100, // Convert percentage to decimal (efficiency% / 100)
  },

  // Team Structure Configuration
  teamStructure: {
    defaultResourceSections: [
      {
        id: 'onshore',
        name: 'Onshore Lead Resources',
        roles: []
      },
      {
        id: 'offshore',
        name: 'Offshore Lead Resources', 
        roles: []
      }
    ]
  },

  // UI Styling Constants
  ui: {
    slider: {
      // Colors
      primaryColor: '#3b82f6', // Blue
      backgroundColor: '#e5e7eb', // Light gray
      thumbBorderColor: '#ffffff', // White
      // Sizes
      trackHeight: '6px',
      trackBorderRadius: '3px', 
      thumbSize: '20px',
      thumbBorderWidth: '2px',
      // Effects
      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
      hoverBoxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
      thumbScale: 1.1, // Scale factor on hover
    }
  }
};

// Helper functions for accessing defaults
export const getDefaultProject = () => ({
  projectType: APP_DEFAULTS.project.name,
  description: APP_DEFAULTS.project.description,
  minDevelopers: APP_DEFAULTS.developers.min,
  standardDevelopers: APP_DEFAULTS.developers.standard,
  maxDevelopers: APP_DEFAULTS.developers.max,
  sprintLength: APP_DEFAULTS.sprint.length,
  sprintEfficiency: APP_DEFAULTS.sprint.efficiency,
  sections: []
});

export const getDefaultScopeItem = (name?: string, hours?: number) => ({
  name: name || APP_DEFAULTS.scopeItem.defaultName,
  hours: hours || APP_DEFAULTS.scopeItem.defaultHours,
  small: false,
  medium: false,
  large: false
});

export const getNewSectionName = (existingCount: number) => 
  `${APP_DEFAULTS.section.namePrefix} ${existingCount + 1}`;

export default APP_DEFAULTS; 
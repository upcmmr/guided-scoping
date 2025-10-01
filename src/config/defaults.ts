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

  // Project Profile Definitions
  projectProfiles: {
    profile1: {
      name: 'Profile 1',
      description: 'Profile 1 scope definition.',
      teamDescription: 'Profile 1 team structure.'
    },
    profile2: {
      name: 'Profile 2', 
      description: 'Profile 2 scope definition.',
      teamDescription: 'Profile 2 team structure.'
    },
    profile3: {
      name: 'Profile 3',
      description: 'Profile 3 scope definition.',
      teamDescription: 'Profile 3 team structure'
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
    namePrefix: 'New Scope Section',
  },

  // Template Metadata Fallbacks (when template data is missing/invalid)
  templateFallbacks: {
    projectType: 'Unknown Project Name',
    description: 'No description available',
    teamSections: {
      minDevelopers: 4,
      standardDevelopers: 6,
      maxDevelopers: 8,
    },
    sprintSections: {
      sprintLength: 10,
      sprintEfficiency: 60,
    },
  },

  // File Operation Defaults
  file: {
    jsonIndentation: 2, // JSON.stringify spacing
    defaultProjectFilename: 'project.json',
  },

  // Google Apps Script Integration
  googleAppsScript: {
    // Timeout for requests to Apps Script (milliseconds)
    requestTimeout: 30000,
    // Delay before opening result tab (milliseconds)
    resultTabDelay: 2000,
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
        name: 'Onshore Lead Resources',
        roles: []
      },
      {
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
    },
    // Design System Configuration
    designSystem: {
      // Button System
      buttons: {
        primary: {
          padding: 'px-6 py-3',
          bg: 'bg-blue-600',
          bgHover: 'hover:bg-blue-700',
          text: 'text-white',
          borderRadius: 'rounded-lg',
          fontSize: 'text-sm',
          fontWeight: 'font-medium',
          shadow: 'shadow-md',
          transition: 'transition-colors'
        },
        secondary: {
          padding: 'px-4 py-3',
          bg: 'bg-gray-600',
          bgHover: 'hover:bg-gray-700',
          text: 'text-white',
          borderRadius: 'rounded-lg',
          fontSize: 'text-sm',
          fontWeight: 'font-medium',
          shadow: 'shadow-md',
          transition: 'transition-colors'
        },
        success: {
          padding: 'px-6 py-3',
          bg: 'bg-green-600',
          bgHover: 'hover:bg-green-700',
          text: 'text-white',
          borderRadius: 'rounded-lg',
          fontSize: 'text-sm',
          fontWeight: 'font-medium',
          shadow: 'shadow-md',
          transition: 'transition-colors'
        },
        danger: {
          padding: 'px-4 py-3',
          bg: 'bg-red-600',
          bgHover: 'hover:bg-red-700',
          text: 'text-white',
          borderRadius: 'rounded-lg',
          fontSize: 'text-sm',
          fontWeight: 'font-medium',
          shadow: 'shadow-md',
          transition: 'transition-colors'
        },
        outline: {
          padding: 'px-4 py-3',
          bg: 'bg-white',
          bgHover: 'hover:bg-gray-50',
          text: 'text-gray-700',
          border: 'border-2 border-gray-300',
          borderRadius: 'rounded-lg',
          fontSize: 'text-sm',
          fontWeight: 'font-medium',
          shadow: 'shadow-md',
          transition: 'transition-colors'
        }
      },
      // Form System
      forms: {
        input: {
          padding: 'p-3',
          border: 'border-2 border-gray-300',
          borderRadius: 'rounded-lg',
          fontSize: 'text-sm',
          focus: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
        },
        textarea: {
          padding: 'p-3',
          border: 'border-2 border-gray-300',
          borderRadius: 'rounded-lg',
          fontSize: 'text-sm',
          focus: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          resize: 'resize-y'
        },
        label: {
          fontSize: 'text-base',
          fontWeight: 'font-medium',
          color: 'text-gray-700',
          margin: 'mb-2'
        }
      },
      // Card System
      cards: {
        default: {
          border: 'border-2 border-gray-200',
          borderRadius: 'rounded-xl',
          shadow: 'shadow-lg',
          overflow: 'overflow-hidden'
        },
        header: {
          bg: 'bg-gray-200',
          text: 'text-gray-800',
          padding: 'p-6'
        }
      },
      // Typography
      typography: {
        headings: {
          h1: 'text-4xl font-bold text-gray-800',
          h2: 'text-3xl font-bold text-gray-800',
          h3: 'text-2xl font-bold text-gray-800',
          h4: 'text-xl font-bold text-gray-800',
          h5: 'text-lg font-semibold text-gray-700'
        },
        body: {
          base: 'text-base text-gray-600',
          small: 'text-sm text-gray-600',
          muted: 'text-sm text-gray-500'
        }
      }
    }
  },

  // UI Text and Messages
  messages: {
    loading: {
      templates: 'Loading project templates...',
      project: 'Loading template...',
      saving: 'Saving...'
    },
    errors: {
      templateLoad: 'Failed to load project templates. Please try again.',
      templateNotFound: 'Template not found',
      projectLoad: 'Failed to load project file.',
      projectSave: 'Failed to save project file.',
      invalidJson: 'Error parsing JSON file',
      fileAccess: 'Error accessing file system'
    },
    success: {
      projectSaved: 'Project template saved to JSON file successfully',
      projectDownloaded: 'Project template downloaded as JSON file',
      reset: 'Reset to initial configuration'
    },
    warnings: {
      unsavedChanges: 'You have unsaved changes. Are you sure you want to continue?',
      fileCancel: 'File selection cancelled'
    },
    placeholders: {
      templateName: 'Enter template name',
      templateDescription: 'Describe this template type...',
      accountName: 'Enter account name',
      projectName: 'Enter project name',
      projectVersion: '1.0.0',
      projectDescription: 'Describe your project...',
      sectionName: 'Enter section name',
      scopeItemName: 'Enter scope item name',
      roleName: 'Enter role name',
      resourceSectionName: 'Enter resource section name'
    },
    emptyStates: {
      noSections: 'No sections defined',
      noSectionsDescription: 'Add sections to organize your project scope',
      noTemplates: 'No Templates Found',
      noTemplatesDescription: 'No project templates are available in the templates folder.',
      noRoles: 'No roles defined',
      noRolesDescription: 'Add roles to define team structure'
    }
  },

  // Component Configuration
  components: {
    maxCharacterLimits: {
      profileName: 12,
      projectName: 100,
      sectionName: 50,
      roleName: 30
    },
    pagination: {
      itemsPerPage: 10
    },
    animation: {
      transitionDuration: '200ms',
      easing: 'ease-in-out'
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
  profile1: false,
  profile2: false,
  profile3: false
});

export const getNewSectionName = (existingCount: number) => 
  `${APP_DEFAULTS.section.namePrefix} ${existingCount + 1}`;

export default APP_DEFAULTS; 
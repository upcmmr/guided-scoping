// ============================================================================
// DATA MANAGER - Handles JSON file operations for project templates
// ============================================================================

import { APP_DEFAULTS } from '../config/defaults';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ScopeItem {
  name: string;
  hours: number;
  profile1: boolean;
  profile2: boolean;
  profile3: boolean;
}

export interface ScopeSection {
  name: string;
  items: ScopeItem[];
}

export interface TeamRole {
  name: string;
  profile1: number;
  profile2: number;
  profile3: number;
}

export interface ResourceSection {
  name: string;
  region?: string;
  roles: TeamRole[];
}

export interface SizeDefinition {
  name: string;
  description: string;
  teamDescription: string;
}

export interface TeamSections {
  minDevelopers: number;
  standardDevelopers: number;
  maxDevelopers: number;
  minQaTeamFactor: number; // Minimum QA team size as percentage of development team
  standardQaTeamFactor: number; // Typical QA team size as percentage of development team
  maxQaTeamFactor: number; // Maximum QA team size as percentage of development team
  resourceSections: ResourceSection[];
}

export interface SprintSections {
  sprintLength: number;
  sprintEfficiency: number; // percentage (0-100)
}

export interface TimelineSections {
  discovery: {
    profile1: number;
    profile2: number;
    profile3: number;
  };
  uat: {
    profile1: number;
    profile2: number;
    profile3: number;
  };
  postLaunch: {
    profile1: number;
    profile2: number;
    profile3: number;
  };
}

export interface ProjectConfig {
  projectType: string;
  description: string;
  profile1: SizeDefinition;
  profile2: SizeDefinition;
  profile3: SizeDefinition;
  teamSections: TeamSections;
  sprintSections: SprintSections;
  timelineSections: TimelineSections;
  scopeSections: ScopeSection[];
}

export type ScopeData = ProjectConfig;

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Get empty scope data for app startup
 */
export const getEmptyScopeData = (): ScopeData => {
  console.log('Starting with empty scope data');
  return {
    projectType: APP_DEFAULTS.project.name,
    description: APP_DEFAULTS.project.description,
    profile1: APP_DEFAULTS.projectProfiles.profile1,
    profile2: APP_DEFAULTS.projectProfiles.profile2,
    profile3: APP_DEFAULTS.projectProfiles.profile3,
    teamSections: {
      minDevelopers: APP_DEFAULTS.developers.min,
      standardDevelopers: APP_DEFAULTS.developers.standard,
      maxDevelopers: APP_DEFAULTS.developers.max,
      minQaTeamFactor: APP_DEFAULTS.qa.minTeamFactor,
      standardQaTeamFactor: APP_DEFAULTS.qa.standardTeamFactor,
      maxQaTeamFactor: APP_DEFAULTS.qa.maxTeamFactor,
      resourceSections: APP_DEFAULTS.teamStructure.defaultResourceSections
    },
    sprintSections: {
      sprintLength: APP_DEFAULTS.sprint.length,
      sprintEfficiency: APP_DEFAULTS.sprint.efficiency
    },
    timelineSections: {
      discovery: {
        profile1: 2,
        profile2: 3,
        profile3: 4
      },
      uat: {
        profile1: 2,
        profile2: 3,
        profile3: 4
      },
      postLaunch: {
        profile1: 1,
        profile2: 2,
        profile3: 3
      }
    },
    scopeSections: []
  };
};



/**
 * Load scope data from a user-selected JSON file
 */
export const loadScopeDataFromFile = async (): Promise<ScopeData> => {
  try {
    // Check if File System Access API is supported (modern browsers)
    if ('showOpenFilePicker' in window) {
      try {
        const [fileHandle] = await (window as any).showOpenFilePicker({
          types: [{
            description: 'JSON files',
            accept: { 'application/json': ['.json'] }
          }],
          startIn: 'documents',
          multiple: false
        });
        
        const file = await fileHandle.getFile();
        const content = await file.text();
        const data = JSON.parse(content) as ScopeData;
        
        console.log(`Loaded scope data from file: ${file.name}`);
        return data;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('File selection cancelled, using empty config');
        } else {
          console.error('Error loading from file:', err);
        }
        // Return empty config on error
        return getEmptyScopeData();
      }
    } else {
      // Fallback: File input for older browsers
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e: any) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
              try {
                const data = JSON.parse(e.target.result) as ScopeData;
                console.log(`Loaded scope data from file: ${file.name}`);
                resolve(data);
              } catch (error) {
                console.error('Error parsing JSON file:', error);
                resolve(getEmptyScopeData());
              }
            };
            reader.readAsText(file);
          } else {
            resolve(getEmptyScopeData());
          }
        };
        input.click();
      });
    }
  } catch (error) {
    console.error('Error in loadScopeDataFromFile:', error);
    return getEmptyScopeData();
  }
};

/**
 * Save scope data directly to a JSON file
 */
export const saveScopeData = async (data: ScopeData): Promise<boolean> => {
  try {
    const jsonContent = JSON.stringify(data, null, APP_DEFAULTS.file.jsonIndentation);
    
    // Check if File System Access API is supported (modern browsers)
    if ('showSaveFilePicker' in window) {
      try {
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: 'project-template.json',
          types: [{
            description: 'JSON files',
            accept: { 'application/json': ['.json'] }
          }]
        });
        
        const writable = await fileHandle.createWritable();
        await writable.write(jsonContent);
        await writable.close();
        
        console.log('Project template saved to JSON file successfully');
        return true;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error using File System Access API:', err);
        }
        // Fall through to download approach
      }
    }
    
    // Fallback: Download the JSON file (for older browsers or if user cancels)
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project-template.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('Project template downloaded as JSON file');
    return true;
  } catch (error) {
    console.error('Error saving scope data:', error);
    return false;
  }
};

 
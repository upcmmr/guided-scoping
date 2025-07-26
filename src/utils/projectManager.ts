// ============================================================================
// PROJECT MANAGER - Handles JSON file operations for user project files
// ============================================================================

import { APP_DEFAULTS } from '../config/defaults';

export interface UserProject {
  accountName: string;
  projectName: string;
  description: string;
  version: string;
  numberOfDevelopers: number; // Keep for backwards compatibility
  teamSections?: {
    minDevelopers: number;
    standardDevelopers: number;
    maxDevelopers: number;
    minQaTeamFactor: number;
    standardQaTeamFactor: number;
    maxQaTeamFactor: number;
    resourceSections: Array<{
      name: string;
      region?: string;
      roles: Array<{
        name: string;
        count: number;
      }>;
    }>;
  };
  sprintSections?: {
    sprintLength: number;
    sprintEfficiency: number;
  };
  timelineSections?: {
    discovery: number;
    uat: number;
    postLaunch: number;
  };
  scopeSections: Array<{
    name: string;
    items: Array<{
      name: string;
      hours: number;
      selected: boolean; // Individual selection state
    }>;
  }>;
  customTeamRoles?: { [roleKey: string]: number }; // Custom team role counts
  selectedProfile?: 'profile1' | 'profile2' | 'profile3'; // Selected profile
  selectedTeamModel?: 'profile1' | 'profile2' | 'profile3'; // Selected team model
  templateSource?: string; // Original template filename
  createdAt: string;
  lastModified: string;
}

/**
 * Save user project data to a JSON file
 */
export const saveUserProject = async (
  projectData: any, 
  selectedItems: Map<string, boolean>,
  selectedProfile?: 'profile1' | 'profile2' | 'profile3' | null,
  selectedTeamModel?: 'profile1' | 'profile2' | 'profile3' | null,
  templateSource?: string
): Promise<boolean> => {
  try {
    // Transform scope sections - use actual user selections from the Map
    const transformedScopeSections = projectData.scopeSections.map((section: any, sectionIndex: number) => ({
      name: section.name,
      items: section.items.map((item: any, itemIndex: number) => {
        // Always use the actual user selections from the selectedItems Map
        // This preserves customizations made after profile selection
        const isSelected = selectedItems.get(`${sectionIndex}-${itemIndex}`) || false;
        
        return {
          name: item.name,
          hours: item.hours,
          selected: isSelected
        };
      })
    }));

    // Transform resource sections - convert profile-based counts to single count based on selected team model
    const transformedResourceSections = projectData.teamSections?.resourceSections?.map((section: any) => ({
      name: section.name,
      ...(section.region && { region: section.region }),
      roles: section.roles.map((role: any) => {
        // Check if role already has a count (from user modifications) or needs conversion from profiles
        if (typeof role.count === 'number') {
          // Already has count from user modifications
          return {
            name: role.name,
            count: role.count
          };
        } else {
          // Convert from profile-based structure
          let count = 0;
          
                  if (selectedTeamModel === 'profile1') {
          count = role.profile1 || 0;
        } else if (selectedTeamModel === 'profile2') {
          count = role.profile2 || 0;
        } else if (selectedTeamModel === 'profile3') {
          count = role.profile3 || 0;
        } else {
          // Default to profile2 if no team model selected
          count = role.profile2 || 0;
        }
          
          return {
            name: role.name,
            count: count
          };
        }
      })
    })) || [];

    // Create project data in template-like format with same property order as templates
    const projectSaveData = {
      // Project definition (replaces template metadata, follows template order)
      accountName: projectData.accountName || '',
      projectName: projectData.projectName || 'Untitled Project',
      description: projectData.description || '',
      version: projectData.version || '1.0.0',
      
      // Selected profile/model info (conditionally included) - convert UI names to profile IDs
      ...(selectedProfile && { selectedProfile }),
      ...(selectedTeamModel && { 
        selectedTeamModel: selectedTeamModel
      }),
      
      // Follow template order: scopeSections, teamSections, sprintSections
      scopeSections: transformedScopeSections,
      teamSections: {
        ...projectData.teamSections,
        resourceSections: transformedResourceSections
      },
      sprintSections: projectData.sprintSections,
      timelineSections: (() => {
        if (!projectData.timelineSections) return undefined;
        
        // Handle both direct number format (from user edits) and profile-based format (from templates)
        const getTimelineValue = (phase: any, defaultValue: number) => {
          if (typeof phase === 'number') {
            // Direct number format (from user edits)
            return phase;
          } else if (phase && typeof phase === 'object') {
            // Profile-based format (from templates) - extract value for selected profile
            const profileKey = selectedTeamModel || 'profile2';
            return phase[profileKey] || defaultValue;
          }
          return defaultValue;
        };
        
        return {
          discovery: getTimelineValue(projectData.timelineSections.discovery, 2),
          uat: getTimelineValue(projectData.timelineSections.uat, 3),
          postLaunch: getTimelineValue(projectData.timelineSections.postLaunch, 1)
        };
      })(),
      
      // Project-specific metadata at the end (as requested)
      templateSource: templateSource || 'unknown',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    const jsonContent = JSON.stringify(projectSaveData, null, APP_DEFAULTS.file.jsonIndentation);
    
    // Check if File System Access API is supported (modern browsers)
    if ('showSaveFilePicker' in window) {
      try {
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: `${projectSaveData.projectName?.replace(/[^a-zA-Z0-9]/g, '-') || APP_DEFAULTS.project.defaultFilename}.json`,
          types: [{
            description: 'Project files',
            accept: { 'application/json': ['.json'] }
          }]
        });
        
        const writable = await fileHandle.createWritable();
        await writable.write(jsonContent);
        await writable.close();
        
        // File saved successfully
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
          a.download = `${projectSaveData.projectName?.replace(/[^a-zA-Z0-9]/g, '-') || APP_DEFAULTS.project.defaultFilename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // File downloaded successfully
    return true;
  } catch (error) {
    console.error('Error in saveUserProject:', error);
    return false;
  }
};

/**
 * Load user project data from a JSON file
 */
export const loadUserProject = async (): Promise<UserProject | null> => {
  try {
    // Check if File System Access API is supported (modern browsers)
    if ('showOpenFilePicker' in window) {
      try {
        const [fileHandle] = await (window as any).showOpenFilePicker({
          types: [{
            description: 'Project files',
            accept: { 'application/json': ['.json'] }
          }],
          startIn: 'documents',
          multiple: false
        });
        
        const file = await fileHandle.getFile();
        const content = await file.text();
        const data = JSON.parse(content) as UserProject;
        
        console.log(`Loaded user project from file: ${file.name}`);
        return data;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // File selection cancelled
        } else {
          console.error('Error loading project file:', err);
        }
        return null;
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
                const data = JSON.parse(e.target.result) as UserProject;
                console.log(`Loaded user project from file: ${file.name}`);
                resolve(data);
              } catch (error) {
                console.error('Error parsing project JSON file:', error);
                resolve(null);
              }
            };
            reader.readAsText(file);
          } else {
            resolve(null);
          }
        };
        input.click();
      });
    }
  } catch (error) {
    console.error('Error in loadUserProject:', error);
    return null;
  }
}; 
// ============================================================================
// PROJECT MANAGER - Handles JSON file operations for user project files
// ============================================================================

export interface UserProject {
  projectType: string;
  description: string;
  numberOfDevelopers: number;
  sprintLength: number;
  sprintEfficiency: number;
  sections: Array<{
    name: string;
    items: Array<{
      name: string;
      hours: number;
      selected: boolean; // Individual selection state
    }>;
  }>;
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
  templateSource?: string
): Promise<boolean> => {
  try {
    // Transform sections to remove S/M/L and add selected field
    const transformedSections = projectData.sections.map((section: any, sectionIndex: number) => ({
      name: section.name,
      items: section.items.map((item: any, itemIndex: number) => {
        const isSelected = selectedItems.get(`${sectionIndex}-${itemIndex}`) || false;
        return {
          name: item.name,
          hours: item.hours,
          selected: isSelected
          // Explicitly excluding small, medium, large
        };
      })
    }));

    const userProject: UserProject = {
      projectType: projectData.projectType,
      description: projectData.description,
      numberOfDevelopers: projectData.numberOfDevelopers,
      sprintLength: projectData.sprintLength,
      sprintEfficiency: projectData.sprintEfficiency,
      sections: transformedSections,
      templateSource: templateSource || 'unknown',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    const jsonContent = JSON.stringify(userProject, null, 2);
    
    // Check if File System Access API is supported (modern browsers)
    if ('showSaveFilePicker' in window) {
      try {
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: `${projectData.projectType?.replace(/[^a-zA-Z0-9]/g, '-') || 'project'}.json`,
          types: [{
            description: 'Project files',
            accept: { 'application/json': ['.json'] }
          }]
        });
        
        const writable = await fileHandle.createWritable();
        await writable.write(jsonContent);
        await writable.close();
        
        console.log('User project saved to JSON file successfully');
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
    a.download = `${projectData.projectType?.replace(/[^a-zA-Z0-9]/g, '-') || 'project'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('User project downloaded as JSON file');
    return true;
  } catch (error) {
    console.error('Error saving user project:', error);
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
          console.log('File selection cancelled');
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
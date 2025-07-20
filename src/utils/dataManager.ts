// Default configuration data (replaces the deleted JSON file)
const initialScopeData = [
  {
    "name": "Section 1",
    "description": "Basic project scope section",
    "items": [
      { "name": "Basic API Integration", "hours": 40, "small": true, "medium": true, "large": true },
      { "name": "Database Setup", "hours": 24, "small": true, "medium": true, "large": true },
      { "name": "User Authentication", "hours": 32, "small": false, "medium": true, "large": true }
    ]
  },
  {
    "name": "Section 2", 
    "description": "Frontend development scope",
    "items": [
      { "name": "UI Components", "hours": 48, "small": true, "medium": true, "large": true },
      { "name": "Responsive Design", "hours": 24, "small": false, "medium": true, "large": true }
    ]
  }
];

export interface ScopeItem {
  name: string;
  hours: number;
  small: boolean;
  medium: boolean;
  large: boolean;
}

export interface ScopeSection {
  name: string;
  description: string;
  items: ScopeItem[];
}

export type ScopeData = ScopeSection[];

const STORAGE_KEY = 'scoping_tool_data';
const CONFIG_VERSION_KEY = 'scoping_tool_config_version';
const CURRENT_CONFIG_VERSION = '1.0';

/**
 * Load scope data with the following priority:
 * 1. From localStorage (user modifications)
 * 2. From JSON config file (initial data)
 */
/**
 * Load scope data from a selected JSON file
 */
export const loadScopeDataFromFile = async (): Promise<ScopeData> => {
  try {
    // Check if File System Access API is supported
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
          console.log('File selection cancelled, using default config');
        } else {
          console.error('Error loading from file:', err);
        }
        // Fall through to default
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
                resolve(getDefaultScopeData());
              }
            };
            reader.readAsText(file);
          } else {
            resolve(getDefaultScopeData());
          }
        };
        input.click();
      });
    }
    
    // If no file selected or API not supported, use default
    return getDefaultScopeData();
  } catch (error) {
    console.error('Error in loadScopeDataFromFile:', error);
    return getDefaultScopeData();
  }
};

/**
 * Get default scope data from the bundled config
 */
export const getDefaultScopeData = (): ScopeData => {
  console.log('Loading default scope data from bundled config');
  return JSON.parse(JSON.stringify(initialScopeData)) as ScopeData;
};

/**
 * Load scope data (keeping for compatibility)
 */
export const loadScopeData = (): ScopeData => {
  return getDefaultScopeData();
};

/**
 * Save scope data directly to JSON file (using File System Access API)
 */
export const saveScopeData = async (data: ScopeData): Promise<boolean> => {
  try {
    const jsonContent = JSON.stringify(data, null, 2);
    
    // Check if File System Access API is supported
    if ('showSaveFilePicker' in window) {
      try {
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: 'initialScopeData.json',
          types: [{
            description: 'JSON files',
            accept: { 'application/json': ['.json'] }
          }]
        });
        
        const writable = await fileHandle.createWritable();
        await writable.write(jsonContent);
        await writable.close();
        
        console.log('Scope data saved to JSON file successfully');
        return true;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error using File System Access API:', err);
        }
        // Fall through to download approach
      }
    }
    
    // Fallback: Download the JSON file
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'initialScopeData.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('Scope data downloaded as JSON file');
    return true;
  } catch (error) {
    console.error('Error saving scope data:', error);
    return false;
  }
};

/**
 * Reset to initial configuration
 */
export const resetToInitialConfig = (): ScopeData => {
  try {
    // Clear localStorage
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CONFIG_VERSION_KEY);
    
    // Return fresh copy of initial data
    const data = JSON.parse(JSON.stringify(initialScopeData)) as ScopeData;
    
    // Data is ready to use
    
    console.log('Reset to initial configuration');
    return data;
  } catch (error) {
    console.error('Error resetting to initial config:', error);
    return JSON.parse(JSON.stringify(initialScopeData)) as ScopeData;
  }
};

/**
 * Export current configuration as JSON for backup/sharing
 */
export const exportConfiguration = (data: ScopeData): string => {
  return JSON.stringify(data, null, 2);
};

/**
 * Import configuration from JSON string
 */
export const importConfiguration = (jsonString: string): ScopeData => {
  try {
    const importedData = JSON.parse(jsonString) as ScopeData;
    
    // Validate the structure
    if (!Array.isArray(importedData)) {
      throw new Error('Invalid data format: expected array');
    }
    
    importedData.forEach((section, index) => {
      if (!section.name || !section.description || !Array.isArray(section.items)) {
        throw new Error(`Invalid section format at index ${index}`);
      }
    });
    
    // Save the imported data
    saveScopeData(importedData);
    
    console.log('Configuration imported successfully');
    return importedData;
  } catch (error) {
    console.error('Error importing configuration:', error);
    throw error;
  }
}; 
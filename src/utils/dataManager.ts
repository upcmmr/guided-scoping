// ============================================================================
// DATA MANAGER - Handles JSON file operations for scope configuration
// ============================================================================

// Default configuration data (used only for reset functionality)
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

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

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

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Get empty scope data for app startup
 */
export const getEmptyScopeData = (): ScopeData => {
  console.log('Starting with empty scope data');
  return [];
};

/**
 * Get default scope data from the bundled configuration (used for reset only)
 */
export const getDefaultScopeData = (): ScopeData => {
  console.log('Loading default scope data from bundled config');
  return JSON.parse(JSON.stringify(initialScopeData)) as ScopeData;
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
 * Save scope data directly to a JSON file
 */
export const saveScopeData = async (data: ScopeData): Promise<boolean> => {
  try {
    const jsonContent = JSON.stringify(data, null, 2);
    
    // Check if File System Access API is supported (modern browsers)
    if ('showSaveFilePicker' in window) {
      try {
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: 'scope-configuration.json',
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
    
    // Fallback: Download the JSON file (for older browsers or if user cancels)
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scope-configuration.json';
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
    const data = JSON.parse(JSON.stringify(initialScopeData)) as ScopeData;
    console.log('Reset to initial configuration');
    return data;
  } catch (error) {
    console.error('Error resetting to initial config:', error);
    return JSON.parse(JSON.stringify(initialScopeData)) as ScopeData;
  }
}; 
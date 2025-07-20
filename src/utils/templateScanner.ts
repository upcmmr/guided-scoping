// ============================================================================
// TEMPLATE SCANNER - Handles scanning and loading project templates
// ============================================================================

export interface TemplateMetadata {
  filename: string;
  projectType: string;
  description: string;
  numberOfDevelopers: number;
  sprintLength: number;
  sprintEfficiency: number;
  sectionsCount: number;
  totalItems: number;
}

// Dynamic template loading using Vite's glob imports
const templateModules = import.meta.glob('../../project_templates/*.json', { eager: true });

/**
 * Get the list of available template files
 */
const getTemplateFilenames = (): string[] => {
  return Object.keys(templateModules).map(path => {
    // Extract filename from path: '../../project_templates/b2c-commerce.json' -> 'b2c-commerce.json'
    return path.split('/').pop() || '';
  }).filter(filename => filename.endsWith('.json'));
};

/**
 * Load template data from the modules registry
 */
const getTemplateData = (filename: string): any => {
  // Find the module that corresponds to this filename
  const modulePath = Object.keys(templateModules).find(path => path.endsWith(`/${filename}`));
  if (!modulePath) {
    return null;
  }
  
  const module = templateModules[modulePath] as any;
  return module.default || module;
};

/**
 * Load template metadata from a specific template
 */
export const loadTemplateMetadata = async (filename: string): Promise<TemplateMetadata | null> => {
  try {
    const template = getTemplateData(filename);
    
    if (!template) {
      console.error(`Template not found: ${filename}`);
      return null;
    }
    
    // Calculate statistics
    const sectionsCount = template.sections?.length || 0;
    const totalItems = template.sections?.reduce((total: number, section: any) => 
      total + (section.items?.length || 0), 0) || 0;
    
    return {
      filename,
      projectType: template.projectType || 'Unknown Project',
      description: template.description || 'No description available',
      numberOfDevelopers: template.numberOfDevelopers || 1,
      sprintLength: template.sprintLength || 14,
      sprintEfficiency: template.sprintEfficiency || 80,
      sectionsCount,
      totalItems,
    };
  } catch (error) {
    console.error(`Error loading template metadata for ${filename}:`, error);
    return null;
  }
};

/**
 * Load all available template metadata
 */
export const loadAllTemplateMetadata = async (): Promise<TemplateMetadata[]> => {
  try {
    const filenames = getTemplateFilenames();
    console.log('Found template files:', filenames);
    
    const metadataPromises = filenames.map(filename => loadTemplateMetadata(filename));
    const metadataResults = await Promise.all(metadataPromises);
    
    // Filter out null results (failed loads)
    const validMetadata = metadataResults.filter((metadata): metadata is TemplateMetadata => 
      metadata !== null
    );
    
    console.log('Loaded template metadata:', validMetadata);
    return validMetadata;
  } catch (error) {
    console.error('Error loading template metadata:', error);
    return [];
  }
};

/**
 * Load complete template data for a specific template
 */
export const loadCompleteTemplate = async (filename: string): Promise<any> => {
  try {
    const template = getTemplateData(filename);
    
    if (!template) {
      throw new Error(`Template not found: ${filename}`);
    }
    
    console.log(`Loaded complete template data for: ${filename}`);
    return template;
  } catch (error) {
    console.error(`Error loading complete template for ${filename}:`, error);
    throw error;
  }
}; 
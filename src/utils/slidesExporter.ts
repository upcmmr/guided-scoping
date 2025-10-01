// ============================================================================
// SLIDES EXPORTER - Handles Google Slides export functionality
// ============================================================================

import { TimelinePhaseData } from './timelineImageGenerator';
import { getAppsScriptConfig, validateAppsScriptUrl } from './config';

export interface SlidesExportData {
  projectName: string;
  timelineImage?: string; // base64
  scopeData: ScopeSlideData;
  costsData: CostsSlideData;
}

export interface ScopeSlideData {
  sections: Array<{
    name: string;
    items: string[];
  }>;
}



export interface CostsSlideData {
  breakdown: {
    [region: string]: Array<{
      role: string;
      count: number;
      rate: string;
      totalCost: string;
    }>;
  };
  totalBid: string;
}

export interface SlidesExportResult {
  success: boolean;
  presentationId?: string;
  presentationUrl?: string;
  error?: string;
}

/**
 * Main export function - prepares data and sends to Google Apps Script
 */
export const exportToGoogleSlides = async (
  projectData: any,
  bidCalculation: any,
  scopeSelections: Map<string, boolean>
): Promise<SlidesExportResult> => {
  try {
    // Prepare export data
    const exportData = await prepareSlidesExportData(
      projectData,
      bidCalculation,
      scopeSelections
    );

    // Send to Apps Script
    const result = await sendToAppsScript(exportData);
    return result;

  } catch (error) {
    console.error('Export to slides failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Prepares all data for slides export
 */
const prepareSlidesExportData = async (
  projectData: any,
  bidCalculation: any,
  scopeSelections: Map<string, boolean>
): Promise<SlidesExportData> => {
  
  // Generate timeline image
  let timelineBase64: string | undefined;
  try {
    const timelineData: TimelinePhaseData = {
      discovery: bidCalculation.duration.discovery,
      sprints: bidCalculation.duration.sprints,
      sprintsCount: bidCalculation.duration.sprintsCount || 0,
      uat: bidCalculation.duration.uat,
      postLaunch: bidCalculation.duration.postLaunch,
      total: bidCalculation.duration.total
    };

    const timelineBlob = await generateTimelineImageForSlides(timelineData, projectData);
    timelineBase64 = await blobToBase64(timelineBlob);
  } catch (error) {
    console.warn('Failed to generate timeline image:', error);
    // Continue without image
  }

  return {
    projectName: projectData?.projectName || 'Project Proposal',
    timelineImage: timelineBase64,
    scopeData: extractScopeData(projectData, scopeSelections),
    costsData: extractCostsData(bidCalculation)
  };
};

/**
 * Generates timeline image optimized for slides
 */
const generateTimelineImageForSlides = async (
  timelineData: TimelinePhaseData,
  projectData: any
) => {
  const { generateTimelineImage } = await import('./timelineImageGenerator');
  
  return await generateTimelineImage(timelineData, {
    width: 1920,  // Much higher resolution for crisp rendering
    height: 800,  // Maintains good aspect ratio
    projectName: projectData?.projectName || 'Project Timeline',
    sprintLength: projectData?.sprintSections?.sprintLength || 10
  });
};

/**
 * Converts blob to base64 string
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Extracts scope data for slides
 */
const extractScopeData = (
  projectData: any,
  scopeSelections: Map<string, boolean>
): ScopeSlideData => {
  const sections: Array<{ name: string; items: string[] }> = [];

  if (projectData?.scopeSections) {
    projectData.scopeSections.forEach((section: any, sectionIndex: number) => {
      const selectedItems: string[] = [];

      section.items?.forEach((item: any, itemIndex: number) => {
        const key = `${sectionIndex}-${itemIndex}`;
        if (scopeSelections?.get(key)) {
          selectedItems.push(item.name);
        }
      });

      if (selectedItems.length > 0) {
        sections.push({
          name: section.name,
          items: selectedItems
        });
      }
    });
  }

  return { sections };
};



/**
 * Extracts costs data for slides
 */
const extractCostsData = (bidCalculation: any): CostsSlideData => {
  const breakdown: { [region: string]: Array<any> } = {};

  if (bidCalculation.teamCosts?.breakdown) {
    Object.entries(bidCalculation.teamCosts.breakdown).forEach(([region, roles]) => {
      if (Array.isArray(roles)) {
        breakdown[region] = roles.map((role: any) => ({
          role: role.role,
          count: role.count,
          rate: formatCurrency(role.rate),
          totalCost: formatCurrency(role.totalCost)
        }));
      }
    });
  }

  return {
    breakdown,
    totalBid: formatCurrency(bidCalculation.totalBid)
  };
};

/**
 * Formats currency for display
 */
const formatCurrency = (amount: number): string => {
  if (typeof amount !== 'number') return 'N/A';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Sends data to Google Apps Script using the proven working method
 */
const sendToAppsScript = async (data: SlidesExportData): Promise<SlidesExportResult> => {
  try {
    // Get Apps Script configuration
    const config = getAppsScriptConfig();
    
    // Validate the URL
    if (!validateAppsScriptUrl(config.url)) {
      throw new Error('Invalid Google Apps Script URL configuration. Please check your environment variables or default configuration.');
    }
    
    console.log('Sending data to Apps Script:', { 
      projectName: data.projectName,
      scopeSections: data.scopeData?.sections?.length || 0,
      costsData: data.costsData,
      hasTimelineImage: !!data.timelineImage,
      appsScriptUrl: config.url
    });
    
    // Use the exact same approach that worked in PowerShell
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      mode: 'no-cors' // This is the key - don't try to read the response
    });

    // With no-cors, we can't read the response, but the request will go through
    // The Apps Script will still process it and create the slides
    console.log('Request sent to Apps Script');
    
    // Since we can't get the actual response, we'll open the Apps Script URL
    // in a new tab so the user can see the result
    setTimeout(() => {
      window.open(config.url, '_blank');
    }, config.resultTabDelay);

    return {
      success: true,
      presentationUrl: 'Check the new tab for your presentation'
    };

  } catch (error) {
    console.error('Apps Script communication error:', error);
    throw new Error(
      error instanceof Error 
        ? `Export failed: ${error.message}`
        : 'Failed to communicate with Google Apps Script'
    );
  }
};

/**
 * Validates export data before sending
 */
export const validateExportData = (data: SlidesExportData): boolean => {
  if (!data.projectName) return false;
  if (!data.scopeData || !Array.isArray(data.scopeData.sections)) return false;
  if (!data.costsData || !data.costsData.totalBid) return false;
  
  return true;
};

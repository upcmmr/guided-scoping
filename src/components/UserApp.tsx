// ============================================================================
// USER APP - End user interface for project scoping
// ============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, Layers, CheckSquare, Square, FolderOpen, Plus, X, Trash2, ChevronUp, ChevronDown, Settings } from 'lucide-react';
import TemplateSelector from './TemplateSelector';
import BidDisplay from './BidDisplay';
import { loadCompleteTemplate } from '../utils/templateScanner';
import type { TemplateMetadata } from '../utils/templateScanner';
import { saveUserProject, loadUserProject } from '../utils/projectManager';
import { APP_DEFAULTS, getNewSectionName } from '../config/defaults';
import { getButtonClasses, getInputClasses, getTextareaClasses, getLabelClasses, getHeadingClasses, getBodyClasses, iconSizes } from '../utils/styleUtils';
import { getUniqueRoleNames, getUniqueRegions } from '../utils/rolesManager';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface UserAppProps {
  onSwitchToAdmin?: () => void;
}

type UserAppState = 'landing' | 'selectTemplate' | 'scoping';

interface SizeDefinition {
  name: string;
  description: string;
  teamDescription: string;
}

interface ProjectScopeItem {
  name: string;
  hours: number;
  profile1?: boolean;
  profile2?: boolean;
  profile3?: boolean;
  selected?: boolean; // For saved project files
}

interface ProjectSection {
  name: string;
  items: ProjectScopeItem[];
}

interface SectionTotal {
  name: string;
  items: number;
  hours: number;
}

interface ProjectData {
  accountName: string;
  projectName: string;
  description: string;
  version: string;
  profile1?: SizeDefinition;
  profile2?: SizeDefinition;
  profile3?: SizeDefinition;
  numberOfDevelopers?: number;
  teamSections: {
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
        profile1: number;
        profile2: number;
        profile3: number;
      }>;
    }>;
  };
  sprintSections: {
    sprintLength: number;
    sprintEfficiency: number;
  };
  timelineSections?: {
    discovery: number | {
      profile1: number;
      profile2: number;
      profile3: number;
    };
    uat: number | {
      profile1: number;
      profile2: number;
      profile3: number;
    };
    postLaunch: number | {
      profile1: number;
      profile2: number;
      profile3: number;
    };
  };
  scopeSections: ProjectSection[];
  customTeamRoles?: { [roleKey: string]: number };
  selectedTeamModel?: 'profile1' | 'profile2' | 'profile3';
  selectedProfile?: string;
  templateSource?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Creates template metadata from project data
 */
const createTemplateMetadata = (projectData: any, filename?: string): TemplateMetadata => {
  return {
    filename: filename || projectData.templateSource || 'loaded-project',
    projectType: projectData.projectName || projectData.projectType || 'Loaded Project',
    description: projectData.description || '',
    teamSections: {
      minDevelopers: projectData.teamSections?.minDevelopers || APP_DEFAULTS.templateFallbacks.teamSections.minDevelopers,
      standardDevelopers: projectData.teamSections?.standardDevelopers || projectData.numberOfDevelopers || APP_DEFAULTS.templateFallbacks.teamSections.standardDevelopers,
      maxDevelopers: projectData.teamSections?.maxDevelopers || (projectData.numberOfDevelopers || APP_DEFAULTS.templateFallbacks.teamSections.standardDevelopers) * APP_DEFAULTS.userProject.developerMultiplierForMax,
      minQaTeamFactor: projectData.teamSections?.minQaTeamFactor || APP_DEFAULTS.qa.minTeamFactor,
      standardQaTeamFactor: projectData.teamSections?.standardQaTeamFactor || APP_DEFAULTS.qa.standardTeamFactor,
      maxQaTeamFactor: projectData.teamSections?.maxQaTeamFactor || APP_DEFAULTS.qa.maxTeamFactor,
    },
    sprintSections: {
      sprintLength: projectData.sprintSections?.sprintLength || APP_DEFAULTS.sprint.length,
      sprintEfficiency: projectData.sprintSections?.sprintEfficiency || APP_DEFAULTS.sprint.efficiency,
    },
    sectionsCount: projectData.scopeSections?.length || 0,
    totalItems: projectData.scopeSections?.reduce((total: number, section: any) => total + section.items.length, 0) || 0
  };
};

/**
 * Converts team model from profile ID format to consistent profile format
 */
const convertTeamModelFromProfile = (teamModel: string): 'profile1' | 'profile2' | 'profile3' | null => {
  switch (teamModel) {
    case 'profile1': return 'profile1';
    case 'profile2': return 'profile2';
    case 'profile3': return 'profile3';
    default: return null;
  }
};

/**
 * Restores item selections from project data
 */
const restoreItemSelections = (scopeSections: ProjectSection[]): Map<string, boolean> => {
  const selections = new Map<string, boolean>();
  if (scopeSections && Array.isArray(scopeSections)) {
    scopeSections.forEach((section: ProjectSection, sectionIndex: number) => {
      section.items.forEach((item: ProjectScopeItem, itemIndex: number) => {
        selections.set(`${sectionIndex}-${itemIndex}`, item.selected || false);
      });
    });
  }
  return selections;
};

/**
 * Common state setup for both template and project loading
 */
interface StateSetupParams {
  projectData: any;
  templateMetadata: TemplateMetadata;
  isFromTemplate: boolean;
  selectedProfile?: string | null;
  selectedTeamModel?: string | null;
  itemSelections?: Map<string, boolean>;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const UserApp: React.FC<UserAppProps> = ({ onSwitchToAdmin }) => {
  const [currentState, setCurrentState] = useState<UserAppState>('landing');
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateMetadata | null>(null);
  const [templateData, setTemplateData] = useState<ProjectData | null>(null);
  const [editableData, setEditableData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(false);
  const [itemSelections, setItemSelections] = useState<Map<string, boolean>>(new Map());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [cameFromTemplate, setCameFromTemplate] = useState(false);
  const [selectedSize, setSelectedSize] = useState<'profile1' | 'profile2' | 'profile3' | null>(null);
  const [showCustomize, setShowCustomize] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDevelopers, setSelectedDevelopers] = useState<number>(APP_DEFAULTS.developers.standard);
  const [selectedQaPercentage, setSelectedQaPercentage] = useState<number>(APP_DEFAULTS.qa.standardTeamFactor);
  const [selectedTeamModel, setSelectedTeamModel] = useState<'profile1' | 'profile2' | 'profile3' | null>(null);
  const [showTeamDetails, setShowTeamDetails] = useState(false);
  const [isTeamEditMode, setIsTeamEditMode] = useState(false);
  const [customTeamRoles, setCustomTeamRoles] = useState<Map<string, number>>(new Map());
  const [teamRoleSelections, setTeamRoleSelections] = useState<Map<string, boolean>>(new Map());
  const [showSprintDetails, setShowSprintDetails] = useState(false);
  const [showHoursDetails, setShowHoursDetails] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);

  // ============================================================================
  // PROJECT/TEMPLATE LOADING LOGIC
  // ============================================================================

  /**
   * Common state setup function used by both template and project loading
   */
  const setupApplicationState = useCallback((params: StateSetupParams) => {
    const { projectData, templateMetadata, isFromTemplate, selectedProfile, selectedTeamModel, itemSelections: customSelections } = params;

    // Only set profile if explicitly provided (for templates, this should be null to require user selection)
    if (selectedProfile) {
      setSelectedSize(selectedProfile as 'profile1' | 'profile2' | 'profile3');
    } else {
      setSelectedSize(null); // Ensure profile is cleared - user must select
    }

    // Set main data
    setEditableData({
      accountName: projectData.accountName || '',
      projectName: projectData.projectName || projectData.projectType || '',
      description: projectData.description || '',
      version: projectData.version || '1.0.0',
      numberOfDevelopers: projectData.numberOfDevelopers,
      teamSections: projectData.teamSections || {
        minDevelopers: APP_DEFAULTS.templateFallbacks.teamSections.minDevelopers,
        standardDevelopers: APP_DEFAULTS.templateFallbacks.teamSections.standardDevelopers,
        maxDevelopers: APP_DEFAULTS.templateFallbacks.teamSections.maxDevelopers,
        minQaTeamFactor: APP_DEFAULTS.qa.minTeamFactor,
        standardQaTeamFactor: APP_DEFAULTS.qa.standardTeamFactor,
        maxQaTeamFactor: APP_DEFAULTS.qa.maxTeamFactor,
        resourceSections: projectData.teamSections?.resourceSections || []
      },
      sprintSections: projectData.sprintSections || {
        sprintLength: APP_DEFAULTS.sprint.length,
        sprintEfficiency: APP_DEFAULTS.sprint.efficiency
      },
      timelineSections: projectData.timelineSections || {
        discovery: 2,
        uat: 3,
        postLaunch: 1
      },
      scopeSections: projectData.scopeSections?.map((section: ProjectSection) => ({
        name: section.name,
        items: section.items.map((item: ProjectScopeItem) => ({
          name: item.name,
          hours: item.hours
        }))
      })) || []
    });

    // Set template metadata and data
    setSelectedTemplate(templateMetadata);
    setTemplateData(projectData as any);

    // Set selections
    if (customSelections) {
      setItemSelections(customSelections);
    }

    // Set team model
    if (selectedTeamModel) {
      const uiTeamModel = convertTeamModelFromProfile(selectedTeamModel);
      if (uiTeamModel) {
        setSelectedTeamModel(uiTeamModel);
      }
    }

    // Restore team customization if available
    if (projectData.customTeamRoles) {
      const restoredTeamRoles = new Map<string, number>();
      Object.entries(projectData.customTeamRoles).forEach(([key, value]) => {
        restoredTeamRoles.set(key, value as number);
      });
      setCustomTeamRoles(restoredTeamRoles);
    }

    // Set UI defaults
    setSelectedDevelopers(projectData.teamSections?.standardDevelopers || projectData.numberOfDevelopers || APP_DEFAULTS.developers.standard);
    setSelectedQaPercentage(projectData.teamSections?.standardQaTeamFactor || APP_DEFAULTS.qa.standardTeamFactor);

    // Batch final state updates
    setHasUnsavedChanges(false);
    setCameFromTemplate(isFromTemplate);
    // For project files with selected profile, show customize details immediately
    // For templates, don't show until profile is selected
    setShowCustomize(!isFromTemplate && !!selectedProfile);
    setIsEditMode(!isFromTemplate && !!selectedProfile); // Project files start in edit mode
    setIsTeamEditMode(!isFromTemplate); // Team starts in edit mode for project files, not for templates
    setCurrentState('scoping');
  }, []);

  const handleOpenProjectFile = useCallback(async () => {
    try {
      const projectData = await loadUserProject();
      
      if (projectData) {
        const templateMetadata = createTemplateMetadata(projectData);
        const itemSelections = restoreItemSelections(projectData.scopeSections || []);
        
        setupApplicationState({
          projectData,
          templateMetadata,
          isFromTemplate: false, // This is a project file, not a template
          selectedProfile: projectData.selectedProfile || null, // Restore saved profile selection
          selectedTeamModel: projectData.selectedTeamModel,
          itemSelections
        });
        
        // State will be set properly by setupApplicationState
      }
    } catch (error) {
      console.error('Error opening project file:', error);
      alert('Failed to open project file.');
    }
  }, [setupApplicationState]);

  const handleTemplateSelected = useCallback(async (template: TemplateMetadata) => {
    try {
      setLoading(true);
      const completeTemplate = await loadCompleteTemplate(template.filename) as any;
      
      // Initialize all items as unselected for new template
      const initialSelections = new Map<string, boolean>();
      completeTemplate.scopeSections?.forEach((section: ProjectSection, sectionIndex: number) => {
        section.items.forEach((item: ProjectScopeItem, itemIndex: number) => {
          initialSelections.set(`${sectionIndex}-${itemIndex}`, false);
        });
      });

      // Reset team customization for new template
      setCustomTeamRoles(new Map());
      setTeamRoleSelections(new Map());
      setSelectedTeamModel(null);
      setIsTeamEditMode(false);
      setShowTeamDetails(false);

      const enhancedTemplate = {
        ...completeTemplate,
        accountName: '',
        version: '1.0.0'
      };

      setupApplicationState({
        projectData: enhancedTemplate,
        templateMetadata: template,
        isFromTemplate: true,
        selectedProfile: null, // No profile selected for new template
        selectedTeamModel: null,
        itemSelections: initialSelections
      });

      // Reset profile selection for new template
      setSelectedSize(null);
      
    } catch (error) {
      console.error('Failed to load template:', error);
      alert('Failed to load the selected template. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [setupApplicationState]);

  // Sync CSS custom properties with config values
  useEffect(() => {
    const root = document.documentElement;
    const sliderConfig = APP_DEFAULTS.ui.slider;
    
    root.style.setProperty('--slider-primary-color', sliderConfig.primaryColor);
    root.style.setProperty('--slider-background-color', sliderConfig.backgroundColor);
    root.style.setProperty('--slider-thumb-border-color', sliderConfig.thumbBorderColor);
    root.style.setProperty('--slider-track-height', sliderConfig.trackHeight);
    root.style.setProperty('--slider-track-border-radius', sliderConfig.trackBorderRadius);
    root.style.setProperty('--slider-thumb-size', sliderConfig.thumbSize);
    root.style.setProperty('--slider-thumb-border-width', sliderConfig.thumbBorderWidth);
    root.style.setProperty('--slider-box-shadow', sliderConfig.boxShadow);
    root.style.setProperty('--slider-hover-box-shadow', sliderConfig.hoverBoxShadow);
    root.style.setProperty('--slider-thumb-scale', sliderConfig.thumbScale.toString());
  }, []);

  const handleStartWithTemplate = () => {
    setShowTemplates(true);
  };

  const handleBackToLanding = () => {
    if (hasUnsavedChanges) {
      setShowExitWarning(true);
    } else {
      performExit();
    }
  };

  const performExit = () => {
    setCurrentState('landing');
    setShowTemplates(false);
    setSelectedTemplate(null);
    setTemplateData(null);
    setEditableData(null);
    setItemSelections(new Map());
    setHasUnsavedChanges(false);
    setShowExitWarning(false);
    setCameFromTemplate(false);
    setSelectedSize(null);
    setShowCustomize(false);
    setIsEditMode(false);
    setSelectedDevelopers(APP_DEFAULTS.developers.standard);
    setSelectedQaPercentage(APP_DEFAULTS.qa.standardTeamFactor);
    setSelectedTeamModel(null);
  };

  const handleSaveProject = async () => {
    if (!editableData || !selectedTemplate) return false;
    
    // Debug logging to help identify the issue
    console.log('Attempting to save project with data:', {
      editableData,
      itemSelections,
      templateFilename: selectedTemplate.filename
    });
    
    try {
      // Add custom team roles and selected team model to editable data before saving
      const dataToSave = {
        ...editableData,
        customTeamRoles: Object.fromEntries(customTeamRoles),
        selectedTeamModel: selectedTeamModel
      };
      
      const success = await saveUserProject(
        dataToSave,
        itemSelections,
        selectedSize,
        selectedTeamModel,
        selectedTemplate.filename
      );
      
      if (success) {
        setHasUnsavedChanges(false);
        return true;
      } else {
        console.error('Save project returned false - check browser console for details');
        alert('Failed to save project. Please check the browser console for details and try again.');
        return false;
      }
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Failed to save project. Please try again.');
      return false;
    }
  };

  const handleSaveAndExit = async () => {
    const success = await handleSaveProject();
    if (success) {
      performExit();
    }
  };

  const handleExitWithoutSaving = () => {
    performExit();
  };

  const handleCancelExit = () => {
    setShowExitWarning(false);
  };

  const handleGenerateBid = () => {
    setShowBidModal(true);
  };

  const handleCloseBidModal = () => {
    setShowBidModal(false);
  };

  const updateProjectInfo = (field: string, value: string | number) => {
    if (!editableData) return;
    
    // Handle nested properties for teamSections and sprintSections
    if (field.includes('.')) {
      const [section, property] = field.split('.');
      setEditableData({
        ...editableData,
        [section]: {
          ...editableData[section as keyof ProjectData] as any,
          [property]: value
        }
      });
    } else {
      setEditableData({
        ...editableData,
        [field]: value
      });
    }
    setHasUnsavedChanges(true);
  };

  // Section management functions
  const addNewSection = () => {
    if (!editableData) return;
    
    const newSection = {
      name: getNewSectionName(editableData.scopeSections.length),
      items: []
    };

    setEditableData((prev) => prev ? ({
      ...prev,
      scopeSections: [...prev.scopeSections, newSection]
    }) : null);
    setHasUnsavedChanges(true);
  };

  const removeSection = (sectionIndex: number) => {
    setEditableData((prev) => prev ? ({
      ...prev,
      scopeSections: prev.scopeSections.filter((_, index: number) => index !== sectionIndex)
    }) : null);
    // Update item selections to remove items from deleted section
    const newSelections = new Map<string, boolean>();
    itemSelections.forEach((selected, key) => {
      const [secIndex] = key.split('-').map(Number);
      if (secIndex !== sectionIndex) {
        // Adjust section indices for sections after the deleted one
        if (secIndex > sectionIndex) {
          const [, itemIndex] = key.split('-').map(Number);
          newSelections.set(`${secIndex - 1}-${itemIndex}`, selected);
        } else {
          newSelections.set(key, selected);
        }
      }
    });
    setItemSelections(newSelections);
    setHasUnsavedChanges(true);
  };

  const updateSectionInfo = (sectionIndex: number, field: string, value: string) => {
    setEditableData((prev: any) => ({
      ...prev,
      scopeSections: prev.scopeSections.map((section: any, index: number) => 
        index === sectionIndex ? { ...section, [field]: value } : section
      )
    }));
    setHasUnsavedChanges(true);
  };

  // Scope item management functions
  const addScopeItem = (sectionIndex: number) => {
    const newItem = {
      name: APP_DEFAULTS.scopeItem.defaultName,
      hours: APP_DEFAULTS.scopeItem.defaultHours
    };

    setEditableData((prev: any) => ({
      ...prev,
      scopeSections: prev.scopeSections.map((section: any, index: number) => 
        index === sectionIndex 
          ? { ...section, items: [...section.items, newItem] }
          : section
      )
    }));
    setHasUnsavedChanges(true);
  };

  const removeScopeItem = (sectionIndex: number, itemIndex: number) => {
    setEditableData((prev: any) => ({
      ...prev,
      scopeSections: prev.scopeSections.map((section: any, index: number) => 
        index === sectionIndex 
          ? { ...section, items: section.items.filter((_: any, idx: number) => idx !== itemIndex) }
          : section
      )
    }));
    // Remove from selections
    const key = `${sectionIndex}-${itemIndex}`;
    const newSelections = new Map(itemSelections);
    newSelections.delete(key);
    // Adjust indices for items after the deleted one
    itemSelections.forEach((selected, selectionKey) => {
      const [secIndex, itmIndex] = selectionKey.split('-').map(Number);
      if (secIndex === sectionIndex && itmIndex > itemIndex) {
        newSelections.delete(selectionKey);
        newSelections.set(`${secIndex}-${itmIndex - 1}`, selected);
      }
    });
    setItemSelections(newSelections);
    setHasUnsavedChanges(true);
  };

  const updateScopeItem = (sectionIndex: number, itemIndex: number, updates: any) => {
    setEditableData((prev: any) => ({
      ...prev,
      scopeSections: prev.scopeSections.map((section: any, secIndex: number) => 
        secIndex === sectionIndex 
          ? {
              ...section,
              items: section.items.map((item: any, itmIndex: number) =>
                itmIndex === itemIndex ? { ...item, ...updates } : item
              )
            }
          : section
      )
    }));
    setHasUnsavedChanges(true);
  };

  const moveItemUp = (sectionIndex: number, itemIndex: number) => {
    if (itemIndex === 0) return;
    
    setEditableData((prev: any) => ({
      ...prev,
      scopeSections: prev.scopeSections.map((section: any, secIndex: number) => {
        if (secIndex === sectionIndex) {
          const newItems = [...section.items];
          [newItems[itemIndex], newItems[itemIndex - 1]] = [newItems[itemIndex - 1], newItems[itemIndex]];
          return { ...section, items: newItems };
        }
        return section;
      })
    }));
    
    // Update selections
    const currentKey = `${sectionIndex}-${itemIndex}`;
    const previousKey = `${sectionIndex}-${itemIndex - 1}`;
    const currentSelected = itemSelections.get(currentKey);
    const previousSelected = itemSelections.get(previousKey);
    
    const newSelections = new Map(itemSelections);
    newSelections.set(currentKey, previousSelected || false);
    newSelections.set(previousKey, currentSelected || false);
    setItemSelections(newSelections);
    setHasUnsavedChanges(true);
  };

  // Team role management functions
  const addTeamResourceSection = () => {
    if (!editableData) return;
    
    const newSection = {
      name: `Resource Section ${(editableData.teamSections?.resourceSections?.length || 0) + 1}`,
      roles: []
    };
    
    setEditableData((prev: any) => ({
      ...prev,
      teamSections: {
        ...prev.teamSections,
        resourceSections: [...(prev?.teamSections.resourceSections || []), newSection]
      }
    }));
    
    setHasUnsavedChanges(true);
  };

  const removeTeamResourceSection = (sectionIndex: number) => {
    setEditableData((prev: any) => ({
      ...prev,
      teamSections: {
        ...prev.teamSections,
        resourceSections: prev?.teamSections.resourceSections?.filter((_: any, index: number) => index !== sectionIndex) || []
      }
    }));
    
    setHasUnsavedChanges(true);
  };

  const addTeamRole = (sectionIndex: number) => {
    if (!editableData?.teamSections.resourceSections) return;
    
    const newRole = {
      name: 'New Role',
      profile1: 0,
      profile2: 0,
      profile3: 0
    };
    
    setEditableData((prev: any) => {
      const newSections = [...(prev?.teamSections.resourceSections || [])];
      if (newSections[sectionIndex]) {
        newSections[sectionIndex] = {
          ...newSections[sectionIndex],
          roles: [...(newSections[sectionIndex].roles || []), newRole]
        };
      }
      
      return {
        ...prev,
        teamSections: {
          ...prev.teamSections,
          resourceSections: newSections
        }
      };
    });
    
    setHasUnsavedChanges(true);
  };

  const removeTeamRole = (sectionIndex: number, roleIndex: number) => {
    setEditableData((prev: any) => {
      const newSections = [...(prev?.teamSections.resourceSections || [])];
      if (newSections[sectionIndex]) {
        newSections[sectionIndex] = {
          ...newSections[sectionIndex],
          roles: newSections[sectionIndex].roles?.filter((_: any, index: number) => index !== roleIndex) || []
        };
      }
      
      return {
        ...prev,
        teamSections: {
          ...prev.teamSections,
          resourceSections: newSections
        }
      };
    });
    
    setHasUnsavedChanges(true);
  };

  const updateTeamRoleName = (sectionIndex: number, roleIndex: number, newName: string) => {
    setEditableData((prev: any) => {
      const newSections = [...(prev?.teamSections.resourceSections || [])];
      if (newSections[sectionIndex]?.roles[roleIndex]) {
        newSections[sectionIndex].roles[roleIndex] = {
          ...newSections[sectionIndex].roles[roleIndex],
          name: newName
        };
      }
      
      return {
        ...prev,
        teamSections: {
          ...prev.teamSections,
          resourceSections: newSections
        }
      };
    });
    
    setHasUnsavedChanges(true);
  };

  const updateTeamResourceSectionName = (sectionIndex: number, newName: string) => {
    setEditableData((prev: any) => {
      const newSections = [...(prev?.teamSections.resourceSections || [])];
      if (newSections[sectionIndex]) {
        newSections[sectionIndex] = {
          ...newSections[sectionIndex],
          name: newName
        };
      }
      
      return {
        ...prev,
        teamSections: {
          ...prev.teamSections,
          resourceSections: newSections
        }
      };
    });
    
    setHasUnsavedChanges(true);
  };

  const updateTeamResourceSectionRegion = (sectionIndex: number, newRegion: string) => {
    setEditableData((prev: any) => {
      const newSections = [...(prev?.teamSections.resourceSections || [])];
      if (newSections[sectionIndex]) {
        newSections[sectionIndex] = {
          ...newSections[sectionIndex],
          region: newRegion
        };
      }
      
      return {
        ...prev,
        teamSections: {
          ...prev.teamSections,
          resourceSections: newSections
        }
      };
    });
    
    setHasUnsavedChanges(true);
  };

  // Function to update timeline values
  const updateTimelineValue = (phase: 'discovery' | 'uat' | 'postLaunch', value: number) => {
    setEditableData((prev: any) => {
      return {
        ...prev,
        timelineSections: {
          ...prev.timelineSections,
          [phase]: value
        }
      };
    });
    
    setHasUnsavedChanges(true);
  };

  const moveTeamRoleUp = (sectionIndex: number, roleIndex: number) => {
    if (roleIndex === 0) return;
    
    setEditableData((prev: any) => {
      const newSections = [...(prev?.teamSections.resourceSections || [])];
      if (newSections[sectionIndex]?.roles) {
        const newRoles = [...newSections[sectionIndex].roles];
        [newRoles[roleIndex], newRoles[roleIndex - 1]] = [newRoles[roleIndex - 1], newRoles[roleIndex]];
        newSections[sectionIndex] = {
          ...newSections[sectionIndex],
          roles: newRoles
        };
      }
      
      return {
        ...prev,
        teamSections: {
          ...prev.teamSections,
          resourceSections: newSections
        }
      };
    });
    
    setHasUnsavedChanges(true);
  };

  const moveTeamRoleDown = (sectionIndex: number, roleIndex: number) => {
    setEditableData((prev: any) => {
      const newSections = [...(prev?.teamSections.resourceSections || [])];
      if (newSections[sectionIndex]?.roles && roleIndex < newSections[sectionIndex].roles.length - 1) {
        const newRoles = [...newSections[sectionIndex].roles];
        [newRoles[roleIndex], newRoles[roleIndex + 1]] = [newRoles[roleIndex + 1], newRoles[roleIndex]];
        newSections[sectionIndex] = {
          ...newSections[sectionIndex],
          roles: newRoles
        };
      }
      
      return {
        ...prev,
        teamSections: {
          ...prev.teamSections,
          resourceSections: newSections
        }
      };
    });
    
    setHasUnsavedChanges(true);
  };

  const toggleTeamRoleSelection = (sectionIndex: number, roleIndex: number) => {
    const key = `${sectionIndex}-${roleIndex}`;
    const newSelections = new Map(teamRoleSelections);
    newSelections.set(key, !newSelections.get(key));
    setTeamRoleSelections(newSelections);
    setHasUnsavedChanges(true);
  };

  const moveItemDown = (sectionIndex: number, itemIndex: number) => {
    if (!editableData) return;
    
    const sectionLength = editableData.scopeSections[sectionIndex]?.items.length || 0;
    if (itemIndex >= sectionLength - 1) return;
    
    setEditableData((prev: any) => ({
      ...prev,
      scopeSections: prev.scopeSections.map((section: any, secIndex: number) => {
        if (secIndex === sectionIndex) {
          const newItems = [...section.items];
          [newItems[itemIndex], newItems[itemIndex + 1]] = [newItems[itemIndex + 1], newItems[itemIndex]];
          return { ...section, items: newItems };
        }
        return section;
      })
    }));
    
    // Update selections
    const currentKey = `${sectionIndex}-${itemIndex}`;
    const nextKey = `${sectionIndex}-${itemIndex + 1}`;
    const currentSelected = itemSelections.get(currentKey);
    const nextSelected = itemSelections.get(nextKey);
    
    const newSelections = new Map(itemSelections);
    newSelections.set(currentKey, nextSelected || false);
    newSelections.set(nextKey, currentSelected || false);
    setItemSelections(newSelections);
    setHasUnsavedChanges(true);
  };



  const toggleItemSelection = (sectionIndex: number, itemIndex: number) => {
    const key = `${sectionIndex}-${itemIndex}`;
    setItemSelections(prev => {
      const newMap = new Map(prev);
      const currentValue = newMap.get(key) || false;
      const newValue = !currentValue;
      newMap.set(key, newValue);
      return newMap;
    });
    setHasUnsavedChanges(true);
  };

  const getSelectedItemsCount = () => {
    return Array.from(itemSelections.values()).filter(selected => selected).length;
  };

  const getTotalHours = useMemo(() => {
    if (!editableData) return 0;
    let total = 0;
    editableData.scopeSections.forEach((section: ProjectSection, sectionIndex: number) => {
      section.items.forEach((item: ProjectScopeItem, itemIndex: number) => {
        const key = `${sectionIndex}-${itemIndex}`;
        if (itemSelections.get(key)) {
          total += item.hours || 0;
        }
      });
    });
    return total;
  }, [editableData, itemSelections]);

    const getSectionTotals = useMemo(() => {
    if (!editableData) return [];
    return editableData.scopeSections.map((section: ProjectSection, sectionIndex: number) => {
      let sectionHours = 0;
      let sectionItems = 0;
      section.items.forEach((item: ProjectScopeItem, itemIndex: number) => {
        const key = `${sectionIndex}-${itemIndex}`;
        if (itemSelections.get(key)) {
          sectionHours += item.hours || 0;
          sectionItems += 1;
        }
      });
      return {
        name: section.name,
        hours: sectionHours,
        items: sectionItems
      };
    }).filter((section: SectionTotal) => section.items > 0); // Only show sections with selected items
  }, [editableData, itemSelections]);

  // Validation for Generate Bid button
  const isBidGenerationEnabled = useMemo(() => {
    // Check if project information is complete
    const hasProjectInfo = !!(editableData?.projectName && editableData?.description);
    
    // Check if project scope is selected - calculate inline to avoid dependency issues
    const hasScopeSelection = !!(editableData && editableData.scopeSections && 
      editableData.scopeSections.some((section: ProjectSection, sectionIndex: number) => {
        return section.items.some((item: ProjectScopeItem, itemIndex: number) => {
          const key = `${sectionIndex}-${itemIndex}`;
          return itemSelections.get(key);
        });
      }));
    
    // Check if user has selected a team profile (profile1, profile2, or profile3)
    const hasTeamProfileSelected = selectedTeamModel !== null;
    
    // Check if team configuration is properly set up with actual roles and counts
    const hasTeamConfiguration = !!(editableData?.teamSections?.resourceSections && 
      editableData.teamSections.resourceSections.length > 0 &&
      editableData.teamSections.resourceSections.some(section => 
        section.roles && section.roles.length > 0 && 
        section.roles.some(role => {
          // Check if any profile has a count > 0
          const hasProfile1Count = role.profile1 && role.profile1 > 0;
          const hasProfile2Count = role.profile2 && role.profile2 > 0;
          const hasProfile3Count = role.profile3 && role.profile3 > 0;
          return hasProfile1Count || hasProfile2Count || hasProfile3Count;
        })
      ));
    
    // Only enable if ALL conditions are met: project info, scope, team profile selected, AND fully configured team
    return hasProjectInfo && hasScopeSelection && hasTeamProfileSelected && hasTeamConfiguration;
  }, [
    editableData?.projectName, 
    editableData?.description, 
    editableData?.scopeSections,
    itemSelections,
    selectedTeamModel,
    editableData?.teamSections?.resourceSections
  ]);

  // Helper function to calculate sprint capacity
  const calculateSprintCapacity = () => {
    if (!editableData || !selectedTemplate) return 0;
    
    const sprintDays = editableData.sprintSections?.sprintLength || APP_DEFAULTS.sprint.length;
    const efficiencyPercent = editableData.sprintSections?.sprintEfficiency || APP_DEFAULTS.sprint.efficiency;
    const efficiency = efficiencyPercent / APP_DEFAULTS.sprintPlanning.percentageConversion;
    
    return selectedDevelopers * sprintDays * APP_DEFAULTS.sprintPlanning.hoursPerDay * efficiency;
  };

  const calculateSprints = useCallback(() => {
    if (getTotalHours === 0) return 0;
    
    const capacityPerSprint = calculateSprintCapacity();
    if (capacityPerSprint === 0) return 0;
    
    // Calculate number of sprints needed (round up)
    return Math.ceil(getTotalHours / capacityPerSprint);
  }, [editableData, selectedTemplate, selectedDevelopers, itemSelections]);

  const handleSizeSelection = (size: 'profile1' | 'profile2' | 'profile3') => {
    if (!templateData) return;
    
    const newSelections = new Map<string, boolean>();
    
    templateData.scopeSections.forEach((section: any, sectionIndex: number) => {
      section.items.forEach((item: any, itemIndex: number) => {
        const key = `${sectionIndex}-${itemIndex}`;
        // Select item if it has the chosen size flag set to true
        const shouldSelect = item[size] === true;
        newSelections.set(key, shouldSelect);
      });
    });
    
    setItemSelections(newSelections);
    setSelectedSize(size);
    setHasUnsavedChanges(true);
  };



  // Loading state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading template...</p>
        </div>
      </div>
    );
  }

    // Landing Page - Choose how to start
  if (currentState === 'landing') {
    return (
      <div className="max-w-7xl mx-auto p-6 min-h-screen">
        {/* Separate Header Box - Match admin panel structure */}
        <div className="rounded-lg shadow-md mb-6 bg-white">
          <div className="p-8 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className={`${getHeadingClasses('h1')} mb-2`}>Bid Generator</h1>
                <p className={getBodyClasses('base')}>Start a new project or continue working on an existing one.</p>
              </div>
              <div className="flex-shrink-0 ml-8">
                <img 
                  src="/assets/Salesforce-logo.png" 
                  alt="Salesforce Logo" 
                  className="h-16 w-auto"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Container */}
        <div className="border-2 border-gray-300 rounded-lg shadow-md p-6 mb-6">
          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Start with Template Option */}
            <div 
              className="border-2 border-gray-200 rounded-xl p-8 cursor-pointer hover:border-blue-300 hover:shadow-lg transition-all group"
              onClick={handleStartWithTemplate}
            >
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Plus className="w-10 h-10 text-blue-600" />
                </div>
                <h2 className={`${getHeadingClasses('h2')} mb-4`}>Start with a Template</h2>
                <p className={`${getBodyClasses('base')} mb-6 leading-relaxed`}>
                  Choose from pre-configured project templates that include common scope items and settings for different project types.
                </p>
                <div className="flex items-center justify-center text-blue-600 font-medium">
                  <span>Browse Templates</span>
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </div>
              </div>
            </div>

            {/* Open Project File Option */}
            <div 
              className="border-2 border-gray-200 rounded-xl p-8 cursor-pointer hover:border-green-300 hover:shadow-lg transition-all group"
              onClick={handleOpenProjectFile}
            >
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <FolderOpen className="w-10 h-10 text-green-600" />
                </div>
                <h2 className={`${getHeadingClasses('h2')} mb-4`}>Open Project File</h2>
                <p className={`${getBodyClasses('base')} mb-6 leading-relaxed`}>
                  Continue working on a project you've already started by loading your saved project file with your previous selections.
                </p>
                <div className="flex items-center justify-center text-green-600 font-medium">
                  <span>Browse Files</span>
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </div>
                </div>
              </div>
            </div>

            {/* Help Text */}
            {!showTemplates && (
            <div className="text-center mt-12">
              <p className="text-gray-500 text-sm max-w-2xl mx-auto">
                New to project scoping? Start with a template to get pre-configured scope items for your project type. If you've been working on a project, open your saved project file to continue where you left off.
                </p>
              </div>
            )}
        </div>

        {/* Template Selection - Shown inline when templates are visible */}
        {showTemplates && (
          <div className="mt-8">
            <TemplateSelector 
              onTemplateSelected={handleTemplateSelected}
              inline={true}
            />
          </div>
        )}
      </div>
    );
  }

    // Scoping Interface - Show project info and profile selection, scope sections only after profile selected  
  if (currentState === 'scoping' && selectedTemplate && editableData) {
    return (
      <div className="max-w-7xl mx-auto p-6 min-h-screen">
        {/* Separate Header Box - Match admin panel structure */}
        <div className="rounded-lg shadow-md mb-6 bg-white">
          <div className="p-8 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-800 mb-2">Bid Generator</h1>
                <p className="text-base text-gray-600">Configure your project settings and select the scope items that apply.</p>
              </div>
              <div className="flex-shrink-0 ml-8">
                <img 
                  src="/assets/Salesforce-logo.png" 
                  alt="Salesforce Logo" 
                  className="h-16 w-auto"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Container - Match admin panel structure */}
        <div className="border-2 border-gray-300 rounded-lg shadow-md p-6 mb-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Project Details</h3>
              {hasUnsavedChanges && (
              <p className="text-sm text-gray-600 mt-1">
                  Unsaved changes
              </p>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleBackToLanding}
                className={getButtonClasses('secondary')}
              >
                <X className={`${iconSizes.small} mr-1`} />
                Exit
              </button>
              
              <button
                onClick={handleSaveProject}
                disabled={!hasUnsavedChanges}
                className={hasUnsavedChanges ? getButtonClasses('primary') : 'flex items-center px-3 py-2 bg-gray-400 text-gray-700 cursor-not-allowed rounded-lg text-sm font-medium transition-colors'}
              >
                Save Project
              </button>
            </div>
          </div>

          {/* Project Information - Always at top */}
          <div className="border-2 border-gray-200 rounded-xl shadow-lg mb-8 overflow-hidden">
            <div className="bg-gray-200 text-gray-800 p-6">
              <h4 className="text-xl font-bold text-gray-800 mb-2">1. Project Information</h4>
              <p className="text-gray-600 mt-1 text-base">Define your project details and basic information</p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
                <div className="md:col-span-2">
                  <label className={getLabelClasses()}>Account Name</label>
                  <input
                    type="text"
                    value={editableData?.accountName || ''}
                    onChange={(e) => updateProjectInfo('accountName', e.target.value)}
                    className={getInputClasses()}
                    placeholder={APP_DEFAULTS.messages.placeholders.accountName}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={getLabelClasses()}>Project Name</label>
                  <input
                    type="text"
                    value={editableData?.projectName || ''}
                    onChange={(e) => updateProjectInfo('projectName', e.target.value)}
                    className={getInputClasses()}
                    placeholder={APP_DEFAULTS.messages.placeholders.projectName}
                  />
                </div>
                <div className="md:col-span-1">
                  <label className={getLabelClasses()}>Version Number</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={editableData?.version || '1'}
                    onChange={(e) => updateProjectInfo('version', e.target.value)}
                    className={getInputClasses()}
                    placeholder={APP_DEFAULTS.messages.placeholders.projectVersion}
                  />
                </div>
              </div>
              <div>
                <label className={getLabelClasses()}>Description</label>
                <textarea
                  rows={3}
                  value={editableData?.description || ''}
                  onChange={(e) => updateProjectInfo('description', e.target.value)}
                  className={getTextareaClasses()}
                  placeholder={APP_DEFAULTS.messages.placeholders.projectDescription}
                />
              </div>
            </div>
          </div>

          {/* Size Selector - Show for both template and project loading, but with different behavior */}
          <div className="border-2 border-gray-200 rounded-xl shadow-lg mb-0 overflow-hidden">
            <div className="bg-gray-200 text-gray-800 p-6">
              <h4 className="text-xl font-bold text-gray-800 mb-2">2. Project Scope</h4>
              <p className="text-gray-600 mt-1 text-base">
                {cameFromTemplate 
                  ? "Choose your project size to automatically select the right scope for your needs"
                  : "Project profile selection (from saved project)"
                }
              </p>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => cameFromTemplate && !isEditMode && handleSizeSelection('profile1')}
                  disabled={!cameFromTemplate || isEditMode}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    !cameFromTemplate || isEditMode
                      ? selectedSize === 'profile1'
                        ? 'border-gray-500 bg-gray-300 text-gray-700 cursor-not-allowed' // Selected but disabled (darker grey)
                        : 'border-gray-300 bg-gray-200 text-gray-500 cursor-not-allowed' // Not selected and disabled (lighter grey)
                      : selectedSize === 'profile1'
                      ? 'border-green-500 bg-green-50 text-green-800'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-green-300 hover:bg-green-50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg font-bold mb-2">{templateData?.profile1?.name || 'Profile 1'}</div>
                    <div className="text-base text-gray-600">{templateData?.profile1?.description || 'Essential features only'}</div>
                  </div>
                </button>
                
                <button
                  onClick={() => cameFromTemplate && !isEditMode && handleSizeSelection('profile2')}
                  disabled={!cameFromTemplate || isEditMode}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    !cameFromTemplate || isEditMode
                      ? selectedSize === 'profile2'
                        ? 'border-gray-500 bg-gray-300 text-gray-700 cursor-not-allowed' // Selected but disabled (darker grey)
                        : 'border-gray-300 bg-gray-200 text-gray-500 cursor-not-allowed' // Not selected and disabled (lighter grey)
                      : selectedSize === 'profile2'
                      ? 'border-yellow-500 bg-yellow-50 text-yellow-800'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-yellow-300 hover:bg-yellow-50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg font-bold mb-2">{templateData?.profile2?.name || 'Profile 2'}</div>
                    <div className="text-base text-gray-600">{templateData?.profile2?.description || 'Standard feature set'}</div>
                  </div>
                </button>
                
                <button
                  onClick={() => cameFromTemplate && !isEditMode && handleSizeSelection('profile3')}
                  disabled={!cameFromTemplate || isEditMode}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    !cameFromTemplate || isEditMode
                      ? selectedSize === 'profile3'
                        ? 'border-gray-500 bg-gray-300 text-gray-700 cursor-not-allowed' // Selected but disabled (darker grey)
                        : 'border-gray-300 bg-gray-200 text-gray-500 cursor-not-allowed' // Not selected and disabled (lighter grey)
                      : selectedSize === 'profile3'
                      ? 'border-red-500 bg-red-50 text-red-800'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-red-300 hover:bg-red-50'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg font-bold mb-2">{templateData?.profile3?.name || 'Profile 3'}</div>
                    <div className="text-base text-gray-600">{templateData?.profile3?.description || 'Comprehensive features'}</div>
                  </div>
                </button>
              </div>
                
                {/* Show Details / Customize Button - Only show for templates when profile is selected */}
                {selectedSize && cameFromTemplate && !isEditMode && (
                  <div className="mt-6 pt-4 border-t border-gray-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">
                          View details of the selected profile.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowCustomize(!showCustomize)}
                        className={getButtonClasses('secondary')}
                      >
                        {showCustomize ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-2" />
                            Hide Details
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-2" />
                            Show Details
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}



                {/* Detailed Scope Content - Integrated within same container */}
                {showCustomize && (
                  <div className="border-t border-gray-300 pt-6 mt-6">
                {!isEditMode && cameFromTemplate && (
                  <div className="mb-6">
                    <h4 className="text-xl font-bold text-gray-800 mb-2">Customize Your Project Scope</h4>
                    <div className="text-center">
                      <p className="text-gray-700 mb-4">
                        Click "Customize" below to modify the standard scope definition to meet your specific project needs. 
                        You can adjust work estimates, add custom requirements, or remove unnecessary components.
                      </p>
                      <button
                        onClick={() => setIsEditMode(true)}
                        className={`px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-base font-medium transition-colors`}
                      >
                        Customize
                      </button>
                    </div>
                  </div>
                )}
                      {!selectedSize ? (
              <div className="text-center py-8">
                <p className={getBodyClasses()}>Please select a project profile above to view scope sections.</p>
              </div>
            ) : editableData.scopeSections.length === 0 ? (
            <div className="text-center py-12 text-gray-500 rounded-lg border-2 border-dashed border-gray-300">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">
                <Layers className="w-8 h-8 text-gray-400" />
              </div>
              <p className="mb-4 font-medium">No sections defined</p>
              <p className="text-sm text-gray-400 mb-6">{isEditMode ? 'Add sections to organize your project scope' : 'No scope items available'}</p>
              {isEditMode && selectedSize && (
              <button
                onClick={addNewSection}
                                        className={`${getButtonClasses('success')} mx-auto`}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Section
              </button>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {selectedSize && editableData.scopeSections.map((sectionData: any, sectionIndex: number) => (
                <div key={sectionIndex} className="border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {/* Section Header */}
                  <div className={`${isEditMode ? 'bg-gray-200' : 'bg-gray-100'} text-gray-800 p-6`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xl font-bold text-gray-800 mb-2">{sectionData.name || 'Unnamed Section'}</h4>
                        {!cameFromTemplate && !isEditMode && (
                          <p className="text-sm text-gray-600">Read-only view from saved project</p>
                        )}
                      </div>
                      {isEditMode && editableData.scopeSections.length > 1 && (
                        <button
                          onClick={() => removeSection(sectionIndex)}
                          className={getButtonClasses('danger')}
                        >
                          <Trash2 className={`${iconSizes.small} mr-2`} />
                          Delete Section
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Section Configuration Form */}
                  {isEditMode && (
                  <div className="border-b border-gray-300 p-6">
                    <div>
                      <label className={getLabelClasses()}>Section Name</label>
                      <input
                        type="text"
                        value={sectionData.name || ''}
                        onChange={(e) => updateSectionInfo(sectionIndex, 'name', e.target.value)}
                        className={getInputClasses()}
                        placeholder={APP_DEFAULTS.messages.placeholders.sectionName}
                      />
                    </div>
                  </div>
                  )}
                  
                  {/* Scope Items */}
                  <div className="p-6">
                    <div className="mb-6">
                      <h5 className={`text-base font-semibold text-gray-700 mb-2 flex items-center`}>
                        <Plus className="w-5 h-5 mr-2 text-green-600" />
                        Selected Scope Items: ({
                          sectionData.items.filter((_: any, itemIndex: number) => 
                            itemSelections.get(`${sectionIndex}-${itemIndex}`) || false
                          ).length
                        }) of ({sectionData.items.length})
                      </h5>
                    </div>
                    
                    <div className="space-y-3">
                      {sectionData.items.map((item: any, itemIndex: number) => {
                        const key = `${sectionIndex}-${itemIndex}`;
                        const isSelected = itemSelections.get(key) || false;
                                                  return (
                            <div 
                              key={key} 
                            className={`flex items-center gap-4 p-4 border-2 rounded-lg shadow-sm transition-all ${
                              !isEditMode 
                                ? 'border-gray-200 bg-gray-50 opacity-75'
                                : isSelected 
                                ? 'border-gray-400 bg-gray-100' 
                                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                            }`}
                          >
                            {/* Selection Checkbox - Larger clickable area */}
                            <div 
                              className={`flex-shrink-0 p-2 rounded transition-colors ${
                                isEditMode 
                                  ? 'cursor-pointer hover:bg-gray-100' 
                                  : 'cursor-default'
                              }`}
                              onClick={(e) => {
                                if (isEditMode) {
                                e.stopPropagation();
                                toggleItemSelection(sectionIndex, itemIndex);
                                }
                              }}
                              title={isEditMode ? (isSelected ? "Deselect item" : "Select item") : "View only"}
                            >
                              {isSelected ? (
                                <CheckSquare className={`w-6 h-6 ${isEditMode ? 'text-blue-700' : 'text-gray-500'}`} />
                              ) : (
                                <Square className={`w-6 h-6 ${isEditMode ? 'text-gray-500 hover:text-gray-700' : 'text-gray-400'}`} />
                              )}
                            </div>

                            {/* Reorder Controls */}
                            {isEditMode && (
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveItemUp(sectionIndex, itemIndex);
                                }}
                                disabled={itemIndex === 0}
                                className={`p-1 rounded transition-colors ${
                                  itemIndex === 0 
                                    ? 'text-gray-300 cursor-not-allowed' 
                                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-100'
                                }`}
                                title="Move up"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveItemDown(sectionIndex, itemIndex);
                                }}
                                disabled={itemIndex === sectionData.items.length - 1}
                                className={`p-1 rounded transition-colors ${
                                  itemIndex === sectionData.items.length - 1
                                    ? 'text-gray-300 cursor-not-allowed' 
                                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-100'
                                }`}
                                title="Move down"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                            </div>
                            )}

                            {/* Item Name */}
                            <div className="flex-1">
                              <input
                                type="text"
                                value={item.name || ''}
                                onChange={(e) => isEditMode && updateScopeItem(sectionIndex, itemIndex, { name: e.target.value })}
                                onClick={(e) => e.stopPropagation()}
                                readOnly={!isEditMode}
                                className={`w-full p-3 border-2 rounded-lg text-sm ${
                                  !isEditMode 
                                    ? 'border-gray-200 bg-gray-100 text-gray-600 cursor-default'
                                    : `border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                  isSelected ? 'bg-gray-100' : 'bg-white'
                                      }`
                                }`}
                                placeholder="Scope item name"
                              />
                            </div>

                            {/* Hours */}
                            <div className="flex items-center gap-3">
                              <input
                                type="number"
                                min="0"
                                value={item.hours || 0}
                                onChange={(e) => isEditMode && updateScopeItem(sectionIndex, itemIndex, { hours: parseInt(e.target.value) || 0 })}
                                onClick={(e) => e.stopPropagation()}
                                readOnly={!isEditMode}
                                className={`w-20 p-3 border-2 rounded-lg text-sm text-center ${
                                  !isEditMode 
                                    ? 'border-gray-200 bg-gray-100 text-gray-600 cursor-default'
                                    : `border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                  isSelected ? 'bg-gray-100' : 'bg-white'
                                      }`
                                }`}
                              />
                              <span className="text-sm text-gray-500">hrs</span>
                            </div>

                            {/* Delete Button */}
                            {isEditMode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeScopeItem(sectionIndex, itemIndex);
                              }}
                              className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                              title="Remove item"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            )}
                          </div>
                        );
                      })}
                      
                      {sectionData.items.length === 0 && (
                        <div className="text-center py-12 text-gray-500 rounded-lg border-2 border-dashed border-gray-300">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">
                            <Plus className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="mb-4 font-medium">No scope items in this section yet</p>
                          {isEditMode && (
                          <button
                            onClick={() => addScopeItem(sectionIndex)}
                            className={`${getButtonClasses('primary')} mx-auto`}
                          >
                            <Plus className={`${iconSizes.small} mr-2`} />
                            Add First Item
                          </button>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Add Item Button */}
                    {isEditMode && sectionData.items.length > 0 && (
                      <div className="mt-6 flex justify-center">
                                              <button
                        onClick={() => addScopeItem(sectionIndex)}
                        className={getButtonClasses('success')}
                      >
                        <Plus className={`${iconSizes.small} mr-2`} />
                        Add Item
                      </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
                    {/* Add Section Button - Only show if there are existing sections */}
          {isEditMode && selectedSize && editableData.scopeSections.length > 0 && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={addNewSection}
                className={getButtonClasses('success')}
              >
                <Plus className={`${iconSizes.small} mr-2`} />
                Add New Section
              </button>
            </div>
          )}
                  </div>
                )}
              </div>
            </div>

          {/* 3. Sprint Configuration Section */}
          {selectedTemplate && (getSectionTotals.length > 0 || !cameFromTemplate) && (
            <div className="mt-8 border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gray-200 text-gray-800 p-6">
                                              <h4 className="text-xl font-bold text-gray-800 mb-2">3. Sprint Configuration</h4>
                <p className="text-gray-600 mt-1 text-base">Review total hours, adjust team size, and estimate project timeline</p>
            </div>
            
            <div className="p-6 bg-white space-y-8">
              {getSectionTotals.length > 0 || !cameFromTemplate ? (
                <>
                  {/* 1. Development Hours Section */}
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-xl font-bold text-gray-800">Development Hours</h4>
                      <button
                        onClick={() => setShowHoursDetails(!showHoursDetails)}
                        className={getButtonClasses('secondary')}
                      >
                        {showHoursDetails ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-2" />
                            Hide Details
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-2" />
                            Show Details
                          </>
                        )}
                      </button>
                    </div>
                    
                    {/* Section Totals - Only show when details are visible */}
                    {showHoursDetails && (
                      <div className="space-y-3 mb-6">
                        {getSectionTotals.map((section: SectionTotal, index: number) => (
                          <div key={index} className="flex justify-between items-center py-2 px-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              <span className="font-medium text-gray-800">{section.name}</span>
                              <span className="text-base text-gray-600 ml-2">({section.items} items)</span>
                </div>
                            <div className="font-semibold text-gray-800">
                              {section.hours} hours
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Grand Total - Always visible */}
                    <div className={`${showHoursDetails ? 'border-t border-gray-200 pt-4' : ''}`}>
                      <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                        <div className="flex items-center">
                          <span className="text-lg font-medium text-gray-800">Total Development Hours</span>
                                                      <span className="text-base text-gray-600 ml-2">({getSelectedItemsCount()} items selected)</span>
                                                  </div>
                          <div className="text-lg font-medium text-gray-800">
                            {getTotalHours} hours
                          </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg font-medium">No scope selected</p>
                  <p className="text-base text-gray-600 mt-1">Select scope to reveal project configuration</p>
                </div>
              )}

              {/* 2. Sprint Planning Section */}
              {selectedTemplate && (getSectionTotals.length > 0 || !cameFromTemplate) && (
                <div className="border-t border-gray-200 pt-8">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-xl font-bold text-gray-800">Sprint Planning</h4>
                    <button
                      onClick={() => setShowSprintDetails(!showSprintDetails)}
                                              className={getButtonClasses('secondary')}
                    >
                      {showSprintDetails ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-2" />
                          Hide Details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-2" />
                          Show Details
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* Configuration Details - Toggleable */}
                  {showSprintDetails && (
                    <>
                      {/* Sprint Configuration */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                                              <h5 className="text-base font-semibold text-gray-700 mb-2">Sprint Settings</h5>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                                                      <label className="block text-base font-medium text-gray-700 mb-2">
                                Sprint Duration (working days)
                              </label>
                                                      <input
                                type="number"
                                min="1"
                                max="30"
                                value={editableData?.sprintSections.sprintLength || APP_DEFAULTS.sprint.length}
                                onChange={(e) => updateProjectInfo('sprintSections.sprintLength', parseInt(e.target.value) || APP_DEFAULTS.sprint.length)}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-md text-base text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                            />
                          </div>
                          <div>
                                                      <label className="block text-base font-medium text-gray-700 mb-2">
                                Sprint Efficiency (%)
                              </label>
                            <div className="relative">
                                                        <input
                                  type="number"
                                  min="1"
                                  max="100"
                                  value={editableData?.sprintSections.sprintEfficiency || APP_DEFAULTS.sprint.efficiency}
                                  onChange={(e) => updateProjectInfo('sprintSections.sprintEfficiency', parseInt(e.target.value) || APP_DEFAULTS.sprint.efficiency)}
                                  className={`w-full px-3 py-2 pr-8 border border-gray-300 rounded-md text-base text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                              />
                              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Team Size Configuration - Side by Side */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Developer Team Size */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <h5 className="text-base font-semibold text-gray-700 mb-2">Developer Team Size</h5>
                          
                          <label className="block text-base font-medium text-gray-700 mb-2">
                            Number of Developers: {selectedDevelopers}
                          </label>
                          
                          <input
                            type="range"
                            min={selectedTemplate.teamSections.minDevelopers}
                            max={selectedTemplate.teamSections.maxDevelopers}
                            step="1"
                            value={selectedDevelopers}
                            onChange={(e) => setSelectedDevelopers(parseInt(e.target.value))}
                            className="w-full mb-2 focus:outline-none slider"
                          />
                          
                          <div className="flex justify-between text-sm text-gray-500">
                            <span>{selectedTemplate.teamSections.minDevelopers}</span>
                            <span>{selectedTemplate.teamSections.maxDevelopers}</span>
                          </div>
                        </div>

                        {/* QA Team Size */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <h5 className="text-base font-semibold text-gray-700 mb-2">QA Team Size</h5>
                          
                          <label className="block text-base font-medium text-gray-700 mb-2">
                            QA Consultants: {selectedQaPercentage}% ({Math.ceil((selectedDevelopers * selectedQaPercentage) / 100)} consultants)
                          </label>
                          
                          <input
                            type="range"
                            min={selectedTemplate?.teamSections.minQaTeamFactor || APP_DEFAULTS.qa.minTeamFactor}
                            max={selectedTemplate?.teamSections.maxQaTeamFactor || APP_DEFAULTS.qa.maxTeamFactor}
                            step="10"
                            value={selectedQaPercentage}
                            onChange={(e) => {
                              const newValue = parseInt(e.target.value);
                              setSelectedQaPercentage(newValue);
                              updateProjectInfo('teamSections.standardQaTeamFactor', newValue);
                            }}
                            className="w-full mb-2 focus:outline-none slider"
                          />
                          
                          <div className="flex justify-between text-sm text-gray-500">
                            <span>{selectedTemplate?.teamSections.minQaTeamFactor || APP_DEFAULTS.qa.minTeamFactor}%</span>
                            <span>{selectedTemplate?.teamSections.maxQaTeamFactor || APP_DEFAULTS.qa.maxTeamFactor}%</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Sprint Timeline Results */}
                  {(getTotalHours > 0 || !cameFromTemplate) && (() => {
                    const totalProjectHours = getTotalHours;
                    const sprintCount = calculateSprints();
                    const capacityPerSprint = calculateSprintCapacity();
                    const totalSprintCapacity = Math.round(sprintCount * capacityPerSprint);
                    const remainderHours = totalSprintCapacity - totalProjectHours;
                    const remainderPercentage = Math.round((remainderHours / totalSprintCapacity) * 100);

                                          return (
                        <div className="space-y-4">
                          {/* Estimated Sprint Count - Always visible */}
                          <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                            <div>
                              <span className="text-lg font-medium text-gray-800">Estimated Sprint Count</span>
                              <span className="text-base text-gray-600 ml-2">
                                (Sprint duration: {editableData?.sprintSections.sprintLength || APP_DEFAULTS.sprint.length} working days, Sprint efficiency: {editableData?.sprintSections.sprintEfficiency || APP_DEFAULTS.sprint.efficiency}%, Number developers: {selectedDevelopers})
                              </span>
                            </div>
                            <div className="text-lg font-medium text-gray-800">
                              {sprintCount} sprint{sprintCount !== 1 ? 's' : ''}
                            </div>
                          </div>
                          
                          {/* Sprint Capacity Details - Only show when details are visible */}
                          {showSprintDetails && (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                              <div className="space-y-2 text-base text-gray-600">
                                <div className="flex justify-between">
                                  <span>Total Sprint Capacity:</span>
                                  <span className="font-medium">{totalSprintCapacity} hours</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Total Development Hours:</span>
                                  <span className="font-medium">{totalProjectHours} hours</span>
                                </div>
                                <div className="flex justify-between border-t border-gray-200 pt-2">
                                  <span>Remaining Capacity:</span>
                                  <span className="font-medium">{remainderHours} hours ({remainderPercentage}%)</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                  })()}
                </div>
              )}




            </div>
          </div>
          )}

          {/* 4. Team Configuration Section */}
          {selectedTemplate && (getSectionTotals.length > 0 || !cameFromTemplate) && (
            <div className="mt-8 border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gray-200 text-gray-800 p-6">
                <h4 className="text-xl font-bold text-gray-800 mb-2">4. Team Configuration</h4>
                <p className="text-gray-600 mt-1 text-base">Select your team model and customize team structure</p>
              </div>
              
              <div className="p-6">
                <h4 className="text-xl font-bold text-gray-800 mb-2">Team Model</h4>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => !isTeamEditMode && setSelectedTeamModel('profile1')}
                    disabled={isTeamEditMode}
                    className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                      isTeamEditMode 
                        ? selectedTeamModel === 'profile1'
                          ? 'border-gray-400 bg-gray-200 text-gray-600 cursor-not-allowed'
                          : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                        : selectedTeamModel === 'profile1'
                        ? 'border-green-500 bg-green-50 text-green-800'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-green-300 hover:bg-green-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg font-bold mb-2">{templateData?.profile1?.name || 'Light'}</div>
                      <div className="text-base text-gray-600">{templateData?.profile1?.teamDescription || 'Minimal oversight and process'}</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => !isTeamEditMode && setSelectedTeamModel('profile2')}
                    disabled={isTeamEditMode}
                    className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                      isTeamEditMode 
                        ? selectedTeamModel === 'profile2'
                          ? 'border-gray-400 bg-gray-200 text-gray-600 cursor-not-allowed'
                          : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                        : selectedTeamModel === 'profile2'
                        ? 'border-yellow-500 bg-yellow-50 text-yellow-800'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-yellow-300 hover:bg-yellow-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg font-bold mb-2">{templateData?.profile2?.name || 'Standard'}</div>
                      <div className="text-base text-gray-600">{templateData?.profile2?.teamDescription || 'Balanced approach with regular checkpoints'}</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => !isTeamEditMode && setSelectedTeamModel('profile3')}
                    disabled={isTeamEditMode}
                    className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                      isTeamEditMode 
                        ? selectedTeamModel === 'profile3'
                          ? 'border-gray-400 bg-gray-200 text-gray-600 cursor-not-allowed'
                          : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                        : selectedTeamModel === 'profile3'
                        ? 'border-red-500 bg-red-50 text-red-800'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-red-300 hover:bg-red-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-lg font-bold mb-2">{templateData?.profile3?.name || 'Heavy'}</div>
                      <div className="text-base text-gray-600">{templateData?.profile3?.teamDescription || 'Comprehensive governance and documentation'}</div>
                    </div>
                  </button>
                </div>

                                  {/* Show Team Details Section */}
                  {selectedTeamModel && (
                    <div className="mt-6 pt-4 border-t border-gray-300">
                      {!isTeamEditMode && (
                        <div className="flex items-center justify-between mb-4">
                          <p className={getBodyClasses('small')}>
                            View the team structure details for your selected model to see recommended roles and resource allocation.
                          </p>
                          <button
                            onClick={() => setShowTeamDetails(!showTeamDetails)}
                            className={getButtonClasses('secondary')}
                          >
                            {showTeamDetails ? (
                              <>
                                <ChevronUp className={`${iconSizes.small} mr-2`} />
                                Hide Details
                              </>
                            ) : (
                              <>
                                <ChevronDown className={`${iconSizes.small} mr-2`} />
                                Show Details
                              </>
                            )}
                          </button>
                        </div>
                      )}

                                          {/* Team Details Content */}
                      {(showTeamDetails || isTeamEditMode) && (
                      <div className="border-t border-gray-300 pt-6 mt-6">
                        {!isTeamEditMode && (
                          <div className="mb-6">
                            <h4 className={`${getHeadingClasses('h4')} mb-2`}>Customize Your Team Structure</h4>
                            <div className="text-center">
                              <p className={`${getBodyClasses('base')} mb-4`}>
                                The team structure below shows the recommended roles for your selected team model. 
                                Click "Customize" to modify roles, adjust team sizes, or add specialized positions.
                              </p>
                              <button
                                onClick={() => {
                                  setIsTeamEditMode(true);
                                  setHasUnsavedChanges(true);
                                }}
                                className={`${getButtonClasses('primary')} mx-auto`}
                              >
                                Customize
                              </button>
                            </div>
                          </div>
                                                  )}



                                                    {/* Team Roles Display */}
                        {editableData?.teamSections.resourceSections && (editableData.teamSections?.resourceSections?.length || 0) > 0 ? (
                          <div className="space-y-6">
                            {editableData.teamSections?.resourceSections.map((resourceSection: any, sectionIndex: number) => (
                              <div key={sectionIndex} className="border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden">
                                {/* Resource Section Header */}
                                <div className={`${isTeamEditMode ? 'bg-gray-200' : 'bg-gray-100'} text-gray-800 p-6`}>
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="mb-3">
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Section Name</label>
                                        <h4 className={`${getHeadingClasses('h4')} mb-0`}>{resourceSection.name}</h4>
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Region</label>
                                        <p className="text-base text-gray-800">{resourceSection.region || 'Not specified'}</p>
                                      </div>
                                    </div>
                                    {isTeamEditMode && (editableData.teamSections?.resourceSections?.length || 0) > 1 && (
                                      <button
                                        onClick={() => removeTeamResourceSection(sectionIndex)}
                                        className={getButtonClasses('danger')}
                                      >
                                        <Trash2 className={`${iconSizes.small} mr-2`} />
                                        Delete Section
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Section Configuration Form */}
                                {isTeamEditMode && (
                                  <div className="bg-gray-50 border-t border-gray-300 p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <label className={getLabelClasses()}>Section Name</label>
                                        <input
                                          type="text"
                                          value={resourceSection.name}
                                          onChange={(e) => updateTeamResourceSectionName(sectionIndex, e.target.value)}
                                          className={getInputClasses()}
                                          placeholder="Enter section name"
                                        />
                                      </div>
                                      <div>
                                        <label className={getLabelClasses()}>Region</label>
                                        <select
                                          value={resourceSection.region || ''}
                                          onChange={(e) => updateTeamResourceSectionRegion(sectionIndex, e.target.value)}
                                          className={getInputClasses()}
                                        >
                                          <option value="">Select a region</option>
                                          {getUniqueRegions().map((region) => (
                                            <option key={region} value={region}>
                                              {region}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Role Content */}
                                <div className="p-6">
                                                                        {/* Role Summary */}
                                   {resourceSection.roles && resourceSection.roles.length > 0 && (
                                     <div className="mb-6">
                                                                               <h5 className={`text-base font-semibold text-gray-700 mb-2 flex items-center`}>
                                          <Plus className="w-5 h-5 mr-2 text-green-600" />
                                          Team Roles:
                                        </h5>
                                     </div>
                                   )}

                                  {resourceSection.roles && resourceSection.roles.length > 0 ? (
                                    <div className="space-y-3">
                                      {resourceSection.roles.map((role: any, roleIndex: number) => (
                                                                                 <div key={roleIndex} className={`flex items-center gap-4 p-4 border-2 rounded-lg shadow-sm transition-all ${
                                           !isTeamEditMode 
                                             ? 'border-gray-200 bg-gray-50 opacity-75'
                                             : 'border-gray-400 bg-gray-100'
                                         }`}>
                                           {/* Checkbox - Always Selected */}
                                           <div className="flex items-center cursor-default">
                                             <CheckSquare className={`w-6 h-6 ${isTeamEditMode ? 'text-blue-700' : 'text-gray-500'}`} />
                                           </div>

                                          {/* Up/Down Arrows */}
                                          {isTeamEditMode && (
                                            <div className="flex flex-col">
                                              <button
                                                onClick={() => moveTeamRoleUp(sectionIndex, roleIndex)}
                                                disabled={roleIndex === 0}
                                                className={`p-1 ${roleIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-gray-800'}`}
                                              >
                                                <ChevronUp className="w-4 h-4" />
                                              </button>
                                              <button
                                                onClick={() => moveTeamRoleDown(sectionIndex, roleIndex)}
                                                disabled={roleIndex === resourceSection.roles.length - 1}
                                                className={`p-1 ${roleIndex === resourceSection.roles.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-gray-800'}`}
                                              >
                                                <ChevronDown className="w-4 h-4" />
                                              </button>
                                            </div>
                                          )}
                                          
                                          {/* Role Name */}
                                          <div className="flex-1">
                                            {isTeamEditMode ? (
                                              <select
                                                value={role.name}
                                                onChange={(e) => updateTeamRoleName(sectionIndex, roleIndex, e.target.value)}
                                                className={getInputClasses()}
                                              >
                                                <option value="">Select a role</option>
                                                {getUniqueRoleNames().map((roleName) => (
                                                  <option key={roleName} value={roleName}>
                                                    {roleName}
                                                  </option>
                                                ))}
                                              </select>
                                            ) : (
                                              <span className="text-base text-gray-700">{role.name}</span>
                                            )}
                                          </div>
                                          
                                          {/* Role Count */}
                                          <div className="flex items-center gap-2">
                                            <input
                                              type="number"
                                              min="0"
                                              max="20"
                                              step="1"
                                                                                              value={isTeamEditMode ? 
                                                 (customTeamRoles.get(`${sectionIndex}-${roleIndex}`) ?? 
                                                    (selectedTeamModel === 'profile1' ? (role.profile1 || 0) :
                                                     selectedTeamModel === 'profile2' ? (role.profile2 || 0) :
                                                     (role.profile3 || 0))) :
                                                 (selectedTeamModel === 'profile1' ? (role.profile1 || 0) :
                                                  selectedTeamModel === 'profile2' ? (role.profile2 || 0) :
                                                  (role.profile3 || 0))
                                                }
                                              onChange={(e) => {
                                                if (isTeamEditMode) {
                                                  const roleKey = `${sectionIndex}-${roleIndex}`;
                                                  const value = Math.max(0, Math.min(20, parseInt(e.target.value) || 0));
                                                  setCustomTeamRoles(prev => new Map(prev.set(roleKey, value)));
                                                }
                                              }}
                                              disabled={!isTeamEditMode}
                                              className={`${getInputClasses()} w-16 text-center ${!isTeamEditMode ? 'bg-gray-100' : ''}`}
                                              placeholder="0"
                                            />
                                                                                         <span className="text-sm text-gray-500">resource(s)</span>
                                            {isTeamEditMode && (
                                              <button
                                                onClick={() => removeTeamRole(sectionIndex, roleIndex)}
                                                className="text-red-600 hover:text-red-800 p-1"
                                              >
                                                <X className="w-4 h-4" />
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-center py-8 text-gray-500">
                                      <p className="mb-2 font-medium">No roles defined for this section</p>
                                      <p className={`${getBodyClasses('muted')} mb-6`}>
                                        {isTeamEditMode ? 'Add roles to define your team structure' : 'Customize to add team roles'}
                                      </p>
                                    </div>
                                  )}
                                  
                                  {/* Add Role Button */}
                                  {isTeamEditMode && (
                                    <div className="mt-6">
                                      <button
                                        onClick={() => addTeamRole(sectionIndex)}
                                        className={`${getButtonClasses('success')} mx-auto`}
                                      >
                                        <Plus className={`${iconSizes.small} mr-2`} />
                                        {resourceSection.roles && resourceSection.roles.length > 0 ? 'Add Role' : 'Add First Role'}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                            
                            {/* Add New Section Button */}
                            {isTeamEditMode && (
                              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                                <button
                                  onClick={addTeamResourceSection}
                                  className={`${getButtonClasses('success')} mx-auto`}
                                >
                                  <Plus className={`${iconSizes.small} mr-2`} />
                                  Add New Section
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-12 text-gray-500 rounded-lg border-2 border-dashed border-gray-300">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">
                              <Settings className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="mb-4 font-medium">No team structure defined</p>
                            <p className={`${getBodyClasses('muted')} mb-6`}>
                              {isTeamEditMode ? 'Add sections to organize your team structure' : 'This template doesn\'t have team roles configured'}
                            </p>
                            {isTeamEditMode && (
                              <button
                                onClick={addTeamResourceSection}
                                className={`${getButtonClasses('success')} mx-auto`}
                              >
                                <Plus className={`${iconSizes.small} mr-2`} />
                                Add First Section
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. Timeline Configuration Section */}
          {selectedTemplate && (getSectionTotals.length > 0 || !cameFromTemplate) && (
            <div className="mt-8 border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gray-200 text-gray-800 p-6">
                <h4 className="text-xl font-bold text-gray-800 mb-2">5. Timeline Configuration</h4>
                <p className="text-gray-600 mt-1 text-base">Project timeline estimates for different phases</p>
              </div>
              
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left p-3 border-b-2 border-gray-200 bg-gray-50 font-medium text-gray-700">Phase</th>
                        <th className="text-center p-3 border-b-2 border-gray-200 bg-gray-50 font-medium text-gray-700">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Discovery Row */}
                      <tr className="border-b border-gray-200">
                        <td className="p-3 font-medium text-gray-700 bg-gray-50">Discovery</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="1"
                              max="52"
                              value={(() => {
                                if (editableData?.timelineSections?.discovery) {
                                  if (typeof editableData.timelineSections.discovery === 'number') {
                                    return editableData.timelineSections.discovery;
                                  }
                                }
                                if (!cameFromTemplate && templateData?.timelineSections?.discovery) {
                                  // From project file - show saved value
                                  if (typeof templateData.timelineSections.discovery === 'number') {
                                    return templateData.timelineSections.discovery;
                                  } else {
                                    const profileKey = templateData.selectedProfile || 'profile2';
                                    const discoveryData = templateData.timelineSections.discovery as { profile1: number; profile2: number; profile3: number; };
                                    if (profileKey === 'profile1') return discoveryData.profile1 || 2;
                                    if (profileKey === 'profile2') return discoveryData.profile2 || 2;
                                    if (profileKey === 'profile3') return discoveryData.profile3 || 2;
                                    return 2;
                                  }
                                } else {
                                  // From template - show value for selected profile
                                  const profileKey = selectedSize || 'profile2';
                                  const discoveryData = templateData?.timelineSections?.discovery as { profile1: number; profile2: number; profile3: number; } | undefined;
                                  if (profileKey === 'profile1') return discoveryData?.profile1 || 2;
                                  if (profileKey === 'profile2') return discoveryData?.profile2 || 2;
                                  if (profileKey === 'profile3') return discoveryData?.profile3 || 2;
                                  return 2;
                                }
                              })()}
                              onChange={(e) => updateTimelineValue('discovery', parseInt(e.target.value) || 2)}
                              className="w-16 p-2 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <span className="text-sm text-gray-600">weeks</span>
                          </div>
                        </td>
                      </tr>
                      
                      {/* UAT Row */}
                      <tr className="border-b border-gray-200">
                        <td className="p-3 font-medium text-gray-700 bg-gray-50">UAT</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="1"
                              max="52"
                              value={(() => {
                                if (editableData?.timelineSections?.uat) {
                                  if (typeof editableData.timelineSections.uat === 'number') {
                                    return editableData.timelineSections.uat;
                                  }
                                }
                                if (!cameFromTemplate && templateData?.timelineSections?.uat) {
                                  // From project file - show saved value
                                  if (typeof templateData.timelineSections.uat === 'number') {
                                    return templateData.timelineSections.uat;
                                  } else {
                                    const profileKey = templateData.selectedProfile || 'profile2';
                                    const uatData = templateData.timelineSections.uat as { profile1: number; profile2: number; profile3: number; };
                                    if (profileKey === 'profile1') return uatData.profile1 || 3;
                                    if (profileKey === 'profile2') return uatData.profile2 || 3;
                                    if (profileKey === 'profile3') return uatData.profile3 || 3;
                                    return 3;
                                  }
                                } else {
                                  // From template - show value for selected profile
                                  const profileKey = selectedSize || 'profile2';
                                  const uatData = templateData?.timelineSections?.uat as { profile1: number; profile2: number; profile3: number; } | undefined;
                                  if (profileKey === 'profile1') return uatData?.profile1 || 3;
                                  if (profileKey === 'profile2') return uatData?.profile2 || 3;
                                  if (profileKey === 'profile3') return uatData?.profile3 || 3;
                                  return 3;
                                }
                              })()}
                              onChange={(e) => updateTimelineValue('uat', parseInt(e.target.value) || 3)}
                              className="w-16 p-2 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <span className="text-sm text-gray-600">weeks</span>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Post Launch Row */}
                      <tr>
                        <td className="p-3 font-medium text-gray-700 bg-gray-50">Post Launch</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="1"
                              max="52"
                              value={(() => {
                                if (editableData?.timelineSections?.postLaunch) {
                                  if (typeof editableData.timelineSections.postLaunch === 'number') {
                                    return editableData.timelineSections.postLaunch;
                                  }
                                }
                                if (!cameFromTemplate && templateData?.timelineSections?.postLaunch) {
                                  // From project file - show saved value
                                  if (typeof templateData.timelineSections.postLaunch === 'number') {
                                    return templateData.timelineSections.postLaunch;
                                  } else {
                                    const profileKey = templateData.selectedProfile || 'profile2';
                                    const postLaunchData = templateData.timelineSections.postLaunch as { profile1: number; profile2: number; profile3: number; };
                                    if (profileKey === 'profile1') return postLaunchData.profile1 || 1;
                                    if (profileKey === 'profile2') return postLaunchData.profile2 || 1;
                                    if (profileKey === 'profile3') return postLaunchData.profile3 || 1;
                                    return 1;
                                  }
                                } else {
                                  // From template - show value for selected profile
                                  const profileKey = selectedSize || 'profile2';
                                  const postLaunchData = templateData?.timelineSections?.postLaunch as { profile1: number; profile2: number; profile3: number; } | undefined;
                                  if (profileKey === 'profile1') return postLaunchData?.profile1 || 1;
                                  if (profileKey === 'profile2') return postLaunchData?.profile2 || 1;
                                  if (profileKey === 'profile3') return postLaunchData?.profile3 || 1;
                                  return 1;
                                }
                              })()}
                              onChange={(e) => updateTimelineValue('postLaunch', parseInt(e.target.value) || 1)}
                              className="w-16 p-2 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <span className="text-sm text-gray-600">weeks</span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Generate Bid Button */}
        <div className="mt-8 border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden bg-white">
          <div className="p-6 text-center">
            <button
              onClick={handleGenerateBid}
              disabled={!isBidGenerationEnabled}
              className={`px-8 py-3 rounded-lg text-lg font-semibold transition-colors ${
                isBidGenerationEnabled
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Generate Bid
            </button>
            {!isBidGenerationEnabled && (
              <p className="text-sm text-gray-500 mt-2">
                Complete project information, select scope items, choose a team configuration profile, and configure team roles to generate bid
              </p>
            )}
          </div>
        </div>

        {/* Bid Generation Modal */}
        {showBidModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-7xl mx-4 w-full max-h-[90vh] overflow-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">Generated Bid</h2>
                <button
                  onClick={handleCloseBidModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <BidDisplay
                  projectData={editableData}
                  templateData={templateData}
                  selectedTeamModel={selectedTeamModel}
                  scopeSelections={itemSelections}
                  onClose={handleCloseBidModal}
                />
              </div>
            </div>
          </div>
        )}

        {/* Exit Warning Dialog */}
        {showExitWarning && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-yellow-600 text-xl">⚠️</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Unsaved Changes</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                You have unsaved changes that will be lost if you exit. What would you like to do?
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleSaveAndExit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                >
                  Save & Exit
                </button>
                <button
                  onClick={handleExitWithoutSaving}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
                >
                  Exit Without Saving
                </button>
                <button
                  onClick={handleCancelExit}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback - should not reach here
  return null;
};

export default UserApp; 
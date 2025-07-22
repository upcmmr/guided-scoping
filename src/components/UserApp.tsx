// ============================================================================
// USER APP - End user interface for project scoping
// ============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, Layers, CheckSquare, Square, FolderOpen, Plus, X, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import TemplateSelector from './TemplateSelector';
import { loadCompleteTemplate } from '../utils/templateScanner';
import type { TemplateMetadata } from '../utils/templateScanner';
import { saveUserProject, loadUserProject } from '../utils/projectManager';
import { APP_DEFAULTS, getNewSectionName } from '../config/defaults';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface UserAppProps {
  onSwitchToAdmin?: () => void;
}

interface ProjectScopeItem {
  name: string;
  hours: number;
  small?: boolean;
  medium?: boolean;
  large?: boolean;
}

interface ProjectSection {
  name: string;
  items: ProjectScopeItem[];
}

interface ProjectData {
  projectType: string;
  description: string;
  numberOfDevelopers?: number;
  minDevelopers?: number;
  standardDevelopers?: number;
  maxDevelopers?: number;
  sprintLength: number;
  sprintEfficiency: number;
  sections: ProjectSection[];
  templateSource?: string;
}

interface SectionTotal {
  name: string;
  hours: number;
  items: number;
}

type UserAppState = 'landing' | 'scoping';



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
  const [selectedSize, setSelectedSize] = useState<'small' | 'medium' | 'large' | null>(null);
  const [showCustomize, setShowCustomize] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDevelopers, setSelectedDevelopers] = useState<number>(APP_DEFAULTS.developers.standard);

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

  const handleOpenProjectFile = useCallback(async () => {
    try {
      const projectData = await loadUserProject();
      
      if (projectData) {
        // Load the project data and restore state (remove selected field for editing)
        setEditableData({
          projectType: projectData.projectType,
          description: projectData.description,
          numberOfDevelopers: projectData.numberOfDevelopers,
          sprintLength: projectData.sprintLength,
          sprintEfficiency: projectData.sprintEfficiency,
          sections: projectData.sections.map((section: ProjectSection) => ({
            name: section.name,
            items: section.items.map((item: ProjectScopeItem) => ({
              name: item.name,
              hours: item.hours
              // Remove selected field for editing format
            }))
          }))
        });
        
        // Restore item selections from embedded selected field
        const restoredSelections = new Map<string, boolean>();
        projectData.sections.forEach((section: ProjectSection, sectionIndex: number) => {
          section.items.forEach((item: ProjectScopeItem & { selected?: boolean }, itemIndex: number) => {
            restoredSelections.set(`${sectionIndex}-${itemIndex}`, item.selected || false);
          });
        });
        setItemSelections(restoredSelections);
        
        // Set template metadata (create a mock metadata object)
        setSelectedTemplate({
          filename: projectData.templateSource || 'loaded-project',
          projectType: projectData.projectType,
          description: projectData.description,
          minDevelopers: APP_DEFAULTS.templateFallbacks.minDevelopers,
          standardDevelopers: projectData.numberOfDevelopers,
          maxDevelopers: projectData.numberOfDevelopers * APP_DEFAULTS.userProject.developerMultiplierForMax,
          sprintLength: projectData.sprintLength,
          sprintEfficiency: projectData.sprintEfficiency,
          sectionsCount: projectData.sections.length,
          totalItems: projectData.sections.reduce((total, section) => total + section.items.length, 0)
        });
        
        // Set default developer count for slider
        setSelectedDevelopers(projectData.numberOfDevelopers || APP_DEFAULTS.developers.standard);
        
        setHasUnsavedChanges(false);
        setCameFromTemplate(false);
        setSelectedSize(null);
        setShowCustomize(true);
        setIsEditMode(true);
        setCurrentState('scoping');
      }
    } catch (error) {
      console.error('Error opening project file:', error);
      alert('Failed to open project file.');
    }
  }, []);

  const handleTemplateSelected = useCallback(async (template: TemplateMetadata) => {
    try {
      setLoading(true);
      const completeTemplate = await loadCompleteTemplate(template.filename);
      setSelectedTemplate(template);
      setTemplateData(completeTemplate);
      setEditableData({...completeTemplate}); // Create editable copy
      
      // Initialize all items as unselected
      const initialSelections = new Map<string, boolean>();
      completeTemplate.sections.forEach((section: ProjectSection, sectionIndex: number) => {
        section.items.forEach((item: ProjectScopeItem, itemIndex: number) => {
          initialSelections.set(`${sectionIndex}-${itemIndex}`, false);
        });
      });
      setItemSelections(initialSelections);
      setHasUnsavedChanges(false);
      setCameFromTemplate(true);
      setSelectedSize(null);
      
      // Set default developer count for slider
      setSelectedDevelopers(template.standardDevelopers || APP_DEFAULTS.developers.standard);
      
      setCurrentState('scoping');
    } catch (error) {
      console.error('Failed to load template:', error);
      alert('Failed to load the selected template. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

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
  };

  const handleSaveProject = async () => {
    if (!editableData || !selectedTemplate) return false;
    
    try {
      const success = await saveUserProject(
        editableData,
        itemSelections,
        selectedTemplate.filename
      );
      
      if (success) {
        setHasUnsavedChanges(false);
        return true;
      } else {
        alert('Failed to save project. Please try again.');
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

  const updateProjectInfo = (field: keyof ProjectData, value: string | number) => {
    setEditableData((prev) => prev ? ({ ...prev, [field]: value }) : null);
    setHasUnsavedChanges(true);
  };

  // Section management functions
  const addNewSection = () => {
    if (!editableData) return;
    
    const newSection = {
      name: getNewSectionName(editableData.sections.length),
      items: []
    };

    setEditableData((prev) => prev ? ({
      ...prev,
      sections: [...prev.sections, newSection]
    }) : null);
    setHasUnsavedChanges(true);
  };

  const removeSection = (sectionIndex: number) => {
    setEditableData((prev) => prev ? ({
      ...prev,
      sections: prev.sections.filter((_, index: number) => index !== sectionIndex)
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
      sections: prev.sections.map((section: any, index: number) => 
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
      sections: prev.sections.map((section: any, index: number) => 
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
      sections: prev.sections.map((section: any, index: number) => 
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
      sections: prev.sections.map((section: any, secIndex: number) => 
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
      sections: prev.sections.map((section: any, secIndex: number) => {
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

  const moveItemDown = (sectionIndex: number, itemIndex: number) => {
    if (!editableData) return;
    
    const sectionLength = editableData.sections[sectionIndex]?.items.length || 0;
    if (itemIndex >= sectionLength - 1) return;
    
    setEditableData((prev: any) => ({
      ...prev,
      sections: prev.sections.map((section: any, secIndex: number) => {
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
    editableData.sections.forEach((section: ProjectSection, sectionIndex: number) => {
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
    return editableData.sections.map((section: ProjectSection, sectionIndex: number) => {
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

  // Helper function to calculate sprint capacity
  const calculateSprintCapacity = () => {
    if (!editableData || !selectedTemplate) return 0;
    
    const sprintDays = editableData.sprintLength || APP_DEFAULTS.sprint.length;
    const efficiencyPercent = editableData.sprintEfficiency || APP_DEFAULTS.sprint.efficiency;
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

  const handleSizeSelection = (size: 'small' | 'medium' | 'large') => {
    if (!templateData) return;
    
    const newSelections = new Map<string, boolean>();
    
    templateData.sections.forEach((section: any, sectionIndex: number) => {
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
        <div className="rounded-lg shadow-md mb-6">
          <div className="p-8 border-b border-gray-200">
            <h1 className={APP_DEFAULTS.typography.h1}>Project Scoping Tool</h1>
                          <p className={APP_DEFAULTS.typography.body}>Start a new project or continue working on an existing one.</p>
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
                  <Layers className="w-10 h-10 text-blue-600" />
                </div>
                <h2 className={APP_DEFAULTS.typography.h2}>Start with Template</h2>
                <p className="text-gray-600 mb-6 leading-relaxed">
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
                <h2 className={APP_DEFAULTS.typography.h2}>Open Project File</h2>
                <p className="text-gray-600 mb-6 leading-relaxed">
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

    // Scoping Interface - Customization page with editable fields
  if (currentState === 'scoping' && selectedTemplate && editableData) {
    return (
      <div className="max-w-7xl mx-auto p-6 min-h-screen">
        {/* Separate Header Box - Match admin panel structure */}
        <div className="rounded-lg shadow-md mb-6">
          <div className="p-8 border-b border-gray-200">
            <h1 className={APP_DEFAULTS.typography.h1}>Project Configuration</h1>
                          <p className={APP_DEFAULTS.typography.body}>Configure your project settings and select the scope items that apply.</p>
          </div>
        </div>

        {/* Main Container - Match admin panel structure */}
        <div className="border-2 border-gray-300 rounded-lg shadow-md p-6 mb-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className={APP_DEFAULTS.typography.h3}>Project Configuration</h3>
              {hasUnsavedChanges && (
              <p className="text-sm text-gray-600 mt-1">
                  Unsaved changes
              </p>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleBackToLanding}
                className={`flex items-center px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 ${APP_DEFAULTS.typography.button}`}
              >
                <X className="w-4 h-4 mr-1" />
                Exit
              </button>
              
              <button
                onClick={handleSaveProject}
                disabled={!hasUnsavedChanges}
                className={`flex items-center px-3 py-2 rounded text-sm transition-colors ${
                  hasUnsavedChanges 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-400 text-gray-700 cursor-not-allowed'
                }`}
              >
                Save Project
              </button>
            </div>
          </div>

          {/* Project Information - Always at top */}
          <div className="border-2 border-gray-200 rounded-xl shadow-lg mb-8 overflow-hidden">
            <div className="bg-gray-200 text-gray-800 p-6">
                              <h4 className={APP_DEFAULTS.typography.h4}>Project Information</h4>
                <p className={APP_DEFAULTS.typography.tagline}>Define your project name and description</p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className={APP_DEFAULTS.typography.label}>Project Name</label>
                  <input
                    type="text"
                    value={editableData.projectType || ''}
                    onChange={(e) => updateProjectInfo('projectType', e.target.value)}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., B2C E-commerce Platform"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={APP_DEFAULTS.typography.label}>Description</label>
                  <textarea
                    rows={3}
                    value={editableData.description || ''}
                    onChange={(e) => updateProjectInfo('description', e.target.value)}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                    placeholder="Project description and key features"
                  />
                </div>
                </div>
                </div>
          </div>

          {/* Size Selector - Only show when coming from template */}
          {cameFromTemplate && (
            <div className="border-2 border-gray-200 rounded-xl shadow-lg mb-8 overflow-hidden">
              <div className="bg-gray-200 text-gray-800 p-6">
                <h4 className={APP_DEFAULTS.typography.h4}>Prime Profile Selection</h4>
                <p className={APP_DEFAULTS.typography.tagline}>Choose your project size to automatically select the right scope for your needs</p>
              </div>
              
              <div className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => !isEditMode && handleSizeSelection('small')}
                    disabled={isEditMode}
                    className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                      selectedSize === 'small'
                        ? isEditMode 
                          ? 'border-gray-400 bg-gray-200 text-gray-600 cursor-not-allowed'
                          : 'border-green-500 bg-green-50 text-green-800'
                        : isEditMode
                          ? 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-green-300 hover:bg-green-50'
                    }`}
                  >
                    <div className="text-center">
                                             <div className="text-lg font-bold mb-2">Small</div>
                                              <div className={APP_DEFAULTS.typography.body}>Essential features only</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => !isEditMode && handleSizeSelection('medium')}
                    disabled={isEditMode}
                    className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                      selectedSize === 'medium'
                        ? isEditMode 
                          ? 'border-gray-400 bg-gray-200 text-gray-600 cursor-not-allowed'
                          : 'border-yellow-500 bg-yellow-50 text-yellow-800'
                        : isEditMode
                          ? 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-yellow-300 hover:bg-yellow-50'
                    }`}
                  >
                    <div className="text-center">
                                             <div className="text-lg font-bold mb-2">Medium</div>
                                              <div className={APP_DEFAULTS.typography.body}>Standard feature set</div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => !isEditMode && handleSizeSelection('large')}
                    disabled={isEditMode}
                    className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                      selectedSize === 'large'
                        ? isEditMode 
                          ? 'border-gray-400 bg-gray-200 text-gray-600 cursor-not-allowed'
                          : 'border-red-500 bg-red-50 text-red-800'
                        : isEditMode
                          ? 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-red-300 hover:bg-red-50'
                    }`}
                  >
                    <div className="text-center">
                                             <div className="text-lg font-bold mb-2">Large</div>
                                              <div className={APP_DEFAULTS.typography.body}>Comprehensive features</div>
                    </div>
                  </button>
                </div>
                
                {/* Customize Button - Show after size selection */}
                {selectedSize && (
                  <div className="mt-6 pt-4 border-t border-gray-300">
                    <div className="flex items-center justify-between">
                <div>
                        <p className="text-sm text-gray-600">
                          View details of the selected prime profile.
                        </p>
                </div>
                      <button
                        onClick={() => setShowCustomize(!showCustomize)}
                        disabled={isEditMode}
                        className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isEditMode
                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                            : 'bg-gray-600 text-white hover:bg-gray-700'
                        }`}
                      >
                        {showCustomize ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-2" />
                            Hide Details
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-2" />
                            See Details
                          </>
                        )}
                      </button>
              </div>
            </div>
                )}
          </div>
            </div>
          )}

          {/* Project Scope Section */}
          {showCustomize && (
            <div className="border-2 border-gray-200 rounded-xl shadow-lg mb-8 overflow-hidden">
              <div className="bg-gray-200 text-gray-800 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={APP_DEFAULTS.typography.h4}>Project Scope</h4>
                    <p className={APP_DEFAULTS.typography.tagline}>Review and customize the scope items for your project</p>
                  </div>
                  {!isEditMode && (
                    <button
                      onClick={() => setIsEditMode(true)}
                                              className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${APP_DEFAULTS.typography.button} transition-colors`}
                    >
                      Customize
                    </button>
                  )}
                </div>
              </div>
              
              <div className="p-6">
          {editableData.sections.length === 0 ? (
            <div className="text-center py-12 text-gray-500 rounded-lg border-2 border-dashed border-gray-300">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">
                <Layers className="w-8 h-8 text-gray-400" />
              </div>
              <p className="mb-4 font-medium">No sections defined</p>
              <p className="text-sm text-gray-400 mb-6">{isEditMode ? 'Add sections to organize your project scope' : 'No scope items available'}</p>
              {isEditMode && (
              <button
                onClick={addNewSection}
                className="flex items-center mx-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Section
              </button>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {editableData.sections.map((sectionData: any, sectionIndex: number) => (
                <div key={sectionIndex} className="border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {/* Section Header */}
                  <div className={`${isEditMode ? 'bg-gray-200' : 'bg-gray-100'} text-gray-800 p-6`}>
                    <div className="flex items-center justify-between">
                      <div>
                                                 <h4 className={APP_DEFAULTS.typography.h4}>{sectionData.name || 'Unnamed Section'}</h4>
                      </div>
                      {isEditMode && editableData.sections.length > 1 && (
                        <button
                          onClick={() => removeSection(sectionIndex)}
                          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Section
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Section Configuration Form */}
                  {isEditMode && (
                  <div className="border-b border-gray-300 p-6">
                    <div>
                      <label className={APP_DEFAULTS.typography.label}>Section Name</label>
                      <input
                        type="text"
                        value={sectionData.name || ''}
                        onChange={(e) => updateSectionInfo(sectionIndex, 'name', e.target.value)}
                        className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter section name"
                      />
                    </div>
                  </div>
                  )}
                  
                  {/* Scope Items */}
                  <div className="p-6">
                    <div className="mb-6">
                      <h5 className={`${APP_DEFAULTS.typography.h5} flex items-center`}>
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
                                ? 'border-blue-500 bg-blue-50' 
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
                                <CheckSquare className={`w-5 h-5 ${isEditMode ? 'text-blue-600' : 'text-gray-400'}`} />
                              ) : (
                                <Square className={`w-5 h-5 ${isEditMode ? 'text-gray-400 hover:text-gray-600' : 'text-gray-300'}`} />
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
                                  isSelected ? 'bg-blue-50' : 'bg-white'
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
                                  isSelected ? 'bg-blue-50' : 'bg-white'
                                      }`
                                }`}
                              />
                              <span className={APP_DEFAULTS.typography.meta}>hrs</span>
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
                            className="flex items-center mx-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-md transition-colors"
                          >
                            <Plus className="w-4 h-4 mr-2" />
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
                          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium shadow-md transition-colors"
                        >
                          <Plus className="w-4 h-4 mr-2" />
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
          {isEditMode && editableData.sections.length > 0 && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={addNewSection}
                className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium shadow-md transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add New Section
              </button>
            </div>
          )}
              </div>
            </div>
          )}

          {/* Project Summary - Always visible */}
          <div className="mt-8 border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gray-200 text-gray-800 p-6">
              <h3 className={APP_DEFAULTS.typography.h3}>Project Summary</h3>
              <p className={APP_DEFAULTS.typography.tagline}>Review total hours, adjust team size, and estimate project timeline</p>
            </div>
            
            <div className="p-6 bg-white space-y-8">
              {/* 1. Development Hours Section */}
              <div>
                <h4 className={APP_DEFAULTS.typography.h4}>Development Hours</h4>
                
                {getSectionTotals.length > 0 ? (
                  <>
                    {/* Section Totals */}
                    <div className="space-y-3 mb-6">
                      {getSectionTotals.map((section: SectionTotal, index: number) => (
                        <div key={index} className="flex justify-between items-center py-2 px-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <span className="font-medium text-gray-800">{section.name}</span>
                            <span className={`${APP_DEFAULTS.typography.dataLabel} ml-2`}>({section.items} items)</span>
              </div>
                          <div className="font-semibold text-gray-800">
                            {section.hours} hours
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Grand Total */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                        <div className="flex items-center">
                          <span className={APP_DEFAULTS.typography.dataValue}>Total Development Hours</span>
                                                      <span className={`${APP_DEFAULTS.typography.dataLabel} ml-2`}>({getSelectedItemsCount()} items selected)</span>
                                                  </div>
                          <div className={APP_DEFAULTS.typography.dataLarge}>
                            {getTotalHours} hours
                          </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-lg font-medium">No scope items selected</p>
                    <p className={`${APP_DEFAULTS.typography.body} mt-1`}>Select scope items to see development hours breakdown</p>
                  </div>
                )}
              </div>

              {/* 2. Team Size & Sprint Planning Section */}
              {selectedTemplate && (
                <div className="border-t border-gray-200 pt-8">
                                      <h4 className={APP_DEFAULTS.typography.h4}>Team Size & Sprint Planning</h4>
                  
                  {/* Team Size Configuration */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                                          <h5 className={APP_DEFAULTS.typography.h5}>Team Size</h5>
                    
                                              <label className={APP_DEFAULTS.typography.label}>
                      Number of Developers: {selectedDevelopers}
                    </label>
                    
                    <input
                      type="range"
                      min={selectedTemplate.minDevelopers}
                      max={selectedTemplate.maxDevelopers}
                      step="1"
                      value={selectedDevelopers}
                      onChange={(e) => setSelectedDevelopers(parseInt(e.target.value))}
                      className="w-full mb-2"
                    />
                    
                                              <div className={`flex justify-between ${APP_DEFAULTS.typography.meta}`}>
                      <span>{selectedTemplate.minDevelopers}</span>
                      <span>{selectedTemplate.maxDevelopers}</span>
                    </div>
                  </div>

                  {/* Sprint Configuration */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                                          <h5 className={APP_DEFAULTS.typography.h5}>Sprint Settings</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                                                  <label className={APP_DEFAULTS.typography.label}>
                            Sprint Duration (working days)
                          </label>
                                                  <input
                            type="number"
                            min="1"
                            max="30"
                            value={editableData.sprintLength || APP_DEFAULTS.sprint.length}
                            onChange={(e) => updateProjectInfo('sprintLength', parseInt(e.target.value) || APP_DEFAULTS.sprint.length)}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md ${APP_DEFAULTS.typography.body} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        />
                      </div>
                      <div>
                                                  <label className={APP_DEFAULTS.typography.label}>
                            Sprint Efficiency (%)
                          </label>
                                                  <input
                            type="number"
                            min="1"
                            max="100"
                            value={editableData.sprintEfficiency || APP_DEFAULTS.sprint.efficiency}
                            onChange={(e) => updateProjectInfo('sprintEfficiency', parseInt(e.target.value) || APP_DEFAULTS.sprint.efficiency)}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md ${APP_DEFAULTS.typography.body} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sprint Timeline Results */}
                  {getTotalHours > 0 && (() => {
                    const totalProjectHours = getTotalHours;
                    const sprintCount = calculateSprints();
                    const capacityPerSprint = calculateSprintCapacity();
                    const totalSprintCapacity = Math.round(sprintCount * capacityPerSprint);
                    const remainderHours = totalSprintCapacity - totalProjectHours;
                    const remainderPercentage = Math.round((remainderHours / totalSprintCapacity) * 100);

                                          return (
                        <div className="space-y-4">
                          {/* Estimated Sprint Count - Same styling as Total Development Hours */}
                          <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                            <div>
                              <span className={APP_DEFAULTS.typography.dataValue}>Estimated Sprint Count</span>
                            </div>
                            <div className={APP_DEFAULTS.typography.dataLarge}>
                              {sprintCount} sprint{sprintCount !== 1 ? 's' : ''}
                            </div>
                          </div>
                          
                          {/* Sprint Capacity Details - Lighter box */}
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div className={`space-y-2 ${APP_DEFAULTS.typography.body}`}>
                              <div className="flex justify-between text-gray-700">
                                <span>Total Sprint Capacity:</span>
                                <span className="font-medium">{totalSprintCapacity} hours</span>
                              </div>
                              <div className="flex justify-between text-gray-700">
                                <span>Total Development Hours:</span>
                                <span className="font-medium">{totalProjectHours} hours</span>
                              </div>
                              <div className="flex justify-between text-gray-700 border-t border-gray-200 pt-2">
                                <span>Remaining Capacity:</span>
                                <span className="font-medium">{remainderHours} hours ({remainderPercentage}%)</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Exit Warning Dialog */}
        {showExitWarning && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-yellow-600 text-xl">⚠️</span>
                </div>
                <h3 className={APP_DEFAULTS.typography.warning}>Unsaved Changes</h3>
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
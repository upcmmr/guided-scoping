// ============================================================================
// SCOPING TOOL ADMINISTRATION - Main Application Component
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Plus, X, FolderPlus, Trash2, ChevronUp, ChevronDown, Save, Upload, Download, Settings, Home, AlertTriangle, FileText } from 'lucide-react';
import { 
  loadScopeDataFromFile,
  getEmptyScopeData,
  saveScopeData, 
  resetToInitialConfig,
  type ScopeData,
  type ScopeSection,
  type ScopeItem
} from '../utils/dataManager';
import { APP_DEFAULTS, getDefaultScopeItem, getNewSectionName } from '../config/defaults';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/** Create a new scope item with default values */
const createNewScopeItem = (name?: string, hours?: number) => 
  getDefaultScopeItem(name, hours);

/** Create a new section with default structure */
const createNewSection = (sectionNumber: number) => ({
  name: getNewSectionName(sectionNumber - 1), // -1 because sectionNumber is 1-based
  items: [createNewScopeItem()]
});

/** Create a new team role with default values */
const createNewTeamRole = (name?: string) => ({
  id: `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  name: name || 'New Role',
  smb: 0,
  standard: 1,
  enterprise: 1
});

/** Create a new resource section with default structure */
const createNewResourceSection = (name?: string) => ({
  id: `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  name: name || 'New Resource Section',
  roles: []
});

// ============================================================================
// ADMIN CONFIGURATION HOOK
// ============================================================================

const useAdminConfiguration = () => {
  const [scopeData, setScopeData] = useState<ScopeData>(getEmptyScopeData());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);

  // Project-level management functions
  const updateProjectInfo = (field: string, value: string | number) => {
    setScopeData((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  // ============================================================================
  // TEAM ROLE MANAGEMENT FUNCTIONS
  // ============================================================================

  const addTeamRole = (resourceSectionIndex: number, name?: string) => {
    const newRole = createNewTeamRole(name);
    setScopeData((prev) => ({
      ...prev,
      resourceSections: prev.resourceSections?.map((section, secIndex) => 
        secIndex === resourceSectionIndex 
          ? { ...section, roles: [...section.roles, newRole] }
          : section
      ) || []
    }));
    setHasUnsavedChanges(true);
  };

  const removeTeamRole = (resourceSectionIndex: number, roleIndex: number) => {
    setScopeData((prev) => ({
      ...prev,
      resourceSections: prev.resourceSections?.map((section, secIndex) => 
        secIndex === resourceSectionIndex 
          ? { ...section, roles: section.roles.filter((_, roleIdx) => roleIdx !== roleIndex) }
          : section
      ) || []
    }));
    setHasUnsavedChanges(true);
  };

  const updateTeamRole = (resourceSectionIndex: number, roleIndex: number, updates: Partial<any>) => {
    setScopeData((prev) => ({
      ...prev,
      resourceSections: prev.resourceSections?.map((section, secIndex) => 
        secIndex === resourceSectionIndex ? {
          ...section,
          roles: section.roles.map((role, roleIdx) => 
            roleIdx === roleIndex ? { ...role, ...updates } : role
          )
        } : section
      ) || []
    }));
    setHasUnsavedChanges(true);
  };

  const moveRoleUp = (resourceSectionIndex: number, roleIndex: number) => {
    if (roleIndex === 0) return;
    setScopeData((prev) => ({
      ...prev,
      resourceSections: prev.resourceSections?.map((section, secIndex) => {
        if (secIndex === resourceSectionIndex) {
          const newRoles = [...section.roles];
          [newRoles[roleIndex - 1], newRoles[roleIndex]] = [newRoles[roleIndex], newRoles[roleIndex - 1]];
          return { ...section, roles: newRoles };
        }
        return section;
      }) || []
    }));
    setHasUnsavedChanges(true);
  };

  const moveRoleDown = (resourceSectionIndex: number, roleIndex: number) => {
    const currentSection = scopeData.resourceSections?.[resourceSectionIndex];
    if (!currentSection || roleIndex === currentSection.roles.length - 1) return;
    setScopeData((prev) => ({
      ...prev,
      resourceSections: prev.resourceSections?.map((section, secIndex) => {
        if (secIndex === resourceSectionIndex) {
          const newRoles = [...section.roles];
          [newRoles[roleIndex], newRoles[roleIndex + 1]] = [newRoles[roleIndex + 1], newRoles[roleIndex]];
          return { ...section, roles: newRoles };
        }
        return section;
      }) || []
    }));
    setHasUnsavedChanges(true);
  };

  const updateResourceSectionName = (resourceSectionIndex: number, name: string) => {
    setScopeData((prev) => ({
      ...prev,
      resourceSections: prev.resourceSections?.map((section, secIndex) => 
        secIndex === resourceSectionIndex 
          ? { ...section, name }
          : section
      ) || []
    }));
    setHasUnsavedChanges(true);
  };

  const addResourceSection = (name?: string) => {
    const newSection = createNewResourceSection(name);
    setScopeData((prev) => ({
      ...prev,
      resourceSections: [...(prev.resourceSections || []), newSection]
    }));
    setHasUnsavedChanges(true);
  };

  const removeResourceSection = (resourceSectionIndex: number) => {
    setScopeData((prev) => ({
      ...prev,
      resourceSections: prev.resourceSections?.filter((_, secIndex) => secIndex !== resourceSectionIndex) || []
    }));
    setHasUnsavedChanges(true);
  };

  // Section management functions
  const addNewSection = () => {
    const sectionNumber = scopeData.sections.length + 1;
    const newSection = createNewSection(sectionNumber);

    setScopeData((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
    setHasUnsavedChanges(true);
  };

  const createNewConfig = () => {
    setScopeData({
      projectType: APP_DEFAULTS.project.name,
      description: APP_DEFAULTS.project.description,
      minDevelopers: APP_DEFAULTS.developers.min,
      standardDevelopers: APP_DEFAULTS.developers.standard,
      maxDevelopers: APP_DEFAULTS.developers.max,
      minQaTeamFactor: APP_DEFAULTS.qa.minTeamFactor,
      standardQaTeamFactor: APP_DEFAULTS.qa.standardTeamFactor,
      maxQaTeamFactor: APP_DEFAULTS.qa.maxTeamFactor,
      sprintLength: APP_DEFAULTS.sprint.length,
      sprintEfficiency: APP_DEFAULTS.sprint.efficiency,
      sections: [],
      resourceSections: APP_DEFAULTS.teamStructure.defaultResourceSections
    });
    setHasUnsavedChanges(false);
    setIsLoaded(true);
  };

  const exitToWelcome = () => {
    if (hasUnsavedChanges) {
      setShowExitWarning(true);
    } else {
      performExit();
    }
  };

  const performExit = () => {
    setScopeData(getEmptyScopeData());
    setHasUnsavedChanges(false);
    setIsLoaded(false);
    setShowExitWarning(false);
  };

  const handleSaveAndExit = async () => {
    const success = await saveScopeData(scopeData);
    if (success) {
      performExit();
    } else {
      alert('Failed to save project template. Please try again.');
    }
  };

  const handleExitWithoutSaving = () => {
    performExit();
  };

  const handleCancelExit = () => {
    setShowExitWarning(false);
  };

  const removeSection = (sectionIndex: number) => {
    setScopeData((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, index) => index !== sectionIndex)
    }));
    setHasUnsavedChanges(true);
  };

  const updateSectionInfo = (sectionIndex: number, field: string, value: string) => {
    setScopeData((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) => 
        index === sectionIndex ? { ...section, [field]: value } : section
      )
    }));
    setHasUnsavedChanges(true);
  };

  // Item management functions
  const updateScopeItem = (sectionIndex: number, itemIndex: number, updates: Partial<ScopeItem>) => {
    setScopeData((prev) => ({
      ...prev,
      sections: prev.sections.map((section, secIndex) => 
        secIndex === sectionIndex ? {
          ...section,
          items: section.items.map((item, itemIdx) => 
            itemIdx === itemIndex ? { ...item, ...updates } : item
          )
        } : section
      )
    }));
    setHasUnsavedChanges(true);
  };

  const addScopeItem = (sectionIndex: number) => {
    const newItem = createNewScopeItem();
    setScopeData((prev) => ({
      ...prev,
      sections: prev.sections.map((section, secIndex) => 
        secIndex === sectionIndex 
          ? { ...section, items: [...section.items, newItem] }
          : section
      )
    }));
    setHasUnsavedChanges(true);
  };

  const removeScopeItem = (sectionIndex: number, itemIndex: number) => {
    setScopeData((prev) => ({
      ...prev,
      sections: prev.sections.map((section, secIndex) => 
        secIndex === sectionIndex 
          ? { ...section, items: section.items.filter((_, itemIdx) => itemIdx !== itemIndex) }
          : section
      )
    }));
    setHasUnsavedChanges(true);
  };

  const moveItemUp = (sectionIndex: number, itemIndex: number) => {
    if (itemIndex === 0) return;
    setScopeData((prev) => ({
      ...prev,
      sections: prev.sections.map((section, secIndex) => {
        if (secIndex === sectionIndex) {
          const newItems = [...section.items];
          [newItems[itemIndex - 1], newItems[itemIndex]] = [newItems[itemIndex], newItems[itemIndex - 1]];
          return { ...section, items: newItems };
        }
        return section;
      })
    }));
    setHasUnsavedChanges(true);
  };

  const moveItemDown = (sectionIndex: number, itemIndex: number) => {
    const currentSection = scopeData.sections[sectionIndex];
    if (!currentSection || itemIndex === currentSection.items.length - 1) return;
    setScopeData((prev) => ({
      ...prev,
      sections: prev.sections.map((section, secIndex) => {
        if (secIndex === sectionIndex) {
          const newItems = [...section.items];
          [newItems[itemIndex], newItems[itemIndex + 1]] = [newItems[itemIndex + 1], newItems[itemIndex]];
          return { ...section, items: newItems };
        }
        return section;
      })
    }));
    setHasUnsavedChanges(true);
  };

  // Configuration management
  const resetToDefaults = () => {
    const defaultData = resetToInitialConfig();
    setScopeData(defaultData);
    setHasUnsavedChanges(false);
  };

  const handleAdminHoursChange = (sectionIndex: number, itemIndex: number, newHours: string) => {
    const hours = parseInt(newHours) || 0;
    updateScopeItem(sectionIndex, itemIndex, { hours });
  };

  const handleAdminNameChange = (sectionIndex: number, itemIndex: number, newName: string) => {
    updateScopeItem(sectionIndex, itemIndex, { name: newName });
  };

  const handleSizeCheckboxChange = (sectionIndex: number, itemIndex: number, size: string, checked: boolean) => {
    updateScopeItem(sectionIndex, itemIndex, { [size]: checked });
  };

  const handleSaveChanges = async () => {
    const success = await saveScopeData(scopeData);
    if (success) {
      setHasUnsavedChanges(false);
    } else {
      alert('Failed to save project template. Please try again.');
    }
  };

  const handleLoadFromFile = async () => {
    const data = await loadScopeDataFromFile();
    setScopeData(data);
    setHasUnsavedChanges(false);
    setIsLoaded(true);
  };

  return {
    scopeData,
    hasUnsavedChanges,
    isLoaded,
    updateProjectInfo,
    createNewConfig,
    addNewSection,
    removeSection,
    updateSectionInfo,
    addScopeItem,
    removeScopeItem,
    updateScopeItem,
    moveItemUp,
    moveItemDown,
    resetToDefaults,
    handleAdminHoursChange,
    handleAdminNameChange,
    handleSizeCheckboxChange,
    handleSaveChanges,
    handleLoadFromFile,
    exitToWelcome,
    showExitWarning,
    handleSaveAndExit,
    handleExitWithoutSaving,
    handleCancelExit,
    // Team role management functions
    addTeamRole,
    removeTeamRole,
    updateTeamRole,
    moveRoleUp,
    moveRoleDown,
    updateResourceSectionName,
    addResourceSection,
    removeResourceSection
  };
};

// ============================================================================
// ADMIN PANEL COMPONENT
// ============================================================================

interface AdminPanelProps {
  scopeData: ScopeData;
  hasUnsavedChanges: boolean;
  isLoaded: boolean;
  showExitWarning: boolean;
  onUpdateProjectInfo: (field: string, value: string | number) => void;
  onCreateNewConfig: () => void;
  onExitToWelcome: () => void;
  onSaveAndExit: () => void;
  onExitWithoutSaving: () => void;
  onCancelExit: () => void;
  onAddNewSection: () => void;
  onRemoveSection: (index: number) => void;
  onUpdateSectionInfo: (index: number, field: string, value: string) => void;
  onAddScopeItem: (sectionIndex: number) => void;
  onRemoveScopeItem: (sectionIndex: number, itemIndex: number) => void;
  onMoveItemUp: (sectionIndex: number, itemIndex: number) => void;
  onMoveItemDown: (sectionIndex: number, itemIndex: number) => void;
  onResetToDefaults: () => void;
  onAdminHoursChange: (sectionIndex: number, itemIndex: number, hours: string) => void;
  onAdminNameChange: (sectionIndex: number, itemIndex: number, name: string) => void;
  onSizeCheckboxChange: (sectionIndex: number, itemIndex: number, size: string, checked: boolean) => void;
  onSaveChanges: () => void;
  onLoadFromFile: () => void;
  // Team role management props
  onAddTeamRole: (resourceSectionIndex: number, name?: string) => void;
  onRemoveTeamRole: (resourceSectionIndex: number, roleIndex: number) => void;
  onUpdateTeamRole: (resourceSectionIndex: number, roleIndex: number, updates: Partial<any>) => void;
  onMoveRoleUp: (resourceSectionIndex: number, roleIndex: number) => void;
  onMoveRoleDown: (resourceSectionIndex: number, roleIndex: number) => void;
  onUpdateResourceSectionName: (resourceSectionIndex: number, name: string) => void;
  onAddResourceSection: (name?: string) => void;
  onRemoveResourceSection: (resourceSectionIndex: number) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  scopeData, 
  hasUnsavedChanges,
  isLoaded,
  showExitWarning,
  onUpdateProjectInfo,
  onCreateNewConfig,
  onExitToWelcome,
  onSaveAndExit,
  onExitWithoutSaving,
  onCancelExit,
  onAddNewSection,
  onRemoveSection,
  onUpdateSectionInfo,
  onAddScopeItem,
  onRemoveScopeItem,
  onMoveItemUp,
  onMoveItemDown,
  onResetToDefaults,
  onAdminHoursChange,
  onAdminNameChange,
  onSizeCheckboxChange,
  onSaveChanges,
  onLoadFromFile,
  // Team role management props
  onAddTeamRole,
  onRemoveTeamRole,
  onUpdateTeamRole,
  onMoveRoleUp,
  onMoveRoleDown,
  onUpdateResourceSectionName,
  onAddResourceSection,
  onRemoveResourceSection
}) => {
  // Check if we should show the welcome screen or the configuration form
  const shouldShowWelcome = !isLoaded && scopeData.projectType.trim() === '' && scopeData.description.trim() === '';

  if (shouldShowWelcome) {
    // Show welcome screen with Load/New buttons
    return (
      <div className="border-2 border-gray-300 rounded-lg shadow-md p-6 mb-6">
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center">
            <FolderPlus className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Project Configuration</h2>
          <p className="text-base text-gray-600 mb-8 max-w-md mx-auto">
            Get started by loading an existing project template or creating a new project template.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onLoadFromFile}
              className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-md transition-colors"
            >
              <Upload className="w-4 h-4 mr-2" />
              Load Project Template
            </button>
            
            <button
              onClick={onCreateNewConfig}
              className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium shadow-md transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Project Template
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show full configuration interface
  return (
  <>
  <div className="border-2 border-gray-300 rounded-lg shadow-md p-6 mb-6">
    {/* Header */}
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-2xl font-bold text-gray-800 mb-3">Project Template Configuration</h3>
        <p className="text-gray-600 mt-1 text-base">Manage project template settings.</p>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={onExitToWelcome}
          className="flex items-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium shadow-md transition-colors"
        >
          <Home className="w-4 h-4 mr-2" />
          Exit
        </button>
        
        <button
          onClick={onSaveChanges}
          disabled={!hasUnsavedChanges}
          className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium shadow-md transition-colors ${
            hasUnsavedChanges 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-400 text-gray-700 cursor-not-allowed'
          }`}
        >
          <Save className="w-4 h-4 mr-2" />
          Save Project Template
        </button>
      </div>
    </div>

    {/* 1. Template Information */}
    <div className="border-2 border-gray-200 rounded-xl shadow-lg mb-8 overflow-hidden">
      <div className="bg-gray-200 text-gray-800 p-6">
        <h4 className="text-xl font-bold text-gray-800 mb-2">1. Template Information</h4>
        <p className="text-gray-600 mt-1 text-base">Basic template details and description</p>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">Template Name</label>
            <input
              type="text"
              value={scopeData.projectType || ''}
              onChange={(e) => onUpdateProjectInfo('projectType', e.target.value)}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., B2C E-commerce Platform"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-base font-medium text-gray-700 mb-2">Description</label>
            <textarea
              rows={3}
              value={scopeData.description || ''}
              onChange={(e) => onUpdateProjectInfo('description', e.target.value)}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
              placeholder="Template description and key features"
            />
          </div>
        </div>
      </div>
    </div>

    {/* 2. Project Scope */}
    <div className="border-2 border-gray-200 rounded-xl shadow-lg mb-8 overflow-hidden">
      <div className="bg-gray-200 text-gray-800 p-6">
        <h4 className="text-xl font-bold text-gray-800 mb-2">2. Default Project Scope</h4>
        <p className="text-gray-600 mt-1 text-base">Define and organize the scope sections and items for this template</p>
      </div>
      
      <div className="p-6">
        {scopeData.sections.length === 0 ? (
      <div className="text-center py-12 text-gray-500 rounded-lg border-2 border-dashed border-gray-300">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">
          <FolderPlus className="w-8 h-8 text-gray-400" />
        </div>
        <p className="mb-4 font-medium">No sections defined</p>
        <p className="text-sm text-gray-400 mb-6">Add sections to organize your project scope</p>
        <button
          onClick={onAddNewSection}
          className="flex items-center mx-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium shadow-md transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add First Section
        </button>
      </div>
    ) : (
      <div className="space-y-8">
        {scopeData.sections.map((sectionData, sectionIndex) => (
          <div key={sectionIndex} className="border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden">
            {/* Section Header */}
            <div className="bg-gray-200 text-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-bold text-gray-800 mb-2">{sectionData.name || 'Unnamed Section'}</h4>
                </div>
                {scopeData.sections.length > 1 && (
                  <button
                    onClick={() => onRemoveSection(sectionIndex)}
                    className="flex items-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium shadow-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Section
                  </button>
                )}
              </div>
            </div>

            {/* Section Configuration Form */}
            <div className="border-b border-gray-300 p-6">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">Section Name</label>
                <input
                  type="text"
                  value={sectionData.name || ''}
                  onChange={(e) => onUpdateSectionInfo(sectionIndex, 'name', e.target.value)}
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter section name"
                />
              </div>
            </div>
            
            {/* Scope Items */}
            <div className="p-6">
              <div className="mb-6">
                <h5 className="text-base font-semibold text-gray-700 mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-green-600" />
                  Scope Items ({sectionData.items.length})
                </h5>
              </div>
              
              <div className="space-y-3">
                {sectionData.items.map((item, index) => (
                  <div 
                    key={`${sectionIndex}-${index}`} 
                    className="flex items-center gap-4 p-4 border-2 rounded-lg shadow-sm border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
                  >
                    {/* Reorder Controls */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => onMoveItemUp(sectionIndex, index)}
                        disabled={index === 0}
                        className={`p-1 rounded transition-colors ${
                          index === 0 
                            ? 'text-gray-300 cursor-not-allowed' 
                            : 'text-gray-600 hover:text-blue-600 hover:bg-blue-100'
                        }`}
                        title="Move up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onMoveItemDown(sectionIndex, index)}
                        disabled={index === sectionData.items.length - 1}
                        className={`p-1 rounded transition-colors ${
                          index === sectionData.items.length - 1
                            ? 'text-gray-300 cursor-not-allowed' 
                            : 'text-gray-600 hover:text-blue-600 hover:bg-blue-100'
                        }`}
                        title="Move down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex-1">
                      <input
                        type="text"
                        value={item.name || ''}
                        onChange={(e) => onAdminNameChange(sectionIndex, index, e.target.value)}
                        className={`w-full p-3 border-2 border-gray-200 rounded-lg text-base text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                        placeholder="Scope item name"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        value={item.hours || 0}
                        onChange={(e) => onAdminHoursChange(sectionIndex, index, e.target.value)}
                        className={`w-20 p-3 border-2 border-gray-200 rounded-lg text-base text-gray-600 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      />
                      <span className="text-sm text-gray-500">hrs</span>
                    </div>

                    {/* Size Checkboxes */}
                    <div className="flex items-center gap-4">
                      {['small', 'medium', 'large'].map((size) => (
                        <label key={size} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={item[size as keyof ScopeItem] as boolean}
                            onChange={(e) => onSizeCheckboxChange(sectionIndex, index, size, e.target.checked)}
                            className="mr-1 w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2"
                          />
                          <span className="text-base text-gray-600 capitalize">{size}</span>
                        </label>
                      ))}
                    </div>

                    <button
                      onClick={() => onRemoveScopeItem(sectionIndex, index)}
                      className="flex items-center px-3 py-2 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                      title="Remove item"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {sectionData.items.length === 0 && (
                  <div className="text-center py-12 text-gray-500 rounded-lg border-2 border-dashed border-gray-300">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">
                      <Plus className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="mb-4 font-medium">No scope items in this section yet</p>
                    <button
                      onClick={() => onAddScopeItem(sectionIndex)}
                      className="flex items-center mx-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-md transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Item
                    </button>
                  </div>
                )}
              </div>
              
              {/* Add Item Button */}
              {sectionData.items.length > 0 && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => onAddScopeItem(sectionIndex)}
                    className="flex items-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium shadow-md transition-colors"
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
    {scopeData.sections.length > 0 && (
      <div className="mt-8 flex justify-center">
        <button
          onClick={onAddNewSection}
          className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium shadow-md transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Section
        </button>
      </div>
    )}
      </div>
    </div>

    {/* 3. Default Team Configuration */}
    <div className="border-2 border-gray-200 rounded-xl shadow-lg mb-8 overflow-hidden">
      <div className="bg-gray-200 text-gray-800 p-6">
        <h4 className="text-xl font-bold text-gray-800 mb-2">3. Default Team Configuration</h4>
        <p className="text-gray-600 mt-1 text-base">Define resource allocation for different team models across various business types</p>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Team Structure Models */}
        <div>
          
          {/* Developer & QA Consultant Configuration Subsection */}
          <div className="mb-8 border-b border-gray-300 pb-8">
            <h5 className="text-lg font-semibold text-gray-700 mb-6">Developer & QA Consultant Configuration</h5>
            <p className="text-gray-600 mb-6 text-sm">Define team size ranges and QA team composition</p>
            
            <div className="space-y-6">
              {/* Number of Developers Row */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-4">Number of Developers</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Minimum</label>
                    <input
                      type="number"
                      min={APP_DEFAULTS.developers.formMinLimit}
                      max={APP_DEFAULTS.developers.formMaxLimit}
                      value={scopeData.minDevelopers || APP_DEFAULTS.developers.min}
                      onChange={(e) => onUpdateProjectInfo('minDevelopers', parseInt(e.target.value) || APP_DEFAULTS.developers.min)}
                      className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={APP_DEFAULTS.developers.min.toString()}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Typical</label>
                    <input
                      type="number"
                      min={APP_DEFAULTS.developers.formMinLimit}
                      max={APP_DEFAULTS.developers.formMaxLimit}
                      value={scopeData.standardDevelopers || APP_DEFAULTS.developers.standard}
                      onChange={(e) => onUpdateProjectInfo('standardDevelopers', parseInt(e.target.value) || APP_DEFAULTS.developers.standard)}
                      className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={APP_DEFAULTS.developers.standard.toString()}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Maximum</label>
                    <input
                      type="number"
                      min={APP_DEFAULTS.developers.formMinLimit}
                      max={APP_DEFAULTS.developers.formMaxLimit}
                      value={scopeData.maxDevelopers || APP_DEFAULTS.developers.max}
                      onChange={(e) => onUpdateProjectInfo('maxDevelopers', parseInt(e.target.value) || APP_DEFAULTS.developers.max)}
                      className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={APP_DEFAULTS.developers.max.toString()}
                    />
                  </div>
                </div>
              </div>

              {/* QA Team Row */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-4">QA team as a percentage of Development team</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Minimum</label>
                    <div className="relative">
                      <input
                        type="number"
                        min={APP_DEFAULTS.qa.factorMinLimit}
                        max={APP_DEFAULTS.qa.factorMaxLimit}
                        step="1"
                        value={scopeData.minQaTeamFactor || APP_DEFAULTS.qa.minTeamFactor}
                        onChange={(e) => onUpdateProjectInfo('minQaTeamFactor', parseInt(e.target.value) || APP_DEFAULTS.qa.minTeamFactor)}
                        className="w-full p-3 pr-8 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={APP_DEFAULTS.qa.minTeamFactor.toString()}
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Typical</label>
                    <div className="relative">
                      <input
                        type="number"
                        min={APP_DEFAULTS.qa.factorMinLimit}
                        max={APP_DEFAULTS.qa.factorMaxLimit}
                        step="1"
                        value={scopeData.standardQaTeamFactor || APP_DEFAULTS.qa.standardTeamFactor}
                        onChange={(e) => onUpdateProjectInfo('standardQaTeamFactor', parseInt(e.target.value) || APP_DEFAULTS.qa.standardTeamFactor)}
                        className="w-full p-3 pr-8 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={APP_DEFAULTS.qa.standardTeamFactor.toString()}
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Maximum</label>
                    <div className="relative">
                      <input
                        type="number"
                        min={APP_DEFAULTS.qa.factorMinLimit}
                        max={APP_DEFAULTS.qa.factorMaxLimit}
                        step="1"
                        value={scopeData.maxQaTeamFactor || APP_DEFAULTS.qa.maxTeamFactor}
                        onChange={(e) => onUpdateProjectInfo('maxQaTeamFactor', parseInt(e.target.value) || APP_DEFAULTS.qa.maxTeamFactor)}
                        className="w-full p-3 pr-8 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={APP_DEFAULTS.qa.maxTeamFactor.toString()}
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Resource Sections - Dynamic from template data */}
            {scopeData.resourceSections?.map((resourceSection, sectionIndex) => (
              <div key={resourceSection.id} className="border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {/* Section Header */}
                <div className="bg-gray-200 text-gray-800 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xl font-bold text-gray-800 mb-2">{resourceSection.name}</h4>
                    </div>
                    {scopeData.resourceSections && scopeData.resourceSections.length > 1 && (
                      <button
                        onClick={() => onRemoveResourceSection(sectionIndex)}
                        className="flex items-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium shadow-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Section
                      </button>
                    )}
                  </div>
                </div>

                {/* Section Name Configuration */}
                <div className="border-b border-gray-300 p-6">
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">Section Name</label>
                    <input
                      type="text"
                      value={resourceSection.name}
                      onChange={(e) => onUpdateResourceSectionName(sectionIndex, e.target.value)}
                      className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter section name"
                    />
                  </div>
                </div>
                
                {/* Team Roles */}
                <div className="p-6">
                  <div className="mb-6">
                    <h5 className="text-base font-semibold text-gray-700 mb-2 flex items-center">
                      <Settings className="w-4 h-4 mr-2 text-blue-600" />
                      Team Roles ({resourceSection.roles.length})
                    </h5>
                  </div>
                  
                  <div className="space-y-3">
                    {resourceSection.roles.length === 0 ? (
                      <div className="text-center py-12 text-gray-500 rounded-lg border-2 border-dashed border-gray-300">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">
                          <Plus className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="mb-4 font-medium">No roles defined in this section yet</p>
                        <p className="text-sm text-gray-400 mb-6">Add roles to configure team resource allocation</p>
                        <button
                          onClick={() => onAddTeamRole(sectionIndex)}
                          className="flex items-center mx-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-md transition-colors"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add First Role
                        </button>
                      </div>
                    ) : (
                      resourceSection.roles.map((role, roleIndex) => (
                        <div key={role.id} className="flex items-center gap-4 p-4 border-2 rounded-lg shadow-sm border-gray-200 hover:border-gray-300 hover:shadow-md transition-all">
                          {/* Reorder Controls */}
                          <div className="flex flex-col gap-1">
                            <button
                              disabled={roleIndex === 0}
                              onClick={() => onMoveRoleUp(sectionIndex, roleIndex)}
                              className={`flex items-center px-2 py-1 rounded-lg text-sm font-medium transition-colors ${
                                roleIndex === 0 
                                  ? 'text-gray-300 cursor-not-allowed' 
                                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-100'
                              }`}
                              title="Move up"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              disabled={roleIndex === resourceSection.roles.length - 1}
                              onClick={() => onMoveRoleDown(sectionIndex, roleIndex)}
                              className={`flex items-center px-2 py-1 rounded-lg text-sm font-medium transition-colors ${
                                roleIndex === resourceSection.roles.length - 1
                                  ? 'text-gray-300 cursor-not-allowed' 
                                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-100'
                              }`}
                              title="Move down"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Role Name */}
                          <div className="flex-1">
                                                      <input
                            type="text"
                            value={role.name}
                            onChange={(e) => onUpdateTeamRole(sectionIndex, roleIndex, { name: e.target.value })}
                            className="w-full p-3 border-2 border-gray-200 rounded-lg text-base text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Role name"
                          />
                          </div>

                          {/* SMB Count */}
                          <div className="flex items-center gap-3">
                                                      <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            value={role.smb}
                            onChange={(e) => onUpdateTeamRole(sectionIndex, roleIndex, { smb: parseFloat(e.target.value) || 0 })}
                            className="w-20 p-3 border-2 border-gray-200 rounded-lg text-base text-gray-600 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                            <span className="text-sm text-gray-500">SMB</span>
                          </div>

                          {/* Standard Count */}
                          <div className="flex items-center gap-3">
                                                      <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            value={role.standard}
                            onChange={(e) => onUpdateTeamRole(sectionIndex, roleIndex, { standard: parseFloat(e.target.value) || 0 })}
                            className="w-20 p-3 border-2 border-gray-200 rounded-lg text-base text-gray-600 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                            <span className="text-sm text-gray-500">Std</span>
                          </div>

                          {/* Enterprise Count */}
                          <div className="flex items-center gap-3">
                                                      <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            value={role.enterprise}
                            onChange={(e) => onUpdateTeamRole(sectionIndex, roleIndex, { enterprise: parseFloat(e.target.value) || 0 })}
                            className="w-20 p-3 border-2 border-gray-200 rounded-lg text-base text-gray-600 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                            <span className="text-sm text-gray-500">Ent</span>
                          </div>

                          {/* Remove Button */}
                                                  <button
                            onClick={() => onRemoveTeamRole(sectionIndex, roleIndex)}
                            className="flex items-center px-3 py-2 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                            title="Remove role"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {/* Add Role Button - Only show if there are existing roles */}
                  {resourceSection.roles.length > 0 && (
                    <div className="mt-6 flex justify-center">
                      <button
                        onClick={() => onAddTeamRole(sectionIndex)}
                        className="flex items-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium shadow-md transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Role
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add Section Button */}
          <div className="mt-8 flex justify-center">
          <button
            onClick={() => onAddResourceSection()}
            className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium shadow-md transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Resource Section
          </button>
          </div>



        </div>
      </div>
    </div>



    {/* 4. Sprint Configuration */}
    <div className="border-2 border-gray-200 rounded-xl shadow-lg mb-8 overflow-hidden">
      <div className="bg-gray-200 text-gray-800 p-6">
        <h4 className="text-xl font-bold text-gray-800 mb-2">4. Default Sprint Configuration</h4>
        <p className="text-gray-600 mt-1 text-base">Sprint timing and efficiency parameters</p>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">Sprint Length (working days)</label>
            <input
              type="number"
              min={APP_DEFAULTS.sprint.lengthMinLimit}
              max={APP_DEFAULTS.sprint.lengthMaxLimit}
              value={scopeData.sprintLength || APP_DEFAULTS.sprint.length}
              onChange={(e) => onUpdateProjectInfo('sprintLength', parseInt(e.target.value) || APP_DEFAULTS.sprint.length)}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={APP_DEFAULTS.sprint.length.toString()}
            />
          </div>
          <div>
            <label className="block text-base font-medium text-gray-700 mb-2">Sprint Efficiency (%)</label>
            <div className="relative">
              <input
                type="number"
                min={APP_DEFAULTS.sprint.efficiencyMinLimit}
                max={APP_DEFAULTS.sprint.efficiencyMaxLimit}
                value={scopeData.sprintEfficiency || APP_DEFAULTS.sprint.efficiency}
                onChange={(e) => onUpdateProjectInfo('sprintEfficiency', parseInt(e.target.value) || APP_DEFAULTS.sprint.efficiency)}
                className="w-full p-3 pr-8 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={APP_DEFAULTS.sprint.efficiency.toString()}
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>

  {/* Exit Warning Dialog */}
  {showExitWarning && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800">Unsaved Changes</h3>
        </div>
        
        <p className="text-gray-600 mb-6">
          You have unsaved changes that will be lost if you exit. What would you like to do?
        </p>
        
        <div className="flex space-x-3">
          <button
            onClick={onSaveAndExit}
            className="flex-1 flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-md transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            Save & Exit
          </button>
          <button
            onClick={onExitWithoutSaving}
            className="flex-1 flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium shadow-md transition-colors"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Exit Without Saving
          </button>
          <button
            onClick={onCancelExit}
            className="flex-1 flex items-center justify-center px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm font-medium shadow-md transition-colors"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </button>
        </div>
      </div>
    </div>
  )}
</>
);
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AdminApp: React.FC = () => {
  const adminHook = useAdminConfiguration();

  return (
    <div className="max-w-7xl mx-auto p-6 min-h-screen">
      <div className="rounded-lg shadow-md mb-6">
        <div className="p-8 border-b border-gray-200">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Scoping Tool Administration</h1>
          <p className="text-base text-gray-600">Manage project template definitions and configurations.</p>
        </div>
      </div>

      <AdminPanel
        scopeData={adminHook.scopeData}
        hasUnsavedChanges={adminHook.hasUnsavedChanges}
        isLoaded={adminHook.isLoaded}
        showExitWarning={adminHook.showExitWarning}
        onUpdateProjectInfo={adminHook.updateProjectInfo}
        onCreateNewConfig={adminHook.createNewConfig}
        onExitToWelcome={adminHook.exitToWelcome}
        onSaveAndExit={adminHook.handleSaveAndExit}
        onExitWithoutSaving={adminHook.handleExitWithoutSaving}
        onCancelExit={adminHook.handleCancelExit}
        onAddNewSection={adminHook.addNewSection}
        onRemoveSection={adminHook.removeSection}
        onUpdateSectionInfo={adminHook.updateSectionInfo}
        onAddScopeItem={adminHook.addScopeItem}
        onRemoveScopeItem={adminHook.removeScopeItem}
        onMoveItemUp={adminHook.moveItemUp}
        onMoveItemDown={adminHook.moveItemDown}
        onResetToDefaults={adminHook.resetToDefaults}
        onAdminHoursChange={adminHook.handleAdminHoursChange}
        onAdminNameChange={adminHook.handleAdminNameChange}
        onSizeCheckboxChange={adminHook.handleSizeCheckboxChange}
        onSaveChanges={adminHook.handleSaveChanges}
        onLoadFromFile={adminHook.handleLoadFromFile}
        onAddTeamRole={adminHook.addTeamRole}
        onRemoveTeamRole={adminHook.removeTeamRole}
        onUpdateTeamRole={adminHook.updateTeamRole}
        onMoveRoleUp={adminHook.moveRoleUp}
        onMoveRoleDown={adminHook.moveRoleDown}
        onUpdateResourceSectionName={adminHook.updateResourceSectionName}
        onAddResourceSection={adminHook.addResourceSection}
        onRemoveResourceSection={adminHook.removeResourceSection}
      />
    </div>
  );
};

export default AdminApp;
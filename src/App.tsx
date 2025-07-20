// ============================================================================
// SCOPING TOOL ADMINISTRATION - Main Application Component
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Plus, X, FolderPlus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { 
  loadScopeDataFromFile,
  getEmptyScopeData,
  saveScopeData, 
  resetToInitialConfig,
  type ScopeData,
  type ScopeSection,
  type ScopeItem
} from './utils/dataManager';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/** Create a new scope item with default values */
const createNewScopeItem = (name = 'New Scope Item', hours = 40) => ({
  name,
  hours,
  small: false,
  medium: false,
  large: false
});

/** Create a new section with default structure */
const createNewSection = (sectionNumber: number) => ({
  name: `Section ${sectionNumber}`,
  items: [createNewScopeItem('Sample Scope Item')]
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
      projectType: '',
      description: '',
      numberOfDevelopers: 3,
      sprintLength: 14,
      sprintEfficiency: 80,
      sections: []
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
    handleCancelExit
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
  onLoadFromFile
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
          <h3 className="text-2xl font-bold text-gray-800 mb-3">Project Configuration</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Get started by loading an existing project template or creating a new project template.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onLoadFromFile}
              className="flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-base font-medium shadow-md transition-colors"
            >
              <FolderPlus className="w-5 h-5 mr-2" />
              Load Project Template
            </button>
            
            <button
              onClick={onCreateNewConfig}
              className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-base font-medium shadow-md transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
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
        <h3 className="text-xl font-semibold text-gray-800">Project Template Configuration</h3>
        <p className="text-sm text-gray-600 mt-1">Manage project template settings.</p>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={onExitToWelcome}
          className="flex items-center px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
        >
          <X className="w-4 h-4 mr-1" />
          Exit
        </button>
        
        <button
          onClick={onSaveChanges}
          disabled={!hasUnsavedChanges}
          className={`flex items-center px-3 py-2 rounded text-sm transition-colors ${
            hasUnsavedChanges 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-400 text-gray-700 cursor-not-allowed'
          }`}
        >
          Save Project Template
        </button>
      </div>
    </div>

    {/* Project-Level Configuration */}
    <div className="border-2 border-grey-200 rounded-xl shadow-lg mb-8 overflow-hidden">
      <div className="bg-gray-200 text-gray-800 p-6">
        <h4 className="font-bold text-xl">Project Settings</h4>
        <p className="text-gray-600 mt-1 text-sm">Configure project-level metadata and team settings.</p>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="md:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Project Type</label>
            <input
              type="text"
              value={scopeData.projectType || ''}
              onChange={(e) => onUpdateProjectInfo('projectType', e.target.value)}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., B2C E-commerce Platform"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <input
              type="text"
              value={scopeData.description || ''}
              onChange={(e) => onUpdateProjectInfo('description', e.target.value)}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Project description and key features"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Number of Developers</label>
            <input
              type="number"
              min="1"
              max="50"
              value={scopeData.numberOfDevelopers || 3}
              onChange={(e) => onUpdateProjectInfo('numberOfDevelopers', parseInt(e.target.value) || 3)}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sprint Length (days)</label>
            <input
              type="number"
              min="1"
              max="30"
              value={scopeData.sprintLength || 14}
              onChange={(e) => onUpdateProjectInfo('sprintLength', parseInt(e.target.value) || 14)}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="14"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sprint Efficiency (%)</label>
            <input
              type="number"
              min="1"
              max="100"
              value={scopeData.sprintEfficiency || 80}
              onChange={(e) => onUpdateProjectInfo('sprintEfficiency', parseInt(e.target.value) || 80)}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="80"
            />
          </div>
        </div>
      </div>
    </div>

    {/* Sections */}
    {scopeData.sections.length === 0 ? (
      <div className="text-center py-12 text-gray-500 rounded-lg border-2 border-dashed border-gray-300">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">
          <FolderPlus className="w-8 h-8 text-gray-400" />
        </div>
        <p className="mb-4 font-medium">No sections defined</p>
        <p className="text-sm text-gray-400 mb-6">Add sections to organize your project scope</p>
        <button
          onClick={onAddNewSection}
          className="flex items-center mx-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
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
                  <h4 className="font-bold text-xl">{sectionData.name || 'Unnamed Section'}</h4>
                </div>
                {scopeData.sections.length > 1 && (
                  <button
                    onClick={() => onRemoveSection(sectionIndex)}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Section Name</label>
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
                <h5 className="font-bold text-gray-800 text-lg flex items-center">
                  <Plus className="w-5 h-5 mr-2 text-green-600" />
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
                        className="w-full p-3 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Scope item name"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        value={item.hours || 0}
                        onChange={(e) => onAdminHoursChange(sectionIndex, index, e.target.value)}
                        className="w-20 p-3 border-2 border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="text-xs font-medium text-gray-600">hrs</span>
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
                          <span className="text-xs text-gray-600 capitalize">{size}</span>
                        </label>
                      ))}
                    </div>

                    <button
                      onClick={() => onRemoveScopeItem(sectionIndex, index)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
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
    {scopeData.sections.length > 0 && (
      <div className="mt-8 flex justify-center">
        <button
          onClick={onAddNewSection}
          className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium shadow-md transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Section
        </button>
      </div>
    )}
  </div>

  {/* Exit Warning Dialog */}
  {showExitWarning && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
            <span className="text-yellow-600 text-xl">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Unsaved Changes</h3>
        </div>
        
        <p className="text-gray-600 mb-6">
          You have unsaved changes that will be lost if you exit. What would you like to do?
        </p>
        
        <div className="flex space-x-3">
          <button
            onClick={onSaveAndExit}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
          >
            Save & Exit
          </button>
          <button
            onClick={onExitWithoutSaving}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
          >
            Exit Without Saving
          </button>
          <button
            onClick={onCancelExit}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm font-medium transition-colors"
          >
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

const ScopingEstimationTool: React.FC = () => {
  const adminHook = useAdminConfiguration();

  return (
    <div className="max-w-6xl mx-auto p-6 min-h-screen">
      <div className="rounded-lg shadow-md mb-6">
        <div className="p-8 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Scoping Tool Administration</h1>
          <p className="text-gray-600">Manage project template definitions and configurations.</p>
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
      />
    </div>
  );
};

export default ScopingEstimationTool;
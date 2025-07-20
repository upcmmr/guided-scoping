import React, { useState, useEffect } from 'react';
import { Plus, X, FolderPlus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { 
  loadScopeData, 
  loadScopeDataFromFile,
  getDefaultScopeData,
  saveScopeData, 
  resetToInitialConfig,
  type ScopeData,
  type ScopeSection,
  type ScopeItem
} from './utils/dataManager';

// ============================================================================
// CONFIGURATION DATA
// ============================================================================

// Default configuration settings
const DEFAULT_CONFIG = {
  hoursPerSprint: 200
};

// Helper function to get initial scope data
const getInitialScopeData = () => {
  return getDefaultScopeData();
};

// Helper function to create a new scope item template
const createNewScopeItem = (name = 'New Scope Item', hours = 40) => ({
  name,
  hours,
  small: false,
  medium: false,
  large: false
});

// Helper function to create a new section template
const createNewSection = (sectionNumber: number) => ({
  name: `New Section ${sectionNumber}`,
  description: 'Description for the new scope section.',
  items: [createNewScopeItem('Sample Scope Item')]
});

// ============================================================================
// ADMIN PANEL FUNCTIONALITY (separated for organization)
// ============================================================================

// Admin configuration hook
const useAdminConfiguration = (initialScopeSelections: any, onScopeSelectionsChange: any) => {
  const [scopeData, setScopeData] = useState(getInitialScopeData());
  const [adminConfig, setAdminConfig] = useState({ hoursPerSprint: DEFAULT_CONFIG.hoursPerSprint });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Section management functions
  const addNewSection = () => {
    const sectionNumber = scopeData.length + 1;
    const newSection = createNewSection(sectionNumber);

    setScopeData((prev: any) => [...prev, newSection]);
    setHasUnsavedChanges(true);

    onScopeSelectionsChange((prev: any) => [...prev, [...newSection.items]]);
  };

  const removeSection = (sectionIndex: any) => {
    setScopeData((prev: any) => prev.filter((_: any, index: any) => index !== sectionIndex));
    setHasUnsavedChanges(true);

    onScopeSelectionsChange((prev: any) => prev.filter((_: any, index: any) => index !== sectionIndex));
  };

  const updateSectionInfo = (sectionIndex: any, field: any, value: any) => {
    setScopeData((prev: any) => prev.map((section: any, index: any) => 
      index === sectionIndex ? { ...section, [field]: value } : section
    ));
    setHasUnsavedChanges(true);
  };

  // Item management functions
  const updateScopeItem = (sectionIndex: any, itemIndex: any, updates: any) => {
    setHasUnsavedChanges(true);
    
    onScopeSelectionsChange((prev: any) => prev.map((sectionItems: any, secIndex: any) => 
      secIndex === sectionIndex 
        ? sectionItems.map((item: any, itemIdx: any) => 
            itemIdx === itemIndex ? { ...item, ...updates } : item
          )
        : sectionItems
    ));
    
    setScopeData((prev: any) => prev.map((section: any, secIndex: any) => 
      secIndex === sectionIndex 
        ? {
            ...section,
            items: section.items.map((item: any, itemIdx: any) => 
              itemIdx === itemIndex ? { ...item, ...updates } : item
            )
          }
        : section
    ));
  };

  const addScopeItem = (sectionIndex: any) => {
    const newItem = createNewScopeItem();
    setHasUnsavedChanges(true);

    onScopeSelectionsChange((prev: any) => prev.map((sectionItems: any, secIndex: any) => 
      secIndex === sectionIndex ? [...sectionItems, newItem] : sectionItems
    ));

    setScopeData((prev: any) => prev.map((section: any, secIndex: any) => 
      secIndex === sectionIndex 
        ? { ...section, items: [...section.items, newItem] }
        : section
    ));
  };

  const removeScopeItem = (sectionIndex: any, itemIndex: any) => {
    setHasUnsavedChanges(true);
    
    onScopeSelectionsChange((prev: any) => prev.map((sectionItems: any, secIndex: any) => 
      secIndex === sectionIndex 
        ? sectionItems.filter((_: any, itemIdx: any) => itemIdx !== itemIndex)
        : sectionItems
    ));

    setScopeData((prev: any) => prev.map((section: any, secIndex: any) => 
      secIndex === sectionIndex 
        ? { ...section, items: section.items.filter((_: any, itemIdx: any) => itemIdx !== itemIndex) }
        : section
    ));
  };

  const moveItemUp = (sectionIndex: any, itemIndex: any) => {
    if (itemIndex === 0) return;
    setHasUnsavedChanges(true);
    
    onScopeSelectionsChange((prev: any) => prev.map((sectionItems: any, secIndex: any) => {
      if (secIndex === sectionIndex) {
        const newArray = [...sectionItems];
        [newArray[itemIndex - 1], newArray[itemIndex]] = [newArray[itemIndex], newArray[itemIndex - 1]];
        return newArray;
      }
      return sectionItems;
    }));

    setScopeData((prev: any) => prev.map((section: any, secIndex: any) => {
      if (secIndex === sectionIndex) {
        const newItems = [...section.items];
        [newItems[itemIndex - 1], newItems[itemIndex]] = [newItems[itemIndex], newItems[itemIndex - 1]];
        return { ...section, items: newItems };
      }
      return section;
    }));
  };

  const moveItemDown = (sectionIndex: any, itemIndex: any) => {
    const currentSectionItems = initialScopeSelections[sectionIndex] || [];
    if (itemIndex === currentSectionItems.length - 1) return;
    setHasUnsavedChanges(true);
    
    onScopeSelectionsChange((prev: any) => prev.map((sectionItems: any, secIndex: any) => {
      if (secIndex === sectionIndex) {
        const newArray = [...sectionItems];
        [newArray[itemIndex], newArray[itemIndex + 1]] = [newArray[itemIndex + 1], newArray[itemIndex]];
        return newArray;
      }
      return sectionItems;
    }));

    setScopeData((prev: any) => prev.map((section: any, secIndex: any) => {
      if (secIndex === sectionIndex) {
        const newItems = [...section.items];
        [newItems[itemIndex], newItems[itemIndex + 1]] = [newItems[itemIndex + 1], newItems[itemIndex]];
        return { ...section, items: newItems };
      }
      return section;
    }));
  };

  const resetToDefaults = () => {
    const defaultData = resetToInitialConfig();
    
    setScopeData(defaultData);
    setHasUnsavedChanges(false);
    
    const newSelections = defaultData.map((section: any) => [...section.items]);
    onScopeSelectionsChange(() => newSelections);
    
    setAdminConfig({ hoursPerSprint: DEFAULT_CONFIG.hoursPerSprint });
  };

  const handleSprintHoursChange = (newHours: any) => {
    setAdminConfig((prev: any) => ({
      ...prev,
      hoursPerSprint: parseInt(newHours) || DEFAULT_CONFIG.hoursPerSprint
    }));
    setHasUnsavedChanges(true);
  };

  const handleAdminHoursChange = (sectionIndex: any, itemIndex: any, newHours: any) => {
    const hours = parseInt(newHours) || 0;
    updateScopeItem(sectionIndex, itemIndex, { hours });
  };

  const handleAdminNameChange = (sectionIndex: any, itemIndex: any, newName: any) => {
    updateScopeItem(sectionIndex, itemIndex, { name: newName });
  };

  const handleSizeCheckboxChange = (sectionIndex: any, itemIndex: any, size: any, checked: any) => {
    updateScopeItem(sectionIndex, itemIndex, { [size]: checked });
  };

  const handleSaveChanges = async () => {
    const success = await saveScopeData(scopeData);
    if (success) {
      setHasUnsavedChanges(false);
    } else {
      alert('Failed to save configuration. Please try again.');
    }
  };

  const handleLoadFromFile = async () => {
    const data = await loadScopeDataFromFile();
    setScopeData(data);
    setHasUnsavedChanges(false);
    setIsLoaded(true);
    
    const newSelections = data.map((section: any) => [...section.items]);
    onScopeSelectionsChange(() => newSelections);
  };

  return {
    scopeData,
    adminConfig,
    hasUnsavedChanges,
    isLoaded,
    addNewSection,
    removeSection,
    updateSectionInfo,
    addScopeItem,
    removeScopeItem,
    updateScopeItem,
    moveItemUp,
    moveItemDown,
    resetToDefaults,
    handleSprintHoursChange,
    handleAdminHoursChange,
    handleAdminNameChange,
    handleSizeCheckboxChange,
    handleSaveChanges,
    handleLoadFromFile
  };
};

// Admin Panel Component
const AdminPanel = ({ 
  scopeData, 
  scopeSelections, 
  adminConfig,
  hasUnsavedChanges,
  isLoaded,
  onAddNewSection,
  onRemoveSection,
  onUpdateSectionInfo,
  onAddScopeItem,
  onRemoveScopeItem,
  onMoveItemUp,
  onMoveItemDown,
  onResetToDefaults,
  onSprintHoursChange,
  onAdminHoursChange,
  onAdminNameChange,
  onSizeCheckboxChange,
  onSaveChanges,
  onLoadFromFile
}) => (
  <div className="bg-gray-50 border-2 border-gray-300 rounded-lg shadow-md p-6 mb-6">
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-xl font-semibold text-gray-800">Administration Panel</h3>
        <p className="text-sm text-gray-600 mt-1">Manage scope sections, use up/down arrows to reorder items, edit names and hours</p>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={onLoadFromFile}
          className="flex items-center px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
        >
          <FolderPlus className="w-4 h-4 mr-1" />
          Load Data File
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
          Save Data File
        </button>
      </div>
    </div>

    <div className="space-y-8">
      {(scopeData || []).map((sectionData: any, sectionIndex: any) => {
        if (!sectionData) return null;
        return (
          <div key={sectionIndex} className="bg-white border-2 border-gray-400 rounded-xl shadow-lg overflow-hidden">
            {/* Section Header Configuration */}
            <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xl">{sectionData.name || 'Unnamed Section'}</h4>
                  <p className="text-gray-200 mt-1 text-sm">{sectionData.description || 'No description'}</p>
                </div>
                {(scopeData || []).length > 1 && (
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
            <div className="bg-gray-100 border-b-2 border-gray-300 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Section Name</label>
                  <input
                    type="text"
                    value={sectionData.name || ''}
                    onChange={(e) => onUpdateSectionInfo(sectionIndex, 'name', e.target.value)}
                    className="w-full p-3 border-2 border-gray-400 rounded-lg text-sm font-medium focus:border-gray-600 focus:outline-none"
                    placeholder="e.g., Testing & Quality Assurance"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    value={sectionData.description || ''}
                    onChange={(e) => onUpdateSectionInfo(sectionIndex, 'description', e.target.value)}
                    className="w-full p-3 border-2 border-gray-400 rounded-lg text-sm focus:border-gray-600 focus:outline-none"
                    placeholder="Brief description of this scope area"
                  />
                </div>
              </div>
            </div>

            {/* Scope Items Management */}
            <div className="bg-gray-50 p-6">
              <div className="mb-6">
                <h5 className="font-bold text-gray-800 text-lg flex items-center">
                  <Plus className="w-5 h-5 mr-2 text-green-600" />
                  Scope Items ({(scopeSelections[sectionIndex] || []).length})
                </h5>
              </div>
              
              <div className="space-y-3">
                {(scopeSelections[sectionIndex] || []).map((item, index) => (
                  <div 
                    key={`${sectionIndex}-${index}`} 
                    className="flex items-center gap-4 p-4 bg-white border-2 rounded-lg shadow-sm border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
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
                        disabled={index === (scopeSelections[sectionIndex] || []).length - 1}
                        className={`p-1 rounded transition-colors ${
                          index === (scopeSelections[sectionIndex] || []).length - 1
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
                        className="w-full p-3 border-2 border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    <div className="flex gap-4 min-w-fit">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.small || false}
                          onChange={(e) => onSizeCheckboxChange(sectionIndex, index, 'small', e.target.checked)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="text-sm font-medium text-gray-700">Small</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.medium || false}
                          onChange={(e) => onSizeCheckboxChange(sectionIndex, index, 'medium', e.target.checked)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="text-sm font-medium text-gray-700">Medium</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.large || false}
                          onChange={(e) => onSizeCheckboxChange(sectionIndex, index, 'large', e.target.checked)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="text-sm font-medium text-gray-700">Large</span>
                      </label>
                    </div>

                    <button
                                                onClick={() => onRemoveScopeItem(sectionIndex, index)}
                      className="p-3 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Remove item"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                
                {(!scopeSelections[sectionIndex] || scopeSelections[sectionIndex].length === 0) && (
                  <div className="text-center py-12 text-gray-500 bg-white rounded-lg border-2 border-dashed border-gray-300">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
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
              
              {/* Add Item Button - Moved to Bottom */}
              {(scopeSelections[sectionIndex] && scopeSelections[sectionIndex].length > 0) && (
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
        );
      })}
    </div>
    
    {/* Add Section Button - Moved to Bottom */}
    <div className="mt-8 flex justify-center">
      <button
        onClick={onAddNewSection}
        className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium shadow-md transition-colors"
      >
        <Plus className="w-5 h-5 mr-2" />
        Add New Section
      </button>
    </div>
  </div>
);

// ============================================================================
// MAIN SCOPING TOOL COMPONENT
// ============================================================================

const ScopingEstimationTool = () => {
  // Use the admin configuration hook with empty initial selections
  const adminHook = useAdminConfiguration([], () => {});

  // Auto-load from file on component mount
  useEffect(() => {
    const autoLoadFromFile = async () => {
      console.log('App starting - please select a JSON config file');
      await adminHook.handleLoadFromFile();
    };
    
    autoLoadFromFile();
  }, []);









  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-md mb-6">
        {/* Header */}
        <div className="p-8 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Scoping Tool Administration</h1>
          <p className="text-gray-600">Manage scope sections and configure estimation parameters</p>
        </div>
      </div>

      <AdminPanel
        scopeData={adminHook.scopeData}
        scopeSelections={adminHook.scopeData.map((section: any) => section.items)}
        adminConfig={adminHook.adminConfig}
        hasUnsavedChanges={adminHook.hasUnsavedChanges}
        isLoaded={adminHook.isLoaded}
        onAddNewSection={adminHook.addNewSection}
        onRemoveSection={adminHook.removeSection}
        onUpdateSectionInfo={adminHook.updateSectionInfo}
        onAddScopeItem={adminHook.addScopeItem}
        onRemoveScopeItem={adminHook.removeScopeItem}
        onMoveItemUp={adminHook.moveItemUp}
        onMoveItemDown={adminHook.moveItemDown}
        onResetToDefaults={adminHook.resetToDefaults}
        onSprintHoursChange={adminHook.handleSprintHoursChange}
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
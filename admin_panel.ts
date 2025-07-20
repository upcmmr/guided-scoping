import React, { useState } from 'react';
import { Plus, Settings, RotateCcw, X, FolderPlus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { 
  getInitialScopeData, 
  createNewScopeItem, 
  createNewSection, 
  DEFAULT_CONFIG 
} from './scope-config';

// Admin configuration hook
export const useAdminConfiguration = (initialScopeSelections, onScopeSelectionsChange) => {
  const [scopeData, setScopeData] = useState(getInitialScopeData());
  const [adminConfig, setAdminConfig] = useState({ hoursPerSprint: DEFAULT_CONFIG.hoursPerSprint });

  // Section management functions
  const addNewSection = () => {
    const sectionKey = `section_${Date.now()}`;
    const sectionNumber = Object.keys(scopeData).length + 1;
    const newSection = createNewSection(sectionNumber);

    setScopeData(prev => ({
      ...prev,
      [sectionKey]: newSection
    }));

    onScopeSelectionsChange(prev => ({
      ...prev,
      [sectionKey]: [...newSection.items]
    }));
  };

  const removeSection = (sectionKey) => {
    setScopeData(prev => {
      const newData = { ...prev };
      delete newData[sectionKey];
      return newData;
    });

    onScopeSelectionsChange(prev => {
      const newSelections = { ...prev };
      delete newSelections[sectionKey];
      return newSelections;
    });
  };

  const updateSectionInfo = (sectionKey, field, value) => {
    setScopeData(prev => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        [field]: value
      }
    }));
  };

  // Item management functions
  const updateScopeItem = (category, index, updates) => {
    onScopeSelectionsChange(prev => {
      const currentItems = prev[category] || [];
      return {
        ...prev,
        [category]: currentItems.map((item, i) => 
          i === index ? { ...item, ...updates } : item
        )
      };
    });
    
    setScopeData(prev => {
      const currentSection = prev[category] || { items: [] };
      return {
        ...prev,
        [category]: {
          ...currentSection,
          items: (currentSection.items || []).map((item, i) => 
            i === index ? { ...item, ...updates } : item
          )
        }
      };
    });
  };

  const addScopeItem = (category) => {
    const newItem = createNewScopeItem();

    onScopeSelectionsChange(prev => {
      const currentItems = prev[category] || [];
      return {
        ...prev,
        [category]: [...currentItems, newItem]
      };
    });

    setScopeData(prev => {
      const currentSection = prev[category] || { items: [] };
      return {
        ...prev,
        [category]: {
          ...currentSection,
          items: [...(currentSection.items || []), newItem]
        }
      };
    });
  };

  const removeScopeItem = (category, index) => {
    onScopeSelectionsChange(prev => {
      const currentItems = prev[category] || [];
      return {
        ...prev,
        [category]: currentItems.filter((_, i) => i !== index)
      };
    });

    setScopeData(prev => {
      const currentSection = prev[category] || { items: [] };
      return {
        ...prev,
        [category]: {
          ...currentSection,
          items: (currentSection.items || []).filter((_, i) => i !== index)
        }
      };
    });
  };

  const moveItemUp = (category, index) => {
    if (index === 0) return;
    
    onScopeSelectionsChange(prev => {
      const currentItems = prev[category] || [];
      const newArray = [...currentItems];
      [newArray[index - 1], newArray[index]] = [newArray[index], newArray[index - 1]];
      
      return {
        ...prev,
        [category]: newArray
      };
    });

    setScopeData(prev => {
      const currentSection = prev[category] || { items: [] };
      const newItems = [...(currentSection.items || [])];
      [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
      
      return {
        ...prev,
        [category]: {
          ...currentSection,
          items: newItems
        }
      };
    });
  };

  const moveItemDown = (category, index) => {
    const currentItems = initialScopeSelections[category] || [];
    if (index === currentItems.length - 1) return;
    
    onScopeSelectionsChange(prev => {
      const currentItems = prev[category] || [];
      const newArray = [...currentItems];
      [newArray[index], newArray[index + 1]] = [newArray[index + 1], newArray[index]];
      
      return {
        ...prev,
        [category]: newArray
      };
    });

    setScopeData(prev => {
      const currentSection = prev[category] || { items: [] };
      const newItems = [...(currentSection.items || [])];
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
      
      return {
        ...prev,
        [category]: {
          ...currentSection,
          items: newItems
        }
      };
    });
  };

  const resetToDefaults = () => {
    const defaultData = getInitialScopeData();
    
    setScopeData(defaultData);
    
    const newSelections = {};
    Object.keys(defaultData).forEach(key => {
      newSelections[key] = [...defaultData[key].items];
    });
    onScopeSelectionsChange(() => newSelections);
    
    setAdminConfig({ hoursPerSprint: DEFAULT_CONFIG.hoursPerSprint });
  };

  const handleSprintHoursChange = (newHours) => {
    setAdminConfig(prev => ({
      ...prev,
      hoursPerSprint: parseInt(newHours) || DEFAULT_CONFIG.hoursPerSprint
    }));
  };

  const handleAdminHoursChange = (category, index, newHours) => {
    const hours = parseInt(newHours) || 0;
    updateScopeItem(category, index, { hours });
  };

  const handleAdminNameChange = (category, index, newName) => {
    updateScopeItem(category, index, { name: newName });
  };

  const handleSizeCheckboxChange = (category, index, size, checked) => {
    updateScopeItem(category, index, { [size]: checked });
  };

  return {
    scopeData,
    adminConfig,
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
    handleSizeCheckboxChange
  };
};

// Admin Panel Component
export const AdminPanel = ({ 
  scopeData, 
  scopeSelections, 
  adminConfig,
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
  onSizeCheckboxChange
}) => (
  <div className="bg-gray-50 border-2 border-gray-300 rounded-lg shadow-md p-6 mb-6">
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-xl font-semibold text-gray-800">Administration Panel</h3>
        <p className="text-sm text-gray-600 mt-1">Manage scope sections, use up/down arrows to reorder items, edit names and hours</p>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={onAddNewSection}
          className="flex items-center px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
        >
          <FolderPlus className="w-4 h-4 mr-1" />
          Add Section
        </button>
        <button
          onClick={onResetToDefaults}
          className="flex items-center px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          Reset to Defaults
        </button>
      </div>
    </div>
    
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Hours per Sprint
      </label>
      <input
        type="number"
        min="1"
        value={adminConfig.hoursPerSprint}
        onChange={(e) => onSprintHoursChange(e.target.value)}
        className="w-32 p-2 border border-gray-400 rounded-md"
      />
    </div>

    <div className="space-y-8">
      {Object.entries(scopeData || {}).map(([sectionKey, sectionData]) => {
        if (!sectionData) return null;
        return (
          <div key={sectionKey} className="bg-white border-2 border-gray-400 rounded-xl shadow-lg overflow-hidden">
            {/* Section Header Configuration */}
            <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xl">{sectionData.name || 'Unnamed Section'}</h4>
                  <p className="text-gray-200 mt-1 text-sm">{sectionData.description || 'No description'}</p>
                </div>
                {Object.keys(scopeData || {}).length > 1 && (
                  <button
                    onClick={() => onRemoveSection(sectionKey)}
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
              <h5 className="font-semibold text-gray-800 mb-4 flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Section Settings
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Section Name</label>
                  <input
                    type="text"
                    value={sectionData.name || ''}
                    onChange={(e) => onUpdateSectionInfo(sectionKey, 'name', e.target.value)}
                    className="w-full p-3 border-2 border-gray-400 rounded-lg text-sm font-medium focus:border-gray-600 focus:outline-none"
                    placeholder="e.g., Testing & Quality Assurance"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    value={sectionData.description || ''}
                    onChange={(e) => onUpdateSectionInfo(sectionKey, 'description', e.target.value)}
                    className="w-full p-3 border-2 border-gray-400 rounded-lg text-sm focus:border-gray-600 focus:outline-none"
                    placeholder="Brief description of this scope area"
                  />
                </div>
              </div>
            </div>

            {/* Scope Items Management */}
            <div className="bg-gray-50 p-6">
              <div className="flex items-center justify-between mb-6">
                <h5 className="font-bold text-gray-800 text-lg flex items-center">
                  <Plus className="w-5 h-5 mr-2 text-green-600" />
                  Scope Items ({(scopeSelections[sectionKey] || []).length})
                </h5>
                <button
                  onClick={() => onAddScopeItem(sectionKey)}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium shadow-md transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </button>
              </div>
              
              <div className="space-y-3">
                {(scopeSelections[sectionKey] || []).map((item, index) => (
                  <div 
                    key={`${sectionKey}-${index}`} 
                    className="flex items-center gap-4 p-4 bg-white border-2 rounded-lg shadow-sm border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
                  >
                    {/* Reorder Controls */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => onMoveItemUp(sectionKey, index)}
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
                        onClick={() => onMoveItemDown(sectionKey, index)}
                        disabled={index === (scopeSelections[sectionKey] || []).length - 1}
                        className={`p-1 rounded transition-colors ${
                          index === (scopeSelections[sectionKey] || []).length - 1
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
                        onChange={(e) => onAdminNameChange(sectionKey, index, e.target.value)}
                        className="w-full p-3 border-2 border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Scope item name"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        value={item.hours || 0}
                        onChange={(e) => onAdminHoursChange(sectionKey, index, e.target.value)}
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
                          onChange={(e) => onSizeCheckboxChange(sectionKey, index, 'small', e.target.checked)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="text-sm font-medium text-gray-700">Small</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.medium || false}
                          onChange={(e) => onSizeCheckboxChange(sectionKey, index, 'medium', e.target.checked)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="text-sm font-medium text-gray-700">Medium</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.large || false}
                          onChange={(e) => onSizeCheckboxChange(sectionKey, index, 'large', e.target.checked)}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="text-sm font-medium text-gray-700">Large</span>
                      </label>
                    </div>

                    <button
                      onClick={() => onRemoveScopeItem(sectionKey, index)}
                      className="p-3 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Remove item"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                
                {(!scopeSelections[sectionKey] || scopeSelections[sectionKey].length === 0) && (
                  <div className="text-center py-12 text-gray-500 bg-white rounded-lg border-2 border-dashed border-gray-300">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <Plus className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="mb-4 font-medium">No scope items in this section yet</p>
                    <button
                      onClick={() => onAddScopeItem(sectionKey)}
                      className="flex items-center mx-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-md transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Item
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);
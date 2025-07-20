import React, { useState } from 'react';
import { Plus, Minus, Settings, RotateCcw, X, FolderPlus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

// ============================================================================
// CONFIGURATION DATA
// ============================================================================

// Initial scope data configuration
const INITIAL_SCOPE_DATA = {
  integrations: {
    name: 'Integrations',
    description: 'Configure the number and complexity of system integrations required for your project.',
    items: [
      { name: 'Basic API Integration', hours: 40, selected: false, small: true, medium: true, large: true },
      { name: 'Database Integration', hours: 60, selected: false, small: true, medium: true, large: true },
      { name: 'Third-party Service Integration', hours: 80, selected: false, small: true, medium: true, large: true },
      { name: 'Legacy System Integration', hours: 120, selected: false, small: true, medium: true, large: true },
      { name: 'Real-time Data Integration', hours: 100, selected: false, small: true, medium: true, large: true },
      { name: 'File Import/Export', hours: 50, selected: false, small: true, medium: true, large: true },
      { name: 'Payment Gateway Integration', hours: 90, selected: false, small: false, medium: true, large: true },
      { name: 'Email Service Integration', hours: 30, selected: false, small: false, medium: true, large: true },
      { name: 'Authentication Integration', hours: 70, selected: false, small: false, medium: true, large: true },
      { name: 'Analytics Integration', hours: 45, selected: false, small: false, medium: false, large: true },
      { name: 'CRM Integration', hours: 110, selected: false, small: false, medium: false, large: true },
      { name: 'ERP Integration', hours: 150, selected: false, small: false, medium: false, large: true },
      { name: 'Cloud Storage Integration', hours: 55, selected: false, small: true, medium: true, large: true },
      { name: 'Notification Service Integration', hours: 40, selected: false, small: true, medium: true, large: true },
      { name: 'Custom API Development', hours: 200, selected: false, small: false, medium: false, large: true }
    ]
  },
  feCustomizations: {
    name: 'Frontend Customizations',
    description: 'Define the level of frontend customization and UI/UX complexity needed.',
    items: [
      { name: 'Custom Dashboard Design', hours: 80, selected: false, small: false, medium: true, large: true },
      { name: 'Responsive Layout Adjustments', hours: 60, selected: false, small: true, medium: true, large: true },
      { name: 'Custom Components', hours: 100, selected: false, small: false, medium: true, large: true },
      { name: 'Theme Customization', hours: 40, selected: false, small: true, medium: true, large: true },
      { name: 'Advanced Forms', hours: 70, selected: false, small: false, medium: true, large: true },
      { name: 'Data Visualization', hours: 90, selected: false, small: false, medium: true, large: true },
      { name: 'Interactive Elements', hours: 85, selected: false, small: true, medium: true, large: true },
      { name: 'Mobile Optimization', hours: 75, selected: false, small: true, medium: true, large: true },
      { name: 'Accessibility Features', hours: 65, selected: false, small: false, medium: true, large: true },
      { name: 'Custom Navigation', hours: 55, selected: false, small: true, medium: true, large: true },
      { name: 'Advanced Search Interface', hours: 95, selected: false, small: false, medium: false, large: true },
      { name: 'Real-time Updates UI', hours: 110, selected: false, small: false, medium: false, large: true }
    ]
  },
  dataIntegration: {
    name: 'Data Integration',
    description: 'Specify data integration requirements, including ETL processes and data transformation needs.',
    items: [
      { name: 'Basic Data Mapping', hours: 30, selected: false, small: true, medium: true, large: true },
      { name: 'Data Transformation', hours: 60, selected: false, small: false, medium: true, large: true },
      { name: 'Data Validation', hours: 40, selected: false, small: true, medium: true, large: true },
      { name: 'Data Migration', hours: 120, selected: false, small: false, medium: true, large: true },
      { name: 'ETL Pipeline', hours: 150, selected: false, small: false, medium: false, large: true },
      { name: 'Data Synchronization', hours: 100, selected: false, small: false, medium: true, large: true },
      { name: 'Real-time Data Processing', hours: 180, selected: false, small: false, medium: false, large: true },
      { name: 'Data Quality Assurance', hours: 80, selected: false, small: false, medium: true, large: true },
      { name: 'Backup & Recovery', hours: 90, selected: false, small: true, medium: true, large: true },
      { name: 'Data Analytics Setup', hours: 130, selected: false, small: false, medium: false, large: true }
    ]
  },
  testing: {
    name: 'Testing & Quality Assurance',
    description: 'Configure testing requirements including unit, integration, and end-to-end testing.',
    items: [
      { name: 'Unit Testing', hours: 60, selected: false, small: true, medium: true, large: true },
      { name: 'Integration Testing', hours: 80, selected: false, small: false, medium: true, large: true },
      { name: 'End-to-End Testing', hours: 100, selected: false, small: false, medium: true, large: true },
      { name: 'Performance Testing', hours: 90, selected: false, small: false, medium: false, large: true },
      { name: 'Security Testing', hours: 120, selected: false, small: false, medium: false, large: true },
      { name: 'User Acceptance Testing', hours: 70, selected: false, small: true, medium: true, large: true },
      { name: 'Automated Testing Setup', hours: 110, selected: false, small: false, medium: false, large: true },
      { name: 'Cross-browser Testing', hours: 50, selected: false, small: true, medium: true, large: true }
    ]
  }
};

// Default configuration settings
const DEFAULT_CONFIG = {
  hoursPerSprint: 200,
  catalogConfig: {
    size: 'small',
    complexity: 'low'
  }
};

// Multiplier configurations
const COMPLEXITY_MULTIPLIERS = {
  low: 1,
  medium: 1.2,
  high: 1.5
};

const SIZE_MULTIPLIERS = {
  small: 1,
  medium: 1.3,
  large: 1.6
};

// Catalog size options
const CATALOG_SIZE_OPTIONS = [
  { value: 'small', label: 'Small (less than 1,000 records)' },
  { value: 'medium', label: 'Medium (1,000 - 100,000 records)' },
  { value: 'large', label: 'Large (more than 100,000 records)' }
];

// Complexity options
const COMPLEXITY_OPTIONS = [
  { value: 'low', label: 'Low Complexity' },
  { value: 'medium', label: 'Medium Complexity' },
  { value: 'high', label: 'High Complexity' }
];

// Helper function to get initial scope data (deep clone to prevent mutations)
const getInitialScopeData = () => {
  return JSON.parse(JSON.stringify(INITIAL_SCOPE_DATA));
};

// Helper function to create a new scope item template
const createNewScopeItem = (name = 'New Scope Item', hours = 40) => ({
  name,
  hours,
  selected: false,
  small: false,
  medium: false,
  large: false
});

// Helper function to create a new section template
const createNewSection = (sectionNumber) => ({
  name: `New Section ${sectionNumber}`,
  description: 'Description for the new scope section.',
  items: [createNewScopeItem('Sample Scope Item')]
});

// ============================================================================
// ADMIN PANEL FUNCTIONALITY (separated for organization)
// ============================================================================

// Admin configuration hook
const useAdminConfiguration = (initialScopeSelections, onScopeSelectionsChange) => {
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
const AdminPanel = ({ 
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

// ============================================================================
// MAIN SCOPING TOOL COMPONENT
// ============================================================================

const ScopingEstimationTool = () => {
  // Initialize scope selections
  const [scopeSelections, setScopeSelections] = useState(() => {
    const defaultData = getInitialScopeData();
    const initial = {};
    Object.keys(defaultData).forEach(key => {
      initial[key] = [...defaultData[key].items];
    });
    return initial;
  });

  // State for showing detailed configurations
  const [showDetailed, setShowDetailed] = useState(() => {
    const defaultData = getInitialScopeData();
    const initial = {};
    Object.keys(defaultData).forEach(key => {
      initial[key] = false;
    });
    return initial;
  });

  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const [catalogConfig, setCatalogConfig] = useState(DEFAULT_CONFIG.catalogConfig);

  // Use the admin configuration hook
  const adminHook = useAdminConfiguration(scopeSelections, setScopeSelections);

  // Calculate total hours and sprints
  const calculateTotals = () => {
    let totalHours = 0;
    
    Object.values(scopeSelections || {}).forEach(categoryItems => {
      if (Array.isArray(categoryItems)) {
        categoryItems.forEach(item => {
          if (item && item.selected) {
            totalHours += (item.hours || 0);
          }
        });
      }
    });

    const complexityMultiplier = COMPLEXITY_MULTIPLIERS[catalogConfig.complexity] || 1;
    const sizeMultiplier = SIZE_MULTIPLIERS[catalogConfig.size] || 1;
    
    totalHours = Math.ceil(totalHours * complexityMultiplier * sizeMultiplier);
    
    const totalSprints = Math.ceil(totalHours / adminHook.adminConfig.hoursPerSprint);
    
    return { totalHours, totalSprints };
  };

  const { totalHours, totalSprints } = calculateTotals();

  // Handle detailed item selection
  const handleItemSelection = (category, index) => {
    setScopeSelections(prev => {
      const currentItems = prev[category] || [];
      return {
        ...prev,
        [category]: currentItems.map((item, i) => 
          i === index ? { ...item, selected: !item.selected } : item
        )
      };
    });
  };

  // Handle slider changes
  const handleSliderChange = (sectionKey, value) => {
    const sectionItems = scopeSelections[sectionKey] || [];
    
    const updatedItems = sectionItems.map(item => {
      let shouldBeSelected = false;
      
      if (value === 'small') {
        shouldBeSelected = item.small;
      } else if (value === 'medium') {
        shouldBeSelected = item.small || item.medium;
      } else if (value === 'large') {
        shouldBeSelected = item.small || item.medium || item.large;
      }
      
      return { ...item, selected: shouldBeSelected };
    });

    setScopeSelections(prev => ({
      ...prev,
      [sectionKey]: updatedItems
    }));
  };

  // Get current slider value based on selected items
  const getCurrentSliderValue = (sectionKey) => {
    const sectionItems = scopeSelections[sectionKey] || [];
    const selectedItems = sectionItems.filter(item => item.selected);
    
    if (selectedItems.length === 0) return 'small';
    
    // Check if selection matches large pattern
    const largeItems = sectionItems.filter(item => item.small || item.medium || item.large);
    if (selectedItems.length === largeItems.length) return 'large';
    
    // Check if selection matches medium pattern  
    const mediumItems = sectionItems.filter(item => item.small || item.medium);
    if (selectedItems.length === mediumItems.length) return 'medium';
    
    // Default to small
    return 'small';
  };

  // Handle hours change in user interface
  const handleUserHoursChange = (category, index, newHours) => {
    const hours = parseInt(newHours) || 0;
    adminHook.updateScopeItem(category, index, { hours });
  };

  // Add new item from user interface
  const addUserScopeItem = (category) => {
    const newItem = createNewScopeItem('New Scope Item', 40);
    // Override defaults for user-added items
    newItem.selected = true;
    newItem.small = true;

    setScopeSelections(prev => {
      const currentItems = prev[category] || [];
      return {
        ...prev,
        [category]: [...currentItems, newItem]
      };
    });
  };

  // Toggle detailed view
  const toggleDetailed = (category) => {
    setShowDetailed(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Remove scope item for user interface
  const removeScopeItemUser = (category, index) => {
    setScopeSelections(prev => {
      const currentItems = prev[category] || [];
      return {
        ...prev,
        [category]: currentItems.filter((_, i) => i !== index)
      };
    });
  };

  // Update scope item for user interface
  const updateScopeItemUser = (category, index, updates) => {
    setScopeSelections(prev => {
      const currentItems = prev[category] || [];
      return {
        ...prev,
        [category]: currentItems.map((item, i) => 
          i === index ? { ...item, ...updates } : item
        )
      };
    });
  };

  const ConfigurationSection = ({ sectionKey, sectionData }) => {
    if (!sectionData) return null;
    
    const currentSliderValue = getCurrentSliderValue(sectionKey);
    const selectedItems = (scopeSelections[sectionKey] || []).filter(item => item.selected);
    
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold mb-2 text-gray-800">{sectionData.name || 'Unnamed Section'}</h3>
        <p className="text-gray-600 mb-6">{sectionData.description || 'No description provided'}</p>
        
        {/* Project Size Slider */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-4">Project Size</label>
          
          {/* Custom Slider */}
          <div className="relative">
            {/* Slider Track */}
            <div className="w-full h-2 bg-gray-200 rounded-full relative">
              {/* Active Track */}
              <div 
                className="h-2 bg-blue-500 rounded-full transition-all duration-200"
                style={{ 
                  width: currentSliderValue === 'small' ? '0%' : 
                         currentSliderValue === 'medium' ? '50%' : '100%' 
                }}
              />
              
              {/* Slider Handle */}
              <div 
                className="absolute top-1/2 w-6 h-6 bg-white border-2 border-blue-500 rounded-full shadow-md transform -translate-y-1/2 cursor-pointer transition-all duration-200 hover:scale-110"
                style={{ 
                  left: currentSliderValue === 'small' ? '0%' : 
                        currentSliderValue === 'medium' ? 'calc(50% - 12px)' : 
                        'calc(100% - 24px)' 
                }}
              />
              
              {/* Click Areas */}
              <div className="absolute inset-0 flex">
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => handleSliderChange(sectionKey, 'small')}
                />
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => handleSliderChange(sectionKey, 'medium')}
                />
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => handleSliderChange(sectionKey, 'large')}
                />
              </div>
            </div>
            
            {/* Slider Labels */}
            <div className="flex justify-between mt-3">
              <span 
                className={`text-sm font-medium cursor-pointer transition-colors ${
                  currentSliderValue === 'small' ? 'text-blue-600' : 'text-gray-500'
                }`}
                onClick={() => handleSliderChange(sectionKey, 'small')}
              >
                Small
              </span>
              <span 
                className={`text-sm font-medium cursor-pointer transition-colors ${
                  currentSliderValue === 'medium' ? 'text-blue-600' : 'text-gray-500'
                }`}
                onClick={() => handleSliderChange(sectionKey, 'medium')}
              >
                Medium
              </span>
              <span 
                className={`text-sm font-medium cursor-pointer transition-colors ${
                  currentSliderValue === 'large' ? 'text-blue-600' : 'text-gray-500'
                }`}
                onClick={() => handleSliderChange(sectionKey, 'large')}
              >
                Large
              </span>
            </div>
            
            {/* Tick Marks */}
            <div className="absolute top-1 flex justify-between w-full pointer-events-none">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            </div>
          </div>
          
          {/* Selected items summary */}
          <div className="mt-4 text-sm text-gray-600">
            <span className="font-medium">{selectedItems.length} items selected</span>
            {selectedItems.length > 0 && (
              <span className="ml-2">
                ({selectedItems.reduce((sum, item) => sum + (item.hours || 0), 0)} hours)
              </span>
            )}
          </div>
        </div>

        {/* Customise Toggle */}
        <button
          onClick={() => toggleDetailed(sectionKey)}
          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          {showDetailed[sectionKey] ? <Minus className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
          {showDetailed[sectionKey] ? 'Hide' : 'Show'} Customise
        </button>

        {/* Detailed Configuration */}
        {showDetailed[sectionKey] && (
          <div className="mt-6 border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-800">Scope Items</h4>
              <button
                onClick={() => addUserScopeItem(sectionKey)}
                className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </button>
            </div>
            
            <div className="space-y-3">
              {(scopeSelections[sectionKey] || []).map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border">
                  <input
                    type="checkbox"
                    checked={item.selected || false}
                    onChange={() => handleItemSelection(sectionKey, index)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 focus:ring-2"
                  />
                  
                  <div className="flex-1">
                    <input
                      type="text"
                      value={item.name || ''}
                      onChange={(e) => updateScopeItemUser(sectionKey, index, { name: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Scope item name"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={item.hours || 0}
                      onChange={(e) => handleUserHoursChange(sectionKey, index, e.target.value)}
                      className="w-20 p-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-sm text-gray-600">hrs</span>
                  </div>

                  <button
                    onClick={() => removeScopeItemUser(sectionKey, index)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                    title="Remove item"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {(!scopeSelections[sectionKey] || scopeSelections[sectionKey].length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-3">No scope items in this section.</p>
                  <button
                    onClick={() => addUserScopeItem(sectionKey)}
                    className="flex items-center mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Item
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Guided Scoping and Estimation Tool</h1>
            <p className="text-gray-600">Configure your project scope and get automated development estimates</p>
          </div>
          <button
            onClick={() => setShowAdminPanel(!showAdminPanel)}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showAdminPanel 
                ? 'bg-gray-600 text-white hover:bg-gray-700' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Settings className="w-4 h-4 mr-2" />
            {showAdminPanel ? 'Hide Admin' : 'Show Admin'}
          </button>
        </div>
      </div>

      {showAdminPanel && (
        <AdminPanel
          scopeData={adminHook.scopeData}
          scopeSelections={scopeSelections}
          adminConfig={adminHook.adminConfig}
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
        />
      )}

      {/* Dynamic Configuration Sections */}
      {Object.entries(adminHook.scopeData || {}).map(([sectionKey, sectionData]) => {
        if (!sectionData) return null;
        return (
          <ConfigurationSection
            key={sectionKey}
            sectionKey={sectionKey}
            sectionData={sectionData}
          />
        );
      })}

      {/* Add New Section Button */}
      <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6 text-center">
        <button
          onClick={adminHook.addNewSection}
          className="flex items-center mx-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <FolderPlus className="w-5 h-5 mr-2" />
          Add New Scope Section
        </button>
        <p className="text-gray-600 mt-2 text-sm">
          Create custom scope sections to match your project requirements
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Data Catalog Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Catalog Size</label>
            <select
              value={catalogConfig.size}
              onChange={(e) => setCatalogConfig(prev => ({ ...prev, size: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              {CATALOG_SIZE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Complexity</label>
            <select
              value={catalogConfig.complexity}
              onChange={(e) => setCatalogConfig(prev => ({ ...prev, complexity: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              {COMPLEXITY_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow-md p-8 text-white">
        <h2 className="text-2xl font-bold mb-6">Project Estimation Results</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white bg-opacity-20 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Total Development Hours</h3>
            <p className="text-4xl font-bold">{totalHours}</p>
            <p className="text-sm opacity-80">hours</p>
          </div>
          
          <div className="bg-white bg-opacity-20 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Development Sprints</h3>
            <p className="text-4xl font-bold">{totalSprints}</p>
            <p className="text-sm opacity-80">sprints</p>
          </div>
          
          <div className="bg-white bg-opacity-20 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Hours per Sprint</h3>
            <p className="text-4xl font-bold">{adminHook.adminConfig.hoursPerSprint}</p>
            <p className="text-sm opacity-80">hours</p>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-white bg-opacity-10 rounded-lg">
          <h4 className="font-semibold mb-2">Estimation Notes:</h4>
          <ul className="text-sm opacity-90 space-y-1">
            <li>• Estimates include catalog size and complexity multipliers</li>
            <li>• Sprint capacity assumes {adminHook.adminConfig.hoursPerSprint} hours per sprint</li>
            <li>• Actual timelines may vary based on team size and experience</li>
            <li>• Consider adding 10-20% buffer for project management and contingencies</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ScopingEstimationTool;
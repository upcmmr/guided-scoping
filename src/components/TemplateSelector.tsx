// ============================================================================
// TEMPLATE SELECTOR - User-facing template selection interface
// ============================================================================

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Clock, Zap, Layers, CheckCircle2, ChevronRight } from 'lucide-react';
import { loadAllTemplateMetadata, type TemplateMetadata } from '../utils/templateScanner';
import { APP_DEFAULTS } from '../config/defaults';
import { getButtonClasses, getHeadingClasses, getBodyClasses, iconSizes, animations } from '../utils/styleUtils';

interface TemplateSelectorProps {
  onTemplateSelected: (template: TemplateMetadata) => void;
  onBack?: () => void;
  inline?: boolean;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onTemplateSelected, onBack, inline = false }) => {
  const [templates, setTemplates] = useState<TemplateMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoading(true);
        const templateData = await loadAllTemplateMetadata();
        setTemplates(templateData);
        setError(null);
      } catch (err) {
        setError('Failed to load project templates. Please try again.');
        console.error('Error loading templates:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, []);

  const handleTemplateSelect = (template: TemplateMetadata) => {
    setSelectedTemplate(template.filename);
    onTemplateSelected(template);
  };

  const content = (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div>
                    <h1 className={getHeadingClasses('h2')}>Select a Template</h1>
        <p className={`${getBodyClasses('base')} mt-2`}>
              Select a template that best matches your project type to get started with accurate scoping.
            </p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className={animations.spinner}></div>
          <p className={`${getBodyClasses('base')} mt-4`}>{APP_DEFAULTS.messages.loading.templates}</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <p className="text-red-600 font-medium mb-2">Error Loading Templates</p>
          <p className={getBodyClasses('base')}>{error}</p>
        </div>
      )}

      {/* Templates Grid */}
      {!loading && !error && templates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.filename}
              className={`border-2 rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg ${
                selectedTemplate === template.filename
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleTemplateSelect(template)}
            >
              {/* Template Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                {template.projectType}
              </h3>
              <p className="text-base text-gray-600 leading-relaxed">
                    {template.description}
                  </p>
                </div>
                {selectedTemplate === template.filename && (
                  <CheckCircle2 className="w-6 h-6 text-blue-600 ml-3 flex-shrink-0" />
                )}
              </div>

              {/* Template Stats */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Layers className="w-4 h-4 mr-2 text-purple-500" />
                  <span>{template.sectionsCount} scope sections, {template.totalItems} scope items</span>
                </div>
              </div>

              {/* Select Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTemplateSelect(template);
                }}
                className={`w-full flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedTemplate === template.filename
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {selectedTemplate === template.filename ? 'Selected' : 'Select Template'}
                <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* No Templates Found */}
      {!loading && !error && templates.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Layers className="w-8 h-8 text-gray-400" />
          </div>
          <p className={`${getBodyClasses('base')} font-medium mb-2`}>{APP_DEFAULTS.messages.emptyStates.noTemplates}</p>
          <p className={getBodyClasses('muted')}>{APP_DEFAULTS.messages.emptyStates.noTemplatesDescription}</p>
        </div>
      )}

      {/* Continue Button */}
      {selectedTemplate && (
        <div className="fixed bottom-6 right-6">
          <button
            onClick={() => {
              const template = templates.find(t => t.filename === selectedTemplate);
              if (template) handleTemplateSelect(template);
            }}
            className={getButtonClasses('primary')}
          >
            Continue with Template
            <ChevronRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      )}
    </>
  );

  return inline ? content : (
    <div className="max-w-7xl mx-auto p-6 min-h-screen">
      {content}
    </div>
  );
};

export default TemplateSelector; 
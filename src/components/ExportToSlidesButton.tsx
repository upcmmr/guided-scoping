// ============================================================================
// EXPORT TO SLIDES BUTTON - Standalone component for Google Slides export
// ============================================================================

import React, { useState } from 'react';
import { exportToGoogleSlides, SlidesExportResult } from '../utils/slidesExporter';

interface ExportToSlidesButtonProps {
  projectData: any;
  bidCalculation: any;
  scopeSelections: Map<string, boolean>;
  className?: string;
}

const ExportToSlidesButton: React.FC<ExportToSlidesButtonProps> = ({
  projectData,
  bidCalculation,
  scopeSelections,
  className = ''
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    url?: string;
  }>({ type: null, message: '' });

  const handleExportToSlides = async () => {
    setIsExporting(true);
    setExportStatus({ type: null, message: '' });

    try {
      const result: SlidesExportResult = await exportToGoogleSlides(
        projectData,
        bidCalculation,
        scopeSelections
      );

      if (result.success) {
        // No success dialog - just silently complete
        // The Apps Script will handle opening the presentation
      } else {
        setExportStatus({
          type: 'error',
          message: result.error || 'Failed to create slides'
        });
      }
    } catch (error) {
      console.error('Export to slides failed:', error);
      setExportStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Export failed'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const clearStatus = () => {
    setExportStatus({ type: null, message: '' });
  };

  return (
    <div className="relative">
      {/* Export Button */}
      <button
        onClick={handleExportToSlides}
        disabled={isExporting}
        className={`flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium ${className}`}
        title="Export bid to Google Slides presentation"
      >
        {isExporting ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Exporting...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export to Slides
          </>
        )}
      </button>

      {/* Error Messages Only */}
      {exportStatus.type === 'error' && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 rounded-lg shadow-lg z-50 bg-red-50 border border-red-200 text-red-800">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium">{exportStatus.message}</p>
              </div>
            </div>
            <button
              onClick={clearStatus}
              className="text-gray-400 hover:text-gray-600 ml-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportToSlidesButton;

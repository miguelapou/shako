import React, { useState } from 'react';
import { Package } from 'lucide-react';
import { getVendorDisplayColor } from '../../utils/colorUtils';

// LinkedPartsSection - Display parts linked to a project with unlink functionality
const LinkedPartsSection = ({
  projectId,
  parts,
  unlinkPartFromProject,
  getVendorColor,
  vendorColors,
  darkMode,
  setConfirmDialog,
  setActiveTab,
  onNavigateToTab
}) => {
  const linkedParts = parts.filter(part => part.projectId === projectId);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className={`mt-6 pt-6 border-t ${
      darkMode ? 'border-gray-600' : 'border-gray-200'
    }`}>
      <h3 className={`text-lg font-semibold mb-3 ${
        darkMode ? 'text-gray-200' : 'text-gray-800'
      }`}>
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          <span>Linked Parts ({linkedParts.length})</span>
        </div>
      </h3>
      {linkedParts.length === 0 ? (
        <button
          onClick={() => {
            if (onNavigateToTab) {
              onNavigateToTab('parts');
            } else if (setActiveTab) {
              setActiveTab('parts');
            }
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`text-center py-8 rounded-lg border w-full cursor-pointer transition-colors ${
            darkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 border-gray-200'
          }`}
          style={{ color: isHovered ? (darkMode ? '#60a5fa' : '#2563eb') : (darkMode ? '#9ca3af' : '#6b7280') }}
        >
          <Package className="w-12 h-12 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No parts linked</p>
        </button>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:max-h-[540px] overflow-y-auto pr-2">
          {linkedParts.map((part) => (
            <div
              key={part.id}
              className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
                darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex-1 min-w-0">
                <h4 className={`font-medium truncate ${
                  darkMode ? 'text-gray-100' : 'text-slate-800'
                }`}>
                  {part.part}
                </h4>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {part.vendor && (
                    vendorColors[part.vendor] ? (
                      (() => {
                        const colors = getVendorDisplayColor(vendorColors[part.vendor], darkMode);
                        return (
                          <span
                            className="inline-block px-2 py-0.5 rounded-full text-xs font-medium border"
                            style={{
                              backgroundColor: colors.bg,
                              color: colors.text,
                              borderColor: colors.border
                            }}
                          >
                            {part.vendor}
                          </span>
                        );
                      })()
                    ) : (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getVendorColor(part.vendor, vendorColors)}`}>
                        {part.vendor}
                      </span>
                    )
                  )}
                  <span className={`text-sm font-bold ${
                    darkMode ? 'text-gray-200' : 'text-gray-900'
                  }`}>
                    ${part.total.toFixed(2)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    title: 'Unlink Part',
                    message: `Are you sure you want to unlink "${part.part}" from this project?`,
                    confirmText: 'Unlink',
                    onConfirm: () => {
                      unlinkPartFromProject(part.id);
                    }
                  });
                }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                  darkMode
                    ? 'text-gray-400 hover:text-red-400 hover:bg-gray-600 border-gray-600 hover:border-red-500'
                    : 'text-gray-600 hover:text-red-600 hover:bg-red-50 border-gray-300 hover:border-red-300'
                }`}
                title="Unlink from project"
              >
                Unlink
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LinkedPartsSection;

import React from 'react';
import { Package, SquareGantt, Edit2 } from 'lucide-react';
import PrimaryButton from './PrimaryButton';

/**
 * Shared project view footer actions used by both ProjectDetailModal
 * and VehicleDetailModal's inline project view.
 *
 * Renders: [Add Part] [Notes / + Notes] [Edit]
 */
const ProjectViewActions = ({
  project,
  darkMode,
  onAddPart,      // optional — button hidden when absent or project is archived
  onNotesClick,
  onEditClick,
  editLabel = 'Edit',
  className = '',
}) => {
  const hasNotes = project?.notes &&
    project.notes.trim() !== '' &&
    project.notes.trim() !== '<br>';

  const secondaryBtn = `px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm ${
    darkMode
      ? 'bg-gray-700 hover:bg-gray-600 text-gray-100 border border-gray-600'
      : 'bg-gray-200 hover:bg-gray-300 text-gray-800 border border-gray-300'
  }`;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {onAddPart && !project?.archived && (
        <button
          onClick={() => onAddPart(project)}
          title="Add Part to this Project"
          className={secondaryBtn}
        >
          <span className="sm:hidden">+</span>
          <Package className="w-4 h-4" />
          <span className="hidden sm:inline">Add Part</span>
        </button>
      )}
      <button
        onClick={onNotesClick}
        title="Project Notes"
        className={secondaryBtn}
      >
        <span className="sm:hidden">+</span>
        <SquareGantt className="w-4 h-4" />
        <span className="hidden sm:inline">{hasNotes ? 'Notes' : '+ Notes'}</span>
      </button>
      <PrimaryButton onClick={onEditClick} icon={Edit2}>
        {editLabel}
      </PrimaryButton>
    </div>
  );
};

export default ProjectViewActions;

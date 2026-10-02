import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
} from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';

export const RelationEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
}) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 20,
  });

  const cardinality = (data?.cardinalityLabel as string) || '1 : N';
  const relationType = (data?.relationType as string) || 'ManyToOne';
  const sourceProperty = (data?.sourceProperty as string) || '';
  const customColor = data?.edgeColor as string;
  const customTextColor = data?.edgeTextColor as string;

  const strokeColor = selected
    ? '#a855f7'
    : customColor ||
      (relationType === 'ManyToMany'
        ? '#f472b6'
        : relationType === 'OneToOne'
        ? '#38bdf8'
        : '#818cf8');

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: selected ? 3.5 : 2.5,
          stroke: strokeColor,
          transition: 'stroke 0.2s ease, stroke-width 0.2s ease',
          filter: selected
            ? 'drop-shadow(0 0 8px rgba(168, 85, 247, 0.8))'
            : customColor
            ? `drop-shadow(0 0 4px ${customColor}44)`
            : 'none',
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            borderColor: selected ? '#a855f7' : customColor || 'rgba(51, 65, 85, 0.8)',
          }}
          className={`nodrag nopan flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono shadow-xl backdrop-blur-md cursor-pointer transition-all border ${
            selected
              ? 'bg-purple-950/95 border-purple-500 text-purple-200 scale-110 shadow-purple-500/30'
              : 'bg-slate-900/95 text-slate-200 hover:scale-105'
          }`}
        >
          <span
            style={{ color: customTextColor || undefined }}
            className={`font-bold ${
              !customTextColor
                ? relationType === 'ManyToMany'
                  ? 'text-pink-400'
                  : relationType === 'OneToOne'
                  ? 'text-sky-400'
                  : 'text-indigo-400'
                : ''
            }`}
          >
            {cardinality}
          </span>
          {sourceProperty && (
            <span className="text-slate-300 font-sans text-[10px] max-w-[90px] truncate" title={sourceProperty}>
              ({sourceProperty})
            </span>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

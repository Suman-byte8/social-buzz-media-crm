import React, { useState } from "react";

const KanbanBoard = ({ columns, onDrop, className }) => {
  const [draggedItem, setDraggedItem] = useState(null);

  const handleDragStart = (item, columnId) => {
    setDraggedItem({ item, fromColumn: columnId });
  };

  const handleDragOver = (e, targetColumn) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetColumn) => {
    e.preventDefault();
    if (draggedItem) {
      onDrop && onDrop(draggedItem.item, draggedItem.fromColumn, targetColumn);
      setDraggedItem(null);
    }
  };

  return (
    <div className={`flex gap-3 overflow-x-auto pb-4 ${className || ''}`.trim()}>
      {columns.map((column) => (
        <div
          key={column.id}
          className="flex flex-col gap-2 min-w-[250px] max-w-[300px] bg-surface-container-low/40 rounded-lg p-2 border border-outline-variant/30"
          onDragOver={(e) => handleDragOver(e, column.id)}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          {/* Column Header */}
          <div className="flex items-center justify-between px-1 shrink-0">
            <h3 className="font-semibold text-xs text-on-surface uppercase tracking-wider flex items-center gap-1.5">
              {column.title}
              {column.count !== undefined && (
                <span className={`rounded-full py-0.2 text-[10px] font-normal ${
                  column.count > 0 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-surface-variant text-on-surface-variant'
                }`}>
                  {column.count}
                </span>
              )}
            </h3>
          </div>

          {/* Column Tasks */}
          <div className="flex flex-col gap-2 flex-1 min-h-[100px]">
            {column.items?.map((item, idx) => (
              <div
                key={item.id || idx}
                className="bg-surface-container-lowest rounded-md border border-outline-variant p-2.5 shadow-2xs hover:shadow-xs transition-shadow cursor-pointer flex flex-col gap-2"
                draggable
                onDragStart={(e) => handleDragStart(item, column.id)}
              >
                {item.content}
              </div>
            ))}
            {column.items?.length === 0 && (
              <div className="text-xs text-on-surface-variant/60 text-center py-4">
                No items
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard;
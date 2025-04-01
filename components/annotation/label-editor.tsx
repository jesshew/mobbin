import React from "react"
import { BoundingBox } from "@/types/annotation"

interface LabelEditorProps {
  box: BoundingBox
  editingLabelId: number | null
  editingLabelText: string
  setEditingLabelId: (id: number | null) => void
  setEditingLabelText: (text: string) => void
  onBoxUpdate: (box: BoundingBox) => void
}


export function LabelEditor({
  box,
  editingLabelId,
  editingLabelText,
  setEditingLabelId,
  setEditingLabelText,
  onBoxUpdate
}: LabelEditorProps) {
  const handleUpdateAndClose = () => {
    const updatedBox = { ...box, textLabel: editingLabelText }
    onBoxUpdate(updatedBox)
    setEditingLabelId(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleUpdateAndClose()
    } else if (e.key === "Escape") {
      setEditingLabelId(null)
    }
  }

  const handleMouseEnter = () => {
    if (editingLabelId !== box.id) {
      setEditingLabelId(box.id)
      setEditingLabelText(box.textLabel)
    }
  }

  const labelStyles = "bg-blue-500 text-white text-xs px-1 py-0.5 rounded"

  return (
    <div
      className="absolute -top-6 left-0 min-w-[60px] max-w-full"
      onMouseEnter={handleMouseEnter}
    >
      {editingLabelId === box.id ? (
        <input
          type="text"
          value={editingLabelText}
          onChange={(e) => setEditingLabelText(e.target.value)}
          onBlur={handleUpdateAndClose}
          onKeyDown={handleKeyDown}
          className={`${labelStyles} w-full outline-none border border-white`}
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className={`${labelStyles} pointer-events-auto cursor-text inline-block max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap`}>
          {box.textLabel}
        </span>
      )}
    </div>
  )
}
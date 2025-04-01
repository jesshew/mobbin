import React from "react"

interface LabelEditorProps {
  box: BoundingBox
  editingLabelId: number | null
  editingLabelText: string
  setEditingLabelId: (id: number | null) => void
  setEditingLabelText: (text: string) => void
  onBoxUpdate: (box: BoundingBox) => void
}

interface BoundingBox {
  id: number
  label: string
  textLabel: string
  description: string
  x: number
  y: number
  width: number
  height: number
  inferenceTime: number
}

export function LabelEditor({
  box,
  editingLabelId,
  editingLabelText,
  setEditingLabelId,
  setEditingLabelText,
  onBoxUpdate
}: LabelEditorProps) {
  return (
    <div
      className="absolute -top-6 left-0 min-w-[60px] max-w-full"
      onMouseEnter={() => {
        if (editingLabelId !== box.id) {
          setEditingLabelId(box.id)
          setEditingLabelText(box.textLabel)
        }
      }}
    >
      {editingLabelId === box.id ? (
        <input
          type="text"
          value={editingLabelText}
          onChange={(e) => setEditingLabelText(e.target.value)}
          onBlur={() => {
            const updatedBox = { ...box, textLabel: editingLabelText }
            onBoxUpdate(updatedBox)
            setEditingLabelId(null)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const updatedBox = { ...box, textLabel: editingLabelText }
              onBoxUpdate(updatedBox)
              setEditingLabelId(null)
            } else if (e.key === "Escape") {
              setEditingLabelId(null)
            }
          }}
          className="bg-blue-500 text-white text-xs px-1 py-0.5 rounded w-full outline-none border border-white"
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="bg-blue-500 text-white text-xs px-1 py-0.5 rounded pointer-events-auto cursor-text inline-block max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
          {box.textLabel}
        </span>
      )}
    </div>
  )
} 
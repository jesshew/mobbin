import { useState, useEffect, useRef } from "react"
import { BoundingBox } from "@/types/annotation"

interface LabelEditorProps {
  box: BoundingBox
  isSelected: boolean
  editingLabelId: number | null
  editingLabelText: string
  setEditingLabelId: (id: number | null) => void
  setEditingLabelText: (text: string) => void
  updateLabelAndFinishEditing: () => void
}

export function LabelEditor({
  box,
  isSelected,
  editingLabelId,
  editingLabelText,
  setEditingLabelId,
  setEditingLabelText,
  updateLabelAndFinishEditing
}: LabelEditorProps) {
  const [isHovered, setIsHovered] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isEditing = editingLabelId === box.id

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  const handleLabelClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isEditing) {
      setEditingLabelId(box.id)
      setEditingLabelText(box.textLabel)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      updateLabelAndFinishEditing()
    } else if (e.key === "Escape") {
      setEditingLabelId(null)
    }
  }

  const labelStyles = "bg-black text-white text-xs px-1 py-0.5 rounded"

  return (
    <div
      className="absolute -top-6 left-0 min-w-[60px] max-w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleLabelClick}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editingLabelText}
          onChange={(e) => setEditingLabelText(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={updateLabelAndFinishEditing}
          className={`${labelStyles} w-full outline-none border border-white`}
          placeholder="Enter label..."
        />
      ) : (
        <span className={`${labelStyles} pointer-events-auto cursor-text inline-block max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap`}>
          {box.textLabel}
        </span>
      )}
    </div>
  )
}
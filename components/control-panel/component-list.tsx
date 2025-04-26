import { ScrollArea } from "@/components/ui/scroll-area"
import { Component, Element } from "@/types/annotation"
import { ComponentListItem } from "@/components/component-list-item"

interface ComponentListProps {
  components: Component[]
  hoveredElementId: number | null
  setHoveredElementId: (id: number | null) => void
  onElementSelect: (element: Element) => void
  onElementDelete: (id: number) => void
  showElementsByDefault?: boolean
}

export function ComponentList({
  components,
  hoveredElementId,
  setHoveredElementId,
  onElementSelect,
  onElementDelete,
  showElementsByDefault = false
}: ComponentListProps) {
  return (
    <ScrollArea className="flex-1">
      <div className="p-4 space-y-2">
        {components.length === 0 ? (
          <div className="text-center p-6 text-muted-foreground">
            No components found. Try analyzing an image or importing annotations.
          </div>
        ) : (
          components.map((component) => (
            <ComponentListItem
              key={component.component_id}
              component={component}
              onElementSelect={onElementSelect}
              onElementDelete={onElementDelete}
              hoveredElementId={hoveredElementId}
              setHoveredElementId={setHoveredElementId}
              showElementsByDefault={showElementsByDefault}
            />
          ))
        )}
      </div>
    </ScrollArea>
  )
} 
import React from 'react';
// Assuming ComponentListItem is imported from its own file or a shared directory
import { ComponentListItem } from "@/components/component"; 
import { ComponentListProps } from './types';
import { calculateComponentAccuracy } from './utils';
import { Component } from "@/types/Annotation"; // Import base Component type

export const ComponentList = ({ 
  screenshot, 
  handleComponentSelect, 
  handleComponentHover,
  handleElementSelect,
  hoveredElementId,
  setHoveredElementId,
  selectedComponent
}: ComponentListProps) => {
  // Sort components alphabetically by component_name
  const sortedComponents = [...screenshot.components].sort((a, b) => {
    // Example sorting - currently sorts by name
    return a.component_name.localeCompare(b.component_name)
  });
  
  return (
    <div className="md:w-[40%] h-full md:overflow-hidden flex flex-col">
      <h3 className="font-medium py-2 bg-white sticky top-0 z-10">Components:</h3>
      
      <div className="space-y-3 overflow-y-auto flex-grow pr-2">
        {sortedComponents.map((component) => {
          // Calculate component accuracy using the imported function
          const componentAccuracy = calculateComponentAccuracy(component.elements as any[]); // Use imported function
          
          // Create a component object suitable for ComponentListItem, potentially adding accuracy
          const componentWithAccuracy = {
            ...component,
            // Add the calculated accuracy to the component object
            component_accuracy: componentAccuracy
          };

          return (
            <div 
              key={component.component_id}
              className="cursor-pointer"
              onClick={() => handleComponentSelect(component)} // Pass original component
              onMouseEnter={() => handleComponentHover(component)} // Pass original component
              onMouseLeave={() => handleComponentHover(null)}
            >
              <ComponentListItem 
                component={componentWithAccuracy} // Pass component with accuracy to the list item
                onElementSelect={handleElementSelect}
                onElementDelete={(elementId: number) => console.log(`Delete element ${elementId}`)} // Placeholder
                hoveredElementId={hoveredElementId}
                setHoveredElementId={setHoveredElementId}
                showElementsByDefault={selectedComponent?.component_id === component.component_id}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}; 
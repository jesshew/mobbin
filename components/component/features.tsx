import { useState, useEffect } from 'react';
import { MessageSquare, Layers, Image, Users, FileText, Activity, Monitor } from 'lucide-react';

// More informative and self-explanatory infographic component for each card
const InformativeInfoGraphic = ({ type }: { type: string }) => {
  const [animate, setAnimate] = useState(false);
  
  useEffect(() => {
    // Set a timer to trigger animation after a short delay
    const timer = setTimeout(() => setAnimate(true), 500);
    // Clear the timer on component unmount to prevent memory leaks
    return () => clearTimeout(timer);
  }, []);

  // Renders different detailed infographics based on the card type
  const renderInfoGraphic = () => {
    switch(type) {
      case "llm":
        return (
          // Container for LLM infographic, increased height from h-64 to h-72
          <div className="relative h-90 w-full bg-indigo-50 rounded-lg overflow-hidden p-4 shadow-inner">
            <div className="absolute top-2 left-2 bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full font-medium">ML Processing</div>
            
            {/* UI screenshot with elements */}
            <div className="relative mt-6 border border-gray-200 bg-white rounded-lg p-2 mx-auto max-w-xs shadow-sm">
              <div className="text-xs text-gray-500 mb-2 text-center">UI Screenshot</div>
              <div className="flex space-x-2 mb-2">
                <div className="h-6 w-1/3 bg-gray-100 rounded"></div>
                <div className="h-6 w-1/3 bg-gray-100 rounded"></div>
              </div>
              <div className="h-8 w-full bg-indigo-100 rounded mb-2"></div>
              <div className="flex space-x-2">
                <div className="h-6 w-1/4 bg-gray-100 rounded"></div>
                <div className="h-6 w-2/3 bg-gray-100 rounded"></div>
              </div>
            </div>
            
            {/* Arrow pointing down, animates opacity */}
            <div className="flex justify-center my-2">
              <svg className={`w-6 h-6 text-indigo-500 transition-all duration-1000 ${animate ? 'opacity-100' : 'opacity-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            
            {/* Result with labels, animates opacity and position */}
            <div className={`bg-white rounded-lg p-2 shadow-md border border-indigo-100 transition-all duration-1000 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="text-xs text-indigo-600 font-medium mb-1">LLM Extraction Results:</div>
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 bg-indigo-200 rounded flex items-center justify-center text-indigo-600 text-xs mr-2">1</div>
                <div className="flex-1">
                  <div className="text-xs font-medium">Search Field</div>
                  <div className="text-xs text-gray-500">Input element for user search queries</div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-indigo-200 rounded flex items-center justify-center text-indigo-600 text-xs mr-2">2</div>
                <div className="flex-1">
                  <div className="text-xs font-medium">Navigation Menu</div>
                  <div className="text-xs text-gray-500">Primary site navigation controls</div>
                </div>
              </div>
            </div>
            
            <div className="text-xs text-center mt-2 font-medium text-indigo-600">Auto-generated labels & descriptions from UI images</div>
          </div>
        );
      case "prompt":
        return (
          // Container for Prompt infographic, increased height from h-64 to h-72
          <div className="relative h-80 w-full bg-blue-50 rounded-lg overflow-hidden p-4 shadow-inner">
            <div className="absolute top-2 left-2 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">Spatial Context</div>
            
            {/* UI Screenshot */}
            <div className="relative mt-6 border border-gray-200 bg-white rounded-lg shadow-sm mx-auto mb-2">
              {/* UI mockup with animated rings on elements */}
              <div className="p-2 relative">
                <div className="absolute inset-0 bg-blue-50 bg-opacity-0 transition-all duration-500"></div>
                <div className="flex items-center space-x-2 mb-2 relative">
                  <div className={`h-6 w-6 bg-blue-100 rounded-md transition-all duration-500 ${animate ? 'ring-2 ring-blue-500' : ''}`}></div>
                  <div className="h-6 w-24 bg-gray-100 rounded-md"></div>
                  <div className={`h-6 w-6 bg-blue-100 rounded-md ml-auto transition-all duration-500 ${animate ? 'ring-2 ring-blue-500 delay-300' : ''}`}></div>
                </div>
                
                <div className={`h-8 w-full bg-blue-100 rounded-md mb-2 transition-all duration-500 ${animate ? 'ring-2 ring-blue-500 delay-100' : ''}`}></div>
                
                <div className="flex space-x-2">
                  <div className={`h-6 w-12 bg-blue-100 rounded-md transition-all duration-500 ${animate ? 'ring-2 ring-blue-500 delay-200' : ''}`}></div>
                  <div className="h-6 w-32 bg-gray-100 rounded-md"></div>
                </div>
              </div>
            </div>
            
            {/* Context aware prompt, animates opacity */}
            <div className={`bg-white rounded-lg p-2 border border-blue-100 shadow-md mb-2 transition-all duration-700 ${animate ? 'opacity-100' : 'opacity-0'}`}>
              <div className="text-xs text-blue-600 font-medium">Generated Context-Aware Prompt:</div>
              <div className="text-xs text-gray-700 mt-1 italic">
                "Identify the main search field <span className="text-blue-600 font-medium">located in the center</span> and the 
                <span className="text-blue-600 font-medium"> adjacent button to its right</span>. Determine the 
                <span className="text-blue-600 font-medium"> hierarchical relationship</span> between elements."
              </div>
            </div>
            
            {/* Diagram showing spatial relationships, animates opacity */}
            <div className={`flex justify-center items-center mt-1 transition-all duration-1000 delay-500 ${animate ? 'opacity-100' : 'opacity-0'}`}>
              <div className="flex space-x-4 items-center">
                <div className="text-xs text-center">
                  <div className="h-6 w-6 bg-blue-200 rounded-md mx-auto"></div>
                  <span className="text-blue-600">Button</span>
                </div>
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                <div className="text-xs text-center">
                  <div className="h-6 w-12 bg-blue-300 rounded-md mx-auto"></div>
                  <span className="text-blue-600">Search Field</span>
                </div>
              </div>
            </div>
            
            <div className="text-xs text-center mt-2 font-medium text-blue-600">Spatial relationships inform better annotations</div>
          </div>
        );
      case "detection":
        return (
          // Container for Detection infographic, conveying element localization from description
          <div className="relative h-85 w-full bg-cyan-50 rounded-lg overflow-hidden p-4 shadow-inner">
            {/* Title for the infographic */}
            <div className="absolute top-2 left-2 bg-cyan-100 text-cyan-700 text-xs px-2 py-1 rounded-full font-medium">Element Localization</div>
            
            {/* Section for Input Description and UI Screenshot with detection overlay */}
            <div className={`flex flex-col items-center mt-8 mb-2 transition-all duration-700 ${animate ? 'opacity-100' : 'opacity-0'}`}> {/* Added delay and opacity animation */}
              {/* Input Description Box */}
              <div className="bg-white rounded-md p-2 border border-cyan-200 shadow-sm mb-2 w-full max-w-xs">
                <div className="text-xs text-cyan-700 font-medium">Input Description:</div>
                <div className="text-xs text-gray-600 italic">"Locate the primary user avatar and the main login button."</div>
              </div>

              {/* UI Screenshot with detection overlay */}
              <div className="relative border border-gray-200 bg-white rounded-lg p-1 shadow-sm w-full max-w-xs">
                {/* Simplified UI mockup */}
                <div className="relative">
                  <div className="bg-cyan-50 p-1 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <div className="h-5 w-5 bg-gray-200 rounded-full"></div> {/* Avatar placeholder */}
                      <div className="h-3 w-12 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-8 w-full bg-white rounded-md shadow-sm mb-1 p-1 flex items-center justify-center">
                      <div className="h-5 w-20 bg-gray-100 rounded"></div> {/* Login button placeholder */}
                    </div>
                    <div className="flex space-x-1">
                      <div className="h-5 w-1/3 bg-cyan-100 rounded-sm"></div>
                      <div className="h-5 w-1/3 bg-cyan-100 rounded-sm"></div>
                      <div className="h-5 w-1/3 bg-cyan-100 rounded-sm"></div>
                    </div>
                  </div>
                  
                  {/* Detection overlay based on description, animates opacity with delay */}
                  <div className={`absolute inset-0 transition-all duration-1000 delay-300 ${animate ? 'opacity-100' : 'opacity-0'}`}>
                    {/* Bounding box for "user avatar" */}
                    <div className="absolute top-1 left-1 h-5 w-5 border-2 border-cyan-500 rounded-full">
                      <div className="absolute -top-5 right-[-50px] bg-cyan-100 text-cyan-700 text-xs px-1 rounded whitespace-nowrap">User Avatar</div>
                    </div>
                    {/* Bounding box for "login button" */}
                    <div className="absolute top-[22px] left-1/2 transform -translate-x-1/2 h-8 w-[88px] border-2 border-cyan-500 rounded-md"> {/* Adjusted position and size */}
                       <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 bg-cyan-100 text-cyan-700 text-xs px-1 rounded whitespace-nowrap">Login Button</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Detection process steps, animates opacity with delay */}
            <div className={`flex items-center justify-between transition-all duration-1000 delay-500 ${animate ? 'opacity-100' : 'opacity-0'} px-2`}>
              {/* Step 1: Input Description */}
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center justify-center h-10 w-10 bg-cyan-200 rounded-full mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-xs text-cyan-700 w-20">Input: Text</div>
              </div>
              
              <svg className="w-5 h-5 text-cyan-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              
              {/* Step 2: VLM Analysis */}
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center justify-center h-10 w-10 bg-cyan-300 rounded-full mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-700" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.566.379-1.566 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.566 2.6 1.566 2.978 0a1.532 1.532 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.532 1.532 0 01-.947-2.287c1.566-.379 1.566-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-xs text-cyan-700 w-20">VLM Analysis</div>
              </div>
              
              <svg className="w-5 h-5 text-cyan-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              
              {/* Step 3: Output Bounding Boxes */}
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center justify-center h-10 w-10 bg-cyan-400 rounded-full mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M12 2v3m0 14v3m-7-9H2m17 0h-3"></path>
                  </svg>
                </div>
                <div className="text-xs text-cyan-700 w-20">Output: Boxes</div>
              </div>
            </div>
            
            {/* Final descriptive text for the infographic */}
            <div className="text-xs text-center font-medium text-cyan-600 mt-3">VLMs locate elements from descriptions & output bounding box coordinates.</div>
          </div>
        );
      case "tree":
        return (
          // Container for Tree infographic, increased height from h-64 to h-72
          <div className="relative h-72 w-full bg-emerald-50 rounded-lg overflow-hidden p-4 shadow-inner">
            <div className="absolute top-2 left-2 bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-medium">Structural Hierarchy</div>
            
            {/* Comparison of flat vs. tree structure */}
            <div className="flex mb-3 mt-4"> {/* Added mt-4 for better spacing with increased height */}
              {/* Before: Flat structure */}
              <div className="w-1/2 p-2">
                <div className="text-xs text-emerald-700 font-medium mb-1 text-center">Before: Flat Element List</div>
                <div className="bg-white rounded-md shadow-sm p-2 border border-emerald-100">
                  <div className="flex items-center mb-1">
                    <div className="w-4 h-4 bg-emerald-100 rounded-sm mr-1"></div>
                    <div className="text-xs">Express Option Text</div>
                  </div>
                  <div className="flex items-center mb-1">
                    <div className="w-4 h-4 bg-emerald-100 rounded-sm mr-1"></div>
                    <div className="text-xs">Express Option Label</div>
                  </div>
                  <div className="flex items-center mb-1">
                    <div className="w-4 h-4 bg-emerald-100 rounded-sm mr-1"></div>
                    <div className="text-xs">Express Option Qunatity</div>
                  </div>
                  <div className="flex items-center mb-1">
                    <div className="w-4 h-4 bg-emerald-100 rounded-sm mr-1"></div>
                    <div className="text-xs">Card</div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-emerald-100 rounded-sm mr-1"></div>
                    <div className="text-xs">Card Title</div>
                  </div>
                </div>
              </div>
              
              {/* Arrow pointing right, animates opacity */}
              <div className="flex items-center justify-center w-8">
                <svg className={`w-6 h-6 text-emerald-500 transition-all duration-1000 ${animate ? 'opacity-100' : 'opacity-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
              
              {/* After: Tree structure, animates opacity */}
              <div className="w-1/2 p-2">
                <div className="text-xs text-emerald-700 font-medium mb-1 text-center">After: Component Extraction</div>
                <div className={`bg-white rounded-md shadow-sm p-2 border border-emerald-100 transition-all duration-1000 ${animate ? 'opacity-100' : 'opacity-0'}`}>
                  {/* Root element */}
                  <div className="ml-0">
                    <div className="flex items-center mb-1">
                      <div className="w-4 h-4 bg-emerald-400 rounded-sm mr-1"></div>
                      <div className="text-xs font-medium">Card</div>
                    </div>
                    {/* Child element */}
                    <div className="ml-4">
                      <div className="flex items-center mb-1">
                        <div className="w-3 h-3 bg-emerald-300 rounded-sm mr-1"></div>
                        <div className="text-xs">Card Title</div>
                      </div>
                    </div> {/* Closing div for ml-4 (child element) */}
                  </div> {/* Closing div for ml-0 (root element) */}
                   {/* Added more elements to fill space due to increased height */}
                   <div className="ml-0 mt-2">
                    <div className="flex items-center mb-1">
                      <div className="w-4 h-4 bg-emerald-400 rounded-sm mr-1"></div>
                      <div className="text-xs font-medium">Express Option</div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center mb-1">
                        <div className="w-3 h-3 bg-emerald-300 rounded-sm mr-1"></div>
                        <div className="text-xs">Text</div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-emerald-300 rounded-sm mr-1"></div>
                        <div className="text-xs">Label</div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-emerald-300 rounded-sm mr-1"></div>
                        <div className="text-xs">Quantity</div>
                      </div>
                    </div>
                  </div>
                </div> {/* Closing div for bg-white rounded-md... */}
              </div> {/* Closing div for w-1/2 p-2 (After container) */}
            </div> {/* Closing div for flex mb-3 */}
            <div className="text-xs text-center mt-2 font-medium text-emerald-600">Organizes elements into a meaningful components</div>
          </div> // Closing div for relative h-72 w-full...
        );
        case "metadata":
        return (
          // Container for Metadata infographic, increased height from h-72 to h-80
          <div className="relative h-80 w-full bg-green-50 rounded-lg overflow-hidden p-4 shadow-inner">
            <div className="absolute top-2 left-2 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">Rich Metadata</div>
            
            {/* UI Element Focus */}
            <div className="relative mt-4 border border-gray-200 bg-white rounded-lg shadow-sm max-w-xs mx-auto mb-3">
              <div className="p-2">
                <div className="text-xs text-gray-500 mb-2 text-center">Selected UI Component</div>
                <div className="h-10 w-full bg-green-100 rounded-md shadow-sm p-2 flex items-center justify-center">
                  <div className="h-4 w-3/4 bg-green-600 bg-opacity-20 rounded"></div>
                </div>
              </div>
            </div>
            
            {/* Metadata Properties Animation, animates opacity */}
            <div className={`relative transition-all duration-1000 ${animate ? 'opacity-100' : 'opacity-0'}`}>
              {/* Metadata properties flowing in */}
              <div className="bg-white rounded-md shadow-sm p-3 border border-green-100 mb-2">
                <div className="flex flex-col space-y-3">
                  {/* Element Type property, animates position and opacity */}
                  <div className={`flex items-center transition-all duration-500 ${animate ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0'}`}>
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-green-800">Element Type</div>
                      <div className="text-xs text-gray-600">Search Input Field</div>
                    </div>
                  </div>
                  
                  {/* Interaction Model property, animates position and opacity with delay */}
                  <div className={`flex items-center transition-all duration-500 delay-100 ${animate ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0'}`}>
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-green-800">Interaction Model</div>
                      <div className="text-xs text-gray-600">Accepts text input, updates on keypress</div>
                    </div>
                  </div>
                  
                  {/* States property, animates position and opacity with delay */}
                  <div className={`flex items-center transition-all duration-500 delay-200 ${animate ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0'}`}>
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-green-800">States</div>
                      <div className="text-xs text-gray-600">Default, Focus, Filled, Error</div>
                    </div>
                  </div>
                  
                  {/* User Flow Impact property, animates position and opacity with delay */}
                  <div className={`flex items-center transition-all duration-500 delay-300 ${animate ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0'}`}>
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-green-800">User Flow Impact</div>
                      <div className="text-xs text-gray-600">Critical path - Primary search function</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-xs text-center mt-2 font-medium text-green-600">Comprehensive metadata enhances usability insights</div>
          </div>
        );
      case "pipeline":
        return (
          // Container for Pipeline infographic, increased height from h-72 to h-80
          <div className="relative h-80 w-full bg-yellow-50 rounded-lg overflow-hidden p-4 shadow-inner">
            <div className="absolute top-2 left-2 bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full font-medium">Parallelized Processing</div>
            
            {/* Input screenshot batch */}
            <div className="flex justify-center mb-2 mt-3">
              <div className="relative">
                <div className="flex space-x-1">
                  {/* Mockup of screenshot thumbnails */}
                  <div className="w-12 h-12 bg-white border border-gray-200 rounded-md shadow-sm">
                    <div className="w-full h-2 bg-yellow-200 rounded-t-md"></div>
                    <div className="p-1">
                      <div className="w-full h-1 bg-gray-100 rounded-full mb-1"></div>
                      <div className="w-3/4 h-1 bg-gray-100 rounded-full mb-1"></div>
                      <div className="w-1/2 h-1 bg-gray-100 rounded-full"></div>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-white border border-gray-200 rounded-md shadow-sm">
                    <div className="w-full h-2 bg-yellow-200 rounded-t-md"></div>
                    <div className="p-1">
                      <div className="w-full h-1 bg-gray-100 rounded-full mb-1"></div>
                      <div className="w-3/4 h-1 bg-gray-100 rounded-full mb-1"></div>
                      <div className="w-1/2 h-1 bg-gray-100 rounded-full"></div>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-white border border-gray-200 rounded-md shadow-sm">
                    <div className="w-full h-2 bg-yellow-200 rounded-t-md"></div>
                    <div className="p-1">
                      <div className="w-full h-1 bg-gray-100 rounded-full mb-1"></div>
                      <div className="w-3/4 h-1 bg-gray-100 rounded-full mb-1"></div>
                      <div className="w-1/2 h-1 bg-gray-100 rounded-full"></div>
                    </div>
                  </div>
                </div>
                
                {/* Arrow pointing down, animates opacity */}
                <div className="absolute w-full flex justify-center -bottom-4">
                  <svg className={`w-6 h-6 text-yellow-500 transition-all duration-500 ${animate ? 'opacity-100' : 'opacity-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Parallel Pipeline Animation, animates opacity */}
            <div className={`bg-white rounded-lg shadow-md border border-yellow-100 p-3 mb-2 mt-3 transition-all duration-1000 ${animate ? 'opacity-100' : 'opacity-0'}`}> {/* Added mt-3 for spacing */}
              <div className="text-xs text-yellow-700 font-medium mb-2 text-center">Parallel Processing Pipeline</div>
              
              <div className="flex space-x-1 justify-between mb-2">
                {/* Multiple pipeline threads, animates opacity */}
                <div className="flex-1">
                  <div className={`h-6 bg-yellow-100 rounded-t-md flex items-center justify-center text-xs font-medium text-yellow-700 mb-1 transition-all duration-500 ${animate ? 'opacity-100' : 'opacity-0'}`}>
                    Thread 1
                  </div>
                  <div className={`flex flex-col space-y-1 transition-all duration-700 ${animate ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="h-5 w-full bg-yellow-200 rounded-sm flex items-center justify-center text-xs">Detect</div>
                    <div className="h-5 w-full bg-yellow-300 rounded-sm flex items-center justify-center text-xs">Extract</div>
                    <div className="h-5 w-full bg-yellow-400 rounded-sm flex items-center justify-center text-xs">Optimize</div>
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className={`h-6 bg-yellow-100 rounded-t-md flex items-center justify-center text-xs font-medium text-yellow-700 mb-1 transition-all duration-500 delay-100 ${animate ? 'opacity-100' : 'opacity-0'}`}>
                    Thread 2
                  </div>
                  <div className={`flex flex-col space-y-1 transition-all duration-700 delay-100 ${animate ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="h-5 w-full bg-yellow-200 rounded-sm flex items-center justify-center text-xs">Detect</div>
                    <div className="h-5 w-full bg-yellow-300 rounded-sm flex items-center justify-center text-xs">Extract</div>
                    <div className="h-5 w-full bg-yellow-400 rounded-sm flex items-center justify-center text-xs">Optimize</div>
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className={`h-6 bg-yellow-100 rounded-t-md flex items-center justify-center text-xs font-medium text-yellow-700 mb-1 transition-all duration-500 delay-200 ${animate ? 'opacity-100' : 'opacity-0'}`}>
                    Thread 3
                  </div>
                  <div className={`flex flex-col space-y-1 transition-all duration-700 delay-200 ${animate ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="h-5 w-full bg-yellow-200 rounded-sm flex items-center justify-center text-xs">Detect</div>
                    <div className="h-5 w-full bg-yellow-300 rounded-sm flex items-center justify-center text-xs">Extract</div>
                    <div className="h-5 w-full bg-yellow-400 rounded-sm flex items-center justify-center text-xs">Optimize</div>
                  </div>
                </div>
              </div>
              
              {/* Performance metrics, animates opacity with delay */}
              <div className={`flex justify-between border-t border-yellow-100 pt-2 transition-all duration-1000 delay-500 ${animate ? 'opacity-100' : 'opacity-0'}`}>
                <div className="text-xs">
                  <div className="font-medium text-yellow-800">160+ elements</div>
                  <div className="text-gray-500">processed</div>
                </div>
                <div className="text-xs">
                  <div className="font-medium text-yellow-800">~6 minutes</div>
                  <div className="text-gray-500">total time</div>
                </div>
                <div className="text-xs">
                  <div className="font-medium text-yellow-800">10x faster</div>
                  <div className="text-gray-500">than manual</div>
                </div>
              </div>
            </div>
            
            <div className="text-xs text-center mt-2 font-medium text-yellow-600">Concurrent processing drastically improves throughput</div>
          </div>
        );
    //   default:
    //     return (
    //       // Default placeholder infographic, increased height from h-64 to h-72
    //       <div className="relative h-72 w-full bg-gray-100 rounded-lg overflow-hidden p-4 shadow-inner flex items-center justify-center">
    //         <p className="text-gray-500 text-sm">Infographic for '{type}'</p>
    //       </div>
    //     );
    }
  };

  return renderInfoGraphic();
};

// Main component for displaying feature cards
export default function FeatureCards() {
  // Data for each feature card
  const cardData = [
    {
      gradient: "from-indigo-500 to-blue-500",
      iconBg: "bg-indigo-100",
      iconHoverBg: "bg-indigo-200",
      icon: <MessageSquare className="w-5 h-5 text-indigo-600" />,
      title: "LLM-Powered Label & Description Extraction",
      description: "Generates clear, human-readable labels and functional descriptions for each UI element using large language models.",
      type: "llm" // Type used to determine which infographic to render
    },
    {
      gradient: "from-blue-500 to-cyan-500",
      iconBg: "bg-blue-100",
      iconHoverBg: "bg-blue-200",
      icon: <Layers className="w-5 h-5 text-blue-600" />,
      title: "Context-Aware Prompt Engineering",
      description: "Designs spatially grounded prompts that steer the model to focus on relevant UI elements based on visual hierarchy and layout context.",
      type: "prompt"
    },
    {
      gradient: "from-cyan-500 to-emerald-500",
      iconBg: "bg-cyan-100",
      iconHoverBg: "bg-cyan-200",
      icon: <Image className="w-5 h-5 text-cyan-600" />,
      title: "Automated UI Element Detection",
      description: "Leverages vision-language models (VLMs) combined with optimized descriptions to identify and isolate UI components.",
      type: "detection"
    },
    {
      gradient: "from-emerald-500 to-green-500",
      iconBg: "bg-emerald-100",
      iconHoverBg: "bg-emerald-200",
      icon: <Users className="w-5 h-5 text-emerald-600" />,
      title: "Tree-Based Structural Grouping",
      description: "Transforms flat element lists into hierarchical trees to accurately distinguish components from their nested sub-elements.",
      type: "tree"
    },
    {
      gradient: "from-green-500 to-yellow-500",
      iconBg: "bg-green-100",
      iconHoverBg: "bg-green-200",
      icon: <FileText className="w-5 h-5 text-green-600" />,
      title: "Rich Metadata Extraction",
      description: "Augments each component with detailed UX metadata, including user flow impact, behavior & interaction specifications, element types, and state definitions.",
      type: "metadata"
    },
    {
      gradient: "from-yellow-500 to-orange-500",
      iconBg: "bg-yellow-100",
      iconHoverBg: "bg-yellow-200",
      icon: <Activity className="w-5 h-5 text-yellow-600" />,
      title: "Parallelized Processing Pipeline",
      description: "Runs extraction, optimization, and annotation concurrently across image batches—processing 160+ elements in under 6 minutes, significantly outperforming manual efforts.",
      type: "pipeline"
    },
    // {
    //   gradient: "from-orange-500 to-red-500",
    //   iconBg: "bg-orange-100",
    //   iconHoverBg: "bg-orange-200",
    //   icon: <Monitor className="w-5 h-5 text-orange-600" />,
    //   title: "Visualized Output & Documentation",
    //   description: "Produces annotated screenshots, component trees, and structured metadata logs to clearly communicate model outputs and internal logic.",
    //   type: "visualized", // This type might have a different layout or be handled by the default case
    //   fullWidth: true // Custom property, not used by InformativeInfoGraphic directly but could be used by parent
    // }
  ];

  return (
    <>
      {/* Section for feature highlights */}
      <div className="max-w-6xl mx-auto mt-24">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center px-4 py-1.5 mb-4 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-medium text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span>Project Highlights</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Advanced UX Annotation Features</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">Leveraging cutting-edge ML technology to transform UI screenshots into detailed annotations</p>
        </div>
        
        {/* Grid layout for feature cards */}
        <div className="grid grid-cols-1 gap-6">
          {cardData.map((card, index) => (
            // Individual feature card container
            <div 
              key={index} 
              className="bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition overflow-hidden group"
            >
              {/* Gradient bar at the top of the card */}
              <div className={`h-2 bg-gradient-to-r ${card.gradient}`}></div>
              {/* Card content area */}
              <div className="p-6">
                {/* Flex container for card content, responsive layout */}
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left side: Icon, title, and description */}
                  <div className="w-full md:w-1/2">
                    <div className="flex items-center mb-4">
                      <div className={`w-10 h-10 ${card.iconBg} rounded-lg flex items-center justify-center group-hover:${card.iconHoverBg} transition`}>
                        {card.icon}
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 ml-3">{card.title}</h3>
                    </div>
                    <p className="text-gray-600">{card.description}</p>
                  </div>
                  {/* Right side: Informative infographic */}
                  <div className="w-full md:w-1/2">
                    <InformativeInfoGraphic type={card.type} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
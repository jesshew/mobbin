import React from 'react';
import { ScanEye, Cpu, XCircle, CheckCircle2 } from 'lucide-react';

const SolutionSection = () => (
  <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="bg-white rounded-xl shadow-xl border text-gray-800 border-gray-200 p-6 md:p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">The Solution: AI-Powered Automation</h2>
      <div className="flex flex-col lg:flex-row gap-8 items-stretch">
        <div className="lg:w-2/4 space-y-6">
          {/* Automated UI Detection */}
          <div className="flex items-start space-x-4 p-4 bg-indigo-50 rounded-lg">
            <div className="flex-shrink-0 w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center shadow-md">
              <ScanEye className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-xl text-gray-700">Automated UI Detection</h4>
              <p className="text-gray-600 text-base leading-relaxed">
                AI detects and identifies UI elements in your screenshots.
              </p>
            </div>
          </div>

          {/* Predrawn Bounding Box */}
          <div className="flex items-start space-x-4 p-4 bg-indigo-50 rounded-lg">
            <div className="flex-shrink-0 w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center shadow-md">
              {/* Using ScanEye icon for visual consistency, can be replaced with a more fitting icon if desired */}
              <ScanEye className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-xl text-gray-700">Predrawn Bounding Box</h4>
              <p className="text-gray-600 text-base leading-relaxed">
                Vision Language Model pre-draws UI element boundaries based on AI-extracted descriptions, accelerating the annotation process.
              </p>
            </div>
          </div>

          {/* Component Annotation */}
          <div className="flex items-start space-x-4 p-4 bg-indigo-50 rounded-lg">
            <div className="flex-shrink-0 w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center shadow-md">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-xl text-gray-700">Component Annotation</h4>
              <p className="text-gray-600 text-base leading-relaxed">
                LLM models grasp overall component function and context <span className="font-semibold text-indigo-600">without explicit training</span>.
              </p>
            </div>
          </div>
        </div>
        <div className="lg:w-2/4 bg-gray-50 p-6 rounded-xl border border-gray-200 flex flex-col justify-center">
          <h3 className="font-bold text-xl text-gray-800 mb-4 text-center">Impact on Workflow</h3>
          <p className="text-sm text-gray-500 mb-6 italic text-center">
            "Empower designers to create, not just catalogue. Let AI handle the heavy lifting."
          </p>
          <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200 shadow-inner">
            <div className="flex items-center mb-2">
              <XCircle className="w-7 h-7 text-red-500 mr-3 flex-shrink-0" />
              <div className="font-semibold text-xl text-red-500">Before: The Annotator</div>
            </div>
            <p className="text-base text-red-500 leading-relaxed">
              Bogged down by tedious, repetitive clicking. Drained by manual data entry.
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200 shadow-inner">
            <div className="flex items-center mb-2">
              <CheckCircle2 className="w-7 h-7 text-green-500 mr-3 flex-shrink-0" />
              <div className="font-semibold text-xl text-green-500">After: The Strategist</div>
            </div>
            <p className="text-base text-green-500 leading-relaxed">
              Elevated to reviewer. Focused on UX quality & insights. Driving innovation at speed.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default SolutionSection; 
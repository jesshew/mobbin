import React from 'react';
import { Presentation } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuroraText } from '../magicui/aurora-text';
import Iphone15Pro from '../magicui/iphone-15-pro';
import TravelCard from './travel-card';
import GridPatternBackground from './grid-pattern-background';
import MockupInPhoneOne from './mockupone';
import Features from './features';
import FeatureCards from './features';

// Constants for the MLLMs text circling animation
const MLLMS_ANIMATION_DURATION = 1.25; // Duration of one animation cycle in seconds
const MLLMS_ANIMATION_TOTAL_CYCLE_DURATION = 5; // Total time for one cycle including delay in seconds
const MLLMS_ANIMATION_REPEAT_DELAY = MLLMS_ANIMATION_TOTAL_CYCLE_DURATION - MLLMS_ANIMATION_DURATION; // Delay before animation repeats in seconds

const HeroNew = () => {
  return (
    <div className="relative w-full overflow-hidden py-20 bg-gradient-to-b from-indigo-50/50 to-white">
      {/* Enhanced Background */}
      <GridPatternBackground />
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-30 translate-x-1/4 translate-y-1/4"></div>
      
      <div className="container relative mx-auto px-6 lg:px-8">
        {/* Hero content */}
        <div className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-medium text-sm">
            <Presentation className="w-4 h-4 mr-2" />
            <span>Mini Research on Zero Shot Prompting</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-8 leading-tight">
            <span className="mr-2">Reimagining</span>
            <AuroraText className="font-extrabold">UX Annotation</AuroraText>
            <div className="inline-flex items-center mt-2">
              <span className="mr-2">with</span>
              <span className="ml-2 relative">
                <span className="bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent relative z-10">MLLMs</span>
                <svg
                  viewBox="0 0 130 50"
                  fill="none"
                  className="absolute -left-2 -right-2 -top-2 -bottom-1 w-full h-full"
                >
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{
                      duration: MLLMS_ANIMATION_DURATION, // Set animation duration
                      ease: "easeInOut",
                      repeat: Infinity, // Repeat the animation indefinitely
                      repeatType: "loop", // Restart animation from the beginning after each cycle
                      repeatDelay: MLLMS_ANIMATION_REPEAT_DELAY, // Wait for this duration before repeating
                    }}
                    d="M64.5 1C48.5 7.5 2.5 4.5 1 22.5C-0.5 40.5 15 48.5 58.5 47.5C102 46.5 145 47 125.5 20C103.5 -10.5 43.5 15 26 1"
                    stroke="#818cf8"
                    strokeWidth="3"
                  />
                </svg>
              </span>
            </div>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Transforming UI screenshots into structured UX annotations using language and vision models.
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <button className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-full transition shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30">
              Explore Demo Results
            </button>
            <button className="px-8 py-3 bg-white hover:bg-gray-50 text-indigo-600 font-medium rounded-full border border-gray-200 transition shadow-sm hover:shadow-md">
              Learn More
            </button>
          </div>
        </div>
        
        {/* Phone with floating cards */}
        <div className="relative mt-24 mb-10">
          {/* Decorative elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[70%] -z-10 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-[100%/50%] blur-md"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[60%] -z-10 bg-gradient-to-r from-blue-100/30 via-indigo-100/30 to-purple-100/30 rounded-[100%/50%]"></div>
          
          {/* Center phone */}
          <div className="relative z-3 flex justify-center animate-float">
            <Iphone15Pro 
              width={433}
              height={882}
              src="/nike2.jpg"
              // Uncomment below and comment out src to use video instead
              // videoSrc="/demo-app-video.mp4"
            />
          </div>

          {/* <MockupInPhoneOne /> */}
          
          {/* Left side cards */}
          {/* <div className="absolute top-[15%] -left-[2%] z-10 animate-float-delay transform rotate-[-6deg] hover:rotate-[-3deg] transition-transform duration-500">
            <TravelCard 
              imageUrl="/nike2.jpg" 
              className="shadow-2xl mb-4 rounded-2xl border-2 border-white"
            />
          </div> */}
          <div className="absolute top-[50%] left-[3%] z-0 animate-float transform rotate-[-4deg] hover:rotate-[-1deg] transition-transform duration-500">
            <TravelCard 
              imageUrl="./top_up_success.png" 
              className="shadow-2xl rounded-2xl border-2 border-white"
            />
          </div>
          
          {/* Right side cards */}
          <div className="absolute top-[12%] right-[3%] z-0 animate-float transform rotate-[6deg] hover:rotate-[3deg] transition-transform duration-500">
            <TravelCard 
              imageUrl="./nike2.jpg" 
              className="shadow-2xl rounded-2xl border-2 border-white"
            />
          </div>
          {/* <div className="absolute top-[45%] -right-[2%] z-10 animate-float-delay transform rotate-[8deg] hover:rotate-[5deg] transition-transform duration-500">
            <TravelCard 
              imageUrl="https://images.unsplash.com/photo-1499856871958-5b9357976b82?q=80&w=2020&auto=format&fit=crop&ixlib=rb-4.0.3" 
              className="shadow-2xl rounded-2xl border-2 border-white"
            />
          </div> */}
          
          {/* Paris label */}
          {/* <div className="absolute top-[15%] right-[15%] bg-white px-5 py-2 rounded-full shadow-xl flex items-center z-30 border border-gray-100 transform hover:scale-105 transition-transform duration-300">
            <div className="w-3 h-3 bg-indigo-600 rounded-full mr-2 animate-pulse"></div>
            <span className="font-semibold text-gray-800">Paris</span>
          </div> */}
          
          {/* Additional labels for visual interest */}
          {/* <div className="absolute bottom-[20%] left-[15%] bg-white px-5 py-2 rounded-full shadow-xl flex items-center z-30 border border-gray-100 transform hover:scale-105 transition-transform duration-300">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
            <span className="font-semibold text-gray-800">New York</span>
          </div> */}
        </div>
        
        {/* Feature highlights */}
        {/* Feature highlights */}
        <FeatureCards />
        {/* <div className="max-w-6xl mx-auto mt-24">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center px-4 py-1.5 mb-4 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-medium text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <span>Project Highlights</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">UX Annotation Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">Leveraging cutting-edge ML technology to transform UI screenshots into detailed annotations</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> */}
            {/* Card 1 */}
            {/* <div className="bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition overflow-hidden group">
              <div className="h-2 bg-gradient-to-r from-indigo-500 to-blue-500"></div>
              <div className="p-6">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">LLM-Powered Label & Description Extraction</h3>
                <p className="text-gray-600">Generates clear, human-readable labels and functional descriptions for each UI element using large language models.</p>
              </div>
            </div>
             */}
            {/* Card 2 */}
            {/* <div className="bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition overflow-hidden group">
              <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
              <div className="p-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Context-Aware Prompt Engineering</h3>
                <p className="text-gray-600">Designs spatially grounded prompts that steer the model to focus on relevant UI elements based on visual hierarchy and layout context.</p>
              </div>
            </div>
             */}
            {/* Card 3 */}
            {/* <div className="bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition overflow-hidden group">
              <div className="h-2 bg-gradient-to-r from-cyan-500 to-emerald-500"></div>
              <div className="p-6">
                <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-cyan-200 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-cyan-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Automated UI Element Detection</h3>
                <p className="text-gray-600">Leverages vision-language models (VLMs) combined with optimized descriptions to identify and isolate UI components.</p>
              </div>
            </div>
             */}
            {/* Card 4 */}
            {/* <div className="bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition overflow-hidden group">
              <div className="h-2 bg-gradient-to-r from-emerald-500 to-green-500"></div>
              <div className="p-6">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Tree-Based Structural Grouping</h3>
                <p className="text-gray-600">Transforms flat element lists into hierarchical trees to accurately distinguish components from their nested sub-elements.</p>
              </div>
            </div>
             */}
            {/* Card 5 */}
            {/* <div className="bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition overflow-hidden group">
              <div className="h-2 bg-gradient-to-r from-green-500 to-yellow-500"></div>
              <div className="p-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Rich Metadata Extraction</h3>
                <p className="text-gray-600">Augments each component with detailed UX metadata, including user flow impact, behavior & interaction specifications, element types, and state definitions.</p>
              </div>
            </div> */}
            
            {/* Card 6 */}
            {/* <div className="bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition overflow-hidden group">
              <div className="h-2 bg-gradient-to-r from-yellow-500 to-orange-500"></div>
              <div className="p-6">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-yellow-200 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-yellow-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Parallelized Processing Pipeline</h3>
                <p className="text-gray-600">Runs extraction, optimization, and annotation concurrently across image batches—processing 160+ elements in under 6 minutes, significantly outperforming manual efforts.</p>
              </div>
            </div> */}
            
            {/* Card 7 */}
            {/* <div className="bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition overflow-hidden group col-span-1 md:col-span-2 lg:col-span-3">
              <div className="h-2 bg-gradient-to-r from-orange-500 to-red-500"></div>
              <div className="p-6">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-200 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-orange-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Visualized Output & Documentation</h3>
                <p className="text-gray-600">Produces annotated screenshots, component trees, and structured metadata logs to clearly communicate model outputs and internal logic.</p>
              </div>
            </div> */}
          </div>
        </div>
  );
};

export default HeroNew;
import React from 'react';
import { Plane } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuroraText } from '../magicui/aurora-text';
import Iphone15Pro from '../magicui/iphone-15-pro';
import TravelCard from './travel-card';
import GridPatternBackground from './grid-pattern-background';
import MockupInPhoneOne from './mockupone';

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
            <Plane className="w-4 h-4 mr-2" />
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
              Explore Demo
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
          <div className="relative z-20 flex justify-center animate-float">
            <Iphone15Pro 
              width={433}
              height={882}
              src="/nike2.jpg"
              // Uncomment below and comment out src to use video instead
              // videoSrc="/demo-app-video.mp4"
            />
          </div>

          <MockupInPhoneOne />
          
          {/* Left side cards */}
          <div className="absolute top-[15%] -left-[2%] z-10 animate-float-delay transform rotate-[-6deg] hover:rotate-[-3deg] transition-transform duration-500">
            <TravelCard 
              imageUrl="/lovable-uploads/d075041a-997d-47e7-b305-36f86a71b8b5.png" 
              className="shadow-2xl mb-4 rounded-2xl border-2 border-white"
            />
          </div>
          <div className="absolute top-[50%] left-[3%] z-0 animate-float transform rotate-[-4deg] hover:rotate-[-1deg] transition-transform duration-500">
            <TravelCard 
              imageUrl="./top_up_success.png" 
              className="shadow-2xl rounded-2xl border-2 border-white"
            />
          </div>
          
          {/* Right side cards */}
          <div className="absolute top-[12%] right-[3%] z-0 animate-float transform rotate-[6deg] hover:rotate-[3deg] transition-transform duration-500">
            <TravelCard 
              imageUrl="./wpay4.png" 
              className="shadow-2xl rounded-2xl border-2 border-white"
            />
          </div>
          <div className="absolute top-[45%] -right-[2%] z-10 animate-float-delay transform rotate-[8deg] hover:rotate-[5deg] transition-transform duration-500">
            <TravelCard 
              imageUrl="https://images.unsplash.com/photo-1499856871958-5b9357976b82?q=80&w=2020&auto=format&fit=crop&ixlib=rb-4.0.3" 
              className="shadow-2xl rounded-2xl border-2 border-white"
            />
          </div>
          
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-16">
          <div className="p-6 rounded-2xl bg-white shadow-lg border border-gray-100 hover:shadow-xl transition">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
              <Plane className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">AI-Powered Analysis</h3>
            <p className="text-gray-600">Leverage machine learning language models for precise UX annotations.</p>
          </div>
          
          <div className="p-6 rounded-2xl bg-white shadow-lg border border-gray-100 hover:shadow-xl transition">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Screen Recognition</h3>
            <p className="text-gray-600">Convert any UI screenshot into structured annotations automatically.</p>
          </div>
          
          <div className="p-6 rounded-2xl bg-white shadow-lg border border-gray-100 hover:shadow-xl transition">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">UX Insights</h3>
            <p className="text-gray-600">Generate detailed UX reports and improvement suggestions instantly.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroNew;
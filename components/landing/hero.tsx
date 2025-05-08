import React from 'react';
import { Presentation } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuroraText } from '../magicui/aurora-text';
import GridPatternBackground from './grid-pattern-background';
import FeatureCards from './features';
import ImageComparisonCarousel from './image-comparison-carousel';

// Constants for the MLLMs text circling animation
const MLLMS_ANIMATION_DURATION = 1.25; // Duration of one animation cycle in seconds
const MLLMS_ANIMATION_TOTAL_CYCLE_DURATION = 5; // Total time for one cycle including delay in seconds
const MLLMS_ANIMATION_REPEAT_DELAY = MLLMS_ANIMATION_TOTAL_CYCLE_DURATION - MLLMS_ANIMATION_DURATION; // Delay before animation repeats in seconds

const Hero = () => {
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
        <ImageComparisonCarousel />
        <FeatureCards />

        {/* Phone with floating cards */}
        {/* <PhoneShowcase /> */}
      </div>
    </div>
  );
};

export default Hero;
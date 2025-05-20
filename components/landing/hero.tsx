import React, { useState, useRef } from 'react';
import { Presentation, ClipboardCheck, Clock, UserCheck, Layers, Cpu, ScanEye, GitMerge, XCircle, CheckCircle2, Users, AlertTriangle, TrendingDown, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuroraText } from '../magicui/aurora-text';
import GridPatternBackground from './grid-pattern-background';
import FeatureCards from './features';
import ImageComparisonCarousel from './image-comparison-carousel';
import PhoneShowcase from './phone-showcase';
import Link from 'next/link';
import { TechStackMarquee } from '../magicui/TechStackMarquee';
import PainPointSection from './pain-point-section';
import SolutionSection from './solution-section';
import UIDetailsCarousel from './ui-details-carousel';

// Constants for the MLLMs text circling animation
const MLLMS_ANIMATION_DURATION = 1.25; // Duration of one animation cycle in seconds
const MLLMS_ANIMATION_TOTAL_CYCLE_DURATION = 5; // Total time for one cycle including delay in seconds
const MLLMS_ANIMATION_REPEAT_DELAY = MLLMS_ANIMATION_TOTAL_CYCLE_DURATION - MLLMS_ANIMATION_DURATION; // Delay before animation repeats in seconds

// Animation variants for the impact stats
const statsVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.2,
      duration: 0.6,
      ease: "easeOut"
    }
  })
};

// Animation variants for process flow
const processVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3
    }
  }
};

const processItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5
    }
  }
};

// Pain point card component
const PainPointCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => {
  return (
    <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition duration-300">
      <div className="mb-3 text-indigo-600">{icon}</div>
      {/* Title uses text-xl for consistency with other card-like titles */}
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
      {/* Description uses text-base for consistency */}
      <p className="text-gray-600 text-base">{description}</p>
    </div>
  );
};

// Solution step component
const SolutionStep = ({ number, title, description }: { number: string, title: string, description: string }) => {
  return (
    <motion.div 
      className="flex items-start gap-4 mb-6"
      variants={processItemVariants}
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
        {number}
      </div>
      <div>
        {/* Title uses text-xl and font-semibold for consistency */}
        <h3 className="text-xl font-semibold text-gray-900 mb-1">{title}</h3>
        {/* Description uses text-base for consistency */}
        <p className="text-gray-600 text-base">{description}</p>
      </div>
    </motion.div>
  );
};

const Hero = () => {
  const [activeTab, setActiveTab] = useState('problem');
  const featuresRef = useRef<HTMLDivElement>(null);

  // Function to scroll to features section
  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative w-full overflow-hidden py-20 bg-gradient-to-b from-indigo-50/50 to-white">
      {/* Enhanced Background */}
      <GridPatternBackground />
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-30 translate-x-1/4 translate-y-1/4"></div>
      
      <div className="container relative mx-auto px-6 lg:px-8">
        {/* Hero content */}
        <div className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto mb-12">
          {/* Badge text size kept as text-sm, appropriate for a badge */}
          <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-medium text-sm">
            <Presentation className="w-4 h-4 mr-2" />
            <span>Mini Research on Zero Shot Prompting</span>
          </div>
          
          {/* Hero Slogan - UNTOUCHED as per instructions */}
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
                      duration: MLLMS_ANIMATION_DURATION,
                      ease: "easeInOut",
                      repeat: Infinity,
                      repeatType: "loop",
                      repeatDelay: MLLMS_ANIMATION_REPEAT_DELAY,
                    }}
                    d="M64.5 1C48.5 7.5 2.5 4.5 1 22.5C-0.5 40.5 15 48.5 58.5 47.5C102 46.5 145 47 125.5 20C103.5 -10.5 43.5 15 26 1"
                    stroke="#818cf8"
                    strokeWidth="3"
                  />
                </svg>
              </span>
            </div>
          </h1>
          
          {/* Hero sub-paragraph - UNTOUCHED as per instructions */}
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Transforming UI screenshots into structured UX annotations using language and vision models —
            <span className="font-semibold text-indigo-700"> shifting humans from tedious annotators to strategic reviewers.</span>
          </p>
        
          {/* Buttons text size defaults to browser/Tailwind base, which is fine */}
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            <Link href="/gallery" className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-full transition shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30">
              Explore Demo Results
            </Link>
            <button 
              onClick={scrollToFeatures} 
              className="px-8 py-3 bg-white hover:bg-gray-50 text-indigo-600 font-medium rounded-full border border-gray-200 transition shadow-sm hover:shadow-md"
            >
              Learn More
            </button>
          </div>
        </div>

        {/* <PhoneShowcase /> */}

        {/* Image comparison showcase */}
        <div className="mb-16">
          <ImageComparisonCarousel />
        </div>
        {/* Image comparison showcase */}
        <div className="mb-16">
          <UIDetailsCarousel />
        </div>

         {/* Problem and Solution Section */}
         <div className="max-w-3xl mx-auto mb-16 space-y-12 px-4 sm:px-6 lg:px-8"> {/* Added padding for responsiveness */}
            {/* Section header */}
            <div className="text-center mb-10 sm:mb-12">
              <div className="inline-flex items-center justify-center px-3 sm:px-4 py-1.5 mb-4 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-medium text-xs sm:text-sm">
                <Search className="w-4 h-4 mr-2" />
                <span>Background Statement</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Problem & Solution</h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              What is the problem we are trying to bridge?
              </p>
            </div>
          <PainPointSection />
          <SolutionSection />
        </div>

        <TechStackMarquee/>

        {/* Feature cards section with ref */}
        <div ref={featuresRef}>
          <FeatureCards />
        </div>
      </div>
    </div>
  );
};

export default Hero;
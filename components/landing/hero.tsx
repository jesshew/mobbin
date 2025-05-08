
import React, { useState } from 'react';
import { Presentation, ClipboardCheck, Clock, UserCheck, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuroraText } from '../magicui/aurora-text';
import GridPatternBackground from './grid-pattern-background';
import FeatureCards from './features';
import ImageComparisonCarousel from './image-comparison-carousel';

// Constants for the MLLMs text circling animation
const MLLMS_ANIMATION_DURATION = 1.25; // Duration of one animation cycle in seconds
const MLLMS_ANIMATION_TOTAL_CYCLE_DURATION = 5; // Total time for one cycle including delay in seconds
const MLLMS_ANIMATION_REPEAT_DELAY = MLLMS_ANIMATION_TOTAL_CYCLE_DURATION - MLLMS_ANIMATION_DURATION; // Delay before animation repeats in seconds

// Animation variants for the impact stats
const statsVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
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
const PainPointCard = ({ icon, title, description }) => {
  return (
    <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition duration-300">
      <div className="mb-3 text-indigo-600">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
};

// Solution step component
const SolutionStep = ({ number, title, description }) => {
  return (
    <motion.div 
      className="flex items-start gap-4 mb-6"
      variants={processItemVariants}
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
        {number}
      </div>
      <div>
        <h3 className="font-medium text-gray-900 mb-1">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
    </motion.div>
  );
};

const Hero = () => {
  const [activeTab, setActiveTab] = useState('problem');
  
  const impactStats = [
    { number: "80%", label: "Time Saved", description: "Reduce annotation time drastically" },
    { number: "95%", label: "Accuracy", description: "High-precision element detection" },
    { number: "3x", label: "Faster Iterations", description: "Accelerate design feedback loops" }
  ];

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
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Transforming UI screenshots into structured UX annotations using language and vision models —
            <span className="font-semibold text-indigo-700"> shifting humans from tedious annotators to strategic reviewers.</span>
          </p>
          
          {/* Impact stats row */}
          <div className="flex flex-wrap justify-center gap-8 mb-10">
            {impactStats.map((stat, index) => (
              <motion.div 
                key={stat.label}
                custom={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={statsVariants}
                className="text-center"
              >
                <div className="text-3xl font-bold text-indigo-600">{stat.number}</div>
                <div className="font-medium text-gray-800">{stat.label}</div>
                <div className="text-sm text-gray-500">{stat.description}</div>
              </motion.div>
            ))}
          </div>
          
          <div className="flex flex-wrap gap-4 justify-center mb-16">
            <button className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-full transition shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30">
              Explore Demo Results
            </button>
            <button className="px-8 py-3 bg-white hover:bg-gray-50 text-indigo-600 font-medium rounded-full border border-gray-200 transition shadow-sm hover:shadow-md">
              Learn More
            </button>
          </div>
        </div>

        {/* Problem-Solution Tabs */}
        <div className="max-w-5xl mx-auto mb-16">
          <div className="flex justify-center mb-6">
            <button 
              className={`px-6 py-2 font-medium rounded-l-lg transition ${activeTab === 'problem' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              onClick={() => setActiveTab('problem')}
            >
              The Problem
            </button>
            <button 
              className={`px-6 py-2 font-medium rounded-r-lg transition ${activeTab === 'solution' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              onClick={() => setActiveTab('solution')}
            >
              Our Solution
            </button>
          </div>

          {/* Problem View */}
          {activeTab === 'problem' && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Pain Points in UX Annotation Today</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <PainPointCard 
                  icon={<Clock className="w-6 h-6" />} 
                  title="Slow & Tedious" 
                  description="Manual bounding box drawing and metadata tagging consumes valuable designer time"
                />
                <PainPointCard 
                  icon={<UserCheck className="w-6 h-6" />} 
                  title="Inconsistent Results" 
                  description="Different annotators create fragmented, unreliable UX component libraries"
                />
                <PainPointCard 
                  icon={<ClipboardCheck className="w-6 h-6" />} 
                  title="Error-Prone Process" 
                  description="Repetitive tasks increase human mistakes in labeling and classification"
                />
                <PainPointCard 
                  icon={<Layers className="w-6 h-6" />} 
                  title="Scaling Challenges" 
                  description="Manual workflows can't keep pace with rapid design iterations"
                />
              </div>
            </div>
          )}

          {/* Solution View */}
          {activeTab === 'solution' && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">The MLLM-Powered Solution</h2>
              
              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/2">
                  <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={processVariants}
                    className="mb-4"
                  >
                    <SolutionStep 
                      number="1" 
                      title="Automated Element Detection" 
                      description="Vision Language Models identify UI components from screenshots with high precision"
                    />
                    <SolutionStep 
                      number="2" 
                      title="Intelligent Component Classification" 
                      description="MLLMs understand component function and context without explicit training"
                    />
                    <SolutionStep 
                      number="3" 
                      title="Structural Relationships Mapping" 
                      description="AI identifies hierarchical relationships between elements automatically"
                    />
                  </motion.div>
                </div>
                
                <div className="md:w-1/2 bg-indigo-50 p-6 rounded-lg border border-indigo-100">
                  <h3 className="font-semibold text-lg text-indigo-800 mb-4">Human Role Transformation</h3>
                  <div className="flex items-center mb-6">
                    <div className="w-1/2 text-center p-4 bg-gray-100 rounded-l-lg">
                      <div className="font-medium text-gray-800 mb-1">Before</div>
                      <p className="text-sm text-gray-600">Manual annotators performing repetitive tasks</p>
                    </div>
                    <div className="w-1/2 text-center p-4 bg-indigo-100 rounded-r-lg">
                      <div className="font-medium text-indigo-800 mb-1">After</div>
                      <p className="text-sm text-indigo-700">Strategic reviewers focusing on quality and edge cases</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 italic">
                    "By automating the heavy lifting, designers can focus on what truly matters: creating exceptional user experiences rather than tedious annotation work."
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Image comparison showcase */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">See the Transformation</h2>
          <ImageComparisonCarousel />
        </div>

        {/* Feature cards section */}
        <FeatureCards />
      </div>
    </div>
  );
};

export default Hero;
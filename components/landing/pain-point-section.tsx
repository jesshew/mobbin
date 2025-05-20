import React from 'react';
import { Clock, Users, AlertTriangle, TrendingDown } from 'lucide-react';

// Card for each pain point
const PainPointCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition duration-300">
    <div className="mb-3 text-indigo-600">{icon}</div>
    <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-600 text-base">{description}</p>
  </div>
);

const PainPointSection = () => (
  <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 md:p-8">
    <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">The Pain Point: Manual UX Annotation</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <PainPointCard
        icon={<Clock className="w-8 h-8 text-red-500" />}
        title="Painfully Slow"
        description="Manual bounding boxes & metadata tagging devour design hours, delaying projects."
      />
      <PainPointCard
        icon={<Users className="w-8 h-8 text-orange-500" />} 
        title="Highly Inconsistent"
        description="Varied annotator styles lead to inconsistencies."
      />
      <PainPointCard
        icon={<AlertTriangle className="w-8 h-8 text-yellow-500" />} 
        title="Error-Prone Process"
        description="Repetitive manual tasks increase human mistakes in labeling and classification."
      />
      <PainPointCard
        icon={<TrendingDown className="w-8 h-8 text-purple-500" />} 
        title="Impossible to Scale"
        description="Manual workflows bottleneck innovation and can't match rapid design iterations."
      />
    </div>
  </div>
);

export default PainPointSection; 
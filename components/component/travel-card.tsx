
import React from 'react';
import { cn } from '@/lib/utils';

interface TravelCardProps {
  imageUrl: string;
  className?: string;
}

const TravelCard: React.FC<TravelCardProps> = ({ imageUrl, className }) => {
  return (
    <div 
      className={cn(
        "relative rounded-2xl overflow-hidden shadow-lg card-hover", 
        className
      )}
      style={{ width: '240px', height: '180px' }}
    >
      <img 
        src={imageUrl} 
        alt="Travel destination" 
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
    </div>
  );
};

export default TravelCard;

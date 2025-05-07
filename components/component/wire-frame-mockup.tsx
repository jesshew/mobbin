
import React, { useState, useEffect, useRef } from 'react';
import { Check, MousePointer } from 'lucide-react';
import { cn } from '@/lib/utils';

type AnnotationBoxProps = {
  title: string;
  width: string;
  height: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  borderColor?: string;
  borderStyle?: string;
  delay: number;
  children: React.ReactNode;
  isFocused?: boolean;
  isHovered?: boolean;
  onClick?: () => void;
  onHover?: () => void;
  onLeave?: () => void;
};

const AnnotationBox: React.FC<AnnotationBoxProps> = ({
  title,
  width,
  height,
  top,
  left,
  right,
  bottom,
  borderColor ,
  borderStyle = 'solid',
  delay,
  children,
  isFocused = false,
  isHovered = false,
  onClick,
  onHover,
  onLeave,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showLabel, setShowLabel] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      
      // Show label after box is visible
      setTimeout(() => {
        setShowLabel(true);
      }, 300);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={cn(
        "absolute transition-all duration-700",
        {
          "opacity-0 scale-95 blur-sm": !isVisible,
          "opacity-100 scale-100 blur-0": isVisible,
          "z-30": isFocused || isHovered,
        }
      )}
      style={{ width, height, top, left, right, bottom }}
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div
        className={cn(
          "w-full h-full border-2",
          `border-${borderColor}`,
          borderStyle === 'dashed' ? 'border-dashed' : '',
          "relative transition-all duration-300",
          {
            "ring-2 ring-offset-2 ring-annotation-accent": isFocused,
            "animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.5)]": isHovered,
          }
        )}
      >
        {children}
      </div>
      {showLabel && (
        <div 
          className={cn(
            "absolute -top-8 left-0 bg-annotation-primary text-white text-xs py-1 px-2 rounded whitespace-nowrap transition-all duration-300",
            {
              "opacity-0": !showLabel,
              "opacity-100": showLabel,
              "font-semibold": isFocused || isHovered,
            }
          )}
        >
          {title}
        </div>
      )}
    </div>
  );
};

const WireframeMockup = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Refined annotations with slight offset for better visibility
  const annotations = [
    { id: 0, title: "Header", width: "350px", height: "110px", top: "-5px", left: "-5px", delay: 1000 },
    { id: 1, title: "Success Icon", width: "90px", height: "90px", top: "130px", left: "125px", delay: 1500 },
    { id: 2, title: "Title Message", width: "260px", height: "40px", top: "235px", left: "40px", borderColor: "orange-400", borderStyle: "dashed", delay: 2000 },
    { id: 3, title: "Subtitle", width: "310px", height: "40px", top: "275px", left: "15px", delay: 2500 },
    { id: 4, title: "Total Label", width: "310px", height: "40px", top: "315px", left: "15px", delay: 3000 },
    { id: 5, title: "Amount", width: "260px", height: "55px", top: "360px", left: "40px", borderColor: "orange-400", borderStyle: "dashed", delay: 3500 },
    { id: 6, title: "Card Details", width: "310px", height: "80px", top: "475px", left: "15px", borderColor: "orange-400", delay: 4000 },
    { id: 7, title: "Done Button", width: "310px", height: "60px", top: "590px", left: "15px", delay: 4500 },
    { id: 8, title: "Additional Action", width: "185px", height: "35px", top: "650px", left: "78px", delay: 5000 }
  ];
  
  // Function to generate a random box index different from current
  const getRandomBoxIndex = (current: number | null) => {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * annotations.length);
    } while (newIndex === current);
    return newIndex;
  };
  
  // Simulate realistic mouse movement
  useEffect(() => {
    // Wait a bit before starting animation
    const initialDelay = setTimeout(() => {
      // Initial sequence through each annotation
      let currentIndex = 0;
      const initialSequenceInterval = setInterval(() => {
        if (currentIndex < annotations.length) {
          setActiveIndex(currentIndex);
          
          const annotation = annotations[currentIndex];
          const x = parseInt(annotation.left || "0") + parseInt(annotation.width) / 2;
          const y = parseInt(annotation.top || "0") + parseInt(annotation.height) / 2;
          
          // Add slight natural movement
          const randomOffsetX = (Math.random() - 0.5) * 10;
          const randomOffsetY = (Math.random() - 0.5) * 10;
          
          setMousePosition({ 
            x: x + randomOffsetX, 
            y: y + randomOffsetY 
          });
          currentIndex++;
        } else {
          clearInterval(initialSequenceInterval);
          
          // After initial sequence, start random movements
          const randomMovementInterval = setInterval(() => {
            const randomIndex = getRandomBoxIndex(activeIndex);
            setActiveIndex(randomIndex);
            
            const annotation = annotations[randomIndex];
            const x = parseInt(annotation.left || "0") + parseInt(annotation.width) / 2;
            const y = parseInt(annotation.top || "0") + parseInt(annotation.height) / 2;
            
            // Add slight natural movement
            const randomOffsetX = (Math.random() - 0.5) * 15;
            const randomOffsetY = (Math.random() - 0.5) * 15;
            
            // Animate the mouse movement with a smoother transition
            animateMouseMovement(
              mousePosition.x, 
              mousePosition.y, 
              x + randomOffsetX, 
              y + randomOffsetY, 
              30
            );
          }, 2500);
          
          return () => clearInterval(randomMovementInterval);
        }
      }, 1200);
      
      return () => {
        clearTimeout(initialDelay);
        clearInterval(initialSequenceInterval);
      };
    }, 1000);
    
    return () => {
      // Cleanup
    };
  }, []);
  
  // Function to animate mouse movement in a more natural way
  const animateMouseMovement = (startX: number, startY: number, endX: number, endY: number, steps: number) => {
    let step = 0;
    
    // Add some natural curve to the movement
    const bezierX = startX + (Math.random() - 0.5) * 30;
    const bezierY = startY + (Math.random() - 0.5) * 30;
    
    const interval = setInterval(() => {
      if (step <= steps) {
        const progress = step / steps;
        const easedProgress = easeInOutCubic(progress);
        
        // Quadratic bezier curve for more natural movement
        const x = quadraticBezier(startX, bezierX, endX, easedProgress);
        const y = quadraticBezier(startY, bezierY, endY, easedProgress);
        
        setMousePosition({ x, y });
        step++;
      } else {
        clearInterval(interval);
      }
    }, 16); // ~60fps
  };
  
  // Easing function for smoother animation
  const easeInOutCubic = (t: number) => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };
  
  // Quadratic bezier curve calculation for natural mouse movement
  const quadraticBezier = (p0: number, p1: number, p2: number, t: number) => {
    return (1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * p1 + t * t * p2;
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div 
        ref={containerRef} 
        className="relative w-[340px] h-[720px] bg-white rounded-3xl overflow-hidden shadow-xl"
      >
        {/* Header - Green background with title */}
        <div className="w-[340px] h-[100px] absolute top-0 left-0">
          <div className="w-full h-full bg-green-700 p-6">
            <div className="w-36 h-6 bg-transparent"></div>
          </div>
        </div>
        
        {/* Success Icon */}
        <div className="w-[80px] h-[80px] absolute left-1/2 top-[135px] -translate-x-1/2">
          <div className="w-full h-full bg-orange-300 rounded-full flex items-center justify-center border-4 border-green-500">
            <Check size={40} className="text-white" />
          </div>
        </div>
        
        {/* Title - Success message box */}
        <div className="w-[250px] h-[30px] absolute left-1/2 top-[240px] -translate-x-1/2">
          <div className="w-full h-full border-2 border-orange-400 border-dashed flex items-center justify-center">
            <div className="w-36 h-5 bg-transparent"></div>
          </div>
        </div>
        
        {/* Subtitle - Description box */}
        <div className="w-[300px] h-[30px] absolute left-1/2 top-[280px] -translate-x-1/2">
          <div className="w-full h-full border-2 border-green-500 flex items-center justify-center">
            <div className="w-64 h-5 bg-transparent"></div>
          </div>
        </div>
        
        {/* Total Label box */}
        <div className="w-[300px] h-[30px] absolute left-1/2 top-[320px] -translate-x-1/2">
          <div className="w-full h-full border-2 border-green-500 flex items-center justify-center">
            <div className="w-32 h-5 bg-transparent"></div>
          </div>
        </div>
        
        {/* Amount box */}
        <div className="w-[250px] h-[45px] absolute left-1/2 top-[365px] -translate-x-1/2">
          <div className="w-full h-full border-2 border-orange-400 border-dashed flex items-center justify-center">
            <div className="w-24 h-7 bg-transparent"></div>
          </div>
        </div>
        
        {/* Destination label */}
        <div className="w-[300px] h-[20px] absolute left-1/2 top-[435px] -translate-x-1/2">
          <div className="w-36 h-5 bg-gray-300"></div>
        </div>
        
        {/* Card details container */}
        <div className="w-[300px] h-[70px] absolute left-1/2 top-[480px] -translate-x-1/2">
          <div className="w-full h-full border-2 border-orange-400 flex items-center p-3">
            {/* Card icon */}
            <div className="w-[40px] h-[40px] relative">
              <div className="w-full h-full bg-green-500 rounded-md"></div>
            </div>
            
            <div className="ml-3 flex flex-col">
              <div className="w-32 h-5 bg-transparent"></div>
              <div className="w-48 h-4 mt-2 bg-orange-300"></div>
            </div>
          </div>
        </div>
        
        {/* Done button */}
        <div className="w-[300px] h-[50px] absolute left-1/2 top-[595px] -translate-x-1/2">
          <div className="w-full h-full bg-green-500 rounded-md flex items-center justify-center">
            <div className="w-16 h-5 bg-transparent"></div>
          </div>
        </div>
        
        {/* Additional action */}
        <div className="w-[175px] h-[25px] absolute left-1/2 top-[655px] -translate-x-1/2">
          <div className="w-full h-full border-2 border-green-500 flex items-center justify-center">
            <div className="w-36 h-4 bg-transparent"></div>
          </div>
        </div>
        
        {/* Bottom decoration */}
        <div className="absolute bottom-0 w-full h-[80px] bg-green-800">
        </div>
        
        {/* Annotation Overlay */}
        {annotations.map((annotation) => (
          <AnnotationBox
            key={annotation.id}
            title={annotation.title}
            width={annotation.width}
            height={annotation.height}
            top={annotation.top}
            left={annotation.left}
            borderColor={annotation.borderColor || "annotation-primary"}
            borderStyle={annotation.borderStyle || "solid"}
            delay={annotation.delay}
            isFocused={activeIndex === annotation.id}
            isHovered={hoveredIndex === annotation.id}
            onClick={() => setActiveIndex(annotation.id)}
            onHover={() => setHoveredIndex(annotation.id)}
            onLeave={() => setHoveredIndex(null)}
          >
            <div className={cn(
              "w-full h-full bg-annotation-primary/10 transition-all duration-300",
              { "bg-annotation-primary/30": hoveredIndex === annotation.id }
            )}></div>
          </AnnotationBox>
        ))}
        
        {/* Animated Mouse Pointer */}
        <div 
          className="absolute z-40 pointer-events-none transition-all duration-300 ease-out"
          style={{ 
            left: `${mousePosition.x}px`, 
            top: `${mousePosition.y}px`,
            opacity: activeIndex !== null ? 1 : 0,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <MousePointer size={24} className="text-annotation-accent animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default WireframeMockup;

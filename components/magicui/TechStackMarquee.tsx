import { cn } from "@/lib/utils";
import { Marquee } from "./marquee";
import { Code, Server, Database, Cpu } from "lucide-react";

interface TechStackMarqueeProps {
  className?: string;
  title?: string;
  subtitle?: string;
}

export function TechStackMarquee({
  className,
  title = "Core Technologies", // Default title for the tech stack section
  subtitle = "An overview of the primary technologies and services used in this application." // Default subtitle providing context
}: TechStackMarqueeProps) {
  // Array of technology names to be displayed in the marquee
  const techStack = [
    "Next.js",
    "Supabase",
    "Claude 3.7",
    "Vercel",
    "OpenAI GPT-4.1",
    "Moondream"
  ];

  return (
    <div className={cn("max-w-5xl mx-auto px-4 sm:px-6", className)}>
      {/* Section header */}
      <div className="text-center mb-8 sm:mb-10">
        <div className="inline-flex items-center justify-center px-3 sm:px-4 py-1.5 mb-4 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-medium text-xs sm:text-sm">
          <Cpu className="w-4 h-4 mr-2" />
          <span>Technology Stack</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">{title}</h2>
        <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
          {subtitle}
        </p>
      </div>

      {/* Marquee section */}
      <div className="w-full bg-black/5 dark:bg-white/5 py-3 rounded-lg">
        <Marquee pauseOnHover>
          {techStack.map((tech, index) => (
            <div 
              key={index}
              className="flex items-center mx-8 text-sm font-medium"
            >
              <span className="text-foreground mr-2">•</span>
              <span>{tech}</span>
            </div>
          ))}
        </Marquee>
      </div>
    </div>
  );
} 
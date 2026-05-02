import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import T from './T';

interface Step {
  title: string;
  description: string;
  longDescription: string;
}

const STEPS: Step[] = [
  {
    title: "Voter Registration",
    description: "The first step to participating in any election.",
    longDescription: "Eligible citizens must register themselves on the electoral roll. This ensures you are on the list of people allowed to vote in your constituency."
  },
  {
    title: "Candidate Filing",
    description: "Individuals officially enter the race.",
    longDescription: "Candidates file their nomination papers, declare their assets, and fulfill legal requirements to stand for election."
  },
  {
    title: "Primaries / Nominations",
    description: "Parties select their main representatives.",
    longDescription: "Political parties hold internal contests or follow selection processes to choose the final candidate who will represent them on the ballot."
  },
  {
    title: "Campaign Period",
    description: "Candidates share their vision with the public.",
    longDescription: "A regulated period where candidates use rallies, media, and door-to-door visits to inform voters about their platforms and promises."
  },
  {
    title: "Election Day",
    description: "The main event where citizens cast their votes.",
    longDescription: "Voters go to designated polling stations to cast their ballots using EVMs or paper slips. This is the core of democratic participation."
  },
  {
    title: "Vote Counting",
    description: "Tallying the results under strict supervision.",
    longDescription: "Once polls close, officials count the votes in the presence of candidate representatives to ensure transparency and accuracy."
  },
  {
    title: "Results Certification",
    description: "Official declaration of the winners.",
    longDescription: "The election commission verifies the counts and officially certifies the results, declaring the elected representative for each seat."
  }
];

/**
 * Timeline Component
 * Why: Provides an interactive step-by-step visual representation of the election process. Uses React.memo and useCallback for efficiency.
 */
const Timeline: React.FC = React.memo(() => {
  const [activeStep, setActiveStep] = useState<number | null>(0);

  const toggleStep = useCallback((index: number) => {
    setActiveStep(prev => prev === index ? null : index);
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4" role="region" aria-label="Election Lifecycle Timeline">
      <h2 className="text-2xl font-bold text-primary mb-8 text-center"><T>Election Lifecycle</T></h2>
      
      <div className="relative">
        {/* Vertical line for mobile */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-surface-dim md:hidden" aria-hidden="true" />
        
        <div className="space-y-6" role="list">
          {STEPS.map((step, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative pl-12 md:pl-0"
              role="listitem"
            >
              {/* Dot for mobile */}
              <div 
                className={`absolute left-[13px] top-2 w-4 h-4 rounded-full border-2 bg-white z-10 md:hidden ${activeStep === index ? 'border-primary' : 'border-surface-dim'}`} 
                aria-hidden="true"
              />
              
              <button
                onClick={() => toggleStep(index)}
                className={`w-full text-left p-6 rounded-xl border transition-all duration-300 ${
                  activeStep === index 
                    ? 'glass border-primary shadow-lg ring-1 ring-primary/20' 
                    : 'bg-white/50 border-surface-dim hover:border-primary/30 hover:bg-white'
                }`}
                aria-expanded={activeStep === index}
                aria-controls={`step-content-${index}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span 
                      className={`hidden md:flex w-8 h-8 rounded-full items-center justify-center font-bold text-sm ${
                        activeStep === index ? 'bg-primary text-white' : 'bg-surface-dim text-gray-500'
                      }`}
                      aria-hidden="true"
                    >
                      {index + 1}
                    </span>
                    <div>
                      <h3 className={`font-semibold ${activeStep === index ? 'text-primary' : 'text-gray-700'}`}>
                        <T>{step.title}</T>
                      </h3>
                      <p className="text-sm text-gray-500"><T>{step.description}</T></p>
                    </div>
                  </div>
                  <ChevronRight 
                    size={20} 
                    className={`text-gray-400 transition-transform duration-300 ${activeStep === index ? 'rotate-90 text-primary' : ''}`} 
                    aria-hidden="true"
                  />
                </div>

                <AnimatePresence>
                  {activeStep === index && (
                    <motion.div
                      id={`step-content-${index}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                      role="region"
                      aria-label={`${step.title} details`}
                    >
                      <div className="pt-4 mt-4 border-t border-surface-dim/50 text-gray-600 leading-relaxed">
                        <T>{step.longDescription}</T>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default Timeline;

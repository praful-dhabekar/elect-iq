import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, ClipboardList } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import T from './T';

const CHECKLIST_ITEMS = [
  "Am I registered?",
  "Do I know my polling station?",
  "Have I checked my voter ID?",
  "Do I know the election date?",
  "Have I reviewed candidates?",
  "Do I know my rights?"
];

/**
 * VoterChecklist Component
 * Why: Helps users track their election readiness. Uses localStorage for persistence. Wrapped in React.memo and uses useCallback for optimized rendering.
 */
const VoterChecklist: React.FC = React.memo(() => {
  const { user } = useAuth() || {};
  const [checkedItems, setCheckedItems] = useState<boolean[]>(() => {
    try {
      const saved = localStorage.getItem('electiq-checklist');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return new Array(CHECKLIST_ITEMS.length).fill(false);
    } catch {
      return new Array(CHECKLIST_ITEMS.length).fill(false);
    }
  });

  useEffect(() => {
    if (user) {
      const fetchChecklist = async () => {
        try {
          const docRef = doc(db, 'checklists', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (Array.isArray(data.items)) {
              setCheckedItems(data.items);
            }
          }
        } catch (e) {
          // Silently fall back to local storage
        }
      };
      fetchChecklist();
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem('electiq-checklist', JSON.stringify(checkedItems));
    } catch (e) {
      // Ignore write errors to localStorage
    }
  }, [checkedItems]);

  const toggleItem = useCallback(async (index: number) => {
    const next = [...checkedItems];
    next[index] = !next[index];
    setCheckedItems(next);

    if (user) {
      try {
        await setDoc(doc(db, 'checklists', user.uid), { items: next, updatedAt: new Date() }, { merge: true });
      } catch (e) {
        // Silently fall back
      }
    }
  }, [checkedItems, user]);

  const progress = useMemo(() => {
    return (checkedItems.filter(Boolean).length / CHECKLIST_ITEMS.length) * 100;
  }, [checkedItems]);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4" role="region" aria-label="Voter Readiness Checklist">
      <div className="text-center mb-10">
        <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-4" aria-hidden="true">
          <ClipboardList size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800"><T>Your Voter Readiness</T></h2>
        <p className="text-gray-500 mt-2"><T>Complete these steps to ensure you're ready for election day.</T></p>
        
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500" aria-label={user ? "Synced across devices" : "Saved locally"}>
          <span className={`w-2 h-2 rounded-full ${user ? 'bg-green-500' : 'bg-gray-400'}`}></span>
          <span><T>{user ? "Synced across devices" : "Saved locally"}</T></span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8 glass rounded-xl p-6" aria-live="polite">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700" id="progress-label"><T>Completion Progress</T></span>
          <span className="text-sm font-bold text-primary">{Math.round(progress)}%</span>
        </div>
        <div 
          className="w-full h-3 bg-surface-dim rounded-full overflow-hidden"
          role="progressbar" 
          aria-valuenow={Math.round(progress)} 
          aria-valuemin={0} 
          aria-valuemax={100}
          aria-labelledby="progress-label"
        >
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-primary transition-all duration-500"
          />
        </div>
      </div>

      <div className="space-y-3" role="group" aria-label="Checklist items">
        {CHECKLIST_ITEMS.map((item, index) => (
          <motion.button
            key={index}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => toggleItem(index)}
            className={`w-full flex items-center p-5 rounded-xl border transition-all ${
              checkedItems[index] 
                ? 'bg-primary/5 border-primary/20' 
                : 'bg-white border-surface-dim hover:border-primary/30'
            }`}
            aria-checked={checkedItems[index]}
            role="checkbox"
          >
            <div className={`mr-4 transition-colors ${checkedItems[index] ? 'text-primary' : 'text-gray-300'}`} aria-hidden="true">
              {checkedItems[index] ? <CheckCircle size={24} /> : <Circle size={24} />}
            </div>
            <span className={`text-lg font-medium transition-colors ${checkedItems[index] ? 'text-primary line-through opacity-70' : 'text-gray-700'}`}>
              <T>{item}</T>
            </span>
          </motion.button>
        ))}
      </div>

      {progress === 100 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 p-4 rounded-xl bg-green-50 border border-green-100 text-green-700 text-center font-medium"
          role="alert"
        >
          🎉 <T>You're all set! Your civic duty awaits.</T>
        </motion.div>
      )}
    </div>
  );
});

export default VoterChecklist;

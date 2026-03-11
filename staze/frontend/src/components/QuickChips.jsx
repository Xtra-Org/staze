import React from 'react'
import { motion } from 'framer-motion'
import { quickScenarioKeys, offlineScenarioInputs } from '@/translations'

export function QuickChips({ copy, language, onSelect }) {
  return (
    <section className="clay-panel p-5">
      <h3 className="mb-4 font-display text-xl text-white">{copy.quickScenarios}</h3>
      <motion.div initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: 0.08 } } }} className="flex flex-wrap gap-3">
        {quickScenarioKeys.map((key) => (
          <motion.button key={key} variants={{ initial: { opacity: 0, y: 24, scale: 0.97 }, animate: { opacity: 1, y: 0, scale: 1 } }} whileHover={{ y: -2 }} type="button" className="clay-chip text-sm font-semibold text-white/90" onClick={() => onSelect(offlineScenarioInputs[key][language])}>
            {copy[key]}
          </motion.button>
        ))}
      </motion.div>
    </section>
  )
}

import React from 'react'
import { motion } from 'framer-motion'

export function BystanderRoles({ copy, roles, onReshuffle }) {
  const MotionArticle = motion.article
  if (!roles?.length || roles.length <= 1) return null

  return (
    <section className="clay-panel p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="font-display text-2xl text-white">{copy.bystanderRoles}</h3>
        <button type="button" onClick={onReshuffle} className="clay-chip text-sm text-white/80">{copy.reshuffleRoles}</button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {roles.map((role, index) => (
          <MotionArticle key={`${role.person}-${role.role}`} initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4, delay: index * 0.08, ease: [0.23, 1, 0.32, 1] }} className="rounded-[24px] border border-white/8 bg-black/15 p-5 shadow-[inset_4px_0_0_rgba(30,144,255,0.8)]">
            <div className="text-4xl">{role.icon}</div>
            <div className="mt-4 text-xs uppercase tracking-[0.18em] text-white/45">Person {role.person}</div>
            <div className="mt-2 font-display text-xl text-white">{role.role}</div>
            <p className="mt-2 text-sm text-white/70">{role.instruction}</p>
          </MotionArticle>
        ))}
      </div>
    </section>
  )
}

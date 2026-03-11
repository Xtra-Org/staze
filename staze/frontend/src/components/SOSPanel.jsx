import React from 'react'
import { motion } from 'framer-motion'

const items = [
  { label: '102 Ambulance', href: 'tel:102', tone: 'bg-red-500/16 border-red-400/25 shadow-[0_0_24px_rgba(255,71,87,0.2)]' },
  { label: '100 Police', href: 'tel:100', tone: 'bg-sky-500/14 border-sky-400/25' },
  { label: '101 Fire', href: 'tel:101', tone: 'bg-amber-500/14 border-amber-400/25' },
  { label: '108 Emergency', href: 'tel:108', tone: 'bg-violet-500/14 border-violet-400/25' },
]

export function SOSPanel() {
  return (
    <section className="clay-panel sticky top-28 p-4">
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <motion.a key={item.href} href={item.href} whileTap={{ scale: 0.96, y: 3 }} className={`clay-button flex min-h-[88px] flex-col items-center justify-center rounded-[20px] border text-center text-white ${item.tone}`}>
            <span className="font-display text-xl">{item.label.split(' ')[0]}</span>
            <span className="text-xs uppercase tracking-[0.16em] text-white/75">{item.label.split(' ').slice(1).join(' ')}</span>
          </motion.a>
        ))}
      </div>
    </section>
  )
}

import React from 'react'
import { languages } from '@/translations'
import { Toggle } from '@/components/ui/toggle'

export function LanguageSelector({ language, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {languages.map((item) => (
        <Toggle key={item.key} pressed={language === item.key} onPressedChange={() => onChange(item.key)} className="min-w-16 justify-center px-3 py-2 text-xs font-bold uppercase tracking-[0.16em]">
          {item.label}
        </Toggle>
      ))}
    </div>
  )
}

import React from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

export function IncidentReport({ open, onOpenChange, copy, session, report, onGenerate, onCopy, onShare }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-h-[88vh]">
        <SheetHeader>
          <SheetTitle>{copy.incidentReport}</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[65vh] pr-4">
          <div className="space-y-5">
            <div className="clay-panel p-4">
              <div className="text-sm text-white/55">Emergency</div>
              <div className="mt-1 text-white">{session.emergency || '—'}</div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="clay-panel p-4"><div className="text-sm text-white/55">Severity</div><div className="mt-1 text-white">{session.severity || '—'}</div></div>
              <div className="clay-panel p-4"><div className="text-sm text-white/55">Condition</div><div className="mt-1 text-white">{session.condition || '—'}</div></div>
            </div>
            <div className="clay-panel p-4">
              <div className="text-sm text-white/55">Timeline</div>
              <div className="mt-2 space-y-2 text-white/75">{session.timeline?.map((item) => <div key={item.id || `${item.time}-${item.summary}`}>{item.time} — {item.summary}</div>)}</div>
            </div>
            <div className="clay-panel p-4">
              <div className="text-sm text-white/55">Doctor handoff</div>
              <pre className="mt-3 whitespace-pre-wrap font-body text-sm text-white/80">{report || copy.reportPending}</pre>
            </div>
          </div>
        </ScrollArea>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button type="button" variant="critical" onClick={onGenerate}>{copy.reportPending}</Button>
          <Button type="button" onClick={onCopy}>{copy.copyReport}</Button>
          <Button type="button" onClick={onShare}>{copy.share}</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

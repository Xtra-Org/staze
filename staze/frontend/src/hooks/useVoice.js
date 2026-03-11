import { useCallback, useMemo, useRef, useState } from 'react'
import { languages, t } from '@/translations'

function getSpeechRecognition() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export function useVoice(language = 'en', rate = 0.85) {
  const [listening, setListening] = useState(false)
  const [supported] = useState(() => Boolean(getSpeechRecognition()))
  const [speaking, setSpeaking] = useState(false)
  const [error, setError] = useState('')
  const recognitionRef = useRef(null)

  const langCode = useMemo(() => languages.find((item) => item.key === language)?.code || 'en-IN', [language])
  const copy = t[language] || t.en

  const mapSpeechError = useCallback((code) => {
    if (code === 'not-allowed' || code === 'service-not-allowed') return copy.voicePermissionDenied
    if (code === 'no-speech' || code === 'aborted') return copy.voiceNoSpeech
    if (code === 'network') return copy.voiceNetworkError
    return copy.voiceStartFailed
  }, [copy.voiceNetworkError, copy.voiceNoSpeech, copy.voicePermissionDenied, copy.voiceStartFailed])

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current
    recognitionRef.current = null
    if (recognition) {
      recognition.onstart = null
      recognition.onend = null
      recognition.onerror = null
      recognition.onresult = null
      try {
        recognition.stop()
      } catch {
        try {
          recognition.abort?.()
        } catch {
          // Ignore recognition shutdown failures.
        }
      }
    }
    setListening(false)
  }, [])

  const speak = useCallback((text, options = {}) => {
    if (!('speechSynthesis' in window) || !text) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = langCode
    utterance.rate = options.rate || rate
    utterance.pitch = options.pitch || 1
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)

    const voice = window.speechSynthesis.getVoices().find((item) => item.lang?.toLowerCase().startsWith(langCode.slice(0, 2).toLowerCase()))
    if (voice) utterance.voice = voice
    window.speechSynthesis.speak(utterance)
  }, [langCode, rate])

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setSpeaking(false)
  }, [])

  const startListening = useCallback(async (onResult, onError) => {
    const SpeechRecognition = getSpeechRecognition()
    if (!SpeechRecognition) {
      const message = copy.voiceUnsupported
      setError(message)
      onError?.(message)
      return
    }

    stopSpeaking()
    stopListening()
    setError('')

    if (!window.isSecureContext) {
      const message = copy.voiceUnsupported
      setError(message)
      onError?.(message)
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      const message = copy.voiceUnsupported
      setError(message)
      onError?.(message)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop())
    } catch {
      const message = copy.voicePermissionDenied
      setError(message)
      onError?.(message, 'not-allowed')
      return
    }

    let recognition
    try {
      recognition = new SpeechRecognition()
    } catch {
      const message = copy.voiceStartFailed
      setError(message)
      onError?.(message)
      return
    }

    recognition.lang = langCode
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onstart = () => {
      setListening(true)
      setError('')
    }
    recognition.onend = () => {
      recognitionRef.current = null
      setListening(false)
    }
    recognition.onerror = (event) => {
      recognitionRef.current = null
      setListening(false)
      const message = mapSpeechError(event.error)
      setError(message)
      onError?.(message, event.error)
    }
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || ''
      if (!transcript.trim()) {
        const message = copy.voiceNoSpeech
        setError(message)
        onError?.(message, 'empty-result')
        return
      }
      setError('')
      onResult?.(transcript.trim())
    }
    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch {
      recognitionRef.current = null
      setListening(false)
      const message = copy.voiceStartFailed
      setError(message)
      onError?.(message)
    }
  }, [copy.voiceNoSpeech, copy.voiceStartFailed, copy.voiceUnsupported, langCode, mapSpeechError, stopListening, stopSpeaking])

  const parseCommand = useCallback((transcript) => {
    const lower = transcript.toLowerCase()
    const dictionary = {
      next: ['next step', 'अगला चरण', 'পরের ধাপ'],
      repeat: ['repeat', 'दोहराएं', 'আবার বলুন'],
      ambulance: ['call ambulance', 'एम्बुलेंस कॉल', 'অ্যাম্বুলেন্স ডাকুন'],
      cpr: ['start cpr', 'सीपीआर शुरू', 'সিপিআর শুরু'],
    }

    if (dictionary.next.some((value) => lower.includes(value.toLowerCase()))) return 'next'
    if (dictionary.repeat.some((value) => lower.includes(value.toLowerCase()))) return 'repeat'
    if (dictionary.ambulance.some((value) => lower.includes(value.toLowerCase()))) return 'ambulance'
    if (dictionary.cpr.some((value) => lower.includes(value.toLowerCase()))) return 'cpr'
    return ''
  }, [])

  const cprPhrases = useMemo(() => ({
    beat: t[language].cprBeat,
    breath: t[language].cprBreath,
  }), [language])

  return {
    supported,
    listening,
    speaking,
    langCode,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    parseCommand,
    cprPhrases,
    error,
  }
}

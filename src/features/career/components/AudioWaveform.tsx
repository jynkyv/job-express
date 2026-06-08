"use client"

import { useMemo } from "react"

interface AudioWaveformProps {
  barCount?: number
  color?: string
  className?: string
}

export default function AudioWaveform({
  barCount = 30,
  color = "bg-white/80",
  className = "",
}: AudioWaveformProps) {
  const bars = useMemo(() => {
    return Array.from({ length: barCount }, (_, i) => ({
      id: i,
      delay: `${(i * 0.06).toFixed(2)}s`,
      duration: `${(0.5 + Math.random() * 0.6).toFixed(2)}s`,
    }))
  }, [barCount])

  return (
    <div className={`flex items-end justify-center gap-[2px] h-10 ${className}`}>
      {bars.map((bar) => (
        <div
          key={bar.id}
          className={`w-[3px] rounded-full ${color}`}
          style={{
            animation: `wave-bar ${bar.duration} ease-in-out infinite`,
            animationDelay: bar.delay,
            transformOrigin: "center",
          }}
        />
      ))}
    </div>
  )
}

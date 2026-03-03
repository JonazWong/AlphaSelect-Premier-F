'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Legacy stub — redirect to canonical /extreme-reversal page.
 */
export default function ExtremeReversalMonitorRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/extreme-reversal')
  }, [router])
  return null
}

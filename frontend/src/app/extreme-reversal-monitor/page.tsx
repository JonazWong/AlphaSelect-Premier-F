'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ExtremeReversalMonitorRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/extreme-reversal')
  }, [router])
  return null
}

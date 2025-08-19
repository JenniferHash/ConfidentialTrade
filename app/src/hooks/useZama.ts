import { useState, useEffect } from 'react'
import { initializeZama } from '../utils/zama'
import type { FhevmInstance } from '@zama-fhe/relayer-sdk/bundle'

export const useZama = () => {
  const [instance, setInstance] = useState<FhevmInstance | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const zamaInstance = await initializeZama()
        setInstance(zamaInstance)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '初始化Zama失败 / Failed to initialize Zama'
        setError(errorMessage)
        console.error('Zama initialization error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    initialize()
  }, [])

  return {
    instance,
    isLoading,
    error,
    isReady: !!instance && !isLoading && !error,
  }
}
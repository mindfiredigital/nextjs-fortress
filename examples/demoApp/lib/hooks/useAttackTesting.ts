import { useState, useCallback } from 'react'
import { AttackKey, TestResult } from '../../types'
import { ATTACKS } from '../constants/attacks'
import { AttackService } from '../services/attackService'

const MAX_HISTORY_ITEMS = 10

export const useAttackTesting = () => {
  const [selectedAttack, setSelectedAttack] = useState<AttackKey>('prototypePollution')
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [testHistory, setTestHistory] = useState<TestResult[]>([])

  const addToHistory = useCallback((result: TestResult) => {
    setTestHistory((prev) => [result, ...prev.slice(0, MAX_HISTORY_ITEMS - 1)])
  }, [])

  const simulateAttack = useCallback(async (attackKey: AttackKey): Promise<void> => {
    setLoading(true)
    setTestResult(null)

    try {
      const attack = ATTACKS[attackKey]

      let result: TestResult

      if (attackKey === 'rateLimitTest') {
        result = await AttackService.runRateLimitTest(attack)
      } else {
        result = await AttackService.testAttack(attack)
      }

      setTestResult(result)
      addToHistory(result)
    } catch (error) {
      console.error('Test failed:', error)
    } finally {
      setLoading(false)
    }
  }, [addToHistory])

  return {
    selectedAttack,
    setSelectedAttack,
    testResult,
    loading,
    testHistory,
    simulateAttack,
  }
}
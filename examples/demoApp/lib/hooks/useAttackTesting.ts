import { useState, useCallback } from 'react'
import { AttackKey, TestResult } from '../../types'
import { ATTACKS } from '../mock/attacks'
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

  const clearTestResult = useCallback(() => {
    setTestResult(null)
  }, [])

  const simulateAttack = useCallback(async (attackKey: AttackKey): Promise<void> => {
    setLoading(true)
    setTestResult(null)

    try {
      const attack = ATTACKS[attackKey]

      let result: TestResult

      console.log("attack",attack);
      console.log("attack key",attackKey);

      if (attackKey === 'rateLimitTest') {
        result = await AttackService.runRateLimitTest(attack)
      } else {
        result = await AttackService.testAttack(attack, attackKey)
      }

      setTestResult(result)
      addToHistory(result)
    } catch (error) {
      console.error('Test failed:', error)
      
      setTestResult({
        blocked: false,
        attack: ATTACKS[attackKey].name,
        severity: ATTACKS[attackKey].severity,
        responseStatus: 500,
        message: ' Test failed - Network or server error',
        details: {
          rule: 'ERROR',
          pattern: 'Network failure',
          confidence: 0,
          action: 'error',
          timestamp: new Date().toLocaleTimeString(),
        },
      })
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
    clearTestResult,
  }
}
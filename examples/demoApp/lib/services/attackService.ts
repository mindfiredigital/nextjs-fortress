import { AttackPayload, TestResult, Attack } from '../../types'

interface ApiResponse {
  status: number
  headers: Headers
}

export class AttackService {
  private static readonly API_ENDPOINT = '/api/test'
  private static readonly REQUEST_DELAY = 100

  static async testAttack(attack: Attack): Promise<TestResult> {
    const headers = this.buildHeaders(attack.payload)

    const response = await fetch(this.API_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(attack.payload),
    })

    return this.buildTestResult(response, attack)
  }

  static async runRateLimitTest(
    attack: Attack,
    requestCount: number = 12
  ): Promise<TestResult> {
    let blockedCount = 0
    let allowedCount = 0

    for (let i = 0; i < requestCount; i++) {
      try {
        const response = await fetch(this.API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...attack.payload, requestNumber: i + 1 }),
        })

        if (response.status === 429) {
          blockedCount++
        } else if (response.status === 200) {
          allowedCount++
        }

        await this.delay(this.REQUEST_DELAY)
      } catch (error) {
        console.error(`Request ${i + 1} failed:`, error)
      }
    }

    return this.buildRateLimitResult(
      attack,
      requestCount,
      blockedCount,
      allowedCount
    )
  }

  private static buildHeaders(payload: AttackPayload): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' }

    if (payload._encoding === 'utf-16le') {
      headers['Content-Type'] = 'application/json; charset=utf-16le'
    }

    return headers
  }

  private static buildTestResult(
    response: ApiResponse,
    attack: Attack
  ): TestResult {
    const isBlocked = response.status === 403 || response.status === 400
    const isSuccess = response.status === 200

    return {
      blocked: isBlocked,
      attack: attack.name,
      severity: attack.severity,
      responseStatus: response.status,
      message: this.getStatusMessage(isBlocked, isSuccess, response.status),
      details: {
        rule: response.headers.get('x-fortress-rule') || 'none',
        pattern: JSON.stringify(attack.payload).substring(0, 50) + '...',
        confidence: parseFloat(
          response.headers.get('x-fortress-confidence') || '0'
        ),
        action: `${isBlocked ? 'Blocked' : 'Allowed'} (${response.status})`,
        timestamp: new Date().toLocaleTimeString(),
      },
    }
  }

  private static buildRateLimitResult(
    attack: Attack,
    totalRequests: number,
    blockedCount: number,
    allowedCount: number
  ): TestResult {
    const wasBlocked = blockedCount > 0

    return {
      blocked: wasBlocked,
      attack: attack.name,
      severity: attack.severity,
      responseStatus: wasBlocked ? 429 : 200,
      message: wasBlocked
        ? `🛡️ Rate limit triggered! ${blockedCount}/${totalRequests} blocked`
        : `⚠️ No rate limit (sent ${totalRequests} requests)`,
      details: {
        rule: 'rate_limit',
        pattern: `${allowedCount} allowed, ${blockedCount} blocked`,
        confidence: wasBlocked ? 1.0 : 0,
        action: `${totalRequests} rapid requests`,
        timestamp: new Date().toLocaleTimeString(),
      },
    }
  }

  private static getStatusMessage(
    isBlocked: boolean,
    isSuccess: boolean,
    status: number
  ): string {
    if (isBlocked) return '🛡️ Attack blocked by Fortress!'
    if (isSuccess) return '✅ Request allowed (Expected for valid)'
    return `⚠️ Unexpected: ${status}`
  }

  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
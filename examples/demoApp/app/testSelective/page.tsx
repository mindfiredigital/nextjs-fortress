// app/testSelective/page.tsx
'use client'

import { ATTACKS } from '../../lib/mock/attacks'
import { useAttackTesting } from '@/lib/hooks/useAttackTesting'
import { AttackKey } from '@/types'

// Reusing existing components
import { PayloadPanel } from '@/components/PayloadPanel'
import { HistoryPanel } from '@/components/HistoryPanel'
import { Footer } from '@/components/Footer'

// New component for selective testing
import { SelectiveAttackGroups } from '@/components/SelectiveAttackGroups'
import { SelectiveHeader } from '@/components/SelectiveHeader'
import { SelectiveResultPanel } from '@/components/SelectiveResultPanel'

export default function SelectiveMiddlewareTest() {
  const {
    selectedAttack,
    setSelectedAttack,
    testResult,
    loading,
    testHistory,
    simulateAttack,
    clearTestResult,
  } = useAttackTesting()

  const currentAttack = ATTACKS[selectedAttack]

  const handleAttackSelect = (attackKey: AttackKey) => {
    clearTestResult()
    setSelectedAttack(attackKey)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <SelectiveHeader />

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Attack Selection */}
          <SelectiveAttackGroups
            selectedAttack={selectedAttack}
            onAttackSelect={handleAttackSelect}
          />

          {/* Right Column - Reusing existing components */}
          <div className="space-y-6">
            <PayloadPanel
              attack={currentAttack}
              loading={loading}
              onTest={() => simulateAttack(selectedAttack)}
            />

            {testResult && (
              <SelectiveResultPanel
                result={testResult}
                selectedAttack={selectedAttack}
                onClear={clearTestResult}
              />
            )}

            <HistoryPanel history={testHistory} />
          </div>
        </div>

        <Footer history={testHistory} />
      </div>
    </div>
  )
}
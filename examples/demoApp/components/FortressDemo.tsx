'use client'

import { useMemo, useState } from 'react'
import { AttackKey, AttackCategory } from '../types'
import { ATTACKS } from '../lib/mock/attacks'
import { useAttackTesting } from '../lib/hooks/useAttackTesting'
import { filterAttacksByCategory } from '../lib/utils/attackHelpers'

// Component imports
import { Header } from './Header'
import { CategoryFilters } from './CategoryFilters'
import { AttackList } from './AttackList'
import { PayloadPanel } from './PayloadPanel'
import { ResultPanel } from './ResultPanel'
import { HistoryPanel } from './HistoryPanel'
import { Footer } from './Footer'

export default function FortressDemo() {
  const [selectedCategory, setSelectedCategory] = useState<AttackCategory | 'all'>('all')
  
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
  
  const filteredAttacks = useMemo(() => 
    filterAttacksByCategory(ATTACKS, selectedCategory), 
    [selectedCategory]
  )

  const handleAttackSelect = (attackKey: AttackKey) => {
    clearTestResult()
    setSelectedAttack(attackKey)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Header />
        
        <CategoryFilters 
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        <div className="grid lg:grid-cols-2 gap-6 mt-8">
          <AttackList
            attacks={filteredAttacks}
            selectedAttack={selectedAttack}
            onAttackSelect={handleAttackSelect}
          />

          <div className="space-y-6">
            <PayloadPanel
              attack={currentAttack}
              loading={loading}
              onTest={() => simulateAttack(selectedAttack)}
            />

            {testResult && (
              <ResultPanel
                result={testResult}
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
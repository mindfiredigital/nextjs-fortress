import { Attack, AttackCategory, AttackKey , TestResult } from './index';

export interface Category {
  id: AttackCategory | 'all'
  name: string
  icon: React.ComponentType<{ className?: string }>
}

export interface PayloadPanelProps {
  attack: Attack
  loading: boolean
  onTest: () => void
}

export interface HistoryPanelProps {
  history: TestResult[]
}

export interface FooterProps {
  history: TestResult[]
}

export interface CategoryFiltersProps {
  selectedCategory: AttackCategory | 'all'
  onCategoryChange: (category: AttackCategory | 'all') => void
}


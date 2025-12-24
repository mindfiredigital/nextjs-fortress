import { Shield, Bug, Database, FileWarning, Activity } from 'lucide-react'
import { Category } from '../../types'

export const CATEGORIES: Category[] = [
  { id: 'all', name: 'All', icon: Shield },
  { id: 'deserialization', name: 'Deserialization', icon: Bug },
  { id: 'injection', name: 'Injection', icon: Database },
  { id: 'encoding', name: 'Encoding', icon: FileWarning },
  { id: 'general', name: 'General', icon: Activity },
]
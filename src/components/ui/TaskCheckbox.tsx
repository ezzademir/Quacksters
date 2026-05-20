import { Check } from 'lucide-react'
import { triggerTaskHaptic } from '../../lib/native'

interface TaskCheckboxProps {
  checked: boolean
  onChange: () => void
  label: string
}

export function TaskCheckbox({ checked, onChange, label }: TaskCheckboxProps) {
  const handleClick = () => {
    void triggerTaskHaptic()
    onChange()
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={handleClick}
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 transition-all active:scale-95 ${
        checked
          ? 'border-brand-600 bg-brand-500 text-slate-900'
          : 'border-slate-200 bg-white text-transparent hover:border-brand-300'
      }`}
    >
      <Check className="h-5 w-5" strokeWidth={3} />
    </button>
  )
}

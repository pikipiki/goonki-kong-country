import { useTranslation } from 'react-i18next'
import { cssPercent } from '../utils/cssUnits'

export function ActionButtonCharge({
  chargeProgress,
}: {
  chargeProgress: number
}) {
  const { t } = useTranslation()
  return (
    <span
      className="charge-progress"
      role="progressbar"
      aria-label={t('chargePower')}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(chargeProgress * 100)}
      style={{ height: cssPercent(chargeProgress * 100) }}
    />
  )
}

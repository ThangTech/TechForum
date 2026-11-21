import { useState } from 'react'
import type { ReportTargetType } from '../types/reports'
import { useAuth } from '../../auth/hooks/authState'
import { openAuthDialog } from '../../auth/store/authDialogStore'
import { FlagIcon } from '../../../shared/components/ActionIcons'
import { IconActionButton } from '../../../shared/components/IconActionButton'
import { ReportDialog } from './ReportDialog'

interface ReportActionProps {
  targetId: string
  targetType: ReportTargetType
}

export const ReportAction = ({ targetId, targetType }: ReportActionProps) => {
  const { user } = useAuth()
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)

  const open = () => {
    if (user) {
      setIsReportDialogOpen(true)
      return
    }

    openAuthDialog()
  }

  return (
    <>
      <IconActionButton icon={<FlagIcon />} label="Báo cáo" onClick={open} variant="text" />
      <ReportDialog
        isOpen={isReportDialogOpen}
        onClose={() => setIsReportDialogOpen(false)}
        targetId={targetId}
        targetType={targetType}
      />
    </>
  )
}

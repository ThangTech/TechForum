import { useState } from 'react'
import type { ReportTargetType } from '../../api/reports'
import { useAuth } from '../../auth/authState'
import { openAuthDialog } from '../../auth/authDialogStore'
import { FlagIcon } from '../common/ActionIcons'
import { IconActionButton } from '../common/IconActionButton'
import { ReportDialog } from './ReportDialog'

interface ReportActionProps {
  targetId: number
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

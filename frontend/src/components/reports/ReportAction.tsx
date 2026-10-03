import { Button } from '@astryxdesign/core/Button'
import { useState } from 'react'
import type { ReportTargetType } from '../../api/reports'
import { useAuth } from '../../auth/authState'
import { AuthRequiredDialog } from '../AuthRequiredDialog'
import { ReportDialog } from './ReportDialog'

interface ReportActionProps {
  targetId: number
  targetType: ReportTargetType
}

export const ReportAction = ({ targetId, targetType }: ReportActionProps) => {
  const { user } = useAuth()
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)

  const open = () => {
    if (user) {
      setIsReportDialogOpen(true)
      return
    }

    setIsAuthDialogOpen(true)
  }

  return (
    <>
      <Button label="Báo cáo" onClick={open} variant="ghost" />
      <AuthRequiredDialog isOpen={isAuthDialogOpen} onClose={() => setIsAuthDialogOpen(false)} />
      <ReportDialog
        isOpen={isReportDialogOpen}
        onClose={() => setIsReportDialogOpen(false)}
        targetId={targetId}
        targetType={targetType}
      />
    </>
  )
}

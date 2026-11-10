import Box from '@mui/material/Box'
import ButtonBase from '@mui/material/ButtonBase'
import Tooltip from '@mui/material/Tooltip'
import { formatScore, type VoteDirection } from './voteLogic'

interface VoteControlProps {
  // What is voted for, for the labels read by screen readers ("bài viết", "câu trả lời").
  subject: string
  score: number
  // True for a new post or answer: the number is replaced by a dot, so people judge it on its own.
  scoreHidden?: boolean
  // The vote of the signed-in member: 1, -1 or 0.
  myVote: number
  onVote: (direction: VoteDirection) => void
  isBusy?: boolean
  // When set, the arrows are off and this is the reason in the tooltip (for example "your own post").
  disabledReason?: string
}

const Arrow = ({ direction }: { direction: VoteDirection }) => (
  <svg aria-hidden="true" fill="currentColor" height="14" viewBox="0 0 24 24" width="14">
    <path d={direction === 1 ? 'M12 5 3 17h18z' : 'M12 19 21 7H3z'} />
  </svg>
)

// ▲ score ▼: the vote of a member for a post or an answer. It is separate from the star "hữu ích" (a thank you),
// the votes decide the score and the reputation of the author. A pressed arrow is coloured; pressing it again takes the
// vote back.
export const VoteControl = ({ subject, score, scoreHidden = false, myVote, onVote, isBusy = false, disabledReason }: VoteControlProps) => {
  const isDisabled = isBusy || Boolean(disabledReason)

  const arrow = (direction: VoteDirection) => {
    const isOn = myVote === direction
    const label = direction === 1
      ? (isOn ? `Bỏ bình chọn tốt cho ${subject}` : `Bình chọn tốt cho ${subject}`)
      : (isOn ? `Bỏ bình chọn chưa tốt cho ${subject}` : `Bình chọn chưa tốt cho ${subject}`)
    const onColor = direction === 1 ? 'success.main' : 'error.main'
    // A downvote costs the voter 1 reputation point and needs an older account or more reputation: the member is told
    // before pressing (the points come back when the vote is taken back).
    const hint = direction === -1 && !isOn
      ? `${label}. Tốn 1 điểm danh tiếng của bạn (hoàn lại khi bỏ phiếu). Cần tài khoản từ 7 ngày hoặc có từ 50 điểm danh tiếng.`
      : label

    return (
      <Tooltip arrow title={disabledReason ?? hint}>
        <span style={{ display: 'inline-flex' }}>
          <ButtonBase
            aria-label={label}
            aria-pressed={isOn}
            disabled={isDisabled}
            onClick={() => onVote(direction)}
            sx={{
              width: 30,
              height: 30,
              borderRadius: '6px',
              color: isOn ? onColor : 'text.secondary',
              bgcolor: isOn ? 'var(--color-subtle)' : 'transparent',
              '&:hover:not(:disabled)': { bgcolor: 'var(--color-hover)', color: onColor },
              '&:disabled': { opacity: 0.45, cursor: 'default' },
            }}
          >
            <Arrow direction={direction} />
          </ButtonBase>
        </span>
      </Tooltip>
    )
  }

  return (
    <Box
      aria-label={`Bình chọn cho ${subject}`}
      role="group"
      sx={{ display: 'inline-flex', alignItems: 'center', border: 1, borderColor: 'divider', borderRadius: '8px', px: 0.25 }}
    >
      {arrow(1)}
      <Box
        aria-live="polite"
        component="span"
        sx={{ minWidth: 34, textAlign: 'center', fontSize: '0.875rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: myVote === 1 ? 'success.main' : myVote === -1 ? 'error.main' : 'text.primary' }}
        title={scoreHidden ? 'Điểm được ẩn trong 2 giờ đầu sau khi đăng để mọi người đánh giá khách quan' : `Điểm: ${score}`}
      >
        {scoreHidden ? '•' : formatScore(score)}
      </Box>
      {arrow(-1)}
    </Box>
  )
}

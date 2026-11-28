import { CommentActionIcon, FlagIcon, ShareIcon } from '../../../shared/components/ActionIcons'
import { ReportAction } from '../../reports/components/ReportAction'
import { useTopicShare } from '../hooks/useTopicShare'
import { BookmarkButton } from './BookmarkButton'
import { RailButton } from './RailButton'
import { TopicVoteButtons } from './TopicVoteButtons'
import '../styles/topicActionRail.css'

interface TopicActionRailProps {
  topicId: string
  title: string
  authorId: string
  // Số câu trả lời và phản hồi; null khi phần thảo luận chưa tải xong.
  answerCount: number | null
  // id của phần thảo luận, để nút trả lời cuộn tới đó.
  discussionId: string
}

// Thanh hành động của bài: dọc và dính bên trái bài trên màn hình rộng, ngang và dính đáy màn hình trên điện thoại,
// nên đọc tới đâu cũng bình chọn, lưu hay chia sẻ được ngay.
export const TopicActionRail = ({ topicId, title, authorId, answerCount, discussionId }: TopicActionRailProps) => {
  const { shareCount, isSharing, share } = useTopicShare(topicId, title)

  const goToDiscussion = () => {
    document.getElementById(discussionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <aside aria-label="Tương tác với bài" className="topic-rail">
      <div className="topic-rail__inner">
        <TopicVoteButtons authorId={authorId} topicId={topicId} />
        <span aria-hidden="true" className="topic-rail__divider" />
        <RailButton count={answerCount ?? undefined} icon={<CommentActionIcon size={20} />} label="Đến phần thảo luận" onClick={goToDiscussion} />
        <BookmarkButton topicId={topicId} />
        <RailButton count={shareCount} icon={<ShareIcon size={20} />} label="Chia sẻ" loading={isSharing} onClick={() => void share()} />
        <ReportAction
          targetId={topicId}
          targetType="topic"
          trigger={(open) => <RailButton icon={<FlagIcon size={20} />} label="Báo cáo bài viết" onClick={open} />}
        />
      </div>
    </aside>
  )
}

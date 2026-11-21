import { useState, type FormEvent } from 'react'
import { useActionFeedback } from '../../../shared/hooks/useActionFeedback'
import { getErrorMessage } from '../../../shared/query/errorMessage'
import { isInitialLoading } from '../../../shared/query/status'
import type { BannedWord } from '../types/adminBannedWords'
import { useAddBannedWord, useAdminBannedWords, useRemoveBannedWord } from './bannedWordQueries'

// Everything the admin page of banned words does: the list with its search box, adding a word, and removing one
// after a confirmation.
export const useAdminBannedWordsPage = () => {
  const wordsQuery = useAdminBannedWords()
  const addMutation = useAddBannedWord()
  const removeMutation = useRemoveBannedWord()
  const feedback = useActionFeedback()
  const [newWord, setNewWord] = useState('')
  const [keyword, setKeyword] = useState('')
  const [wordToRemove, setWordToRemove] = useState<BannedWord | null>(null)

  const words = wordsQuery.data ?? []
  const shown = words.filter((item) => item.word.includes(keyword.trim().toLocaleLowerCase('vi')))

  const add = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (addMutation.isPending) return
    const word = newWord.trim()
    if (!word) {
      feedback.clear()
      feedback.setError('Vui lòng nhập từ cần cấm.')
      return
    }
    const added = await feedback.run(() => addMutation.mutateAsync(word), {
      success: (saved) => `Đã thêm "${saved.word}". Các bài viết và câu trả lời mới sẽ bị thay từ này bằng ***.`,
      failure: 'Không thể thêm từ cấm.',
    })
    if (added) setNewWord('')
  }

  const askRemove = (word: BannedWord) => {
    feedback.setError(null)
    setWordToRemove(word)
  }

  const confirmRemove = async () => {
    if (!wordToRemove || removeMutation.isPending) return
    await feedback.run(() => removeMutation.mutateAsync(wordToRemove.id), {
      success: `Đã xóa "${wordToRemove.word}" khỏi danh sách.`,
      failure: 'Không thể xóa từ cấm.',
    })
    setWordToRemove(null)
  }

  return {
    words,
    shown,
    keyword,
    setKeyword,
    isLoading: isInitialLoading(wordsQuery),
    error: getErrorMessage(wordsQuery.error, 'Không thể tải danh sách từ cấm.'),
    retry: () => void wordsQuery.refetch(),
    // While the confirmation is open, the error is not shown above the list.
    feedback: { error: wordToRemove ? null : feedback.error, success: feedback.success },
    adding: { word: newWord, setWord: setNewWord, isBusy: addMutation.isPending, submit: add },
    removal: {
      word: wordToRemove,
      isBusy: removeMutation.isPending,
      ask: askRemove,
      cancel: () => setWordToRemove(null),
      confirm: confirmRemove,
    },
  }
}

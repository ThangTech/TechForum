import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import type { AdminBanner, SaveBannerInput } from '../../api/adminBanners'
import { toMediaUrl } from '../../api/media'
import { DialogFrame } from '../feedback/DialogFrame'
import { useDiscardGuard } from '../feedback/useDiscardGuard'
import { bannerLinkRuleMessage, isValidBannerLink } from './bannerLink'
import { fromLocalInputValue, toLocalInputValue } from './bannerStatus'

interface BannerFormDialogProps {
  banner: AdminBanner | null
  isBusy: boolean
  onClose: () => void
  // Uploads a picture and gives back its address.
  onUploadImage: (file: File) => Promise<string>
  onSubmit: (input: SaveBannerInput) => void
  requestError: string | null
}

const maxImageBytes = 5 * 1024 * 1024
const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']

export const BannerFormDialog = ({
  banner,
  isBusy,
  onClose,
  onUploadImage,
  onSubmit,
  requestError,
}: BannerFormDialogProps) => {
  const [title, setTitle] = useState(banner?.title ?? '')
  const [linkUrl, setLinkUrl] = useState(banner?.linkUrl ?? '')
  const [displayOrder, setDisplayOrder] = useState(String(banner?.displayOrder ?? 0))
  const [startsAt, setStartsAt] = useState(toLocalInputValue(banner?.startsAtUtc ?? null))
  const [endsAt, setEndsAt] = useState(toLocalInputValue(banner?.endsAtUtc ?? null))
  // The picture that is already saved, or one that was uploaded in this dialog but not saved yet.
  const [imageUrl, setImageUrl] = useState(banner?.imageUrl ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const busy = isBusy || isUploading

  // The preview of a chosen file uses a temporary address that must be released.
  const filePreview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => () => {
    if (filePreview) URL.revokeObjectURL(filePreview)
  }, [filePreview])

  // Anything that differs from what the banner had when the dialog opened (or from an empty form).
  const isDirty = title !== (banner?.title ?? '') || linkUrl !== (banner?.linkUrl ?? '') ||
    displayOrder !== String(banner?.displayOrder ?? 0) ||
    startsAt !== toLocalInputValue(banner?.startsAtUtc ?? null) || endsAt !== toLocalInputValue(banner?.endsAtUtc ?? null) ||
    file !== null || imageUrl !== (banner?.imageUrl ?? '')
  const close = () => {
    if (!busy) onClose()
  }
  const { requestClose, discardDialog } = useDiscardGuard(isDirty, close)
  const closeIfIdle = () => {
    if (!busy) requestClose()
  }
  const isLinkInvalid = !isValidBannerLink(linkUrl)

  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const chosen = event.target.files?.[0]
    event.target.value = ''
    if (!chosen) return
    if (!allowedTypes.includes(chosen.type)) {
      setValidationError('Ảnh banner chỉ hỗ trợ PNG, JPEG hoặc WebP.')
      return
    }
    if (chosen.size > maxImageBytes) {
      setValidationError('Ảnh banner tối đa 5 MB.')
      return
    }
    setValidationError(null)
    setFile(chosen)
  }

  const submit = async () => {
    const order = Number(displayOrder)
    if (!title.trim()) {
      setValidationError('Vui lòng nhập tiêu đề banner.')
      return
    }
    if (!file && !imageUrl) {
      setValidationError('Vui lòng chọn ảnh banner.')
      return
    }
    if (isLinkInvalid) {
      setValidationError(`Liên kết không hợp lệ. ${bannerLinkRuleMessage}`)
      return
    }
    if (!Number.isInteger(order) || order < 0 || order > 10_000) {
      setValidationError('Thứ tự hiển thị phải là số nguyên từ 0 đến 10.000.')
      return
    }
    if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
      setValidationError('Thời điểm kết thúc phải sau thời điểm bắt đầu.')
      return
    }

    setValidationError(null)
    let finalImageUrl = imageUrl
    if (file) {
      setIsUploading(true)
      try {
        finalImageUrl = await onUploadImage(file)
        // A failed save below must not upload the same file again.
        setImageUrl(finalImageUrl)
        setFile(null)
      } catch (uploadError) {
        setValidationError(uploadError instanceof Error ? uploadError.message : 'Không thể tải ảnh banner.')
        return
      } finally {
        setIsUploading(false)
      }
    }

    onSubmit({
      title: title.trim(),
      imageUrl: finalImageUrl,
      linkUrl: linkUrl.trim() || null,
      displayOrder: order,
      startsAtUtc: fromLocalInputValue(startsAt),
      endsAtUtc: fromLocalInputValue(endsAt),
    })
  }

  const previewSrc = filePreview ?? (imageUrl ? toMediaUrl(imageUrl) : null)

  return (
    <>
    <DialogFrame
      actions={
        <>
          <Button disabled={busy} onClick={closeIfIdle} variant="outlined">Hủy</Button>
          <Button disabled={busy} loading={busy} onClick={() => void submit()} variant="contained">
            {busy ? 'Đang lưu…' : 'Lưu banner'}
          </Button>
        </>
      }
      error={validationError || requestError}
      onClose={closeIfIdle}
      title={banner ? 'Sửa banner' : 'Thêm banner'}
      width={560}
    >
      <Stack spacing={2}>
        <Box>
          {/* Same 3:1 frame as the slider on the home page, so the admin sees how the picture will be cut. */}
          <Box
            sx={{
              position: 'relative',
              display: 'grid',
              placeItems: 'center',
              aspectRatio: '3 / 1',
              overflow: 'hidden',
              border: 1,
              borderStyle: previewSrc ? 'solid' : 'dashed',
              borderColor: 'divider',
              borderRadius: '6px',
              bgcolor: 'var(--color-subtle)',
              color: 'text.secondary',
            }}
          >
            {previewSrc
              ? <Box alt="Ảnh banner" component="img" src={previewSrc} sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              : <Typography variant="body2">Chưa có ảnh</Typography>}
          </Box>
          <Stack direction="row" sx={{ mt: 1, alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Button component="label" disabled={busy} variant="outlined">
              {previewSrc ? 'Đổi ảnh' : 'Chọn ảnh'}
              <Box accept="image/png,image/jpeg,image/webp" className="sr-only" component="input" disabled={busy} onChange={chooseFile} type="file" />
            </Button>
            <Typography color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              PNG, JPEG hoặc WebP, tối đa 5 MB. Nên dùng ảnh ngang tỉ lệ khoảng 3:1 (ví dụ 1200 × 400).
            </Typography>
          </Stack>
        </Box>
        <TextField disabled={busy} id="banner-title" label="Tiêu đề" placeholder="Ví dụ: Khóa học React miễn phí tháng 12" onChange={(event) => setTitle(event.target.value)} slotProps={{ htmlInput: { maxLength: 120 } }} value={title} />
        <TextField
          disabled={busy}
          error={isLinkInvalid}
          helperText={isLinkInvalid ? bannerLinkRuleMessage : 'Để trống nếu không cần liên kết. Ví dụ: /articles (một trang trong site) hoặc https://example.com.'}
          id="banner-link"
          label="Liên kết khi bấm vào banner"
          onChange={(event) => setLinkUrl(event.target.value)}
          placeholder="Ví dụ: /articles"
          slotProps={{ htmlInput: { maxLength: 500 } }}
          value={linkUrl}
        />
        <TextField
          disabled={busy}
          helperText="Số nhỏ hiện trước, ví dụ 1, 2, 3."
          id="banner-order"
          label="Thứ tự hiển thị"
          onChange={(event) => setDisplayOrder(event.target.value)}
          slotProps={{ htmlInput: { max: 10000, min: 0 } }}
          type="number"
          value={displayOrder}
        />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField disabled={busy} id="banner-starts" label="Bắt đầu hiển thị" onChange={(event) => setStartsAt(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} type="datetime-local" value={startsAt} />
          <TextField disabled={busy} id="banner-ends" label="Ngừng hiển thị" onChange={(event) => setEndsAt(event.target.value)} slotProps={{ inputLabel: { shrink: true } }} type="datetime-local" value={endsAt} />
        </Stack>
        <Typography color="text.secondary" sx={{ fontSize: '0.75rem' }}>
          Để trống hai ô thời gian nếu banner luôn hiển thị (khi đang bật).
        </Typography>
      </Stack>
    </DialogFrame>
    {discardDialog}
    </>
  )
}

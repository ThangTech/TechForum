export interface UploadedMedia {
  id: string
  link: string
  // The address that is stored in the content: https://res.cloudinary.com/... for a file on Cloudinary, or
  // /media/... for a file that was stored on the server before.
  path: string
}

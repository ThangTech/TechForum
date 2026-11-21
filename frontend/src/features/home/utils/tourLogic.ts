// The guide of the home page (HomeTour) starts by itself the first time somebody visits, and again whenever it is asked
// for with "?tour=1" in the address (the link "Hướng dẫn sử dụng" in the footer).

const storagePrefix = 'techforum.home-tour.completed'

// Where the browser remembers that the guide was seen: one entry for each account, and one for guests.
export const getTourStorageKey = (userId: string | null): string => `${storagePrefix}.${userId ?? 'guest'}`

export interface TourState {
  // "?tour=1" is in the address: the visitor asked for the guide.
  isRequested: boolean
  // The guide is on screen right now.
  isRunning: boolean
  // The visitor already finished or closed the guide before (remembered by the browser).
  wasSeen: boolean
}

// A guide that is on screen is never started twice. A visitor who asks for it always gets it; nobody else sees it twice.
export const shouldStartTour = ({ isRequested, isRunning, wasSeen }: TourState): boolean =>
  !isRunning && (isRequested || !wasSeen)

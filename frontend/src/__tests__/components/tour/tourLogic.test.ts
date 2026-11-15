import { describe, expect, it } from 'vitest'
import { getTourStorageKey, shouldStartTour } from '../../../components/tour/tourLogic'

describe('shouldStartTour', () => {
  it('starts by itself only for a visitor who has not seen the guide', () => {
    expect(shouldStartTour({ isRequested: false, isRunning: false, wasSeen: false })).toBe(true)
    expect(shouldStartTour({ isRequested: false, isRunning: false, wasSeen: true })).toBe(false)
  })

  it('always starts when the visitor asks for it, also after it was seen', () => {
    expect(shouldStartTour({ isRequested: true, isRunning: false, wasSeen: true })).toBe(true)
  })

  it('never starts a second guide while one is on screen', () => {
    expect(shouldStartTour({ isRequested: true, isRunning: true, wasSeen: false })).toBe(false)
    expect(shouldStartTour({ isRequested: false, isRunning: true, wasSeen: false })).toBe(false)
  })
})

describe('getTourStorageKey', () => {
  it('remembers the guide for each account and for guests apart', () => {
    expect(getTourStorageKey(null)).toBe('techforum.home-tour.completed.guest')
    expect(getTourStorageKey('abc')).toBe('techforum.home-tour.completed.abc')
    expect(getTourStorageKey('abc')).not.toBe(getTourStorageKey('def'))
  })
})

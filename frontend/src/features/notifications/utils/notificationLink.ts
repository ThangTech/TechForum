// Only links of the site that a notification is known to carry are followed; anything else opens the home page.
// This keeps a bad or old link in the database from sending the member to a strange place.
export const safeNotificationLink = (value: string) =>
  /^\/topics\/[0-9a-f-]{36}(?:#answer-[0-9a-f-]{36})?$/i.test(value) || value === '/reports' || value === '/notifications'
    ? value
    : '/'

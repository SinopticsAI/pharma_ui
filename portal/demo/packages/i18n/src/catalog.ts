import { en, ru, zh } from './messages'
import { enWalk, ruWalk, zhWalk } from './walkthrough'

export const catalogs = {
  ru: { ...ru, ...ruWalk },
  en: { ...en, ...enWalk },
  zh: { ...zh, ...zhWalk },
}

export type MessageKey = keyof typeof catalogs.ru

export const DEMO_ORG_MINGHU = 'demo-minghu'
export const DEMO_ORG_RUIKANG = 'demo-ruikang'
export const DEMO_PRODUCT_MH200 = 'demo-mh-200'
export const DEMO_PRODUCT_RK30 = 'demo-rk-30'
export const DEMO_CASE_RU0417 = 'demo-ru-0417'
export const DEMO_CONTRACTOR_TESTLAB = 'demo-testlab'
export const DEMO_PREFIX = 'demo-'

export function isDemoId(id: string | undefined | null): boolean {
  return Boolean(id?.startsWith(DEMO_PREFIX))
}

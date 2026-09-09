import { OFFLINE_DEMO } from '@demo/api-client'
import type { L10n, Organization, Product, RegistrationCase } from '@demo/domain'
import { draftValue } from '@demo/domain'
import {
  type CompanyCardView,
  companyCards,
  type ProductCardView,
  productCards,
  saleProgressPercent,
} from './demo/catalog'
import type { DemoUiState } from './demo/state'
import { useAllProducts, useCases, useOrganizations } from './queries'

const zh = (zhText: string, en: string, ru: string): L10n => ({ zh: zhText, en, ru })

function asL10n(value: Partial<L10n> | undefined, fallback: string): L10n {
  const ru = value?.ru || value?.en || value?.zh || fallback
  return { zh: value?.zh || ru, en: value?.en || ru, ru }
}

export function liveCompanyCard(organization: Organization, products: Product[]): CompanyCardView {
  const mine = products.filter((item) => item.organizationId === organization.id)
  const uscc =
    draftValue(organization.profile, 'registrationNumber') ||
    draftValue(organization.draft, 'registrationNumber') ||
    '—'
  const approved = organization.status === 'profile_approved'
  const docs = organization.completeness?.sections.find((section) => section.key === 'documents')
  const openProduct = mine.find((item) => !item.caseId)
  return {
    organization,
    uscc,
    verified: approved,
    riskLevel: approved ? 'low' : 'medium',
    riskExplain: approved
      ? zh('低风险 — 可以合作。', 'Low risk — we take this company on.', 'Низкий риск — берём в работу.')
      : zh(
          '档案未完成，风险核查将在必填项齐套后自动启动。',
          'Profile incomplete; the risk check starts when required slots are closed.',
          'Профиль не закрыт, проверка рисков запустится автоматически.',
        ),
    docsDone: docs?.filled ?? organization.completeness?.filled ?? 0,
    docsTotal: docs?.total ?? organization.completeness?.total ?? 0,
    apostilleDone: 0,
    apostilleTotal: 0,
    productCount: mine.length,
    nextStep: !approved
      ? zh('继续对话，补全档案', 'Continue the dialog to complete the profile', 'Продолжить диалог и закрыть профиль')
      : openProduct
        ? zh('继续产品对话', 'Continue the product dialog', 'Продолжить диалог по продукту')
        : zh('打开公司档案', 'Open the company profile', 'Открыть профиль компании'),
  }
}

export function liveProductCard(
  product: Product,
  organization: Organization | undefined,
  cases: RegistrationCase[],
): ProductCardView {
  const card = cases.find((item) => item.id === product.caseId || item.productId === product.id)
  const progress = Number.isFinite(product.completeness) ? product.completeness : 0
  return {
    product,
    companyName: asL10n(organization?.name, organization?.id || product.organizationId),
    classLabel: card
      ? zh(
          `${card.riskClass} · ${card.track}`,
          `${card.riskClass} · ${card.track}`,
          `${card.riskClass} · ${card.track}`,
        )
      : zh('分类待确认', 'Classification pending', 'Классификация не подтверждена'),
    nodeLabel: card
      ? zh(card.currentStage, card.currentStage, card.currentStage)
      : zh('分类', 'Classification', 'Классификация'),
    progress,
    nextAction: card
      ? asL10n(card.waitingFor, card.code)
      : zh('继续产品对话', 'Continue the product dialog', 'Продолжить диалог по продукту'),
    owner: zh('您', 'You', 'Вы'),
    deadline: card
      ? zh(`${card.dueWorkingDays} 工作日`, `${card.dueWorkingDays} working days`, `${card.dueWorkingDays} раб. дн.`)
      : zh('—', '—', '—'),
    caseStatus: card
      ? zh(`办理中 · #${card.code}`, `In progress · #${card.code}`, `В работе · #${card.code}`)
      : zh('尚未建案', 'No case yet', 'Кейс не создан'),
    events: [],
  }
}

export function liveSaleProgress(products: Product[]): number {
  if (products.length === 0) return 0
  const sum = products.reduce((total, item) => total + (Number.isFinite(item.completeness) ? item.completeness : 0), 0)
  return Math.round(sum / products.length)
}

export function usePortfolioCards(state: DemoUiState) {
  const organizations = useOrganizations()
  const companies = organizations.data ?? []
  const productsQuery = useAllProducts(companies.map((item) => item.id))
  const cases = useCases()
  const products = productsQuery.data ?? []

  if (OFFLINE_DEMO) {
    return {
      organizations,
      productsQuery,
      cases,
      companies: companyCards(state),
      products: productCards(state),
      saleProgress: saleProgressPercent(),
      pendingLive: 0,
    }
  }

  return {
    organizations,
    productsQuery,
    cases,
    companies: companies.map((item) => liveCompanyCard(item, products)),
    products: products.map((item) =>
      liveProductCard(
        item,
        companies.find((company) => company.id === item.organizationId),
        cases.data ?? [],
      ),
    ),
    saleProgress: liveSaleProgress(products),
    pendingLive: products.filter((item) => !item.caseId).length,
  }
}

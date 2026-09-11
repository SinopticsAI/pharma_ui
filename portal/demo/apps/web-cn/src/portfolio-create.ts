import type { Organization } from '@demo/domain'
import { useI18n } from '@demo/i18n'
import { useNavigate } from '@tanstack/react-router'
import { isDemoId } from './demo/ids'
import { useCreateOrganization, useCreateProduct, useOpenIntakeSession } from './queries'

export function eligibleOrganizations(organizations: Organization[]): Organization[] {
  return organizations.filter((item) => item.status === 'profile_approved' && !isDemoId(item.id))
}

export function usePortfolioCreate() {
  const navigate = useNavigate()
  const { locale } = useI18n()
  const createOrganization = useCreateOrganization()
  const createProduct = useCreateProduct()
  const openSession = useOpenIntakeSession()
  const busy = createOrganization.isPending || createProduct.isPending || openSession.isPending
  const failure = createOrganization.error ?? createProduct.error ?? openSession.error

  const startCompany = async () => {
    const organization = await createOrganization.mutateAsync({})
    const session = await openSession.mutateAsync({
      scope: 'organization',
      organizationId: organization.id,
      locale,
    })
    void navigate({
      to: '/intake/company/$organizationId',
      params: { organizationId: organization.id },
      search: { session: session.id },
    })
  }

  const startProduct = async (organization: Organization) => {
    const product = await createProduct.mutateAsync({ organizationId: organization.id })
    const session = await openSession.mutateAsync({ scope: 'product', productId: product.id, locale })
    void navigate({
      to: '/intake/product/$productId',
      params: { productId: product.id },
      search: { session: session.id },
    })
  }

  return { busy, failure, startCompany, startProduct }
}

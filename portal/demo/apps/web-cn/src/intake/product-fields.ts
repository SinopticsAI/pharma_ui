import type { MessageKey } from '@demo/i18n'

/** Подписи полей продукта: те же ключи, что в карточке реквизитов и гейте классификации. */
export const PRODUCT_FIELD_LABEL: Record<string, MessageKey> = {
  name: 'productField.name',
  models: 'productField.models',
  intendedUse: 'productField.intendedUse',
  manufacturer: 'productField.manufacturer',
  sites: 'productField.sites',
  composition: 'productField.composition',
  measuring: 'productField.measuring',
  software: 'productField.software',
  sterile: 'productField.sterile',
  nmpaNumber: 'productField.nmpaNumber',
}

export function productFieldKey(field: string): MessageKey | undefined {
  return PRODUCT_FIELD_LABEL[field]
}

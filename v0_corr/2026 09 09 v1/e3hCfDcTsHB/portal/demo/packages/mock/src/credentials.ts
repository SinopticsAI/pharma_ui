import type { MandateCredential } from '@demo/domain'

/**
 * ЕСИА, УКЭП и МЧД принадлежат российской компании. Модуль импортируется только
 * функцией getMandateFull, поэтому в сборку кабинета производителя не попадает:
 * это проверяется скриптом проверки демо перед показом.
 */
export const OPERATOR_CREDENTIALS: MandateCredential[] = [
  {
    kind: 'esia',
    holder: 'ООО «Синоптикс РУ»',
    validUntil: '2027-06-30',
    note: 'Учётная запись юридического лица',
  },
  {
    kind: 'ukep',
    holder: 'Е. Смирнова, офицер УПП',
    validUntil: '2027-03-14',
    note: 'Квалифицированный сертификат',
  },
  {
    kind: 'mchd',
    holder: 'Е. Смирнова, офицер УПП',
    validUntil: '2027-01-31',
    note: 'Машиночитаемая доверенность',
  },
]

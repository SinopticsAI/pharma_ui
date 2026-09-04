import type {
  Account,
  CaseDetail,
  CaseItem,
  ClassificationVariant,
  Completeness,
  DraftField,
  DraftFields,
  FieldMask,
  Identity,
  IntakeMessage,
  IntakeSession,
  NodeMapItem,
  Organization,
  OrganizationItem,
  OrganizationSlot,
  Product,
  ProgressSection,
  RegistrationCase,
  RegistrySearch,
  RiskReport,
  StatusEntry,
  UploadTicket,
} from '@demo/domain'
import { z } from 'zod'

/** Поиск сессии интейка в адресе: ядро не ищет диалог по компании. */
export const sessionSearchSchema = z.object({
  session: z.string().optional(),
})

export const localeSchema = z.enum(['zh', 'en', 'ru'])

export const l10nPartialSchema = z
  .object({
    ru: z.string().optional(),
    en: z.string().optional(),
    zh: z.string().optional(),
  })
  .passthrough()

export const draftFieldSchema: z.ZodType<DraftField> = z.object({
  value: z.string(),
  source: z.string().optional(),
  confidence: z.number().nullable().optional(),
})

export const draftFieldsSchema: z.ZodType<DraftFields> = z.record(
  z.string(),
  z.union([draftFieldSchema, z.string()]).optional(),
)

export const accountSchema: z.ZodType<Account> = z
  .object({
    id: z.string(),
    name: l10nPartialSchema,
    status: z.string(),
  })
  .passthrough()

export const identitySchema: z.ZodType<Identity> = z
  .object({
    accountId: z.string(),
    subject: z.string(),
    role: z.enum(['client', 'specialist', 'operator', 'admin']),
    displayName: z.string(),
    account: accountSchema,
    can: z.object({
      approveAsSpecialist: z.boolean(),
      operate: z.boolean(),
    }),
  })
  .passthrough()

export const fieldMaskSchema: z.ZodType<FieldMask> = z
  .object({
    mandateCredentials: z.boolean(),
    ledgerPay: z.boolean(),
    statusWrite: z.boolean(),
    audit: z.boolean(),
    chat: z.boolean(),
    roadmap: z.boolean(),
  })
  .passthrough()

export const progressSectionSchema: z.ZodType<ProgressSection> = z.object({
  key: z.enum(['identity', 'documents', 'authority', 'banking', 'risk']),
  filled: z.number(),
  total: z.number(),
})

export const completenessSchema: z.ZodType<Completeness> = z.object({
  filled: z.number(),
  total: z.number(),
  percent: z.number(),
  ready: z.boolean(),
  sections: z.array(progressSectionSchema),
})

export const organizationSlotSchema: z.ZodType<OrganizationSlot> = z
  .object({
    key: z.string(),
    section: z.enum(['identity', 'documents', 'authority', 'banking', 'risk']),
    title: l10nPartialSchema,
    requirement: l10nPartialSchema.nullish(),
    needsNotary: z.boolean(),
    needsApostille: z.boolean(),
    needsTranslation: z.boolean(),
    optional: z.boolean(),
    status: z.enum(['pending', 'in_progress', 'filled', 'not_required']),
    documentId: z.string(),
  })
  .passthrough()

export const organizationSchema: z.ZodType<Organization> = z
  .object({
    id: z.string(),
    accountId: z.string(),
    kind: z.string(),
    name: l10nPartialSchema,
    status: z.enum(['collecting', 'draft', 'profile_approved']),
    draft: draftFieldsSchema,
    profile: draftFieldsSchema,
    createdAt: z.string(),
    updatedAt: z.string(),
    slots: z.array(organizationSlotSchema).optional(),
    completeness: completenessSchema.optional(),
  })
  .passthrough()

export const organizationListSchema: z.ZodType<Organization[]> = z.array(organizationSchema)

export const itemStatusSchema = z.enum(['pending_upload', 'uploaded', 'confirmed', 'parsed', 'rejected'])

export const organizationItemSchema: z.ZodType<OrganizationItem> = z
  .object({
    id: z.string(),
    organizationId: z.string(),
    productId: z.string(),
    level: z.enum(['company', 'product']),
    itemType: z.string(),
    title: l10nPartialSchema,
    fileName: z.string(),
    objectKey: z.string(),
    status: itemStatusSchema,
    parcedData: z.record(z.string(), z.unknown()).nullish(),
    version: z.number(),
    promotedFrom: z.string(),
    promotedAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough()

export const organizationItemListSchema: z.ZodType<OrganizationItem[]> = z.array(organizationItemSchema)

export const classificationVariantSchema: z.ZodType<ClassificationVariant> = z
  .object({
    id: z.string(),
    productId: z.string(),
    variantType: z.enum(['recommended', 'alternative', 'forbidden']),
    kind: z.enum(['device', 'drug']),
    track: z.enum(['pp1684', 'eaeu46', 'eaeu78']),
    riskClass: z.enum(['1', '2a', '2b', '3']),
    title: l10nPartialSchema,
    summary: l10nPartialSchema,
    pros: z.array(l10nPartialSchema),
    cons: z.array(l10nPartialSchema),
    reason: l10nPartialSchema.nullish(),
    budget: z.object({
      currency: z.string().optional(),
      baskets: z.array(z.object({ key: z.string(), amount: z.number() })).optional(),
    }),
    distribution: z.record(z.string(), z.unknown()),
    cycleMonths: z.tuple([z.number(), z.number()]),
    selected: z.boolean(),
  })
  .passthrough()

export const productSchema: z.ZodType<Product> = z
  .object({
    id: z.string(),
    accountId: z.string(),
    organizationId: z.string(),
    name: l10nPartialSchema,
    kind: z.union([z.enum(['device', 'drug']), z.literal('')]),
    status: z.enum(['collecting', 'draft', 'data_approved', 'variants_pending', 'variant_selected', 'ru_confirmed']),
    draft: draftFieldsSchema,
    completeness: z.number(),
    selectedVariantId: z.string(),
    specialistApprovedBy: z.string(),
    specialistApprovedAt: z.string(),
    clientApprovedBy: z.string(),
    clientApprovedAt: z.string(),
    caseId: z.string(),
    updatedAt: z.string(),
    documents: z.array(organizationItemSchema).optional(),
    missing: z.array(z.string()).optional(),
    variants: z.array(classificationVariantSchema).optional(),
  })
  .passthrough()

export const productListSchema: z.ZodType<Product[]> = z.array(productSchema)

export const variantListSchema: z.ZodType<ClassificationVariant[]> = z.array(classificationVariantSchema)

export const intakeSessionSchema: z.ZodType<IntakeSession> = z
  .object({
    id: z.string(),
    accountId: z.string(),
    scope: z.enum(['organization', 'product']),
    organizationId: z.string(),
    productId: z.string(),
    status: z.string(),
    locale: localeSchema,
    planeCaseId: z.string(),
  })
  .passthrough()

export const intakeMessageSchema: z.ZodType<IntakeMessage> = z
  .object({
    id: z.string(),
    sessionId: z.string(),
    role: z.enum(['user', 'agent', 'system']),
    text: l10nPartialSchema,
    itemId: z.string(),
    payload: z.record(z.string(), z.unknown()).nullish(),
    at: z.string(),
  })
  .passthrough()

export const intakeMessageListSchema: z.ZodType<IntakeMessage[]> = z.array(intakeMessageSchema)

export const registrationCaseSchema: z.ZodType<RegistrationCase> = z
  .object({
    id: z.string(),
    code: z.string(),
    product: l10nPartialSchema,
    manufacturer: l10nPartialSchema,
    kind: z.enum(['device', 'drug']),
    track: z.enum(['pp1684', 'eaeu46', 'eaeu78']),
    riskClass: z.enum(['1', '2a', '2b', '3']),
    currentStage: z.enum([
      'onboarding',
      'qualification',
      'case',
      'roadmap',
      'dossier',
      'samples',
      'filing',
      'expertise',
      'registry',
      'postreg',
    ]),
    nextActor: z.enum(['hq', 'ru', 'lab', 'gov']),
    waitingFor: l10nPartialSchema,
    dueWorkingDays: z.number(),
    startedOn: z.string(),
    cycleMonths: z.tuple([z.number(), z.number()]),
    mandateComplete: z.boolean(),
    modelsLocked: z.boolean(),
    accountId: z.string().optional(),
    organizationId: z.string().optional(),
    productId: z.string().optional(),
    intakeSessionId: z.string().optional(),
    trackConfirmed: z.boolean().optional(),
  })
  .passthrough() as z.ZodType<RegistrationCase>

export const registrationCaseListSchema: z.ZodType<RegistrationCase[]> = z.array(registrationCaseSchema)

export const nodeMapItemSchema: z.ZodType<NodeMapItem> = z
  .object({
    code: z.string(),
    position: z.number(),
    title: l10nPartialSchema,
    note: l10nPartialSchema.nullish(),
    status: z.enum(['done', 'in_progress', 'planned', 'later', 'goal']),
    owner: z.enum(['you', 'us', 'contractor', 'gov']),
    dueHint: l10nPartialSchema.nullish(),
    blockedBy: z.array(z.string()),
    critical: z.boolean(),
  })
  .passthrough()

export const mandateStepSchema = z
  .object({
    key: z.enum([
      'service-contract',
      'power-of-attorney',
      'apostille',
      'notarized-translation',
      'representative-registered',
    ]),
    status: z.enum(['done', 'in-progress', 'pending']),
    date: z.string().optional(),
    note: l10nPartialSchema.optional(),
  })
  .passthrough()

export const mandateSchema = z
  .object({
    caseId: z.string(),
    operator: z.string(),
    role: z.enum(['upp', 'mah-representative']),
    steps: z.array(mandateStepSchema),
    complete: z.boolean().optional(),
    credentials: z
      .array(
        z.object({
          kind: z.enum(['esia', 'ukep', 'mchd']),
          holder: z.string(),
          validUntil: z.string(),
          note: z.string(),
        }),
      )
      .optional(),
  })
  .passthrough()

export const caseDetailSchema: z.ZodType<CaseDetail> = z
  .object({
    case: registrationCaseSchema,
    fieldMask: fieldMaskSchema,
    nodeMap: z.array(nodeMapItemSchema),
    criticalNode: nodeMapItemSchema.nullable(),
    mandate: mandateSchema.optional(),
  })
  .passthrough() as z.ZodType<CaseDetail>

export const caseItemSchema: z.ZodType<CaseItem> = z
  .object({
    id: z.string(),
    caseId: z.string(),
    itemType: z.string(),
    title: l10nPartialSchema,
    fileName: z.string(),
    objectKey: z.string(),
    status: itemStatusSchema,
    parcedData: z.record(z.string(), z.unknown()).nullish(),
  })
  .passthrough()

export const caseItemListSchema: z.ZodType<CaseItem[]> = z.array(caseItemSchema)

export const statusEntrySchema: z.ZodType<StatusEntry> = z
  .object({
    id: z.string(),
    caseId: z.string(),
    stage: z.enum([
      'onboarding',
      'qualification',
      'case',
      'roadmap',
      'dossier',
      'samples',
      'filing',
      'expertise',
      'registry',
      'postreg',
    ]),
    text: l10nPartialSchema.and(z.object({ ru: z.string() })),
    artifact: z.string(),
    enteredBy: z.string(),
    enteredAt: z.string(),
  })
  .passthrough() as z.ZodType<StatusEntry>

export const statusEntryListSchema: z.ZodType<StatusEntry[]> = z.array(statusEntrySchema)

export const registrySearchSchema: z.ZodType<RegistrySearch> = z
  .object({
    hits: z.array(
      z.object({
        number: z.string().optional(),
        holder: z.string().optional(),
        title: z.string().optional(),
        url: z.string().optional(),
      }),
    ),
    source: z.enum(['elk', 'grls']),
    query: z.string(),
    cached: z.boolean(),
    truth: z.boolean(),
  })
  .passthrough()

export const uploadTicketSchema: z.ZodType<UploadTicket> = z
  .object({
    uploadUrl: z.string(),
    itemId: z.string(),
    objectKey: z.string(),
    expiresIn: z.number(),
  })
  .passthrough()

export const riskReportSchema: z.ZodType<RiskReport> = z
  .object({
    id: z.string(),
    organizationId: z.string(),
    level: z.enum(['low', 'medium', 'high', 'unknown']),
    verdict: z.enum(['pending', 'accepted', 'rejected']),
    reasoning: l10nPartialSchema,
    checks: z.array(
      z.object({
        key: z.string(),
        outcome: z.string(),
        note: l10nPartialSchema.optional(),
      }),
    ),
    checkedBy: z.string(),
    checkedAt: z.string(),
  })
  .passthrough()

export const riskReportOrNullSchema: z.ZodType<RiskReport | null> = riskReportSchema.nullable()

export const askDocumentFormSchema = z.object({
  answer: z.string().trim().min(1),
})

export const dossierUploadSchema = z.object({
  itemType: z.string().min(1),
  file: z.instanceof(File),
})

export type SessionSearch = z.infer<typeof sessionSearchSchema>
export type AskDocumentForm = z.infer<typeof askDocumentFormSchema>
export type DossierUpload = z.infer<typeof dossierUploadSchema>

import { l10n } from '@demo/domain'
import { useI18n } from '@demo/i18n'
import { Progress } from '@demo/ui/components/progress'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { mh200Facts } from '../demo/catalog'
import { useDemo } from '../demo/context'
import { DEMO_ORG_MINGHU, DEMO_ORG_RUIKANG, DEMO_PRODUCT_MH200 } from '../demo/ids'
import { ProgressPanel } from '../intake/ProgressPanel'
import { Benefit, Button, Callout, Card, ChatBubble, DemoMark, Empty, KeyValue, PageHeader, StatusBadge } from '../kit'
import { useOrganization, useProduct } from '../queries'
import { Shell } from '../Shell'

function DropZone({ label, onFile }: { label: string; onFile: (name: string) => void }) {
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground hover:border-primary">
      <span>{label}</span>
      <input
        type="file"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onFile(file.name)
        }}
      />
    </label>
  )
}

export function DemoCompanyIntake({ organizationId }: { organizationId: string }) {
  const { t, text, dateTime } = useI18n()
  const { state, patch } = useDemo()
  const organization = useOrganization(organizationId)
  const company = organization.data
  const [ocr, setOcr] = useState<'idle' | 'running' | 'done'>(
    organizationId === DEMO_ORG_MINGHU ? 'done' : state.ruikangLicense ? 'done' : 'idle',
  )
  const [lines, setLines] = useState<{ id: string; side: 'cn' | 'agent'; body: string; at: string }[]>(() => [
    {
      id: 'a1',
      side: 'agent',
      at: '2026-09-06T09:00:00',
      body:
        organizationId === DEMO_ORG_MINGHU
          ? '公司档案已齐套。风险核查已完成：低风险，可以合作。'
          : '请上传营业执照和 ISO 13485。我会读取登记信息，只问缺的问题。',
    },
  ])

  const runUpload = (kind: 'license' | 'iso' | 'charter', name: string) => {
    setOcr('running')
    setLines((current) => [...current, { id: `u-${name}`, side: 'cn', body: name, at: new Date().toISOString() }])
    window.setTimeout(() => {
      setOcr('done')
      if (kind === 'license') patch({ ruikangLicense: true })
      if (kind === 'iso') patch({ ruikangIso: true })
      if (kind === 'charter') patch({ ruikangCharter: true })
      setLines((current) => [
        ...current,
        {
          id: `r-${name}`,
          side: 'agent',
          body: t('intake.ocrDone'),
          at: new Date().toISOString(),
        },
      ])
    }, 600)
  }

  if (!company) return <Empty>{t('common.loading')}</Empty>
  const completeness = company.completeness

  return (
    <Shell>
      <PageHeader
        eyebrow={t('eyebrow.intake')}
        title={t('intake.company.title')}
        lead={`${text(l10n(company.name, organizationId)).value}. ${t('intake.company.leadNamed')}`}
      />
      <DemoMark>{t('intake.demoContinue')}</DemoMark>
      <div className="grid items-start gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          <div className="flex h-[min(72vh,720px)] flex-col rounded-lg border bg-card">
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {lines.map((line) => (
                <ChatBubble
                  key={line.id}
                  side={line.side === 'agent' ? 'agent' : 'cn'}
                  author={line.side === 'agent' ? t('chat.agent') : t('chat.cn')}
                  time={dateTime(line.at)}
                >
                  {line.body}
                </ChatBubble>
              ))}
            </div>
            <div className="space-y-2 border-t p-3">
              <p className="text-xs text-muted-foreground">{t('intake.dropHint')}</p>
              <DropZone label={t('intake.quickLicense')} onFile={(name) => runUpload('license', name)} />
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={() => runUpload('iso', 'iso-13485.pdf')}>
                  {t('intake.quickIso')}
                </Button>
                <Button type="button" variant="secondary" onClick={() => runUpload('charter', 'articles.pdf')}>
                  {t('itemType.company-registry')}
                </Button>
                <Button type="button" onClick={() => patch({ ruikangBankDone: true })}>
                  {t('intake.section.banking')}
                </Button>
              </div>
              <StatusBadge tone={ocr === 'done' ? 'ok' : ocr === 'running' ? 'warm' : 'quiet'}>
                {ocr === 'done'
                  ? t('intake.ocrDone')
                  : ocr === 'running'
                    ? t('intake.ocrRunning')
                    : t('intake.ocrIdle')}
              </StatusBadge>
            </div>
          </div>
        </div>
        <div className="max-h-[min(72vh,720px)] space-y-4 overflow-y-auto">
          <ProgressPanel
            title={t('intake.chat.progressTitle')}
            sections={completeness?.sections ?? []}
            missing={[]}
            percent={completeness?.percent ?? 0}
          />
          <Card title={t('intake.extracted')}>
            <KeyValue
              items={[
                { key: t('orgField.legalName'), value: '深圳明湖医疗科技有限公司 / 杭州瑞康…' },
                { key: t('orgField.registrationNumber'), value: '91440300MA5G7…' },
                {
                  key: t('orgField.legalRepresentative'),
                  value: organizationId === DEMO_ORG_RUIKANG ? '周宁' : '赵敏',
                },
              ]}
            />
            <StatusBadge tone="ok">{t('intake.registryMatch')}</StatusBadge>
          </Card>
          <Card title={t('intake.section.authority')}>
            <p className="text-sm text-muted-foreground">{t('intake.signVsPay')}</p>
            <KeyValue
              items={[
                { key: t('intake.signatory'), value: '赵敏' },
                { key: t('intake.payer'), value: '凌华' },
              ]}
            />
          </Card>
          <Card title={t('intake.remaining')}>
            <ul className="list-disc pl-4 text-sm">
              {organizationId === DEMO_ORG_RUIKANG && !state.ruikangCharter ? (
                <li>章程（用于委托书与海牙认证）</li>
              ) : null}
              {organizationId === DEMO_ORG_RUIKANG && !state.ruikangBankDone ? (
                <li>{t('intake.section.banking')}</li>
              ) : null}
              {organizationId === DEMO_ORG_MINGHU ? (
                <li>
                  <Link to="/companies/$organizationId" params={{ organizationId: DEMO_ORG_MINGHU }}>
                    {t('home.openRisk')} →
                  </Link>
                </li>
              ) : null}
            </ul>
          </Card>
        </div>
      </div>
      <Benefit label={t('benefit.label')}>{t('benefit.intake')}</Benefit>
    </Shell>
  )
}

export function DemoProductIntake({ productId }: { productId: string }) {
  const { t, text, dateTime } = useI18n()
  const { state, patch } = useDemo()
  const product = useProduct(productId)
  const card = product.data
  const [lines, setLines] = useState<{ id: string; side: 'cn' | 'agent'; body: string; at: string }[]>(() => [
    {
      id: 'p1',
      side: 'agent',
      at: '2026-09-04T10:00:00',
      body:
        productId === DEMO_PRODUCT_MH200
          ? '请用自己的话描述产品并上传已有的 NMPA、说明书和检测报告。我只问缺的三件事。'
          : '产品数据已齐。分类方案已准备，须专家与客户两道确认后才会生成地图。',
    },
  ])

  const answer = (key: 'electro' | 'accuracy' | 'market', body: string) => {
    setLines((current) => [...current, { id: `q-${key}`, side: 'cn', body, at: new Date().toISOString() }])
    if (key === 'electro') patch({ mh200Electro: true })
    if (key === 'accuracy') patch({ mh200Accuracy: true })
    if (key === 'market') patch({ mh200Market: 'ru' })
  }

  if (!card) return <Empty>{t('common.loading')}</Empty>

  return (
    <Shell>
      <PageHeader
        eyebrow={t('eyebrow.product')}
        title={t('intake.product.title')}
        lead={`${text(l10n(card.name, productId)).value}. ${t('intake.product.leadNamed')}`}
      />
      <DemoMark>{t('intake.demoContinue')}</DemoMark>
      <div className="grid items-start gap-4 lg:grid-cols-[1fr_340px]">
        <div className="flex h-[min(72vh,720px)] flex-col rounded-lg border bg-card">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {lines.map((line) => (
              <ChatBubble
                key={line.id}
                side={line.side === 'agent' ? 'agent' : 'cn'}
                author={line.side === 'agent' ? t('chat.agent') : t('chat.cn')}
                time={dateTime(line.at)}
              >
                {line.body}
              </ChatBubble>
            ))}
          </div>
          <div className="space-y-2 border-t p-3">
            <p className="text-xs font-medium">{t('product.openQuestions')}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={state.mh200Electro}
                onClick={() => answer('electro', '电安全协议 2025.pdf')}
              >
                1. 电安全试验协议
              </Button>
              <Button
                type="button"
                disabled={state.mh200Accuracy}
                onClick={() => answer('accuracy', '量程 1.1–33.3 mmol/L')}
              >
                2. 测量范围与准确度
              </Button>
              <Button type="button" disabled={state.mh200Market !== null} onClick={() => answer('market', '仅俄罗斯')}>
                3. 仅俄罗斯 / 欧亚经济联盟
              </Button>
            </div>
            <DropZone label={t('intake.chat.attach')} onFile={(name) => answer('electro', name)} />
          </div>
        </div>
        <div className="max-h-[min(72vh,720px)] space-y-4 overflow-y-auto">
          <Card title={t('product.completeness').replace('{percent}', String(card.completeness))}>
            <Progress value={card.completeness} />
          </Card>
          <Card title={t('product.mapping')}>
            <KeyValue
              items={[
                { key: t('product.fromCompany'), value: '3' },
                { key: t('product.ownDocs'), value: '5' },
                { key: t('product.missing'), value: String(card.missing?.length ?? 0) },
                { key: t('product.newInCompany'), value: '+1 ISO' },
              ]}
            />
          </Card>
          <Card title={t('product.facts')}>
            <ul className="space-y-2 text-sm">
              {mh200Facts().map((fact) => (
                <li key={text(fact.fact).value}>
                  {text(fact.fact).value}
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {t('product.source')} · {text(fact.source).value}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
          {card.missing && card.missing.length > 0 ? (
            <Callout tone="quiet">{card.missing.join(' · ')}</Callout>
          ) : (
            <Link to="/products/$productId/classify" params={{ productId }} className="text-sm underline">
              {t('home.openClassify')} →
            </Link>
          )}
        </div>
      </div>
      <Benefit label={t('benefit.label')}>{t('benefit.product')}</Benefit>
    </Shell>
  )
}

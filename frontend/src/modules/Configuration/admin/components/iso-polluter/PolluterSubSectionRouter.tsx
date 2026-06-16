'use client'

import type { useConfigTranslations } from '@/modules/Configuration/admin/hooks/useConfigTranslations'

import PolluterContactsCrud from './PolluterContactsCrud'
import PolluterDocumentsCrud from './PolluterDocumentsCrud'
import PolluterLayerForm from './PolluterLayerForm'
import PolluterModelSelector from './PolluterModelSelector'
import PolluterModelsCrud from './PolluterModelsCrud'
import PolluterPricingCrud from './PolluterPricingCrud'
import PolluterPricingVariantCrud from './PolluterPricingVariantCrud'
import PolluterProductForm from './PolluterProductForm'
import PolluterPropertyForm from './PolluterPropertyForm'
import PolluterRecipientForm from './PolluterRecipientForm'
import PolluterSubSectionStub from './PolluterSubSectionStub'
import type { PolluterItem, SubSectionKey } from './types'

type ConfigTranslations = ReturnType<typeof useConfigTranslations>

interface PolluterSubSectionRouterProps {
  subSection: { key: SubSectionKey; polluter: PolluterItem }
  onBack: () => void
  t: ConfigTranslations
}

export default function PolluterSubSectionRouter({ subSection, onBack, t }: PolluterSubSectionRouterProps) {
  const subTitles: Record<SubSectionKey, string> = {
    contacts: t.isoPolluterRowAction_Contacts,
    layer: t.isoPolluterRowAction_Layer,
    pricing: t.isoPolluterRowAction_Pricing,
    products: t.isoPolluterRowAction_Products,
    properties: t.isoPolluterRowAction_Properties,
    boilerPack: t.isoPolluterRowAction_BoilerPack,
    itePrice: t.isoPolluterRowAction_ITEPrice,
    models: t.isoPolluterRowAction_Models,
    documentsModels: t.isoPolluterRowAction_DocumentsModels,
    preMeetingModel: t.isoPolluterRowAction_PreMeetingModel,
    quotationModel: t.isoPolluterRowAction_QuotationModel,
    documents: t.isoPolluterRowAction_Documents,
    billingModel: t.isoPolluterRowAction_BillingModel,
    afterWorkModel: t.isoPolluterRowAction_AfterWorkModel,
    recipients: t.isoPolluterRowAction_Recipients,
  }

  // ── Real sub-CRUDs (migrated from theme32a) ──
  if (subSection.key === 'contacts') {
    return (
      <PolluterContactsCrud
        polluterId={subSection.polluter.id}
        polluterName={subSection.polluter.name}
        onBack={onBack}
      />
    )
  }
  if (subSection.key === 'recipients') {
    return (
      <PolluterRecipientForm
        polluterId={subSection.polluter.id}
        polluterName={subSection.polluter.name}
        onBack={onBack}
      />
    )
  }
  if (subSection.key === 'layer') {
    return (
      <PolluterLayerForm
        polluterId={subSection.polluter.id}
        polluterName={subSection.polluter.name}
        onBack={onBack}
      />
    )
  }
  if (subSection.key === 'quotationModel') {
    return (
      <PolluterModelSelector
        polluterId={subSection.polluter.id}
        polluterName={subSection.polluter.name}
        modelType='quotation'
        onBack={onBack}
      />
    )
  }
  if (subSection.key === 'billingModel') {
    return (
      <PolluterModelSelector
        polluterId={subSection.polluter.id}
        polluterName={subSection.polluter.name}
        modelType='billing'
        onBack={onBack}
      />
    )
  }
  if (subSection.key === 'preMeetingModel') {
    return (
      <PolluterModelSelector
        polluterId={subSection.polluter.id}
        polluterName={subSection.polluter.name}
        modelType='premeeting'
        onBack={onBack}
      />
    )
  }
  if (subSection.key === 'afterWorkModel') {
    return (
      <PolluterModelSelector
        polluterId={subSection.polluter.id}
        polluterName={subSection.polluter.name}
        modelType='afterwork'
        onBack={onBack}
      />
    )
  }
  if (subSection.key === 'pricing') {
    return (
      <PolluterPricingCrud
        polluterId={subSection.polluter.id}
        polluterName={subSection.polluter.name}
        polluterType={subSection.polluter.type}
        onBack={onBack}
      />
    )
  }
  if (subSection.key === 'boilerPack') {
    return (
      <PolluterPricingVariantCrud
        polluterId={subSection.polluter.id}
        polluterName={subSection.polluter.name}
        variant='boilerpack'
        onBack={onBack}
      />
    )
  }
  if (subSection.key === 'itePrice') {
    return (
      <PolluterPricingVariantCrud
        polluterId={subSection.polluter.id}
        polluterName={subSection.polluter.name}
        variant='ite'
        onBack={onBack}
      />
    )
  }
  if (subSection.key === 'products') {
    return (
      <PolluterProductForm
        polluterId={subSection.polluter.id}
        polluterName={subSection.polluter.name}
        onBack={onBack}
      />
    )
  }
  if (subSection.key === 'properties') {
    return (
      <PolluterPropertyForm
        polluterId={subSection.polluter.id}
        polluterName={subSection.polluter.name}
        polluterType={subSection.polluter.type}
        onBack={onBack}
      />
    )
  }
  if (subSection.key === 'models') {
    return (
      <PolluterModelsCrud
        polluterId={subSection.polluter.id}
        polluterName={subSection.polluter.name}
        onBack={onBack}
      />
    )
  }
  if (subSection.key === 'documentsModels' || subSection.key === 'documents') {
    return (
      <PolluterDocumentsCrud
        polluterId={subSection.polluter.id}
        polluterName={subSection.polluter.name}
        onBack={onBack}
      />
    )
  }

  // ── Stub for not-yet-migrated sub-CRUDs ──
  return (
    <PolluterSubSectionStub
      title={subTitles[subSection.key]}
      polluterId={subSection.polluter.id}
      polluterName={subSection.polluter.name}
      onBack={onBack}
    />
  )
}

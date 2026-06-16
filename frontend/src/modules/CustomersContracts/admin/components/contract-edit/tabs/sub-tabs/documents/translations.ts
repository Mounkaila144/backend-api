// Structural translation interfaces shared between contract and meeting
// document views. Both ContractTranslations and MeetingTranslations satisfy
// these via subset matching, which lets QuotationDetailsTable and
// EditQuotationView accept either dictionary without coupling them to one
// module.

export interface QuotationTableTranslations {
  docColDate: string
  docColReference: string
  docColTax55: string
  docColTax20: string
  docColPaidHtWithoutAnah: string
  docColTotalHt: string
  docColTotalTax: string
  docColTotalTtc: string
  docColPrimeCee: string
  docColPaidHtWithAnah: string
  docColPrimeAnah: string
  docColSigned: string
  docColSignedAt: string
  docColCreatedBy: string
  docColCreatedAt: string
  docColStatus: string
  docColActions: string
  docSigned: string
  docNotSigned: string
  docActionEdit: string
  docActionYousign: string
  docActionBilling: string
  docDownloadPdf: string
  docActionDisable: string
  docActionEnable: string
}

export interface EditQuotationViewTranslations {
  docEditTitle: string
  docEditLoading: string
  docEditLoadError: string
  docEditNoPolluter: string
  docEditDate: string
  docEditSubventionType: string
  docEditArticle: string
  docEditQuantity: string
  docEditPrice: string
  docEditTotal: string
  docEditTotalHT: string
  docEditTotalTTC: string
  docEditManualSubvention: string
  docEditAutoSubvention: string
  docEditPrimeANAH: string
  docEditPrimeCEE: string
  docEditPrimeAnaTTC: string
  docEditPrimeCEETTC: string
  docEditRemise: string
  docEditDiscount: string
  docEditRestInCharge: string
  docEditResults: string
  docEditSave: string
  docEditCancel: string
  docEditSaveError: string
}

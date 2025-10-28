<?php

namespace Modules\CustomersContracts\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Contract List Resource - Optimized for table/list display
 *
 * Displays comprehensive contract information for admin list view
 */
class ContractListResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param \Illuminate\Http\Request $request
     * @return array
     */
    public function toArray($request): array
    {
        return [
            // Identité
            'id' => $this->id,
            'reference' => $this->reference,

            // Customer complet dans un tableau
            'customer' => $this->when(
                $this->relationLoaded('customer') && $this->customer,
                function () {
                    $address = null;
                    if ($this->customer->relationLoaded('addresses') && $this->customer->addresses->isNotEmpty()) {
                        $firstAddress = $this->customer->addresses->first();
                        $address = [
                            'id' => $firstAddress->id,
                            'address1' => $firstAddress->address1 ?? null,
                            'address2' => $firstAddress->address2 ?? null,
                            'postcode' => $firstAddress->postcode ?? null,
                            'city' => $firstAddress->city ?? null,
                            'country' => $firstAddress->country ?? null,
                        ];
                    }

                    return [
                        'id' => $this->customer->id,
                        'company' => $this->customer->company ?? null,
                        'gender' => $this->customer->gender ?? null,
                        'firstname' => $this->customer->firstname ?? null,
                        'lastname' => $this->customer->lastname ?? null,
                        'nom_prenom' => trim(($this->customer->lastname ?? '') . ' ' . ($this->customer->firstname ?? '')),
                        'email' => $this->customer->email ?? null,
                        'phone' => $this->customer->phone ?? null,
                        'mobile' => $this->customer->mobile ?? null,
                        'mobile2' => $this->customer->mobile2 ?? null,
                        'phone1' => $this->customer->phone1 ?? null,
                        'telephone' => $this->customer->phone ?? $this->customer->mobile ?? $this->customer->phone1 ?? null,
                        'birthday' => $this->customer->birthday?->format('Y-m-d'),
                        'age' => $this->customer->age ?? null,
                        'occupation' => $this->customer->occupation ?? null,
                        'salary' => $this->customer->salary ?? null,
                        'address' => $address,
                    ];
                }
            ),

            // Dates
            'date_ouverture' => $this->opened_at?->format('Y-m-d'),
            'date_envoi' => $this->sent_at?->format('Y-m-d H:i:s'),
            'date_paiement' => $this->payment_at?->format('Y-m-d'),
            'date_opc' => $this->opc_at?->format('Y-m-d H:i:s'),
            'date_apf' => $this->apf_at?->format('Y-m-d'),

            // Accès
            'acces_1' => $this->getAttribute('access_1') ?? null, // À adapter selon votre schéma
            'acces_2' => $this->getAttribute('access_2') ?? null, // À adapter selon votre schéma

            // Source
            'source' => $this->getAttribute('source') ?? null, // À adapter selon votre schéma

            // Période CEE
            'periode_cee' => $this->getAttribute('cee_period') ?? null, // À adapter selon votre schéma

            // Surface parcelle
            'surface_parcelle' => $this->getAttribute('plot_surface') ?? null, // À adapter selon votre schéma

            // Société porteuse
            'societe_porteuse' => $this->company_id,

            // Équipe et personnel
            'regie_callcenter' => $this->team_id,
            'telepro_id' => $this->telepro_id,
            'commercial_1_id' => $this->sale_1_id,
            'commercial_2_id' => $this->sale_2_id,
            'manager_id' => $this->manager_id,
            'assistant_id' => $this->assistant_id,
            'installateur_id' => $this->installer_user_id,

            // Créateur (depuis history ou created_by)
            'createur_id' => $this->getAttribute('created_by') ?? null, // À adapter

            // Confirmateur
            'confirmateur_id' => $this->getAttribute('confirmer_id') ?? null, // À adapter

            // Équipe d'installation
            'equipe_installation' => $this->getAttribute('install_team_id') ?? null, // À adapter

            // Sous-traitant
            'sous_traitant_id' => $this->getAttribute('subcontractor_id') ?? null, // À adapter

            // Status et états
            'status_contrat_id' => $this->state_id,
            'status_contrat' => $this->when(
                $this->relationLoaded('contractStatus') && $this->contractStatus,
                fn() => [
                    'id' => $this->contractStatus->id,
                    'name' => $this->contractStatus->name,
                    'color' => $this->contractStatus->color,
                    'icon' => $this->contractStatus->icon,
                ]
            ),

            'status_installation_id' => $this->install_state_id,
            'status_installation' => $this->when(
                $this->relationLoaded('installStatus') && $this->installStatus,
                fn() => [
                    'id' => $this->installStatus->id,
                    'name' => $this->installStatus->name,
                    'color' => $this->installStatus->color,
                ]
            ),

            'status_admin_id' => $this->admin_status_id,
            'status_admin' => $this->when(
                $this->relationLoaded('adminStatus') && $this->adminStatus,
                fn() => [
                    'id' => $this->adminStatus->id,
                    'name' => $this->adminStatus->name,
                    'color' => $this->adminStatus->color,
                ]
            ),

            // Flags booléens
            'confirme' => $this->is_signed === 'YES',
            'facturable' => $this->getAttribute('billable') === 'YES', // À adapter
            'bloque' => $this->getAttribute('blocked') === 'YES', // À adapter
            'devis_bloque' => $this->getAttribute('quote_blocked') === 'YES', // À adapter

            // V Photos, V Contrôle qualité, V Document
            'has_photos' => $this->getAttribute('has_photos') ?? false, // À adapter
            'controle_qualite_valide' => $this->getAttribute('quality_control_validated') ?? false, // À adapter
            'has_documents' => $this->getAttribute('has_documents') ?? false, // À adapter

            // Rapports
            'rapport_temps' => $this->getAttribute('time_report') ?? null, // À adapter
            'rapport_admin' => $this->getAttribute('admin_report') ?? null, // À adapter
            'rapport_attribution' => $this->getAttribute('attribution_report') ?? null, // À adapter
            'rapport_installation' => $this->getAttribute('install_report') ?? null, // À adapter

            // Campaign
            'campaign_id' => $this->getAttribute('campaign_id') ?? null, // À adapter

            // Esclave (slave)
            'esclave' => $this->getAttribute('slave') ?? null, // À adapter

            // Montant
            'montant_ttc' => (float) $this->total_price_with_taxe,
            'montant_ht' => (float) $this->total_price_without_taxe,

            // Actif/Supprimé
            'actif' => $this->getAttribute('status') === 'ACTIVE',
            'status_flag' => $this->getAttribute('status'), // ACTIVE ou DELETE

            // Remarques
            'remarques' => $this->remarks,

            // Timestamps
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}

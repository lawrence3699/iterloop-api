/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { useCallback, useMemo, useState, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'

import { PublicLayout } from '@/components/layout'
import { useScrollReveal } from '@/hooks/use-scroll-reveal'
import { cn } from '@/lib/utils'

import {
  LoadingSkeleton,
  EmptyState,
  SearchBar,
  ModelCardGrid,
  ModelDetailsDrawer,
} from './components'
import { ClonePricingTable } from './components/clone-pricing-table'
import { PricingControls } from './components/pricing-controls'
import { PricingHero } from './components/pricing-hero'
import { FILTER_ALL, VIEW_MODES } from './constants'
import { useFilters } from './hooks/use-filters'
import { usePricingData } from './hooks/use-pricing-data'

export function Pricing() {
  const { t } = useTranslation()
  const [selectedModelName, setSelectedModelName] = useState<string | null>(
    null
  )

  const {
    models,
    vendors,
    groupRatio,
    usableGroup,
    endpointMap,
    autoGroups,
    isLoading,
    priceRate,
    usdExchangeRate,
    pricingCurrency,
  } = usePricingData()

  const {
    searchInput,
    sortBy,
    vendorFilter,
    tokenUnit,
    viewMode,
    showRechargePrice,
    setSearchInput,
    setSortBy,
    setVendorFilter,
    setTokenUnit,
    setViewMode,
    setShowRechargePrice,
    filteredModels,
    hasActiveFilters,
    clearFilters,
    clearSearch,
  } = useFilters(models || [])

  useScrollReveal(isLoading)

  const handleModelClick = useCallback((modelName: string) => {
    setSelectedModelName(modelName)
  }, [])

  const selectedModel = useMemo(
    () =>
      selectedModelName
        ? (models || []).find(
            (model) => model.model_name === selectedModelName
          ) || null
        : null,
    [models, selectedModelName]
  )

  const handleClearAll = useCallback(() => {
    clearFilters()
    clearSearch()
  }, [clearFilters, clearSearch])

  const vendorChips = useMemo(() => {
    const availableVendors = (vendors || [])
      .filter((vendor) =>
        (models || []).some((model) => model.vendor_name === vendor.name)
      )
      .map((vendor) => vendor.name)
    return [FILTER_ALL, ...availableVendors]
  }, [vendors, models])

  const renderPricingContent = () => {
    if (filteredModels.length === 0) {
      return (
        <EmptyState
          searchQuery={searchInput}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearAll}
        />
      )
    }

    if (viewMode === VIEW_MODES.CARD) {
      return (
        <ModelCardGrid
          models={filteredModels}
          priceRate={priceRate}
          usdExchangeRate={usdExchangeRate}
          tokenUnit={tokenUnit}
          showRechargePrice={showRechargePrice}
          onModelClick={handleModelClick}
        />
      )
    }

    return (
      <ClonePricingTable
        models={filteredModels}
        priceRate={priceRate}
        usdExchangeRate={usdExchangeRate}
        tokenUnit={tokenUnit}
        showRechargePrice={showRechargePrice}
        onModelClick={handleModelClick}
      />
    )
  }

  if (isLoading) {
    return (
      <PublicLayout showMainContainer={false}>
        <div className='pt-[76px] max-[640px]:pt-[60px]'>
          <div className='mx-auto w-full max-w-6xl px-4 pt-10 pb-10 md:px-6'>
            <LoadingSkeleton viewMode={VIEW_MODES.TABLE} />
          </div>
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout showMainContainer={false}>
      <div className='bg-[var(--bg-canvas)] pt-[76px] text-[var(--text-primary)] max-[640px]:pt-[60px]'>
        <main className='animate-page-enter space-y-12 pb-10'>
          <PricingHero />

          <section
            id='pricing-models'
            className='motion-item mx-auto w-full max-w-6xl scroll-mt-24 space-y-5 px-4 md:px-6'
            style={{ '--stagger-delay': '80ms' } as CSSProperties}
          >
            <div className='flex flex-col gap-2 md:flex-row md:items-end md:justify-between'>
              <div>
                <h2 className='il-section-title text-3xl font-semibold'>
                  {t('Live pricing')}
                </h2>
                <p className='mt-1 text-sm text-[var(--text-secondary)]'>
                  {t(
                    'Live prices — discounts may vary with upstream costs. Prices in {{currency}} / {{unit}} Tokens.',
                    {
                      currency: pricingCurrency.code,
                      unit: tokenUnit === 'K' ? '1K' : '1M',
                    }
                  )}
                </p>
              </div>
              <div className='w-full md:w-[320px]'>
                <SearchBar
                  value={searchInput}
                  onChange={setSearchInput}
                  onClear={clearSearch}
                  placeholder={t('Search models...')}
                />
              </div>
            </div>

            <div className='flex [scrollbar-width:none] gap-2 overflow-x-auto sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden'>
              {vendorChips.map((vendor) => (
                <button
                  key={vendor}
                  type='button'
                  className={cn(
                    'il-chip il-stateful shrink-0',
                    vendorFilter === vendor && 'is-active'
                  )}
                  onClick={() => setVendorFilter(vendor)}
                >
                  {vendor === FILTER_ALL ? t('All') : vendor}
                </button>
              ))}
            </div>

            <PricingControls
              sortBy={sortBy}
              onSortChange={setSortBy}
              tokenUnit={tokenUnit}
              onTokenUnitChange={setTokenUnit}
              showRechargePrice={showRechargePrice}
              onRechargePriceChange={setShowRechargePrice}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              filteredCount={filteredModels.length}
              totalCount={models?.length || 0}
            />

            {renderPricingContent()}
          </section>
        </main>

        {selectedModel && (
          <ModelDetailsDrawer
            open={Boolean(selectedModel)}
            onOpenChange={(open) => {
              if (!open) setSelectedModelName(null)
            }}
            model={selectedModel}
            groupRatio={groupRatio || {}}
            usableGroup={usableGroup || {}}
            endpointMap={
              (endpointMap as Record<
                string,
                { path?: string; method?: string }
              >) || {}
            }
            autoGroups={autoGroups || []}
            priceRate={priceRate ?? 1}
            usdExchangeRate={usdExchangeRate ?? 1}
            tokenUnit={tokenUnit}
            showRechargePrice={showRechargePrice}
          />
        )}
      </div>
    </PublicLayout>
  )
}

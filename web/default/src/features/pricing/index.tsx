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
import { Sparkles } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PublicLayout } from '@/components/layout'
import { PageTransition } from '@/components/page-transition'

import {
  LoadingSkeleton,
  EmptyState,
  SearchBar,
  ModelCardGrid,
  PricingSidebar,
  PricingToolbar,
  ModelDetailsDrawer,
} from './components'
import { VIEW_MODES } from './constants'
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
  } = usePricingData()

  const {
    searchInput,
    sortBy,
    vendorFilter,
    tokenUnit,
    showRechargePrice,
    setSearchInput,
    setSortBy,
    setVendorFilter,
    setTokenUnit,
    setShowRechargePrice,
    filteredModels,
    hasActiveFilters,
    activeFilterCount,
    clearFilters,
    clearSearch,
  } = useFilters(models || [])

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

  if (isLoading) {
    return (
      <PublicLayout showMainContainer={false}>
        <div className='mx-auto w-full max-w-[1560px] px-4 pt-16 pb-10 sm:px-6'>
          <LoadingSkeleton viewMode={VIEW_MODES.CARD} />
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout showMainContainer={false}>
      <div className='relative pt-11'>
        <PageTransition className='mx-auto w-full max-w-[1560px] px-4 pt-6 pb-12 sm:px-6 lg:pt-8'>
          <div className='grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)]'>
            <PricingSidebar
              vendorFilter={vendorFilter}
              onVendorChange={setVendorFilter}
              vendors={vendors || []}
              models={models || []}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={clearFilters}
              className='sticky top-16 hidden self-start xl:block'
            />

            <main className='min-w-0'>
              <header className='relative isolate overflow-hidden rounded-t-2xl bg-[linear-gradient(120deg,#0a3aa8_0%,#155ad4_44%,#2447c7_72%,#12369d_100%)] px-6 py-7 text-white sm:px-8 sm:py-8'>
                <div className='iterloop-pricing-hero-art absolute inset-0 -z-10 opacity-50' />
                <Sparkles className='absolute top-7 right-7 size-8 text-cyan-200 drop-shadow sm:size-10' />
                <div className='flex flex-wrap items-center gap-3 pr-12'>
                  <h1 className='text-2xl font-semibold tracking-tight sm:text-3xl'>
                    {t('Models and pricing')}
                  </h1>
                  <span className='rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm'>
                    {t('{{count}} models', { count: models?.length || 0 })}
                  </span>
                </div>
                <p className='mt-2 max-w-2xl text-sm text-blue-50/90 sm:text-base'>
                  {t('This site currently has {{count}} models enabled', {
                    count: models?.length || 0,
                  })}
                </p>
              </header>

              <div className='border-border/70 bg-background/95 border-x p-3'>
                <SearchBar
                  value={searchInput}
                  onChange={setSearchInput}
                  onClear={clearSearch}
                  placeholder={t('Search models...')}
                />
              </div>

              <PricingToolbar
                filteredCount={filteredModels.length}
                totalCount={models?.length}
                sortBy={sortBy}
                onSortChange={setSortBy}
                tokenUnit={tokenUnit}
                onTokenUnitChange={setTokenUnit}
                showRechargePrice={showRechargePrice}
                onRechargePriceChange={setShowRechargePrice}
                vendorFilter={vendorFilter}
                onVendorChange={setVendorFilter}
                vendors={vendors || []}
                models={models || []}
                hasActiveFilters={hasActiveFilters}
                activeFilterCount={activeFilterCount}
                onClearFilters={clearFilters}
              />

              <div className='mt-5'>{renderPricingContent()}</div>
            </main>
          </div>

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
        </PageTransition>
      </div>
    </PublicLayout>
  )
}

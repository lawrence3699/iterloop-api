package controller

import "github.com/QuantumNous/new-api/model"

const (
	openAIOfficialPricingURL    = "https://developers.openai.com/api/docs/pricing"
	anthropicOfficialPricingURL = "https://platform.claude.com/docs/en/about-claude/pricing"
)

func float64Pointer(value float64) *float64 {
	return &value
}

func officialModelPrice(
	inputUSD float64,
	outputUSD float64,
	cacheReadUSD float64,
	cacheWriteUSD *float64,
	sourceModel string,
	sourceURL string,
) *model.OfficialModelPrice {
	return &model.OfficialModelPrice{
		InputUSD:      inputUSD,
		OutputUSD:     outputUSD,
		CacheReadUSD:  float64Pointer(cacheReadUSD),
		CacheWriteUSD: cacheWriteUSD,
		SourceModel:   sourceModel,
		SourceURL:     sourceURL,
	}
}

func officialPriceForModel(modelName string) *model.OfficialModelPrice {
	var price *model.OfficialModelPrice

	switch modelName {
	case "codex-auto-review", "gpt-5.4":
		price = officialModelPrice(2.5, 15, 0.25, nil, "gpt-5.4", openAIOfficialPricingURL)
	case "gpt-5.4-mini":
		price = officialModelPrice(0.75, 4.5, 0.075, nil, "gpt-5.4-mini", openAIOfficialPricingURL)
	case "gpt-5.5":
		price = officialModelPrice(5, 30, 0.5, nil, "gpt-5.5", openAIOfficialPricingURL)
	case "gpt-5.6-luna":
		price = officialModelPrice(1, 6, 0.1, float64Pointer(1.25), "gpt-5.6-luna", openAIOfficialPricingURL)
	case "gpt-5.6-sol":
		price = officialModelPrice(5, 30, 0.5, float64Pointer(6.25), "gpt-5.6-sol", openAIOfficialPricingURL)
	case "gpt-5.6-terra":
		price = officialModelPrice(2.5, 15, 0.25, float64Pointer(3.125), "gpt-5.6-terra", openAIOfficialPricingURL)
	case "claude-fable-5":
		price = officialModelPrice(10, 50, 1, float64Pointer(12.5), "claude-fable-5", anthropicOfficialPricingURL)
	case "claude-haiku-4-5-20251001":
		price = officialModelPrice(1, 5, 0.1, float64Pointer(1.25), "claude-haiku-4-5", anthropicOfficialPricingURL)
	case "claude-opus-4-5-20251101":
		price = officialModelPrice(5, 25, 0.5, float64Pointer(6.25), "claude-opus-4-5", anthropicOfficialPricingURL)
	case "claude-opus-4-6", "claude-opus-4-7", "claude-opus-4-8":
		price = officialModelPrice(5, 25, 0.5, float64Pointer(6.25), modelName, anthropicOfficialPricingURL)
	case "claude-sonnet-4-5-20250929":
		price = officialModelPrice(3, 15, 0.3, float64Pointer(3.75), "claude-sonnet-4-5", anthropicOfficialPricingURL)
	case "claude-sonnet-4-6":
		price = officialModelPrice(3, 15, 0.3, float64Pointer(3.75), modelName, anthropicOfficialPricingURL)
	case "claude-sonnet-5":
		price = officialModelPrice(2, 10, 0.2, float64Pointer(2.5), "claude-sonnet-5", anthropicOfficialPricingURL)
		price.EffectiveUntil = "2026-08-31"
	default:
		return nil
	}

	return price
}

func attachOfficialPrices(pricing []model.Pricing) []model.Pricing {
	for index := range pricing {
		pricing[index].OfficialPrice = officialPriceForModel(pricing[index].ModelName)
	}
	return pricing
}

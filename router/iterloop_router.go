package router

import (
	"github.com/QuantumNous/new-api/controller"
	"github.com/gin-gonic/gin"
)

func SetIterLoopRouter(router *gin.Engine) {
	router.GET("/healthz", controller.IterLoopHealth)
	router.GET("/pricing.json", controller.IterLoopPricing)
	router.GET("/openapi.json", controller.IterLoopOpenAPI)
	router.GET("/.well-known/api-catalog", controller.IterLoopAPICatalog)
}

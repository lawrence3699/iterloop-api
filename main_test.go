package main

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestListenAddress(t *testing.T) {
	assert.Equal(t, ":28517", listenAddress("", "28517"))
	assert.Equal(t, "127.0.0.1:28517", listenAddress("127.0.0.1", "28517"))
	assert.Equal(t, "[::1]:28517", listenAddress("::1", "28517"))
}

SHELL := /bin/bash

all: auth

tidy:
	go mod tidy
	go mod vendor

auth:
	@mkdir -p bin/$@
	GOOS=linux GOARCH=amd64 go build -o bin/$@/$@ cmd/$@/main.go

deploy-kr-dev: all
	cd infra && cdk deploy --all --profile=dev
	

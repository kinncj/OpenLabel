.PHONY: typecheck lint test test-e2e build ci install

install:
	npm install

typecheck:
	npm run typecheck

lint:
	npm run lint && npm run format:check

test:
	npm run test

test-e2e:
	npm run test:e2e

build:
	npm run build

ci: typecheck lint test build

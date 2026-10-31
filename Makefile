.PHONY: setup run build preview test lint format check deploy clean nuke

setup:
	npm install

run:
	npm run dev

build:
	npm run build

preview: build
	npm run preview

test:
	npm test

lint:
	npm run lint

format:
	npm run format

check:
	npm run typecheck
	npm run lint
	npm test

deploy: check build
	@echo "Built and checked. Push main to publish via GitHub Actions."

clean:
	rm -rf dist node_modules/.vite

nuke: clean
	rm -rf node_modules

.PHONY: setup dev-env run backend frontend build preview test lint format check deploy clean nuke pb-reset

# Local-only PocketBase for development. Keep PB_VERSION in sync with the Dockerfile.
PB_VERSION := 0.40.6
PB_OS := $(shell uname -s | tr '[:upper:]' '[:lower:]')
PB_ARCH := $(shell uname -m | sed -e 's/x86_64/amd64/' -e 's/aarch64/arm64/')
PB_DIR := .pb
PB := $(PB_DIR)/pocketbase
PB_FLAGS := --dir=$(PB_DIR)/data --migrationsDir=pb_migrations --hooksDir=pb_hooks

# Local settings from .env (see .env.example): the throwaway PB_DEV_ADMIN / PB_DEV_PASSWORD login,
# and YT_API_KEY, which is passed through to PocketBase for the search route
-include .env
export YT_API_KEY

setup:
	npm install

$(PB):
	mkdir -p $(PB_DIR)
	curl -fsSL -o $(PB_DIR)/pb.zip https://github.com/pocketbase/pocketbase/releases/download/v$(PB_VERSION)/pocketbase_$(PB_VERSION)_$(PB_OS)_$(PB_ARCH).zip
	unzip -oq $(PB_DIR)/pb.zip pocketbase -d $(PB_DIR)
	chmod +x $(PB)
	rm $(PB_DIR)/pb.zip

dev-env:
	@test -n "$(PB_DEV_ADMIN)" -a -n "$(PB_DEV_PASSWORD)" || { echo "Set PB_DEV_ADMIN and PB_DEV_PASSWORD in .env (copy .env.example)"; exit 1; }

run: dev-env
	@$(MAKE) --no-print-directory -j2 backend frontend

backend: dev-env $(PB)
	@$(PB) superuser upsert "$(PB_DEV_ADMIN)" "$(PB_DEV_PASSWORD)" $(PB_FLAGS) > /dev/null
	@echo "Local PocketBase dashboard: http://127.0.0.1:8090/_/  (admin $(PB_DEV_ADMIN))"
	@$(PB) serve --http=127.0.0.1:8090 $(PB_FLAGS)

frontend:
	npm run dev

pb-reset:
	rm -rf $(PB_DIR)/data

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
	rm -rf node_modules $(PB_DIR)

# ExpenseApp — run from this directory (repo root).
# Requires: backend/.env with MONGODB_URI + JWT_ACCESS_SECRET (see .env.example).

ROOT := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))

.DEFAULT_GOAL := dev

.PHONY: dev backend frontend install kill-ports help

# API + common Vite ports when 5173 is busy.
KILL_PORTS := 4000 5173 5174 5175 5176 5177 5178

help:
	@echo "ExpenseApp"
	@echo "  make            — API (nodemon) + Vite with hot reload (same as: make dev)"
	@echo "  make backend    — API with nodemon (auto-restart on backend file changes)"
	@echo "  make frontend   — Vite only (UI updates instantly while you edit — HMR)"
	@echo "  make install    — npm install in backend/ and frontend/"
	@echo "  make kill-ports — kill anything listening on dev ports ($(KILL_PORTS))"

# Start API and web UI; Ctrl+C stops both processes.
dev:
	@bash -c '(cd "$(ROOT)/backend" && npm run dev) & p1=$$!; \
	(cd "$(ROOT)/frontend" && npm run dev) & p2=$$!; \
	trap "kill $$p1 $$p2 2>/dev/null; exit 130" INT TERM; \
	wait'

backend:
	@cd "$(ROOT)/backend" && npm run dev

frontend:
	@cd "$(ROOT)/frontend" && npm run dev

install:
	@cd "$(ROOT)/backend" && npm install
	@cd "$(ROOT)/frontend" && npm install

kill-ports:
	@for p in $(KILL_PORTS); do \
		pids=$$(lsof -ti :$$p 2>/dev/null); \
		if [ -n "$$pids" ]; then echo "kill -9 $$pids (port $$p)"; kill -9 $$pids 2>/dev/null || true; fi; \
	done; \
	echo "kill-ports done."

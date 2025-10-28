.DEFAULT_GOAL := help
.PHONY: docs
SRC_DIRS = ./tutorindigo

# Warning: These checks are not necessarily run on every PR.
test: test-lint test-types test-format test-pythonpackage # Run some static checks.

test-format: ## Run code formatting tests
	ruff format --check --diff $(SRC_DIRS)

test-lint: ## Run code linting tests
	ruff check ${SRC_DIRS}

test-types: ## Run type checks.
	mypy --exclude=templates --ignore-missing-imports --implicit-reexport --strict ${SRC_DIRS}

build-pythonpackage: ## Build the "tutor-indigo" python package for upload to pypi
	python -m build --sdist

test-pythonpackage: build-pythonpackage ## Test that package can be uploaded to pypi
	twine check dist/tutor_indigo-$(shell make version).tar.gz

format: ## Format code automatically
	ruff format ${SRC_DIRS}

fix-lint: ## Fix lint errors automatically
	ruff check --fix ${SRC_DIRS}

changelog-entry: ## Create a new changelog entry.
	scriv create

changelog: ## Collect changelog entries in the CHANGELOG.md file.
	scriv collect

version: ## Print the current tutor-indigo version
	@python -c 'import io, os; about = {}; exec(io.open(os.path.join("tutorindigo", "__about__.py"), "rt", encoding="utf-8").read(), about); print(about["__version__"])'

ESCAPE = 
help: ## Print this help
	@grep -E '^([a-zA-Z_-]+:.*?## .*|######* .+)$$' Makefile \
		| sed 's/######* \(.*\)/@               $(ESCAPE)[1;31m\1$(ESCAPE)[0m/g' | tr '@' '\n' \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "\033[33m%-30s\033[0m %s\n", $$1, $$2}'

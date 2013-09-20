REPORTER?=dot
ifdef V
	REPORTER=spec
endif

ifdef TEST
	T=--grep '${TEST}'
	REPORTER=list
endif

dependencies:
	@npm install -s

deps: dependencies

test: check-deps
	@rm -rf ./test/tmp
	@./node_modules/mocha/bin/mocha \
		--bail \
		--reporter ${REPORTER} \
		-s 200 \
		-t 2000 $T
	@rm -rf ./test/tmp

check: test

clean:
	@rm -rf coverage

coverage: check-deps
	@./node_modules/.bin/istanbul cover \
		./node_modules/.bin/_mocha -- -R spec

coverage-html: coverage
	@open coverage/lcov-report/index.html

lint: check-deps
	@./node_modules/.bin/jshint -c ./.jshintrc lib test

check-deps:
	@if test ! -d node_modules; then \
		echo "Installing npm dependencies.."; \
		npm install -d; \
	fi

.PHONY: test dependencies coverage lint

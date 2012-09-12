REPORTER?=progress
ifdef V
	REPORTER=spec
endif

ifdef TEST
	T=--grep '${TEST}'
	REPORTER=list
endif

dependencies:
	@npm install -d

deps: dependencies

test:
	@rm -rf ./test/tmp
	@./node_modules/mocha/bin/mocha \
		--bail \
		--reporter ${REPORTER} \
		-s 200 \
		-t 2000 $T
	@rm -rf ./test/tmp

check: test

.PHONY: test dependencies

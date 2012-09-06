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
	@./node_modules/mocha/bin/mocha \
		--reporter ${REPORTER} \
		-s 200 \
		-t 2000 $T

check: test

.PHONY: test dependencies

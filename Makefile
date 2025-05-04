all: thai-numbers.apkg thai-vowels.apkg

thai-numbers.apkg: node_modules
	bun convert.ts -d numbers -i thai-numbers.yaml -o thai-numbers.apkg

thai-vowels.apkg: node_modules
	bun convert.ts -d vowels -i thai-vowels.yaml -o thai-vowels.apkg

node_modules: package.json
	bun install

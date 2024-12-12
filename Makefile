thai-numbers.apkg: node_modules
	bun convert.ts -i thai-numbers.yaml -o thai-numbers.apkg

node_modules: package.json
	bun install

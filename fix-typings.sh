#!/bin/bash

# run `./node_modules/.bin/tsc -p .` first to generate the declaration files

# clear tmp file
echo '' > ./route-harness.d.ts;

cat ./build/Factory.d.ts ./build/RouteHarness.d.ts ./build/Types.d.ts > ./route-harness.d.ts
echo -e '\n' >> ./route-harness.d.ts;

# remove the default export from Wrapper since everything is one file
cat ./build/Wrapper.d.ts | sed '$d' >> ./route-harness.d.ts

# write to index.d.ts
cat ./route-harness.d.ts > ./build/index.d.ts

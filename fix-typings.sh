#!/bin/bash

# run `./node_modules/.bin/tsc -p .` first to generate the declaration files

# start dumping to tmp file
cat ./build/Types.d.ts > ./route-harness.d.ts;

echo -e '\n' >> ./route-harness.d.ts;
cat ./build/Factory.d.ts >> ./route-harness.d.ts;

# remove the 2nd and 3rd line with local imports
echo -e '\n' >> ./route-harness.d.ts;
cat ./build/RouteHarness.d.ts | sed '2d;3d' >> ./route-harness.d.ts;


# remove the default export from Wrapper since everything is one file
echo -e '\n' >> ./route-harness.d.ts;
cat ./build/Wrapper.d.ts | sed '2d;$d' >> ./route-harness.d.ts

# write to index.d.ts
cat ./route-harness.d.ts > ./build/index.d.ts

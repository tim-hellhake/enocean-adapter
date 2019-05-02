#!/bin/bash

rm -rf node_modules

if [ -z "${ADDON_ARCH}" ]; then
  TARFILE_SUFFIX=
else
  NODE_VERSION="$(node --version)"
  TARFILE_SUFFIX="-${ADDON_ARCH}-${NODE_VERSION/\.*/}"
fi

if [ "${ADDON_ARCH}" == "linux-arm" ]; then
  # We assume that CC and CXX are pointing to the cross compilers
  npm install --ignore-scripts --production
  npm rebuild --arch=armv6l --target_arch=arm
else
  npm install --production
fi

shasum --algorithm 256 package.json *.js LICENSE > SHA256SUMS
find node_modules -type f -exec shasum --algorithm 256 {} \; >> SHA256SUMS

TARFILE=`npm pack`
tar xzf ${TARFILE}
cp -r node_modules ./package
tar czf ${TARFILE} package

shasum --algorithm 256 ${TARFILE} > ${TARFILE}.sha256sum

rm SHA256SUMS
rm -rf package

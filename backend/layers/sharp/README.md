# Sharp Lambda Layer

This layer provides the Sharp image processing library for Lambda functions.

## Building the Layer

Run the following to build the layer for ARM64 Lambda:

```bash
cd backend/layers/sharp
npm init -y
npm install sharp --platform=linux --arch=arm64
mkdir -p nodejs
mv node_modules nodejs/
```

The layer structure should be:
```
sharp/
  nodejs/
    node_modules/
      sharp/
      ...
```

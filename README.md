## HOW TO RUN

with npx:

```
npx satispay-api-demo-dev
```

with docker:

```
docker run \
  --env PORT=3000 \
  --publish 3000:3000 \
  --rm -it \
  node npx --yes satispay-api-demo-dev
```

No newline at end of file

#!/bin/bash

rm -rf doc && \
npm run doc && \
cd doc && \
git init && \
git remote add origin git@github.com:RecastAI/bot-connector.git && \
git add . && \
git commit -m "deploy" && \
git push -f origin master:gh-pages
printf '\n> everything has been done.\n'

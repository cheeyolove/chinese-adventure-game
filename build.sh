#!/bin/sh
# src/game.html(아티팩트용 본문)을 브라우저에서 바로 열 수 있는 index.html로 감쌉니다.
set -e
cd "$(dirname "$0")"
{
  printf '<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<style>body{margin:0}[hidden]{display:none!important}</style>\n</head>\n<body>\n'
  cat src/game.html
  printf '\n</body>\n</html>\n'
} > index.html
echo "index.html 생성 완료"

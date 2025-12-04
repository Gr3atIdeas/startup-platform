# Инструкция по быстрому обновлению без полного редеплоя

## Что сделано:

1. Добавлен скрипт `update.sh` для быстрого обновления кода
2. В Dockerfile добавлен git для возможности pull

## Как использовать:

### Вариант A: Через Coolify Terminal

1. Откройте Coolify → ваш проект → **Terminal**
2. Выполните команду:
```bash
./update.sh
```
3. Перезапустите контейнер (если нужно)

### Вариант B: Через Webhook (автоматически)

1. В Coolify перейдите: **Configuration → Webhooks**
2. Создайте новый webhook с командой:
```bash
docker exec oswg844ss4sogswg4o4ogwk8-XXXXX ./update.sh
docker restart oswg844ss4sogswg4o4ogwk8-XXXXX
```
3. Используйте URL webhook в GitHub Actions или вызывайте вручную

### Вариант C: SSH на сервер

```bash
ssh your-server
docker exec $(docker ps -q -f name=oswg844ss4sogswg4o4ogwk8) ./update.sh
docker restart $(docker ps -q -f name=oswg844ss4sogswg4o4ogwk8)
```

## Время обновления:
- Полный редеплой: **~5 минут**
- Быстрое обновление: **~10-30 секунд**

## Когда использовать полный редеплой:
- Изменился `requirements.txt` (новые зависимости)
- Изменился `package.json` (новые npm пакеты)
- Изменился `Dockerfile`
- Нужно пересобрать фронтенд

## Когда использовать быстрое обновление:
- Изменился Python код
- Изменились HTML шаблоны
- Изменились CSS/JS файлы (уже собранные)
- Изменились настройки Django


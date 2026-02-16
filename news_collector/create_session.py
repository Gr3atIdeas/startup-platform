"""Create Telethon session file interactively.

Run this script once to authenticate with Telegram:
    python news_collector/create_session.py

It will:
1. Ask for your phone number verification code (sent via Telegram)
2. Save the session file to news_collector/data/news_collector.session

For Docker deployment:
- Run this locally, then copy the .session file to the persistent volume
- Or run inside the container: docker exec -it <container> python news_collector/create_session.py
"""

import asyncio
import config

from telethon import TelegramClient


async def main():
    config.validate()

    print(f"Creating Telethon session at: {config.SESSION_PATH}.session")
    print(f"Phone: {config.TELEGRAM_PHONE}")
    print()

    client = TelegramClient(
        config.SESSION_PATH,
        int(config.TELEGRAM_API_ID),
        config.TELEGRAM_API_HASH,
    )

    await client.start(phone=config.TELEGRAM_PHONE)
    me = await client.get_me()
    print(f"\nAuthenticated as: {me.first_name} (id={me.id})")
    print(f"Session saved to: {config.SESSION_PATH}.session")

    await client.disconnect()


if __name__ == "__main__":
    asyncio.run(main())

"""
Локальный скрипт для получения Telethon StringSession через QR-код.

Запуск:
    pip install telethon qrcode
    python news_collector/get_session.py

Отсканируй QR-код в Telegram (Settings -> Devices -> Link Desktop Device).
После авторизации скопируй строку сессии и добавь в Coolify:
    TELETHON_SESSION=<строка>
"""

import asyncio
import qrcode
from telethon import TelegramClient, errors
from telethon.sessions import StringSession


def display_qr(url: str) -> None:
    """Print QR code in the terminal."""
    qr = qrcode.QRCode(version=1, box_size=1, border=1)
    qr.add_data(url)
    qr.make(fit=True)
    qr.print_ascii(invert=True)


async def main():
    print("=== Telethon StringSession Generator (QR) ===\n")

    api_id = input("TELEGRAM_API_ID: ").strip()
    api_hash = input("TELEGRAM_API_HASH: ").strip()

    client = TelegramClient(StringSession(), int(api_id), api_hash)
    await client.connect()

    qr_login = await client.qr_login()

    print("Отсканируй QR-код в Telegram:")
    print("Telegram -> Settings -> Devices -> Link Desktop Device\n")

    while True:
        display_qr(qr_login.url)
        print(f"\nОжидаю сканирования... (истекает: {qr_login.expires})\n")

        try:
            await qr_login.wait(timeout=30)
            break
        except asyncio.TimeoutError:
            print("QR-код истёк, генерирую новый...\n")
            await qr_login.recreate()
        except errors.SessionPasswordNeededError:
            password = input("Аккаунт защищён 2FA. Введи пароль: ").strip()
            await client.sign_in(password=password)
            break

    me = await client.get_me()
    session_string = StringSession.save(client.session)

    print(f"\n✅ Авторизован как {me.first_name} (id={me.id})")
    print("\n" + "=" * 60)
    print("TELETHON_SESSION:")
    print("=" * 60)
    print(session_string)
    print("=" * 60)
    print("\nСкопируй строку выше и добавь в Coolify как TELETHON_SESSION")

    await client.disconnect()


if __name__ == "__main__":
    asyncio.run(main())

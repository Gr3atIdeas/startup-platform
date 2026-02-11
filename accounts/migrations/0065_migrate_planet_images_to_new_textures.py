"""
Data migration: replace old planet_image filenames (e.g. '1.png', '2-2.png')
with new texture filenames ('planet_1.webp' — 'planet_9.webp') across all
four entity models.
"""

from django.db import migrations


def migrate_planet_images(apps, schema_editor):
    """Map old planet filenames to new planet_N.webp textures."""
    new_planets = [
        'planet_1.webp', 'planet_2.webp', 'planet_3.webp',
        'planet_4.webp', 'planet_5.webp', 'planet_6.webp',
        'planet_7.webp', 'planet_8.webp', 'planet_9.webp',
    ]

    for model_name in ('Startups', 'Franchises', 'Agencies', 'Specialists'):
        Model = apps.get_model('accounts', model_name)
        entities = Model.objects.exclude(planet_image__isnull=True).exclude(planet_image='')

        for entity in entities:
            old = entity.planet_image
            # Skip if already using new naming convention
            if old.startswith('planet_') and old.endswith('.webp'):
                continue

            # Deterministic mapping: hash the old filename → pick one of 9
            idx = hash(old) % 9
            entity.planet_image = new_planets[idx]
            entity.save(update_fields=['planet_image'])


def reverse_migration(apps, schema_editor):
    # Cannot reliably reverse — old filenames are lost
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0064_moderationlog'),
    ]

    operations = [
        migrations.RunPython(migrate_planet_images, reverse_migration),
    ]

from django.db import migrations


def seed_franchise_directions(apps, schema_editor):
    Directions = apps.get_model('accounts', 'Directions')
    FranchiseDirections = apps.get_model('accounts', 'FranchiseDirections')
    names = (
        Directions.objects
        .exclude(direction_name__isnull=True)
        .exclude(direction_name__exact='')
        .values_list('direction_name', flat=True)
        .distinct()
    )
    for name in names:
        FranchiseDirections.objects.get_or_create(direction_name=name)


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0034_franchise_directions"),
    ]

    operations = [
        migrations.RunPython(seed_franchise_directions, migrations.RunPython.noop),
    ]



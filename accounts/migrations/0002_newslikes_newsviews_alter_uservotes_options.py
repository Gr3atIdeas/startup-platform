
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='NewsLikes',
            fields=[
                ('like_id', models.AutoField(primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'news_likes',
                'managed': False,
            },
        ),
        migrations.CreateModel(
            name='NewsViews',
            fields=[
                ('view_id', models.AutoField(primary_key=True, serialize=False)),
                ('viewed_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'news_views',
                'managed': False,
            },
        ),
        migrations.AlterModelOptions(
            name='uservotes',
            options={'managed': False},
        ),
    ]

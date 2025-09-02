

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0039_add_fk_to_specialist_tables'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql=r"""
                    CREATE TABLE IF NOT EXISTS franchise_categories (
                        category_id SERIAL PRIMARY KEY,
                        category_name VARCHAR(255) NULL
                    );
                    """,
                    reverse_sql="",
                ),
            ],
            state_operations=[
                migrations.CreateModel(
                    name='FranchiseCategories',
                    fields=[
                        ('category_id', models.AutoField(primary_key=True, serialize=False)),
                        ('category_name', models.CharField(blank=True, max_length=255, null=True)),
                    ],
                    options={
                        'db_table': 'franchise_categories',
                        'managed': True,
                    },
                ),
            ],
        ),
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql=r"""
                    ALTER TABLE agencies
                    ADD COLUMN IF NOT EXISTS direction_id INTEGER NULL;
                    """,
                    reverse_sql="",
                ),
                migrations.RunSQL(
                    sql=r"""
                    ALTER TABLE agencies
                    ADD COLUMN IF NOT EXISTS owner_id INTEGER NULL;
                    """,
                    reverse_sql="",
                ),
                migrations.RunSQL(
                    sql=r"""
                    ALTER TABLE agencies
                    ADD COLUMN IF NOT EXISTS stage_id INTEGER NULL;
                    """,
                    reverse_sql="",
                ),
            ],
            state_operations=[
                migrations.AddField(
                    model_name='agencies',
                    name='direction',
                    field=models.ForeignKey(blank=True, db_column='direction_id', null=True, on_delete=django.db.models.deletion.DO_NOTHING, to='accounts.directions'),
                ),
                migrations.AddField(
                    model_name='agencies',
                    name='owner',
                    field=models.ForeignKey(blank=True, db_column='owner_id', null=True, on_delete=django.db.models.deletion.DO_NOTHING, to=settings.AUTH_USER_MODEL),
                ),
                migrations.AddField(
                    model_name='agencies',
                    name='stage',
                    field=models.ForeignKey(blank=True, db_column='stage_id', null=True, on_delete=django.db.models.deletion.DO_NOTHING, to='accounts.startupstages'),
                ),
            ],
        ),
    ]

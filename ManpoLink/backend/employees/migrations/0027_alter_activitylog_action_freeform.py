# Generated manually — allow arbitrary action strings for activity logging

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('employees', '0026_payroll_gov_percents'),
    ]

    operations = [
        migrations.AlterField(
            model_name='activitylog',
            name='action',
            field=models.CharField(max_length=50),
        ),
    ]

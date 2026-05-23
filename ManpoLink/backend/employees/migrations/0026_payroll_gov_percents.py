from django.db import migrations, models
import decimal

class Migration(migrations.Migration):

    dependencies = [
        ('employees', '0025_add_hub_rates'),
    ]

    operations = [
        migrations.AddField(
            model_name='payroll',
            name='sss_percent',
            field=models.DecimalField(decimal_places=2, default=decimal.Decimal('0'), max_digits=5),
        ),
        migrations.AddField(
            model_name='payroll',
            name='philhealth_percent',
            field=models.DecimalField(decimal_places=2, default=decimal.Decimal('0'), max_digits=5),
        ),
        migrations.AddField(
            model_name='payroll',
            name='pagibig_percent',
            field=models.DecimalField(decimal_places=2, default=decimal.Decimal('0'), max_digits=5),
        ),
    ]

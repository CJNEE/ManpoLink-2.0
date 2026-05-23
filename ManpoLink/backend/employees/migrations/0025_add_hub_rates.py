from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('employees', '0024_leaveattachment'),
    ]

    operations = [
        migrations.AddField(
            model_name='hub',
            name='sss_rate',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=5),
        ),
        migrations.AddField(
            model_name='hub',
            name='philhealth_rate',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=5),
        ),
        migrations.AddField(
            model_name='hub',
            name='pagibig_rate',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=5),
        ),
    ]

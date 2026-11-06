from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0008_shelter'),
    ]

    operations = [
        migrations.AlterField(
            model_name='shelter',
            name='user',
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='shelter_record',
                to='auth.user',
            ),
        ),
    ]
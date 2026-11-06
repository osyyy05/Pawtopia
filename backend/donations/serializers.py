from rest_framework import serializers
from .models import Donation


class DonationSerializer(serializers.ModelSerializer):
    receipt_url = serializers.SerializerMethodField()

    class Meta:
        model = Donation
        fields = [
            'id',
            'donor',
            'full_name',
            'email',
            'phone',
            'amount',
            'shelter',
            'shelter_account',
            'payment_method',
            'receipt',
            'receipt_url',
            'transaction_id',
            'status',
            'vet_remark',
            'shelter_remark',
            'admin_remark',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'donor',
            'transaction_id',
            'status',
            'vet_remark',
            'admin_remark',
            'created_at',
            'updated_at',
            'receipt_url',
            'shelter_account',
            'shelter_remark',
        ]

    def get_receipt_url(self, obj):
        request = self.context.get('request')

        if obj.receipt:
            if request:
                return request.build_absolute_uri(obj.receipt.url)

            return obj.receipt.url

        return None
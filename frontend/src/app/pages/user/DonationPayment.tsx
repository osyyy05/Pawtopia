import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ArrowLeft, Upload, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'react-qr-code';

export default function DonationPayment() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    amount,
    shelter,
    paymentMethod,
    donorInfo
  } = location.state || {};

  const [receipt, setReceipt] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  if (!amount || !shelter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="bg-black/40 backdrop-blur-xl border-white/10 p-8">
          <p className="text-white text-center mb-4">
            Invalid payment information
          </p>

          <Link to="/user/donation">
            <Button className="w-full">
              Return to Donation Page
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Maximum 5MB
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('Receipt must be smaller than 5MB');
        e.target.value = '';
        return;
      }

      setReceipt(selectedFile);
    }
  };

  const handleSubmitReceipt = async () => {
    if (!receipt) {
      toast.error('Please upload a receipt');
      return;
    }

    const accessToken = sessionStorage.getItem('access_token');

    if (!accessToken) {
      toast.error('Please login before making a donation');
      navigate('/login');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();

      formData.append(
        'full_name',
        donorInfo?.name || ''
      );

      formData.append(
        'email',
        donorInfo?.email || ''
      );

      formData.append(
        'phone',
        donorInfo?.phone || ''
      );

      formData.append(
        'amount',
        String(amount)
      );

      formData.append(
        'shelter',
        shelter.name || ''
      );

      formData.append(
        'payment_method',
        paymentMethod || ''
      );

      formData.append(
        'receipt',
        receipt
      );

      const response = await fetch(
        'http://127.0.0.1:8000/api/donations/',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('Donation error:', data);

        const errorMessage =
          data?.detail ||
          data?.error ||
          data?.receipt?.[0] ||
          data?.amount?.[0] ||
          data?.full_name?.[0] ||
          'Failed to submit donation';

        throw new Error(errorMessage);
      }

      toast.success(
        'Donation submitted for verification!'
      );

      /*
       * The donation is NOT successful yet.
       *
       * It is now waiting for Vet verification.
       */
      navigate('/user/donation-pending', {
        state: {
          donation: data,
        },
      });

    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to submit donation'
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen">

      {/* Header */}
      <section className="bg-gradient-to-r from-amber-900/50 to-orange-900/50 backdrop-blur-xl border-b border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4">

          <Link to="/user/donation">
            <Button
              variant="ghost"
              className="bg-black/40 backdrop-blur-md text-white hover:bg-black/60 mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Donation
            </Button>
          </Link>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
            Complete Payment
          </h1>

          <p className="text-xl text-gray-300">
            Scan QR code to make your donation
          </p>

        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* QR Code Section */}
          <Card className="bg-black/40 backdrop-blur-xl border-white/10">

            <CardHeader>
              <CardTitle className="text-2xl text-white flex items-center gap-2">
                <QrCode className="w-6 h-6" />
                Scan to Pay
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">

              <div className="bg-white p-8 rounded-lg flex items-center justify-center">

                <QRCode
                  value={JSON.stringify({
                    shelter: shelter.name,
                    amount: amount,
                    paymentMethod: paymentMethod,
                    donor: donorInfo?.name || 'Anonymous',
                  })}
                  size={256}
                />

              </div>

              <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 p-4 rounded-lg border border-amber-500/30">

                <h3 className="text-white font-medium mb-2">
                  Payment Details
                </h3>

                <div className="space-y-2 text-sm">

                  <div className="flex justify-between">
                    <span className="text-gray-400">
                      Method:
                    </span>

                    <span className="text-white">
                      {paymentMethod}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-400">
                      Shelter:
                    </span>

                    <span className="text-white">
                      {shelter.name}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-white/20">

                    <span className="text-gray-400">
                      Amount:
                    </span>

                    <span className="text-3xl font-bold text-white">
                      RM {amount.toFixed(2)}
                    </span>

                  </div>

                </div>
              </div>

              <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4">

                <p className="text-sm text-blue-300">
                  Please scan the QR code using your preferred payment
                  app ({paymentMethod}) to complete the donation.
                </p>

              </div>

            </CardContent>
          </Card>


          {/* Receipt Upload Section */}
          <Card className="bg-black/40 backdrop-blur-xl border-white/10">

            <CardHeader>
              <CardTitle className="text-2xl text-white">
                Upload Receipt
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">

              <div>
                <p className="text-gray-300 mb-4">
                  After completing the payment, please upload a
                  screenshot or photo of your transaction receipt
                  for verification.
                </p>
              </div>

              <div className="space-y-4">

                <div className="space-y-2">

                  <Label
                    htmlFor="receipt"
                    className="text-white"
                  >
                    Transaction Receipt
                  </Label>

                  <div className="flex items-center gap-4">

                    <Input
                      id="receipt"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="bg-white/10 border-white/20 text-white
                      file:mr-4
                      file:px-4
                      file:py-2
                      file:rounded-full
                      file:border-0
                      file:bg-amber-600
                      file:text-white
                      file:font-semibold
                      hover:file:bg-amber-700"
                    />

                  </div>

                  {receipt && (
                    <p className="text-sm text-green-400 flex items-center gap-2">

                      <Upload className="w-4 h-4" />

                      {receipt.name}

                    </p>
                  )}

                </div>


                <div className="bg-white/5 p-4 rounded-lg border border-white/10">

                  <h4 className="text-white font-medium mb-2">
                    Upload Guidelines:
                  </h4>

                  <ul className="text-sm text-gray-400 space-y-1">

                    <li>
                      • Ensure the receipt shows the transaction amount
                    </li>

                    <li>
                      • Image should be clear and readable
                    </li>

                    <li>
                      • Accepted formats: JPG, PNG
                    </li>

                    <li>
                      • Maximum file size: 5MB
                    </li>

                  </ul>

                </div>


                <Button
                  onClick={handleSubmitReceipt}
                  disabled={!receipt || uploading}
                  className="w-full h-12 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:opacity-50"
                >

                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />

                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />

                      Submit Receipt
                    </>
                  )}

                </Button>

              </div>

            </CardContent>

          </Card>

        </div>

      </div>
    </div>
  );
}
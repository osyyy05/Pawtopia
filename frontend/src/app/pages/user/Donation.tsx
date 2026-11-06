import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { RadioGroup } from '../../components/ui/radio-group';
import { Checkbox } from '../../components/ui/checkbox';
import { Heart, CreditCard, Smartphone, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const presetAmounts = [10, 20, 50, 100, 200];

const paymentMethods = [
  { id: 'tng', name: 'Touch \'n Go eWallet', icon: Smartphone },
  { id: 'duitnow', name: 'DuitNow QR', icon: Smartphone },
  { id: 'credit', name: 'Credit Card', icon: CreditCard },
  { id: 'debit', name: 'Debit Card', icon: CreditCard },
];

export default function Donation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [shelters, setShelters] = useState<any[]>([]);
  const [loadingShelters, setLoadingShelters] = useState(true);
  const [formData, setFormData] = useState({
    shelter: '',
    amount: '',
    customAmount: '',
    name: '',
    email: user?.email || '',
    phone: '',
    anonymous: false,
    paymentMethod: 'tng'
  });

  useEffect(() => {
  const fetchShelters = async () => {
    try {
      setLoadingShelters(true);

      const token = sessionStorage.getItem('access_token');

      const response = await fetch(
        'http://127.0.0.1:8000/api/shelters/',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load shelters');
      }

      const data = await response.json();

      setShelters(Array.isArray(data) ? data : []);

      if (Array.isArray(data) && data.length > 0) {
        setFormData(prev => ({
          ...prev,
          shelter: String(data[0].id),
        }));
      }
    } catch (error) {
      console.error('Error loading shelters:', error);
      toast.error('Unable to load shelters');
    } finally {
      setLoadingShelters(false);
    }
  };

  fetchShelters();
}, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = sessionStorage.getItem('access_token');

      if (!token || !user) return;

      try {
        const response = await fetch(
          'http://127.0.0.1:8000/api/profile/',
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to load user profile');
        }

        const data = await response.json();

        setFormData(prev => ({
          ...prev,
          name: data.full_name || '',
          email: data.email || user.email || '',
          phone: data.phone || '',
        }));

      } catch (error) {
        console.error('Error loading donation user details:', error);
        toast.error('Unable to retrieve profile details');
      }
    };

    fetchUserProfile();
  }, [user]);

  const selectedAmount = formData.amount === 'custom' 
    ? parseFloat(formData.customAmount) 
    : parseFloat(formData.amount);

  const handleNext = () => {
    if (step === 1) {
      const amount =
        formData.amount === 'custom'
          ? parseFloat(formData.customAmount)
          : parseFloat(formData.amount);

      if (!amount || isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid donation amount');
        return;
      }
    }

    if (step === 2 && (!formData.name || !formData.email)) {
      toast.error('Please fill in all required fields');
      return;
    }

    setStep(prev => Math.min(prev + 1, 3));
  };

  const handleDonate = () => {
    navigate('/user/donation-payment', {
      state: {
        amount: selectedAmount,
        shelter: selectedShelter,
        paymentMethod: formData.paymentMethod,
        donorInfo: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          anonymous: formData.anonymous
        }
      }
    });
  };

  const selectedShelter = shelters.find(
    s => String(s.id) === String(formData.shelter)
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-r from-amber-900/50 to-orange-900/50 backdrop-blur-xl border-b border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight whitespace-normal break-words bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
            Support Our Shelters
          </h1>

          <p className="text-xl text-gray-300">
            Your donation helps provide food, medical care, and shelter for animals in need
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Progress */}
        <div className="mb-8 flex items-center justify-center gap-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= s ? 'bg-gradient-to-r from-amber-600 to-orange-600' : 'bg-white/10'
              }`}>
                {step > s ? <CheckCircle2 className="w-5 h-5 text-white" /> : s}
              </div>
              {s < 3 && <div className={`w-20 h-1 ${step > s ? 'bg-gradient-to-r from-amber-600 to-orange-600' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        <Card className="bg-black/40 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-2xl text-white">
              {step === 1 && 'Select Amount'}
              {step === 2 && 'Your Information'}
              {step === 3 && 'Payment Method'}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {step === 1 && 'Choose your donation amount'}
              {step === 2 && 'Please provide your contact information'}
              {step === 3 && 'Select how you would like to pay'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 && (
              <>
                {/* Shelter Selection */}
                <div className="space-y-2">
                  <Label className="text-white">Select Shelter</Label>

                  {loadingShelters ? (
                    <p className="text-gray-400">
                      Loading shelters...
                    </p>
                  ) : shelters.length === 0 ? (
                    <p className="text-gray-400">
                      No shelters available.
                    </p>
                  ) : (
                    <RadioGroup
                      value={formData.shelter}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          shelter: value,
                        })
                      }
                    >
                      {shelters.map((shelter) => (
                        <div
                          key={shelter.id}
                          onClick={() =>
                            setFormData({
                              ...formData,
                              shelter: String(shelter.id),
                            })
                          }
                          className={`flex items-start space-x-3 p-4 rounded-lg border transition-all cursor-pointer ${
                            String(formData.shelter) === String(shelter.id)
                              ? 'border-purple-500 bg-purple-600/20 text-white'
                              : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          <Label
                            htmlFor={String(shelter.id)}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="text-white font-medium">
                              {shelter.name}
                            </div>

                            <div className="text-sm text-gray-400">
                              {shelter.address}
                            </div>

                            <div className="text-sm text-gray-500 mt-1">
                              Currently caring for {shelter.current_animals} animals
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                </div>

                {/* Preset Amounts */}
                <div className="space-y-2">
                  <Label className="text-white">Donation Amount</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {presetAmounts.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setFormData({...formData, amount: amount.toString()})}
                        className={`p-4 rounded-lg border transition-all ${
                          formData.amount === amount.toString()
                            ? 'border-purple-500 bg-purple-600/20 text-white'
                            : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="text-2xl font-bold text-white">RM{amount}</div>
                      </button>
                    ))}
                  </div>
                </div>

                  {/* Custom Amount */}
                  <div className="space-y-2">
                    <div
                      className={`flex items-center gap-3 cursor-pointer p-4 rounded-lg border transition-all ${
                        formData.amount === 'custom'
                          ? 'border-purple-500 bg-purple-600/20 text-white'
                          : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                      onClick={() => setFormData({ ...formData, amount: 'custom' })}
                    >
                      <Label className="text-white cursor-pointer">
                        Custom Amount
                      </Label>
                    </div>

                    {formData.amount === 'custom' && (
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                          RM
                        </span>
                        <Input
                          type="number"
                          placeholder="Enter amount"
                          value={formData.customAmount}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              customAmount: e.target.value,
                            })
                          }
                          className="pl-12 bg-white/10 border-white/20 text-white focus:border-purple-500 focus:ring-purple-500/20"
                          style={{ outline: 'none' }}
                        />
                      </div>
                    )}
                  </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="name" className="text-white">Full Name</Label>
                    <Input
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white">Phone No</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="anonymous"
                    checked={formData.anonymous}
                    onCheckedChange={(checked) => setFormData({...formData, anonymous: checked as boolean})}
                  />
                  <Label htmlFor="anonymous" className="text-white cursor-pointer">
                    Make this donation anonymous
                  </Label>
                </div>

                {/* Summary */}
                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <h3 className="text-white font-medium mb-2">Donation Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Shelter:</span>
                      <span className="text-white">{selectedShelter?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Amount:</span>
                      <span className="text-white font-bold">RM {selectedAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <RadioGroup
                  value={formData.paymentMethod}
                  onValueChange={(value) => setFormData({...formData, paymentMethod: value})}
                >
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <div
                        key={method.id}
                        onClick={() =>
                          setFormData({ ...formData, paymentMethod: method.id })
                        }
                        className={`flex items-center space-x-3 p-4 rounded-lg border transition-all cursor-pointer ${
                          formData.paymentMethod === method.id
                            ? 'border-purple-500 bg-purple-600/20 text-white'
                            : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        <Label
                          htmlFor={method.id}
                          className="flex-1 cursor-pointer flex items-center gap-3"
                        >
                          <Icon className="w-5 h-5 text-cyan-400" />
                          <span className="text-white">{method.name}</span>
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>

                {/* Final Summary */}
                <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 p-6 rounded-lg border border-amber-500/30">
                  <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-amber-400" />
                    Your Donation
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Beneficiary:</span>
                      <span className="text-white">{selectedShelter?.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Donor:</span>
                      <span className="text-white">{formData.anonymous ? 'Anonymous' : formData.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Payment Method:</span>
                      <span className="text-white">
                        {paymentMethods.find(m => m.id === formData.paymentMethod)?.name}
                      </span>
                    </div>
                    <div className="pt-3 border-t border-white/20">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Total Amount:</span>
                        <span className="text-3xl font-bold text-white">RM {selectedAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              {step > 1 && (
                <Button
                  onClick={() => setStep(step - 1)}
                  variant="outline"
                  className="border-white/40 text-gray-200 hover:bg-white/10 hover:text-white"
                >
                  Back
                </Button>
              )}
              {step < 3 ? (
                <Button
                  onClick={handleNext}
                  className="ml-auto bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                >
                  Continue
                </Button>
              ) : (
                <Button
                  onClick={handleDonate}
                  className="ml-auto bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                >
                  <Heart className="w-5 h-5 mr-2" />
                  Donate RM {selectedAmount.toFixed(2)}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
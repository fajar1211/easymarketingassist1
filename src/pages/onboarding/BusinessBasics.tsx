import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { businessTypeCategories } from '@/data/businessTypes';
import { countries, type Country } from '@/data/countries';

export default function BusinessBasics() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    country: '',
    city: '',
    phoneCode: '',
    phoneNumber: '',
  });
  const [businessId, setBusinessId] = useState('');
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  useEffect(() => {
    const storedBusinessId = sessionStorage.getItem('onboarding_businessId');
    if (storedBusinessId) {
      setBusinessId(storedBusinessId);
    }
  }, []);

  useEffect(() => {
    if (formData.country) {
      const countryData = countries.find((c: Country) => c.name === formData.country);
      setAvailableCities(countryData?.cities || []);
      // Auto-set phone code when country changes
      if (countryData?.phoneCode && !formData.phoneCode) {
        setFormData(prev => ({ ...prev, phoneCode: countryData.phoneCode, city: '' }));
      } else {
        setFormData(prev => ({ ...prev, city: '' }));
      }
    }
  }, [formData.country]);

  const isFormValid = 
    formData.businessName.trim() && 
    formData.businessType && 
    formData.country && 
    formData.city && 
    formData.phoneNumber.trim();

  const handleContinue = () => {
    // Combine phone code and number
    const fullPhoneNumber = `${formData.phoneCode} ${formData.phoneNumber}`.trim();
    
    // Store in sessionStorage for use in later steps
    sessionStorage.setItem('onboarding_businessName', formData.businessName.trim());
    sessionStorage.setItem('onboarding_businessType', formData.businessType);
    sessionStorage.setItem('onboarding_country', formData.country);
    sessionStorage.setItem('onboarding_city', formData.city);
    sessionStorage.setItem('onboarding_phoneNumber', fullPhoneNumber);
    navigate('/onboarding/online-presence');
  };

  // Get unique phone codes for dropdown
  const phoneCodes = [...new Set(countries.map(c => c.phoneCode))].sort();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/30 px-4 py-12">
      <Button
        variant="ghost"
        onClick={() => navigate('/onboarding/business-stage')}
        className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="w-full max-w-lg space-y-8 animate-fade-in">
        {/* Progress indicator */}
        <div className="flex justify-center gap-2">
          <div className="h-2 w-8 rounded-full bg-primary" />
          <div className="h-2 w-8 rounded-full bg-primary" />
          <div className="h-2 w-8 rounded-full bg-muted" />
          <div className="h-2 w-8 rounded-full bg-muted" />
        </div>

        <Card className="shadow-soft">
          <CardHeader className="text-center">
            <div className="text-sm font-medium text-primary mb-2">STEP 2</div>
            <CardTitle className="text-2xl">Business Basics</CardTitle>
            <CardDescription>
              Tell us about your business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="businessId">Business ID</Label>
              <Input
                id="businessId"
                value={businessId || 'Will be generated after you complete setup'}
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name <span className="text-destructive">*</span></Label>
              <Input
                id="businessName"
                placeholder="My Awesome Business"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Business Type <span className="text-destructive">*</span></Label>
              <Select
                value={formData.businessType}
                onValueChange={(value) => setFormData({ ...formData, businessType: value })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent className="bg-popover border z-50 max-h-[300px]">
                  {businessTypeCategories.map((category) => (
                    <SelectGroup key={category.category}>
                      <SelectLabel className="font-semibold text-foreground">{category.category}</SelectLabel>
                      {category.types.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Country <span className="text-destructive">*</span></Label>
              <Select
                value={formData.country}
                onValueChange={(value) => setFormData({ ...formData, country: value })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent className="bg-popover border z-50 max-h-[300px]">
                  {countries.map((country: Country) => (
                    <SelectItem key={country.code} value={country.name}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>City <span className="text-destructive">*</span></Label>
              <Select
                value={formData.city}
                onValueChange={(value) => setFormData({ ...formData, city: value })}
                disabled={!formData.country}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={formData.country ? "Select city" : "Select country first"} />
                </SelectTrigger>
                <SelectContent className="bg-popover border z-50 max-h-[300px]">
                  {availableCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number <span className="text-destructive">*</span></Label>
              <div className="flex gap-2">
                <Select
                  value={formData.phoneCode}
                  onValueChange={(value) => setFormData({ ...formData, phoneCode: value })}
                >
                  <SelectTrigger className="w-[100px] bg-background">
                    <SelectValue placeholder="+1" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border z-50 max-h-[300px]">
                    {phoneCodes.map((code) => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="phoneNumber"
                  placeholder="234 567 8900"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>

            <Button
              size="lg"
              className="w-full mt-4"
              disabled={!isFormValid}
              onClick={handleContinue}
            >
              Next Step
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

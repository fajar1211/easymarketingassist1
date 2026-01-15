import { useEffect, useState, useRef } from 'react';
import { Save, Building2, FileText, User, Users, ArrowLeft, Pencil, X, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RichTextEditor } from '@/components/dashboard/RichTextEditor';
import { SocialMediaInput, SocialMediaLink } from '@/components/dashboard/SocialMediaInput';
import { countries } from '@/data/countries';
import { businessTypeCategories } from '@/data/businessTypes';

interface BusinessData {
  name: string;
  business_type: string;
  country: string;
  city: string;
  business_address: string;
  website_url: string;
  gmb_link: string;
  email: string;
  phone: string;
  phoneCode: string;
  phoneNumber: string;
  first_name: string;
  last_name: string;
  social_media_links: SocialMediaLink[];
  businessId: string;
  hours: { day: string; opensAt: string; closesAt: string; }[];
}

interface KnowledgeBaseData {
  bkb: string;
  brandExpert: string;
  persona1: string;
  persona2: string;
  persona3: string;
  persona1Title: string;
  persona2Title: string;
  persona3Title: string;
}

type KBEditingState = {
  bkb: boolean;
  brandExpert: boolean;
  persona1: boolean;
  persona2: boolean;
  persona3: boolean;
};

const DRAFT_STORAGE_KEY = 'business_details_draft';
const KB_DRAFT_STORAGE_KEY = 'kb_draft';

export default function MyBusiness() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingKB, setSavingKB] = useState(false);
  const [currentView, setCurrentView] = useState<'details' | 'knowledge-base'>('details');
  const [isEditing, setIsEditing] = useState(false);
  
  // Original data from database (to restore on cancel)
  const [originalFormData, setOriginalFormData] = useState<BusinessData | null>(null);
  const [originalKbData, setOriginalKbData] = useState<KnowledgeBaseData | null>(null);
  
  const [formData, setFormData] = useState<BusinessData>({
    name: '',
    business_type: '',
    country: '',
    city: '',
    business_address: '',
    website_url: '',
    gmb_link: '',
    email: '',
    phone: '',
    phoneCode: '',
    phoneNumber: '',
    first_name: '',
    last_name: '',
    social_media_links: [],
    businessId: '',
    hours: [],
  });
  
  const [newHour, setNewHour] = useState({ day: '', opensAt: '', closesAt: '' });
  const [kbData, setKbData] = useState<KnowledgeBaseData>({
    bkb: '',
    brandExpert: '',
    persona1: '',
    persona2: '',
    persona3: '',
    persona1Title: 'My Persona 1',
    persona2Title: 'My Persona 2',
    persona3Title: 'My Persona 3',
  });
  const [kbEditingState, setKbEditingState] = useState<KBEditingState>({
    bkb: true,
    brandExpert: true,
    persona1: true,
    persona2: true,
    persona3: true,
  });

  const selectedCountry = countries.find(c => c.name === formData.country);
  const cities = selectedCountry?.cities || [];
  const phoneCodes = [...new Set(countries.map(c => c.phoneCode))].sort();

  // Load draft from localStorage on mount
  useEffect(() => {
    if (user) {
      const savedDraft = localStorage.getItem(`${DRAFT_STORAGE_KEY}_${user.id}`);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          setFormData(prev => ({ ...prev, ...parsed }));
        } catch (e) {
          console.error('Failed to parse draft');
        }
      }
      
      const savedKbDraft = localStorage.getItem(`${KB_DRAFT_STORAGE_KEY}_${user.id}`);
      if (savedKbDraft) {
        try {
          const parsed = JSON.parse(savedKbDraft);
          setKbData(prev => ({ ...prev, ...parsed }));
        } catch (e) {
          console.error('Failed to parse KB draft');
        }
      }
    }
  }, [user]);

  // Save draft to localStorage whenever form data changes (only when editing)
  useEffect(() => {
    if (user && isEditing && originalFormData) {
      localStorage.setItem(`${DRAFT_STORAGE_KEY}_${user.id}`, JSON.stringify(formData));
    }
  }, [formData, user, isEditing, originalFormData]);

  // Save KB draft to localStorage whenever KB data changes
  useEffect(() => {
    if (user && originalKbData) {
      const hasChanges = JSON.stringify(kbData) !== JSON.stringify(originalKbData);
      if (hasChanges) {
        localStorage.setItem(`${KB_DRAFT_STORAGE_KEY}_${user.id}`, JSON.stringify(kbData));
      }
    }
  }, [kbData, user, originalKbData]);

  useEffect(() => {
    const fetchBusiness = async () => {
      if (!user) return;

      // Check for synced data from onboarding
      const syncFirstName = sessionStorage.getItem('sync_firstName');
      const syncLastName = sessionStorage.getItem('sync_lastName');
      
      // Clear after reading
      if (syncFirstName) sessionStorage.removeItem('sync_firstName');
      if (syncLastName) sessionStorage.removeItem('sync_lastName');

      const { data } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // Fetch profile for phone number
      const { data: profileData } = await supabase
        .from('profiles')
        .select('phone, name')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        // Parse social media links
        let socialLinks: SocialMediaLink[] = [];
        if (Array.isArray((data as any).social_links)) {
          socialLinks = ((data as any).social_links as any[]).map((link: any) => {
            if (typeof link === 'string') {
              const platform = detectPlatform(link);
              return { platform, url: link };
            }
            return link as SocialMediaLink;
          });
        }

        // Use country and city directly
        const city = (data as any).city || '';
        const country = (data as any).country || '';

        // Parse phone into code and number
        const fullPhone = profileData?.phone || '';
        let phoneCode = '';
        let phoneNumber = fullPhone;
        
        // Try to extract phone code
        const phoneMatch = fullPhone.match(/^(\+\d+)\s*(.*)$/);
        if (phoneMatch) {
          phoneCode = phoneMatch[1];
          phoneNumber = phoneMatch[2];
        }

        // Parse name into first and last
        const nameParts = (profileData?.name || '').split(' ');
        const firstName = syncFirstName || nameParts[0] || '';
        const lastName = syncLastName || nameParts.slice(1).join(' ') || '';

        const businessNumber = (data as any).business_number as number | null;
        const businessId = businessNumber ? `B${businessNumber.toString().padStart(5, '0')}` : '';

        const dbFormData: BusinessData = {
          name: (data as any).business_name || '',
          business_type: (data as any).business_type || '',
          country: country,
          city: city,
          business_address: (data as any).business_address || '',
          website_url: (data as any).website_url || '',
          gmb_link: (data as any).gmb_link || '',
          email: user.email || '',
          phone: fullPhone,
          phoneCode: phoneCode,
          phoneNumber: phoneNumber,
          first_name: firstName,
          last_name: lastName,
          social_media_links: socialLinks,
          businessId,
          hours: Array.isArray((data as any).hours) ? (data as any).hours : [],
        };
        
        setOriginalFormData(dbFormData);
        
        // Check if there's a draft, if not use db data
        const savedDraft = localStorage.getItem(`${DRAFT_STORAGE_KEY}_${user.id}`);
        if (!savedDraft) {
          setFormData(dbFormData);
        }

        // Load KB data from database
        const dbKbData: KnowledgeBaseData = {
          bkb: (data as any).bkb_content || '',
          brandExpert: (data as any).brand_expert_content || '',
          persona1: (data as any).persona1_content || '',
          persona2: (data as any).persona2_content || '',
          persona3: (data as any).persona3_content || '',
          persona1Title: (data as any).persona1_title || 'My Persona 1',
          persona2Title: (data as any).persona2_title || 'My Persona 2',
          persona3Title: (data as any).persona3_title || 'My Persona 3',
        };
        
        setOriginalKbData(dbKbData);
        
        // Check if there's a KB draft
        const kbDraft = localStorage.getItem(`${KB_DRAFT_STORAGE_KEY}_${user.id}`);
        if (!kbDraft) {
          setKbData(dbKbData);
        }
        
        // Set editing state based on saved data
        const hasData = Object.values(dbKbData).some((val: any) => val && val.length > 0);
        if (hasData) {
          setKbEditingState({
            bkb: !dbKbData.bkb,
            brandExpert: !dbKbData.brandExpert,
            persona1: !dbKbData.persona1,
            persona2: !dbKbData.persona2,
            persona3: !dbKbData.persona3,
          });
        }
      } else {
        const defaultData = {
          ...formData,
          email: user.email || '',
          first_name: syncFirstName || '',
          last_name: syncLastName || '',
          businessId: formData.businessId || '',
        };
        setFormData(defaultData);
        setOriginalFormData(defaultData);
        
        const defaultKbData: KnowledgeBaseData = {
          bkb: '',
          brandExpert: '',
          persona1: '',
          persona2: '',
          persona3: '',
          persona1Title: 'My Persona 1',
          persona2Title: 'My Persona 2',
          persona3Title: 'My Persona 3',
        };
        setOriginalKbData(defaultKbData);
      }
      
      setLoading(false);
    };

    fetchBusiness();
  }, [user]);

  const detectPlatform = (url: string): string => {
    const lowercaseUrl = url.toLowerCase();
    if (lowercaseUrl.includes('facebook')) return 'facebook';
    if (lowercaseUrl.includes('instagram')) return 'instagram';
    if (lowercaseUrl.includes('twitter') || lowercaseUrl.includes('x.com')) return 'twitter';
    if (lowercaseUrl.includes('threads')) return 'threads';
    if (lowercaseUrl.includes('linkedin')) return 'linkedin';
    if (lowercaseUrl.includes('tiktok')) return 'tiktok';
    if (lowercaseUrl.includes('youtube')) return 'youtube';
    return 'facebook';
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const location = formData.city && formData.country 
        ? `${formData.city}, ${formData.country}` 
        : formData.country || formData.city || null;

      const fullPhone = `${formData.phoneCode} ${formData.phoneNumber}`.trim();

      const { error } = await supabase
        .from('businesses')
        .update({
          business_name: formData.name || null,
          business_type: formData.business_type || null,
          country: formData.country || null,
          city: formData.city || null,
          business_address: formData.business_address || null,
          website_url: formData.website_url, // Allow empty string
          gmb_link: formData.gmb_link || null,
          social_links: formData.social_media_links as any,
          hours: formData.hours as any,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Update profile with name and phone
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: `${formData.first_name} ${formData.last_name}`.trim(),
          phone: fullPhone || null,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Clear draft after successful save
      localStorage.removeItem(`${DRAFT_STORAGE_KEY}_${user.id}`);
      
      // Update original data to current data
      setOriginalFormData(formData);
      setIsEditing(false);
      
      toast({
        title: 'Saved!',
        description: 'Your business information has been updated.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Restore original data and clear draft
    if (originalFormData) {
      setFormData(originalFormData);
    }
    if (user) {
      localStorage.removeItem(`${DRAFT_STORAGE_KEY}_${user.id}`);
    }
    setIsEditing(false);
  };

  const handleSaveKB = async (field: keyof KnowledgeBaseData) => {
    if (!user) return;
    
    setSavingKB(true);
    try {
      // Map field names to database columns
      const fieldToColumn: Record<string, string> = {
        bkb: 'bkb_content',
        brandExpert: 'brand_expert_content',
        persona1: 'persona1_content',
        persona2: 'persona2_content',
        persona3: 'persona3_content',
        persona1Title: 'persona1_title',
        persona2Title: 'persona2_title',
        persona3Title: 'persona3_title',
      };
      
      const columnName = fieldToColumn[field];
      if (!columnName) return;
      
      const updateData: Record<string, string> = {
        [columnName]: kbData[field],
      };
      
      const { error } = await supabase
        .from('businesses')
        .update(updateData)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Update original KB data
      setOriginalKbData(prev => prev ? { ...prev, [field]: kbData[field] } : null);
      
      // Clear KB draft for this field
      const draftData = localStorage.getItem(`${KB_DRAFT_STORAGE_KEY}_${user.id}`);
      if (draftData) {
        const draftParsed = JSON.parse(draftData);
        delete draftParsed[field];
        if (Object.keys(draftParsed).length === 0) {
          localStorage.removeItem(`${KB_DRAFT_STORAGE_KEY}_${user.id}`);
        } else {
          localStorage.setItem(`${KB_DRAFT_STORAGE_KEY}_${user.id}`, JSON.stringify(draftParsed));
        }
      }
      
      // After saving, disable editing for content fields
      if (['bkb', 'brandExpert', 'persona1', 'persona2', 'persona3'].includes(field)) {
        setKbEditingState(prev => ({ ...prev, [field]: false }));
      }
      
      toast({
        title: 'Saved!',
        description: 'Knowledge base content has been saved.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save content.',
      });
    } finally {
      setSavingKB(false);
    }
  };

  const handlePersonaTitleChange = async (persona: 'persona1Title' | 'persona2Title' | 'persona3Title', newTitle: string) => {
    setKbData(prev => ({ ...prev, [persona]: newTitle }));
    // Auto-save title change
    await handleSaveKBTitle(persona, newTitle);
  };

  const handleSaveKBTitle = async (field: string, value: string) => {
    if (!user) return;
    
    try {
      const fieldToColumn: Record<string, string> = {
        persona1Title: 'persona1_title',
        persona2Title: 'persona2_title',
        persona3Title: 'persona3_title',
      };
      
      const columnName = fieldToColumn[field];
      if (!columnName) return;
      
      const { error } = await supabase
        .from('businesses')
        .update({ [columnName]: value })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setOriginalKbData(prev => prev ? { ...prev, [field]: value } : null);
      
      toast({
        title: 'Title Updated!',
        description: 'Persona title has been saved.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save title.',
      });
    }
  };

  const handleEditKB = (field: keyof KnowledgeBaseData) => {
    setKbEditingState(prev => ({ ...prev, [field]: true }));
  };

  const handleBackToDetails = () => {
    // Restore KB data from original (discard draft changes)
    if (originalKbData) {
      setKbData(originalKbData);
    }
    if (user) {
      localStorage.removeItem(`${KB_DRAFT_STORAGE_KEY}_${user.id}`);
    }
    setCurrentView('details');
  };

  const handleCountryChange = (country: string) => {
    const countryData = countries.find(c => c.name === country);
    setFormData(prev => ({
      ...prev,
      country,
      city: '', // Reset city when country changes
      phoneCode: countryData?.phoneCode || prev.phoneCode, // Auto-set phone code
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Business</h1>
        <p className="text-muted-foreground">Manage your business information</p>
      </div>

      {currentView === 'details' ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Business Details</CardTitle>
                  <CardDescription>Update your business information anytime</CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <Button 
                    variant="outline" 
                    onClick={handleCancelEdit}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentView('knowledge-base')}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  View Details
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="business_id">Business ID</Label>
              <Input
                id="business_id"
                value={formData.businessId || 'Will be generated after onboarding'}
                disabled
              />
            </div>

            {/* Contact Information */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="John"
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Doe"
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex gap-2">
                  <Select 
                    value={formData.phoneCode} 
                    onValueChange={(value) => setFormData({ ...formData, phoneCode: value })}
                    disabled={!isEditing}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="+1" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border max-h-60 z-50">
                      {phoneCodes.map((code) => (
                        <SelectItem key={code} value={code}>
                          {code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="234 567 8900"
                    disabled={!isEditing}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Business Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your Business Name"
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Business Type</Label>
                <Select 
                  value={formData.business_type} 
                  onValueChange={(value) => setFormData({ ...formData, business_type: value })}
                  disabled={!isEditing}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border max-h-80 z-50">
                    {businessTypeCategories.map((category) => (
                      <SelectGroup key={category.category}>
                        <SelectLabel className="font-semibold text-primary py-2">
                          {category.category}
                        </SelectLabel>
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
            </div>

            {/* Country, City, and Business Address */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select 
                  value={formData.country} 
                  onValueChange={handleCountryChange}
                  disabled={!isEditing}
                >
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border max-h-60 z-50">
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.name}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Select 
                  value={formData.city} 
                  onValueChange={(city) => setFormData({ ...formData, city })}
                  disabled={!formData.country || !isEditing}
                >
                  <SelectTrigger id="city">
                    <SelectValue placeholder={formData.country ? "Select a city" : "Select a country first"} />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border max-h-60 z-50">
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="business_address">Business Address</Label>
                <Input
                  id="business_address"
                  value={formData.business_address}
                  onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
                  placeholder="123 Business St"
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website URL</Label>
              <Input
                id="website"
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                placeholder="https://yourbusiness.com"
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gmb">Google Business Profile Link</Label>
              <Input
                id="gmb"
                value={formData.gmb_link}
                onChange={(e) => setFormData({ ...formData, gmb_link: e.target.value })}
                placeholder="https://g.page/..."
                disabled={!isEditing}
              />
            </div>

            {/* Social Media Links */}
            <div className={!isEditing ? 'pointer-events-none opacity-70' : ''}>
              <SocialMediaInput
                links={formData.social_media_links}
                onChange={(links) => setFormData({ ...formData, social_media_links: links })}
              />
            </div>

            {/* Hours Section */}
            <div className="space-y-4">
              <Label>Business Hours</Label>
              {formData.hours.length > 0 && (
                <div className="space-y-2">
                  {formData.hours.map((hour, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                      <span className="font-medium min-w-[100px]">{hour.day}</span>
                      <span className="text-sm text-muted-foreground">{hour.opensAt} - {hour.closesAt}</span>
                      {isEditing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFormData({ ...formData, hours: formData.hours.filter((_, i) => i !== index) })}
                          className="ml-auto"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {isEditing && (
                <div className="grid gap-2 md:grid-cols-4">
                  <Select value={newHour.day} onValueChange={(v) => setNewHour({ ...newHour, day: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Day" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monday">Monday</SelectItem>
                      <SelectItem value="Tuesday">Tuesday</SelectItem>
                      <SelectItem value="Wednesday">Wednesday</SelectItem>
                      <SelectItem value="Thursday">Thursday</SelectItem>
                      <SelectItem value="Friday">Friday</SelectItem>
                      <SelectItem value="Saturday">Saturday</SelectItem>
                      <SelectItem value="Sunday">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={newHour.opensAt} onValueChange={(v) => setNewHour({ ...newHour, opensAt: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Opens At" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {Array.from({ length: 24 }, (_, i) => i).map(hour => 
                        ['00', '30'].map(min => {
                          const time = `${String(hour).padStart(2, '0')}:${min}`;
                          return <SelectItem key={time} value={time}>{time}</SelectItem>;
                        })
                      )}
                    </SelectContent>
                  </Select>
                  <Select value={newHour.closesAt} onValueChange={(v) => setNewHour({ ...newHour, closesAt: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Closes At" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {Array.from({ length: 24 }, (_, i) => i).map(hour => 
                        ['00', '30'].map(min => {
                          const time = `${String(hour).padStart(2, '0')}:${min}`;
                          return <SelectItem key={time} value={time}>{time}</SelectItem>;
                        })
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (newHour.day && newHour.opensAt && newHour.closesAt) {
                        setFormData({ ...formData, hours: [...formData.hours, newHour] });
                        setNewHour({ day: '', opensAt: '', closesAt: '' });
                      }
                    }}
                    disabled={!newHour.day || !newHour.opensAt || !newHour.closesAt}
                  >
                    <Plus className="h-4 w-4 mr-2" />Add
                  </Button>
                </div>
              )}
            </div>

            {isEditing && (
              <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Business Knowledge Base</CardTitle>
                  <CardDescription>Manage your business knowledge documents</CardDescription>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={handleBackToDetails}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Details
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="bkb" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="bkb" className="text-xs">My BKB</TabsTrigger>
                <TabsTrigger value="be" className="text-xs">Brand Expert</TabsTrigger>
                <TabsTrigger value="persona1" className="text-xs">Persona 1</TabsTrigger>
                <TabsTrigger value="persona2" className="text-xs">Persona 2</TabsTrigger>
                <TabsTrigger value="persona3" className="text-xs">Persona 3</TabsTrigger>
              </TabsList>
              <TabsContent value="bkb" className="mt-6">
                <RichTextEditor
                  title="My Business Knowledge Base (BKB)"
                  description="Core information about your business"
                  value={kbData.bkb}
                  onChange={(value) => setKbData(prev => ({ ...prev, bkb: value }))}
                  onSave={() => handleSaveKB('bkb')}
                  onEdit={() => handleEditKB('bkb')}
                  saving={savingKB}
                  isEditing={kbEditingState.bkb}
                  icon={FileText}
                />
              </TabsContent>
              <TabsContent value="be" className="mt-6">
                <RichTextEditor
                  title="My Brand Expert (BE)"
                  description="Your brand voice and expertise guidelines"
                  value={kbData.brandExpert}
                  onChange={(value) => setKbData(prev => ({ ...prev, brandExpert: value }))}
                  onSave={() => handleSaveKB('brandExpert')}
                  onEdit={() => handleEditKB('brandExpert')}
                  saving={savingKB}
                  isEditing={kbEditingState.brandExpert}
                  icon={User}
                />
              </TabsContent>
              <TabsContent value="persona1" className="mt-6">
                <RichTextEditor
                  title={kbData.persona1Title}
                  description="First target customer persona"
                  value={kbData.persona1}
                  onChange={(value) => setKbData(prev => ({ ...prev, persona1: value }))}
                  onSave={() => handleSaveKB('persona1')}
                  onEdit={() => handleEditKB('persona1')}
                  saving={savingKB}
                  isEditing={kbEditingState.persona1}
                  icon={Users}
                  editableTitle={true}
                  onTitleChange={(newTitle) => handlePersonaTitleChange('persona1Title', newTitle)}
                />
              </TabsContent>
              <TabsContent value="persona2" className="mt-6">
                <RichTextEditor
                  title={kbData.persona2Title}
                  description="Second target customer persona"
                  value={kbData.persona2}
                  onChange={(value) => setKbData(prev => ({ ...prev, persona2: value }))}
                  onSave={() => handleSaveKB('persona2')}
                  onEdit={() => handleEditKB('persona2')}
                  saving={savingKB}
                  isEditing={kbEditingState.persona2}
                  icon={Users}
                  editableTitle={true}
                  onTitleChange={(newTitle) => handlePersonaTitleChange('persona2Title', newTitle)}
                />
              </TabsContent>
              <TabsContent value="persona3" className="mt-6">
                <RichTextEditor
                  title={kbData.persona3Title}
                  description="Third target customer persona"
                  value={kbData.persona3}
                  onChange={(value) => setKbData(prev => ({ ...prev, persona3: value }))}
                  onSave={() => handleSaveKB('persona3')}
                  onEdit={() => handleEditKB('persona3')}
                  saving={savingKB}
                  isEditing={kbEditingState.persona3}
                  icon={Users}
                  editableTitle={true}
                  onTitleChange={(newTitle) => handlePersonaTitleChange('persona3Title', newTitle)}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

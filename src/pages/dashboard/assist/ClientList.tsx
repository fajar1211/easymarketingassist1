import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Eye, ArrowLeft, Building2, BookOpen, Image, FileText, Package, Settings,
  Copy, Save, Pencil, ImageIcon, Video, FileIcon, Upload, Trash2, Grid, List,
  User, Lock, Mail, ExternalLink, EyeOff, X
} from 'lucide-react';
import { RichTextEditor } from '@/components/dashboard/RichTextEditor';
import { SocialMediaInput, SocialMediaLink } from '@/components/dashboard/SocialMediaInput';
import { countries } from '@/data/countries';
import { businessTypeCategories } from '@/data/businessTypes';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  business_id: string | null;
  business_name: string | null;
}

interface BusinessFormData {
  business_name: string;
  business_type: string;
  country: string;
  city: string;
  business_address: string;
  hours: { day: string; opensAt: string; closesAt: string; }[];
  website_url: string;
  gmb_link: string;
  email: string;
  phone: string;
  phoneCode: string;
  phoneNumber: string;
  first_name: string;
  last_name: string;
  social_links: SocialMediaLink[];
}

interface BusinessData {
  id: string;
  business_name: string | null;
  business_type: string | null;
  country: string | null;
  city: string | null;
  website_url: string | null;
  gmb_link: string | null;
  social_links: any[];
  bkb_content: string | null;
  brand_expert_content: string | null;
  persona1_content: string | null;
  persona1_title: string | null;
  persona2_content: string | null;
  persona2_title: string | null;
  persona3_content: string | null;
  persona3_title: string | null;
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

interface GalleryItem {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number | null;
  created_at: string;
}

interface UserPackage {
  id: string;
  package_id: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  package: {
    name: string;
    price: number | null;
    type: string;
    features: any;
  } | null;
}

type DetailTab = 'business' | 'knowledge' | 'gallery' | 'reports' | 'packages' | 'config';
type KBEditingState = {
  bkb: boolean;
  brandExpert: boolean;
  persona1: boolean;
  persona2: boolean;
  persona3: boolean;
};
type KnowledgeViewMode = 'bkb' | 'brandExpert' | 'persona1' | 'persona2' | 'persona3';

export default function ClientList() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>('business');
  
  // Business data state
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [loadingBusiness, setLoadingBusiness] = useState(false);
  const [isEditingBusiness, setIsEditingBusiness] = useState(false);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [formData, setFormData] = useState<BusinessFormData>({
    business_name: '',
    business_type: '',
    country: '',
    city: '',
    business_address: '',
    hours: [],
    website_url: '',
    gmb_link: '',
    email: '',
    phone: '',
    phoneCode: '',
    phoneNumber: '',
    first_name: '',
    last_name: '',
    social_links: [],
  });
  
  const [newHour, setNewHour] = useState({ day: 'Monday', opensAt: '09:00', closesAt: '17:00' });
  
  // Knowledge Base state
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
    bkb: false,
    brandExpert: false,
    persona1: false,
    persona2: false,
    persona3: false,
  });
  const [kbViewMode, setKbViewMode] = useState<KnowledgeViewMode>('bkb');
  const [savingKB, setSavingKB] = useState(false);
  
  // Gallery state
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [galleryViewMode, setGalleryViewMode] = useState<'grid' | 'list'>('grid');
  const [uploading, setUploading] = useState(false);
  
  // Package state
  const [userPackages, setUserPackages] = useState<UserPackage[]>([]);
  
  // Config state
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const selectedCountry = countries.find(c => c.name === formData.country);
  const cities = selectedCountry?.cities || [];
  const phoneCodes = [...new Set(countries.map(c => c.phoneCode))].sort();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email, phone, business_name');

      if (profilesError) throw profilesError;

      const { data: businesses, error: businessesError } = await supabase
        .from('businesses')
        .select('id, user_id, business_name');

      if (businessesError) throw businessesError;

      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('role', 'user');

      if (rolesError) throw rolesError;

      const userIds = userRoles?.map(r => r.user_id) || [];

      const clientList: Client[] = (profiles || [])
        .filter(p => userIds.includes(p.id))
        .map(profile => {
          const business = (businesses as any[])?.find((b: any) => b.user_id === profile.id);
          return {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            business_id: business?.id || null,
            business_name: business?.business_name || null,
          };
        });

      setClients(clientList);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFirstName = (name: string) => {
    return name?.split(' ')[0] || '-';
  };

  const getLastName = (name: string) => {
    const parts = name?.split(' ') || [];
    return parts.slice(1).join(' ') || '-';
  };

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

  const handleViewDetails = async (client: Client) => {
    setSelectedClient(client);
    setShowDetails(true);
    setActiveTab('business');
    await fetchClientData(client);
  };

  const fetchClientData = async (client: Client) => {
    setLoadingBusiness(true);
    
    try {
      // Fetch business data
      const { data: business } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', client.id)
        .maybeSingle();

      // Fetch profile data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('phone, name')
        .eq('id', client.id)
        .maybeSingle();

      if (business) {
        setBusinessData(business as unknown as BusinessData);
        
        // Parse social media links
        let socialLinks: SocialMediaLink[] = [];
        if (Array.isArray((business as any).social_links)) {
          socialLinks = ((business as any).social_links as any[]).map((link: any) => {
            if (typeof link === 'string') {
              const platform = detectPlatform(link);
              return { platform, url: link };
            }
            return link as SocialMediaLink;
          });
        }

        // Use country and city directly
        const city = (business as any).city || '';
        const country = (business as any).country || '';

        // Parse phone into code and number
        const fullPhone = profileData?.phone || '';
        let phoneCode = '';
        let phoneNumber = fullPhone;
        
        const phoneMatch = fullPhone.match(/^(\+\d+)\s*(.*)$/);
        if (phoneMatch) {
          phoneCode = phoneMatch[1];
          phoneNumber = phoneMatch[2];
        }

        // Parse name into first and last
        const nameParts = (profileData?.name || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Parse hours
        const hoursData = Array.isArray((business as any).hours) 
          ? ((business as any).hours as any[]).map(h => ({
              day: h.day || '',
              opensAt: h.opens_at || h.opensAt || '',
              closesAt: h.closes_at || h.closesAt || '',
            }))
          : [];

        setFormData({
          business_name: (business as any).business_name || '',
          business_type: (business as any).business_type || '',
          country: country,
          city: city,
          business_address: (business as any).business_address || '',
          hours: hoursData,
          website_url: (business as any).website_url || '',
          gmb_link: (business as any).gmb_link || '',
          email: client.email || '',
          phone: fullPhone,
          phoneCode: phoneCode,
          phoneNumber: phoneNumber,
          first_name: firstName,
          last_name: lastName,
          social_links: socialLinks,
        });

        // Load KB data
        setKbData({
          bkb: (business as any).bkb_content || '',
          brandExpert: (business as any).brand_expert_content || '',
          persona1: (business as any).persona1_content || '',
          persona2: (business as any).persona2_content || '',
          persona3: (business as any).persona3_content || '',
          persona1Title: (business as any).persona1_title || 'My Persona 1',
          persona2Title: (business as any).persona2_title || 'My Persona 2',
          persona3Title: (business as any).persona3_title || 'My Persona 3',
        });
      } else {
        setBusinessData(null);
        setFormData({
          business_name: '',
          business_type: '',
          country: '',
          city: '',
          business_address: '',
          hours: [],
          website_url: '',
          gmb_link: '',
          email: client.email || '',
          phone: profileData?.phone || '',
          phoneCode: '',
          phoneNumber: profileData?.phone || '',
          first_name: getFirstName(profileData?.name || ''),
          last_name: getLastName(profileData?.name || ''),
          social_links: [],
        });
      }

      // Fetch gallery
      const { data: galleryData } = await supabase
        .from('user_gallery')
        .select('*')
        .eq('user_id', client.id)
        .order('created_at', { ascending: false });

      setGallery(galleryData || []);

      // Fetch packages
      const { data: packagesData } = await supabase
        .from('user_packages')
        .select(`id, package_id, status, started_at, expires_at`)
        .eq('user_id', client.id);

      if (packagesData) {
        const packagesWithDetails = await Promise.all(
          packagesData.map(async (up) => {
            const { data: pkg } = await supabase
              .from('packages')
              .select('name, price, type, features')
              .eq('id', up.package_id)
              .single();
            return { ...up, package: pkg };
          })
        );
        setUserPackages(packagesWithDetails);
      }
    } catch (error) {
      console.error('Error fetching client data:', error);
    } finally {
      setLoadingBusiness(false);
    }
  };

  const handleBack = () => {
    setShowDetails(false);
    setSelectedClient(null);
    setBusinessData(null);
    setGallery([]);
    setUserPackages([]);
    setIsEditingBusiness(false);
    setKbEditingState({ bkb: false, brandExpert: false, persona1: false, persona2: false, persona3: false });
  };

  const handleCountryChange = (country: string) => {
    const countryData = countries.find(c => c.name === country);
    setFormData(prev => ({
      ...prev,
      country,
      city: '',
      phoneCode: countryData?.phoneCode || prev.phoneCode,
    }));
  };

  const handleSaveBusiness = async () => {
    if (!selectedClient) return;

    setSavingBusiness(true);
    try {
      const fullPhone = `${formData.phoneCode} ${formData.phoneNumber}`.trim();

      const hoursForDb = formData.hours.map(h => ({
        day: h.day,
        opens_at: h.opensAt,
        closes_at: h.closesAt,
      }));

      const { error } = await supabase
        .from('businesses')
        .update({
          business_name: formData.business_name || null,
          business_type: formData.business_type || null,
          country: formData.country || null,
          city: formData.city || null,
          business_address: formData.business_address || null,
          hours: hoursForDb as any,
          website_url: formData.website_url, // Allow empty string
          gmb_link: formData.gmb_link || null,
          social_links: formData.social_links as any,
        })
        .eq('user_id', selectedClient.id);

      if (error) throw error;

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: `${formData.first_name} ${formData.last_name}`.trim(),
          phone: fullPhone || null,
        })
        .eq('id', selectedClient.id);

      if (profileError) throw profileError;

      setIsEditingBusiness(false);
      toast({
        title: 'Saved!',
        description: 'Business information has been updated.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setSavingBusiness(false);
    }
  };

  // KB handlers
  const handleSaveKB = async (field: keyof KnowledgeBaseData) => {
    if (!selectedClient) return;
    
    setSavingKB(true);
    try {
      const fieldToColumn: Record<string, string> = {
        bkb: 'bkb_content',
        brandExpert: 'brand_expert_content',
        persona1: 'persona1_content',
        persona2: 'persona2_content',
        persona3: 'persona3_content',
      };
      
      const columnName = fieldToColumn[field];
      if (!columnName) return;
      
      const { error } = await supabase
        .from('businesses')
        .update({ [columnName]: kbData[field] })
        .eq('user_id', selectedClient.id);
      
      if (error) throw error;
      
      setKbEditingState(prev => ({ ...prev, [field]: false }));
      
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
    await handleSaveKBTitle(persona, newTitle);
  };

  const handleSaveKBTitle = async (field: string, value: string) => {
    if (!selectedClient) return;
    
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
        .eq('user_id', selectedClient.id);
      
      if (error) throw error;
      
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

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: 'Copied!',
      description: 'Content copied to clipboard.',
    });
  };

  // Gallery handlers
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !selectedClient) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      const type = file.type.startsWith('image/') 
        ? 'image' 
        : file.type.startsWith('video/') 
        ? 'video' 
        : 'file';

      const filePath = `${selectedClient.id}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-files')
        .upload(filePath, file);

      if (uploadError) {
        toast({
          variant: 'destructive',
          title: 'Upload Failed',
          description: `Failed to upload ${file.name}`,
        });
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('user-files')
        .getPublicUrl(filePath);

      const { data: dbData, error: dbError } = await supabase
        .from('user_gallery')
        .insert({
          user_id: selectedClient.id,
          name: file.name,
          type,
          url: urlData.publicUrl,
          size: file.size,
        })
        .select()
        .single();

      if (dbData) {
        setGallery(prev => [dbData, ...prev]);
      }
    }

    setUploading(false);
    toast({
      title: 'Uploaded!',
      description: `${files.length} file(s) uploaded successfully.`,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteGallery = async (item: GalleryItem) => {
    const filePath = item.url.split('/user-files/')[1];
    if (filePath) {
      await supabase.storage.from('user-files').remove([filePath]);
    }

    const { error } = await supabase
      .from('user_gallery')
      .delete()
      .eq('id', item.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete file.',
      });
      return;
    }

    setGallery(prev => prev.filter(m => m.id !== item.id));
    toast({
      title: 'Deleted',
      description: 'File has been removed.',
    });
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: 'Copied!',
      description: 'URL copied to clipboard.',
    });
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-5 w-5" />;
      case 'video':
        return <Video className="h-5 w-5" />;
      default:
        return <FileIcon className="h-5 w-5" />;
    }
  };

  // Login as client
  const handleLoginAsClient = () => {
    if (!selectedClient) return;
    toast({
      title: 'Opening client session',
      description: 'This feature requires admin privileges.',
    });
    window.open('/dashboard/user', '_blank');
  };

  // Full-page client details view
  if (showDetails && selectedClient) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{selectedClient.business_name || selectedClient.name}</h1>
            <p className="text-muted-foreground">{selectedClient.email}</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DetailTab)}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="business" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Business Details
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Knowledge
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Gallery
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="packages" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Packages
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Config
            </TabsTrigger>
          </TabsList>

          {loadingBusiness ? (
            <div className="mt-6 animate-pulse space-y-4">
              <div className="h-48 bg-muted rounded-lg"></div>
            </div>
          ) : (
            <>
              {/* Business Details Tab - Synced with MyBusiness */}
              <TabsContent value="business" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Business Information</CardTitle>
                        <CardDescription>Client's business details (synced with User Dashboard)</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {isEditingBusiness ? (
                          <>
                            <Button variant="outline" onClick={() => setIsEditingBusiness(false)}>
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                            <Button onClick={handleSaveBusiness} disabled={savingBusiness}>
                              <Save className="h-4 w-4 mr-2" />
                              {savingBusiness ? 'Saving...' : 'Save'}
                            </Button>
                          </>
                        ) : (
                          <Button onClick={() => setIsEditingBusiness(true)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Business ID - Full Row */}
                    <div className="space-y-2">
                      <Label>Business ID</Label>
                      <p className="font-medium py-2 font-mono text-xs">{selectedClient.business_id || '-'}</p>
                    </div>

                    {/* First Name + Last Name */}
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>First Name</Label>
                        {isEditingBusiness ? (
                          <Input
                            value={formData.first_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                          />
                        ) : (
                          <p className="font-medium py-2">{formData.first_name || '-'}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name</Label>
                        {isEditingBusiness ? (
                          <Input
                            value={formData.last_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                          />
                        ) : (
                          <p className="font-medium py-2">{formData.last_name || '-'}</p>
                        )}
                      </div>
                    </div>

                    {/* Email + Phone Number */}
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <p className="font-medium py-2">{formData.email || '-'}</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Phone Number</Label>
                        {isEditingBusiness ? (
                          <div className="flex gap-2">
                            <Select value={formData.phoneCode} onValueChange={(v) => setFormData(prev => ({ ...prev, phoneCode: v }))}>
                              <SelectTrigger className="w-28">
                                <SelectValue placeholder="Code" />
                              </SelectTrigger>
                              <SelectContent>
                                {phoneCodes.map((code) => (
                                  <SelectItem key={code} value={code}>{code}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              value={formData.phoneNumber}
                              onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                              placeholder="Phone number"
                              className="flex-1"
                            />
                          </div>
                        ) : (
                          <p className="font-medium py-2">{formData.phone || '-'}</p>
                        )}
                      </div>
                    </div>

                    {/* Business Name + Business Type */}
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Business Name</Label>
                        {isEditingBusiness ? (
                          <Input
                            value={formData.business_name}
                            onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                          />
                        ) : (
                          <p className="font-medium py-2">{formData.business_name || '-'}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Business Type</Label>
                        {isEditingBusiness ? (
                          <Select value={formData.business_type} onValueChange={(value) => setFormData(prev => ({ ...prev, business_type: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {businessTypeCategories.map((category) => (
                                <SelectGroup key={category.category}>
                                  <SelectLabel>{category.category}</SelectLabel>
                                  {category.types.map((type) => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                  ))}
                                </SelectGroup>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="font-medium py-2">{formData.business_type || '-'}</p>
                        )}
                      </div>
                    </div>

                    {/* Country + City */}
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Country</Label>
                        {isEditingBusiness ? (
                          <Select value={formData.country} onValueChange={handleCountryChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                              {countries.map((c) => (
                                <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="font-medium py-2">{formData.country || '-'}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>City</Label>
                        {isEditingBusiness ? (
                          <Select value={formData.city} onValueChange={(value) => setFormData(prev => ({ ...prev, city: value }))} disabled={!formData.country}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select city" />
                            </SelectTrigger>
                            <SelectContent>
                              {cities.map((city) => (
                                <SelectItem key={city} value={city}>{city}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="font-medium py-2">{formData.city || '-'}</p>
                        )}
                      </div>
                    </div>

                    {/* Business Address + Business Hours */}
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="business_address">Business Address</Label>
                        {isEditingBusiness ? (
                          <Input
                            id="business_address"
                            value={formData.business_address}
                            onChange={(e) => setFormData(prev => ({ ...prev, business_address: e.target.value }))}
                            placeholder="123 Business St"
                          />
                        ) : (
                          <p className="font-medium py-2">{formData.business_address || '-'}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Business Hours</Label>
                        {formData.hours.length > 0 && (
                          <div className="space-y-1 mb-2">
                            {formData.hours.map((hour, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded text-xs">
                                <span className="font-medium min-w-[70px]">{hour.day}</span>
                                <span className="text-muted-foreground">{hour.opensAt} - {hour.closesAt}</span>
                                {isEditingBusiness && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setFormData({ ...formData, hours: formData.hours.filter((_, i) => i !== index) })}
                                    className="ml-auto h-6 w-6 p-0"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {!isEditingBusiness && formData.hours.length === 0 && (
                          <p className="font-medium py-2">-</p>
                        )}
                        {isEditingBusiness && (
                          <div className="flex gap-1">
                            <Select value={newHour.day} onValueChange={(v) => setNewHour({ ...newHour, day: v })}>
                              <SelectTrigger className="text-xs">
                                <SelectValue placeholder="Day" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Monday">Mon</SelectItem>
                                <SelectItem value="Tuesday">Tue</SelectItem>
                                <SelectItem value="Wednesday">Wed</SelectItem>
                                <SelectItem value="Thursday">Thu</SelectItem>
                                <SelectItem value="Friday">Fri</SelectItem>
                                <SelectItem value="Saturday">Sat</SelectItem>
                                <SelectItem value="Sunday">Sun</SelectItem>
                              </SelectContent>
                            </Select>
                            <Select value={newHour.opensAt} onValueChange={(v) => setNewHour({ ...newHour, opensAt: v })}>
                              <SelectTrigger className="text-xs">
                                <SelectValue placeholder="Opens" />
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
                              <SelectTrigger className="text-xs">
                                <SelectValue placeholder="Closes" />
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
                              size="sm"
                              onClick={() => {
                                if (newHour.day && newHour.opensAt && newHour.closesAt) {
                                  setFormData({ 
                                    ...formData, 
                                    hours: [...formData.hours, { day: newHour.day, opensAt: newHour.opensAt, closesAt: newHour.closesAt }] 
                                  });
                                  setNewHour({ day: 'Monday', opensAt: '09:00', closesAt: '17:00' });
                                }
                              }}
                              className="h-8 text-xs px-2"
                            >
                              Add
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Website URL</Label>
                      {isEditingBusiness ? (
                        <Input
                          value={formData.website_url}
                          onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                          placeholder="https://..."
                        />
                      ) : formData.website_url ? (
                        <a 
                          href={formData.website_url.startsWith('http') ? formData.website_url : `https://${formData.website_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium py-2 text-primary hover:underline flex items-center gap-2"
                        >
                          {formData.website_url}
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : (
                        <p className="font-medium py-2">-</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Google Business Profile</Label>
                      {isEditingBusiness ? (
                        <Input
                          value={formData.gmb_link}
                          onChange={(e) => setFormData(prev => ({ ...prev, gmb_link: e.target.value }))}
                          placeholder="https://..."
                        />
                      ) : formData.gmb_link ? (
                        <a 
                          href={formData.gmb_link.startsWith('http') ? formData.gmb_link : `https://${formData.gmb_link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium py-2 text-primary hover:underline flex items-center gap-2"
                        >
                          {formData.gmb_link}
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : (
                        <p className="font-medium py-2">-</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Social Media Links</Label>
                      {isEditingBusiness ? (
                        <SocialMediaInput
                          links={formData.social_links}
                          onChange={(links) => setFormData(prev => ({ ...prev, social_links: links }))}
                        />
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {formData.social_links.length > 0 ? (
                            formData.social_links.map((link, i) => (
                              <a
                                key={i}
                                href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-primary hover:underline"
                              >
                                <Badge variant="secondary" className="capitalize">
                                  {link.platform}
                                </Badge>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ))
                          ) : (
                            <p className="text-muted-foreground">No social links</p>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Knowledge Base Tab - Synced with MyBusiness BKB */}
              <TabsContent value="knowledge" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Business Knowledge Base</CardTitle>
                        <CardDescription>Synced with User's Business Knowledge Base</CardDescription>
                      </div>
                      <Select value={kbViewMode} onValueChange={(v) => setKbViewMode(v as KnowledgeViewMode)}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bkb">My BKB</SelectItem>
                          <SelectItem value="brandExpert">Brand Expert</SelectItem>
                          <SelectItem value="persona1">{kbData.persona1Title}</SelectItem>
                          <SelectItem value="persona2">{kbData.persona2Title}</SelectItem>
                          <SelectItem value="persona3">{kbData.persona3Title}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {kbViewMode === 'bkb' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">My BKB (Business Knowledge Base)</h3>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleCopyContent(kbData.bkb)}>
                              <Copy className="h-4 w-4 mr-2" />Copy
                            </Button>
                            {kbEditingState.bkb ? (
                              <Button size="sm" onClick={() => handleSaveKB('bkb')} disabled={savingKB}>
                                <Save className="h-4 w-4 mr-2" />{savingKB ? 'Saving...' : 'Save'}
                              </Button>
                            ) : (
                              <Button size="sm" onClick={() => setKbEditingState(prev => ({ ...prev, bkb: true }))}>
                                <Pencil className="h-4 w-4 mr-2" />Edit
                              </Button>
                            )}
                          </div>
                        </div>
                        {kbEditingState.bkb ? (
                          <RichTextEditor
                            value={kbData.bkb}
                            onChange={(v) => setKbData(prev => ({ ...prev, bkb: v }))}
                            onSave={() => handleSaveKB('bkb')}
                            title="My BKB"
                            description="Business Knowledge Base content"
                            icon={FileText}
                            saving={savingKB}
                            isEditing={true}
                          />
                        ) : (
                          <div className="prose prose-sm max-w-none p-4 bg-muted/50 rounded-lg" dangerouslySetInnerHTML={{ __html: kbData.bkb || '<p class="text-muted-foreground">No content</p>' }} />
                        )}
                      </div>
                    )}
                    
                    {kbViewMode === 'brandExpert' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">Brand Expert</h3>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleCopyContent(kbData.brandExpert)}>
                              <Copy className="h-4 w-4 mr-2" />Copy
                            </Button>
                            {kbEditingState.brandExpert ? (
                              <Button size="sm" onClick={() => handleSaveKB('brandExpert')} disabled={savingKB}>
                                <Save className="h-4 w-4 mr-2" />{savingKB ? 'Saving...' : 'Save'}
                              </Button>
                            ) : (
                              <Button size="sm" onClick={() => setKbEditingState(prev => ({ ...prev, brandExpert: true }))}>
                                <Pencil className="h-4 w-4 mr-2" />Edit
                              </Button>
                            )}
                          </div>
                        </div>
                        {kbEditingState.brandExpert ? (
                          <RichTextEditor
                            value={kbData.brandExpert}
                            onChange={(v) => setKbData(prev => ({ ...prev, brandExpert: v }))}
                            onSave={() => handleSaveKB('brandExpert')}
                            title="Brand Expert"
                            description="Brand expert content"
                            icon={FileText}
                            saving={savingKB}
                            isEditing={true}
                          />
                        ) : (
                          <div className="prose prose-sm max-w-none p-4 bg-muted/50 rounded-lg" dangerouslySetInnerHTML={{ __html: kbData.brandExpert || '<p class="text-muted-foreground">No content</p>' }} />
                        )}
                      </div>
                    )}
                    
                    {['persona1', 'persona2', 'persona3'].includes(kbViewMode) && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Input
                              value={kbData[`${kbViewMode}Title` as keyof KnowledgeBaseData]}
                              onChange={(e) => handlePersonaTitleChange(`${kbViewMode}Title` as any, e.target.value)}
                              className="w-48 font-semibold"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleCopyContent(kbData[kbViewMode as keyof KnowledgeBaseData])}>
                              <Copy className="h-4 w-4 mr-2" />Copy
                            </Button>
                            {kbEditingState[kbViewMode as keyof KBEditingState] ? (
                              <Button size="sm" onClick={() => handleSaveKB(kbViewMode as keyof KnowledgeBaseData)} disabled={savingKB}>
                                <Save className="h-4 w-4 mr-2" />{savingKB ? 'Saving...' : 'Save'}
                              </Button>
                            ) : (
                              <Button size="sm" onClick={() => setKbEditingState(prev => ({ ...prev, [kbViewMode]: true }))}>
                                <Pencil className="h-4 w-4 mr-2" />Edit
                              </Button>
                            )}
                          </div>
                        </div>
                        {kbEditingState[kbViewMode as keyof KBEditingState] ? (
                          <RichTextEditor
                            value={kbData[kbViewMode as keyof KnowledgeBaseData]}
                            onChange={(v) => setKbData(prev => ({ ...prev, [kbViewMode]: v }))}
                            onSave={() => handleSaveKB(kbViewMode as keyof KnowledgeBaseData)}
                            title={kbData[`${kbViewMode}Title` as keyof KnowledgeBaseData] || 'Persona'}
                            description="Customer persona content"
                            icon={FileText}
                            saving={savingKB}
                            isEditing={true}
                          />
                        ) : (
                          <div className="prose prose-sm max-w-none p-4 bg-muted/50 rounded-lg" dangerouslySetInnerHTML={{ __html: kbData[kbViewMode as keyof KnowledgeBaseData] || '<p class="text-muted-foreground">No content</p>' }} />
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Gallery Tab */}
              <TabsContent value="gallery" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Client Gallery</CardTitle>
                        <CardDescription>Media files for this client</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex border rounded-lg">
                          <Button variant={galleryViewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setGalleryViewMode('grid')}>
                            <Grid className="h-4 w-4" />
                          </Button>
                          <Button variant={galleryViewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setGalleryViewMode('list')}>
                            <List className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                          <Upload className="h-4 w-4 mr-2" />
                          {uploading ? 'Uploading...' : 'Upload'}
                        </Button>
                        <input ref={fileInputRef} type="file" multiple onChange={handleUpload} className="hidden" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {gallery.length === 0 ? (
                      <div className="text-center py-12">
                        <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-medium">No files yet</h3>
                        <p className="text-muted-foreground text-sm">Upload files for this client</p>
                      </div>
                    ) : galleryViewMode === 'grid' ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {gallery.map((item) => (
                          <div key={item.id} className="group relative aspect-square bg-muted rounded-lg overflow-hidden">
                            {item.type === 'image' ? (
                              <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                {getIcon(item.type)}
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <Button variant="secondary" size="icon" onClick={() => handleCopyUrl(item.url)}>
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button variant="destructive" size="icon" onClick={() => handleDeleteGallery(item)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {gallery.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell><Badge variant="outline">{item.type}</Badge></TableCell>
                              <TableCell>{formatSize(item.size)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="icon" onClick={() => handleCopyUrl(item.url)}>
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleDeleteGallery(item)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reports Tab */}
              <TabsContent value="reports" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Reports</CardTitle>
                    <CardDescription>Client reports and analytics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-center py-8">Reports coming soon</p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Packages Tab */}
              <TabsContent value="packages" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Client Packages</CardTitle>
                    <CardDescription>Subscribed packages</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {userPackages.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No packages</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Package</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userPackages.map((up) => (
                            <TableRow key={up.id}>
                              <TableCell className="font-medium">{up.package?.name || '-'}</TableCell>
                              <TableCell><Badge variant="outline">{up.package?.type || '-'}</Badge></TableCell>
                              <TableCell>${up.package?.price || 0}</TableCell>
                              <TableCell><Badge>{up.status}</Badge></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Config Tab */}
              <TabsContent value="config" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Client Configuration</CardTitle>
                    <CardDescription>Account settings and access</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Mail className="h-4 w-4" />Email</Label>
                        <Input value={selectedClient.email} disabled className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Lock className="h-4 w-4" />Password</Label>
                        <div className="flex gap-2">
                          <Input 
                            type={showPassword ? 'text' : 'password'} 
                            value="••••••••" 
                            disabled 
                            className="bg-muted"
                          />
                          <Button variant="outline" size="icon" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <Button onClick={handleLoginAsClient}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Login as Client
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    );
  }

  // Client List View
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
        <h1 className="text-3xl font-bold text-foreground">Client List</h1>
        <p className="text-muted-foreground">Manage your business clients</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
          <CardDescription>View and manage all business clients</CardDescription>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium">No clients yet</h3>
              <p className="text-muted-foreground text-sm">Clients will appear here when they register</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Contact Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.business_name || 'Not set'}</TableCell>
                    <TableCell>{client.name}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.phone || 'Not set'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleViewDetails(client)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/authStore';
import { expertiseDomains, targetCustomers, resourcesAssets } from '@/data/mockData';
import { getInitials } from '@/lib/utils';
import { 
  Camera, Plus, X, Save, ArrowLeft, Briefcase, Target, 
  Award, User, Mail, Phone
} from 'lucide-react';

export default function EditProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, updateUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    expectation: user?.expectation || 'team_up' as 'team_up' | 'work_for_others',
    profilePicture: user?.profilePicture || '',
    expertiseDomains: user?.expertiseDomains || [],
    targetCustomers: user?.targetCustomers || [],
    resourcesAssets: user?.resourcesAssets || [],
    trackRecords: user?.trackRecords || []
  });
  
  const [newAchievement, setNewAchievement] = useState({ title: '', description: '' });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayToggle = (field: 'expertiseDomains' | 'targetCustomers' | 'resourcesAssets', value: string) => {
    setFormData(prev => {
      const current = prev[field];
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };

  const handleAddAchievement = () => {
    if (newAchievement.title && newAchievement.description) {
      setFormData(prev => ({
        ...prev,
        trackRecords: [...prev.trackRecords, {
          id: 'tr_' + Date.now(),
          title: newAchievement.title,
          description: newAchievement.description,
          date: new Date().toISOString()
        }]
      }));
      setNewAchievement({ title: '', description: '' });
    }
  };

  const handleRemoveAchievement = (id: string) => {
    setFormData(prev => ({
      ...prev,
      trackRecords: prev.trackRecords.filter(tr => tr.id !== id)
    }));
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simulate image upload - in real app, upload to server
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profilePicture: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    updateUser({
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      bio: formData.bio,
      expectation: formData.expectation,
      profilePicture: formData.profilePicture,
      expertiseDomains: formData.expertiseDomains,
      targetCustomers: formData.targetCustomers,
      resourcesAssets: formData.resourcesAssets,
      trackRecords: formData.trackRecords
    });
    
    toast({
      title: 'Profile updated!',
      description: 'Your changes have been saved successfully.',
    });
    
    setIsSaving(false);
    navigate('/profile');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700">Please log in</h2>
          <Button onClick={() => navigate('/login')} className="mt-4">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-bold">Edit Profile</h1>
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                'Saving...'
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Picture */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Picture
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={formData.profilePicture} />
                  <AvatarFallback className="text-2xl bg-blue-100">
                    {getInitials(formData.fullName)}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute -bottom-2 -right-2 rounded-full"
                  onClick={handleImageUpload}
                >
                  <Camera className="w-4 h-4" />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  Upload a professional photo to help others recognize you.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Recommended: 400x400px, JPG or PNG
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="pl-10"
                  placeholder="+1-555-0123"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                placeholder="Tell others about yourself..."
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label>I want to</Label>
              <Select 
                value={formData.expectation} 
                onValueChange={(value: 'team_up' | 'work_for_others') => 
                  handleChange('expectation', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team_up">Team up to realize an idea</SelectItem>
                  <SelectItem value="work_for_others">Work for others</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Expertise Domains */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Expertise Domains
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {expertiseDomains.map((domain) => (
                <Badge
                  key={domain}
                  variant={formData.expertiseDomains.includes(domain) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => handleArrayToggle('expertiseDomains', domain)}
                >
                  {domain}
                  {formData.expertiseDomains.includes(domain) && (
                    <X className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Target Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5" />
              Target Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {targetCustomers.map((customer) => (
                <Badge
                  key={customer}
                  variant={formData.targetCustomers.includes(customer) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => handleArrayToggle('targetCustomers', customer)}
                >
                  {customer}
                  {formData.targetCustomers.includes(customer) && (
                    <X className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Resources & Assets */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resources & Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {resourcesAssets.map((resource) => (
                <Badge
                  key={resource}
                  variant={formData.resourcesAssets.includes(resource) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => handleArrayToggle('resourcesAssets', resource)}
                >
                  {resource}
                  {formData.resourcesAssets.includes(resource) && (
                    <X className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Track Records */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="w-5 h-5" />
              Track Records
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.trackRecords.map((record) => (
              <div key={record.id} className="flex gap-2 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{record.title}</h4>
                  <p className="text-sm text-gray-600">{record.description}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleRemoveAchievement(record.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            
            <Separator />
            
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Add New Achievement</h4>
              <Input
                placeholder="Achievement title"
                value={newAchievement.title}
                onChange={(e) => setNewAchievement(prev => ({ ...prev, title: e.target.value }))}
              />
              <Textarea
                placeholder="Description"
                value={newAchievement.description}
                onChange={(e) => setNewAchievement(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleAddAchievement}
                disabled={!newAchievement.title || !newAchievement.description}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Achievement
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

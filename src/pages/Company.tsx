import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Building2, Save } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
}

const Company = () => {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user?.id)
        .single();

      if (profile?.company_id) {
        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profile.company_id)
          .single();

        if (companyData) {
          setCompany(companyData);
          setFormData({
            name: companyData.name || '',
            email: companyData.email || '',
            phone: companyData.phone || ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching company:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (company) {
        // Update existing company
        const { error } = await supabase
          .from('companies')
          .update(formData)
          .eq('id', company.id);

        if (error) throw error;

        toast({
          title: "Company updated",
          description: "Your company information has been updated successfully.",
        });
      } else {
        // Create new company
        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
          .insert([formData])
          .select()
          .single();

        if (companyError) throw companyError;

        // Update user profile with company_id
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ company_id: newCompany.id, role: 'admin' })
          .eq('id', user?.id);

        if (profileError) throw profileError;

        setCompany(newCompany);
        toast({
          title: "Company created",
          description: "Your company has been created successfully.",
        });
      }

      fetchCompany(); // Refresh data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Company Information</h1>
        <p className="text-muted-foreground">
          Manage your company details and settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {company ? 'Update Company' : 'Create Company'}
          </CardTitle>
          <CardDescription>
            {company 
              ? 'Update your company information below'
              : 'Set up your company to start managing events'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter company name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="company@example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <Button type="submit" disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Company'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Company;
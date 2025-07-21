import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Building2, Save, Users, Plus, Mail, Edit, Trash2, UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface CompanyUser {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'staff';
  created_at: string;
}

const Company = () => {
  const [company, setCompany] = useState<Company | null>(null);
  const [users, setUsers] = useState<CompanyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<CompanyUser | null>(null);
  const [companyFormData, setCompanyFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [inviteFormData, setInviteFormData] = useState({
    email: '',
    full_name: '',
    role: 'staff' as 'admin' | 'manager' | 'staff'
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchCompanyAndUsers();
  }, []);

  const fetchCompanyAndUsers = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id, role')
        .eq('id', user?.id)
        .single();

      if (profile?.company_id) {
        // Fetch company info
        const { data: companyData } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profile.company_id)
          .single();

        if (companyData) {
          setCompany(companyData);
          setCompanyFormData({
            name: companyData.name || '',
            email: companyData.email || '',
            phone: companyData.phone || ''
          });
        }

        // Fetch company users
        const { data: usersData } = await supabase
          .from('profiles')
          .select('id, email, full_name, role, created_at')
          .eq('company_id', profile.company_id)
          .order('created_at', { ascending: false });

        if (usersData) {
          setUsers(usersData);
        }
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (company) {
        // Update existing company
        const { error } = await supabase
          .from('companies')
          .update(companyFormData)
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
          .insert([companyFormData])
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

      fetchCompanyAndUsers(); // Refresh data
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

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    try {
      // In a real app, you would send an invitation email
      // For now, we'll create a placeholder user that needs to be activated
      
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', inviteFormData.email)
        .single();

      if (existingUser) {
        toast({
          title: "User already exists",
          description: "This email is already registered in the system.",
          variant: "destructive",
        });
        return;
      }

      // Create auth user first (simplified - in production you'd send an invite)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: inviteFormData.email,
        password: Math.random().toString(36).slice(-8), // Temporary password
        email_confirm: true
      });

      if (authError) throw authError;

      // Update the profile with company info
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: inviteFormData.full_name,
          company_id: company.id,
          role: inviteFormData.role
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      toast({
        title: "User invited",
        description: `${inviteFormData.full_name} has been added to your company.`,
      });

      setShowInviteDialog(false);
      setInviteFormData({ email: '', full_name: '', role: 'staff' });
      fetchCompanyAndUsers();
    } catch (error: any) {
      toast({
        title: "Invitation failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: 'admin' | 'manager' | 'staff') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Role updated",
        description: "User role has been updated successfully.",
      });

      fetchCompanyAndUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user from the company?')) return;

    try {
      // Remove user from company (set company_id to null)
      const { error } = await supabase
        .from('profiles')
        .update({ company_id: null, role: 'staff' })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "User removed",
        description: "User has been removed from the company.",
      });

      fetchCompanyAndUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'manager': return 'default';
      case 'staff': return 'secondary';
      default: return 'secondary';
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'admin': return 'Full access to all company data and settings';
      case 'manager': return 'Can manage events and view all company data';
      case 'staff': return 'Can only manage their own events';
      default: return 'Basic access';
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
        <h1 className="text-3xl font-bold">Company Management</h1>
        <p className="text-muted-foreground">
          Manage your company information and team members
        </p>
      </div>

      <Tabs defaultValue="company" className="space-y-4">
        <TabsList>
          <TabsTrigger value="company">Company Info</TabsTrigger>
          <TabsTrigger value="users">Team Members</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
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
              <form onSubmit={handleSaveCompany} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Company Name</Label>
                    <Input
                      id="name"
                      value={companyFormData.name}
                      onChange={(e) => setCompanyFormData({ ...companyFormData, name: e.target.value })}
                      placeholder="Enter company name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={companyFormData.email}
                      onChange={(e) => setCompanyFormData({ ...companyFormData, email: e.target.value })}
                      placeholder="company@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={companyFormData.phone}
                    onChange={(e) => setCompanyFormData({ ...companyFormData, phone: e.target.value })}
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
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team Members ({users.length})
                  </CardTitle>
                  <CardDescription>
                    Manage your team members and their permissions
                  </CardDescription>
                </div>
                <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Invite User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite Team Member</DialogTitle>
                      <DialogDescription>
                        Add a new team member to your company
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleInviteUser} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="inviteEmail">Email Address</Label>
                        <Input
                          id="inviteEmail"
                          type="email"
                          value={inviteFormData.email}
                          onChange={(e) => setInviteFormData({ ...inviteFormData, email: e.target.value })}
                          placeholder="user@example.com"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="inviteName">Full Name</Label>
                        <Input
                          id="inviteName"
                          value={inviteFormData.full_name}
                          onChange={(e) => setInviteFormData({ ...inviteFormData, full_name: e.target.value })}
                          placeholder="John Doe"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="inviteRole">Role</Label>
                        <Select value={inviteFormData.role} onValueChange={(value: any) => setInviteFormData({ ...inviteFormData, role: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">
                              <div>
                                <div className="font-medium">Admin</div>
                                <div className="text-xs text-muted-foreground">Full access to all data</div>
                              </div>
                            </SelectItem>
                            <SelectItem value="manager">
                              <div>
                                <div className="font-medium">Manager</div>
                                <div className="text-xs text-muted-foreground">Can manage events and view all data</div>
                              </div>
                            </SelectItem>
                            <SelectItem value="staff">
                              <div>
                                <div className="font-medium">Staff</div>
                                <div className="text-xs text-muted-foreground">Can only manage their own events</div>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="submit" className="w-full">
                        <Mail className="mr-2 h-4 w-4" />
                        Send Invitation
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No team members yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Invite your first team member to get started
                  </p>
                  <Button onClick={() => setShowInviteDialog(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite User
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="font-medium">{member.full_name || 'No name'}</div>
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(member.role)}>
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {getRoleDescription(member.role)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(member.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Select
                              value={member.role}
                              onValueChange={(newRole: any) => handleUpdateUserRole(member.id, newRole)}
                            >
                              <SelectTrigger className="w-24 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="staff">Staff</SelectItem>
                              </SelectContent>
                            </Select>
                            {member.id !== user?.id && (
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                onClick={() => handleRemoveUser(member.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
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
      </Tabs>

      {/* Role Permissions Info */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription>
            Understanding different access levels in your company
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="destructive">Admin</Badge>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Full company management</li>
                <li>• Invite and manage users</li>
                <li>• View all events and data</li>
                <li>• Modify company settings</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="default">Manager</Badge>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Create and manage all events</li>
                <li>• View all company data</li>
                <li>• Manage attendees and seating</li>
                <li>• Cannot modify company settings</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Staff</Badge>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Create their own events only</li>
                <li>• Manage own event attendees</li>
                <li>• Limited to personal event data</li>
                <li>• Cannot view other users' events</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Company;
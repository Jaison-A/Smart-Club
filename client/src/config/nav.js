import { Home, Users, ClipboardList, ShieldCheck, Compass, PlusCircle, Calendar, Award, Mail, FileText, Building2 } from 'lucide-react';

// One nav map per role -- the Sidebar reads from here, so adding a page
// updates navigation everywhere. Labels follow the Campus Club hub design.
export const navByRole = {
  student: [
    { label: 'Home', to: '/student', icon: Home },
    { label: 'Clubs', to: '/clubs', icon: Compass },
    { label: 'Events', to: '/events', icon: Calendar },
    { label: 'Openings', to: '/recruitment', icon: ClipboardList },
    { label: 'Applications', to: '/applications', icon: FileText },
    { label: 'Certificates', to: '/student/certificates', icon: Award },
    { label: 'Invites', to: '/invites', icon: Mail },
    { label: 'Create Club', to: '/clubs/new', icon: PlusCircle },
  ],
  coordinator: [
    { label: 'Home', to: '/coordinator', icon: Home },
    { label: 'Members', to: '/coordinator/members', icon: Users },
    { label: 'Clubs', to: '/clubs', icon: Compass },
    { label: 'Events', to: '/events', icon: Calendar },
    { label: 'Openings', to: '/recruitment', icon: ClipboardList },
    { label: 'Invites', to: '/invites', icon: Mail },
    { label: 'Create Club', to: '/clubs/new', icon: PlusCircle },
  ],
  admin: [
    { label: 'Home', to: '/admin', icon: Home },
    { label: 'Clubs', to: '/admin/clubs', icon: Building2 },
    { label: 'Users', to: '/admin/users', icon: Users },
    { label: 'Approvals', to: '/admin/approvals', icon: ShieldCheck },
    { label: 'Events', to: '/events', icon: Calendar },
  ],
};

import { LayoutDashboard, Users, ClipboardList, ShieldCheck, Compass, PlusCircle, Calendar, Award } from 'lucide-react';

// One nav map per role. The Sidebar reads from here rather than each
// dashboard page defining its own links, so adding a page updates
// navigation everywhere automatically.
export const navByRole = {
  student: [
    { label: 'Dashboard', to: '/student', icon: LayoutDashboard },
    { label: 'Explore Clubs', to: '/clubs', icon: Compass },
    { label: 'Recruitment', to: '/recruitment', icon: ClipboardList },
    { label: 'Events', to: '/events', icon: Calendar },
    { label: 'Certificates', to: '/student/certificates', icon: Award },
    { label: 'Start a Club', to: '/clubs/new', icon: PlusCircle },
  ],
  coordinator: [
    { label: 'Dashboard', to: '/coordinator', icon: LayoutDashboard },
    { label: 'Members', to: '/coordinator/members', icon: Users },
    { label: 'Recruitment', to: '/recruitment', icon: ClipboardList },
    { label: 'Events', to: '/events', icon: Calendar },
    { label: 'Start a Club', to: '/clubs/new', icon: PlusCircle },
  ],
  admin: [
    { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
    { label: 'Clubs', to: '/clubs', icon: Compass },
    { label: 'Users', to: '/admin/users', icon: Users },
    { label: 'Approvals', to: '/admin/approvals', icon: ShieldCheck },
  ],
};

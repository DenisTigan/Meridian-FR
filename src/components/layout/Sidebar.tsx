import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, UserCircle, CalendarDays, 
  GraduationCap, Briefcase, UserPlus, BookOpen, 
  MessageSquare, Newspaper, Calendar, Link as LinkIcon, 
  Settings 
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard, active: true },
  { name: 'Directory', path: '/directory', icon: Users, active: true },
  { name: 'Profile', path: '/profile', icon: UserCircle, active: true },
  { name: 'Desk Booking', path: '/desk-booking', icon: CalendarDays, active: true },
  { name: 'Training', path: '/training', icon: GraduationCap, active: true },
  { name: 'HR Tickets', path: '/hr-tickets', icon: Briefcase, active: true },
  { name: 'Leave', path: '/leave', icon: CalendarDays, active: true },
  { name: 'Onboarding', path: '/onboarding', icon: UserPlus, active: true },
  { name: 'Wiki', path: '/wiki', icon: BookOpen, active: true },
  { name: 'My Buddy', path: '/buddy', icon: MessageSquare, active: true },
  { name: 'News', path: '/news', icon: Newspaper, active: true },
  { name: 'Calendar', path: '/calendar', icon: Calendar, active: true },
  { name: 'Links', path: '/links', icon: LinkIcon, active: true },
  { name: 'Admin', path: '/admin', icon: Settings, active: true },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full overflow-y-auto shrink-0 hidden md:flex">
      <div className="p-4 border-b border-slate-800 flex items-center h-16 shrink-0">
        <h2 className="text-xl font-bold text-white tracking-tight">Meridian Hub</h2>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          
          if (item.active) {
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    isActive ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.name}</span>
              </NavLink>
            );
          }

          return (
            <div
              key={item.name}
              title="Coming soon"
              className="flex items-center gap-3 px-3 py-2 rounded-md opacity-40 cursor-not-allowed"
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.name}</span>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

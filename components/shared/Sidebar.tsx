'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Hotel,
  LayoutDashboard,
  TrendingUp,
  History,
  Lightbulb,
  Film,
  Building2,
  Plus,
  Menu,
  LogOut,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigationItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Progress',
    href: '/progress',
    icon: TrendingUp,
  },
  {
    label: 'Recent Sessions',
    href: '/sessions',
    icon: History,
  },
  {
    label: 'Improvements',
    href: '/improvements',
    icon: Lightbulb,
  },
  {
    label: 'Organization',
    href: '/organization',
    icon: Building2,
  },
];

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuthContext();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo & Brand */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
            <Hotel className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              HospitalityAI
            </h1>
            <Badge variant="secondary" className="text-xs mt-0.5">
              <Sparkles className="w-3 h-3 mr-1" />
              AI Training
            </Badge>
          </div>
        </div>
      </div>

      {/* Scenarios Button */}
      <div className="p-4 border-b">
        <Button asChild className="w-full gap-2 bg-black hover:bg-black/90 text-white">
          <Link href="/scenarios" onClick={onLinkClick}>
            <Film className="h-4 w-4" />
            Scenarios
          </Link>
        </Button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* User Info */}
      <div className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 px-3 py-6 h-auto">
              <Avatar className="h-10 w-10">
                <AvatarImage src="" alt={user?.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                  {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start overflow-hidden">
                <p className="text-sm font-medium truncate w-full">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate w-full">
                  {user?.role}{user?.isOrgAdmin && ' • Admin'}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:bg-card h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent onLinkClick={() => {
              // Close the sheet after clicking a link
              document.body.click();
            }} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

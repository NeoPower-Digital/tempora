'use client';

import { ModeToggle } from '@/core/components/ui/ModeToggle';
import {
  NavigationMenu,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from '@/core/components/ui/NavigationMenu';
import { ROUTES } from '@/lib/constants/routes.const';
import { cn } from '@/lib/utils/tailwind';
import { Home, Hourglass, Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  { icon: <Home />, label: 'Home', href: ROUTES.HOME },
  {
    icon: <Plus />,
    label: 'Create Payment',
    href: ROUTES.RECURRING_PAYMENTS,
  },
] as const;

const Navbar: React.FC<{}> = () => {
  const pathName = usePathname();

  return (
    <>
      <div className="sticky top-0 z-50 flex w-full items-center justify-between p-4 border-b">
        <div className="flex items-end gap-2">
          <Hourglass size={36} />

          <h1 className="text-4xl font-logo leading-7">Tempora</h1>
        </div>

        <NavigationMenu className="gap-2">
          {menuItems.map(({ href, label, icon }, index) => (
            <Link key={index} href={href} legacyBehavior passHref>
              <NavigationMenuLink
                className={cn(
                  navigationMenuTriggerStyle(),
                  `gap-2 data-[active]:border-b data-[active]:border-primary`
                )}
                active={pathName === href}
              >
                {icon} {label}
              </NavigationMenuLink>
            </Link>
          ))}

          <ModeToggle />
        </NavigationMenu>
      </div>
    </>
  );
};

export default Navbar;

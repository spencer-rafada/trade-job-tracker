"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, LogOut, ChevronDown } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { formatUserGreeting } from "@/lib/utils/format";

interface UserMenuProps {
  firstName: string;
  lastName: string;
  email: string;
}

export function UserMenu({ firstName, lastName, email }: UserMenuProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(ROUTES.AUTH.LOGIN);
    router.refresh();
  };

  const displayName = formatUserGreeting(firstName, lastName);
  const fallbackName = email.split("@")[0]; // Use email username as fallback

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2">
          Hey, {firstName || fallbackName}!
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={() => router.push(ROUTES.SETTINGS.PROFILE)}
          className="cursor-pointer"
        >
          <User className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

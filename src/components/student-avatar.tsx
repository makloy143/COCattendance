"use client";

import { User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type StudentAvatarProps = {
  photoUrl?: string | null;
  firstName: string;
  lastName: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
};

const sizeClasses = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-16 text-lg",
  xl: "size-28 text-2xl",
};

export function StudentAvatar({
  photoUrl,
  firstName,
  lastName,
  className,
  size = "md",
}: StudentAvatarProps) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {photoUrl ? <AvatarImage src={photoUrl} alt={`${firstName} ${lastName}`} /> : null}
      <AvatarFallback className="bg-primary/10 text-primary">
        {initials || <User className="size-4" />}
      </AvatarFallback>
    </Avatar>
  );
}

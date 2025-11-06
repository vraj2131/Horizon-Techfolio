'use client';

import NextLink from 'next/link';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface LinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  prefetch?: boolean;
  onClick?: () => void;
}

export const Link = ({ href, children, className, prefetch = true, onClick }: LinkProps) => {
  return (
    <NextLink 
      href={href} 
      className={cn(className)}
      prefetch={prefetch}
      onClick={onClick}
    >
      {children}
    </NextLink>
  );
};


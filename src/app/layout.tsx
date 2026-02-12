import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarTrigger,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Home } from 'lucide-react';
import { Toaster } from "@/components/ui/toaster";
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'CellCraft',
  description: 'A lightweight browser-based spreadsheet app.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <SidebarProvider>
          <Sidebar>
            <SidebarHeader>
                <div className="flex items-center gap-2" data-sidebar="header-content">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15.8333 3.33337H4.16667C3.24619 3.33337 2.5 4.07957 2.5 5.00004V15C2.5 15.9205 3.24619 16.6667 4.16667 16.6667H15.8333C16.7538 16.6667 17.5 15.9205 17.5 15V5.00004C17.5 4.07957 16.7538 3.33337 15.8333 3.33337Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M12.5 3.33337V1.66671" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M7.5 3.33337V1.66671" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M2.5 8.33337H17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M6.66663 11.6666H8.33329V13.3333H6.66663V11.6666Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span className="sr-only">CellCraft</span>
                        </Link>
                    </Button>
                    <h1 className="text-lg font-semibold text-primary font-headline group-data-[collapsible=icon]:hidden">CellCraft</h1>
                </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive tooltip="Home">
                    <Link href="/">
                      <Home />
                      <span>Home</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
          </Sidebar>
          <SidebarInset>
            <header className="flex items-center justify-between p-2 border-b h-[57px]">
                <div className="flex items-center gap-2">
                    <SidebarTrigger/>
                    <h1 className="text-lg font-semibold">Home</h1>
                </div>
            </header>
            <div className="flex-grow flex flex-col">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}

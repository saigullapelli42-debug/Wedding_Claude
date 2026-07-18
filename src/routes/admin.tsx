import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { AdminAuthProvider, useAdminAuth } from "@/lib/auth";
import { AdminLoginForm, NotAuthorizedScreen } from "@/components/admin/AdminLogin";
import { AdminLayout, type AdminSection } from "@/components/admin/AdminLayout";
import { DashboardHome } from "@/components/admin/sections/DashboardHome";
import { GeneralSettings } from "@/components/admin/sections/GeneralSettings";
import { HeroSection } from "@/components/admin/sections/HeroSection";
import { CoupleDetails } from "@/components/admin/sections/CoupleDetails";
import { StoryTimeline } from "@/components/admin/sections/StoryTimeline";
import { GallerySection } from "@/components/admin/sections/GallerySection";
import { EventsSection } from "@/components/admin/sections/EventsSection";
import { FamilyMembersSection } from "@/components/admin/sections/FamilyMembersSection";
import { VenueSection } from "@/components/admin/sections/VenueSection";
import { GiftsSection } from "@/components/admin/sections/GiftsSection";
import { MusicSection } from "@/components/admin/sections/MusicSection";
import { SocialLinksSection } from "@/components/admin/sections/SocialLinksSection";
import { WebsiteSettingsSection } from "@/components/admin/sections/WebsiteSettingsSection";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [{ title: "Admin · Wedding Website" }],
  }),
});

function AdminPage() {
  return (
    <AdminAuthProvider>
      <AdminGate />
    </AdminAuthProvider>
  );
}

function AdminGate() {
  const { status } = useAdminAuth();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-cream">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (status === "signed-out") return <AdminLoginForm />;
  if (status === "signed-in-not-admin") return <NotAuthorizedScreen />;
  return <AdminDashboard />;
}

function AdminDashboard() {
  const [section, setSection] = useState<AdminSection>("dashboard");

  return (
    <AdminLayout section={section} onSectionChange={setSection}>
      {section === "dashboard" && (
        <DashboardHome onNavigate={(s) => setSection(s as AdminSection)} />
      )}
      {section === "general" && <GeneralSettings />}
      {section === "hero" && <HeroSection />}
      {section === "couple" && <CoupleDetails />}
      {section === "story" && <StoryTimeline />}
      {section === "gallery" && <GallerySection />}
      {section === "events" && <EventsSection />}
      {section === "family" && <FamilyMembersSection />}
      {section === "venue" && <VenueSection />}
      {section === "gifts" && <GiftsSection />}
      {section === "music" && <MusicSection />}
      {section === "social" && <SocialLinksSection />}
      {section === "website" && <WebsiteSettingsSection />}
    </AdminLayout>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { SiteAdminAuthProvider, useAdminAuth } from "@/lib/auth";
import { useSiteBySlug } from "@/lib/public-queries";
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

export const Route = createFileRoute("/$slug/admin")({
  component: SiteAdminPage,
  head: () => ({ meta: [{ title: "Admin · Wedding Website" }] }),
});

function SiteAdminPage() {
  const { slug } = Route.useParams();
  const siteQ = useSiteBySlug(slug);

  if (siteQ.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-cream">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (siteQ.isError || !siteQ.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-cream px-6 text-center">
        <p>No site found at "{slug}".</p>
      </div>
    );
  }

  return (
    <SiteAdminAuthProvider siteId={siteQ.data.id}>
      <AdminGate siteId={siteQ.data.id} />
    </SiteAdminAuthProvider>
  );
}

function AdminGate({ siteId }: { siteId: string }) {
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
  return <AdminDashboard siteId={siteId} />;
}

function AdminDashboard({ siteId }: { siteId: string }) {
  const [section, setSection] = useState<AdminSection>("dashboard");

  return (
    <AdminLayout section={section} onSectionChange={setSection}>
      {section === "dashboard" && (
        <DashboardHome siteId={siteId} onNavigate={(s) => setSection(s as AdminSection)} />
      )}
      {section === "general" && <GeneralSettings siteId={siteId} />}
      {section === "hero" && <HeroSection siteId={siteId} />}
      {section === "couple" && <CoupleDetails siteId={siteId} />}
      {section === "story" && <StoryTimeline siteId={siteId} />}
      {section === "gallery" && <GallerySection siteId={siteId} />}
      {section === "events" && <EventsSection siteId={siteId} />}
      {section === "family" && <FamilyMembersSection siteId={siteId} />}
      {section === "venue" && <VenueSection siteId={siteId} />}
      {section === "gifts" && <GiftsSection siteId={siteId} />}
      {section === "music" && <MusicSection siteId={siteId} />}
      {section === "social" && <SocialLinksSection siteId={siteId} />}
      {section === "website" && <WebsiteSettingsSection siteId={siteId} />}
    </AdminLayout>
  );
}

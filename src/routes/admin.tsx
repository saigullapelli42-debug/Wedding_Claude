import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, ExternalLink, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AccountAuthProvider, useAccountAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { createNewSite } from "@/lib/create-site";
import { deleteAllSiteFiles } from "@/lib/storage";
import type { Tables } from "@/lib/database.types";

export const Route = createFileRoute("/admin")({
  component: AdminDirectoryPage,
  head: () => ({ meta: [{ title: "My Wedding Sites" }] }),
});

function AdminDirectoryPage() {
  return (
    <AccountAuthProvider>
      <DirectoryGate />
    </AccountAuthProvider>
  );
}

function DirectoryGate() {
  const { status } = useAccountAuth();
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-cream">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (status === "signed-out") return <AccountLoginForm />;
  return <SitesDirectory />;
}

function AccountLoginForm() {
  const { signIn } = useAccountAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    const result = await signIn(email.trim(), password);
    setLoading(false);
    if (result.error) setError(result.error);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-cream px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-white p-8 shadow-luxe">
        <h1 className="font-serif text-2xl text-center mb-1">Sign In</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Manage your wedding website(s).
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}

type SiteWithRole = Tables<"sites">;

async function fetchMySites(userId: string): Promise<SiteWithRole[]> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("site_id, sites(*)")
    .eq("user_id", userId)
    .eq("role", "admin");
  if (error) throw error;
  return (data ?? [])
    .map((row) => row.sites as unknown as SiteWithRole)
    .filter((s): s is SiteWithRole => !!s);
}

function DeleteSiteButton({ site, onDeleted }: { site: SiteWithRole; onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const matches = confirmText.trim() === site.slug;

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteAllSiteFiles(site.id);
      const { error } = await supabase.from("sites").delete().eq("id", site.id);
      if (error) throw error;
      toast.success(`${site.groom_name} & ${site.bride_name}'s site was deleted`);
      setOpen(false);
      setConfirmText("");
      onDeleted();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete site");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setConfirmText("");
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          aria-label="Delete site"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {site.groom_name} &amp; {site.bride_name}'s site?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                This permanently deletes everything for this site — photos, events, timeline,
                gallery, family members, RSVPs, blessings, and all settings. This cannot be undone.
              </p>
              <p>
                Type <span className="font-mono font-semibold text-foreground">{site.slug}</span>{" "}
                below to confirm.
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={site.slug}
                autoFocus
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={!matches || deleting}
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Delete Permanently
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function SitesDirectory() {
  const { session, signOut } = useAccountAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const userId = session?.user.id ?? "";

  const { data: sites, isLoading } = useQuery({
    queryKey: ["my_sites", userId],
    queryFn: () => fetchMySites(userId),
    enabled: !!userId,
  });

  const [brideName, setBrideName] = useState("");
  const [groomName, setGroomName] = useState("");
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!brideName.trim() || !groomName.trim()) {
      toast.error("Enter both names first");
      return;
    }
    setCreating(true);
    try {
      const { slug } = await createNewSite(brideName.trim(), groomName.trim());
      toast.success("Site created!");
      queryClient.invalidateQueries({ queryKey: ["my_sites", userId] });
      setDialogOpen(false);
      setBrideName("");
      setGroomName("");
      navigate({ to: "/$slug/admin", params: { slug } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create site");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-cream px-4 py-10 sm:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl gold-text">My Wedding Sites</h1>
            <p className="text-sm text-muted-foreground mt-1">{session?.user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" /> New Wedding Site
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a New Wedding Site</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label>Groom's Name</Label>
                    <Input
                      value={groomName}
                      onChange={(e) => setGroomName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Bride's Name</Label>
                    <Input
                      value={brideName}
                      onChange={(e) => setBrideName(e.target.value)}
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your site's URL will be generated automatically from these names (e.g.{" "}
                    <span className="font-mono">yoursite.com/rahul-anjali</span>) — you can see it
                    once it's created.
                  </p>
                  <Button type="submit" className="w-full" disabled={creating}>
                    {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Site
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            <Button size="sm" variant="outline" onClick={() => signOut()}>
              Sign Out
            </Button>
          </div>
        </div>

        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : !sites || sites.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            No wedding sites yet — click "New Wedding Site" above to create your first one.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {sites.map((site) => (
              <div key={site.id} className="rounded-xl border bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-serif text-xl">
                    {site.groom_name} &amp; {site.bride_name}
                  </h3>
                  <DeleteSiteButton
                    site={site}
                    onDeleted={() =>
                      queryClient.invalidateQueries({ queryKey: ["my_sites", userId] })
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground mb-4 font-mono">/{site.slug}</p>
                <div className="flex gap-2">
                  <Link
                    to="/$slug"
                    params={{ slug: site.slug }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs hover:bg-muted"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> View Site
                  </Link>
                  <Link
                    to="/$slug/admin"
                    params={{ slug: site.slug }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-brand-gold text-white px-3 py-1.5 text-xs hover:opacity-90"
                  >
                    <Settings className="h-3.5 w-3.5" /> Manage
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

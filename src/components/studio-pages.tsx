import type { StudioScope } from "@/lib/use-scoped-content";
import { ChannelEditView, ChannelView } from "./shared/channel-view";
import { DashboardView } from "./shared/dashboard-view";
import { LibraryView } from "./shared/library-view";
import { SettingsView } from "./shared/settings-view";
import { StudioView } from "./shared/studio-view";
import { VerificationView } from "./shared/verification-view";

/**
 * Thin barrel mapping the route-facing page names to the scoped feature views.
 * Route files import these and pass the shell scope.
 */
export function DashboardPage({ scope }: { scope: StudioScope }) {
  return <DashboardView scope={scope} />;
}

export function LibraryPage({ scope }: { scope: StudioScope }) {
  return <LibraryView scope={scope} />;
}

export function StudioPage({ scope }: { scope: StudioScope }) {
  return <StudioView scope={scope} />;
}

export function ChannelPage({ scope }: { scope: StudioScope }) {
  return <ChannelView scope={scope} />;
}

export function ChannelEditPage({ scope }: { scope: StudioScope }) {
  return <ChannelEditView scope={scope} />;
}

export function VerificationPage({ scope }: { scope: StudioScope }) {
  return <VerificationView scope={scope} />;
}

export function SettingsPage({ scope }: { scope: StudioScope }) {
  return <SettingsView scope={scope} />;
}

export { MembersView as MembersPage } from "./org/members-view";
export { AdminDashboardPage, AdminUsersPage } from "./admin/admin-pages";
export {
  AdminContentReviewPage,
  AdminReportsPage,
  AdminSettingsPage,
  AdminVerificationRequestsPage,
} from "./admin/admin-moderation";

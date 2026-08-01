import type { ReactNode } from "react";

// Content dictionary for HelpDrawer.tsx, keyed by DemoApp.tsx's `view` state
// values. Hand-copied from docs/UAT-User-Manual.md, kept in sync manually —
// not fetched/parsed from that file. See active_progress.md for the plan to
// revisit this (e.g. role-aware content, generated from the manual itself)
// once the UI has stabilized past the current MUI migration.
export interface HelpSection {
  heading: string;
  body: ReactNode;
}

export interface HelpTopic {
  title: string;
  sections: HelpSection[];
  managerNote?: ReactNode;
}

export const HELP_CONTENT: Record<string, HelpTopic> = {
  projectDetail: {
    title: "Project 360 — Help",
    sections: [
      {
        heading: "Project Details",
        body: "Read-only summary — Account, Status, Owner, and Bid Submission Date. Click Edit in the top right to change any of these.",
      },
      {
        heading: "Opportunities",
        body: (
          <>
            All deals linked to this Project. Click <strong>+ Add</strong> to create a new Opportunity for
            this Project directly. Click any Opportunity card to jump straight to its detail view, or use
            Edit to update it without leaving this screen.
          </>
        ),
      },
      {
        heading: "Activity",
        body: "Log and review visits, calls, and interactions tied to this Project directly.",
      },
    ],
  },

  customers: {
    title: "Account Management — Help",
    sections: [
      {
        heading: "Customers Tab",
        body: (
          <>
            Directory of all hospitals and clinics. Click <strong>+ Add</strong> to create a new Account, or
            click any Account to open its Customer 360 view. Use the search box to find a customer by name —
            results update automatically as you type, no need to press Enter.
          </>
        ),
      },
      {
        heading: "Projects Tab",
        body: (
          <>
            Groups multiple opportunities under a single strategic initiative (e.g. a hospital expansion or
            a government tender). Click <strong>+ Add</strong> to create a new Project, or click a Project to
            jump straight to its detail view. Use the search box to find a project by name or hospital —
            results update automatically as you type.
          </>
        ),
      },
    ],
  },

  customer360: {
    title: "Customer 360 — Help",
    sections: [
      { heading: "Overview", body: "Basic hospital details and primary contacts." },
      { heading: "Activity", body: "Full history of visits, calls, and interactions logged against this account." },
      {
        heading: "Stakeholders",
        body: "Track relationships — influence level and Net Promoter Score (NPS) for each contact (e.g. Dr. Ahmed, Purchase Manager).",
      },
      {
        heading: "Projects",
        body: "Active strategic initiatives at this hospital. Click any Project card to jump straight to its detail view.",
      },
      {
        heading: "Opportunities",
        body: "All active and closed deals specific to this hospital. Click any Opportunity card to jump straight to its detail view.",
      },
      {
        heading: "Installed Base",
        body: "Equipment this hospital already owns — useful context before pitching an upgrade or a competing product.",
      },
    ],
  },

  opportunities: {
    title: "Pipeline — Help",
    sections: [
      {
        heading: "Stages",
        body: (
          <>
            Opportunities move left to right through 7 stages: <strong>Lead → Qualified → Demo → Clinical
            Evaluation → Negotiation → Order → Delivery &amp; Installation</strong>.
          </>
        ),
      },
      {
        heading: "Kanban vs. List view",
        body: (
          <>
            Use the toggle above the board to switch views. <strong>Kanban</strong> (default) shows deals as
            cards in columns by stage — drag a card to a new column to advance it. <strong>List</strong> shows
            every deal as a single scrollable row, better for scanning many deals at once or when you don't
            need to change stages.
          </>
        ),
      },
      {
        heading: "Moving deals",
        body: "Some stage moves require certain fields to already be filled in (e.g. a Lead Source) — if a move is blocked, the app will tell you what's missing.",
      },
      {
        heading: "Search",
        body: "Use the search box at the top to find a deal by opportunity name or hospital name — results filter instantly as you type, no need to press Enter.",
      },
      { heading: "Filters", body: "Use the filters at the top to focus on specific stages, owners, or expected closing dates." },
    ],
    managerNote: "Use the Owner filter to review a specific rep's pipeline health, or leave it blank to see your whole team's deals at once.",
  },

  opportunityDetail: {
    title: "Opportunity Detail — Help",
    sections: [
      {
        heading: "Overview",
        body: "Core deal fields — Stage, Status, Owner, Win Probability (you can manually override this based on field intelligence), and key dates.",
      },
      { heading: "Activity", body: "Log and review visits, calls, and interactions specific to this deal." },
      {
        heading: "Next Actions",
        body: "Follow-up tasks tied to this opportunity — same rules as the main Next Actions screen (see its Help).",
      },
      {
        heading: "Products",
        body: "The equipment/items included in this deal. Once you add Products here, the Opportunity's value is calculated automatically from them (quantity × price − discount) — it replaces any manually-entered estimate.",
      },
      {
        heading: "Splits",
        body: "How revenue credit for this deal is divided among contributors. Splits must always add up to 100%; by default the creator gets 100% until adjusted. Only teammates in the same SBU as the Opportunity can be added as a split participant.",
      },
      { heading: "Stakeholders", body: "The contacts (linked from the Account) actually involved in this specific deal." },
    ],
  },

  nextActions: {
    title: "Next Actions — Help",
    sections: [
      { heading: "Your task list", body: "Displays all your upcoming reminders and scheduled tasks." },
      {
        heading: "Jumping to the deal",
        body: "Clicking on a reminder takes you directly to the related Account or Opportunity so you can execute the task immediately.",
      },
      {
        heading: "Completing a Next Action",
        body: (
          <>
            Click the reminder's Complete action, then describe what you actually did — this closing note is
            mandatory, since every follow-up needs a record of how it was resolved. If that resolution itself
            surfaces a new follow-up, you can add one right there before saving — it'll appear as a new Next
            Action.
          </>
        ),
      },
    ],
  },

  catalog: {
    title: "Product Catalog — Help",
    sections: [
      {
        heading: "Company-wide browsing",
        body: "Every product from every SBU is visible to everyone, so you always know what Cabio offers even outside your own SBU. Filter by SBU using the buttons at the top.",
      },
      {
        heading: "Search",
        body: "Use the search box to find a product by name, brand, or SBU — results update automatically as you type.",
      },
      {
        heading: "Adding to a deal",
        body: "You can only add a product to an Opportunity if it belongs to that Opportunity's own SBU — browsing is company-wide, but adding to a deal stays SBU-scoped.",
      },
    ],
  },

  users: {
    title: "User Directory — Help",
    sections: [
      {
        heading: "Managing the team",
        body: "Manage access for the team, assign roles, and allocate users to specific Zones and SBUs.",
      },
    ],
  },
};

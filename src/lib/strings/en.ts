/**
 * Every user-facing string in the application.
 *
 * Copy lived inline in JSX, which meant changing a sentence required finding
 * which of 33 component files it was in, and there was no way to see the
 * product's voice in one place. This file is that place.
 *
 * Deliberately flat and dot-namespaced, not nested: a flat object gives exact
 * key autocompletion and makes a missing key a compile error rather than
 * `undefined` rendering as blank. The dots are naming convention only.
 *
 * D1 is answered English-only — there is no French locale and no i18n library.
 * This exists for maintainability, not translation. If that ever changes, a
 * second file with the same keys is the whole job.
 *
 * Not included: `aria-label`s and `alt` text that name a UI mechanism rather
 * than speak to the user ("Close notifications"), which stay inline next to the
 * element they describe. Taxonomy labels live in src/lib/taxonomy.ts and
 * notification sentences in src/lib/notifications.ts; neither is duplicated
 * here.
 */
export const en = {
  // ── Auth gate ──────────────────────────────────────────────────────────
  "auth.gate.profile.title": "See your posts & activity",
  "auth.gate.profile.desc":
    "Sign in with your @estin.dz account to view and manage your found and lost reports.",
  "auth.gate.browse.title": "ESTIN students only",
  "auth.gate.browse.desc":
    "Sign in with your @estin.dz account to browse lost and found items.",
  "auth.gate.report.title": "Sign in first",
  "auth.gate.report.desc":
    "You need to be signed in with your @estin.dz account to report an item.",
  "auth.gate.default.title": "ESTIN students only",
  "auth.gate.default.desc":
    "Sign in with your @estin.dz account to access this page.",
  "auth.gate.note.prefix": "Only",
  "auth.gate.note.suffix": "accounts will be accepted.",
  "auth.banned.title": "Account suspended",
  "auth.banned.desc":
    "Your account has been suspended. Contact the FINDit team if you think this is a mistake.",
  "auth.google.continue": "Continue with Google",
  "auth.google.signingIn": "Signing in...",

  // ── Generic ────────────────────────────────────────────────────────────
  "common.loading": "Loading...",
  "common.confirm": "Confirm",
  "common.cancel": "Cancel",
  "common.delete": "Delete",
  "common.goHome": "Go home",
  "common.browseItems": "Browse items",
  "common.tryAgain": "Try again",
  "common.backToBrowse": "Back to browse",

  // ── Board / item grid ──────────────────────────────────────────────────
  "board.loading": "Loading items...",
  "board.empty.filtered.title": "No results found",
  "board.empty.found.title": "No found items yet",
  "board.empty.lost.title": "No lost reports yet",
  "board.empty.found.desc":
    "Nothing has been posted yet. If you found something, be the first to post it.",
  "board.empty.lost.desc":
    "Nobody has reported a lost item matching your filters.",
  "board.empty.found.cta": "Post a found item",
  "board.empty.lost.cta": "Report a lost item",
  "board.search.placeholder": "Search by category, location, description...",
  "board.prompt.lead": "Don't see your item?",
  "board.prompt.rest":
    "Post a lost report and we'll notify you if something matching shows up.",

  // ── Filters ────────────────────────────────────────────────────────────
  "filters.category": "Category",
  "filters.location": "Location",

  // ── Item card ──────────────────────────────────────────────────────────
  "item.status.found": "Found",
  "item.status.lost": "Lost",
  "item.status.claimed": "Claimed",
  "item.status.expired": "Expired",
  "item.poster.you": "You",
  "item.poster.anonymous": "ESTIN Student",

  // ── Claim modal ────────────────────────────────────────────────────────
  "claim.title.found": "Is this yours?",
  "claim.title.lost": "Did you find this?",
  "claim.title.success": "Success!",
  "claim.desc.pending":
    "Confirm below to mark this item as resolved. You'll get the poster's contact details straight after.",
  "claim.desc.success":
    "This item has been marked as resolved. Here's how to reach the poster.",
  "claim.section.item": "Item info",
  "claim.section.contact": "Contact the poster",
  "claim.contact.none":
    "No contact address on file. They've been notified and can reach you.",
  "claim.cta.found": "Yes, this is mine →",
  "claim.cta.lost": "Yes, I found this →",
  "claim.cta.saving": "Saving...",
  "claim.cta.done": "Done ✓",
  "claim.error.notFound": "This item no longer exists.",
  "claim.error.alreadyClaimed": "This item has already been claimed.",
  "claim.error.expired":
    "This listing has expired and can no longer be claimed.",
  "claim.error.selfClaim": "You can't claim your own item.",
  "claim.error.rateLimited":
    "You've claimed a lot of items in the last hour. Try again later.",
  "claim.error.generic": "Failed to claim item.",
  "claim.error.retry": "Failed to claim item. Please try again.",

  // ── Profile ────────────────────────────────────────────────────────────
  "profile.success": "✓ Your post was submitted successfully!",
  "profile.sectionLabel": "Your posts",
  "profile.tab.found": "✦ Found",
  "profile.tab.lost": "Lost",
  "profile.stat.found": "Found posts",
  "profile.stat.lost": "Lost reports",
  "profile.stat.resolved": "Items resolved",
  "profile.role": "ESTIN · Student",
  "profile.empty.title": "No {type} items yet",
  "profile.empty.desc":
    "You haven't posted any {type} items. Help your fellow ESTIN students!",
  "profile.empty.cta.found": "Post a found item →",
  "profile.empty.cta.lost": "Report a lost item →",
  "profile.card.resolve": "Mark resolved ✓",
  "profile.card.unclaim": "Undo claim",
  "profile.delete.title": "Delete this post?",
  "profile.delete.message":
    "This action cannot be undone. The item will be permanently removed from FINDit.",
  "profile.error.resolve": "Failed to mark as resolved. Please try again.",
  "profile.error.delete": "Failed to delete item. Please try again.",
  "profile.error.unclaim": "Failed to undo the claim. Please try again.",
  "profile.unclaim.notFound": "This item no longer exists.",
  "profile.unclaim.notOwner": "You can only undo claims on your own posts.",
  "profile.unclaim.notClaimed": "This item is already back on the board.",

  // ── Report pages ───────────────────────────────────────────────────────
  "report.found.title.prefix": "Report a",
  "report.found.title.accent": "Found",
  "report.found.title.suffix": "Item",
  "report.found.desc":
    "Found something on campus? Post it here so the owner can find it.",
  "report.lost.title.prefix": "Report a",
  "report.lost.title.accent": "Lost",
  "report.lost.title.suffix": "Item",
  "report.lost.desc":
    "Lost something on campus? Post it here so someone can help you find it.",

  // ── Notifications ──────────────────────────────────────────────────────
  "notifications.title": "Notifications",
  "notifications.empty": "No notifications",
  "notifications.markAllRead": "Mark all read",
  "notifications.unread": "{count} unread",
  "notifications.count.one": "{count} notification",
  "notifications.count.many": "{count} notifications",
  "notifications.empty.title": "No notifications yet.",
  "notifications.empty.desc":
    "They'll show up here when someone claims your item.",


  // ── Report form ────────────────────────────────────────────────────────
  "form.q.what.found": "What did you find?",
  "form.q.what.lost": "What did you lose?",
  "form.q.where.found": "Where did you find it?",
  "form.q.where.lost": "Where did you lose it?",
  "form.q.when.found": "When did you find it?",
  "form.q.when.lost": "When did you lose it?",
  "form.label.category": "Category",
  "form.label.date": "Date",
  "form.label.details": "Details",
  "form.label.photo": "Photo",
  "form.label.itemIs": "Item is",
  "form.label.whereNow": "Where is it now?",
  "form.label.whereExactly": "Where exactly?",
  "form.label.foundAt": "Found at",
  "form.label.lostAt": "Lost at",
  "form.label.notSure": "Not sure",
  "form.label.preview": "Preview",
  "form.placeholder.description":
    "Colour, brand, any details that could help identify it…",
  "form.submit.found": "Post found item →",
  "form.submit.lost": "Post lost item →",
  "form.submit.posting": "Posting…",
  "form.submit.posted": "Posted!",
  "form.success.found.title": "Thank you!",
  "form.success.lost.title": "We hope you find it!",
  "form.success.subtitle": "You're doing a good thing.",
  "form.success.found.desc":
    "Your found item report is live. If the owner sees it, they'll reach out to claim it.",
  "form.success.lost.desc":
    "Your lost item report is live. We hope someone finds it and reaches out!",
  "form.error.descriptionLength": "Description must be 400 characters or fewer.",
  "form.error.imageOnly": "Only image files are accepted.",
  "form.error.photoSize": "Photo must be under 5 MB.",
  "form.error.photoUpload": "Photo upload failed. Please try again.",
  "form.error.photoTimeout":
    "Photo upload is taking too long. Try a smaller image or a better connection.",
  "form.error.saveTimeout":
    "Saving your report is taking too long. Please try again.",
  "form.error.serverTimeout":
    "The server took too long to respond. Please check your connection and try again.",
  "form.error.save": "Failed to save item. Please try again.",
  "form.error.invalid": "Invalid form data. Please refresh and try again.",
  "form.error.generic": "Something went wrong. Please try again.",

  // ── Admin ──────────────────────────────────────────────────────────────
  "admin.denied.title": "Access Denied",
  "admin.denied.desc": "You don't have permission to access this page.",
  "admin.refresh": "Refresh",
  "admin.error.load": "Failed to load dashboard data. Please try refreshing.",
  "admin.stat.total": "Total Items",
  "admin.stat.found": "Found",
  "admin.stat.lost": "Lost",
  "admin.stat.resolved": "Resolved",
  "admin.stat.users": "Users",
  "admin.tab.items": "Items ({count})",
  "admin.tab.users": "Users ({count})",
  "admin.col.type": "Type",
  "admin.col.category": "Category",
  "admin.col.location": "Location",
  "admin.col.status": "Status",
  "admin.col.user": "User",
  "admin.col.date": "Date",
  "admin.col.name": "Name",
  "admin.col.email": "Email",
  "admin.col.joined": "Joined",
  "admin.col.actions": "Actions",
  "admin.filter.allTypes": "All Types",
  "admin.filter.allStatuses": "All Statuses",
  "admin.filter.allCategories": "All Categories",
  "admin.search.items": "Search UID, email, description…",
  "admin.search.users": "Search name, email, UID…",
  "admin.state.open": "Open",
  "admin.state.claimed": "Claimed",
  "admin.state.active": "Active",
  "admin.state.banned": "Banned",
  "admin.delete.title": "Delete Item",
  "admin.delete.message":
    "Are you sure you want to permanently delete this item? This cannot be undone.",
  "admin.error.save": "Save failed",
  "admin.error.create": "Create failed",
  "admin.error.update": "Update failed",
  "admin.error.notAuthenticated": "Not authenticated",
  "admin.error.deleteItem": "Failed to delete item. Please try again.",
  "admin.error.statusUpdate": "Failed to update item status. Please try again.",
  "admin.error.banUpdate": "Failed to update user ban status. Please try again.",
  "admin.modal.add": "Add Item",
  "admin.modal.edit": "Edit Item",
  "admin.modal.save": "Save Changes",
  "admin.modal.saving": "Saving…",
  "admin.modal.zone": "Zone",
  "admin.modal.photoUrl": "Photo URL",
  "admin.modal.userEmail": "User Email",
  "admin.modal.userName": "User Name",
  "admin.modal.userIdHint": "Supabase User UUID",
  "admin.modal.displayName": "Display name",
  "admin.modal.descriptionPlaceholder": "Optional description…",
  "admin.modal.error.category": "Category is required",
  "admin.modal.error.location": "Location is required",
  "admin.modal.error.date": "Date is required",
  "admin.modal.error.userId": "User ID is required",
  "admin.modal.error.whereLeft": "Where left is required for found items",

  // ── Home (P3-7 replaces this section wholesale) ─────────────────────────
  "home.stats.posted": "Items posted so far",
  "home.stats.reunions": "Successful reunions",
  "home.stats.emails": "Emails saved",

  // ── Errors ─────────────────────────────────────────────────────────────
  "notFound.eyebrow": "Page not found",
  "notFound.title": "This page got lost too.",
  "notFound.desc":
    "The page you're looking for doesn't exist or has been moved. Let's get you back on track.",
  "error.code": "Oops",
  "error.eyebrow": "Something went wrong",
  "error.title": "This page hit an unexpected error.",
  "error.desc": "Try again — if it keeps happening, let us know.",

  // ── Homepage auth rejection (P0-7) ─────────────────────────────────────
  "auth.error.domain":
    "FINDit is for ESTIN students. Sign in with your @estin.dz Google account.",
  "auth.error.callback": "Sign-in didn't complete. Please try again.",
} as const;

export type StringKey = keyof typeof en;

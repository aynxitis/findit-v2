/**
 * Every user-facing string in the app, in one flat keyed object.
 *
 * This is for maintainability, not translation — there is no i18n library and
 * English is the only locale. The point is that copy stops being scattered
 * across JSX so it can be found, reviewed and changed in one place.
 *
 * Extraction rules, so this file stays trustworthy:
 *
 *  - Copy is moved verbatim. Where JSX used entities (&apos;, &quot;, &amp;)
 *    the catalogue holds the real character — these are JS strings, not JSX,
 *    and the rendered text is identical.
 *  - Where JSX wrapped a sentence across source lines, the catalogue holds the
 *    single space JSX itself collapses that newline into. Again: same rendered
 *    output.
 *  - Nothing is reworded. Typos and awkward phrasing are preserved exactly and
 *    reported separately.
 */

export const en = {
  // ── Errors and empty routes ────────────────────────────────────────────────
  "error.eyebrow": "Something went wrong",
  "error.code": "Oops",
  "error.heading": "This page hit an unexpected error.",
  "error.body": "Try again — if it keeps happening, let us know.",
  "error.retry": "Try again",
  "error.home": "Go home",

  "notFound.code": "404",
  "notFound.eyebrow": "Page not found",
  "notFound.heading": "This page got lost too.",
  "notFound.body":
    "The page you're looking for doesn't exist or has been moved. Let's get you back on track.",
  "notFound.home": "Go home",
  "notFound.browse": "Browse items",

  // ── Shared UI ──────────────────────────────────────────────────────────────
  "confirm.confirm": "Confirm",
  "confirm.cancel": "Cancel",
  "common.loadingShort": "...",

  // ── Auth ───────────────────────────────────────────────────────────────────
  "auth.google.signingIn": "Signing in...",
  "auth.google.continue": "Continue with Google",
  "auth.notice.domain": "Only @estin.dz accounts are allowed.",
  "auth.notice.generic": "Sign-in failed. Please try again.",

  // ── Home ───────────────────────────────────────────────────────────────────
  "home.stats.posted": "Items posted so far",
  "home.stats.reunions": "Successful reunions",
  "home.stats.emails": "Emails saved",

  "home.strip.tagline": "Stop the email spam. Find your stuff.",
  "home.strip.brand": "FINDit",
  "home.strip.year": "2026",
  "home.strip.school": "ESTIN",
  "home.strip.author": "Built by Anis BELAMRI",

  // ── Navigation and chrome ──────────────────────────────────────────────────
  "nav.signIn": "Sign in",
  "nav.account": "Account",
  "nav.profile": "Profile",
  "nav.logoAlt": "FINDit",
  "nav.notifications": "Notifications",

  "footer.made": "Made with \u2665 by a student, for students \u00b7 FINDit Campus Lost & Found",
  "footer.privacy": "Privacy Policy",
  "footer.terms": "Terms of Service",
  "footer.rights": "Anis Belamri \u00b7 All rights reserved",

  // ── Auth gate ──────────────────────────────────────────────────────────────
  "authGate.profile.title": "See your posts & activity",
  "authGate.profile.description":
    "Sign in with your @estin.dz account to view and manage your found and lost reports.",
  "authGate.browse.title": "ESTIN students only",
  "authGate.browse.description":
    "Sign in with your @estin.dz account to browse lost and found items.",
  "authGate.report.title": "Sign in first",
  "authGate.report.description":
    "You need to be signed in with your @estin.dz account to report an item.",
  "authGate.default.title": "ESTIN students only",
  "authGate.default.description":
    "Sign in with your @estin.dz account to access this page.",
  "authGate.suspended.title": "Account suspended",
  "authGate.suspended.description":
    "Your account has been suspended. Contact the FINDit team if you think this is a mistake.",
  "authGate.noteBefore": "Only",
  "authGate.noteDomain": "@estin.dz",
  "authGate.noteAfter": "accounts will be accepted.",
  "authGate.loading": "Loading...",

  // ── Item grid ──────────────────────────────────────────────────────────────
  "itemGrid.loading": "Loading items...",
  "itemGrid.errorSuffix": ". Please refresh.",
  "itemGrid.empty.search.title": "No results found",
  "itemGrid.empty.found.title": "No found items yet",
  "itemGrid.empty.lost.title": "No lost reports yet",
  "itemGrid.empty.found.body":
    "Nothing has been posted yet. If you found something, be the first to post it.",
  "itemGrid.empty.lost.body":
    "Nobody has reported a lost item matching your filters.",
  "itemGrid.empty.found.cta": "Post a found item",
  "itemGrid.empty.lost.cta": "Report a lost item",

  // ── Item card ──────────────────────────────────────────────────────────────
  "itemCard.badge.claimed": "Claimed",
  "itemCard.badge.resolved": "Resolved",
  "itemCard.badge.expired": "Expired",
  "itemCard.badge.found": "Found",
  "itemCard.badge.lost": "Lost",
  "itemCard.action.alreadyClaimed": "Already claimed",
  "itemCard.action.alreadyResolved": "Already resolved",
  "itemCard.action.ownPost": "Your post",
  "itemCard.action.expired": "Post expired",
  "itemCard.action.claimFound": "This is mine",
  "itemCard.action.claimLost": "I found this",

  // ── Filters ────────────────────────────────────────────────────────────────
  "filters.category": "Category",
  "filters.location": "Location",
  "filters.clear": "Clear filters",

  // ── Notifications ──────────────────────────────────────────────────────────
  "notifications.title": "Notifications",
  "notifications.close": "Close notifications",
  "notifications.none": "No notifications",
  "notifications.markAllRead": "Mark all read",
  "notifications.emptyTitle": "No notifications yet.",
  "notifications.emptyBody": "They'll show up here when someone claims your item.",
  "notifications.fallback": "Someone interacted with your post.",

  // ── Claim modal ────────────────────────────────────────────────────────────
  "claim.title.success": "Success!",
  "claim.title.found": "Is this yours?",
  "claim.title.lost": "Did you find this?",
  "claim.description.success":
    "This item has been marked as resolved. Reach out to coordinate!",
  "claim.description.pending": "Confirm below to mark this item as resolved.",
  "claim.itemInfo": "Item info",
  "claim.posterInfo": "Poster info",
  "claim.posterFallback": "ESTIN Student",
  "claim.submit.done": "Done! \u2713",
  "claim.submit.saving": "Saving...",
  "claim.submit.found": "Yes, this is mine \u2192",
  "claim.submit.lost": "Yes, I found this \u2192",
  "claim.error.notFound": "This item no longer exists.",
  "claim.error.alreadyClaimed": "This item has already been claimed.",
  "claim.error.expired": "This listing has expired and can no longer be claimed.",
  "claim.error.selfClaim": "You can't claim your own item.",
  "claim.error.rateLimited":
    "You've claimed too many items in the last hour. Try again later.",
  "claim.error.generic": "Failed to claim item.",
  "claim.error.rpc": "Failed to claim item. Please try again.",
  "claim.error.fallback": "Failed to claim item",

  // ── Legal pages ────────────────────────────────────────────────────────────
  // Paragraphs are split into fragments around mid-sentence <strong>/<a>.
  // Joining them would require changing the markup, which extraction does not
  // license. The `.a`/`.b`/`.c` suffixes are those fragments, in order.
  "legal.back": "\u2190 Back to FINDit",
  "legal.eyebrow": "Legal",
  "legal.updated": "Last updated: February 2026",
  "legal.contact.title": "Contact",
  "legal.contact.or": "or on",
  "legal.email": "findit@estin.dz",
  "legal.github": "GitHub",

  "privacy.title.a": "Privacy",
  "privacy.title.b": "Policy",
  "privacy.whoWeAre.title": "Who we are",
  "privacy.whoWeAre.a": "FINDit is a campus lost & found platform built for students at",
  "privacy.whoWeAre.strong": "ESTIN Bejaia",
  "privacy.whoWeAre.b":
    ". It was created by a student, for students \u2014 not a company, not a business. There are no ads, no trackers, no data selling.",
  "privacy.collect.title": "What we collect",
  "privacy.collect.intro":
    "When you sign in with Google, we receive the following from your Google account:",
  "privacy.collect.name.strong": "Full name",
  "privacy.collect.name.rest": " \u2014 to display on your posts and profile.",
  "privacy.collect.email.strong": "Email address",
  "privacy.collect.email.rest":
    " \u2014 to verify you're an ESTIN student (must end in @estin.dz) and to allow item owners to contact you.",
  "privacy.collect.photo.strong": "Profile picture",
  "privacy.collect.photo.rest":
    " \u2014 displayed in the navigation bar while you're signed in.",
  // The leading space on those two is REQUIRED. Do not remove it.
  //
  // All three "What we collect" paragraphs are written `<strong>\u2026</strong> \u2014
  // text` in the source, but JSX drops the leading space of a text node that
  // wraps across source lines and keeps it when the node fits on one. "Full
  // name" fits on one line and rendered correctly; the other two wrapped, so
  // production rendered "Email address\u2014 to verify" and "Profile picture\u2014
  // displayed" with the space missing.
  //
  // That was a defect, not house style, and it is corrected here \u2014 all three
  // now read consistently. It is recorded so nobody restores the missing
  // space believing the old output was canonical.
  "privacy.collect.outro":
    "We do not collect passwords. We do not access any other Google account data.",
  "privacy.why.title": "Why we collect it",
  "privacy.why.a": "Your email is used",
  "privacy.why.strong": "only",
  "privacy.why.b":
    "to verify that you're a student at ESTIN. Without this check, anyone on the internet could post to the platform.",
  "privacy.why.p2":
    "Your name and photo are used to make the experience feel personal and to show item ownership. Your contact email may be shared with another verified ESTIN student if their lost item matches something you found \u2014 this is the core purpose of the app.",
  "privacy.store.title": "How we store it",
  "privacy.store.a": "Your data is stored in",
  "privacy.store.strong": "Supabase, a PostgreSQL database",
  "privacy.store.b":
    ". Access is restricted to verified @estin.dz accounts only. No third parties have access to your data.",
  "privacy.visibility.title": "Who can see your data",
  "privacy.visibility.your": "Your",
  "privacy.visibility.name.strong": "name",
  "privacy.visibility.name.b":
    "is visible to other signed-in ESTIN students when you post a lost or found item.",
  "privacy.visibility.email.strong": "email",
  "privacy.visibility.email.b":
    "is only shared when a match is made between a lost and found item \u2014 to allow the two parties to connect.",
  "privacy.visibility.photo.strong": "profile picture",
  "privacy.visibility.photo.b": "is only visible to you in the nav bar.",
  "privacy.delete.title": "How to delete your data",
  "privacy.delete.a":
    "To have your account and all associated data permanently deleted, send an email to",
  "privacy.delete.b": "with the subject line",
  // &quot; in the source renders as a straight double quote, not a curly one.
  "privacy.delete.strong": '"Delete my FINDit account"',
  "privacy.delete.c": ". Your data will be removed within 7 days.",
  "privacy.contact.a": "Questions about this policy? Reach out at",

  "terms.title.a": "Terms of",
  "terms.title.b": "Service",
  "terms.what.title": "What FINDit is",
  "terms.what.a": "FINDit is a free, student-built lost & found platform for",
  "terms.what.strong": "ESTIN Bejaia",
  "terms.what.b":
    ". It is not a commercial service. By using FINDit, you agree to these terms.",
  "terms.who.title": "Who can use it",
  "terms.who.a": "FINDit is exclusively for",
  "terms.who.strong1": "current students of ESTIN Bejaia",
  "terms.who.b": "with a valid",
  "terms.who.strong2": "@estin.dz",
  "terms.who.c":
    "Google account. Access is automatically revoked if your account no longer qualifies.",
  "terms.who.p2":
    "You may not create accounts on behalf of others, share your access, or attempt to bypass the domain verification.",
  "terms.post.title": "What you can post",
  "terms.post.a":
    "You may only post items that were genuinely lost or found on or around the ESTIN campus. Posts must be",
  "terms.post.strong": "honest and accurate",
  "terms.post.b":
    "\u2014 do not post fake listings, test entries in production, or items that belong to someone else with intent to deceive.",
  "terms.post.p2":
    "Posts that are offensive, misleading, or abusive will be removed and the account may be banned.",
  "terms.claim.title": "Claiming items",
  "terms.claim.a":
    "When you claim a found item, you confirm that it genuinely belongs to you.",
  "terms.claim.strong": "False claims are a violation of these terms",
  "terms.claim.b":
    "and may result in account removal. FINDit is not responsible for disputes between users \u2014 it is a platform to connect people, not a mediator.",
  "terms.noGuarantee.title": "No guarantees",
  "terms.noGuarantee.a": "FINDit is provided",
  "terms.noGuarantee.strong": "as-is",
  "terms.noGuarantee.b":
    ", built and maintained by a student in their free time. We do not guarantee uptime, data retention, or successful item reunions. Use it at your own discretion.",
  "terms.noGuarantee.p2":
    "We are not liable for any loss, damage, or dispute arising from use of the platform.",
  "terms.content.title": "Your content",
  "terms.content.p1":
    "You own what you post. By posting on FINDit, you grant us permission to display it to other verified ESTIN students. We will never sell your content or use it outside the platform.",
  "terms.content.p2a":
    "You can request deletion of your posts and account at any time by contacting",
  "terms.changes.title": "Changes to these terms",
  "terms.changes.body":
    "These terms may be updated occasionally. Continued use of FINDit after changes means you accept the new terms. We'll try to keep things simple and fair \u2014 this is a campus project, not a corporation.",
  "terms.contact.a": "Questions or concerns? Reach out at",

  // ── Home ───────────────────────────────────────────────────────────────────
  "home.badge": "Live on campus \u00b7 Free to use",
  "home.hero.line1": "Stop the",
  "home.hero.line2a": "email",
  "home.hero.line2b": "spam.",
  "home.hero.line3a": "Find your",
  "home.hero.line3b": "stuff.",
  "home.hero.subtitle":
    "A smarter lost & found for our campus. Browse what's been found, post what you lost, or report what you found \u2014 no campus-wide emails.",
  "home.how.eyebrow": "How it works",
  "home.how.title": "Simple. No inbox chaos.",
  "home.step1.titleA": "Sign in with your",
  "home.step1.titleDomain": "@estin.dz",
  "home.step1.titleB": "email",
  "home.step1.body":
    "Just to verify you're a student at ESTIN \u2014 no password, no account creation needed.",
  "home.step2.title": "Lost something or found something?",
  "home.step2.body":
    "Browse found items first \u2014 your stuff might already be there. Or post what you found so the owner can spot it.",
  "home.step3.title": "No more email spam. Find your stuff.",
  "home.step3.body":
    "\u201cLost student card\u201d, \u201cFound keys in the restau\u201d Familiar? Post it here \u2014 only the people who need to see it will.",
  "home.card.lost.title": "I Lost Something",
  "home.card.lost.body":
    "Browse found items first \u2014 your stuff might already be there. Post a report if it's not.",
  "home.card.found.title": "I Found Something",
  "home.card.found.body":
    "Post what you found so the owner can spot it and reach out to claim it.",
  "home.browse.prompt": "Just looking?",
  "home.browse.cta": "Browse all items \u2192",
  "home.builtBy.eyebrow": "Built by",
  "home.builtBy.nameA": "Mohamed Anis",
  "home.builtBy.nameB": "BELAMRI",
  "home.builtBy.role": "1st Year CS Student \u00b7 ESTIN Bejaia",
  "home.social.github": "GitHub",
  "home.social.linkedin": "LinkedIn",
  "home.social.email": "Email",
  "home.social.website": "Website",

  // ── Browse ─────────────────────────────────────────────────────────────────
  "browse.eyebrow": "Campus lost & found",
  "browse.title": "Browse items",
  "browse.typeFilterLabel": "Item type filter",
  "browse.toggle.found": "Found",
  "browse.toggle.lost": "Lost",
  "browse.search.placeholder": "Search by category, location, description...",
  "browse.search.label": "Search items",
  "browse.search.clear": "Clear search",
  "browse.banner.strong": "Don't see your item?",
  "browse.banner.body":
    "Post a lost report and we'll notify you if something matching shows up.",
  "browse.banner.cta": "Report it lost",

  // ── Profile ────────────────────────────────────────────────────────────────
  "profile.header.role": "ESTIN \u00b7 Student",
  "profile.stats.found": "Found posts",
  "profile.stats.lost": "Lost reports",
  "profile.stats.resolved": "Items resolved",
  // "Claimed" corrected from "Resolved" in P2-3. This badge renders
  // status === 'claimed', which migration 011 defines as another student having
  // claimed the item — a different fact from the poster resolving it.
  "profileCard.badge.claimed": "Claimed",
  "profileCard.badge.resolved": "Resolved",
  "profileCard.badge.found": "Found",
  "profileCard.badge.lost": "Lost",
  "profileCard.delete": "Delete",
  "profileCard.undoClaim": "Undo claim",
  "profileCard.markResolved": "Mark resolved \u2713",

  // ── Report pages ───────────────────────────────────────────────────────────
  "report.back": "Back to browse",
  "report.found.titleA": "Report a",
  "report.found.titleHighlight": "Found",
  "report.found.titleB": "Item",
  "report.found.subtitle":
    "Found something on campus? Post it here so the owner can find it.",
  "report.lost.titleA": "Report a",
  "report.lost.titleHighlight": "Lost",
  "report.lost.titleB": "Item",
  "report.lost.subtitle":
    "Lost something on campus? Post it here so someone can help you find it.",

  // ── Account modal ──────────────────────────────────────────────────────────
  "account.label": "Account",
  "account.welcome.a": "Welcome",
  "account.welcome.b": "\u2014 hope you put this app to good use.",
  "account.nameFallback": "there",
  "account.myProfile": "My profile & posts",
  "account.browse": "Browse lost & found items",
  "account.reportBug": "Report a bug",
  "account.signOut": "Sign out",

  // ── Sign-in modal ──────────────────────────────────────────────────────────
  "signIn.title": "Welcome",
  "signIn.descriptionA": "Sign in with your",
  "signIn.descriptionDomain": "@estin.dz",
  "signIn.descriptionB": "Google account to verify you're an ESTIN student.",

  // ── Profile page ───────────────────────────────────────────────────────────
  "profile.submitSuccess": "Your post was submitted successfully!",
  "profile.back": "Back to browse",
  "profile.yourPosts": "Your posts",
  "profile.tab.found": "Found",
  "profile.tab.lost": "Lost",
  "profile.empty.titleA": "No",
  "profile.empty.titleB": "items yet",
  "profile.empty.bodyA": "You haven't posted any",
  "profile.empty.bodyB": "items. Help your fellow ESTIN students!",
  "profile.empty.ctaFound": "Post a found item \u2192",
  "profile.empty.ctaLost": "Report a lost item \u2192",
  "profile.delete.title": "Delete this post?",
  "profile.delete.message":
    "This action cannot be undone. The item will be permanently removed from FINDit.",
  "profile.delete.confirm": "Delete",
  "profile.error.resolve": "Failed to mark as resolved. Please try again.",
  "profile.error.delete": "Failed to delete item. Please try again.",
  "profile.unclaim.notFound": "This item no longer exists.",
  "profile.unclaim.notOwner":
    "Only the person who posted this item can undo its claim.",
  "profile.unclaim.notClaimed": "This item is already back on the board.",
  "profile.unclaim.generic": "Failed to undo the claim.",
  "profile.unclaim.fallback": "Failed to undo the claim. Please try again.",

  // ── Report form ────────────────────────────────────────────────────────────
  "form.error.imageOnly": "Only image files are accepted.",
  "form.error.photoSize": "Photo must be under 5 MB.",
  "form.error.descriptionLength": "Description must be 400 characters or fewer.",
  "form.error.invalidData": "Invalid form data. Please refresh and try again.",
  "form.error.photoUpload": "Photo upload failed. Please try again.",
  "form.error.saveItem": "Failed to save item. Please try again.",
  "form.error.photoTimeout":
    "Photo upload is taking too long. Try a smaller image or a better connection.",
  "form.error.saveTimeout": "Saving your report is taking too long. Please try again.",
  "form.error.serverTimeout":
    "The server took too long to respond. Please check your connection and try again.",
  "form.error.generic": "Something went wrong. Please try again.",
  "form.locationNotSure": "Not sure",

  "form.success.found.title": "Thank you!",
  "form.success.lost.title": "Posted!",
  "form.success.found.body":
    "Your found item report is live. If the owner sees it, they'll reach out to claim it.",
  "form.success.lost.body":
    "Your lost item report is live. We hope someone finds it and reaches out!",
  "form.success.category": "Category",
  "form.success.foundAt": "Found at",
  "form.success.lostAt": "Lost at",
  "form.success.itemIs": "Item is",
  "form.success.date": "Date",
  "form.success.details": "Details",
  "form.success.photo": "Photo",
  "form.success.attached": "Attached",
  "form.success.home": "Back to home",
  "form.success.again": "Report another",

  "form.label.found.category": "What did you find?",
  "form.label.lost.category": "What did you lose?",
  "form.label.found.where": "Where did you find it?",
  "form.label.lost.where": "Where did you lose it?",
  "form.label.moreSpecific": "More specifically\u2026",
  "form.spot.placeholder": "Where exactly?",
  "form.error.locationRequired": "Please select a location.",
  "form.label.found.when": "When did you find it?",
  "form.label.lost.when": "When did you lose it?",
  "form.error.dateFound": "Please select the date you found it.",
  "form.error.dateLost": "Please select the date you lost it.",
  "form.label.description": "Description",
  "form.optional": "optional",
  "form.description.placeholder":
    "Colour, brand, any details that could help identify it\u2026",
  "form.label.photo": "Photo",
  "form.photo.optional": "optional \u2014 but really helpful",
  "form.photo.clickToAttach": "Click to attach",
  "form.photo.orDrag": "or drag a photo here",
  "form.photo.formats": "JPG, PNG, WEBP \u2014 max 5MB",
  "form.photo.previewAlt": "Preview",

  "form.notice.a": "Your post will be",
  "form.notice.visible": "visible to all ESTIN students",
  "form.notice.b": "on the browse page. Your",
  "form.notice.emailShared": "email address will be shared",
  "form.notice.with": "with",
  "form.notice.owner": "the owner",
  "form.notice.finder": "the finder",
  "form.notice.c": "so they can contact you directly.",
  "form.hint.found": "You're doing a good thing.",
  "form.hint.lost": "We hope you find it!",
  "form.submit.posting": "Posting\u2026",
  "form.submit.found": "Post found item \u2192",
  "form.submit.lost": "Post lost item \u2192",

  // ── Admin (never student-facing, but still user-facing copy) ───────────────
  "admin.loading": "Loading\u2026",
  "admin.denied.title": "Access Denied",
  "admin.denied.body": "You don't have permission to access this page.",
  "admin.dashboard.title": "Dashboard",
  "admin.manage.title": "Manage",
  "admin.refresh": "Refresh",
  "admin.loadError": "Failed to load dashboard data. Please try refreshing.",
  "admin.stat.totalItems": "Total Items",
  "admin.stat.found": "Found",
  "admin.stat.lost": "Lost",
  "admin.stat.resolved": "Resolved",
  "admin.stat.users": "Users",
  "admin.tab.items": "Items",
  "admin.tab.users": "Users",
  "admin.col.type": "Type",
  "admin.col.category": "Category",
  "admin.col.location": "Location",
  "admin.col.status": "Status",
  "admin.col.user": "User",
  "admin.col.date": "Date",
  "admin.col.actions": "Actions",
  "admin.col.name": "Name",
  "admin.col.email": "Email",
  "admin.col.joined": "Joined",
  "admin.user.banned": "Banned",
  "admin.user.active": "Active",
  "admin.search.items": "Search UID, email, description\u2026",
  "admin.search.users": "Search name, email, UID\u2026",
  "admin.filter.allTypes": "All Types",
  "admin.filter.allStatuses": "All Statuses",
  "admin.filter.allCategories": "All Categories",
  "admin.filter.found": "Found",
  "admin.filter.lost": "Lost",
  "admin.filter.open": "Open",
  "admin.filter.claimed": "Claimed",
  "admin.clear": "Clear",
  "admin.addItem": "Add Item",
  "admin.noItems": "No items found.",
  "admin.noUsers": "No users found.",
  "admin.action.edit": "Edit item",
  "admin.action.markClaimed": "Mark as claimed",
  "admin.action.markOpen": "Mark as open",
  "admin.action.deleteItem": "Delete item",
  "admin.action.banUser": "Ban user",
  "admin.action.unbanUser": "Unban user",
  "admin.delete.title": "Delete Item",
  "admin.delete.message":
    "Are you sure you want to permanently delete this item? This cannot be undone.",
  "admin.delete.confirm": "Delete",
  "admin.error.notAuthenticated": "Not authenticated",
  "admin.error.requestFailed": "Request failed",
  "admin.error.updateFailed": "Update failed",
  "admin.error.createFailed": "Create failed",
  "admin.error.saveFailed": "Save failed",
  "admin.error.statusUpdate": "Failed to update item status. Please try again.",
  "admin.error.deleteItem": "Failed to delete item. Please try again.",
  "admin.error.banUser": "Failed to update user ban status. Please try again.",

  "adminModal.editTitle": "Edit Item",
  "adminModal.addTitle": "Add Item",
  "adminModal.field.type": "Type",
  "adminModal.field.status": "Status",
  "adminModal.field.category": "Category *",
  "adminModal.field.date": "Date *",
  "adminModal.field.zone": "Zone",
  "adminModal.field.location": "Location *",
  "adminModal.field.whereLeft": "Where Left *",
  "adminModal.field.photoUrl": "Photo URL",
  "adminModal.field.userId": "User ID *",
  "adminModal.field.userEmail": "User Email",
  "adminModal.field.userName": "User Name",
  "adminModal.opt.select": "Select\u2026",
  "adminModal.opt.anyZone": "Any / Not sure",
  "adminModal.opt.found": "Found",
  "adminModal.opt.lost": "Lost",
  "adminModal.opt.open": "Open",
  "adminModal.opt.claimed": "Claimed",
  "adminModal.opt.resolved": "Resolved",
  "adminModal.placeholder.description": "Optional description\u2026",
  "adminModal.placeholder.photoUrl": "https://\u2026",
  "adminModal.placeholder.userId": "Supabase User UUID",
  "adminModal.placeholder.userEmail": "user@estin.dz",
  "adminModal.placeholder.userName": "Display name",
  "adminModal.cancel": "Cancel",
  "adminModal.saving": "Saving\u2026",
  "adminModal.save": "Save Changes",
  "adminModal.validation.userId": "User ID is required",
  "adminModal.validation.category": "Category is required",
  "adminModal.validation.location": "Location is required",
  "adminModal.validation.date": "Date is required",
  "adminModal.validation.whereLeft": "Where left is required for found items",

  "dialog.close": "Close",
  "admin.dismissError": "Dismiss error",
  "form.error.categoryRequired": "Please select a category.",
  "form.label.whereIsItNow": "Where is it now?",
  "form.error.whereLeftRequired": "Please select where the item is now.",
} as const;

export type StringKey = keyof typeof en;

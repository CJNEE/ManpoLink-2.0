# TODO - AdminDashboard mobile-only redesign

## Step 1: Repo scan
- [x] Search for existing mobile bottom navigation / glass/premium patterns

## Step 2: Create edit plan
- [x] Confirm approach: keep desktop JSX untouched, add `hidden md:block` / `block md:hidden` split

## Step 3: Implement code changes
- [ ] Wrap existing desktop dashboard JSX in `hidden md:block`
- [ ] Add new `block md:hidden` mobile dashboard UI using existing data variables and handlers
- [ ] Add sticky bottom mobile navigation with Framer Motion transitions
- [ ] Ensure employee details modal still works on both desktop and mobile

## Step 4: Build/verify
- [ ] Run frontend typecheck/lint (if scripts exist)
- [ ] Quick manual sanity check for md breakpoint switching


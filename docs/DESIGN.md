# DESIGN (UI only)

## Reference
Inspired by: Ganttify - Website Design (https://dribbble.com/shots/24522262-Ganttify-Website-Design)
Style keywords from the shot's tags: clean, SaaS, productivity, landing page, light motion.
Inspiration only. Do not copy exact layout, assets, logo or text.
Screenshots: docs/design-ref/ (add files here and list them).

## Rules
- shadcn/ui components only, themed through Tailwind and CSS variables. Minimal custom CSS.
- Use ONLY the tokens below. If any value below is TBD, STOP and ask. Do not guess.
- Do not change functional behavior, labels, layout structure or flows defined in this file.
- Motion: subtle only (hover, fade, progress). No heavy animation. Never block the P0 demo flow.

## Tokens (fill from the reference, then lock)
| Token | Value |
|---|---|
| Primary | #4F46E5 (SPEC default; replace only if you decide to follow the shot) |
| Background | TBD |
| Surface / card | TBD |
| Border | TBD |
| Text | TBD |
| Muted text | TBD |
| Font family | TBD |
| Font sizes (h1/h2/body/small) | TBD |
| Radius | TBD |
| Shadow | TBD |
| Spacing scale | TBD |
| Dark mode | TBD (yes/no) |

## Semantic colors (fixed by SPEC, never replaced by the reference)
| Use | Color |
|---|---|
| Free | green |
| Busy | red |
| Open slot | amber |
| Success | green |
| Error | red |

## Layout
- Admin sidebar: Dashboard, Setup, Timetable, Workload, Rooms & Labs, Open Slots, Reports.
- Faculty sidebar: My Dashboard, My Timetable, Mark Leave, Open Slots, Book Lab, Notifications. A notification bell shows the unread count.
- Sidebar style: TBD
- Top bar: TBD

## Components
- Cards: TBD
- Buttons: TBD
- Tables: TBD
- Inputs / selects: TBD
- Badges: TBD

### Timetable grid (components/timetable-grid.tsx)
- Columns: Mon-Fri. Rows: 7 slots with start-end times, and a break row between slot 5 and slot 6.
- A lab block is ONE cell spanning 2 rows.
- Open slots are amber with an OPEN label.
- Extra lectures show the extra lecture subject and faculty.
- Cell and header styling: TBD

### Booking screen
- Shows the 5 checks live with pass/fail icons BEFORE the Confirm button: faculty free, subject eligible, class free, room reserved for this slot, workload within max_hours.
- Subject picker lists only the faculty's OWN eligible subjects.
- Recommendation score is shown on the slot.
- Confirm is enabled only when all 5 checks pass.

### Workload (components/workload-bar.tsx)
Progress bars: green = ok, amber = under, red = over.

## Landing page
- Hero with the tagline: "Do not let a cancelled lecture become a wasted academic hour."
- Buttons: Login as Admin, Login as Faculty, View Live Demo.
- 6 feature cards.
- Live stats from getDashboardStats.
- Section style, hero style, illustration style: TBD

## Login
Quick buttons: Admin, Dr. Sharma, Prof. Kaur. Reset Demo button available.


/**
 * Source of truth for Daytona picker/admin dropdowns.
 *
 * IMPORTANT:
 * - `id` must be stable because it’s what gets stored in entry payloads + results.
 * - If you don't have NASCAR numeric IDs, use a slug-based id (default below).
 *
 * Format:
 * { name: "Driver Name", carNumber: "24", id?: "optional-stable-id" }
 */
// src/lib/server/nascar/manualCupDrivers.js
//
// Manual / hardwired Cup driver list (used for Daytona options so we don't rely on any external NASCAR APIs).
//
// Stability strategy:
// - We use the car number as the option `id` (string).
//   For a single-race pick'em like Daytona, car numbers are unique and stable enough,
//   and they match what users already mentally anchor on.
// - If you ever need to change this list, bump the cacheKey version in
//   `src/lib/games/daytona/options.js`.
//
// Source: NASCAR Cup Series entry list for Daytona Speedweeks (Feb 9, 2026)
// https://www.nascar.com/news-media/2026/02/09/2026-nascar-cup-series-entry-list-for-daytona-speedweeks/

export const MANUAL_DAYTONA_500_2026 = [
  { id: '1', name: 'Ross Chastain', carNumber: '1', team: 'Trackhouse Racing' },
  { id: '2', name: 'Austin Cindric', carNumber: '2', team: 'Team Penske' },
  { id: '3', name: 'Austin Dillon', carNumber: '3', team: 'Richard Childress Racing' },
  { id: '4', name: 'Noah Gragson', carNumber: '4', team: 'Front Row Motorsports' },
  { id: '5', name: 'Kyle Larson', carNumber: '5', team: 'Hendrick Motorsports' },
  { id: '6', name: 'Brad Keselowski', carNumber: '6', team: 'RFK Racing' },
  { id: '7', name: 'Daniel Suárez', carNumber: '7', team: 'Spire Motorsports' },
  { id: '8', name: 'Kyle Busch', carNumber: '8', team: 'Richard Childress Racing' },
  { id: '9', name: 'Chase Elliott', carNumber: '9', team: 'Hendrick Motorsports' },
  { id: '10', name: 'Ty Dillon', carNumber: '10', team: 'Kaulig Racing' },
  { id: '11', name: 'Denny Hamlin', carNumber: '11', team: 'Joe Gibbs Racing' },
  { id: '12', name: 'Ryan Blaney', carNumber: '12', team: 'Team Penske' },
  { id: '16', name: 'AJ Allmendinger', carNumber: '16', team: 'Kaulig Racing' },
  { id: '17', name: 'Chris Buescher', carNumber: '17', team: 'RFK Racing' },
  { id: '19', name: 'Chase Briscoe', carNumber: '19', team: 'Joe Gibbs Racing' },
  { id: '20', name: 'Christopher Bell', carNumber: '20', team: 'Joe Gibbs Racing' },
  { id: '21', name: 'Josh Berry', carNumber: '21', team: 'Wood Brothers Racing' },
  { id: '22', name: 'Joey Logano', carNumber: '22', team: 'Team Penske' },
  { id: '23', name: 'Bubba Wallace', carNumber: '23', team: '23XI Racing' },
  { id: '24', name: 'William Byron', carNumber: '24', team: 'Hendrick Motorsports' },
  { id: '34', name: 'Todd Gilliland', carNumber: '34', team: 'Front Row Motorsports' },
  { id: '35', name: 'Riley Herbst', carNumber: '35', team: '23XI Racing' },
  { id: '36', name: 'Chandler Smith', carNumber: '36', team: 'Front Row Motorsports' },
  { id: '38', name: 'Zane Smith', carNumber: '38', team: 'Front Row Motorsports' },
  { id: '40', name: 'Justin Allgaier', carNumber: '40', team: 'JR Motorsports' },
  { id: '41', name: 'Cole Custer', carNumber: '41', team: 'Haas Factory Team' },
  { id: '42', name: 'John H. Nemechek', carNumber: '42', team: 'Legacy Motor Club' },
  { id: '43', name: 'Erik Jones', carNumber: '43', team: 'Legacy Motor Club' },
  { id: '44', name: 'JJ Yeley', carNumber: '44', team: 'NY Racing Team' },
  { id: '45', name: 'Tyler Reddick', carNumber: '45', team: '23XI Racing' },
  { id: '47', name: 'Ricky Stenhouse Jr', carNumber: '47', team: 'HYAK Motorsports' },
  { id: '48', name: 'Alex Bowman', carNumber: '48', team: 'Hendrick Motorsports' },
  { id: '51', name: 'Cody Ware', carNumber: '51', team: 'Rick Ware Racing' },
  { id: '54', name: 'Ty Gibbs', carNumber: '54', team: 'Joe Gibbs Racing' },
  { id: '60', name: 'Ryan Preece', carNumber: '60', team: 'RFK Racing' },
  { id: '62', name: 'Anthony Alfredo', carNumber: '62', team: 'Beard Motorsports' },
  // NASCAR table omits name in plaintext view; confirmed as Casey Mears (same sponsor + team).
  { id: '66', name: 'Casey Mears', carNumber: '66', team: 'Garage 66' },
  { id: '67', name: 'Corey Heim', carNumber: '67', team: '23XI Racing' },
  { id: '71', name: 'Michael McDowell', carNumber: '71', team: 'Spire Motorsports' },
  { id: '77', name: 'Carson Hocevar', carNumber: '77', team: 'Spire Motorsports' },
  { id: '78', name: 'BJ McLeod', carNumber: '78', team: 'Live Fast Motorsports' },
  { id: '84', name: 'Jimmie Johnson', carNumber: '84', team: 'Legacy Motor Club' },
  { id: '88', name: 'Connor Zilisch', carNumber: '88', team: 'Trackhouse Racing' },
  { id: '97', name: 'Shane Van Gisbergen', carNumber: '97', team: 'Trackhouse Racing' },
  { id: '99', name: 'Corey LaJoie', carNumber: '99', team: 'RFK Racing' }
];

export function getManualCupDriverOptions() {
  // Return the shape the app expects: [{ id, name, carNumber }]
  // (We keep `team` attached as extra metadata — harmless, and useful later if you want it in UI.)
  return MANUAL_DAYTONA_500_2026.map((d) => ({
    id: String(d.id),
    name: String(d.name),
    carNumber: d.carNumber != null ? String(d.carNumber) : null,
    team: d.team
  }));
}



-- ============================================================
-- 0026_badge_legacy_seed.sql
--
-- Permanently imports the league's existing:
--
--   Personas
--   Years of Service badges
--   Irving legacy championships
--   DTSP legacy championships
--
-- into manager_badges.
--
-- These values come from the established league dossier data.
-- After this migration, badge display no longer needs to derive
-- these awards from the legacy JS manager file.
-- ============================================================


-- ============================================================
-- PERSONAS
-- 14 managers
-- ============================================================

INSERT OR IGNORE INTO manager_badges (
  season,
  badge_key,
  manager_id,
  reason,
  metadata_json,
  source,
  dedupe_key,
  created_at,
  updated_at
)
VALUES

-- Dave Oliverio
(
  'career',
  'persona-the-wolf',
  '1253772062900621312',
  'The Wolf persona.',
  '{"managerName":"Dave Oliverio","teamName":"Lehigh Crucible","teamLogo":"/managers/crucible.png"}',
  'import',
  'career:persona-the-wolf:1253772062900621312',
  unixepoch(),
  unixepoch()
),

-- Jeff Cohn
(
  'career',
  'persona-the-littlefinger',
  '76521957268799488',
  'The Littlefinger persona.',
  '{"managerName":"Jeff Cohn","teamName":"Ultimate City Warriors","teamLogo":"/managers/warriors.png"}',
  'import',
  'career:persona-the-littlefinger:76521957268799488',
  unixepoch(),
  unixepoch()
),

-- Jamie Cohn
(
  'career',
  'persona-the-kornacki',
  '1253515645044133888',
  'The Kornacki persona.',
  '{"managerName":"Jamie Cohn","teamName":"Dagobah Lightsabres","teamLogo":"/managers/lightsabres.png"}',
  'import',
  'career:persona-the-kornacki:1253515645044133888',
  unixepoch(),
  unixepoch()
),

-- Kenny Case
(
  'career',
  'persona-the-flacco',
  '1005329348477419520',
  'The Flacco persona.',
  '{"managerName":"Kenny Case","teamName":"Rebel Radio Lone Rangers","teamLogo":"/managers/loneRangers.png"}',
  'import',
  'career:persona-the-flacco:1005329348477419520',
  unixepoch(),
  unixepoch()
),

-- Clifton McVay
(
  'career',
  'persona-the-wolf',
  '1254577682394386432',
  'The Wolf persona.',
  '{"managerName":"Clifton McVay","teamName":"Salem Hipsterjacks","teamLogo":"/managers/hipsterJacks.png"}',
  'import',
  'career:persona-the-wolf:1254577682394386432',
  unixepoch(),
  unixepoch()
),

-- Kevin Flanagan
(
  'career',
  'persona-the-littlefinger',
  '1254577895943192576',
  'The Littlefinger persona.',
  '{"managerName":"Kevin Flanagan","teamName":"Nakatomi Plaza CC","teamLogo":"/managers/nakatomi.png"}',
  'import',
  'career:persona-the-littlefinger:1254577895943192576',
  unixepoch(),
  unixepoch()
),

-- Drew Goodwin
(
  'career',
  'persona-the-littlefinger',
  '1254578120531390464',
  'The Littlefinger persona.',
  '{"managerName":"Drew Goodwin","teamName":"Amherst Union","teamLogo":"/managers/union.png"}',
  'import',
  'career:persona-the-littlefinger:1254578120531390464',
  unixepoch(),
  unixepoch()
),

-- Jason Gray
(
  'career',
  'persona-the-flacco',
  '1254584226238447616',
  'The Flacco persona.',
  '{"managerName":"Jason Gray","teamName":"Milford Jayhawks","teamLogo":"/managers/jayhawks.png"}',
  'import',
  'career:persona-the-flacco:1254584226238447616',
  unixepoch(),
  unixepoch()
),

-- Romano DeSimone
(
  'career',
  'persona-the-flacco',
  '792114259365597184',
  'The Flacco persona.',
  '{"managerName":"Romano DeSimone","teamName":"Jacksonville Vincitori","teamLogo":"/managers/vincitori.png"}',
  'import',
  'career:persona-the-flacco:792114259365597184',
  unixepoch(),
  unixepoch()
),

-- James Barmore
(
  'career',
  'persona-the-kornacki',
  '1256695342544453632',
  'The Kornacki persona.',
  '{"managerName":"James Barmore","teamName":"Dunedin Homers","teamLogo":"/managers/homers.png"}',
  'import',
  'career:persona-the-kornacki:1256695342544453632',
  unixepoch(),
  unixepoch()
),

-- Brian James
(
  'career',
  'persona-the-wolf',
  '1256320322135674880',
  'The Wolf persona.',
  '{"managerName":"Brian James","teamName":"Kodachromes","teamLogo":"/managers/kodachromes.png"}',
  'import',
  'career:persona-the-wolf:1256320322135674880',
  unixepoch(),
  unixepoch()
),

-- Brian Marx
(
  'career',
  'persona-the-littlefinger',
  '857309838424809472',
  'The Littlefinger persona.',
  '{"managerName":"Brian Marx","teamName":"Tallahassee Tribe","teamLogo":"/managers/tribe.png"}',
  'import',
  'career:persona-the-littlefinger:857309838424809472',
  unixepoch(),
  unixepoch()
),

-- Adam Lopiano
(
  'career',
  'persona-the-flacco',
  '1258962574360182785',
  'The Flacco persona.',
  '{"managerName":"Adam Lopiano","teamName":"Saskatchewan Mounties","teamLogo":"/managers/mounties.png"}',
  'import',
  'career:persona-the-flacco:1258962574360182785',
  unixepoch(),
  unixepoch()
),

-- Brad Thornton
(
  'career',
  'persona-the-kornacki',
  '1260985941263126528',
  'The Kornacki persona.',
  '{"managerName":"Brad Thornton","teamName":"Clearwater HenryPussycats","teamLogo":"/managers/henry.png"}',
  'import',
  'career:persona-the-kornacki:1260985941263126528',
  unixepoch(),
  unixepoch()
);


-- ============================================================
-- 20 YEARS OF SERVICE
-- 6 managers
-- ============================================================

INSERT OR IGNORE INTO manager_badges (
  season,
  badge_key,
  manager_id,
  reason,
  metadata_json,
  source,
  dedupe_key,
  created_at,
  updated_at
)
VALUES

(
  'career',
  'years-20',
  '1253772062900621312',
  'At least 20 years of league service.',
  '{"managerName":"Dave Oliverio","teamName":"Lehigh Crucible","teamLogo":"/managers/crucible.png","startYear":2004}',
  'import',
  'career:years-20:1253772062900621312',
  unixepoch(),
  unixepoch()
),

(
  'career',
  'years-20',
  '76521957268799488',
  'At least 20 years of league service.',
  '{"managerName":"Jeff Cohn","teamName":"Ultimate City Warriors","teamLogo":"/managers/warriors.png","startYear":2004}',
  'import',
  'career:years-20:76521957268799488',
  unixepoch(),
  unixepoch()
),

(
  'career',
  'years-20',
  '1253515645044133888',
  'At least 20 years of league service.',
  '{"managerName":"Jamie Cohn","teamName":"Dagobah Lightsabres","teamLogo":"/managers/lightsabres.png","startYear":2004}',
  'import',
  'career:years-20:1253515645044133888',
  unixepoch(),
  unixepoch()
),

(
  'career',
  'years-20',
  '1254577895943192576',
  'At least 20 years of league service.',
  '{"managerName":"Kevin Flanagan","teamName":"Nakatomi Plaza CC","teamLogo":"/managers/nakatomi.png","startYear":2005}',
  'import',
  'career:years-20:1254577895943192576',
  unixepoch(),
  unixepoch()
),

(
  'career',
  'years-20',
  '1254584226238447616',
  'At least 20 years of league service.',
  '{"managerName":"Jason Gray","teamName":"Milford Jayhawks","teamLogo":"/managers/jayhawks.png","startYear":2004}',
  'import',
  'career:years-20:1254584226238447616',
  unixepoch(),
  unixepoch()
),

(
  'career',
  'years-20',
  '1258962574360182785',
  'At least 20 years of league service.',
  '{"managerName":"Adam Lopiano","teamName":"Saskatchewan Mounties","teamLogo":"/managers/mounties.png","startYear":2004}',
  'import',
  'career:years-20:1258962574360182785',
  unixepoch(),
  unixepoch()
);


-- ============================================================
-- 10 YEARS OF SERVICE
-- 5 managers
--
-- Matches the old site behavior: managers in the 20-year
-- group are NOT duplicated in the 10-year group.
-- ============================================================

INSERT OR IGNORE INTO manager_badges (
  season,
  badge_key,
  manager_id,
  reason,
  metadata_json,
  source,
  dedupe_key,
  created_at,
  updated_at
)
VALUES

(
  'career',
  'years-10',
  '1005329348477419520',
  'At least 10 years of league service.',
  '{"managerName":"Kenny Case","teamName":"Rebel Radio Lone Rangers","teamLogo":"/managers/loneRangers.png","startYear":2011}',
  'import',
  'career:years-10:1005329348477419520',
  unixepoch(),
  unixepoch()
),

(
  'career',
  'years-10',
  '1254577682394386432',
  'At least 10 years of league service.',
  '{"managerName":"Clifton McVay","teamName":"Salem Hipsterjacks","teamLogo":"/managers/hipsterJacks.png","startYear":2015}',
  'import',
  'career:years-10:1254577682394386432',
  unixepoch(),
  unixepoch()
),

(
  'career',
  'years-10',
  '792114259365597184',
  'At least 10 years of league service.',
  '{"managerName":"Romano DeSimone","teamName":"Jacksonville Vincitori","teamLogo":"/managers/vincitori.png","startYear":2015}',
  'import',
  'career:years-10:792114259365597184',
  unixepoch(),
  unixepoch()
),

(
  'career',
  'years-10',
  '1256695342544453632',
  'At least 10 years of league service.',
  '{"managerName":"James Barmore","teamName":"Dunedin Homers","teamLogo":"/managers/homers.png","startYear":2007}',
  'import',
  'career:years-10:1256695342544453632',
  unixepoch(),
  unixepoch()
),

(
  'career',
  'years-10',
  '1260985941263126528',
  'At least 10 years of league service.',
  '{"managerName":"Brad Thornton","teamName":"Clearwater HenryPussycats","teamLogo":"/managers/henry.png","startYear":2010}',
  'import',
  'career:years-10:1260985941263126528',
  unixepoch(),
  unixepoch()
);


-- ============================================================
-- IRVING LEGACY CHAMPIONSHIPS
--
-- One row per championship year.
-- The UI/repository will group them by manager.
-- ============================================================

INSERT OR IGNORE INTO manager_badges (
  season,
  badge_key,
  manager_id,
  reason,
  metadata_json,
  source,
  dedupe_key,
  created_at,
  updated_at
)
VALUES

-- Dave
('2004','championship-irving-legacy','1253772062900621312','2004 Irving Champion','{"managerName":"Dave Oliverio","teamName":"Lehigh Crucible","teamLogo":"/managers/crucible.png","awardYear":2004}','import','legacy:irving:2004:1253772062900621312',unixepoch(),unixepoch()),

-- Jeff
('2009','championship-irving-legacy','76521957268799488','2009 Irving Champion','{"managerName":"Jeff Cohn","teamName":"Ultimate City Warriors","teamLogo":"/managers/warriors.png","awardYear":2009}','import','legacy:irving:2009:76521957268799488',unixepoch(),unixepoch()),
('2011','championship-irving-legacy','76521957268799488','2011 Irving Champion','{"managerName":"Jeff Cohn","teamName":"Ultimate City Warriors","teamLogo":"/managers/warriors.png","awardYear":2011}','import','legacy:irving:2011:76521957268799488',unixepoch(),unixepoch()),
('2019','championship-irving-legacy','76521957268799488','2019 Irving Champion','{"managerName":"Jeff Cohn","teamName":"Ultimate City Warriors","teamLogo":"/managers/warriors.png","awardYear":2019}','import','legacy:irving:2019:76521957268799488',unixepoch(),unixepoch()),
('2021','championship-irving-legacy','76521957268799488','2021 Irving Champion','{"managerName":"Jeff Cohn","teamName":"Ultimate City Warriors","teamLogo":"/managers/warriors.png","awardYear":2021}','import','legacy:irving:2021:76521957268799488',unixepoch(),unixepoch()),

-- Jamie
('2008','championship-irving-legacy','1253515645044133888','2008 Irving Champion','{"managerName":"Jamie Cohn","teamName":"Dagobah Lightsabres","teamLogo":"/managers/lightsabres.png","awardYear":2008}','import','legacy:irving:2008:1253515645044133888',unixepoch(),unixepoch()),
('2018','championship-irving-legacy','1253515645044133888','2018 Irving Champion','{"managerName":"Jamie Cohn","teamName":"Dagobah Lightsabres","teamLogo":"/managers/lightsabres.png","awardYear":2018}','import','legacy:irving:2018:1253515645044133888',unixepoch(),unixepoch()),

-- Kenny
('2013','championship-irving-legacy','1005329348477419520','2013 Irving Champion','{"managerName":"Kenny Case","teamName":"Rebel Radio Lone Rangers","teamLogo":"/managers/loneRangers.png","awardYear":2013}','import','legacy:irving:2013:1005329348477419520',unixepoch(),unixepoch()),
('2017','championship-irving-legacy','1005329348477419520','2017 Irving Champion','{"managerName":"Kenny Case","teamName":"Rebel Radio Lone Rangers","teamLogo":"/managers/loneRangers.png","awardYear":2017}','import','legacy:irving:2017:1005329348477419520',unixepoch(),unixepoch()),

-- Kevin
('2016','championship-irving-legacy','1254577895943192576','2016 Irving Champion','{"managerName":"Kevin Flanagan","teamName":"Nakatomi Plaza CC","teamLogo":"/managers/nakatomi.png","awardYear":2016}','import','legacy:irving:2016:1254577895943192576',unixepoch(),unixepoch()),
('2023','championship-irving-legacy','1254577895943192576','2023 Irving Champion','{"managerName":"Kevin Flanagan","teamName":"Nakatomi Plaza CC","teamLogo":"/managers/nakatomi.png","awardYear":2023}','import','legacy:irving:2023:1254577895943192576',unixepoch(),unixepoch()),
('2024','championship-irving-legacy','1254577895943192576','2024 Irving Champion','{"managerName":"Kevin Flanagan","teamName":"Nakatomi Plaza CC","teamLogo":"/managers/nakatomi.png","awardYear":2024}','import','legacy:irving:2024:1254577895943192576',unixepoch(),unixepoch()),

-- Jason
('2005','championship-irving-legacy','1254584226238447616','2005 Irving Champion','{"managerName":"Jason Gray","teamName":"Milford Jayhawks","teamLogo":"/managers/jayhawks.png","awardYear":2005}','import','legacy:irving:2005:1254584226238447616',unixepoch(),unixepoch()),

-- James
('2020','championship-irving-legacy','1256695342544453632','2020 Irving Champion','{"managerName":"James Barmore","teamName":"Dunedin Homers","teamLogo":"/managers/homers.png","awardYear":2020}','import','legacy:irving:2020:1256695342544453632',unixepoch(),unixepoch()),

-- Adam
('2006','championship-irving-legacy','1258962574360182785','2006 Irving Champion','{"managerName":"Adam Lopiano","teamName":"Saskatchewan Mounties","teamLogo":"/managers/mounties.png","awardYear":2006}','import','legacy:irving:2006:1258962574360182785',unixepoch(),unixepoch()),

-- Brad
('2010','championship-irving-legacy','1260985941263126528','2010 Irving Champion','{"managerName":"Brad Thornton","teamName":"Clearwater HenryPussycats","teamLogo":"/managers/henry.png","awardYear":2010}','import','legacy:irving:2010:1260985941263126528',unixepoch(),unixepoch()),
('2014','championship-irving-legacy','1260985941263126528','2014 Irving Champion','{"managerName":"Brad Thornton","teamName":"Clearwater HenryPussycats","teamLogo":"/managers/henry.png","awardYear":2014}','import','legacy:irving:2014:1260985941263126528',unixepoch(),unixepoch());


-- ============================================================
-- DTSP LEGACY CHAMPIONSHIPS
-- ============================================================

INSERT OR IGNORE INTO manager_badges (
  season,
  badge_key,
  manager_id,
  reason,
  metadata_json,
  source,
  dedupe_key,
  created_at,
  updated_at
)
VALUES

-- Clifton
('2023','championship-dtsp-legacy','1254577682394386432','2023 DTSP Champion','{"managerName":"Clifton McVay","teamName":"Salem Hipsterjacks","teamLogo":"/managers/hipsterJacks.png","awardYear":2023}','import','legacy:dtsp:2023:1254577682394386432',unixepoch(),unixepoch()),

-- Drew
('2024','championship-dtsp-legacy','1254578120531390464','2024 DTSP Champion','{"managerName":"Drew Goodwin","teamName":"Amherst Union","teamLogo":"/managers/union.png","awardYear":2024}','import','legacy:dtsp:2024:1254578120531390464',unixepoch(),unixepoch()),

-- Romano
('2016','championship-dtsp-legacy','792114259365597184','2016 DTSP Champion','{"managerName":"Romano DeSimone","teamName":"Jacksonville Vincitori","teamLogo":"/managers/vincitori.png","awardYear":2016}','import','legacy:dtsp:2016:792114259365597184',unixepoch(),unixepoch()),
('2017','championship-dtsp-legacy','792114259365597184','2017 DTSP Champion','{"managerName":"Romano DeSimone","teamName":"Jacksonville Vincitori","teamLogo":"/managers/vincitori.png","awardYear":2017}','import','legacy:dtsp:2017:792114259365597184',unixepoch(),unixepoch()),
('2018','championship-dtsp-legacy','792114259365597184','2018 DTSP Champion','{"managerName":"Romano DeSimone","teamName":"Jacksonville Vincitori","teamLogo":"/managers/vincitori.png","awardYear":2018}','import','legacy:dtsp:2018:792114259365597184',unixepoch(),unixepoch()),

-- Brian Marx
('2022','championship-dtsp-legacy','857309838424809472','2022 DTSP Champion','{"managerName":"Brian Marx","teamName":"Tallahassee Tribe","teamLogo":"/managers/tribe.png","awardYear":2022}','import','legacy:dtsp:2022:857309838424809472',unixepoch(),unixepoch());
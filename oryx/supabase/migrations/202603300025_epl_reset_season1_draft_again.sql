begin;

delete from epl.draft_sessions
where season_id = (select id from epl.seasons where slug = 'season-1');

delete from epl.draft_picks
where draft_board_id in (
  select id from epl.draft_boards
  where season_id = (select id from epl.seasons where slug = 'season-1')
);

delete from epl.draft_rounds
where draft_board_id in (
  select id from epl.draft_boards
  where season_id = (select id from epl.seasons where slug = 'season-1')
);

delete from epl.draft_pool
where draft_board_id in (
  select id from epl.draft_boards
  where season_id = (select id from epl.seasons where slug = 'season-1')
);

delete from epl.draft_boards
where season_id = (select id from epl.seasons where slug = 'season-1');

update epl.season_registrations sr
set
  team_id = null,
  player_status = 'draft_pool'::epl.epl_player_status,
  draft_eligible = true,
  updated_at = now()
from epl.seasons s
where s.id = sr.season_id
  and s.slug = 'season-1';

commit;

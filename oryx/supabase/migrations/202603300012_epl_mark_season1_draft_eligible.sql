begin;

select public.epl_bulk_mark_draft_eligible_for_season(
  'season-1',
  null,
  'Commissioner approved for Season 1 draft'
);

commit;

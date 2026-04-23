with activity_source_backfill as (
  select
    a.id,
    case
      when lower(coalesce(nullif(trim(a.metadata->>'source_type'), ''), nullif(trim(a.metadata->>'sourceType'), ''), nullif(trim(a.metadata->>'source'), ''), nullif(trim(a.metadata->>'source_identity'), ''), nullif(trim(a.metadata->>'sourceIdentity'), ''))) in ('evntszn', 'native', 'evntszn_native') then 'evntszn_native'
      when lower(coalesce(nullif(trim(a.metadata->>'source_type'), ''), nullif(trim(a.metadata->>'sourceType'), ''), nullif(trim(a.metadata->>'source'), ''), nullif(trim(a.metadata->>'source_identity'), ''), nullif(trim(a.metadata->>'sourceIdentity'), ''))) in ('host', 'curator', 'curator_network') then 'curator_network'
      when lower(coalesce(nullif(trim(a.metadata->>'source_type'), ''), nullif(trim(a.metadata->>'sourceType'), ''), nullif(trim(a.metadata->>'source'), ''), nullif(trim(a.metadata->>'source_identity'), ''), nullif(trim(a.metadata->>'sourceIdentity'), ''))) in ('partner', 'independent_organizer', 'venue_partner') then 'partner'
      when lower(coalesce(nullif(trim(a.metadata->>'source_type'), ''), nullif(trim(a.metadata->>'sourceType'), ''), nullif(trim(a.metadata->>'source'), ''), nullif(trim(a.metadata->>'source_identity'), ''), nullif(trim(a.metadata->>'sourceIdentity'), ''))) in ('imported', 'external', 'ticketmaster', 'eventbrite') then 'imported'
      when lower(coalesce(a.reference_type, '')) in ('ticketmaster', 'eventbrite', 'external', 'imported', 'external_signal', 'imported_signal') then 'imported'
      when lower(coalesce(a.reference_type, '')) in ('partner', 'independent_organizer', 'venue_partner', 'organizer', 'organizer_application') then 'partner'
      when lower(coalesce(a.reference_type, '')) in ('curator', 'curator_network', 'host', 'host_application') then 'curator_network'
      when lower(coalesce(a.reference_type, '')) in ('venue', 'reserve', 'reserve_booking', 'reserve_waitlist', 'crew', 'crew_request', 'pulse', 'pulse_post', 'link', 'node', 'epl', 'profile', 'night_plan', 'plan', 'saved_item', 'city_explored', 'discovery_lane_explored', 'discover_search', 'stayops', 'sponsor', 'sponsor_inquiry') then 'evntszn_native'
      when e.event_class = 'independent_organizer' then 'partner'
      when e.event_class = 'mml' then 'evntszn_native'
      when e.event_class = 'evntszn' then 'evntszn_native'
      when lower(coalesce(a.event_type, '')) in ('saved_item', 'city_explored', 'discovery_lane_explored', 'night_plan_created', 'pulse_posted', 'reserve_requested', 'reserve_waitlist_joined', 'crew_requested', 'epl_followed', 'sponsor_perk_viewed', 'stayops_intake_submitted', 'profile_completed', 'discover_view') then 'evntszn_native'
      else null
    end as source_key,
    case
      when lower(coalesce(nullif(trim(a.metadata->>'source_type'), ''), nullif(trim(a.metadata->>'sourceType'), ''), nullif(trim(a.metadata->>'source'), ''), nullif(trim(a.metadata->>'source_identity'), ''), nullif(trim(a.metadata->>'sourceIdentity'), ''))) in ('evntszn', 'native', 'evntszn_native') then 'EVNTSZN Native'
      when lower(coalesce(nullif(trim(a.metadata->>'source_type'), ''), nullif(trim(a.metadata->>'sourceType'), ''), nullif(trim(a.metadata->>'source'), ''), nullif(trim(a.metadata->>'source_identity'), ''), nullif(trim(a.metadata->>'sourceIdentity'), ''))) in ('host', 'curator', 'curator_network') then 'Curator Network'
      when lower(coalesce(nullif(trim(a.metadata->>'source_type'), ''), nullif(trim(a.metadata->>'sourceType'), ''), nullif(trim(a.metadata->>'source'), ''), nullif(trim(a.metadata->>'source_identity'), ''), nullif(trim(a.metadata->>'sourceIdentity'), ''))) in ('partner', 'independent_organizer', 'venue_partner') then 'Partner'
      when lower(coalesce(nullif(trim(a.metadata->>'source_type'), ''), nullif(trim(a.metadata->>'sourceType'), ''), nullif(trim(a.metadata->>'source'), ''), nullif(trim(a.metadata->>'source_identity'), ''), nullif(trim(a.metadata->>'sourceIdentity'), ''))) in ('imported', 'external', 'ticketmaster', 'eventbrite') then 'Imported signal'
      when lower(coalesce(a.reference_type, '')) in ('ticketmaster', 'eventbrite', 'external', 'imported', 'external_signal', 'imported_signal') then 'Imported signal'
      when lower(coalesce(a.reference_type, '')) in ('partner', 'independent_organizer', 'venue_partner', 'organizer', 'organizer_application') then 'Partner'
      when lower(coalesce(a.reference_type, '')) in ('curator', 'curator_network', 'host', 'host_application') then 'Curator Network'
      when lower(coalesce(a.reference_type, '')) in ('venue', 'reserve', 'reserve_booking', 'reserve_waitlist', 'crew', 'crew_request', 'pulse', 'pulse_post', 'link', 'node', 'epl', 'profile', 'night_plan', 'plan', 'saved_item', 'city_explored', 'discovery_lane_explored', 'discover_search', 'stayops', 'sponsor', 'sponsor_inquiry') then 'EVNTSZN Native'
      when e.event_class = 'independent_organizer' then 'Partner'
      when e.event_class = 'mml' then 'EVNTSZN Native'
      when e.event_class = 'evntszn' then 'EVNTSZN Native'
      when lower(coalesce(a.event_type, '')) in ('saved_item', 'city_explored', 'discovery_lane_explored', 'night_plan_created', 'pulse_posted', 'reserve_requested', 'reserve_waitlist_joined', 'crew_requested', 'epl_followed', 'sponsor_perk_viewed', 'stayops_intake_submitted', 'profile_completed', 'discover_view') then 'EVNTSZN Native'
      else 'Imported signal'
    end as source_label,
    case
      when lower(coalesce(nullif(trim(a.metadata->>'source_type'), ''), nullif(trim(a.metadata->>'sourceType'), ''), nullif(trim(a.metadata->>'source'), ''), nullif(trim(a.metadata->>'source_identity'), ''), nullif(trim(a.metadata->>'sourceIdentity'), ''))) is not null then coalesce(nullif(trim(a.metadata->>'source_type'), ''), nullif(trim(a.metadata->>'sourceType'), ''), nullif(trim(a.metadata->>'source'), ''), nullif(trim(a.metadata->>'source_identity'), ''), nullif(trim(a.metadata->>'sourceIdentity'), ''))
      when e.event_class is not null then e.event_class
      when a.reference_type is not null then a.reference_type
      else a.event_type
    end as source_origin,
    case
      when lower(coalesce(nullif(trim(a.metadata->>'source_type'), ''), nullif(trim(a.metadata->>'sourceType'), ''), nullif(trim(a.metadata->>'source'), ''), nullif(trim(a.metadata->>'source_identity'), ''), nullif(trim(a.metadata->>'sourceIdentity'), ''))) is not null then 0.98
      when e.event_class is not null then 0.92
      when lower(coalesce(a.reference_type, '')) in ('ticketmaster', 'eventbrite', 'external', 'imported', 'external_signal', 'imported_signal') then 0.84
      when lower(coalesce(a.reference_type, '')) in ('partner', 'independent_organizer', 'venue_partner', 'organizer', 'organizer_application', 'curator', 'curator_network', 'host', 'host_application') then 0.81
      when lower(coalesce(a.event_type, '')) in ('saved_item', 'city_explored', 'discovery_lane_explored', 'night_plan_created', 'pulse_posted', 'reserve_requested', 'reserve_waitlist_joined', 'crew_requested', 'epl_followed', 'sponsor_perk_viewed', 'stayops_intake_submitted', 'profile_completed', 'discover_view') then 0.74
      else 0.55
    end as source_confidence,
    case
      when lower(coalesce(nullif(trim(a.metadata->>'source_type'), ''), nullif(trim(a.metadata->>'sourceType'), ''), nullif(trim(a.metadata->>'source'), ''), nullif(trim(a.metadata->>'source_identity'), ''), nullif(trim(a.metadata->>'sourceIdentity'), ''))) is not null then 'existing metadata'
      when e.event_class is not null then 'event class join'
      when lower(coalesce(a.reference_type, '')) in ('ticketmaster', 'eventbrite', 'external', 'imported', 'external_signal', 'imported_signal') then 'reference type'
      when lower(coalesce(a.reference_type, '')) in ('partner', 'independent_organizer', 'venue_partner', 'organizer', 'organizer_application', 'curator', 'curator_network', 'host', 'host_application') then 'reference type'
      when lower(coalesce(a.event_type, '')) in ('saved_item', 'city_explored', 'discovery_lane_explored', 'night_plan_created', 'pulse_posted', 'reserve_requested', 'reserve_waitlist_joined', 'crew_requested', 'epl_followed', 'sponsor_perk_viewed', 'stayops_intake_submitted', 'profile_completed', 'discover_view') then 'event type'
      else 'imported fallback'
    end as source_backfill_reason
  from public.evntszn_activity_events a
  left join public.evntszn_events e
    on e.id::text = a.reference_id
  where
    nullif(trim(coalesce(a.metadata->>'source_type', a.metadata->>'sourceType', a.metadata->>'source', a.metadata->>'source_identity', a.metadata->>'sourceIdentity')), '') is null
    or nullif(trim(coalesce(a.metadata->>'source_label', a.metadata->>'sourceLabel', a.metadata->>'source_origin', a.metadata->>'sourceOrigin')), '') is null
)
update public.evntszn_activity_events a
set metadata = a.metadata || jsonb_build_object(
  'source_type', b.source_key,
  'source_label', b.source_label,
  'source_identity', b.source_key,
  'source_origin', b.source_origin,
  'source_backfill_confidence', b.source_confidence,
  'source_backfill_reason', b.source_backfill_reason,
  'source_backfilled_at', timezone('utc', now())
)
from activity_source_backfill b
where a.id = b.id
  and b.source_key is not null;

with pulse_source_backfill as (
  select
    p.id,
    case
      when lower(coalesce(nullif(trim(p.metadata->>'source_type'), ''), nullif(trim(p.metadata->>'sourceType'), ''), nullif(trim(p.metadata->>'source'), ''), nullif(trim(p.metadata->>'source_identity'), ''), nullif(trim(p.metadata->>'sourceIdentity'), ''))) in ('evntszn', 'native', 'evntszn_native') then 'evntszn_native'
      when lower(coalesce(nullif(trim(p.metadata->>'source_type'), ''), nullif(trim(p.metadata->>'sourceType'), ''), nullif(trim(p.metadata->>'source'), ''), nullif(trim(p.metadata->>'source_identity'), ''), nullif(trim(p.metadata->>'sourceIdentity'), ''))) in ('host', 'curator', 'curator_network') then 'curator_network'
      when lower(coalesce(nullif(trim(p.metadata->>'source_type'), ''), nullif(trim(p.metadata->>'sourceType'), ''), nullif(trim(p.metadata->>'source'), ''), nullif(trim(p.metadata->>'source_identity'), ''), nullif(trim(p.metadata->>'sourceIdentity'), ''))) in ('partner', 'independent_organizer', 'venue_partner') then 'partner'
      when lower(coalesce(nullif(trim(p.metadata->>'source_type'), ''), nullif(trim(p.metadata->>'sourceType'), ''), nullif(trim(p.metadata->>'source'), ''), nullif(trim(p.metadata->>'source_identity'), ''), nullif(trim(p.metadata->>'sourceIdentity'), ''))) in ('imported', 'external', 'ticketmaster', 'eventbrite') then 'imported'
      when lower(coalesce(p.reference_type, '')) in ('ticketmaster', 'eventbrite', 'external', 'imported', 'external_signal', 'imported_signal') then 'imported'
      when lower(coalesce(p.reference_type, '')) in ('partner', 'independent_organizer', 'venue_partner', 'organizer', 'organizer_application') then 'partner'
      when lower(coalesce(p.reference_type, '')) in ('curator', 'curator_network', 'host', 'host_application') then 'curator_network'
      when lower(coalesce(p.reference_type, '')) in ('venue', 'reserve', 'reserve_booking', 'reserve_waitlist', 'crew', 'crew_request', 'pulse', 'pulse_post', 'link', 'node', 'epl', 'profile', 'night_plan', 'plan', 'saved_item', 'city_explored', 'discovery_lane_explored', 'discover_view', 'stayops', 'sponsor', 'sponsor_inquiry') then 'evntszn_native'
      when e.event_class = 'independent_organizer' then 'partner'
      when e.event_class = 'mml' then 'evntszn_native'
      when e.event_class = 'evntszn' then 'evntszn_native'
      when lower(coalesce(p.source_type, '')) in ('discover_view', 'discover_interaction', 'save', 'watch', 'plan', 'reserve_view', 'reserve_booking', 'reserve_waitlist', 'node_view', 'node_tap', 'link_view', 'epl_view', 'epl_registration', 'crew_request') then 'evntszn_native'
      else null
    end as source_key,
    case
      when lower(coalesce(nullif(trim(p.metadata->>'source_type'), ''), nullif(trim(p.metadata->>'sourceType'), ''), nullif(trim(p.metadata->>'source'), ''), nullif(trim(p.metadata->>'source_identity'), ''), nullif(trim(p.metadata->>'sourceIdentity'), ''))) in ('evntszn', 'native', 'evntszn_native') then 'EVNTSZN Native'
      when lower(coalesce(nullif(trim(p.metadata->>'source_type'), ''), nullif(trim(p.metadata->>'sourceType'), ''), nullif(trim(p.metadata->>'source'), ''), nullif(trim(p.metadata->>'source_identity'), ''), nullif(trim(p.metadata->>'sourceIdentity'), ''))) in ('host', 'curator', 'curator_network') then 'Curator Network'
      when lower(coalesce(nullif(trim(p.metadata->>'source_type'), ''), nullif(trim(p.metadata->>'sourceType'), ''), nullif(trim(p.metadata->>'source'), ''), nullif(trim(p.metadata->>'source_identity'), ''), nullif(trim(p.metadata->>'sourceIdentity'), ''))) in ('partner', 'independent_organizer', 'venue_partner') then 'Partner'
      when lower(coalesce(nullif(trim(p.metadata->>'source_type'), ''), nullif(trim(p.metadata->>'sourceType'), ''), nullif(trim(p.metadata->>'source'), ''), nullif(trim(p.metadata->>'source_identity'), ''), nullif(trim(p.metadata->>'sourceIdentity'), ''))) in ('imported', 'external', 'ticketmaster', 'eventbrite') then 'Imported signal'
      when lower(coalesce(p.reference_type, '')) in ('ticketmaster', 'eventbrite', 'external', 'imported', 'external_signal', 'imported_signal') then 'Imported signal'
      when lower(coalesce(p.reference_type, '')) in ('partner', 'independent_organizer', 'venue_partner', 'organizer', 'organizer_application') then 'Partner'
      when lower(coalesce(p.reference_type, '')) in ('curator', 'curator_network', 'host', 'host_application') then 'Curator Network'
      when lower(coalesce(p.reference_type, '')) in ('venue', 'reserve', 'reserve_booking', 'reserve_waitlist', 'crew', 'crew_request', 'pulse', 'pulse_post', 'link', 'node', 'epl', 'profile', 'night_plan', 'plan', 'saved_item', 'city_explored', 'discovery_lane_explored', 'discover_view', 'stayops', 'sponsor', 'sponsor_inquiry') then 'EVNTSZN Native'
      when e.event_class = 'independent_organizer' then 'Partner'
      when e.event_class = 'mml' then 'EVNTSZN Native'
      when e.event_class = 'evntszn' then 'EVNTSZN Native'
      when lower(coalesce(p.source_type, '')) in ('discover_view', 'discover_interaction', 'save', 'watch', 'plan', 'reserve_view', 'reserve_booking', 'reserve_waitlist', 'node_view', 'node_tap', 'link_view', 'epl_view', 'epl_registration', 'crew_request') then 'EVNTSZN Native'
      else 'Imported signal'
    end as source_label,
    case
      when lower(coalesce(nullif(trim(p.metadata->>'source_type'), ''), nullif(trim(p.metadata->>'sourceType'), ''), nullif(trim(p.metadata->>'source'), ''), nullif(trim(p.metadata->>'source_identity'), ''), nullif(trim(p.metadata->>'sourceIdentity'), ''))) is not null then coalesce(nullif(trim(p.metadata->>'source_type'), ''), nullif(trim(p.metadata->>'sourceType'), ''), nullif(trim(p.metadata->>'source'), ''), nullif(trim(p.metadata->>'source_identity'), ''), nullif(trim(p.metadata->>'sourceIdentity'), ''))
      when e.event_class is not null then e.event_class
      when p.reference_type is not null then p.reference_type
      else p.source_type
    end as source_origin,
    case
      when lower(coalesce(nullif(trim(p.metadata->>'source_type'), ''), nullif(trim(p.metadata->>'sourceType'), ''), nullif(trim(p.metadata->>'source'), ''), nullif(trim(p.metadata->>'source_identity'), ''), nullif(trim(p.metadata->>'sourceIdentity'), ''))) is not null then 0.98
      when e.event_class is not null then 0.92
      when lower(coalesce(p.reference_type, '')) in ('ticketmaster', 'eventbrite', 'external', 'imported', 'external_signal', 'imported_signal') then 0.84
      when lower(coalesce(p.reference_type, '')) in ('partner', 'independent_organizer', 'venue_partner', 'organizer', 'organizer_application', 'curator', 'curator_network', 'host', 'host_application') then 0.81
      when lower(coalesce(p.source_type, '')) in ('discover_view', 'discover_interaction', 'save', 'watch', 'plan', 'reserve_view', 'reserve_booking', 'reserve_waitlist', 'node_view', 'node_tap', 'link_view', 'epl_view', 'epl_registration', 'crew_request') then 0.77
      else 0.55
    end as source_confidence,
    case
      when lower(coalesce(nullif(trim(p.metadata->>'source_type'), ''), nullif(trim(p.metadata->>'sourceType'), ''), nullif(trim(p.metadata->>'source'), ''), nullif(trim(p.metadata->>'source_identity'), ''), nullif(trim(p.metadata->>'sourceIdentity'), ''))) is not null then 'existing metadata'
      when e.event_class is not null then 'event class join'
      when lower(coalesce(p.reference_type, '')) in ('ticketmaster', 'eventbrite', 'external', 'imported', 'external_signal', 'imported_signal') then 'reference type'
      when lower(coalesce(p.reference_type, '')) in ('partner', 'independent_organizer', 'venue_partner', 'organizer', 'organizer_application', 'curator', 'curator_network', 'host', 'host_application') then 'reference type'
      when lower(coalesce(p.source_type, '')) in ('discover_view', 'discover_interaction', 'save', 'watch', 'plan', 'reserve_view', 'reserve_booking', 'reserve_waitlist', 'node_view', 'node_tap', 'link_view', 'epl_view', 'epl_registration', 'crew_request') then 'pulse action'
      else 'imported fallback'
    end as source_backfill_reason
  from public.evntszn_pulse_activity p
  left join public.evntszn_events e
    on e.id::text = p.reference_id
  where
    nullif(trim(coalesce(p.metadata->>'source_type', p.metadata->>'sourceType', p.metadata->>'source', p.metadata->>'source_identity', p.metadata->>'sourceIdentity')), '') is null
    or nullif(trim(coalesce(p.metadata->>'source_label', p.metadata->>'sourceLabel', p.metadata->>'source_origin', p.metadata->>'sourceOrigin')), '') is null
)
update public.evntszn_pulse_activity p
set metadata = p.metadata || jsonb_build_object(
  'source_type', b.source_key,
  'source_label', b.source_label,
  'source_identity', b.source_key,
  'source_origin', b.source_origin,
  'source_backfill_confidence', b.source_confidence,
  'source_backfill_reason', b.source_backfill_reason,
  'source_backfilled_at', timezone('utc', now())
)
from pulse_source_backfill b
where p.id = b.id
  and b.source_key is not null;

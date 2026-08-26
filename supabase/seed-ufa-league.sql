-- Generated only from the supplied UBSR member list and auction summary.

with member_data(member_code, full_name, section, league_role, positions, rating, base_price) as (
values
  ('UBSR-006', 'Shubhayu Dey', 'Commerce A', 'manager', 'GK, CB', '9/10', '450'),
  ('UBSR-022', 'Swarnadip Kar', 'Science A', 'manager', 'GK, CB', '9/10', '450'),
  ('UBSR-024', 'Ayush Barua', 'Science B', 'manager', 'CB, CDM, CM, CAM, SS', '8/10', '400'),
  ('UBSR-028', 'Puspal Das (Dey)', 'Science B', 'manager', 'CB, CDM', '8/10', '400'),
  ('UBSR-029', 'Rishyraj Adhikari', 'Science B', 'manager', 'CDM, CM', '8/10', '400'),
  ('UBSR-031', 'Sayanya Paul', 'Science B', 'manager', 'SS, CF, RF', '7/10', '350'),
  ('UBSR-032', 'Shaheek', 'Science B', 'manager', 'CDM, CM', '7/10', '350'),
  ('UBSR-034', 'Vignesh Dey', 'Science B', 'manager', 'CB, CDM', '8/10', '400'),
  ('UBSR-047', 'Smayan Adhikari', 'Humanities', 'manager', 'CDM, CM, CAM', '7/10', '350'),
  ('UBSR-001', 'Aarav Shaw', 'Commerce A', 'player', 'CM, CDM, CAM, SS', '7/10', '350'),
  ('UBSR-002', 'Devansh Agarwal', 'Commerce A', 'player', 'CDM', '4.5/10', '225'),
  ('UBSR-003', 'Farasat Alam', 'Commerce A', 'player', 'CB, CDM', '5/10', '250'),
  ('UBSR-004', 'Kinshuk', 'Commerce A', 'player', 'CAM, SS', '6.5/10', '325'),
  ('UBSR-005', 'Rahul Prasad', 'Commerce A', 'player', 'LW, RF, CF', '7/10', '350'),
  ('UBSR-007', 'Altamash', 'Commerce B', 'player', 'CAM, SS, CF', '8/10', '400'),
  ('UBSR-008', 'Arhaan Molla', 'Commerce B', 'player', 'LW, LM', '6.5/10', '325'),
  ('UBSR-009', 'Aritra Kar', 'Commerce B', 'player', 'CB, CDM', '6/10', '300'),
  ('UBSR-011', 'Ayushman Dey', 'Commerce B', 'player', 'CB, CDM', '6.5/10', '325'),
  ('UBSR-012', 'Fahim Laskar', 'Commerce B', 'player', 'CB, CDM, CM, CAM, LW', '9/10', '450'),
  ('UBSR-013', 'Naiteek Borar', 'Commerce B', 'player', 'WildCard', 'WildCard', '50'),
  ('UBSR-015', 'Touhid Anzar', 'Commerce B', 'player', 'SS, CF', '7.5/10', '375'),
  ('UBSR-048', 'Hemadri', 'Commerce B', 'player', 'GK, CB', '7.5/10', '375'),
  ('UBSR-049', 'Tamim Khan', 'Commerce B', 'player', 'CB, CDM', '4.5/10', '225'),
  ('UBSR-053', 'Adarsh', 'Commerce B', 'player', 'WildCard', 'WildCard', '50'),
  ('UBSR-054', 'Samriddha', 'Commerce B', 'player', 'CB, CDM', '6/10', '300'),
  ('UBSR-055', 'Ankit Paul', 'Commerce B', 'player', 'GK, CB', '7/10', '350'),
  ('UBSR-056', 'Abhirup Dutta', 'Commerce B', 'player', 'RW, RM, SS', '7.5/10', '375'),
  ('UBSR-016', 'Ankit Mondal', 'Science A', 'player', 'GK, CB', '7/10', '350'),
  ('UBSR-017', 'Atrik Bose', 'Science A', 'player', 'WildCard', 'WildCard', '50'),
  ('UBSR-018', 'Azlan Mubashir Khan', 'Science A', 'player', 'WildCard', 'WildCard', '50'),
  ('UBSR-019', 'Praborshee Patra', 'Science A', 'player', 'CDM, CM', '7/10', '350'),
  ('UBSR-020', 'Rupam Rit', 'Science A', 'player', 'SS, CF', '6.5/10', '325'),
  ('UBSR-021', 'Soham Deb', 'Science A', 'player', 'CAM, CM, CDM', '7.5/10', '375'),
  ('UBSR-023', 'Sutirtho Malya', 'Science A', 'player', 'CB', '6/10', '300'),
  ('UBSR-025', 'Darpan Chakraborty', 'Science B', 'player', 'GK, CB', '7/10', '350'),
  ('UBSR-026', 'Harshit Saha', 'Science B', 'player', 'CDM, CM, CAM, LM, RM', '7.5/10', '375'),
  ('UBSR-027', 'Mourin Polley', 'Science B', 'player', 'CB', '4.5/10', '225'),
  ('UBSR-030', 'Satwick Mallik', 'Science B', 'player', 'CB, LB, RB', '7.5/10', '375'),
  ('UBSR-033', 'Subharup Roy', 'Science B', 'player', 'CAM, SS, CF, LW', '8.5/10', '425'),
  ('UBSR-035', 'Writam Bhattacharjee', 'Science B', 'player', 'CB, CDM', '4/10', '200'),
  ('UBSR-050', 'Mrigank Moulik Goswami', 'Science B', 'player', 'LW, SS', '8/10', '400'),
  ('UBSR-051', 'Atri Mondol', 'Science B', 'player', 'LB, LW', '7.5/10', '375'),
  ('UBSR-036', 'Arnav Jha', 'Science C', 'player', 'CB, CDM', '5.5/10', '275'),
  ('UBSR-037', 'Prabal', 'Science C', 'player', 'WildCard', 'WildCard', '50'),
  ('UBSR-038', 'Rupayan Bera', 'Science C', 'player', 'CAM, SS, CF, LF', '8/10', '400'),
  ('UBSR-039', 'SK Al Aakib', 'Science C', 'player', 'CDM, CM, LM, RM, CAM, SS', '9/10', '450'),
  ('UBSR-040', 'SK Arish', 'Science C', 'player', 'CM, SS, CF, LW', '9/10', '450'),
  ('UBSR-041', 'Sopan Basu', 'Science C', 'player', 'SS, LF, CF, RF', '8.5/10', '425'),
  ('UBSR-042', 'Soumajit Santra', 'Science C', 'player', 'WildCard', 'WildCard', '50'),
  ('UBSR-043', 'Suhan Khosla', 'Science C', 'player', 'GK, CB, CDM', '6.5/10', '325'),
  ('UBSR-044', 'Sunit Sarkar', 'Science C', 'player', 'SS, CF, LF', '7.5/10', '375'),
  ('UBSR-045', 'Sushabhan Ghosh', 'Science C', 'player', 'CM, SS, CF, LW', '9/10', '450'),
  ('UBSR-052', 'Sagnik', 'Science C', 'player', 'WildCard', 'WildCard', '50'),
  ('UBSR-046', 'Rik Mandal', 'Humanities', 'player', 'WildCard', 'WildCard', '50')
)
insert into public.league_members(member_code, full_name, section, league_role, positions, rating, base_price)
select member_code, full_name, section, league_role::public.league_role, positions, rating, base_price::integer from member_data
on conflict (member_code) do update set
  full_name = excluded.full_name, section = excluded.section, league_role = excluded.league_role,
  positions = excluded.positions, rating = excluded.rating, base_price = excluded.base_price, updated_at = now();

with team_data(manager_code, team_name, current_balance) as (
values
  ('UBSR-024', 'Ayush Barua FC', '370'),
  ('UBSR-032', 'Shaheek FC', '30'),
  ('UBSR-006', 'Shubhayu Dey FC', '720'),
  ('UBSR-034', 'Vignesh Dey FC', '1225'),
  ('UBSR-028', 'Puspal Das FC', '1150'),
  ('UBSR-031', 'Sayanya Paul FC', '1190'),
  ('UBSR-029', 'Rishyraj Adhikari FC', '255'),
  ('UBSR-022', 'Swarnadip Kar FC', '255'),
  ('UBSR-047', 'Smayan Adhikari FC', '1105')
)
insert into public.teams(manager_member_id, name, current_balance)
select member.id, team_data.team_name, team_data.current_balance::integer
from team_data join public.league_members member on member.member_code = team_data.manager_code
on conflict (manager_member_id) do update set name = excluded.name, current_balance = excluded.current_balance, updated_at = now();

with auction_data(player_code, auction_status, buyer_manager_code, final_bought_price) as (
values
  ('UBSR-001', 'sold', 'UBSR-024', '550'),
  ('UBSR-002', 'not_called', null, null),
  ('UBSR-003', 'unsold', null, null),
  ('UBSR-004', 'not_called', null, null),
  ('UBSR-005', 'sold', 'UBSR-032', '375'),
  ('UBSR-007', 'sold', 'UBSR-032', '465'),
  ('UBSR-008', 'sold', 'UBSR-029', '350'),
  ('UBSR-009', 'not_called', null, null),
  ('UBSR-011', 'unsold', null, null),
  ('UBSR-012', 'sold', 'UBSR-006', '500'),
  ('UBSR-013', 'unsold', null, null),
  ('UBSR-015', 'sold', 'UBSR-029', '450'),
  ('UBSR-048', 'sold', 'UBSR-024', '500'),
  ('UBSR-049', 'unsold', null, null),
  ('UBSR-053', 'unsold', null, null),
  ('UBSR-054', 'sold', 'UBSR-029', '570'),
  ('UBSR-055', 'sold', 'UBSR-029', '375'),
  ('UBSR-056', 'unsold', null, null),
  ('UBSR-016', 'unsold', null, null),
  ('UBSR-017', 'sold', 'UBSR-031', '175'),
  ('UBSR-018', 'unsold', null, null),
  ('UBSR-019', 'sold', 'UBSR-031', '635'),
  ('UBSR-020', 'sold', 'UBSR-022', '695'),
  ('UBSR-021', 'sold', 'UBSR-022', '625'),
  ('UBSR-023', 'sold', 'UBSR-022', '425'),
  ('UBSR-025', 'sold', 'UBSR-034', '375'),
  ('UBSR-026', 'sold', 'UBSR-028', '725'),
  ('UBSR-027', 'unsold', null, null),
  ('UBSR-030', 'sold', 'UBSR-034', '400'),
  ('UBSR-033', 'not_called', null, null),
  ('UBSR-035', 'not_called', null, null),
  ('UBSR-050', 'sold', 'UBSR-006', '705'),
  ('UBSR-051', 'not_called', null, null),
  ('UBSR-036', 'unsold', null, null),
  ('UBSR-037', 'unsold', null, null),
  ('UBSR-038', 'not_called', null, null),
  ('UBSR-039', 'sold', 'UBSR-047', '895'),
  ('UBSR-040', 'sold', 'UBSR-024', '580'),
  ('UBSR-041', 'sold', 'UBSR-032', '575'),
  ('UBSR-042', 'not_called', null, null),
  ('UBSR-043', 'unsold', null, null),
  ('UBSR-044', 'not_called', null, null),
  ('UBSR-045', 'sold', 'UBSR-032', '555'),
  ('UBSR-052', 'sold', 'UBSR-006', '75'),
  ('UBSR-046', 'sold', 'UBSR-028', '125')
)
insert into public.auction_records(player_member_id, base_price, final_bought_price, status, buyer_team_id, resolved_at)
select player.id, player.base_price, auction_data.final_bought_price::integer, auction_data.auction_status::public.auction_status, buyer_team.id,
  case when auction_data.auction_status = 'sold' then now() else null end
from auction_data
join public.league_members player on player.member_code = auction_data.player_code
left join public.league_members buyer_member on buyer_member.member_code = auction_data.buyer_manager_code
left join public.teams buyer_team on buyer_team.manager_member_id = buyer_member.id
on conflict (player_member_id) do update set
  base_price = excluded.base_price, final_bought_price = excluded.final_bought_price, status = excluded.status,
  buyer_team_id = excluded.buyer_team_id, resolved_at = excluded.resolved_at, updated_at = now();

with sold_data(player_code, buyer_manager_code, acquired_price) as (
values
  ('UBSR-001', 'UBSR-024', '550'),
  ('UBSR-040', 'UBSR-024', '580'),
  ('UBSR-048', 'UBSR-024', '500'),
  ('UBSR-005', 'UBSR-032', '375'),
  ('UBSR-045', 'UBSR-032', '555'),
  ('UBSR-041', 'UBSR-032', '575'),
  ('UBSR-007', 'UBSR-032', '465'),
  ('UBSR-052', 'UBSR-006', '75'),
  ('UBSR-050', 'UBSR-006', '705'),
  ('UBSR-012', 'UBSR-006', '500'),
  ('UBSR-030', 'UBSR-034', '400'),
  ('UBSR-025', 'UBSR-034', '375'),
  ('UBSR-026', 'UBSR-028', '725'),
  ('UBSR-046', 'UBSR-028', '125'),
  ('UBSR-017', 'UBSR-031', '175'),
  ('UBSR-019', 'UBSR-031', '635'),
  ('UBSR-015', 'UBSR-029', '450'),
  ('UBSR-008', 'UBSR-029', '350'),
  ('UBSR-055', 'UBSR-029', '375'),
  ('UBSR-054', 'UBSR-029', '570'),
  ('UBSR-021', 'UBSR-022', '625'),
  ('UBSR-023', 'UBSR-022', '425'),
  ('UBSR-020', 'UBSR-022', '695'),
  ('UBSR-039', 'UBSR-047', '895')
)
insert into public.roster_entries(team_id, player_member_id, acquired_price, source)
select team.id, player.id, sold_data.acquired_price::integer, 'auction'
from sold_data
join public.league_members player on player.member_code = sold_data.player_code
join public.league_members manager on manager.member_code = sold_data.buyer_manager_code
join public.teams team on team.manager_member_id = manager.id
on conflict (player_member_id) do update set
  team_id = excluded.team_id, acquired_price = excluded.acquired_price, source = excluded.source, acquired_at = now();

insert into public.league_activity(category, headline, detail)
select 'auction', 'Auction database initialized', 'The supplied Session 4 and Session 5 auction log has been recorded. The transfer market remains closed.'
where not exists (select 1 from public.league_activity where headline = 'Auction database initialized');

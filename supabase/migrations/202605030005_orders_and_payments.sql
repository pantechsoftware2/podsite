-- Commerce records for Stripe checkout delivery and creator reporting.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  podcast_id uuid not null references public.podcasts(id) on delete cascade,
  buyer_email text not null,
  amount_total integer not null default 0 check (amount_total >= 0),
  currency text not null default 'usd',
  status text not null default 'pending',
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  download_url_expires_at timestamptz,
  delivered_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  event_type text not null,
  order_id uuid references public.orders(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  processing_error text,
  created_at timestamptz not null default now()
);

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create index if not exists orders_podcast_created_idx
on public.orders(podcast_id, created_at desc);

create index if not exists orders_product_created_idx
on public.orders(product_id, created_at desc);

create index if not exists payment_events_order_idx
on public.payment_events(order_id);

alter table public.orders enable row level security;
alter table public.payment_events enable row level security;

drop policy if exists "podcast owners can read orders" on public.orders;
create policy "podcast owners can read orders"
on public.orders
for select
using (
  exists (
    select 1 from public.podcasts
    where podcasts.id = orders.podcast_id
    and podcasts.owner_id = auth.uid()
  )
);

drop policy if exists "podcast owners can read payment events" on public.payment_events;
create policy "podcast owners can read payment events"
on public.payment_events
for select
using (
  exists (
    select 1 from public.orders
    join public.podcasts on podcasts.id = orders.podcast_id
    where orders.id = payment_events.order_id
    and podcasts.owner_id = auth.uid()
  )
);

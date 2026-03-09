-- Migration to add delivery fields to orders table
alter table public.orders
add column delivery_method text default 'Pickup';

alter table public.orders add column delivery_address text;

-- Update existing orders to have a default delivery method
update public.orders
set
    delivery_method = 'Pickup'
where
    delivery_method is null;
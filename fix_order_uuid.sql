-- Migration to add order_number to orders table
alter table public.orders add column order_number text;

-- Update existing orders to have their ID as order_number if they exist (though they likely don't due to the crash)
update public.orders set order_number = id::text where order_number is null;

-- Optional: make it unique or non-null later
-- alter table public.orders alter column order_number set not null;
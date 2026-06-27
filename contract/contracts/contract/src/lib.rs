#![no_std]
#![allow(deprecated)]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, String, Vec};

#[contracttype]
#[derive(Clone)]
pub struct MeterInfo {
    pub meter_id: String,
    pub capacity: i128,
    pub active: bool,
}

#[contracttype]
#[derive(Clone)]
pub struct EnergyListing {
    pub id: u64,
    pub producer: Address,
    pub kwh: i128,
    pub price_per_kwh: i128,
    pub active: bool,
}

#[contracttype]
#[derive(Clone)]
pub struct Bid {
    pub bidder: Address,
    pub kwh_requested: i128,
    pub total_price: i128,
}

#[contracttype]
#[derive(Clone)]
pub struct Trade {
    pub id: u64,
    pub listing_id: u64,
    pub producer: Address,
    pub consumer: Address,
    pub kwh: i128,
    pub total_price: i128,
    pub timestamp: u64,
}

#[contracttype]
pub enum DataKey {
    Meter(Address),
    NextListingId,
    Listing(u64),
    Bid(u64, Address),
    NextTradeId,
    Trade(u64),
}

const TTL: u32 = 535680; // ~1 year

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    pub fn register_meter(env: Env, producer: Address, meter_id: String, capacity: i128) {
        producer.require_auth();
        let meter = MeterInfo { meter_id: meter_id.clone(), capacity, active: true };
        env.storage().persistent().set(&DataKey::Meter(producer.clone()), &meter);
        env.storage().persistent().extend_ttl(&DataKey::Meter(producer.clone()), TTL, TTL);
        env.events().publish((symbol_short!("meter_reg"),), (producer, meter_id, capacity));
    }

    pub fn post_surplus(env: Env, producer: Address, kwh: i128, price_per_kwh: i128) -> u64 {
        producer.require_auth();
        let meter: MeterInfo = env.storage().persistent()
            .get(&DataKey::Meter(producer.clone()))
            .expect("meter not registered");
        assert!(meter.active, "meter not active");

        let mut id: u64 = env.storage().instance().get(&DataKey::NextListingId).unwrap_or(0);
        id += 1;
        env.storage().instance().set(&DataKey::NextListingId, &id);

        let listing = EnergyListing { id, producer: producer.clone(), kwh, price_per_kwh, active: true };
        env.storage().persistent().set(&DataKey::Listing(id), &listing);
        env.storage().persistent().extend_ttl(&DataKey::Listing(id), TTL, TTL);

        env.events().publish((symbol_short!("surplus"),), (producer, id, kwh, price_per_kwh));
        id
    }

    pub fn place_bid(env: Env, listing_id: u64, bidder: Address, kwh_requested: i128, total_price: i128) {
        bidder.require_auth();
        let listing: EnergyListing = env.storage().persistent()
            .get(&DataKey::Listing(listing_id))
            .expect("listing not found");
        assert!(listing.active, "listing not active");
        assert!(kwh_requested <= listing.kwh, "not enough energy available");

        let bid = Bid { bidder: bidder.clone(), kwh_requested, total_price };
        env.storage().persistent().set(&DataKey::Bid(listing_id, bidder.clone()), &bid);
        env.storage().persistent().extend_ttl(&DataKey::Bid(listing_id, bidder.clone()), TTL, TTL);

        env.events().publish((symbol_short!("bid"),), (listing_id, bidder, kwh_requested, total_price));
    }

    pub fn accept_bid(env: Env, producer: Address, listing_id: u64, bidder: Address) -> u64 {
        producer.require_auth();
        let mut listing: EnergyListing = env.storage().persistent()
            .get(&DataKey::Listing(listing_id))
            .expect("listing not found");
        assert!(listing.active, "listing already closed");
        assert_eq!(listing.producer, producer, "only producer can accept bids");

        let bid: Bid = env.storage().persistent()
            .get(&DataKey::Bid(listing_id, bidder.clone()))
            .expect("bid not found");

        listing.active = false;
        env.storage().persistent().set(&DataKey::Listing(listing_id), &listing);

        let mut trade_id: u64 = env.storage().instance().get(&DataKey::NextTradeId).unwrap_or(0);
        trade_id += 1;
        env.storage().instance().set(&DataKey::NextTradeId, &trade_id);

        let trade = Trade {
            id: trade_id, listing_id, producer: producer.clone(),
            consumer: bidder.clone(), kwh: bid.kwh_requested,
            total_price: bid.total_price, timestamp: env.ledger().timestamp(),
        };
        env.storage().persistent().set(&DataKey::Trade(trade_id), &trade);
        env.storage().persistent().extend_ttl(&DataKey::Trade(trade_id), TTL, TTL);

        env.events().publish(
            (symbol_short!("trade"),),
            (trade_id, listing_id, producer, bidder, bid.kwh_requested, bid.total_price),
        );
        trade_id
    }

    pub fn get_meter(env: Env, producer: Address) -> MeterInfo {
        env.storage().persistent().get(&DataKey::Meter(producer)).expect("meter not found")
    }

    pub fn get_listing(env: Env, listing_id: u64) -> EnergyListing {
        env.storage().persistent().get(&DataKey::Listing(listing_id)).expect("listing not found")
    }

    pub fn get_bid(env: Env, listing_id: u64, bidder: Address) -> Bid {
        env.storage().persistent().get(&DataKey::Bid(listing_id, bidder)).expect("bid not found")
    }

    pub fn get_trade(env: Env, trade_id: u64) -> Trade {
        env.storage().persistent().get(&DataKey::Trade(trade_id)).expect("trade not found")
    }

    pub fn get_listings(env: Env) -> Vec<EnergyListing> {
        let next: u64 = env.storage().instance().get(&DataKey::NextListingId).unwrap_or(0);
        let mut res: Vec<EnergyListing> = Vec::new(&env);
        let mut i: u64 = 1;
        while i <= next {
            if let Some(l) = env.storage().persistent().get::<_, EnergyListing>(&DataKey::Listing(i)) {
                res.push_back(l);
            }
            i += 1;
        }
        res
    }

    pub fn get_trades_for(env: Env, addr: Address) -> Vec<Trade> {
        let next: u64 = env.storage().instance().get(&DataKey::NextTradeId).unwrap_or(0);
        let mut res: Vec<Trade> = Vec::new(&env);
        let mut i: u64 = 1;
        while i <= next {
            if let Some(t) = env.storage().persistent().get::<_, Trade>(&DataKey::Trade(i)) {
                if t.producer == addr || t.consumer == addr {
                    res.push_back(t);
                }
            }
            i += 1;
        }
        res
    }
}

mod test;

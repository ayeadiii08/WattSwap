#![cfg(test)]

use super::*;
use soroban_sdk::{Env, String, Address};
use soroban_sdk::testutils::Address as _;

#[test]
fn test_register_meter() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let producer = Address::generate(&env);
    client.register_meter(&producer, &String::from_str(&env, "MTR-001"), &1000i128);

    let meter = client.get_meter(&producer);
    assert_eq!(meter.meter_id, String::from_str(&env, "MTR-001"));
    assert_eq!(meter.capacity, 1000);
    assert!(meter.active);
}

#[test]
fn test_post_surplus() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let producer = Address::generate(&env);
    client.register_meter(&producer, &String::from_str(&env, "MTR-001"), &1000i128);

    let id = client.post_surplus(&producer, &500i128, &15i128);
    assert_eq!(id, 1u64);

    let listing = client.get_listing(&id);
    assert_eq!(listing.producer, producer);
    assert_eq!(listing.kwh, 500);
    assert_eq!(listing.price_per_kwh, 15);
    assert!(listing.active);
}

#[test]
fn test_place_bid() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let producer = Address::generate(&env);
    let consumer = Address::generate(&env);
    client.register_meter(&producer, &String::from_str(&env, "MTR-001"), &1000i128);
    let listing_id = client.post_surplus(&producer, &500i128, &10i128);

    client.place_bid(&listing_id, &consumer, &200i128, &2000i128);
    let bid = client.get_bid(&listing_id, &consumer);
    assert_eq!(bid.kwh_requested, 200);
    assert_eq!(bid.total_price, 2000);
}

#[test]
fn test_accept_bid_completes_trade() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let producer = Address::generate(&env);
    let consumer = Address::generate(&env);

    client.register_meter(&producer, &String::from_str(&env, "MTR-001"), &1000i128);
    let listing_id = client.post_surplus(&producer, &500i128, &10i128);
    client.place_bid(&listing_id, &consumer, &200i128, &2000i128);

    let trade_id = client.accept_bid(&producer, &listing_id, &consumer);
    assert_eq!(trade_id, 1u64);

    let trade = client.get_trade(&trade_id);
    assert_eq!(trade.listing_id, 1);
    assert_eq!(trade.producer, producer);
    assert_eq!(trade.consumer, consumer);
    assert_eq!(trade.kwh, 200);
    assert_eq!(trade.total_price, 2000);
    assert_eq!(trade.timestamp, 0); // ledger timestamp is 0 in test env

    // Listing should be inactive after trade
    let listing = client.get_listing(&listing_id);
    assert!(!listing.active);
}

#[test]
fn test_get_listings_returns_all() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let producer = Address::generate(&env);
    client.register_meter(&producer, &String::from_str(&env, "MTR-001"), &2000i128);

    let id1 = client.post_surplus(&producer, &500i128, &10i128);
    let id2 = client.post_surplus(&producer, &300i128, &12i128);

    let listings = client.get_listings();
    assert_eq!(listings.len(), 2);
    assert_eq!(listings.get(0).unwrap().id, id1);
    assert_eq!(listings.get(1).unwrap().id, id2);
}

#[test]
fn test_get_trades_for_participant() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let producer = Address::generate(&env);
    let consumer = Address::generate(&env);

    client.register_meter(&producer, &String::from_str(&env, "MTR-001"), &1000i128);
    let listing_id = client.post_surplus(&producer, &500i128, &10i128);
    client.place_bid(&listing_id, &consumer, &200i128, &2000i128);
    client.accept_bid(&producer, &listing_id, &consumer);

    let producer_trades = client.get_trades_for(&producer);
    assert_eq!(producer_trades.len(), 1);

    let consumer_trades = client.get_trades_for(&consumer);
    assert_eq!(consumer_trades.len(), 1);
}

#[test]
#[should_panic(expected = "meter not registered")]
fn test_post_surplus_without_meter_panics() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let producer = Address::generate(&env);
    client.post_surplus(&producer, &500i128, &10i128);
}

#[test]
#[should_panic(expected = "listing not active")]
fn test_bid_on_closed_listing_panics() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let producer = Address::generate(&env);
    let consumer1 = Address::generate(&env);
    let consumer2 = Address::generate(&env);

    client.register_meter(&producer, &String::from_str(&env, "MTR-001"), &1000i128);
    let listing_id = client.post_surplus(&producer, &500i128, &10i128);
    client.place_bid(&listing_id, &consumer1, &200i128, &2000i128);
    client.accept_bid(&producer, &listing_id, &consumer1);

    // Try to bid on closed listing
    client.place_bid(&listing_id, &consumer2, &100i128, &1000i128);
}

#[test]
#[should_panic(expected = "only producer can accept bids")]
fn test_non_producer_cannot_accept_bid() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let producer = Address::generate(&env);
    let consumer = Address::generate(&env);
    let imposter = Address::generate(&env);

    client.register_meter(&producer, &String::from_str(&env, "MTR-001"), &1000i128);
    let listing_id = client.post_surplus(&producer, &500i128, &10i128);
    client.place_bid(&listing_id, &consumer, &200i128, &2000i128);

    // Imposter tries to accept
    client.accept_bid(&imposter, &listing_id, &consumer);
}

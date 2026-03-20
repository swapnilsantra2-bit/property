#![cfg(test)]

use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{Address, Env, String};

#[test]
fn test_register_property() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let prop_id = String::from_str(&env, "LAND-001");
    let location = String::from_str(&env, "123 Blockchain Ave, Lagos");
    let description = String::from_str(&env, "2-bedroom apartment, 85 sqm");

    client.register(&owner, &prop_id, &location, &description);

    let property = client.get_property(&prop_id);
    assert_eq!(property.owner, owner);
    assert_eq!(property.location, location);
    assert_eq!(property.description, description);
}

#[test]
fn test_register_multiple_properties() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let other = Address::generate(&env);

    client.register(
        &owner,
        &String::from_str(&env, "LAND-001"),
        &String::from_str(&env, "Location A"),
        &String::from_str(&env, "House"),
    );
    client.register(
        &other,
        &String::from_str(&env, "LAND-002"),
        &String::from_str(&env, "Location B"),
        &String::from_str(&env, "Plot"),
    );

    let all = client.get_all_properties();
    assert_eq!(all.len(), 2);
    assert!(all.contains(&String::from_str(&env, "LAND-001")));
    assert!(all.contains(&String::from_str(&env, "LAND-002")));
}

#[test]
fn test_transfer_property() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let buyer = Address::generate(&env);
    let prop_id = String::from_str(&env, "LAND-001");

    client.register(
        &owner,
        &prop_id,
        &String::from_str(&env, "Location A"),
        &String::from_str(&env, "House"),
    );

    let before = client.get_property(&prop_id);
    assert_eq!(before.owner, owner);

    client.transfer(&owner, &prop_id, &buyer);

    let after = client.get_property(&prop_id);
    assert_eq!(after.owner, buyer);
    assert_eq!(after.location, before.location);
    assert_eq!(after.description, before.description);
}

#[test]
fn test_get_all_properties_empty() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let all = client.get_all_properties();
    assert_eq!(all.len(), 0);
}

#[test]
#[should_panic(expected = "property already registered")]
fn test_cannot_register_duplicate() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let prop_id = String::from_str(&env, "LAND-001");

    client.register(
        &owner,
        &prop_id,
        &String::from_str(&env, "Location A"),
        &String::from_str(&env, "House"),
    );
    client.register(
        &owner,
        &prop_id,
        &String::from_str(&env, "Location B"),
        &String::from_str(&env, "Plot"),
    );
}

#[test]
#[should_panic(expected = "property not found")]
fn test_get_nonexistent_property() {
    let env = Env::default();
    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    client.get_property(&String::from_str(&env, "NOPE"));
}

#[test]
#[should_panic(expected = "not the owner")]
fn test_cannot_transfer_if_not_owner() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(Contract, ());
    let client = ContractClient::new(&env, &contract_id);

    let owner = Address::generate(&env);
    let thief = Address::generate(&env);
    let buyer = Address::generate(&env);
    let prop_id = String::from_str(&env, "LAND-001");

    client.register(
        &owner,
        &prop_id,
        &String::from_str(&env, "Location A"),
        &String::from_str(&env, "House"),
    );

    // thief tries to steal the property
    client.transfer(&thief, &prop_id, &buyer);
}

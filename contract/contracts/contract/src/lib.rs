#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Map, String, Vec};

#[contracttype]
#[derive(Clone)]
pub struct Property {
    pub location: String,
    pub description: String,
    pub owner: Address,
}

#[contracttype]
pub enum DataKey {
    Properties,
    Registry,
}

#[contract]
pub struct Contract;

#[contractimpl]
impl Contract {
    /// Register a new property. Caller becomes the owner.
    /// Permissionless — anyone can register without approval.
    pub fn register(
        env: Env,
        caller: Address,
        property_id: String,
        location: String,
        description: String,
    ) {
        caller.require_auth();
        let mut props: Map<String, Property> = env
            .storage()
            .instance()
            .get(&DataKey::Properties)
            .unwrap_or(Map::new(&env));
        assert!(
            !props.contains_key(property_id.clone()),
            "property already registered"
        );

        let property = Property {
            location,
            description,
            owner: caller,
        };
        props.set(property_id.clone(), property);
        env.storage().instance().set(&DataKey::Properties, &props);

        let mut ids: Vec<String> = env
            .storage()
            .instance()
            .get(&DataKey::Registry)
            .unwrap_or(Vec::new(&env));
        ids.push_back(property_id);
        env.storage().instance().set(&DataKey::Registry, &ids);
    }

    /// Transfer a property to a new owner. Only the current owner can transfer.
    pub fn transfer(env: Env, caller: Address, property_id: String, new_owner: Address) {
        caller.require_auth();
        let mut props: Map<String, Property> = env
            .storage()
            .instance()
            .get(&DataKey::Properties)
            .unwrap_or(Map::new(&env));
        assert!(
            props.contains_key(property_id.clone()),
            "property not found"
        );

        let mut property = props.get(property_id.clone()).unwrap();
        assert!(property.owner == caller, "not the owner");

        property.owner = new_owner;
        props.set(property_id, property);
        env.storage().instance().set(&DataKey::Properties, &props);
    }

    /// Get a property by its ID. Public — no auth needed.
    pub fn get_property(env: Env, property_id: String) -> Property {
        let props: Map<String, Property> = env
            .storage()
            .instance()
            .get(&DataKey::Properties)
            .unwrap_or(Map::new(&env));
        props.get(property_id).expect("property not found")
    }

    /// List all registered property IDs. Public — no auth needed.
    pub fn get_all_properties(env: Env) -> Vec<String> {
        env.storage()
            .instance()
            .get(&DataKey::Registry)
            .unwrap_or(Vec::new(&env))
    }
}

mod test;

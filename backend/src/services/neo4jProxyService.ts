import dotenv from "dotenv";
import {User} from "../types/user";

dotenv.config();

const FEDIVERSE_SERVER_URL = new URL(process.env.FEDIVERSE_SERVER_URL as string);
const NEO4J_API = new URL(process.env.NEO4J_API as string);

const fediverseDomain = FEDIVERSE_SERVER_URL.hostname;


export const queryNeo4j = async (cypher : string, params = {}) => {
  console.log('cypher', cypher);
  console.log('params', params);

  const response = await fetch(`${NEO4J_API}query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ cypher, params })
  });

  console.log('response', response);

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}


export const createGraphUser = async (
  id: string,
  name: string,
  email: string,
  publicKey: string,
  encryptedPrivateKey: string
) => {
  const cypher = `
    CREATE (:User {
      id: $id, 
      name: $name, 
      email: $email, 
      created_at: datetime(),
      activated: false,
      public_key: $publicKey,
      encrypted_private_key: $encryptedPrivateKey
    })`;

  const params = {
    id,
    name,
    email,
    publicKey,
    encryptedPrivateKey
  };

  await queryNeo4j(cypher, params);
};

export const getGraphUserById = async (id: string) => {
  const cypher = `MATCH (u:User {id: $id}) RETURN u`;

  const params =  { id };

  return await queryNeo4j(cypher, params);
};

export const getGraphUserByUsername = async (username: string) => {
  const cypher = `
    MATCH (u:User)
    WHERE u.username = $username AND u.domain = $domain
    RETURN u
    `;

  const params =  { username, fediverseDomain };

  return await queryNeo4j(cypher, params);
};

export const updateGraphUser = async (
  id: string,
  displayName: string | undefined = undefined,
  username: string | undefined = undefined,
  summary: string | undefined = undefined,
  profilePic: string | undefined = undefined
) => {

  let setProps : any = { id }
  const setQueryString = [];

  if (displayName) {
    setProps = {...setProps, displayName};
    setQueryString.push(`u.displayName = $displayName`)
  }

  if (username) {
    setProps = {...setProps, username};
    setQueryString.push(`u.username = $username`)

    const activated = true;
    setProps = {...setProps, activated };
    setQueryString.push(`u.activated = $activated`)

    setProps = {...setProps, domain: fediverseDomain };
    setQueryString.push(`u.domain = $domain`)
  }

  if (summary) {
    setProps = {...setProps, summary };
    setQueryString.push(`u.summary = $summary`)
  }

  if (profilePic) {
    setProps = {...setProps, profilePic };
    setQueryString.push(`u.profilePic = $profilePic`)
  }

  const cypher = `
    MATCH (u:User {id: $id})
    SET ${setQueryString.join(', ')}
    `;

  return await queryNeo4j(cypher, setProps);
};

export const createExternalGraphUser = async (
  username: string,
  domain: string
) => {
  const cypher = `
    CREATE (:User {
      username: $username, 
      domain: $domain
    })
    `;

  const params = {
      username,
      domain
    };

  await queryNeo4j(cypher, params);
};

export const addGraphFollow = async (
  followerUsername: string,
  followerDomain: string,
  followedUsername: string,
  followedDomain: string
) => {
  const cypher = `MATCH (a:User {username: $followerUsername, domain: $followerDomain}),
           (b:User {username: $followedUsername, domain: $followedDomain})
     CREATE (a)-[:FOLLOWS {since: datetime()}]->(b)`;

  const params = { followerUsername, followerDomain, followedUsername, followedDomain };

  await queryNeo4j(cypher, params);
};

export const getGraphFollowers = async (
  userUsername: string,
  userDomain: string,
  skip = 0,
  limit = 10
) => {
  const cypher = `
    MATCH (follower:User)-[f:FOLLOWS]->(user:User {username: $userUsername, domain: $userDomain})
   RETURN follower, f.since AS followedAt
   ORDER BY f.since DESC
   SKIP toInteger($skip)
   LIMIT toInteger($limit)`;

  const params = { userUsername, userDomain, skip, limit };

  const response = await queryNeo4j(cypher, params);

  return response.map((row : any) => {
    const {
      username,
      domain,
      displayName,
      summary,
      profilePicUrl,
      inbox,
      outbox,
      followers,
      following,
      publicKey,
      encryptedPrivateKey
    } = row.follower.properties;

    return {
      fediverseId: domain === fediverseDomain
        ? `https://${domain}/users/${username}`
        : undefined,
      username,
      displayName,
      summary,
      profilePicUrl,
      inbox,
      outbox,
      followers,
      following,
      publicKey,
      encryptedPrivateKey,
      domain
    } as User;
  });
};

export const getGraphFollowing = async (
  userUsername: string,
  userDomain: string,
  skip = 0,
  limit = 10
) => {
  const cypher = `
    MATCH (user:User {username: $userUsername, domain: $userDomain})-[f:FOLLOWS]->(followed:User)
    RETURN followed, f.since AS followedAt
    ORDER BY f.since DESC
    SKIP toInteger($skip)
    LIMIT toInteger($limit)`;

  const params = { userUsername, userDomain, skip, limit };

  const response = await queryNeo4j(cypher, params);

  return response.map((row : any) => {
    const {
      username,
      domain,
      displayName,
      summary,
      profilePicUrl,
      inbox,
      outbox,
      followers,
      following,
      publicKey,
      encryptedPrivateKey
    } = row.followed.properties;

    return {
      fediverseId: domain === fediverseDomain
        ? `https://${domain}/users/${username}`
        : undefined,
      username,
      displayName,
      summary,
      profilePicUrl,
      inbox,
      outbox,
      followers,
      following,
      publicKey,
      encryptedPrivateKey,
      domain
    } as User;
  });
};

export const countGraphFollowers = async (
  userUsername: string,
  userDomain: string
) => {
  const cypher = `
    MATCH (:User)-[:FOLLOWS]->(user:User {username: $userUsername, domain: $userDomain})
    RETURN COUNT(*) AS followerCount`;

  const params = { userUsername, userDomain };

  const response = await queryNeo4j(cypher, params);

  return response[0]?.followerCount?.low as number;
};

export const countGraphFollowing = async (
  userUsername: string,
  userDomain: string
) => {
  const cypher = `
    MATCH (user:User {username: $userUsername, domain: $userDomain})-[:FOLLOWS]->(:User)
    RETURN COUNT(*) AS followingCount`;

  const params = { userUsername, userDomain };

  const response = await queryNeo4j(cypher, params);

  return response[0]?.followingCount?.low as number;
};

export const removeGraphFollow = async (
  followerUsername: string,
  followerDomain: string,
  followedUsername: string,
  followedDomain: string
) => {
  const cypher = `
    MATCH (
      a:User {username: $followerUsername, domain: $followerDomain}
      )-[r:FOLLOWS]->(
      b:User {username: $followedUsername, domain: $followedDomain})
    DELETE r`;

  const params = { followerUsername, followerDomain, followedUsername, followedDomain };

  await queryNeo4j(cypher, params);
};
import neo4j from 'neo4j-driver';
import dotenv from "dotenv";

dotenv.config();

const NEO4J_URI = process.env.NEO4J_URI!;
const NEO4J_USERNAME = process.env.NEO4J_USERNAME!;
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD!;
const FEDIVERSE_SERVER_URL = new URL(process.env.FEDIVERSE_SERVER_URL as string);

const fediverseDomain = FEDIVERSE_SERVER_URL.hostname;

const driver = neo4j.driver(
  NEO4J_URI!,
  neo4j.auth.basic(NEO4J_USERNAME!, NEO4J_PASSWORD!)
);


const session = driver.session();

export const createGraphUser = async (
  id: string,
  name: string,
  email: string,
  publicKey: string,
  encryptedPrivateKey: string
) => {
  await session.run(
    `
    CREATE (:User {
      id: $id, 
      name: $name, 
      email: $email, 
      created_at: datetime(),
      activated: false,
      public_key: $publicKey,
      encrypted_private_key: $encryptedPrivateKey
    })
    `,
    {
      id,
      name,
      email,
      publicKey,
      encryptedPrivateKey
    }
  );
};

export const getGraphUserById = async (id: string) => {
  const result = await session.run(
    `MATCH (u:User {id: $id}) RETURN u`,
    { id }
  );
  return result.records[0]?.get('u').properties;
};

export const getGraphUserByUsername = async (username: string) => {
  const result = await session.run(
    `
    MATCH (u:User)
    WHERE u.username = $username AND u.domain = $domain
    RETURN u
    `,
    { username, fediverseDomain }
  );
  return result.records[0]?.get('u').properties;
};

export const updateGraphUser = async (
  id: string,
  displayName: string | undefined = undefined,
  username: string | undefined = undefined,
  summary: string | undefined = undefined,
  profilePic: string | undefined = undefined
) => {

  const setProps = [];
  const setQueryString = [];

  if (displayName) {
    setProps.push(displayName);
    setQueryString.push(`u.displayName = $displayName`)
  }

  if (username) {
    setProps.push(username);
    setQueryString.push(`u.username = $username`)

    setProps.push(true);
    setQueryString.push(`u.activated = $activated`)

    setProps.push(fediverseDomain);
    setQueryString.push(`u.domain = $domain`)
  }

  if (summary) {
    setProps.push(summary);
    setQueryString.push(`u.summary = $summary`)
  }

  if (profilePic) {
    setProps.push(profilePic);
    setQueryString.push(`u.profilePic = $profilePic`)
  }

  await session.run(
    `
    MATCH (u:User {id: $id})
    SET ${setQueryString.join(' ')}
    `,
    { id, ...setProps },
  );
};

export const createExternalGraphUser = async (
  username: string,
  domain: string
) => {
  await session.run(
    `
    CREATE (:User {
      username: $username, 
      domain: $domain
    })
    `,
    {
      username,
      domain
    }
  );
};

export const addGraphFollow = async (
  followerUsername: string,
  followerDomain: string,
  followedUsername: string,
  followedDomain: string
) => {
  await session.run(
    `MATCH (a:User {username: $followerUsername, domain: $followerDomain}),
           (b:User {username: $followedUsername, domain: $followedDomain})
     CREATE (a)-[:FOLLOWS {since: datetime()}]->(b)`,
    { followerUsername, followerDomain, followedUsername, followedDomain }
  );
};

export const getGraphFollowers = async (
  userUsername: string,
  userDomain: string,
  skip = 0,
  limit = 10
) => {
  const result = await session.run(
    `MATCH (follower:User)-[f:FOLLOWS]->(user:User {username: $userUsername, domain: $userDomain})
     RETURN follower, f.since AS followedAt
     ORDER BY f.since DESC
     SKIP $skip
     LIMIT $limit`,
    { userUsername, userDomain, skip, limit }
  );

  return result.records.map(record => ({
    ...record.get('follower').properties,
    followedAt: record.get('followedAt')
  }));
};

export const getGraphFollowing = async (
  userUsername: string,
  userDomain: string,
  skip = 0,
  limit = 10
) => {
  const result = await session.run(
    `MATCH (user:User {username: $userUsername, domain: $userDomain})-[f:FOLLOWS]->(followed:User)
     RETURN followed, f.since AS followedAt
     ORDER BY f.since DESC
     SKIP $skip
     LIMIT $limit`,
    { userUsername, userDomain, skip, limit }
  );

  return result.records.map(record => ({
    ...record.get('followed').properties,
    followedAt: record.get('followedAt')
  }));
};

export const countGraphFollowers = async (
  userUsername: string,
  userDomain: string
) => {
  const result = await session.run(
    `MATCH (:User)-[:FOLLOWS]->(user:User {username: $userUsername, domain: $userDomain})
     RETURN COUNT(*) AS followerCount`,
    { userUsername, userDomain }
  );

  return result.records[0].get('followerCount').toInt();
};

export const countGraphFollowing = async (
  userUsername: string,
  userDomain: string
) => {
  const result = await session.run(
    `MATCH (user:User {username: $userUsername, domain: $userDomain})-[:FOLLOWS]->(:User)
     RETURN COUNT(*) AS followingCount`,
    { userUsername, userDomain }
  );

  return result.records[0].get('followingCount').toInt();
};

export const removeGraphFollow = async (
  followerUsername: string,
  followerDomain: string,
  followedUsername: string,
  followedDomain: string
) => {
  await session.run(
    `MATCH (
      a:User {username: $followerUsername, domain: $followerDomain}
      )-[r:FOLLOWS]->(
      b:User {username: $followedUsername, domain: $followedDomain})
    DELETE r`,
    { followerUsername, followerDomain, followedUsername, followedDomain }
  );
};



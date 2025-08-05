import { User } from "../../../shared/types/user";
import { Person } from "../types/person";
import {Community} from "../../../shared/types/community";
import {Group} from "../types/group";

export function getPersonFromUser(user: User): Person {
  return {
    "@context": [
      "https://www.w3.org/ns/activitystreams",
      "https://w3id.org/security/v1"
    ],
    id: user.fediverseId,
    type: "Person",
    preferredUsername: user.username,
    name: user.displayName,
    summary: user.summary || '',
    inbox: `${user.fediverseId}/inbox`,
    outbox: `${user.fediverseId}/outbox`,
    followers: `${user.fediverseId}/followers`,
    following: `${user.fediverseId}/following`,
    liked: `${user.fediverseId}/liked`,
    icon: {
      type: "Image",
      mediaType: "image/jpeg",
      url: user.profilePicUrl
    },
    publicKey: {
      id: `${user.fediverseId}#main-key`,
      owner: user.fediverseId,
      publicKeyPem: user.publicKey
    }
  };
}

export function getGroupFromCommunity(community: Community): Group {

  return {
    "@context": [
      "https://www.w3.org/ns/activitystreams",
      "https://w3id.org/security/v1"
    ],
    id: community.fediverseId,
    type: "Group",
    preferredUsername: community.handle,
    name: community.displayName,
    summary: community.summary || '',
    inbox: `${community.fediverseId}/inbox`,
    outbox: `${community.fediverseId}/outbox`,
    followers: `${community.fediverseId}/followers`,
    following: `${community.fediverseId}/following`,
    icon: {
      type: "Image",
      mediaType: "image/jpeg",
      url: community.communityPicUrl
    },
    publicKey: {
      id: `${community.fediverseId}#main-key`,
      owner: community.fediverseId,
      publicKeyPem:  community.handle,
    },
    published: community.created,
    updated: community.updated,
  };
}

export function getUserFromPerson(person: Person): User {
  return {
    fediverseId: person.id,
    username: person.preferredUsername || '',
    displayName: person.name || '',
    summary: person.summary || '',
    inbox: person.inbox,
    outbox: person.outbox,
    followers: person.followers,
    following: person.following,
    profilePicUrl: person.icon?.url || '',
    publicKey: person.publicKey.publicKeyPem
  };
}
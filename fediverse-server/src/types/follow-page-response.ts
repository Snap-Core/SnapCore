export interface FollowPageResponse {
  "@context": "https://www.w3.org/ns/activitystreams";
  id: string;
  type: "OrderedCollectionPage";
  totalItems: number;
  next: string;
  partOf: string;
  orderedItems: string[]
}
export interface OutboxPageResponse {
  "@context": "https://www.w3.org/ns/activitystreams";
  id: string;
  type: "OrderedCollectionPage";
  next: string;
  prev: string;
  partOf: string;
  orderedItems: object[];
}
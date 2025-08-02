export interface WebfingerResponse {
  subject: string;
  alias?: string[];
  links: WebfingerResponseLink[];

}

export interface WebfingerResponseLink {
  rel: string;
  type?: string;
  href?: string;
  template?: string;
}
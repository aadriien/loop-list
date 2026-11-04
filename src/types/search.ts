export interface SearchResult {
  videoId: string;
  title: string;
  channel: string;
}

export interface SearchPage {
  items: SearchResult[];
  nextPageToken: string;
}

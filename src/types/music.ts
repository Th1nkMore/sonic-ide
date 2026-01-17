export type Language = "en" | "zh" | "jp";

export type SongMetadata = {
  [key: string]: string | number;
};

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  lyrics: string;
  audioUrl: string;
  metadata: SongMetadata;
  language: Language;
}

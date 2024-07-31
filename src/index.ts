import { Tracklist } from "./tracklistLinkedList";
import Volume from "./volume";
import AudioSource from "./audioSource";

export type Track = {
  arrayBuffer: ArrayBuffer;
  id: string;
};

export type AudioPlayerTrack = Omit<Track, "arrayBuffer"> & {
  buffer: AudioBuffer;
};

export default class AudioPlayer {
  private _context: AudioContext | undefined = undefined;
  private _trackList = new Tracklist({ trackLimit: 3 });
  private _loadedAudio: AudioSource | undefined;
  private _volume: Volume | undefined = undefined;
  get isMuted(): boolean {
    return this.volume().isMuted;
  }

  get currentVolume(): number {
    return this.volume().currentVolume;
  }

  get currentTime(): number {
    return this.context().currentTime;
  }

  get currentDuration(): number {
    return this.audioSource().duration;
  }

  private decodeAudioData(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
    return new Promise((res, rej) => {
      this.context().decodeAudioData(
        arrayBuffer,
        (buffer: AudioBuffer) => {
          res(buffer);
        },
        (error: DOMException) => {
          rej(error);
        },
      );
    });
  }
  private context(): AudioContext {
    if (!this._context) {
      this._context = new AudioContext();
    }
    return this._context;
  }
  private volume(): Volume {
    if (!this._volume) {
      const context = this.context();
      this._volume = new Volume({ context });
    }
    return this._volume;
  }
  private audioSource(): AudioSource {
    if (!this._loadedAudio) {
      const emptyBuffer = new AudioBuffer({ length: 1, sampleRate: 44100 });
      this._loadedAudio = new AudioSource({
        context: this.context(),
        buffer: emptyBuffer,
        gainNode: this.volume().gainNode,
      });
    }
    return this._loadedAudio;
  }

  private async _load(
    track: Track,
    { placement }: { placement: "FRONT" | "REAR" },
  ) {
    const buffer = await this.decodeAudioData(track.arrayBuffer);
    const audioPlayerTrack: AudioPlayerTrack = {
      buffer,
      id: track.id,
    };
    if (placement === "FRONT") {
      this._trackList.addToFront(audioPlayerTrack);
    } else {
      this._trackList.addToRear(audioPlayerTrack);
    }
  }
  async load(track: Track) {
    return this._load(track, { placement: "FRONT" });
  }
  async loadToRear(track: Track) {
    return this._load(track, { placement: "REAR" });
  }
  clear() {
    this._trackList.clear();
  }
  play() {
    const currentTrack = this._trackList.currentTrack;
    if (!currentTrack) {
      // there is no track to play
      return;
    }
    const audioSource = this.audioSource();
    if (audioSource.state === "PLAYING") {
      // we're already playing
      return;
    }
    // load the audio buffer and play it now
    audioSource.load(currentTrack.buffer);
    audioSource.play();
  }
  pause() {
    this.audioSource().pause();
  }
  stop() {
    this.audioSource().stop();
  }
  seek(to: number) {
    this.audioSource().seek(to);
  }
  seekAndPlay(to: number) {
    this.audioSource().seekAndPlay(to);
  }
  skipForward() {
    const track = this._trackList.moveCurrentForward();
    if (track) {
      this.audioSource().load(track.buffer);
    }
  }
  skipBackward() {
    const track = this._trackList.moveCurrentBack();
    if (track) {
      this.audioSource().load(track.buffer);
    }
  }
  mute() {
    this.volume().mute();
  }
  unmute() {
    this.volume().unmute();
  }
  setVolume(percent: number) {
    this.volume().set(percent);
  }
  maxVolume() {
    this.volume().set(1);
  }
}

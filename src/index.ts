import { Tracklist } from "./tracklistLinkedList";
import Volume from "./volume";
import AudioSource from "./audioSource";

/**
 * Represents the audio tracks loaded into the audio player
 *
 * @export
 * @typedef {Track}
 */
export type Track = {
  arrayBuffer: ArrayBuffer;
  id: string;
};

/**
 * Represents the audio tracks loaded into the audio player
 * under the Web Audio APIs
 *
 * @export
 * @typedef {AudioPlayerTrack}
 */
export type AudioPlayerTrack = Omit<Track, "arrayBuffer"> & {
  buffer: AudioBuffer;
};

/**
 * The audio player
 *
 * @export
 * @class AudioPlayer
 * @typedef {AudioPlayer}
 */
export default class AudioPlayer {
  /**
   * Represents the singleton AudioContext
   *
   * @private
   * @type {(AudioContext | undefined)}
   */
  private _context: AudioContext | undefined = undefined;
  /**
   * Represents the singleton TrackList
   *
   * @private
   * @type {*}
   */
  private _trackList = new Tracklist({ trackLimit: 3 });
  /**
   * Represents the singleton AudioSource
   *
   * @private
   * @type {(AudioSource | undefined)}
   */
  private _loadedAudio: AudioSource | undefined;
  /**
   * Represents the singleton Volume
   *
   * @private
   * @type {(Volume | undefined)}
   */
  private _volume: Volume | undefined = undefined;
  /**
   * Returns true if the volume is muted
   *
   * @readonly
   * @type {boolean}
   */
  get isMuted(): boolean {
    return this.volume().isMuted;
  }

  /**
   * Returns the current volume as a percentage from 0 to 1
   *
   * @readonly
   * @type {number}
   */
  get currentVolume(): number {
    return this.volume().currentVolume;
  }

  /**
   * Returns the current time of the currently loaded track. Defaults to zero.
   *
   * @readonly
   * @type {number}
   */
  get currentTime(): number {
    return this.context().currentTime;
  }

  /**
   * Returns the current duration of the currently loaded track. Defaults to zero.
   *
   * @readonly
   * @type {number}
   */
  get currentDuration(): number {
    return this.audioSource().duration;
  }

  /**
   * Decodes the ArrayBuffer to an AudioBuffer
   *
   * @private
   * @param {ArrayBuffer} arrayBuffer
   * @returns {Promise<AudioBuffer>}
   */
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
  /**
   * Returns the singleton AudioContext, creates it if it doesn't exist
   *
   * @private
   * @returns {AudioContext}
   */
  private context(): AudioContext {
    if (!this._context) {
      this._context = new AudioContext();
    }
    return this._context;
  }
  /**
   * Returns the singleton Volume, creates it if it doesn't exist
   *
   * @private
   * @returns {Volume}
   */
  private volume(): Volume {
    if (!this._volume) {
      const context = this.context();
      this._volume = new Volume({ context });
    }
    return this._volume;
  }
  /**
   * Returns the singleton AudioSource, creates it if it doesn't exist
   *
   * @private
   * @returns {AudioSource}
   */
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

  /**
   * Loads the track to either the front or the rear of the TrackList
   *
   * @private
   * @async
   * @param {Track} track
   * @param {({ placement: "FRONT" | "REAR" })} param0
   * @param {("REAR" | "FRONT")} param0.placement
   * @returns {*}
   */
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
  /**
   * Loads the track to the front of the TrackList
   *
   * @async
   * @param {Track} track
   * @returns {unknown}
   */
  async load(track: Track) {
    return this._load(track, { placement: "FRONT" });
  }
  /**
   * Loads the track to the rear of the TrackList
   *
   * @async
   * @param {Track} track
   * @returns {unknown}
   */
  async loadToRear(track: Track) {
    return this._load(track, { placement: "REAR" });
  }
  /**
   * Removes all loaded tracks in the TrackList
   */
  clear() {
    this._trackList.clear();
  }
  /**
   * Plays the current track
   */
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
  /**
   * Pauses the current track
   */
  pause() {
    this.audioSource().pause();
  }
  /**
   * Stops the current track and sets the time to zero
   */
  stop() {
    this.audioSource().stop();
  }
  /**
   * Seeks the time to `to` and pauses playback
   *
   * @param {number} to
   */
  seek(to: number) {
    this.audioSource().seek(to);
  }
  /**
   * Seeks the time to `to` and resumes playback
   *
   * @param {number} to
   */
  seekAndPlay(to: number) {
    this.audioSource().seekAndPlay(to);
  }
  /**
   * Loads the next track in the TrackList and stops playback.
   */
  skipForward() {
    const track = this._trackList.moveCurrentForward();
    if (track) {
      this.audioSource().load(track.buffer);
    }
  }
  /**
   * Loads the previous track in the TrackList and stops playback.
   */
  skipBackward() {
    const track = this._trackList.moveCurrentBack();
    if (track) {
      this.audioSource().load(track.buffer);
    }
  }
  /**
   * Mutes volume
   */
  mute() {
    this.volume().mute();
  }
  /**
   * Unmutes volume
   */
  unmute() {
    this.volume().unmute();
  }
  /**
   * Sets volume to `percent`. Value must be 0 to 1.
   *
   * @param {number} percent
   */
  setVolume(percent: number) {
    this.volume().set(percent);
  }
  /**
   * Sets volume to max volume
   */
  maxVolume() {
    this.volume().set(1);
  }
}

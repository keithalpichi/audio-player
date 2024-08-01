/**
 * The state of the audio source
 *
 * @typedef {AudioSourceState}
 */
export type AudioSourceState =
  | "PLAYING"
  | "PAUSED"
  | "STOPPED"
  | "PAUSING"
  | "STOPPING"
  | "SEEKING"
  | "SEEKINGTHENPLAY";

/**
 * This represents the audio source being manipulated by the audio player
 *
 * @export
 * @class AudioSource
 * @typedef {AudioSource}
 */
export default class AudioSource {
  /**
   * The AudioContext
   *
   * @private
   * @type {AudioContext}
   */
  private _context: AudioContext;
  /**
   * The source of the audio. Playback on the source cannot
   * be accomplish. It needs to be put into an AudioBufferSourceNode
   *
   * @private
   * @type {AudioBuffer}
   */
  private _buffer: AudioBuffer;
  /**
   * The Web Audio AudioBufferSourceNode that contains
   * APIs to play & stop the audio.
   *
   * @private
   * @type {AudioBufferSourceNode}
   */
  private _bufferSourceNode: AudioBufferSourceNode;
  /**
   * The Web Audio GainNode the AudioBufferSourceNode will
   * connect to in order to control volume.
   *
   * @private
   * @type {GainNode}
   */
  private _gainNode: GainNode;
  /**
   * The state of the audio source.
   *
   * @public
   * @type {AudioSourceState}
   */
  public state: AudioSourceState = "STOPPED";

  /**
   * Event callback that provides the state of the audio source
   *
   * @private
   * @type {((state: AudioSourceState) => void) | null}
   */
  private onStateChanged: ((state: AudioSourceState) => void) | null = null;
  /**
   * The amount of time audio has been played
   *
   * @private
   * @type {number}
   */
  private _elapsed: number = 0;
  /**
   * The time on the AudioContext when the audio started to play
   * from the start or a recent pause. This property is important
   * to calculate total and percent elapsed time.
   *
   * @private
   * @type {number}
   */
  private _startedAt: number = 0;
  /**
   * The duration of the audio buffer
   *
   * @readonly
   * @type {number}
   */
  get duration(): number {
    return this._buffer.duration;
  }
  /**
   *
   * @constructor
   * @param {{
   *     context: AudioContext;
   *     buffer: AudioBuffer;
   *     gainNode: GainNode;
   *   }} param0
   * @param {AudioContext} param0.context
   * @param {AudioBuffer} param0.buffer
   * @param {GainNode} param0.gainNode
   */
  constructor({
    context,
    buffer,
    gainNode,
    onStateChanged,
  }: {
    context: AudioContext;
    buffer: AudioBuffer;
    gainNode: GainNode;
    onStateChanged?: (state: AudioSourceState) => void;
  }) {
    this._buffer = buffer;
    this._context = context;
    this._gainNode = gainNode;
    this._bufferSourceNode = this.createBufferSourceNode(buffer);
    this.onStateChanged = onStateChanged || null;
  }

  /**
   * Creates an AudioBufferSourceNode with the AudioContext & AudioBuffer.
   *
   * @private
   * @param {AudioBuffer} buffer
   * @returns {AudioBufferSourceNode}
   */
  private createBufferSourceNode(buffer: AudioBuffer): AudioBufferSourceNode {
    return new AudioBufferSourceNode(this._context, {
      buffer,
    });
  }

  /**
   * Sets the current state
   *
   * @private
   * @param {AudioSourceState} state
   */
  private setCurrentState(state: AudioSourceState) {
    this.state = state;
    this.emitStateChange();
  }

  /**
   * Emits an event when the state changes
   *
   * @private
   */
  private emitStateChange() {
    this.onStateChanged && this.onStateChanged(this.state);
  }

  /**
   * Event callback invoked when the audio ends playback.
   *
   * @private
   */
  private ended() {
    switch (this.state) {
      case "SEEKING":
        this.setCurrentState("PAUSED");
        break;
      case "SEEKINGTHENPLAY":
        this.play();
        break;
      case "PAUSING":
        this.setCurrentState("PAUSED");
        break;
      case "STOPPING":
        this.resetPlaybackState();
        break;
      case "PLAYING":
        this.resetPlaybackState();
        break;
      case undefined:
        break;
    }
  }

  private resetPlaybackState() {
    this.setCurrentState("STOPPED");
    this._startedAt = 0;
    this._elapsed = 0;
  }

  get currentTime(): number {
    const { duration } = this._buffer;
    if (this._elapsed > duration) {
      // AudioContext time has surpassed the duration of the audio.
      // So the elapsed time is the duration
      return duration;
    }
    return this._elapsed;
  }

  /**
   * Loads the AudioBuffer into a AudioBufferSourceNode,
   * connects the gain & output nodes, and adds an event listener
   * on the "ended" event.
   *
   * @param {AudioBuffer} buffer
   * @returns {AudioBufferSourceNode}
   */
  load(buffer: AudioBuffer): AudioBufferSourceNode {
    this._buffer = buffer;
    this._bufferSourceNode = this.createBufferSourceNode(buffer);
    this._bufferSourceNode
      .connect(this._gainNode)
      .connect(this._context.destination);
    this._bufferSourceNode.addEventListener("ended", this.ended.bind(this));
    return this._bufferSourceNode;
  }

  /** Plays the audio source */
  play() {
    if (this.state === "PLAYING") {
      // we're already playing
      return;
    }
    // create a new audio buffer source node with the current buffer
    const bufferSourceNode = this.load(this._buffer);
    // Use the AudioContext current time to track when the audio starts playing
    this._startedAt = this._context.currentTime;
    // start playing at the playhead
    bufferSourceNode.start(0, this._elapsed);
    this.setCurrentState("PLAYING");
  }

  /** Resumes the audio source */
  resume() {
    this.play();
  }

  /** Pauses the audio source */
  pause() {
    if (
      this.state === "PAUSED" ||
      this.state === "PAUSING" ||
      this.state === "STOPPING" ||
      this.state === "STOPPED"
    ) {
      return;
    }
    this.setCurrentState("PAUSING");
    // Get the current time on the AudioContext
    // to mark the time we're pausing
    const pausedAt = this._context.currentTime;
    // stop the buffer source from playing audio
    this._bufferSourceNode.stop();
    // Calculate elapsed time from when the audio was last started.
    // The last time audio was played could have been from
    // the start or a recent pause.
    const elapsed = pausedAt - this._startedAt;
    // Adjust the total time played by incrementing it by the elapsed time.
    this._elapsed += elapsed;
  }

  /** Stops the audio source */
  stop() {
    if (this.state === "STOPPED" || this.state === "STOPPING") {
      return;
    }
    this.setCurrentState("STOPPING");
    this._elapsed = 0;
    // stop the buffer source from playing audio
    this._bufferSourceNode.stop();
  }

  /**
   * Seeks the playhead to a new time and
   * pauses playback.
   *
   * @param {number} to
   */
  seek(to: number) {
    let timeToSeekTo = to;
    if (to > this._buffer.duration) {
      timeToSeekTo = this._buffer.duration;
    } else if (to < 0) {
      timeToSeekTo = 0;
    }
    this.setCurrentState("SEEKING");
    this._elapsed = timeToSeekTo;
    this._context.destination.disconnect();
    this._bufferSourceNode.stop();
  }

  /**
   * Seeks the playhead to a new time and
   * immediately resumes playback.
   *
   * @param {number} to
   */
  seekAndPlay(to: number) {
    let timeToSeekTo = to;
    if (to > this._buffer.duration) {
      timeToSeekTo = this._buffer.duration;
    } else if (to < 0) {
      timeToSeekTo = 0;
    }
    this.setCurrentState("SEEKINGTHENPLAY");
    this._elapsed = timeToSeekTo;
    this._context.destination.disconnect();
    this._bufferSourceNode.stop();
  }
}

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
   * Description placeholder
   *
   * @private
   * @type {AudioContext}
   */
  private _context: AudioContext;
  /**
   * Description placeholder
   *
   * @private
   * @type {AudioBuffer}
   */
  private _buffer: AudioBuffer;
  /**
   * Description placeholder
   *
   * @private
   * @type {AudioBufferSourceNode}
   */
  private _bufferSourceNode: AudioBufferSourceNode;
  /**
   * Description placeholder
   *
   * @private
   * @type {GainNode}
   */
  private _gainNode: GainNode;
  /**
   * Description placeholder
   *
   * @private
   * @type {number}
   */
  private _playHead: number = 0;
  /**
   * Description placeholder
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
   * Description placeholder
   *
   * @readonly
   * @type {number}
   */
  get duration(): number {
    return this._buffer.duration;
  }
  /**
   * Creates an instance of AudioSource.
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
   * Description placeholder
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
   * Description placeholder
   *
   * @private
   * @param {AudioSourceState} state
   */
  private setCurrentState(state: AudioSourceState) {
    this.state = state;
    this.emitStateChange();
  }

  private emitStateChange() {
    this.onStateChanged && this.onStateChanged(this.state);
  }

  /**
   * Description placeholder
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
        this.setCurrentState("STOPPED");
        break;
      case "PLAYING":
        this.setCurrentState("STOPPED");
        break;
      case undefined:
        break;
    }
  }

  /**
   * Description placeholder
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

  /** Description placeholder */
  play() {
    if (this.state === "PLAYING") {
      // we're already playing
      return;
    }
    // create a new audio buffer source node with the current buffer
    const bufferSourceNode = this.load(this._buffer);
    // start playing at the playhead
    bufferSourceNode.start(0, this._playHead);
    this.setCurrentState("PLAYING");
  }

  /** Description placeholder */
  resume() {
    this.play();
  }

  /** Description placeholder */
  pause() {
    if (this.state === "PAUSED" || this.state === "STOPPED") {
      return;
    }
    this.setCurrentState("PAUSING");
    this._playHead = this._context.currentTime;
    // stop the buffer source from playing audio
    this._bufferSourceNode.stop();
  }

  /** Description placeholder */
  stop() {
    if (this.state === "STOPPED") {
      return;
    }
    this.setCurrentState("STOPPING");
    this._playHead = 0;
    // stop the buffer source from playing audio
    this._bufferSourceNode.stop();
  }

  /**
   * Description placeholder
   *
   * @param {number} to
   */
  seek(to: number) {
    this.setCurrentState("SEEKING");
    this._playHead = to;
    this._context.destination.disconnect();
    this._bufferSourceNode.stop();
  }

  /**
   * Description placeholder
   *
   * @param {number} to
   */
  seekAndPlay(to: number) {
    this.setCurrentState("SEEKINGTHENPLAY");
    this._playHead = to;
    this._context.destination.disconnect();
    this._bufferSourceNode.stop();
  }
}

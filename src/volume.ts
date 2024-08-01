/**
 * This represents the volume of the audio player
 *
 * @export
 * @class Volume
 * @typedef {Volume}
 */
export default class Volume {
  /**
   * An error for invalid volume percentages
   *
   * @static
   * @type {*}
   */
  static InvalidVolumePercentage = new Error(
    "Invalid volume percentage. Provide 0 up to 1.",
  );
  /**
   * The mininum volume value
   *
   * @static
   * @type {number}
   */
  static MIN = 0;
  /**
   * The maximum volume value
   *
   * @static
   * @type {number}
   */
  static MAX = 1;
  /**
   * The Web Audio class that represents volume or gain
   *
   * @type {GainNode}
   */
  gainNode: GainNode;
  /**
   * Whether the volume is muted
   *
   * @type {boolean}
   */
  isMuted: boolean;
  /**
   * The last known volume value
   *
   * @private
   * @type {number}
   */
  private lastKnownVolume: number;
  /**
   * Creates an instance of Volume.
   *
   * @constructor
   * @param {{ context: AudioContext }} param0
   * @param {AudioContext} param0.context
   */
  constructor({ context }: { context: AudioContext }) {
    // set the initial gain to 100%
    this.gainNode = new GainNode(context, { gain: 1 });
    this.lastKnownVolume = this.gainNode.gain.value;
    this.isMuted = false;
  }

  /**
   * Get the current volume
   *
   * @readonly
   * @type {number}
   */
  get currentVolume(): number {
    return this.gainNode.gain.value;
  }

  /**
   * Returns true if the current volume is set to the max value
   *
   * @readonly
   * @type {boolean}
   */
  get atMaxVolume(): boolean {
    return this.currentVolume === Volume.MAX;
  }

  /**
   * Toggles mute
   */
  toggleMute(): void {
    if (this.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
  }

  /**
   * Mutes volume
   */
  mute(): void {
    if (this.isMuted) {
      // we're muted, return
      return;
    }
    // before changing the volume,
    // take note of the current volume
    // so we can set it to the last known volume
    // when we unmute
    this.lastKnownVolume = this.gainNode.gain.value;
    // mute it now
    this.gainNode.gain.value = Volume.MIN;
    this.isMuted = true;
  }

  /**
   * Unmutes volume
   */
  unmute(): void {
    if (!this.isMuted) {
      // we have volume, return
      return;
    }
    this.isMuted = false;
    // update the volume to the last known volume
    this.gainNode.gain.value = this.lastKnownVolume;
  }

  /**
   * Sets the volume to a percentage
   *
   * @param {number} percent
   */
  set(percent: number): void {
    if (!this.isMuted) {
      // we're not muted, the last known value should
      // match the new value
      this.lastKnownVolume = percent;
      this.gainNode.gain.value = percent;
    } else {
      // we're muted, just keep track of the new volume;
      this.lastKnownVolume = percent;
    }
  }

  /**
   * Sets the volume to max value
   */
  max(): void {
    this.set(Volume.MAX);
  }
}

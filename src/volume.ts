export default class Volume {
  static InvalidVolumePercentage = new Error(
    "Invalid volume percentage. Provide 0 up to 1.",
  );
  static MIN = 0;
  static MAX = 1;
  gainNode: GainNode;
  isMuted: boolean;
  private lastKnownVolume: number;
  constructor({ context }: { context: AudioContext }) {
    // set the initial gain to 100%
    this.gainNode = new GainNode(context, { gain: 1 });
    this.lastKnownVolume = this.gainNode.gain.value;
    this.isMuted = false;
  }

  get currentVolume(): number {
    return this.gainNode.gain.value;
  }

  get atMaxVolume(): boolean {
    return this.currentVolume === Volume.MAX;
  }

  toggleMute(): void {
    if (this.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
  }

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

  unmute(): void {
    if (!this.isMuted) {
      // we have volume, return
      return;
    }
    this.isMuted = false;
    // update the volume to the last known volume
    this.gainNode.gain.value = this.lastKnownVolume;
  }

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

  max(): void {
    this.set(Volume.MAX);
  }
}

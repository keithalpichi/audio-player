export default class Volume {
	static InvalidVolumePercentage = new Error('Invalid volume percentage. Provide 0 up to 1.')
	static MIN = 0;
	static MAX = 1;
	gainNode: GainNode
	private lastKnownVolume: number 
	constructor({ context }: { context: AudioContext }) {
		this.gainNode = new GainNode(context);
		this.lastKnownVolume = this.gainNode.gain.value;
	}

	get currentVolume(): number {
		return this.gainNode.gain.value;
	}

	get isMuted(): boolean {
		return this.currentVolume === Volume.MIN;
	}

	get atMaxVolume(): boolean {
		return this.currentVolume === Volume.MAX;
	}

	private _set(percent: number): void {
		if (percent < Volume.MIN || percent > Volume.MAX) {
			throw Volume.InvalidVolumePercentage
		}
		this.gainNode.gain.value = percent;
	}

	toggleMute(): void {
		if (this.isMuted) {
			this.unmute()
		} else {
			this.mute()
		}
	}

	mute(): void {
		if (this.currentVolume !== Volume.MIN) {
			this.lastKnownVolume = this.currentVolume;
			this._set(Volume.MIN);
		}
	}

	unmute(): void {
		if (this.currentVolume === Volume.MIN) {
			this._set(this.lastKnownVolume);
		}
	}

	set(percent: number): void {
		if (percent < Volume.MIN || percent > Volume.MAX) {
			throw Volume.InvalidVolumePercentage
		}
		this.lastKnownVolume = this.currentVolume;
		this._set(percent);
	}

	max(): void {
		this.lastKnownVolume = this.currentVolume;
		this._set(Volume.MAX);
	}
}